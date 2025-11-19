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
