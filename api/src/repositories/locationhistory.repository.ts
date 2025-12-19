
import { Pool } from 'pg';

import { LocationHistory } from '../models/location-history.model';
import { BaseRepository } from '../repositories/BaseRepository';

export class LocationHistoryRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(locationHistory: LocationHistory): Promise<LocationHistory> {
    const query = `
      INSERT INTO location_history (user_id, latitude, longitude, timestamp, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, latitude, longitude, timestamp, tenant_id
    `;
    const values = [locationHistory.user_id, locationHistory.latitude, locationHistory.longitude, locationHistory.timestamp, locationHistory.tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async read(id: number, tenant_id: string): Promise<LocationHistory | null> {
    const query = `
      SELECT id, user_id, latitude, longitude, timestamp, tenant_id
      FROM location_history
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async update(id: number, locationHistory: LocationHistory, tenant_id: string): Promise<LocationHistory | null> {
    const query = `
      UPDATE location_history
      SET user_id = $1, latitude = $2, longitude = $3, timestamp = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING id, user_id, latitude, longitude, timestamp, tenant_id
    `;
    const values = [locationHistory.user_id, locationHistory.latitude, locationHistory.longitude, locationHistory.timestamp, id, tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenant_id: string): Promise<boolean> {
    const query = `
      DELETE FROM location_history
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];
    const result = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  async list(tenant_id: string): Promise<LocationHistory[]> {
    const query = `
      SELECT id, user_id, latitude, longitude, timestamp, tenant_id
      FROM location_history
      WHERE tenant_id = $1
    `;
    const values = [tenant_id];
    const result = await this.pool.query(query, values);
    return result.rows;
  }
}