/**
 * Base Repository Pattern Implementation
 *
 * Provides a consistent data access layer with:
 * - Transaction support
 * - Query utilities
 * - Pagination helpers
 */

import { Pool, PoolClient } from 'pg';

import { connectionManager } from '../config/connection-manager';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryContext {
  userId: string;
  tenantId: string;
  pool?: Pool | PoolClient;
}

/**
 * Base Repository - provides utility methods for subclasses
 * Subclasses implement their own CRUD operations
 */
export abstract class BaseRepository<T extends { id: string | number }> {
  protected tableName: string = '';
  protected idColumn: string = 'id';
  protected _pool?: Pool | PoolClient;

  constructor(tableName?: string, pool?: Pool | PoolClient) {
    if (tableName) this.tableName = tableName;
    if (pool) this._pool = pool;
  }

  /**
   * Get database pool
   */
  protected getPool(context?: QueryContext): Pool | PoolClient {
    if (this._pool) return this._pool;
    if (context?.pool) return context.pool;
    return connectionManager.getPool();
  }

  /**
   * Execute a custom parameterized query
   */
  protected async query<R = T>(sql: string, params: unknown[] = []): Promise<R[] & { rowCount: number }> {
    const pool = this.getPool();
    const result = await pool.query(sql, params);
    const rows = result.rows as R[] & { rowCount: number };
    rows.rowCount = result.rowCount ?? 0;
    return rows;
  }

  /**
   * Execute query within a transaction
   */
  protected async withTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const pool = connectionManager.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Build WHERE clause from conditions
   */
  protected buildWhereClause(conditions: Record<string, unknown>, startIndex: number = 1): { clause: string; params: unknown[]; nextIndex: number } {
    const clauses: string[] = [];
    const params: unknown[] = [];
    let index = startIndex;

    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        clauses.push(`${key} = $${index}`);
        params.push(value);
        index++;
      }
    });

    return {
      clause: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
      params,
      nextIndex: index
    };
  }

  /**
   * Build pagination clause
   */
  protected buildPagination(page: number = 1, limit: number = 50): { clause: string; offset: number } {
    const offset = (page - 1) * limit;
    return {
      clause: `LIMIT ${limit} OFFSET ${offset}`,
      offset
    };
  }

  /**
   * Build sorting clause
   */
  protected buildSorting(sortBy: string = 'id', sortOrder: 'ASC' | 'DESC' = 'DESC'): string {
    const safeSortBy = sortBy.replace(/[^a-zA-Z0-9_]/g, '');
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    return `ORDER BY ${safeSortBy} ${safeOrder}`;
  }

  /**
   * Build tenant isolation filter
   */
  protected buildTenantFilter(tenantId: number | string, paramIndex: number = 1): string {
    return `tenant_id = $${paramIndex}`;
  }

  /**
   * Execute transaction
   */
  async transaction<R>(
    context: QueryContext,
    callback: (txContext: QueryContext) => Promise<R>
  ): Promise<R> {
    const pool = connectionManager.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const txContext: QueryContext = { ...context, pool: client };
      const result = await callback(txContext);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
