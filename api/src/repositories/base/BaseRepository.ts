import { Pool, PoolClient } from 'pg'

/**
 * Generic CRUD Repository Base Class
 * Implements common database operations with parameterized queries
 *
 * SECURITY: All queries use parameterized placeholders ($1, $2, $3)
 * to prevent SQL injection attacks.
 */
export abstract class BaseRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {

  protected pool: Pool
  protected tableName: string
  protected idColumn: string = 'id'

  constructor(pool: Pool, tableName: string, idColumn: string = 'id') {
    this.pool = pool
    this.tableName = tableName
    this.idColumn = idColumn
  }

  /**
   * Get the database pool
   */
  protected getPool(): Pool {
    return this.pool
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
   * Execute a custom parameterized query
   * @param sql - SQL query with $1, $2, etc. placeholders
   * @param params - Array of parameter values
   * @returns Query result rows with rowCount
   */
  protected async query<R = T>(sql: string, params: unknown[] = []): Promise<R[] & { rowCount: number }> {
    const result = await this.pool.query(sql, params)
    const rows = result.rows as R[] & { rowCount: number }
    rows.rowCount = result.rowCount ?? 0
    return rows
  }

  /**
   * Build WHERE clause for tenant isolation
   * Ensures Row-Level Security (RLS) at application layer
   */
  protected buildTenantFilter(tenantId: number | string, paramIndex: number = 1): string {
    return `tenant_id = $${paramIndex}`
  }

  /**
   * Count entities with optional filters
   * Uses parameterized query for WHERE clause
   */
  async count(filters: Record<string, unknown> = {}, tenantId: number | string): Promise<number> {
    const whereClauses: string[] = [`tenant_id = $1`]
    const params: unknown[] = [tenantId]
    let paramIndex = 2

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereClauses.push(`${key} = $${paramIndex}`)
        params.push(value)
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

  /**
   * Build WHERE clause from conditions object
   */
  protected buildWhereClause(conditions: Record<string, unknown>, startIndex: number = 1): { clause: string; params: unknown[]; nextIndex: number } {
    const clauses: string[] = []
    const params: unknown[] = []
    let index = startIndex

    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        clauses.push(`${key} = $${index}`)
        params.push(value)
        index++
      }
    })

    return {
      clause: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
      params,
      nextIndex: index
    }
  }

  /**
   * Build pagination clause
   */
  protected buildPagination(page: number = 1, limit: number = 50): { clause: string; offset: number } {
    const offset = (page - 1) * limit
    return {
      clause: `LIMIT ${limit} OFFSET ${offset}`,
      offset
    }
  }

  /**
   * Build sorting clause
   */
  protected buildSorting(sortBy: string = 'id', sortOrder: 'ASC' | 'DESC' = 'DESC'): string {
    // Basic validation - only allow alphanumeric and underscore
    const safeSortBy = sortBy.replace(/[^a-zA-Z0-9_]/g, '')
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC'
    return `ORDER BY ${safeSortBy} ${safeOrder}`
  }

  /**
   * Find records matching conditions with pagination
   */
  async findWhere(
    conditions: Record<string, unknown>,
    tenantId: number | string,
    options: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' } = {}
  ): Promise<T[]> {
    const { page = 1, limit = 50, sortBy = this.idColumn, sortOrder = 'DESC' } = options

    const whereParts = this.buildWhereClause(conditions, 2)
    const pagination = this.buildPagination(page, limit)
    const sorting = this.buildSorting(sortBy, sortOrder)

    const whereClause = `tenant_id = $1${whereParts.clause !== '1=1' ? ' AND ' + whereParts.clause : ''}`

    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} ${sorting} ${pagination.clause}`,
      [tenantId, ...whereParts.params]
    )
    return result.rows
  }
}
