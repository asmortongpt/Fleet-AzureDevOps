/**
 * Centralized Error Exports
 * ARCHITECTURE FIX (BACKEND-3, BACKEND-8): Single source of truth for error handling
 */

// Export all error classes
export {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  RateLimitError,
  InternalError,
  BadGatewayError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalAPIError,
  isAppError,
  isOperationalError
} from './AppError';

// Re-export middleware for convenience
export {
  errorHandler,
  asyncHandler
} from '../middleware/errorHandler';
