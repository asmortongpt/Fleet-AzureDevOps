/**
 * Base Repository Interface and Abstract Class
 *
 * Provides standardized CRUD operations with tenant isolation
 * All repositories must extend this to ensure consistent patterns
 *
 * @module repositories/base
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';

/**
 * Base filter interface for queries
 */
export interface BaseFilter {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  search?: string;
}

/**
 * Pagination result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Base Repository Interface
 *
 * Defines standard CRUD operations that all repositories must implement
 */
export interface IRepository<T> {
  /**
   * Find a single record by ID
   * @param id - Record identifier
   * @param tenantId - Tenant identifier for isolation
   * @returns The record or null if not found
   */
  findById(id: string, tenantId: string): Promise<T | null>;

  /**
   * Find all records matching filters
   * @param tenantId - Tenant identifier for isolation
   * @param filters - Optional filters to apply
   * @returns Array of matching records
   */
  findAll(tenantId: string, filters?: BaseFilter): Promise<T[]>;

  /**
   * Find records with pagination
   * @param tenantId - Tenant identifier for isolation
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of records per page
   * @param filters - Optional filters to apply
   * @returns Paginated result
   */
  findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: BaseFilter
  ): Promise<PaginatedResult<T>>;

  /**
   * Find a single record matching filters
   * @param tenantId - Tenant identifier for isolation
   * @param filters - Filters to apply
   * @returns The first matching record or null
   */
  findOne(tenantId: string, filters: Partial<T>): Promise<T | null>;

  /**
   * Create a new record
   * @param data - Data for the new record
   * @param tenantId - Tenant identifier for isolation
   * @returns The created record
   */
  create(data: Partial<T>, tenantId: string): Promise<T>;

  /**
   * Update an existing record
   * @param id - Record identifier
   * @param data - Data to update
   * @param tenantId - Tenant identifier for isolation
   * @returns The updated record
   */
  update(id: string, data: Partial<T>, tenantId: string): Promise<T>;

  /**
   * Delete a record (soft delete if supported)
   * @param id - Record identifier
   * @param tenantId - Tenant identifier for isolation
   */
  delete(id: string, tenantId: string): Promise<void>;

  /**
   * Hard delete a record (permanent removal)
   * @param id - Record identifier
   * @param tenantId - Tenant identifier for isolation
   */
  hardDelete(id: string, tenantId: string): Promise<void>;

  /**
   * Count records matching filters
   * @param tenantId - Tenant identifier for isolation
   * @param filters - Optional filters to apply
   * @returns Count of matching records
   */
  count(tenantId: string, filters?: Partial<T>): Promise<number>;

  /**
   * Check if a record exists
   * @param id - Record identifier
   * @param tenantId - Tenant identifier for isolation
   * @returns True if record exists
   */
  exists(id: string, tenantId: string): Promise<boolean>;

  /**
   * Execute a bulk insert
   * @param data - Array of records to insert
   * @param tenantId - Tenant identifier for isolation
   * @returns Array of created records
   */
  bulkCreate(data: Partial<T>[], tenantId: string): Promise<T[]>;

  /**
   * Execute a bulk update
   * @param ids - Array of record identifiers
   * @param data - Data to update
   * @param tenantId - Tenant identifier for isolation
   * @returns Number of records updated
   */
  bulkUpdate(ids: string[], data: Partial<T>, tenantId: string): Promise<number>;

  /**
   * Execute a bulk delete
   * @param ids - Array of record identifiers
   * @param tenantId - Tenant identifier for isolation
   * @returns Number of records deleted
   */
  bulkDelete(ids: string[], tenantId: string): Promise<number>;
}

/**
 * Abstract Base Repository Implementation
 *
 * Provides common functionality for all repositories
 * Enforces tenant isolation and standardized error handling
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  protected pool: Pool;
  protected tableName: string;
  protected idColumn: string = 'id';
  protected tenantColumn: string = 'tenant_id';
  protected softDelete: boolean = false;
  protected deletedAtColumn: string = 'deleted_at';

  constructor(pool: Pool, tableName: string, options?: {
    idColumn?: string;
    tenantColumn?: string;
    softDelete?: boolean;
    deletedAtColumn?: string;
  }) {
    this.pool = pool;
    this.tableName = tableName;

    if (options) {
      this.idColumn = options.idColumn || this.idColumn;
      this.tenantColumn = options.tenantColumn || this.tenantColumn;
      this.softDelete = options.softDelete || this.softDelete;
      this.deletedAtColumn = options.deletedAtColumn || this.deletedAtColumn;
    }
  }

  /**
   * Build WHERE clause with tenant isolation
   */
  protected buildWhereClause(tenantId: string, additionalConditions: string[] = []): string {
    const conditions = [`${this.tenantColumn} = $1`];

    // Add soft delete filter if enabled
    if (this.softDelete) {
      conditions.push(`${this.deletedAtColumn} IS NULL`);
    }

    // Add additional conditions
    conditions.push(...additionalConditions);

    return `WHERE ${conditions.join(' AND ')}`;
  }

  /**
   * Build ORDER BY clause from filters
   */
  protected buildOrderClause(filters?: BaseFilter): string {
    if (!filters?.orderBy) {
      return `ORDER BY ${this.idColumn} ASC`;
    }

    const direction = filters.orderDirection || 'ASC';
    return `ORDER BY ${filters.orderBy} ${direction}`;
  }

  /**
   * Build LIMIT and OFFSET clause
   */
  protected buildLimitClause(filters?: BaseFilter): string {
    const parts: string[] = [];

    if (filters?.limit) {
      parts.push(`LIMIT ${filters.limit}`);
    }

    if (filters?.offset) {
      parts.push(`OFFSET ${filters.offset}`);
    }

    return parts.join(' ');
  }

  /**
   * Execute query with error handling and logging
   */
  protected async executeQuery<R = any>(
    query: string,
    params: any[],
    operation: string
  ): Promise<QueryResult<R>> {
    try {
      logger.debug(`Repository ${operation}`, {
        table: this.tableName,
        query: query.substring(0, 200), // Log first 200 chars
        paramCount: params.length
      });

      const result = await this.pool.query<R>(query, params);

      logger.debug(`Repository ${operation} completed`, {
        table: this.tableName,
        rowCount: result.rowCount
      });

      return result;
    } catch (error) {
      logger.error(`Repository ${operation} failed`, {
        table: this.tableName,
        error: error instanceof Error ? error.message : String(error),
        query: query.substring(0, 200)
      });
      throw error;
    }
  }

  /**
   * Map database row to entity (override in child classes for custom mapping)
   */
  protected mapToEntity(row: any): T {
    return row as T;
  }

  /**
   * Map entity to database row (override in child classes for custom mapping)
   */
  protected mapToRow(entity: Partial<T>): any {
    return entity;
  }

  // ============================================
  // IRepository Implementation
  // ============================================

  async findById(id: string, tenantId: string): Promise<T | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      ${this.buildWhereClause(tenantId, [`${this.idColumn} = $2`])}
    `;

    const result = await this.executeQuery(query, [tenantId, id], 'findById');
    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
  }

  async findAll(tenantId: string, filters?: BaseFilter): Promise<T[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      ${this.buildWhereClause(tenantId)}
      ${this.buildOrderClause(filters)}
      ${this.buildLimitClause(filters)}
    `;

    const result = await this.executeQuery(query, [tenantId], 'findAll');
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: BaseFilter
  ): Promise<PaginatedResult<T>> {
    const offset = (page - 1) * pageSize;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM ${this.tableName}
      ${this.buildWhereClause(tenantId)}
    `;
    const countResult = await this.executeQuery(countQuery, [tenantId], 'count');
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${this.buildWhereClause(tenantId)}
      ${this.buildOrderClause(filters)}
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    const dataResult = await this.executeQuery(dataQuery, [tenantId], 'findPaginated');

    return {
      data: dataResult.rows.map(row => this.mapToEntity(row)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async findOne(tenantId: string, filters: Partial<T>): Promise<T | null> {
    const filterKeys = Object.keys(filters);
    const conditions = filterKeys.map((key, idx) => `${key} = $${idx + 2}`);

    const query = `
      SELECT * FROM ${this.tableName}
      ${this.buildWhereClause(tenantId, conditions)}
      LIMIT 1
    `;

    const params = [tenantId, ...filterKeys.map(key => (filters as any)[key])];
    const result = await this.executeQuery(query, params, 'findOne');

    return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
  }

  async create(data: Partial<T>, tenantId: string): Promise<T> {
    const row = this.mapToRow(data);
    const keys = Object.keys(row);
    const values = keys.map(key => row[key]);

    // Add tenant_id
    keys.push(this.tenantColumn);
    values.push(tenantId);

    const placeholders = keys.map((_, idx) => `$${idx + 1}`);

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.executeQuery(query, values, 'create');
    return this.mapToEntity(result.rows[0]);
  }

  async update(id: string, data: Partial<T>, tenantId: string): Promise<T> {
    const row = this.mapToRow(data);
    const keys = Object.keys(row);
    const values = keys.map(key => row[key]);

    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      ${this.buildWhereClause(tenantId, [`${this.idColumn} = $${keys.length + 2}`])}
      RETURNING *
    `;

    const params = [...values, tenantId, id];
    const result = await this.executeQuery(query, params, 'update');

    if (result.rows.length === 0) {
      throw new Error(`Record not found: ${id}`);
    }

    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    if (this.softDelete) {
      // Soft delete
      const query = `
        UPDATE ${this.tableName}
        SET ${this.deletedAtColumn} = NOW()
        ${this.buildWhereClause(tenantId, [`${this.idColumn} = $2`])}
      `;
      await this.executeQuery(query, [tenantId, id], 'softDelete');
    } else {
      // Hard delete
      await this.hardDelete(id, tenantId);
    }
  }

  async hardDelete(id: string, tenantId: string): Promise<void> {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE ${this.tenantColumn} = $1 AND ${this.idColumn} = $2
    `;
    await this.executeQuery(query, [tenantId, id], 'hardDelete');
  }

  async count(tenantId: string, filters?: Partial<T>): Promise<number> {
    let conditions: string[] = [];
    let params: any[] = [tenantId];

    if (filters) {
      const filterKeys = Object.keys(filters);
      conditions = filterKeys.map((key, idx) => `${key} = $${idx + 2}`);
      params.push(...filterKeys.map(key => (filters as any)[key]));
    }

    const query = `
      SELECT COUNT(*) as total FROM ${this.tableName}
      ${this.buildWhereClause(tenantId, conditions)}
    `;

    const result = await this.executeQuery(query, params, 'count');
    return parseInt(result.rows[0].total);
  }

  async exists(id: string, tenantId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM ${this.tableName}
      ${this.buildWhereClause(tenantId, [`${this.idColumn} = $2`])}
      LIMIT 1
    `;

    const result = await this.executeQuery(query, [tenantId, id], 'exists');
    return result.rows.length > 0;
  }

  async bulkCreate(data: Partial<T>[], tenantId: string): Promise<T[]> {
    if (data.length === 0) return [];

    const rows = data.map(item => this.mapToRow(item));
    const firstRow = rows[0];
    const keys = [...Object.keys(firstRow), this.tenantColumn];

    const valueSets = rows.map((row, rowIdx) => {
      const rowValues = Object.values(row);
      const placeholders = keys.map((_, colIdx) =>
        `$${rowIdx * keys.length + colIdx + 1}`
      );
      return `(${placeholders.join(', ')})`;
    });

    const allValues = rows.flatMap(row => [...Object.values(row), tenantId]);

    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES ${valueSets.join(', ')}
      RETURNING *
    `;

    const result = await this.executeQuery(query, allValues, 'bulkCreate');
    return result.rows.map(row => this.mapToEntity(row));
  }

  async bulkUpdate(ids: string[], data: Partial<T>, tenantId: string): Promise<number> {
    if (ids.length === 0) return 0;

    const row = this.mapToRow(data);
    const keys = Object.keys(row);
    const values = keys.map(key => row[key]);

    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
    const idPlaceholders = ids.map((_, idx) => `$${keys.length + 2 + idx}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE ${this.tenantColumn} = $${keys.length + 1}
        AND ${this.idColumn} IN (${idPlaceholders})
        ${this.softDelete ? `AND ${this.deletedAtColumn} IS NULL` : ''}
    `;

    const params = [...values, tenantId, ...ids];
    const result = await this.executeQuery(query, params, 'bulkUpdate');

    return result.rowCount || 0;
  }

  async bulkDelete(ids: string[], tenantId: string): Promise<number> {
    if (ids.length === 0) return 0;

    if (this.softDelete) {
      const idPlaceholders = ids.map((_, idx) => `$${2 + idx}`).join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${this.deletedAtColumn} = NOW()
        WHERE ${this.tenantColumn} = $1
          AND ${this.idColumn} IN (${idPlaceholders})
      `;

      const result = await this.executeQuery(query, [tenantId, ...ids], 'bulkSoftDelete');
      return result.rowCount || 0;
    } else {
      const idPlaceholders = ids.map((_, idx) => `$${2 + idx}`).join(', ');

      const query = `
        DELETE FROM ${this.tableName}
        WHERE ${this.tenantColumn} = $1 AND ${this.idColumn} IN (${idPlaceholders})
      `;

      const result = await this.executeQuery(query, [tenantId, ...ids], 'bulkDelete');
      return result.rowCount || 0;
    }
  }

  /**
   * Transaction support - execute multiple operations in a transaction
   */
  async executeInTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const client = await this.pool.connect();

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
}

export default BaseRepository;
