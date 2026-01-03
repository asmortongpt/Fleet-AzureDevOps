import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export interface RouteTrip {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class RoutesTripsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<RouteTrip[]> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM route_trips WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY id';
      const result: QueryResult<RouteTrip> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch route trips: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<RouteTrip | null> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM route_trips WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult<RouteTrip> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch route trip by id: ${error.message}`);
    }
  }

  async create(tenantId: number, name: string, description: string): Promise<RouteTrip> {
    try {
      const query = 'INSERT INTO route_trips (tenant_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *';
      const result: QueryResult<RouteTrip> = await this.pool.query(query, [tenantId, name, description]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create route trip: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, name: string, description: string): Promise<RouteTrip> {
    try {
      const query = 'UPDATE route_trips SET name = $3, description = $4, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *';
      const result: QueryResult<RouteTrip> = await this.pool.query(query, [tenantId, id, name, description]);
      if (result.rowCount === 0) {
        throw new Error('Route trip not found or already deleted');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update route trip: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<void> {
    try {
      const query = 'UPDATE route_trips SET deleted_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult = await this.pool.query(query, [tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('Route trip not found or already deleted');
      }
    } catch (error) {
      throw new Error(`Failed to soft delete route trip: ${error.message}`);
    }
  }
}
