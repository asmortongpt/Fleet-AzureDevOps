// Typed Database Query Wrapper
// Provides type-safe database operations with proper error handling

import { Pool, QueryResult as PgQueryResult, PoolClient } from 'pg';
import pool from '../config/database';
import { QueryResult, SqlValue, SqlParams } from '../types';
import { monitoredQuery } from './query-monitor';

/**
 * Execute a typed query with proper error handling and performance monitoring
 * @param text SQL query text
 * @param params Query parameters
 * @returns Typed query result
 */
export async function query<T = unknown>(
  text: string,
  params?: SqlParams
): Promise<QueryResult<T>> {
  try {
    // Use monitored query for automatic performance tracking
    const result = await monitoredQuery<T>(pool, text, params);
    return result as QueryResult<T>;
  } catch (error) {
    console.error('Database query error:', {
      query: text,
      params,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

/**
 * Execute a query and return a single row or null
 * @param text SQL query text
 * @param params Query parameters
 * @returns Single row or null
 */
export async function queryOne<T = unknown>(
  text: string,
  params?: SqlParams
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 * @param text SQL query text
 * @param params Query parameters
 * @returns Array of rows
 */
export async function queryMany<T = unknown>(
  text: string,
  params?: SqlParams
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a query expecting exactly one row, throw if not found
 * @param text SQL query text
 * @param params Query parameters
 * @returns Single row
 * @throws Error if no rows found
 */
export async function queryOneRequired<T = unknown>(
  text: string,
  params?: SqlParams
): Promise<T> {
  const result = await queryOne<T>(text, params);
  if (!result) {
    throw new Error('Expected one row, but got none');
  }
  return result;
}

/**
 * Execute a query and return the count
 * @param text SQL query text
 * @param params Query parameters
 * @returns Count as number
 */
export async function queryCount(
  text: string,
  params?: SqlParams
): Promise<number> {
  const result = await query<{ count: string }>(text, params);
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Execute multiple queries in a transaction
 * @param callback Transaction callback
 * @returns Result of the transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await monitoredQuery(client, 'BEGIN', []);
    const result = await callback(client);
    await monitoredQuery(client, 'COMMIT', []);
    return result;
  } catch (error) {
    await monitoredQuery(client, 'ROLLBACK', []);
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute a query within a client (for transactions) with performance monitoring
 * @param client Pool client
 * @param text SQL query text
 * @param params Query parameters
 * @returns Typed query result
 */
export async function clientQuery<T = unknown>(
  client: PoolClient,
  text: string,
  params?: SqlParams
): Promise<QueryResult<T>> {
  try {
    // Use monitored query for transaction queries too
    const result = await monitoredQuery<T>(client, text, params);
    return result as QueryResult<T>;
  } catch (error) {
    console.error('Client query error:', {
      query: text,
      params,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

/**
 * Build a WHERE clause from filter object
 * @param filters Filter object
 * @param startIndex Starting parameter index ($1, $2, etc.)
 * @returns WHERE clause string and values
 */
export function buildWhereClause(
  filters: Record<string, SqlValue>,
  startIndex: number = 1
): { where: string; values: SqlValue[] } {
  const conditions: string[] = [];
  const values: SqlValue[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  return {
    where: conditions.length > 0 ? 'WHERE ${conditions.join(' AND ')}' : '',
    values
  };
}

/**
 * Build an IN clause for array values
 * @param column Column name
 * @param values Array of values
 * @param paramIndex Starting parameter index
 * @returns IN clause string and parameter index
 */
export function buildInClause(
  column: string,
  values: SqlValue[],
  paramIndex: number
): { clause: string; nextIndex: number } {
  if (values.length === 0) {
    return { clause: 'FALSE', nextIndex: paramIndex };
  }

  const placeholders = values.map((_, i) => '$${paramIndex + i}`).join(', ');
  return {
    clause: `${column} IN (${placeholders})`,
    nextIndex: paramIndex + values.length
  };
}

/**
 * Sanitize table/column name to prevent SQL injection
 * @param name Table or column name
 * @returns Sanitized name
 */
export function sanitizeIdentifier(name: string): string {
  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return name;
}

/**
 * Execute a paginated query
 * @param text SQL query text (without LIMIT/OFFSET)
 * @param params Query parameters
 * @param page Page number (1-indexed)
 * @param limit Items per page
 * @returns Paginated result with metadata
 */
export async function queryPaginated<T = unknown>(
  text: string,
  params: SqlParams = [],
  page: number = 1,
  limit: number = 50
): Promise<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const offset = (page - 1) * limit;

  // Execute data query with pagination
  const dataQuery = `${text} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query<T>(dataQuery, [...params, limit, offset]);

  // Execute count query
  const countQuery = `SELECT COUNT(*) FROM (${text}) as count_query`;
  const countResult = await query<{ count: string }>(countQuery, params);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Check if a record exists
 * @param table Table name
 * @param column Column name
 * @param value Value to check
 * @param tenantId Optional tenant ID for multi-tenant queries
 * @returns True if record exists
 */
export async function exists(
  table: string,
  column: string,
  value: SqlValue,
  tenantId?: string
): Promise<boolean> {
  const sanitizedTable = sanitizeIdentifier(table);
  const sanitizedColumn = sanitizeIdentifier(column);

  let queryText = `SELECT EXISTS(SELECT 1 FROM ${sanitizedTable} WHERE ${sanitizedColumn} = $1`;
  const params: SqlParams = [value];

  if (tenantId) {
    queryText += ' AND tenant_id = $2';
    params.push(tenantId);
  }

  queryText += ')';

  const result = await query<{ exists: boolean }>(queryText, params);
  return result.rows[0]?.exists || false;
}

/**
 * Get the database pool for direct access (when needed)
 */
export function getPool(): Pool {
  return pool;
}

/**
 * Test database connectivity
 * @returns True if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get database statistics
 * @returns Database statistics
 */
export async function getDatabaseStats(): Promise<{
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
}> {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount
  };
}

// Export the pool for backward compatibility
export { pool };
export default {
  query,
  queryOne,
  queryMany,
  queryOneRequired,
  queryCount,
  transaction,
  clientQuery,
  buildWhereClause,
  buildInClause,
  sanitizeIdentifier,
  queryPaginated,
  exists,
  getPool,
  testConnection,
  getDatabaseStats,
  pool
};
