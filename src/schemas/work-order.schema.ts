import { z } from 'zod'

// ============================================================================
// SECTION 1: WORK ORDER DETAILS
// ============================================================================

export const workOrderDetailsSchema = z.object({
  // Required Core Fields
  workOrderNumber: z.string()
    .min(1, 'Work order number is required')
    .max(20, 'Work order number must be less than 20 characters')
    .regex(/^WO-\d{6,10}$/, 'Work order number must be in format WO-XXXXXX')
    .transform(val => val.toUpperCase()),

  vehicleId: z.string()
    .min(1, 'Vehicle is required')
    .uuid('Invalid vehicle ID format'),

  workType: z.enum([
    'preventive-maintenance',
    'repair',
    'inspection',
    'recall',
    'modification',
    'accident-repair',
    'warranty',
    'emergency'
  ]),

  priority: z.enum([
    'low',
    'medium',
    'high',
    'critical'
  ]).default('medium'),

  status: z.enum([
    'pending',
    'scheduled',
    'in-progress',
    'on-hold',
    'completed',
    'cancelled'
  ]).default('pending'),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),

  // Optional Fields
  requestedBy: z.string()
    .max(100, 'Requestor name must be less than 100 characters')
    .optional()
    .nullable(),

  requestDate: z.coerce.date()
    .max(new Date(), 'Request date cannot be in the future')
    .optional()
    .nullable(),

  scheduledDate: z.coerce.date()
    .optional()
    .nullable(),

  dueDate: z.coerce.date()
    .optional()
    .nullable(),

  assignedTo: z.string()
    .max(100, 'Technician name must be less than 100 characters')
    .optional()
    .nullable(),

  facility: z.string()
    .max(100, 'Facility name must be less than 100 characters')
    .optional()
    .nullable(),
})

// ============================================================================
// SECTION 2: PARTS & LABOR
// ============================================================================

export const workOrderPartsLaborSchema = z.object({
  // Labor Details
  estimatedHours: z.coerce.number()
    .min(0, 'Estimated hours cannot be negative')
    .max(1000, 'Estimated hours seems unreasonably high')
    .optional()
    .nullable(),

  actualHours: z.coerce.number()
    .min(0, 'Actual hours cannot be negative')
    .max(1000, 'Actual hours seems unreasonably high')
    .optional()
    .nullable(),

  laborRate: z.coerce.number()
    .min(0, 'Labor rate cannot be negative')
    .max(500, 'Labor rate seems unreasonably high (max $500/hour)')
    .optional()
    .nullable(),

  laborCost: z.coerce.number()
    .min(0, 'Labor cost cannot be negative')
    .max(100000, 'Labor cost seems unreasonably high')
    .optional()
    .nullable(),

  // Parts Details
  partsCost: z.coerce.number()
    .min(0, 'Parts cost cannot be negative')
    .max(100000, 'Parts cost seems unreasonably high')
    .optional()
    .nullable(),

  partsUsed: z.array(z.object({
    partNumber: z.string().min(1, 'Part number required'),
    description: z.string().min(1, 'Part description required'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative'),
    totalCost: z.coerce.number().min(0, 'Total cost cannot be negative'),
  })).optional().nullable(),

  additionalCharges: z.coerce.number()
    .min(0, 'Additional charges cannot be negative')
    .max(50000, 'Additional charges seem unreasonably high')
    .optional()
    .nullable(),

  additionalChargesDescription: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
})

// ============================================================================
// SECTION 3: COMPLETION & BILLING
// ============================================================================

export const workOrderCompletionSchema = z.object({
  // Completion Details
  startDate: z.coerce.date()
    .optional()
    .nullable(),

  completionDate: z.coerce.date()
    .optional()
    .nullable(),

  completionNotes: z.string()
    .max(2000, 'Completion notes must be less than 2000 characters')
    .optional()
    .nullable(),

  // Billing Details
  totalCost: z.coerce.number()
    .min(0, 'Total cost cannot be negative')
    .max(500000, 'Total cost seems unreasonably high')
    .optional()
    .nullable(),

  invoiceNumber: z.string()
    .max(50, 'Invoice number must be less than 50 characters')
    .optional()
    .nullable(),

  invoiceDate: z.coerce.date()
    .optional()
    .nullable(),

  paymentStatus: z.enum([
    'pending',
    'paid',
    'partial',
    'overdue',
    'waived'
  ]).default('pending'),

  warranty: z.boolean()
    .default(false),

  warrantyExpirationDate: z.coerce.date()
    .optional()
    .nullable(),

  // Mileage Tracking
  mileageIn: z.coerce.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .optional()
    .nullable(),

  mileageOut: z.coerce.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .optional()
    .nullable(),
})

// ============================================================================
// COMBINED WORK ORDER SCHEMA (ALL 28 FIELDS)
// ============================================================================

export const workOrderSchema = workOrderDetailsSchema
  .merge(workOrderPartsLaborSchema)
  .merge(workOrderCompletionSchema)
  .refine(
    (data) => {
      // Validation: Scheduled date must be after request date
      if (data.requestDate && data.scheduledDate) {
        return new Date(data.scheduledDate) >= new Date(data.requestDate)
      }
      return true
    },
    {
      message: 'Scheduled date must be on or after request date',
      path: ['scheduledDate'],
    }
  )
  .refine(
    (data) => {
      // Validation: Due date must be after scheduled date
      if (data.scheduledDate && data.dueDate) {
        return new Date(data.dueDate) >= new Date(data.scheduledDate)
      }
      return true
    },
    {
      message: 'Due date must be on or after scheduled date',
      path: ['dueDate'],
    }
  )
  .refine(
    (data) => {
      // Validation: Completion date must be after start date
      if (data.startDate && data.completionDate) {
        return new Date(data.completionDate) >= new Date(data.startDate)
      }
      return true
    },
    {
      message: 'Completion date must be on or after start date',
      path: ['completionDate'],
    }
  )
  .refine(
    (data) => {
      // Validation: Mileage out must be >= mileage in
      if (data.mileageIn != null && data.mileageOut != null) {
        return data.mileageOut >= data.mileageIn
      }
      return true
    },
    {
      message: 'Mileage out must be greater than or equal to mileage in',
      path: ['mileageOut'],
    }
  )
  .refine(
    (data) => {
      // Validation: Actual hours must be reasonable vs estimated
      if (data.estimatedHours != null && data.actualHours != null) {
        // Allow up to 3x estimated hours
        return data.actualHours <= data.estimatedHours * 3
      }
      return true
    },
    {
      message: 'Actual hours significantly exceed estimate (>3x) - please verify',
      path: ['actualHours'],
    }
  )
  .refine(
    (data) => {
      // Validation: Calculate labor cost if hours and rate provided
      if (data.actualHours != null && data.laborRate != null) {
        const calculatedCost = data.actualHours * data.laborRate
        if (data.laborCost != null && Math.abs(data.laborCost - calculatedCost) > 1) {
          return false
        }
      }
      return true
    },
    {
      message: 'Labor cost does not match hours × rate',
      path: ['laborCost'],
    }
  )
  .refine(
    (data) => {
      // Validation: Invoice date required if invoice number provided
      if (data.invoiceNumber && !data.invoiceDate) {
        return false
      }
      return true
    },
    {
      message: 'Invoice date required when invoice number is provided',
      path: ['invoiceDate'],
    }
  )
  .refine(
    (data) => {
      // Validation: Warranty expiration required if warranty enabled
      if (data.warranty && !data.warrantyExpirationDate) {
        return false
      }
      return true
    },
    {
      message: 'Warranty expiration date required when warranty is enabled',
      path: ['warrantyExpirationDate'],
    }
  )

// TypeScript type inferred from schema
export type WorkOrderFormData = z.infer<typeof workOrderSchema>

// Partial schema for updates (all fields optional)
export const workOrderUpdateSchema = z.object({
  workOrderNumber: workOrderSchema.shape.workOrderNumber.optional(),
  vehicleId: workOrderSchema.shape.vehicleId.optional(),
  workType: workOrderSchema.shape.workType.optional(),
  priority: workOrderSchema.shape.priority.optional(),
  status: workOrderSchema.shape.status.optional(),
  description: workOrderSchema.shape.description.optional(),
  requestedBy: workOrderSchema.shape.requestedBy.optional(),
  requestDate: workOrderSchema.shape.requestDate.optional(),
  scheduledDate: workOrderSchema.shape.scheduledDate.optional(),
  dueDate: workOrderSchema.shape.dueDate.optional(),
  assignedTo: workOrderSchema.shape.assignedTo.optional(),
  facility: workOrderSchema.shape.facility.optional(),
  estimatedHours: workOrderSchema.shape.estimatedHours.optional(),
  actualHours: workOrderSchema.shape.actualHours.optional(),
  laborRate: workOrderSchema.shape.laborRate.optional(),
  laborCost: workOrderSchema.shape.laborCost.optional(),
  partsCost: workOrderSchema.shape.partsCost.optional(),
  partsUsed: workOrderSchema.shape.partsUsed.optional(),
  additionalCharges: workOrderSchema.shape.additionalCharges.optional(),
  additionalChargesDescription: workOrderSchema.shape.additionalChargesDescription.optional(),
  startDate: workOrderSchema.shape.startDate.optional(),
  completionDate: workOrderSchema.shape.completionDate.optional(),
  completionNotes: workOrderSchema.shape.completionNotes.optional(),
  totalCost: workOrderSchema.shape.totalCost.optional(),
  invoiceNumber: workOrderSchema.shape.invoiceNumber.optional(),
  invoiceDate: workOrderSchema.shape.invoiceDate.optional(),
  paymentStatus: workOrderSchema.shape.paymentStatus.optional(),
  warranty: workOrderSchema.shape.warranty.optional(),
  warrantyExpirationDate: workOrderSchema.shape.warrantyExpirationDate.optional(),
  mileageIn: workOrderSchema.shape.mileageIn.optional(),
  mileageOut: workOrderSchema.shape.mileageOut.optional(),
})

// Export schemas for each section
export const workOrderSectionSchemas = {
  details: workOrderDetailsSchema,
  partsLabor: workOrderPartsLaborSchema,
  completion: workOrderCompletionSchema,
}

// Helper function to calculate total cost
export function calculateTotalCost(data: Partial<WorkOrderFormData>): number {
  const laborCost = data.laborCost || 0
  const partsCost = data.partsCost || 0
  const additionalCharges = data.additionalCharges || 0

  return laborCost + partsCost + additionalCharges
}

// Helper function to calculate labor cost
export function calculateLaborCost(hours: number, rate: number): number {
  return Number((hours * rate).toFixed(2))
}

// Helper function to check if work order is overdue
export function isWorkOrderOverdue(dueDate: Date | null, status: string): boolean {
  if (!dueDate || status === 'completed' || status === 'cancelled') {
    return false
  }

  return new Date() > new Date(dueDate)
}

// Helper function to get priority color
export function getPriorityColor(priority: string): string {
  const colors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
  }

  return colors[priority as keyof typeof colors] || 'gray'
}

// Helper function to generate work order number
export function generateWorkOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `WO-${timestamp}${random}`
}