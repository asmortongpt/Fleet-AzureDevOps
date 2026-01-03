/**
 * Driver Domain Schema
 *
 * Complete Zod schema for Driver entities.
 * Supports both user-linked drivers and standalone driver records.
 */

import { z } from 'zod'

import {
  emailSchema,
  phoneNumberSchema,
  statusEnum
} from './utils'

/**
 * Driver status enumeration
 */
export const driverStatusSchema = statusEnum([
  'active',
  'off-duty',
  'on-leave',
  'inactive',
  'suspended',
  'terminated'
])

/**
 * Driver license class enumeration (common US classes)
 */
export const licenseClassSchema = z.enum([
  'Class A', // Commercial heavy trucks, tractor-trailers
  'Class B', // Large passenger vehicles, dump trucks
  'Class C', // Passenger vehicles, small trucks
  'Class D', // Regular driver's license
  'Class M', // Motorcycle
  'CDL-A',   // Commercial Driver's License A
  'CDL-B',   // Commercial Driver's License B
  'CDL-C'    // Commercial Driver's License C
])

/**
 * Emergency contact schema
 */
export const emergencyContactSchema = z.object({
  name: z.string(),
  phone: phoneNumberSchema,
  relationship: z.string()
})

/**
 * Driver certification schema
 */
export const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  issue_date: z.string().datetime().optional(),
  expiration_date: z.string().datetime().optional(),
  certification_number: z.string().optional()
})

/**
 * Core Driver schema
 */
export const driverSchema = z.object({
  // Primary identification
  id: z.union([z.string().uuid(), z.string()]),
  tenant_id: z.union([z.string().uuid(), z.string()]).optional(),
  tenantId: z.string().optional(), // Frontend alias

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),

  // User linkage (if driver is linked to a user account)
  user_id: z.string().uuid().nullable().optional(),

  // Personal information
  employee_id: z.string().optional(),
  employeeId: z.string().optional(), // Frontend alias
  first_name: z.string(),
  last_name: z.string(),
  name: z.string().optional(), // Computed full name
  email: emailSchema,
  phone: phoneNumberSchema.optional(),
  avatar: z.string().url().optional(),
  photo_url: z.string().url().optional(), // Database field

  // Department and assignment
  department: z.string().optional(),
  assigned_vehicle: z.string().optional(),
  assignedVehicle: z.string().optional(), // Frontend alias
  assigned_vehicle_id: z.string().uuid().optional(),
  supervisor: z.string().optional(),

  // License information
  license_number: z.string(),
  license_type: z.string().optional(),
  licenseType: z.string().optional(), // Frontend alias
  license_class: licenseClassSchema.optional(),
  license_state: z.string().length(2).optional(), // US state abbreviation
  license_expiry: z.string().datetime(),
  licenseExpiry: z.string().optional(), // Frontend alias
  license_expiration: z.string().datetime().optional(), // Database field

  // CDL information (for commercial drivers)
  cdl_class: licenseClassSchema.optional(),
  cdl_endorsements: z.array(z.string()).optional(),
  medical_card_expiration: z.string().datetime().optional(),

  // Employment
  hire_date: z.string().datetime().optional(),
  hireDate: z.string().optional(), // Frontend alias
  termination_date: z.string().datetime().nullable().optional(),

  // Status
  status: driverStatusSchema.default('active'),

  // Performance metrics
  safety_score: z.number().min(0).max(100).optional(),
  safetyScore: z.number().min(0).max(100).optional(), // Frontend alias
  total_miles_driven: z.number().nonnegative().optional(),
  total_hours_driven: z.number().nonnegative().optional(),
  incidents_count: z.number().int().nonnegative().default(0),
  violations_count: z.number().int().nonnegative().default(0),

  // Certifications
  certifications: z.array(z.string()).optional(), // Simple string array
  certification_details: z.array(certificationSchema).optional(), // Detailed records

  // Emergency contact
  emergency_contact: emergencyContactSchema.optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: phoneNumberSchema.optional(),

  // Additional fields
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.unknown()).optional(),

  // Hours of Service (HOS) - for commercial drivers
  hos_status: z.enum(['off_duty', 'sleeper_berth', 'driving', 'on_duty']).optional(),
  hos_remaining_drive_time: z.number().nonnegative().optional(), // Minutes
  hos_remaining_duty_time: z.number().nonnegative().optional(), // Minutes
  last_hos_update: z.string().datetime().optional()
})

/**
 * Type for Driver (inferred from schema)
 */
export type Driver = z.infer<typeof driverSchema>

/**
 * Driver creation schema (excludes auto-generated fields)
 */
export const createDriverSchema = driverSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

/**
 * Type for creating a driver
 */
export type CreateDriver = z.infer<typeof createDriverSchema>

/**
 * Driver update schema (all fields optional except ID)
 */
export const updateDriverSchema = driverSchema
  .partial()
  .required({ id: true })

/**
 * Type for updating a driver
 */
export type UpdateDriver = z.infer<typeof updateDriverSchema>

/**
 * Validation function for driver data
 */
export function validateDriver(data: unknown): Driver {
  return driverSchema.parse(data)
}

/**
 * Safe validation function
 */
export function safeValidateDriver(data: unknown): {
  success: boolean
  data?: Driver
  error?: z.ZodError
} {
  const result = driverSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Array of drivers schema
 */
export const driversArraySchema = z.array(driverSchema)

/**
 * Type for array of drivers
 */
export type Drivers = z.infer<typeof driversArraySchema>

/**
 * Validate array of drivers
 */
export function validateDrivers(data: unknown): Drivers {
  return driversArraySchema.parse(data)
}

/**
 * Driver profile schema (extended with computed fields)
 */
export const driverProfileSchema = driverSchema.extend({
  full_name: z.string(),
  active_violations: z.number().int().nonnegative().optional(),
  recent_trips: z.number().int().nonnegative().optional(),
  license_status: z.enum(['valid', 'expiring_soon', 'expired', 'suspended']).optional()
})

/**
 * Type for driver profile
 */
export type DriverProfile = z.infer<typeof driverProfileSchema>

/**
 * Driver assignment schema (for assigning vehicles)
 */
export const driverAssignmentSchema = z.object({
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  assigned_at: z.string().datetime(),
  assigned_by: z.string().uuid().optional(),
  notes: z.string().optional()
})

/**
 * Type for driver assignment
 */
export type DriverAssignment = z.infer<typeof driverAssignmentSchema>
