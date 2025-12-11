import { BaseRepository } from '../repositories/BaseRepository';

Here is a basic example of a TypeScript repository for forecast models. This repository includes methods for creating, reading, updating, and deleting forecast models. It also includes a method for getting all forecast models for a specific tenant.


import { Pool } from 'pg';
import { ForecastModel } from '../models/forecast-model';

export class ForecastModelsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(tenant_id: string, forecastModel: ForecastModel): Promise<void> {
    const query = 'INSERT INTO forecast_models (tenant_id, model_name, model_data) VALUES ($1, $2, $3)';
    await this.pool.query(query, [tenant_id, forecastModel.name, forecastModel.data]);
  }

  async read(tenant_id: string, modelName: string): Promise<ForecastModel | null> {
    const query = 'SELECT id, created_at, updated_at FROM forecast_models WHERE tenant_id = $1 AND model_name = $2';
    const result = await this.pool.query(query, [tenant_id, modelName]);

    if (result.rowCount > 0) {
      return result.rows[0] as ForecastModel;
    } else {
      return null;
    }
  }

  async update(tenant_id: string, forecastModel: ForecastModel): Promise<void> {
    const query = 'UPDATE forecast_models SET model_data = $1 WHERE tenant_id = $2 AND model_name = $3';
    await this.pool.query(query, [forecastModel.data, tenant_id, forecastModel.name]);
  }

  async delete(tenant_id: string, modelName: string): Promise<void> {
    const query = 'DELETE FROM forecast_models WHERE tenant_id = $1 AND model_name = $2';
    await this.pool.query(query, [tenant_id, modelName]);
  }

  async getAll(tenant_id: string): Promise<ForecastModel[]> {
    const query = 'SELECT id, created_at, updated_at FROM forecast_models WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenant_id]);

    return result.rows as ForecastModel[];
  }
}


Please note that this is a very basic example and does not include any error handling or input validation. You should add these in a real-world application. Also, the structure and types of the `ForecastModel` object and the database schema are assumed for this example. You should replace them with your actual model and schema.