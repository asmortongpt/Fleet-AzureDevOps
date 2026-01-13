import { z } from 'zod';

/**
 * Zod validation schema for Vehicle
 * Auto-generated for input validation
 */

export const vehicleCreateSchema = z.object({
  // TODO: Add specific fields for vehicle
  tenant_id: z.number().int().positive(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

export type VehicleCreate = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdate = z.infer<typeof vehicleUpdateSchema>;

