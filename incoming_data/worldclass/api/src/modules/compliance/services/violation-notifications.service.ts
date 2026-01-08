import nodemailer from 'nodemailer';

import { pool } from '../../../config/database';
import logger from '../../../utils/logger';

/**
 * Violation Notifications Service
 * Handles real-time alerts and email notifications for policy violations
 */

interface ViolationNotification {
  violationId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  violationType: string;
  description: string;
  vehicleNumber?: string;
  driverName?: string;
  recipients: string[];
  escalation?: boolean;
}

export class ViolationNotificationsService {
  private static emailTransporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  static initializeEmailTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false, // TLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      logger.info('Email transporter initialized for violation notifications');
    } else {
      logger.warn('Email configuration missing - notifications will be logged only');
    }
  }

  /**
   * Send notification for a new violation
   */
  static async sendViolationNotification(notification: ViolationNotification): Promise<void> {
    try {
      const { violationId, severity, violationType, description, vehicleNumber, driverName, recipients, escalation } = notification;

      // Log notification
      logger.info('Sending violation notification', {
        violationId,
        severity,
        violationType,
        recipientCount: recipients.length,
        escalation,
      });

      // Send email notifications
      if (this.emailTransporter && recipients.length > 0) {
        const subject = escalation
          ? `🚨 ESCALATED: ${this.getSeverityLabel(severity)} Policy Violation`
          : `⚠️ ${this.getSeverityLabel(severity)} Policy Violation Detected`;

        const html = this.generateEmailTemplate({
          severity,
          violationType,
          description,
          vehicleNumber,
          driverName,
          escalation,
        });

        await this.emailTransporter.sendMail({
          from: `Fleet Management <${process.env.EMAIL_USER}>`,
          to: recipients.join(', '),
          subject,
          html,
        });

        // Update notification status in database
        await pool.query(
          `UPDATE policy_violations
           SET notification_sent = true,
               notification_sent_at = NOW(),
               notification_recipients = $1
           WHERE id = $2`,
          [recipients, violationId]
        );

        logger.info('Violation notification sent successfully', { violationId, recipientCount: recipients.length });
      } else {
        logger.warn('Email not configured or no recipients - notification logged only', { violationId });
      }

      // Send push notification (if configured)
      await this.sendPushNotification(notification);

      // Send Teams notification (if configured)
      await this.sendTeamsNotification(notification);

    } catch (error) {
      logger.error('Failed to send violation notification', {
        violationId: notification.violationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send escalation notification for critical violations
   */
  static async sendEscalationNotification(violationId: string): Promise<void> {
    try {
      // Get violation details
      const result = await pool.query(
        'SELECT * FROM policy_violations WHERE id = $1',
        [violationId]
      );

      if (result.rows.length === 0) {
        logger.error('Violation not found for escalation', { violationId });
        return;
      }

      const violation = result.rows[0];

      // Get escalation recipients (managers, admins)
      const recipientsResult = await pool.query(
        `SELECT email FROM users
         WHERE tenant_id = $1
         AND role IN ('admin', 'fleet_manager')
         AND is_active = true`,
        [violation.tenant_id]
      );

      const recipients = recipientsResult.rows.map(row => row.email);

      if (recipients.length === 0) {
        logger.warn('No escalation recipients found', { tenantId: violation.tenant_id });
        return;
      }

      // Send escalation notification
      await this.sendViolationNotification({
        violationId: violation.id,
        severity: violation.severity,
        violationType: violation.violation_type,
        description: violation.description,
        vehicleNumber: violation.vehicle_number,
        driverName: violation.driver_name,
        recipients,
        escalation: true,
      });

      // Update escalation status
      await pool.query(
        `UPDATE policy_violations
         SET escalation_sent = true,
             escalation_sent_at = NOW(),
             status = 'escalated'
         WHERE id = $1`,
        [violationId]
      );

      logger.info('Escalation notification sent', { violationId, recipientCount: recipients.length });

    } catch (error) {
      logger.error('Failed to send escalation notification', {
        violationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check for violations requiring escalation
   */
  static async checkEscalationRequired(): Promise<void> {
    try {
      // Find critical violations open for more than 24 hours
      const result = await pool.query(
        `SELECT id FROM policy_violations
         WHERE severity = 'critical'
         AND status = 'open'
         AND detected_at < NOW() - INTERVAL '24 hours'
         AND escalation_sent = false`
      );

      for (const row of result.rows) {
        await this.sendEscalationNotification(row.id);
      }

      if (result.rows.length > 0) {
        logger.info('Escalation check completed', { escalatedCount: result.rows.length });
      }

    } catch (error) {
      logger.error('Error checking for escalation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send daily summary of violations
   */
  static async sendDailySummary(tenantId: string): Promise<void> {
    try {
      // Get yesterday's violations
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_violations,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
          COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
         FROM policy_violations
         WHERE tenant_id = $1
         AND occurred_at >= CURRENT_DATE - INTERVAL '1 day'
         AND occurred_at < CURRENT_DATE`,
        [tenantId]
      );

      const summary = result.rows[0];

      // Get recipient list
      const recipientsResult = await pool.query(
        `SELECT email FROM users
         WHERE tenant_id = $1
         AND role IN ('admin', 'fleet_manager')
         AND is_active = true`,
        [tenantId]
      );

      const recipients = recipientsResult.rows.map(row => row.email);

      if (recipients.length === 0 || Number(summary.total_violations) === 0) {
        return;
      }

      // Send summary email
      if (this.emailTransporter) {
        const html = this.generateSummaryEmailTemplate(summary);

        await this.emailTransporter.sendMail({
          from: `Fleet Management <${process.env.EMAIL_USER}>`,
          to: recipients.join(', '),
          subject: `📊 Daily Violations Summary - ${new Date().toLocaleDateString()}`,
          html,
        });

        logger.info('Daily summary sent', { tenantId, recipientCount: recipients.length });
      }

    } catch (error) {
      logger.error('Failed to send daily summary', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send push notification (placeholder for actual push service integration)
   */
  private static async sendPushNotification(notification: ViolationNotification): Promise<void> {
    // Integrate with your push notification service (e.g., Firebase, OneSignal)
    // This is a placeholder implementation
    logger.info('Push notification would be sent', {
      violationId: notification.violationId,
      severity: notification.severity,
    });
  }

  /**
   * Send Microsoft Teams notification
   */
  private static async sendTeamsNotification(notification: ViolationNotification): Promise<void> {
    // Integrate with Microsoft Teams webhook
    // This is a placeholder implementation
    logger.info('Teams notification would be sent', {
      violationId: notification.violationId,
      severity: notification.severity,
    });
  }

  /**
   * Get severity label with emoji
   */
  private static getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      critical: '🔴 CRITICAL',
      high: '🟠 HIGH',
      medium: '🟡 MEDIUM',
      low: '🟢 LOW',
    };
    return labels[severity] || severity.toUpperCase();
  }

  /**
   * Generate email HTML template for violation notification
   */
  private static generateEmailTemplate(data: {
    severity: string;
    violationType: string;
    description: string;
    vehicleNumber?: string;
    driverName?: string;
    escalation?: boolean;
  }): string {
    const severityColors: Record<string, string> = {
      critical: '#DC2626',
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981',
    };

    const color = severityColors[data.severity] || '#6B7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
          .detail { margin: 10px 0; padding: 10px; background-color: white; border-left: 4px solid ${color}; }
          .label { font-weight: bold; color: #4b5563; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${color}; color: white; font-weight: bold; }
          ${data.escalation ? '.escalation { background-color: #fef2f2; border: 2px solid #DC2626; padding: 15px; margin: 10px 0; border-radius: 8px; }' : ''}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${data.escalation ? '🚨 ESCALATED VIOLATION' : '⚠️ Policy Violation Alert'}</h2>
          </div>
          <div class="content">
            ${data.escalation ? '<div class="escalation"><strong>⚠️ This violation has been escalated due to lack of resolution.</strong></div>' : ''}

            <div class="detail">
              <span class="label">Severity:</span> <span class="badge">${data.severity.toUpperCase()}</span>
            </div>

            <div class="detail">
              <span class="label">Violation Type:</span> ${data.violationType}
            </div>

            <div class="detail">
              <span class="label">Description:</span><br>${data.description}
            </div>

            ${data.vehicleNumber ? `<div class="detail"><span class="label">Vehicle:</span> ${data.vehicleNumber}</div>` : ''}

            ${data.driverName ? `<div class="detail"><span class="label">Driver:</span> ${data.driverName}</div>` : ''}

            <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
              <p style="margin: 0;"><strong>Action Required:</strong></p>
              <p style="margin: 5px 0 0 0;">Please review this violation in the Fleet Management System and take appropriate action.</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from Fleet Management System.</p>
            <p>© ${new Date().getFullYear()} Fleet Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate daily summary email template
   */
  private static generateSummaryEmailTemplate(summary: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background-color: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
          .stat-value { font-size: 32px; font-weight: bold; color: #1f2937; }
          .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
          .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">📊 Daily Violations Summary</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
          </div>
          <div class="content">
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${summary.total_violations}</div>
                <div class="stat-label">Total Violations</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="color: #DC2626;">${summary.critical_count}</div>
                <div class="stat-label">Critical</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="color: #EF4444;">${summary.high_count}</div>
                <div class="stat-label">High Priority</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="color: #F59E0B;">${summary.open_count}</div>
                <div class="stat-label">Open</div>
              </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
              <p style="margin: 0; color: #166534;"><strong>✅ Resolved Today:</strong> ${summary.resolved_count}</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated daily summary from Fleet Management System.</p>
            <p>© ${new Date().getFullYear()} Fleet Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Initialize email transporter on module load
ViolationNotificationsService.initializeEmailTransporter();

export default ViolationNotificationsService;
