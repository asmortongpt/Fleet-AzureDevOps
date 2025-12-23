import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

// Define the interface for carbon tracking data
interface CarbonTrackingData {
  id: number;
  tenant_id: string;
  timestamp: Date;
  carbon_emission: number;
  activity_type: string;
  location: string;
}

export class CarbonTrackingRepository extends BaseRepository<any> {
  private pool: Pool;

  constructor(pool: Pool) {
    super('carbon_tracking', pool);
    this.pool = pool;
  }

  // Create a new carbon tracking entry
  async create(data: Omit<CarbonTrackingData, 'id'>): Promise<CarbonTrackingData> {
    const query = `
      INSERT INTO carbon_tracking (tenant_id, timestamp, carbon_emission, activity_type, location)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.tenant_id,
      data.timestamp,
      data.carbon_emission,
      data.activity_type,
      data.location
    ];

    const result: QueryResult<CarbonTrackingData> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Read a carbon tracking entry by ID
  async read(id: number, tenant_id: string): Promise<CarbonTrackingData | null> {
    const query = `
      SELECT id, created_at, updated_at FROM carbon_tracking
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [id, tenant_id];

    const result: QueryResult<CarbonTrackingData> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Update a carbon tracking entry
  async update(id: number, data: Partial<Omit<CarbonTrackingData, 'id'>>, tenant_id: string): Promise<CarbonTrackingData | null> {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE carbon_tracking
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $${Object.keys(data).length + 2}
      RETURNING *
    `;

    const values = [id, ...Object.values(data), tenant_id];

    const result: QueryResult<CarbonTrackingData> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete a carbon tracking entry
  async delete(id: number, tenant_id: string): Promise<boolean> {
    const query = `
      DELETE FROM carbon_tracking
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [id, tenant_id];

    const result: QueryResult<{ id: number }> = await this.pool.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // List carbon tracking entries for a tenant
  async list(tenant_id: string, limit: number = 10, offset: number = 0): Promise<CarbonTrackingData[]> {
    const query = `
      SELECT id, created_at, updated_at FROM carbon_tracking
      WHERE tenant_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [tenant_id, limit, offset];

    const result: QueryResult<CarbonTrackingData> = await this.pool.query(query, values);
    return result.rows;
  }
}