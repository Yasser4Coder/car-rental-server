import { isStripeConfigured } from '../config/stripe.js';
import {
  createCheckoutSessionForBooking,
  getCheckoutSessionStatus,
} from '../services/stripeCheckout.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Public flag so the website can hide Pay when Stripe is not set up. */
export const paymentsConfig = asyncHandler(async (_req, res) => {
  res.json({
    configured: isStripeConfigured(),
    currency: 'AED',
  });
});

/** Start Stripe Checkout — amount comes only from the booking row in the database. */
export const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) {
    throw new AppError(
      'Online payments are not configured. Set STRIPE_SECRET_KEY (sk_test_… or sk_live_…) on the API and restart.',
      503,
    );
  }

  const bookingId = req.body?.bookingId;
  const code = req.body?.code;
  const email = req.body?.email;

  if (
    (bookingId == null || String(bookingId).trim() === '') &&
    (code == null || String(code).trim() === '')
  ) {
    throw new AppError('bookingId or code is required.', 400);
  }

  if (!req.user && (!email || String(email).trim() === '')) {
    throw new AppError('email is required to pay as a guest.', 400);
  }

  const result = await createCheckoutSessionForBooking(
    {
      bookingId,
      code,
      email,
    },
    req.user || null,
  );

  res.json(result);
});

/** Poll after redirect — verifies session with Stripe server-side. */
export const checkoutSessionStatus = asyncHandler(async (req, res) => {
  if (!isStripeConfigured()) {
    throw new AppError('Online payments are not configured.', 503);
  }

  const sessionId = req.query?.session_id;
  if (sessionId == null || String(sessionId).trim() === '') {
    throw new AppError('session_id is required.', 400);
  }

  const payload = await getCheckoutSessionStatus(
    String(sessionId).trim(),
    req.user || null,
    req.query?.email ? String(req.query.email) : '',
  );
  res.json(payload);
});
