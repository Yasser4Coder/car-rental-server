/** Stripe payment row statuses — keep in sync with payments.status ENUM. */
export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
  REFUNDED_PARTIAL: 'refunded_partial',
  REFUNDED_FULL: 'refunded_full',
});

/** Booking-level payment status — keep in sync with bookings.payment_status ENUM. */
export const BOOKING_PAYMENT_STATUSES = Object.freeze({
  UNPAID: 'unpaid',
  DEPOSIT_HELD: 'deposit_held',
  PAID: 'paid',
  REFUNDED: 'refunded',
});

export const BOOKING_PAYMENT_STATUS_VALUES = Object.freeze(
  Object.values(BOOKING_PAYMENT_STATUSES),
);
