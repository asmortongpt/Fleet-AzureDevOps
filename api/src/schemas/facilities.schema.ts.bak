import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Facilities
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Facilities include garages, depots, service centers, and other locations
 * where fleet vehicles are stored, maintained, or serviced.
 */

// Facility type enum
const facilityTypeEnum = z.enum([
  'garage',
  'depot',
  'service_center',
  'parking_lot',
  'warehouse',
  'fuel_station',
  'wash_station',
  'inspection_station',
  'headquarters',
  'branch_office',
  'other'
]);

// US state codes (2-letter)
const stateCodeRegex = /^[A-Z]{2}$/;

// Phone number validation
const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;

/**
 * Facility creation schema
 * POST /facilities
 */
export const facilityCreateSchema = z.object({
  name: z.string()
    .min(1, 'Facility name is required')
    .max(255, 'Facility name must be 255 characters or less')
    .trim(),

  facility_type: facilityTypeEnum,

  // Address information (OPTIONAL)
  address: z.string()
    .max(255, 'Address must be 255 characters or less')
    .trim()
    .optional(),

  city: z.string()
    .max(100, 'City must be 100 characters or less')
    .trim()
    .optional(),

  state: z.string()
    .length(2, 'State must be exactly 2 characters')
    .regex(stateCodeRegex, 'State must be a valid 2-letter code')
    .transform(val => val.toUpperCase())
    .optional(),

  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789')
    .optional(),

  // GPS coordinates (OPTIONAL but recommended)
  latitude: commonSchemas.latitude.optional(),
  longitude: commonSchemas.longitude.optional(),

  // Contact information (OPTIONAL)
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional(),

  email: commonSchemas.email.optional(),

  manager_name: z.string()
    .max(255, 'Manager name must be 255 characters or less')
    .trim()
    .optional(),

  // Capacity and capabilities (OPTIONAL)
  capacity: z.number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .max(10000, 'Capacity exceeds maximum value')
    .optional(),

  service_bays: z.number()
    .int('Service bays must be an integer')
    .nonnegative('Service bays must be non-negative')
    .max(500, 'Service bays exceeds maximum value')
    .optional(),

  has_fuel_station: z.boolean().default(false),

  has_wash_station: z.boolean().default(false),

  has_charging_stations: z.boolean().default(false),

  charging_stations_count: z.number()
    .int('Charging stations count must be an integer')
    .nonnegative('Charging stations count must be non-negative')
    .max(100, 'Charging stations count exceeds maximum')
    .optional(),

  // Operating hours (OPTIONAL)
  operating_hours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }).optional(),

  // Status
  is_active: z.boolean().default(true),

  // Additional information
  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict();

/**
 * Facility update schema
 * PUT /facilities/:id
 */
export const facilityUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Facility name cannot be empty')
    .max(255, 'Facility name must be 255 characters or less')
    .trim()
    .optional(),

  facility_type: facilityTypeEnum.optional(),

  address: z.string()
    .max(255, 'Address must be 255 characters or less')
    .trim()
    .nullable()
    .optional(),

  city: z.string()
    .max(100, 'City must be 100 characters or less')
    .trim()
    .nullable()
    .optional(),

  state: z.string()
    .length(2, 'State must be exactly 2 characters')
    .regex(stateCodeRegex, 'State must be a valid 2-letter code')
    .transform(val => val.toUpperCase())
    .nullable()
    .optional(),

  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789')
    .nullable()
    .optional(),

  latitude: commonSchemas.latitude.nullable().optional(),
  longitude: commonSchemas.longitude.nullable().optional(),

  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .nullable()
    .optional(),

  email: commonSchemas.email.nullable().optional(),

  manager_name: z.string()
    .max(255, 'Manager name must be 255 characters or less')
    .trim()
    .nullable()
    .optional(),

  capacity: z.number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .max(10000, 'Capacity exceeds maximum value')
    .nullable()
    .optional(),

  service_bays: z.number()
    .int('Service bays must be an integer')
    .nonnegative('Service bays must be non-negative')
    .max(500, 'Service bays exceeds maximum value')
    .nullable()
    .optional(),

  has_fuel_station: z.boolean().optional(),
  has_wash_station: z.boolean().optional(),
  has_charging_stations: z.boolean().optional(),

  charging_stations_count: z.number()
    .int('Charging stations count must be an integer')
    .nonnegative('Charging stations count must be non-negative')
    .max(100, 'Charging stations count exceeds maximum')
    .nullable()
    .optional(),

  operating_hours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }).nullable().optional(),

  is_active: z.boolean().optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .nullable()
    .optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).nullable().optional()
}).strict();

/**
 * Facility query parameters schema
 * GET /facilities
 */
export const facilityQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  facility_type: facilityTypeEnum.optional(),
  is_active: z.coerce.boolean().optional(),

  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().optional(),

  has_fuel_station: z.coerce.boolean().optional(),
  has_wash_station: z.coerce.boolean().optional(),
  has_charging_stations: z.coerce.boolean().optional(),

  // Capacity filtering
  min_capacity: z.coerce.number().int().positive().optional(),
  max_capacity: z.coerce.number().int().positive().optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Geospatial filtering
  near_latitude: commonSchemas.latitude.optional(),
  near_longitude: commonSchemas.longitude.optional(),
  radius_miles: z.coerce.number()
    .positive('Radius must be positive')
    .max(500, 'Radius exceeds maximum (500 miles)')
    .optional(),

  // Sorting
  sort: z.enum([
    'name',
    'facility_type',
    'city',
    'state',
    'capacity',
    'created_at',
    'updated_at'
  ]).default('name'),
  order: z.enum(['asc', 'desc']).default('asc')
}).refine(data => {
  // If capacity range provided, validate
  if (data.min_capacity !== undefined && data.max_capacity !== undefined) {
    return data.min_capacity <= data.max_capacity;
  }
  return true;
}, {
  message: 'min_capacity must be less than or equal to max_capacity'
}).refine(data => {
  // If geospatial search, must have all three parameters
  if (data.near_latitude !== undefined || data.near_longitude !== undefined || data.radius_miles !== undefined) {
    return data.near_latitude !== undefined && data.near_longitude !== undefined && data.radius_miles !== undefined;
  }
  return true;
}, {
  message: 'Geospatial search requires near_latitude, near_longitude, and radius_miles'
});

/**
 * Facility ID parameter schema
 */
export const facilityIdSchema = z.object({
  id: z.string().uuid('Invalid facility ID format')
});

// Type exports
export type FacilityCreate = z.infer<typeof facilityCreateSchema>;
export type FacilityUpdate = z.infer<typeof facilityUpdateSchema>;
export type FacilityQuery = z.infer<typeof facilityQuerySchema>;
export type FacilityId = z.infer<typeof facilityIdSchema>;
