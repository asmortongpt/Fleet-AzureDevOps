/**
 * Enhanced Vehicles Repository
 *
 * Migrated from direct pool.query() calls to GenericRepository pattern.
 * Provides type-safe, secure vehicle data access with:
 * - Parameterized queries (SQL injection prevention)
 * - Automatic tenant isolation
 * - Audit trail tracking
 * - Transaction support
 *
 * Epic #1, Issue #1.2: Fleet Domain Repositories
 */

import { Pool } from 'pg'

import { DatabaseError } from "../../errors/AppError"
import { isValidIdentifier } from '../../utils/sql-safety'
import { GenericRepository } from '../base'

export interface Vehicle {
  id?: string | number
  tenant_id?: string
  vin: string
  make?: string
  model?: string
  year?: number
  license_plate?: string
  status?: string
  asset_category?: string
  asset_type?: string
  power_type?: string
  operational_status?: string
  primary_metric?: string
  is_road_legal?: boolean
  location_id?: string | number
  group_id?: string | number
  fleet_id?: string | number
  mileage?: number
  fuel_level?: number
  battery_level?: number
  last_service_date?: Date
  next_service_date?: Date
  purchase_date?: Date
  purchase_price?: number
  current_value?: number
  insurance_policy?: string
  insurance_expiry?: Date
  registration_expiry?: Date
  notes?: string
  created_at?: Date
  updated_at?: Date
  created_by?: string
  updated_by?: string
  deleted_at?: Date
  deleted_by?: string
}

export interface VehicleStats {
  total: number
  by_status: Record<string, number>
  by_asset_type: Record<string, number>
  by_power_type: Record<string, number>
  average_age: number
  total_value: number
}

export interface VehicleFilters {
  asset_category?: string
  asset_type?: string
  power_type?: string
  operational_status?: string
  status?: string
  primary_metric?: string
  is_road_legal?: boolean
  location_id?: string | number
  group_id?: string | number
  fleet_id?: string | number
  search?: string // Search across make, model, VIN, license plate
}

/**
 * Vehicles Repository
 *
 * Handles all vehicle-related database operations.
 * Extends GenericRepository for standard CRUD, adds vehicle-specific methods.
 */
export class VehiclesRepository extends GenericRepository<Vehicle> {
  protected tableName = 'vehicles'
  protected idColumn = 'id'

  constructor(pool: Pool) {
    super(pool)
  }

  /**
   * Find vehicle by VIN (Vehicle Identification Number)
   * VINs are unique within a tenant
   */
  async findByVin(vin: string, tenantId: string): Promise<Vehicle | null> {
    const results = await this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE vin = $1 AND tenant_id = $2`,
      [vin.toUpperCase(), tenantId]
    )
    return results[0] || null
  }

  /**
   * Check if VIN exists for a tenant
   */
  async vinExists(vin: string, tenantId: string): Promise<boolean> {
    const results = await this.executeQuery<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE vin = $1 AND tenant_id = $2) as exists`,
      [vin.toUpperCase(), tenantId]
    )
    return results[0]?.exists || false
  }

  /**
   * Find vehicles by status
   */
  async findByStatus(status: string, tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [status, tenantId]
    )
  }

  /**
   * Find vehicles by operational status
   */
  async findByOperationalStatus(operationalStatus: string, tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE operational_status = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [operationalStatus, tenantId]
    )
  }

  /**
   * Find vehicles by fleet ID
   */
  async findByFleet(fleetId: string | number, tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE fleet_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [fleetId, tenantId]
    )
  }

  /**
   * Find vehicles by location ID
   */
  async findByLocation(locationId: string | number, tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE location_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [locationId, tenantId]
    )
  }

  /**
   * Find vehicles by asset type
   */
  async findByAssetType(assetType: string, tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE asset_type = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [assetType, tenantId]
    )
  }

  /**
   * Find vehicles by power type (diesel, gasoline, electric, hybrid)
   */
  async findByPowerType(powerType: string, tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} WHERE power_type = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [powerType, tenantId]
    )
  }

  /**
   * Find vehicles with advanced filters and search
   */
  async findWithFilters(
    tenantId: string,
    filters: VehicleFilters,
    options: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' } = {}
  ) {
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = options

    // Validate sortBy to prevent SQL injection
    if (!isValidIdentifier(sortBy)) {
      throw new DatabaseError(`Invalid sort column: ${sortBy}`, { sortBy })
    }

    // Build WHERE clause dynamically based on filters
    const conditions: string[] = ['tenant_id = $1']
    const values: any[] = [tenantId]
    let paramIndex = 2

    // Add filter conditions
    if (filters.asset_category) {
      conditions.push(`asset_category = $${paramIndex++}`)
      values.push(filters.asset_category)
    }
    if (filters.asset_type) {
      conditions.push(`asset_type = $${paramIndex++}`)
      values.push(filters.asset_type)
    }
    if (filters.power_type) {
      conditions.push(`power_type = $${paramIndex++}`)
      values.push(filters.power_type)
    }
    if (filters.operational_status) {
      conditions.push(`operational_status = $${paramIndex++}`)
      values.push(filters.operational_status)
    }
    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`)
      values.push(filters.status)
    }
    if (filters.is_road_legal !== undefined) {
      conditions.push(`is_road_legal = $${paramIndex++}`)
      values.push(filters.is_road_legal)
    }
    if (filters.location_id) {
      conditions.push(`location_id = $${paramIndex++}`)
      values.push(filters.location_id)
    }
    if (filters.group_id) {
      conditions.push(`group_id = $${paramIndex++}`)
      values.push(filters.group_id)
    }
    if (filters.fleet_id) {
      conditions.push(`fleet_id = $${paramIndex++}`)
      values.push(filters.fleet_id)
    }

    // Add search across multiple fields
    if (filters.search) {
      conditions.push(`(
        LOWER(make) LIKE $${paramIndex} OR
        LOWER(model) LIKE $${paramIndex} OR
        LOWER(vin) LIKE $${paramIndex} OR
        LOWER(license_plate) LIKE $${paramIndex}
      )`)
      values.push(`%${filters.search.toLowerCase()}%`)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await this.executeQuery<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`,
      values
    )
    const total = parseInt(countResult[0]?.count || '0', 10)

    // Get paginated data (sortBy is validated above)
    const dataResult = await this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    )

    return {
      data: dataResult,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Count vehicles by status
   */
  async countByStatus(status: string, tenantId: string): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = $1 AND tenant_id = $2`,
      [status, tenantId]
    )
    return parseInt(result[0]?.count || '0', 10)
  }

  /**
   * Get comprehensive vehicle statistics
   */
  async getVehicleStats(tenantId: string): Promise<VehicleStats> {
    const query = `
      SELECT
        COUNT(*) as total,
        AVG(EXTRACT(YEAR FROM CURRENT_DATE) - year) as average_age,
        SUM(COALESCE(current_value, 0)) as total_value,
        json_object_agg(
          COALESCE(status, 'unknown'),
          status_count
        ) FILTER (WHERE status IS NOT NULL) as by_status,
        json_object_agg(
          COALESCE(asset_type, 'unknown'),
          asset_type_count
        ) FILTER (WHERE asset_type IS NOT NULL) as by_asset_type,
        json_object_agg(
          COALESCE(power_type, 'unknown'),
          power_type_count
        ) FILTER (WHERE power_type IS NOT NULL) as by_power_type
      FROM (
        SELECT
          status,
          COUNT(*) OVER (PARTITION BY status) as status_count,
          asset_type,
          COUNT(*) OVER (PARTITION BY asset_type) as asset_type_count,
          power_type,
          COUNT(*) OVER (PARTITION BY power_type) as power_type_count,
          year,
          current_value
        FROM ${this.tableName}
        WHERE tenant_id = $1
      ) subquery
      GROUP BY total
    `

    interface StatsRow {
      total: string
      average_age: string
      total_value: string
      by_status: Record<string, number>
      by_asset_type: Record<string, number>
      by_power_type: Record<string, number>
    }

    const result = await this.executeQuery<StatsRow>(query, [tenantId])
    const row = result[0]

    return {
      total: parseInt(row?.total || '0', 10),
      average_age: parseFloat(row?.average_age || '0'),
      total_value: parseFloat(row?.total_value || '0'),
      by_status: row?.by_status || {},
      by_asset_type: row?.by_asset_type || {},
      by_power_type: row?.by_power_type || {}
    }
  }

  /**
   * Find vehicles with upcoming service (within next N days)
   */
  async findWithUpcomingService(tenantId: string, daysAhead: number = 30): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND next_service_date IS NOT NULL
         AND next_service_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '$2 days'
       ORDER BY next_service_date ASC`,
      [tenantId, daysAhead]
    )
  }

  /**
   * Find vehicles with expired registration
   */
  async findWithExpiredRegistration(tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND registration_expiry IS NOT NULL
         AND registration_expiry < CURRENT_DATE
       ORDER BY registration_expiry ASC`,
      [tenantId]
    )
  }

  /**
   * Find vehicles with expired insurance
   */
  async findWithExpiredInsurance(tenantId: string): Promise<Vehicle[]> {
    return this.executeQuery<Vehicle>(
      `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName}
       WHERE tenant_id = $1
         AND insurance_expiry IS NOT NULL
         AND insurance_expiry < CURRENT_DATE
       ORDER BY insurance_expiry ASC`,
      [tenantId]
    )
  }

  /**
   * Update vehicle mileage
   */
  async updateMileage(
    vehicleId: string | number,
    mileage: number,
    tenantId: string,
    userId: string
  ): Promise<Vehicle> {
    return this.update(vehicleId, { mileage } as Partial<Vehicle>, tenantId, userId)
  }

  /**
   * Update vehicle location
   */
  async updateLocation(
    vehicleId: string | number,
    locationId: string | number,
    tenantId: string,
    userId: string
  ): Promise<Vehicle> {
    return this.update(vehicleId, { location_id: locationId } as Partial<Vehicle>, tenantId, userId)
  }

  /**
   * Bulk update vehicle status
   */
  async bulkUpdateStatus(
    vehicleIds: (string | number)[],
    status: string,
    tenantId: string,
    userId: string
  ): Promise<number> {
    if (vehicleIds.length === 0) return 0

    // Create placeholders for vehicle IDs
    const placeholders = vehicleIds.map((_, i) => `$${i + 3}`).join(', ')

    const result = await this.executeQuery<{ count: number }>(
      `UPDATE ${this.tableName}
       SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id IN (${placeholders}) AND tenant_id = $3
       RETURNING id`,
      [status, userId, tenantId, ...vehicleIds]
    )

    return result.length
  }
}
