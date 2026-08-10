import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { PAYMENT_STATUSES } from '../config/paymentConstants.js';
import { getStripe, isStripeConfigured } from '../config/stripe.js';
import { Booking, Payment, sequelize } from '../models/index.js';
import { appendStatusHistory } from './bookingStatus.js';

/**
 * Cancels unpaid `pending` bookings older than the configured window (frees the car).
 * @returns {Promise<{ scanned: number, cancelled: number }>}
 */
export async function expireStalePendingPaymentBookings() {
  const minutes = env.bookingPaymentTimeoutMinutes;
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  const candidates = await Booking.findAll({
    where: {
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: { [Op.lt]: cutoff },
    },
    attributes: ['id', 'code'],
    order: [['id', 'ASC']],
  });

  let cancelled = 0;
  const stripe = isStripeConfigured() ? getStripe() : null;

  for (const row of candidates) {
    try {
      const did = await sequelize.transaction(async (transaction) => {
        const booking = await Booking.findOne({
          where: {
            id: row.id,
            status: 'pending',
            paymentStatus: 'unpaid',
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!booking) return false;

        const paid = await Payment.findOne({
          where: { bookingId: booking.id, status: PAYMENT_STATUSES.SUCCEEDED },
          attributes: ['id'],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (paid) return false;

        const pendingPayments = await Payment.findAll({
          where: { bookingId: booking.id, status: PAYMENT_STATUSES.PENDING },
          attributes: ['id', 'stripeCheckoutSessionId'],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        await booking.update(
          {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: 'system',
            statusHistory: appendStatusHistory(booking, {
              from: booking.status,
              to: 'cancelled',
              by: 'system:payment-timeout',
              note: `Auto-cancelled after ${minutes} minutes without payment`,
            }),
          },
          { transaction },
        );

        if (pendingPayments.length) {
          await Payment.update(
            { status: PAYMENT_STATUSES.CANCELED },
            {
              where: { bookingId: booking.id, status: PAYMENT_STATUSES.PENDING },
              transaction,
            },
          );
        }

        return {
          pendingSessions: pendingPayments
            .map((p) => p.stripeCheckoutSessionId)
            .filter(Boolean),
        };
      });

      if (!did) continue;

      if (stripe && did.pendingSessions?.length) {
        for (const sid of did.pendingSessions) {
          try {
            await stripe.checkout.sessions.expire(sid);
          } catch {
            /* session may already be completed or expired */
          }
        }
      }

      cancelled += 1;
      console.info(
        `[booking-timeout] auto-cancelled unpaid booking code=${row.code} id=${row.id} after ${minutes}m`,
      );
    } catch (err) {
      console.error(`[booking-timeout] failed for booking id=${row.id}`, err);
    }
  }

  return { scanned: candidates.length, cancelled };
}
