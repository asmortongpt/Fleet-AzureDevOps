/**
 * Alert & Notification Engine Service
 *
 * Centralized alert system for proactive fleet management:
 * - Rule-based alert generation
 * - Multi-channel delivery (in-app, email, SMS, Teams)
 * - Priority-based routing
 * - Alert history and acknowledgment tracking
 */

import pool from '../config/database'
import nodemailer from 'nodemailer'

export interface AlertRule {
  id: string
  rule_type: 'maintenance_due' | 'geofence_violation' | 'incident_critical' |
             'task_overdue' | 'fuel_anomaly' | 'speed_violation' |
             'idle_time' | 'asset_expiration' | 'driver_certification' | 'custom'
  name: string
  description?: string
  condition: any // JSON condition rules
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  channels: Array<'in_app' | 'email' | 'sms' | 'teams' | 'push'>
  recipients: string[] // User IDs or roles
  is_active: boolean
  cooldown_minutes?: number // Prevent alert spam
}

export interface Alert {
  id: string
  tenant_id: string
  rule_id?: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  title: string
  message: string
  entity_type?: string // 'vehicle', 'driver', 'asset', 'task', 'incident'
  entity_id?: string
  metadata?: any
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved'
  created_at: Date
  acknowledged_at?: Date
  acknowledged_by?: string
  resolved_at?: Date
}

export class AlertEngineService {
  private emailTransporter: nodemailer.Transporter

  constructor() {
    // Initialize email transporter
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    }
  }

  /**
   * Create and send an alert
   */
  async createAlert(
    tenantId: string,
    alertData: {
      alert_type: string
      severity: Alert['severity']
      title: string
      message: string
      entity_type?: string
      entity_id?: string
      metadata?: any
      channels?: Array<'in_app' | 'email' | 'sms' | 'teams' | 'push'>
      recipients?: string[]
    }
  ): Promise<Alert> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Insert alert
      const result = await client.query(
        `INSERT INTO alerts (
          tenant_id, alert_type, severity, title, message,
          entity_type, entity_id, metadata, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING *`,
        [
          tenantId,
          alertData.alert_type,
          alertData.severity,
          alertData.title,
          alertData.message,
          alertData.entity_type,
          alertData.entity_id,
          JSON.stringify(alertData.metadata || {})
        ]
      )

      const alert = result.rows[0]

      // Send through specified channels
      const channels = alertData.channels || ['in_app', 'email']
      const recipients = alertData.recipients || await this.getDefaultRecipients(tenantId, alertData.severity)

      await this.deliverAlert(alert, channels, recipients, tenantId)

      // Mark as sent
      await client.query(
        `UPDATE alerts SET status = 'sent' WHERE id = $1`,
        [alert.id]
      )

      await client.query('COMMIT')
      return alert
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error creating alert:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Deliver alert through specified channels
   */
  private async deliverAlert(
    alert: any,
    channels: string[],
    recipients: string[],
    tenantId: string
  ): Promise<void> {
    const deliveryPromises: Promise<any>[] = []

    for (const channel of channels) {
      switch (channel) {
        case 'in_app':
          deliveryPromises.push(this.deliverInApp(alert, recipients, tenantId))
          break
        case 'email':
          deliveryPromises.push(this.deliverEmail(alert, recipients, tenantId))
          break
        case 'sms':
          deliveryPromises.push(this.deliverSMS(alert, recipients, tenantId))
          break
        case 'teams':
          deliveryPromises.push(this.deliverTeams(alert, recipients, tenantId))
          break
        case 'push':
          deliveryPromises.push(this.deliverPush(alert, recipients, tenantId))
          break
      }
    }

    await Promise.allSettled(deliveryPromises)
  }

  /**
   * Deliver in-app notification
   */
  private async deliverInApp(alert: any, recipients: string[], tenantId: string): Promise<void> {
    const client = await pool.connect()
    try {
      for (const recipientId of recipients) {
        await client.query(
          `INSERT INTO notifications (
            tenant_id, user_id, notification_type, title, message,
            link, severity, entity_type, entity_id, is_read
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)`,
          [
            tenantId,
            recipientId,
            alert.alert_type,
            alert.title,
            alert.message,
            this.generateAlertLink(alert),
            alert.severity,
            alert.entity_type,
            alert.entity_id
          ]
        )
      }
    } finally {
      client.release()
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmail(alert: any, recipients: string[], tenantId: string): Promise<void> {
    if (!this.emailTransporter) {
      console.warn('Email transporter not configured, skipping email delivery')
      return
    }

    try {
      // Get recipient emails
      const result = await pool.query(
        `SELECT email FROM users WHERE id = ANY($1) AND tenant_id = $2`,
        [recipients, tenantId]
      )

      const emails = result.rows.map(r => r.email)

      if (emails.length === 0) return

      const severityColor = {
        info: '#3B82F6',
        warning: '#F59E0B',
        critical: '#EF4444',
        emergency: '#DC2626'
      }[alert.severity]

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .alert-container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-header { background: ${severityColor}; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
            .alert-body { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .alert-title { margin: 0; font-size: 20px; }
            .alert-message { margin: 15px 0; }
            .alert-footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="alert-container">
            <div class="alert-header">
              <h1 class="alert-title">${alert.title}</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${alert.severity.toUpperCase()} Alert</p>
            </div>
            <div class="alert-body">
              <p class="alert-message">${alert.message}</p>
              ${alert.entity_type ? `<p><strong>Related:</strong> ${alert.entity_type} ${alert.entity_id || ''}</p>` : ''}
              <p style="margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}"
                   style="background: ${severityColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View in Fleet Management
                </a>
              </p>
            </div>
            <div class="alert-footer">
              <p>You received this alert because you are subscribed to fleet notifications.</p>
              <p>Fleet Management System - Capital Tech Alliance</p>
            </div>
          </div>
        </body>
        </html>
      `

      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'alerts@fleet.capitaltechalliance.com',
        to: emails.join(','),
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: htmlBody
      })
    } catch (error) {
      console.error('Error sending email alert:', error)
    }
  }

  /**
   * Deliver SMS notification (placeholder - integrate with Twilio/AWS SNS)
   */
  private async deliverSMS(alert: any, recipients: string[], tenantId: string): Promise<void> {
    // PRODUCTION TODO: Integrate with Twilio or AWS SNS
    console.log(`SMS delivery for alert ${alert.id} to ${recipients.length} recipients`)

    // Example Twilio integration:
    /*
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const result = await pool.query(
      `SELECT phone FROM users WHERE id = ANY($1) AND tenant_id = $2 AND phone IS NOT NULL`,
      [recipients, tenantId]
    )

    for (const user of result.rows) {
      await twilio.messages.create({
        body: `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone
      })
    }
    */
  }

  /**
   * Deliver Microsoft Teams notification
   */
  private async deliverTeams(alert: any, recipients: string[], tenantId: string): Promise<void> {
    // PRODUCTION TODO: Use existing Teams integration
    console.log(`Teams delivery for alert ${alert.id}`)

    // Integration with existing Teams service would go here
    // POST to Teams webhook with adaptive card
  }

  /**
   * Deliver mobile push notification
   */
  private async deliverPush(alert: any, recipients: string[], tenantId: string): Promise<void> {
    try {
      const { pushNotificationService } = await import('./push-notification.service')

      // Map alert severity to notification priority
      const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'critical'> = {
        info: 'low',
        warning: 'normal',
        critical: 'high',
        emergency: 'critical'
      }

      // Map alert type to notification category
      const categoryMap: Record<string, any> = {
        maintenance_due: 'maintenance_reminder',
        task_overdue: 'task_assignment',
        incident_critical: 'critical_alert',
        geofence_violation: 'driver_alert',
        speed_violation: 'driver_alert',
        fuel_anomaly: 'driver_alert',
        asset_expiration: 'maintenance_reminder',
        driver_certification: 'administrative'
      }

      // Determine action buttons based on alert type
      const actionButtons = []
      if (alert.severity === 'critical' || alert.severity === 'emergency') {
        actionButtons.push(
          { id: 'acknowledge', title: 'Acknowledge' },
          { id: 'view', title: 'View Details' }
        )
      } else {
        actionButtons.push(
          { id: 'view', title: 'View Details' },
          { id: 'dismiss', title: 'Dismiss' }
        )
      }

      // Create push notification
      const notification = {
        tenantId,
        notificationType: alert.alert_type,
        category: categoryMap[alert.alert_type] || 'administrative',
        priority: priorityMap[alert.severity] || 'normal',
        title: alert.title,
        message: alert.message,
        dataPayload: {
          alert_id: alert.id,
          severity: alert.severity,
          entity_type: alert.entity_type || '',
          entity_id: alert.entity_id || '',
          ...alert.metadata
        },
        actionButtons,
        sound: alert.severity === 'critical' || alert.severity === 'emergency' ? 'alert' : 'default'
      }

      // Send push notification to recipients
      const recipientList = recipients.map(userId => ({ userId }))
      await pushNotificationService.sendNotification(notification, recipientList)

      console.log(`Push notification sent for alert ${alert.id} to ${recipients.length} recipients`)
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }

  /**
   * Get default alert recipients based on severity
   */
  private async getDefaultRecipients(tenantId: string, severity: string): Promise<string[]> {
    let roles: string[] = []

    switch (severity) {
      case 'emergency':
      case 'critical':
        roles = ['admin', 'fleet_manager', 'safety_manager']
        break
      case 'warning':
        roles = ['fleet_manager', 'maintenance_manager']
        break
      case 'info':
        roles = ['fleet_manager']
        break
    }

    const result = await pool.query(
      `SELECT id FROM users WHERE tenant_id = $1 AND role = ANY($2)`,
      [tenantId, roles]
    )

    return result.rows.map(r => r.id)
  }

  /**
   * Generate link to relevant entity
   */
  private generateAlertLink(alert: any): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    if (!alert.entity_type) return baseUrl

    const moduleMap: Record<string, string> = {
      vehicle: 'gps-tracking',
      driver: 'driver-mgmt',
      asset: 'asset-management',
      task: 'task-management',
      incident: 'incident-management',
      maintenance: 'garage'
    }

    const module = moduleMap[alert.entity_type] || 'dashboard'
    return `${baseUrl}?module=${module}&id=${alert.entity_id || ''}`
  }

  /**
   * Check maintenance due alerts
   */
  async checkMaintenanceDueAlerts(tenantId: string): Promise<void> {
    const result = await pool.query(
      `SELECT v.id, v.vehicle_number, ms.service_type, ms.due_date
       FROM vehicles v
       JOIN maintenance_schedules ms ON v.id = ms.vehicle_id
       WHERE v.tenant_id = $1
       AND ms.status = 'scheduled'
       AND ms.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND NOT EXISTS (
         SELECT 1 FROM alerts a
         WHERE a.entity_id = v.id::text
         AND a.alert_type = 'maintenance_due'
         AND a.created_at > CURRENT_DATE - INTERVAL '1 day'
       )`,
      [tenantId]
    )

    for (const row of result.rows) {
      const daysUntil = Math.ceil(
        (new Date(row.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      await this.createAlert(tenantId, {
        alert_type: 'maintenance_due',
        severity: daysUntil <= 1 ? 'critical' : 'warning',
        title: `Maintenance Due: ${row.vehicle_number}`,
        message: `${row.service_type} is due in ${daysUntil} day(s) for vehicle ${row.vehicle_number}`,
        entity_type: 'vehicle',
        entity_id: row.id,
        metadata: { service_type: row.service_type, due_date: row.due_date }
      })
    }
  }

  /**
   * Check overdue task alerts
   */
  async checkOverdueTaskAlerts(tenantId: string): Promise<void> {
    const result = await pool.query(
      `SELECT t.id, t.task_title, t.assigned_to, u.first_name, u.last_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.tenant_id = $1
       AND t.status IN ('pending', 'in_progress')
       AND t.due_date < CURRENT_DATE
       AND NOT EXISTS (
         SELECT 1 FROM alerts a
         WHERE a.entity_id = t.id::text
         AND a.alert_type = 'task_overdue'
         AND a.created_at > CURRENT_DATE - INTERVAL '1 day'
       )`,
      [tenantId]
    )

    for (const row of result.rows) {
      await this.createAlert(tenantId, {
        alert_type: 'task_overdue',
        severity: 'warning',
        title: `Overdue Task: ${row.task_title}`,
        message: `Task "${row.task_title}" assigned to ${row.first_name} ${row.last_name} is overdue`,
        entity_type: 'task',
        entity_id: row.id,
        recipients: row.assigned_to ? [row.assigned_to] : undefined
      })
    }
  }

  /**
   * Check critical incident alerts
   */
  async checkCriticalIncidentAlerts(tenantId: string): Promise<void> {
    const result = await pool.query(
      `SELECT id, incident_title, severity
       FROM incidents
       WHERE tenant_id = $1
       AND severity = 'critical'
       AND status = 'open'
       AND NOT EXISTS (
         SELECT 1 FROM alerts a
         WHERE a.entity_id = id::text
         AND a.alert_type = 'incident_critical'
         AND a.created_at > created_at + INTERVAL '5 minutes'
       )`,
      [tenantId]
    )

    for (const row of result.rows) {
      await this.createAlert(tenantId, {
        alert_type: 'incident_critical',
        severity: 'emergency',
        title: `CRITICAL INCIDENT: ${row.incident_title}`,
        message: `A critical incident has been reported and requires immediate attention`,
        entity_type: 'incident',
        entity_id: row.id,
        channels: ['in_app', 'email', 'sms']
      })
    }
  }

  /**
   * Run all alert checks (called by scheduled job)
   */
  async runAlertChecks(tenantId: string): Promise<void> {
    try {
      await Promise.allSettled([
        this.checkMaintenanceDueAlerts(tenantId),
        this.checkOverdueTaskAlerts(tenantId),
        this.checkCriticalIncidentAlerts(tenantId)
      ])
    } catch (error) {
      console.error('Error running alert checks:', error)
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE alerts
       SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
       WHERE id = $2`,
      [userId, alertId]
    )
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await pool.query(
      `UPDATE alerts
       SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1`,
      [alertId]
    )
  }

  /**
   * Get user alerts
   */
  async getUserAlerts(
    userId: string,
    tenantId: string,
    filters?: { status?: string; severity?: string; limit?: number }
  ): Promise<Alert[]> {
    const { status, severity, limit = 50 } = filters || {}

    let query = `
      SELECT a.* FROM alerts a
      WHERE a.tenant_id = $1
      AND (
        EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = $2 AND a.id::text = n.entity_id
        ) OR a.severity IN ('critical', 'emergency')
      )
    `

    const params: any[] = [tenantId, userId]
    let paramCount = 2

    if (status) {
      paramCount++
      query += ` AND a.status = $${paramCount}`
      params.push(status)
    }

    if (severity) {
      paramCount++
      query += ` AND a.severity = $${paramCount}`
      params.push(severity)
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1}`
    params.push(limit)

    const result = await pool.query(query, params)
    return result.rows
  }
}

export default new AlertEngineService()
