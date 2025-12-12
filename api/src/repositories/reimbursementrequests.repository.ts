import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

interface ReimbursementRequest {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class ReimbursementRequestsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAll(tenantId: number): Promise<ReimbursementRequest[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM reimbursement_requests WHERE tenant_id = $1';
    const result: QueryResult<ReimbursementRequest> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getById(id: number, tenantId: number): Promise<ReimbursementRequest | null> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM reimbursement_requests WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult<ReimbursementRequest> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(request: Omit<ReimbursementRequest, 'id' | 'created_at' | 'updated_at'>, tenantId: number): Promise<ReimbursementRequest> {
    const query = `
      INSERT INTO reimbursement_requests (user_id, amount, description, status, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [request.user_id, request.amount, request.description, request.status, tenantId];
    const result: QueryResult<ReimbursementRequest> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, request: Partial<Omit<ReimbursementRequest, 'id' | 'created_at' | 'updated_at'>>, tenantId: number): Promise<ReimbursementRequest | null> {
    const setClause = Object.keys(request).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const query = `
      UPDATE reimbursement_requests
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(request).length + 2}
      RETURNING *
    `;
    const values = [id, ...Object.values(request), tenantId];
    const result: QueryResult<ReimbursementRequest> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = 'DELETE FROM reimbursement_requests WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}