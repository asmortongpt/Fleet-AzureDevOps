import { Pool } from 'pg';
import { connectionManager } from '../config/database';
import {
  DamageReport,
  CreateDamageReportDto,
  UpdateDamageReportDto,
  DamageReportDetailed,
} from '../types/damage-report';

export class DamageReportRepository {
  private pool: Pool;

  constructor() {
    this.pool = connectionManager.getPool();
  }

  /**
   * Create a new damage report
   */
  async create(
    tenantId: string,
    data: CreateDamageReportDto
  ): Promise<DamageReport> {
    const query = `
      INSERT INTO damage_reports (
        tenant_id, vehicle_id, reported_by, damage_description,
        damage_severity, damage_location, photos, linked_work_order_id,
        inspection_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      tenantId,
      data.vehicle_id,
      data.reported_by,
      data.damage_description,
      data.damage_severity,
      data.damage_location || null,
      data.photos || [],
      data.linked_work_order_id || null,
      data.inspection_id || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get all damage reports for a tenant with optional filters
   */
  async findAll(
    tenantId: string,
    filters?: {
      vehicle_id?: string;
      severity?: string;
      status?: string;
      from_date?: Date;
      to_date?: Date;
    }
  ): Promise<DamageReport[]> {
    let query = `
      SELECT * FROM damage_reports
      WHERE tenant_id = $1
    `;

    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.vehicle_id) {
      query += ` AND vehicle_id = $${paramIndex}`;
      values.push(filters.vehicle_id);
      paramIndex++;
    }

    if (filters?.severity) {
      query += ` AND damage_severity = $${paramIndex}`;
      values.push(filters.severity);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND triposr_status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.from_date) {
      query += ` AND created_at >= $${paramIndex}`;
      values.push(filters.from_date);
      paramIndex++;
    }

    if (filters?.to_date) {
      query += ` AND created_at <= $${paramIndex}`;
      values.push(filters.to_date);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Get detailed damage report by ID (uses v_damage_reports_detailed view)
   */
  async findDetailedById(
    tenantId: string,
    id: string
  ): Promise<DamageReportDetailed | null> {
    const query = `
      SELECT * FROM v_damage_reports_detailed
      WHERE tenant_id = $1 AND id = $2
    `;

    const result = await this.pool.query(query, [tenantId, id]);
    return result.rows[0] || null;
  }

  /**
   * Get damage report by ID
   */
  async findById(tenantId: string, id: string): Promise<DamageReport | null> {
    const query = `
      SELECT * FROM damage_reports
      WHERE tenant_id = $1 AND id = $2
    `;

    const result = await this.pool.query(query, [tenantId, id]);
    return result.rows[0] || null;
  }

  /**
   * Update damage report
   */
  async update(
    tenantId: string,
    id: string,
    data: UpdateDamageReportDto
  ): Promise<DamageReport | null> {
    const fields: string[] = [];
    const values: any[] = [tenantId, id];
    let paramIndex = 3;

    if (data.damage_description !== undefined) {
      fields.push(`damage_description = $${paramIndex}`);
      values.push(data.damage_description);
      paramIndex++;
    }

    if (data.damage_severity !== undefined) {
      fields.push(`damage_severity = $${paramIndex}`);
      values.push(data.damage_severity);
      paramIndex++;
    }

    if (data.damage_location !== undefined) {
      fields.push(`damage_location = $${paramIndex}`);
      values.push(data.damage_location);
      paramIndex++;
    }

    if (data.photos !== undefined) {
      fields.push(`photos = $${paramIndex}`);
      values.push(data.photos);
      paramIndex++;
    }

    if (data.triposr_status !== undefined) {
      fields.push(`triposr_status = $${paramIndex}`);
      values.push(data.triposr_status);
      paramIndex++;
    }

    if (data.triposr_model_url,
    damage_annotations,
    damage_overlay !== undefined) {
      fields.push(`triposr_model_url,
    damage_annotations,
    damage_overlay = $${paramIndex}`);
      values.push(data.triposr_model_url,
    damage_annotations,
    damage_overlay);
      paramIndex++;
    }

    if (data.linked_work_order_id !== undefined) {
      fields.push(`linked_work_order_id = $${paramIndex}`);
      values.push(data.linked_work_order_id);
      paramIndex++;
    }

    if (data.inspection_id !== undefined) {
      fields.push(`inspection_id = $${paramIndex}`);
      values.push(data.inspection_id);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(tenantId, id);
    }

    const query = `
      UPDATE damage_reports
      SET ${fields.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete damage report
   */
  async delete(tenantId: string, id: string): Promise<boolean> {
    const query = `
      DELETE FROM damage_reports
      WHERE tenant_id = $1 AND id = $2
    `;

    const result = await this.pool.query(query, [tenantId, id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get damage reports by vehicle ID
   */
  async findByVehicleId(
    tenantId: string,
    vehicleId: string
  ): Promise<DamageReport[]> {
    const query = `
      SELECT * FROM damage_reports
      WHERE tenant_id = $1 AND vehicle_id = $2
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [tenantId, vehicleId]);
    return result.rows;
  }

  /**
   * Update TripoSR task status
   */
  async updateTriposrStatus(
    tenantId: string,
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    taskId?: string,
    modelUrl?: string
  ): Promise<DamageReport | null> {
    const query = `
      UPDATE damage_reports
      SET
        triposr_status = $3,
        triposr_task_id = COALESCE($4, triposr_task_id),
        triposr_model_url,
    damage_annotations,
    damage_overlay = COALESCE($5, triposr_model_url,
    damage_annotations,
    damage_overlay)
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      tenantId,
      id,
      status,
      taskId || null,
      modelUrl || null,
    ]);
    return result.rows[0] || null;
  }

  /**
   * Get damage reports pending 3D model generation
   */
  async findPending3DGeneration(tenantId: string): Promise<DamageReport[]> {
    const query = `
      SELECT * FROM damage_reports
      WHERE tenant_id = $1
        AND triposr_status = 'pending'
        AND array_length(photos, 1) > 0
      ORDER BY created_at ASC
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }
}

export const damageReportRepository = new DamageReportRepository();


  async updateAnnotations(id: string, damage_annotations: any[], damage_overlay: any) {
    const [updated] = await this.db
      .update(damageReports)
      .set({
        damage_annotations,
        damage_overlay,
        updated_at: new Date()
      })
      .where(eq(damageReports.id, id))
      .returning();
    return updated;
  }
