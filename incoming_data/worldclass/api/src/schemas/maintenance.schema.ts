import { z } from 'zod';

/**
 * Comprehensive Zod validation schemas for Maintenance Records
 * Implements CRIT-B-003: Input validation across all API endpoints
 */

// Maintenance priority enum
const priorityEnum = z.enum([
  'low',
  'medium',
  'high',
  'critical',
  'urgent'
]);

// Maintenance status enum
const statusEnum = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'pending',
  'on_hold'
]);

// Service type enum
const serviceTypeEnum = z.enum([
  'oil_change',
  'tire_rotation',
  'brake_service',
  'inspection',
  'repair',
  'preventive',
  'corrective',
  'recall',
  'diagnostic',
  'bodywork',
  'electrical',
  'transmission',
  'engine',
  'hvac',
  'other'
]);

/**
 * Maintenance record creation schema
 */
export const maintenanceCreateSchema = z.object({
  vehicleId: z.number()
    .int('Vehicle ID must be an integer')
    .positive('Vehicle ID must be positive'),

  vehicleNumber: z.string()
    .min(1, 'Vehicle number is required')
    .max(50, 'Vehicle number must be 50 characters or less'),

  serviceType: serviceTypeEnum,

  serviceDate: z.coerce.date(),

  nextDue: z.coerce.date().optional(),

  mileageAtService: z.number()
    .int('Mileage must be an integer')
    .nonnegative('Mileage must be non-negative')
    .optional(),

  nextDueMileage: z.number()
    .int('Next due mileage must be an integer')
    .positive('Next due mileage must be positive')
    .optional(),

  priority: priorityEnum.default('medium'),

  status: statusEnum.default('scheduled'),

  estimatedCost: z.number()
    .nonnegative('Estimated cost must be non-negative')
    .multipleOf(0.01, 'Estimated cost must have at most 2 decimal places')
    .optional(),

  actualCost: z.number()
    .nonnegative('Actual cost must be non-negative')
    .multipleOf(0.01, 'Actual cost must have at most 2 decimal places')
    .optional(),

  vendor: z.string()
    .max(255, 'Vendor name must be 255 characters or less')
    .optional(),

  technicianName: z.string()
    .max(255, 'Technician name must be 255 characters or less')
    .optional(),

  partsReplaced: z.array(z.object({
    partNumber: z.string(),
    partName: z.string(),
    quantity: z.number().int().positive(),
    unitCost: z.number().nonnegative().multipleOf(0.01),
  })).optional(),

  workPerformed: z.string()
    .max(5000, 'Work performed description must be 5000 characters or less')
    .optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .optional(),

  invoiceUrl: z.string()
    .url('Invalid invoice URL')
    .max(500, 'Invoice URL must be 500 characters or less')
    .optional(),
}).refine(data => {
  // Validate that nextDue is after serviceDate if both provided
  if (data.serviceDate && data.nextDue) {
    return data.nextDue > data.serviceDate;
  }
  return true;
}, {
  message: 'Next due date must be after service date',
  path: ['nextDue']
}).refine(data => {
  // Validate that nextDueMileage is greater than mileageAtService if both provided
  if (data.mileageAtService && data.nextDueMileage) {
    return data.nextDueMileage > data.mileageAtService;
  }
  return true;
}, {
  message: 'Next due mileage must be greater than current mileage',
  path: ['nextDueMileage']
});

/**
 * Maintenance record update schema
 */
export const maintenanceUpdateSchema = z.object({
  vehicleNumber: z.string()
    .min(1, 'Vehicle number cannot be empty')
    .max(50, 'Vehicle number must be 50 characters or less')
    .optional(),

  serviceType: serviceTypeEnum.optional(),

  serviceDate: z.coerce.date().optional(),

  nextDue: z.coerce.date().nullable().optional(),

  mileageAtService: z.number()
    .int('Mileage must be an integer')
    .nonnegative('Mileage must be non-negative')
    .nullable()
    .optional(),

  nextDueMileage: z.number()
    .int('Next due mileage must be an integer')
    .positive('Next due mileage must be positive')
    .nullable()
    .optional(),

  priority: priorityEnum.optional(),

  status: statusEnum.optional(),

  estimatedCost: z.number()
    .nonnegative('Estimated cost must be non-negative')
    .multipleOf(0.01, 'Estimated cost must have at most 2 decimal places')
    .nullable()
    .optional(),

  actualCost: z.number()
    .nonnegative('Actual cost must be non-negative')
    .multipleOf(0.01, 'Actual cost must have at most 2 decimal places')
    .nullable()
    .optional(),

  vendor: z.string()
    .max(255, 'Vendor name must be 255 characters or less')
    .nullable()
    .optional(),

  technicianName: z.string()
    .max(255, 'Technician name must be 255 characters or less')
    .nullable()
    .optional(),

  partsReplaced: z.array(z.object({
    partNumber: z.string(),
    partName: z.string(),
    quantity: z.number().int().positive(),
    unitCost: z.number().nonnegative().multipleOf(0.01),
  })).nullable().optional(),

  workPerformed: z.string()
    .max(5000, 'Work performed description must be 5000 characters or less')
    .nullable()
    .optional(),

  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .nullable()
    .optional(),

  invoiceUrl: z.string()
    .url('Invalid invoice URL')
    .max(500, 'Invoice URL must be 500 characters or less')
    .nullable()
    .optional(),
});

/**
 * Maintenance query parameters schema
 */
export const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  vehicleId: z.coerce.number().int().positive().optional(),
  vehicleNumber: z.string().optional(),
  serviceType: serviceTypeEnum.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  vendor: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
}).refine(data => {
  // Validate date range
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate']
});

/**
 * Maintenance ID parameter schema
 */
export const maintenanceIdSchema = z.object({
  id: z.string().uuid('Invalid maintenance record ID format')
});

// Type exports
export type MaintenanceCreate = z.infer<typeof maintenanceCreateSchema>;
export type MaintenanceUpdate = z.infer<typeof maintenanceUpdateSchema>;
export type MaintenanceQuery = z.infer<typeof maintenanceQuerySchema>;
export type MaintenanceId = z.infer<typeof maintenanceIdSchema>;
