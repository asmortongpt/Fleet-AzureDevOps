import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface CustomField {
  id: number;
  tenant_id: string;
  name: string;
  type: string;
  options: any;
  is_required: boolean;
  created_at: Date;
  updated_at: Date;
}

export class CustomFieldsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('custom_fields', pool);
    this.pool = pool;
  }

  async createCustomField(tenantId: string, data: any): Promise<CustomField> {
    const query = `
      INSERT INTO custom_fields (tenant_id, name, type, options, is_required, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [tenantId, data.name, data.type, data.options, data.is_required];
    const result: QueryResult<CustomField> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getCustomFieldById(tenantId: string, id: number): Promise<CustomField | null> {
    const query = `
      SELECT id, tenant_id, name, type, options, is_required, created_at, updated_at FROM custom_fields
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    const result: QueryResult<CustomField> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async getAllCustomFields(tenantId: string): Promise<CustomField[]> {
    const query = `
      SELECT id, tenant_id, name, type, options, is_required, created_at, updated_at FROM custom_fields
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result: QueryResult<CustomField> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async updateCustomField(tenantId: string, id: number, data: any): Promise<CustomField | null> {
    const query = `
      UPDATE custom_fields
      SET name = $1, type = $2, options = $3, is_required = $4, updated_at = NOW()
      WHERE id = $5 AND tenant_id = $6
      RETURNING *
    `;
    const values = [data.name, data.type, data.options, data.is_required, id, tenantId];
    const result: QueryResult<CustomField> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteCustomField(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM custom_fields
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenantId];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getCustomFieldsByType(tenantId: string, type: string): Promise<CustomField[]> {
    const query = `
      SELECT id, tenant_id, name, type, options, is_required, created_at, updated_at FROM custom_fields
      WHERE tenant_id = $1 AND type = $2
      ORDER BY created_at DESC
    `;
    const result: QueryResult<CustomField> = await this.pool.query(query, [tenantId, type]);
    return result.rows;
  }
}