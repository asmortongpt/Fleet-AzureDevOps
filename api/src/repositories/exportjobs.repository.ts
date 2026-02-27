import { Pool } from 'pg';

import logger from '../config/logger';
import { BaseRepository } from './base/BaseRepository';
import { pool as sharedPool } from '../db';


export interface ExportJobEntity {
  id: number;
  tenant_id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class ExportJobsRepository extends BaseRepository<any> {
  constructor(pool: Pool = sharedPool) {
    super(pool, 'export_jobs');
  }

  /**
   * Fetch all records
   */
  async findAll(tenantId: number, filters?: any): Promise<ExportJobEntity[]> {
    try {
      const query = `
        SELECT id, created_at, updated_at FROM export_jobs
        WHERE tenant_id = $1
        AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      logger.error('ExportJobsRepository.findAll failed', { error });
      throw new Error('Failed to fetch records');
    }
  }

  /**
   * Fetch a record by id
   */
  async findById(id: number, tenantId: number): Promise<ExportJobEntity | null> {
    try {
      const query = `
        SELECT id, created_at, updated_at FROM export_jobs
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(query, [id, tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('ExportJobsRepository.findById failed', { error });
      throw new Error('Failed to fetch record');
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<ExportJobEntity>, tenantId: number): Promise<ExportJobEntity> {
    try {
      const query = `
        INSERT INTO export_jobs (tenant_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
      const result = await this.pool.query(query, [tenantId, data.name]);
      return result.rows[0];
    } catch (error) {
      logger.error('ExportJobsRepository.create failed', { error });
      throw new Error('Failed to create record');
    }
  }

  /**
   * Update a record
   */
  async update(id: number, data: Partial<ExportJobEntity>, tenantId: number): Promise<ExportJobEntity | null> {
    try {
      const query = `
        UPDATE export_jobs
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
        RETURNING *
      `;
      const result = await this.pool.query(query, [data.name, id, tenantId]);
      return result.rows[0] ?? null;
    } catch (error) {
      logger.error('ExportJobsRepository.update failed', { error });
      throw new Error('Failed to update record');
    }
  }

  /**
   * Soft delete a record
   */
  async softDelete(id: number, tenantId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE export_jobs
        SET deleted_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `;
      const result = await this.pool.query(query, [id, tenantId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('ExportJobsRepository.softDelete failed', { error });
      throw new Error('Failed to delete record');
    }
  }

  async delete(id: number, tenantId: number): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM export_jobs WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Example centralized filtering
  async findAllWithFilters(filters: Record<string, any>) {
    const { clause, params } = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page, filters.limit);
    const sorting = this.buildSorting(filters.sortBy, filters.sortOrder);

    const query = `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} ${clause} ${sorting} ${pagination}`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }

}
