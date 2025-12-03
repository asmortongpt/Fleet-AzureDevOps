import { z } from 'zod';

/**
 * Zod validation schema for Inspection
 * Auto-generated for input validation
 */

export const inspectionCreateSchema = z.object({
  // TODO: Add specific fields for inspection
  tenant_id: z.number().int().positive(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const inspectionUpdateSchema = inspectionCreateSchema.partial();

export type InspectionCreate = z.infer<typeof inspectionCreateSchema>;
export type InspectionUpdate = z.infer<typeof inspectionUpdateSchema>;

