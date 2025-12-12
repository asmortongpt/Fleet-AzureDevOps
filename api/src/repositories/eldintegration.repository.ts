import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository named `EldIntegrationRepository` for the file `api/src/routes/eld-integration.routes.ts`, we'll implement parameterized queries, include a `tenant_id` in the operations, and provide CRUD functionality. Let's break this down step-by-step:

1. First, we'll define the interface for our ELD integration data.
2. Then, we'll create the `EldIntegrationRepository` class with CRUD methods.
3. We'll use parameterized queries to prevent SQL injection.
4. We'll include `tenant_id` in all operations to ensure multi-tenant support.

Here's the implementation:


// api/src/repositories/eld-integration.repository.ts

import { Pool, QueryResult } from 'pg';

interface EldIntegration {
  id: number;
  name: string;
  description: string;
  configuration: object;
  created_at: Date;
  updated_at: Date;
  tenant_id: number;
}

export class EldIntegrationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new ELD integration
  async create(eldIntegration: Omit<EldIntegration, 'id' | 'created_at' | 'updated_at'>, tenantId: number): Promise<EldIntegration> {
    const query = `
      INSERT INTO eld_integrations (name, description, configuration, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, configuration, created_at, updated_at, tenant_id
    `;
    const values = [eldIntegration.name, eldIntegration.description, eldIntegration.configuration, tenantId];

    const result: QueryResult<EldIntegration> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a single ELD integration by ID
  async read(id: number, tenantId: number): Promise<EldIntegration | null> {
    const query = `
      SELECT id, name, description, configuration, created_at, updated_at, tenant_id
      FROM eld_integrations
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];

    const result: QueryResult<EldIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Read all ELD integrations for a tenant
  async readAll(tenantId: number): Promise<EldIntegration[]> {
    const query = `
      SELECT id, name, description, configuration, created_at, updated_at, tenant_id
      FROM eld_integrations
      WHERE tenant_id = $1
    `;
    const values = [tenantId];

    const result: QueryResult<EldIntegration> = await this.pool.query(query, values);
    return result.rows;
  }

  // Update an existing ELD integration
  async update(id: number, eldIntegration: Partial<Omit<EldIntegration, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>>, tenantId: number): Promise<EldIntegration | null> {
    const { fields: setClause, values: updateValues } = buildUpdateClause(eldIntegration, 2, 'generic_table');
    const values = [id, ...updateValues, tenantId];

    const query = `
      UPDATE eld_integrations
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${values.length}
      RETURNING id, name, description, configuration, created_at, updated_at, tenant_id
    `;

    const result: QueryResult<EldIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete an ELD integration
  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      DELETE FROM eld_integrations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This implementation includes the following features:

1. **Parameterized Queries**: All SQL queries use parameterized queries to prevent SQL injection attacks.

2. **Tenant ID**: The `tenant_id` is included in all operations to ensure multi-tenant support. It's passed as a separate parameter to each method.

3. **CRUD Operations**:
   - `create`: Creates a new ELD integration for a specific tenant.
   - `read`: Retrieves a single ELD integration by ID for a specific tenant.
   - `readAll`: Retrieves all ELD integrations for a specific tenant.
   - `update`: Updates an existing ELD integration for a specific tenant.
   - `delete`: Deletes an ELD integration for a specific tenant.

4. **TypeScript Interfaces**: We define an `EldIntegration` interface to ensure type safety throughout the repository.

5. **Error Handling**: The implementation doesn't include explicit error handling, but you can add try-catch blocks around the database operations to handle and propagate errors as needed.

To use this repository in your `eld-integration.routes.ts` file, you would typically import it and create an instance with a database connection pool. Here's a brief example of how you might use it in your routes:


// api/src/routes/eld-integration.routes.ts

import { Router } from 'express';
import { Pool } from 'pg';
import { EldIntegrationRepository } from '../repositories/eld-integration.repository';
import { buildUpdateClause } from '../utils/sql-safety'

const router = Router();
const pool = new Pool(/* your database configuration */);
const eldIntegrationRepository = new EldIntegrationRepository(pool);

// Example route for creating an ELD integration
router.post('/', async (req, res) => {
  const { name, description, configuration } = req.body;
  const tenantId = req.user.tenantId; // Assuming you have a way to get the tenant ID

  try {
    const newEldIntegration = await eldIntegrationRepository.create(
      { name, description, configuration },
      tenantId
    );
    res.status(201).json(newEldIntegration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ELD integration' });
  }
});

// Add more routes for read, update, and delete operations

export default router;


This implementation provides a solid foundation for your ELD integration repository. You can further customize it based on your specific requirements, such as adding more complex queries or implementing additional business logic.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM eldintegration t
    WHERE t.id = \api/src/repositories/eldintegration.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM eldintegration t
    WHERE t.tenant_id = \api/src/repositories/eldintegration.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
