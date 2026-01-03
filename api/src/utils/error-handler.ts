
/**
 * Logs an error with structured logging.
 * @param error - The error object to log.
 * @param metadata - Additional metadata for logging.
 */
export function logError(error: Error, metadata: Record<string, any>): void {
  console.error('Error:', { error, metadata });
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