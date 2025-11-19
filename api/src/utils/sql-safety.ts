/**
 * SQL Safety Utilities
 * Prevents SQL injection by validating column names and building safe queries
 * Enforces field whitelisting to prevent mass assignment vulnerabilities
 */

import { filterToWhitelist } from '../config/field-whitelists'

// Valid identifier pattern: alphanumeric, underscores, max 63 chars (PostgreSQL limit)
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/

/**
 * Validates that a string is a safe SQL identifier
 * Prevents SQL injection through column names
 */
export function isValidIdentifier(name: string): boolean {
  return VALID_IDENTIFIER.test(name)
}

/**
 * Validates an array of column names
 * Throws error if any column name is invalid
 */
export function validateColumnNames(columns: string[]): void {
  const invalidColumns = columns.filter(col => !isValidIdentifier(col))
  if (invalidColumns.length > 0) {
    throw new Error(`Invalid column names: ${invalidColumns.join(', ')}`)
  }
}

/**
 * Safely builds an UPDATE SET clause with validated column names and field whitelisting
 * @param data Object with column names as keys
 * @param startIndex Parameter index to start from (default: 1)
 * @param resourceType Optional resource type for field whitelisting (e.g., 'users', 'vehicles')
 * @returns Object with fields string and values array
 */
export function buildUpdateClause(
  data: Record<string, any>,
  startIndex: number = 1,
  resourceType?: string
): { fields: string; values: any[] } {
  // Apply field whitelist if resourceType is provided
  let filteredData = data
  if (resourceType) {
    filteredData = filterToWhitelist(data, resourceType, 'update')
    if (Object.keys(filteredData).length === 0) {
      throw new Error(`No valid fields provided for update operation on ${resourceType}`)
    }
  }

  const columns = Object.keys(filteredData)
  validateColumnNames(columns)

  const fields = columns.map((key, i) => `${key} = $${i + startIndex}`).join(', ')
  const values = Object.values(filteredData)

  return { fields, values }
}

/**
 * Safely builds an INSERT columns and placeholders with field whitelisting
 * @param data Object with column names as keys
 * @param additionalColumns Additional validated columns to prepend (e.g., ['tenant_id'])
 * @param startIndex Parameter index to start from (default: 1)
 * @param resourceType Optional resource type for field whitelisting (e.g., 'users', 'vehicles')
 * @returns Object with columnNames string, placeholders string, and values array
 */
export function buildInsertClause(
  data: Record<string, any>,
  additionalColumns: string[] = [],
  startIndex: number = 1,
  resourceType?: string
): { columnNames: string; placeholders: string; values: any[] } {
  // Apply field whitelist if resourceType is provided
  let filteredData = data
  if (resourceType) {
    filteredData = filterToWhitelist(data, resourceType, 'create')
    if (Object.keys(filteredData).length === 0) {
      throw new Error(`No valid fields provided for create operation on ${resourceType}`)
    }
  }

  const columns = Object.keys(filteredData)
  validateColumnNames(columns)
  validateColumnNames(additionalColumns)

  const allColumns = [...additionalColumns, ...columns]
  const columnNames = allColumns.join(', ')

  const placeholders = allColumns
    .map((_, i) => `$${i + startIndex}`)
    .join(', ')

  const values = Object.values(filteredData)

  return { columnNames, placeholders, values }
}

/**
 * Safely builds a WHERE clause with AND conditions
 * @param conditions Object with column names as keys
 * @param startIndex Parameter index to start from (default: 1)
 * @returns Object with whereClause string and values array
 */
export function buildWhereClause(
  conditions: Record<string, any>,
  startIndex: number = 1
): { whereClause: string; values: any[] } {
  const columns = Object.keys(conditions)
  validateColumnNames(columns)

  const whereClause = columns
    .map((key, i) => `${key} = $${i + startIndex}`)
    .join(' AND ')

  const values = Object.values(conditions)

  return { whereClause, values }
}

/**
 * Validates and quotes a table name
 * Prevents SQL injection through table names
 */
export function validateTableName(tableName: string): string {
  if (!isValidIdentifier(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`)
  }
  return tableName
}

/**
 * Advanced query builder with pagination and sorting
 */
export interface QueryBuilderOptions {
  table: string
  columns?: string[]
  where?: Record<string, any>
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  limit?: number
  offset?: number
  joins?: Array<{
    type: 'INNER' | 'LEFT' | 'RIGHT'
    table: string
    on: string
  }>
}

/**
 * Build a complete SELECT query with safety checks
 */
export function buildSelectQuery(options: QueryBuilderOptions): {
  query: string
  values: any[]
} {
  const {
    table,
    columns = ['*'],
    where,
    orderBy,
    orderDirection = 'DESC',
    limit,
    offset,
    joins = []
  } = options

  // Validate table name
  validateTableName(table)

  // Validate column names (unless SELECT *)
  if (columns[0] !== '*') {
    validateColumnNames(columns)
  }

  // Build SELECT clause
  const selectClause = columns.join(', ')

  // Build JOIN clauses
  let joinClauses = ''
  for (const join of joins) {
    validateTableName(join.table)
    joinClauses += ` ${join.type} JOIN ${join.table} ON ${join.on}`
  }

  // Build WHERE clause
  let whereClause = ''
  const values: any[] = []
  if (where) {
    const { whereClause: wc, values: wv } = buildWhereClause(where)
    whereClause = ` WHERE ${wc}`
    values.push(...wv)
  }

  // Build ORDER BY clause
  let orderClause = ''
  if (orderBy) {
    validateColumnNames([orderBy])
    const direction = orderDirection === 'ASC' ? 'ASC' : 'DESC'
    orderClause = ` ORDER BY ${orderBy} ${direction}`
  }

  // Build LIMIT and OFFSET
  let limitClause = ''
  if (limit !== undefined) {
    limitClause = ` LIMIT $${values.length + 1}`
    values.push(limit)
  }

  let offsetClause = ''
  if (offset !== undefined) {
    offsetClause = ` OFFSET $${values.length + 1}`
    values.push(offset)
  }

  // Construct final query
  const query = `SELECT ${selectClause} FROM ${table}${joinClauses}${whereClause}${orderClause}${limitClause}${offsetClause}`

  return { query, values }
}

/**
 * Sanitize user input to prevent SQL injection
 * Note: Always use parameterized queries, but this provides an extra layer
 */
export function sanitizeInput(input: string): string {
  // Remove potential SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, '') // Remove multi-line comment end
    .replace(/xp_/gi, '') // Remove SQL Server extended procedures
    .replace(/sp_/gi, '') // Remove SQL Server stored procedures
    .trim()
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, limit?: number): {
  page: number
  limit: number
  offset: number
} {
  const validPage = Math.max(1, Math.floor(page || 1))
  const validLimit = Math.min(100, Math.max(1, Math.floor(limit || 50)))
  const offset = (validPage - 1) * validLimit

  return { page: validPage, limit: validLimit, offset }
}

/**
 * Build a safe ORDER BY clause with multiple columns
 */
export function buildOrderByClause(
  sorts: Array<{ column: string; direction?: 'ASC' | 'DESC' }>
): string {
  if (!sorts || sorts.length === 0) {
    return ''
  }

  // Validate all column names
  validateColumnNames(sorts.map(s => s.column))

  const orderParts = sorts.map(sort => {
    const direction = sort.direction === 'ASC' ? 'ASC' : 'DESC'
    return `${sort.column} ${direction}`
  })

  return ` ORDER BY ${orderParts.join(', ')}`
}

/**
 * Build IN clause safely
 */
export function buildInClause(
  column: string,
  values: any[],
  startIndex: number = 1
): { inClause: string; values: any[] } {
  validateColumnNames([column])

  if (!values || values.length === 0) {
    throw new Error('IN clause requires at least one value')
  }

  const placeholders = values.map((_, i) => `$${i + startIndex}`).join(', ')
  const inClause = `${column} IN (${placeholders})`

  return { inClause, values }
}

/**
 * Escape LIKE patterns to prevent wildcard injection
 */
export function escapeLikePattern(pattern: string): string {
  return pattern
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

/**
 * Build LIKE clause for search
 */
export function buildLikeClause(
  columns: string[],
  searchTerm: string,
  startIndex: number = 1
): { likeClause: string; values: any[] } {
  validateColumnNames(columns)

  if (!searchTerm || searchTerm.trim() === '') {
    throw new Error('Search term cannot be empty')
  }

  const escapedTerm = escapeLikePattern(searchTerm.trim())
  const pattern = `%${escapedTerm}%`

  const likeParts = columns.map((col, i) => {
    return `${col} ILIKE $${startIndex + i}`
  })

  const likeClause = likeParts.join(' OR ')
  const values = columns.map(() => pattern)

  return { likeClause, values }
}
