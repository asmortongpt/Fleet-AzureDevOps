import { Pool, QueryResult } from 'pg';

import { BaseRepository } from '../repositories/BaseRepository';


export interface RouteOptimization {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class RouteOptimizationRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<RouteOptimization[]> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM route_optimizations WHERE tenant_id = $1 AND deleted_at IS NULL';
      const result: QueryResult<RouteOptimization> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find all route optimizations: ${error.message}`);
    }
  }

  async findById(id: number, tenantId: number): Promise<RouteOptimization | null> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM route_optimizations WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL';
      const result: QueryResult<RouteOptimization> = await this.pool.query(query, [id, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find route optimization by id: ${error.message}`);
    }
  }

  async create(data: Omit<RouteOptimization, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>, tenantId: number): Promise<RouteOptimization> {
    try {
      const query = 'INSERT INTO route_optimizations (tenant_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *';
      const result: QueryResult<RouteOptimization> = await this.pool.query(query, [tenantId, data.name, data.description]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create route optimization: ${error.message}`);
    }
  }

  async update(id: number, data: Partial<Omit<RouteOptimization, 'id' | 'tenant_id' | 'created_at' | 'deleted_at'>>, tenantId: number): Promise<RouteOptimization> {
    try {
      const fields = Object.keys(data).map((key, index) => `${key} = $${index + 3}`);
      const values = Object.values(data);
      const query = `UPDATE route_optimizations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
      const result: QueryResult<RouteOptimization> = await this.pool.query(query, [id, tenantId, ...values]);
      if (result.rowCount === 0) {
        throw new Error('Route optimization not found');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update route optimization: ${error.message}`);
    }
  }

  async softDelete(id: number, tenantId: number): Promise<void> {
    try {
      const query = 'UPDATE route_optimizations SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2';
      const result: QueryResult = await this.pool.query(query, [id, tenantId]);
      if (result.rowCount === 0) {
        throw new Error('Route optimization not found');
      }
    } catch (error) {
      throw new Error(`Failed to soft delete route optimization: ${error.message}`);
    }
  }
}
