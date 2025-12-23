import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface DtoCompliance {
  id: number;
  dto_id: number;
  compliance_status: string;
  compliance_date: Date;
  notes: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export class DtoComplianceRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('dto_compliance', pool);
    this.pool = pool;
  }

  async create(tenantId: number, dtoCompliance: Omit<DtoCompliance, 'id' | 'created_at' | 'updated_at'>): Promise<DtoCompliance> {
    const query = `
      INSERT INTO dto_compliance (tenant_id, dto_id, compliance_status, compliance_date, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      dtoCompliance.dto_id,
      dtoCompliance.compliance_status,
      dtoCompliance.compliance_date,
      dtoCompliance.notes
    ];
    const result: QueryResult<DtoCompliance> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, id: number): Promise<DtoCompliance | null> {
    const query = `SELECT id, tenant_id, dto_id, compliance_status, compliance_date, notes, created_at, updated_at FROM dto_compliance WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<DtoCompliance> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async list(tenantId: number): Promise<DtoCompliance[]> {
    const query = `SELECT id, tenant_id, dto_id, compliance_status, compliance_date, notes, created_at, updated_at FROM dto_compliance WHERE tenant_id = $1 ORDER BY compliance_date DESC`;
    const result: QueryResult<DtoCompliance> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, dtoCompliance: Partial<DtoCompliance>): Promise<DtoCompliance | null> {
    const setClause = Object.keys(dtoCompliance)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `UPDATE dto_compliance SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(dtoCompliance)];
    const result: QueryResult<DtoCompliance> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM dto_compliance WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}