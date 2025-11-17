/**
 * Heavy Equipment Service
 * Comprehensive service for heavy equipment management including:
 * - Equipment lifecycle tracking
 * - Operator certification management
 * - Hour meter and utilization tracking
 * - Maintenance scheduling (hour-based and calendar-based)
 * - Cost analysis and ROI calculation
 * - Attachment management
 */

import pool from '../config/database'

interface HeavyEquipment {
  id?: string
  tenant_id: string
  asset_id: string
  equipment_type: string
  manufacturer: string
  model: string
  model_year?: number
  serial_number?: string
  vin?: string
  capacity_tons?: number
  max_reach_feet?: number
  lift_height_feet?: number
  engine_hours?: number
  odometer_miles?: number
  last_inspection_date?: string
  next_inspection_date?: string
  certification_expiry?: string
  is_rental?: boolean
  rental_rate_daily?: number
  availability_status?: string
  current_job_site?: string
  metadata?: any
}

interface OperatorCertification {
  id?: string
  tenant_id: string
  driver_id: string
  equipment_type: string
  certification_number?: string
  certification_date: string
  expiry_date: string
  certifying_authority: string
  certification_level?: string
  status?: string
}

interface HourMeterReading {
  id?: string
  equipment_id: string
  reading_date?: string
  hours: number
  odometer_miles?: number
  fuel_level_percent?: number
  recorded_by: string
  job_site?: string
  operator_id?: string
  billable_hours?: number
  notes?: string
}

interface EquipmentAttachment {
  id?: string
  equipment_id: string
  attachment_type: string
  attachment_name: string
  manufacturer?: string
  model?: string
  serial_number?: string
  condition?: string
  purchase_cost?: number
  current_value?: number
  is_currently_attached?: boolean
}

interface MaintenanceChecklist {
  equipment_id: string
  checklist_template_id?: string
  completed_by: string
  engine_hours_at_completion?: number
  overall_status: string
  inspector_name?: string
  notes?: string
  responses: ChecklistResponse[]
}

interface ChecklistResponse {
  template_item_id?: string
  item_description: string
  response: string
  notes?: string
  photo_url?: string
}

class HeavyEquipmentService {
  /**
   * Get all heavy equipment for a tenant
   */
  async getAllEquipment(tenantId: string, filters?: any) {
    let query = `
      SELECT
        he.*,
        a.asset_tag,
        a.asset_name,
        a.status as asset_status,
        a.condition,
        a.location,
        a.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM heavy_equipment he
      JOIN assets a ON he.asset_id = a.id
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE he.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (filters?.equipment_type) {
      paramCount++
      query += ` AND he.equipment_type = $${paramCount}`
      params.push(filters.equipment_type)
    }

    if (filters?.availability_status) {
      paramCount++
      query += ` AND he.availability_status = $${paramCount}`
      params.push(filters.availability_status)
    }

    if (filters?.is_rental !== undefined) {
      paramCount++
      query += ` AND he.is_rental = $${paramCount}`
      params.push(filters.is_rental)
    }

    query += ` ORDER BY a.asset_name`

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Get single equipment by ID
   */
  async getEquipmentById(equipmentId: string, tenantId: string) {
    const result = await pool.query(
      `SELECT
        he.*,
        a.asset_tag,
        a.asset_name,
        a.status as asset_status,
        a.condition,
        a.location,
        a.purchase_date,
        a.purchase_price,
        a.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM heavy_equipment he
      JOIN assets a ON he.asset_id = a.id
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE he.id = $1 AND he.tenant_id = $2`,
      [equipmentId, tenantId]
    )

    if (result.rows.length === 0) {
      throw new Error('Equipment not found')
    }

    return result.rows[0]
  }

  /**
   * Create new heavy equipment
   */
  async createEquipment(data: HeavyEquipment, userId: string) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const result = await client.query(
        `INSERT INTO heavy_equipment (
          tenant_id, asset_id, equipment_type, manufacturer, model,
          model_year, serial_number, vin, capacity_tons, max_reach_feet,
          lift_height_feet, engine_hours, odometer_miles, last_inspection_date,
          next_inspection_date, certification_expiry, is_rental, rental_rate_daily,
          availability_status, current_job_site, metadata, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING *`,
        [
          data.tenant_id, data.asset_id, data.equipment_type, data.manufacturer,
          data.model, data.model_year, data.serial_number, data.vin,
          data.capacity_tons, data.max_reach_feet, data.lift_height_feet,
          data.engine_hours || 0, data.odometer_miles || 0, data.last_inspection_date,
          data.next_inspection_date, data.certification_expiry, data.is_rental || false,
          data.rental_rate_daily, data.availability_status || 'available',
          data.current_job_site, JSON.stringify(data.metadata || {}), userId
        ]
      )

      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Update heavy equipment
   */
  async updateEquipment(equipmentId: string, tenantId: string, updates: Partial<HeavyEquipment>, userId: string) {
    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.keys(updates).forEach(key => {
      if (updates[key as keyof HeavyEquipment] !== undefined && key !== 'id' && key !== 'tenant_id') {
        setClauses.push(`${key} = $${paramCount}`)
        values.push(updates[key as keyof HeavyEquipment])
        paramCount++
      }
    })

    if (setClauses.length === 0) {
      throw new Error('No fields to update')
    }

    setClauses.push(`updated_at = NOW()`)
    setClauses.push(`updated_by = $${paramCount}`)
    values.push(userId)
    paramCount++

    values.push(equipmentId, tenantId)

    const result = await pool.query(
      `UPDATE heavy_equipment
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error('Equipment not found')
    }

    return result.rows[0]
  }

  /**
   * Record hour meter reading
   */
  async recordHourMeterReading(data: HourMeterReading) {
    const result = await pool.query(
      `INSERT INTO equipment_hour_meter_readings (
        equipment_id, reading_date, hours, odometer_miles, fuel_level_percent,
        recorded_by, job_site, operator_id, billable_hours, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.equipment_id, data.reading_date || new Date().toISOString(),
        data.hours, data.odometer_miles, data.fuel_level_percent,
        data.recorded_by, data.job_site, data.operator_id,
        data.billable_hours, data.notes
      ]
    )

    return result.rows[0]
  }

  /**
   * Get hour meter readings for equipment
   */
  async getHourMeterReadings(equipmentId: string, limit: number = 50) {
    const result = await pool.query(
      `SELECT
        ehmr.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        d.first_name || ' ' || d.last_name as operator_name
      FROM equipment_hour_meter_readings ehmr
      LEFT JOIN users u ON ehmr.recorded_by = u.id
      LEFT JOIN drivers d ON ehmr.operator_id = d.id
      WHERE ehmr.equipment_id = $1
      ORDER BY ehmr.reading_date DESC
      LIMIT $2`,
      [equipmentId, limit]
    )

    return result.rows
  }

  /**
   * Get operator certifications
   */
  async getOperatorCertifications(tenantId: string, filters?: any) {
    let query = `
      SELECT
        eoc.*,
        d.first_name || ' ' || d.last_name as operator_name,
        d.license_number,
        CASE
          WHEN eoc.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN eoc.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'valid'
        END as expiration_status
      FROM equipment_operator_certifications eoc
      JOIN drivers d ON eoc.driver_id = d.id
      WHERE eoc.tenant_id = $1
    `

    const params: any[] = [tenantId]
    let paramCount = 1

    if (filters?.driver_id) {
      paramCount++
      query += ` AND eoc.driver_id = $${paramCount}`
      params.push(filters.driver_id)
    }

    if (filters?.equipment_type) {
      paramCount++
      query += ` AND eoc.equipment_type = $${paramCount}`
      params.push(filters.equipment_type)
    }

    if (filters?.status) {
      paramCount++
      query += ` AND eoc.status = $${paramCount}`
      params.push(filters.status)
    }

    if (filters?.expiring_soon) {
      query += ` AND eoc.expiry_date < CURRENT_DATE + INTERVAL '60 days' AND eoc.expiry_date >= CURRENT_DATE`
    }

    query += ` ORDER BY eoc.expiry_date ASC`

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Create operator certification
   */
  async createOperatorCertification(data: OperatorCertification) {
    const result = await pool.query(
      `INSERT INTO equipment_operator_certifications (
        tenant_id, driver_id, equipment_type, certification_number,
        certification_date, expiry_date, certifying_authority,
        certification_level, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.tenant_id, data.driver_id, data.equipment_type,
        data.certification_number, data.certification_date, data.expiry_date,
        data.certifying_authority, data.certification_level || 'basic',
        data.status || 'active'
      ]
    )

    return result.rows[0]
  }

  /**
   * Get equipment attachments
   */
  async getEquipmentAttachments(equipmentId: string) {
    const result = await pool.query(
      `SELECT * FROM equipment_attachments
       WHERE equipment_id = $1
       ORDER BY is_currently_attached DESC, attachment_name`,
      [equipmentId]
    )

    return result.rows
  }

  /**
   * Add equipment attachment
   */
  async addAttachment(data: EquipmentAttachment) {
    const result = await pool.query(
      `INSERT INTO equipment_attachments (
        equipment_id, attachment_type, attachment_name, manufacturer,
        model, serial_number, condition, purchase_cost, current_value,
        is_currently_attached
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.equipment_id, data.attachment_type, data.attachment_name,
        data.manufacturer, data.model, data.serial_number,
        data.condition || 'good', data.purchase_cost, data.current_value,
        data.is_currently_attached || false
      ]
    )

    return result.rows[0]
  }

  /**
   * Update attachment status (attach/detach)
   */
  async updateAttachmentStatus(attachmentId: string, isAttached: boolean) {
    const result = await pool.query(
      `UPDATE equipment_attachments
       SET is_currently_attached = $1,
           attached_date = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [isAttached, attachmentId]
    )

    return result.rows[0]
  }

  /**
   * Complete maintenance checklist
   */
  async completeMaintenanceChecklist(data: MaintenanceChecklist) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Insert checklist
      const checklistResult = await client.query(
        `INSERT INTO equipment_maintenance_checklists (
          equipment_id, checklist_template_id, completed_by,
          engine_hours_at_completion, overall_status, inspector_name, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.equipment_id, data.checklist_template_id, data.completed_by,
          data.engine_hours_at_completion, data.overall_status,
          data.inspector_name, data.notes
        ]
      )

      const checklistId = checklistResult.rows[0].id

      // Insert responses
      for (const response of data.responses) {
        await client.query(
          `INSERT INTO equipment_checklist_responses (
            checklist_id, template_item_id, item_description,
            response, notes, photo_url
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            checklistId, response.template_item_id, response.item_description,
            response.response, response.notes, response.photo_url
          ]
        )
      }

      await client.query('COMMIT')
      return checklistResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get maintenance checklists for equipment
   */
  async getMaintenanceChecklists(equipmentId: string, limit: number = 20) {
    const result = await pool.query(
      `SELECT
        emc.*,
        u.first_name || ' ' || u.last_name as completed_by_name,
        ect.template_name
      FROM equipment_maintenance_checklists emc
      LEFT JOIN users u ON emc.completed_by = u.id
      LEFT JOIN equipment_checklist_templates ect ON emc.checklist_template_id = ect.id
      WHERE emc.equipment_id = $1
      ORDER BY emc.completed_date DESC
      LIMIT $2`,
      [equipmentId, limit]
    )

    return result.rows
  }

  /**
   * Get equipment utilization data
   */
  async getEquipmentUtilization(equipmentId: string, startDate: string, endDate: string) {
    const result = await pool.query(
      `SELECT
        eul.*,
        d.first_name || ' ' || d.last_name as operator_name
      FROM equipment_utilization_logs eul
      LEFT JOIN drivers d ON eul.operator_id = d.id
      WHERE eul.equipment_id = $1
        AND eul.log_date BETWEEN $2 AND $3
      ORDER BY eul.log_date DESC`,
      [equipmentId, startDate, endDate]
    )

    // Calculate summary metrics
    const summary = {
      total_productive_hours: 0,
      total_idle_hours: 0,
      total_maintenance_hours: 0,
      total_down_hours: 0,
      total_billable_hours: 0,
      total_revenue: 0,
      utilization_rate: 0,
      records: result.rows
    }

    result.rows.forEach(row => {
      summary.total_productive_hours += parseFloat(row.productive_hours) || 0
      summary.total_idle_hours += parseFloat(row.idle_hours) || 0
      summary.total_maintenance_hours += parseFloat(row.maintenance_hours) || 0
      summary.total_down_hours += parseFloat(row.down_hours) || 0
      summary.total_billable_hours += parseFloat(row.billable_hours) || 0
      summary.total_revenue += parseFloat(row.total_revenue) || 0
    })

    const totalHours = summary.total_productive_hours + summary.total_idle_hours + summary.total_maintenance_hours + summary.total_down_hours
    if (totalHours > 0) {
      summary.utilization_rate = (summary.total_productive_hours / totalHours) * 100
    }

    return summary
  }

  /**
   * Get maintenance schedules
   */
  async getMaintenanceSchedules(tenantId: string, equipmentId?: string) {
    let query = `
      SELECT
        ems.*,
        he.equipment_type,
        a.asset_tag,
        a.asset_name,
        he.engine_hours as current_engine_hours,
        CASE
          WHEN ems.schedule_type IN ('hours', 'both') AND ems.next_due_hours IS NOT NULL
          THEN ems.next_due_hours - he.engine_hours
          ELSE NULL
        END as hours_until_due,
        CASE
          WHEN ems.schedule_type IN ('calendar', 'both') AND ems.next_due_date IS NOT NULL
          THEN ems.next_due_date - CURRENT_DATE
          ELSE NULL
        END as days_until_due
      FROM equipment_maintenance_schedules ems
      JOIN heavy_equipment he ON ems.equipment_id = he.id
      JOIN assets a ON he.asset_id = a.id
      WHERE he.tenant_id = $1
        AND ems.is_active = TRUE
    `

    const params: any[] = [tenantId]

    if (equipmentId) {
      query += ` AND ems.equipment_id = $2`
      params.push(equipmentId)
    }

    query += ` ORDER BY
      CASE
        WHEN ems.status = 'overdue' THEN 1
        WHEN ems.status = 'scheduled' THEN 2
        ELSE 3
      END,
      COALESCE(ems.next_due_date, '9999-12-31'::DATE),
      COALESCE(ems.next_due_hours, 999999)`

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Get equipment cost analysis
   */
  async getEquipmentCostAnalysis(equipmentId: string, startDate: string, endDate: string) {
    // Get existing analysis if available
    const existingAnalysis = await pool.query(
      `SELECT * FROM equipment_cost_analysis
       WHERE equipment_id = $1
         AND analysis_period_start = $2
         AND analysis_period_end = $3`,
      [equipmentId, startDate, endDate]
    )

    if (existingAnalysis.rows.length > 0) {
      return existingAnalysis.rows[0]
    }

    // Calculate new analysis
    const utilizationData = await this.getEquipmentUtilization(equipmentId, startDate, endDate)

    // Get maintenance costs
    const maintenanceCosts = await pool.query(
      `SELECT SUM(CAST(cost AS DECIMAL)) as total_maintenance_cost
       FROM asset_maintenance am
       JOIN heavy_equipment he ON am.asset_id = he.asset_id
       WHERE he.id = $1
         AND am.maintenance_date BETWEEN $2 AND $3`,
      [equipmentId, startDate, endDate]
    )

    const totalMaintenanceCost = parseFloat(maintenanceCosts.rows[0]?.total_maintenance_cost) || 0
    const totalHours = utilizationData.total_productive_hours + utilizationData.total_idle_hours
    const costPerHour = totalHours > 0 ? totalMaintenanceCost / totalHours : 0

    return {
      equipment_id: equipmentId,
      analysis_period_start: startDate,
      analysis_period_end: endDate,
      maintenance_cost: totalMaintenanceCost,
      total_hours: totalHours,
      productive_hours: utilizationData.total_productive_hours,
      utilization_rate: utilizationData.utilization_rate,
      cost_per_hour: costPerHour,
      revenue_generated: utilizationData.total_revenue,
      profit_loss: utilizationData.total_revenue - totalMaintenanceCost
    }
  }

  /**
   * Get certification expiration alerts
   */
  async getCertificationExpiringAlerts(tenantId: string, daysThreshold: number = 30) {
    const result = await pool.query(
      `SELECT
        eoc.*,
        d.first_name || ' ' || d.last_name as operator_name,
        d.email,
        eoc.expiry_date - CURRENT_DATE as days_until_expiry
      FROM equipment_operator_certifications eoc
      JOIN drivers d ON eoc.driver_id = d.id
      WHERE eoc.tenant_id = $1
        AND eoc.status = 'active'
        AND eoc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2
      ORDER BY eoc.expiry_date ASC`,
      [tenantId, daysThreshold]
    )

    return result.rows
  }

  /**
   * Get operator certification matrix (who can operate what)
   */
  async getOperatorCertificationMatrix(tenantId: string) {
    const result = await pool.query(
      `SELECT
        d.id as driver_id,
        d.first_name || ' ' || d.last_name as operator_name,
        d.status as driver_status,
        json_agg(
          json_build_object(
            'equipment_type', eoc.equipment_type,
            'certification_number', eoc.certification_number,
            'expiry_date', eoc.expiry_date,
            'status', eoc.status,
            'certification_level', eoc.certification_level,
            'days_until_expiry', eoc.expiry_date - CURRENT_DATE
          )
        ) FILTER (WHERE eoc.id IS NOT NULL) as certifications
      FROM drivers d
      LEFT JOIN equipment_operator_certifications eoc
        ON d.id = eoc.driver_id AND eoc.status = 'active'
      WHERE d.tenant_id = $1 AND d.status = 'active'
      GROUP BY d.id, d.first_name, d.last_name, d.status
      ORDER BY d.last_name, d.first_name`,
      [tenantId]
    )

    return result.rows
  }
}

export default new HeavyEquipmentService()
