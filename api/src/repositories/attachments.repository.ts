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