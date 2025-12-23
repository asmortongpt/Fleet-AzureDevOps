import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface CollisionDetection {
  id: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
  vehicle_id: number;
  tenant_id: number;
  created_at: Date;
  updated_at: Date;
}

export class CollisionDetectionRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('collision_detections', pool);
    this.pool = pool;
  }

  async create(tenantId: number, collisionDetection: Omit<CollisionDetection, 'id' | 'created_at' | 'updated_at'>): Promise<CollisionDetection> {
    const query = `
      INSERT INTO collision_detections (latitude, longitude, timestamp, vehicle_id, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      collisionDetection.latitude,
      collisionDetection.longitude,
      collisionDetection.timestamp,
      collisionDetection.vehicle_id,
      tenantId
    ];
    const result: QueryResult<CollisionDetection> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(tenantId: number, id: number): Promise<CollisionDetection | null> {
    const query = `SELECT id, tenant_id, latitude, longitude, timestamp, vehicle_id, created_at, updated_at FROM collision_detections WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<CollisionDetection> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async list(tenantId: number): Promise<CollisionDetection[]> {
    const query = `SELECT id, tenant_id, latitude, longitude, timestamp, vehicle_id, created_at, updated_at FROM collision_detections WHERE tenant_id = $1 ORDER BY timestamp DESC`;
    const result: QueryResult<CollisionDetection> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async update(tenantId: number, id: number, collisionDetection: Partial<CollisionDetection>): Promise<CollisionDetection | null> {
    const setClause = Object.keys(collisionDetection)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.read(tenantId, id);
    }

    const query = `UPDATE collision_detections SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(collisionDetection)];
    const result: QueryResult<CollisionDetection> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM collision_detections WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}