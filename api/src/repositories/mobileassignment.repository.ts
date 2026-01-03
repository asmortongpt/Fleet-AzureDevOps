import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export class MobileAssignmentRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createMobileAssignment(
    tenant_id: string,
    user_id: string,
    mobile_id: string,
    assignment_date: Date
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO mobile_assignments (tenant_id, user_id, mobile_id, assignment_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [tenant_id, user_id, mobile_id, assignment_date];
    return this.pool.query(query, values);
  }

  async getMobileAssignmentById(
    tenant_id: string,
    id: string
  ): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at FROM mobile_assignments
      WHERE tenant_id = $1 AND id = $2;
    `;
    const values = [tenant_id, id];
    return this.pool.query(query, values);
  }

  async getAllMobileAssignments(
    tenant_id: string
  ): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at FROM mobile_assignments
      WHERE tenant_id = $1;
    `;
    const values = [tenant_id];
    return this.pool.query(query, values);
  }

  async updateMobileAssignment(
    tenant_id: string,
    id: string,
    user_id: string,
    mobile_id: string,
    assignment_date: Date
  ): Promise<QueryResult> {
    const query = `
      UPDATE mobile_assignments
      SET user_id = $3, mobile_id = $4, assignment_date = $5
      WHERE tenant_id = $1 AND id = $2
      RETURNING *;
    `;
    const values = [tenant_id, id, user_id, mobile_id, assignment_date];
    return this.pool.query(query, values);
  }

  async deleteMobileAssignment(
    tenant_id: string,
    id: string
  ): Promise<QueryResult> {
    const query = `
      DELETE FROM mobile_assignments
      WHERE tenant_id = $1 AND id = $2
      RETURNING *;
    `;
    const values = [tenant_id, id];
    return this.pool.query(query, values);
  }
}