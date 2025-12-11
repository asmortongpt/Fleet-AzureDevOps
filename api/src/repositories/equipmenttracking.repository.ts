import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for equipment tracking that supports CRUD operations with parameterized queries and includes tenant_id for multi-tenant support. We'll assume we're using a PostgreSQL database and the `pg` library for database interactions.

First, let's plan out the structure of our repository:

1. We'll create an `EquipmentTrackingRepository` class.
2. The class will have methods for Create, Read, Update, and Delete operations.
3. We'll use parameterized queries to prevent SQL injection.
4. We'll include `tenant_id` in all queries to ensure multi-tenant support.
5. We'll use async/await for asynchronous operations.

Now, let's implement the repository:


// api/src/repositories/EquipmentTrackingRepository.ts

import { Pool, QueryResult } from 'pg';

interface EquipmentTracking {
  id: number;
  tenant_id: number;
  equipment_id: number;
  location: string;
  status: string;
  last_updated: Date;
}

export class EquipmentTrackingRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new equipment tracking record
  async create(equipmentTracking: Omit<EquipmentTracking, 'id' | 'last_updated'>): Promise<EquipmentTracking> {
    const query = `
      INSERT INTO equipment_tracking (tenant_id, equipment_id, location, status, last_updated)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [equipmentTracking.tenant_id, equipmentTracking.equipment_id, equipmentTracking.location, equipmentTracking.status];

    const result: QueryResult<EquipmentTracking> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read equipment tracking records
  async read(tenant_id: number, equipment_id?: number): Promise<EquipmentTracking[]> {
    let query = 'SELECT id, tenant_id, created_at, updated_at FROM equipment_tracking WHERE tenant_id = $1';
    let values = [tenant_id];

    if (equipment_id) {
      query += ' AND equipment_id = $2';
      values.push(equipment_id);
    }

    const result: QueryResult<EquipmentTracking> = await this.pool.query(query, values);
    return result.rows;
  }

  // Update an equipment tracking record
  async update(equipmentTracking: Partial<EquipmentTracking>): Promise<EquipmentTracking | null> {
    const { id, tenant_id, equipment_id, location, status } = equipmentTracking;
    if (!id || !tenant_id) {
      throw new Error('ID and tenant_id are required for update');
    }

    const setClauses: string[] = [];
    const values: any[] = [id, tenant_id];
    let paramIndex = 3;

    if (equipment_id !== undefined) {
      setClauses.push(`equipment_id = $${paramIndex}`);
      values.push(equipment_id);
      paramIndex++;
    }

    if (location !== undefined) {
      setClauses.push(`location = $${paramIndex}`);
      values.push(location);
      paramIndex++;
    }

    if (status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    const query = `
      UPDATE equipment_tracking
      SET ${setClauses.join(', ')}, last_updated = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result: QueryResult<EquipmentTracking> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete an equipment tracking record
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = 'DELETE FROM equipment_tracking WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenant_id];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This `EquipmentTrackingRepository` class provides the following functionality:

1. **Create**: The `create` method inserts a new equipment tracking record into the database, automatically setting the `last_updated` field to the current timestamp.

2. **Read**: The `read` method retrieves equipment tracking records for a specific tenant. It can optionally filter by `equipment_id`.

3. **Update**: The `update` method updates an existing equipment tracking record. It dynamically builds the SQL query based on the provided fields and always updates the `last_updated` field.

4. **Delete**: The `delete` method removes an equipment tracking record based on its `id` and `tenant_id`.

All methods use parameterized queries to prevent SQL injection attacks. The `tenant_id` is included in all queries to ensure multi-tenant support.

To use this repository in your `equipment-tracking.routes.ts` file, you would typically instantiate it with a database connection pool and then call its methods from your route handlers. For example:


// api/src/routes/equipment-tracking.routes.ts

import express from 'express';
import { Pool } from 'pg';
import { EquipmentTrackingRepository } from '../repositories/EquipmentTrackingRepository';

const router = express.Router();
const pool = new Pool(/* your database configuration */);
const equipmentTrackingRepository = new EquipmentTrackingRepository(pool);

// Example route for creating a new equipment tracking record
router.post('/', async (req, res) => {
  try {
    const newEquipmentTracking = await equipmentTrackingRepository.create(req.body);
    res.status(201).json(newEquipmentTracking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create equipment tracking record' });
  }
});

// Add more routes for read, update, and delete operations...

export default router;


This repository provides a solid foundation for handling equipment tracking data in a multi-tenant environment with TypeScript and PostgreSQL. You can further extend it by adding more specific query methods or implementing additional features as needed.