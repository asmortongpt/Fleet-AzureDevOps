import { injectable } from 'inversify'

import { BaseRepository, PaginatedResult, PaginationOptions, QueryContext } from './BaseRepository'

/**
 * Geofence entity with complete field definitions
 */
export interface Geofence {
  id: number
  tenant_id: number
  name: string
  description?: string
  geometry: any // PostGIS geometry or GeoJSON
  type: string
  radius?: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  created_by?: string
  updated_by?: string
}

/**
 * GeofenceRepository - Handles geofence data operations
 *
 * Security:
 * - All queries use parameterized statements ($1, $2, $3)
 * - Tenant isolation enforced on all operations
 * - Inherits BaseRepository security patterns
 */
@injectable()
export class GeofenceRepository extends BaseRepository<Geofence> {
  protected tableName = 'geofences'
  protected idColumn = 'id'

  /**
   * Find all geofences with pagination for a tenant
   */
  async findAllPaginated(
    context: QueryContext,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Geofence>> {
    return this.findAll(context, options)
  }

  /**
   * Find active geofences for a tenant
   */
  async findActiveGeofences(context: QueryContext): Promise<Geofence[]> {
    const pool = this.getPool(context)

    const result = await pool.query(
      `SELECT
        id,
        tenant_id,
        name,
        description,
        geometry,
        type,
        radius,
        is_active,
        created_at,
        updated_at
      FROM ${this.tableName}
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY created_at DESC`,
      [context.tenantId]
    )

    return result.rows
  }

  /**
   * Find geofences by type for a tenant
   */
  async findByType(type: string, context: QueryContext): Promise<Geofence[]> {
    const pool = this.getPool(context)

    const result = await pool.query(
      `SELECT
        id,
        tenant_id,
        name,
        description,
        geometry,
        type,
        radius,
        is_active,
        created_at,
        updated_at
      FROM ${this.tableName}
      WHERE tenant_id = $1 AND type = $2
      ORDER BY created_at DESC`,
      [context.tenantId, type]
    )

    return result.rows
  }
}
