/**
 * Custom error class for application-specific errors.
 * 
 * @extends Error
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}