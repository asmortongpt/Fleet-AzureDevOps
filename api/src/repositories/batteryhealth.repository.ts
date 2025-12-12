import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository called `BatteryHealthRepository` for the `api/src/routes/battery-health.routes.ts` file, we'll implement parameterized queries, include `tenant_id` in our operations, and provide CRUD functionality. Let's break this down step-by-step:

1. First, we'll create the repository file.
2. We'll import necessary dependencies.
3. We'll define the repository class with CRUD methods.
4. We'll use parameterized queries for database operations.
5. We'll include `tenant_id` in all operations to ensure multi-tenant support.

Here's the implementation:


// api/src/repositories/BatteryHealthRepository.ts

import { PoolClient } from 'pg';
import { BatteryHealth } from '../models/BatteryHealth';

export class BatteryHealthRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LBattery_LHealth_LRepository extends _LBases');
  }

  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  /**
   * Create a new battery health record
   * @param batteryHealth - The battery health object to create
   * @param tenantId - The ID of the tenant
   * @returns The created battery health object
   */
  async create(batteryHealth: BatteryHealth, tenantId: string): Promise<BatteryHealth> {
    const query = `
      INSERT INTO battery_health (device_id, health_percentage, status, timestamp, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, device_id, health_percentage, status, timestamp
    `;
    const values = [
      batteryHealth.device_id,
      batteryHealth.health_percentage,
      batteryHealth.status,
      batteryHealth.timestamp,
      tenantId
    ];

    const result = await this.client.query(query, values);
    return result.rows[0] as BatteryHealth;
  }

  /**
   * Read a battery health record by ID
   * @param id - The ID of the battery health record
   * @param tenantId - The ID of the tenant
   * @returns The battery health object or null if not found
   */
  async read(id: number, tenantId: string): Promise<BatteryHealth | null> {
    const query = `
      SELECT id, device_id, health_percentage, status, timestamp
      FROM battery_health
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];

    const result = await this.client.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update an existing battery health record
   * @param id - The ID of the battery health record to update
   * @param batteryHealth - The updated battery health object
   * @param tenantId - The ID of the tenant
   * @returns The updated battery health object or null if not found
   */
  async update(id: number, batteryHealth: BatteryHealth, tenantId: string): Promise<BatteryHealth | null> {
    const query = `
      UPDATE battery_health
      SET device_id = $1, health_percentage = $2, status = $3, timestamp = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING id, device_id, health_percentage, status, timestamp
    `;
    const values = [
      batteryHealth.device_id,
      batteryHealth.health_percentage,
      batteryHealth.status,
      batteryHealth.timestamp,
      id,
      tenantId
    ];

    const result = await this.client.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a battery health record by ID
   * @param id - The ID of the battery health record to delete
   * @param tenantId - The ID of the tenant
   * @returns True if the record was deleted, false otherwise
   */
  async delete(id: number, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM battery_health
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];

    const result = await this.client.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * List all battery health records for a tenant
   * @param tenantId - The ID of the tenant
   * @returns An array of battery health objects
   */
  async list(tenantId: string): Promise<BatteryHealth[]> {
    const query = `
      SELECT id, device_id, health_percentage, status, timestamp
      FROM battery_health
      WHERE tenant_id = $1
    `;
    const values = [tenantId];

    const result = await this.client.query(query, values);
    return result.rows as BatteryHealth[];
  }
}


This implementation includes the following features:

1. **Parameterized Queries**: All database operations use parameterized queries to prevent SQL injection attacks.

2. **Tenant ID**: The `tenant_id` is included in all database operations to ensure multi-tenant support. This allows the system to isolate data for different tenants.

3. **CRUD Operations**: The repository provides Create, Read, Update, Delete, and List operations for battery health records.

4. **TypeScript**: The code is written in TypeScript, with type annotations for better type safety and developer experience.

5. **Error Handling**: While not explicitly implemented, the use of `async/await` allows for easy error handling with try/catch blocks in the calling code.

6. **Documentation**: Each method has a JSDoc comment explaining its purpose, parameters, and return value.

To use this repository in your `battery-health.routes.ts` file, you would typically create an instance of the repository and use its methods within your route handlers. For example:


// api/src/routes/battery-health.routes.ts

import { Router } from 'express';
import { PoolClient } from 'pg';
import { BatteryHealthRepository } from '../repositories/BatteryHealthRepository';

const router = Router();

router.post('/', async (req, res) => {
  const { device_id, health_percentage, status, timestamp } = req.body;
  const { tenantId } = req.headers;

  const client: PoolClient = req.app.get('dbClient');
  const repository = new BatteryHealthRepository(client);

  try {
    const newBatteryHealth = await repository.create(
      { device_id, health_percentage, status, timestamp },
      tenantId as string
    );
    res.status(201).json(newBatteryHealth);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create battery health record' });
  }
});

// Implement other routes (GET, PUT, DELETE) similarly

export default router;


This implementation provides a solid foundation for managing battery health data in a multi-tenant environment using TypeScript and parameterized queries.