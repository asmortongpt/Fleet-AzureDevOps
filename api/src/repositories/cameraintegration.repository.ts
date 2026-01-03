import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface CameraIntegration {
  id: number;
  name: string;
  url: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export class CameraIntegrationRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('camera_integrations', pool);
    this.pool = pool;
  }

  async create(tenantId: string, cameraIntegration: Omit<CameraIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<CameraIntegration> {
    const query = `
      INSERT INTO camera_integrations (name, url, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      cameraIntegration.name,
      cameraIntegration.url,
      tenantId
    ];
    const result: QueryResult<CameraIntegration> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getById(tenantId: string, id: number): Promise<CameraIntegration | null> {
    const query = `
      SELECT id, name, url, tenant_id, created_at, updated_at
      FROM camera_integrations
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<CameraIntegration> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async getAll(tenantId: string): Promise<CameraIntegration[]> {
    const query = `
      SELECT id, name, url, tenant_id, created_at, updated_at
      FROM camera_integrations
      WHERE tenant_id = $1
    `;
    const result: QueryResult<CameraIntegration> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: string, id: number, cameraIntegration: Partial<CameraIntegration>): Promise<CameraIntegration | null> {
    const setClause = Object.keys(cameraIntegration)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getById(tenantId, id);
    }

    const query = `UPDATE camera_integrations SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(cameraIntegration)];
    const result: QueryResult<CameraIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM camera_integrations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}