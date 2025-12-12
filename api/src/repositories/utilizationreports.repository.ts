import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository called `UtilizationReportsRepository` for the `utilization-reports.routes.ts` file, we'll need to implement CRUD operations with parameterized queries and support for a `tenant_id`. Let's break this down step-by-step:

1. First, we'll create the repository file.
2. We'll implement the CRUD operations using parameterized queries.
3. We'll include the `tenant_id` in all queries to ensure multi-tenant support.

Here's the implementation:


// api/src/repositories/UtilizationReportsRepository.ts

import { Pool, QueryResult } from 'pg';

interface UtilizationReport {
  id: number;
  tenant_id: number;
  report_date: Date;
  usage_hours: number;
  cost: number;
  // Add other fields as needed
}

export class UtilizationReportsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new utilization report
   * @param report - The utilization report to create
   * @returns The created utilization report
   */
  async create(report: Omit<UtilizationReport, 'id'>): Promise<UtilizationReport> {
    const query = `
      INSERT INTO utilization_reports (tenant_id, report_date, usage_hours, cost)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [report.tenant_id, report.report_date, report.usage_hours, report.cost];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Read a utilization report by id
   * @param id - The id of the utilization report to read
   * @param tenant_id - The tenant id to filter by
   * @returns The utilization report, or null if not found
   */
  async read(id: number, tenant_id: number): Promise<UtilizationReport | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM utilization_reports
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update a utilization report
   * @param id - The id of the utilization report to update
   * @param report - The updated utilization report data
   * @param tenant_id - The tenant id to filter by
   * @returns The updated utilization report, or null if not found
   */
  async update(id: number, report: Partial<UtilizationReport>, tenant_id: number): Promise<UtilizationReport | null> {
    const setClause = Object.keys(report)
      .filter(key => key !== 'id' && key !== 'tenant_id')
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE utilization_reports
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `;
    const values = [id, tenant_id, ...Object.values(report).filter(value => value !== undefined)];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a utilization report
   * @param id - The id of the utilization report to delete
   * @param tenant_id - The tenant id to filter by
   * @returns True if the report was deleted, false otherwise
   */
  async delete(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM utilization_reports
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenant_id];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * List utilization reports for a tenant
   * @param tenant_id - The tenant id to filter by
   * @param limit - The maximum number of reports to return
   * @param offset - The number of reports to skip
   * @returns An array of utilization reports
   */
  async list(tenant_id: number, limit: number = 10, offset: number = 0): Promise<UtilizationReport[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM utilization_reports
      WHERE tenant_id = $1
      ORDER BY report_date DESC
      LIMIT $2 OFFSET $3;
    `;
    const values = [tenant_id, limit, offset];

    const result: QueryResult<UtilizationReport> = await this.pool.query(query, values);
    return result.rows;
  }
}


This implementation includes the following features:

1. **Parameterized Queries**: All SQL queries use parameterized queries to prevent SQL injection attacks.

2. **CRUD Operations**: The repository implements Create, Read, Update, and Delete operations for utilization reports.

3. **Tenant ID**: All operations include the `tenant_id` parameter to ensure multi-tenant support. This allows the system to isolate data for different tenants.

4. **Type Safety**: The repository uses TypeScript interfaces to define the structure of utilization reports, ensuring type safety throughout the application.

5. **Pagination**: The `list` method supports pagination with `limit` and `offset` parameters.

To use this repository in your `utilization-reports.routes.ts` file, you would typically inject the `UtilizationReportsRepository` into your route handlers. Here's a basic example of how you might use it:


// api/src/routes/utilization-reports.routes.ts

import express from 'express';
import { UtilizationReportsRepository } from '../repositories/UtilizationReportsRepository';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool(/* your database configuration */);
const utilizationReportsRepository = new UtilizationReportsRepository(pool);

router.post('/', async (req, res) => {
  try {
    const report = await utilizationReportsRepository.create(req.body);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create utilization report' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const report = await utilizationReportsRepository.read(parseInt(req.params.id), req.tenant_id);
    if (report) {
      res.json(report);
    } else {
      res.status(404).json({ error: 'Utilization report not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve utilization report' });
  }
});

// Implement other routes for update, delete, and list operations

export default router;


Remember to adjust the database connection and error handling according to your application's specific needs. Also, ensure that you're properly validating and sanitizing input data before passing it to the repository methods.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM utilizationreports t
    WHERE t.id = \api/src/repositories/utilizationreports.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM utilizationreports t
    WHERE t.tenant_id = \api/src/repositories/utilizationreports.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
