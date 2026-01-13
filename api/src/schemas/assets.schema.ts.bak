import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Assets
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Assets include equipment, tools, trailers, and other fleet-related assets.
 */

// Asset type enum
const assetTypeEnum = z.enum([
  'trailer',
  'equipment',
  'tool',
  'container',
  'pallet',
  'generator',
  'compressor',
  'lift',
  'crane',
  'ladder',
  'safety_equipment',
  'communication_device',
  'computer',
  'software_license',
  'other'
]);

// Asset status enum
const assetStatusEnum = z.enum([
  'available',
  'in_use',
  'maintenance',
  'repair',
  'out_of_service',
  'lost',
  'stolen',
  'disposed',
  'sold',
  'retired'
]);

// Condition enum
const conditionEnum = z.enum([
  'excellent',
  'good',
  'fair',
  'poor',
  'needs_repair',
  'damaged',
  'broken'
]);

/**
 * Asset creation schema
 * POST /assets
 */
export const assetCreateSchema = z.object({
  // Asset identification (REQUIRED)
  asset_tag: z.string()
    .min(1, 'Asset tag is required')
    .max(50, 'Asset tag must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'Asset tag can only contain letters, numbers, and hyphens'),

  asset_name: z.string()
    .min(1, 'Asset name is required')
    .max(255, 'Asset name must be 255 characters or less')
    .trim(),

  asset_type: assetTypeEnum,

  category: z.string()
    .max(100, 'Category must be 100 characters or less')
    .optional(),

  // Description and specifications
  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),

  manufacturer: z.string()
    .max(255, 'Manufacturer must be 255 characters or less')
    .optional(),

  model: z.string()
    .max(255, 'Model must be 255 characters or less')
    .optional(),

  serial_number: z.string()
    .max(100, 'Serial number must be 100 characters or less')
    .optional(),

  // Financial information
  purchase_date: z.coerce.date().optional(),

  purchase_price: commonSchemas.currency.optional(),

  current_value: commonSchemas.currency.optional(),

  depreciation_rate: z.number()
    .min(0, 'Depreciation rate must be non-negative')
    .max(100, 'Depreciation rate must be 100 or less')
    .optional(),

  // Physical condition and status
  condition: conditionEnum.default('good'),

  status: assetStatusEnum.default('available'),

  // Location and assignment
  location: z.string()
    .max(255, 'Location must be 255 characters or less')
    .optional(),

  facility_id: z.string().uuid('Invalid facility ID format').optional(),

  assigned_to: z.string().uuid('Invalid user/entity ID format').optional(),

  assigned_vehicle_id: z.string().uuid('Invalid vehicle ID format').optional(),

  // Warranty and maintenance
  warranty_expiration: z.coerce.date().optional(),

  last_maintenance: z.coerce.date().optional(),

  next_maintenance_due: z.coerce.date().optional(),

  maintenance_interval_days: z.number()
    .int('Maintenance interval must be an integer')
    .positive('Maintenance interval must be positive')
    .max(3650, 'Maintenance interval exceeds maximum (10 years)')
    .optional(),

  // Tracking and identification
  barcode: z.string().max(100).optional(),

  qr_code_data: z.string().max(500).optional(),

  rfid_tag: z.string().max(100).optional(),

  // Technical specifications
  specifications: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional(),

  weight: z.number()
    .nonnegative('Weight must be non-negative')
    .max(1000000, 'Weight exceeds maximum (pounds)')
    .optional(),

  dimensions: z.object({
    length: z.number().nonnegative().optional(),
    width: z.number().nonnegative().optional(),
    height: z.number().nonnegative().optional(),
    unit: z.enum(['inches', 'feet', 'meters', 'centimeters']).default('inches')
  }).optional(),

  // Documentation
  photo_url: z.string()
    .url('Invalid photo URL')
    .max(500, 'Photo URL must be 500 characters or less')
    .optional(),

  photos: z.array(z.string().url())
    .max(50, 'Too many photos')
    .optional(),

  documents: z.array(z.string().url())
    .max(50, 'Too many documents')
    .optional(),

  manual_url: z.string()
    .url('Invalid manual URL')
    .max(500, 'Manual URL must be 500 characters or less')
    .optional(),

  // Compliance and certification
  certifications: z.array(
    z.object({
      name: z.string().max(255),
      issued_date: z.coerce.date(),
      expiry_date: z.coerce.date().optional(),
      issuing_authority: z.string().max(255).optional(),
      certificate_number: z.string().max(100).optional()
    })
  ).max(50, 'Too many certifications').optional(),

  compliance_standards: z.array(z.string().max(100))
    .max(50, 'Too many compliance standards')
    .optional(),

  // Additional information
  is_critical: z.boolean().default(false),

  requires_operator_certification: z.boolean().default(false),

  insurance_required: z.boolean().default(false),

  insurance_policy_number: z.string().max(100).optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict().refine(data => {
  // Validate that warranty_expiration is in the future if provided
  if (data.warranty_expiration) {
    return data.warranty_expiration >= new Date();
  }
  return true;
}, {
  message: 'Warranty expiration date cannot be in the past',
  path: ['warranty_expiration']
}).refine(data => {
  // If insurance required, must have policy number
  if (data.insurance_required && !data.insurance_policy_number) {
    return false;
  }
  return true;
}, {
  message: 'Insurance policy number is required when insurance is required',
  path: ['insurance_policy_number']
});

/**
 * Asset update schema
 * PUT /assets/:id
 */
export const assetUpdateSchema = z.object({
  asset_name: z.string()
    .min(1)
    .max(255)
    .trim()
    .optional(),

  asset_type: assetTypeEnum.optional(),

  category: z.string()
    .max(100)
    .nullable()
    .optional(),

  description: z.string()
    .max(2000)
    .nullable()
    .optional(),

  manufacturer: z.string()
    .max(255)
    .nullable()
    .optional(),

  model: z.string()
    .max(255)
    .nullable()
    .optional(),

  serial_number: z.string()
    .max(100)
    .nullable()
    .optional(),

  purchase_date: z.coerce.date().nullable().optional(),
  purchase_price: commonSchemas.currency.nullable().optional(),
  current_value: commonSchemas.currency.nullable().optional(),

  depreciation_rate: z.number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),

  condition: conditionEnum.optional(),
  status: assetStatusEnum.optional(),

  location: z.string()
    .max(255)
    .nullable()
    .optional(),

  facility_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  assigned_vehicle_id: z.string().uuid().nullable().optional(),

  warranty_expiration: z.coerce.date().nullable().optional(),
  last_maintenance: z.coerce.date().nullable().optional(),
  next_maintenance_due: z.coerce.date().nullable().optional(),

  maintenance_interval_days: z.number()
    .int()
    .positive()
    .max(3650)
    .nullable()
    .optional(),

  barcode: z.string().max(100).nullable().optional(),
  qr_code_data: z.string().max(500).nullable().optional(),
  rfid_tag: z.string().max(100).nullable().optional(),

  specifications: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).nullable().optional(),

  weight: z.number()
    .nonnegative()
    .max(1000000)
    .nullable()
    .optional(),

  dimensions: z.object({
    length: z.number().nonnegative().optional(),
    width: z.number().nonnegative().optional(),
    height: z.number().nonnegative().optional(),
    unit: z.enum(['inches', 'feet', 'meters', 'centimeters']).default('inches')
  }).nullable().optional(),

  photo_url: z.string()
    .url()
    .max(500)
    .nullable()
    .optional(),

  photos: z.array(z.string().url())
    .max(50)
    .nullable()
    .optional(),

  documents: z.array(z.string().url())
    .max(50)
    .nullable()
    .optional(),

  manual_url: z.string()
    .url()
    .max(500)
    .nullable()
    .optional(),

  certifications: z.array(
    z.object({
      name: z.string().max(255),
      issued_date: z.coerce.date(),
      expiry_date: z.coerce.date().optional(),
      issuing_authority: z.string().max(255).optional(),
      certificate_number: z.string().max(100).optional()
    })
  ).max(50).nullable().optional(),

  compliance_standards: z.array(z.string().max(100))
    .max(50)
    .nullable()
    .optional(),

  is_critical: z.boolean().optional(),
  requires_operator_certification: z.boolean().optional(),
  insurance_required: z.boolean().optional(),

  insurance_policy_number: z.string()
    .max(100)
    .nullable()
    .optional(),

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
 * Asset query parameters schema
 * GET /assets
 */
export const assetQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  asset_type: assetTypeEnum.optional(),
  category: z.string().max(100).optional(),
  status: assetStatusEnum.optional(),
  condition: conditionEnum.optional(),

  facility_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  assigned_vehicle_id: z.string().uuid().optional(),

  manufacturer: z.string().max(255).optional(),

  is_critical: z.coerce.boolean().optional(),
  requires_operator_certification: z.coerce.boolean().optional(),
  insurance_required: z.coerce.boolean().optional(),

  // Maintenance filtering
  maintenance_overdue: z.coerce.boolean().optional(),
  warranty_active: z.coerce.boolean().optional(),

  // Value range
  min_value: commonSchemas.currency.optional(),
  max_value: commonSchemas.currency.optional(),

  // Date range (purchase date)
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Sorting
  sort: z.enum([
    'asset_tag',
    'asset_name',
    'asset_type',
    'status',
    'condition',
    'purchase_date',
    'current_value',
    'created_at'
  ]).default('asset_tag'),
  order: z.enum(['asc', 'desc']).default('asc')
}).refine(data => {
  // Validate value range
  if (data.min_value !== undefined && data.max_value !== undefined) {
    return data.min_value <= data.max_value;
  }
  return true;
}, {
  message: 'min_value must be less than or equal to max_value'
}).refine(data => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return data.start_date <= data.end_date;
  }
  return true;
}, {
  message: 'start_date must be before or equal to end_date'
});

/**
 * Asset ID parameter schema
 */
export const assetIdSchema = z.object({
  id: z.string().uuid('Invalid asset ID format')
});

// Type exports
export type AssetCreate = z.infer<typeof assetCreateSchema>;
export type AssetUpdate = z.infer<typeof assetUpdateSchema>;
export type AssetQuery = z.infer<typeof assetQuerySchema>;
export type AssetId = z.infer<typeof assetIdSchema>;
