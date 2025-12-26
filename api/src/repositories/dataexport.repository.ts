import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface DataExport {
  id: number;
  tenant_id: string;
  name: string;
  file_path: string;
  created_at: Date;
  updated_at: Date;
}

export class DataExportRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('data_exports', pool);
    this.pool = pool;
  }

  async create(tenantId: number, dataExport: Omit<DataExport, 'id' | 'created_at' | 'updated_at'>): Promise<DataExport> {
    const query = `
      INSERT INTO data_exports (tenant_id, name, file_path, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      dataExport.tenant_id,
      dataExport.name,
      dataExport.file_path
    ];
    const result: QueryResult<DataExport> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: string, id: number): Promise<DataExport | null> {
    const query = `SELECT id, tenant_id, name, file_path, created_at, updated_at FROM data_exports WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<DataExport> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async update(tenantId: string, id: number, dataExport: Partial<DataExport>): Promise<DataExport | null> {
    const setClause = Object.keys(dataExport)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `UPDATE data_exports SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(dataExport)];
    const result: QueryResult<DataExport> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `DELETE FROM data_exports WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async list(tenantId: string): Promise<DataExport[]> {
    const query = `SELECT id, tenant_id, name, file_path, created_at, updated_at FROM data_exports WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<DataExport> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }
}