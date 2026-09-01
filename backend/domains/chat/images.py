"""Server-side handling of photos attached to chat messages.

Sibling to `domains.iam.images` (profile photos): same decode/validate/
re-encode discipline, but a chat photo keeps its aspect ratio instead of being
cropped to a square icon, so it is scaled rather than fit.
"""

import base64
import binascii
import io

from django.core.exceptions import ValidationError
from PIL import Image, ImageOps, UnidentifiedImageError

# Longer edge of the stored photo, in pixels. Large enough to fill a docked
# chat window's message list at full width, small enough to keep the payload
# a few hundred kilobytes rather than a multi-megapixel camera original.
MAX_PHOTO_EDGE_PX = 1600

# Cap on the base64 payload. Larger than the avatar's cap since these aren't
# downscaled to icon size before re-encoding.
MAX_ENCODED_LENGTH = 6 * 1024 * 1024

MAX_SOURCE_PIXELS = 50_000_000

ACCEPTED_FORMATS = {"JPEG", "PNG", "WEBP"}

STORED_CONTENT_TYPE = "image/jpeg"


def decode_chat_photo(image_base64: str) -> tuple[bytes, int, int]:
    """Decode, validate and normalise an uploaded chat photo.

    Returns `(jpeg_bytes, width, height)`. Raises `ValidationError` with a
    user-facing message for anything that isn't a usable image.
    """
    payload = image_base64.strip()
    if payload.startswith("data:"):
        _, _, payload = payload.partition(",")

    if not payload:
        raise ValidationError("No image was supplied.")
    if len(payload) > MAX_ENCODED_LENGTH:
        raise ValidationError("That photo is too large. Please choose one under 4 MB.")

    try:
        raw = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValidationError("That photo could not be read.") from exc

    try:
        with Image.open(io.BytesIO(raw)) as probe:
            image_format = probe.format
            width, height = probe.size
            probe.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError("That file is not an image we can read.") from exc

    if image_format not in ACCEPTED_FORMATS:
        raise ValidationError("Photos must be a JPEG, PNG or WebP image.")
    if width * height > MAX_SOURCE_PIXELS:
        raise ValidationError("That image has too many pixels. Please choose a smaller one.")

    try:
        with Image.open(io.BytesIO(raw)) as image:
            oriented = ImageOps.exif_transpose(image) or image
            oriented = oriented.convert("RGB")
            edge = max(oriented.width, oriented.height)
            if edge > MAX_PHOTO_EDGE_PX:
                scale = MAX_PHOTO_EDGE_PX / edge
                oriented = oriented.resize(
                    (max(1, round(oriented.width * scale)), max(1, round(oriented.height * scale))),
                    resample=Image.Resampling.LANCZOS,
                )
            buffer = io.BytesIO()
            oriented.save(buffer, format="JPEG", quality=85, optimize=True)
    except (OSError, ValueError) as exc:
        raise ValidationError("That photo could not be processed.") from exc

    return buffer.getvalue(), oriented.width, oriented.height
