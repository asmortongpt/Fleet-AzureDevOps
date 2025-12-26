import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface DispatchBoardItem {
  id: number;
  title: string;
  description: string;
  status: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export class DispatchBoardRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('dispatch_board', pool);
    this.pool = pool;
  }

  async create(tenantId: number, item: Omit<DispatchBoardItem, 'id' | 'created_at' | 'updated_at'>): Promise<DispatchBoardItem> {
    const query = `
      INSERT INTO dispatch_board (tenant_id, title, description, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      item.title,
      item.description,
      item.status
    ];
    const result: QueryResult<DispatchBoardItem> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, id: number): Promise<DispatchBoardItem | null> {
    const query = `SELECT id, tenant_id, title, description, status, created_at, updated_at FROM dispatch_board WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<DispatchBoardItem> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async list(tenantId: number): Promise<DispatchBoardItem[]> {
    const query = `SELECT id, tenant_id, title, description, status, created_at, updated_at FROM dispatch_board WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<DispatchBoardItem> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, item: Partial<DispatchBoardItem>): Promise<DispatchBoardItem | null> {
    const setClause = Object.keys(item)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `UPDATE dispatch_board SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(item)];
    const result: QueryResult<DispatchBoardItem> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM dispatch_board WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}