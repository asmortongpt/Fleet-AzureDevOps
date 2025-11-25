import { Pool, PoolClient, QueryResult } from 'pg'
import { DatabaseError, NotFoundError, ValidationError } from './errors'
import { QueryLogger } from './QueryLogger'
import { getTableColumns } from '../../utils/column-resolver'

/**
 * Base Repository Class
 * Provides common CRUD operations and query utilities for all repositories
 */
export abstract class BaseRepository<T = any> {
  protected tableName: string
  protected pool: Pool
  protected logger: QueryLogger

  constructor(tableName: string, pool: Pool) {
    this.tableName = tableName
    this.pool = pool
    this.logger = new QueryLogger()
  }

  /**
   * Execute a query with automatic logging and error handling
   */
  protected async query<R = T>(
    text: string,
    params?: any[],
    client?: PoolClient
  ): Promise<QueryResult<R>> {
    const startTime = Date.now()
    const queryClient = client || this.pool

    try {
      this.logger.logQuery(text, params)
      const result = await queryClient.query<R>(text, params)
      this.logger.logSuccess(text, params, Date.now() - startTime, result.rowCount || 0)
      return result
    } catch (error: any) {
      this.logger.logError(text, params, Date.now() - startTime, error)
      throw this.handleQueryError(error)
    }
  }

  /**
   * Find all records with optional filtering and pagination
   */
  async findAll(options: {
    where?: Record<string, any>
    orderBy?: string
    limit?: number
    offset?: number
    client?: PoolClient
  } = {}): Promise<T[]> {
    const { where = {}, orderBy = 'created_at DESC', limit, offset, client } = options

    const columns = await getTableColumns(this.pool, this.tableName)
    const columnList = columns.join(', ')

    const whereConditions: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    const whereClause = whereConditions.length > 0 ? 'WHERE ${whereConditions.join(' AND ')}' : ''
    const limitClause = limit ? 'LIMIT $${paramCount++}' : ''
    const offsetClause = offset ? 'OFFSET $${paramCount}' : ''

    if (limit) values.push(limit)
    if (offset) values.push(offset)

    const query = `
      SELECT ${columnList} FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${orderBy}
      ${limitClause} ${offsetClause}
    `.trim()

    const result = await this.query<T>(query, values, client)
    return result.rows
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string | number, tenantId?: string, client?: PoolClient): Promise<T | null> {
    const columns = await getTableColumns(this.pool, this.tableName)
    const columnList = columns.join(', ')

    const whereConditions = ['id = $1']
    const values: any[] = [id]

    if (tenantId !== undefined) {
      whereConditions.push('tenant_id = $2')
      values.push(tenantId)
    }

    const query = `
      SELECT ${columnList} FROM ${this.tableName}
      WHERE ${whereConditions.join(' AND ')}
      LIMIT 1
    `

    const result = await this.query<T>(query, values, client)
    return result.rows[0] || null
  }

  /**
   * Find a single record by conditions
   */
  async findOne(where: Record<string, any>, client?: PoolClient): Promise<T | null> {
    const columns = await getTableColumns(this.pool, this.tableName)
    const columnList = columns.join(', ')

    const whereConditions: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    if (whereConditions.length === 0) {
      throw new ValidationError('At least one condition must be provided')
    }

    const query = `
      SELECT ${columnList} FROM ${this.tableName}
      WHERE ${whereConditions.join(' AND ')}
      LIMIT 1
    `

    const result = await this.query<T>(query, values, client)
    return result.rows[0] || null
  }

  /**
   * Count records with optional filtering
   */
  async count(where: Record<string, any> = {}, client?: PoolClient): Promise<number> {
    const whereConditions: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    const whereClause = whereConditions.length > 0 ? 'WHERE ${whereConditions.join(' AND ')}' : ''

    const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`
    const result = await this.query<{ count: string }>(query, values, client)
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>, client?: PoolClient): Promise<T> {
    const keys = Object.keys(data)
    const values = Object.values(data)

    if (keys.length === 0) {
      throw new ValidationError('No data provided for creation')
    }

    const columns = keys.join(', ')
    const placeholders = keys.map((_, i) => '$${i + 1}').join(', ')

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `

    const result = await this.query<T>(query, values, client)
    return result.rows[0]
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string | number,
    data: Partial<T>,
    tenantId?: string,
    client?: PoolClient
  ): Promise<T> {
    const keys = Object.keys(data).filter(key => key !== 'id')
    const values = keys.map(key => (data as any)[key])

    if (keys.length === 0) {
      throw new ValidationError('No data provided for update')
    }

    const setClause = keys.map((key, i) => '${key} = $${i + 1}').join(', ')
    const whereConditions = [`id = $${keys.length + 1}`]
    const whereValues = [...values, id]

    if (tenantId !== undefined) {
      whereConditions.push(`tenant_id = $${keys.length + 2}`)
      whereValues.push(tenantId)
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE ${whereConditions.join(' AND ')}
      RETURNING *
    `

    const result = await this.query<T>(query, whereValues, client)

    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} record with id ${id} not found`)
    }

    return result.rows[0]
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string | number, tenantId?: string, client?: PoolClient): Promise<boolean> {
    const whereConditions = ['id = $1']
    const values: any[] = [id]

    if (tenantId !== undefined) {
      whereConditions.push('tenant_id = $2')
      values.push(tenantId)
    }

    const query = `
      DELETE FROM ${this.tableName}
      WHERE ${whereConditions.join(' AND ')}
      RETURNING id
    `

    const result = await this.query(query, values, client)
    return result.rows.length > 0
  }

  /**
   * Soft delete a record (requires deleted_at column)
   */
  async softDelete(id: string | number, tenantId?: string, client?: PoolClient): Promise<T> {
    const whereConditions = ['id = $1']
    const values: any[] = [id]

    if (tenantId !== undefined) {
      whereConditions.push('tenant_id = $2')
      values.push(tenantId)
    }

    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = NOW()
      WHERE ${whereConditions.join(' AND ')} AND deleted_at IS NULL
      RETURNING *
    `

    const result = await this.query<T>(query, values, client)

    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} record with id ${id} not found`)
    }

    return result.rows[0]
  }

  /**
   * Bulk create records
   */
  async bulkCreate(records: Partial<T>[], client?: PoolClient): Promise<T[]> {
    if (records.length === 0) {
      return []
    }

    const keys = Object.keys(records[0])
    const columns = keys.join(', ')

    const valuePlaceholders: string[] = []
    const values: any[] = []
    let paramCount = 1

    records.forEach(record => {
      const recordValues = keys.map(key => (record as any)[key])
      const placeholders = keys.map(() => '$${paramCount++}').join(', ')
      valuePlaceholders.push(`(${placeholders})`)
      values.push(...recordValues)
    })

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES ${valuePlaceholders.join(', ')}
      RETURNING *
    `

    const result = await this.query<T>(query, values, client)
    return result.rows
  }

  /**
   * Check if a record exists
   */
  async exists(where: Record<string, any>, client?: PoolClient): Promise<boolean> {
    const count = await this.count(where, client)
    return count > 0
  }

  /**
   * Get paginated results
   */
  async paginate(options: {
    where?: Record<string, any>
    orderBy?: string
    page?: number
    limit?: number
    client?: PoolClient
  }) {
    const { where = {}, orderBy = 'created_at DESC', page = 1, limit = 50, client } = options

    const offset = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.findAll({ where, orderBy, limit, offset, client }),
      this.count(where, client)
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Handle query errors and convert to custom error types
   */
  protected handleQueryError(error: any): Error {
    // PostgreSQL error codes
    const errorCode = error.code

    switch (errorCode) {
      case '23505': // unique_violation
        return new ValidationError(`Duplicate entry: ${error.detail || error.message}`)
      case '23503': // foreign_key_violation
        return new ValidationError(`Foreign key constraint failed: ${error.detail || error.message}`)
      case '23502': // not_null_violation
        return new ValidationError(`Required field missing: ${error.column || error.message}`)
      case '22P02': // invalid_text_representation
        return new ValidationError(`Invalid data format: ${error.message}`)
      default:
        return new DatabaseError(error.message, errorCode)
    }
  }
}
