import { BaseRepository } from '../repositories/BaseRepository';

Here is a basic example of a FleetComparisonRepository in TypeScript. This repository is designed to interact with a database to perform CRUD operations on a fleet comparison data. It uses parameterized queries to ensure that the application is secure from SQL injection attacks.


import { Pool } from 'pg';
import { FleetComparison } from '../models/fleet-comparison.model';

export class FleetComparisonRepository extends BaseRepository<any> {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(fleetComparison: FleetComparison, tenant_id: string): Promise<void> {
        const query = 'INSERT INTO fleet_comparison (id, name, tenant_id) VALUES ($1, $2, $3)';
        const values = [fleetComparison.id, fleetComparison.name, tenant_id];
        await this.pool.query(query, values);
    }

    async read(tenant_id: string): Promise<FleetComparison[]> {
        const query = 'SELECT id, tenant_id, created_at, updated_at FROM fleet_comparison WHERE tenant_id = $1';
        const values = [tenant_id];
        const { rows } = await this.pool.query(query, values);
        return rows as FleetComparison[];
    }

    async update(fleetComparison: FleetComparison, tenant_id: string): Promise<void> {
        const query = 'UPDATE fleet_comparison SET name = $1 WHERE id = $2 AND tenant_id = $3';
        const values = [fleetComparison.name, fleetComparison.id, tenant_id];
        await this.pool.query(query, values);
    }

    async delete(id: string, tenant_id: string): Promise<void> {
        const query = 'DELETE FROM fleet_comparison WHERE id = $1 AND tenant_id = $2';
        const values = [id, tenant_id];
        await this.pool.query(query, values);
    }
}


This repository assumes that you have a `Pool` object from the `pg` package (a PostgreSQL client for Node.js) and a `FleetComparison` model. The `FleetComparison` model is not defined in this example, but it should be an interface or a class that represents the data structure of a fleet comparison.

Please adjust the SQL queries and the model according to your actual database schema.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fleetcomparison t
    WHERE t.id = \api/src/repositories/fleetcomparison.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM fleetcomparison t
    WHERE t.tenant_id = \api/src/repositories/fleetcomparison.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
