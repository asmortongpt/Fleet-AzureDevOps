import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export class PolicyTemplatesRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAllPolicyTemplates(tenantId: string): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at FROM policy_templates
      WHERE tenant_id = $1
      ORDER BY created_at DESC;
    `;
    return this.pool.query(query, [tenantId]);
  }

  async getPolicyTemplateById(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at FROM policy_templates
      WHERE tenant_id = $1 AND id = $2;
    `;
    return this.pool.query(query, [tenantId, id]);
  }

  async createPolicyTemplate(tenantId: string, name: string, description: string, content: string): Promise<QueryResult> {
    const query = `
      INSERT INTO policy_templates (tenant_id, name, description, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *;
    `;
    return this.pool.query(query, [tenantId, name, description, content]);
  }

  async updatePolicyTemplate(tenantId: string, id: string, name: string, description: string, content: string): Promise<QueryResult> {
    const query = `
      UPDATE policy_templates
      SET name = $3, description = $4, content = $5, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2
      RETURNING *;
    `;
    return this.pool.query(query, [tenantId, id, name, description, content]);
  }

  async deletePolicyTemplate(tenantId: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM policy_templates
      WHERE tenant_id = $1 AND id = $2
      RETURNING *;
    `;
    return this.pool.query(query, [tenantId, id]);
  }
}