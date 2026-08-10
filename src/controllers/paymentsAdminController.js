import { Op, fn, col } from 'sequelize';
import { BOOKING_PAYMENT_STATUS_VALUES } from '../config/paymentConstants.js';
import { Booking, Car, Payment, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { withCarMedia } from '../utils/media.js';

function withBookingMedia(booking) {
  if (!booking) return booking;
  const data = typeof booking.toJSON === 'function' ? booking.toJSON() : { ...booking };
  if (data.car) data.car = withCarMedia(data.car);
  return data;
}

export const adminListPayments = asyncHandler(async (req, res) => {
  const { paymentStatus, q, page = 1, limit = 25 } = req.query;
  const where = {};

  if (paymentStatus) where.paymentStatus = paymentStatus;

  if (q?.trim()) {
    const like = `%${q.trim()}%`;
    where[Op.or] = [
      { code: { [Op.like]: like } },
      { fullName: { [Op.like]: like } },
      { email: { [Op.like]: like } },
      { phone: { [Op.like]: like } },
      { stripePaymentIntentId: { [Op.like]: like } },
    ];
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
      'days',
      'dailyRate',
      'deposit',
      'total',
      'status',
      'paymentStatus',
      'stripePaymentIntentId',
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
      {
        model: Payment,
        as: 'payments',
        required: false,
        attributes: [
          'id',
          'amount',
          'currency',
          'status',
          'stripePaymentIntentId',
          'stripeCheckoutSessionId',
          'createdAt',
          'updatedAt',
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  const statsRows = await Booking.findAll({
    attributes: [
      'paymentStatus',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('total')), 'amount'],
    ],
    group: ['paymentStatus'],
    raw: true,
  });

  const stats = Object.fromEntries(
    BOOKING_PAYMENT_STATUS_VALUES.map((key) => [key, { count: 0, amount: 0 }]),
  );
  for (const row of statsRows) {
    const key = row.paymentStatus;
    if (!stats[key]) continue;
    stats[key] = {
      count: Number(row.count) || 0,
      amount: Number(row.amount) || 0,
    };
  }

  const stripeAttemptCount = await Payment.count();

  res.json({
    data: rows.map((row) => {
      const data = withBookingMedia(row);
      if (Array.isArray(data.payments)) {
        data.payments = [...data.payments].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
      return data;
    }),
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    },
    stats: {
      ...stats,
      stripeAttempts: stripeAttemptCount,
    },
  });
});

export const adminGetPaymentBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [
      { model: Car, as: 'car' },
      { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone', 'role'] },
      {
        model: Payment,
        as: 'payments',
        required: false,
        separate: true,
        order: [['createdAt', 'DESC']],
      },
    ],
  });
  if (!booking) throw new AppError('Booking not found', 404);
  res.json({ data: withBookingMedia(booking) });
});
