import { Op } from 'sequelize';
import { Booking, Car } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BUSY_STATUSES = ['pending', 'confirmed', 'active'];

/**
 * Overlap rule (inclusive): existing.pickup <= requested.return AND existing.return >= requested.pickup
 */
export async function getBusyBookingsForCar(carId, pickupDate, returnDate) {
  if (!ISO_DATE.test(pickupDate) || !ISO_DATE.test(returnDate) || returnDate < pickupDate) {
    throw new AppError('Invalid rental dates', 400);
  }

  return Booking.findAll({
    attributes: ['id', 'pickupDate', 'returnDate', 'status'],
    where: {
      carId,
      status: { [Op.in]: BUSY_STATUSES },
      pickupDate: { [Op.lte]: returnDate },
      returnDate: { [Op.gte]: pickupDate },
    },
    order: [['pickupDate', 'ASC']],
  });
}

/**
 * @returns {{ available: boolean, pickupDate: string, returnDate: string, conflicts: object[] }}
 */
export async function checkCarAvailability(carIdOrSlug, pickupDate, returnDate) {
  const key = String(carIdOrSlug || '').trim();
  let car = null;
  if (/^\d+$/.test(key)) {
    car = await Car.findOne({
      where: { id: Number(key), isActive: true },
      attributes: ['id', 'name', 'slug'],
    });
  }
  if (!car) {
    car = await Car.findOne({
      where: { slug: key, isActive: true },
      attributes: ['id', 'name', 'slug'],
    });
  }
  if (!car) throw new AppError('Car not found or unavailable', 404);

  const end =
    returnDate && ISO_DATE.test(returnDate) && returnDate >= pickupDate ? returnDate : pickupDate;

  const rows = await getBusyBookingsForCar(car.id, pickupDate, end);
  const conflicts = rows.map((row) => ({
    pickupDate: row.pickupDate,
    returnDate: row.returnDate,
    status: row.status,
  }));

  return {
    available: conflicts.length === 0,
    carId: car.id,
    carName: car.name,
    carSlug: car.slug,
    pickupDate,
    returnDate: end,
    conflicts,
  };
}

export { BUSY_STATUSES, ISO_DATE };
