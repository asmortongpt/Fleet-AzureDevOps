import { z } from 'zod';

/**
 * Comprehensive Zod validation schemas for Vehicles
 * Implements CRIT-B-003: Input validation across all API endpoints
 */

// Common validators
const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
const yearMin = 1900;
const yearMax = new Date().getFullYear() + 2;

// Vehicle status enum
const vehicleStatusEnum = z.enum([
  'active',
  'inactive',
  'maintenance',
  'sold',
  'retired',
  'out_of_service'
]);

// Fuel type enum
const fuelTypeEnum = z.enum([
  'gasoline',
  'diesel',
  'electric',
  'hybrid',
  'cng',
  'propane',
  'biodiesel',
  'hydrogen'
]);

// Asset category enum
const assetCategoryEnum = z.enum([
  'vehicle',
  'heavy_equipment',
  'trailer',
  'specialized'
]);

// Power type enum
const powerTypeEnum = z.enum([
  'combustion',
  'electric',
  'hybrid',
  'manual',
  'hydraulic',
  'pneumatic'
]);

/**
 * Vehicle creation schema - validates all required fields
 */
export const vehicleCreateSchema = z.object({
  vehicleNumber: z.string()
    .min(1, 'Vehicle number is required')
    .max(50, 'Vehicle number must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'Vehicle number can only contain letters, numbers, and hyphens'),

  make: z.string()
    .min(1, 'Make is required')
    .max(100, 'Make must be 100 characters or less')
    .trim(),

  model: z.string()
    .min(1, 'Model is required')
    .max(100, 'Model must be 100 characters or less')
    .trim(),

  year: z.number()
    .int('Year must be an integer')
    .min(yearMin, `Year must be ${yearMin} or later`)
    .max(yearMax, `Year cannot be more than ${yearMax}`),

  vin: z.string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(vinRegex, 'Invalid VIN format (excludes I, O, Q)')
    .transform(val => val.toUpperCase()),

  licensePlate: z.string()
    .min(2, 'License plate must be at least 2 characters')
    .max(20, 'License plate must be 20 characters or less')
    .regex(/^[A-Z0-9\s\-]+$/i, 'Invalid license plate format')
    .transform(val => val.toUpperCase()),

  status: vehicleStatusEnum.default('active'),

  mileage: z.number()
    .int('Mileage must be an integer')
    .nonnegative('Mileage must be non-negative')
    .default(0),

  fuelType: fuelTypeEnum,

  location: z.string()
    .max(255, 'Location must be 255 characters or less')
    .optional(),

  assignedDriverId: z.number()
    .int('Driver ID must be an integer')
    .positive('Driver ID must be positive')
    .optional(),

  facilityId: z.number()
    .int('Facility ID must be an integer')
    .positive('Facility ID must be positive')
    .optional(),

  model3dId: z.number()
    .int('3D Model ID must be an integer')
    .positive('3D Model ID must be positive')
    .optional(),

  lastServiceDate: z.coerce.date().optional(),

  nextServiceDate: z.coerce.date().optional(),

  purchaseDate: z.coerce.date().optional(),

  purchasePrice: z.number()
    .nonnegative('Purchase price must be non-negative')
    .multipleOf(0.01, 'Purchase price must have at most 2 decimal places')
    .optional(),

  currentValue: z.number()
    .nonnegative('Current value must be non-negative')
    .multipleOf(0.01, 'Current value must have at most 2 decimal places')
    .optional(),

  insurancePolicyNumber: z.string()
    .max(100, 'Insurance policy number must be 100 characters or less')
    .optional(),

  registrationExpiry: z.coerce.date().optional(),

  inspectionDue: z.coerce.date().optional(),

  specifications: z.record(z.any()).optional(),

  // Multi-asset fields
  assetCategory: assetCategoryEnum.optional(),

  assetType: z.string()
    .max(100, 'Asset type must be 100 characters or less')
    .optional(),

  powerType: powerTypeEnum.optional(),

  operationalStatus: z.string()
    .max(50, 'Operational status must be 50 characters or less')
    .optional(),

  primaryMetric: z.string()
    .max(50, 'Primary metric must be 50 characters or less')
    .optional(),

  isRoadLegal: z.boolean().optional(),

  locationId: z.string().uuid('Invalid location ID format').optional(),

  groupId: z.string().uuid('Invalid group ID format').optional(),

  fleetId: z.string().uuid('Invalid fleet ID format').optional(),
}).refine(data => {
  // Validate that nextServiceDate is after lastServiceDate if both provided
  if (data.lastServiceDate && data.nextServiceDate) {
    return data.nextServiceDate > data.lastServiceDate;
  }
  return true;
}, {
  message: 'Next service date must be after last service date',
  path: ['nextServiceDate']
});

/**
 * Vehicle update schema - all fields optional
 */
export const vehicleUpdateSchema = z.object({
  vehicleNumber: z.string()
    .min(1, 'Vehicle number cannot be empty')
    .max(50, 'Vehicle number must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'Vehicle number can only contain letters, numbers, and hyphens')
    .optional(),

  make: z.string()
    .min(1, 'Make cannot be empty')
    .max(100, 'Make must be 100 characters or less')
    .trim()
    .optional(),

  model: z.string()
    .min(1, 'Model cannot be empty')
    .max(100, 'Model must be 100 characters or less')
    .trim()
    .optional(),

  year: z.number()
    .int('Year must be an integer')
    .min(yearMin, `Year must be ${yearMin} or later`)
    .max(yearMax, `Year cannot be more than ${yearMax}`)
    .optional(),

  licensePlate: z.string()
    .min(2, 'License plate must be at least 2 characters')
    .max(20, 'License plate must be 20 characters or less')
    .regex(/^[A-Z0-9\s\-]+$/i, 'Invalid license plate format')
    .transform(val => val.toUpperCase())
    .optional(),

  status: vehicleStatusEnum.optional(),

  mileage: z.number()
    .int('Mileage must be an integer')
    .nonnegative('Mileage must be non-negative')
    .optional(),

  fuelType: fuelTypeEnum.optional(),

  location: z.string()
    .max(255, 'Location must be 255 characters or less')
    .optional(),

  assignedDriverId: z.number()
    .int('Driver ID must be an integer')
    .positive('Driver ID must be positive')
    .nullable()
    .optional(),

  facilityId: z.number()
    .int('Facility ID must be an integer')
    .positive('Facility ID must be positive')
    .nullable()
    .optional(),

  model3dId: z.number()
    .int('3D Model ID must be an integer')
    .positive('3D Model ID must be positive')
    .nullable()
    .optional(),

  lastServiceDate: z.coerce.date().nullable().optional(),

  nextServiceDate: z.coerce.date().nullable().optional(),

  purchaseDate: z.coerce.date().nullable().optional(),

  purchasePrice: z.number()
    .nonnegative('Purchase price must be non-negative')
    .multipleOf(0.01, 'Purchase price must have at most 2 decimal places')
    .nullable()
    .optional(),

  currentValue: z.number()
    .nonnegative('Current value must be non-negative')
    .multipleOf(0.01, 'Current value must have at most 2 decimal places')
    .nullable()
    .optional(),

  insurancePolicyNumber: z.string()
    .max(100, 'Insurance policy number must be 100 characters or less')
    .nullable()
    .optional(),

  registrationExpiry: z.coerce.date().nullable().optional(),

  inspectionDue: z.coerce.date().nullable().optional(),

  specifications: z.record(z.any()).nullable().optional(),

  // Multi-asset fields
  assetCategory: assetCategoryEnum.optional(),

  assetType: z.string()
    .max(100, 'Asset type must be 100 characters or less')
    .nullable()
    .optional(),

  powerType: powerTypeEnum.optional(),

  operationalStatus: z.string()
    .max(50, 'Operational status must be 50 characters or less')
    .nullable()
    .optional(),

  primaryMetric: z.string()
    .max(50, 'Primary metric must be 50 characters or less')
    .nullable()
    .optional(),

  isRoadLegal: z.boolean().optional(),

  locationId: z.string().uuid('Invalid location ID format').nullable().optional(),

  groupId: z.string().uuid('Invalid group ID format').nullable().optional(),

  fleetId: z.string().uuid('Invalid fleet ID format').nullable().optional(),
});

/**
 * Vehicle query parameters schema
 */
export const vehicleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  asset_category: assetCategoryEnum.optional(),
  asset_type: z.string().optional(),
  power_type: powerTypeEnum.optional(),
  operational_status: z.string().optional(),
  primary_metric: z.string().optional(),
  is_road_legal: z.enum(['true', 'false']).optional(),
  location_id: z.string().uuid().optional(),
  group_id: z.string().uuid().optional(),
  fleet_id: z.string().uuid().optional(),
  status: vehicleStatusEnum.optional(),
  fuel_type: fuelTypeEnum.optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Vehicle ID parameter schema
 */
export const vehicleIdSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID format')
});

// Type exports
export type VehicleCreate = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdate = z.infer<typeof vehicleUpdateSchema>;
export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;
export type VehicleId = z.infer<typeof vehicleIdSchema>;
