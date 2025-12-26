import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface BillingIntegration {
  id: number;
  tenant_id: string;
  name: string;
  description: string;
  config: any;
  created_at: Date;
  updated_at: Date;
}

export class BillingIntegrationRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('billing_integrations', pool);
    this.pool = pool;
  }

  async create(tenantId: string, billingIntegration: Omit<BillingIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<BillingIntegration> {
    const query = `
      INSERT INTO billing_integrations (name, description, config, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      billingIntegration.name,
      billingIntegration.description,
      billingIntegration.config,
      tenantId
    ];
    const result: QueryResult<BillingIntegration> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getById(tenantId: string, id: number): Promise<BillingIntegration | null> {
    const query = `
      SELECT id, name, description, config, tenant_id, created_at, updated_at
      FROM billing_integrations
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<BillingIntegration> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async getAll(tenantId: string): Promise<BillingIntegration[]> {
    const query = `
      SELECT id, name, description, config, tenant_id, created_at, updated_at
      FROM billing_integrations
      WHERE tenant_id = $1
    `;
    const result: QueryResult<BillingIntegration> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: string, id: number, billingIntegration: Partial<BillingIntegration>): Promise<BillingIntegration | null> {
    const setClause = Object.keys(billingIntegration)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getById(tenantId, id);
    }

    const query = `UPDATE billing_integrations SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(billingIntegration)];
    const result: QueryResult<BillingIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM billing_integrations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}