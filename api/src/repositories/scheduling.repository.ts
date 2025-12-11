import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export interface SchedulingEntity {
  id: number;
  tenant_id: number;
  title: string;
  start_time: Date;
  end_time: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class SchedulingRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<SchedulingEntity[]> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM scheduling WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY start_time';
      const result: QueryResult<SchedulingEntity> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find all scheduling entries: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<SchedulingEntity | null> {
    try {
      const query = 'SELECT id, tenant_id, created_at, updated_at FROM scheduling WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult<SchedulingEntity> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find scheduling entry by id: ${error.message}`);
    }
  }

  async create(tenantId: number, title: string, startTime: Date, endTime: Date): Promise<SchedulingEntity> {
    try {
      const query = 'INSERT INTO scheduling (tenant_id, title, start_time, end_time, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *';
      const result: QueryResult<SchedulingEntity> = await this.pool.query(query, [tenantId, title, startTime, endTime]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create scheduling entry: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, title: string, startTime: Date, endTime: Date): Promise<SchedulingEntity> {
    try {
      const query = 'UPDATE scheduling SET title = $1, start_time = $2, end_time = $3, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $4 AND id = $5 AND deleted_at IS NULL RETURNING *';
      const result: QueryResult<SchedulingEntity> = await this.pool.query(query, [title, startTime, endTime, tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('Scheduling entry not found or already deleted');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update scheduling entry: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<void> {
    try {
      const query = 'UPDATE scheduling SET deleted_at = CURRENT_TIMESTAMP WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult = await this.pool.query(query, [tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('Scheduling entry not found or already deleted');
      }
    } catch (error) {
      throw new Error(`Failed to soft delete scheduling entry: ${error.message}`);
    }
  }
}
