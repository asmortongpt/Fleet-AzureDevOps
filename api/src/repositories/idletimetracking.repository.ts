import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface IdleTimeTracking {
  id: number;
  tenant_id: number;
  driver_id: number;
  vehicle_id: number;
  start_time: Date;
  end_time: Date;
  duration: number;
  created_at: Date;
  updated_at: Date;
}

export class IdleTimeTrackingRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('idle_time_tracking', pool);
    this.pool = pool;
  }

  async create(tenantId: number, idleTimeTracking: Omit<IdleTimeTracking, 'id' | 'created_at' | 'updated_at'>): Promise<IdleTimeTracking> {
    const query = `
      INSERT INTO idle_time_tracking (tenant_id, driver_id, vehicle_id, start_time, end_time, duration, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      idleTimeTracking.driver_id,
      idleTimeTracking.vehicle_id,
      idleTimeTracking.start_time,
      idleTimeTracking.end_time,
      idleTimeTracking.duration
    ];
    const result: QueryResult<IdleTimeTracking> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number): Promise<IdleTimeTracking[]> {
    const query = 'SELECT id, tenant_id, driver_id, vehicle_id, start_time, end_time, duration, created_at, updated_at FROM idle_time_tracking WHERE tenant_id = $1';
    const values = [tenantId];
    const result: QueryResult<IdleTimeTracking> = await this.pool.query(query, values);
    return result.rows;
  }

  async update(tenantId: number, id: number, idleTimeTracking: Partial<IdleTimeTracking>): Promise<IdleTimeTracking | null> {
    const setClause = Object.keys(idleTimeTracking)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return null;
    }

    const query = `UPDATE idle_time_tracking SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 RETURNING *`;
    const values = [tenantId, id, ...Object.values(idleTimeTracking)];
    const result: QueryResult<IdleTimeTracking> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = 'DELETE FROM idle_time_tracking WHERE tenant_id = $1 AND id = $2 RETURNING id';
    const values = [tenantId, id];
    const result: QueryResult = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}