/**
 * Custom Error Classes for Fleet Management System
 *
 * Provides consistent error handling across the application with:
 * - HTTP status codes
 * - Error codes for client handling
 * - Structured error details
 * - Security-safe error messages
 */

export interface ErrorDetails {
  [key: string]: any;
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details })
      }
    };
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: ErrorDetails) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: ErrorDetails) {
    super(message, 401, 'UNAUTHORIZED', true, details);
  }
}

/**
 * 403 Forbidden - Authenticated but insufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: ErrorDetails) {
    super(message, 403, 'FORBIDDEN', true, details);
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: ErrorDetails) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, details);
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: ErrorDetails) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: ErrorDetails) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: ErrorDetails) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, details);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: ErrorDetails) {
    super(message, 500, 'INTERNAL_ERROR', false, details);
  }
}

/**
 * 503 Service Unavailable - External service unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: ErrorDetails) {
    super(message, 503, 'SERVICE_UNAVAILABLE', true, details);
  }
}

/**
 * Database-specific errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: ErrorDetails) {
    super(message, 500, 'DATABASE_ERROR', false, details);
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends AppError {
  constructor(service: string, message: string, details?: ErrorDetails) {
    super(`${service} API error: ${message}`, 502, 'EXTERNAL_API_ERROR', true, details);
  }
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Sanitize error for client response (remove sensitive details)
 */
export function sanitizeError(error: Error): { message: string; code: string; statusCode: number; details?: ErrorDetails } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details })
    };
  }

  // Unknown errors - don't leak implementation details
  return {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
}
