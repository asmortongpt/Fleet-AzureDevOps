/**
 * Vehicle Domain Schema
 *
 * Complete Zod schema for Vehicle entities with all fields.
 * Ensures field name consistency: warranty_expiration (NOT warranty_expiry)
 */

import { z } from 'zod'

import {
  statusEnum,
  metadataSchema
} from './utils'

/**
 * Vehicle status enumeration
 */
export const vehicleStatusSchema = statusEnum([
  'active',
  'idle',
  'charging',
  'service',
  'emergency',
  'offline',
  'maintenance',
  'retired',
  'available'
])

/**
 * Vehicle type enumeration
 */
export const vehicleTypeSchema = z.enum([
  'sedan',
  'suv',
  'truck',
  'van',
  'emergency',
  'specialty',
  'tractor',
  'forklift',
  'trailer',
  'construction',
  'bus',
  'motorcycle'
])

/**
 * Fuel type enumeration
 */
export const fuelTypeSchema = z.enum([
  'gasoline',
  'diesel',
  'electric',
  'hybrid',
  'cng',
  'propane'
])

/**
 * Ownership type enumeration
 */
export const ownershipTypeSchema = z.enum([
  'owned',
  'leased',
  'rented'
])

/**
 * Asset category for multi-asset tracking
 */
export const assetCategorySchema = z.enum([
  'PASSENGER_VEHICLE',
  'LIGHT_COMMERCIAL',
  'HEAVY_TRUCK',
  'TRACTOR',
  'TRAILER',
  'HEAVY_EQUIPMENT',
  'UTILITY_VEHICLE',
  'SPECIALTY_EQUIPMENT',
  'NON_POWERED'
])

/**
 * Power type for equipment classification
 */
export const powerTypeSchema = z.enum([
  'SELF_POWERED',
  'TOWED',
  'STATIONARY',
  'PORTABLE'
])

/**
 * Primary metric for usage tracking
 */
export const primaryMetricSchema = z.enum([
  'ODOMETER',
  'ENGINE_HOURS',
  'PTO_HOURS',
  'AUX_HOURS',
  'CYCLES',
  'CALENDAR'
])

/**
 * Operational status for equipment
 */
export const operationalStatusSchema = z.enum([
  'AVAILABLE',
  'IN_USE',
  'MAINTENANCE',
  'RESERVED'
])

/**
 * Vehicle location schema
 */
export const vehicleLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional()
})

/**
 * Core Vehicle schema
 * Matches database schema with snake_case field names
 */
export const vehicleSchema = z.object({
  // Primary identification
  id: z.union([z.string().uuid(), z.string()]), // Support both UUID and legacy IDs
  tenant_id: z.union([z.string().uuid(), z.string()]).optional(),
  tenantId: z.string().optional(), // Frontend camelCase alias

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),

  // Vehicle identification
  vin: z.string().length(17),
  make: z.string(),
  model: z.string(),
  year: z.number().int().min(1900).max(2100),
  license_plate: z.string(),
  licensePlate: z.string().optional(), // Frontend alias
  number: z.string().optional(), // Vehicle number for display
  name: z.string().optional(), // Display name

  // Classification
  type: vehicleTypeSchema.optional(),
  vehicle_type: z.string().optional(), // Database field
  fuel_type: fuelTypeSchema.optional(),
  fuelType: fuelTypeSchema.optional(), // Frontend alias
  ownership: ownershipTypeSchema.optional(),

  // Status and operation
  status: vehicleStatusSchema.default('active'),
  operational_status: operationalStatusSchema.optional(),

  // Metrics
  odometer: z.number().nonnegative().optional(),
  mileage: z.number().nonnegative().optional(), // Alias for odometer
  fuel_level: z.number().min(0).max(100).optional(),
  fuelLevel: z.number().min(0).max(100).optional(), // Frontend alias
  engine_hours: z.number().nonnegative().optional(),
  hoursUsed: z.number().nonnegative().optional(), // Frontend alias
  pto_hours: z.number().nonnegative().optional(),
  aux_hours: z.number().nonnegative().optional(),
  cycle_count: z.number().nonnegative().optional(),

  // Location
  location: vehicleLocationSchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  region: z.string().optional(),
  department: z.string().optional(),

  // Assignment
  assigned_driver: z.string().optional(),
  assignedDriver: z.string().optional(), // Frontend alias
  driver: z.string().optional(), // Backwards compatibility
  assigned_driver_id: z.string().uuid().optional(),
  assigned_facility_id: z.string().uuid().optional(),

  // Maintenance tracking
  last_service: z.string().datetime().optional(),
  lastService: z.string().optional(), // Frontend alias
  next_service: z.string().datetime().optional(),
  nextService: z.string().optional(), // Frontend alias

  // CRITICAL FIX: Use warranty_expiration (NOT warranty_expiry)
  warranty_expiration: z.string().datetime().nullable().optional(),
  warrantyExpirationDate: z.string().optional(), // Frontend alias

  registration_expiry: z.string().datetime().nullable().optional(),
  insurance_expiry: z.string().datetime().nullable().optional(),
  inspection_due: z.string().datetime().nullable().optional(),

  // Purchase and value
  purchase_date: z.string().datetime().optional(),
  purchase_price: z.number().nonnegative().optional(),
  current_value: z.number().nonnegative().optional(),

  // Multi-asset extensions
  asset_category: assetCategorySchema.optional(),
  asset_type: z.string().optional(),
  power_type: powerTypeSchema.optional(),
  primary_metric: primaryMetricSchema.optional(),

  // Equipment specifications
  capacity_tons: z.number().positive().optional(),
  max_reach_feet: z.number().positive().optional(),
  lift_height_feet: z.number().positive().optional(),
  bucket_capacity_yards: z.number().positive().optional(),
  operating_weight_lbs: z.number().positive().optional(),

  // Trailer specifications
  axle_count: z.number().int().positive().optional(),
  max_payload_kg: z.number().positive().optional(),
  tank_capacity_l: z.number().positive().optional(),

  // Equipment capabilities
  has_pto: z.boolean().optional(),
  has_aux_power: z.boolean().optional(),
  is_road_legal: z.boolean().optional(),
  requires_cdl: z.boolean().optional(),
  requires_special_license: z.boolean().optional(),
  max_speed_kph: z.number().positive().optional(),
  is_off_road_only: z.boolean().optional(),

  // Asset organization
  parent_asset_id: z.string().optional(),
  group_id: z.string().optional(),
  fleet_id: z.string().optional(),
  location_id: z.string().optional(),

  // Telemetry
  gps_device_id: z.string().optional(),
  last_gps_update: z.string().datetime().optional(),
  speed: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  telematics_data: metadataSchema,

  // Additional fields
  alerts: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: metadataSchema,
  customFields: metadataSchema, // Frontend alias
  photos: z.array(z.string()).optional(),
  notes: z.string().optional()
})

/**
 * Type for Vehicle (inferred from schema)
 */
export type Vehicle = z.infer<typeof vehicleSchema>

/**
 * Vehicle creation schema (excludes auto-generated fields)
 */
export const createVehicleSchema = vehicleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

/**
 * Type for creating a vehicle
 */
export type CreateVehicle = z.infer<typeof createVehicleSchema>

/**
 * Vehicle update schema (all fields optional except ID)
 */
export const updateVehicleSchema = vehicleSchema
  .partial()
  .required({ id: true })

/**
 * Type for updating a vehicle
 */
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>

/**
 * Validation function for vehicle data
 * Throws ZodError if validation fails
 */
export function validateVehicle(data: unknown): Vehicle {
  return vehicleSchema.parse(data)
}

/**
 * Safe validation function (returns result object)
 */
export function safeValidateVehicle(data: unknown): {
  success: boolean
  data?: Vehicle
  error?: z.ZodError
} {
  const result = vehicleSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Array of vehicles schema
 */
export const vehiclesArraySchema = z.array(vehicleSchema)

/**
 * Type for array of vehicles
 */
export type Vehicles = z.infer<typeof vehiclesArraySchema>

/**
 * Validate array of vehicles
 */
export function validateVehicles(data: unknown): Vehicles {
  return vehiclesArraySchema.parse(data)
}
