import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class SubscriptionManagementRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LSubscription_LManagement_s');
  }


    this.pool = pool;
  }

  // Create a new subscription
  async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const query = `
      INSERT INTO subscriptions (tenant_id, plan_id, user_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      subscription.tenant_id,
      subscription.plan_id,
      subscription.user_id,
      subscription.start_date,
      subscription.end_date,
      subscription.status
    ];

    const result: QueryResult<Subscription> = await this.query(query, values);
    return result.rows[0];
  }

  // Read a subscription by id
  async getSubscriptionById(id: number, tenant_id: number): Promise<Subscription | null> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM subscriptions
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult<Subscription> = await this.query(query, values);
    return result.rows[0] || null;
  }

  // Update a subscription
  async updateSubscription(id: number, tenant_id: number, updates: Partial<Omit<Subscription, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<Subscription | null> {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 3}`).join(', ');
    const query = `
      UPDATE subscriptions
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenant_id, ...Object.values(updates)];

    const result: QueryResult<Subscription> = await this.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a subscription
  async deleteSubscription(id: number, tenant_id: number): Promise<boolean> {
    const query = `
      DELETE FROM subscriptions
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.query(query, values);
    return result.rowCount > 0;
  }

  // List subscriptions for a tenant
  async listSubscriptions(tenant_id: number, limit: number = 10, offset: number = 0): Promise<Subscription[]> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM subscriptions
      WHERE tenant_id = $1
      LIMIT $2 OFFSET $3
    `;
    const values = [tenant_id, limit, offset];

    const result: QueryResult<Subscription> = await this.query(query, values);
    return result.rows;
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
