Let's create a TypeScript repository called `DepreciationRepository` for handling depreciation-related operations. We'll implement CRUD operations with parameterized queries and include tenant_id for multi-tenant support. Here's a step-by-step approach:

1. Define the interface for depreciation data
2. Create the DepreciationRepository class
3. Implement CRUD operations with parameterized queries
4. Include tenant_id in all queries

Here's the implementation:


import { PoolClient } from 'pg';

// Define the interface for depreciation data
interface Depreciation {
  id: number;
  asset_id: number;
  depreciation_date: Date;
  depreciation_amount: number;
  tenant_id: number;
}

// DepreciationRepository class
class DepreciationRepository {
  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  // Create a new depreciation record
  async create(depreciation: Omit<Depreciation, 'id'>): Promise<Depreciation> {
    const query = `
      INSERT INTO depreciations (asset_id, depreciation_date, depreciation_amount, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, asset_id, depreciation_date, depreciation_amount, tenant_id
    `;
    const values = [
      depreciation.asset_id,
      depreciation.depreciation_date,
      depreciation.depreciation_amount,
      depreciation.tenant_id
    ];

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows[0];
  }

  // Read a depreciation record by id
  async read(id: number, tenant_id: number): Promise<Depreciation | null> {
    const query = `
      SELECT id, asset_id, depreciation_date, depreciation_amount, tenant_id
      FROM depreciations
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows[0] || null;
  }

  // Update a depreciation record
  async update(id: number, depreciation: Partial<Depreciation>, tenant_id: number): Promise<Depreciation | null> {
    const setColumns: string[] = [];
    const values: any[] = [id, tenant_id];

    if (depreciation.asset_id !== undefined) {
      setColumns.push(`asset_id = $${setColumns.length + 3}`);
      values.push(depreciation.asset_id);
    }
    if (depreciation.depreciation_date !== undefined) {
      setColumns.push(`depreciation_date = $${setColumns.length + 3}`);
      values.push(depreciation.depreciation_date);
    }
    if (depreciation.depreciation_amount !== undefined) {
      setColumns.push(`depreciation_amount = $${setColumns.length + 3}`);
      values.push(depreciation.depreciation_amount);
    }

    if (setColumns.length === 0) {
      return null; // Nothing to update
    }

    const query = `
      UPDATE depreciations
      SET ${setColumns.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, asset_id, depreciation_date, depreciation_amount, tenant_id
    `;

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows[0] || null;
  }

  // Delete a depreciation record
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM depreciations
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];

    const result = await this.client.query<{ id: number }>(query, values);
    return result.rowCount > 0;
  }

  // List depreciation records for a tenant
  async list(tenant_id: number, limit: number = 10, offset: number = 0): Promise<Depreciation[]> {
    const query = `
      SELECT id, asset_id, depreciation_date, depreciation_amount, tenant_id
      FROM depreciations
      WHERE tenant_id = $1
      ORDER BY depreciation_date DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [tenant_id, limit, offset];

    const result = await this.client.query<Depreciation>(query, values);
    return result.rows;
  }
}

export default DepreciationRepository;


This implementation includes the following features:

1. A `Depreciation` interface to define the structure of depreciation data.
2. A `DepreciationRepository` class that encapsulates all CRUD operations.
3. Parameterized queries to prevent SQL injection and improve performance.
4. Inclusion of `tenant_id` in all queries to support multi-tenant functionality.
5. CRUD operations:
   - `create`: Inserts a new depreciation record.
   - `read`: Retrieves a depreciation record by id and tenant_id.
   - `update`: Updates a depreciation record, allowing partial updates.
   - `delete`: Deletes a depreciation record by id and tenant_id.
   - `list`: Retrieves a list of depreciation records for a specific tenant, with pagination support.

To use this repository in your `api/src/routes/depreciation.routes.ts`, you would typically create an instance of the repository and use its methods to handle database operations. Here's a basic example of how you might use it in your routes:


import express from 'express';
import { PoolClient } from 'pg';
import DepreciationRepository from '../repositories/DepreciationRepository';

const router = express.Router();

router.post('/', async (req, res) => {
  const client: PoolClient = req.app.get('dbClient');
  const depreciationRepository = new DepreciationRepository(client);

  try {
    const newDepreciation = await depreciationRepository.create({
      asset_id: req.body.asset_id,
      depreciation_date: new Date(req.body.depreciation_date),
      depreciation_amount: req.body.depreciation_amount,
      tenant_id: req.tenant_id // Assuming you have a middleware to set this
    });
    res.status(201).json(newDepreciation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create depreciation' });
  }
});

// Implement other routes (GET, PUT, DELETE) similarly

export default router;


This implementation provides a solid foundation for handling depreciation data in your application, with proper database abstraction, multi-tenant support, and parameterized queries for security and performance.