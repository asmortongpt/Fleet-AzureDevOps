import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface HealthMonitoring {
    id: number;
    tenant_id: number;
    component: string;
    status: string;
    latency_ms: number;
    error_message?: string;
    created_at: Date;
    updated_at: Date;
}

export class HealthMonitoringRepository extends BaseRepository<any> {

    private pool: Pool;

    constructor(pool: Pool) {
        super('health_monitoring', pool);
        this.pool = pool;
    }

    async create(tenantId: number, healthMonitoring: Omit<HealthMonitoring, 'id' | 'created_at' | 'updated_at'>): Promise<HealthMonitoring> {
        const query = `
      INSERT INTO health_monitoring (tenant_id, component, status, latency_ms, error_message, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
        const values = [
            tenantId,
            healthMonitoring.component,
            healthMonitoring.status,
            healthMonitoring.latency_ms,
            healthMonitoring.error_message
        ];
        const result: QueryResult<HealthMonitoring> = await this.pool.query(query, values);
        return result.rows[0];
    }

    async read(tenantId: number): Promise<HealthMonitoring[]> {
        const query = `SELECT id, tenant_id, component, status, latency_ms, error_message, created_at, updated_at FROM health_monitoring WHERE tenant_id = $1 ORDER BY created_at DESC`;
        const result: QueryResult<HealthMonitoring> = await this.pool.query(query, [tenantId]);
        return result.rows;
    }

    async update(tenantId: number, id: number, healthMonitoring: Partial<HealthMonitoring>): Promise<HealthMonitoring | null> {
        const setClause = Object.keys(healthMonitoring)
            .map((key, index) => `${key} = $${index + 3}`)
            .join(', ');

        if (!setClause) {
            return null;
        }

        const query = `UPDATE health_monitoring SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`;
        const values = [tenantId, id, ...Object.values(healthMonitoring)];
        const result: QueryResult<HealthMonitoring> = await this.pool.query(query, values);
        return result.rows[0] || null;
    }

    async delete(tenantId: number, id: number): Promise<boolean> {
        const query = `DELETE FROM health_monitoring WHERE tenant_id = $1 AND id = $2 RETURNING id`;
        const result: QueryResult = await this.pool.query(query, [tenantId, id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }
}