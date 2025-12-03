import { z } from 'zod';

/**
 * Zod validation schema for WorkOrder
 * Auto-generated for input validation
 */

export const work-orderCreateSchema = z.object({
  // TODO: Add specific fields for work-order
  tenant_id: z.number().int().positive(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const work-orderUpdateSchema = work-orderCreateSchema.partial();

export type WorkOrderCreate = z.infer<typeof work-orderCreateSchema>;
export type WorkOrderUpdate = z.infer<typeof work-orderUpdateSchema>;

