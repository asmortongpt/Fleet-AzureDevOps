import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface MileageTracking {
  id: number;
  tenant_id: number;
  vehicle_id: number;
  driver_id: number;
  start_mileage: number;
  end_mileage: number;
  distance: number;
  trip_date: Date;
  created_at: Date;
  updated_at: Date;
}

export class MileageTrackingRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('mileage_tracking', pool);
    this.pool = pool;
  }

  async createMileageTracking(tenant_id: number, mileageTrackingData: Omit<MileageTracking, 'id' | 'created_at' | 'updated_at'>): Promise<MileageTracking> {
    const query = `
      INSERT INTO mileage_tracking (tenant_id, vehicle_id, driver_id, start_mileage, end_mileage, distance, trip_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenant_id,
      mileageTrackingData.vehicle_id,
      mileageTrackingData.driver_id,
      mileageTrackingData.start_mileage,
      mileageTrackingData.end_mileage,
      mileageTrackingData.distance,
      mileageTrackingData.trip_date
    ];
    const result: QueryResult<MileageTracking> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getMileageTrackings(tenant_id: number): Promise<MileageTracking[]> {
    const query = `SELECT id, tenant_id, vehicle_id, driver_id, start_mileage, end_mileage, distance, trip_date, created_at, updated_at FROM mileage_tracking WHERE tenant_id = $1`;
    const result: QueryResult<MileageTracking> = await this.pool.query(query, [tenant_id]);
    return result.rows;
  }

  async getMileageTrackingById(tenant_id: number, id: number): Promise<MileageTracking | null> {
    const query = `SELECT id, tenant_id, vehicle_id, driver_id, start_mileage, end_mileage, distance, trip_date, created_at, updated_at FROM mileage_tracking WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<MileageTracking> = await this.pool.query(query, [id, tenant_id]);
    return result.rows[0] || null;
  }

  async updateMileageTracking(tenant_id: number, id: number, mileageTrackingData: Partial<MileageTracking>): Promise<MileageTracking | null> {
    const setClause = Object.keys(mileageTrackingData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getMileageTrackingById(tenant_id, id);
    }

    const query = `
      UPDATE mileage_tracking
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenant_id, ...Object.values(mileageTrackingData)];
    const result: QueryResult<MileageTracking> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteMileageTracking(tenant_id: number, id: number): Promise<boolean> {
    const query = `DELETE FROM mileage_tracking WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenant_id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}