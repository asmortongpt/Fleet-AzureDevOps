import { z } from 'zod';

/**
 * Zod validation schema for Work Orders
 * Ensures all input data meets security and business requirements
 */
export const createWorkOrderSchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must not exceed 2000 characters'),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assigned_to: z.number().int().positive('Assigned user ID must be a positive integer').optional(),
  estimated_completion_date: z.string().datetime().optional(),
  notes: z.string().max(5000, 'Notes must not exceed 5000 characters').optional()
});

export const updateWorkOrderSchema = z.object({
  description: z.string().min(1).max(2000).optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigned_to: z.number().int().positive().optional(),
  estimated_completion_date: z.string().datetime().optional(),
  notes: z.string().max(5000).optional()
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
