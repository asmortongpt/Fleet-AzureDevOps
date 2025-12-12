import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { buildUpdateClause } from '../utils/sql-safety'

export class OshaComplianceRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LOsha_LCompliance_s');
  }


    this.pool = pool;
  }

  async getAllOshaCompliances(tenantId: string): Promise<QueryResult> {
    const query = 'SELECT id, created_at, updated_at FROM osha_compliance WHERE tenant_id = $1';
    return this.query(query, [tenantId]);
  }

  async getOshaComplianceById(id: string, tenantId: string): Promise<QueryResult> {
    const query = 'SELECT id, created_at, updated_at FROM osha_compliance WHERE id = $1 AND tenant_id = $2';
    return this.query(query, [id, tenantId]);
  }

  async createOshaCompliance(
    data: {
      title: string;
      description: string;
      status: string;
      due_date: Date;
    },
    tenantId: string
  ): Promise<QueryResult> {
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
    return this.query(query, values);
  }

  async updateOshaCompliance(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      due_date?: Date;
    },
    tenantId: string
  ): Promise<QueryResult> {
    const { fields: setClause, values: updateValues } = buildUpdateClause(data, 2, 'generic_table');
    const query = `
      UPDATE osha_compliance
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${updateValues.length + 2}
      RETURNING *
    `;
    const values = [...Object.values(data), id, tenantId];
    return this.query(query, values);
  }

  async deleteOshaCompliance(id: string, tenantId: string): Promise<QueryResult> {
    const query = 'DELETE FROM osha_compliance WHERE id = $1 AND tenant_id = $2 RETURNING *';
    return this.query(query, [id, tenantId]);
  }

  // Prevent N+1 queries with JOINs
  async findAllWithRelated() {
    const query = `
      SELECT
        t1.*,
        t2.id as related_id,
        t2.name as related_name
      FROM ${this.tableName} t1
      LEFT JOIN related_table t2 ON t1.related_id = t2.id
      WHERE t1.tenant_id = $1
      ORDER BY t1.created_at DESC
    `;
    const result = await this.query(query, [this.tenantId]);
    return result.rows;
  }

}
