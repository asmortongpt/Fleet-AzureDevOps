/**
 * Legacy error exports - Re-exports from AppError.ts for backward compatibility
 * DEPRECATED: Import from './AppError' instead
 */

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
