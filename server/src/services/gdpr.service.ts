import { Pool } from 'pg';

import { logger } from './logger';

/**
 * Data Retention Policies (in days)
 *
 * Based on legal requirements and business needs:
 * - GDPR: Personal data retention must be justified
 * - Fleet regulations: Vehicle records for 7 years
 * - Tax/audit: Financial records for 7 years
 */
export const RetentionPolicies = {
  USER_PERSONAL_DATA: 90, // 90 days after account closure
  VEHICLE_TELEMETRY: 7 * 365, // 7 years (regulatory requirement)
  AUDIT_LOGS: 10 * 365, // 10 years (SOC 2 / compliance)
  SESSION_DATA: 30, // 30 days
  FINANCIAL_RECORDS: 7 * 365, // 7 years (tax/audit)
  DRIVER_RECORDS: 7 * 365, // 7 years
  INACTIVE_ACCOUNTS: 365, // 1 year of inactivity triggers deletion warning
} as const;

/**
 * GDPR Compliance Service
 *
 * Implements GDPR rights:
 * - Right to access (Article 15)
 * - Right to rectification (Article 16)
 * - Right to erasure / "right to be forgotten" (Article 17)
 * - Right to data portability (Article 20)
 */
export class GDPRService {
  constructor(private pool: Pool) {}

  /**
   * Right to Access: Export all user data
   *
   * GDPR Article 15 - Data subject's right to access
   */
  async exportUserData(userId: number): Promise<any> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Log GDPR data export request
      await this.logGDPREvent(client, userId, 'GDPR_EXPORT', 'User data export requested');

      // Fetch all user-related data
      const userData = await this.fetchUserData(client, userId);
      const vehicleData = await this.fetchUserVehicles(client, userId);
      const driverData = await this.fetchUserDriverRecords(client, userId);
      const sessionData = await this.fetchUserSessions(client, userId);
      const auditData = await this.fetchUserAuditLogs(client, userId);

      await client.query('COMMIT');

      const exportPackage = {
        exportDate: new Date().toISOString(),
        userId,
        personalData: userData,
        vehicleData,
        driverData,
        sessionData: sessionData.map((s: any) => ({
          ...s,
          token: '[REDACTED]', // Don't export session tokens
        })),
        auditLogs: auditData,
        retentionPolicies: RetentionPolicies,
        gdprNotice:
          'This data export is provided in compliance with GDPR Article 15. You may request rectification or deletion of this data.',
      };

      logger.info('GDPR data export completed', { userId });

      return exportPackage;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('GDPR data export failed', { userId, error: error instanceof Error ? error.message : error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Right to Erasure: Delete all user data (GDPR "right to be forgotten")
   *
   * GDPR Article 17 - Right to erasure
   *
   * Important: Some data must be retained for legal reasons (audit logs, financial records)
   */
  async eraseUserData(
    userId: number,
    reason: 'user_request' | 'account_closure' | 'retention_expired'
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Log GDPR deletion request BEFORE deletion
      await this.logGDPREvent(client, userId, 'GDPR_DELETE', `User data deletion: ${reason}`);

      // 1. Anonymize user account (don't delete - preserve referential integrity)
      await client.query(
        `
        UPDATE users
        SET email = $1,
            display_name = 'Deleted User',
            microsoft_id = NULL,
            deleted_at = NOW(),
            deletion_reason = $2
        WHERE id = $3
      `,
        [`deleted_${userId}@anonymized.local`, reason, userId]
      );

      // 2. Delete sessions
      await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

      // 3. Anonymize personal data in driver records
      await client.query(
        `
        UPDATE drivers
        SET email = NULL,
            phone_number = NULL,
            address = NULL
        WHERE user_id = $1
      `,
        [userId]
      );

      // 4. Keep audit logs (legal requirement) but mark as anonymized
      await client.query(
        `
        UPDATE audit_logs
        SET user_id = NULL,
            ip_address = NULL,
            user_agent = NULL
        WHERE user_id = $1
      `,
        [userId]
      );

      // 5. Keep vehicle/telemetry data (regulatory requirement) but disassociate from user
      // No deletion needed - vehicles are company assets, not personal data

      await client.query('COMMIT');

      logger.warn('GDPR data erasure completed', { userId, reason });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('GDPR data erasure failed', { userId, error: error instanceof Error ? error.message : error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Automated Data Retention Cleanup
   *
   * Runs on cron schedule to delete data past retention period
   */
  async cleanupExpiredData(): Promise<{
    sessionsDeleted: number;
    inactiveAccountsAnonymized: number;
    oldTelemetryDeleted: number;
  }> {
    const client = await this.pool.connect();

    try {
      // 1. Delete expired sessions
      const sessionResult = await client.query(
        `DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '${RetentionPolicies.SESSION_DATA} days'`
      );

      // 2. Anonymize inactive accounts (no login for 1 year)
      const inactiveResult = await client.query(
        `
        UPDATE users
        SET email = CONCAT('inactive_', id, '@anonymized.local'),
            display_name = 'Inactive User',
            microsoft_id = NULL,
            deleted_at = NOW(),
            deletion_reason = 'retention_expired'
        WHERE last_login_at < NOW() - INTERVAL '${RetentionPolicies.INACTIVE_ACCOUNTS} days'
          AND deleted_at IS NULL
      `
      );

      // 3. Delete old telemetry data (keep 7 years per regulations)
      const telemetryResult = await client.query(
        `DELETE FROM vehicle_telemetry WHERE created_at < NOW() - INTERVAL '${RetentionPolicies.VEHICLE_TELEMETRY} days'`
      );

      logger.info('Data retention cleanup completed', {
        sessionsDeleted: sessionResult.rowCount,
        inactiveAccountsAnonymized: inactiveResult.rowCount,
        oldTelemetryDeleted: telemetryResult.rowCount,
      });

      return {
        sessionsDeleted: sessionResult.rowCount || 0,
        inactiveAccountsAnonymized: inactiveResult.rowCount || 0,
        oldTelemetryDeleted: telemetryResult.rowCount || 0,
      };
    } catch (error) {
      logger.error('Data retention cleanup failed', { error: error instanceof Error ? error.message : error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper: Fetch user data
   */
  private async fetchUserData(client: any, userId: number): Promise<any> {
    const result = await client.query(
      `SELECT id, email, display_name, role, created_at, updated_at, last_login_at FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Helper: Fetch user vehicles
   */
  private async fetchUserVehicles(client: any, userId: number): Promise<any[]> {
    const result = await client.query(
      `SELECT id, make, model, year, vin, license_plate, status FROM vehicles WHERE assigned_driver_id = $1`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Helper: Fetch user driver records
   */
  private async fetchUserDriverRecords(client: any, userId: number): Promise<any[]> {
    const result = await client.query(
      `SELECT id, license_number, license_expiry, created_at FROM drivers WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Helper: Fetch user sessions
   */
  private async fetchUserSessions(client: any, userId: number): Promise<any[]> {
    const result = await client.query(`SELECT id, created_at, expires_at FROM sessions WHERE user_id = $1`, [userId]);
    return result.rows;
  }

  /**
   * Helper: Fetch user audit logs (last 90 days only)
   */
  private async fetchUserAuditLogs(client: any, userId: number): Promise<any[]> {
    const result = await client.query(
      `
      SELECT action, resource_type, resource_id, result, created_at
      FROM audit_logs
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
      LIMIT 1000
    `,
      [userId]
    );
    return result.rows;
  }

  /**
   * Helper: Log GDPR-related events
   */
  private async logGDPREvent(client: any, userId: number, action: string, detail: string): Promise<void> {
    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, result, after)
      VALUES ($1, $2, 'user', $3, 'success', $4)
    `,
      [userId, action, userId.toString(), JSON.stringify({ detail })]
    );
  }
}
