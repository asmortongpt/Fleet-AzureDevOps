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
  InternalError
} from './AppError';

// Re-export middleware error handler for backward compatibility
export {
  errorHandler,
  asyncHandler
} from '../middleware/errorHandler';

// Alias for backward compatibility
export { InternalError as InternalServerError } from './AppError';
export { UnauthorizedError as AuthenticationError } from './AppError';
export { ForbiddenError as AuthorizationError } from './AppError';
