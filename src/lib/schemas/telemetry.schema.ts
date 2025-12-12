/**
 * Telemetry Domain Schema
 *
 * Real-time vehicle telemetry data schemas for GPS, diagnostics, and sensor data.
 */

import { z } from 'zod'


/**
 * GPS location with heading and speed
 */
export const gpsLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(), // km/h or mph
  altitude: z.number().optional(), // meters
  accuracy: z.number().positive().optional(), // meters
  timestamp: z.string().datetime()
})

/**
 * Type for GPS location
 */
export type GpsLocation = z.infer<typeof gpsLocationSchema>

/**
 * OBD2 diagnostic data
 */
export const obd2DiagnosticsSchema = z.object({
  // Engine metrics
  rpm: z.number().nonnegative().optional(),
  engine_load: z.number().min(0).max(100).optional(), // percentage
  coolant_temp: z.number().optional(), // Celsius
  oil_pressure: z.number().nonnegative().optional(), // psi

  // Fuel metrics
  fuel_level: z.number().min(0).max(100).optional(), // percentage
  fuel_rate: z.number().nonnegative().optional(), // L/h or gal/h
  fuel_pressure: z.number().nonnegative().optional(), // kPa

  // Performance
  throttle_position: z.number().min(0).max(100).optional(), // percentage
  intake_air_temp: z.number().optional(), // Celsius
  maf: z.number().nonnegative().optional(), // Mass air flow g/s

  // Battery
  battery_voltage: z.number().positive().optional(), // volts

  // Odometer
  odometer: z.number().nonnegative().optional(), // km or miles

  // Trouble codes
  dtc_count: z.number().int().nonnegative().optional(),
  dtc_codes: z.array(z.string()).optional(),

  // Status
  mil_status: z.boolean().optional(), // Malfunction Indicator Lamp (Check Engine)

  timestamp: z.string().datetime()
})

/**
 * Type for OBD2 diagnostics
 */
export type Obd2Diagnostics = z.infer<typeof obd2DiagnosticsSchema>

/**
 * Electric vehicle telemetry
 */
export const evTelemetrySchema = z.object({
  // Battery
  battery_soc: z.number().min(0).max(100), // State of Charge (%)
  battery_voltage: z.number().positive().optional(),
  battery_current: z.number().optional(), // Amperes (can be negative for discharge)
  battery_temp: z.number().optional(), // Celsius
  battery_health: z.number().min(0).max(100).optional(), // %

  // Charging
  charging_status: z.enum(['not_charging', 'charging', 'fast_charging', 'complete']).optional(),
  charging_power: z.number().nonnegative().optional(), // kW
  time_to_full_charge: z.number().nonnegative().optional(), // minutes

  // Range
  estimated_range: z.number().nonnegative().optional(), // km or miles
  energy_consumption: z.number().nonnegative().optional(), // kWh/100km or kWh/100mi

  // Motor
  motor_temp: z.number().optional(), // Celsius
  inverter_temp: z.number().optional(), // Celsius

  timestamp: z.string().datetime()
})

/**
 * Type for EV telemetry
 */
export type EvTelemetry = z.infer<typeof evTelemetrySchema>

/**
 * Complete vehicle telemetry record
 */
export const telemetrySchema = z.object({
  id: z.string().uuid().optional(),
  vehicle_id: z.union([z.number().int().positive(), z.string().uuid()]),
  tenant_id: z.string().uuid().optional(),

  // Timestamp
  timestamp: z.string().datetime(),
  recorded_at: z.string().datetime().optional(), // When data was recorded by device
  received_at: z.string().datetime().optional(), // When data was received by server

  // GPS location
  location: gpsLocationSchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),

  // Diagnostics
  diagnostics: obd2DiagnosticsSchema.optional(),

  // EV-specific (if applicable)
  ev_data: evTelemetrySchema.optional(),

  // Simplified fuel/battery
  fuel_level: z.number().min(0).max(100).optional(),
  battery_voltage: z.number().positive().optional(),

  // Odometer
  odometer: z.number().nonnegative().optional(),
  engine_hours: z.number().nonnegative().optional(),

  // Status flags
  ignition_on: z.boolean().optional(),
  moving: z.boolean().optional(),
  idle: z.boolean().optional(),

  // Alerts
  alerts: z.array(z.string()).optional(),
  warning_lights: z.array(z.string()).optional(),

  // Metadata
  device_id: z.string().optional(),
  data_quality: z.enum(['good', 'fair', 'poor', 'invalid']).optional(),
  raw_data: z.record(z.unknown()).optional()
})

/**
 * Type for Telemetry
 */
export type Telemetry = z.infer<typeof telemetrySchema>

/**
 * Telemetry stream event (for real-time updates)
 */
export const telemetryEventSchema = z.object({
  event_type: z.enum(['location_update', 'diagnostic_update', 'alert', 'status_change']),
  vehicle_id: z.union([z.number(), z.string()]),
  timestamp: z.string().datetime(),
  data: telemetrySchema
})

/**
 * Type for telemetry events
 */
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>

/**
 * Validate telemetry data
 */
export function validateTelemetry(data: unknown): Telemetry {
  return telemetrySchema.parse(data)
}

/**
 * Safe telemetry validation
 */
export function safeValidateTelemetry(data: unknown): {
  success: boolean
  data?: Telemetry
  error?: z.ZodError
} {
  const result = telemetrySchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Array of telemetry records
 */
export const telemetryArraySchema = z.array(telemetrySchema)

/**
 * Type for array of telemetry
 */
export type TelemetryArray = z.infer<typeof telemetryArraySchema>

/**
 * Geofence event schema
 */
export const geofenceEventSchema = z.object({
  vehicle_id: z.union([z.number(), z.string()]),
  geofence_id: z.string(),
  geofence_name: z.string(),
  event_type: z.enum(['enter', 'exit', 'dwell']),
  timestamp: z.string().datetime(),
  location: gpsLocationSchema
})

/**
 * Type for geofence events
 */
export type GeofenceEvent = z.infer<typeof geofenceEventSchema>

/**
 * Speed alert schema
 */
export const speedAlertSchema = z.object({
  vehicle_id: z.union([z.number(), z.string()]),
  timestamp: z.string().datetime(),
  speed: z.number().nonnegative(),
  speed_limit: z.number().nonnegative(),
  location: gpsLocationSchema,
  driver_id: z.string().optional()
})

/**
 * Type for speed alerts
 */
export type SpeedAlert = z.infer<typeof speedAlertSchema>

/**
 * Trip summary schema
 */
export const tripSummarySchema = z.object({
  trip_id: z.string().uuid(),
  vehicle_id: z.union([z.number(), z.string()]),
  driver_id: z.string().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  duration_minutes: z.number().nonnegative().optional(),
  distance_km: z.number().nonnegative().optional(),
  start_location: gpsLocationSchema,
  end_location: gpsLocationSchema.optional(),
  max_speed: z.number().nonnegative().optional(),
  avg_speed: z.number().nonnegative().optional(),
  fuel_consumed: z.number().nonnegative().optional(),
  idle_time_minutes: z.number().nonnegative().optional(),
  stops_count: z.number().int().nonnegative().optional()
})

/**
 * Type for trip summary
 */
export type TripSummary = z.infer<typeof tripSummarySchema>
