import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export interface Trip {
  id: number;
  tenant_id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class TripManagementRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<Trip[]> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM trips WHERE tenant_id = $1 AND deleted_at IS NULL';
      const result: QueryResult<Trip> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find all trips: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<Trip | null> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM trips WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult<Trip> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find trip by id: ${error.message}`);
    }
  }

  async create(tenantId: number, trip: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Trip> {
    try {
      const query = 'INSERT INTO trips (tenant_id, name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *';
      const result: QueryResult<Trip> = await this.pool.query(query, [tenantId, trip.name, trip.start_date, trip.end_date]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create trip: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, trip: Partial<Omit<Trip, 'id' | 'tenant_id' | 'created_at' | 'deleted_at'>>): Promise<Trip> {
    try {
      const setClause = Object.keys(trip).map((key, index) => `${key} = $${index + 3}`).join(', ');
      const query = `UPDATE trips SET ${setClause}, updated_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`;
      const values = [tenantId, id, ...Object.values(trip)];
      const result: QueryResult<Trip> = await this.pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error('Trip not found or already deleted');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update trip: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<void> {
    try {
      const query = 'UPDATE trips SET deleted_at = NOW() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult = await this.pool.query(query, [tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('Trip not found or already deleted');
      }
    } catch (error) {
      throw new Error(`Failed to soft delete trip: ${error.message}`);
    }
  }
}
