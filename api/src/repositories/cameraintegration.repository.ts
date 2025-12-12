import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for camera integration, focusing on CRUD operations with parameterized queries and tenant_id support. We'll structure this repository to be used in the `api/src/routes/camera-integration.routes.ts` file.

Here's the implementation of the `CameraIntegrationRepository`:


import { Pool, QueryResult } from 'pg';

interface CameraIntegration {
  id: number;
  name: string;
  url: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export class CameraIntegrationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new camera integration
   * @param cameraIntegration - The camera integration object to create
   * @returns The created camera integration
   */
  async create(cameraIntegration: Omit<CameraIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<CameraIntegration> {
    const query = `
      INSERT INTO camera_integrations (name, url, tenant_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, url, tenant_id, created_at, updated_at;
    `;
    const values = [cameraIntegration.name, cameraIntegration.url, cameraIntegration.tenant_id];

    const result: QueryResult<CameraIntegration> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get a camera integration by ID
   * @param id - The ID of the camera integration to retrieve
   * @param tenant_id - The tenant ID to filter by
   * @returns The camera integration if found, null otherwise
   */
  async getById(id: number, tenant_id: string): Promise<CameraIntegration | null> {
    const query = `
      SELECT id, name, url, tenant_id, created_at, updated_at
      FROM camera_integrations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<CameraIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Get all camera integrations for a tenant
   * @param tenant_id - The tenant ID to filter by
   * @returns An array of camera integrations
   */
  async getAll(tenant_id: string): Promise<CameraIntegration[]> {
    const query = `
      SELECT id, name, url, tenant_id, created_at, updated_at
      FROM camera_integrations
      WHERE tenant_id = $1;
    `;
    const values = [tenant_id];

    const result: QueryResult<CameraIntegration> = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Update a camera integration
   * @param id - The ID of the camera integration to update
   * @param cameraIntegration - The updated camera integration data
   * @param tenant_id - The tenant ID to filter by
   * @returns The updated camera integration
   */
  async update(id: number, cameraIntegration: Partial<Omit<CameraIntegration, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>>, tenant_id: string): Promise<CameraIntegration | null> {
    const { fields: setClause, values: updateValues } = buildUpdateClause(cameraIntegration, 2, 'generic_table');
    const values = [id, ...updateValues, tenant_id];

    const query = `
      UPDATE camera_integrations
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${values.length}
      RETURNING id, name, url, tenant_id, created_at, updated_at;
    `;

    const result: QueryResult<CameraIntegration> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a camera integration
   * @param id - The ID of the camera integration to delete
   * @param tenant_id - The tenant ID to filter by
   * @returns True if the camera integration was deleted, false otherwise
   */
  async delete(id: number, tenant_id: string): Promise<boolean> {
    const query = `
      DELETE FROM camera_integrations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This `CameraIntegrationRepository` class provides the following features:

1. **CRUD Operations**: It implements Create, Read, Update, and Delete operations for camera integrations.

2. **Parameterized Queries**: All SQL queries use parameterized queries to prevent SQL injection attacks.

3. **Tenant ID Support**: Each operation includes the `tenant_id` parameter to ensure multi-tenant isolation.

4. **Type Safety**: The repository uses TypeScript interfaces to define the structure of camera integration data.

5. **Database Connection**: It uses a `Pool` object from the `pg` package, which should be injected when creating an instance of the repository.

To use this repository in your `api/src/routes/camera-integration.routes.ts` file, you would typically create an instance of the repository and use its methods within your route handlers. Here's a brief example of how you might use it:


import { Router } from 'express';
import { Pool } from 'pg';
import { CameraIntegrationRepository } from './camera-integration.repository';
import { buildUpdateClause } from '../utils/sql-safety'

const router = Router();
const pool = new Pool(/* your database configuration */);
const cameraIntegrationRepository = new CameraIntegrationRepository(pool);

router.post('/', async (req, res) => {
  const newCameraIntegration = await cameraIntegrationRepository.create({
    name: req.body.name,
    url: req.body.url,
    tenant_id: req.tenant_id // Assuming you have a middleware that sets this
  });
  res.json(newCameraIntegration);
});

// Implement other routes using the repository methods

export default router;


This repository provides a solid foundation for managing camera integrations in a multi-tenant environment with proper security measures in place.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM cameraintegration t
    WHERE t.id = \api/src/repositories/cameraintegration.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM cameraintegration t
    WHERE t.tenant_id = \api/src/repositories/cameraintegration.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
