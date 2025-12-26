import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface CleaningSchedule {
  id: number;
  name: string;
  description: string;
  frequency: string;
  start_date: Date;
  end_date: Date;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export class CleaningSchedulesRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('cleaning_schedules', pool);
    this.pool = pool;
  }

  async create(tenantId: number, schedule: Omit<CleaningSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<CleaningSchedule> {
    const query = `
      INSERT INTO cleaning_schedules (name, description, frequency, start_date, end_date, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      schedule.name,
      schedule.description,
      schedule.frequency,
      schedule.start_date,
      schedule.end_date,
      tenantId
    ];
    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getById(tenantId: number, id: number): Promise<CleaningSchedule | null> {
    const query = `
      SELECT id, name, description, frequency, start_date, end_date, tenant_id, created_at, updated_at
      FROM cleaning_schedules
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async getAll(tenantId: number): Promise<CleaningSchedule[]> {
    const query = `
      SELECT id, name, description, frequency, start_date, end_date, tenant_id, created_at, updated_at
      FROM cleaning_schedules
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, schedule: Partial<CleaningSchedule>): Promise<CleaningSchedule | null> {
    const setClause = Object.keys(schedule)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getById(tenantId, id);
    }

    const query = `UPDATE cleaning_schedules SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(schedule)];
    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `
      DELETE FROM cleaning_schedules
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}