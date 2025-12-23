import { BaseRepository } from '../repositories/BaseRepository';
import { Pool, QueryResult } from 'pg';

export interface GeoZone {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  coordinates: any;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class GeoZonesRepository extends BaseRepository<any> {

  private pool: Pool;

  constructor(pool: Pool) {
    super('geo_zones', pool);
    this.pool = pool;
  }

  async findAll(tenantId: number): Promise<GeoZone[]> {
    const query = `SELECT id, tenant_id, name, description, coordinates, created_at, updated_at FROM geo_zones WHERE tenant_id = $1 AND deleted_at IS NULL`;
    const result: QueryResult<GeoZone> = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async findById(id: number, tenantId: number): Promise<GeoZone | null> {
    const query = `SELECT id, tenant_id, name, description, coordinates, created_at, updated_at FROM geo_zones WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    const result: QueryResult<GeoZone> = await this.pool.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  async create(tenantId: number, geoZone: Omit<GeoZone, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<GeoZone> {
    const query = `INSERT INTO geo_zones (tenant_id, name, description, coordinates, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`;
    const values = [tenantId, geoZone.name, geoZone.description, geoZone.coordinates];
    const result: QueryResult<GeoZone> = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, tenantId: number, geoZone: Partial<GeoZone>): Promise<GeoZone | null> {
    const setClause = Object.keys(geoZone)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      return this.findById(id, tenantId);
    }

    const query = `UPDATE geo_zones SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
    const values = [id, tenantId, ...Object.values(geoZone)];
    const result: QueryResult<GeoZone> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const query = `UPDATE geo_zones SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id`;
    const result: QueryResult = await this.pool.query(query, [id, tenantId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}