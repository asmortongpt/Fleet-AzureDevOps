import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for managing cleaning schedules with parameterized queries, tenant_id, and CRUD operations. We'll assume this repository will be used in conjunction with a database like PostgreSQL or MySQL.

Here's the implementation for the `CleaningSchedulesRepository` class:


import { Pool, QueryResult } from 'pg';
import { CleaningSchedule } from '../models/cleaning-schedule.model';

export class CleaningSchedulesRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Creates a new cleaning schedule
   * @param schedule - The cleaning schedule to create
   * @param tenantId - The ID of the tenant
   * @returns The created cleaning schedule
   */
  async create(schedule: CleaningSchedule, tenantId: string): Promise<CleaningSchedule> {
    const query = `
      INSERT INTO cleaning_schedules (name, description, frequency, start_date, end_date, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, frequency, start_date, end_date, created_at, updated_at;
    `;
    const values = [
      schedule.name,
      schedule.description,
      schedule.frequency,
      schedule.startDate,
      schedule.endDate,
      tenantId
    ];

    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Retrieves a cleaning schedule by ID
   * @param id - The ID of the cleaning schedule
   * @param tenantId - The ID of the tenant
   * @returns The cleaning schedule if found, null otherwise
   */
  async getById(id: string, tenantId: string): Promise<CleaningSchedule | null> {
    const query = `
      SELECT id, name, description, frequency, start_date, end_date, created_at, updated_at
      FROM cleaning_schedules
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];

    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Retrieves all cleaning schedules for a tenant
   * @param tenantId - The ID of the tenant
   * @returns An array of cleaning schedules
   */
  async getAll(tenantId: string): Promise<CleaningSchedule[]> {
    const query = `
      SELECT id, name, description, frequency, start_date, end_date, created_at, updated_at
      FROM cleaning_schedules
      WHERE tenant_id = $1
      ORDER BY created_at DESC;
    `;
    const values = [tenantId];

    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Updates a cleaning schedule
   * @param id - The ID of the cleaning schedule to update
   * @param schedule - The updated cleaning schedule data
   * @param tenantId - The ID of the tenant
   * @returns The updated cleaning schedule
   */
  async update(id: string, schedule: Partial<CleaningSchedule>, tenantId: string): Promise<CleaningSchedule | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    // Build the SET clause dynamically based on provided fields
    Object.entries(schedule).forEach(([key, value], index) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${index + 2}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id, tenantId);

    const query = `
      UPDATE cleaning_schedules
      SET ${updateFields.join(', ')}
      WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
      RETURNING id, name, description, frequency, start_date, end_date, created_at, updated_at;
    `;

    const result: QueryResult<CleaningSchedule> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Deletes a cleaning schedule
   * @param id - The ID of the cleaning schedule to delete
   * @param tenantId - The ID of the tenant
   * @returns True if the schedule was deleted, false otherwise
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM cleaning_schedules
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [id, tenantId];

    const result: QueryResult<{ id: string }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This `CleaningSchedulesRepository` class provides the following features:

1. **Parameterized queries**: All database queries use parameterized queries to prevent SQL injection attacks.

2. **Tenant_id**: Every method includes a `tenantId` parameter to ensure multi-tenant isolation.

3. **CRUD operations**:
   - `create`: Creates a new cleaning schedule
   - `getById`: Retrieves a cleaning schedule by ID
   - `getAll`: Retrieves all cleaning schedules for a tenant
   - `update`: Updates an existing cleaning schedule
   - `delete`: Deletes a cleaning schedule

4. **Type safety**: The class uses TypeScript's type system, including the `CleaningSchedule` model, to ensure type safety.

5. **Database connection**: The class uses a `Pool` object from the `pg` package, assuming a PostgreSQL database. You can modify this to use a different database if needed.

To use this repository in your `cleaning-schedules.routes.ts` file, you would typically create an instance of the repository and use its methods in your route handlers. Here's a basic example of how you might use it:


import { Router } from 'express';
import { Pool } from 'pg';
import { CleaningSchedulesRepository } from '../repositories/cleaning-schedules.repository';
import { CleaningSchedule } from '../models/cleaning-schedule.model';

const router = Router();
const pool = new Pool(/* your database connection details */);
const cleaningSchedulesRepository = new CleaningSchedulesRepository(pool);

router.post('/', async (req, res) => {
  try {
    const schedule: CleaningSchedule = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;
    const createdSchedule = await cleaningSchedulesRepository.create(schedule, tenantId);
    res.status(201).json(createdSchedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cleaning schedule' });
  }
});

// Implement other routes (GET, PUT, DELETE) similarly

export default router;


Remember to adjust the database connection details and error handling according to your specific needs. Also, ensure that you have the necessary database schema set up to match the queries in the repository.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM cleaningschedules t
    WHERE t.id = \api/src/repositories/cleaningschedules.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM cleaningschedules t
    WHERE t.tenant_id = \api/src/repositories/cleaningschedules.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
