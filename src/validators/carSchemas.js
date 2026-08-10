import { z } from 'zod';

const carType = z.enum(['essential', 'premium', 'prestige', 'supercar']);

const badgeSchema = z.object({
  label: z.string(),
  className: z.string().optional(),
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .optional();

export const carFilterSchema = z.object({
  location: z.string().optional(),
  type: z.union([carType, z.literal('any')]).optional(),
  q: z.string().optional(),
  sort: z.enum(['featured', 'price-asc', 'price-desc', 'name']).optional(),
  date: isoDate,
  returnDate: isoDate,
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
  featured: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
});

export const carBodySchema = z.object({
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  year: z.coerce.number().int().min(1990).max(2100),
  type: carType,
  price: z.coerce.number().int().min(1),
  deposit: z.coerce.number().int().min(0),
  dailyKm: z.coerce.number().int().min(0).default(250),
  featured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  image: z.string().min(1),
  gallery: z.array(z.string()).optional().default([]),
  alt: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  transmission: z.string().optional().nullable(),
  seats: z.coerce.number().int().min(1).max(12).default(2),
  doors: z.coerce.number().int().min(2).max(6).default(2),
  powertrain: z.string().optional().nullable(),
  drivetrain: z.string().optional().nullable(),
  horsepower: z.coerce.number().int().optional().nullable(),
  acceleration: z.string().optional().nullable(),
  topSpeed: z.string().optional().nullable(),
  fuel: z.string().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().default(5),
  reviews: z.coerce.number().int().min(0).optional().default(0),
  description: z.string().optional().nullable(),
  highlights: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  included: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  badges: z.array(badgeSchema).optional().default([]),
  locations: z.array(z.string()).min(1),
});

export const carUpdateSchema = carBodySchema.partial();
