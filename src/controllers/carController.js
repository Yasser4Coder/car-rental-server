import { Op } from 'sequelize';
import { Car } from '../models/index.js';
import {
  CAR_FEATURED_ATTRIBUTES,
  CAR_LIST_ATTRIBUTES,
  listCars,
} from '../services/carFilter.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { processAndSaveCarImage, removeCarMediaFiles, safeUnlinkUpload } from '../middleware/upload.js';
import { invalidateCache } from '../utils/cache.js';
import { resolveMediaUrl, withCarMedia, withCarsMedia } from '../utils/media.js';
import { ensureUniqueCarSlug } from '../utils/carSlug.js';

const PENDING_IMAGE = '/uploads/fleet/pending.svg';

function bustCarCaches() {
  invalidateCache('cars:');
  invalidateCache('featured:');
}

function toStoragePath(src) {
  if (!src || typeof src !== 'string') return '';
  if (src.startsWith('/uploads/')) return src;
  try {
    const pathName = src.startsWith('http') ? new URL(src).pathname : src;
    if (pathName.startsWith('/api/uploads/')) return pathName.slice(4);
    if (pathName.startsWith('/uploads/')) return pathName;
  } catch {
    /* ignore */
  }
  const match = src.match(/\/uploads\/.+$/);
  return match ? match[0] : src;
}

export const getCars = asyncHandler(async (req, res) => {
  const result = await listCars({
    ...req.query,
    attributes: CAR_LIST_ATTRIBUTES,
  });
  res.json(result);
});

export const getFeaturedCars = asyncHandler(async (req, res) => {
  const result = await listCars({
    featured: true,
    sort: 'featured',
    limit: Number(req.query.limit) || 12,
    page: 1,
    attributes: CAR_FEATURED_ATTRIBUTES,
  });
  res.json(result);
});

export const getCarBySlug = asyncHandler(async (req, res) => {
  const key = String(req.params.slugOrId || '').trim();
  if (!key) throw new AppError('Car not found', 404);

  let car = await Car.findOne({
    where: { slug: key, isActive: true },
  });

  // Legacy numeric URLs still resolve, then clients should use the returned slug
  if (!car && /^\d+$/.test(key)) {
    car = await Car.findOne({
      where: { id: Number(key), isActive: true },
    });
  }

  if (!car) throw new AppError('Car not found', 404);

  const related = await Car.findAll({
    attributes: CAR_LIST_ATTRIBUTES,
    where: { type: car.type, isActive: true, id: { [Op.ne]: car.id } },
    order: [
      ['featured', 'DESC'],
      ['price', 'ASC'],
    ],
    limit: 3,
  });

  res.json({ data: withCarMedia(car), related: withCarsMedia(related) });
});

export const adminListCars = asyncHandler(async (req, res) => {
  const result = await listCars({
    ...req.query,
    includeInactive: true,
    attributes: CAR_LIST_ATTRIBUTES,
  });
  res.json(result);
});

export const adminGetCar = asyncHandler(async (req, res) => {
  const car = await Car.findByPk(req.params.id);
  if (!car) throw new AppError('Car not found', 404);
  res.json({ data: withCarMedia(car) });
});

export const adminCreateCar = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  payload.slug = await ensureUniqueCarSlug(payload);
  const car = await Car.create(payload);
  bustCarCaches();
  res.status(201).json({ data: withCarMedia(car) });
});

export const adminUpdateCar = asyncHandler(async (req, res) => {
  const car = await Car.findByPk(req.params.id);
  if (!car) throw new AppError('Car not found', 404);

  const payload = { ...req.body };
  if (payload.name != null || payload.slug != null || payload.brand != null || payload.model != null) {
    payload.slug = await ensureUniqueCarSlug(
      {
        name: payload.name ?? car.name,
        brand: payload.brand ?? car.brand,
        model: payload.model ?? car.model,
        year: payload.year ?? car.year,
        slug: payload.slug ?? car.slug,
      },
      car.id,
    );
  }

  await car.update(payload);
  bustCarCaches();
  res.json({ data: withCarMedia(car) });
});

export const adminDeleteCar = asyncHandler(async (req, res) => {
  const car = await Car.findByPk(req.params.id);
  if (!car) throw new AppError('Car not found', 404);

  const bookingCount = await car.countBookings();
  if (bookingCount > 0) {
    await car.update({ isActive: false });
    bustCarCaches();
    return res.json({ data: withCarMedia(car), message: 'Car deactivated (has bookings)' });
  }

  // Hard delete: remove DB row and wipe photos from disk
  const snapshot = car.toJSON();
  await car.destroy();
  const { removed } = await removeCarMediaFiles(snapshot);
  bustCarCaches();
  res.json({
    message: removed
      ? `Car deleted and ${removed} photo${removed === 1 ? '' : 's'} removed from server`
      : 'Car deleted',
    removedPhotos: removed,
  });
});

export const adminUploadImages = asyncHandler(async (req, res) => {
  const car = await Car.findByPk(req.params.id);
  if (!car) throw new AppError('Car not found', 404);

  const files = req.files || [];
  if (!files.length) throw new AppError('No images uploaded', 400);

  const saved = [];
  const errors = [];

  for (const file of files) {
    try {
      const result = await processAndSaveCarImage(file.buffer, car.id);
      saved.push(result);
    } catch (err) {
      errors.push(err.message || 'Failed to process image');
    }
  }

  if (!saved.length) {
    throw new AppError(errors[0] || 'No images could be processed', 400);
  }

  const urls = saved.map((item) => item.publicPath);
  const existingGallery = Array.isArray(car.gallery) ? car.gallery.map(toStoragePath) : [];
  const gallery = [...existingGallery, ...urls];
  const currentImage = toStoragePath(car.image);
  const shouldReplaceMain = !currentImage || currentImage === PENDING_IMAGE;

  await car.update({
    image: shouldReplaceMain ? urls[0] : currentImage,
    gallery,
  });
  bustCarCaches();

  const refreshed = await Car.findByPk(car.id);
  res.status(201).json({
    data: withCarMedia(refreshed),
    uploaded: urls.map(resolveMediaUrl),
    compressed: saved.map((item) => ({
      path: item.publicPath,
      bytes: item.bytes,
    })),
    ...(errors.length ? { warnings: errors } : {}),
    message: `${saved.length} photo${saved.length === 1 ? '' : 's'} uploaded and compressed`,
  });
});

export const adminDeleteImage = asyncHandler(async (req, res) => {
  const car = await Car.findByPk(req.params.id);
  if (!car) throw new AppError('Car not found', 404);

  const target = toStoragePath(req.body?.path || req.query?.path);
  if (!target || !target.startsWith('/uploads/')) {
    throw new AppError('Image path is required', 400);
  }
  if (target === PENDING_IMAGE) {
    throw new AppError('Cannot remove the placeholder image', 400);
  }

  const gallery = (Array.isArray(car.gallery) ? car.gallery : []).map(toStoragePath).filter(Boolean);
  const nextGallery = gallery.filter((p) => p !== target);
  if (nextGallery.length === gallery.length && toStoragePath(car.image) !== target) {
    throw new AppError('Image not found on this car', 404);
  }

  const deletedFromDisk = await safeUnlinkUpload(target);

  let nextImage = toStoragePath(car.image);
  if (nextImage === target) {
    nextImage = nextGallery[0] || PENDING_IMAGE;
  }

  await car.update({
    image: nextImage,
    gallery: nextGallery,
  });
  bustCarCaches();

  const refreshed = await Car.findByPk(car.id);
  res.json({
    data: withCarMedia(refreshed),
    message: deletedFromDisk
      ? 'Photo removed from car and deleted from server'
      : 'Photo removed from car',
    deletedFromDisk,
  });
});
