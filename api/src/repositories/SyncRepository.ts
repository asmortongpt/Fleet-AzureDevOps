import { pool } from '../db';
import { BaseRepository } from './base.repository';

/**
 * Sync Repository - Manages sync state, jobs, and errors
 *
 * Security:
 * - All queries use parameterized placeholders ($1, $2, $3)
 * - All queries filter by tenant_id where applicable
 * - No string concatenation in SQL
 */

export interface SyncState {
  id: number;
  tenant_id: number;
  resource_type: string;
  resource_id: string;
  delta_token?: string;
  sync_status?: string;
  last_sync_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SyncJob {
  id: number;
  tenant_id: number;
  entity_type: string;
  sync_direction: string;
  status: string;
  total_records?: number;
  processed_records?: number;
  failed_records?: number;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  job_type?: string;
  duration_ms?: number;
}

export interface SyncError {
  id: number;
  tenant_id?: number;
  resource_type: string;
  resource_id: string;
  error_message: string;
  error_code?: string;
  resolved: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JobStats {
  job_type: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  avg_duration_ms: number;
  last_run_at: Date;
}

export interface ErrorStats {
  total_errors: number;
  unresolved_errors: number;
}

export interface SyncStateStats {
  resource_type: string;
  total_resources: number;
  successful_syncs: number;
  failed_syncs: number;
  last_sync_at: Date;
}

export class SyncRepository extends BaseRepository<SyncState> {
  constructor() {
    super('sync_state');
  }

  /**
   * Clear all delta tokens (for full re-sync)
   * Security: No tenant_id filter needed as this is admin-only operation
   */
  async clearAllDeltaTokens(): Promise<void> {
    await pool.query(`UPDATE sync_state SET delta_token = NULL`);
  }

  /**
   * Get recent sync jobs with optional limit
   * Security: Returns all jobs (no tenant filter) for monitoring purposes
   */
  async getRecentJobs(limit: number = 50): Promise<SyncJob[]> {
    const result = await pool.query<SyncJob>(
      `SELECT
        id, tenant_id, entity_type, sync_direction, status,
        total_records, processed_records, failed_records, error_message,
        started_at, completed_at, created_at
      FROM sync_jobs
      ORDER BY started_at DESC
      LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Resolve a sync error by marking it as resolved
   * Security: Uses parameterized query with error ID
   */
  async resolveError(errorId: string): Promise<void> {
    await pool.query(
      `UPDATE sync_errors SET resolved = true WHERE id = $1`,
      [errorId]
    );
  }

  /**
   * Get job statistics for the last 24 hours
   * Security: Aggregated data, no sensitive information exposed
   */
  async getJobStats(): Promise<JobStats[]> {
    const result = await pool.query<JobStats>(
      `SELECT
        job_type,
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_runs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
        AVG(duration_ms) as avg_duration_ms,
        MAX(started_at) as last_run_at
      FROM sync_jobs
      WHERE started_at > NOW() - INTERVAL '24 hours'
      GROUP BY job_type`
    );
    return result.rows;
  }

  /**
   * Get error statistics for the last 24 hours
   * Security: Aggregated data only
   */
  async getErrorStats(): Promise<ErrorStats> {
    const result = await pool.query<ErrorStats>(
      `SELECT
        COUNT(*) as total_errors,
        COUNT(*) FILTER (WHERE resolved = false) as unresolved_errors
      FROM sync_errors
      WHERE created_at > NOW() - INTERVAL '24 hours'`
    );
    return result.rows[0] || { total_errors: 0, unresolved_errors: 0 };
  }

  /**
   * Get sync state statistics grouped by resource type
   * Security: Aggregated data only
   */
  async getSyncStateStats(): Promise<SyncStateStats[]> {
    const result = await pool.query<SyncStateStats>(
      `SELECT
        resource_type,
        COUNT(*) as total_resources,
        COUNT(*) FILTER (WHERE sync_status = 'success') as successful_syncs,
        COUNT(*) FILTER (WHERE sync_status = 'failed') as failed_syncs,
        MAX(last_sync_at) as last_sync_at
      FROM sync_state
      GROUP BY resource_type`
    );
    return result.rows;
  }

  /**
   * Get recent sync jobs for a specific tenant
   * Security: Filters by tenant_id
   */
  async getJobsByTenant(tenantId: number, limit: number = 50): Promise<SyncJob[]> {
    const result = await pool.query<SyncJob>(
      `SELECT
        id, tenant_id, entity_type, sync_direction, status,
        total_records, processed_records, failed_records, error_message,
        started_at, completed_at, created_at
      FROM sync_jobs
      WHERE tenant_id = $1
      ORDER BY started_at DESC
      LIMIT $2`,
      [tenantId, limit]
    );
    return result.rows;
  }

  /**
   * Get recent sync errors for a specific tenant
   * Security: Filters by tenant_id
   */
  async getErrorsByTenant(tenantId: number, limit: number = 50): Promise<SyncError[]> {
    const result = await pool.query<SyncError>(
      `SELECT
        id, tenant_id, resource_type, resource_id, error_message,
        error_code, resolved, created_at, updated_at
      FROM sync_errors
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
      [tenantId, limit]
    );
    return result.rows;
  }
}
