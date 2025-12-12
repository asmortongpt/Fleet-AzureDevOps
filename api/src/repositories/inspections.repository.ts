import { BaseRepository } from '../repositories/BaseRepository';

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Inspection {
  id: number
  vehicleId: number
  inspectorId?: number
  inspectionType: string
  inspectionDate: Date
  expiryDate?: Date
  status: 'passed' | 'failed' | 'pending' | 'expired'
  certificateNumber?: string
  odometer?: number
  notes?: string
  defectsFound?: string[]
  compliance: boolean
  nextInspectionDue?: Date
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
export class InspectionsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LInspections_LRepository extends _LBases');
  }

  /**
   * Find inspection by ID
   */
  async findById(id: number, tenantId: string): Promise<Inspection | null> {
    const result = await pool.query(
      'SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections WHERE id = $1 AND tenant_id = $2',
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
    const { page = 1, limit = 20, sortBy = 'inspection_date', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'inspection_date', 'expiry_date', 'status', 'inspection_type', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'inspection_date'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
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
    vehicleId: number,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Inspection[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY inspection_date DESC 
       LIMIT $3 OFFSET $4`,
      [vehicleId, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find inspections by status
   */
  async findByStatus(
    status: 'passed' | 'failed' | 'pending' | 'expired',
    tenantId: string
  ): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
       WHERE status = $1 AND tenant_id = $2 
       ORDER BY inspection_date DESC`,
      [status, tenantId]
    )
    return result.rows
  }

  /**
   * Find inspections by type
   */
  async findByType(
    inspectionType: string,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Inspection[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
       WHERE inspection_type = $1 AND tenant_id = $2 
       ORDER BY inspection_date DESC 
       LIMIT $3 OFFSET $4`,
      [inspectionType, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find expiring inspections (within 30 days)
   */
  async findExpiringSoon(tenantId: string, days: number = 30): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
       WHERE tenant_id = $1 
       AND status = $2
       AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '1 day' * $3
       ORDER BY expiry_date ASC`,
      [tenantId, 'passed', days]
    )
    return result.rows
  }

  /**
   * Find expired inspections
   */
  async findExpired(tenantId: string): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
       WHERE tenant_id = $1 
       AND (
         (expiry_date IS NOT NULL AND expiry_date < NOW())
         OR status = $2
       )
       ORDER BY expiry_date ASC`,
      [tenantId, 'expired']
    )
    return result.rows
  }

  /**
   * Find non-compliant vehicles (failed or expired inspections)
   */
  async findNonCompliant(tenantId: string): Promise<Inspection[]> {
    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
       WHERE tenant_id = $1 
       AND (compliance = $2 OR status IN ($3, $4))
       ORDER BY inspection_date DESC`,
      [tenantId, false, 'failed', 'expired']
    )
    return result.rows
  }

  /**
   * Get latest inspection for a vehicle
   */
  async getLatestForVehicle(
    vehicleId: number,
    tenantId: string,
    inspectionType?: string
  ): Promise<Inspection | null> {
    if (inspectionType) {
      const result = await pool.query(
        `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
         WHERE vehicle_id = $1 AND tenant_id = $2 AND inspection_type = $3
         ORDER BY inspection_date DESC 
         LIMIT 1`,
        [vehicleId, tenantId, inspectionType]
      )
      return result.rows[0] || null
    }

    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type, status, notes, next_inspection_date, tenant_id, created_at, updated_at FROM inspections 
       WHERE vehicle_id = $1 AND tenant_id = $2 
       ORDER BY inspection_date DESC 
       LIMIT 1`,
      [vehicleId, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Create inspection
   */
  async create(data: Partial<Inspection>, tenantId: string): Promise<Inspection> {
    if (!data.vehicleId || !data.inspectionType || !data.inspectionDate) {
      throw new ValidationError('Vehicle ID, inspection type, and inspection date are required')
    }

    // Auto-determine compliance based on status
    const compliance = data.status === 'passed'

    const result = await pool.query(
      `INSERT INTO inspections (
        vehicle_id, inspector_id, inspection_type, inspection_date, expiry_date,
        status, certificate_number, odometer, notes, defects_found, 
        compliance, next_inspection_due, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.vehicleId,
        data.inspectorId || null,
        data.inspectionType,
        data.inspectionDate,
        data.expiryDate || null,
        data.status || 'pending',
        data.certificateNumber || null,
        data.odometer || null,
        data.notes || null,
        data.defectsFound || null,
        compliance,
        data.nextInspectionDue || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update inspection
   */
  async update(
    id: number,
    data: Partial<Inspection>,
    tenantId: string
  ): Promise<Inspection> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Inspection')
    }

    // Auto-update compliance if status changes
    let compliance = existing.compliance
    if (data.status) {
      compliance = data.status === 'passed'
    }

    const result = await pool.query(
      `UPDATE inspections 
       SET inspection_type = COALESCE($1, inspection_type),
           inspection_date = COALESCE($2, inspection_date),
           expiry_date = COALESCE($3, expiry_date),
           status = COALESCE($4, status),
           certificate_number = COALESCE($5, certificate_number),
           odometer = COALESCE($6, odometer),
           notes = COALESCE($7, notes),
           defects_found = COALESCE($8, defects_found),
           compliance = $9,
           next_inspection_due = COALESCE($10, next_inspection_due),
           updated_at = NOW()
       WHERE id = $11 AND tenant_id = $12
       RETURNING *`,
      [
        data.inspectionType,
        data.inspectionDate,
        data.expiryDate,
        data.status,
        data.certificateNumber,
        data.odometer,
        data.notes,
        data.defectsFound,
        compliance,
        data.nextInspectionDue,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Mark inspection as passed
   */
  async markPassed(
    id: number,
    certificateNumber: string,
    expiryDate: Date,
    tenantId: string
  ): Promise<Inspection> {
    const result = await pool.query(
      `UPDATE inspections 
       SET status = $1, 
           compliance = $2,
           certificate_number = $3,
           expiry_date = $4,
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      ['passed', true, certificateNumber, expiryDate, id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Inspection')
    }

    return result.rows[0]
  }

  /**
   * Mark inspection as failed
   */
  async markFailed(
    id: number,
    defects: string[],
    notes: string,
    tenantId: string
  ): Promise<Inspection> {
    const result = await pool.query(
      `UPDATE inspections 
       SET status = $1, 
           compliance = $2,
           defects_found = $3,
           notes = $4,
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      ['failed', false, defects, notes, id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Inspection')
    }

    return result.rows[0]
  }

  /**
   * Auto-expire inspections past their expiry date
   */
  async autoExpire(tenantId: string): Promise<number> {
    const result = await pool.query(
      `UPDATE inspections 
       SET status = $1, compliance = $2, updated_at = NOW()
       WHERE tenant_id = $3 
       AND status = $4
       AND expiry_date < NOW()`,
      ['expired', false, tenantId, 'passed']
    )
    return result.rowCount ?? 0
  }

  /**
   * Delete inspection
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM inspections WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count inspections
   */
  async count(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM inspections WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Get compliance rate
   */
  async getComplianceRate(tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE compliance = true) as compliant,
         COUNT(*) as total
       FROM inspections 
       WHERE tenant_id = $1`,
      [tenantId]
    )

    const { compliant, total } = result.rows[0]
    if (total === 0) return 100

    return (parseInt(compliant, 10) / parseInt(total, 10)) * 100
  }

  /**
   * Get inspection statistics by status
   */
  async getStatusStats(tenantId: string): Promise<Record<string, number>> {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM inspections 
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

export const inspectionsRepository = new InspectionsRepository()

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM inspections t
    WHERE t.id = \api/src/repositories/inspections.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM inspections t
    WHERE t.tenant_id = \api/src/repositories/inspections.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
