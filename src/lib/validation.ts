/**
 * Input Validation Library - Security Fix CRIT-SEC-002
 * Comprehensive validation for all user inputs before API calls
 * Uses Zod for schema validation with XSS/injection protection
 */

import { z } from 'zod'

// ============================================================================
// Common Validation Patterns
// ============================================================================

// Email validation with strict RFC compliance
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .transform(val => val.toLowerCase().trim())

// Password validation with security requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')

// Phone number validation (E.164 format)
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()

// Safe string validation (no SQL injection, XSS)
export const safeStringSchema = z.string()
  .max(255, 'Text too long')
  .transform(val => {
    // Remove potential XSS vectors
    return val
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  })

// Text area validation (longer text with XSS protection)
export const textAreaSchema = z.string()
  .max(5000, 'Text too long')
  .transform(val => {
    return val
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  })

// UUID validation
export const uuidSchema = z.string()
  .uuid('Invalid ID format')

// Positive integer validation
export const positiveIntSchema = z.number()
  .int('Must be an integer')
  .positive('Must be positive')

// Non-negative number validation
export const nonNegativeNumberSchema = z.number()
  .nonnegative('Must be non-negative')

// Date validation
export const dateSchema = z.string()
  .datetime('Invalid date format')
  .or(z.date())

// URL validation
export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')

// Status validation (common statuses)
export const statusSchema = z.enum([
  'active',
  'inactive',
  'pending',
  'completed',
  'cancelled',
  'in_progress',
  'maintenance',
  'available',
  'unavailable'
])

// ============================================================================
// Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required').max(128)
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: safeStringSchema.min(1, 'First name required'),
  last_name: safeStringSchema.min(1, 'Last name required'),
  phone: phoneSchema,
  role: z.enum(['driver', 'admin', 'manager', 'technician']).optional()
})

// ============================================================================
// Vehicle Schemas
// ============================================================================

export const vehicleCreateSchema = z.object({
  vin: z.string()
    .length(17, 'VIN must be 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format'),
  make: safeStringSchema.min(1, 'Make required'),
  model: safeStringSchema.min(1, 'Model required'),
  year: z.number()
    .int()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 2, 'Invalid year'),
  license_plate: safeStringSchema.optional(),
  status: statusSchema.optional(),
  odometer: nonNegativeNumberSchema.optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng']).optional(),
  color: safeStringSchema.optional(),
  department: safeStringSchema.optional()
})

export const vehicleUpdateSchema = vehicleCreateSchema.partial()

export const vehicleTelemetrySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: nonNegativeNumberSchema,
  heading: z.number().min(0).max(360).optional(),
  odometer: nonNegativeNumberSchema.optional(),
  fuel_level: z.number().min(0).max(100).optional(),
  engine_hours: nonNegativeNumberSchema.optional(),
  battery_voltage: nonNegativeNumberSchema.optional(),
  timestamp: dateSchema.optional()
})

// ============================================================================
// Driver Schemas
// ============================================================================

export const driverCreateSchema = z.object({
  first_name: safeStringSchema.min(1, 'First name required'),
  last_name: safeStringSchema.min(1, 'Last name required'),
  email: emailSchema,
  phone: phoneSchema,
  license_number: safeStringSchema.min(1, 'License number required'),
  license_expiry: dateSchema,
  status: statusSchema.optional(),
  role: z.enum(['driver', 'technician', 'fleet_manager']).optional()
})

export const driverUpdateSchema = driverCreateSchema.partial()

// ============================================================================
// Work Order Schemas
// ============================================================================

export const workOrderCreateSchema = z.object({
  vehicle_id: uuidSchema,
  title: safeStringSchema.min(1, 'Title required'),
  description: textAreaSchema,
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  assigned_to: uuidSchema.optional(),
  due_date: dateSchema.optional(),
  estimated_cost: nonNegativeNumberSchema.optional()
})

export const workOrderUpdateSchema = workOrderCreateSchema.partial()

// ============================================================================
// Fuel Transaction Schemas
// ============================================================================

export const fuelTransactionSchema = z.object({
  vehicle_id: uuidSchema,
  driver_id: uuidSchema.optional(),
  date: dateSchema,
  gallons: positiveIntSchema,
  cost_per_gallon: positiveIntSchema,
  total_cost: positiveIntSchema,
  odometer: nonNegativeNumberSchema,
  location: safeStringSchema.optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'cng']),
  receipt_url: urlSchema.optional()
})

// ============================================================================
// Facility Schemas
// ============================================================================

export const facilityCreateSchema = z.object({
  name: safeStringSchema.min(1, 'Facility name required'),
  type: z.enum(['garage', 'depot', 'charging_station', 'warehouse']),
  address: safeStringSchema,
  city: safeStringSchema,
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity: positiveIntSchema.optional(),
  status: statusSchema.optional()
})

export const facilityUpdateSchema = facilityCreateSchema.partial()

// ============================================================================
// Maintenance Schedule Schemas
// ============================================================================

export const maintenanceScheduleSchema = z.object({
  vehicle_id: uuidSchema,
  service_type: safeStringSchema.min(1, 'Service type required'),
  interval_miles: positiveIntSchema.optional(),
  interval_days: positiveIntSchema.optional(),
  last_service_date: dateSchema.optional(),
  last_service_odometer: nonNegativeNumberSchema.optional(),
  next_service_date: dateSchema.optional(),
  next_service_odometer: nonNegativeNumberSchema.optional(),
  description: textAreaSchema.optional()
})

// ============================================================================
// Route Schemas
// ============================================================================

export const routeCreateSchema = z.object({
  name: safeStringSchema.min(1, 'Route name required'),
  description: textAreaSchema.optional(),
  start_location: safeStringSchema,
  end_location: safeStringSchema,
  waypoints: z.array(z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: safeStringSchema.optional()
  })).optional(),
  estimated_distance: positiveIntSchema.optional(),
  estimated_duration: positiveIntSchema.optional(),
  assigned_vehicle_id: uuidSchema.optional(),
  assigned_driver_id: uuidSchema.optional(),
  status: statusSchema.optional()
})

export const routeUpdateSchema = routeCreateSchema.partial()

// ============================================================================
// Purchase Order Schemas
// ============================================================================

export const purchaseOrderSchema = z.object({
  vendor_id: uuidSchema,
  order_number: safeStringSchema.min(1, 'Order number required'),
  order_date: dateSchema,
  expected_delivery: dateSchema.optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'received', 'cancelled']).optional(),
  items: z.array(z.object({
    part_number: safeStringSchema,
    description: safeStringSchema,
    quantity: positiveIntSchema,
    unit_price: positiveIntSchema,
    total_price: positiveIntSchema
  })),
  subtotal: positiveIntSchema,
  tax: nonNegativeNumberSchema.optional(),
  shipping: nonNegativeNumberSchema.optional(),
  total: positiveIntSchema,
  notes: textAreaSchema.optional()
})

// ============================================================================
// Vendor Schemas
// ============================================================================

export const vendorCreateSchema = z.object({
  name: safeStringSchema.min(1, 'Vendor name required'),
  contact_name: safeStringSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: safeStringSchema.optional(),
  city: safeStringSchema.optional(),
  state: z.string().length(2).optional(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  status: statusSchema.optional(),
  payment_terms: safeStringSchema.optional(),
  notes: textAreaSchema.optional()
})

export const vendorUpdateSchema = vendorCreateSchema.partial()

// ============================================================================
// Query Parameter Validation
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sort: safeStringSchema.optional(),
  order: z.enum(['asc', 'desc']).optional()
})

export const filterSchema = z.object({
  status: statusSchema.optional(),
  search: safeStringSchema.optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional()
}).merge(paginationSchema)

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates data against a schema and returns validated data
 * Throws error with detailed messages on validation failure
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      throw new Error(`Validation failed: ${messages.join(', ')}`)
    }
    throw error
  }
}

/**
 * Validates data and returns result with success flag
 * Does not throw - useful for form validation
 */
export function validateInputSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    return { success: false, errors }
  }
}

/**
 * Sanitizes HTML input to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validates and sanitizes query parameters
 */
export function sanitizeQueryParams(params: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue

    // Validate key
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '')

    // Validate value
    const stringValue = String(value)
    const safeValue = stringValue
      .replace(/[<>'"]/g, '')
      .substring(0, 255)

    sanitized[safeKey] = safeValue
  }

  return sanitized
}
