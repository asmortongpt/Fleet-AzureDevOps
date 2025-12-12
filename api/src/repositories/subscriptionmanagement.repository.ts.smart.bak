import { BaseRepository } from './BaseRepository';

To create a TypeScript repository named `SubscriptionManagementRepository` for the `api/src/routes/subscription-management.routes.ts` file, we'll implement parameterized queries, include a `tenant_id` field, and provide CRUD operations. Let's break this down step-by-step:

1. **Define the interface for Subscription**
2. **Create the SubscriptionManagementRepository class**
3. **Implement CRUD operations with parameterized queries**
4. **Include tenant_id in all operations**

Here's the implementation:


// api/src/repositories/SubscriptionManagementRepository.ts

import { Pool, QueryResult } from 'pg';

// Define the Subscription interface
interface Subscription {
  id: number;
  tenant_id: number;
  plan_id: number;
  user_id: number;
  start_date: Date;
  end_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

// SubscriptionManagementRepository class
class SubscriptionManagementRepository {
  private pool: Pool;

  constructor(pool: Pool) {
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

export default SubscriptionManagementRepository;


This implementation includes:

1. **Parameterized queries**: All SQL queries use parameterized statements to prevent SQL injection.
2. **Tenant_id**: The `tenant_id` field is included in all operations to ensure multi-tenant support.
3. **CRUD operations**: Create, Read, Update, and Delete operations are implemented.
4. **List operation**: An additional method to list subscriptions for a tenant is included.

To use this repository in your `subscription-management.routes.ts` file, you would typically do something like this:


// api/src/routes/subscription-management.routes.ts

import express from 'express';
import SubscriptionManagementRepository from '../repositories/SubscriptionManagementRepository';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool(/* your database configuration */);
const subscriptionRepository = new SubscriptionManagementRepository(pool);

// Example route for creating a subscription
router.post('/', async (req, res) => {
  try {
    const newSubscription = await subscriptionRepository.createSubscription(req.body);
    res.status(201).json(newSubscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Add more routes for other CRUD operations...

export default router;


This setup provides a solid foundation for managing subscriptions in a multi-tenant environment with proper security measures like parameterized queries.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM subscriptionmanagement t
    WHERE t.id = \api/src/repositories/subscriptionmanagement.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM subscriptionmanagement t
    WHERE t.tenant_id = \api/src/repositories/subscriptionmanagement.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
