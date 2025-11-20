import { VehicleRepository, Vehicle } from '../repositories/VehicleRepository'
import pool from '../config/database'

/**
 * VehiclesService
 * Business logic layer for vehicle operations
 */
export class VehiclesService {
  private vehicleRepository: VehicleRepository

  constructor() {
    this.vehicleRepository = new VehicleRepository()
  }

  /**
   * Get paginated vehicles with scope filtering
   */
  async getVehicles(
    tenantId: string,
    userId: string,
    filters: {
      asset_category?: string
      asset_type?: string
      power_type?: string
      operational_status?: string
      primary_metric?: string
      is_road_legal?: boolean | string
      location_id?: string
      group_id?: string
      fleet_id?: string
      page?: number
      limit?: number
    } = {}
  ) {
    // Get user scope for row-level filtering
    const userResult = await pool.query(
      'SELECT team_vehicle_ids, vehicle_id, scope_level FROM users WHERE id = $1',
      [userId]
    )

    const user = userResult.rows[0]

    // Handle scope-based filtering
    if (user.scope_level === 'own' && user.vehicle_id) {
      // Drivers only see their assigned vehicle
      const vehicle = await this.vehicleRepository.findByIdAndTenant(user.vehicle_id, tenantId)
      return {
        data: vehicle ? [vehicle] : [],
        pagination: {
          page: 1,
          limit: 50,
          total: vehicle ? 1 : 0,
          pages: vehicle ? 1 : 0
        }
      }
    } else if (user.scope_level === 'team' && user.team_vehicle_ids && user.team_vehicle_ids.length > 0) {
      // Supervisors see vehicles in their team
      // For team scope, we need to use raw query since BaseRepository doesn't support IN clauses yet
      const scopeParams: any[] = [tenantId]
      let assetFilters = 'AND id = ANY($2::uuid[])'
      scopeParams.push(user.team_vehicle_ids)
      let paramIndex = 3

      // Build asset filters
      if (filters.asset_category) {
        assetFilters += ` AND asset_category = $${paramIndex++}`
        scopeParams.push(filters.asset_category)
      }
      if (filters.asset_type) {
        assetFilters += ` AND asset_type = $${paramIndex++}`
        scopeParams.push(filters.asset_type)
      }
      if (filters.power_type) {
        assetFilters += ` AND power_type = $${paramIndex++}`
        scopeParams.push(filters.power_type)
      }
      if (filters.operational_status) {
        assetFilters += ` AND operational_status = $${paramIndex++}`
        scopeParams.push(filters.operational_status)
      }
      if (filters.primary_metric) {
        assetFilters += ` AND primary_metric = $${paramIndex++}`
        scopeParams.push(filters.primary_metric)
      }
      if (filters.is_road_legal !== undefined) {
        assetFilters += ` AND is_road_legal = $${paramIndex++}`
        scopeParams.push(filters.is_road_legal === 'true' || filters.is_road_legal === true)
      }
      if (filters.location_id) {
        assetFilters += ` AND location_id = $${paramIndex++}`
        scopeParams.push(filters.location_id)
      }
      if (filters.group_id) {
        assetFilters += ` AND group_id = $${paramIndex++}`
        scopeParams.push(filters.group_id)
      }
      if (filters.fleet_id) {
        assetFilters += ` AND fleet_id = $${paramIndex++}`
        scopeParams.push(filters.fleet_id)
      }

      const limit = filters.limit || 50
      const offset = ((filters.page || 1) - 1) * limit

      const result = await pool.query(
        `SELECT * FROM vehicles WHERE tenant_id = $1 ${assetFilters} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...scopeParams, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1 ${assetFilters}`,
        scopeParams
      )

      return {
        data: result.rows,
        pagination: {
          page: filters.page || 1,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    }

    // Fleet/global scope sees all - use repository
    const processedFilters = {
      ...filters,
      is_road_legal: filters.is_road_legal !== undefined
        ? (filters.is_road_legal === 'true' || filters.is_road_legal === true)
        : undefined
    }

    return this.vehicleRepository.getPaginatedVehicles(
      tenantId,
      processedFilters,
      {
        page: filters.page,
        limit: filters.limit
      }
    )
  }

  /**
   * Get vehicle by ID with scope validation
   */
  async getVehicleById(vehicleId: string, tenantId: string, userId: string): Promise<Vehicle | null> {
    const vehicle = await this.vehicleRepository.findByIdAndTenant(vehicleId, tenantId)

    if (!vehicle) {
      return null
    }

    // Check IDOR protection
    const userResult = await pool.query(
      'SELECT team_vehicle_ids, vehicle_id, scope_level FROM users WHERE id = $1',
      [userId]
    )
    const user = userResult.rows[0]

    if (user.scope_level === 'own' && user.vehicle_id !== vehicleId) {
      throw new Error('Access denied: You can only view your assigned vehicle')
    } else if (user.scope_level === 'team' && user.team_vehicle_ids) {
      if (!user.team_vehicle_ids.includes(vehicleId)) {
        throw new Error('Access denied: Vehicle not in your team')
      }
    }

    return vehicle
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(tenantId: string, data: Partial<Vehicle>): Promise<Vehicle> {
    // Normalize VIN to uppercase
    if (data.vin) {
      data.vin = data.vin.toUpperCase()

      // Check for duplicate VIN
      const vinExists = await this.vehicleRepository.vinExists(data.vin, tenantId)
      if (vinExists) {
        throw new Error('VIN already exists in the system')
      }
    }

    return this.vehicleRepository.createVehicle(tenantId, data)
  }

  /**
   * Update a vehicle
   */
  async updateVehicle(id: string, tenantId: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return this.vehicleRepository.updateVehicle(id, tenantId, data)
  }

  /**
   * Delete a vehicle (only if status is sold or retired)
   */
  async deleteVehicle(id: string, tenantId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findByIdAndTenant(id, tenantId)

    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    const vehicleStatus = vehicle.status
    if (vehicleStatus !== 'sold' && vehicleStatus !== 'retired') {
      throw new Error('Vehicle can only be deleted if status is "sold" or "retired"')
    }

    await this.vehicleRepository.deleteVehicle(id, tenantId)
  }

  /**
   * Find vehicles by status
   */
  async findVehiclesByStatus(tenantId: string, status: string): Promise<Vehicle[]> {
    return this.vehicleRepository.findByStatus(tenantId, status)
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStats(tenantId: string) {
    return this.vehicleRepository.getVehicleStats(tenantId)
  }
}

export default new VehiclesService()
