import { z } from 'zod';

/**
 * Zod validation schema for Inspections
 * Ensures all input data meets security and business requirements
 */
export const createInspectionSchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer'),
  inspector_id: z.number().int().positive('Inspector ID must be a positive integer').optional(),
  inspection_type: z.enum(['pre_trip', 'post_trip', 'annual', 'safety', 'emissions', 'compliance', 'damage', 'other']),
  inspection_date: z.string().datetime().optional(),
  result: z.enum(['passed', 'failed', 'conditional', 'pending']).default('pending'),
  checklist_items: z.array(z.object({
    item: z.string(),
    passed: z.boolean(),
    notes: z.string().optional()
  })),
  overall_condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  defects_found: z.string().max(5000).optional(),
  corrective_actions_required: z.string().max(5000).optional(),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().datetime().optional(),
  odometer_reading: z.number().int().nonnegative('Odometer reading must be non-negative').optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    type: z.string()
  })).optional(),
  notes: z.string().max(5000).optional()
});

export const updateInspectionSchema = z.object({
  inspector_id: z.number().int().positive().optional(),
  inspection_type: z.enum(['pre_trip', 'post_trip', 'annual', 'safety', 'emissions', 'compliance', 'damage', 'other']).optional(),
  result: z.enum(['passed', 'failed', 'conditional', 'pending']).optional(),
  checklist_items: z.array(z.object({
    item: z.string(),
    passed: z.boolean(),
    notes: z.string().optional()
  })).optional(),
  overall_condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  defects_found: z.string().max(5000).optional(),
  corrective_actions_required: z.string().max(5000).optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().datetime().optional(),
  odometer_reading: z.number().int().nonnegative().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    type: z.string()
  })).optional(),
  notes: z.string().max(5000).optional()
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;
