import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for managing speed violations, focusing on CRUD operations with parameterized queries and tenant_id support. We'll structure this repository to be used in the `api/src/routes/speed-violations.routes.ts` file.

Here's the implementation of the `SpeedViolationsRepository`:


import { Pool, QueryResult } from 'pg';
import { SpeedViolation } from '../models/speed-violation.model';

export class SpeedViolationsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Creates a new speed violation record
   * @param speedViolation - The speed violation object to be created
   * @param tenantId - The ID of the tenant
   * @returns The created speed violation object
   */
  async create(speedViolation: SpeedViolation, tenantId: string): Promise<SpeedViolation> {
    const query = `
      INSERT INTO speed_violations (vehicle_id, speed, location, timestamp, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, vehicle_id, speed, location, timestamp;
    `;
    const values = [
      speedViolation.vehicle_id,
      speedViolation.speed,
      speedViolation.location,
      speedViolation.timestamp,
      tenantId
    ];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Retrieves a speed violation by its ID
   * @param id - The ID of the speed violation
   * @param tenantId - The ID of the tenant
   * @returns The speed violation object if found, null otherwise
   */
  async read(id: number, tenantId: string): Promise<SpeedViolation | null> {
    const query = `
      SELECT id, vehicle_id, speed, location, timestamp
      FROM speed_violations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Updates an existing speed violation record
   * @param id - The ID of the speed violation to update
   * @param speedViolation - The updated speed violation object
   * @param tenantId - The ID of the tenant
   * @returns The updated speed violation object
   */
  async update(id: number, speedViolation: SpeedViolation, tenantId: string): Promise<SpeedViolation> {
    const query = `
      UPDATE speed_violations
      SET vehicle_id = $1, speed = $2, location = $3, timestamp = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING id, vehicle_id, speed, location, timestamp;
    `;
    const values = [
      speedViolation.vehicle_id,
      speedViolation.speed,
      speedViolation.location,
      speedViolation.timestamp,
      id,
      tenantId
    ];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    if (result.rowCount === 0) {
      throw new Error('Speed violation not found or unauthorized');
    }
    return result.rows[0];
  }

  /**
   * Deletes a speed violation record
   * @param id - The ID of the speed violation to delete
   * @param tenantId - The ID of the tenant
   * @returns True if the deletion was successful, false otherwise
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM speed_violations
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * Retrieves all speed violations for a tenant
   * @param tenantId - The ID of the tenant
   * @returns An array of speed violation objects
   */
  async list(tenantId: string): Promise<SpeedViolation[]> {
    const query = `
      SELECT id, vehicle_id, speed, location, timestamp
      FROM speed_violations
      WHERE tenant_id = $1;
    `;
    const values = [tenantId];

    const result: QueryResult<SpeedViolation> = await this.pool.query(query, values);
    return result.rows;
  }
}


This `SpeedViolationsRepository` class provides the following features:

1. **CRUD Operations**: It includes methods for Create, Read, Update, and Delete operations on speed violations.

2. **Parameterized Queries**: All database queries use parameterized queries to prevent SQL injection attacks.

3. **Tenant Support**: Every method includes a `tenantId` parameter to ensure multi-tenant support. The `tenant_id` is used in all queries to filter results and ensure data isolation between tenants.

4. **Type Safety**: The class uses TypeScript's type system, including the `SpeedViolation` model imported from a separate file.

5. **Error Handling**: The `update` method throws an error if the speed violation is not found or if the tenant doesn't have access to it.

6. **List Method**: An additional `list` method is provided to retrieve all speed violations for a given tenant.

To use this repository in your `speed-violations.routes.ts` file, you would typically instantiate it with a database connection pool and use its methods within your route handlers. For example:


import { Router } from 'express';
import { Pool } from 'pg';
import { SpeedViolationsRepository } from '../repositories/speed-violations.repository';

const router = Router();
const pool = new Pool(/* your database configuration */);
const speedViolationsRepository = new SpeedViolationsRepository(pool);

router.post('/', async (req, res) => {
  try {
    const speedViolation = await speedViolationsRepository.create(req.body, req.tenantId);
    res.status(201).json(speedViolation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create speed violation' });
  }
});

// Implement other routes using the repository methods

export default router;


This implementation provides a solid foundation for managing speed violations in a multi-tenant environment with proper database interaction and type safety.