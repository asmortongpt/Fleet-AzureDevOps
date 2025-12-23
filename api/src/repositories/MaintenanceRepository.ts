import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface MaintenanceSchedule {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  service_type: string;
  description?: string;
  scheduled_date: Date;
  completed_date?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  odometer_reading?: number;
  estimated_cost?: number;
  actual_cost?: number;
  assigned_vendor_id?: number;
  assigned_technician?: string;
  notes?: string;
  recurring: boolean;
  recurring_interval_miles?: number;
  recurring_interval_days?: number;
  next_service_date?: Date;
  next_service_odometer?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export class MaintenanceRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('maintenance_schedules', pool);
    this.pool = pool;
  }

  async findByTenant(tenantId: number): Promise<MaintenanceSchedule[]> {
    const query = `
      SELECT * FROM maintenance_schedules
      WHERE tenant_id = $1 AND deleted_at IS NULL
      ORDER BY scheduled_date DESC
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getPaginatedSchedules(
    tenantId: number,
    filters: {
      vehicle_id?: number;
      status?: string;
      service_type?: string;
      priority?: string;
      assigned_vendor_id?: number;
      from_date?: Date;
      to_date?: Date;
    } = {},
    options: { page?: number; limit?: number } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = [`tenant_id = $1`, `deleted_at IS NULL`];
    const values: any[] = [tenantId];
    let paramCount = 2;

    if (filters.vehicle_id) {
      conditions.push(`vehicle_id = $${paramCount}`);
      values.push(filters.vehicle_id);
      paramCount++;
    }
    if (filters.status) {
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }
    if (filters.service_type) {
      conditions.push(`service_type = $${paramCount}`);
      values.push(filters.service_type);
      paramCount++;
    }
    if (filters.priority) {
      conditions.push(`priority = $${paramCount}`);
      values.push(filters.priority);
      paramCount++;
    }
    if (filters.assigned_vendor_id) {
      conditions.push(`assigned_vendor_id = $${paramCount}`);
      values.push(filters.assigned_vendor_id);
      paramCount++;
    }
    if (filters.from_date) {
      conditions.push(`scheduled_date >= $${paramCount}`);
      values.push(filters.from_date);
      paramCount++;
    }
    if (filters.to_date) {
      conditions.push(`scheduled_date <= $${paramCount}`);
      values.push(filters.to_date);
      paramCount++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count
    const countQuery = `SELECT COUNT(*) as count FROM maintenance_schedules ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Data
    const dataQuery = `
      SELECT * FROM maintenance_schedules
      ${whereClause}
      ORDER BY scheduled_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataResult = await this.pool.query(dataQuery, values);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createSchedule(tenantId: number, data: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
    const cols = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 2}`).join(', ');

    // We expect 'tenant_id' to be passed in 'data' usually, forcing it just in case
    // But data usually comes from body. We merge tenant_id
    const finalData = { ...data, tenant_id: tenantId, created_at: new Date(), updated_at: new Date() };
    const finalKeys = Object.keys(finalData);
    const finalCols = finalKeys.join(', ');
    const finalPlaceholders = finalKeys.map((_, i) => `$${i + 1}`).join(', ');
    const finalValues = finalKeys.map(k => (finalData as any)[k]);

    const query = `
      INSERT INTO maintenance_schedules (${finalCols})
      VALUES (${finalPlaceholders})
      RETURNING *
    `;
    const result = await this.pool.query(query, finalValues);
    return result.rows[0];
  }

  async updateSchedule(id: number, tenantId: number, data: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule | null> {
    const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id');
    const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');

    if (!setClause) return null; // or fetch

    const query = `
      UPDATE maintenance_schedules
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...keys.map(k => (data as any)[k])];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteSchedule(id: number, tenantId: number): Promise<boolean> {
    const query = `UPDATE maintenance_schedules SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async findByIdAndTenant(id: number, tenantId: number): Promise<MaintenanceSchedule | null> {
    const query = `SELECT * FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async findByVehicle(tenantId: number, vehicleId: number): Promise<MaintenanceSchedule[]> {
    const query = `SELECT * FROM maintenance_schedules WHERE tenant_id = $1 AND vehicle_id = $2 AND deleted_at IS NULL ORDER BY scheduled_date DESC`;
    const result = await this.pool.query(query, [tenantId, vehicleId]);
    return result.rows;
  }

  async findByStatus(tenantId: number, status: string): Promise<MaintenanceSchedule[]> {
    const query = `SELECT * FROM maintenance_schedules WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL ORDER BY scheduled_date DESC`;
    const result = await this.pool.query(query, [tenantId, status]);
    return result.rows;
  }
}
