import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'
import { PoolClient } from 'pg'

/**
 * Vehicle entity interface
 */
export interface Vehicle {
  id: string
  tenant_id: string
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
  location_id?: string
  group_id?: string
  fleet_id?: string
  created_at?: Date
  updated_at?: Date
}

/**
 * Vehicle Repository
 * Provides data access operations for vehicles using the DAL
 */
export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor() {
    super('vehicles', connectionManager.getWritePool())
  }

  /**
   * Find all vehicles for a tenant
   */
  async findByTenant(tenantId: string): Promise<Vehicle[]> {
    return this.findAll({
      where: { tenant_id: tenantId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Get paginated vehicles for a tenant with filters
   */
  async getPaginatedVehicles(
    tenantId: string,
    filters: {
      asset_category?: string
      asset_type?: string
      power_type?: string
      operational_status?: string
      primary_metric?: string
      is_road_legal?: boolean
      location_id?: string
      group_id?: string
      fleet_id?: string
    } = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const where: Record<string, any> = { tenant_id: tenantId }

    // Add filters
    if (filters.asset_category) where.asset_category = filters.asset_category
    if (filters.asset_type) where.asset_type = filters.asset_type
    if (filters.power_type) where.power_type = filters.power_type
    if (filters.operational_status) where.operational_status = filters.operational_status
    if (filters.primary_metric) where.primary_metric = filters.primary_metric
    if (filters.is_road_legal !== undefined) where.is_road_legal = filters.is_road_legal
    if (filters.location_id) where.location_id = filters.location_id
    if (filters.group_id) where.group_id = filters.group_id
    if (filters.fleet_id) where.fleet_id = filters.fleet_id

    return this.paginate({
      where,
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(tenantId: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.create({
      ...data,
      tenant_id: tenantId
    })
  }

  /**
   * Update a vehicle
   */
  async updateVehicle(id: string, tenantId: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.update(id, data, tenantId)
  }

  /**
   * Delete a vehicle
   */
  async deleteVehicle(id: string, tenantId: string): Promise<boolean> {
    return this.delete(id, tenantId)
  }

  /**
   * Find vehicle by ID for a tenant
   */
  async findByIdAndTenant(id: string, tenantId: string): Promise<Vehicle | null> {
    return this.findById(id, tenantId)
  }

  /**
   * Find vehicle by VIN
   */
  async findByVin(vin: string, tenantId: string): Promise<Vehicle | null> {
    return this.findOne({ vin: vin.toUpperCase(), tenant_id: tenantId })
  }

  /**
   * Find vehicles by status
   */
  async findByStatus(tenantId: string, status: string): Promise<Vehicle[]> {
    return this.findAll({
      where: { tenant_id: tenantId, status },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Find vehicles by fleet
   */
  async findByFleet(tenantId: string, fleetId: string): Promise<Vehicle[]> {
    return this.findAll({
      where: { tenant_id: tenantId, fleet_id: fleetId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Find vehicles by location
   */
  async findByLocation(tenantId: string, locationId: string): Promise<Vehicle[]> {
    return this.findAll({
      where: { tenant_id: tenantId, location_id: locationId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Count vehicles by status
   */
  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.count({ tenant_id: tenantId, status })
  }

  /**
   * Check if VIN exists
   */
  async vinExists(vin: string, tenantId: string): Promise<boolean> {
    return this.exists({ vin: vin.toUpperCase(), tenant_id: tenantId })
  }

  /**
   * Get vehicle statistics for a tenant
   */
  async getVehicleStats(tenantId: string): Promise<{
    total: number
    by_status: Record<string, number>
    by_asset_type: Record<string, number>
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        json_object_agg(
          COALESCE(status, 'unknown'),
          status_count
        ) FILTER (WHERE status IS NOT NULL) as by_status,
        json_object_agg(
          COALESCE(asset_type, 'unknown'),
          asset_type_count
        ) FILTER (WHERE asset_type IS NOT NULL) as by_asset_type
      FROM (
        SELECT
          COUNT(*) as total,
          status,
          COUNT(*) as status_count,
          asset_type,
          COUNT(*) as asset_type_count
        FROM ${this.tableName}
        WHERE tenant_id = $1
        GROUP BY status, asset_type
      ) subquery
    `

    const result = await this.query(query, [tenantId])
    const row = result.rows[0]

    return {
      total: parseInt(row.total || '0'),
      by_status: row.by_status || {},
      by_asset_type: row.by_asset_type || {}
    }
  }
}
