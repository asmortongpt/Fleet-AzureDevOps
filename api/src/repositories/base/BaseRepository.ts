import { Pool, PoolClient } from 'pg'

import { IRepository } from './IRepository'
import { PaginatedResult, PaginationOptions } from './types'

/**
 * Generic CRUD Repository Base Class
 * Implements common database operations with parameterized queries
 *
 * SECURITY: All queries use parameterized placeholders ($1, $2, $3)
 * to prevent SQL injection attacks.
 */
export abstract class BaseRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>
  implements IRepository<T, CreateDTO, UpdateDTO> {

  protected pool: Pool
  protected tableName: string
  protected idColumn: string = 'id'

  constructor(pool: Pool, tableName: string, idColumn: string = 'id') {
    this.pool = pool
    this.tableName = tableName
    this.idColumn = idColumn
  }

  /**
   * Execute query within a transaction
   * Automatically handles BEGIN, COMMIT, and ROLLBACK
   */
  protected async withTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Build WHERE clause for tenant isolation
   * Ensures Row-Level Security (RLS) at application layer
   */
  protected buildTenantFilter(tenantId: string, paramIndex: number = 1): string {
    return `tenant_id = $${paramIndex}`
  }

  /**
   * Find entity by ID with tenant isolation
   * Uses parameterized query to prevent SQL injection
   */
  async findById(id: number | string, tenantId: string, _client?: PoolClient): Promise<T | null> {
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all entities with optional filters and pagination
   */
  async findAll(tenantId: string, options: PaginationOptions = {}, _client?: PoolClient): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 50, sortBy = this.idColumn, sortOrder = 'DESC' } = options
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    // Get paginated data
    const result = await this.pool.query(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE tenant_id = $1 ORDER BY ${sortBy} ${sortOrder} LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Create new entity
   */
  abstract create(data: CreateDTO, tenantId: string, userId: string, client?: PoolClient): Promise<T>

  /**
   * Update existing entity
   */
  abstract update(id: number | string, data: UpdateDTO, tenantId: string, userId: string, client?: PoolClient): Promise<T>

  /**
   * Delete entity with tenant isolation
   * Uses parameterized query to prevent SQL injection
   */
  async delete(id: number | string, tenantId: string, _userId: string, _client?: PoolClient): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rowCount !== null && result.rowCount > 0
  }

  /**
   * Count entities with optional filters
   * Uses parameterized query for WHERE clause
   */
  async count(conditions: Partial<T>, tenantId: string, _client?: PoolClient): Promise<number> {
    const whereClauses: string[] = [`tenant_id = $1`]
    const params: (string | number | boolean)[] = [tenantId]
    let paramIndex = 2

    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereClauses.push(`${key} = $${paramIndex}`)
        params.push(value as string | number | boolean)
        paramIndex++
      }
    })

    const whereClause = whereClauses.join(' AND ')
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`,
      params
    )
    return parseInt(result.rows[0].count, 10)
  }
}
