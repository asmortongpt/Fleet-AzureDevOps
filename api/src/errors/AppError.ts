/**
 * Application Error Hierarchy
 * ARCHITECTURE FIX (BACKEND-3, BACKEND-8): Standardized error handling
 * Base class for all custom application errors with proper HTTP status codes
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const response: Record<string, unknown> = {
      success: false,
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString()
    };

    if (this.details) {
      response.details = this.details;
    }

    return response;
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, true, details);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(401, 'UNAUTHORIZED', message, true, details);
  }
}

/**
 * 403 Forbidden - Authenticated but lacks permission
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super(403, 'FORBIDDEN', message, true, details);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string, details?: unknown) {
    super(404, 'NOT_FOUND', `${resource} not found`, true, details);
  }
}

/**
 * 409 Conflict - Resource already exists or version conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, true, details);
  }
}

/**
 * 422 Unprocessable Entity - Semantically invalid data
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, true, details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(429, 'RATE_LIMIT_EXCEEDED', message, true, { retryAfter });
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred', details?: unknown) {
    super(500, 'INTERNAL_ERROR', message, false, details);
  }
}

/**
 * 502 Bad Gateway - External API returned invalid response
 */
export class BadGatewayError extends AppError {
  constructor(service: string, message?: string) {
    super(502, 'BAD_GATEWAY', message || `${service} returned an invalid response`);
  }
}

/**
 * 503 Service Unavailable - External service dependency failed
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string, message?: string) {
    super(503, 'SERVICE_UNAVAILABLE', message || `${service} is temporarily unavailable`);
  }
}

/**
 * Database-specific errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(500, 'DATABASE_ERROR', message, false, details);
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends AppError {
  constructor(public apiName: string, message: string, details?: unknown) {
    super(502, 'EXTERNAL_API_ERROR', message, true, details);
  }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}
