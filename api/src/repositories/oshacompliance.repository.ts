import { Pool, QueryResult } from 'pg';

class OshaComplianceRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAllOshaCompliances(tenantId: string): Promise<QueryResult> {
    const query = 'SELECT * FROM osha_compliance WHERE tenant_id = $1';
    return this.pool.query(query, [tenantId]);
  }

  async getOshaComplianceById(id: string, tenantId: string): Promise<QueryResult> {
    const query = 'SELECT * FROM osha_compliance WHERE id = $1 AND tenant_id = $2';
    return this.pool.query(query, [id, tenantId]);
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
    return this.pool.query(query, values);
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
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const query = `
      UPDATE osha_compliance
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(data).length + 2}
      RETURNING *
    `;
    const values = [...Object.values(data), id, tenantId];
    return this.pool.query(query, values);
  }

  async deleteOshaCompliance(id: string, tenantId: string): Promise<QueryResult> {
    const query = 'DELETE FROM osha_compliance WHERE id = $1 AND tenant_id = $2 RETURNING *';
    return this.pool.query(query, [id, tenantId]);
  }
}

export default OshaComplianceRepository;