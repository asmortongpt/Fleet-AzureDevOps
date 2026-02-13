
import logger from '../config/logger';

/**
 * Logs an error with structured logging.
 * @param error - The error object to log.
 * @param metadata - Additional metadata for logging.
 */
export function logError(error: Error, metadata: Record<string, any>): void {
  logger.error('Error', { error: error.message, metadata });
}

/**
 * Sanitizes an error message for production use.
 * @param message - The error message to sanitize.
 * @returns A sanitized error message.
 */
export function sanitizeError(message: string): string {
  return process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : message;
}

/**
 * Wraps an async route handler to catch errors.
 * @param fn - The async function to wrap.
 * @returns A function that handles errors.
 */
export function asyncHandler(fn: Function) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Unknown error';
}
