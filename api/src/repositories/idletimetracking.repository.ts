import { BaseRepository } from '../repositories/BaseRepository';

Here's a basic example of how you might create an IdleTimeTrackingRepository in TypeScript. This repository will allow you to perform CRUD operations on the idle time tracking data for a specific tenant.


import { Pool } from 'pg';
import { IdleTimeTracking } from '../models/IdleTimeTracking';

export class IdleTimeTrackingRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(tenantId: string, idleTimeTracking: IdleTimeTracking): Promise<void> {
    const query = 'INSERT INTO idle_time_tracking (tenant_id, start_time, end_time) VALUES ($1, $2, $3)';
    const values = [tenantId, idleTimeTracking.startTime, idleTimeTracking.endTime];
    await this.pool.query(query, values);
  }

  async read(tenantId: string): Promise<IdleTimeTracking[]> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM idle_time_tracking WHERE tenant_id = $1';
    const values = [tenantId];
    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  async update(tenantId: string, idleTimeTracking: IdleTimeTracking): Promise<void> {
    const query = 'UPDATE idle_time_tracking SET start_time = $1, end_time = $2 WHERE tenant_id = $3 AND id = $4';
    const values = [idleTimeTracking.startTime, idleTimeTracking.endTime, tenantId, idleTimeTracking.id];
    await this.pool.query(query, values);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const query = 'DELETE FROM idle_time_tracking WHERE tenant_id = $1 AND id = $2';
    const values = [tenantId, id];
    await this.pool.query(query, values);
  }
}


In this example, `IdleTimeTracking` is a model that represents the data structure of an idle time tracking record. It might look something like this:


export interface IdleTimeTracking {
  id: string;
  startTime: Date;
  endTime: Date;
}


Note that this is a very basic example and doesn't include any error handling or validation. You'll want to add that in a real-world application.
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM idletimetracking t
    WHERE t.id = \api/src/repositories/idletimetracking.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM idletimetracking t
    WHERE t.tenant_id = \api/src/repositories/idletimetracking.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
