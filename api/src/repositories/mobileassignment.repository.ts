import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

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
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM mobileassignment t
    WHERE t.id = \api/src/repositories/mobileassignment.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM mobileassignment t
    WHERE t.tenant_id = \api/src/repositories/mobileassignment.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
