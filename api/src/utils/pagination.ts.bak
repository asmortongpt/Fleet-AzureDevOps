/**
 * Pagination Utility
 * Consistent pagination across all list endpoints
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class Pagination {
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;

  static parseParams(query: any): PaginationParams {
    return {
      page: Math.max(1, parseInt(query.page || '1')),
      limit: Math.min(
        this.MAX_LIMIT,
        Math.max(1, parseInt(query.limit || String(this.DEFAULT_LIMIT)))
      ),
      sort: query.sort || 'created_at',
      order: query.order === 'asc' ? 'asc' : 'desc',
    };
  }

  static getSqlParams(params: PaginationParams): { limit: number; offset: number } {
    const page = params.page || 1;
    const limit = params.limit || this.DEFAULT_LIMIT;
    return {
      limit,
      offset: (page - 1) * limit,
    };
  }

  static buildResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResponse<T> {
    const page = params.page || 1;
    const limit = params.limit || this.DEFAULT_LIMIT;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

