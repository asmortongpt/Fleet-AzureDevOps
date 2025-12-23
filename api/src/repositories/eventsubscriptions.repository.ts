import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface EventSubscription {
  id: number;
  tenant_id: number;
  event_type: string;
  callback_url: string;
  created_at: Date;
  updated_at: Date;
}

export class EventSubscriptionsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('event_subscriptions', pool);
    this.pool = pool;
  }

  async create(tenantId: number, eventSubscription: Omit<EventSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<EventSubscription> {
    const query = `
      INSERT INTO event_subscriptions (tenant_id, event_type, callback_url, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      eventSubscription.event_type,
      eventSubscription.callback_url
    ];
    const result: QueryResult<EventSubscription> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, id: number): Promise<EventSubscription | null> {
    const query = `
      SELECT id, tenant_id, event_type, callback_url, created_at, updated_at FROM event_subscriptions
      WHERE id = $1 AND tenant_id = $2
    `;
    const result: QueryResult<EventSubscription> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async update(tenantId: number, id: number, eventSubscription: Partial<EventSubscription>): Promise<EventSubscription | null> {
    const setClause = Object.keys(eventSubscription)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `
      UPDATE event_subscriptions
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(eventSubscription)];
    const result: QueryResult<EventSubscription> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM event_subscriptions WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async list(tenantId: number): Promise<EventSubscription[]> {
    const query = `
      SELECT id, tenant_id, event_type, callback_url, created_at, updated_at FROM event_subscriptions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `;
    const result: QueryResult<EventSubscription> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }
}