/**
 * Partition Management Service
 *
 * Manages table partitioning lifecycle for high-volume tables:
 * - Automatic creation of future partitions
 * - Automatic deletion of old partitions
 * - Partition size monitoring and analysis
 * - Alerting for partition-related issues
 *
 * Phase 4 - Agent 10
 * Date: 2026-02-02
 */

import { pool } from '../db';
import { logger } from '../lib/logger';

interface PartitionMetadata {
  id: string;
  tableName: string;
  partitionName: string;
  partitionStart: Date;
  partitionEnd: Date;
  createdAt: Date;
  rowCount: bigint;
  sizeBytes: bigint;
  lastAnalyzedAt: Date | null;
  isActive: boolean;
}

interface PartitionStats {
  tableName: string;
  partitionName: string;
  rowCount: number;
  sizeBytes: number;
  sizeMB: number;
  indexSizeBytes: number;
  indexSizeMB: number;
  totalSizeMB: number;
}

export class PartitionManagementService {
  private readonly RETENTION_MONTHS = 12;
  private readonly FUTURE_PARTITIONS = 3;
  private readonly PARTITIONED_TABLES = ['gps_tracks', 'telemetry_data'];

  /**
   * Create future partitions for all partitioned tables
   */
  async createFuturePartitions(): Promise<{ table: string; message: string }[]> {
    const results: { table: string; message: string }[] = [];

    for (const tableName of this.PARTITIONED_TABLES) {
      try {
        for (let monthsAhead = 1; monthsAhead <= this.FUTURE_PARTITIONS; monthsAhead++) {
          const result = await pool.query(
            'SELECT create_next_partition($1, $2) as message',
            [tableName, monthsAhead]
          );

          results.push({
            table: tableName,
            message: result.rows[0].message,
          });

          logger.info(`Partition creation: ${result.rows[0].message}`, {
            table: tableName,
            monthsAhead,
          });
        }
      } catch (error) {
        logger.error(`Failed to create partitions for ${tableName}`, { error });
        results.push({
          table: tableName,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return results;
  }

  /**
   * Drop old partitions beyond retention period
   */
  async dropOldPartitions(): Promise<{ table: string; message: string }[]> {
    const results: { table: string; message: string }[] = [];

    for (const tableName of this.PARTITIONED_TABLES) {
      try {
        const result = await pool.query(
          'SELECT drop_old_partitions($1, $2) as message',
          [tableName, this.RETENTION_MONTHS]
        );

        results.push({
          table: tableName,
          message: result.rows[0].message,
        });

        logger.info(`Partition cleanup: ${result.rows[0].message}`, {
          table: tableName,
          retentionMonths: this.RETENTION_MONTHS,
        });
      } catch (error) {
        logger.error(`Failed to drop old partitions for ${tableName}`, { error });
        results.push({
          table: tableName,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return results;
  }

  /**
   * Update partition statistics (row count, size)
   */
  async updatePartitionStats(): Promise<PartitionStats[]> {
    const stats: PartitionStats[] = [];

    try {
      // Get all active partitions
      const partitionsResult = await pool.query<PartitionMetadata>(
        `SELECT * FROM partition_metadata WHERE is_active = true ORDER BY partition_start DESC`
      );

      for (const partition of partitionsResult.rows) {
        try {
          // Get partition statistics
          const statsResult = await pool.query<{
            row_count: string;
            table_size: string;
            indexes_size: string;
          }>(
            `
            SELECT
              pg_class.reltuples::bigint AS row_count,
              pg_total_relation_size(pg_class.oid) AS table_size,
              pg_indexes_size(pg_class.oid) AS indexes_size
            FROM pg_class
            WHERE relname = $1
            `,
            [partition.partitionName]
          );

          if (statsResult.rows.length > 0) {
            const stat = statsResult.rows[0];
            const rowCount = parseInt(stat.row_count, 10);
            const sizeBytes = parseInt(stat.table_size, 10);
            const indexSizeBytes = parseInt(stat.indexes_size, 10);

            // Update metadata
            await pool.query(
              `
              UPDATE partition_metadata
              SET row_count = $1,
                  size_bytes = $2,
                  last_analyzed_at = NOW()
              WHERE partition_name = $3
              `,
              [rowCount, sizeBytes, partition.partitionName]
            );

            stats.push({
              tableName: partition.tableName,
              partitionName: partition.partitionName,
              rowCount,
              sizeBytes,
              sizeMB: Math.round(sizeBytes / 1024 / 1024 * 100) / 100,
              indexSizeBytes,
              indexSizeMB: Math.round(indexSizeBytes / 1024 / 1024 * 100) / 100,
              totalSizeMB: Math.round((sizeBytes + indexSizeBytes) / 1024 / 1024 * 100) / 100,
            });

            logger.debug(`Updated stats for ${partition.partitionName}`, {
              rowCount,
              sizeMB: stats[stats.length - 1].sizeMB,
            });
          }
        } catch (error) {
          logger.error(`Failed to update stats for ${partition.partitionName}`, { error });
        }
      }

      logger.info(`Updated statistics for ${stats.length} partitions`);
    } catch (error) {
      logger.error('Failed to update partition statistics', { error });
      throw error;
    }

    return stats;
  }

  /**
   * Analyze partition health and generate alerts
   */
  async analyzePartitionHealth(): Promise<{
    healthy: boolean;
    alerts: string[];
    stats: PartitionStats[];
  }> {
    const alerts: string[] = [];
    const stats = await this.updatePartitionStats();

    // Check for missing future partitions
    for (const tableName of this.PARTITIONED_TABLES) {
      const futurePartitions = stats.filter(
        (s) => s.tableName === tableName && new Date(s.partitionName.split('_').slice(-2).join('-')) > new Date()
      );

      if (futurePartitions.length < this.FUTURE_PARTITIONS) {
        alerts.push(
          `WARN: ${tableName} has only ${futurePartitions.length}/${this.FUTURE_PARTITIONS} future partitions`
        );
      }
    }

    // Check for oversized partitions (>10GB)
    const oversizedPartitions = stats.filter((s) => s.totalSizeMB > 10240);
    if (oversizedPartitions.length > 0) {
      alerts.push(
        `WARN: ${oversizedPartitions.length} partitions exceed 10GB: ${oversizedPartitions.map((p) => `${p.partitionName} (${p.totalSizeMB}MB)`).join(', ')}`
      );
    }

    // Check for partitions with excessive row count (>50M)
    const crowdedPartitions = stats.filter((s) => s.rowCount > 50_000_000);
    if (crowdedPartitions.length > 0) {
      alerts.push(
        `WARN: ${crowdedPartitions.length} partitions exceed 50M rows: ${crowdedPartitions.map((p) => `${p.partitionName} (${p.rowCount.toLocaleString()})`).join(', ')}`
      );
    }

    // Check for old partitions that should have been dropped
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - this.RETENTION_MONTHS);

    const oldPartitions = await pool.query<PartitionMetadata>(
      `SELECT * FROM partition_metadata WHERE is_active = true AND partition_end < $1`,
      [cutoffDate]
    );

    if (oldPartitions.rows.length > 0) {
      alerts.push(
        `ERROR: ${oldPartitions.rows.length} partitions are beyond retention period and should be dropped`
      );
    }

    const healthy = alerts.filter((a) => a.startsWith('ERROR')).length === 0;

    if (!healthy) {
      logger.error('Partition health check failed', { alerts });
    } else if (alerts.length > 0) {
      logger.warn('Partition health check warnings', { alerts });
    } else {
      logger.info('Partition health check passed');
    }

    return { healthy, alerts, stats };
  }

  /**
   * Get partition summary for monitoring dashboard
   */
  async getPartitionSummary(): Promise<{
    totalPartitions: number;
    activePartitions: number;
    totalRows: bigint;
    totalSizeGB: number;
    oldestPartition: Date | null;
    newestPartition: Date | null;
    byTable: Record<string, { count: number; rows: bigint; sizeGB: number }>;
  }> {
    const result = await pool.query<{
      total_partitions: string;
      active_partitions: string;
      total_rows: string;
      total_size_bytes: string;
      oldest_partition: Date;
      newest_partition: Date;
    }>(
      `
      SELECT
        COUNT(*) as total_partitions,
        COUNT(*) FILTER (WHERE is_active = true) as active_partitions,
        COALESCE(SUM(row_count), 0) as total_rows,
        COALESCE(SUM(size_bytes), 0) as total_size_bytes,
        MIN(partition_start) as oldest_partition,
        MAX(partition_end) as newest_partition
      FROM partition_metadata
      WHERE is_active = true
      `
    );

    const byTableResult = await pool.query<{
      table_name: string;
      count: string;
      total_rows: string;
      total_size_bytes: string;
    }>(
      `
      SELECT
        table_name,
        COUNT(*) as count,
        COALESCE(SUM(row_count), 0) as total_rows,
        COALESCE(SUM(size_bytes), 0) as total_size_bytes
      FROM partition_metadata
      WHERE is_active = true
      GROUP BY table_name
      `
    );

    const row = result.rows[0];
    const byTable: Record<string, { count: number; rows: bigint; sizeGB: number }> = {};

    for (const tableRow of byTableResult.rows) {
      byTable[tableRow.table_name] = {
        count: parseInt(tableRow.count, 10),
        rows: BigInt(tableRow.total_rows),
        sizeGB: Math.round(parseInt(tableRow.total_size_bytes, 10) / 1024 / 1024 / 1024 * 100) / 100,
      };
    }

    return {
      totalPartitions: parseInt(row.total_partitions, 10),
      activePartitions: parseInt(row.active_partitions, 10),
      totalRows: BigInt(row.total_rows),
      totalSizeGB: Math.round(parseInt(row.total_size_bytes, 10) / 1024 / 1024 / 1024 * 100) / 100,
      oldestPartition: row.oldest_partition,
      newestPartition: row.newest_partition,
      byTable,
    };
  }

  /**
   * Run all maintenance tasks (typically called by cron job)
   */
  async runMaintenance(): Promise<{
    createdPartitions: { table: string; message: string }[];
    droppedPartitions: { table: string; message: string }[];
    healthCheck: { healthy: boolean; alerts: string[] };
  }> {
    logger.info('Starting partition maintenance');

    const createdPartitions = await this.createFuturePartitions();
    const droppedPartitions = await this.dropOldPartitions();
    const healthCheck = await this.analyzePartitionHealth();

    logger.info('Partition maintenance completed', {
      created: createdPartitions.length,
      dropped: droppedPartitions.length,
      healthy: healthCheck.healthy,
    });

    return {
      createdPartitions,
      droppedPartitions,
      healthCheck: {
        healthy: healthCheck.healthy,
        alerts: healthCheck.alerts,
      },
    };
  }
}

export const partitionManagementService = new PartitionManagementService();
