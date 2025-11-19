import { Response } from 'express';

export interface ApiError {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
  path?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    } as ApiSuccess<T>);
  }

  static error(
    res: Response,
    error: string,
    code: string,
    statusCode: number = 400,
    details?: any
  ): Response {
    return res.status(statusCode).json({
      error,
      code,
      details,
      timestamp: new Date().toISOString()
    } as ApiError);
  }

  static badRequest(res: Response, message: string, details?: any): Response {
    return this.error(res, message, 'BAD_REQUEST', 400, details);
  }

  static unauthorized(res: Response, message: string = 'Authentication required'): Response {
    return this.error(res, message, 'UNAUTHORIZED', 401);
  }

  static forbidden(res: Response, message: string = 'Insufficient permissions'): Response {
    return this.error(res, message, 'FORBIDDEN', 403);
  }

  static notFound(res: Response, resource: string): Response {
    return this.error(res, `${resource} not found`, 'NOT_FOUND', 404);
  }

  static conflict(res: Response, message: string): Response {
    return this.error(res, message, 'CONFLICT', 409);
  }

  static locked(res: Response, message: string, details?: any): Response {
    return this.error(res, message, 'LOCKED', 423, details);
  }

  static serverError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 'INTERNAL_ERROR', 500);
  }

  static validationError(res: Response, errors: any[]): Response {
    return this.error(res, 'Validation failed', 'VALIDATION_ERROR', 422, { errors });
  }
}
