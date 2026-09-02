const UPLOAD_EDGE_PX = 512;

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

export interface ContainedImage {
  dataUrl: string;
  width: number;
  height: number;
}

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
