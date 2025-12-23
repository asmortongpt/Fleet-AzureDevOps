import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

// Define the TollIntegration interface
interface TollIntegration {
  id: number;
  name: string;
  description: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

// TollIntegrationRepository class
export class TollIntegrationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('toll_integrations', pool);
    this.pool = pool;
  }

  // Create a new toll integration
  async create(tollIntegration: Omit<TollIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<TollIntegration> {
    const query = `
      INSERT INTO toll_integrations (name, description, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const values = [tollIntegration.name, tollIntegration.description, tollIntegration.tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a toll integration by id
  async read(id: number, tenant_id: number): Promise<TollIntegration | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM toll_integrations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a toll integration
  async update(id: number, tollIntegration: Partial<Omit<TollIntegration, 'id' | 'created_at' | 'tenant_id'>>, tenant_id: number): Promise<TollIntegration | null> {
    const setClause = Object.keys(tollIntegration)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const query = `
      UPDATE toll_integrations
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $${Object.keys(tollIntegration).length + 2}
      RETURNING *;
    `;
    const values = [id, ...Object.values(tollIntegration), tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a toll integration
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM toll_integrations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // List toll integrations for a tenant
  async list(tenant_id: number): Promise<TollIntegration[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM toll_integrations
      WHERE tenant_id = $1
      ORDER BY id;
    `;
    const values = [tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows;
  }
}