import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface FraudDetection {
  id: number;
  tenant_id: number;
  entity_type: string;
  entity_id: number;
  risk_score: number;
  reasons: string[];
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class FraudDetectionRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('fraud_detection', pool);
    this.pool = pool;
  }

  async create(tenantId: number, data: Omit<FraudDetection, 'id' | 'created_at' | 'updated_at'>): Promise<FraudDetection> {
    const query = `
      INSERT INTO fraud_detection (tenant_id, entity_type, entity_id, risk_score, reasons, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      data.entity_type,
      data.entity_id,
      data.risk_score,
      JSON.stringify(data.reasons),
      data.status
    ];
    const result: QueryResult<FraudDetection> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: number, tenantId: number): Promise<FraudDetection | null> {
    const query = `SELECT id, tenant_id, entity_type, entity_id, risk_score, reasons, status, created_at, updated_at FROM fraud_detection WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<FraudDetection> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async update(id: number, tenantId: number, data: Partial<FraudDetection>): Promise<FraudDetection | null> {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.findById(id, tenantId);
    }

    // Handle array serialization if reasons is updated
    const values = [id, tenantId];
    for (const key of Object.keys(data)) {
      let val = (data as any)[key];
      if (key === 'reasons' && Array.isArray(val)) {
        val = JSON.stringify(val);
      }
      values.push(val);
    }

    const query = `UPDATE fraud_detection SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const result: QueryResult<FraudDetection> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `DELETE FROM fraud_detection WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async findByTenantId(tenantId: number): Promise<FraudDetection[]> {
    const query = `SELECT id, tenant_id, entity_type, entity_id, risk_score, reasons, status, created_at, updated_at FROM fraud_detection WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<FraudDetection> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }
}