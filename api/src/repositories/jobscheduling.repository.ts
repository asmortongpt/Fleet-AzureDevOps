import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface JobSchedule {
  id: number;
  tenant_id: number;
  job_name: string;
  schedule_expression: string;
  last_run: Date;
  next_run: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class JobSchedulingRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('job_scheduling', pool);
    this.pool = pool;
  }

  async getJobSchedules(tenantId: number): Promise<JobSchedule[]> {
    const query = `SELECT id, tenant_id, job_name, schedule_expression, last_run, next_run, status, created_at, updated_at FROM job_scheduling WHERE tenant_id = $1`;
    const result: QueryResult<JobSchedule> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getJobScheduleById(id: number, tenantId: number): Promise<JobSchedule | null> {
    const query = `SELECT id, tenant_id, job_name, schedule_expression, last_run, next_run, status, created_at, updated_at FROM job_scheduling WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<JobSchedule> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createJobSchedule(tenantId: number, jobScheduleData: Omit<JobSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<JobSchedule> {
    const query = `
      INSERT INTO job_scheduling (tenant_id, job_name, schedule_expression, last_run, next_run, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      jobScheduleData.job_name,
      jobScheduleData.schedule_expression,
      jobScheduleData.last_run,
      jobScheduleData.next_run,
      jobScheduleData.status
    ];
    const result: QueryResult<JobSchedule> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateJobSchedule(id: number, tenantId: number, jobScheduleData: Partial<JobSchedule>): Promise<JobSchedule | null> {
    const setClause = Object.keys(jobScheduleData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getJobScheduleById(id, tenantId);
    }

    const query = `
      UPDATE job_scheduling
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(jobScheduleData)];
    const result: QueryResult<JobSchedule> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteJobSchedule(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM job_scheduling WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
