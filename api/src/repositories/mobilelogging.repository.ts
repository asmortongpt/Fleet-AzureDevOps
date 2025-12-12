import { BaseRepository } from '../repositories/BaseRepository';

import { Pool, QueryResult } from 'pg';

export interface MobileLog {
  id: number;
  tenant_id: number;
  log_type: string;
  log_data: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class MobileLoggingRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  async findAll(tenantId: number): Promise<MobileLog[]> {
    try {
      const query = 'SELECT id, created_at, updated_at FROM mobile_logs WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC';
      const result: QueryResult<MobileLog> = await this.pool.query(query, [tenantId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find all mobile logs: ${error.message}`);
    }
  }

  async findById(tenantId: number, id: number): Promise<MobileLog | null> {
    try {
      const query = 'SELECT id, created_at, updated_at FROM mobile_logs WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult<MobileLog> = await this.pool.query(query, [tenantId, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find mobile log by id: ${error.message}`);
    }
  }

  async create(tenantId: number, logType: string, logData: string): Promise<MobileLog> {
    try {
      const query = 'INSERT INTO mobile_logs (tenant_id, log_type, log_data) VALUES ($1, $2, $3) RETURNING *';
      const result: QueryResult<MobileLog> = await this.pool.query(query, [tenantId, logType, logData]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create mobile log: ${error.message}`);
    }
  }

  async update(tenantId: number, id: number, logType: string, logData: string): Promise<MobileLog> {
    try {
      const query = 'UPDATE mobile_logs SET log_type = $3, log_data = $4, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *';
      const result: QueryResult<MobileLog> = await this.pool.query(query, [tenantId, id, logType, logData]);
      if (result.rowCount === 0) {
        throw new Error('Mobile log not found or already deleted');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update mobile log: ${error.message}`);
    }
  }

  async softDelete(tenantId: number, id: number): Promise<void> {
    try {
      const query = 'UPDATE mobile_logs SET deleted_at = CURRENT_TIMESTAMP WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL';
      const result: QueryResult = await this.pool.query(query, [tenantId, id]);
      if (result.rowCount === 0) {
        throw new Error('Mobile log not found or already deleted');
      }
    } catch (error) {
      throw new Error(`Failed to soft delete mobile log: ${error.message}`);
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
    FROM mobilelogging t
    WHERE t.id = \api/src/repositories/mobilelogging.repository.ts AND t.tenant_id = \ AND t.deleted_at IS NULL
  \`;
  const result = await this.pool.query(query, [id, tenantId]);
  return result.rows[0] || null;
}

async findAllWithRelatedData(tenantId: string) {
  const query = \`
    SELECT t.*
    FROM mobilelogging t
    WHERE t.tenant_id = \api/src/repositories/mobilelogging.repository.ts AND t.deleted_at IS NULL
    ORDER BY t.created_at DESC
  \`;
  const result = await this.pool.query(query, [tenantId]);
  return result.rows;
}
