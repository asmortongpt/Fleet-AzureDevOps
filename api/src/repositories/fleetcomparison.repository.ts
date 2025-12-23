import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface FleetComparison {
    id: number;
    tenant_id: number;
    comparison_name: string;
    comparison_criteria: any;
    comparison_results: any;
    created_at: Date;
    updated_at: Date;
}

export class FleetComparisonRepository extends BaseRepository<any> {

    private pool: Pool;

    constructor(pool: Pool) {
        super('fleet_comparison', pool);
        this.pool = pool;
    }

    async create(tenantId: number, fleetComparison: Omit<FleetComparison, 'id' | 'created_at' | 'updated_at'>): Promise<FleetComparison> {
        const query = `
      INSERT INTO fleet_comparison (tenant_id, comparison_name, comparison_criteria, comparison_results, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
        const values = [
            tenantId,
            fleetComparison.comparison_name,
            fleetComparison.comparison_criteria,
            fleetComparison.comparison_results
        ];
        const result: QueryResult<FleetComparison> = await this.pool.query(query, values);
        return result.rows[0];
    }

    async read(tenantId: number): Promise<FleetComparison[]> {
        const query = `SELECT id, tenant_id, comparison_name, comparison_criteria, comparison_results, created_at, updated_at FROM fleet_comparison WHERE tenant_id = $1 ORDER BY created_at DESC`;
        const result: QueryResult<FleetComparison> = await this.pool.query(query, [tenantId]);
        return result.rows;
    }

    async update(tenantId: number, id: number, fleetComparison: Partial<FleetComparison>): Promise<FleetComparison | null> {
        const setClause = Object.keys(fleetComparison)
            .map((key, index) => `${key} = $${index + 3}`)
            .join(', ');

        if (!setClause) {
            return null;
        }

        const query = `UPDATE fleet_comparison SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`;
        const values = [tenantId, id, ...Object.values(fleetComparison)];
        const result: QueryResult<FleetComparison> = await this.pool.query(query, values);
        return result.rows[0] || null;
    }

    async delete(tenantId: number, id: number): Promise<boolean> {
        const query = `DELETE FROM fleet_comparison WHERE tenant_id = $1 AND id = $2 RETURNING id`;
        const result: QueryResult = await this.pool.query(query, [tenantId, id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }
}