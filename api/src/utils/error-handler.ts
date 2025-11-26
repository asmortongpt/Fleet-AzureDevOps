// Centralized Error Handling Utilities
// Provides type-safe error handling patterns

import { Response } from 'express';
import { AppError, ErrorDetails } from '../types';

/**
 * Standard error class with additional metadata
 */
export class ApplicationError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: ErrorDetails;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: ErrorDetails,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Database error class
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * Type guard to check if error is an ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

/**
 * Type guard to check if error is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (isApplicationError(error)) {
    return error.message;
  }
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Safe error code extraction
 */
export function getErrorCode(error: unknown): string {
  if (isApplicationError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Safe error status code extraction
 */
export function getErrorStatusCode(error: unknown): number {
  if (isApplicationError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  console.error('Error occurred:', {
    message,
    code,
    context,
    stack: isError(error) ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle error in route handler
 * @param error The error that occurred
 * @param res Express response object
 * @param context Additional context for logging
 */
export function handleRouteError(
  error: unknown,
  res: Response,
  context?: Record<string, unknown>
): Response {
  logError(error, context);

  const statusCode = getErrorStatusCode(error);
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  const errorResponse: {
    error: string;
    code: string;
    timestamp: string;
    details?: ErrorDetails;
  } = {
    error: message,
    code,
    timestamp: new Date().toISOString()
  };

  if (isApplicationError(error) && error.details) {
    errorResponse.details = error.details;
  }

  return res.status(statusCode).json(errorResponse);
}

/**
 * Async route handler wrapper for error handling
 */
export function asyncHandler(
  handler: (req: any, res: Response, next?: any) => Promise<any>
) {
  return async (req: any, res: Response, next: any) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      handleRouteError(error, res, {
        method: req.method,
        path: req.path,
        userId: req.user?.id
      });
    }
  };
}

/**
 * Convert database error to application error
 */
export function handleDatabaseError(error: unknown): ApplicationError {
  const message = getErrorMessage(error);

  // PostgreSQL error codes
  if (isError(error) && 'code' in error) {
    const pgError = error as Error & { code: string };

    switch (pgError.code) {
      case '23505': // unique_violation
        return new ConflictError('A record with this value already exists');
      case '23503': // foreign_key_violation
        return new ValidationError('Referenced record does not exist');
      case '23502': // not_null_violation
        return new ValidationError('Required field is missing');
      case '22P02': // invalid_text_representation
        return new ValidationError('Invalid data format');
      case '42P01': // undefined_table
        return new DatabaseError('Database table not found');
      default:
        return new DatabaseError(message);
    }
  }

  return new DatabaseError(message);
}

/**
 * Sanitize error for client response (removes sensitive info)
 */
export function sanitizeError(error: ApplicationError): ApplicationError {
  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    return new ApplicationError(
      'An internal error occurred',
      500,
      'INTERNAL_ERROR',
      undefined,
      false
    );
  }
  return error;
}
