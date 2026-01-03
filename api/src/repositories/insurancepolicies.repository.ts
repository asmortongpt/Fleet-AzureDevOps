
import { Pool } from 'pg';

import { InsurancePolicy } from '../models/insurance-policy.model';
import { BaseRepository } from '../repositories/BaseRepository';

export class InsurancePoliciesRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAll(tenantId: string): Promise<InsurancePolicy[]> {
    const query = `
      SELECT id, name, created_at, updated_at, tenant_id 
      FROM insurance_policies 
      WHERE tenant_id = $1
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getById(tenantId: string, id: string): Promise<InsurancePolicy | null> {
    const query = `
      SELECT id, name, created_at, updated_at, tenant_id 
      FROM insurance_policies 
      WHERE tenant_id = $1 AND id = $2
    `;
    const result = await this.pool.query(query, [tenantId, id]);
    return result.rows[0] || null;
  }

  async create(tenantId: string, policy: InsurancePolicy): Promise<InsurancePolicy> {
    const query = `
      INSERT INTO insurance_policies (tenant_id, policy_number, coverage_amount, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      tenantId,
      policy.policy_number,
      policy.coverage_amount,
      policy.start_date,
      policy.end_date,
      policy.status
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(tenantId: string, id: string, policy: InsurancePolicy): Promise<InsurancePolicy | null> {
    const query = `
      UPDATE insurance_policies 
      SET policy_number = $1, coverage_amount = $2, start_date = $3, end_date = $4, status = $5
      WHERE tenant_id = $6 AND id = $7
      RETURNING *
    `;
    const values = [
      policy.policy_number,
      policy.coverage_amount,
      policy.start_date,
      policy.end_date,
      policy.status,
      tenantId,
      id
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const query = `
      DELETE FROM insurance_policies 
      WHERE tenant_id = $1 AND id = $2
    `;
    const result = await this.pool.query(query, [tenantId, id]);
    return result.rowCount > 0;
  }
}