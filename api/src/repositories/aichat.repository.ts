import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class AiChatRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LAi_LChat_s');
  }


    this.pool = pool;
  }

  async createAiChat(tenantId: string, userId: string, message: string, response: string): Promise<number> {
    const query = `
      INSERT INTO ai_chats (tenant_id, user_id, message, response, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;
    const values = [tenantId, userId, message, response];
    const result: QueryResult = await this.query(query, values);
    return result.rows[0].id;
  }

  async getAiChatById(tenantId: string, id: number): Promise<any> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM ai_chats
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    const result: QueryResult = await this.query(query, values);
    return result.rows[0];
  }

  async getAiChatsByUserId(tenantId: string, userId: string): Promise<any[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM ai_chats
      WHERE user_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
    `;
    const values = [userId, tenantId];
    const result: QueryResult = await this.query(query, values);
    return result.rows;
  }

  async updateAiChat(tenantId: string, id: number, message: string, response: string): Promise<void> {
    const query = `
      UPDATE ai_chats
      SET message = $1, response = $2, updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
    `;
    const values = [message, response, id, tenantId];
    await this.query(query, values);
  }

  async deleteAiChat(tenantId: string, id: number): Promise<void> {
    const query = `
      DELETE FROM ai_chats
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenantId];
    await this.query(query, values);
  }
}

  /**
   * N+1 PREVENTION: Find with related data
   * Override this method in subclasses for specific relationships
   */
  async findWithRelatedData(id: string, tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
    `;
    const result = await this.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * N+1 PREVENTION: Find all with related data
   * Override this method in subclasses for specific relationships
   */
  async findAllWithRelatedData(tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
