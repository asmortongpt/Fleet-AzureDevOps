
import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from '../repositories/BaseRepository';

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Maintenance {
  id: number
  vehicleId: number
  maintenanceType: string
  description: string
  scheduledDate: Date
  completedDate?: Date
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  cost?: number
  mileage?: number
  performedBy?: string
  notes?: string
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * MaintenanceRepository - BACKEND-18
 * All queries use parameterized statements for SQL injection prevention
 * All operations enforce tenant isolation
 */
export class MaintenanceRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LMaintenance_LRepository extends _LBases');
  }

  /**
   * Find maintenance record by ID with tenant isolation
   */
  async findById(id: number, tenantId: string): Promise<Maintenance | null> {
    const result = await pool.query(
      'SELECT id, created_at, updated_at FROM maintenance WHERE id = $1 AND tenant_id = $2',
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
  ): Promise<Maintenance[]> {
    const { page = 1, limit = 20, sortBy = 'scheduled_date', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'scheduled_date', 'completed_date', 'status', 'cost', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'scheduled_date'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, created_at, updated_at FROM maintenance 
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
    vehicleId: number,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Maintenance[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, created_at, updated_at FROM maintenance 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY scheduled_date DESC 
       LIMIT $3 OFFSET $4`,
      [vehicleId, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find maintenance records by status
   */
  async findByStatus(
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    tenantId: string
  ): Promise<Maintenance[]> {
    const result = await pool.query(
      `SELECT id, created_at, updated_at FROM maintenance 
       WHERE status = $1 AND tenant_id = $2 
       ORDER BY scheduled_date DESC`,
      [status, tenantId]
    )
    return result.rows
  }

  /**
   * Find upcoming maintenance (next 30 days)
   */
  async findUpcoming(tenantId: string): Promise<Maintenance[]> {
    const result = await pool.query(
      `SELECT id, created_at, updated_at FROM maintenance 
       WHERE tenant_id = $1 
       AND status IN ($2, $3) 
       AND scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' 
       ORDER BY scheduled_date ASC`,
      [tenantId, 'scheduled', 'in_progress']
    )
    return result.rows
  }

  /**
   * Find overdue maintenance
   */
  async findOverdue(tenantId: string): Promise<Maintenance[]> {
    const result = await pool.query(
      `SELECT id, created_at, updated_at FROM maintenance 
       WHERE tenant_id = $1 
       AND status IN ($2, $3) 
       AND scheduled_date < NOW() 
       ORDER BY scheduled_date ASC`,
      [tenantId, 'scheduled', 'in_progress']
    )
    return result.rows
  }

  /**
   * Create new maintenance record
   */
  async create(data: Partial<Maintenance>, tenantId: string): Promise<Maintenance> {
    if (!data.vehicleId || !data.maintenanceType || !data.scheduledDate) {
      throw new ValidationError('Vehicle ID, maintenance type, and scheduled date are required')
    }

    const result = await pool.query(
      `INSERT INTO maintenance (
        vehicle_id, maintenance_type, description, scheduled_date, 
        status, cost, mileage, performed_by, notes, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.vehicleId,
        data.maintenanceType,
        data.description || '',
        data.scheduledDate,
        data.status || 'scheduled',
        data.cost || null,
        data.mileage || null,
        data.performedBy || null,
        data.notes || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update maintenance record
   */
  async update(
    id: number,
    data: Partial<Maintenance>,
    tenantId: string
  ): Promise<Maintenance> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Maintenance')
    }

    const result = await pool.query(
      `UPDATE maintenance 
       SET maintenance_type = COALESCE($1, maintenance_type),
           description = COALESCE($2, description),
           scheduled_date = COALESCE($3, scheduled_date),
           completed_date = COALESCE($4, completed_date),
           status = COALESCE($5, status),
           cost = COALESCE($6, cost),
           mileage = COALESCE($7, mileage),
           performed_by = COALESCE($8, performed_by),
           notes = COALESCE($9, notes),
           updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11
       RETURNING *`,
      [
        data.maintenanceType,
        data.description,
        data.scheduledDate,
        data.completedDate,
        data.status,
        data.cost,
        data.mileage,
        data.performedBy,
        data.notes,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Mark maintenance as completed
   */
  async markCompleted(
    id: number,
    completedDate: Date,
    cost: number,
    tenantId: string
  ): Promise<Maintenance> {
    const result = await pool.query(
      `UPDATE maintenance 
       SET status = $1, completed_date = $2, cost = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      ['completed', completedDate, cost, id, tenantId]
    )
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Maintenance')
    }
    
    return result.rows[0]
  }

  /**
   * Delete maintenance record
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM maintenance WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count maintenance records for a tenant
   */
  async count(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM maintenance WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Get total maintenance cost for a vehicle
   */
  async getTotalCost(vehicleId: number, tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(cost), 0) as total_cost 
       FROM maintenance 
       WHERE vehicle_id = $1 AND tenant_id = $2 AND status = $3`,
      [vehicleId, tenantId, 'completed']
    )
    return parseFloat(result.rows[0].total_cost) || 0
  }

  // Prevent N+1 queries with JOINs
  async findAllWithRelated() {
    const query = `
      SELECT
        t1.*,
        t2.id as related_id,
        t2.name as related_name
      FROM ${this.tableName} t1
      LEFT JOIN related_table t2 ON t1.related_id = t2.id
      WHERE t1.tenant_id = $1
      ORDER BY t1.created_at DESC
    `;
    const result = await this.pool.query(query, [this.tenantId]);
    return result.rows;
  }

}

export const maintenanceRepository = new MaintenanceRepository()
