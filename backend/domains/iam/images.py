"""Server-side handling of user-supplied images (profile photos).

Everything a user uploads is decoded, checked and re-encoded here before it is
stored. Never trust a client-declared content type or the bytes as sent: the
re-encode is what guarantees the stored object really is an image, and it drops
EXIF along the way — camera photos routinely carry GPS coordinates, which would
otherwise be personal data we neither need nor asked for (A.5.34, A.8.11).
"""

import base64
import binascii
import io

from django.core.exceptions import ValidationError
from PIL import Image, ImageOps, UnidentifiedImageError

# Square edge of the stored avatar, in pixels. Large enough for a retina
# 96px display, small enough that the encoded image stays a few kilobytes.
AVATAR_EDGE_PX = 256

# Cap on the base64 payload. Django's own DATA_UPLOAD_MAX_MEMORY_SIZE (2.5 MB)
# would reject anything larger with an unhelpful error, so refuse it first with
# a message the user can act on. The browser downscales before uploading, so a
# well-behaved client sends ~50 KB.
MAX_ENCODED_LENGTH = 2 * 1024 * 1024

# Refuse absurd pixel dimensions outright rather than letting Pillow allocate
# for them — a small file can still decode to a huge bitmap.
MAX_SOURCE_PIXELS = 50_000_000

ACCEPTED_FORMATS = {"JPEG", "PNG", "WEBP"}

STORED_CONTENT_TYPE = "image/jpeg"


def decode_avatar(image_base64: str) -> bytes:
    """Decode, validate and normalise an uploaded avatar to a square JPEG.

    Raises `ValidationError` with a user-facing message for anything that isn't
    a usable image.
    """
    payload = image_base64.strip()
    # Browsers hand out data URLs from canvas.toDataURL(); accept either form.
    if payload.startswith("data:"):
        _, _, payload = payload.partition(",")

    if not payload:
        raise ValidationError("No image was supplied.")
    if len(payload) > MAX_ENCODED_LENGTH:
        raise ValidationError("That image is too large. Please choose one under 1 MB.")

    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValidationError("That image could not be read.") from exc

    try:
        with Image.open(io.BytesIO(raw)) as probe:
            image_format = probe.format
            width, height = probe.size
            probe.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError("That file is not an image we can read.") from exc

    if image_format not in ACCEPTED_FORMATS:
        raise ValidationError("Profile photos must be a JPEG, PNG or WebP image.")
    if width * height > MAX_SOURCE_PIXELS:
        raise ValidationError("That image has too many pixels. Please choose a smaller one.")

    # `verify()` leaves the file object unusable, so reopen to do the real work.
    try:
        with Image.open(io.BytesIO(raw)) as image:
            # Honour the EXIF orientation flag before the metadata is dropped,
            # otherwise phone photos come out rotated.
            oriented = ImageOps.exif_transpose(image) or image
            square = ImageOps.fit(
                oriented.convert("RGB"),
                (AVATAR_EDGE_PX, AVATAR_EDGE_PX),
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            buffer = io.BytesIO()
            square.save(buffer, format="JPEG", quality=85, optimize=True)
    except (OSError, ValueError) as exc:
        raise ValidationError("That image could not be processed.") from exc

    return buffer.getvalue()


def to_data_url(image: bytes | memoryview, content_type: str) -> str:
    """The stored bytes as a `data:` URL an <img> tag can render directly."""
    encoded = base64.b64encode(bytes(image)).decode("ascii")
    return f"data:{content_type};base64,{encoded}"
