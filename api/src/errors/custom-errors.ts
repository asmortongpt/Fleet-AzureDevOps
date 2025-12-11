/**
 * Custom Error Classes (HIGH-SEC-2)
 * 
 * Comprehensive error hierarchy for Fleet Management application
 * Each error class maps to specific HTTP status codes and error codes
 * 
 * @security No PII or sensitive data in error messages
 * @security Stack traces sanitized in production
 */

import { HTTP_STATUS, ERROR_CODES } from '../types/api-response.types'

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class BaseError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly details?: any
  public readonly timestamp: Date

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details
    this.timestamp = new Date()

    // Maintain proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 400 Bad Request - Validation errors
 * Used when user input fails validation
 */
export class ValidationError extends BaseError {
  public readonly fields?: Array<{ field: string; message: string; value?: any }>

  constructor(message: string, fields?: Array<{ field: string; message: string; value?: any }>) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, true, { fields })
    this.fields = fields
  }
}

/**
 * 401 Unauthorized - Authentication errors
 * Used when user is not authenticated or token is invalid/expired
 */
export class UnauthorizedError extends BaseError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED', details?: any) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, true, details)
  }
}

/**
 * 403 Forbidden - Authorization errors
 * Used when user is authenticated but lacks permission
 */
export class ForbiddenError extends BaseError {
  constructor(message = 'Access denied', code = 'FORBIDDEN', details?: any) {
    super(message, HTTP_STATUS.FORBIDDEN, code, true, details)
  }
}

/**
 * 404 Not Found - Resource not found errors
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends BaseError {
  public readonly resource?: string
  public readonly id?: string | number

  constructor(message = 'Resource not found', resource?: string, id?: string | number) {
    const resourceMsg = resource && id 
      ? `${resource} with ID '${id}' not found`
      : resource
      ? `${resource} not found`
      : message

    super(resourceMsg, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, true, { resource, id })
    this.resource = resource
    this.id = id
  }
}

/**
 * 409 Conflict - Resource conflict errors
 * Used when operation conflicts with current state (e.g., duplicate resource)
 */
export class ConflictError extends BaseError {
  constructor(message = 'Resource already exists', details?: any) {
    super(message, 409, "CONFLICT", true, details)
  }
}

/**
 * 500 Internal Server Error - Generic server errors
 * Used for unexpected server-side errors
 */
export class InternalServerError extends BaseError {
  constructor(message = 'An unexpected error occurred', details?: any) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, true, details)
  }
}

/**
 * 500 Internal Server Error - Database operation errors
 * Used specifically for database-related failures
 */
export class DatabaseError extends BaseError {
  public readonly operation?: string
  public readonly constraint?: string

  constructor(
    message = 'Database operation failed',
    operation?: string,
    constraint?: string,
    details?: any
  ) {
    super(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'DATABASE_ERROR',
      true,
      { operation, constraint, ...details }
    )
    this.operation = operation
    this.constraint = constraint
  }
}

/**
 * 502 Bad Gateway / 503 Service Unavailable - External service errors
 * Used when external API calls fail
 */
export class ExternalServiceError extends BaseError {
  public readonly service?: string
  public readonly statusCode: number

  constructor(
    message = 'External service unavailable',
    service?: string,
    statusCode: number = 502,
    details?: any
  ) {
    super(
      message,
      statusCode,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service, ...details }
    )
    this.service = service
    this.statusCode = statusCode
  }
}

/**
 * 429 Too Many Requests - Rate limiting errors
 * Used when user exceeds rate limits
 */
export class RateLimitError extends BaseError {
  public readonly retryAfter: number
  public readonly limit: number

  constructor(
    message = 'Too many requests',
    retryAfter = 60,
    limit = 100
  ) {
    super(
      message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      true,
      { retryAfter, limit }
    )
    this.retryAfter = retryAfter
    this.limit = limit
  }
}

/**
 * 504 Gateway Timeout - Timeout errors
 * Used when operations exceed time limits
 */
export class TimeoutError extends BaseError {
  public readonly operation?: string
  public readonly timeout: number

  constructor(message = 'Operation timed out', operation?: string, timeout?: number) {
    super(
      message,
      HTTP_STATUS.GATEWAY_TIMEOUT,
      'TIMEOUT_ERROR',
      true,
      { operation, timeout }
    )
    this.operation = operation
    this.timeout = timeout || 30000
  }
}

/**
 * Error factory functions for common scenarios
 */
export const ErrorFactory = {
  /**
   * Create a validation error for missing required field
   */
  missingField(field: string): ValidationError {
    return new ValidationError(
      `Required field '${field}' is missing`,
      [{ field, message: 'This field is required' }]
    )
  },

  /**
   * Create a validation error for invalid field format
   */
  invalidFormat(field: string, expectedFormat: string): ValidationError {
    return new ValidationError(
      `Field '${field}' has invalid format`,
      [{ field, message: `Expected format: ${expectedFormat}` }]
    )
  },

  /**
   * Create a not found error for specific resource
   */
  notFound(resource: string, id: string | number): NotFoundError {
    return new NotFoundError(undefined, resource, id)
  },

  /**
   * Create a database constraint violation error
   */
  uniqueViolation(field: string): ConflictError {
    return new ConflictError(
      `A record with this ${field} already exists`,
      { constraint: `unique_${field}` }
    )
  },

  /**
   * Create a foreign key violation error
   */
  foreignKeyViolation(referencedResource: string): ValidationError {
    return new ValidationError(
      `Referenced ${referencedResource} does not exist`,
      [{ field: referencedResource, message: 'Invalid reference' }]
    )
  },

  /**
   * Create an expired token error
   */
  tokenExpired(): UnauthorizedError {
    return new UnauthorizedError(
      'Authentication token has expired',
      'TOKEN_EXPIRED',
      { shouldRefresh: true }
    )
  },

  /**
   * Create an invalid token error
   */
  invalidToken(): UnauthorizedError {
    return new UnauthorizedError(
      'Invalid authentication token',
      'INVALID_TOKEN'
    )
  },

  /**
   * Create a permission denied error
   */
  permissionDenied(action: string, resource: string): ForbiddenError {
    return new ForbiddenError(
      `You do not have permission to ${action} ${resource}`,
      'PERMISSION_DENIED',
      { action, resource }
    )
  },

  /**
   * Create an external service error
   */
  serviceUnavailable(serviceName: string, statusCode?: number): ExternalServiceError {
    return new ExternalServiceError(
      `${serviceName} service is currently unavailable`,
      serviceName,
      statusCode || HTTP_STATUS.SERVICE_UNAVAILABLE
    )
  },

  /**
   * Create a database connection error
   */
  databaseConnectionError(): DatabaseError {
    return new DatabaseError(
      'Unable to connect to database',
      'connection',
      undefined,
      { retryable: true }
    )
  },

  /**
   * Create a query timeout error
   */
  queryTimeout(operation: string): TimeoutError {
    return new TimeoutError(
      `Database query '${operation}' timed out`,
      operation,
      30000
    )
  }
}

/**
 * Type guard to check if error is an operational error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational
  }
  return false
}

/**
 * Type guard to check if error is a BaseError instance
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError
}
