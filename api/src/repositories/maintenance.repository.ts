import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface MaintenanceSchedule {
  id: string
  vehicleId: string
  name: string
  type: string
  description?: string
  intervalDays?: number
  intervalMiles?: number
  lastServiceDate?: Date
  lastServiceMileage?: number
  nextServiceDate?: Date
  nextServiceMileage?: number
  isActive: boolean
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * MaintenanceRepository - BACKEND-18
 * All queries use parameterized statements for SQL injection prevention
 * All operations enforce tenant isolation
 */
export class MaintenanceRepository extends BaseRepository<MaintenanceSchedule> {
  constructor(pool: Pool) {
    super(pool, 'maintenance_schedules');
  }

  /**
   * Find maintenance record by ID with tenant isolation
   */
  async findById(id: string, tenantId: string): Promise<MaintenanceSchedule | null> {
    const result = await this.pool.query(
      'SELECT id, vehicle_id AS "vehicleId", name, type, description, interval_days AS "intervalDays", interval_miles AS "intervalMiles", last_service_date AS "lastServiceDate", last_service_mileage AS "lastServiceMileage", next_service_date AS "nextServiceDate", next_service_mileage AS "nextServiceMileage", is_active AS "isActive", tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all maintenance records for a tenant with pagination
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<MaintenanceSchedule[]> {
    const { page = 1, limit = 20, sortBy = 'next_service_date', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'name', 'type', 'next_service_date', 'is_active', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'next_service_date'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await this.pool.query(
      `SELECT id, vehicle_id AS "vehicleId", name, type, description, interval_days AS "intervalDays", next_service_date AS "nextServiceDate", is_active AS "isActive", tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM maintenance_schedules 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find maintenance records by vehicle ID
   */
  async findByVehicle(
    vehicleId: string,
    tenantId: string
  ): Promise<MaintenanceSchedule[]> {
    const result = await this.pool.query(
      `SELECT id, vehicle_id AS "vehicleId", name, type, description, interval_days AS "intervalDays", next_service_date AS "nextServiceDate", is_active AS "isActive", tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt" FROM maintenance_schedules 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY next_service_date ASC`,
      [vehicleId, tenantId]
    )
    return result.rows
  }

  /**
   * Create new maintenance record
   */
  async create(data: Partial<MaintenanceSchedule>, tenantId: string): Promise<MaintenanceSchedule> {
    if (!data.vehicleId || !data.name || !data.type) {
      throw new ValidationError('Vehicle ID, name, and type are required')
    }

    const result = await this.pool.query(
      `INSERT INTO maintenance_schedules (
        vehicle_id, name, type, description, interval_days, interval_miles,
        next_service_date, next_service_mileage, is_active, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, vehicle_id AS "vehicleId", name, type, description, interval_days AS "intervalDays", is_active AS "isActive", tenant_id AS "tenantId", created_at AS "createdAt"`,
      [
        data.vehicleId,
        data.name,
        data.type,
        data.description || null,
        data.intervalDays || null,
        data.intervalMiles || null,
        data.nextServiceDate || null,
        data.nextServiceMileage || null,
        data.isActive ?? true,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update maintenance record
   */
  async update(
    id: string,
    data: Partial<MaintenanceSchedule>,
    tenantId: string
  ): Promise<MaintenanceSchedule> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('MaintenanceSchedule')
    }

    const result = await this.pool.query(
      `UPDATE maintenance_schedules 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           description = COALESCE($3, description),
           interval_days = COALESCE($4, interval_days),
           interval_miles = COALESCE($5, interval_miles),
           next_service_date = COALESCE($6, next_service_date),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9
       RETURNING id, vehicle_id AS "vehicleId", name, type, description, interval_days AS "intervalDays", is_active AS "isActive", tenant_id AS "tenantId", updated_at AS "updatedAt"`,
      [
        data.name,
        data.type,
        data.description,
        data.intervalDays,
        data.intervalMiles,
        data.nextServiceDate,
        data.isActive,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Delete maintenance record
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count maintenance records for a tenant
   */
  async count(filters: Record<string, unknown> = {}, tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM maintenance_schedules WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }
}
