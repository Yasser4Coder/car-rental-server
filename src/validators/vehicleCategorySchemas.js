import { z } from 'zod';
import { VEHICLE_CATEGORY_TYPES } from '../config/vehicleCategories.js';

export const vehicleCategoryBodySchema = z.object({
  type: z.enum(VEHICLE_CATEGORY_TYPES),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1000),
  image: z
    .string()
    .trim()
    .max(512)
    .optional()
    .nullable()
    .transform((v) => (v == null || v === '' ? null : v)),
  icon: z.string().trim().min(2).max(64).default('directions_car'),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const vehicleCategoryUpdateSchema = vehicleCategoryBodySchema
  .omit({ type: true })
  .partial();
