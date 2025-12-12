import { BaseRepository } from '../repositories/BaseRepository';

To create a TypeScript repository for event subscriptions with parameterized queries, tenant_id, and CRUD operations, we'll need to design a class that encapsulates these functionalities. Let's break down the requirements and implement the `EventSubscriptionsRepository` class.

Here's a step-by-step approach to creating this repository:

1. Define the interface for an event subscription
2. Create the `EventSubscriptionsRepository` class
3. Implement CRUD operations with parameterized queries
4. Include tenant_id in all operations
5. Use async/await for database operations

Let's implement the repository:


import { Pool, QueryResult } from 'pg';

// Define the interface for an event subscription
interface EventSubscription {
  id: number;
  tenant_id: string;
  event_type: string;
  callback_url: string;
  created_at: Date;
  updated_at: Date;
}

// EventSubscriptionsRepository class
export class EventSubscriptionsRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create a new event subscription
  async create(tenantId: string, eventSubscription: Omit<EventSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<EventSubscription> {
    const query = `
      INSERT INTO event_subscriptions (tenant_id, event_type, callback_url, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const values = [tenantId, eventSubscription.event_type, eventSubscription.callback_url];

    const result: QueryResult<EventSubscription> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read an event subscription by id
  async read(tenantId: string, id: number): Promise<EventSubscription | null> {
    const query = `
      SELECT id, created_at, updated_at FROM event_subscriptions
      WHERE id = $1 AND tenant_id = $2;
    `;
    const values = [id, tenantId];

    const result: QueryResult<EventSubscription> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update an event subscription
  async update(tenantId: string, id: number, eventSubscription: Partial<Omit<EventSubscription, 'id' | 'tenant_id' | 'created_at'>>): Promise<EventSubscription | null> {
    const { fields: setClause, values: updateValues } = buildUpdateClause(eventSubscription, 3, 'generic_table');
    const values = [id, tenantId, ...updateValues];

    const query = `
      UPDATE event_subscriptions
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *;
    `;

    const result: QueryResult<EventSubscription> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete an event subscription
  async delete(tenantId: string, id: number): Promise<boolean> {
    const query = `
      DELETE FROM event_subscriptions
      WHERE id = $1 AND tenant_id = $2
      RETURNING id;
    `;
    const values = [id, tenantId];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  // List event subscriptions for a tenant
  async list(tenantId: string): Promise<EventSubscription[]> {
    const query = `
      SELECT id, created_at, updated_at FROM event_subscriptions
      WHERE tenant_id = $1
      ORDER BY created_at DESC;
    `;
    const values = [tenantId];

    const result: QueryResult<EventSubscription> = await this.pool.query(query, values);
    return result.rows;
  }
}


This implementation of `EventSubscriptionsRepository` satisfies the requirements:

1. It uses parameterized queries to prevent SQL injection.
2. It includes `tenant_id` in all operations to ensure multi-tenant support.
3. It implements CRUD operations (Create, Read, Update, Delete) along with a list method.
4. It uses async/await for database operations, making it compatible with modern JavaScript/TypeScript practices.

To use this repository in your `event-subscriptions.routes.ts` file, you would typically inject the `Pool` instance and create an instance of `EventSubscriptionsRepository`. Here's a basic example of how you might use it in your route handlers:


import { Router } from 'express';
import { Pool } from 'pg';
import { EventSubscriptionsRepository } from './EventSubscriptionsRepository';
import { buildUpdateClause } from '../utils/sql-safety'

const router = Router();
const pool = new Pool(/* your pool configuration */);
const eventSubscriptionsRepository = new EventSubscriptionsRepository(pool);

router.post('/', async (req, res) => {
  const { tenantId } = req.headers;
  const { event_type, callback_url } = req.body;

  try {
    const newSubscription = await eventSubscriptionsRepository.create(tenantId, { event_type, callback_url });
    res.status(201).json(newSubscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event subscription' });
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

});

// Implement other routes (GET, PUT, DELETE) similarly

export default router;


This repository provides a solid foundation for managing event subscriptions in a multi-tenant environment. You may need to adjust the implementation based on your specific database schema and requirements, but this should give you a good starting point for your `api/src/routes/event-subscriptions.routes.ts` file.