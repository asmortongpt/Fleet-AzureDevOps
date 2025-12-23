import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface EldIntegration {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  configuration: object;
  created_at: Date;
  updated_at: Date;
}

export class EldIntegrationRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('eld_integrations', pool);
    this.pool = pool;
  }

  async create(tenantId: number, eldIntegration: Omit<EldIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<EldIntegration> {
    const query = `
      INSERT INTO eld_integrations (tenant_id, name, description, configuration, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      eldIntegration.name,
      eldIntegration.description,
      eldIntegration.configuration
    ];
    const result: QueryResult<EldIntegration> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, id: number): Promise<EldIntegration | null> {
    const query = `SELECT id, tenant_id, name, description, configuration, created_at, updated_at FROM eld_integrations WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<EldIntegration> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async readAll(tenantId: number): Promise<EldIntegration[]> {
    const query = `SELECT id, tenant_id, name, description, configuration, created_at, updated_at FROM eld_integrations WHERE tenant_id = $1 ORDER BY name ASC`;
    const result: QueryResult<EldIntegration> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, eldIntegration: Partial<EldIntegration>): Promise<EldIntegration | null> {
    const setClause = Object.keys(eldIntegration)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `UPDATE eld_integrations SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(eldIntegration)];
    const result: QueryResult<EldIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM eld_integrations WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}