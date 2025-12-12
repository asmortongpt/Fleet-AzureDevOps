import { Pool, QueryResult } from 'pg';

class CertificationsRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAllCertifications(tenantId: string): Promise<QueryResult> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM certifications WHERE tenant_id = $1';
    return this.pool.query(query, [tenantId]);
  }

  async getCertificationById(certificationId: string, tenantId: string): Promise<QueryResult> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM certifications WHERE id = $1 AND tenant_id = $2';
    return this.pool.query(query, [certificationId, tenantId]);
  }

  async createCertification(certificationData: { name: string; description: string; tenant_id: string }): Promise<QueryResult> {
    const query = 'INSERT INTO certifications (name, description, tenant_id) VALUES ($1, $2, $3) RETURNING *';
    const { name, description, tenant_id } = certificationData;
    return this.pool.query(query, [name, description, tenant_id]);
  }

  async updateCertification(certificationId: string, certificationData: { name?: string; description?: string }, tenantId: string): Promise<QueryResult> {
    const { name, description } = certificationData;
    const setClause = [];
    const values = [];

    if (name !== undefined) {
      setClause.push('name = $' + (setClause.length + 1));
      values.push(name);
    }
    if (description !== undefined) {
      setClause.push('description = $' + (setClause.length + 1));
      values.push(description);
    }

    values.push(certificationId);
    values.push(tenantId);

    const query = `UPDATE certifications SET ${setClause.join(', ')} WHERE id = $${values.length - 1} AND tenant_id = $${values.length} RETURNING *`;
    return this.pool.query(query, values);
  }

  async deleteCertification(certificationId: string, tenantId: string): Promise<QueryResult> {
    const query = 'DELETE FROM certifications WHERE id = $1 AND tenant_id = $2 RETURNING *';
    return this.pool.query(query, [certificationId, tenantId]);
  }
}

export default CertificationsRepository;
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM certifications t
    WHERE t.id = \api/src/repositories/certifications.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM certifications t
    WHERE t.tenant_id = \api/src/repositories/certifications.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
