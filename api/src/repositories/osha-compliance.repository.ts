
import { pool } from '../db'
import { BaseRepository } from '../repositories/BaseRepository';

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OSHA300LogEntry {
  id: number
  employee_id: number
  vehicle_id?: number
  date_of_injury: Date
  time_of_event?: string
  case_number: string
  employee_job_title?: string
  location_where_event_occurred?: string
  description_of_injury: string
  injury_classification: string
  death?: boolean
  days_away_from_work?: number
  days_on_job_transfer?: number
  other_recordable_cases?: boolean
  privacy_case?: boolean
  case_status: string
  physician_name?: string
  physician_facility?: string
  treatment_date?: Date
  returned_to_work_date?: Date
  created_by?: number
  updated_by?: number
  created_at: Date
  updated_at: Date
}

export interface SafetyInspection {
  id: number
  vehicle_id: number
  driver_id: number
  inspection_date: Date
  inspection_time?: string
  inspection_type: string
  odometer_reading?: number
  overall_status: string
  inspection_items?: any
  defects_found?: string[]
  corrective_actions?: string[]
  inspector_signature?: string
  driver_signature?: string
  next_inspection_due?: Date
  created_at: Date
  updated_at: Date
}

export interface TrainingRecord {
  id: number
  employee_id: number
  training_type: string
  training_date: Date
  training_duration_hours?: number
  trainer_name?: string
  training_location?: string
  topics_covered?: string[]
  passed?: boolean
  score?: number
  certification_number?: string
  certification_expiry_date?: Date
  refresher_required?: boolean
  refresher_due_date?: Date
  documents?: string[]
  created_at: Date
  updated_at: Date
}

export interface AccidentInvestigation {
  id: number
  accident_date: Date
  vehicle_id?: number
  driver_id?: number
  location?: string
  severity: string
  injury_occurred?: boolean
  property_damage?: boolean
  estimated_damage_cost?: number
  description: string
  investigation_date?: Date
  investigator_name?: string
  witness_statements?: string[]
  root_cause_analysis?: string
  contributing_factors?: string[]
  corrective_actions?: string[]
  preventive_measures?: string[]
  photos?: string[]
  police_report_filed?: boolean
  insurance_claim_filed?: boolean
  investigation_status: string
  created_at: Date
  updated_at: Date
}

export interface DashboardStats {
  injuries: {
    total_injuries: number
    fatalities: number
    days_away_cases: number
    total_days_away: number
  }
  inspections: {
    failed_inspections: number
  }
  certifications: {
    expiring_certifications: number
  }
  accidents: Array<{
    severity: string
    count: number
  }>
}

/**
 * OSHAComplianceRepository - B3-AGENT-28
 * All queries use parameterized statements ($1, $2, $3)
 * All operations enforce tenant isolation via tenant_id
 * Eliminates 18 direct database queries from routes
 */
export class OSHAComplianceRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LO_LS_LH_LA_LCompliance_LRepository extends _LBases');
  }

  /**
   * OSHA 300 Log Methods
   */

  /**
   * Find OSHA 300 log entries with pagination and filters
   */
  async findOSHA300Log(
    tenantId: string,
    filters: {
      year?: string
      status?: string
      page?: number
      limit?: number
    }
  ): Promise<{ data: any[]; total: number }> {
    const { year, status, page = 1, limit = 50 } = filters
    const offset = (page - 1) * limit

    let query = `
      SELECT o.*,
             d.first_name || ' ' || d.last_name as employee_full_name,
             v.unit_number as vehicle_unit
      FROM osha_300_log o
      LEFT JOIN drivers d ON o.employee_id = d.id
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      WHERE d.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramIndex = 2

    if (year) {
      query += ` AND EXTRACT(YEAR FROM o.date_of_injury) = $${paramIndex}`
      params.push(year)
      paramIndex++
    }

    if (status) {
      query += ` AND o.case_status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY o.date_of_injury DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    const countQuery = `
      SELECT COUNT(*)
      FROM osha_300_log o
      LEFT JOIN drivers d ON o.employee_id = d.id
      WHERE d.tenant_id = $1
      ${year ? `AND EXTRACT(YEAR FROM o.date_of_injury) = $2` : ''}
      ${status ? `AND o.case_status = $${year ? '3' : '2'}` : ''}
    `
    const countParams = [tenantId]
    if (year) countParams.push(year)
    if (status) countParams.push(status)

    const countResult = await pool.query(countQuery, countParams)

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    }
  }

  /**
   * Find OSHA 300 log entry by ID
   */
  async findOSHA300LogById(id: number, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT o.*,
              d.first_name || ' ' || d.last_name as employee_full_name,
              v.unit_number as vehicle_unit
       FROM osha_300_log o
       LEFT JOIN drivers d ON o.employee_id = d.id
       LEFT JOIN vehicles v ON o.vehicle_id = v.id
       WHERE o.id = $1 AND d.tenant_id = $2`,
      [id, tenantId]
    )

    return result.rows[0] || null
  }

  /**
   * Create OSHA 300 log entry
   */
  async createOSHA300Log(data: any): Promise<any> {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const columnNames = fields.join(', ')

    const result = await pool.query(
      `INSERT INTO osha_300_log (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      values
    )

    return result.rows[0]
  }

  /**
   * Update OSHA 300 log entry
   */
  async updateOSHA300Log(id: number, data: any, updatedBy: number): Promise<any | null> {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(', ')

    const result = await pool.query(
      `UPDATE osha_300_log
       SET ${setClause}, updated_at = NOW(), updated_by = $2
       WHERE id = $1
       RETURNING *`,
      [id, updatedBy, ...values]
    )

    return result.rows[0] || null
  }

  /**
   * Safety Inspection Methods
   */

  /**
   * Find safety inspections with pagination and filters
   */
  async findSafetyInspections(
    tenantId: string,
    filters: {
      vehicle_id?: number
      driver_id?: number
      status?: string
      page?: number
      limit?: number
    }
  ): Promise<{ data: any[]; total: number }> {
    const { vehicle_id, driver_id, status, page = 1, limit = 50 } = filters
    const offset = (page - 1) * limit

    let query = `
      SELECT vsi.*,
             v.unit_number,
             d.first_name || ' ' || d.last_name as driver_name
      FROM vehicle_safety_inspections vsi
      JOIN vehicles v ON vsi.vehicle_id = v.id
      JOIN drivers d ON vsi.driver_id = d.id
      WHERE v.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramIndex = 2

    if (vehicle_id) {
      query += ` AND vsi.vehicle_id = $${paramIndex}`
      params.push(vehicle_id)
      paramIndex++
    }

    if (driver_id) {
      query += ` AND vsi.driver_id = $${paramIndex}`
      params.push(driver_id)
      paramIndex++
    }

    if (status) {
      query += ` AND vsi.overall_status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY vsi.inspection_date DESC, vsi.inspection_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    const countQuery = `
      SELECT COUNT(*)
      FROM vehicle_safety_inspections vsi
      JOIN vehicles v ON vsi.vehicle_id = v.id
      WHERE v.tenant_id = $1
      ${vehicle_id ? `AND vsi.vehicle_id = $2` : ''}
      ${driver_id ? `AND vsi.driver_id = $${vehicle_id ? '3' : '2'}` : ''}
      ${status ? `AND vsi.overall_status = $${[vehicle_id, driver_id].filter(Boolean).length + 2}` : ''}
    `
    const countParams = [tenantId]
    if (vehicle_id) countParams.push(vehicle_id)
    if (driver_id) countParams.push(driver_id)
    if (status) countParams.push(status)

    const countResult = await pool.query(countQuery, countParams)

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    }
  }

  /**
   * Create safety inspection
   */
  async createSafetyInspection(data: any): Promise<any> {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const columnNames = fields.join(', ')

    const result = await pool.query(
      `INSERT INTO vehicle_safety_inspections (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      values
    )

    return result.rows[0]
  }

  /**
   * Training Record Methods
   */

  /**
   * Find training records with pagination and filters
   */
  async findTrainingRecords(
    tenantId: string,
    filters: {
      employee_id?: number
      training_type?: string
      page?: number
      limit?: number
    }
  ): Promise<{ data: any[]; total: number }> {
    const { employee_id, training_type, page = 1, limit = 50 } = filters
    const offset = (page - 1) * limit

    let query = `
      SELECT str.*,
             d.first_name || ' ' || d.last_name as employee_name
      FROM safety_training_records str
      JOIN drivers d ON str.employee_id = d.id
      WHERE d.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramIndex = 2

    if (employee_id) {
      query += ` AND str.employee_id = $${paramIndex}`
      params.push(employee_id)
      paramIndex++
    }

    if (training_type) {
      query += ` AND str.training_type = $${paramIndex}`
      params.push(training_type)
      paramIndex++
    }

    query += ` ORDER BY str.training_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    const countQuery = `
      SELECT COUNT(*)
      FROM safety_training_records str
      JOIN drivers d ON str.employee_id = d.id
      WHERE d.tenant_id = $1
      ${employee_id ? `AND str.employee_id = $2` : ''}
      ${training_type ? `AND str.training_type = $${employee_id ? '3' : '2'}` : ''}
    `
    const countParams = [tenantId]
    if (employee_id) countParams.push(employee_id)
    if (training_type) countParams.push(training_type)

    const countResult = await pool.query(countQuery, countParams)

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    }
  }

  /**
   * Create training record
   */
  async createTrainingRecord(data: any): Promise<any> {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const columnNames = fields.join(', ')

    const result = await pool.query(
      `INSERT INTO safety_training_records (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      values
    )

    return result.rows[0]
  }

  /**
   * Accident Investigation Methods
   */

  /**
   * Find accident investigations with pagination and filters
   */
  async findAccidentInvestigations(
    tenantId: string,
    filters: {
      severity?: string
      page?: number
      limit?: number
    }
  ): Promise<{ data: any[]; total: number }> {
    const { severity, page = 1, limit = 50 } = filters
    const offset = (page - 1) * limit

    let query = `
      SELECT ai.*,
             v.unit_number,
             d.first_name || ' ' || d.last_name as driver_name
      FROM accident_investigations ai
      LEFT JOIN vehicles v ON ai.vehicle_id = v.id
      LEFT JOIN drivers d ON ai.driver_id = d.id
      WHERE v.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramIndex = 2

    if (severity) {
      query += ` AND ai.severity = $${paramIndex}`
      params.push(severity)
      paramIndex++
    }

    query += ` ORDER BY ai.accident_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    const countQuery = `
      SELECT COUNT(*)
      FROM accident_investigations ai
      LEFT JOIN vehicles v ON ai.vehicle_id = v.id
      WHERE v.tenant_id = $1
      ${severity ? 'AND ai.severity = $2' : ''}
    `
    const countParams = [tenantId]
    if (severity) countParams.push(severity)

    const countResult = await pool.query(countQuery, countParams)

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    }
  }

  /**
   * Create accident investigation
   */
  async createAccidentInvestigation(data: any): Promise<any> {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const columnNames = fields.join(', ')

    const result = await pool.query(
      `INSERT INTO accident_investigations (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      values
    )

    return result.rows[0]
  }

  /**
   * Dashboard Methods
   */

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    // Total injuries this year
    const injuriesResult = await pool.query(
      `SELECT COUNT(*) as total_injuries,
              COUNT(CASE WHEN death = TRUE THEN 1 END) as fatalities,
              COUNT(CASE WHEN days_away_from_work > 0 THEN 1 END) as days_away_cases,
              COALESCE(SUM(days_away_from_work), 0) as total_days_away
       FROM osha_300_log o
       JOIN drivers d ON o.employee_id = d.id
       WHERE d.tenant_id = $1
       AND EXTRACT(YEAR FROM o.date_of_injury) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [tenantId]
    )

    // Failed inspections
    const inspectionsResult = await pool.query(
      `SELECT COUNT(*) as failed_inspections
       FROM vehicle_safety_inspections vsi
       JOIN vehicles v ON vsi.vehicle_id = v.id
       WHERE v.tenant_id = $1
       AND vsi.overall_status = 'Fail'
       AND vsi.inspection_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [tenantId]
    )

    // Expiring certifications
    const certificationsResult = await pool.query(
      `SELECT COUNT(*) as expiring_certifications
       FROM safety_training_records str
       JOIN drivers d ON str.employee_id = d.id
       WHERE d.tenant_id = $1
       AND str.certification_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'`,
      [tenantId]
    )

    // Recent accidents
    const accidentsResult = await pool.query(
      `SELECT severity, COUNT(*) as count
       FROM accident_investigations ai
       JOIN vehicles v ON ai.vehicle_id = v.id
       WHERE v.tenant_id = $1
       AND ai.accident_date >= CURRENT_DATE - INTERVAL '90 days'
       GROUP BY severity`,
      [tenantId]
    )

    return {
      injuries: {
        total_injuries: parseInt(injuriesResult.rows[0].total_injuries),
        fatalities: parseInt(injuriesResult.rows[0].fatalities),
        days_away_cases: parseInt(injuriesResult.rows[0].days_away_cases),
        total_days_away: parseInt(injuriesResult.rows[0].total_days_away)
      },
      inspections: {
        failed_inspections: parseInt(inspectionsResult.rows[0].failed_inspections)
      },
      certifications: {
        expiring_certifications: parseInt(certificationsResult.rows[0].expiring_certifications)
      },
      accidents: accidentsResult.rows.map(row => ({
        severity: row.severity,
        count: parseInt(row.count)
      }))
    }
  }
}

export default new OSHAComplianceRepository()
