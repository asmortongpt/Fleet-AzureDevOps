import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';

export interface FeedbackSystem {
  id: number;
  tenant_id: number;
  user_id: number;
  category: string;
  feedback_text: string;
  rating: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class FeedbackSystemRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('feedback_systems', pool);
    this.pool = pool;
  }

  async createFeedbackSystem(tenantId: number, feedbackSystem: Omit<FeedbackSystem, 'id' | 'created_at' | 'updated_at'>): Promise<FeedbackSystem> {
    const query = `
      INSERT INTO feedback_systems (tenant_id, user_id, category, feedback_text, rating, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      feedbackSystem.user_id,
      feedbackSystem.category,
      feedbackSystem.feedback_text,
      feedbackSystem.rating,
      feedbackSystem.status
    ];
    const result: QueryResult<FeedbackSystem> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getFeedbackSystem(tenantId: number, id: number): Promise<FeedbackSystem | null> {
    const query = `SELECT id, tenant_id, user_id, category, feedback_text, rating, status, created_at, updated_at FROM feedback_systems WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<FeedbackSystem> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async getAllFeedbackSystems(tenantId: number): Promise<FeedbackSystem[]> {
    const query = `SELECT id, tenant_id, user_id, category, feedback_text, rating, status, created_at, updated_at FROM feedback_systems WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const result: QueryResult<FeedbackSystem> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async updateFeedbackSystem(tenantId: number, id: number, feedbackSystem: Partial<FeedbackSystem>): Promise<FeedbackSystem | null> {
    const setClause = Object.keys(feedbackSystem)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getFeedbackSystem(tenantId, id);
    }

    const query = `UPDATE feedback_systems SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(feedbackSystem)];
    const result: QueryResult<FeedbackSystem> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteFeedbackSystem(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM feedback_systems WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}