import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Routes
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Routes include planned routes, optimized routes, and route tracking.
 */

// Route status enum
const routeStatusEnum = z.enum([
  'planned',
  'in_progress',
  'completed',
  'cancelled',
  'delayed',
  'rerouted'
]);

/**
 * Waypoint schema
 */
export const waypointSchema = z.object({
  order: z.number().int().nonnegative(),
  address: z.string().max(500),
  latitude: commonSchemas.latitude,
  longitude: commonSchemas.longitude,
  arrival_time: z.coerce.date().optional(),
  departure_time: z.coerce.date().optional(),
  duration_minutes: z.number().int().nonnegative().optional(),
  stop_type: z.enum(['pickup', 'delivery', 'service', 'waypoint', 'rest_stop']).optional(),
  notes: z.string().max(1000).optional(),
  completed: z.boolean().default(false),
  actual_arrival_time: z.coerce.date().optional()
}).strict();

/**
 * Route creation schema
 * POST /routes
 */
export const routeCreateSchema = z.object({
  // Route identification (REQUIRED)
  route_name: z.string()
    .min(1, 'Route name is required')
    .max(255, 'Route name must be 255 characters or less')
    .trim(),

  // Assignment (OPTIONAL)
  vehicle_id: z.string().uuid('Invalid vehicle ID format').optional(),
  driver_id: z.string().uuid('Invalid driver ID format').optional(),

  // Status
  status: routeStatusEnum.default('planned'),

  // Locations (REQUIRED)
  start_location: z.string()
    .min(1, 'Start location is required')
    .max(255, 'Start location must be 255 characters or less'),

  start_latitude: commonSchemas.latitude.optional(),
  start_longitude: commonSchemas.longitude.optional(),

  end_location: z.string()
    .min(1, 'End location is required')
    .max(255, 'End location must be 255 characters or less'),

  end_latitude: commonSchemas.latitude.optional(),
  end_longitude: commonSchemas.longitude.optional(),

  // Timing (REQUIRED)
  planned_start_time: z.coerce.date({
    errorMap: () => ({ message: 'Invalid planned start time format' })
  }),

  planned_end_time: z.coerce.date({
    errorMap: () => ({ message: 'Invalid planned end time format' })
  }),

  actual_start_time: z.coerce.date().optional(),
  actual_end_time: z.coerce.date().optional(),

  // Distance and duration
  total_distance: z.number()
    .nonnegative('Total distance must be non-negative')
    .max(10000, 'Total distance exceeds maximum (10,000 miles)')
    .optional(),

  estimated_duration: z.number()
    .int('Estimated duration must be an integer')
    .positive('Estimated duration must be positive')
    .max(10080, 'Estimated duration exceeds maximum (7 days in minutes)')
    .optional(),

  actual_duration: z.number()
    .int('Actual duration must be an integer')
    .nonnegative('Actual duration must be non-negative')
    .max(10080, 'Actual duration exceeds maximum')
    .optional(),

  // Waypoints (OPTIONAL)
  waypoints: z.array(waypointSchema)
    .max(100, 'Too many waypoints')
    .optional(),

  optimized_waypoints: z.array(waypointSchema)
    .max(100, 'Too many optimized waypoints')
    .optional(),

  // Route geometry (GeoJSON LineString)
  route_geometry: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(
      z.tuple([z.number(), z.number()]) // [longitude, latitude]
    )
  }).optional(),

  // Optimization settings
  optimization_settings: z.object({
    avoid_highways: z.boolean().default(false),
    avoid_tolls: z.boolean().default(false),
    avoid_ferries: z.boolean().default(false),
    prefer_shortest_distance: z.boolean().default(false),
    max_stops_per_route: z.number().int().positive().max(100).optional(),
    time_window_start: z.string().optional(),
    time_window_end: z.string().optional()
  }).optional(),

  // Cost tracking
  estimated_fuel_cost: commonSchemas.currency.optional(),
  actual_fuel_cost: commonSchemas.currency.optional(),

  toll_costs: commonSchemas.currency.optional(),

  // Additional information
  route_type: z.enum([
    'delivery',
    'pickup',
    'service',
    'transport',
    'patrol',
    'multi_stop',
    'round_trip',
    'one_way'
  ]).optional(),

  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),

  customer_id: z.string().uuid().optional(),

  load_details: z.string().max(2000).optional(),

  special_instructions: z.string().max(2000).optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict().refine(data => {
  // Validate that planned_end_time is after planned_start_time
  return data.planned_end_time > data.planned_start_time;
}, {
  message: 'Planned end time must be after planned start time',
  path: ['planned_end_time']
}).refine(data => {
  // Validate actual times if provided
  if (data.actual_start_time && data.actual_end_time) {
    return data.actual_end_time > data.actual_start_time;
  }
  return true;
}, {
  message: 'Actual end time must be after actual start time',
  path: ['actual_end_time']
});

/**
 * Route update schema
 * PUT /routes/:id
 */
export const routeUpdateSchema = z.object({
  route_name: z.string()
    .min(1)
    .max(255)
    .trim()
    .optional(),

  vehicle_id: z.string().uuid().nullable().optional(),
  driver_id: z.string().uuid().nullable().optional(),

  status: routeStatusEnum.optional(),

  actual_start_time: z.coerce.date().nullable().optional(),
  actual_end_time: z.coerce.date().nullable().optional(),

  actual_duration: z.number()
    .int()
    .nonnegative()
    .max(10080)
    .nullable()
    .optional(),

  waypoints: z.array(waypointSchema)
    .max(100)
    .nullable()
    .optional(),

  optimized_waypoints: z.array(waypointSchema)
    .max(100)
    .nullable()
    .optional(),

  route_geometry: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(z.tuple([z.number(), z.number()]))
  }).nullable().optional(),

  actual_fuel_cost: commonSchemas.currency.nullable().optional(),
  toll_costs: commonSchemas.currency.nullable().optional(),

  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),

  notes: z.string()
    .max(5000)
    .nullable()
    .optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).nullable().optional()
}).strict();

/**
 * Route query parameters schema
 * GET /routes
 */
export const routeQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),

  status: routeStatusEnum.optional(),
  route_type: z.enum([
    'delivery',
    'pickup',
    'service',
    'transport',
    'patrol',
    'multi_stop',
    'round_trip',
    'one_way'
  ]).optional(),

  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Distance filtering
  min_distance: z.coerce.number().nonnegative().optional(),
  max_distance: z.coerce.number().nonnegative().optional(),

  // Duration filtering (minutes)
  min_duration: z.coerce.number().int().nonnegative().optional(),
  max_duration: z.coerce.number().int().nonnegative().optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Sorting
  sort: z.enum([
    'route_name',
    'planned_start_time',
    'actual_start_time',
    'total_distance',
    'status',
    'priority',
    'created_at'
  ]).default('planned_start_time'),
  order: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return data.start_date <= data.end_date;
  }
  return true;
}, {
  message: 'start_date must be before or equal to end_date'
}).refine(data => {
  // Validate distance range
  if (data.min_distance !== undefined && data.max_distance !== undefined) {
    return data.min_distance <= data.max_distance;
  }
  return true;
}, {
  message: 'min_distance must be less than or equal to max_distance'
}).refine(data => {
  // Validate duration range
  if (data.min_duration !== undefined && data.max_duration !== undefined) {
    return data.min_duration <= data.max_duration;
  }
  return true;
}, {
  message: 'min_duration must be less than or equal to max_duration'
});

/**
 * Route optimization request schema
 * POST /routes/:id/optimize
 */
export const routeOptimizationSchema = z.object({
  optimization_type: z.enum([
    'shortest_distance',
    'fastest_time',
    'balanced',
    'fuel_efficient',
    'avoid_traffic'
  ]).default('balanced'),

  avoid_highways: z.boolean().default(false),
  avoid_tolls: z.boolean().default(false),
  avoid_ferries: z.boolean().default(false),

  departure_time: z.coerce.date().optional(),

  max_stops_per_route: z.number()
    .int()
    .positive()
    .max(100)
    .optional()
}).strict();

/**
 * Route ID parameter schema
 */
export const routeIdSchema = z.object({
  id: z.string().uuid('Invalid route ID format')
});

// Type exports
export type Waypoint = z.infer<typeof waypointSchema>;
export type RouteCreate = z.infer<typeof routeCreateSchema>;
export type RouteUpdate = z.infer<typeof routeUpdateSchema>;
export type RouteQuery = z.infer<typeof routeQuerySchema>;
export type RouteOptimization = z.infer<typeof routeOptimizationSchema>;
export type RouteId = z.infer<typeof routeIdSchema>;
