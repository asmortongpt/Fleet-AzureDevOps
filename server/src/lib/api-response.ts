// server/src/lib/api-response.ts

import { v4 as uuidv4 } from 'uuid';

interface Meta {
  timestamp: string;
  requestId: string;
  pagination?: Pagination;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: Meta;
}

interface ErrorDetails {
  [key: string]: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetails;
    timestamp: string;
    requestId: string;
  };
}

function generateMeta(pagination?: Pagination): Meta {
  return {
    timestamp: new Date().toISOString(),
    requestId: uuidv4(),
    pagination,
  };
}

export function success<T>(data: T, tenantId: string): SuccessResponse<T> {
  // Ensure tenantId is used in your logic as needed
  return {
    success: true,
    data,
    meta: generateMeta(),
  };
}

export function error(code: string, message: string, details?: ErrorDetails, tenantId?: string): ErrorResponse {
  // Ensure tenantId is used in your logic as needed
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  };
}

export function paginated<T>(data: T, page: number, limit: number, total: number, tenantId: string): SuccessResponse<T> {
  // Ensure tenantId is used in your logic as needed
  return {
    success: true,
    data,
    meta: generateMeta({ page, limit, total }),
  };
}