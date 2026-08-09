import { AppError } from '../utils/AppError.js';

const TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};

export function assertStatusTransition(from, to) {
  if (from === to) {
    throw new AppError('Booking is already in this status', 400);
  }
  const allowed = TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new AppError(`Cannot change status from ${from} to ${to}`, 400);
  }
}

export function appendStatusHistory(booking, { from, to, by, note }) {
  const history = Array.isArray(booking.statusHistory) ? [...booking.statusHistory] : [];
  history.push({
    from,
    to,
    by,
    note: note || null,
    at: new Date().toISOString(),
  });
  return history;
}
