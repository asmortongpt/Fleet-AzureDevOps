import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class OnCallManagementRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LOn_LCall_LManagement_s');
  }


    this.pool = pool;
  }

  async createOnCallSchedule(tenantId: string, schedule: any): Promise<any> {
    const query = `
      INSERT INTO on_call_schedules (tenant_id, name, start_date, end_date, rotation_type, members)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, start_date, end_date, rotation_type, members
    `;
    const values = [
      tenantId,
      schedule.name,
      schedule.start_date,
      schedule.end_date,
      schedule.rotation_type,
      schedule.members,
    ];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getOnCallSchedules(tenantId: string): Promise<any[]> {
    const query = `
      SELECT id, name, start_date, end_date, rotation_type, members
      FROM on_call_schedules
      WHERE tenant_id = $1
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }

  async getOnCallScheduleById(tenantId: string, scheduleId: string): Promise<any> {
    const query = `
      SELECT id, name, start_date, end_date, rotation_type, members
      FROM on_call_schedules
      WHERE tenant_id = $1 AND id = $2
    `;
    const result = await this.query(query, [tenantId, scheduleId]);
    return result.rows[0];
  }

  async updateOnCallSchedule(tenantId: string, scheduleId: string, schedule: any): Promise<any> {
    const query = `
      UPDATE on_call_schedules
      SET name = $1, start_date = $2, end_date = $3, rotation_type = $4, members = $5
      WHERE tenant_id = $6 AND id = $7
      RETURNING id, name, start_date, end_date, rotation_type, members
    `;
    const values = [
      schedule.name,
      schedule.start_date,
      schedule.end_date,
      schedule.rotation_type,
      schedule.members,
      tenantId,
      scheduleId,
    ];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async deleteOnCallSchedule(tenantId: string, scheduleId: string): Promise<boolean> {
    const query = `
      DELETE FROM on_call_schedules
      WHERE tenant_id = $1 AND id = $2
    `;
    const result = await this.query(query, [tenantId, scheduleId]);
    return result.rowCount > 0;
  }
}

  /**
   * N+1 PREVENTION: Find with related data
   * Override this method in subclasses for specific relationships
   */
  async findWithRelatedData(id: string, tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
    `;
    const result = await this.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * N+1 PREVENTION: Find all with related data
   * Override this method in subclasses for specific relationships
   */
  async findAllWithRelatedData(tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
