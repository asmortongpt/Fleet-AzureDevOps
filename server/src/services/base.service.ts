import { logger } from './logger';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export abstract class BaseService {
  protected logger = logger;

  protected buildPaginationMeta(params: PaginationParams, total: number): PaginationMeta {
    return {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit)
    };
  }

  protected getOffset(params: PaginationParams): number {
    return (params.page - 1) * params.limit;
  }

  protected handleError(operation: string, error: unknown, context?: Record<string, any>): never {
    this.logger.error(`Error in ${operation}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    });
    throw error;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
