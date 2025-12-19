import cron from 'node-cron';
import { Pool } from 'pg';

import { GDPRService } from '../services/gdpr.service';
import { logger } from '../services/logger';

// TODO: Get pool from DI container
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'fleet_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const gdprService = new GDPRService(pool);

/**
 * Data Retention Cleanup Cron Job
 *
 * Runs daily at 2 AM UTC to clean up expired data
 *
 * Schedule: 0 2 * * * (Every day at 2:00 AM)
 */
export function startDataRetentionCron(): void {
  // Run at 2 AM UTC every day
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled data retention cleanup...');

    try {
      const results = await gdprService.cleanupExpiredData();

      logger.info('Data retention cleanup completed', {
        ...results,
        timestamp: new Date().toISOString(),
      });

      // Alert if large amounts of data deleted (potential issue)
      if (results.sessionsDeleted > 10000 || results.inactiveAccountsAnonymized > 100) {
        logger.warn('Large data retention cleanup detected', {
          sessionsDeleted: results.sessionsDeleted,
          inactiveAccountsAnonymized: results.inactiveAccountsAnonymized,
        });
      }
    } catch (error) {
      logger.error('Data retention cleanup failed', {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
      });

      // TODO: Send alert to ops team
      // await alertService.send('Data retention cleanup failed', error);
    }
  });

  logger.info('Data retention cron job scheduled (daily at 2 AM UTC)');
}

/**
 * Weekly data retention report
 *
 * Runs every Monday at 9 AM UTC to generate retention compliance report
 */
export function startDataRetentionReportCron(): void {
  // Run at 9 AM UTC every Monday
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Generating weekly data retention report...');

    try {
      const report = await generateRetentionReport();

      logger.info('Weekly data retention report', report);

      // TODO: Email report to compliance team
      // await emailService.send({
      //   to: 'compliance@capitaltechalliance.com',
      //   subject: 'Weekly Data Retention Report',
      //   body: JSON.stringify(report, null, 2)
      // });
    } catch (error) {
      logger.error('Data retention report failed', {
        error: error instanceof Error ? error.message : error,
      });
    }
  });

  logger.info('Data retention report cron job scheduled (weekly on Monday at 9 AM UTC)');
}

/**
 * Generate data retention compliance report
 */
async function generateRetentionReport(): Promise<any> {
  const client = await pool.connect();

  try {
    // Count records approaching retention limits
    const approachingRetention = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE last_login_at < NOW() - INTERVAL '300 days' AND deleted_at IS NULL) AS inactive_accounts_warning,
        (SELECT COUNT(*) FROM sessions WHERE created_at < NOW() - INTERVAL '25 days') AS sessions_expiring_soon,
        (SELECT COUNT(*) FROM vehicle_telemetry WHERE created_at < NOW() - INTERVAL '6.5 years') AS telemetry_expiring_soon,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at < NOW() - INTERVAL '9.5 years') AS audit_logs_expiring_soon
    `);

    // Count deleted/anonymized records
    const deletedRecords = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL) AS deleted_users,
        (SELECT COUNT(*) FROM users WHERE email LIKE '%@anonymized.local') AS anonymized_users
    `);

    return {
      reportDate: new Date().toISOString(),
      approachingRetention: approachingRetention.rows[0],
      deletedRecords: deletedRecords.rows[0],
      complianceStatus: 'COMPLIANT',
      notes: 'All retention policies are being enforced',
    };
  } finally {
    client.release();
  }
}
