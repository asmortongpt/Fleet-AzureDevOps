import { Pool, QueryResult } from 'pg';
import { BaseRepository } from './BaseRepository';

interface OshaCompliance {
  id: number;
  title: string;
  description: string;
  status: string;
  due_date: Date;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export class OshaComplianceRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('osha_compliance', pool);
    this.pool = pool;
  }

  async getAllOshaCompliances(tenantId: number): Promise<OshaCompliance[]> {
    const query = 'SELECT id, title, description, status, due_date, tenant_id, created_at, updated_at FROM osha_compliance WHERE tenant_id = $1';
    const result: QueryResult<OshaCompliance> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getOshaComplianceById(id: number, tenantId: number): Promise<OshaCompliance | null> {
    const query = 'SELECT id, title, description, status, due_date, tenant_id, created_at, updated_at FROM osha_compliance WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult<OshaCompliance> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async createOshaCompliance(
    data: {
      title: string;
      description: string;
      status: string;
      due_date: Date;
    },
    tenantId: number
  ): Promise<OshaCompliance> {
    const query = `
      INSERT INTO osha_compliance (title, description, status, due_date, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.title,
      data.description,
      data.status,
      data.due_date,
      tenantId,
    ];
    const result: QueryResult<OshaCompliance> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateOshaCompliance(
    id: number,
    data: {
      title?: string;
      description?: string;
      status?: string;
      due_date?: Date;
    },
    tenantId: number
  ): Promise<OshaCompliance | null> {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE osha_compliance
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(data).length + 2}
      RETURNING *
    `;
    const values = [id, ...Object.values(data), tenantId];
    const result: QueryResult<OshaCompliance> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteOshaCompliance(id: number, tenantId: number): Promise<boolean> {
    const query = 'DELETE FROM osha_compliance WHERE id = $1 AND tenant_id = $2 RETURNING id';
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
