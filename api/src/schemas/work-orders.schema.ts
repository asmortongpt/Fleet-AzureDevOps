import { z } from 'zod';

import { commonSchemas } from '../middleware/validation';

/**
 * Comprehensive Zod validation schemas for Work Orders
 * Implements CRIT-B-003: Input validation across all API endpoints
 *
 * Work Orders include preventive maintenance, corrective repairs, and inspections.
 */

// Work order type enum
const workOrderTypeEnum = z.enum([
  'preventive',
  'corrective',
  'inspection',
  'recall',
  'warranty',
  'accident_repair',
  'modification',
  'diagnostic',
  'bodywork',
  'tire_service',
  'emergency'
]);

// Priority enum
const priorityEnum = z.enum([
  'low',
  'medium',
  'high',
  'critical',
  'urgent'
]);

// Status enum
const statusEnum = z.enum([
  'open',
  'assigned',
  'in_progress',
  'on_hold',
  'waiting_parts',
  'waiting_approval',
  'completed',
  'cancelled',
  'closed'
]);

/**
 * Work order part schema
 */
export const workOrderPartSchema = z.object({
  part_number: z.string()
    .max(100, 'Part number must be 100 characters or less'),
  part_name: z.string()
    .max(255, 'Part name must be 255 characters or less'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(1000, 'Quantity exceeds maximum'),
  unit_cost: commonSchemas.currency,
  total_cost: commonSchemas.currency.optional(),
  vendor: z.string().max(255).optional(),
  part_status: z.enum([
    'ordered',
    'in_stock',
    'backordered',
    'installed',
    'returned'
  ]).optional()
}).strict();

/**
 * Labor entry schema
 */
export const laborEntrySchema = z.object({
  technician_id: z.string().uuid().optional(),
  technician_name: z.string().max(255).optional(),
  labor_type: z.string().max(100).optional(),
  hours: z.number()
    .positive('Hours must be positive')
    .max(200, 'Hours exceeds maximum'),
  hourly_rate: commonSchemas.currency,
  total_cost: commonSchemas.currency.optional(),
  date: z.coerce.date().optional(),
  notes: z.string().max(1000).optional()
}).strict();

/**
 * Work order creation schema
 * POST /work-orders
 */
export const workOrderCreateSchema = z.object({
  // Work order identification (REQUIRED)
  work_order_number: z.string()
    .min(1, 'Work order number is required')
    .max(50, 'Work order number must be 50 characters or less')
    .regex(/^[A-Z0-9\-]+$/i, 'Work order number can only contain letters, numbers, and hyphens')
    .optional(), // Will be auto-generated if not provided

  // Vehicle (REQUIRED)
  vehicle_id: z.string().uuid('Invalid vehicle ID format'),

  // Facility and technician (OPTIONAL)
  facility_id: z.string().uuid('Invalid facility ID format').optional(),
  assigned_technician_id: z.string().uuid('Invalid technician ID format').optional(),

  // Work order classification (REQUIRED)
  type: workOrderTypeEnum,
  priority: priorityEnum.default('medium'),
  status: statusEnum.default('open'),

  // Description (REQUIRED)
  description: z.string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or less'),

  // Vehicle readings at time of work order
  odometer_reading: commonSchemas.nonNegativeNumber
    .max(9999999, 'Odometer reading exceeds maximum value')
    .optional(),

  engine_hours_reading: z.number()
    .nonnegative('Engine hours must be non-negative')
    .max(999999, 'Engine hours exceeds maximum value')
    .optional(),

  // Scheduling (OPTIONAL)
  scheduled_start: z.coerce.date().optional(),
  scheduled_end: z.coerce.date().optional(),

  actual_start: z.coerce.date().optional(),
  actual_end: z.coerce.date().optional(),

  // Parts and labor
  parts: z.array(workOrderPartSchema)
    .max(200, 'Too many parts')
    .optional(),

  labor_entries: z.array(laborEntrySchema)
    .max(100, 'Too many labor entries')
    .optional(),

  // Cost breakdown
  labor_hours: z.number()
    .nonnegative('Labor hours must be non-negative')
    .max(1000, 'Labor hours exceeds maximum')
    .optional(),

  labor_cost: commonSchemas.currency.optional(),
  parts_cost: commonSchemas.currency.optional(),

  misc_charges: commonSchemas.currency.optional(),
  tax_amount: commonSchemas.currency.optional(),
  discount_amount: commonSchemas.currency.optional(),

  // Related information
  related_inspection_id: z.string().uuid().optional(),
  related_maintenance_schedule_id: z.string().uuid().optional(),
  parent_work_order_id: z.string().uuid().optional(),

  // Documentation
  photos: z.array(z.string().url())
    .max(50, 'Too many photos')
    .optional(),

  attachments: z.array(z.string().url())
    .max(50, 'Too many attachments')
    .optional(),

  warranty_claim: z.boolean().default(false),
  warranty_claim_number: z.string().max(100).optional(),

  recall_number: z.string().max(100).optional(),

  // Additional information
  customer_complaint: z.string().max(2000).optional(),
  cause_of_failure: z.string().max(2000).optional(),
  corrective_action: z.string().max(2000).optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .optional(),

  internal_notes: z.string()
    .max(5000, 'Internal notes must be 5000 characters or less')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict().refine(data => {
  // Validate that scheduled_end is after scheduled_start if both provided
  if (data.scheduled_start && data.scheduled_end) {
    return data.scheduled_end > data.scheduled_start;
  }
  return true;
}, {
  message: 'Scheduled end date must be after scheduled start date',
  path: ['scheduled_end']
}).refine(data => {
  // Validate that actual_end is after actual_start if both provided
  if (data.actual_start && data.actual_end) {
    return data.actual_end > data.actual_start;
  }
  return true;
}, {
  message: 'Actual end date must be after actual start date',
  path: ['actual_end']
});

/**
 * Work order update schema
 * PUT /work-orders/:id
 */
export const workOrderUpdateSchema = z.object({
  assigned_technician_id: z.string().uuid().nullable().optional(),
  facility_id: z.string().uuid().nullable().optional(),

  type: workOrderTypeEnum.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),

  description: z.string()
    .min(1)
    .max(5000)
    .optional(),

  odometer_reading: commonSchemas.nonNegativeNumber
    .max(9999999)
    .nullable()
    .optional(),

  engine_hours_reading: z.number()
    .nonnegative()
    .max(999999)
    .nullable()
    .optional(),

  scheduled_start: z.coerce.date().nullable().optional(),
  scheduled_end: z.coerce.date().nullable().optional(),

  actual_start: z.coerce.date().nullable().optional(),
  actual_end: z.coerce.date().nullable().optional(),

  parts: z.array(workOrderPartSchema)
    .max(200)
    .nullable()
    .optional(),

  labor_entries: z.array(laborEntrySchema)
    .max(100)
    .nullable()
    .optional(),

  labor_hours: z.number()
    .nonnegative()
    .max(1000)
    .nullable()
    .optional(),

  labor_cost: commonSchemas.currency.nullable().optional(),
  parts_cost: commonSchemas.currency.nullable().optional(),

  misc_charges: commonSchemas.currency.nullable().optional(),
  tax_amount: commonSchemas.currency.nullable().optional(),
  discount_amount: commonSchemas.currency.nullable().optional(),

  photos: z.array(z.string().url())
    .max(50)
    .nullable()
    .optional(),

  attachments: z.array(z.string().url())
    .max(50)
    .nullable()
    .optional(),

  warranty_claim: z.boolean().optional(),
  warranty_claim_number: z.string().max(100).nullable().optional(),
  recall_number: z.string().max(100).nullable().optional(),

  customer_complaint: z.string().max(2000).nullable().optional(),
  cause_of_failure: z.string().max(2000).nullable().optional(),
  corrective_action: z.string().max(2000).nullable().optional(),

  notes: z.string()
    .max(5000)
    .nullable()
    .optional(),

  internal_notes: z.string()
    .max(5000)
    .nullable()
    .optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).nullable().optional()
}).strict();

/**
 * Work order query parameters schema
 * GET /work-orders
 */
export const workOrderQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  vehicle_id: z.string().uuid().optional(),
  facility_id: z.string().uuid().optional(),
  assigned_technician_id: z.string().uuid().optional(),

  type: workOrderTypeEnum.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),

  warranty_claim: z.coerce.boolean().optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Cost range
  min_cost: commonSchemas.currency.optional(),
  max_cost: commonSchemas.currency.optional(),

  // Related entities
  related_inspection_id: z.string().uuid().optional(),
  parent_work_order_id: z.string().uuid().optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Sorting
  sort: z.enum([
    'work_order_number',
    'created_at',
    'scheduled_start',
    'actual_start',
    'priority',
    'status',
    'total_cost'
  ]).default('created_at'),
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
  // Validate cost range
  if (data.min_cost !== undefined && data.max_cost !== undefined) {
    return data.min_cost <= data.max_cost;
  }
  return true;
}, {
  message: 'min_cost must be less than or equal to max_cost'
});

/**
 * Work order ID parameter schema
 */
export const workOrderIdSchema = z.object({
  id: z.string().uuid('Invalid work order ID format')
});

// Type exports
export type WorkOrderPart = z.infer<typeof workOrderPartSchema>;
export type LaborEntry = z.infer<typeof laborEntrySchema>;
export type WorkOrderCreate = z.infer<typeof workOrderCreateSchema>;
export type WorkOrderUpdate = z.infer<typeof workOrderUpdateSchema>;
export type WorkOrderQuery = z.infer<typeof workOrderQuerySchema>;
export type WorkOrderId = z.infer<typeof workOrderIdSchema>;
