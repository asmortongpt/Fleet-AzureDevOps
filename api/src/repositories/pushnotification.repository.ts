import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export class PushNotificationRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createPushNotification(
    title: string,
    body: string,
    userId: string,
    tenantId: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO push_notifications (title, body, user_id, tenant_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const values = [title, body, userId, tenantId];
    return this.pool.query(query, values);
  }

  async getPushNotificationById(
    id: string,
    tenantId: string
  ): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at FROM push_notifications
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];
    return this.pool.query(query, values);
  }

  async getAllPushNotificationsByUserId(
    userId: string,
    tenantId: string
  ): Promise<QueryResult> {
    const query = `
      SELECT id, created_at, updated_at FROM push_notifications
      WHERE user_id = $1 AND tenant_id = $2;
    `;
    const values = [userId, tenantId];
    return this.pool.query(query, values);
  }

  async updatePushNotification(
    id: string,
    title: string,
    body: string,
    tenantId: string
  ): Promise<QueryResult> {
    const query = `
      UPDATE push_notifications
      SET title = $1, body = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING *;
    `;
    const values = [title, body, id, tenantId];
    return this.pool.query(query, values);
  }

  async deletePushNotification(
    id: string,
    tenantId: string
  ): Promise<QueryResult> {
    const query = `
      DELETE FROM push_notifications
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `;
    const values = [id, tenantId];
    return this.pool.query(query, values);
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
    const result = await this.pool.query(query, [this.tenantId]);
    return result.rows;
  }

}