import { Pool } from 'pg'

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'

import { BaseRepository } from './base/BaseRepository';

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Incident {
  id: string
  number: string
  vehicleId?: string
  driverId?: string
  type: string
  severity: 'minor' | 'moderate' | 'major' | 'critical' | 'fatal'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold' | 'failed'
  incidentDate: Date
  location?: string
  latitude?: number
  longitude?: number
  description: string
  injuriesReported: boolean
  fatalitiesReported: boolean
  policeReportNumber?: string
  insuranceClaimNumber?: string
  estimatedCost?: number
  actualCost?: number
  reportedById?: string
  reportedAt?: Date
  investigatedById?: string
  investigationNotes?: string
  rootCause?: string
  correctiveActions?: string
  metadata?: any
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * IncidentsRepository - BACKEND-21
 * All queries use parameterized statements for SQL injection prevention
 * All operations enforce tenant isolation
 * Includes validation and safety tracking
 */
export class IncidentsRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LIncidents_LRepository extends _LBases');
  }

  /**
   * Find incident by ID with tenant isolation
   */
  async findById(id: string, tenantId: string): Promise<Incident | null> {
    const result = await pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", driver_id AS "driverId", incident_date AS "incidentDate",
              type, severity, location, latitude, longitude, description,
              injuries_reported AS "injuriesReported", fatalities_reported AS "fatalitiesReported", 
              estimated_cost AS "estimatedCost", actual_cost AS "actualCost",
              police_report_number AS "policeReportNumber",
              insurance_claim_number AS "insuranceClaimNumber", root_cause AS "rootCause", 
              corrective_actions AS "correctiveActions",
              status, reported_by_id AS "reportedById", tenant_id AS "tenantId", 
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM incidents
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  /**
   * Find all incidents for a tenant with pagination
   */
  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Incident[]> {
    const { page = 1, limit = 20, sortBy = 'incident_date', sortOrder = 'desc' } = pagination
    const offset = (page - 1) * limit

    const allowedSortColumns = ['id', 'incident_date', 'severity', 'status', 'type', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'incident_date'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", driver_id AS "driverId", incident_date AS "incidentDate",
              type, severity, location, latitude, longitude, description,
              injuries_reported AS "injuriesReported", fatalities_reported AS "fatalitiesReported", 
              status, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM incidents
       WHERE tenant_id = $1
       ORDER BY ${safeSortBy} ${safeSortOrder}
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find incidents by vehicle
   */
  async findByVehicle(
    vehicleId: string,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Incident[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", driver_id AS "driverId", incident_date AS "incidentDate",
              type, severity, location, latitude, longitude, description,
              status, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM incidents
       WHERE vehicle_id = $1 AND tenant_id = $2
       ORDER BY incident_date DESC
       LIMIT $3 OFFSET $4`,
      [vehicleId, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find incidents by driver
   */
  async findByDriver(
    driverId: string,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Incident[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", driver_id AS "driverId", incident_date AS "incidentDate",
              type, severity, location, latitude, longitude, description,
              status, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM incidents
       WHERE driver_id = $1 AND tenant_id = $2
       ORDER BY incident_date DESC
       LIMIT $3 OFFSET $4`,
      [driverId, tenantId, limit, offset]
    )
    return result.rows
  }

  /**
   * Find incidents by status
   */
  async findByStatus(
    status: Incident['status'],
    tenantId: string
  ): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", driver_id AS "driverId", incident_date AS "incidentDate",
              type, severity, location, latitude, longitude, description,
              status, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM incidents
       WHERE status = $1 AND tenant_id = $2
       ORDER BY incident_date DESC`,
      [status, tenantId]
    )
    return result.rows
  }

  /**
   * Find incidents by severity
   */
  async findBySeverity(
    severity: Incident['severity'],
    tenantId: string
  ): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", driver_id AS "driverId", incident_date AS "incidentDate",
              type, severity, location, latitude, longitude, description,
              status, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM incidents
       WHERE severity = $1 AND tenant_id = $2
       ORDER BY incident_date DESC`,
      [severity, tenantId]
    )
    return result.rows
  }

  /**
   * Find incidents requiring OSHA reporting
   */
  async findOshaReportable(tenantId: string): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, number, vehicle_id AS "vehicleId", driver_id AS "driverId", incident_date AS "incidentDate",
              type, severity, location, status, tenant_id AS "tenantId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM incidents
       WHERE tenant_id = $1
       AND (injuries_reported = true OR fatalities_reported = true OR severity IN ($2, $3))
       ORDER BY incident_date DESC`,
      [tenantId, 'major', 'fatal']
    )
    return result.rows
  }

  /**
   * Generate unique incident number
   */
  private async generateIncidentNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const result = await pool.query(
      `SELECT COUNT(*) + 1 as next_number
       FROM incidents
       WHERE tenant_id = $1
       AND EXTRACT(YEAR FROM incident_date) = $2`,
      [tenantId, year]
    )
    const nextNumber = result.rows[0].next_number
    return `INC-${year}-${String(nextNumber).padStart(5, '0')}`
  }

  /**
   * Create new incident
   */
  async create(data: Partial<Incident>, tenantId: string): Promise<Incident> {
    // Validate required fields
    if (!data.incidentDate || !data.description || !data.type) {
      throw new ValidationError('Incident date, description, and incident type are required')
    }

    // Generate unique incident number
    const number = await this.generateIncidentNumber(tenantId)

    const result = await pool.query(
      `INSERT INTO incidents (
        number, vehicle_id, driver_id, type, severity, status, incident_date,
        location, latitude, longitude, description, injuries_reported,
        fatalities_reported, police_report_number, insurance_claim_number,
        estimated_cost, actual_cost, reported_by_id, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        number,
        data.vehicleId || null,
        data.driverId || null,
        data.type,
        data.severity || 'minor',
        data.status || 'pending',
        data.incidentDate,
        data.location || null,
        data.latitude || null,
        data.longitude || null,
        data.description,
        data.injuriesReported || false,
        data.fatalitiesReported || false,
        data.policeReportNumber || null,
        data.insuranceClaimNumber || null,
        data.estimatedCost || null,
        data.actualCost || null,
        data.reportedById || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update incident
   */
  async update(
    id: string,
    data: Partial<Incident>,
    tenantId: string
  ): Promise<Incident> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Incident')
    }

    const result = await pool.query(
      `UPDATE incidents
       SET type = COALESCE($1, type),
           severity = COALESCE($2, severity),
           location = COALESCE($3, location),
           latitude = COALESCE($4, latitude),
           longitude = COALESCE($5, longitude),
           description = COALESCE($6, description),
           injuries_reported = COALESCE($7, injuries_reported),
           fatalities_reported = COALESCE($8, fatalities_reported),
           estimated_cost = COALESCE($9, estimated_cost),
           actual_cost = COALESCE($10, actual_cost),
           police_report_number = COALESCE($11, police_report_number),
           insurance_claim_number = COALESCE($12, insurance_claim_number),
           root_cause = COALESCE($13, root_cause),
           corrective_actions = COALESCE($14, corrective_actions),
           status = COALESCE($15, status),
           updated_at = NOW()
       WHERE id = $16 AND tenant_id = $17
       RETURNING *`,
      [
        data.type,
        data.severity,
        data.location,
        data.latitude,
        data.longitude,
        data.description,
        data.injuriesReported,
        data.fatalitiesReported,
        data.estimatedCost,
        data.actualCost,
        data.policeReportNumber,
        data.insuranceClaimNumber,
        data.rootCause,
        data.correctiveActions,
        data.status,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Close incident
   */
  async closeIncident(
    id: string,
    rootCause: string,
    correctiveActions: string,
    tenantId: string
  ): Promise<Incident> {
    const result = await pool.query(
      `UPDATE incidents
       SET status = $1, root_cause = $2, corrective_actions = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      ['completed', rootCause, correctiveActions, id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Incident')
    }

    return result.rows[0]
  }

  /**
   * Delete incident
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM incidents WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count incidents for a tenant
   */
  async count(filters: Record<string, unknown> = {}, tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM incidents WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Get total damage cost across all incidents
   */
  async getTotalDamageCost(tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(estimated_cost), 0) + COALESCE(SUM(actual_cost), 0) as total_cost
       FROM incidents
       WHERE tenant_id = $1`,
      [tenantId]
    )
    return parseFloat(result.rows[0].total_cost) || 0
  }

  /**
   * Get incident statistics
   */
  async getStatistics(tenantId: string, startDate: Date, endDate: Date) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_incidents,
        SUM(CASE WHEN severity = $2 THEN 1 ELSE 0 END) as minor_count,
        SUM(CASE WHEN severity = $3 THEN 1 ELSE 0 END) as moderate_count,
        SUM(CASE WHEN severity = $4 THEN 1 ELSE 0 END) as major_count,
        SUM(CASE WHEN severity = $5 THEN 1 ELSE 0 END) as fatal_count,
        SUM(CASE WHEN injuries_reported = true THEN 1 ELSE 0 END) as total_injuries,
        SUM(CASE WHEN fatalities_reported = true THEN 1 ELSE 0 END) as total_fatalities,
        COALESCE(SUM(estimated_cost), 0) + COALESCE(SUM(actual_cost), 0) as total_cost
       FROM incidents
       WHERE tenant_id = $1
       AND incident_date BETWEEN $6 AND $7`,
      [tenantId, 'minor', 'moderate', 'major', 'fatal', startDate, endDate]
    )
    return result.rows[0]
  }
}

export const incidentsRepository = new IncidentsRepository(pool)
