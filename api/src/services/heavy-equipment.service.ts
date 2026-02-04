/**
 * Heavy Equipment Service
 *
 * Production notes:
 * - No simulated/random telemetry: all values come from DB tables.
 * - Tenant-safe: all reads/writes are scoped by tenant_id where applicable.
 * - Compatible with current DB schema (assets.asset_number/name/assigned_to_id, heavy_equipment metadata-driven fields).
 */

import { Pool } from 'pg'

import { pool } from '../db/connection'

type JsonObject = Record<string, unknown>

interface HeavyEquipmentInput {
  id?: string
  tenant_id: string
  asset_id?: string | null
  equipment_type: string
  model_year?: number | null
  engine_hours?: number | null
  engine_type?: string | null
  weight_capacity_lbs?: number | null
  load_capacity?: number | null
  reach_distance_ft?: number | null
  inspection_required?: boolean | null
  last_inspection_date?: string | null
  next_inspection_date?: string | null
  certification_number?: string | null
  requires_certification?: boolean | null
  operator_license_type?: string | null
  metadata?: JsonObject
  [key: string]: unknown
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
  tenant_id: string
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
  tenant_id: string
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
  tenant_id: string
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

const HEAVY_EQUIPMENT_COLUMNS = new Set([
  'asset_id',
  'equipment_type',
  'model_year',
  'engine_hours',
  'engine_type',
  'weight_capacity_lbs',
  'load_capacity',
  'reach_distance_ft',
  'inspection_required',
  'last_inspection_date',
  'next_inspection_date',
  'certification_number',
  'requires_certification',
  'operator_license_type',
  'metadata',
])

function splitEquipmentUpdate(
  input: Record<string, unknown>
): { columnUpdates: Record<string, unknown>; metadataPatch: JsonObject } {
  const columnUpdates: Record<string, unknown> = {}
  const metadataPatch: JsonObject = {}

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (key === 'id' || key === 'tenant_id' || key === 'created_by' || key === 'created_at' || key === 'updated_at') continue

    if (HEAVY_EQUIPMENT_COLUMNS.has(key)) {
      columnUpdates[key] = value
      continue
    }

    metadataPatch[key] = value
  }

  const maybeMetadata = input.metadata
  if (maybeMetadata && typeof maybeMetadata === 'object' && !Array.isArray(maybeMetadata)) {
    Object.assign(metadataPatch, maybeMetadata as JsonObject)
    delete columnUpdates.metadata
  }

  return { columnUpdates, metadataPatch }
}

export class HeavyEquipmentService {
  constructor(private db: Pool) {}

  async getAllEquipment(tenantId: string, filters?: any) {
    let query = `
      SELECT
        he.*,
        a.asset_number as asset_tag,
        a.name as asset_name,
        a.status as asset_status,
        a.condition,
        a.assigned_to_id,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        COALESCE(he.metadata->>'availability_status', 'available') as availability_status,
        COALESCE(NULLIF(he.metadata->>'current_job_site',''), NULL) as current_job_site,
        COALESCE((he.metadata->>'is_rental')::boolean, false) as is_rental
      FROM heavy_equipment he
      LEFT JOIN assets a ON he.asset_id = a.id
      LEFT JOIN users u ON a.assigned_to_id = u.id
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
      query += ` AND COALESCE(he.metadata->>'availability_status', 'available') = $${paramCount}`
      params.push(filters.availability_status)
    }

    if (filters?.is_rental !== undefined) {
      paramCount++
      query += ` AND COALESCE((he.metadata->>'is_rental')::boolean, false) = $${paramCount}`
      params.push(filters.is_rental)
    }

    query += ` ORDER BY a.name NULLS LAST`

    const result = await this.db.query(query, params)
    return result.rows
  }

  async getEquipmentById(equipmentId: string, tenantId: string) {
    const result = await this.db.query(
      `SELECT
        he.*,
        a.asset_number as asset_tag,
        a.name as asset_name,
        a.status as asset_status,
        a.condition,
        a.purchase_date,
        a.purchase_price,
        a.current_value,
        a.assigned_to_id,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        COALESCE(he.metadata->>'availability_status', 'available') as availability_status,
        COALESCE(NULLIF(he.metadata->>'current_job_site',''), NULL) as current_job_site,
        COALESCE((he.metadata->>'is_rental')::boolean, false) as is_rental
      FROM heavy_equipment he
      LEFT JOIN assets a ON he.asset_id = a.id
      LEFT JOIN users u ON a.assigned_to_id = u.id
      WHERE he.id = $1 AND he.tenant_id = $2`,
      [equipmentId, tenantId]
    )

    if (result.rows.length === 0) throw new Error('Equipment not found')
    return result.rows[0]
  }

  async createEquipment(data: HeavyEquipmentInput, userId: string) {
    const client = await this.db.connect()
    try {
      await client.query('BEGIN')

      const { columnUpdates, metadataPatch } = splitEquipmentUpdate(data as Record<string, unknown>)
      const metadata = JSON.stringify(metadataPatch || {})

      const result = await client.query(
        `INSERT INTO heavy_equipment (
          tenant_id,
          asset_id,
          equipment_type,
          model_year,
          engine_hours,
          engine_type,
          weight_capacity_lbs,
          load_capacity,
          reach_distance_ft,
          inspection_required,
          last_inspection_date,
          next_inspection_date,
          certification_number,
          requires_certification,
          operator_license_type,
          metadata,
          created_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )
        RETURNING *`,
        [
          data.tenant_id,
          (columnUpdates.asset_id as string | null | undefined) ?? data.asset_id ?? null,
          (columnUpdates.equipment_type as string | undefined) ?? data.equipment_type,
          (columnUpdates.model_year as number | null | undefined) ?? data.model_year ?? null,
          (columnUpdates.engine_hours as number | null | undefined) ?? data.engine_hours ?? 0,
          (columnUpdates.engine_type as string | null | undefined) ?? data.engine_type ?? null,
          (columnUpdates.weight_capacity_lbs as number | null | undefined) ?? data.weight_capacity_lbs ?? null,
          (columnUpdates.load_capacity as number | null | undefined) ?? data.load_capacity ?? null,
          (columnUpdates.reach_distance_ft as number | null | undefined) ?? data.reach_distance_ft ?? null,
          (columnUpdates.inspection_required as boolean | null | undefined) ?? data.inspection_required ?? true,
          (columnUpdates.last_inspection_date as string | null | undefined) ?? data.last_inspection_date ?? null,
          (columnUpdates.next_inspection_date as string | null | undefined) ?? data.next_inspection_date ?? null,
          (columnUpdates.certification_number as string | null | undefined) ?? data.certification_number ?? null,
          (columnUpdates.requires_certification as boolean | null | undefined) ?? data.requires_certification ?? true,
          (columnUpdates.operator_license_type as string | null | undefined) ?? data.operator_license_type ?? null,
          metadata,
          userId,
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

  async updateEquipment(equipmentId: string, tenantId: string, updates: Partial<HeavyEquipmentInput>, userId: string) {
    const { columnUpdates, metadataPatch } = splitEquipmentUpdate(updates as Record<string, unknown>)

    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    for (const [key, value] of Object.entries(columnUpdates)) {
      if (value === undefined) continue
      if (key === 'metadata') continue
      setClauses.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    }

    if (Object.keys(metadataPatch).length > 0) {
      setClauses.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${paramCount}::jsonb`)
      values.push(JSON.stringify(metadataPatch))
      paramCount++
    }

    if (setClauses.length === 0) {
      throw new Error('No fields to update')
    }

    setClauses.push('updated_at = NOW()')

    values.push(equipmentId, tenantId)

    const result = await this.db.query(
      `UPDATE heavy_equipment
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) throw new Error('Equipment not found')
    return result.rows[0]
  }

  async recordHourMeterReading(data: HourMeterReading) {
    const result = await this.db.query(
      `INSERT INTO equipment_hour_meter_readings (
        tenant_id, equipment_id, reading_date, hours, odometer_miles, fuel_level_percent,
        recorded_by, job_site, operator_id, billable_hours, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        data.tenant_id,
        data.equipment_id,
        data.reading_date || new Date().toISOString(),
        data.hours,
        data.odometer_miles,
        data.fuel_level_percent,
        data.recorded_by,
        data.job_site,
        data.operator_id,
        data.billable_hours,
        data.notes,
      ]
    )

    return result.rows[0]
  }

  async getHourMeterReadings(tenantId: string, equipmentId: string, limit: number = 50) {
    const result = await this.db.query(
      `SELECT
        ehmr.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        d.first_name || ' ' || d.last_name as operator_name
      FROM equipment_hour_meter_readings ehmr
      LEFT JOIN users u ON ehmr.recorded_by = u.id
      LEFT JOIN drivers d ON ehmr.operator_id = d.id
      WHERE ehmr.tenant_id = $1 AND ehmr.equipment_id = $2
      ORDER BY ehmr.reading_date DESC
      LIMIT $3`,
      [tenantId, equipmentId, limit]
    )

    return result.rows
  }

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

    const result = await this.db.query(query, params)
    return result.rows
  }

  async createOperatorCertification(data: OperatorCertification) {
    const result = await this.db.query(
      `INSERT INTO equipment_operator_certifications (
        tenant_id, driver_id, equipment_type, certification_number,
        certification_date, expiry_date, certifying_authority,
        certification_level, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        data.tenant_id,
        data.driver_id,
        data.equipment_type,
        data.certification_number,
        data.certification_date,
        data.expiry_date,
        data.certifying_authority,
        data.certification_level || 'basic',
        data.status || 'active',
      ]
    )

    return result.rows[0]
  }

  async getEquipmentAttachments(tenantId: string, equipmentId: string) {
    const result = await this.db.query(
      `SELECT
        id,
        tenant_id,
        equipment_id,
        attachment_type,
        attachment_name,
        manufacturer,
        model,
        serial_number,
        condition,
        purchase_cost,
        current_value,
        is_currently_attached,
        attached_date,
        metadata,
        created_at,
        updated_at
       FROM equipment_attachments
       WHERE tenant_id = $1 AND equipment_id = $2
       ORDER BY is_currently_attached DESC, attachment_name`,
      [tenantId, equipmentId]
    )

    return result.rows
  }

  async addAttachment(data: EquipmentAttachment) {
    const result = await this.db.query(
      `INSERT INTO equipment_attachments (
        tenant_id, equipment_id, attachment_type, attachment_name, manufacturer,
        model, serial_number, condition, purchase_cost, current_value,
        is_currently_attached
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        data.tenant_id,
        data.equipment_id,
        data.attachment_type,
        data.attachment_name,
        data.manufacturer,
        data.model,
        data.serial_number,
        data.condition || 'good',
        data.purchase_cost,
        data.current_value,
        data.is_currently_attached || false,
      ]
    )

    return result.rows[0]
  }

  async updateAttachmentStatus(tenantId: string, attachmentId: string, isAttached: boolean) {
    const result = await this.db.query(
      `UPDATE equipment_attachments
       SET is_currently_attached = $1,
           attached_date = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE tenant_id = $2 AND id = $3
       RETURNING *`,
      [isAttached, tenantId, attachmentId]
    )

    return result.rows[0]
  }

  async completeMaintenanceChecklist(data: MaintenanceChecklist) {
    const client = await this.db.connect()
    try {
      await client.query('BEGIN')

      const checklistResult = await client.query(
        `INSERT INTO equipment_maintenance_checklists (
          tenant_id, equipment_id, checklist_template_id, completed_by,
          engine_hours_at_completion, overall_status, inspector_name, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [
          data.tenant_id,
          data.equipment_id,
          data.checklist_template_id,
          data.completed_by,
          data.engine_hours_at_completion,
          data.overall_status,
          data.inspector_name,
          data.notes,
        ]
      )

      const checklistId = checklistResult.rows[0].id

      for (const response of data.responses) {
        await client.query(
          `INSERT INTO equipment_checklist_responses (
            tenant_id, checklist_id, template_item_id, item_description,
            response, notes, photo_url
          ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            data.tenant_id,
            checklistId,
            response.template_item_id,
            response.item_description,
            response.response,
            response.notes,
            response.photo_url,
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

  async getMaintenanceChecklists(tenantId: string, equipmentId: string, limit: number = 20) {
    const result = await this.db.query(
      `SELECT
        emc.*,
        u.first_name || ' ' || u.last_name as completed_by_name,
        ect.template_name
      FROM equipment_maintenance_checklists emc
      LEFT JOIN users u ON emc.completed_by = u.id
      LEFT JOIN equipment_checklist_templates ect ON emc.checklist_template_id = ect.id
      WHERE emc.tenant_id = $1 AND emc.equipment_id = $2
      ORDER BY emc.completed_date DESC
      LIMIT $3`,
      [tenantId, equipmentId, limit]
    )

    return result.rows
  }

  async getEquipmentUtilization(tenantId: string, equipmentId: string, startDate: string, endDate: string): Promise<any> {
    const result = await this.db.query(
      `SELECT
        eul.*,
        d.first_name || ' ' || d.last_name as operator_name,
        COALESCE(NULLIF(eul.metadata->>'job_site',''), '') as job_site
      FROM equipment_utilization_logs eul
      LEFT JOIN drivers d ON eul.operator_id = d.id
      WHERE eul.tenant_id = $1
        AND eul.equipment_id = $2
        AND eul.log_date BETWEEN $3 AND $4
      ORDER BY eul.log_date DESC`,
      [tenantId, equipmentId, startDate, endDate]
    )

    const summary = {
      total_productive_hours: 0,
      total_idle_hours: 0,
      total_maintenance_hours: 0,
      total_down_hours: 0,
      total_billable_hours: 0,
      total_revenue: 0,
      utilization_rate: 0,
      records: result.rows,
    }

    for (const row of result.rows) {
      summary.total_productive_hours += parseFloat(row.productive_hours) || 0
      summary.total_idle_hours += parseFloat(row.idle_hours) || 0
      summary.total_maintenance_hours += parseFloat(row.maintenance_hours) || 0
      summary.total_down_hours += parseFloat(row.down_hours) || 0
      summary.total_billable_hours += parseFloat(row.billable_hours) || 0
      summary.total_revenue += parseFloat(row.total_revenue) || 0
    }

    const totalHours =
      summary.total_productive_hours + summary.total_idle_hours + summary.total_maintenance_hours + summary.total_down_hours
    summary.utilization_rate = totalHours > 0 ? (summary.total_productive_hours / totalHours) * 100 : 0

    return summary
  }

  async getMaintenanceSchedules(tenantId: string, equipmentId?: string) {
    let query = `
      SELECT
        ems.*,
        he.equipment_type,
        a.asset_number as asset_tag,
        a.name as asset_name,
        he.engine_hours as current_engine_hours,
        COALESCE(NULLIF(ems.title, ''), ems.schedule_type) as maintenance_type,
        CASE
          WHEN ems.schedule_type IN ('hours', 'both') AND ems.next_due_hours IS NOT NULL
          THEN ems.next_due_hours - he.engine_hours
          ELSE NULL
        END as hours_until_due,
        CASE
          WHEN ems.schedule_type IN ('calendar', 'both') AND ems.next_due_date IS NOT NULL
          THEN ems.next_due_date - CURRENT_DATE
          ELSE NULL
        END as days_until_due,
        CASE
          WHEN ems.status = 'overdue' THEN 'critical'
          WHEN (
            (ems.schedule_type IN ('hours', 'both') AND ems.next_due_hours IS NOT NULL AND (ems.next_due_hours - he.engine_hours) < 10)
            OR
            (ems.schedule_type IN ('calendar', 'both') AND ems.next_due_date IS NOT NULL AND (ems.next_due_date - CURRENT_DATE) < 7)
          ) THEN 'high'
          WHEN (
            (ems.schedule_type IN ('hours', 'both') AND ems.next_due_hours IS NOT NULL AND (ems.next_due_hours - he.engine_hours) < 50)
            OR
            (ems.schedule_type IN ('calendar', 'both') AND ems.next_due_date IS NOT NULL AND (ems.next_due_date - CURRENT_DATE) < 30)
          ) THEN 'medium'
          ELSE 'low'
        END as priority
      FROM equipment_maintenance_schedules ems
      JOIN heavy_equipment he ON ems.equipment_id = he.id
      LEFT JOIN assets a ON he.asset_id = a.id
      WHERE he.tenant_id = $1
        AND ems.is_active = TRUE
    `

    const params: any[] = [tenantId]

    if (equipmentId) {
      query += ' AND ems.equipment_id = $2'
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

    const result = await this.db.query(query, params)
    return result.rows
  }

  async getEquipmentCostAnalysis(tenantId: string, equipmentId: string, startDate: string, endDate: string) {
    const equipment = await this.db.query(
      `SELECT
        he.id,
        he.tenant_id,
        he.asset_id,
        COALESCE(a.purchase_price, 0) as acquisition_cost,
        COALESCE(a.current_value, 0) as current_value
       FROM heavy_equipment he
       LEFT JOIN assets a ON a.id = he.asset_id
       WHERE he.id = $1 AND he.tenant_id = $2`,
      [equipmentId, tenantId]
    )

    if (equipment.rows.length === 0) throw new Error('Equipment not found')

    const acquisitionCost = parseFloat(equipment.rows[0].acquisition_cost || '0')
    const currentValue = parseFloat(equipment.rows[0].current_value || '0')
    const depreciation = Math.max(0, acquisitionCost - currentValue)

    const utilizationData = await this.getEquipmentUtilization(tenantId, equipmentId, startDate, endDate)
    const totalHours = utilizationData.total_productive_hours + utilizationData.total_idle_hours

    const costs = await this.db.query(
      `SELECT
        COALESCE(SUM(cost) FILTER (WHERE COALESCE(metadata->>'cost_type','maintenance') = 'maintenance'), 0) as maintenance_cost,
        COALESCE(SUM(cost) FILTER (WHERE metadata->>'cost_type' = 'fuel'), 0) as fuel_cost,
        COALESCE(SUM(cost) FILTER (WHERE metadata->>'cost_type' = 'labor'), 0) as labor_cost,
        COALESCE(SUM(cost) FILTER (WHERE metadata->>'cost_type' = 'insurance'), 0) as insurance_cost,
        COALESCE(SUM(cost) FILTER (WHERE metadata->>'cost_type' = 'storage'), 0) as storage_cost,
        COALESCE(SUM(cost) FILTER (WHERE metadata->>'cost_type' = 'incident'), 0) as incident_cost
       FROM equipment_maintenance_events
       WHERE tenant_id = $1
         AND equipment_id = $2
         AND event_date BETWEEN $3 AND $4`,
      [tenantId, equipmentId, startDate, endDate]
    )

    const maintenanceCost = parseFloat(costs.rows[0]?.maintenance_cost || '0')
    const fuelCost = parseFloat(costs.rows[0]?.fuel_cost || '0')
    const laborCost = parseFloat(costs.rows[0]?.labor_cost || '0')
    const insuranceCost = parseFloat(costs.rows[0]?.insurance_cost || '0')
    const storageCost = parseFloat(costs.rows[0]?.storage_cost || '0')
    const incidentCost = parseFloat(costs.rows[0]?.incident_cost || '0')

    const totalOperatingCost = maintenanceCost + fuelCost + laborCost + insuranceCost + storageCost + incidentCost
    const costPerHour = totalHours > 0 ? totalOperatingCost / totalHours : 0

    const revenueGenerated = utilizationData.total_revenue
    const profitLoss = revenueGenerated - totalOperatingCost
    const invested = acquisitionCost + totalOperatingCost
    const roiPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0

    return {
      equipment_id: equipmentId,
      analysis_period_start: startDate,
      analysis_period_end: endDate,
      acquisition_cost: acquisitionCost,
      depreciation,
      maintenance_cost: maintenanceCost,
      fuel_cost: fuelCost,
      labor_cost: laborCost,
      insurance_cost: insuranceCost,
      storage_cost: storageCost,
      total_operating_cost: totalOperatingCost,
      total_hours: totalHours,
      productive_hours: utilizationData.total_productive_hours,
      utilization_rate: utilizationData.utilization_rate,
      cost_per_hour: costPerHour,
      revenue_generated: revenueGenerated,
      profit_loss: profitLoss,
      roi_percentage: roiPercentage,
      current_value: currentValue,
      residual_value: currentValue,
      depreciation_rate: acquisitionCost > 0 ? (depreciation / acquisitionCost) * 100 : 0,
    }
  }

  async getCertificationExpiringAlerts(tenantId: string, daysThreshold: number = 30) {
    const result = await this.db.query(
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

  async getOperatorCertificationMatrix(tenantId: string) {
    const result = await this.db.query(
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
        ON d.id = eoc.driver_id AND eoc.status = 'active' AND eoc.tenant_id = $1
      WHERE d.tenant_id = $1 AND d.status = 'active'
      GROUP BY d.id, d.first_name, d.last_name, d.status
      ORDER BY d.last_name, d.first_name`,
      [tenantId]
    )

    return result.rows
  }

  async getLatestTelemetrics(tenantId: string, equipmentId: string) {
    const snapshot = await this.db.query(
      `SELECT
        equipment_id,
        timestamp,
        engine_hours,
        engine_rpm,
        engine_temp_celsius,
        fuel_level_percent,
        fuel_consumption_rate,
        latitude,
        longitude,
        speed_mph,
        altitude_feet,
        hydraulic_pressure_psi,
        battery_voltage,
        diagnostic_codes,
        alerts
       FROM equipment_telematics_snapshots
       WHERE tenant_id = $1 AND equipment_id = $2
       ORDER BY timestamp DESC
       LIMIT 1`,
      [tenantId, equipmentId]
    )

    if (snapshot.rows.length > 0) return snapshot.rows[0]

    const baseline = await this.db.query(
      `SELECT
        he.id as equipment_id,
        NOW() as timestamp,
        COALESCE(he.engine_hours, 0) as engine_hours,
        0::int as engine_rpm,
        0::numeric as engine_temp_celsius,
        0::numeric as fuel_level_percent,
        0::numeric as fuel_consumption_rate,
        COALESCE(NULLIF(a.metadata->>'latitude','')::numeric, 38.9072) as latitude,
        COALESCE(NULLIF(a.metadata->>'longitude','')::numeric, -77.0369) as longitude,
        0::numeric as speed_mph,
        0::numeric as altitude_feet,
        0::numeric as hydraulic_pressure_psi,
        12.6::numeric as battery_voltage,
        ARRAY[]::TEXT[] as diagnostic_codes,
        '[]'::jsonb as alerts
       FROM heavy_equipment he
       LEFT JOIN assets a ON a.id = he.asset_id
       WHERE he.id = $1 AND he.tenant_id = $2`,
      [equipmentId, tenantId]
    )

    if (baseline.rows.length === 0) throw new Error('Equipment not found')
    return baseline.rows[0]
  }
}

const heavyEquipmentService = new HeavyEquipmentService(pool)
export default heavyEquipmentService

