/**
 * Base Application Error Class
 * Provides standardized error handling across the entire backend
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, 'VALIDATION_ERROR', message);
    if (details) {
      Object.assign(this, { details });
    }
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/**
 * 403 Forbidden - User doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

/**
 * 409 Conflict - Resource already exists
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

/**
 * 422 Unprocessable Entity - Semantic errors
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string) {
    super(422, 'UNPROCESSABLE_ENTITY', message);
  }
}

/**
 * 500 Internal Server Error - Unexpected errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', isOperational: boolean = false) {
    super(500, 'INTERNAL_ERROR', message, isOperational);
  }
}

/**
 * 503 Service Unavailable - External service issues
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(503, 'SERVICE_UNAVAILABLE', `${service} is currently unavailable`);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(500, 'DATABASE_ERROR', message, false);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * External API errors
 */
export class ExternalApiError extends AppError {
  constructor(api: string, message: string) {
    super(502, 'EXTERNAL_API_ERROR', `${api}: ${message}`);
  }
}
