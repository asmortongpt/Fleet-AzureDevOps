import { Pool } from 'pg';

class OnCallManagementRepository {
  private pool: Pool;

  constructor(pool: Pool) {
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
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getOnCallSchedules(tenantId: string): Promise<any[]> {
    const query = `
      SELECT id, name, start_date, end_date, rotation_type, members
      FROM on_call_schedules
      WHERE tenant_id = $1
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getOnCallScheduleById(tenantId: string, scheduleId: string): Promise<any> {
    const query = `
      SELECT id, name, start_date, end_date, rotation_type, members
      FROM on_call_schedules
      WHERE tenant_id = $1 AND id = $2
    `;
    const result = await this.pool.query(query, [tenantId, scheduleId]);
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
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteOnCallSchedule(tenantId: string, scheduleId: string): Promise<boolean> {
    const query = `
      DELETE FROM on_call_schedules
      WHERE tenant_id = $1 AND id = $2
    `;
    const result = await this.pool.query(query, [tenantId, scheduleId]);
    return result.rowCount > 0;
  }
}

export default OnCallManagementRepository;