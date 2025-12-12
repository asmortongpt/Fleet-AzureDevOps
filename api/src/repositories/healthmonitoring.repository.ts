import { BaseRepository } from '../repositories/BaseRepository';

Here is an example of a TypeScript repository for health monitoring with parameterized queries, tenant_id, and CRUD operations:


import { HealthMonitoring } from '../models/health-monitoring.model';
import { Pool } from 'pg';

export class HealthMonitoringRepository extends BaseRepository<any> {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    public async create(healthMonitoring: HealthMonitoring, tenant_id: string): Promise<HealthMonitoring> {
        const result = await this.pool.query(
            'INSERT INTO health_monitoring (tenant_id, status, timestamp) VALUES ($1, $2, $3) RETURNING *',
            [tenant_id, healthMonitoring.status, healthMonitoring.timestamp]
        );

        return result.rows[0];
    }

    public async read(tenant_id: string): Promise<HealthMonitoring[]> {
        const result = await this.pool.query(
            'SELECT id, tenant_id, created_at, updated_at FROM health_monitoring WHERE tenant_id = $1',
            [tenant_id]
        );

        return result.rows;
    }

    public async update(healthMonitoring: HealthMonitoring, tenant_id: string): Promise<HealthMonitoring> {
        const result = await this.pool.query(
            'UPDATE health_monitoring SET status = $1, timestamp = $2 WHERE tenant_id = $3 RETURNING *',
            [healthMonitoring.status, healthMonitoring.timestamp, tenant_id]
        );

        return result.rows[0];
    }

    public async delete(tenant_id: string): Promise<void> {
        await this.pool.query(
            'DELETE FROM health_monitoring WHERE tenant_id = $1',
            [tenant_id]
        );
    }
}


This repository uses the `pg` package to interact with a PostgreSQL database. It assumes that you have a `health_monitoring` table in your database with `tenant_id`, `status`, and `timestamp` columns. The `tenant_id` is used to perform operations on data that belongs to a specific tenant.

Please adjust the code according to your database schema and the package you are using to interact with your database.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM healthmonitoring t
    WHERE t.id = \api/src/repositories/healthmonitoring.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM healthmonitoring t
    WHERE t.tenant_id = \api/src/repositories/healthmonitoring.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
