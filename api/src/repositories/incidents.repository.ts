import { BaseRepository } from '../repositories/BaseRepository';

import { pool } from '../db'
import { NotFoundError, ValidationError } from '../lib/errors'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Incident {
  id: number
  incidentNumber: string
  vehicleId?: number
  driverId?: number
  incidentDate: Date
  incidentType: string
  severity: 'minor' | 'moderate' | 'severe' | 'fatal'
  location?: string
  latitude?: number
  longitude?: number
  description: string
  injuriesCount: number
  fatalitiesCount: number
  propertyDamageCost?: number
  vehicleDamageCost?: number
  atFault?: boolean
  reportedToOsha: boolean
  oshaCaseNumber?: string
  policeReportNumber?: string
  insuranceClaimNumber?: string
  rootCause?: string
  correctiveActions?: string
  photos?: string[]
  documents?: string[]
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  reportedBy?: number
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
  async findById(id: number, tenantId: string): Promise<Incident | null> {
    const result = await pool.query(
      `SELECT id, incident_number, vehicle_id, driver_id, incident_date,
              incident_type, severity, location, latitude, longitude, description,
              injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost,
              at_fault, reported_to_osha, osha_case_number, police_report_number,
              insurance_claim_number, root_cause, corrective_actions, photos, documents,
              status, reported_by, tenant_id, created_at, updated_at
       FROM safety_incidents
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

    const allowedSortColumns = ['id', 'incident_date', 'severity', 'status', 'incident_type', 'created_at']
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'incident_date'
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const result = await pool.query(
      `SELECT id, incident_number, vehicle_id, driver_id, incident_date,
              incident_type, severity, location, latitude, longitude, description,
              injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost,
              at_fault, reported_to_osha, osha_case_number, police_report_number,
              insurance_claim_number, root_cause, corrective_actions, photos, documents,
              status, reported_by, tenant_id, created_at, updated_at
       FROM safety_incidents
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
    vehicleId: number,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Incident[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, incident_number, vehicle_id, driver_id, incident_date,
              incident_type, severity, location, latitude, longitude, description,
              injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost,
              at_fault, reported_to_osha, osha_case_number, police_report_number,
              insurance_claim_number, root_cause, corrective_actions, photos, documents,
              status, reported_by, tenant_id, created_at, updated_at
       FROM safety_incidents
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
    driverId: number,
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<Incident[]> {
    const { page = 1, limit = 20 } = pagination
    const offset = (page - 1) * limit

    const result = await pool.query(
      `SELECT id, incident_number, vehicle_id, driver_id, incident_date,
              incident_type, severity, location, latitude, longitude, description,
              injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost,
              at_fault, reported_to_osha, osha_case_number, police_report_number,
              insurance_claim_number, root_cause, corrective_actions, photos, documents,
              status, reported_by, tenant_id, created_at, updated_at
       FROM safety_incidents
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
    status: 'open' | 'investigating' | 'resolved' | 'closed',
    tenantId: string
  ): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, incident_number, vehicle_id, driver_id, incident_date,
              incident_type, severity, location, latitude, longitude, description,
              injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost,
              at_fault, reported_to_osha, osha_case_number, police_report_number,
              insurance_claim_number, root_cause, corrective_actions, photos, documents,
              status, reported_by, tenant_id, created_at, updated_at
       FROM safety_incidents
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
    severity: 'minor' | 'moderate' | 'severe' | 'fatal',
    tenantId: string
  ): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT id, incident_number, vehicle_id, driver_id, incident_date,
              incident_type, severity, location, latitude, longitude, description,
              injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost,
              at_fault, reported_to_osha, osha_case_number, police_report_number,
              insurance_claim_number, root_cause, corrective_actions, photos, documents,
              status, reported_by, tenant_id, created_at, updated_at
       FROM safety_incidents
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
      `SELECT id, incident_number, vehicle_id, driver_id, incident_date,
              incident_type, severity, location, latitude, longitude, description,
              injuries_count, fatalities_count, property_damage_cost, vehicle_damage_cost,
              at_fault, reported_to_osha, osha_case_number, police_report_number,
              insurance_claim_number, root_cause, corrective_actions, photos, documents,
              status, reported_by, tenant_id, created_at, updated_at
       FROM safety_incidents
       WHERE tenant_id = $1
       AND (injuries_count > 0 OR fatalities_count > 0 OR severity IN ($2, $3))
       ORDER BY incident_date DESC`,
      [tenantId, 'severe', 'fatal']
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
       FROM safety_incidents
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
    if (!data.incidentDate || !data.description || !data.incidentType) {
      throw new ValidationError('Incident date, description, and incident type are required')
    }

    // Generate unique incident number
    const incidentNumber = await this.generateIncidentNumber(tenantId)

    const result = await pool.query(
      `INSERT INTO safety_incidents (
        incident_number, vehicle_id, driver_id, incident_date, incident_type,
        severity, location, latitude, longitude, description, injuries_count,
        fatalities_count, property_damage_cost, vehicle_damage_cost, at_fault,
        reported_to_osha, osha_case_number, police_report_number,
        insurance_claim_number, root_cause, corrective_actions, photos,
        documents, status, reported_by, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *`,
      [
        incidentNumber,
        data.vehicleId || null,
        data.driverId || null,
        data.incidentDate,
        data.incidentType,
        data.severity || 'minor',
        data.location || null,
        data.latitude || null,
        data.longitude || null,
        data.description,
        data.injuriesCount || 0,
        data.fatalitiesCount || 0,
        data.propertyDamageCost || null,
        data.vehicleDamageCost || null,
        data.atFault || null,
        data.reportedToOsha || false,
        data.oshaCaseNumber || null,
        data.policeReportNumber || null,
        data.insuranceClaimNumber || null,
        data.rootCause || null,
        data.correctiveActions || null,
        data.photos || null,
        data.documents || null,
        data.status || 'open',
        data.reportedBy || null,
        tenantId
      ]
    )
    return result.rows[0]
  }

  /**
   * Update incident
   */
  async update(
    id: number,
    data: Partial<Incident>,
    tenantId: string
  ): Promise<Incident> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Incident')
    }

    const result = await pool.query(
      `UPDATE safety_incidents
       SET incident_type = COALESCE($1, incident_type),
           severity = COALESCE($2, severity),
           location = COALESCE($3, location),
           latitude = COALESCE($4, latitude),
           longitude = COALESCE($5, longitude),
           description = COALESCE($6, description),
           injuries_count = COALESCE($7, injuries_count),
           fatalities_count = COALESCE($8, fatalities_count),
           property_damage_cost = COALESCE($9, property_damage_cost),
           vehicle_damage_cost = COALESCE($10, vehicle_damage_cost),
           at_fault = COALESCE($11, at_fault),
           reported_to_osha = COALESCE($12, reported_to_osha),
           osha_case_number = COALESCE($13, osha_case_number),
           police_report_number = COALESCE($14, police_report_number),
           insurance_claim_number = COALESCE($15, insurance_claim_number),
           root_cause = COALESCE($16, root_cause),
           corrective_actions = COALESCE($17, corrective_actions),
           status = COALESCE($18, status),
           updated_at = NOW()
       WHERE id = $19 AND tenant_id = $20
       RETURNING *`,
      [
        data.incidentType,
        data.severity,
        data.location,
        data.latitude,
        data.longitude,
        data.description,
        data.injuriesCount,
        data.fatalitiesCount,
        data.propertyDamageCost,
        data.vehicleDamageCost,
        data.atFault,
        data.reportedToOsha,
        data.oshaCaseNumber,
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
    id: number,
    rootCause: string,
    correctiveActions: string,
    tenantId: string
  ): Promise<Incident> {
    const result = await pool.query(
      `UPDATE safety_incidents
       SET status = $1, root_cause = $2, corrective_actions = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      ['closed', rootCause, correctiveActions, id, tenantId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundError('Incident')
    }

    return result.rows[0]
  }

  /**
   * Delete incident
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM safety_incidents WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * Count incidents for a tenant
   */
  async count(tenantId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM safety_incidents WHERE tenant_id = $1',
      [tenantId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * Get total damage cost across all incidents
   */
  async getTotalDamageCost(tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(property_damage_cost), 0) + COALESCE(SUM(vehicle_damage_cost), 0) as total_cost
       FROM safety_incidents
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
        SUM(CASE WHEN severity = $4 THEN 1 ELSE 0 END) as severe_count,
        SUM(CASE WHEN severity = $5 THEN 1 ELSE 0 END) as fatal_count,
        SUM(injuries_count) as total_injuries,
        SUM(fatalities_count) as total_fatalities,
        COALESCE(SUM(property_damage_cost), 0) + COALESCE(SUM(vehicle_damage_cost), 0) as total_cost
       FROM safety_incidents
       WHERE tenant_id = $1
       AND incident_date BETWEEN $6 AND $7`,
      [tenantId, 'minor', 'moderate', 'severe', 'fatal', startDate, endDate]
    )
    return result.rows[0]
  }
}

export const incidentsRepository = new IncidentsRepository()
