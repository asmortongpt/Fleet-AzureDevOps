import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository named `TireManagementRepository` for the `api/src/routes/tire-management.routes.ts` file, we'll implement parameterized queries, include a `tenant_id` field, and provide CRUD (Create, Read, Update, Delete) operations. Let's break this down step-by-step:

1. First, we'll define the interface for our tire management data.
2. Then, we'll create the `TireManagementRepository` class with CRUD methods.
3. We'll use parameterized queries to prevent SQL injection.
4. We'll include the `tenant_id` in all queries to ensure multi-tenant support.

Here's the implementation:


import { Pool, QueryResult } from 'pg';

// Define the interface for tire management data
interface TireManagement {
  id: number;
  tire_id: string;
  vehicle_id: string;
  installation_date: Date;
  removal_date: Date | null;
  mileage_at_installation: number;
  mileage_at_removal: number | null;
  condition: string;
  notes: string;
  tenant_id: number;
}

// TireManagementRepository class
export class TireManagementRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new tire management record
  async create(tireManagement: Omit<TireManagement, 'id'>): Promise<TireManagement> {
    const query = `
      INSERT INTO tire_management (
        tire_id, vehicle_id, installation_date, removal_date, 
        mileage_at_installation, mileage_at_removal, condition, notes, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      tireManagement.tire_id,
      tireManagement.vehicle_id,
      tireManagement.installation_date,
      tireManagement.removal_date,
      tireManagement.mileage_at_installation,
      tireManagement.mileage_at_removal,
      tireManagement.condition,
      tireManagement.notes,
      tireManagement.tenant_id
    ];

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a tire management record by ID
  async read(id: number, tenant_id: number): Promise<TireManagement | null> {
    const query = `
      SELECT id, created_at, updated_at FROM tire_management
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a tire management record
  async update(id: number, tireManagement: Partial<TireManagement>, tenant_id: number): Promise<TireManagement | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(tireManagement).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'tenant_id') {
        updateFields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    values.push(id);
    values.push(tenant_id);

    const query = `
      UPDATE tire_management
      SET ${updateFields.join(', ')}
      WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
      RETURNING *
    `;

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a tire management record
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM tire_management
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  // List all tire management records for a tenant
  async list(tenant_id: number): Promise<TireManagement[]> {
    const query = `
      SELECT id, created_at, updated_at FROM tire_management
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];

    const result: QueryResult<TireManagement> = await this.pool.query(query, values);
    return result.rows;
  }
}


This implementation includes the following features:

1. A `TireManagement` interface to define the structure of our data.
2. A `TireManagementRepository` class with CRUD operations:
   - `create`: Inserts a new tire management record.
   - `read`: Retrieves a single record by ID and tenant ID.
   - `update`: Updates an existing record.
   - `delete`: Deletes a record by ID and tenant ID.
   - `list`: Retrieves all records for a specific tenant.
3. All queries use parameterized queries to prevent SQL injection.
4. The `tenant_id` is included in all queries to ensure multi-tenant support.
5. The class uses a `Pool` object from the `pg` package, which should be injected when instantiating the repository.

To use this repository in your `tire-management.routes.ts` file, you would typically create an instance of the repository and use its methods in your route handlers. For example:


import { Pool } from 'pg';
import { TireManagementRepository } from './TireManagementRepository';

const pool = new Pool({
  // Your database connection details
});

const tireManagementRepository = new TireManagementRepository(pool);

// Use tireManagementRepository in your route handlers


This implementation provides a solid foundation for managing tire-related data in a multi-tenant environment, with proper security measures in place through the use of parameterized queries.