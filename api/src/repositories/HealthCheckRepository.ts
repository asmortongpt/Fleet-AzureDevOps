/**
 * Health Check Repository
 *
 * System-wide health monitoring queries
 * Note: Health checks are NOT tenant-filtered as they monitor system-level resources
 */

import { injectable } from 'inversify';
import { Pool } from 'pg';

import { connectionManager } from '../config/connection-manager';
import { DatabaseError } from '../errors/ApplicationError';

export interface DatabaseStats {
  datname: string;
  size: string;
  connections: number;
}

export interface TableCount {
  schemaname: string;
  table_count: number;
}

export interface SlowQueryCount {
  slow_query_count: number;
}

/**
 * Health Check Repository
 * Provides system-wide database health monitoring
 */
@injectable()
export class HealthCheckRepository {
  private pool: Pool;

  constructor() {
    this.pool = connectionManager.getPool();
  }

  /**
   * Ping database connection
   */
  async ping(): Promise<{ ping: number }> {
    try {
      const result = await this.pool.query(`SELECT 1 as ping`);
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Database ping failed', { error });
    }
  }

  /**
   * Get database statistics
   * Returns: database name, size, active connection count
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const result = await this.pool.query(`
        SELECT
          pg_database.datname,
          pg_size_pretty(pg_database_size(pg_database.datname)) AS size,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) AS connections
        FROM pg_database
        WHERE datname = current_database()
      `);

      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Failed to fetch database stats', { error });
    }
  }

  /**
   * Get table count by schema
   * Excludes system schemas (pg_catalog, information_schema)
   */
  async getTableCounts(): Promise<TableCount[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          schemaname,
          COUNT(*) as table_count
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        GROUP BY schemaname
      `);

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to fetch table counts', { error });
    }
  }

  /**
   * Get slow query count
   * Queries with mean execution time > 1000ms
   * Returns 0 if pg_stat_statements extension not available
   */
  async getSlowQueryCount(): Promise<SlowQueryCount> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) as slow_query_count
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        LIMIT 1
      `);

      return result.rows[0];
    } catch (error) {
      // pg_stat_statements may not be enabled - return 0 instead of failing
      console.warn('pg_stat_statements not available, returning 0 slow queries');
      return { slow_query_count: 0 };
    }
  }

  /**
   * Execute all health checks in parallel
   * Returns aggregated database health metrics
   */
  async getAllHealthMetrics(): Promise<{
    ping: { ping: number };
    stats: DatabaseStats;
    tables: TableCount[];
    slowQueries: SlowQueryCount;
  }> {
    try {
      const [ping, stats, tables, slowQueries] = await Promise.all([
        this.ping(),
        this.getDatabaseStats(),
        this.getTableCounts(),
        this.getSlowQueryCount()
      ]);

      return { ping, stats, tables, slowQueries };
    } catch (error) {
      throw new DatabaseError('Failed to fetch health metrics', { error });
    }
  }

  // Prevent N+1 queries with JOINs
  async findAllWithRelated() {
    const query = `
      SELECT
        t1.*,
        t2.id as related_id,
        t2.name as related_name
      FROM ${this.tableName} t1
      LEFT JOIN related_table t2 ON t1.related_id = t2.id
      WHERE t1.tenant_id = $1
      ORDER BY t1.created_at DESC
    `;
    const result = await this.pool.query(query, [this.tenantId]);
    return result.rows;
  }

}
