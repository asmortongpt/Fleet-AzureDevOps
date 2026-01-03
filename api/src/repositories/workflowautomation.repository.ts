import { Pool, QueryResult } from 'pg';

import { WorkflowAutomation } from '../models/WorkflowAutomation';

import { BaseRepository } from './base/BaseRepository';

export class WorkflowAutomationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('workflow_automations', pool);
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
    return result.rowCount ? result.rowCount > 0 : false;
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