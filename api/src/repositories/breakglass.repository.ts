import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class BreakGlassRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LBreak_LGlass_s');
  }


    this.pool = pool;
  }

  async createBreakGlass(
    tenant_id: string,
    user_id: string,
    reason: string,
    start_time: Date,
    end_time: Date
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO break_glass (tenant_id, user_id, reason, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [tenant_id, user_id, reason, start_time, end_time];
    return this.query(query, values);
  }

  async getBreakGlassById(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM break_glass
      WHERE tenant_id = $1 AND id = $2
    `;
    const values = [tenant_id, id];
    return this.query(query, values);
  }

  async getAllBreakGlass(tenant_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM break_glass
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    return this.query(query, values);
  }

  async updateBreakGlass(
    tenant_id: string,
    id: string,
    user_id: string,
    reason: string,
    start_time: Date,
    end_time: Date
  ): Promise<QueryResult> {
    const query = `
      UPDATE break_glass
      SET user_id = $3, reason = $4, start_time = $5, end_time = $6
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    const values = [tenant_id, id, user_id, reason, start_time, end_time];
    return this.query(query, values);
  }

  async deleteBreakGlass(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM break_glass
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    const values = [tenant_id, id];
    return this.query(query, values);
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
