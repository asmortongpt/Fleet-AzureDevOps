/**
 * Vehicle Form Validation Schema (Zod)
 *
 * 47 fields organized into 4 sections:
 * 1. Basic Information (12 fields)
 * 2. Specifications (15 fields)
 * 3. Maintenance & Insurance (10 fields)
 * 4. Telematics & GPS (10 fields)
 *
 * Real-time validation with actionable error messages
 */

import { z } from 'zod'

// VIN validation: 17 characters, no I, O, Q
const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/
const licenseRegex = /^[A-Z0-9-]{1,10}$/

// ============================================================================
// SECTION 1: BASIC INFORMATION
// ============================================================================

export const vehicleBasicInfoSchema = z.object({
  // Required Core Fields
  vin: z.string()
    .min(17, 'VIN must be exactly 17 characters')
    .max(17, 'VIN must be exactly 17 characters')
    .regex(vinRegex, 'VIN contains invalid characters (I, O, Q not allowed)')
    .transform(val => val.toUpperCase()),

  year: z.coerce.number()
    .int('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be more than 1 year in the future'),

  make: z.string()
    .min(1, 'Make is required')
    .max(50, 'Make must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Make can only contain letters, numbers, spaces, and hyphens'),

  model: z.string()
    .min(1, 'Model is required')
    .max(50, 'Model must be less than 50 characters'),

  licensePlate: z.string()
    .min(1, 'License plate is required')
    .max(10, 'License plate must be less than 10 characters')
    .regex(licenseRegex, 'License plate format invalid')
    .transform(val => val.toUpperCase()),

  // Optional Fields with Validation
  color: z.string()
    .max(30, 'Color must be less than 30 characters')
    .optional()
    .nullable(),

  vehicleType: z.enum([
    'sedan',
    'suv',
    'truck',
    'van',
    'coupe',
    'wagon',
    'motorcycle',
    'bus',
    'trailer',
    'equipment'
  ]).optional().nullable(),

  department: z.string()
    .max(100, 'Department name too long')
    .optional()
    .nullable(),

  status: z.enum([
    'active',
    'inactive',
    'maintenance',
    'retired',
    'sold',
    'totaled'
  ]).default('active'),

  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable(),

  purchaseDate: z.coerce.date()
    .max(new Date(), 'Purchase date cannot be in the future')
    .optional()
    .nullable(),

  purchasePrice: z.coerce.number()
    .min(0, 'Purchase price cannot be negative')
    .max(10000000, 'Purchase price seems unreasonably high')
    .optional()
    .nullable(),
})

// ============================================================================
// SECTION 2: SPECIFICATIONS
// ============================================================================

export const vehicleSpecsSchema = z.object({
  engine: z.string()
    .max(100, 'Engine description too long')
    .optional()
    .nullable(),

  transmission: z.enum([
    'automatic',
    'manual',
    'cvt',
    'dual-clutch',
    'automated-manual'
  ]).optional().nullable(),

  fuelType: z.enum([
    'gasoline',
    'diesel',
    'electric',
    'hybrid',
    'plugin-hybrid',
    'e85',
    'cng',
    'lpg',
    'hydrogen'
  ]).optional().nullable(),

  mileage: z.coerce.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .max(1000000, 'Mileage seems unreasonably high')
    .optional()
    .nullable(),

  tankCapacity: z.coerce.number()
    .min(0, 'Tank capacity cannot be negative')
    .max(500, 'Tank capacity seems unreasonably high (max 500 gallons)')
    .optional()
    .nullable(),

  mpg: z.coerce.number()
    .min(0, 'MPG cannot be negative')
    .max(300, 'MPG seems unreasonably high')
    .optional()
    .nullable(),

  weight: z.coerce.number()
    .min(0, 'Weight cannot be negative')
    .max(200000, 'Weight seems unreasonably high (max 200,000 lbs)')
    .optional()
    .nullable(),

  capacity: z.coerce.number()
    .min(0, 'Capacity cannot be negative')
    .max(100, 'Capacity seems unreasonably high')
    .optional()
    .nullable(),

  towingCapacity: z.coerce.number()
    .min(0, 'Towing capacity cannot be negative')
    .max(100000, 'Towing capacity seems unreasonably high')
    .optional()
    .nullable(),

  // Additional specs
  cylinders: z.coerce.number()
    .int('Cylinders must be a whole number')
    .min(0, 'Cylinders cannot be negative')
    .max(16, 'Cylinders seems unreasonably high')
    .optional()
    .nullable(),

  horsepower: z.coerce.number()
    .int('Horsepower must be a whole number')
    .min(0, 'Horsepower cannot be negative')
    .max(2000, 'Horsepower seems unreasonably high')
    .optional()
    .nullable(),

  torque: z.coerce.number()
    .min(0, 'Torque cannot be negative')
    .max(3000, 'Torque seems unreasonably high')
    .optional()
    .nullable(),

  wheelbase: z.coerce.number()
    .min(0, 'Wheelbase cannot be negative')
    .max(500, 'Wheelbase seems unreasonably high')
    .optional()
    .nullable(),

  doors: z.coerce.number()
    .int('Doors must be a whole number')
    .min(0, 'Doors cannot be negative')
    .max(10, 'Doors seems unreasonably high')
    .optional()
    .nullable(),

  seats: z.coerce.number()
    .int('Seats must be a whole number')
    .min(1, 'Must have at least 1 seat')
    .max(100, 'Seats seems unreasonably high')
    .optional()
    .nullable(),
})

// ============================================================================
// SECTION 3: MAINTENANCE & INSURANCE
// ============================================================================

export const vehicleMaintenanceSchema = z.object({
  lastServiceDate: z.coerce.date()
    .max(new Date(), 'Service date cannot be in the future')
    .optional()
    .nullable(),

  nextServiceDate: z.coerce.date()
    .optional()
    .nullable(),

  nextServiceMileage: z.coerce.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .optional()
    .nullable(),

  insuranceProvider: z.string()
    .max(100, 'Insurance provider name too long')
    .optional()
    .nullable(),

  insurancePolicyNumber: z.string()
    .max(50, 'Policy number too long')
    .optional()
    .nullable(),

  insuranceExpirationDate: z.coerce.date()
    .optional()
    .nullable(),

  registrationExpirationDate: z.coerce.date()
    .optional()
    .nullable(),

  inspectionExpirationDate: z.coerce.date()
    .optional()
    .nullable(),

  warrantyExpirationDate: z.coerce.date()
    .optional()
    .nullable(),

  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable(),
})

// ============================================================================
// SECTION 4: TELEMATICS & GPS
// ============================================================================

export const vehicleTelematicsSchema = z.object({
  gpsDeviceId: z.string()
    .max(50, 'GPS Device ID too long')
    .optional()
    .nullable(),

  telematicsProvider: z.enum([
    'verizon-connect',
    'geotab',
    'samsara',
    'azuga',
    'fleet-complete',
    'gps-trackit',
    'teletrac-navman',
    'other',
    'none'
  ]).optional().nullable(),

  obd2DeviceId: z.string()
    .max(50, 'OBD2 Device ID too long')
    .optional()
    .nullable(),

  obd2InstallDate: z.coerce.date()
    .max(new Date(), 'Install date cannot be in the future')
    .optional()
    .nullable(),

  gpsEnabled: z.boolean()
    .default(false),

  lastGpsUpdate: z.coerce.date()
    .optional()
    .nullable(),

  currentLatitude: z.coerce.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),

  currentLongitude: z.coerce.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),

  speed: z.coerce.number()
    .min(0, 'Speed cannot be negative')
    .max(200, 'Speed seems unreasonably high')
    .optional()
    .nullable(),

  heading: z.coerce.number()
    .min(0, 'Heading must be between 0 and 360')
    .max(360, 'Heading must be between 0 and 360')
    .optional()
    .nullable(),
})

// ============================================================================
// COMBINED VEHICLE SCHEMA (ALL 47 FIELDS)
// ============================================================================

export const vehicleSchema = vehicleBasicInfoSchema
  .merge(vehicleSpecsSchema)
  .merge(vehicleMaintenanceSchema)
  .merge(vehicleTelematicsSchema)
  .refine(
    (data) => {
      // Cross-field validation: Next service must be after last service
      if (data.lastServiceDate && data.nextServiceDate) {
        return new Date(data.nextServiceDate) > new Date(data.lastServiceDate)
      }
      return true
    },
    {
      message: 'Next service date must be after last service date',
      path: ['nextServiceDate'],
    }
  )
  .refine(
    (data) => {
      // Cross-field validation: Purchase date must be before current date and after vehicle year
      if (data.purchaseDate && data.year) {
        const purchaseYear = new Date(data.purchaseDate).getFullYear()
        return purchaseYear >= data.year - 1 // Allow for model year differences
      }
      return true
    },
    {
      message: 'Purchase date must be reasonable for vehicle year',
      path: ['purchaseDate'],
    }
  )

// TypeScript type inferred from schema
export type VehicleFormData = z.infer<typeof vehicleSchema>

// Partial schema for updates (all fields optional)
export const vehicleUpdateSchema = vehicleSchema.partial()

// Export schemas for each section
export const vehicleSectionSchemas = {
  basicInfo: vehicleBasicInfoSchema,
  specs: vehicleSpecsSchema,
  maintenance: vehicleMaintenanceSchema,
  telematics: vehicleTelematicsSchema,
}
