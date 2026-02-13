/**
 * Enhanced Error Handling Middleware
 * ARCHITECTURE FIX (Critical): Standardized error handling with custom error hierarchy
 * SECURITY FIX (P0): Log sanitization to prevent log injection (CWE-117)
 */

import { Request, Response, NextFunction } from 'express';

import {
  isApplicationError,
  InternalServerError
} from '../errors/ApplicationError';
import telemetryService from '../monitoring/applicationInsights';
import { sanitizeForLog, sanitizeRequestForLog } from '../utils/logSanitizer';
import { logger } from '../utils/logger';

// Re-export error classes for convenience
export {
  BaseError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError as ServerError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  TimeoutError,
} from '../errors/custom-errors';


/**
 * Extended request interface with telemetry tracking
 */
interface TelemetryRequest extends Request {
  telemetry?: {
    startTime: number
    correlationId: string
    userId?: string
  }
}

/**
 * JWT Error Types
 */
interface JWTError extends Error {
  name: 'JsonWebTokenError' | 'TokenExpiredError' | 'NotBeforeError'
}

/**
 * Check if error is a JWT error
 */
function isJWTError(err: Error): err is JWTError {
  return (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError' ||
    err.name === 'NotBeforeError'
  )
}

/**
 * Map JWT error to user-friendly response
 */
function mapJWTError(err: JWTError): { statusCode: number; errorCode: string; message: string } {
  switch (err.name) {
    case 'TokenExpiredError':
      return {
        statusCode: 401,
        errorCode: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      }
    case 'NotBeforeError':
      return {
        statusCode: 401,
        errorCode: 'TOKEN_NOT_ACTIVE',
        message: 'Token is not yet valid. Check your system clock.'
      }
    case 'JsonWebTokenError':
      // Check specific JWT error messages
      if (err.message.includes('invalid signature')) {
        return {
          statusCode: 401,
          errorCode: 'INVALID_SIGNATURE',
          message: 'Token signature verification failed.'
        }
      }
      if (err.message.includes('invalid token')) {
        return {
          statusCode: 401,
          errorCode: 'INVALID_TOKEN',
          message: 'Token is malformed or invalid.'
        }
      }
      if (err.message.includes('jwt malformed')) {
        return {
          statusCode: 401,
          errorCode: 'MALFORMED_TOKEN',
          message: 'Token format is invalid.'
        }
      }
      if (err.message.includes('invalid algorithm')) {
        return {
          statusCode: 401,
          errorCode: 'INVALID_ALGORITHM',
          message: 'Token uses an unsupported algorithm.'
        }
      }
      if (err.message.includes('invalid audience')) {
        return {
          statusCode: 401,
          errorCode: 'INVALID_AUDIENCE',
          message: 'Token is not intended for this application.'
        }
      }
      if (err.message.includes('invalid issuer')) {
        return {
          statusCode: 401,
          errorCode: 'INVALID_ISSUER',
          message: 'Token issuer is not trusted.'
        }
      }
      return {
        statusCode: 401,
        errorCode: 'INVALID_TOKEN',
        message: 'Token validation failed.'
      }
    default:
      return {
        statusCode: 401,
        errorCode: 'AUTH_ERROR',
        message: 'Authentication failed.'
      }
  }
}

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 */
export function errorHandler(
  err: Error,
  req: TelemetryRequest,
  res: Response,
  next: NextFunction
): void {
  // Get correlation ID for tracing
  const correlationId = req.telemetry?.correlationId || 'unknown';

  // Handle JWT errors specifically
  if (isJWTError(err)) {
    const jwtError = mapJWTError(err)

    logger.warn('JWT authentication error', {
      correlationId,
      errorCode: jwtError.errorCode,
      errorName: err.name,
      message: sanitizeForLog(err.message),
      path: req.path,
      method: req.method
    })

    // Track JWT error in Application Insights
    telemetryService.trackError(err, {
      correlationId,
      errorType: 'JWTError',
      errorCode: jwtError.errorCode,
      statusCode: jwtError.statusCode,
      method: req.method,
      path: req.path
    })

    res.status(jwtError.statusCode).json({
      error: jwtError.message,
      errorCode: jwtError.errorCode,
      correlationId,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
    return
  }

  // Handle ApplicationError (custom errors with proper status codes)
  if (isApplicationError(err)) {
    // Log operational errors as warnings, non-operational as errors
    if (err.isOperational) {
      logger.warn('Operational error', {
        correlationId,
        code: err.code,
        message: sanitizeForLog(err.message),
        statusCode: err.statusCode,
        request: sanitizeRequestForLog(req),
        details: err.details
      });
    } else {
      // SECURITY FIX (P0): Sanitize error details to prevent log injection (CWE-117)
      // Fingerprint: b7c4e2f9a3d6b8c1
      logger.error('Non-operational error', {
        correlationId,
        code: err.code,
        message: sanitizeForLog(err.message),
        statusCode: err.statusCode,
        request: sanitizeRequestForLog(req),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }

    // Track error in Application Insights
    telemetryService.trackError(err, {
      correlationId,
      code: err.code,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      method: req.method,
      path: req.path,
      userId: req.telemetry?.userId
    });

    // Send error response
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle unexpected errors (not ApplicationError)
  // SECURITY FIX (P0): Sanitize error details to prevent log injection (CWE-117)
  logger.error('Unexpected error', {
    correlationId,
    message: sanitizeForLog(err.message),
    name: sanitizeForLog(err.name),
    request: sanitizeRequestForLog(req),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Track unexpected error in Application Insights
  telemetryService.trackError(err, {
    correlationId,
    errorType: 'UnexpectedError',
    isOperational: false,
    method: req.method,
    path: req.path,
    userId: req.telemetry?.userId
  });

  // Convert to InternalServerError and send response
  const internalError = new InternalServerError(
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred'
  );

  res.status(500).json(internalError.toJSON());
}

/**
 * Async handler wrapper to catch async route handler errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
