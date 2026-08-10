import { z } from 'zod';

export const createBookingSchema = z
  .object({
    carId: z.coerce.number().int().positive(),
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(8).max(40),
    location: z.string().trim().min(2).max(60),
    pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    delivery: z.enum(['self', 'delivery']).default('self'),
    notes: z.string().trim().max(2000).optional().nullable(),
    /** When true and Stripe is configured, response may include checkoutUrl. */
    payNow: z.boolean().optional().default(false),
  })
  .refine((data) => data.returnDate >= data.pickupDate, {
    message: 'Return date must be on or after pickup date',
    path: ['returnDate'],
  });

export const adminBookingFilterSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'])
    .optional(),
  location: z.string().optional(),
  carId: z.coerce.number().int().optional(),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected']),
  note: z.string().trim().max(1000).optional().nullable(),
});

export const updateBookingPaymentStatusSchema = z.object({
  paymentStatus: z.enum(['unpaid', 'deposit_held', 'paid', 'refunded']),
  note: z.string().trim().max(1000).optional().nullable(),
});

export const adminPaymentFilterSchema = z.object({
  paymentStatus: z.enum(['unpaid', 'deposit_held', 'paid', 'refunded']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const updateBookingSchema = z.object({
  adminNotes: z.string().trim().max(5000).optional().nullable(),
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(8).max(40).optional(),
  location: z.string().trim().min(2).max(60).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
