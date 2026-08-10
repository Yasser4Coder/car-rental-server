import { z } from 'zod';

const boolFromQuery = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (typeof v === 'boolean') return v;
    return v === 'true' || v === '1';
  });

export const adminUserFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(['client', 'admin']).optional(),
  isActive: boolFromQuery,
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const adminCreateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(8).max(40).optional().nullable(),
  password: z.string().min(8).max(72),
  role: z.enum(['client', 'admin']).optional().default('client'),
  isActive: z.boolean().optional().default(true),
});

export const adminUpdateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(180).optional(),
    phone: z.string().trim().min(8).max(40).optional().nullable(),
    password: z.string().min(8).max(72).optional(),
    role: z.enum(['client', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });
