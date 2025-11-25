/**
 * Column Resolver Utility
 *
 * Provides efficient column list resolution for tables to replace SELECT * patterns.
 * Uses caching to avoid repeated schema introspection queries.
 *
 * @module utils/column-resolver
 */

import { Pool } from 'pg';
import { logger } from './logger';

// Column cache to avoid repeated introspection
const columnCache = new Map<string, string[]>();

/**
 * Get column list for a table from the database schema
 * Uses caching to minimize schema introspection queries
 *
 * @param pool - Database connection pool
 * @param tableName - Name of the table
 * @returns Promise resolving to array of column names in ordinal position order
 */
export async function getTableColumns(pool: Pool, tableName: string): Promise<string[]> {
  // Return cached columns if available
  if (columnCache.has(tableName)) {
    return columnCache.get(tableName)!;
  }

  try {
    const result = await pool.query<{ column_name: string; ordinal_position: number }>(
      `SELECT column_name, ordinal_position
       FROM information_schema.columns
       WHERE table_schema = 'public'
       AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );

    if (result.rows.length === 0) {
      logger.warn(`No columns found for table: ${tableName}`, { table: tableName });
      return [];
    }

    const columns = result.rows.map(row => row.column_name);

    // Cache the columns for future use
    columnCache.set(tableName, columns);

    logger.debug(`Resolved columns for table ${tableName}`, {
      table: tableName,
      columnCount: columns.length
    });

    return columns;
  } catch (error) {
    logger.error(`Failed to resolve columns for table: ${tableName}`, {
      table: tableName,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Build a SELECT query with explicit column list instead of SELECT *
 *
 * @param tableName - Name of the table
 * @param columns - Array of column names
 * @param whereClause - Optional WHERE clause
 * @param orderByClause - Optional ORDER BY clause
 * @param limitClause - Optional LIMIT clause
 * @returns SQL SELECT query string
 */
export function buildSelectQuery(
  tableName: string,
  columns: string[],
  whereClause?: string,
  orderByClause?: string,
  limitClause?: string
): string {
  const columnList = columns.join(', ');
  let query = `SELECT ${columnList} FROM ${tableName}`;

  if (whereClause) {
    query += ` ${whereClause}`;
  }

  if (orderByClause) {
    query += ` ${orderByClause}`;
  }

  if (limitClause) {
    query += ` ${limitClause}`;
  }

  return query;
}

/**
 * Clear the column cache (useful for testing or after schema changes)
 */
export function clearColumnCache(): void {
  columnCache.clear();
}

/**
 * Get cache statistics (for monitoring and debugging)
 */
export function getColumnCacheStats(): {
  cachedTables: number;
  tables: string[];
} {
  return {
    cachedTables: columnCache.size,
    tables: Array.from(columnCache.keys())
  };
}
