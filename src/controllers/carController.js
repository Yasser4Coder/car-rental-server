import { Op } from 'sequelize';
import { Car } from '../models/index.js';
import {
  CAR_FEATURED_ATTRIBUTES,
  CAR_LIST_ATTRIBUTES,
  listCars,
} from '../services/carFilter.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUploadPath } from '../middleware/upload.js';
import { invalidateCache } from '../utils/cache.js';
import { resolveMediaUrl, withCarMedia, withCarsMedia } from '../utils/media.js';

function bustCarCaches() {
  invalidateCache('cars:');
  invalidateCache('featured:');
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

export const getCarById = asyncHandler(async (req, res) => {
  const car = await Car.findOne({
    where: { id: req.params.id, isActive: true },
  });
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
  const car = await Car.create(req.body);
  bustCarCaches();
  res.status(201).json({ data: withCarMedia(car) });
});

export const adminUpdateCar = asyncHandler(async (req, res) => {
  const car = await Car.findByPk(req.params.id);
  if (!car) throw new AppError('Car not found', 404);
  await car.update(req.body);
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

  await car.destroy();
  bustCarCaches();
  res.json({ message: 'Car deleted' });
});

export const adminUploadImages = asyncHandler(async (req, res) => {
  const car = await Car.findByPk(req.params.id);
  if (!car) throw new AppError('Car not found', 404);

  const files = req.files || [];
  if (!files.length) throw new AppError('No images uploaded', 400);

  const urls = files.map((file) => publicUploadPath(file.filename));
  const gallery = Array.isArray(car.gallery) ? [...car.gallery, ...urls] : [...urls];

  await car.update({
    image: car.image || urls[0],
    gallery,
  });
  bustCarCaches();

  res.json({ data: withCarMedia(car), uploaded: urls.map(resolveMediaUrl) });
});
