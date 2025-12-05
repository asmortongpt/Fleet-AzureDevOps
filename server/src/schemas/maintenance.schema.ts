import { z } from 'zod';

/**
 * Zod validation schema for Maintenance Records
 * Ensures all input data meets security and business requirements
 */
export const createMaintenanceSchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer'),
  maintenance_type: z.enum(['oil_change', 'tire_rotation', 'brake_service', 'engine_repair', 'transmission', 'inspection', 'other']),
  description: z.string().min(1, 'Description is required').max(2000),
  service_date: z.string().datetime(),
  service_provider: z.string().max(255).optional(),
  cost: z.number().nonnegative('Cost must be non-negative').optional(),
  odometer_reading: z.number().int().nonnegative('Odometer reading must be non-negative'),
  next_service_date: z.string().datetime().optional(),
  next_service_odometer: z.number().int().positive().optional(),
  parts_replaced: z.string().max(2000).optional(),
  labor_hours: z.number().nonnegative('Labor hours must be non-negative').optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('completed'),
  notes: z.string().max(5000).optional()
});

export const updateMaintenanceSchema = z.object({
  maintenance_type: z.enum(['oil_change', 'tire_rotation', 'brake_service', 'engine_repair', 'transmission', 'inspection', 'other']).optional(),
  description: z.string().min(1).max(2000).optional(),
  service_date: z.string().datetime().optional(),
  service_provider: z.string().max(255).optional(),
  cost: z.number().nonnegative().optional(),
  odometer_reading: z.number().int().nonnegative().optional(),
  next_service_date: z.string().datetime().optional(),
  next_service_odometer: z.number().int().positive().optional(),
  parts_replaced: z.string().max(2000).optional(),
  labor_hours: z.number().nonnegative().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().max(5000).optional()
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
