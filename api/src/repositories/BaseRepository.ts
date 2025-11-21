/**
 * Base Repository Pattern Implementation
 *
 * Provides a consistent data access layer with:
 * - CRUD operations
 * - Tenant isolation (RLS)
 * - Transaction support
 * - Error handling
 * - Pagination
 */

import { Pool, PoolClient } from 'pg';
import { connectionManager } from '../config/connection-manager';
import { NotFoundError, DatabaseError } from '../middleware/error-handler';

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
  pool?: Pool | PoolClient; // Allow custom pool or transaction client
}

/**
 * Base Repository with common CRUD operations
 */
export abstract class BaseRepository<T extends { id: string | number }> {
  protected abstract tableName: string;
  protected abstract idColumn: string; // Usually 'id'

  /**
   * Get database pool (supports transactions)
   */
  protected getPool(context: QueryContext): Pool | PoolClient {
    return context.pool || connectionManager.getPool();
  }

  /**
   * Find single record by ID
   */
  async findById(id: string | number, context: QueryContext): Promise<T | null> {
    try {
      const pool = this.getPool(context);
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
        [id, context.tenantId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.tableName} by ID`, { id, error });
    }
  }

  /**
   * Find single record by ID or throw NotFoundError
   */
  async findByIdOrFail(id: string | number, context: QueryContext): Promise<T> {
    const record = await this.findById(id, context);
    if (!record) {
      throw new NotFoundError(this.tableName);
    }
    return record;
  }

  /**
   * Find all records with pagination
   */
  async findAll(
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = this.idColumn,
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      const pool = this.getPool(context);

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1`,
        [context.tenantId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated data
      const dataResult = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE tenant_id = $1
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $2 OFFSET $3`,
        [context.tenantId, limit, offset]
      );

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError(`Failed to fetch ${this.tableName} list`, { error });
    }
  }

  /**
   * Find records matching WHERE conditions
   */
  async findWhere(
    conditions: Partial<T>,
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = this.idColumn,
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      const pool = this.getPool(context);

      // Build WHERE clause
      const whereConditions = ['tenant_id = $1'];
      const values: any[] = [context.tenantId];
      let paramIndex = 2;

      for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined) {
          whereConditions.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated data
      const dataResult = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError(`Failed to query ${this.tableName}`, { conditions, error });
    }
  }

  /**
   * Create new record
   */
  async create(data: Omit<T, 'id'>, context: QueryContext): Promise<T> {
    try {
      const pool = this.getPool(context);

      // Add tenant_id to data
      const dataWithTenant = {
        ...data,
        tenant_id: context.tenantId,
        created_by: context.userId
      };

      const columns = Object.keys(dataWithTenant);
      const values = Object.values(dataWithTenant);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      const result = await pool.query(
        `INSERT INTO ${this.tableName} (${columns.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.tableName}`, { data, error });
    }
  }

  /**
   * Update existing record
   */
  async update(
    id: string | number,
    data: Partial<Omit<T, 'id'>>,
    context: QueryContext
  ): Promise<T> {
    try {
      const pool = this.getPool(context);

      // Add updated metadata
      const dataWithMeta = {
        ...data,
        updated_at: new Date(),
        updated_by: context.userId
      };

      const columns = Object.keys(dataWithMeta);
      const values = Object.values(dataWithMeta);
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

      const result = await pool.query(
        `UPDATE ${this.tableName}
         SET ${setClause}
         WHERE ${this.idColumn} = $${columns.length + 1} AND tenant_id = $${columns.length + 2}
         RETURNING *`,
        [...values, id, context.tenantId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(this.tableName);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to update ${this.tableName}`, { id, data, error });
    }
  }

  /**
   * Delete record (soft delete if column exists, hard delete otherwise)
   */
  async delete(id: string | number, context: QueryContext): Promise<void> {
    try {
      const pool = this.getPool(context);

      // Check if soft delete column exists
      const hasSoftDelete = await this.hasColumn('deleted_at', pool);

      if (hasSoftDelete) {
        // Soft delete
        await pool.query(
          `UPDATE ${this.tableName}
           SET deleted_at = NOW(), deleted_by = $1
           WHERE ${this.idColumn} = $2 AND tenant_id = $3`,
          [context.userId, id, context.tenantId]
        );
      } else {
        // Hard delete
        const result = await pool.query(
          `DELETE FROM ${this.tableName}
           WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
          [id, context.tenantId]
        );

        if (result.rowCount === 0) {
          throw new NotFoundError(this.tableName);
        }
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to delete ${this.tableName}`, { id, error });
    }
  }

  /**
   * Check if table has a specific column
   */
  private async hasColumn(columnName: string, pool: Pool | PoolClient): Promise<boolean> {
    const result = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`,
      [this.tableName, columnName]
    );
    return result.rows.length > 0;
  }

  /**
   * Execute in transaction
   */
  async transaction<R>(
    context: QueryContext,
    callback: (txContext: QueryContext) => Promise<R>
  ): Promise<R> {
    const pool = connectionManager.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const txContext: QueryContext = {
        ...context,
        pool: client
      };

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
