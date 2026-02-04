/**
 * Constraint Monitoring Service
 *
 * Monitors and tracks data integrity constraint violations:
 * - Logs constraint violations for analysis
 * - Identifies patterns in data quality issues
 * - Generates data quality reports
 * - Sends alerts for repeated violations
 *
 * Phase 4 - Agent 10
 * Date: 2026-02-02
 */

import { pool } from '../db';
import { logger } from '../lib/logger';

interface ConstraintViolation {
  id: string;
  tenantId: string | null;
  tableName: string;
  constraintName: string;
  violationType: 'check' | 'foreign_key' | 'unique' | 'not_null';
  attemptedValue: any;
  errorMessage: string;
  sqlState: string;
  occurredAt: Date;
  userId: string | null;
  ipAddress: string | null;
  metadata: Record<string, any>;
}

interface ConstraintStats {
  constraintName: string;
  tableName: string;
  violationType: string;
  violationCount: number;
  firstViolation: Date;
  lastViolation: Date;
  affectedTenants: number;
  affectedUsers: number;
}

interface DataQualityReport {
  period: string;
  totalViolations: number;
  byTable: Record<string, number>;
  byConstraint: Record<string, number>;
  byType: Record<string, number>;
  topViolators: { constraintName: string; count: number; tableName: string }[];
  trends: {
    daily: { date: string; count: number }[];
    weekly: { week: string; count: number }[];
  };
  recommendations: string[];
}

export class ConstraintMonitoringService {
  /**
   * Initialize constraint violation logging table
   */
  async initializeLogging(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS constraint_violations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID,
          table_name VARCHAR(100) NOT NULL,
          constraint_name VARCHAR(200) NOT NULL,
          violation_type VARCHAR(50) NOT NULL,
          attempted_value JSONB,
          error_message TEXT NOT NULL,
          sql_state VARCHAR(10) NOT NULL,
          occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          user_id UUID,
          ip_address VARCHAR(45),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_constraint_violations_table
          ON constraint_violations(table_name, occurred_at DESC);

        CREATE INDEX IF NOT EXISTS idx_constraint_violations_constraint
          ON constraint_violations(constraint_name, occurred_at DESC);

        CREATE INDEX IF NOT EXISTS idx_constraint_violations_tenant
          ON constraint_violations(tenant_id, occurred_at DESC)
          WHERE tenant_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_constraint_violations_occurred
          ON constraint_violations(occurred_at DESC);
      `);

      logger.info('Constraint violation logging initialized');
    } finally {
      client.release();
    }
  }

  /**
   * Log a constraint violation
   */
  async logViolation(params: {
    tenantId?: string;
    tableName: string;
    constraintName: string;
    violationType: 'check' | 'foreign_key' | 'unique' | 'not_null';
    attemptedValue?: any;
    errorMessage: string;
    sqlState: string;
    userId?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const result = await pool.query<{ id: string }>(
        `
        INSERT INTO constraint_violations (
          tenant_id, table_name, constraint_name, violation_type,
          attempted_value, error_message, sql_state,
          user_id, ip_address, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
        `,
        [
          params.tenantId || null,
          params.tableName,
          params.constraintName,
          params.violationType,
          params.attemptedValue ? JSON.stringify(params.attemptedValue) : null,
          params.errorMessage,
          params.sqlState,
          params.userId || null,
          params.ipAddress || null,
          params.metadata || {},
        ]
      );

      const violationId = result.rows[0].id;

      logger.warn('Constraint violation logged', {
        violationId,
        tableName: params.tableName,
        constraintName: params.constraintName,
      });

      // Check if this constraint is being violated frequently
      await this.checkForRepeatedViolations(params.constraintName, params.tableName);

      return violationId;
    } catch (error) {
      logger.error('Failed to log constraint violation', { error, params });
      throw error;
    }
  }

  /**
   * Check for repeated violations and send alerts
   */
  private async checkForRepeatedViolations(
    constraintName: string,
    tableName: string
  ): Promise<void> {
    try {
      // Count violations in last hour
      const result = await pool.query<{ count: string }>(
        `
        SELECT COUNT(*) as count
        FROM constraint_violations
        WHERE constraint_name = $1
          AND table_name = $2
          AND occurred_at > NOW() - INTERVAL '1 hour'
        `,
        [constraintName, tableName]
      );

      const count = parseInt(result.rows[0].count, 10);

      // Alert if more than 10 violations in last hour
      if (count > 10) {
        logger.error('ALERT: Repeated constraint violations detected', {
          constraintName,
          tableName,
          count,
          timeframe: '1 hour',
        });

        // TODO: Send email/SMS/Slack alert to administrators
      }
    } catch (error) {
      logger.error('Failed to check repeated violations', { error });
    }
  }

  /**
   * Parse PostgreSQL error and log violation
   */
  async logErrorAsViolation(
    error: any,
    context: {
      tenantId?: string;
      userId?: string;
      ipAddress?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<string | null> {
    // PostgreSQL error codes:
    // 23000: integrity_constraint_violation
    // 23001: restrict_violation
    // 23502: not_null_violation
    // 23503: foreign_key_violation
    // 23505: unique_violation
    // 23514: check_violation

    const sqlState = error.code || error.sqlState;
    if (!sqlState || !sqlState.startsWith('23')) {
      return null; // Not a constraint violation
    }

    let violationType: 'check' | 'foreign_key' | 'unique' | 'not_null' = 'check';
    if (sqlState === '23502') violationType = 'not_null';
    else if (sqlState === '23503') violationType = 'foreign_key';
    else if (sqlState === '23505') violationType = 'unique';
    else if (sqlState === '23514') violationType = 'check';

    // Parse table and constraint name from error message
    const message = error.message || '';
    const tableMatch = message.match(/relation "([^"]+)"/);
    const constraintMatch = message.match(/constraint "([^"]+)"/);

    const tableName = tableMatch ? tableMatch[1] : 'unknown';
    const constraintName = constraintMatch ? constraintMatch[1] : 'unknown';

    return this.logViolation({
      tenantId: context.tenantId,
      tableName,
      constraintName,
      violationType,
      errorMessage: message,
      sqlState,
      userId: context.userId,
      ipAddress: context.ipAddress,
      metadata: context.metadata,
    });
  }

  /**
   * Get constraint violation statistics
   */
  async getConstraintStats(
    startDate: Date,
    endDate: Date,
    tenantId?: string
  ): Promise<ConstraintStats[]> {
    const result = await pool.query<{
      constraint_name: string;
      table_name: string;
      violation_type: string;
      violation_count: string;
      first_violation: Date;
      last_violation: Date;
      affected_tenants: string;
      affected_users: string;
    }>(
      `
      SELECT
        constraint_name,
        table_name,
        violation_type,
        COUNT(*) as violation_count,
        MIN(occurred_at) as first_violation,
        MAX(occurred_at) as last_violation,
        COUNT(DISTINCT tenant_id) as affected_tenants,
        COUNT(DISTINCT user_id) as affected_users
      FROM constraint_violations
      WHERE occurred_at BETWEEN $1 AND $2
        ${tenantId ? 'AND tenant_id = $3' : ''}
      GROUP BY constraint_name, table_name, violation_type
      ORDER BY violation_count DESC
      `,
      tenantId ? [startDate, endDate, tenantId] : [startDate, endDate]
    );

    return result.rows.map((row) => ({
      constraintName: row.constraint_name,
      tableName: row.table_name,
      violationType: row.violation_type,
      violationCount: parseInt(row.violation_count, 10),
      firstViolation: row.first_violation,
      lastViolation: row.last_violation,
      affectedTenants: parseInt(row.affected_tenants, 10),
      affectedUsers: parseInt(row.affected_users, 10),
    }));
  }

  /**
   * Generate comprehensive data quality report
   */
  async generateDataQualityReport(
    startDate: Date,
    endDate: Date,
    tenantId?: string
  ): Promise<DataQualityReport> {
    const stats = await this.getConstraintStats(startDate, endDate, tenantId);

    // Total violations
    const totalViolations = stats.reduce((sum, s) => sum + s.violationCount, 0);

    // By table
    const byTable: Record<string, number> = {};
    stats.forEach((s) => {
      byTable[s.tableName] = (byTable[s.tableName] || 0) + s.violationCount;
    });

    // By constraint
    const byConstraint: Record<string, number> = {};
    stats.forEach((s) => {
      byConstraint[s.constraintName] = (byConstraint[s.constraintName] || 0) + s.violationCount;
    });

    // By type
    const byType: Record<string, number> = {};
    stats.forEach((s) => {
      byType[s.violationType] = (byType[s.violationType] || 0) + s.violationCount;
    });

    // Top violators
    const topViolators = stats.slice(0, 10).map((s) => ({
      constraintName: s.constraintName,
      count: s.violationCount,
      tableName: s.tableName,
    }));

    // Daily trend
    const dailyResult = await pool.query<{ date: string; count: string }>(
      `
      SELECT
        DATE(occurred_at) as date,
        COUNT(*) as count
      FROM constraint_violations
      WHERE occurred_at BETWEEN $1 AND $2
        ${tenantId ? 'AND tenant_id = $3' : ''}
      GROUP BY DATE(occurred_at)
      ORDER BY date
      `,
      tenantId ? [startDate, endDate, tenantId] : [startDate, endDate]
    );

    // Weekly trend
    const weeklyResult = await pool.query<{ week: string; count: string }>(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('week', occurred_at), 'YYYY-WW') as week,
        COUNT(*) as count
      FROM constraint_violations
      WHERE occurred_at BETWEEN $1 AND $2
        ${tenantId ? 'AND tenant_id = $3' : ''}
      GROUP BY DATE_TRUNC('week', occurred_at)
      ORDER BY week
      `,
      tenantId ? [startDate, endDate, tenantId] : [startDate, endDate]
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (totalViolations > 1000) {
      recommendations.push('HIGH: System-wide data quality issues detected. Review data entry processes.');
    }

    const checkViolations = stats.filter((s) => s.violationType === 'check');
    if (checkViolations.length > 0 && checkViolations[0].violationCount > 100) {
      recommendations.push(
        `Check constraint "${checkViolations[0].constraintName}" on ${checkViolations[0].tableName} is frequently violated. Consider relaxing constraint or improving validation.`
      );
    }

    const fkViolations = stats.filter((s) => s.violationType === 'foreign_key');
    if (fkViolations.length > 0 && fkViolations[0].violationCount > 50) {
      recommendations.push(
        `Foreign key violations on ${fkViolations[0].tableName}. Review referential integrity and cascade rules.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Data quality is good. No major issues detected.');
    }

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalViolations,
      byTable,
      byConstraint,
      byType,
      topViolators,
      trends: {
        daily: dailyResult.rows.map((r) => ({
          date: r.date,
          count: parseInt(r.count, 10),
        })),
        weekly: weeklyResult.rows.map((r) => ({
          week: r.week,
          count: parseInt(r.count, 10),
        })),
      },
      recommendations,
    };
  }

  /**
   * Clean up old violation logs (keep last 90 days)
   */
  async cleanupOldViolations(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await pool.query<{ deleted_count: string }>(
      `
      WITH deleted AS (
        DELETE FROM constraint_violations
        WHERE occurred_at < $1
        RETURNING id
      )
      SELECT COUNT(*) as deleted_count FROM deleted
      `,
      [cutoffDate]
    );

    const deletedCount = parseInt(result.rows[0].deleted_count, 10);

    logger.info('Cleaned up old constraint violations', {
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    });

    return deletedCount;
  }
}

export const constraintMonitoringService = new ConstraintMonitoringService();

/**
 * Express middleware to automatically log constraint violations
 */
export function constraintViolationMiddleware(req: any, res: any, next: any) {
  // Wrap the original send method to catch errors
  const originalSend = res.send;

  res.send = function (data: any) {
    // If response is an error with constraint violation
    if (res.statusCode >= 400 && data) {
      const error = typeof data === 'string' ? JSON.parse(data) : data;

      if (error.code && error.code.startsWith('23')) {
        // Log constraint violation asynchronously
        constraintMonitoringService
          .logErrorAsViolation(error, {
            tenantId: req.user?.tenantId,
            userId: req.user?.id,
            ipAddress: req.ip,
            metadata: {
              method: req.method,
              path: req.path,
              body: req.body,
            },
          })
          .catch((err) => {
            logger.error('Failed to log constraint violation in middleware', { error: err });
          });
      }
    }

    return originalSend.call(this, data);
  };

  next();
}
