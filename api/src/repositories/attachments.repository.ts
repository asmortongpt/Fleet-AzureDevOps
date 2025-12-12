import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export class AttachmentsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createAttachment(
    tenant_id: string,
    file_name: string,
    file_type: string,
    file_size: number,
    file_path: string
  ): Promise<number> {
    const query = `
      INSERT INTO attachments (tenant_id, file_name, file_type, file_size, file_path)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [tenant_id, file_name, file_type, file_size, file_path];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0].id;
  }

  async getAttachmentById(tenant_id: string, id: number): Promise<any> {
    const query = `
      SELECT id, created_at, updated_at FROM attachments
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAllAttachments(tenant_id: string): Promise<any[]> {
    const query = `
      SELECT id, created_at, updated_at FROM attachments
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rows;
  }

  async updateAttachment(
    tenant_id: string,
    id: number,
    file_name: string,
    file_type: string,
    file_size: number,
    file_path: string
  ): Promise<void> {
    const query = `
      UPDATE attachments
      SET file_name = $3, file_type = $4, file_size = $5, file_path = $6
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id, file_name, file_type, file_size, file_path];
    await this.pool.query(query, values);
  }

  async deleteAttachment(tenant_id: string, id: number): Promise<void> {
    const query = `
      DELETE FROM attachments
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    await this.pool.query(query, values);
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM attachments t
    WHERE t.id = \api/src/repositories/attachments.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM attachments t
    WHERE t.tenant_id = \api/src/repositories/attachments.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
