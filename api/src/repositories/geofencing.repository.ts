import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface Geofencing {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  coordinates: any;
  created_at: Date;
  updated_at: Date;
}

export class GeofencingRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('geofencing', pool);
    this.pool = pool;
  }

  async createGeofencing(tenantId: number, geofencingData: Omit<Geofencing, 'id' | 'created_at' | 'updated_at'>): Promise<Geofencing> {
    const query = `
      INSERT INTO geofencing (tenant_id, name, description, coordinates, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      tenantId,
      geofencingData.name,
      geofencingData.description,
      geofencingData.coordinates
    ];
    const result: QueryResult<Geofencing> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getGeofencings(tenantId: number): Promise<Geofencing[]> {
    const query = `SELECT id, tenant_id, name, description, coordinates, created_at, updated_at FROM geofencing WHERE tenant_id = $1`;
    const result: QueryResult<Geofencing> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async getGeofencing(tenantId: number, id: number): Promise<Geofencing | null> {
    const query = `SELECT id, tenant_id, name, description, coordinates, created_at, updated_at FROM geofencing WHERE id = $1 AND tenant_id = $2`;
    const result: QueryResult<Geofencing> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async updateGeofencing(tenantId: number, id: number, geofencingData: Partial<Geofencing>): Promise<Geofencing | null> {
    const setClause = Object.keys(geofencingData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.getGeofencing(tenantId, id);
    }

    const query = `
      UPDATE geofencing
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const values = [id, tenantId, ...Object.values(geofencingData)];
    const result: QueryResult<Geofencing> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteGeofencing(tenantId: number, id: number): Promise<boolean> {
    const query = `DELETE FROM geofencing WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}