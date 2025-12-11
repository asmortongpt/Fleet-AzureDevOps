import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for managing service providers with parameterized queries, tenant_id, and CRUD operations. We'll assume this repository will be used in the `api/src/routes/service-providers.routes.ts` file.

First, let's plan out the structure and functionality:

1. We'll create a `ServiceProvidersRepository` class.
2. The class will have methods for CRUD operations: create, read, update, and delete.
3. We'll use parameterized queries to prevent SQL injection.
4. We'll include `tenant_id` in all queries to ensure multi-tenant support.
5. We'll use a database connection pool for better performance.

Now, let's implement the repository:


import { Pool, QueryResult } from 'pg';

interface ServiceProvider {
  id: number;
  name: string;
  description: string;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export class ServiceProvidersRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new service provider
   * @param name - The name of the service provider
   * @param description - The description of the service provider
   * @param tenantId - The ID of the tenant
   * @returns The newly created service provider
   */
  async create(name: string, description: string, tenantId: number): Promise<ServiceProvider> {
    const query = `
      INSERT INTO service_providers (name, description, tenant_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [name, description, tenantId];
    const result: QueryResult<ServiceProvider> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get a service provider by ID
   * @param id - The ID of the service provider
   * @param tenantId - The ID of the tenant
   * @returns The service provider if found, null otherwise
   */
  async getById(id: number, tenantId: number): Promise<ServiceProvider | null> {
    const query = `
      SELECT id, created_at, updated_at FROM service_providers
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];
    const result: QueryResult<ServiceProvider> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Get all service providers for a tenant
   * @param tenantId - The ID of the tenant
   * @returns An array of service providers
   */
  async getAll(tenantId: number): Promise<ServiceProvider[]> {
    const query = `
      SELECT id, created_at, updated_at FROM service_providers
      WHERE tenant_id = $1
      ORDER BY name;
    `;
    const values = [tenantId];
    const result: QueryResult<ServiceProvider> = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Update a service provider
   * @param id - The ID of the service provider
   * @param name - The new name of the service provider (optional)
   * @param description - The new description of the service provider (optional)
   * @param tenantId - The ID of the tenant
   * @returns The updated service provider if found, null otherwise
   */
  async update(id: number, name?: string, description?: string, tenantId: number): Promise<ServiceProvider | null> {
    const updates: string[] = [];
    const values: (string | number)[] = [id, tenantId];
    let paramIndex = 3;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (updates.length === 0) {
      return null;
    }

    const query = `
      UPDATE service_providers
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `;

    const result: QueryResult<ServiceProvider> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a service provider
   * @param id - The ID of the service provider
   * @param tenantId - The ID of the tenant
   * @returns True if the service provider was deleted, false otherwise
   */
  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      DELETE FROM service_providers
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This `ServiceProvidersRepository` class provides the following features:

1. CRUD operations: create, read (by ID and all), update, and delete.
2. Parameterized queries to prevent SQL injection.
3. `tenant_id` is included in all queries to ensure multi-tenant support.
4. The class uses a `Pool` from the `pg` package for database connections.
5. Each method is documented with a JSDoc comment explaining its purpose and parameters.
6. The `update` method allows partial updates and only updates the fields that are provided.

To use this repository in your `api/src/routes/service-providers.routes.ts` file, you would typically do something like this:


import { Router } from 'express';
import { Pool } from 'pg';
import { ServiceProvidersRepository } from './ServiceProvidersRepository';

const router = Router();
const pool = new Pool(/* your database configuration */);
const serviceProvidersRepository = new ServiceProvidersRepository(pool);

// Your routes would go here, using the serviceProvidersRepository
// For example:
router.post('/', async (req, res) => {
  const { name, description, tenantId } = req.body;
  try {
    const newServiceProvider = await serviceProvidersRepository.create(name, description, tenantId);
    res.status(201).json(newServiceProvider);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service provider' });
  }
});

// ... other routes for read, update, and delete operations

export default router;


This repository should provide a solid foundation for managing service providers in your application, with proper security measures and multi-tenant support.