import { z } from 'zod';

export const maintenanceSchema = z.object({
  vehicleId: z.number().int().positive(),
  timestamp: z.string().datetime(),
  maintenanceType: z.string().min(1),
  status: z.enum(['scheduled', 'in_progress', 'completed']),
  cost: z.number().min(0).optional(),
  tenantId: z.number().int().positive()
});

export type MaintenanceData = z.infer<typeof maintenanceSchema>;