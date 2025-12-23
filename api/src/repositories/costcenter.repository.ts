import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface CostCenter {
  id: number;
  tenant_id: string;
  name: string;
  code: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export class CostCenterRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('cost_centers', pool);
    this.pool = pool;
  }

  async createCostCenter(
    tenantId: string,
    name: string,
    code: string,
    description: string
  ): Promise<CostCenter> {
    const query = `
      INSERT INTO cost_centers (tenant_id, name, code, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *;
    `;
    const result: QueryResult<CostCenter> = await this.pool.query(query, [
      tenantId,
      name,
      code,
      description,
    ]);
    return result.rows[0];
  }

  async getCostCenterById(tenantId: string, id: number): Promise<CostCenter | null> {
    const query = `
      SELECT id, tenant_id, name, code, description, created_at, updated_at FROM cost_centers
      WHERE id = $1 AND tenant_id = $2;
    `;
    const result: QueryResult<CostCenter> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async getAllCostCenters(tenantId: string): Promise<CostCenter[]> {
    const query = `
      SELECT id, tenant_id, name, code, description, created_at, updated_at FROM cost_centers
      WHERE tenant_id = $1;
    `;
    const result: QueryResult<CostCenter> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async updateCostCenter(
    tenantId: string,
    id: number,
    name: string,
    code: string,
    description: string
  ): Promise<CostCenter | null> {
    const query = `
      UPDATE cost_centers
      SET name = $1, code = $2, description = $3, updated_at = NOW()
      WHERE id = $4 AND tenant_id = $5
      RETURNING *;
    `;
    const result: QueryResult<CostCenter> = await this.pool.query(query, [
      name,
      code,
      description,
      id,
      tenantId,
    ]);
    return result.rows[0] || null;
  }

  async deleteCostCenter(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM cost_centers
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}