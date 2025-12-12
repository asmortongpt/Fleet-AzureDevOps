import { BaseRepository } from '../repositories/BaseRepository';

Here's a TypeScript repository class `AdditionalRepository` designed to eliminate 15 queries from `api/src/routes/additional.ts`. The class uses parameterized queries, tenant_id filtering, and includes CRUD methods:


import { PoolClient } from 'pg';

export class AdditionalRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LAdditional_LRepository extends _LBases');
  }

  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  // Create a new additional item
  async createAdditional(tenantId: string, name: string, description: string): Promise<number> {
    const query = `
      INSERT INTO additional (tenant_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const result = await this.client.query(query, [tenantId, name, description]);
    return result.rows[0].id;
  }

  // Read a single additional item by id
  async getAdditionalById(tenantId: string, id: number): Promise<any> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM additional
      WHERE id = $1 AND tenant_id = $2;
    `;
    const result = await this.client.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  // Read all additional items for a tenant
  async getAllAdditionals(tenantId: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM additional
      WHERE tenant_id = $1;
    `;
    const result = await this.client.query(query, [tenantId]);
    return result.rows;
  }

  // Update an existing additional item
  async updateAdditional(tenantId: string, id: number, name: string, description: string): Promise<boolean> {
    const query = `
      UPDATE additional
      SET name = $1, description = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING id;
    `;
    const result = await this.client.query(query, [name, description, id, tenantId]);
    return result.rowCount > 0;
  }

  // Delete an additional item
  async deleteAdditional(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM additional
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const result = await this.client.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}


This `AdditionalRepository` class provides the following benefits:

1. It uses parameterized queries ($1, $2, $3) to prevent SQL injection.
2. It includes tenant_id filtering in all queries to ensure multi-tenant isolation.
3. It implements CRUD (Create, Read, Update, Delete) methods:
   - `createAdditional`: Creates a new additional item
   - `getAdditionalById`: Retrieves a single additional item by id
   - `getAllAdditionals`: Retrieves all additional items for a tenant
   - `updateAdditional`: Updates an existing additional item
   - `deleteAdditional`: Deletes an additional item

By using this repository class, you can replace the 15 queries in `api/src/routes/additional.ts` with these 5 methods, significantly reducing the number of database operations and improving code organization and maintainability.