import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export class CommunicationsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createCommunication(
    tenant_id: string,
    type: string,
    content: string,
    sender_id: string,
    recipient_id: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO communications (tenant_id, type, content, sender_id, recipient_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    const values = [tenant_id, type, content, sender_id, recipient_id];
    return this.pool.query(query, values);
  }

  async getCommunicationById(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM communications
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }

  async getAllCommunications(tenant_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM communications
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    return this.pool.query(query, values);
  }

  async updateCommunication(
    tenant_id: string,
    id: string,
    type: string,
    content: string
  ): Promise<QueryResult> {
    const query = `
      UPDATE communications
      SET type = $1, content = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING id, updated_at
    `;
    const values = [type, content, id, tenant_id];
    return this.pool.query(query, values);
  }

  async deleteCommunication(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM communications
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM communications t
    WHERE t.id = \api/src/repositories/communications.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM communications t
    WHERE t.tenant_id = \api/src/repositories/communications.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
