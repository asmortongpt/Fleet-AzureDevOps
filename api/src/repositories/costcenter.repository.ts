import { BaseRepository } from '../repositories/BaseRepository';

Here's a TypeScript repository class `CostCenterRepository` designed to eliminate 10 queries from `api/src/routes/cost-center.routes.ts`. This class uses parameterized queries, includes tenant_id filtering, and implements CRUD methods:


import { Pool, QueryResult } from 'pg';

export class CostCenterRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new cost center
  async createCostCenter(
    tenantId: string,
    name: string,
    code: string,
    description: string
  ): Promise<number> {
    const query = `
      INSERT INTO cost_centers (tenant_id, name, code, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const result: QueryResult = await this.pool.query(query, [
      tenantId,
      name,
      code,
      description,
    ]);
    return result.rows[0].id;
  }

  // Read a cost center by ID
  async getCostCenterById(tenantId: string, id: number): Promise<any> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM cost_centers
      WHERE id = $1 AND tenant_id = $2;
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  // Read all cost centers for a tenant
  async getAllCostCenters(tenantId: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM cost_centers
      WHERE tenant_id = $1;
    `;
    const result: QueryResult = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  // Update a cost center
  async updateCostCenter(
    tenantId: string,
    id: number,
    name: string,
    code: string,
    description: string
  ): Promise<boolean> {
    const query = `
      UPDATE cost_centers
      SET name = $1, code = $2, description = $3
      WHERE id = $4 AND tenant_id = $5;
    `;
    const result: QueryResult = await this.pool.query(query, [
      name,
      code,
      description,
      id,
      tenantId,
    ]);
    return result.rowCount > 0;
  }

  // Delete a cost center
  async deleteCostCenter(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM cost_centers
      WHERE id = $1 AND tenant_id = $2;
    `;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount > 0;
  }
}


This `CostCenterRepository` class provides the following benefits:

1. It uses parameterized queries (`$1`, `$2`, etc.) to prevent SQL injection.
2. All methods include `tenant_id` filtering to ensure multi-tenant isolation.
3. It implements CRUD (Create, Read, Update, Delete) operations for cost centers.
4. The class can be easily instantiated with a PostgreSQL connection pool.
5. Each method returns appropriate data types (number, object, array, boolean) for easy integration with the routes.

To use this repository in your `cost-center.routes.ts` file, you would typically create an instance of the repository and call its methods instead of directly querying the database. This approach will help eliminate the 10 queries by centralizing database operations in the repository class.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM costcenter t
    WHERE t.id = \api/src/repositories/costcenter.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM costcenter t
    WHERE t.tenant_id = \api/src/repositories/costcenter.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
