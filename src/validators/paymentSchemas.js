import { z } from 'zod';

export const checkoutSessionSchema = z
  .object({
    bookingId: z.coerce.number().int().positive().optional(),
    code: z.string().trim().min(3).max(32).optional(),
    email: z.string().trim().email().max(180).optional(),
  })
  .refine((data) => data.bookingId != null || Boolean(data.code), {
    message: 'bookingId or code is required',
  });

export const checkoutStatusQuerySchema = z.object({
  session_id: z.string().trim().min(5).max(255),
  email: z.string().trim().email().max(180).optional(),
});
