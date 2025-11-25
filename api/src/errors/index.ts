/**
 * Centralized Error Exports
 *
 * Export all error classes from a single location for easy imports
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
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalApiError
} from './AppError';

// Re-export middleware error handler for backward compatibility
export {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  registerProcessErrorHandlers,
  // Also export legacy error names for compatibility
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ExternalServiceError
} from '../middleware/error-handler';
