import { BaseRepository } from './BaseRepository';

import { Pool, QueryResult } from 'pg';

class MobileTripsRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getAllTrips(tenantId: string): Promise<QueryResult> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM mobile_trips WHERE tenant_id = $1';
    return this.query(query, [tenantId]);
  }

  async getTripById(tripId: string, tenantId: string): Promise<QueryResult> {
    const query = 'SELECT id, tenant_id, created_at, updated_at FROM mobile_trips WHERE id = $1 AND tenant_id = $2';
    return this.query(query, [tripId, tenantId]);
  }

  async createTrip(
    tripData: {
      driver_id: string;
      vehicle_id: string;
      start_time: Date;
      end_time: Date;
      start_location: string;
      end_location: string;
      distance: number;
      status: string;
    },
    tenantId: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO mobile_trips (
        driver_id, vehicle_id, start_time, end_time, start_location, 
        end_location, distance, status, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      tenantId
    ];
    return this.query(query, values);
  }

  async updateTrip(
    tripId: string,
    tripData: {
      driver_id?: string;
      vehicle_id?: string;
      start_time?: Date;
      end_time?: Date;
      start_location?: string;
      end_location?: string;
      distance?: number;
      status?: string;
    },
    tenantId: string
  ): Promise<QueryResult> {
    const set Clauses = Object.entries(tripData)
      .map(([key, value], index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = Object.values(tripData);
    values.push(tripId);
    values.push(tenantId);

    const query = `
      UPDATE mobile_trips
      SET ${setClauses}
      WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
      RETURNING *
    `;
    return this.query(query, values);
  }

  async deleteTrip(tripId: string, tenantId: string): Promise<QueryResult> {
    const query = 'DELETE FROM mobile_trips WHERE id = $1 AND tenant_id = $2 RETURNING *';
    return this.query(query, [tripId, tenantId]);
  }
}

export default MobileTripsRepository;