import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository named `TollIntegrationRepository` for the `api/src/routes/toll-integration.routes.ts` file, we'll implement parameterized queries, include a `tenant_id` field, and provide CRUD operations. Let's break this down step-by-step:

1. First, we'll define the interface for our TollIntegration model.
2. Then, we'll create the `TollIntegrationRepository` class with CRUD operations.
3. We'll use parameterized queries to prevent SQL injection.
4. We'll include `tenant_id` in all operations to ensure multi-tenant support.

Here's the implementation:


// api/src/repositories/toll-integration.repository.ts

import { Pool, QueryResult } from 'pg';

// Define the TollIntegration interface
interface TollIntegration {
  id: number;
  name: string;
  description: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

// TollIntegrationRepository class
export class TollIntegrationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new toll integration
  async create(tollIntegration: Omit<TollIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<TollIntegration> {
    const query = `
      INSERT INTO toll_integrations (name, description, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const values = [tollIntegration.name, tollIntegration.description, tollIntegration.tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a toll integration by id
  async read(id: number, tenant_id: number): Promise<TollIntegration | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM toll_integrations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a toll integration
  async update(id: number, tollIntegration: Partial<Omit<TollIntegration, 'id' | 'created_at' | 'tenant_id'>>, tenant_id: number): Promise<TollIntegration | null> {
    const setClause = Object.keys(tollIntegration)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const query = `
      UPDATE toll_integrations
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $${Object.keys(tollIntegration).length + 2}
      RETURNING *;
    `;
    const values = [id, ...Object.values(tollIntegration), tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a toll integration
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM toll_integrations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  // List toll integrations for a tenant
  async list(tenant_id: number): Promise<TollIntegration[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM toll_integrations
      WHERE tenant_id = $1
      ORDER BY id;
    `;
    const values = [tenant_id];

    const result: QueryResult<TollIntegration> = await this.pool.query(query, values);
    return result.rows;
  }
}


This implementation includes the following features:

1. **Parameterized Queries**: All SQL queries use parameterized queries to prevent SQL injection attacks.

2. **Tenant ID**: The `tenant_id` is included in all operations to ensure multi-tenant support. It's used as a filter in read, update, and delete operations, and as a required field in create operations.

3. **CRUD Operations**:
   - `create`: Inserts a new toll integration.
   - `read`: Retrieves a toll integration by ID and tenant ID.
   - `update`: Updates an existing toll integration.
   - `delete`: Deletes a toll integration.
   - `list`: Retrieves all toll integrations for a specific tenant.

4. **TypeScript Interfaces**: We've defined a `TollIntegration` interface to ensure type safety throughout the repository.

5. **Date Handling**: The `created_at` and `updated_at` fields are automatically set using `NOW()` in PostgreSQL.

To use this repository in your `toll-integration.routes.ts` file, you would typically create an instance of the `TollIntegrationRepository` and use its methods in your route handlers. For example:


// api/src/routes/toll-integration.routes.ts

import express from 'express';
import { Pool } from 'pg';
import { TollIntegrationRepository } from '../repositories/toll-integration.repository';

const router = express.Router();
const pool = new Pool(/* your database configuration */);
const tollIntegrationRepository = new TollIntegrationRepository(pool);

// Example route for creating a new toll integration
router.post('/', async (req, res) => {
  try {
    const newTollIntegration = await tollIntegrationRepository.create({
      name: req.body.name,
      description: req.body.description,
      tenant_id: req.body.tenant_id
    });
    res.status(201).json(newTollIntegration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create toll integration' });
  }
});

// Add other routes for read, update, delete, and list operations

export default router;


This implementation provides a solid foundation for your Toll Integration API, with proper handling of CRUD operations, multi-tenant support, and security through parameterized queries.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM tollintegration t
    WHERE t.id = \api/src/repositories/tollintegration.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM tollintegration t
    WHERE t.tenant_id = \api/src/repositories/tollintegration.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
