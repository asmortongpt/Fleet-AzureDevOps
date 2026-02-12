/**
 * Error handling utilities for Fleet CTA MCP Server
 */

import { ApiError } from '../types.js';

export class FleetApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FleetApiError';
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof FleetApiError) {
    return `Fleet API Error (${error.statusCode || 'unknown'}): ${error.message}`;
  }

  if (error instanceof Error) {
    if ('response' in error) {
      const axiosError = error as { response?: { status: number; data: unknown } };
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as ApiError;
        return `API Error (${status}): ${data.message || data.error || 'Unknown error'}`;
      }
    }
    return `Error: ${error.message}`;
  }

  return 'An unknown error occurred';
}

export function formatErrorResponse(error: unknown): { error: string; details?: unknown } {
  const message = handleApiError(error);

  if (error instanceof FleetApiError && error.details) {
    return { error: message, details: error.details };
  }

  return { error: message };
}
