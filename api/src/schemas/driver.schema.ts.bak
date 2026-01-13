import { z } from 'zod';

/**
 * Zod validation schema for Driver
 * Auto-generated for input validation
 */

export const driverCreateSchema = z.object({
  // TODO: Add specific fields for driver
  tenant_id: z.number().int().positive(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const driverUpdateSchema = driverCreateSchema.partial();

export type DriverCreate = z.infer<typeof driverCreateSchema>;
export type DriverUpdate = z.infer<typeof driverUpdateSchema>;

