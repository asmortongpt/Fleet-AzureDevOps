/**
 * Tenant-Safe Database Query Helpers
 * SECURITY: All database queries MUST include tenant_id filter
 *
 * This module provides helper functions to ensure tenant isolation
 * in multi-tenant database operations, preventing privilege escalation
 * vulnerabilities (CVSS 7.5).
 *
 * CRITICAL: Never allow tenant_id to come from user input (req.body, req.query)
 * Always use req.user.tenant_id from authenticated JWT token
 */

import { Pool, PoolClient, QueryResult } from 'pg';

import pool from '../config/database';
import { SqlValue, SqlParams } from '../types';

import { monitoredQuery } from './query-monitor';

/**
 * Validate that a SQL query includes tenant_id filter
 * @param query SQL query text
 * @returns True if query contains tenant_id check
 * @throws Error if query is missing tenant_id filter
 */
function validateTenantIsolation(query: string): void {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ');

  // Skip validation for certain safe operations
  const skipPatterns = [
    /^select 1/, // Health checks
    /^begin\b/i,
    /^commit\b/i,
    /^rollback\b/i,
    /from\s+telematics_providers\b/i, // System tables without tenant_id
    /from\s+pg_/i, // PostgreSQL system tables
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(normalizedQuery)) {
      return; // Skip validation for these queries
    }
  }

  // Check if query contains tenant_id filter
  if (!normalizedQuery.includes('tenant_id')) {
    throw new Error(
      'SECURITY VIOLATION: Query missing tenant_id filter. ' +
      'All queries MUST include tenant_id in WHERE clause for tenant isolation. ' +
      `Query: ${query.substring(0, 100)}...`
    );
  }

  // Additional check: ensure tenant_id is parameterized
  if (normalizedQuery.includes('tenant_id') && !normalizedQuery.match(/tenant_id\s*=\s*\$\d+/)) {
    console.warn(
      'WARNING: tenant_id filter may not be parameterized. ' +
      'Ensure you are using $N placeholders for tenant_id values.'
    );
  }
}

/**
 * Execute a tenant-safe query with automatic validation
 *
 * @param queryText SQL query text (must include tenant_id = $N)
 * @param params Query parameters
 * @param tenantId Tenant ID from req.user.tenant_id
 * @returns Query result
 *
 * @example
 * // CORRECT: Tenant-isolated query
 * const result = await tenantSafeQuery(
 *   'SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2',
 *   [vehicleId, req.user!.tenant_id],
 *   req.user!.tenant_id
 * )
 *
 * @example
 * // WRONG: This will throw an error
 * const result = await tenantSafeQuery(
 *   'SELECT * FROM vehicles WHERE id = $1', // Missing tenant_id!
 *   [vehicleId],
 *   req.user!.tenant_id
 * )
 */
export async function tenantSafeQuery<T = any>(
  queryText: string,
  params: SqlParams = [],
  tenantId: string
): Promise<QueryResult<T>> {
  // Validate tenant isolation
  validateTenantIsolation(queryText);

  // Ensure tenant_id is in params
  if (!params.includes(tenantId)) {
    console.warn(
      'WARNING: tenant_id not found in parameters. ' +
      'Ensure tenant_id is passed as a parameter ($N) in the query.'
    );
  }

  try {
    return await monitoredQuery<T>(pool, queryText, params);
  } catch (error) {
    console.error('Tenant-safe query error:', {
      query: queryText.substring(0, 200),
      error: error instanceof Error ? error.message : error,
      tenantId
    });
    throw error;
  }
}

/**
 * Execute a tenant-safe query and return a single row or null
 *
 * @param queryText SQL query text (must include tenant_id = $N)
 * @param params Query parameters
 * @param tenantId Tenant ID from req.user.tenant_id
 * @returns Single row or null
 */
export async function tenantSafeQueryOne<T = any>(
  queryText: string,
  params: SqlParams = [],
  tenantId: string
): Promise<T | null> {
  const result = await tenantSafeQuery<T>(queryText, params, tenantId);
  return result.rows[0] || null;
}

/**
 * Execute a tenant-safe query and return all rows
 *
 * @param queryText SQL query text (must include tenant_id = $N)
 * @param params Query parameters
 * @param tenantId Tenant ID from req.user.tenant_id
 * @returns Array of rows
 */
export async function tenantSafeQueryMany<T = any>(
  queryText: string,
  params: SqlParams = [],
  tenantId: string
): Promise<T[]> {
  const result = await tenantSafeQuery<T>(queryText, params, tenantId);
  return result.rows;
}

/**
 * Execute a tenant-safe query expecting exactly one row, throw if not found
 *
 * @param queryText SQL query text (must include tenant_id = $N)
 * @param params Query parameters
 * @param tenantId Tenant ID from req.user.tenant_id
 * @returns Single row
 * @throws Error if no rows found
 */
export async function tenantSafeQueryOneRequired<T = any>(
  queryText: string,
  params: SqlParams = [],
  tenantId: string
): Promise<T> {
  const result = await tenantSafeQueryOne<T>(queryText, params, tenantId);
  if (!result) {
    throw new Error('Expected one row, but got none');
  }
  return result;
}

/**
 * Execute a tenant-safe query within a client (for transactions)
 *
 * @param client Pool client
 * @param queryText SQL query text (must include tenant_id = $N)
 * @param params Query parameters
 * @param tenantId Tenant ID from req.user.tenant_id
 * @returns Query result
 */
export async function tenantSafeClientQuery<T = any>(
  client: PoolClient,
  queryText: string,
  params: SqlParams = [],
  tenantId: string
): Promise<QueryResult<T>> {
  // Validate tenant isolation
  validateTenantIsolation(queryText);

  try {
    return await monitoredQuery<T>(client, queryText, params);
  } catch (error) {
    console.error('Tenant-safe client query error:', {
      query: queryText.substring(0, 200),
      error: error instanceof Error ? error.message : error,
      tenantId
    });
    throw error;
  }
}

/**
 * Build a tenant-safe WHERE clause that includes tenant_id filter
 *
 * @param filters Filter object (excluding tenant_id)
 * @param tenantId Tenant ID from req.user.tenant_id
 * @param startIndex Starting parameter index ($1, $2, etc.)
 * @returns WHERE clause string and values including tenant_id
 *
 * @example
 * const { where, values } = buildTenantSafeWhereClause(
 *   { status: 'active', year: 2023 },
 *   req.user!.tenant_id,
 *   1
 * )
 * // Returns:
 * // where: "WHERE tenant_id = $1 AND status = $2 AND year = $3"
 * // values: [tenant_id, 'active', 2023]
 */
export function buildTenantSafeWhereClause(
  filters: Record<string, SqlValue>,
  tenantId: string,
  startIndex: number = 1
): { where: string; values: SqlValue[] } {
  const conditions: string[] = [`tenant_id = $${startIndex}`];
  const values: SqlValue[] = [tenantId];
  let paramIndex = startIndex + 1;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && key !== 'tenant_id') {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  return {
    where: `WHERE ${conditions.join(' AND ')}`,
    values
  };
}

/**
 * Validate that a resource belongs to the specified tenant
 * Used for authorization checks before updates/deletes
 *
 * @param table Table name
 * @param resourceId Resource ID
 * @param tenantId Tenant ID from req.user.tenant_id
 * @returns True if resource belongs to tenant
 * @throws Error if table name is invalid
 *
 * @example
 * // Before deleting a vehicle, verify it belongs to the tenant
 * const authorized = await validateTenantOwnership(
 *   'vehicles',
 *   vehicleId,
 *   req.user!.tenant_id
 * )
 * if (!authorized) {
 *   throw new ForbiddenError('Access denied')
 * }
 */
export async function validateTenantOwnership(
  table: string,
  resourceId: string | number,
  tenantId: string
): Promise<boolean> {
  // Sanitize table name to prevent SQL injection
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }

  const query = `
    SELECT EXISTS(
      SELECT 1 FROM ${table}
      WHERE id = $1 AND tenant_id = $2
    ) as exists
  `;

  const result = await pool.query<{ exists: boolean }>(query, [resourceId, tenantId]);
  return result.rows[0]?.exists || false;
}

/**
 * Get the current pool instance
 * For backward compatibility with existing code
 */
export function getPool(): Pool {
  return pool;
}

/**
 * SECURITY AUDIT HELPER: Scan a query for tenant isolation issues
 * Use this during development/testing to identify problematic queries
 *
 * @param queryText SQL query text
 * @returns Audit result with warnings and suggestions
 */
export function auditQueryForTenantIsolation(queryText: string): {
  hasTenantId: boolean;
  isParameterized: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const normalized = queryText.toLowerCase();
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const hasTenantId = normalized.includes('tenant_id');
  const isParameterized = /tenant_id\s*=\s*\$\d+/.test(normalized);

  // Check for SELECT without tenant_id
  if (/select\s+.*\s+from\s+\w+/.test(normalized) && !hasTenantId) {
    warnings.push('SELECT query missing tenant_id filter');
    suggestions.push('Add "WHERE tenant_id = $N" to SELECT query');
  }

  // Check for UPDATE without tenant_id
  if (/update\s+\w+\s+set/.test(normalized) && !hasTenantId) {
    warnings.push('UPDATE query missing tenant_id filter');
    suggestions.push('Add "WHERE tenant_id = $N" to UPDATE query');
  }

  // Check for DELETE without tenant_id
  if (/delete\s+from\s+\w+/.test(normalized) && !hasTenantId) {
    warnings.push('DELETE query missing tenant_id filter');
    suggestions.push('Add "WHERE tenant_id = $N" to DELETE query');
  }

  // Check for non-parameterized tenant_id (SQL injection risk)
  if (hasTenantId && !isParameterized) {
    warnings.push('tenant_id value may not be parameterized (SQL injection risk)');
    suggestions.push('Use parameterized query: tenant_id = $N instead of string concatenation');
  }

  // Check for tenant_id in INSERT
  if (/insert\s+into\s+\w+/.test(normalized) && !normalized.includes('tenant_id')) {
    warnings.push('INSERT query may be missing tenant_id column');
    suggestions.push('Include tenant_id in INSERT columns and VALUES');
  }

  return {
    hasTenantId,
    isParameterized,
    warnings,
    suggestions
  };
}

export default {
  tenantSafeQuery,
  tenantSafeQueryOne,
  tenantSafeQueryMany,
  tenantSafeQueryOneRequired,
  tenantSafeClientQuery,
  buildTenantSafeWhereClause,
  validateTenantOwnership,
  auditQueryForTenantIsolation,
  getPool,
  pool
};
