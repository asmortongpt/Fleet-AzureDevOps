import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface Additional {
  id: number;
  tenant_id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export class AdditionalRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('additional', pool);
    this.pool = pool;
  }

  async createAdditional(tenantId: string, name: string, description: string): Promise<Additional> {
    const query = `
      INSERT INTO additional (tenant_id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const values = [tenantId, name, description];
    const result: QueryResult<Additional> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAdditionalById(tenantId: string, id: number): Promise<Additional | null> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM additional
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<Additional> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async getAllAdditionals(tenantId: string): Promise<Additional[]> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM additional
      WHERE tenant_id = $1
    `;
    const result: QueryResult<Additional> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async updateAdditional(tenantId: string, id: number, name: string, description: string): Promise<Additional | null> {
    const query = `
      UPDATE additional
      SET name = $1, description = $2, updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `;
    const result: QueryResult<Additional> = await this.pool.query(query, [name, description, id, tenantId]);
    return result.rows[0] || null;
  }

  async deleteAdditional(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM additional
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}