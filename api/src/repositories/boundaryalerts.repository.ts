import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository called `BoundaryAlertsRepository` for the `api/src/routes/boundary-alerts.routes.ts` file, we'll implement parameterized queries, include a `tenant_id` field, and provide CRUD operations. Let's break this down step-by-step:

1. We'll create a new file called `boundary-alerts.repository.ts` in the `api/src/repositories` directory.
2. We'll use a database connection (assuming we're using PostgreSQL with a library like `pg`).
3. We'll implement CRUD operations with parameterized queries.
4. We'll include a `tenant_id` field in all operations.

Here's the implementation:


// api/src/repositories/boundary-alerts.repository.ts

import { Pool, QueryResult } from 'pg';
import { BoundaryAlert } from '../models/boundary-alert.model';

export class BoundaryAlertsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new boundary alert
   * @param boundaryAlert - The boundary alert to create
   * @returns The created boundary alert
   */
  async create(boundaryAlert: BoundaryAlert): Promise<BoundaryAlert> {
    const query = `
      INSERT INTO boundary_alerts (tenant_id, name, description, boundary_type, coordinates, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      boundaryAlert.tenant_id,
      boundaryAlert.name,
      boundaryAlert.description,
      boundaryAlert.boundary_type,
      boundaryAlert.coordinates,
      new Date(),
      new Date()
    ];

    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get a boundary alert by ID
   * @param id - The ID of the boundary alert to retrieve
   * @param tenant_id - The tenant ID to filter by
   * @returns The boundary alert if found, null otherwise
   */
  async getById(id: number, tenant_id: string): Promise<BoundaryAlert | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM boundary_alerts
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Get all boundary alerts for a tenant
   * @param tenant_id - The tenant ID to filter by
   * @returns An array of boundary alerts
   */
  async getAll(tenant_id: string): Promise<BoundaryAlert[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM boundary_alerts
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];

    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Update a boundary alert
   * @param id - The ID of the boundary alert to update
   * @param boundaryAlert - The updated boundary alert data
   * @param tenant_id - The tenant ID to filter by
   * @returns The updated boundary alert if found, null otherwise
   */
  async update(id: number, boundaryAlert: Partial<BoundaryAlert>, tenant_id: string): Promise<BoundaryAlert | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    let index = 1;
    for (const [key, value] of Object.entries(boundaryAlert)) {
      if (key !== 'id' && key !== 'tenant_id' && key !== 'created_at') {
        updateFields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    values.push(id); // Add id as the last parameter
    values.push(tenant_id); // Add tenant_id as the last parameter

    const updateQuery = updateFields.join(', ');
    const query = `
      UPDATE boundary_alerts
      SET ${updateQuery}, updated_at = NOW()
      WHERE id = $${index} AND tenant_id = $${index + 1}
      RETURNING *
    `;

    const result: QueryResult<BoundaryAlert> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a boundary alert
   * @param id - The ID of the boundary alert to delete
   * @param tenant_id - The tenant ID to filter by
   * @returns True if the boundary alert was deleted, false otherwise
   */
  async delete(id: number, tenant_id: string): Promise<boolean> {
    const query = `
      DELETE FROM boundary_alerts
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This implementation includes the following features:

1. Parameterized queries to prevent SQL injection.
2. A `tenant_id` field included in all operations to ensure multi-tenant support.
3. CRUD operations:
   - `create`: Creates a new boundary alert.
   - `getById`: Retrieves a boundary alert by ID and tenant ID.
   - `getAll`: Retrieves all boundary alerts for a given tenant ID.
   - `update`: Updates a boundary alert, allowing partial updates.
   - `delete`: Deletes a boundary alert by ID and tenant ID.

To use this repository in your `boundary-alerts.routes.ts` file, you'll need to import it and create an instance with a database connection. Here's an example of how you might use it:


// api/src/routes/boundary-alerts.routes.ts

import express from 'express';
import { Pool } from 'pg';
import { BoundaryAlertsRepository } from '../repositories/boundary-alerts.repository';

const router = express.Router();
const pool = new Pool(/* your database connection config */);
const boundaryAlertsRepository = new BoundaryAlertsRepository(pool);

// Example route for creating a boundary alert
router.post('/', async (req, res) => {
  try {
    const newAlert = await boundaryAlertsRepository.create(req.body);
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create boundary alert' });
  }
});

// Add more routes for other CRUD operations...

export default router;


Remember to adjust the import paths and database connection setup according to your project structure and configuration.