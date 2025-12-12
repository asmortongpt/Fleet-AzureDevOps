import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository for vehicle history with parameterized queries, tenant_id, and CRUD operations, we'll need to design a class that encapsulates these functionalities. Let's break down the implementation step-by-step:

1. Define the interface for VehicleHistory
2. Create the VehicleHistoryRepository class
3. Implement CRUD operations with parameterized queries and tenant_id

Here's the implementation:


// api/src/repositories/vehicle-history.repository.ts

import { Pool, QueryResult } from 'pg';

// Define the VehicleHistory interface
interface VehicleHistory {
  id: number;
  vehicle_id: number;
  event_date: Date;
  event_type: string;
  description: string;
  tenant_id: number;
}

// VehicleHistoryRepository class
export class VehicleHistoryRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new vehicle history entry
  async create(vehicleHistory: Omit<VehicleHistory, 'id'>, tenantId: number): Promise<VehicleHistory> {
    const query = `
      INSERT INTO vehicle_history (vehicle_id, event_date, event_type, description, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      vehicleHistory.vehicle_id,
      vehicleHistory.event_date,
      vehicleHistory.event_type,
      vehicleHistory.description,
      tenantId
    ];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a vehicle history entry by id
  async read(id: number, tenantId: number): Promise<VehicleHistory | null> {
    const query = `
      SELECT id, created_at, updated_at FROM vehicle_history
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a vehicle history entry
  async update(id: number, vehicleHistory: Partial<VehicleHistory>, tenantId: number): Promise<VehicleHistory | null> {
    // Filter out id and tenant_id, then use safe SQL builder
    const filtered = Object.keys(vehicleHistory).filter(key => key !== 'id' && key !== 'tenant_id').reduce((obj: any, key) => { obj[key] = vehicleHistory[key]; return obj; }, {});
    const { fields: setClause, values: updateValues } = buildUpdateClause(filtered, 2, 'vehicle_history');

    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE vehicle_history
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(vehicleHistory).length + 2}
      RETURNING *
    `;
    const values = [
      id,
      ...Object.values(vehicleHistory).filter(key => key !== 'id' && key !== 'tenant_id'),
      tenantId
    ];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a vehicle history entry
  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      DELETE FROM vehicle_history
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  // List all vehicle history entries for a tenant
  async list(tenantId: number): Promise<VehicleHistory[]> {
    const query = `
      SELECT id, created_at, updated_at FROM vehicle_history
      WHERE tenant_id = $1
      ORDER BY event_date DESC
    `;
    const values = [tenantId];

    const result: QueryResult<VehicleHistory> = await this.pool.query(query, values);
    return result.rows;
  }
}


This implementation provides a `VehicleHistoryRepository` class that encapsulates CRUD operations for vehicle history entries. Here's a breakdown of the key features:

1. **Parameterized Queries**: All database operations use parameterized queries to prevent SQL injection attacks.

2. **Tenant ID**: Every operation includes the `tenant_id` parameter to ensure multi-tenant isolation.

3. **CRUD Operations**:
   - `create`: Inserts a new vehicle history entry
   - `read`: Retrieves a single vehicle history entry by ID
   - `update`: Updates an existing vehicle history entry
   - `delete`: Deletes a vehicle history entry
   - `list`: Retrieves all vehicle history entries for a tenant

4. **Error Handling**: The `update` method throws an error if no fields are provided for updating.

5. **Type Safety**: The repository uses TypeScript interfaces and generics to ensure type safety throughout the operations.

To use this repository in your `vehicle-history.routes.ts` file, you would typically inject the `Pool` instance and create an instance of the `VehicleHistoryRepository`. Here's an example of how you might use it in a route handler:


// api/src/routes/vehicle-history.routes.ts

import express from 'express';
import { Pool } from 'pg';
import { VehicleHistoryRepository } from '../repositories/vehicle-history.repository';
import { buildUpdateClause } from '../utils/sql-safety'

const router = express.Router();
const pool = new Pool(/* your database configuration */);
const vehicleHistoryRepository = new VehicleHistoryRepository(pool);

router.post('/', async (req, res) => {
  try {
    const { vehicle_id, event_date, event_type, description } = req.body;
    const tenantId = req.tenantId; // Assuming you have a middleware that sets this

    const newVehicleHistory = await vehicleHistoryRepository.create(
      { vehicle_id, event_date, event_type, description },
      tenantId
    );

    res.status(201).json(newVehicleHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Implement other routes (GET, PUT, DELETE) similarly

export default router;


This implementation provides a solid foundation for managing vehicle history data in a multi-tenant environment with proper security measures in place.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM vehiclehistory t
    WHERE t.id = \api/src/repositories/vehiclehistory.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM vehiclehistory t
    WHERE t.tenant_id = \api/src/repositories/vehiclehistory.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
