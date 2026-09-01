/** Client-side preparation of an uploaded profile photo. */

/** Edge of the square sent to the server, in pixels. The server re-encodes to 256px. */
const UPLOAD_EDGE_PX = 512;

/** Refused before we bother decoding — the server caps the payload too. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class ImageReadError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageReadError('That file could not be read as an image.'));
    };
    image.src = url;
  });
}

/**
 * Centre-crops `file` to a square and returns it as a JPEG data URL.
 *
 * Downscaling here keeps the upload to tens of kilobytes instead of megabytes,
 * and drawing through a canvas discards EXIF as a side effect. Neither is a
 * security control — the server re-encodes and re-validates whatever arrives.
 */
export async function toSquareDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageReadError('Choose a JPEG, PNG or WebP image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageReadError('That image is too large. Choose one under 8 MB.');
  }

  const image = await loadImage(file);
  const edge = Math.min(image.naturalWidth, image.naturalHeight);
  if (edge === 0) {
    throw new ImageReadError('That image appears to be empty.');
  }

  const size = Math.min(edge, UPLOAD_EDGE_PX);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageReadError('Your browser could not process that image.');
  }
  context.drawImage(
    image,
    (image.naturalWidth - edge) / 2,
    (image.naturalHeight - edge) / 2,
    edge,
    edge,
    0,
    0,
    size,
    size
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

/** A photo scaled to fit within `maxEdge`, alongside its final pixel size. */
export interface ContainedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Scales `file` so its longer edge is at most `maxEdge`, preserving aspect
 * ratio, and returns it as a JPEG data URL. Unlike `toSquareDataUrl`, nothing
 * is cropped — this is for content photos (e.g. a chat attachment), not an
 * icon-sized avatar.
 */
export async function toContainedDataUrl(
  file: File,
  maxEdge: number
): Promise<ContainedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageReadError('Choose a JPEG, PNG or WebP image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageReadError('That image is too large. Choose one under 8 MB.');
  }

  const image = await loadImage(file);
  const { naturalWidth, naturalHeight } = image;
  if (naturalWidth === 0 || naturalHeight === 0) {
    throw new ImageReadError('That image appears to be empty.');
  }

  const scale = Math.min(1, maxEdge / Math.max(naturalWidth, naturalHeight));
  const width = Math.round(naturalWidth * scale);
  const height = Math.round(naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageReadError('Your browser could not process that image.');
  }
  context.drawImage(image, 0, 0, width, height);

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.9), width, height };
}
