/**
 * Heavy Equipment Service (DB-backed)
 *
 * No simulated/random values: all values come from DB tables.
 * Tenant-safe: all reads/writes are scoped by tenant_id.
 */

import { Pool } from 'pg'

type EquipmentFilters = {
  equipment_type?: string
  availability_status?: string
  is_rental?: boolean
}

export class HeavyEquipmentService {
  constructor(private db: Pool) {}

  async getAllEquipment(tenantId: string, filters: EquipmentFilters = {}) {
    const values: any[] = [tenantId]
    const where: string[] = ['he.tenant_id = $1']

    if (filters.equipment_type) {
      values.push(filters.equipment_type)
      where.push(`he.equipment_type = $${values.length}`)
    }

    // These are modeled as metadata in this schema.
    if (filters.availability_status) {
      values.push(filters.availability_status)
      where.push(`(he.metadata->>'availability_status') = $${values.length}`)
    }

    if (typeof filters.is_rental === 'boolean') {
      values.push(String(filters.is_rental))
      where.push(`COALESCE(he.metadata->>'is_rental', 'false') = $${values.length}`)
    }

    const sql = `
      SELECT
        he.*,
        a.asset_number,
        a.name as asset_name
      FROM heavy_equipment he
      LEFT JOIN assets a ON a.id = he.asset_id
      WHERE ${where.join(' AND ')}
      ORDER BY he.updated_at DESC, he.created_at DESC
    `

    const result = await this.db.query(sql, values)
    return result.rows
  }

  async getMaintenanceSchedules(tenantId: string) {
    const result = await this.db.query(
      `
      SELECT
        s.*,
        he.equipment_type,
        a.asset_number,
        a.name as asset_name
      FROM equipment_maintenance_schedules s
      JOIN heavy_equipment he ON he.id = s.equipment_id
      LEFT JOIN assets a ON a.id = he.asset_id
      WHERE s.tenant_id = $1
      ORDER BY s.next_due_date NULLS LAST, s.next_due_hours NULLS LAST, s.created_at DESC
      `,
      [tenantId]
    )
    return result.rows
  }

  async getExpiringCertifications(tenantId: string, days: number) {
    const result = await this.db.query(
      `
      SELECT
        c.*,
        d.first_name,
        d.last_name,
        d.email
      FROM equipment_operator_certifications c
      JOIN drivers d ON d.id = c.driver_id
      WHERE c.tenant_id = $1
        AND c.expiry_date <= (CURRENT_DATE + ($2 || ' days')::interval)
      ORDER BY c.expiry_date ASC
      `,
      [tenantId, Math.max(0, Math.min(days, 3650))]
    )
    return result.rows
  }

  async getCertificationMatrix(tenantId: string) {
    const result = await this.db.query(
      `
      SELECT
        equipment_type,
        status,
        COUNT(*)::int as count
      FROM equipment_operator_certifications
      WHERE tenant_id = $1
      GROUP BY equipment_type, status
      ORDER BY equipment_type ASC, status ASC
      `,
      [tenantId]
    )
    return result.rows
  }

  async getCostAnalysis(tenantId: string, equipmentId: string, startDate?: string, endDate?: string) {
    const values: any[] = [tenantId, equipmentId]
    const where: string[] = ['tenant_id = $1', 'equipment_id = $2']

    if (startDate) {
      values.push(startDate)
      where.push(`analysis_period_start >= $${values.length}`)
    }
    if (endDate) {
      values.push(endDate)
      where.push(`analysis_period_end <= $${values.length}`)
    }

    const result = await this.db.query(
      `
      SELECT *
      FROM equipment_cost_analysis
      WHERE ${where.join(' AND ')}
      ORDER BY analysis_period_end DESC
      `,
      values
    )
    return result.rows
  }

  async getUtilization(tenantId: string, equipmentId: string, startDate?: string, endDate?: string) {
    const values: any[] = [tenantId, equipmentId]
    const where: string[] = ['tenant_id = $1', 'equipment_id = $2']

    if (startDate) {
      values.push(startDate)
      where.push(`log_date >= $${values.length}`)
    }
    if (endDate) {
      values.push(endDate)
      where.push(`log_date <= $${values.length}`)
    }

    const result = await this.db.query(
      `
      SELECT *
      FROM equipment_utilization_logs
      WHERE ${where.join(' AND ')}
      ORDER BY log_date DESC
      `,
      values
    )
    return result.rows
  }

  async getTelematics(tenantId: string, equipmentId: string, limit: number = 50) {
    const result = await this.db.query(
      `
      SELECT *
      FROM equipment_telematics_snapshots
      WHERE tenant_id = $1 AND equipment_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
      `,
      [tenantId, equipmentId, Math.max(1, Math.min(limit, 500))]
    )
    return result.rows
  }

  async getInspectionHistory(tenantId: string, equipmentId: string, limit: number = 50) {
    const result = await this.db.query(
      `
      SELECT
        c.*,
        (
          SELECT COUNT(*)::int
          FROM equipment_checklist_responses r
          WHERE r.checklist_id = c.id
        ) as response_count
      FROM equipment_maintenance_checklists c
      WHERE c.tenant_id = $1 AND c.equipment_id = $2
      ORDER BY c.completed_date DESC
      LIMIT $3
      `,
      [tenantId, equipmentId, Math.max(1, Math.min(limit, 500))]
    )
    return result.rows
  }
}

export default HeavyEquipmentService

