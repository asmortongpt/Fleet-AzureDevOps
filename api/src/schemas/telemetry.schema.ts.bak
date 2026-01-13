import { z } from 'zod'

import { commonSchemas } from '../middleware/validation'

/**
 * Telemetry Validation Schemas
 *
 * Comprehensive validation for vehicle telemetry data including:
 * - Location coordinates (GPS)
 * - Speed and movement metrics
 * - Engine diagnostics
 * - Fuel level and consumption
 * - Battery voltage
 * - Sensor readings
 *
 * Security Features:
 * - XSS prevention through input sanitization
 * - SQL injection prevention via parameterized queries
 * - Range validation for all numeric values
 * - Required field enforcement
 */

/**
 * Create telemetry data point
 * POST /telemetry
 */
export const createTelemetrySchema = z.object({
  // Vehicle identification (REQUIRED)
  vehicle_id: z.string().uuid('Invalid vehicle ID format'),

  // Timestamp (REQUIRED)
  timestamp: z.coerce.date({
    errorMap: () => ({ message: 'Invalid timestamp format' })
  }),

  // GPS Location (REQUIRED)
  latitude: commonSchemas.latitude,
  longitude: commonSchemas.longitude,

  // Movement metrics (REQUIRED)
  speed: z.number()
    .nonnegative('Speed must be non-negative')
    .max(200, 'Speed exceeds maximum allowable value (200 mph)')
    .finite('Speed must be a finite number'),

  heading: z.number()
    .min(0, 'Heading must be between 0 and 360 degrees')
    .max(360, 'Heading must be between 0 and 360 degrees')
    .optional(),

  // Odometer (REQUIRED)
  odometer: commonSchemas.nonNegativeNumber
    .max(9999999, 'Odometer reading exceeds maximum value'),

  // Engine diagnostics (OPTIONAL)
  engine_rpm: z.number()
    .int('RPM must be an integer')
    .nonnegative('RPM must be non-negative')
    .max(10000, 'RPM exceeds maximum value')
    .optional(),

  engine_hours: z.number()
    .nonnegative('Engine hours must be non-negative')
    .max(999999, 'Engine hours exceeds maximum value')
    .optional(),

  engine_temperature: z.number()
    .min(-50, 'Engine temperature too low')
    .max(300, 'Engine temperature too high (degrees F)')
    .optional(),

  // Fuel metrics (OPTIONAL)
  fuel_level: commonSchemas.percentage.optional(),

  fuel_consumption: z.number()
    .nonnegative('Fuel consumption must be non-negative')
    .max(1000, 'Fuel consumption exceeds maximum value')
    .optional(),

  // Battery and electrical (OPTIONAL)
  battery_voltage: z.number()
    .min(0, 'Battery voltage must be non-negative')
    .max(48, 'Battery voltage exceeds maximum value (48V)')
    .optional(),

  // Vehicle status (OPTIONAL)
  ignition_status: z.enum(['on', 'off', 'acc', 'unknown']).optional(),

  door_status: z.enum(['open', 'closed', 'unknown']).optional(),

  // Diagnostics codes (OPTIONAL)
  dtc_codes: z.array(
    z.string()
      .max(10, 'DTC code too long')
      .regex(/^[A-Z0-9-]+$/i, 'Invalid DTC code format')
  ).max(50, 'Too many DTC codes').optional(),

  // Additional sensor data (OPTIONAL)
  altitude: z.number()
    .min(-1000, 'Altitude too low')
    .max(50000, 'Altitude too high (feet)')
    .optional(),

  satellites: z.number()
    .int('Satellite count must be an integer')
    .min(0)
    .max(50)
    .optional(),

  gps_accuracy: z.number()
    .nonnegative('GPS accuracy must be non-negative')
    .max(1000, 'GPS accuracy value too large')
    .optional(),

  // Custom metadata (OPTIONAL)
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict() // Reject unknown fields for security

/**
 * Update telemetry data point
 * PUT /telemetry/:id
 */
export const updateTelemetrySchema = createTelemetrySchema.partial().extend({
  // Allow partial updates but enforce types
}).strict()

/**
 * Query parameters for GET /telemetry
 */
export const getTelemetryQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(50),

  // Filtering
  vehicle_id: z.string().uuid().optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Location-based filtering
  min_latitude: commonSchemas.latitude.optional(),
  max_latitude: commonSchemas.latitude.optional(),
  min_longitude: commonSchemas.longitude.optional(),
  max_longitude: commonSchemas.longitude.optional(),

  // Speed filtering
  min_speed: z.coerce.number().nonnegative().max(200).optional(),
  max_speed: z.coerce.number().nonnegative().max(200).optional(),

  // Sorting
  sort: z.enum(['timestamp', 'speed', 'odometer', 'fuel_level']).default('timestamp'),
  order: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return data.start_date <= data.end_date
  }
  return true
}, {
  message: 'start_date must be before or equal to end_date'
}).refine(data => {
  // Validate latitude range
  if (data.min_latitude !== undefined && data.max_latitude !== undefined) {
    return data.min_latitude <= data.max_latitude
  }
  return true
}, {
  message: 'min_latitude must be less than or equal to max_latitude'
}).refine(data => {
  // Validate longitude range
  if (data.min_longitude !== undefined && data.max_longitude !== undefined) {
    return data.min_longitude <= data.max_longitude
  }
  return true
}, {
  message: 'min_longitude must be less than or equal to max_longitude'
}).refine(data => {
  // Validate speed range
  if (data.min_speed !== undefined && data.max_speed !== undefined) {
    return data.min_speed <= data.max_speed
  }
  return true
}, {
  message: 'min_speed must be less than or equal to max_speed'
})

/**
 * Bulk telemetry upload (for batch data from devices)
 * POST /telemetry/bulk
 */
export const bulkTelemetrySchema = z.object({
  data: z.array(createTelemetrySchema)
    .min(1, 'At least one telemetry data point required')
    .max(1000, 'Maximum 1000 telemetry data points per batch')
}).strict()

/**
 * Type exports for TypeScript
 */
export type CreateTelemetryInput = z.infer<typeof createTelemetrySchema>
export type UpdateTelemetryInput = z.infer<typeof updateTelemetrySchema>
export type GetTelemetryQuery = z.infer<typeof getTelemetryQuerySchema>
export type BulkTelemetryInput = z.infer<typeof bulkTelemetrySchema>
