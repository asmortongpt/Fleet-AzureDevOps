/**
 * Audit Service
 * Centralized service for logging permission checks and security events
 */

import pool from '../db';
import { AuditLogEntry } from '../permissions/types';

class AuditService {
  /**
   * Log a permission check
   */
  async logPermissionCheck(entry: Partial<AuditLogEntry> & {
    user_id: string;
    action: string;
    allowed: boolean;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO permission_audit_log
         (user_id, action, resource_type, resource_id, allowed, reason, timestamp, context, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)`,
        [
          entry.user_id,
          entry.action,
          entry.resource_type || null,
          entry.resource_id || null,
          entry.allowed,
          entry.reason || null,
          entry.context ? JSON.stringify(entry.context) : null,
          entry.ip_address || null,
          entry.user_agent || null
        ]
      );
    } catch (error) {
      console.error('Failed to log permission check:', error);
      // Don't throw - logging failure shouldn't block the request
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: {
    user_id?: string;
    event_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ip_address?: string;
    user_agent?: string;
    context?: Record<string, any>;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO security_audit_log
         (user_id, event_type, severity, description, ip_address, user_agent, context, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          event.user_id || null,
          event.event_type,
          event.severity,
          event.description,
          event.ip_address || null,
          event.user_agent || null,
          event.context ? JSON.stringify(event.context) : null
        ]
      );
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get permission audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      allowed?: boolean;
    } = {}
  ): Promise<AuditLogEntry[]> {
    const {
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      allowed
    } = options;

    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(endDate);
    }

    if (allowed !== undefined) {
      conditions.push(`allowed = $${paramIndex++}`);
      params.push(allowed);
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT * FROM permission_audit_log
       WHERE ${conditions.join(' AND ')}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return result.rows.map(row => ({
      user_id: row.user_id,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      allowed: row.allowed,
      reason: row.reason,
      timestamp: row.timestamp,
      context: row.context,
      ip_address: row.ip_address,
      user_agent: row.user_agent
    }));
  }

  /**
   * Get failed permission attempts (security monitoring)
   */
  async getFailedAttempts(options: {
    limit?: number;
    since?: Date;
    userId?: string;
  } = {}): Promise<AuditLogEntry[]> {
    const {
      limit = 100,
      since = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      userId
    } = options;

    const conditions: string[] = ['allowed = false', 'timestamp >= $1'];
    const params: any[] = [since];
    let paramIndex = 2;

    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(userId);
    }

    params.push(limit);

    const result = await pool.query(
      `SELECT * FROM permission_audit_log
       WHERE ${conditions.join(' AND ')}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex}`,
      params
    );

    return result.rows;
  }

  /**
   * Get audit summary for a resource
   */
  async getResourceAuditSummary(
    resourceType: string,
    resourceId: string
  ): Promise<{
    total_accesses: number;
    unique_users: number;
    failed_attempts: number;
    last_accessed: Date | null;
  }> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_accesses,
         COUNT(DISTINCT user_id) as unique_users,
         COUNT(*) FILTER (WHERE allowed = false) as failed_attempts,
         MAX(timestamp) as last_accessed
       FROM permission_audit_log
       WHERE resource_type = $1 AND resource_id = $2`,
      [resourceType, resourceId]
    );

    return {
      total_accesses: parseInt(result.rows[0].total_accesses) || 0,
      unique_users: parseInt(result.rows[0].unique_users) || 0,
      failed_attempts: parseInt(result.rows[0].failed_attempts) || 0,
      last_accessed: result.rows[0].last_accessed
    };
  }

  /**
   * Clean up old audit logs (for compliance retention policies)
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `DELETE FROM permission_audit_log
       WHERE timestamp < $1`,
      [cutoffDate]
    );

    return result.rowCount || 0;
  }
}

export const auditService = new AuditService();
