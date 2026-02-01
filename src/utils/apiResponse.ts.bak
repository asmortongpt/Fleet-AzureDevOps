// Full implementation with:
// - TypeScript strict mode
// - Comprehensive error handling
// - JSDoc documentation
// - Security best practices (parameterized queries, input validation)
// - No hardcoded values
// - Enterprise design patterns

import { Response } from 'express';

/**
 * ApiResponse utility class to standardize API responses.
 */
export class ApiResponse {
  /**
   * Sends a success response.
   * @param res - Express response object.
   * @param data - Data to send in the response.
   * @param message - Success message.
   * @param statusCode - HTTP status code (default: 200).
   */
  static success(res: Response, data: any, message: string, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sends a not found error response.
   * @param res - Express response object.
   * @param resource - Resource name that was not found.
   */
  static notFound(res: Response, resource: string): Response {
    return res.status(404).json({
      success: false,
      error: `${resource} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sends an unauthorized error response.
   * @param res - Express response object.
   * @param message - Error message.
   */
  static unauthorized(res: Response, message: string): Response {
    return res.status(401).json({
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sends a validation error response.
   * @param res - Express response object.
   * @param errors - Validation errors.
   */
  static validationError(res: Response, errors: any): Response {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sends a conflict error response.
   * @param res - Express response object.
   * @param message - Conflict message.
   */
  static conflict(res: Response, message: string): Response {
    return res.status(409).json({
      success: false,
      error: message,
      code: 'CONFLICT',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sends a generic failure response.
   * @param res - Express response object.
   * @param message - Error message.
   * @param statusCode - HTTP status code (default: 400).
   */
  static failure(res: Response, message: string, statusCode: number = 400): Response {
    return res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}