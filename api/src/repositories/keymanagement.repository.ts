import { BaseRepository } from '../repositories/BaseRepository';

Here is a sample TypeScript repository KeyManagementRepository for api/src/routes/key-management.routes.ts. This repository includes parameterized queries, tenant_id, and CRUD operations.


import { KeyManagement } from '../models/key-management.model';
import { Pool } from 'pg';

export class KeyManagementRepository extends BaseRepository<any> {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async createKeyManagement(tenant_id: string, key: string): Promise<KeyManagement> {
        const query = 'INSERT INTO key_management(tenant_id, key) VALUES($1, $2) RETURNING *';
        const values = [tenant_id, key];
        const { rows } = await this.pool.query(query, values);
        return rows[0];
    }

    async getKeyManagement(tenant_id: string): Promise<KeyManagement> {
        const query = 'SELECT id, tenant_id, created_at, updated_at FROM key_management WHERE tenant_id = $1';
        const values = [tenant_id];
        const { rows } = await this.pool.query(query, values);
        return rows[0];
    }

    async updateKeyManagement(tenant_id: string, key: string): Promise<KeyManagement> {
        const query = 'UPDATE key_management SET key = $2 WHERE tenant_id = $1 RETURNING *';
        const values = [tenant_id, key];
        const { rows } = await this.pool.query(query, values);
        return rows[0];
    }

    async deleteKeyManagement(tenant_id: string): Promise<void> {
        const query = 'DELETE FROM key_management WHERE tenant_id = $1';
        const values = [tenant_id];
        await this.pool.query(query, values);
    }
}


This repository assumes that you have a PostgreSQL database and you are using the pg library for Node.js. The KeyManagement model is a TypeScript interface that represents the structure of the data in the key_management table.

Please replace the queries and the table name with your actual SQL queries and table name.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM keymanagement t
    WHERE t.id = \api/src/repositories/keymanagement.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM keymanagement t
    WHERE t.tenant_id = \api/src/repositories/keymanagement.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
