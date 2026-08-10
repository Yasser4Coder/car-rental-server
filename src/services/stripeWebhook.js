import { PAYMENT_STATUSES } from '../config/paymentConstants.js';
import { Booking, Car, Payment, sequelize } from '../models/index.js';
import { appendStatusHistory } from './bookingStatus.js';
import { aedToMinorUnits } from './stripeCheckout.js';

/**
 * @param {import('stripe').Stripe.Event} event
 */
export async function handleStripeWebhookEvent(event) {
  if (event.type === 'checkout.session.completed') {
    await handleCheckoutSessionCompleted(
      /** @type {import('stripe').Stripe.Checkout.Session} */ (event.data.object),
      event.id,
    );
  }
}

/**
 * @param {import('stripe').Stripe.Checkout.Session} session
 * @param {string} stripeEventId
 */
async function handleCheckoutSessionCompleted(session, stripeEventId) {
  const sessionId = session.id;
  const pi =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent && typeof session.payment_intent === 'object' && 'id' in session.payment_intent
        ? session.payment_intent.id
        : null;

  const payment = await Payment.findOne({
    where: { stripeCheckoutSessionId: sessionId },
    include: [
      {
        model: Booking,
        as: 'booking',
        required: true,
        include: [{ model: Car, as: 'car' }],
      },
    ],
  });

  if (!payment) {
    console.error('[stripe webhook] no Payment row for session', sessionId);
    return;
  }

  if (payment.status === PAYMENT_STATUSES.SUCCEEDED) {
    return;
  }

  const booking = payment.booking;
  if (!booking) {
    console.error('[stripe webhook] payment missing booking', payment.id);
    return;
  }

  if (session.metadata?.bookingId !== String(booking.id)) {
    console.error(
      '[stripe webhook] metadata bookingId mismatch',
      session.metadata?.bookingId,
      booking.id,
    );
    return;
  }

  const cur = String(session.currency || '').toLowerCase();
  if (cur && cur !== 'aed') {
    console.error('[stripe webhook] currency mismatch', cur);
    return;
  }

  const expectedMinor = aedToMinorUnits(booking.total);
  if (session.amount_total == null || session.amount_total !== expectedMinor) {
    console.error('[stripe webhook] amount mismatch', {
      amount_total: session.amount_total,
      expectedMinor,
      bookingId: booking.id,
    });
    return;
  }

  if (session.payment_status !== 'paid') {
    return;
  }

  const prevMeta =
    payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {};

  await sequelize.transaction(async (transaction) => {
    await payment.update(
      {
        status: PAYMENT_STATUSES.SUCCEEDED,
        stripePaymentIntentId: pi || payment.stripePaymentIntentId,
        metadata: { ...prevMeta, stripeEventId, paidAt: new Date().toISOString() },
      },
      { transaction },
    );

    const nextStatus = booking.status === 'pending' ? 'confirmed' : booking.status;
    const history =
      nextStatus !== booking.status
        ? appendStatusHistory(booking, {
            from: booking.status,
            to: nextStatus,
            by: 'stripe:webhook',
            note: 'Payment received via Stripe Checkout',
          })
        : booking.statusHistory;

    await booking.update(
      {
        status: nextStatus,
        paymentStatus: 'paid',
        stripePaymentIntentId: pi || booking.stripePaymentIntentId,
        statusHistory: history,
      },
      { transaction },
    );
  });

  console.log('[stripe webhook] booking paid', booking.code, sessionId);
}
