import { BaseRepository } from '../repositories/BaseRepository';

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'
import { container } from '../di-container'
import { CacheService, CacheKeys } from '../services/cache.service'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Vehicle {
  id: number
  vin: string
  licensePlate: string
  make: string
  model: string
  year: number
  tenantId: string
  status: 'active' | 'maintenance' | 'retired'
  mileage?: number
  fuelType?: string
  department?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * VehiclesRepository - BACKEND-17
 * All queries use parameterized statements ($1, $2, $3) for SQL injection prevention
 * All operations enforce tenant isolation
 * Includes Redis caching layer with cache invalidation on mutations
 */
export class VehiclesRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LVehicles_LRepository extends _LBases');
  }

  private cache: CacheService

  constructor() {
    this.cache = container.resolve(CacheService)
  }
  /**
   * Find vehicle by ID with tenant isolation (cached)
   * @param id Vehicle ID
   * @param tenantId Tenant ID for isolation
   * @returns Vehicle or null
   */
  async findById(id: number, tenantId: string): Promise<Vehicle | null> {
    const cacheKey = CacheKeys.vehicle(id)

    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const result = await pool.query(
          'SELECT id, vin, license_plate, make, model, year, status, mileage, fuel_type, department, tenant_id, created_at, updated_at FROM vehicles WHERE id = $1 AND tenant_id = $2',
          [id, tenantId]
        )
        return result.rows[0] || null
      },
      3600 // Cache for 1 hour
    )
  }

  /**
   * Find all vehicles for a tenant with pagination
   * @param tenantId Tenant ID for isolation
   * @param pagination Pagination parameters
   * @returns Array of vehicles
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Vehicle[]> {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    // Whitelist sortBy to prevent SQL injection
    const allowedSortColumns = ['id', 'vin', 'make', 'model', 'year', 'created_at', 'updated_at', 'status']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, vin, license_plate, make, model, year, status, mileage, fuel_type, department, tenant_id, created_at, updated_at FROM vehicles 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find vehicle by VIN with tenant isolation
   * @param vin Vehicle Identification Number
   * @param tenantId Tenant ID for isolation
   * @returns Vehicle or null
   */
  async findByVIN(vin: string, tenantId: string): Promise<Vehicle | null> {
    const result = await pool.query(
      'SELECT id, vin, license_plate, make, model, year, status, mileage, fuel_type, department, tenant_id, created_at, updated_at FROM vehicles WHERE vin = $1 AND tenant_id = $2',
      [vin, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find vehicles by status with tenant isolation
   * @param status Vehicle status
   * @param tenantId Tenant ID for isolation
   * @returns Array of vehicles
   */
  async findByStatus(
    status: 'active' | 'maintenance' | 'retired',
    tenantId: string
  ): Promise<Vehicle[]> {
    const result = await pool.query(
      'SELECT id, vin, license_plate, make, model, year, status, mileage, fuel_type, department, tenant_id, created_at, updated_at FROM vehicles WHERE status = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [status, tenantId]
    )
    return result.rows
  }

  /**
   * Create new vehicle with tenant isolation (invalidates cache)
   * @param data Partial vehicle data
   * @param tenantId Tenant ID for isolation
   * @returns Created vehicle
   */
  async create(data: Partial<Vehicle>, tenantId: string): Promise<Vehicle> {
    // Validate required fields
    if (!data.vin || !data.make || !data.model || !data.year) {
      throw new ValidationError('VIN, make, model, and year are required')
    }

    // Check for duplicate VIN
    const existing = await this.findByVIN(data.vin, tenantId)
    if (existing) {
      throw new ValidationError(`Vehicle with VIN ${data.vin} already exists`)
    }

    const result = await pool.query(
      `INSERT INTO vehicles (
        vin, license_plate, make, model, year, status, mileage, fuel_type, department, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.vin,
        data.licensePlate || null,
        data.make,
        data.model,
        data.year,
        data.status || 'active',
        data.mileage || 0,
        data.fuelType || null,
        data.department || null,
        tenantId
      ]
    )

    // Invalidate tenant-level cache
    await this.cache.deletePattern(CacheKeys.vehicles(parseInt(tenantId)))

    return result.rows[0]
  }

  /**
   * Update vehicle with tenant isolation (invalidates cache)
   * @param id Vehicle ID
   * @param data Partial vehicle data
   * @param tenantId Tenant ID for isolation
   * @returns Updated vehicle
   */
  async update(
    id: number,
    data: Partial<Vehicle>,
    tenantId: string
  ): Promise<Vehicle> {
    // Verify vehicle exists and belongs to tenant
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Vehicle')
    }

    const result = await pool.query(
      `UPDATE vehicles
       SET license_plate = COALESCE($1, license_plate),
           make = COALESCE($2, make),
           model = COALESCE($3, model),
           year = COALESCE($4, year),
           status = COALESCE($5, status),
           mileage = COALESCE($6, mileage),
           fuel_type = COALESCE($7, fuel_type),
           department = COALESCE($8, department),
           updated_at = NOW()
       WHERE id = $9 AND tenant_id = $10
       RETURNING *`,
      [
        data.licensePlate,
        data.make,
        data.model,
        data.year,
        data.status,
        data.mileage,
        data.fuelType,
        data.department,
        id,
        tenantId
      ]
    )

    // Invalidate individual and tenant-level cache
    await this.cache.delete(CacheKeys.vehicle(id))
    await this.cache.deletePattern(CacheKeys.vehicles(parseInt(tenantId)))

    return result.rows[0]
  }

  /**
   * Delete vehicle with tenant isolation (invalidates cache)
   * @param id Vehicle ID
   * @param tenantId Tenant ID for isolation
   * @returns true if deleted
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )

    const deleted = (result.rowCount ?? 0) > 0
    if (deleted) {
      // Invalidate individual and tenant-level cache
      await this.cache.delete(CacheKeys.vehicle(id))
      await this.cache.deletePattern(CacheKeys.vehicles(parseInt(tenantId)))
    }

    return deleted
  }

  /**
   * Count total vehicles for a tenant
   * @param tenantId Tenant ID for isolation
   * @returns Total count
   */
  async count(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Search vehicles by keyword with tenant isolation
   * @param keyword Search keyword
   * @param tenantId Tenant ID for isolation
   * @returns Array of vehicles
   */
  async search(keyword: string, tenantId: string): Promise<Vehicle[]> {
    const searchTerm = `%${keyword}%`
    const result = await pool.query(
      `SELECT id, vin, license_plate, make, model, year, status, mileage, fuel_type, department, tenant_id, created_at, updated_at FROM vehicles
       WHERE tenant_id = $1
       AND (
         make ILIKE $2 OR
         model ILIKE $2 OR
         vin ILIKE $2 OR
         license_plate ILIKE $2
       )
       ORDER BY created_at DESC`,
      [tenantId, searchTerm]
    )
    return result.rows
  }

  /**
   * Validate that a vehicle exists and belongs to the tenant
   * @param id Vehicle ID
   * @param tenantId Tenant ID for isolation
   * @returns true if vehicle exists and belongs to tenant
   */
  async validateOwnership(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows.length > 0
  }
}


  // ========================================================================
  // EAGER LOADING METHODS - B9 (N+1 Query Prevention)
  // ========================================================================

  /**
   * B9: Fetch vehicles with driver information (eager loading)
   * Prevents N+1 query problem by using LEFT JOIN
   * @param tenantId Tenant ID for isolation
   * @param pagination Pagination parameters
   * @returns Array of vehicles with driver data
   */
  async findByTenantWithDrivers(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<any[]> {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'vin', 'make', 'model', 'year', 'created_at', 'updated_at', 'status']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? `v.${sortBy}` : 'v.created_at'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT
        v.*,
        d.id as driver_id,
        d.name as driver_name,
        d.license_number as driver_license,
        d.phone as driver_phone,
        d.email as driver_email
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id AND d.tenant_id = $1
      WHERE v.tenant_id = $1
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )

    return result.rows
  }

  /**
   * B9: Fetch single vehicle with all related data (eager loading)
   * Prevents N+1 by fetching all relations in one query
   * @param id Vehicle ID
   * @param tenantId Tenant ID for isolation
   * @returns Vehicle with all relations or null
   */
  async findByIdWithRelations(id: number, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT
        v.*,
        d.id as driver_id,
        d.name as driver_name,
        d.license_number as driver_license,
        COUNT(DISTINCT m.id) as maintenance_count,
        COUNT(DISTINCT f.id) as fuel_transaction_count,
        MAX(m.service_date) as last_service_date
      FROM vehicles v
      LEFT JOIN drivers d ON v.assigned_driver_id = d.id AND d.tenant_id = $2
      LEFT JOIN maintenance_records m ON v.id = m.vehicle_id AND m.tenant_id = $2
      LEFT JOIN fuel_transactions f ON v.id = f.vehicle_id AND f.tenant_id = $2
      WHERE v.id = $1 AND v.tenant_id = $2
      GROUP BY v.id, d.id, d.name, d.license_number`,
      [id, tenantId]
    )

    return result.rows[0] || null
  }

export const vehiclesRepository = new VehiclesRepository()

/**
 * N+1 PREVENTION: Fetch vehicle with driver and last 5 maintenance records
 */
async findWithDriverAndMaintenance(id: string, tenantId: string) {
  const query = `
    SELECT
      v.id, v.make, v.model, v.year, v.vin, v.license_plate, v.mileage, v.status,
      d.id as driver_id, d.name as driver_name, d.email as driver_email, d.phone as driver_phone,
      m.id as maintenance_id, m.type as maintenance_type, m.date as maintenance_date,
      m.cost as maintenance_cost, m.description as maintenance_description
    FROM vehicles v
    LEFT JOIN drivers d ON v.driver_id = d.id
    LEFT JOIN LATERAL (
      SELECT id, vehicle_id, type, date, cost, mileage, description, next_service_date, tenant_id, created_at, updated_at, deleted_at FROM maintenance
      WHERE vehicle_id = v.id AND deleted_at IS NULL
      ORDER BY date DESC
      LIMIT 5
    ) m ON true
    WHERE v.id = $1 AND v.tenant_id = $2 AND v.deleted_at IS NULL
  `;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows;
}

/**
 * N+1 PREVENTION: Fetch all vehicles with drivers and status
 */
async findAllWithDriversAndStatus(tenantId: string) {
  const query = `
    SELECT
      v.id, v.make, v.model, v.year, v.vin, v.license_plate, v.mileage, v.status,
      d.id as driver_id, d.name as driver_name, d.email as driver_email
    FROM vehicles v
    LEFT JOIN drivers d ON v.driver_id = d.id
    WHERE v.tenant_id = $1 AND v.deleted_at IS NULL
    ORDER BY v.created_at DESC
  `;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
