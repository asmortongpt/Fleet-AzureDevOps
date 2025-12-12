import { BaseRepository } from './BaseRepository';

Here's a TypeScript repository class `ModelsRepository` that implements CRUD methods with parameterized queries and tenant_id filtering to eliminate the 16 queries from `api/src/routes/models.ts`:


import { Pool, QueryResult } from 'pg';

class ModelsRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new model
  async createModel(tenantId: string, name: string, description: string): Promise<QueryResult> {
    const query = `
      INSERT INTO models (tenant_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING id, tenant_id, name, description, created_at, updated_at
    `;
    const values = [tenantId, name, description];
    return this.query(query, values);
  }

  // Read a single model by ID
  async getModelById(tenantId: string, modelId: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM models
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [modelId, tenantId];
    return this.query(query, values);
  }

  // Read all models for a tenant
  async getAllModels(tenantId: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, name, description, created_at, updated_at
      FROM models
      WHERE tenant_id = $1
    `;
    const values = [tenantId];
    return this.query(query, values);
  }

  // Update an existing model
  async updateModel(tenantId: string, modelId: string, name: string, description: string): Promise<QueryResult> {
    const query = `
      UPDATE models
      SET name = $3, description = $4, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, tenant_id, name, description, created_at, updated_at
    `;
    const values = [modelId, tenantId, name, description];
    return this.query(query, values);
  }

  // Delete a model
  async deleteModel(tenantId: string, modelId: string): Promise<QueryResult> {
    const query = `
      DELETE FROM models
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, tenant_id, name, description, created_at, updated_at
    `;
    const values = [modelId, tenantId];
    return this.query(query, values);
  }
}

export default ModelsRepository;


This `ModelsRepository` class provides the following benefits:

1. It uses parameterized queries with `$1`, `$2`, `$3` placeholders to prevent SQL injection.
2. All methods include `tenant_id` filtering to ensure data isolation between tenants.
3. It implements CRUD (Create, Read, Update, Delete) operations for models.
4. The class uses a PostgreSQL connection pool for efficient database interactions.
5. Each method returns a `QueryResult` object, allowing the caller to handle the results as needed.

To use this repository in your `api/src/routes/models.ts` file, you would typically create an instance of the `ModelsRepository` class and use its methods instead of writing raw SQL queries. This approach will significantly reduce the number of queries in your routes file and improve maintainability.