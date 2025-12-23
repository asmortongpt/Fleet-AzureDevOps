import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface Tenant {
  id: number;
  name: string;
  domain: string;
  status: string;
  subscription_id: number;
  created_at: Date;
  updated_at: Date;
}

export class MultiTenancyRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('tenants', pool);
    this.pool = pool;
  }

  async findTenantById(id: number): Promise<Tenant | null> {
    const query = `SELECT id, name, domain, status, subscription_id, created_at, updated_at FROM tenants WHERE id = $1`;
    const result: QueryResult<Tenant> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findTenantByDomain(domain: string): Promise<Tenant | null> {
    const query = `SELECT id, name, domain, status, subscription_id, created_at, updated_at FROM tenants WHERE domain = $1`;
    const result: QueryResult<Tenant> = await this.pool.query(query, [domain]);
    return result.rows[0] || null;
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Promise<Tenant> {
    const query = `
      INSERT INTO tenants (name, domain, status, subscription_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [tenant.name, tenant.domain, tenant.status, tenant.subscription_id];
    const result: QueryResult<Tenant> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateTenant(id: number, tenant: Partial<Tenant>): Promise<Tenant | null> {
    const setClause = Object.keys(tenant)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      return this.findTenantById(id);
    }

    const query = `
      UPDATE tenants
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, ...Object.values(tenant)];
    const result: QueryResult<Tenant> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteTenant(id: number): Promise<boolean> {
    const query = `DELETE FROM tenants WHERE id = $1`;
    const result: QueryResult = await this.pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}