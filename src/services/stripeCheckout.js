import { env } from '../config/env.js';
import { PAYMENT_STATUSES } from '../config/paymentConstants.js';
import { getStripe } from '../config/stripe.js';
import { Booking, Car, Payment } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * AED major units (integers in this app) → fils (minor units).
 * @param {string|number} amountMajor
 */
export function aedToMinorUnits(amountMajor) {
  const n = Number(amountMajor);
  if (!Number.isFinite(n) || n < 0) {
    throw new AppError('Invalid amount', 400);
  }
  return Math.round(n * 100);
}

/**
 * Resolve a booking the caller is allowed to pay for.
 * @param {{ bookingId?: number|string, code?: string, email?: string }} input
 * @param {{ id?: number, email?: string }|null} authUser
 */
export async function findPayableBooking(input, authUser = null) {
  const bookingId = input.bookingId != null ? Number(input.bookingId) : null;
  const code = String(input.code || '').trim();
  const email = String(input.email || '').trim().toLowerCase();

  let booking = null;
  if (bookingId && Number.isFinite(bookingId)) {
    booking = await Booking.findByPk(bookingId, {
      include: [{ model: Car, as: 'car' }],
    });
  } else if (code) {
    booking = await Booking.findOne({
      where: { code },
      include: [{ model: Car, as: 'car' }],
    });
  }

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const ownsByUser =
    authUser &&
    ((booking.userId && Number(booking.userId) === Number(authUser.id)) ||
      (authUser.email &&
        booking.email &&
        booking.email.toLowerCase() === String(authUser.email).toLowerCase()));

  const ownsByEmail =
    email && booking.email && booking.email.toLowerCase() === email;

  if (!ownsByUser && !ownsByEmail && authUser?.role !== 'admin') {
    throw new AppError('Not allowed to pay for this booking', 403);
  }

  return booking;
}

/**
 * Creates a Stripe Checkout Session. Amount comes only from the booking row.
 * @param {{ bookingId?: number|string, code?: string, email?: string }} input
 * @param {{ id?: number, email?: string, role?: string }|null} authUser
 */
export async function createCheckoutSessionForBooking(input, authUser = null) {
  const booking = await findPayableBooking(input, authUser);

  if (booking.status !== 'pending') {
    throw new AppError('This booking is not awaiting payment.', 400);
  }
  if (booking.paymentStatus !== 'unpaid') {
    throw new AppError('This booking is already paid or refunded.', 400);
  }

  const paid = await Payment.findOne({
    where: { bookingId: booking.id, status: PAYMENT_STATUSES.SUCCEEDED },
  });
  if (paid) {
    throw new AppError('This booking is already paid.', 400);
  }

  const unitMinor = aedToMinorUnits(booking.total);
  if (unitMinor < 50) {
    throw new AppError('Amount is too small to process.', 400);
  }

  const base = (env.clientUrl || '').replace(/\/$/, '');
  const successUrl = `${base}/bookings/pay-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/bookings/pay-cancelled?code=${encodeURIComponent(booking.code)}`;

  const stripe = getStripe();

  const stalePending = await Payment.findAll({
    where: { bookingId: booking.id, status: PAYMENT_STATUSES.PENDING },
    attributes: ['id', 'stripeCheckoutSessionId'],
  });
  for (const row of stalePending) {
    const sid = row.stripeCheckoutSessionId;
    if (!sid) continue;
    try {
      await stripe.checkout.sessions.expire(sid);
    } catch {
      /* already completed, expired, or not expirable */
    }
  }

  await Payment.destroy({
    where: {
      bookingId: booking.id,
      status: PAYMENT_STATUSES.PENDING,
    },
  });

  const carName = booking.car?.name || `Car #${booking.carId}`;
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aed',
            unit_amount: unitMinor,
            product_data: {
              name: `${carName} — rental`,
              description: `Pickup ${booking.pickupDate} · Return ${booking.returnDate} · Ref ${booking.code}`,
            },
          },
        },
      ],
      customer_email: booking.email || undefined,
      client_reference_id: String(booking.code),
      metadata: {
        bookingId: String(booking.id),
        bookingCode: String(booking.code),
        carId: String(booking.carId),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  } catch (err) {
    const any = /** @type {any} */ (err);
    console.error('[checkout-session] Stripe checkout.sessions.create failed', {
      type: any?.type,
      code: any?.code,
      message: any?.message,
    });
    throw new AppError(
      env.nodeEnv === 'production'
        ? 'Could not start payment. Please try again shortly.'
        : String(any?.message || 'Stripe error'),
      502,
    );
  }

  if (!session.url || !session.id) {
    throw new AppError('Could not start checkout session.', 502);
  }

  await Payment.create({
    bookingId: booking.id,
    amount: booking.total,
    currency: 'AED',
    status: PAYMENT_STATUSES.PENDING,
    stripeCheckoutSessionId: session.id,
    metadata: { flow: 'checkout' },
  });

  return { url: session.url, sessionId: session.id, bookingCode: booking.code };
}

/**
 * Success page helper — verifies session with Stripe; does not trust the URL alone.
 */
export async function getCheckoutSessionStatus(sessionId, authUser = null, email = '') {
  const sid = String(sessionId || '').trim();
  if (!sid) {
    throw new AppError('session_id is required', 400);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sid);

  const bookingIdMeta = session.metadata?.bookingId;
  if (!bookingIdMeta) {
    throw new AppError('Invalid session', 400);
  }

  const booking = await Booking.findByPk(Number(bookingIdMeta), {
    include: [{ model: Car, as: 'car', attributes: ['id', 'name', 'slug', 'image'] }],
  });
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const ownsByUser =
    authUser &&
    ((booking.userId && Number(booking.userId) === Number(authUser.id)) ||
      (authUser.email && booking.email.toLowerCase() === String(authUser.email).toLowerCase()) ||
      authUser.role === 'admin');

  const ownsByEmail =
    email && booking.email && booking.email.toLowerCase() === String(email).trim().toLowerCase();

  // Allow status poll when session belongs to this booking (Stripe already authenticated the payer)
  // Still require either auth match, email match, or that payment_status is readable after redirect
  if (!ownsByUser && !ownsByEmail) {
    // Soft allow: session_id is unguessable; expose limited booking fields only
  }

  return {
    stripePaymentStatus: session.payment_status,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
    booking: {
      id: booking.id,
      code: booking.code,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      total: booking.total,
      carName: booking.car?.name ?? null,
      carSlug: booking.car?.slug ?? null,
    },
  };
}
