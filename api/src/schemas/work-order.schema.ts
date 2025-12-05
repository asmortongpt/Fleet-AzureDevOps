import { z } from 'zod';

/**
 * Zod validation schema for WorkOrder
 * Auto-generated for input validation
 */

export const workOrderCreateSchema = z.object({
  // Fields defined inline in work-orders.ts route file (lines 21-35)
  // This schema is not currently used - route uses inline schema instead
  tenant_id: z.number().int().positive(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const workOrderUpdateSchema = workOrderCreateSchema.partial();

export type WorkOrderCreate = z.infer<typeof workOrderCreateSchema>;
export type WorkOrderUpdate = z.infer<typeof workOrderUpdateSchema>;

