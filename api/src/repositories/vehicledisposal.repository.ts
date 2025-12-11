import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for vehicle disposal management, focusing on CRUD operations with parameterized queries and tenant_id support. We'll structure this repository to be used in the `api/src/routes/vehicle-disposal.routes.ts` file.

Here's the implementation of the `VehicleDisposalRepository`:


import { Pool, QueryResult } from 'pg';

interface VehicleDisposal {
  id: number;
  vehicle_id: number;
  disposal_date: Date;
  disposal_method: string;
  disposal_location: string;
  notes: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: number;
}

export class VehicleDisposalRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new vehicle disposal record
   * @param vehicleDisposal - The vehicle disposal object to be created
   * @param tenantId - The tenant ID for multi-tenant support
   * @returns The created vehicle disposal record
   */
  async create(vehicleDisposal: Omit<VehicleDisposal, 'id' | 'created_at' | 'updated_at'>, tenantId: number): Promise<VehicleDisposal> {
    const query = `
      INSERT INTO vehicle_disposals (vehicle_id, disposal_date, disposal_method, disposal_location, notes, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      vehicleDisposal.vehicle_id,
      vehicleDisposal.disposal_date,
      vehicleDisposal.disposal_method,
      vehicleDisposal.disposal_location,
      vehicleDisposal.notes,
      tenantId
    ];

    const result: QueryResult<VehicleDisposal> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Retrieve a vehicle disposal record by ID
   * @param id - The ID of the vehicle disposal record
   * @param tenantId - The tenant ID for multi-tenant support
   * @returns The vehicle disposal record if found, null otherwise
   */
  async read(id: number, tenantId: number): Promise<VehicleDisposal | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM vehicle_disposals
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];

    const result: QueryResult<VehicleDisposal> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update an existing vehicle disposal record
   * @param id - The ID of the vehicle disposal record to update
   * @param vehicleDisposal - The updated vehicle disposal data
   * @param tenantId - The tenant ID for multi-tenant support
   * @returns The updated vehicle disposal record
   */
  async update(id: number, vehicleDisposal: Partial<Omit<VehicleDisposal, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>>, tenantId: number): Promise<VehicleDisposal | null> {
    const setClause = Object.keys(vehicleDisposal)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE vehicle_disposals
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(vehicleDisposal).length + 2}
      RETURNING *;
    `;
    
    const values = [
      id,
      ...Object.values(vehicleDisposal),
      tenantId
    ];

    const result: QueryResult<VehicleDisposal> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a vehicle disposal record
   * @param id - The ID of the vehicle disposal record to delete
   * @param tenantId - The tenant ID for multi-tenant support
   * @returns True if the record was deleted, false otherwise
   */
  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `
      DELETE FROM vehicle_disposals
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [id, tenantId];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * List all vehicle disposal records for a tenant
   * @param tenantId - The tenant ID for multi-tenant support
   * @param limit - The maximum number of records to return
   * @param offset - The number of records to skip
   * @returns An array of vehicle disposal records
   */
  async list(tenantId: number, limit: number = 10, offset: number = 0): Promise<VehicleDisposal[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM vehicle_disposals
      WHERE tenant_id = $1
      ORDER BY id
      LIMIT $2 OFFSET $3;
    `;
    const values = [tenantId, limit, offset];

    const result: QueryResult<VehicleDisposal> = await this.pool.query(query, values);
    return result.rows;
  }
}


This `VehicleDisposalRepository` class provides the following features:

1. **CRUD Operations**: It includes methods for Create, Read, Update, and Delete operations on vehicle disposal records.

2. **Parameterized Queries**: All database queries use parameterized queries to prevent SQL injection attacks.

3. **Tenant Support**: Each method includes a `tenant_id` parameter to support multi-tenant environments.

4. **Type Safety**: The class uses TypeScript interfaces to ensure type safety for the `VehicleDisposal` object.

5. **Flexibility**: The `update` method allows partial updates, and the `list` method supports pagination.

To use this repository in your `api/src/routes/vehicle-disposal.routes.ts` file, you would typically create an instance of the repository and use its methods in your route handlers. Here's a basic example of how you might use it:


import { Router } from 'express';
import { Pool } from 'pg';
import { VehicleDisposalRepository } from './vehicle-disposal.repository';

const router = Router();
const pool = new Pool(/* your database configuration */);
const vehicleDisposalRepository = new VehicleDisposalRepository(pool);

router.post('/', async (req, res) => {
  const { vehicle_id, disposal_date, disposal_method, disposal_location, notes } = req.body;
  const tenantId = req.user.tenant_id; // Assuming you have a way to get the tenant ID

  try {
    const newVehicleDisposal = await vehicleDisposalRepository.create(
      { vehicle_id, disposal_date, disposal_method, disposal_location, notes },
      tenantId
    );
    res.status(201).json(newVehicleDisposal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vehicle disposal record' });
  }
});

// Implement other routes (GET, PUT, DELETE) similarly using the repository methods

export default router;


This repository provides a solid foundation for managing vehicle disposal records in a multi-tenant environment with proper security measures in place. You can extend it further by adding more complex queries or additional methods as needed for your specific use case.