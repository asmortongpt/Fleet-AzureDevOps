import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository called `DataExportRepository` for the `api/src/routes/data-export.routes.ts` file. We'll implement parameterized queries, include `tenant_id` in our operations, and provide CRUD functionality. Here's a step-by-step approach:

1. We'll create a new file called `data-export.repository.ts` in the `api/src/repositories` directory.
2. We'll use a database connection (assuming we're using PostgreSQL with a library like `pg`).
3. We'll implement CRUD operations with parameterized queries.
4. We'll include `tenant_id` in all operations to ensure multi-tenant support.

Here's the implementation:


// api/src/repositories/data-export.repository.ts

import { Pool, QueryResult } from 'pg';

interface DataExport {
  id: number;
  tenant_id: string;
  name: string;
  file_path: string;
  created_at: Date;
  updated_at: Date;
}

export class DataExportRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new data export record
   * @param dataExport - The data export object to be created
   * @returns The created data export object
   */
  async create(dataExport: Omit<DataExport, 'id' | 'created_at' | 'updated_at'>): Promise<DataExport> {
    const query = `
      INSERT INTO data_exports (tenant_id, name, file_path)
      VALUES ($1, $2, $3)
      RETURNING id, tenant_id, name, file_path, created_at, updated_at;
    `;
    const values = [dataExport.tenant_id, dataExport.name, dataExport.file_path];

    const result: QueryResult<DataExport> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Read a data export record by ID
   * @param id - The ID of the data export to read
   * @param tenant_id - The tenant ID to filter the data export
   * @returns The data export object if found, null otherwise
   */
  async read(id: number, tenant_id: string): Promise<DataExport | null> {
    const query = `
      SELECT id, tenant_id, name, file_path, created_at, updated_at
      FROM data_exports
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<DataExport> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update an existing data export record
   * @param id - The ID of the data export to update
   * @param dataExport - The updated data export object
   * @param tenant_id - The tenant ID to filter the data export
   * @returns The updated data export object if found, null otherwise
   */
  async update(id: number, dataExport: Partial<Omit<DataExport, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>>, tenant_id: string): Promise<DataExport | null> {
    const setClause = Object.keys(dataExport)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = [id, tenant_id, ...Object.values(dataExport)];

    const query = `
      UPDATE data_exports
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, tenant_id, name, file_path, created_at, updated_at;
    `;

    const result: QueryResult<DataExport> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a data export record
   * @param id - The ID of the data export to delete
   * @param tenant_id - The tenant ID to filter the data export
   * @returns True if the data export was deleted, false otherwise
   */
  async delete(id: number, tenant_id: string): Promise<boolean> {
    const query = `
      DELETE FROM data_exports
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * List all data exports for a tenant
   * @param tenant_id - The tenant ID to filter the data exports
   * @returns An array of data export objects
   */
  async list(tenant_id: string): Promise<DataExport[]> {
    const query = `
      SELECT id, tenant_id, name, file_path, created_at, updated_at
      FROM data_exports
      WHERE tenant_id = $1;
    `;
    const values = [tenant_id];

    const result: QueryResult<DataExport> = await this.pool.query(query, values);
    return result.rows;
  }
}


This implementation includes the following features:

1. **Parameterized queries**: All SQL queries use parameterized statements to prevent SQL injection attacks.

2. **Tenant ID**: The `tenant_id` is included in all operations to ensure multi-tenant support. This allows for data isolation between different tenants.

3. **CRUD operations**:
   - `create`: Creates a new data export record.
   - `read`: Retrieves a specific data export by ID and tenant ID.
   - `update`: Updates an existing data export record.
   - `delete`: Deletes a specific data export by ID and tenant ID.
   - `list`: Retrieves all data exports for a given tenant ID.

4. **Type safety**: We've defined an interface `DataExport` to ensure type safety throughout the repository.

5. **Error handling**: The repository doesn't explicitly handle errors, but it returns `null` or `false` when operations fail to find or affect records. You may want to add more robust error handling depending on your application's needs.

To use this repository in your `data-export.routes.ts` file, you would typically inject the `DataExportRepository` instance into your route handlers. Here's a brief example of how you might use it:


// api/src/routes/data-export.routes.ts

import { Router } from 'express';
import { DataExportRepository } from '../repositories/data-export.repository';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool(); // Initialize your database connection
const dataExportRepository = new DataExportRepository(pool);

router.post('/', async (req, res) => {
  const { tenant_id, name, file_path } = req.body;
  const newDataExport = await dataExportRepository.create({ tenant_id, name, file_path });
  res.json(newDataExport);
});

// Add more routes for read, update, delete, and list operations

export default router;


Remember to set up your database connection properly and adjust the implementation according to your specific needs and database schema.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM dataexport t
    WHERE t.id = \api/src/repositories/dataexport.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM dataexport t
    WHERE t.tenant_id = \api/src/repositories/dataexport.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
