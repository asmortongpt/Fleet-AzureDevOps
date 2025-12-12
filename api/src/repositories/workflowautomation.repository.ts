import { BaseRepository } from '../repositories/BaseRepository';

Let's create a TypeScript repository for workflow automation, focusing on CRUD operations with parameterized queries and tenant_id support. We'll name it `WorkflowAutomationRepository` and place it in the `api/src/repositories` directory.

Here's the implementation:


// api/src/repositories/WorkflowAutomationRepository.ts

import { Pool, QueryResult } from 'pg';
import { WorkflowAutomation } from '../models/WorkflowAutomation';

export class WorkflowAutomationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Creates a new workflow automation entry
   * @param workflowAutomation - The workflow automation object to be created
   * @param tenantId - The tenant ID associated with the workflow automation
   * @returns The created workflow automation object
   */
  async create(workflowAutomation: WorkflowAutomation, tenantId: string): Promise<WorkflowAutomation> {
    const query = `
      INSERT INTO workflow_automations (name, description, configuration, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, configuration, created_at, updated_at
    `;
    const values = [
      workflowAutomation.name,
      workflowAutomation.description,
      JSON.stringify(workflowAutomation.configuration),
      tenantId
    ];

    const result: QueryResult<WorkflowAutomation> = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Retrieves a workflow automation by its ID
   * @param id - The ID of the workflow automation to retrieve
   * @param tenantId - The tenant ID associated with the workflow automation
   * @returns The retrieved workflow automation object
   */
  async read(id: string, tenantId: string): Promise<WorkflowAutomation | null> {
    const query = `
      SELECT id, name, description, configuration, created_at, updated_at
      FROM workflow_automations
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];

    const result: QueryResult<WorkflowAutomation> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Updates an existing workflow automation
   * @param id - The ID of the workflow automation to update
   * @param workflowAutomation - The updated workflow automation object
   * @param tenantId - The tenant ID associated with the workflow automation
   * @returns The updated workflow automation object
   */
  async update(id: string, workflowAutomation: WorkflowAutomation, tenantId: string): Promise<WorkflowAutomation | null> {
    const query = `
      UPDATE workflow_automations
      SET name = $1, description = $2, configuration = $3, updated_at = NOW()
      WHERE id = $4 AND tenant_id = $5
      RETURNING id, name, description, configuration, created_at, updated_at
    `;
    const values = [
      workflowAutomation.name,
      workflowAutomation.description,
      JSON.stringify(workflowAutomation.configuration),
      id,
      tenantId
    ];

    const result: QueryResult<WorkflowAutomation> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Deletes a workflow automation by its ID
   * @param id - The ID of the workflow automation to delete
   * @param tenantId - The tenant ID associated with the workflow automation
   * @returns True if the workflow automation was successfully deleted, false otherwise
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM workflow_automations
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];

    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  /**
   * Lists all workflow automations for a given tenant
   * @param tenantId - The tenant ID to filter workflow automations
   * @returns An array of workflow automation objects
   */
  async list(tenantId: string): Promise<WorkflowAutomation[]> {
    const query = `
      SELECT id, name, description, configuration, created_at, updated_at
      FROM workflow_automations
      WHERE tenant_id = $1
    `;
    const values = [tenantId];

    const result: QueryResult<WorkflowAutomation> = await this.pool.query(query, values);
    return result.rows;
  }
}


This implementation includes the following features:

1. **Parameterized Queries**: All SQL queries use parameterized queries to prevent SQL injection attacks.

2. **Tenant ID**: Each method includes a `tenantId` parameter to ensure multi-tenant support. The `tenant_id` is used in all queries to filter results for the specific tenant.

3. **CRUD Operations**: The repository provides methods for Create, Read, Update, and Delete operations on workflow automations.

4. **JSON Configuration**: The `configuration` field is stored as JSON in the database and converted to/from a string in the repository methods.

5. **TypeScript**: The code is written in TypeScript, with proper type annotations for better code quality and maintainability.

6. **Error Handling**: The repository doesn't explicitly handle errors, but it returns `null` or `false` for unsuccessful operations. You may want to add more robust error handling depending on your application's requirements.

To use this repository in your `workflow-automation.routes.ts` file, you would typically inject it into your route handlers. Here's a basic example of how you might use it:


// api/src/routes/workflow-automation.routes.ts

import express from 'express';
import { WorkflowAutomationRepository } from '../repositories/WorkflowAutomationRepository';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool(/* your database configuration */);
const workflowAutomationRepository = new WorkflowAutomationRepository(pool);

// Example route for creating a new workflow automation
router.post('/workflow-automations', async (req, res) => {
  const { name, description, configuration } = req.body;
  const tenantId = req.headers['x-tenant-id'] as string; // Assuming tenant ID is passed in the headers

  try {
    const newWorkflowAutomation = await workflowAutomationRepository.create(
      { name, description, configuration },
      tenantId
    );
    res.status(201).json(newWorkflowAutomation);
  } catch (error) {
    console.error('Error creating workflow automation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add more routes for read, update, delete, and list operations

export default router;


Remember to adjust the database connection and error handling according to your specific application requirements. Also, ensure that you have the necessary database schema set up to match the queries in the repository.