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
  meta?: any;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200, meta?: any): Response {
    const body: ApiSuccess<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };

    if (message) {
      body.message = message;
    }

    if (meta) {
      body.meta = meta;
    }

    return res.status(statusCode).json(body);
  }

  static error(
    res: Response,
    error: string,
    code: string = 'ERROR',
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

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 'UNAUTHORIZED', 401);
  }

  static forbidden(res: Response, message: string = 'Insufficient permissions'): Response {
    return this.error(res, message, 'FORBIDDEN', 403);
  }

  static notFound(res: Response, resource: string = 'Resource'): Response {
    return this.error(res, '${resource} not found`, 'NOT_FOUND', 404);
  }

  static conflict(res: Response, message: string): Response {
    return this.error(res, message, 'CONFLICT', 409);
  }

  static locked(res: Response, message: string, details?: any): Response {
    return this.error(res, message, 'LOCKED', 423, details);
  }

  static serverError(res: Response, message: string = 'Internal server error', details?: any): Response {
    return this.error(res, message, 'SERVER_ERROR', 500, details);
  }

  static validationError(res: Response, errors: any[]): Response {
    return this.error(res, 'Validation failed', 'VALIDATION_ERROR', 422, { errors });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    return res.status(200).json({
      success: true,
      data,
      message: message || 'Retrieved successfully',
      meta,
      timestamp: new Date().toISOString()
    });
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return res.status(201).json({
      success: true,
      data,
      message: message || 'Resource created successfully',
      timestamp: new Date().toISOString()
    } as ApiSuccess<T>);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
