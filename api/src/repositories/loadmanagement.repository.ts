import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface LoadManagement {
  id: number;
  tenant_id: number;
  data: any;
  created_at: Date;
  updated_at: Date;
}

export class LoadManagementRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('load_management', pool);
    this.pool = pool;
  }

  async create(loadManagement: Omit<LoadManagement, 'id' | 'created_at' | 'updated_at'>, tenant_id: number): Promise<LoadManagement> {
    const query = 'INSERT INTO load_management (tenant_id, data, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *';
    const values = [tenant_id, loadManagement.data];

    const result: QueryResult<LoadManagement> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenant_id: number): Promise<LoadManagement[]> {
    const query = 'SELECT id, tenant_id, data, created_at, updated_at FROM load_management WHERE tenant_id = $1';
    const values = [tenant_id];

    const result: QueryResult<LoadManagement> = await this.pool.query(query, values);
    return result.rows;
  }

  async update(loadManagement: Partial<LoadManagement> & { id: number }, tenant_id: number): Promise<LoadManagement | null> {
    const query = 'UPDATE load_management SET data = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *';
    const values = [loadManagement.data, loadManagement.id, tenant_id];

    const result: QueryResult<LoadManagement> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = 'DELETE FROM load_management WHERE id = $1 AND tenant_id = $2 RETURNING id';
    const values = [id, tenant_id];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}