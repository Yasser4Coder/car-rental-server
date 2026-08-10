import { Op } from 'sequelize';
import { Booking, Car, User } from '../models/index.js';
import { appendStatusHistory, assertStatusTransition } from '../services/bookingStatus.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withCarMedia } from '../utils/media.js';
import { createBookingCode, rentalDays } from '../utils/tokens.js';

function withBookingMedia(booking) {
  if (!booking) return booking;
  const data = typeof booking.toJSON === 'function' ? booking.toJSON() : { ...booking };
  if (data.car) data.car = withCarMedia(data.car);
  return data;
}

export const createBooking = asyncHandler(async (req, res) => {
  const payload = req.body;
  const car = await Car.findOne({ where: { id: payload.carId, isActive: true } });
  if (!car) throw new AppError('Car not found or unavailable', 404);

  const locations = Array.isArray(car.locations) ? car.locations : [];
  if (!locations.includes(payload.location)) {
    throw new AppError('Selected pickup area is not available for this car', 400);
  }

  const overlap = await Booking.findOne({
    where: {
      carId: car.id,
      status: { [Op.in]: ['pending', 'confirmed', 'active'] },
      pickupDate: { [Op.lte]: payload.returnDate },
      returnDate: { [Op.gte]: payload.pickupDate },
    },
  });
  if (overlap) {
    throw new AppError('Car is not available for the selected dates', 409);
  }

  const days = rentalDays(payload.pickupDate, payload.returnDate);
  const total = car.price * days;

  const booking = await Booking.create({
    code: createBookingCode(),
    userId: req.user?.id || null,
    carId: car.id,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location,
    pickupDate: payload.pickupDate,
    returnDate: payload.returnDate,
    delivery: payload.delivery,
    notes: payload.notes || null,
    days,
    dailyRate: car.price,
    deposit: car.deposit,
    total,
    status: 'pending',
    statusHistory: [
      {
        from: null,
        to: 'pending',
        by: req.user ? `user:${req.user.id}` : 'guest',
        note: 'Booking request created',
        at: new Date().toISOString(),
      },
    ],
  });

  const full = await Booking.findByPk(booking.id, {
    include: [{ model: Car, as: 'car' }],
  });

  res.status(201).json({ data: withBookingMedia(full) });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({
    where: {
      [Op.or]: [{ userId: req.user.id }, { email: req.user.email }],
    },
    include: [{ model: Car, as: 'car' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ data: bookings.map(withBookingMedia) });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [{ model: Car, as: 'car' }],
  });
  if (!booking) throw new AppError('Booking not found', 404);

  const owns =
    booking.userId === req.user.id ||
    booking.email.toLowerCase() === req.user.email.toLowerCase();
  if (!owns && req.user.role !== 'admin') {
    throw new AppError('Not allowed to cancel this booking', 403);
  }

  assertStatusTransition(booking.status, 'cancelled');

  booking.statusHistory = appendStatusHistory(booking, {
    from: booking.status,
    to: 'cancelled',
    by: `user:${req.user.id}`,
    note: 'Cancelled by client',
  });
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = 'client';
  await booking.save();

  res.json({ data: booking });
});

function escapeLike(value) {
  return String(value).replace(/[%_\\]/g, '\\$&');
}

export const adminListBookings = asyncHandler(async (req, res) => {
  const { status, location, carId, q, from, to } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const where = {};

  if (status) where.status = status;
  if (location) where.location = location;
  if (carId) where.carId = carId;
  if (from || to) {
    where.pickupDate = {};
    if (from) where.pickupDate[Op.gte] = from;
    if (to) where.pickupDate[Op.lte] = to;
  }
  if (q?.trim()) {
    const raw = q.trim();
    const prefix = `${escapeLike(raw)}%`;
    // Prefer prefix matches (index-friendly) over leading-wildcard LIKE
    if (raw.includes('@')) {
      where.email = { [Op.like]: prefix };
    } else if (/^BK[-_]/i.test(raw) || /^[A-Z0-9-]{5,}$/i.test(raw)) {
      where.code = { [Op.like]: prefix };
    } else {
      where[Op.or] = [
        { code: { [Op.like]: prefix } },
        { fullName: { [Op.like]: prefix } },
        { email: { [Op.like]: prefix } },
        { phone: { [Op.like]: prefix } },
      ];
    }
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await Booking.findAndCountAll({
    attributes: [
      'id',
      'code',
      'userId',
      'carId',
      'fullName',
      'email',
      'phone',
      'location',
      'pickupDate',
      'returnDate',
      'delivery',
      'days',
      'dailyRate',
      'deposit',
      'total',
      'status',
      'paymentStatus',
      'createdAt',
      'updatedAt',
    ],
    where,
    include: [
      {
        model: Car,
        as: 'car',
        attributes: ['id', 'name', 'slug', 'brand', 'model', 'image', 'type', 'price'],
      },
      { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  res.json({
    data: rows.map(withBookingMedia),
    meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) || 1 },
  });
});

export const adminGetBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [
      { model: Car, as: 'car' },
      { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone', 'role'] },
    ],
  });
  if (!booking) throw new AppError('Booking not found', 404);
  res.json({ data: withBookingMedia(booking) });
});

export const adminUpdateStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [{ model: Car, as: 'car' }],
  });
  if (!booking) throw new AppError('Booking not found', 404);

  const { status, note } = req.body;
  assertStatusTransition(booking.status, status);

  booking.statusHistory = appendStatusHistory(booking, {
    from: booking.status,
    to: status,
    by: `admin:${req.user.id}`,
    note: note || null,
  });
  booking.status = status;

  if (status === 'cancelled' || status === 'rejected') {
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'admin';
  }

  await booking.save();
  res.json({ data: booking });
});

export const adminUpdateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [{ model: Car, as: 'car' }],
  });
  if (!booking) throw new AppError('Booking not found', 404);
  await booking.update(req.body);
  res.json({ data: booking });
});
