import { BaseRepository } from '../services/dal/BaseRepository'
import { connectionManager } from '../config/connection-manager'
import { PoolClient } from 'pg'

/**
 * Inspection entity interface
 */
export interface Inspection {
  id: string
  tenant_id: string
  vehicle_id?: string
  driver_id?: string
  inspector_id?: string
  inspection_type: string
  status: string
  scheduled_date?: Date
  completed_date?: Date
  odometer?: number
  location?: string
  notes?: string
  checklist_data?: any
  defects_found?: any[]
  signature_url?: string
  passed?: boolean
  created_at?: Date
  updated_at?: Date
}

/**
 * Inspection Repository
 * Provides data access operations for inspections using the DAL
 *
 * Example Usage:
 *
 * // Create repository instance
 * const inspectionRepo = new InspectionRepository()
 *
 * // Get paginated inspections
 * const result = await inspectionRepo.getPaginatedInspections(tenantId, { page: 1, limit: 50 })
 *
 * // Find inspections by vehicle
 * const vehicleInspections = await inspectionRepo.findByVehicle(tenantId, vehicleId)
 *
 * // Create inspection with transaction
 * const newInspection = await inspectionRepo.createInspection(tenantId, data)
 *
 * // Complete an inspection
 * await inspectionRepo.completeInspection(id, tenantId, { passed: true, defects: [] })
 */
export class InspectionRepository extends BaseRepository<Inspection> {
  constructor() {
    super('inspections', connectionManager.getWritePool())
  }

  /**
   * Find all inspections for a tenant
   */
  async findByTenant(tenantId: string): Promise<Inspection[]> {
    return this.findAll({
      where: { tenant_id: tenantId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Get paginated inspections for a tenant
   */
  async getPaginatedInspections(
    tenantId: string,
    options: { page?: number; limit?: number; orderBy?: string } = {}
  ) {
    return this.paginate({
      where: { tenant_id: tenantId },
      page: options.page || 1,
      limit: options.limit || 50,
      orderBy: options.orderBy || 'created_at DESC'
    })
  }

  /**
   * Create a new inspection
   */
  async createInspection(tenantId: string, data: Partial<Inspection>): Promise<Inspection> {
    return this.create({
      ...data,
      tenant_id: tenantId,
      status: data.status || 'pending'
    })
  }

  /**
   * Update an inspection
   */
  async updateInspection(id: string, tenantId: string, data: Partial<Inspection>): Promise<Inspection> {
    return this.update(id, data, tenantId)
  }

  /**
   * Delete an inspection
   */
  async deleteInspection(id: string, tenantId: string): Promise<boolean> {
    return this.delete(id, tenantId)
  }

  /**
   * Find inspection by ID for a tenant
   */
  async findByIdAndTenant(id: string, tenantId: string): Promise<Inspection | null> {
    return this.findById(id, tenantId)
  }

  /**
   * Find inspections by vehicle
   */
  async findByVehicle(tenantId: string, vehicleId: string): Promise<Inspection[]> {
    return this.findAll({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Find inspections by driver
   */
  async findByDriver(tenantId: string, driverId: string): Promise<Inspection[]> {
    return this.findAll({
      where: { tenant_id: tenantId, driver_id: driverId },
      orderBy: 'created_at DESC'
    })
  }

  /**
   * Find inspections by status
   */
  async findByStatus(tenantId: string, status: string): Promise<Inspection[]> {
    return this.findAll({
      where: { tenant_id: tenantId, status },
      orderBy: 'scheduled_date DESC'
    })
  }

  /**
   * Find pending inspections
   */
  async findPending(tenantId: string): Promise<Inspection[]> {
    return this.findByStatus(tenantId, 'pending')
  }

  /**
   * Find overdue inspections
   */
  async findOverdue(tenantId: string): Promise<Inspection[]> {
    const columns = 'id, tenant_id, vehicle_id, inspection_date, inspection_type, status, notes, created_at, updated_at';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND status = 'pending'
        AND scheduled_date < NOW()
      ORDER BY scheduled_date ASC
    `
    const result = await this.query<Inspection>(query, [tenantId])
    return result.rows
  }

  /**
   * Complete an inspection
   */
  async completeInspection(
    id: string,
    tenantId: string,
    data: {
      passed: boolean
      defects_found?: any[]
      notes?: string
      signature_url?: string
    },
    client?: PoolClient
  ): Promise<Inspection> {
    return this.update(
      id,
      {
        status: 'completed',
        completed_date: new Date(),
        passed: data.passed,
        defects_found: data.defects_found,
        notes: data.notes,
        signature_url: data.signature_url
      },
      tenantId,
      client
    )
  }

  /**
   * Get inspection statistics for a tenant
   */
  async getInspectionStats(tenantId: string): Promise<{
    total: number
    pending: number
    completed: number
    passed: number
    failed: number
    overdue: number
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'completed' AND passed = true) as passed,
        COUNT(*) FILTER (WHERE status = 'completed' AND passed = false) as failed,
        COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_date < NOW()) as overdue
      FROM ${this.tableName}
      WHERE tenant_id = $1
    `

    const result = await this.query(query, [tenantId])
    const row = result.rows[0]

    return {
      total: parseInt(row.total),
      pending: parseInt(row.pending),
      completed: parseInt(row.completed),
      passed: parseInt(row.passed),
      failed: parseInt(row.failed),
      overdue: parseInt(row.overdue)
    }
  }

  /**
   * Get inspections due soon (within next N days)
   */
  async findDueSoon(tenantId: string, daysAhead: number = 7): Promise<Inspection[]> {
    const columns = 'id, tenant_id, vehicle_id, inspection_date, inspection_type, status, notes, created_at, updated_at';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND status = 'pending'
        AND scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '${daysAhead} days'
      ORDER BY scheduled_date ASC
    `
    const result = await this.query<Inspection>(query, [tenantId])
    return result.rows
  }

  /**
   * Get recent inspections for a vehicle
   */
  async getRecentByVehicle(
    tenantId: string,
    vehicleId: string,
    limit: number = 10
  ): Promise<Inspection[]> {
    return this.findAll({
      where: { tenant_id: tenantId, vehicle_id: vehicleId },
      orderBy: 'created_at DESC',
      limit
    })
  }

  /**
   * Count inspections by vehicle
   */
  async countByVehicle(tenantId: string, vehicleId: string): Promise<number> {
    return this.count({ tenant_id: tenantId, vehicle_id: vehicleId })
  }

  /**
   * Find inspections within date range
   */
  async findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<Inspection[]> {
    const columns = 'id, tenant_id, vehicle_id, inspection_date, inspection_type, status, notes, created_at, updated_at';
    const query = `
      SELECT ${columns} FROM ${this.tableName}
      WHERE tenant_id = $1
        AND scheduled_date BETWEEN $2 AND $3
      ORDER BY scheduled_date DESC
    `
    const result = await this.query<Inspection>(query, [tenantId, startDate, endDate])
    return result.rows
  }
}
