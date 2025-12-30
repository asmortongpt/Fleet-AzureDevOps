import { Pool, QueryResult } from 'pg';

import { BaseRepository } from './base/BaseRepository';

export interface MobileTrip {
  id: number;
  tenant_id: number;
  driver_id: number;
  vehicle_id: number;
  start_time: Date;
  end_time: Date;
  start_location: string;
  end_location: string;
  distance: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class MobileTripsRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('mobile_trips', pool);
    this.pool = pool;
  }

  async getAllTrips(tenantId: number): Promise<MobileTrip[]> {
    const query = 'SELECT id, tenant_id, driver_id, vehicle_id, start_time, end_time, start_location, end_location, distance, status, created_at, updated_at FROM mobile_trips WHERE tenant_id = $1';
    const result: QueryResult<MobileTrip> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getTripById(tripId: number, tenantId: number): Promise<MobileTrip | null> {
    const query = 'SELECT id, tenant_id, driver_id, vehicle_id, start_time, end_time, start_location, end_location, distance, status, created_at, updated_at FROM mobile_trips WHERE id = $1 AND tenant_id = $2';
    const result: QueryResult<MobileTrip> = await this.pool.query(query, [tripId, tenantId]);
    return result.rows[0] || null;
  }

  async createTrip(
    tripData: Omit<MobileTrip, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MobileTrip> {
    const query = `
      INSERT INTO mobile_trips (
        driver_id, vehicle_id, start_time, end_time, start_location, 
        end_location, distance, status, tenant_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tripData.driver_id,
      tripData.vehicle_id,
      tripData.start_time,
      tripData.end_time,
      tripData.start_location,
      tripData.end_location,
      tripData.distance,
      tripData.status,
      tripData.tenant_id
    ];
    const result: QueryResult<MobileTrip> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateTrip(
    tripId: number,
    tripData: Partial<MobileTrip>,
    tenantId: number
  ): Promise<MobileTrip | null> {
    const setClause = Object.keys(tripData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getTripById(tripId, tenantId);
    }

    // keys are $3, $4...
    // id=$1, tenantId=$2

    const query = `
      UPDATE mobile_trips
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [tripId, tenantId, ...Object.values(tripData)];
    const result: QueryResult<MobileTrip> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteTrip(tripId: number, tenantId: number): Promise<boolean> {
    const query = 'DELETE FROM mobile_trips WHERE id = $1 AND tenant_id = $2 RETURNING id';
    const result: QueryResult = await this.pool.query(query, [tripId, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default MobileTripsRepository;