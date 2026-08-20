import { Op, fn, col } from 'sequelize';
import { POPULAR_BADGE_LABELS, popularBadgeLabel } from '../config/popularBadges.js';
import { Booking, Car } from '../models/index.js';
import { withCarsMedia } from '../utils/media.js';

const COUNTED_STATUSES = ['confirmed', 'active', 'completed'];

/**
 * Homepage “Most Popular Cars” strip.
 * Prefer cars flagged showInPopular; fall back to top booked cars.
 */
export async function getPopularCars(limit = 6) {
  const safeLimit = Math.min(12, Math.max(4, Number(limit) || 6));

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [totalRows, monthRows] = await Promise.all([
    Booking.findAll({
      attributes: ['carId', [fn('COUNT', col('Booking.id')), 'totalBookings']],
      where: { status: { [Op.in]: COUNTED_STATUSES } },
      group: ['carId'],
      raw: true,
    }),
    Booking.findAll({
      attributes: ['carId', [fn('COUNT', col('Booking.id')), 'monthBookings']],
      where: {
        status: { [Op.in]: COUNTED_STATUSES },
        createdAt: { [Op.gte]: monthStart },
      },
      group: ['carId'],
      raw: true,
    }),
  ]);

  const countsByCar = new Map();
  for (const row of totalRows) {
    countsByCar.set(Number(row.carId), {
      totalBookings: Number(row.totalBookings) || 0,
      monthBookings: 0,
    });
  }
  for (const row of monthRows) {
    const id = Number(row.carId);
    const prev = countsByCar.get(id) || { totalBookings: 0, monthBookings: 0 };
    prev.monthBookings = Number(row.monthBookings) || 0;
    countsByCar.set(id, prev);
  }

  let cars = await Car.findAll({
    where: { isActive: true, showInPopular: true },
    order: [
      ['popularSort', 'ASC'],
      ['id', 'ASC'],
    ],
    limit: safeLimit,
  });

  if (!cars.length) {
    const topIds = [...countsByCar.entries()]
      .sort((a, b) => b[1].totalBookings - a[1].totalBookings)
      .slice(0, safeLimit)
      .map(([id]) => id);

    if (topIds.length) {
      cars = await Car.findAll({
        where: { isActive: true, id: { [Op.in]: topIds } },
      });
      cars.sort((a, b) => {
        const ca = countsByCar.get(a.id)?.totalBookings || 0;
        const cb = countsByCar.get(b.id)?.totalBookings || 0;
        return cb - ca;
      });
    } else {
      cars = await Car.findAll({
        where: { isActive: true },
        order: [
          ['featured', 'DESC'],
          ['rating', 'DESC'],
          ['price', 'DESC'],
        ],
        limit: safeLimit,
      });
    }
  }

  const fallbackBadges = ['most_booked', 'best_seller', 'new_arrival', 'limited_availability'];

  const data = withCarsMedia(cars).map((car, index) => {
    const counts = countsByCar.get(car.id) || { totalBookings: 0, monthBookings: 0 };
    const badgeKey = car.popularBadge || fallbackBadges[index % fallbackBadges.length];
    return {
      ...car,
      popularBadge: badgeKey,
      popularBadgeLabel: popularBadgeLabel(badgeKey) || POPULAR_BADGE_LABELS[badgeKey],
      bookingCount: counts.totalBookings,
      monthBookingCount: counts.monthBookings,
    };
  });

  return { data };
}
