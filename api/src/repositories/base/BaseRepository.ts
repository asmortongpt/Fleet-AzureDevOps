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
   * @returns Query result rows
   */
  protected async query<R = T>(sql: string, params: unknown[] = []): Promise<R[]> {
    const result = await this.pool.query(sql, params)
    return result.rows as R[]
  }

  /**
   * Build WHERE clause for tenant isolation
   * Ensures Row-Level Security (RLS) at application layer
   */
  protected buildTenantFilter(tenantId: number | string, paramIndex: number = 1): string {
    return `tenant_id = $${paramIndex}`
  }

  /**
   * Find entity by ID with tenant isolation
   * Uses parameterized query to prevent SQL injection
   */
  async findById(id: number | string, tenantId: number | string, _client?: PoolClient): Promise<T | null> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all entities with optional filters
   * Dynamically builds WHERE clause from filters object
   */
  async findAll(filters: Record<string, unknown> = {}, tenantId: number | string): Promise<T[]> {
    const whereClauses: string[] = [`tenant_id = $1`]
    const params: unknown[] = [tenantId]
    let paramIndex = 2

    // Build dynamic WHERE clause from filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereClauses.push(`${key} = $${paramIndex}`)
        params.push(value)
        paramIndex++
      }
    })

    const whereClause = whereClauses.join(' AND ')
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY ${this.idColumn} DESC`,
      params
    )
    return result.rows
  }

  /**
   * Create new entity - must be implemented by subclass
   * Subclasses handle specific column mapping and validation
   */
  abstract create(data: CreateDTO, tenantId: number | string): Promise<T>

  /**
   * Update existing entity - must be implemented by subclass
   * Subclasses handle specific column mapping and validation
   */
  abstract update(id: number | string, data: UpdateDTO, tenantId: number | string): Promise<T>

  /**
   * Delete entity with tenant isolation
   * Uses parameterized query to prevent SQL injection
   */
  async delete(id: number | string, tenantId: number | string): Promise<boolean> {
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
}
