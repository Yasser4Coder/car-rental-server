import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { getUploadsRoot } from '../utils/paths.js';

/** Allowed browser MIME types (SVG excluded — XSS risk). */
export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 8;
export const MAX_OUTPUT_WIDTH = 1920;
export const JPEG_QUALITY = 82;

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const mime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    return cb(new AppError('Only JPEG, PNG, or WebP images are allowed (no SVG/GIF)', 400));
  }

  const original = String(file.originalname || '').toLowerCase();
  if (original.endsWith('.svg') || original.endsWith('.gif') || original.endsWith('.html')) {
    return cb(new AppError('Unsupported or unsafe file extension', 400));
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: MAX_FILES_PER_REQUEST,
    fields: 5,
  },
});

/** Lazy-load sharp so a missing native binary on Hostinger does not crash API boot. */
async function getSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch (err) {
    console.error('[upload] sharp failed to load:', err.message);
    throw new AppError(
      'Image processing is unavailable on this server. Install sharp or contact support.',
      503,
    );
  }
}

/**
 * Decode, strip metadata, resize, and write a compressed JPEG under uploads/cars/{carId}/.
 */
export async function processAndSaveCarImage(buffer, carId) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError('Empty image file', 400);
  }

  if (buffer.length < 64) {
    throw new AppError('File is too small to be a valid image', 400);
  }

  const sharp = await getSharp();

  let meta;
  try {
    meta = await sharp(buffer, {
      failOn: 'error',
      animated: false,
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .metadata();
  } catch {
    throw new AppError('Invalid or corrupted image file', 400);
  }

  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new AppError('Only JPEG, PNG, or WebP images are allowed', 400);
  }

  if (!meta.width || !meta.height || meta.width < 32 || meta.height < 32) {
    throw new AppError('Image dimensions are too small', 400);
  }

  const uploadsRoot = getUploadsRoot();
  const carDir = path.join(uploadsRoot, 'cars', String(carId));
  await fs.mkdir(carDir, { recursive: true });

  const filename = `${crypto.randomUUID()}.jpg`;
  const absolute = path.join(carDir, filename);

  if (!absolute.startsWith(carDir)) {
    throw new AppError('Invalid upload path', 400);
  }

  try {
    await sharp(buffer, { failOn: 'error', animated: false, limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: MAX_OUTPUT_WIDTH,
        height: MAX_OUTPUT_WIDTH,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: JPEG_QUALITY,
        mozjpeg: true,
        chromaSubsampling: '4:2:0',
      })
      .toFile(absolute);
  } catch {
    throw new AppError('Could not process image', 400);
  }

  return {
    publicPath: `/uploads/cars/${carId}/${filename}`,
    absolutePath: absolute,
    bytes: (await fs.stat(absolute)).size,
  };
}

export function publicUploadPath(filename) {
  return `/uploads/${filename}`;
}

const PROTECTED_PATHS = new Set(['/uploads/fleet/pending.svg']);

function normalizePublicUploadPath(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') return '';
  if (publicPath.startsWith('/uploads/')) return publicPath.split('?')[0];
  try {
    const pathName = publicPath.startsWith('http') ? new URL(publicPath).pathname : publicPath;
    if (pathName.startsWith('/api/uploads/')) return pathName.slice(4).split('?')[0];
    if (pathName.startsWith('/uploads/')) return pathName.split('?')[0];
  } catch {
    /* ignore */
  }
  const match = publicPath.match(/\/uploads\/[^?\s]+/);
  return match ? match[0] : '';
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function safeUnlinkUpload(publicPath) {
  const normalized = normalizePublicUploadPath(publicPath);
  if (!normalized) return false;
  if (PROTECTED_PATHS.has(normalized)) return false;
  if (!normalized.startsWith('/uploads/cars/') && !normalized.startsWith('/uploads/fleet/')) {
    return false;
  }

  const uploadsRoot = path.resolve(getUploadsRoot());
  const absolute = path.resolve(uploadsRoot, normalized.replace(/^\/uploads\/?/, ''));
  if (!isPathInside(uploadsRoot, absolute)) return false;

  try {
    const stat = await fs.stat(absolute);
    if (!stat.isFile()) return false;
    await fs.unlink(absolute);
    return true;
  } catch {
    return false;
  }
}

export async function removeCarMediaFiles(car) {
  if (!car) return { removed: 0 };

  const paths = new Set();
  const image = normalizePublicUploadPath(car.image);
  if (image) paths.add(image);

  const gallery = Array.isArray(car.gallery) ? car.gallery : [];
  for (const item of gallery) {
    const p = normalizePublicUploadPath(item);
    if (p) paths.add(p);
  }

  let removed = 0;
  for (const p of paths) {
    if (await safeUnlinkUpload(p)) removed += 1;
  }

  const id = String(car.id ?? '');
  if (/^\d+$/.test(id)) {
    const carDir = path.resolve(getUploadsRoot(), 'cars', id);
    const carsRoot = path.resolve(getUploadsRoot(), 'cars');
    if (carDir === path.join(carsRoot, id) || isPathInside(carsRoot, carDir)) {
      try {
        await fs.rm(carDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }

  return { removed };
}
