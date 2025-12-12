import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';
import { ReplacementPlanning } from '../models/replacement-planning.model';

export class ReplacementPlanningRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAll(tenantId: string): Promise<ReplacementPlanning[]> {
    const query = 'SELECT id, created_at, updated_at FROM replacement_planning WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map(row => new ReplacementPlanning(row));
  }

  async getById(id: string, tenantId: string): Promise<ReplacementPlanning | null> {
    const query = 'SELECT id, created_at, updated_at FROM replacement_planning WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows.length > 0 ? new ReplacementPlanning(result.rows[0]) : null;
  }

  async create(replacementPlanning: ReplacementPlanning): Promise<ReplacementPlanning> {
    const query = `
      INSERT INTO replacement_planning (employee_id, replacement_employee_id, start_date, end_date, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      replacementPlanning.employeeId,
      replacementPlanning.replacementEmployeeId,
      replacementPlanning.startDate,
      replacementPlanning.endDate,
      replacementPlanning.tenantId
    ];
    const result = await this.pool.query(query, values);
    return new ReplacementPlanning(result.rows[0]);
  }

  async update(id: string, replacementPlanning: ReplacementPlanning): Promise<ReplacementPlanning | null> {
    const query = `
      UPDATE replacement_planning
      SET employee_id = $1, replacement_employee_id = $2, start_date = $3, end_date = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING *
    `;
    const values = [
      replacementPlanning.employeeId,
      replacementPlanning.replacementEmployeeId,
      replacementPlanning.startDate,
      replacementPlanning.endDate,
      id,
      replacementPlanning.tenantId
    ];
    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? new ReplacementPlanning(result.rows[0]) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM replacement_planning WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}