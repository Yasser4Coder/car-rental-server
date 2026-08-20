import { z } from 'zod';

export const whyChooseUsBodySchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1000),
  icon: z.string().trim().min(2).max(64).default('verified'),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const whyChooseUsUpdateSchema = whyChooseUsBodySchema.partial();
