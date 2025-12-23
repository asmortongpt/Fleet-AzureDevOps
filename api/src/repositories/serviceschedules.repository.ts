import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface ServiceSchedule {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  service_type: string;
  due_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class ServiceSchedulesRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('service_schedules', pool);
    this.pool = pool;
  }

  async findAll(tenantId: number): Promise<ServiceSchedule[]> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM service_schedules WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<ServiceSchedule | null> {
    const query = `SELECT id, tenant_id, created_at, updated_at FROM service_schedules WHERE id = $1 AND tenant_id = $2`;
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(serviceSchedule: Omit<ServiceSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceSchedule> {
    const query = `
      INSERT INTO service_schedules (tenant_id, vehicle_id, service_type, due_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      serviceSchedule.tenant_id,
      serviceSchedule.vehicle_id,
      serviceSchedule.service_type,
      serviceSchedule.due_date,
      serviceSchedule.status
    ];
    const result: QueryResult<ServiceSchedule> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, tenantId: number, serviceSchedule: Partial<ServiceSchedule>): Promise<ServiceSchedule | null> {
    const setClause = Object.keys(serviceSchedule)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    const query = `
      UPDATE service_schedules
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(serviceSchedule)];
    const result: QueryResult<ServiceSchedule> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM service_schedules WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
