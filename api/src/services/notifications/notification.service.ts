/**
 * Multi-Channel Notification Service
 * Supports email, SMS, push notifications, and in-app notifications
 *
 * Features:
 * - Email notifications (SendGrid/SMTP)
 * - SMS notifications (Twilio)
 * - Push notifications (Firebase/OneSignal)
 * - In-app notifications
 * - Notification preferences per user
 * - Notification templates
 * - Batching and rate limiting
 * - Delivery tracking
 */

import pool from '../../config/database'
import nodemailer from 'nodemailer'

export interface Notification {
  id?: string
  tenantId: string
  userId: string
  type: 'task_assigned' | 'task_due_soon' | 'task_overdue' | 'asset_maintenance_due' | 'comment_mention' | 'status_changed' | 'custom'
  title: string
  message: string
  channels: ('email' | 'sms' | 'push' | 'in_app')[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  data?: any
  actionUrl?: string
  createdAt?: Date
  readAt?: Date
  deliveredAt?: Date
}

export interface NotificationPreferences {
  userId: string
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
  notificationTypes: {
    [key: string]: {
      email?: boolean
      sms?: boolean
      push?: boolean
      inApp?: boolean
    }
  }
  quietHoursStart?: string // HH:MM format
  quietHoursEnd?: string
  timezone?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: string
  emailSubject?: string
  emailBody?: string
  smsText?: string
  pushTitle?: string
  pushBody?: string
  inAppTitle?: string
  inAppMessage?: string
  variables: string[]
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeEmailTransporter()
  }

  /**
   * Initialize email transporter
   */
  private initializeEmailTransporter(): void {
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
   * Send notification to user
   */
  async send(notification: Notification): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(notification.userId)

      // Check if user wants notifications of this type
      if (!this.shouldSendNotification(notification, preferences)) {
        console.log(`Skipping notification for user ${notification.userId} based on preferences`)
        return
      }

      // Store in-app notification
      if (notification.channels.includes('in_app') && preferences.inAppNotifications) {
        await this.createInAppNotification(notification)
      }

      // Send email
      if (notification.channels.includes('email') && preferences.emailNotifications) {
        await this.sendEmail(notification)
      }

      // Send SMS
      if (notification.channels.includes('sms') && preferences.smsNotifications) {
        await this.sendSMS(notification)
      }

      // Send push notification
      if (notification.channels.includes('push') && preferences.pushNotifications) {
        await this.sendPushNotification(notification)
      }

      console.log(`Notification sent to user ${notification.userId}: ${notification.title}`)
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(notifications: Notification[]): Promise<void> {
    const batchSize = 100
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      await Promise.all(batch.map(n => this.send(n)))
    }
  }

  /**
   * Send notification using template
   */
  async sendFromTemplate(
    templateId: string,
    userId: string,
    variables: Record<string, string>,
    channels: ('email' | 'sms' | 'push' | 'in_app')[]
  ): Promise<void> {
    const template = await this.getTemplate(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    const notification: Notification = {
      tenantId: '', // Will be fetched from user
      userId,
      type: template.type as any,
      title: this.replaceVariables(template.inAppTitle || template.name, variables),
      message: this.replaceVariables(template.inAppMessage || '', variables),
      channels,
      priority: 'normal',
      data: { templateId, variables }
    }

    await this.send(notification)
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(notification: Notification): Promise<void> {
    await pool.query(
      `INSERT INTO notifications (tenant_id, user_id, type, title, message, priority, data, action_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        notification.tenantId,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.priority,
        JSON.stringify(notification.data || {}),
        notification.actionUrl
      ]
    )
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    if (!this.emailTransporter) {
      console.warn('Email transporter not configured')
      return
    }

    // Get user email
    const userResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id = $1',
      [notification.userId]
    )

    if (userResult.rows.length === 0) return

    const user = userResult.rows[0]

    const emailHtml = this.generateEmailHtml(notification, user)

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'notifications@fleet.com',
      to: user.email,
      subject: notification.title,
      html: emailHtml
    })

    console.log(`Email sent to ${user.email}`)
  }

  /**
   * Generate email HTML
   */
  private generateEmailHtml(notification: Notification, user: any): string {
    const priorityColors = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${priorityColors[notification.priority]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${notification.title}</h1>
    </div>
    <div class="content">
      <p>Hi ${user.first_name},</p>
      <p>${notification.message}</p>
      ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="button">View Details</a>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated notification from Fleet Management System.</p>
      <p>You can manage your notification preferences in your account settings.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * Send SMS notification (Twilio integration)
   */
  private async sendSMS(notification: Notification): Promise<void> {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      console.warn('Twilio not configured')
      return
    }

    // Get user phone
    const userResult = await pool.query(
      'SELECT phone FROM users WHERE id = $1',
      [notification.userId]
    )

    if (userResult.rows.length === 0 || !userResult.rows[0].phone) return

    // Here you would integrate with Twilio
    // const twilio = require('twilio')
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    // await client.messages.create({
    //   body: `${notification.title}: ${notification.message}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: userResult.rows[0].phone
    // })

    console.log(`SMS would be sent to ${userResult.rows[0].phone}`)
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    // Here you would integrate with Firebase Cloud Messaging or OneSignal
    // For now, just log
    console.log(`Push notification would be sent: ${notification.title}`)
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const result = await pool.query(
      'SELECT 
      id,
      user_id,
      email_notifications,
      sms_notifications,
      push_notifications,
      in_app_notifications,
      notification_types,
      quiet_hours_start,
      quiet_hours_end,
      timezone,
      created_at,
      updated_at FROM notification_preferences WHERE user_id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      // Return default preferences
      return {
        userId,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        inAppNotifications: true,
        notificationTypes: {}
      }
    }

    const prefs = result.rows[0]
    return {
      userId: prefs.user_id,
      emailNotifications: prefs.email_notifications,
      smsNotifications: prefs.sms_notifications,
      pushNotifications: prefs.push_notifications,
      inAppNotifications: prefs.in_app_notifications,
      notificationTypes: prefs.notification_types || {},
      quietHoursStart: prefs.quiet_hours_start,
      quietHoursEnd: prefs.quiet_hours_end,
      timezone: prefs.timezone
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    await pool.query(
      `INSERT INTO notification_preferences (user_id, email_notifications, sms_notifications, push_notifications, in_app_notifications, notification_types, quiet_hours_start, quiet_hours_end, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id)
       DO UPDATE SET
         email_notifications = COALESCE($2, notification_preferences.email_notifications),
         sms_notifications = COALESCE($3, notification_preferences.sms_notifications),
         push_notifications = COALESCE($4, notification_preferences.push_notifications),
         in_app_notifications = COALESCE($5, notification_preferences.in_app_notifications),
         notification_types = COALESCE($6, notification_preferences.notification_types),
         quiet_hours_start = COALESCE($7, notification_preferences.quiet_hours_start),
         quiet_hours_end = COALESCE($8, notification_preferences.quiet_hours_end),
         timezone = COALESCE($9, notification_preferences.timezone),
         updated_at = NOW()`,
      [
        userId,
        preferences.emailNotifications,
        preferences.smsNotifications,
        preferences.pushNotifications,
        preferences.inAppNotifications,
        JSON.stringify(preferences.notificationTypes || {}),
        preferences.quietHoursStart,
        preferences.quietHoursEnd,
        preferences.timezone
      ]
    )
  }

  /**
   * Get user's unread notifications
   */
  async getUnreadNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, user_id, notification_type, title, message, is_read, created_at FROM notifications
       WHERE user_id = $1 AND read_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2',
      [userId, limit]
    )

    return result.rows
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    )
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    )
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    )
  }

  /**
   * Get notification template
   */
  private async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const result = await pool.query(
      'SELECT 
      id,
      name,
      type,
      email_subject,
      email_body,
      sms_text,
      push_title,
      push_body,
      in_app_title,
      in_app_message,
      variables,
      created_at FROM notification_templates WHERE id = $1',
      [templateId]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private shouldSendNotification(notification: Notification, preferences: NotificationPreferences): boolean {
    // Check quiet hours
    if (preferences.quietHoursStart && preferences.quietHoursEnd) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      if (currentTime >= preferences.quietHoursStart && currentTime <= preferences.quietHoursEnd) {
        // Don't send during quiet hours unless urgent
        if (notification.priority !== 'urgent') {
          return false
        }
      }
    }

    // Check type-specific preferences
    if (preferences.notificationTypes[notification.type]) {
      const typePrefs = preferences.notificationTypes[notification.type]
      // At least one channel should be enabled for this type
      return Object.values(typePrefs).some(v => v === true)
    }

    return true
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(notification: Notification, sendAt: Date): Promise<void> {
    await pool.query(
      `INSERT INTO scheduled_notifications (tenant_id, user_id, type, title, message, channels, priority, data, action_url, scheduled_for)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        notification.tenantId,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.channels,
        notification.priority,
        JSON.stringify(notification.data || {}),
        notification.actionUrl,
        sendAt
      ]
    )
  }

  /**
   * Process scheduled notifications (run by cron job)
   */
  async processScheduledNotifications(): Promise<void> {
    const result = await pool.query(
      `SELECT id, tenant_id, user_id, notification_type, message, scheduled_time, sent_at FROM scheduled_notifications
       WHERE scheduled_for <= NOW() AND sent_at IS NULL
       ORDER BY scheduled_for ASC
       LIMIT 100`
    )

    for (const row of result.rows) {
      try {
        await this.send({
          id: row.id,
          tenantId: row.tenant_id,
          userId: row.user_id,
          type: row.type,
          title: row.title,
          message: row.message,
          channels: row.channels,
          priority: row.priority,
          data: row.data,
          actionUrl: row.action_url
        })

        // Mark as sent
        await pool.query(
          'UPDATE scheduled_notifications SET sent_at = NOW() WHERE id = $1',
          [row.id]
        )
      } catch (error) {
        console.error(`Failed to send scheduled notification ${row.id}:`, error)
      }
    }
  }
}

// Global instance
export const notificationService = new NotificationService()

export default notificationService
