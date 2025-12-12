import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository class called `EngineDiagnosticsRepository` for handling CRUD operations on engine diagnostics data. We'll use parameterized queries to prevent SQL injection and include a `tenant_id` to support multi-tenant functionality.

Here's the implementation:


import { Pool, QueryResult } from 'pg';

interface EngineDiagnostics {
  id: number;
  vehicle_id: number;
  timestamp: Date;
  engine_temperature: number;
  oil_pressure: number;
  rpm: number;
  fuel_level: number;
  tenant_id: number;
}

export class EngineDiagnosticsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new engine diagnostics entry
  async create(engineDiagnostics: Omit<EngineDiagnostics, 'id'>, tenant_id: number): Promise<EngineDiagnostics> {
    const query = `
      INSERT INTO engine_diagnostics (vehicle_id, timestamp, engine_temperature, oil_pressure, rpm, fuel_level, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      engineDiagnostics.vehicle_id,
      engineDiagnostics.timestamp,
      engineDiagnostics.engine_temperature,
      engineDiagnostics.oil_pressure,
      engineDiagnostics.rpm,
      engineDiagnostics.fuel_level,
      tenant_id
    ];

    const result: QueryResult<EngineDiagnostics> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read engine diagnostics entries for a specific vehicle and tenant
  async readByVehicleId(vehicle_id: number, tenant_id: number): Promise<EngineDiagnostics[]> {
    const query = `
      SELECT id, created_at, updated_at FROM engine_diagnostics
      WHERE vehicle_id = $1 AND tenant_id = $2
      ORDER BY timestamp DESC
    `;
    const values = [vehicle_id, tenant_id];

    const result: QueryResult<EngineDiagnostics> = await this.pool.query(query, values);
    return result.rows;
  }

  // Update an existing engine diagnostics entry
  async update(id: number, engineDiagnostics: Partial<EngineDiagnostics>, tenant_id: number): Promise<EngineDiagnostics | null> {
    // Filter out id and tenant_id, then use safe SQL builder
    const filtered = Object.keys(engineDiagnostics).filter(key => key !== 'id' && key !== 'tenant_id').reduce((obj: any, key) => { obj[key] = engineDiagnostics[key]; return obj; }, {});
    const { fields: setClause, values: updateValues } = buildUpdateClause(filtered, 2, 'engine_diagnostics');

    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE engine_diagnostics
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(engineDiagnostics).length + 2}
      RETURNING *
    `;
    const values = [id, ...Object.values(engineDiagnostics), tenant_id];

    const result: QueryResult<EngineDiagnostics> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete an engine diagnostics entry
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM engine_diagnostics
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }
}


This `EngineDiagnosticsRepository` class provides the following CRUD operations:

1. `create`: Inserts a new engine diagnostics entry for a given tenant.
2. `readByVehicleId`: Retrieves all engine diagnostics entries for a specific vehicle and tenant.
3. `update`: Updates an existing engine diagnostics entry for a given tenant.
4. `delete`: Deletes an engine diagnostics entry for a given tenant.

Key features of this implementation:

- Parameterized queries are used throughout to prevent SQL injection.
- The `tenant_id` is included in all queries to ensure multi-tenant support.
- The `EngineDiagnostics` interface defines the structure of the data.
- The class uses a `Pool` object from the `pg` package, which should be injected when creating an instance of the repository.

To use this repository in your `engine-diagnostics.routes.ts` file, you would typically create an instance of the repository and use its methods in your route handlers. For example:


import { Router } from 'express';
import { Pool } from 'pg';
import { EngineDiagnosticsRepository } from './EngineDiagnosticsRepository';
import { buildUpdateClause } from '../utils/sql-safety'

const router = Router();
const pool = new Pool(/* your database connection details */);
const engineDiagnosticsRepository = new EngineDiagnosticsRepository(pool);

// Example route handler using the repository
router.post('/', async (req, res) => {
  try {
    const newDiagnostics = await engineDiagnosticsRepository.create(req.body, req.tenant_id);
    res.status(201).json(newDiagnostics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create engine diagnostics entry' });
  }
});

// Add more routes for read, update, and delete operations

export default router;


Remember to adjust the import paths and error handling according to your project's structure and requirements.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM enginediagnostics t
    WHERE t.id = \api/src/repositories/enginediagnostics.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM enginediagnostics t
    WHERE t.tenant_id = \api/src/repositories/enginediagnostics.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
