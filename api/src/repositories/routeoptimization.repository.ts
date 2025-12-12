import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';
import { buildUpdateClause } from '../utils/sql-safety'

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
      const { fields: setClause, values: updateValues } = buildUpdateClause(data, 3, 'route_optimizations');
      const query = `UPDATE route_optimizations SET ${setClause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`;
      const result: QueryResult<RouteOptimization> = await this.pool.query(query, [id, tenantId, ...updateValues]);
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

/**
 * N+1 PREVENTION: Fetch with related entities
 * Add specific methods based on your relationships
 */
async findWithRelatedData(id: string, tenantId: string) {
  const query = \`
    SELECT t.*
    FROM routeoptimization t
    WHERE t.id = \api/src/repositories/routeoptimization.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM routeoptimization t
    WHERE t.tenant_id = \api/src/repositories/routeoptimization.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
