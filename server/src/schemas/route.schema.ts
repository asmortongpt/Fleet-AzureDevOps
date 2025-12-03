import { z } from 'zod';

/**
 * Zod validation schema for Routes
 * Ensures all input data meets security and business requirements
 */
export const createRouteSchema = z.object({
  route_name: z.string().min(1, 'Route name is required').max(255),
  description: z.string().max(2000).optional(),
  start_location: z.string().min(1, 'Start location is required').max(255),
  end_location: z.string().min(1, 'End location is required').max(255),
  waypoints: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional()
  })).optional(),
  distance_miles: z.number().positive('Distance must be positive'),
  estimated_duration_minutes: z.number().int().positive('Duration must be positive'),
  assigned_vehicle_id: z.number().int().positive().optional(),
  assigned_driver_id: z.number().int().positive().optional(),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  scheduled_start_time: z.string().datetime().optional(),
  notes: z.string().max(5000).optional()
});

export const updateRouteSchema = z.object({
  route_name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  start_location: z.string().min(1).max(255).optional(),
  end_location: z.string().min(1).max(255).optional(),
  waypoints: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional()
  })).optional(),
  distance_miles: z.number().positive().optional(),
  estimated_duration_minutes: z.number().int().positive().optional(),
  assigned_vehicle_id: z.number().int().positive().optional(),
  assigned_driver_id: z.number().int().positive().optional(),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).optional(),
  scheduled_start_time: z.string().datetime().optional(),
  actual_start_time: z.string().datetime().optional(),
  actual_end_time: z.string().datetime().optional(),
  notes: z.string().max(5000).optional()
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
