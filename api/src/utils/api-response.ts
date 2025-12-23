/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formatting across all API endpoints
 */

import { Response } from 'express';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Success response (200 OK)
 */
export function successResponse<T>(
  res: Response,
  data: T,
  meta?: Partial<ApiResponse['meta']>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };

  return res.status(200).json(response);
}

/**
 * Created response (201 Created)
 */
export function createdResponse<T>(
  res: Response,
  data: T,
  meta?: Partial<ApiResponse['meta']>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };

  return res.status(201).json(response);
}

/**
 * No Content response (204 No Content)
 */
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

/**
 * Paginated response
 */
export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  meta?: Partial<ApiResponse['meta']>
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      pagination,
      ...meta
    }
  };

  return res.status(200).json(response);
}

/**
 * Error response (4xx/5xx)
 */
export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  details?: any,
  meta?: Partial<ApiResponse['meta']>
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };

  return res.status(statusCode).json(response);
}

/**
 * Bad Request response (400)
 */
export function badRequestResponse(
  res: Response,
  message: string = 'Bad Request',
  details?: any
): Response {
  return errorResponse(res, 400, message, 'BAD_REQUEST', details);
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return errorResponse(res, 401, message, 'UNAUTHORIZED');
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return errorResponse(res, 403, message, 'FORBIDDEN');
}

/**
 * Not Found response (404)
 */
export function notFoundResponse(
  res: Response,
  resource: string = 'Resource'
): Response {
  return errorResponse(res, 404, `${resource} not found`, 'NOT_FOUND');
}

/**
 * Conflict response (409)
 */
export function conflictResponse(
  res: Response,
  message: string,
  details?: any
): Response {
  return errorResponse(res, 409, message, 'CONFLICT', details);
}

/**
 * Validation Error response (422)
 */
export function validationErrorResponse(
  res: Response,
  errors: Array<{ field: string; message: string }>
): Response {
  return errorResponse(
    res,
    422,
    'Validation failed',
    'VALIDATION_ERROR',
    { errors }
  );
}

/**
 * Internal Server Error response (500)
 */
export function internalErrorResponse(
  res: Response,
  message: string = 'Internal server error'
): Response {
  return errorResponse(res, 500, message, 'INTERNAL_ERROR');
}
