import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface Inspection {
  id: number;
  tenant_id: number;
  vehicle_id?: number;
  driver_id?: number;
  inspector_id?: number;
  inspection_type: string;
  status: string;
  scheduled_date?: Date;
  completed_date?: Date;
  odometer?: number;
  location?: string;
  notes?: string;
  checklist_data?: any;
  defects_found?: any[];
  signature_url?: string;
  passed?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export class InspectionRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('inspections', pool);
    this.pool = pool;
  }

  async findByTenant(tenantId: number): Promise<Inspection[]> {
    const query = `SELECT * FROM inspections WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getPaginatedInspections(
    tenantId: number,
    options: { page?: number; limit?: number; orderBy?: string } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;
    const orderBy = options.orderBy || 'created_at DESC';

    const countQuery = `SELECT COUNT(*) FROM inspections WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const countRes = await this.pool.query(countQuery, [tenantId]);
    const total = parseInt(countRes.rows[0].count);

    const query = `SELECT * FROM inspections WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY ${orderBy} LIMIT $2 OFFSET $3`;
    const result = await this.pool.query(query, [tenantId, limit, offset]);

    return {
      data: result.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async createInspection(tenantId: number, data: Omit<Inspection, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Inspection> {
    // Assuming simple insert for now, real specific columns would be better but this maps to generic approach
    const keys = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map((_, i) => `$${i + 2}`).join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO inspections (tenant_id, ${keys}, created_at, updated_at) VALUES ($1, ${placeholders}, NOW(), NOW()) RETURNING *`;
    const result = await this.pool.query(query, [tenantId, ...values]);
    return result.rows[0];
  }

  async updateInspection(id: number, tenantId: number, data: Partial<Inspection>): Promise<Inspection | null> {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) return null;

    const query = `UPDATE inspections SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(data)];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteInspection(id: number, tenantId: number): Promise<boolean> {
    const query = `UPDATE inspections SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async findByIdAndTenant(id: number, tenantId: number): Promise<Inspection | null> {
    const query = `SELECT * FROM inspections WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async findByVehicle(tenantId: number, vehicleId: number): Promise<Inspection[]> {
    const query = `SELECT * FROM inspections WHERE tenant_id = $1 AND vehicle_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`;
    const result = await this.pool.query(query, [tenantId, vehicleId]);
    return result.rows;
  }

  async findByDriver(tenantId: number, driverId: number): Promise<Inspection[]> {
    const query = `SELECT * FROM inspections WHERE tenant_id = $1 AND driver_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`;
    const result = await this.pool.query(query, [tenantId, driverId]);
    return result.rows;
  }

  async findByStatus(tenantId: number, status: string): Promise<Inspection[]> {
    const query = `SELECT * FROM inspections WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL ORDER BY scheduled_date DESC`;
    const result = await this.pool.query(query, [tenantId, status]);
    return result.rows;
  }

  async findPending(tenantId: number): Promise<Inspection[]> {
    return this.findByStatus(tenantId, 'pending');
  }

  async findOverdue(tenantId: number): Promise<Inspection[]> {
    const query = `
      SELECT * FROM inspections
      WHERE tenant_id = $1
        AND status = 'pending'
        AND scheduled_date < NOW()
        AND deleted_at IS NULL
      ORDER BY scheduled_date ASC
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async completeInspection(
    id: number,
    tenantId: number,
    data: {
      passed: boolean;
      defects_found?: any[];
      notes?: string;
      signature_url?: string;
    }
  ): Promise<Inspection | null> {
    return this.updateInspection(
      id,
      tenantId,
      {
        status: 'completed',
        completed_date: new Date(),
        passed: data.passed,
        defects_found: data.defects_found,
        notes: data.notes,
        signature_url: data.signature_url
      }
    );
  }

  async getInspectionStats(tenantId: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    passed: number;
    failed: number;
    overdue: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'completed' AND passed = true) as passed,
        COUNT(*) FILTER (WHERE status = 'completed' AND passed = false) as failed,
        COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_date < NOW()) as overdue
      FROM inspections
      WHERE tenant_id = $1 AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [tenantId]);
    const row = result.rows[0];

    return {
      total: parseInt(row.total || '0'),
      pending: parseInt(row.pending || '0'),
      completed: parseInt(row.completed || '0'),
      passed: parseInt(row.passed || '0'),
      failed: parseInt(row.failed || '0'),
      overdue: parseInt(row.overdue || '0')
    };
  }

  async findDueSoon(tenantId: number, daysAhead: number = 7): Promise<Inspection[]> {
    const daysAheadNum = Math.max(1, Math.min(365, daysAhead || 7));
    const query = `
      SELECT * FROM inspections
      WHERE tenant_id = $1
        AND status = 'pending'
        AND scheduled_date BETWEEN NOW() AND NOW() + ($2 || ' days')::INTERVAL
        AND deleted_at IS NULL
      ORDER BY scheduled_date ASC
    `;
    const result = await this.pool.query(query, [tenantId, daysAheadNum]);
    return result.rows;
  }

  async getRecentByVehicle(
    tenantId: number,
    vehicleId: number,
    limit: number = 10
  ): Promise<Inspection[]> {
    const query = `SELECT * FROM inspections WHERE tenant_id = $1 AND vehicle_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $3`;
    const result = await this.pool.query(query, [tenantId, vehicleId, limit]);
    return result.rows;
  }

  async countByVehicle(tenantId: number, vehicleId: number): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM inspections WHERE tenant_id = $1 AND vehicle_id = $2 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId, vehicleId]);
    return parseInt(result.rows[0].count);
  }

  async findByDateRange(tenantId: number, startDate: Date, endDate: Date): Promise<Inspection[]> {
    const query = `
      SELECT * FROM inspections
      WHERE tenant_id = $1
        AND scheduled_date BETWEEN $2 AND $3
        AND deleted_at IS NULL
      ORDER BY scheduled_date DESC
    `;
    const result = await this.pool.query(query, [tenantId, startDate, endDate]);
    return result.rows;
  }
}
