import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


interface Model3D {
  id: number;
  name: string;
  description: string;
  file_path: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: number;
}

export class Model3DRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAllModels(tenantId: number): Promise<Model3D[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM model3ds WHERE tenant_id = $1';
    const result: QueryResult<Model3D> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getModelById(id: number, tenantId: number): Promise<Model3D | null> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM model3ds WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult<Model3D> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createModel(model: Omit<Model3D, 'id' | 'created_at' | 'updated_at'>, tenantId: number): Promise<Model3D> {
    const query = `
      INSERT INTO model3ds (name, description, file_path, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [model.name, model.description, model.file_path, tenantId];
    const result: QueryResult<Model3D> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateModel(id: number, model: Partial<Omit<Model3D, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>>, tenantId: number): Promise<Model3D | null> {
    const setClause = Object.keys(model).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(model);
    values.unshift(id, tenantId);

    const query = `
      UPDATE model3ds
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${values.length}
      RETURNING *
    `;
    const result: QueryResult<Model3D> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteModel(id: number, tenantId: number): Promise<boolean> {
    const query = 'DELETE FROM model3ds WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}