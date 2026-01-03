import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

interface Shift {
  id: number;
  start_time: Date;
  end_time: Date;
  employee_id: number;
  tenant_id: number;
}

export class ShiftManagementRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('shifts', pool);
    this.pool = pool;
  }

  // Create a new shift
  async createShift(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const query = `
      INSERT INTO shifts (start_time, end_time, employee_id, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [shift.start_time, shift.end_time, shift.employee_id, shift.tenant_id];
    const result: QueryResult<Shift> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read all shifts for a tenant
  async getAllShifts(tenant_id: number): Promise<Shift[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM shifts
      WHERE tenant_id = $1
      ORDER BY start_time
    `;
    const result: QueryResult<Shift> = await this.pool.query(query, [tenant_id]);
    return result.rows;
  }

  // Read a specific shift by id and tenant
  async getShiftById(id: number, tenant_id: number): Promise<Shift | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM shifts
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<Shift> = await this.pool.query(query, [id, tenant_id]);
    return result.rows[0] || null;
  }

  // Update a shift
  async updateShift(id: number, shift: Partial<Shift>, tenant_id: number): Promise<Shift | null> {
    const setClause = Object.keys(shift)
      .filter(key => key !== 'id' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE shifts
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(shift).length + 2}
      RETURNING *
    `;

    const values = [id, ...Object.values(shift), tenant_id];
    const result: QueryResult<Shift> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a shift
  async deleteShift(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM shifts
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult<{ id: number }> = await this.pool.query(query, [id, tenant_id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}