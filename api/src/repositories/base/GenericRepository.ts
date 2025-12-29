/**
 * Generic CRUD Repository Implementation
 *
 * Provides a secure, tenant-aware base class for all domain repositories.
 * Implements common CRUD operations with built-in security features:
 * - Parameterized queries only (SQL injection prevention)
 * - Automatic tenant isolation
 * - Input validation (column name whitelisting)
 * - Transaction support
 * - Soft delete support
 * - Audit trail (created_by, updated_by, deleted_by)
 *
 * USAGE:
 *   class VehicleRepository extends GenericRepository<Vehicle> {
 *     constructor(pool: Pool) {
 *       super(pool, 'vehicles', 'id')
 *     }
 *
 *     // Add custom methods
 *     async findByVin(vin: string, tenantId: string) { ... }
 *   }
 */

import { Pool, PoolClient } from 'pg'

import { NotFoundError, DatabaseError } from '../../errors/AppError'
import { isValidIdentifier } from '../../utils/sql-safety'

import { IRepository } from './IRepository'
import { PaginationOptions, PaginatedResult, isValidSortOrder } from './types'

export abstract class GenericRepository<T extends { id?: string | number }> {
  protected abstract tableName: string
  protected abstract idColumn: string // Usually 'id'

  constructor(protected pool: Pool) { }

  /**
   * Get database pool or client (supports transactions)
   */
  protected getPool(client?: PoolClient): Pool | PoolClient {
    return client || this.pool
  }

  /**
   * Find single record by ID
   */
  async findById(id: string | number, tenantId: string, client?: PoolClient): Promise<T | null> {
    try {
      const pool = this.getPool(client)
      const result = await pool.query(
        `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
        [id, tenantId]
      )

      return result.rows[0] || null
    } catch (error) {
      throw new DatabaseError(`Failed to find ${this.tableName} by ID`, {
        id,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Find single record by ID or throw NotFoundError
   */
  async findByIdOrFail(id: string | number, tenantId: string, client?: PoolClient): Promise<T> {
    const record = await this.findById(id, tenantId, client)
    if (!record) {
      throw new NotFoundError(this.tableName)
    }
    return record
  }

  /**
   * Find all records with pagination
   */
  async findAll(
    tenantId: string,
    options: PaginationOptions = {},
    client?: PoolClient
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = this.idColumn,
        sortOrder = 'DESC'
      } = options

      const offset = (page - 1) * limit
      const pool = this.getPool(client)

      // Validate sortBy column name to prevent SQL injection
      if (!isValidIdentifier(sortBy)) {
        throw new DatabaseError(`Invalid sort column: ${sortBy}`, { sortBy })
      }

      // Validate sort order against allowlist
      if (!isValidSortOrder(sortOrder)) {
        throw new DatabaseError(`Invalid sort order: ${sortOrder}`, { sortOrder })
      }

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1`,
        [tenantId]
      )
      const total = parseInt(countResult.rows[0].count, 10)

      // Get paginated data (sortBy and sortOrder are validated above)
      const dataResult = await pool.query(
        `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
         WHERE tenant_id = $1
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $2 OFFSET $3`,
        [tenantId, limit, offset]
      )

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new DatabaseError(`Failed to fetch ${this.tableName} list`, {
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Find records matching WHERE conditions
   */
  async findWhere(
    conditions: Partial<T>,
    tenantId: string,
    options: PaginationOptions = {},
    client?: PoolClient
  ): Promise<PaginatedResult<T>> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = this.idColumn,
        sortOrder = 'DESC'
      } = options

      const offset = (page - 1) * limit
      const pool = this.getPool(client)

      // Validate sortBy column name to prevent SQL injection
      if (!isValidIdentifier(sortBy)) {
        throw new DatabaseError(`Invalid sort column: ${sortBy}`, { sortBy })
      }

      // Validate sort order against allowlist
      if (!isValidSortOrder(sortOrder)) {
        throw new DatabaseError(`Invalid sort order: ${sortOrder}`, { sortOrder })
      }

      // Build WHERE clause
      const whereConditions = ['tenant_id = $1']
      const values: any[] = [tenantId]
      let paramIndex = 2

      for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined) {
          // Validate column name to prevent SQL injection
          if (!isValidIdentifier(key)) {
            throw new DatabaseError(`Invalid column name: ${key}`, { key })
          }
          whereConditions.push(`${key} = $${paramIndex}`)
          values.push(value)
          paramIndex++
        }
      }

      const whereClause = whereConditions.join(' AND ')

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`,
        values
      )
      const total = parseInt(countResult.rows[0].count, 10)

      // Get paginated data (sortBy and sortOrder are validated above)
      const dataResult = await pool.query(
        `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
         WHERE ${whereClause}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      )

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new DatabaseError(`Failed to query ${this.tableName}`, {
        conditions,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Create new record
   */
  async create(
    data: Partial<T>,
    tenantId: string,
    userId: string,
    client?: PoolClient
  ): Promise<T> {
    try {
      const pool = this.getPool(client)

      // Add tenant_id and audit fields
      const dataWithMeta = {
        ...data,
        tenant_id: tenantId,
        created_by: userId,
        created_at: new Date()
      }

      const columns = Object.keys(dataWithMeta)

      // Validate all column names to prevent SQL injection
      for (const col of columns) {
        if (!isValidIdentifier(col)) {
          throw new DatabaseError(`Invalid column name: ${col}`, { col })
        }
      }

      const values = Object.values(dataWithMeta)
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

      // Column names are validated above
      const result = await pool.query(
        `INSERT INTO ${this.tableName} (${columns.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      )

      return result.rows[0]
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.tableName}`, {
        data,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Update existing record
   */
  async update(
    id: string | number,
    data: Partial<T>,
    tenantId: string,
    userId: string,
    client?: PoolClient
  ): Promise<T> {
    try {
      const pool = this.getPool(client)

      // Add updated metadata
      const dataWithMeta = {
        ...data,
        updated_at: new Date(),
        updated_by: userId
      }

      const columns = Object.keys(dataWithMeta)

      // Validate all column names to prevent SQL injection
      for (const col of columns) {
        if (!isValidIdentifier(col)) {
          throw new DatabaseError(`Invalid column name: ${col}`, { col })
        }
      }

      const values = Object.values(dataWithMeta)
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ')

      // Column names are validated above
      const result = await pool.query(
        `UPDATE ${this.tableName}
         SET ${setClause}
         WHERE ${this.idColumn} = $${columns.length + 1} AND tenant_id = $${columns.length + 2}
         RETURNING *`,
        [...values, id, tenantId]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError(this.tableName)
      }

      return result.rows[0]
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError(`Failed to update ${this.tableName}`, {
        id,
        data,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Delete record (soft delete if column exists, hard delete otherwise)
   */
  async delete(
    id: string | number,
    tenantId: string,
    userId: string,
    client?: PoolClient
  ): Promise<boolean> {
    try {
      const pool = this.getPool(client)

      // Check if soft delete column exists
      const hasSoftDelete = await this.hasColumn('deleted_at', pool)

      if (hasSoftDelete) {
        // Soft delete
        const result = await pool.query(
          `UPDATE ${this.tableName}
           SET deleted_at = NOW(), deleted_by = $1
           WHERE ${this.idColumn} = $2 AND tenant_id = $3`,
          [userId, id, tenantId]
        )
        return result.rowCount > 0
      } else {
        // Hard delete
        const result = await pool.query(
          `DELETE FROM ${this.tableName}
           WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
          [id, tenantId]
        )

        if (result.rowCount === 0) {
          throw new NotFoundError(this.tableName)
        }
        return true
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError(`Failed to delete ${this.tableName}`, {
        id,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string | number, tenantId: string, client?: PoolClient): Promise<boolean> {
    try {
      const pool = this.getPool(client)
      const result = await pool.query(
        `SELECT 1 FROM ${this.tableName} WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
        [id, tenantId]
      )
      return result.rows.length > 0
    } catch (error) {
      throw new DatabaseError(`Failed to check ${this.tableName} existence`, {
        id,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Count records matching conditions
   */
  async count(conditions: Partial<T>, tenantId: string, client?: PoolClient): Promise<number> {
    try {
      const pool = this.getPool(client)

      // Build WHERE clause
      const whereConditions = ['tenant_id = $1']
      const values: any[] = [tenantId]
      let paramIndex = 2

      for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined) {
          // Validate column name to prevent SQL injection
          if (!isValidIdentifier(key)) {
            throw new DatabaseError(`Invalid column name: ${key}`, { key })
          }
          whereConditions.push(`${key} = $${paramIndex}`)
          values.push(value)
          paramIndex++
        }
      }

      const whereClause = whereConditions.join(' AND ')

      const result = await pool.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`,
        values
      )

      return parseInt(result.rows[0].count, 10)
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.tableName}`, {
        conditions,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Check if table has a specific column
   */
  protected async hasColumn(columnName: string, pool: Pool | PoolClient): Promise<boolean> {
    const result = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`,
      [this.tableName, columnName]
    )
    return result.rows.length > 0
  }

  /**
   * Execute custom query (use sparingly - prefer typed methods)
   * @param query - SQL query with parameterized placeholders
   * @param values - Query parameters
   */
  protected async executeQuery<R>(
    query: string,
    values: any[],
    client?: PoolClient
  ): Promise<R[]> {
    try {
      const pool = this.getPool(client)
      const result = await pool.query(query, values)
      return result.rows
    } catch (error) {
      throw new DatabaseError('Query execution failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}
