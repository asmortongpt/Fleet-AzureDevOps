import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export class TripUsageRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createTripUsage(
    tenant_id: string,
    trip_id: string,
    user_id: string,
    usage_date: Date,
    distance: number,
    duration: number
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO trip_usage (tenant_id, trip_id, user_id, usage_date, distance, duration)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [tenant_id, trip_id, user_id, usage_date, distance, duration];
    return this.pool.query(query, values);
  }

  async getTripUsageById(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM trip_usage
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }

  async getAllTripUsages(tenant_id: string): Promise<QueryResult> {
    const query = `
      SELECT id, tenant_id, created_at, updated_at FROM trip_usage
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    return this.pool.query(query, values);
  }

  async updateTripUsage(
    tenant_id: string,
    id: string,
    trip_id: string,
    user_id: string,
    usage_date: Date,
    distance: number,
    duration: number
  ): Promise<QueryResult> {
    const query = `
      UPDATE trip_usage
      SET trip_id = $3, user_id = $4, usage_date = $5, distance = $6, duration = $7
      WHERE id = $2 AND tenant_id = $1
      RETURNING id
    `;
    const values = [tenant_id, id, trip_id, user_id, usage_date, distance, duration];
    return this.pool.query(query, values);
  }

  async deleteTripUsage(tenant_id: string, id: string): Promise<QueryResult> {
    const query = `
      DELETE FROM trip_usage
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];
    return this.pool.query(query, values);
  }
}
/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM tripusage t
    WHERE t.id = \api/src/repositories/tripusage.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM tripusage t
    WHERE t.tenant_id = \api/src/repositories/tripusage.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
