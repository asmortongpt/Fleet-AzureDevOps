import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface WorkOrder {
  id: number
  vehicleId: number
  maintenanceId?: number
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assignedTo?: string
  scheduledDate?: Date
  completedDate?: Date
  estimatedCost?: number
  actualCost?: number
  estimatedHours?: number
  actualHours?: number
  notes?: string
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * WorkOrdersRepository - BACKEND-21
 * All queries use parameterized statements
 * Status tracking and workflow management
 * Enforces tenant isolation
 */
export class WorkOrdersRepository {
  /**
   * Find work order by ID
   */
  async findById(id: number, tenantId: string): Promise<WorkOrder | null> {
    const result = await pool.query(
      'SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_date, cost, tenant_id, created_at, updated_at FROM work_orders WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all work orders for a tenant
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<WorkOrder[]> {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'priority', 'status', 'scheduled_date', 'created_at', 'updated_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_date, cost, tenant_id, created_at, updated_at FROM work_orders 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find work orders by vehicle
   */
  async findByVehicle(
    vehicleId: number,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<WorkOrder[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_date, cost, tenant_id, created_at, updated_at FROM work_orders 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [vehicleId, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find work orders by status
   */
  async findByStatus(
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled',
    tenantId: string
  ): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_date, cost, tenant_id, created_at, updated_at FROM work_orders 
       WHERE status = $1 AND tenant_id = $2 
       ORDER BY priority DESC, scheduled_date ASC`,
      [status, tenantId]
    )
    return result.rows
  }

  /**
   * Find work orders by priority
   */
  async findByPriority(
    priority: 'low' | 'medium' | 'high' | 'critical',
    tenantId: string
  ): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_date, cost, tenant_id, created_at, updated_at FROM work_orders 
       WHERE priority = $1 AND tenant_id = $2 
       AND status IN ($3, $4, $5)
       ORDER BY scheduled_date ASC`,
      [priority, tenantId, 'pending', 'assigned', 'in_progress']
    )
    return result.rows
  }

  /**
   * Find work orders assigned to a user
   */
  async findByAssignee(
    assignedTo: string,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<WorkOrder[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_date, cost, tenant_id, created_at, updated_at FROM work_orders 
       WHERE assigned_to = $1 AND tenant_id = $2 
       AND status IN ($3, $4)
       ORDER BY priority DESC, scheduled_date ASC 
       LIMIT $5 OFFSET $6`,
      [assignedTo, tenantId, 'assigned', 'in_progress', limit, offset]
    )
    return result.rows
  }

  /**
   * Find overdue work orders
   */
  async findOverdue(tenantId: string): Promise<WorkOrder[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, description, status, priority, assigned_to, due_date, completed_date, cost, tenant_id, created_at, updated_at FROM work_orders 
       WHERE tenant_id = $1 
       AND status IN ($2, $3, $4)
       AND scheduled_date < NOW() 
       ORDER BY priority DESC, scheduled_date ASC`,
      [tenantId, 'pending', 'assigned', 'in_progress']
    )
    return result.rows
  }

  /**
   * Create work order
   */
  async create(data: Partial<WorkOrder>, tenantId: string): Promise<WorkOrder> {
    if (!data.vehicleId || !data.title || !data.description) {
      throw new ValidationError('Vehicle ID, title, and description are required')
    }

    const result = await pool.query(
      `INSERT INTO work_orders (
        vehicle_id, maintenance_id, title, description, priority, status, 
        assigned_to, scheduled_date, estimated_cost, estimated_hours, notes, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.vehicleId,
        data.maintenanceId || null,
        data.title,
        data.description,
        data.priority || 'medium',
        data.status || 'pending',
        data.assignedTo || null,
        data.scheduledDate || null,
        data.estimatedCost || null,
        data.estimatedHours || null,
        data.notes || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update work order
   */
  async update(
    id: number,
    data: Partial<WorkOrder>,
    tenantId: string
  ): Promise<WorkOrder> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('WorkOrder')
    }

    const result = await pool.query(
      `UPDATE work_orders 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           status = COALESCE($4, status),
           assigned_to = COALESCE($5, assigned_to),
           scheduled_date = COALESCE($6, scheduled_date),
           completed_date = COALESCE($7, completed_date),
           estimated_cost = COALESCE($8, estimated_cost),
           actual_cost = COALESCE($9, actual_cost),
           estimated_hours = COALESCE($10, estimated_hours),
           actual_hours = COALESCE($11, actual_hours),
           notes = COALESCE($12, notes),
           updated_at = NOW()
       WHERE id = $13 AND tenant_id = $14
       RETURNING *`,
      [
        data.title,
        data.description,
        data.priority,
        data.status,
        data.assignedTo,
        data.scheduledDate,
        data.completedDate,
        data.estimatedCost,
        data.actualCost,
        data.estimatedHours,
        data.actualHours,
        data.notes,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update work order status
   */
  async updateStatus(
    id: number,
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled',
    tenantId: string
  ): Promise<WorkOrder> {
    const updates: any = { status }
    
    // Auto-set completed date when status changes to completed
    if (status === 'completed') {
      updates.completedDate = new Date()
    }

    const result = await pool.query(
      `UPDATE work_orders 
       SET status = $1, 
           completed_date = $2,
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [status, updates.completedDate || null, id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('WorkOrder')
    }

    return result.rows[0]
  }

  /**
   * Assign work order to a user
   */
  async assign(
    id: number,
    assignedTo: string,
    tenantId: string
  ): Promise<WorkOrder> {
    const result = await pool.query(
      `UPDATE work_orders 
       SET assigned_to = $1, status = $2, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [assignedTo, 'assigned', id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('WorkOrder')
    }

    return result.rows[0]
  }

  /**
   * Mark work order as completed
   */
  async complete(
    id: number,
    actualCost: number,
    actualHours: number,
    tenantId: string
  ): Promise<WorkOrder> {
    const result = await pool.query(
      `UPDATE work_orders 
       SET status = $1, 
           completed_date = NOW(),
           actual_cost = $2,
           actual_hours = $3,
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      ['completed', actualCost, actualHours, id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('WorkOrder')
    }

    return result.rows[0]
  }

  /**
   * Delete work order
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM work_orders WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count work orders
   */
  async count(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM work_orders WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Get work order statistics by status
   */
  async getStatusStats(tenantId: string): Promise<Record<string, number>> {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM work_orders 
       WHERE tenant_id = $1 
       GROUP BY status`,
      [tenantId]
    )

    const stats: Record<string, number> = {}
    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count, 10)
    })

    return stats
  }
}

export const workOrdersRepository = new WorkOrdersRepository()
