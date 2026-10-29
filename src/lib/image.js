/** Accept iPhone HEIC, Android/Samsung JPEG/WebP, and computer PNG/JPEG/WebP/GIF/BMP. */
export const PHOTO_ACCEPT = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'image/avif',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/tiff',
  'image/x-tiff',
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.hif',
  '.avif',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  'image/*',
].join(',');

const HEIC_NAME = /\.(heic|heif|hif)$/i;
const IMAGE_NAME = /\.(jpe?g|jfif|pjpeg|png|webp|gif|bmp|heic|heif|hif|avif|tiff?)$/i;

export function isHeicPhoto(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '');
  return type.includes('heic') || type.includes('heif') || HEIC_NAME.test(name);
}

export function looksLikePhoto(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  if (!type || type === 'application/octet-stream') return IMAGE_NAME.test(file.name || '');
  return false;
}

function safePhotoName(name) {
  const stem = String(name || 'product-photo')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${stem || 'product-photo'}.jpg`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read this photo.'));
    reader.readAsDataURL(blob);
  });
}

async function blobToBitmap(blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      try {
        return await createImageBitmap(blob);
      } catch {
        /* fall through to Image() */
      }
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not open this photo.'));
    };
    img.src = url;
  });
}

async function heicToJpegBlob(file) {
  const mod = await import('heic2any');
  const convert = mod.default || mod;
  const out = await convert({ blob: file, toType: 'image/jpeg', quality: 0.88 });
  return Array.isArray(out) ? out[0] : out;
}

async function decodePhoto(file) {
  try {
    return await blobToBitmap(file);
  } catch (first) {
    if (!isHeicPhoto(file)) throw first;
    try {
      return await blobToBitmap(await heicToJpegBlob(file));
    } catch {
      throw new Error('This iPhone photo could not be converted. Take a new photo here, or in iPhone Camera set Formats to Most Compatible.');
    }
  }
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not save this photo.'));
    }, 'image/jpeg', quality);
  });
}

/**
 * Convert any phone/computer photo into a web-safe JPEG under ~900 KB.
 * Fixes iPhone HEIC and typical Android/Samsung camera sizes.
 */
export async function processPhoto(file, { maxEdge = 1400, maxBytes = 900000 } = {}) {
  if (!file) throw new Error('Choose a photo first.');
  if (!looksLikePhoto(file)) throw new Error('Please choose a photo (JPG, PNG, WEBP, HEIC or similar).');

  const source = await decodePhoto(file);
  const width = source.width || source.naturalWidth || 0;
  const height = source.height || source.naturalHeight || 0;
  if (!width || !height) throw new Error('This photo could not be read.');

  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#0b1f18';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (typeof source.close === 'function') source.close();

  let quality = 0.84;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob.size > maxBytes && quality > 0.5) {
    quality -= 0.12;
    blob = await canvasToJpegBlob(canvas, quality);
  }

  return {
    blob,
    dataUrl: await blobToDataUrl(blob),
    mime: 'image/jpeg',
    name: safePhotoName(file.name),
  };
}
