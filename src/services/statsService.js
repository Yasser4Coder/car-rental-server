import { Op, fn, col, literal } from 'sequelize';
import { Booking, Car, User } from '../models/index.js';

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getOverviewStats() {
  const now = new Date();
  const today = startOfDay(now);
  const week = daysAgo(7);
  const month = daysAgo(30);

  const [
    totalCars,
    activeCars,
    totalUsers,
    bookingsByStatus,
    revenueRow,
    bookingsToday,
    bookingsWeek,
    bookingsMonth,
  ] = await Promise.all([
    Car.count(),
    Car.count({ where: { isActive: true } }),
    User.count({ where: { role: 'client' } }),
    Booking.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    Booking.findOne({
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'revenue']],
      where: { status: { [Op.in]: ['confirmed', 'active', 'completed'] } },
      raw: true,
    }),
    Booking.count({ where: { createdAt: { [Op.gte]: today } } }),
    Booking.count({ where: { createdAt: { [Op.gte]: week } } }),
    Booking.count({ where: { createdAt: { [Op.gte]: month } } }),
  ]);

  const statusMap = Object.fromEntries(
    bookingsByStatus.map((row) => [row.status, Number(row.count)]),
  );

  return {
    cars: { total: totalCars, active: activeCars },
    clients: totalUsers,
    bookings: {
      byStatus: statusMap,
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      today: bookingsToday,
      week: bookingsWeek,
      month: bookingsMonth,
    },
    revenue: Number(revenueRow?.revenue || 0),
  };
}

export async function getTimeseries(rangeDays = 30) {
  const from = daysAgo(rangeDays - 1);

  const rows = await Booking.findAll({
    attributes: [
      [fn('DATE', col('created_at')), 'day'],
      [fn('COUNT', col('id')), 'bookings'],
      [
        fn(
          'COALESCE',
          fn(
            'SUM',
            literal(`CASE WHEN status IN ('confirmed','active','completed') THEN total ELSE 0 END`),
          ),
          0,
        ),
        'revenue',
      ],
    ],
    where: { createdAt: { [Op.gte]: from } },
    group: [fn('DATE', col('created_at'))],
    order: [[fn('DATE', col('created_at')), 'ASC']],
    raw: true,
  });

  return rows.map((row) => ({
    day: row.day,
    bookings: Number(row.bookings),
    revenue: Number(row.revenue),
  }));
}

export async function getTopCars(limit = 5) {
  const rows = await Booking.findAll({
    attributes: ['carId', [fn('COUNT', col('Booking.id')), 'bookings'], [fn('SUM', col('total')), 'revenue']],
    include: [{ model: Car, as: 'car', attributes: ['id', 'name', 'brand', 'image', 'price'] }],
    group: ['carId', 'car.id'],
    order: [[fn('COUNT', col('Booking.id')), 'DESC']],
    limit,
  });

  return rows.map((row) => ({
    car: row.car,
    bookings: Number(row.get('bookings')),
    revenue: Number(row.get('revenue') || 0),
  }));
}

export async function getLocationStats() {
  const rows = await Booking.findAll({
    attributes: ['location', [fn('COUNT', col('id')), 'bookings'], [fn('SUM', col('total')), 'revenue']],
    group: ['location'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    raw: true,
  });

  return rows.map((row) => ({
    location: row.location,
    bookings: Number(row.bookings),
    revenue: Number(row.revenue || 0),
  }));
}
