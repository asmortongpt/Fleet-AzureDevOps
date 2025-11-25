/**
 * Standardized Error Handling Middleware
 *
 * This middleware provides centralized, production-ready error handling
 * for the CTAFleet API with:
 * - Consistent error response format
 * - Security-safe error messages (no stack traces in production)
 * - HTTP status code mapping
 * - Error logging integration
 * - Custom error types
 *
 * @module middleware/error-handler
 */

import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../utils/logger'

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string
  public readonly details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code
    this.details = details

    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Specific error types for common scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super('${resource} not found', 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Too many requests. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    )
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details, false)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service ${service} is unavailable`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { service },
      false
    )
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    message: string
    code?: string
    details?: any
    timestamp: string
    path: string
    requestId?: string
  }
  stack?: string
}

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): any {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }))
}

/**
 * Format PostgreSQL errors
 */
function formatDatabaseError(error: any): { message: string; code?: string; details?: any } {
  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch (error.code) {
    case '23505': // unique_violation
      return {
        message: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        details: {
          constraint: error.constraint,
          table: error.table
        }
      }

    case '23503': // foreign_key_violation
      return {
        message: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
        details: {
          constraint: error.constraint,
          table: error.table
        }
      }

    case '23502': // not_null_violation
      return {
        message: 'Required field is missing',
        code: 'NOT_NULL_VIOLATION',
        details: {
          column: error.column,
          table: error.table
        }
      }

    case '23514': // check_violation
      return {
        message: 'Invalid value for field',
        code: 'CHECK_VIOLATION',
        details: {
          constraint: error.constraint,
          table: error.table
        }
      }

    case '22P02': // invalid_text_representation
      return {
        message: 'Invalid data format',
        code: 'INVALID_FORMAT'
      }

    case '42P01': // undefined_table
      return {
        message: 'Database table not found',
        code: 'UNDEFINED_TABLE',
        details: { table: error.table }
      }

    case '42703': // undefined_column
      return {
        message: 'Database column not found',
        code: 'UNDEFINED_COLUMN',
        details: { column: error.column }
      }

    case '57014': // query_canceled
      return {
        message: 'Query timeout - operation took too long',
        code: 'QUERY_TIMEOUT'
      }

    case '53300': // too_many_connections
      return {
        message: 'Database connection pool exhausted',
        code: 'CONNECTION_LIMIT'
      }

    default:
      return {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? { dbCode: error.code } : undefined
      }
  }
}

/**
 * Determine if error should be logged
 */
function shouldLogError(error: any): boolean {
  // Don't log operational errors in production (they're expected)
  if (error instanceof AppError && error.isOperational) {
    return false
  }

  // Don't log 404s
  if (error.statusCode === 404) {
    return false
  }

  return true
}

/**
 * Main error handling middleware
 *
 * IMPORTANT: This must be registered AFTER all routes in server.ts
 *
 * Usage in server.ts:
 * ```typescript
 * import { errorHandler } from './middleware/error-handler'
 *
 * // Register all routes first
 * app.use('/api/vehicles', vehiclesRoutes)
 * // ... other routes
 *
 * // Then register error handler
 * app.use(errorHandler)
 * ```
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] as string || 'req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Default error values
  let statusCode = 500
  let message = 'Internal server error'
  let code: string | undefined
  let details: any

  // Handle specific error types
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    code = err.code
    details = err.details
  } else if (err instanceof ZodError) {
    // Validation errors from Zod
    statusCode = 400
    message = 'Validation failed'
    code = 'VALIDATION_ERROR'
    details = formatZodError(err)
  } else if ((err as any).code && (err as any).code.startsWith('23')) {
    // PostgreSQL errors
    const dbError = formatDatabaseError(err)
    statusCode = 400
    message = dbError.message
    code = dbError.code
    details = dbError.details
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid authentication token'
    code = 'INVALID_TOKEN'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Authentication token expired'
    code = 'TOKEN_EXPIRED'
  } else if (err.name === 'MulterError') {
    statusCode = 400
    message = `File upload error: ${err.message}`
    code = 'FILE_UPLOAD_ERROR'
  }

  // Log error if necessary
  if (shouldLogError(err)) {
    logger.error('Request error', {
      requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code
      },
      request: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: sanitizeForLogging(req.body),
        ip: req.ip,
        userAgent: req.get('user-agent')
      },
      user: (req as any).user ? {
        id: (req as any).user.id,
        email: (req as any).user.email,
        tenant_id: (req as any).user.tenant_id
      } : undefined
    })
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId
    }
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
  }

  // Send response
  res.status(statusCode).json(errorResponse)
}

/**
 * Async error wrapper for route handlers
 *
 * Usage:
 * ```typescript
 * router.get('/vehicles', asyncHandler(async (req, res) => {
 *   const vehicles = await getVehicles()
 *   res.json(vehicles)
 * }))
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Sanitize request body for logging (remove sensitive fields)
 */
function sanitizeForLogging(body: any): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'api_key',
    'apiKey',
    'authorization',
    'ssn',
    'creditCard',
    'cvv'
  ]

  const sanitized = { ...body }

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***'
    }
  }

  return sanitized
}

/**
 * 404 Not Found handler
 *
 * Usage in server.ts (before errorHandler):
 * ```typescript
 * app.use(notFoundHandler)
 * app.use(errorHandler)
 * ```
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError('Endpoint')
  error.details = {
    method: req.method,
    path: req.path
  }
  next(error)
}

/**
 * Uncaught exception and unhandled rejection handlers
 *
 * Usage in server.ts:
 * ```typescript
 * registerProcessErrorHandlers()
 * ```
 */
export function registerProcessErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    })

    // In production, gracefully shut down
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1)
      }, 1000)
    }
  })

  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? {
        name: reason.name,
        message: reason.message,
        stack: reason.stack
      } : reason
    })
  })
}
