/**
 * Scope Filter Utility
 *
 * Provides centralized scope-based filtering logic for multi-tenant applications.
 * Eliminates duplicate scope filtering code across route files.
 *
 * Usage Example:
 * ```typescript
 * const { whereClause, params } = applyScopeFilter(
 *   req.user!,
 *   { tenant_id: req.user!.tenant_id },
 *   'vehicle_id',      // scopeColumn - the column that contains IDs to filter
 *   'team_vehicle_ids' // userScopeField - the field in user object with allowed IDs
 * );
 *
 * const result = await pool.query(
 *   `SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles ${whereClause}`,
 *   params
 * );
 * ```
 */

interface User {
  id: string
  tenant_id: number
  scope_level?: 'own' | 'team' | 'fleet' | 'global'
  vehicle_id?: string
  driver_id?: string
  team_vehicle_ids?: string[]
  team_driver_ids?: string[]
  [key: string]: any
}

interface BaseParams {
  tenant_id: number
  [key: string]: any
}

interface ScopeFilterOptions {
  /** The column name to filter on (e.g., 'vehicle_id', 'driver_id', 'id') */
  scopeColumn?: string
  /** The user field containing allowed IDs for team scope (e.g., 'team_vehicle_ids') */
  userScopeField?: string
  /** The user field containing the user's own ID for own scope (e.g., 'vehicle_id', 'driver_id') */
  ownIdField?: string
  /** Starting parameter index (default: calculates from baseParams) */
  startParamIndex?: number
}

interface ScopeFilterResult {
  /** WHERE clause fragment with AND conditions (e.g., "WHERE tenant_id = $1 AND vehicle_id = $2") */
  whereClause: string
  /** Array of parameter values to pass to the query */
  params: any[]
  /** The next available parameter index */
  nextParamIndex: number
}

/**
 * Apply scope-based filtering for multi-tenant row-level security
 *
 * @param user - The authenticated user object
 * @param baseParams - Base parameters like tenant_id
 * @param options - Configuration for scope filtering
 * @returns Object containing WHERE clause and parameters
 */
export function applyScopeFilter(
  user: User,
  baseParams: BaseParams,
  options: ScopeFilterOptions = {}
): ScopeFilterResult {
  const {
    scopeColumn = 'id',
    userScopeField,
    ownIdField,
    startParamIndex
  } = options

  const params: any[] = Object.values(baseParams)
  let paramIndex = startParamIndex ?? params.length + 1
  const conditions: string[] = []

  // Always include base conditions (e.g., tenant_id)
  Object.keys(baseParams).forEach((key, index) => {
    conditions.push(`${key} = $${index + 1}`)
  })

  const scopeLevel = user.scope_level || 'global'

  switch (scopeLevel) {
    case 'own':
      // User can only see their own record
      if (ownIdField && user[ownIdField]) {
        conditions.push(`${scopeColumn} = $${paramIndex}`)
        params.push(user[ownIdField])
        paramIndex++
      }
      break

    case 'team':
      // User can see records for their team
      if (userScopeField && user[userScopeField] && Array.isArray(user[userScopeField])) {
        const teamIds = user[userScopeField]
        if (teamIds.length > 0) {
          conditions.push(`${scopeColumn} = ANY($${paramIndex}::uuid[])`)
          params.push(teamIds)
          paramIndex++
        }
      }
      break

    case 'fleet':
    case 'global':
      // User can see all records in their tenant (already filtered by tenant_id)
      break
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  return {
    whereClause,
    params,
    nextParamIndex: paramIndex
  }
}

/**
 * Apply scope filter for UPDATE/DELETE operations
 * Ensures users can only modify records they have access to
 *
 * @param user - The authenticated user object
 * @param resourceId - The ID of the resource being modified
 * @param options - Configuration for scope filtering
 * @returns Object containing WHERE clause and parameters
 */
export function applyScopeFilterForModification(
  user: User,
  resourceId: string,
  options: ScopeFilterOptions = {}
): ScopeFilterResult {
  const {
    scopeColumn = 'id',
    userScopeField,
    ownIdField
  } = options

  const baseParams = {
    id: resourceId,
    tenant_id: user.tenant_id
  }

  const params: any[] = [resourceId, user.tenant_id]
  let paramIndex = 3
  const conditions: string[] = ['id = $1', 'tenant_id = $2']

  const scopeLevel = user.scope_level || 'global'

  switch (scopeLevel) {
    case 'own':
      // Verify this is the user's own record
      if (ownIdField && user[ownIdField]) {
        if (scopeColumn === 'id' && resourceId !== user[ownIdField]) {
          // Access denied - throw error or return empty result
          throw new Error('Access denied: You can only modify your own records')
        }
      }
      break

    case 'team':
      // Verify record is in user's team
      if (userScopeField && user[userScopeField] && Array.isArray(user[userScopeField])) {
        const teamIds = user[userScopeField]
        if (teamIds.length > 0 && !teamIds.includes(resourceId)) {
          throw new Error('Access denied: Resource not in your team')
        }
      }
      break

    case 'fleet':
    case 'global':
      // User can modify any record in their tenant
      break
  }

  const whereClause = conditions.join(' AND ')

  return {
    whereClause,
    params,
    nextParamIndex: paramIndex
  }
}

/**
 * Build a scope-aware COUNT query
 *
 * @param tableName - The table to count from
 * @param user - The authenticated user object
 * @param baseParams - Base parameters like tenant_id
 * @param options - Configuration for scope filtering
 * @returns Object with query string and parameters
 */
export function buildScopeCountQuery(
  tableName: string,
  user: User,
  baseParams: BaseParams,
  options: ScopeFilterOptions = {}
): { query: string; params: any[] } {
  const { whereClause, params } = applyScopeFilter(user, baseParams, options)

  return {
    query: `SELECT COUNT(*) FROM ${tableName} ${whereClause}`,
    params
  }
}

/**
 * Build a scope-aware SELECT query with pagination
 *
 * @param tableName - The table to select from
 * @param columns - Array of column names to select
 * @param user - The authenticated user object
 * @param baseParams - Base parameters like tenant_id
 * @param options - Configuration for scope filtering
 * @param orderBy - ORDER BY clause (default: 'created_at DESC')
 * @param limit - Number of records to return
 * @param offset - Number of records to skip
 * @returns Object with query string and parameters
 */
export function buildScopeSelectQuery(
  tableName: string,
  columns: string[],
  user: User,
  baseParams: BaseParams,
  options: ScopeFilterOptions = {},
  orderBy: string = 'created_at DESC',
  limit?: number,
  offset?: number
): { query: string; params: any[] } {
  const { whereClause, params, nextParamIndex } = applyScopeFilter(user, baseParams, options)

  let paramIndex = nextParamIndex
  const columnList = columns.join(', ')
  let query = `SELECT ${columnList} FROM ${tableName} ${whereClause}`

  if (orderBy) {
    query += ` ORDER BY ${orderBy}`
  }

  if (limit !== undefined) {
    query += ` LIMIT $${paramIndex}`
    params.push(limit)
    paramIndex++
  }

  if (offset !== undefined) {
    query += ` OFFSET $${paramIndex}`
    params.push(offset)
    paramIndex++
  }

  return { query, params }
}
