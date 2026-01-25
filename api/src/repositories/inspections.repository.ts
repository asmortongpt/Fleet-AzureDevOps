import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Inspection {
  id: string
  vehicleId: string
  driverId?: string
  inspectorId?: string
  inspectorName?: string
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  passedInspection: boolean
  startedAt?: Date
  completedAt?: Date
  location?: string
  notes?: string
  defectsFound?: any
  checklistData?: any
  signatureUrl?: string
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * InspectionsRepository - BACKEND-22
 * All queries use parameterized statements
 * Compliance tracking and expiry management
 * Enforces tenant isolation
 */
export class InspectionsRepository extends BaseRepository<Inspection> {
  constructor(pool: Pool) {
    super(pool, 'inspections');
  }

  /**
   * Find inspection by ID
   */
  async findById(id: string, tenantId: string): Promise<Inspection | null> {
    const result = await this.pool.query(
      `SELECT id, vehicle_id AS "vehicleId", driver_id AS "driverId", inspector_id AS "inspectorId", 
              inspector_name AS "inspectorName", type, status, passed_inspection AS "passedInspection",
              started_at AS "startedAt", completed_at AS "completedAt", location, notes, 
              defects_found AS "defectsFound", checklist_data AS "checklistData", 
              signature_url AS "signatureUrl", tenant_id AS "tenantId", 
              created_at AS "createdAt", updated_at AS "updatedAt" 
       FROM inspections WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all inspections for a tenant
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Inspection[]> {
    const { page = 1, limit = 20, sortBy = 'completed_at', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'completed_at', 'status', 'type', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'completed_at'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await this.pool.query(
      `SELECT id, vehicle_id AS "vehicleId", inspector_name AS "inspectorName", type, status, 
              passed_inspection AS "passedInspection", completed_at AS "completedAt"
       FROM inspections 
       WHERE tenant_id = $1 
       ORDER BY ${safeSortBy} ${safeSortOrder} 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find inspections by vehicle
   */
  async findByVehicle(
    vehicleId: string,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Inspection[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await this.pool.query(
      `SELECT id, vehicle_id AS "vehicleId", inspector_name AS "inspectorName", type, status, 
              passed_inspection AS "passedInspection", completed_at AS "completedAt"
       FROM inspections 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY completed_at DESC 
       LIMIT $3 OFFSET $4`,
      [vehicleId, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Create inspection
   */
  async create(data: Partial<Inspection>, tenantId: string): Promise<Inspection> {
    if (!data.vehicleId || !data.type) {
      throw new ValidationError('Vehicle ID and inspection type are required')
    }

    const result = await this.pool.query(
      `INSERT INTO inspections (
        vehicle_id, driver_id, inspector_id, inspector_name, type, status, 
        passed_inspection, started_at, completed_at, location, notes, 
        defects_found, checklist_data, signature_url, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, vehicle_id AS "vehicleId", type, status, passed_inspection AS "passedInspection"`,
      [
        data.vehicleId,
        data.driverId || null,
        data.inspectorId || null,
        data.inspectorName || null,
        data.type,
        data.status || 'pending',
        data.passedInspection ?? false,
        data.startedAt || new Date(),
        data.completedAt || null,
        data.location || null,
        data.notes || null,
        data.defectsFound || null,
        data.checklistData || null,
        data.signatureUrl || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update inspection
   */
  async update(
    id: string,
    data: Partial<Inspection>,
    tenantId: string
  ): Promise<Inspection> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Inspection')
    }

    const result = await this.pool.query(
      `UPDATE inspections 
       SET type = COALESCE($1, type),
           status = COALESCE($2, status),
           passed_inspection = COALESCE($3, passed_inspection),
           completed_at = COALESCE($4, completed_at),
           notes = COALESCE($5, notes),
           defects_found = COALESCE($6, defects_found),
           checklist_data = COALESCE($7, checklist_data),
           updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9
       RETURNING id, vehicle_id AS "vehicleId", type, status, passed_inspection AS "passedInspection"`,
      [
        data.type,
        data.status,
        data.passedInspection,
        data.completedAt,
        data.notes,
        data.defectsFound,
        data.checklistData,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Delete inspection
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM inspections WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count inspections
   */
  async count(filters: Record<string, unknown> = {}, tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM inspections WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }
}
