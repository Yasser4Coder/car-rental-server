import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import { AppError } from '../utils/AppError.js';
import { getUploadsRoot } from '../utils/paths.js';

/** Allowed browser MIME types (SVG excluded — XSS risk). */
export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/** Magic-byte signatures sharp/format must match after decode. */
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB before compress
export const MAX_FILES_PER_REQUEST = 8;
export const MAX_OUTPUT_WIDTH = 1920;
export const JPEG_QUALITY = 82;

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const mime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    return cb(
      new AppError('Only JPEG, PNG, or WebP images are allowed (no SVG/GIF)', 400),
    );
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

/**
 * Decode, strip metadata, resize, and write a compressed JPEG under uploads/cars/{carId}/.
 * Returns public path `/uploads/cars/{carId}/{uuid}.jpg`.
 */
export async function processAndSaveCarImage(buffer, carId) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError('Empty image file', 400);
  }

  // Reject tiny decoys / polyglot payloads that aren't real images
  if (buffer.length < 64) {
    throw new AppError('File is too small to be a valid image', 400);
  }

  let pipeline;
  let meta;
  try {
    pipeline = sharp(buffer, {
      failOn: 'error',
      animated: false,
      limitInputPixels: 40_000_000,
    }).rotate(); // honor EXIF orientation, then strip below
    meta = await pipeline.metadata();
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

  // Path safety: ensure we never write outside uploads/cars/{id}
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
  // Legacy helper — prefer processAndSaveCarImage return value
  return `/uploads/${filename}`;
}

/** Safely delete a file if it lives under uploads/cars/ */
export async function safeUnlinkUpload(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') return;
  if (!publicPath.startsWith('/uploads/cars/')) return;

  const uploadsRoot = getUploadsRoot();
  const relative = publicPath.replace(/^\/uploads\/?/, '');
  const absolute = path.resolve(uploadsRoot, relative);
  if (!absolute.startsWith(path.resolve(uploadsRoot, 'cars'))) return;

  try {
    await fs.unlink(absolute);
  } catch {
    // ignore missing files
  }
}
