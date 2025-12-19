import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Vendors
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Vendors include service providers, parts suppliers, fuel stations, etc.
 */

// Vendor type enum
const vendorTypeEnum = z.enum([
  'service_provider',
  'parts_supplier',
  'fuel_station',
  'towing_service',
  'body_shop',
  'tire_shop',
  'insurance_provider',
  'leasing_company',
  'equipment_rental',
  'consulting',
  'software_vendor',
  'other'
]);

// Vendor status enum
const vendorStatusEnum = z.enum([
  'active',
  'inactive',
  'preferred',
  'blacklisted',
  'pending_approval',
  'on_hold'
]);

/**
 * Contact person schema
 */
export const contactPersonSchema = z.object({
  name: z.string().max(255),
  title: z.string().max(100).optional(),
  email: commonSchemas.email.optional(),
  phone: commonSchemas.phone.optional(),
  is_primary: z.boolean().default(false)
}).strict();

/**
 * Vendor creation schema
 * POST /vendors
 */
export const vendorCreateSchema = z.object({
  // Vendor identification (REQUIRED)
  vendor_name: z.string()
    .min(1, 'Vendor name is required')
    .max(255, 'Vendor name must be 255 characters or less')
    .trim(),

  vendor_type: vendorTypeEnum,

  // Business information
  legal_business_name: z.string()
    .max(255, 'Legal business name must be 255 characters or less')
    .optional(),

  tax_id: z.string()
    .regex(/^\d{2}-\d{7}$|^\d{9}$/, 'Tax ID must be in format XX-XXXXXXX or XXXXXXXXX')
    .optional(),

  duns_number: z.string()
    .regex(/^\d{9}$/, 'DUNS number must be exactly 9 digits')
    .optional(),

  // Address information
  address: z.string()
    .max(255, 'Address must be 255 characters or less')
    .optional(),

  city: z.string()
    .max(100, 'City must be 100 characters or less')
    .optional(),

  state: z.string()
    .length(2, 'State must be exactly 2 characters')
    .regex(/^[A-Z]{2}$/, 'State must be a valid 2-letter code')
    .transform(val => val.toUpperCase())
    .optional(),

  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789')
    .optional(),

  country: z.string()
    .length(2, 'Country must be a 2-letter ISO code')
    .default('US'),

  // Contact information
  phone: commonSchemas.phone.optional(),

  email: commonSchemas.email.optional(),

  website: z.string()
    .url('Invalid website URL')
    .max(500, 'Website URL must be 500 characters or less')
    .optional(),

  // Contact persons
  contacts: z.array(contactPersonSchema)
    .max(50, 'Too many contacts')
    .optional(),

  // Financial information
  payment_terms: z.string()
    .max(200, 'Payment terms must be 200 characters or less')
    .optional(),

  credit_limit: commonSchemas.currency.optional(),

  discount_rate: z.number()
    .min(0, 'Discount rate must be non-negative')
    .max(100, 'Discount rate must be 100 or less')
    .optional(),

  // Vendor ratings and preferences
  is_preferred: z.boolean().default(false),

  rating: z.number()
    .min(0, 'Rating must be between 0 and 5')
    .max(5, 'Rating must be between 0 and 5')
    .optional(),

  // Certifications and insurance
  certifications: z.array(z.string().max(255))
    .max(50, 'Too many certifications')
    .optional(),

  insurance_verified: z.boolean().default(false),

  insurance_expiration: z.coerce.date().optional(),

  license_number: z.string()
    .max(100, 'License number must be 100 characters or less')
    .optional(),

  // Service capabilities
  service_categories: z.array(z.string().max(100))
    .max(50, 'Too many service categories')
    .optional(),

  service_area: z.string()
    .max(500, 'Service area must be 500 characters or less')
    .optional(),

  emergency_service_available: z.boolean().default(false),

  hours_24_7: z.boolean().default(false),

  // Status
  status: vendorStatusEnum.default('active'),

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
 * Vendor update schema
 * PUT /vendors/:id
 */
export const vendorUpdateSchema = z.object({
  vendor_name: z.string()
    .min(1)
    .max(255)
    .trim()
    .optional(),

  vendor_type: vendorTypeEnum.optional(),

  legal_business_name: z.string()
    .max(255)
    .nullable()
    .optional(),

  tax_id: z.string()
    .regex(/^\d{2}-\d{7}$|^\d{9}$/)
    .nullable()
    .optional(),

  duns_number: z.string()
    .regex(/^\d{9}$/)
    .nullable()
    .optional(),

  address: z.string()
    .max(255)
    .nullable()
    .optional(),

  city: z.string()
    .max(100)
    .nullable()
    .optional(),

  state: z.string()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .transform(val => val.toUpperCase())
    .nullable()
    .optional(),

  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/)
    .nullable()
    .optional(),

  country: z.string()
    .length(2)
    .optional(),

  phone: commonSchemas.phone.nullable().optional(),
  email: commonSchemas.email.nullable().optional(),

  website: z.string()
    .url()
    .max(500)
    .nullable()
    .optional(),

  contacts: z.array(contactPersonSchema)
    .max(50)
    .nullable()
    .optional(),

  payment_terms: z.string()
    .max(200)
    .nullable()
    .optional(),

  credit_limit: commonSchemas.currency.nullable().optional(),

  discount_rate: z.number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),

  is_preferred: z.boolean().optional(),

  rating: z.number()
    .min(0)
    .max(5)
    .nullable()
    .optional(),

  certifications: z.array(z.string().max(255))
    .max(50)
    .nullable()
    .optional(),

  insurance_verified: z.boolean().optional(),

  insurance_expiration: z.coerce.date().nullable().optional(),

  license_number: z.string()
    .max(100)
    .nullable()
    .optional(),

  service_categories: z.array(z.string().max(100))
    .max(50)
    .nullable()
    .optional(),

  service_area: z.string()
    .max(500)
    .nullable()
    .optional(),

  emergency_service_available: z.boolean().optional(),
  hours_24_7: z.boolean().optional(),

  status: vendorStatusEnum.optional(),

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
 * Vendor query parameters schema
 * GET /vendors
 */
export const vendorQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  vendor_type: vendorTypeEnum.optional(),
  status: vendorStatusEnum.optional(),

  is_preferred: z.coerce.boolean().optional(),
  emergency_service_available: z.coerce.boolean().optional(),
  hours_24_7: z.coerce.boolean().optional(),
  insurance_verified: z.coerce.boolean().optional(),

  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),

  // Rating filtering
  min_rating: z.coerce.number().min(0).max(5).optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Sorting
  sort: z.enum([
    'vendor_name',
    'vendor_type',
    'status',
    'rating',
    'created_at'
  ]).default('vendor_name'),
  order: z.enum(['asc', 'desc']).default('asc')
});

/**
 * Vendor ID parameter schema
 */
export const vendorIdSchema = z.object({
  id: z.string().uuid('Invalid vendor ID format')
});

// Type exports
export type ContactPerson = z.infer<typeof contactPersonSchema>;
export type VendorCreate = z.infer<typeof vendorCreateSchema>;
export type VendorUpdate = z.infer<typeof vendorUpdateSchema>;
export type VendorQuery = z.infer<typeof vendorQuerySchema>;
export type VendorId = z.infer<typeof vendorIdSchema>;
