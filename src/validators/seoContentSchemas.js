import { z } from 'zod';

export const seoContentUpdateSchema = z.object({
  title: z.string().trim().min(5).max(200).optional(),
  body: z.string().trim().min(100).max(20000).optional(),
  isActive: z.boolean().optional(),
});
