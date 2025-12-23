import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface InspectionTemplate {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  items: any;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class InspectionTemplatesRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('inspection_templates', pool);
    this.pool = pool;
  }

  async findAll(tenantId: number): Promise<InspectionTemplate[]> {
    const query = `SELECT id, tenant_id, name, description, items, created_at, updated_at FROM inspection_templates WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result: QueryResult<InspectionTemplate> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<InspectionTemplate | null> {
    const query = `SELECT id, tenant_id, name, description, items, created_at, updated_at FROM inspection_templates WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result: QueryResult<InspectionTemplate> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(tenantId: number, template: Omit<InspectionTemplate, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<InspectionTemplate> {
    const query = `INSERT INTO inspection_templates (tenant_id, name, description, items, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`;
    const values = [tenantId, template.name, template.description, template.items];
    const result: QueryResult<InspectionTemplate> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, tenantId: number, template: Partial<InspectionTemplate>): Promise<InspectionTemplate | null> {
    const setClause = Object.keys(template)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.findById(id, tenantId);
    }

    const query = `UPDATE inspection_templates SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(template)];
    const result: QueryResult<InspectionTemplate> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `UPDATE inspection_templates SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}