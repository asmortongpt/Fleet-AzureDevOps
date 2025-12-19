import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Inspections
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Inspections include pre-trip, post-trip, safety inspections, and custom forms.
 */

// Inspection type enum
const inspectionTypeEnum = z.enum([
  'pre_trip',
  'post_trip',
  'safety',
  'annual',
  'dot',
  'emissions',
  'brake',
  'roadside',
  'preventive_maintenance',
  'custom'
]);

// Inspection status enum
const inspectionStatusEnum = z.enum([
  'pass',
  'fail',
  'needs_repair',
  'conditional_pass',
  'not_applicable',
  'in_progress',
  'cancelled'
]);

// Defect severity enum
const defectSeverityEnum = z.enum([
  'minor',
  'moderate',
  'major',
  'critical',
  'safety_hazard'
]);

/**
 * Inspection form field schema
 */
export const inspectionFormFieldSchema = z.object({
  id: z.string().uuid().optional(),
  field_name: z.string().max(200),
  field_label: z.string().max(200),
  field_type: z.enum([
    'text',
    'textarea',
    'number',
    'boolean',
    'checkbox',
    'radio',
    'select',
    'date',
    'time',
    'signature',
    'photo',
    'rating'
  ]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation_rules: z.record(z.any()).optional(),
  order: z.number().int().nonnegative().optional(),
  section: z.string().max(100).optional()
}).strict();

/**
 * Inspection form template schema
 * POST /inspection-forms
 */
export const inspectionFormCreateSchema = z.object({
  form_name: z.string()
    .min(1, 'Form name is required')
    .max(255, 'Form name must be 255 characters or less')
    .trim(),

  form_type: inspectionTypeEnum,

  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),

  form_template: z.object({
    version: z.string().default('1.0'),
    sections: z.array(
      z.object({
        name: z.string().max(200),
        description: z.string().max(500).optional(),
        order: z.number().int().nonnegative(),
        fields: z.array(inspectionFormFieldSchema)
      })
    ),
    scoring_enabled: z.boolean().default(false),
    pass_threshold: z.number().min(0).max(100).optional()
  }),

  is_active: z.boolean().default(true)
}).strict();

/**
 * Inspection defect schema
 */
export const inspectionDefectSchema = z.object({
  defect_id: z.string().uuid().optional(),
  component: z.string()
    .max(200, 'Component name must be 200 characters or less'),
  description: z.string()
    .max(2000, 'Description must be 2000 characters or less'),
  severity: defectSeverityEnum,
  requires_immediate_repair: z.boolean().default(false),
  photos: z.array(z.string().url()).max(20).optional(),
  estimated_repair_cost: commonSchemas.currency.optional(),
  corrective_action: z.string().max(1000).optional()
}).strict();

/**
 * Inspection creation schema
 * POST /inspections
 */
export const inspectionCreateSchema = z.object({
  // Vehicle and driver (REQUIRED)
  vehicle_id: z.string().uuid('Invalid vehicle ID format'),
  driver_id: z.string().uuid('Invalid driver ID format').optional(),

  // Inspection metadata (REQUIRED)
  inspection_type: inspectionTypeEnum,

  inspection_form_id: z.string().uuid('Invalid inspection form ID').optional(),

  inspection_date: z.coerce.date({
    errorMap: () => ({ message: 'Invalid inspection date format' })
  }),

  // Vehicle state at inspection
  odometer_reading: commonSchemas.nonNegativeNumber
    .max(9999999, 'Odometer reading exceeds maximum value')
    .optional(),

  engine_hours: z.number()
    .nonnegative('Engine hours must be non-negative')
    .max(999999, 'Engine hours exceeds maximum value')
    .optional(),

  // Inspection result (REQUIRED)
  status: inspectionStatusEnum,

  // Form data - responses to inspection form fields
  form_data: z.record(z.any())
    .refine(val => Object.keys(val).length > 0, {
      message: 'Form data cannot be empty'
    }),

  // Calculated score (if form has scoring enabled)
  inspection_score: z.number()
    .min(0, 'Score must be between 0 and 100')
    .max(100, 'Score must be between 0 and 100')
    .optional(),

  // Defects found (OPTIONAL)
  defects_found: z.array(inspectionDefectSchema)
    .max(100, 'Too many defects')
    .optional(),

  defects_summary: z.string()
    .max(5000, 'Defects summary must be 5000 characters or less')
    .optional(),

  // Signatures
  inspector_signature_data: z.string()
    .max(100000, 'Signature data too large')
    .optional(),

  driver_signature_data: z.string()
    .max(100000, 'Signature data too large')
    .optional(),

  // Photos
  photos: z.array(z.string().url())
    .max(50, 'Too many photos')
    .optional(),

  // Location information (OPTIONAL)
  location: z.string()
    .max(255, 'Location must be 255 characters or less')
    .optional(),

  latitude: commonSchemas.latitude.optional(),
  longitude: commonSchemas.longitude.optional(),

  // Additional information
  weather_conditions: z.string().max(200).optional(),

  temperature: z.number()
    .min(-50, 'Temperature too low')
    .max(150, 'Temperature too high (degrees F)')
    .optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .optional(),

  // Linked work orders (if defects require repair)
  created_work_order_ids: z.array(z.string().uuid())
    .max(20, 'Too many linked work orders')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict();

/**
 * Inspection update schema
 * PUT /inspections/:id
 */
export const inspectionUpdateSchema = z.object({
  status: inspectionStatusEnum.optional(),

  form_data: z.record(z.any()).optional(),

  inspection_score: z.number()
    .min(0)
    .max(100)
    .optional(),

  defects_found: z.array(inspectionDefectSchema)
    .max(100)
    .optional(),

  defects_summary: z.string()
    .max(5000)
    .nullable()
    .optional(),

  inspector_signature_data: z.string()
    .max(100000)
    .nullable()
    .optional(),

  driver_signature_data: z.string()
    .max(100000)
    .nullable()
    .optional(),

  photos: z.array(z.string().url())
    .max(50)
    .nullable()
    .optional(),

  notes: z.string()
    .max(5000)
    .nullable()
    .optional(),

  created_work_order_ids: z.array(z.string().uuid())
    .max(20)
    .nullable()
    .optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).nullable().optional()
}).strict();

/**
 * Inspection query parameters schema
 * GET /inspections
 */
export const inspectionQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  inspection_form_id: z.string().uuid().optional(),

  inspection_type: inspectionTypeEnum.optional(),
  status: inspectionStatusEnum.optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Score filtering
  min_score: z.coerce.number().min(0).max(100).optional(),
  max_score: z.coerce.number().min(0).max(100).optional(),

  // Defect filtering
  has_defects: z.coerce.boolean().optional(),
  requires_repair: z.coerce.boolean().optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Sorting
  sort: z.enum([
    'inspection_date',
    'status',
    'inspection_score',
    'vehicle_id',
    'driver_id',
    'created_at'
  ]).default('inspection_date'),
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
  // Validate score range
  if (data.min_score !== undefined && data.max_score !== undefined) {
    return data.min_score <= data.max_score;
  }
  return true;
}, {
  message: 'min_score must be less than or equal to max_score'
});

/**
 * Inspection ID parameter schema
 */
export const inspectionIdSchema = z.object({
  id: z.string().uuid('Invalid inspection ID format')
});

// Type exports
export type InspectionFormField = z.infer<typeof inspectionFormFieldSchema>;
export type InspectionFormCreate = z.infer<typeof inspectionFormCreateSchema>;
export type InspectionDefect = z.infer<typeof inspectionDefectSchema>;
export type InspectionCreate = z.infer<typeof inspectionCreateSchema>;
export type InspectionUpdate = z.infer<typeof inspectionUpdateSchema>;
export type InspectionQuery = z.infer<typeof inspectionQuerySchema>;
export type InspectionId = z.infer<typeof inspectionIdSchema>;
