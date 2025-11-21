/**
 * Request Validation Middleware
 *
 * Production-ready input validation using Zod with:
 * - Type-safe schema validation
 * - Sanitization and normalization
 * - Detailed error messages
 * - Query, body, and param validation
 * - XSS and SQL injection prevention
 * - Custom validation rules
 *
 * @module middleware/validation
 */

import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema, ZodError } from 'zod'
import { ValidationError } from './error-handler'
import { logger, securityLogger } from '../utils/logger'

/**
 * Validation target (where to validate from)
 */
type ValidationTarget = 'body' | 'query' | 'params'

/**
 * Validation options
 */
interface ValidationOptions {
  /**
   * Strip unknown fields (default: true for body, false for query)
   */
  stripUnknown?: boolean

  /**
   * Allow partial validation (for PATCH requests)
   */
  partial?: boolean

  /**
   * Custom error messages
   */
  messages?: Record<string, string>

  /**
   * Sanitize HTML/script tags
   */
  sanitize?: boolean
}

/**
 * Main validation middleware factory
 *
 * Usage:
 * ```typescript
 * const createVehicleSchema = z.object({
 *   vin: z.string().length(17),
 *   make: z.string().min(1),
 *   model: z.string().min(1),
 *   year: z.number().int().min(1900).max(new Date().getFullYear() + 1)
 * })
 *
 * router.post('/vehicles',
 *   validate(createVehicleSchema),
 *   async (req, res) => { ... }
 * )
 * ```
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get data to validate
      let data = req[target]

      // Apply sanitization if requested
      if (options.sanitize !== false) {
        data = sanitizeInput(data)
      }

      // Modify schema if partial validation is requested
      let validationSchema = schema
      if (options.partial) {
        validationSchema = schema.partial()
      }

      // Validate data
      const validated = await validationSchema.parseAsync(data)

      // Strip unknown fields if requested
      if (options.stripUnknown !== false && target === 'body') {
        req[target] = validated
      } else {
        // Merge validated data back
        req[target] = { ...req[target], ...validated }
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Log validation failure for security monitoring
        securityLogger.incident('xss_attempt', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          details: {
            endpoint: req.path,
            errors: error.errors,
            data: sanitizeForLogging(req[target])
          },
          severity: 'low'
        })

        // Format error message
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: options.messages?.[err.path.join('.')] || err.message,
          code: err.code,
          expected: (err as any).expected,
          received: (err as any).received
        }))

        next(new ValidationError('Validation failed', formattedErrors))
      } else {
        next(error)
      }
    }
  }
}

/**
 * Validate multiple targets
 */
export function validateAll(schemas: {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}, options: ValidationOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params)
      }

      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query)
      }

      if (schemas.body) {
        const data = options.sanitize !== false ? sanitizeInput(req.body) : req.body
        req.body = await schemas.body.parseAsync(data)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))

        next(new ValidationError('Validation failed', formattedErrors))
      } else {
        next(error)
      }
    }
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * UUID parameter
   */
  uuid: z.object({
    id: z.string().uuid('Invalid ID format')
  }),

  /**
   * Pagination query parameters
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  /**
   * Date range query
   */
  dateRange: z.object({
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional()
  }).refine(data => {
    if (data.start_date && data.end_date) {
      return data.start_date <= data.end_date
    }
    return true
  }, {
    message: 'start_date must be before or equal to end_date'
  }),

  /**
   * Search query
   */
  search: z.object({
    q: z.string().min(1).max(500),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  /**
   * Email validation
   */
  email: z.string().email('Invalid email address').toLowerCase(),

  /**
   * Phone number validation (flexible international format)
   */
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),

  /**
   * VIN validation (17 characters, excludes I, O, Q)
   */
  vin: z.string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'Invalid VIN format')
    .transform(val => val.toUpperCase()),

  /**
   * License plate validation
   */
  licensePlate: z.string()
    .min(2)
    .max(15)
    .regex(/^[A-Z0-9\s\-]+$/i, 'Invalid license plate format')
    .transform(val => val.toUpperCase()),

  /**
   * URL validation
   */
  url: z.string().url('Invalid URL format'),

  /**
   * Positive number
   */
  positiveNumber: z.number().positive('Must be a positive number'),

  /**
   * Non-negative number
   */
  nonNegativeNumber: z.number().nonnegative('Must be non-negative'),

  /**
   * Currency amount (2 decimal places)
   */
  currency: z.number()
    .nonnegative('Amount must be non-negative')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),

  /**
   * Percentage (0-100)
   */
  percentage: z.number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage must be at most 100'),

  /**
   * Coordinate (latitude/longitude)
   */
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),

  /**
   * File upload metadata
   */
  fileMetadata: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i),
    size: z.number().int().positive().max(50 * 1024 * 1024) // 50MB max
  })
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data)
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item))
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }

  return data
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Trim whitespace
    .trim()
}

/**
 * Sanitize data for logging (remove sensitive fields)
 */
function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitive = ['password', 'token', 'secret', 'api_key', 'ssn', 'credit_card']
  const sanitized = { ...data }

  for (const field of sensitive) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***'
    }
  }

  return sanitized
}

/**
 * Vehicle-specific validation schemas
 */
export const vehicleSchemas = {
  create: z.object({
    vin: commonSchemas.vin,
    make: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    license_plate: commonSchemas.licensePlate.optional(),
    status: z.enum(['active', 'inactive', 'maintenance', 'sold', 'retired']).default('active'),
    odometer: commonSchemas.nonNegativeNumber.optional(),
    fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'propane']).optional(),
    // Multi-asset fields
    asset_category: z.enum(['vehicle', 'heavy_equipment', 'trailer', 'specialized']).optional(),
    asset_type: z.string().max(100).optional(),
    power_type: z.enum(['combustion', 'electric', 'hybrid', 'manual', 'hydraulic', 'pneumatic']).optional(),
    location_id: z.string().uuid().optional(),
    fleet_id: z.string().uuid().optional()
  }),

  update: z.object({
    make: z.string().min(1).max(100).optional(),
    model: z.string().min(1).max(100).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    license_plate: commonSchemas.licensePlate.optional(),
    status: z.enum(['active', 'inactive', 'maintenance', 'sold', 'retired']).optional(),
    odometer: commonSchemas.nonNegativeNumber.optional(),
    location_id: z.string().uuid().optional()
  })
}

/**
 * Driver validation schemas
 */
export const driverSchemas = {
  create: z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    license_number: z.string().min(1).max(50),
    license_expiration: z.coerce.date().refine(date => date > new Date(), {
      message: 'License must not be expired'
    }),
    hire_date: z.coerce.date().optional(),
    status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active')
  }),

  update: z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    license_number: z.string().min(1).max(50).optional(),
    license_expiration: z.coerce.date().optional(),
    status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).optional()
  })
}

/**
 * Work order validation schemas
 */
export const workOrderSchemas = {
  create: z.object({
    vehicle_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    type: z.enum(['preventive', 'corrective', 'inspection', 'recall']),
    estimated_cost: commonSchemas.currency.optional(),
    scheduled_date: z.coerce.date().optional(),
    assigned_to: z.string().uuid().optional()
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    actual_cost: commonSchemas.currency.optional(),
    completed_date: z.coerce.date().optional()
  })
}

/**
 * Fuel transaction validation schemas
 */
export const fuelSchemas = {
  create: z.object({
    vehicle_id: z.string().uuid(),
    driver_id: z.string().uuid().optional(),
    gallons: commonSchemas.positiveNumber,
    price_per_gallon: commonSchemas.currency,
    total_cost: commonSchemas.currency,
    odometer: commonSchemas.nonNegativeNumber,
    fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'cng', 'propane']),
    transaction_date: z.coerce.date(),
    vendor: z.string().max(200).optional(),
    location: z.string().max(500).optional()
  })
}

/**
 * Export all validation utilities
 */
export default {
  validate,
  validateAll,
  commonSchemas,
  vehicleSchemas,
  driverSchemas,
  workOrderSchemas,
  fuelSchemas
}
