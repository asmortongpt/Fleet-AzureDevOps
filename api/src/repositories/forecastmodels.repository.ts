import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface ForecastModel {
  id: number;
  tenant_id: number;
  model_name: string;
  model_type: string;
  parameters: any;
  accuracy: number;
  created_at: Date;
  updated_at: Date;
}

export class ForecastModelsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('forecast_models', pool);
    this.pool = pool;
  }

  async create(tenantId: number, forecastModel: Omit<ForecastModel, 'id' | 'created_at' | 'updated_at'>): Promise<ForecastModel> {
    const query = `
      INSERT INTO forecast_models (tenant_id, model_name, model_type, parameters, accuracy, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      forecastModel.model_name,
      forecastModel.model_type,
      forecastModel.parameters,
      forecastModel.accuracy
    ];
    const result: QueryResult<ForecastModel> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, modelName: string): Promise<ForecastModel | null> {
    const query = `SELECT id, tenant_id, model_name, model_type, parameters, accuracy, created_at, updated_at FROM forecast_models WHERE tenant_id = $1 AND model_name = $2`;
    const result: QueryResult<ForecastModel> = await this.pool.query(query, [tenantId, modelName]);
    return result.rows[0] || null;
  }

  async update(tenantId: number, id: number, forecastModel: Partial<ForecastModel>): Promise<ForecastModel | null> {
    const setClause = Object.keys(forecastModel)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `UPDATE forecast_models SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(forecastModel)];
    const result: QueryResult<ForecastModel> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, modelName: string): Promise<boolean> {
    const query = `DELETE FROM forecast_models WHERE tenant_id = $1 AND model_name = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [tenantId, modelName]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAll(tenantId: number): Promise<ForecastModel[]> {
    const query = `SELECT id, tenant_id, model_name, model_type, parameters, accuracy, created_at, updated_at FROM forecast_models WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<ForecastModel> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }
}