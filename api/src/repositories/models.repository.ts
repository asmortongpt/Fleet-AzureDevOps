import { Pool, QueryResult } from 'pg';

import { BaseRepository } from './base/BaseRepository';

export interface Model {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export class ModelsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('models', pool);
    this.pool = pool;
  }

  // Create a new model
  async createModel(tenantId: number, name: string, description: string): Promise<Model> {
    const query = `
      INSERT INTO models (tenant_id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const values = [tenantId, name, description];
    const result: QueryResult<Model> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a single model by ID
  async getModelById(tenantId: number, modelId: number): Promise<Model | null> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM models
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [modelId, tenantId];
    const result: QueryResult<Model> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Read all models for a tenant
  async getAllModels(tenantId: number): Promise<Model[]> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM models
      WHERE tenant_id = $1
    `;
    const values = [tenantId];
    const result: QueryResult<Model> = await this.pool.query(query, values);
    return result.rows;
  }

  // Update an existing model
  async updateModel(tenantId: number, modelId: number, name: string, description: string): Promise<Model | null> {
    const query = `
      UPDATE models
      SET name = $3, description = $4, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [modelId, tenantId, name, description];
    const result: QueryResult<Model> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a model
  async deleteModel(tenantId: number, modelId: number): Promise<boolean> {
    const query = `
      DELETE FROM models
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [modelId, tenantId];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default ModelsRepository;