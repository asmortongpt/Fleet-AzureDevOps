import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface Depreciation {
  id: number;
  asset_id: number;
  depreciation_date: Date;
  depreciation_amount: number;
  tenant_id: number;
}

export class DepreciationRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('depreciations', pool);
    this.pool = pool;
  }

  async create(tenantId: number, depreciation: Omit<Depreciation, 'id'>): Promise<Depreciation> {
    const query = `
      INSERT INTO depreciations (asset_id, depreciation_date, depreciation_amount, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      depreciation.asset_id,
      depreciation.depreciation_date,
      depreciation.depreciation_amount,
      tenantId
    ];
    const result: QueryResult<Depreciation> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, id: number): Promise<Depreciation | null> {
    const query = `SELECT id, asset_id, depreciation_date, depreciation_amount, tenant_id FROM depreciations WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<Depreciation> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async list(tenantId: number): Promise<Depreciation[]> {
    const query = `SELECT id, asset_id, depreciation_date, depreciation_amount, tenant_id FROM depreciations WHERE tenant_id = $1 ORDER BY depreciation_date DESC`;
    const result: QueryResult<Depreciation> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, depreciation: Partial<Depreciation>): Promise<Depreciation | null> {
    const setClause = Object.keys(depreciation)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `UPDATE depreciations SET ${setClause} WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(depreciation)];
    const result: QueryResult<Depreciation> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM depreciations WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}