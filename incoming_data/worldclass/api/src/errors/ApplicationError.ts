/**
 * Application Error Hierarchy
 * ARCHITECTURE FIX (Critical): Standardize error handling across application
 * Implements custom error hierarchy with proper HTTP status codes and error codes
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class ApplicationError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      success: false,
      error: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Authentication required', details?: unknown) {
    super(401, 'UNAUTHORIZED', message, details)
  }
}

/**
 * 403 Forbidden - Authenticated but lacks permission
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', details?: unknown) {
    super(403, 'FORBIDDEN', message, details)
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string, identifier: string | number) {
    super(
      404,
      'NOT_FOUND',
      `${resource} with identifier '${identifier}' not found`
    )
  }
}

/**
 * 409 Conflict - Resource already exists or version conflict
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details)
  }
}

/**
 * 422 Unprocessable Entity - Semantically invalid data
 */
export class UnprocessableEntityError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details)
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends ApplicationError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(429, 'RATE_LIMIT_EXCEEDED', message, { retryAfter })
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends ApplicationError {
  constructor(message: string = 'An unexpected error occurred', details?: unknown) {
    super(500, 'INTERNAL_ERROR', message, details, false) // Not operational
  }
}

/**
 * 503 Service Unavailable - External service dependency failed
 */
export class ServiceUnavailableError extends ApplicationError {
  constructor(service: string, message?: string) {
    super(
      503,
      'SERVICE_UNAVAILABLE',
      message || `${service} is temporarily unavailable`
    )
  }
}

/**
 * 502 Bad Gateway - External API returned invalid response
 */
export class BadGatewayError extends ApplicationError {
  constructor(service: string, message?: string) {
    super(
      502,
      'BAD_GATEWAY',
      message || `${service} returned an invalid response`
    )
  }
}

/**
 * Database-specific errors
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(500, 'DATABASE_ERROR', message, details, false)
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends ApplicationError {
  constructor(
    public readonly apiName: string,
    message: string,
    details?: unknown
  ) {
    super(502, 'EXTERNAL_API_ERROR', message, details)
  }
}

/**
 * Type guard to check if error is ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError
}

/**
 * Type guard to check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (isApplicationError(error)) {
    return error.isOperational
  }
  return false
}
