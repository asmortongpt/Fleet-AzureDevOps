import { z } from 'zod';

/**
 * Zod validation schema for Maintenance
 * Auto-generated for input validation
 */

export const maintenanceCreateSchema = z.object({
  // TODO: Add specific fields for maintenance
  tenant_id: z.number().int().positive(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const maintenanceUpdateSchema = maintenanceCreateSchema.partial();

export type MaintenanceCreate = z.infer<typeof maintenanceCreateSchema>;
export type MaintenanceUpdate = z.infer<typeof maintenanceUpdateSchema>;

