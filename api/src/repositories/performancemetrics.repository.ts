import { BaseRepository } from '../repositories/BaseRepository';

import { Pool } from 'pg';
import { PerformanceMetric } from '../models/PerformanceMetric';

export class PerformanceMetricsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAll(tenantId: string): Promise<PerformanceMetric[]> {
    const query = 'SELECT id, created_at, updated_at FROM performance_metrics WHERE tenant_id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map(row => new PerformanceMetric(row));
  }

  async getById(id: string, tenantId: string): Promise<PerformanceMetric | null> {
    const query = 'SELECT id, created_at, updated_at FROM performance_metrics WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rows.length > 0 ? new PerformanceMetric(result.rows[0]) : null;
  }

  async create(metric: PerformanceMetric): Promise<PerformanceMetric> {
    const query = `
      INSERT INTO performance_metrics (name, value, unit, timestamp, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [metric.name, metric.value, metric.unit, metric.timestamp, metric.tenantId];
    const result = await this.pool.query(query, values);
    return new PerformanceMetric(result.rows[0]);
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
    return result.rows.length > 0 ? new PerformanceMetric(result.rows[0]) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = 'DELETE FROM performance_metrics WHERE id = $1 AND tenant_id = $2';
    const result = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM performancemetrics t
    WHERE t.id = \api/src/repositories/performancemetrics.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM performancemetrics t
    WHERE t.tenant_id = \api/src/repositories/performancemetrics.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
