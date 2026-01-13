
import { Pool } from 'pg';

import { PerformanceMetric } from '../models/PerformanceMetric';

import { BaseRepository } from './base/BaseRepository';

export class PerformanceMetricsRepository extends BaseRepository<any> {

  constructor(pool: Pool) {
    super(pool, 'performance_metrics');
  }

  async getAll(tenantId: string): Promise<PerformanceMetric[]> {
    const query = 'SELECT id, created_at, updated_at FROM performance_metrics WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows as PerformanceMetric[];
  }

  async getById(id: string, tenantId: string): Promise<PerformanceMetric | null> {
    const query = 'SELECT id, created_at, updated_at FROM performance_metrics WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows.length > 0 ? (result.rows[0] as PerformanceMetric) : null;
  }

  async create(metric: PerformanceMetric): Promise<PerformanceMetric> {
    const query = `
      INSERT INTO performance_metrics (name, value, unit, timestamp, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [metric.name, metric.value, metric.unit, metric.timestamp, metric.tenantId];
    const result = await this.pool.query(query, values);
    return result.rows[0] as PerformanceMetric;
  }

  async update(id: string, metric: PerformanceMetric): Promise<PerformanceMetric | null> {
    const query = `
      UPDATE performance_metrics
      SET name = $1, value = $2, unit = $3, timestamp = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING *
    `;
    const values = [metric.name, metric.value, metric.unit, metric.timestamp, id, metric.tenantId];
    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? (result.rows[0] as PerformanceMetric) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM performance_metrics WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return (result.rowCount ?? 0) > 0;
  }
}