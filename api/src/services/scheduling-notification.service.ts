/**
 * Scheduling Notification Service
 * Specialized notification service for the scheduling module
 *
 * Features:
 * - Email notifications for reservations and maintenance
 * - SMS reminders using Twilio
 * - Teams/Slack notifications
 * - Template-based notification system
 * - Integration with communication_logs table
 */

import pool from '../config/database'
import { logger } from '../utils/logger'
import outlookService from './outlook.service'
import teamsService from './teams.service'
import queueService from './queue.service'

interface SchedulingNotification {
  tenantId: string
  userId: string
  type: 'reservation_request' | 'reservation_approved' | 'reservation_rejected' |
        'reservation_reminder' | 'maintenance_reminder' | 'conflict_detected' |
        'reservation_cancelled' | 'maintenance_scheduled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  recipientEmail?: string
  recipientPhone?: string
  data: any
}

interface NotificationTemplate {
  emailSubject: string
  emailBody: string
  smsText: string
  teamsMessage: string
}

interface NotificationPreferences {
  userId: string
  emailEnabled: boolean
  smsEnabled: boolean
  teamsEnabled: boolean
  reminderTimes: number[] // Hours before event, e.g., [24, 1]
  quietHoursStart?: string
  quietHoursEnd?: string
}

class SchedulingNotificationService {
  /**
   * Send notification for new reservation request (to approvers)
   */
  async sendReservationRequest(
    tenantId: string,
    reservation: any,
    approvers: string[]
  ): Promise<void> {
    try {
      logger.info('Sending reservation request notifications', {
        reservationId: reservation.id,
        approverCount: approvers.length
      })

      const template = this.getTemplate('reservation_request', reservation)

      for (const approverId of approvers) {
        const prefs = await this.getNotificationPreferences(approverId)

        // Send email via Outlook
        if (prefs.emailEnabled) {
          await this.sendEmail(
            approverId,
            template.emailSubject,
            template.emailBody,
            tenantId,
            'reservation',
            reservation.id
          )
        }

        // Send Teams notification
        if (prefs.teamsEnabled) {
          await this.sendTeamsNotification(
            approverId,
            template.teamsMessage,
            'reservation_request',
            reservation
          )
        }

        // Send SMS
        if (prefs.smsEnabled) {
          await this.sendSMS(approverId, template.smsText)
        }
      }

      logger.info('Reservation request notifications sent successfully')
    } catch (error) {
      logger.error('Error sending reservation request notifications', { error })
      throw error
    }
  }

  /**
   * Send notification for approved reservation (to requester)
   */
  async sendReservationApproved(
    tenantId: string,
    reservation: any
  ): Promise<void> {
    try {
      logger.info('Sending reservation approved notification', {
        reservationId: reservation.id,
        userId: reservation.reserved_by
      })

      const template = this.getTemplate('reservation_approved', reservation)
      const prefs = await this.getNotificationPreferences(reservation.reserved_by)

      if (prefs.emailEnabled) {
        await this.sendEmail(
          reservation.reserved_by,
          template.emailSubject,
          template.emailBody,
          tenantId,
          'reservation',
          reservation.id
        )
      }

      if (prefs.teamsEnabled) {
        await this.sendTeamsNotification(
          reservation.reserved_by,
          template.teamsMessage,
          'reservation_approved',
          reservation
        )
      }

      if (prefs.smsEnabled) {
        await this.sendSMS(reservation.reserved_by, template.smsText)
      }

      logger.info('Reservation approved notification sent successfully')
    } catch (error) {
      logger.error('Error sending reservation approved notification', { error })
      throw error
    }
  }

  /**
   * Send notification for rejected reservation (to requester)
   */
  async sendReservationRejected(
    tenantId: string,
    reservation: any,
    reason: string
  ): Promise<void> {
    try {
      logger.info('Sending reservation rejected notification', {
        reservationId: reservation.id,
        userId: reservation.reserved_by
      })

      const template = this.getTemplate('reservation_rejected', {
        ...reservation,
        rejection_reason: reason
      })
      const prefs = await this.getNotificationPreferences(reservation.reserved_by)

      if (prefs.emailEnabled) {
        await this.sendEmail(
          reservation.reserved_by,
          template.emailSubject,
          template.emailBody,
          tenantId,
          'reservation',
          reservation.id
        )
      }

      if (prefs.teamsEnabled) {
        await this.sendTeamsNotification(
          reservation.reserved_by,
          template.teamsMessage,
          'reservation_rejected',
          reservation
        )
      }

      if (prefs.smsEnabled) {
        await this.sendSMS(reservation.reserved_by, template.smsText)
      }

      logger.info('Reservation rejected notification sent successfully')
    } catch (error) {
      logger.error('Error sending reservation rejected notification', { error })
      throw error
    }
  }

  /**
   * Send upcoming reservation reminder
   */
  async sendReservationReminder(
    tenantId: string,
    reservation: any,
    hoursUntil: number
  ): Promise<void> {
    try {
      logger.info('Sending reservation reminder', {
        reservationId: reservation.id,
        hoursUntil
      })

      const template = this.getTemplate('reservation_reminder', {
        ...reservation,
        hours_until: hoursUntil
      })
      const prefs = await this.getNotificationPreferences(reservation.reserved_by)

      if (prefs.emailEnabled) {
        await this.sendEmail(
          reservation.reserved_by,
          template.emailSubject,
          template.emailBody,
          tenantId,
          'reservation',
          reservation.id
        )
      }

      if (prefs.smsEnabled) {
        await this.sendSMS(reservation.reserved_by, template.smsText)
      }

      // Mark reminder as sent
      await this.markReminderSent(reservation.id, 'reservation', hoursUntil)

      logger.info('Reservation reminder sent successfully')
    } catch (error) {
      logger.error('Error sending reservation reminder', { error })
      throw error
    }
  }

  /**
   * Send maintenance appointment reminder
   */
  async sendMaintenanceReminder(
    tenantId: string,
    appointment: any,
    hoursUntil: number
  ): Promise<void> {
    try {
      logger.info('Sending maintenance reminder', {
        appointmentId: appointment.id,
        hoursUntil
      })

      const template = this.getTemplate('maintenance_reminder', {
        ...appointment,
        hours_until: hoursUntil
      })

      // Send to technician if assigned
      if (appointment.assigned_technician_id) {
        const techPrefs = await this.getNotificationPreferences(appointment.assigned_technician_id)

        if (techPrefs.emailEnabled) {
          await this.sendEmail(
            appointment.assigned_technician_id,
            template.emailSubject,
            template.emailBody,
            tenantId,
            'maintenance',
            appointment.id
          )
        }

        if (techPrefs.smsEnabled) {
          await this.sendSMS(appointment.assigned_technician_id, template.smsText)
        }
      }

      // Mark reminder as sent
      await this.markReminderSent(appointment.id, 'maintenance', hoursUntil)

      logger.info('Maintenance reminder sent successfully')
    } catch (error) {
      logger.error('Error sending maintenance reminder', { error })
      throw error
    }
  }

  /**
   * Send conflict detected notification
   */
  async sendConflictDetected(
    tenantId: string,
    conflict: any,
    affectedUsers: string[]
  ): Promise<void> {
    try {
      logger.info('Sending conflict detected notification', {
        conflictType: conflict.type,
        affectedUsers: affectedUsers.length
      })

      const template = this.getTemplate('conflict_detected', conflict)

      for (const userId of affectedUsers) {
        const prefs = await this.getNotificationPreferences(userId)

        if (prefs.emailEnabled) {
          await this.sendEmail(
            userId,
            template.emailSubject,
            template.emailBody,
            tenantId,
            'conflict',
            null
          )
        }

        if (prefs.teamsEnabled) {
          await this.sendTeamsNotification(
            userId,
            template.teamsMessage,
            'conflict_detected',
            conflict
          )
        }
      }

      logger.info('Conflict detected notifications sent successfully')
    } catch (error) {
      logger.error('Error sending conflict notifications', { error })
      throw error
    }
  }

  /**
   * Send email via Outlook service
   */
  private async sendEmail(
    userId: string,
    subject: string,
    body: string,
    tenantId: string,
    entityType: string,
    entityId: string | null
  ): Promise<void> {
    try {
      // Get user email
      const userResult = await pool.query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length === 0) {
        logger.warn('User not found for email notification', { userId })
        return
      }

      const user = userResult.rows[0]

      // Send via Outlook service
      await outlookService.sendEmail({
        to: user.email,
        subject,
        body,
        bodyType: 'html'
      })

      // Log to communications table
      await this.logCommunication({
        tenantId,
        communicationType: 'Email',
        direction: 'Outbound',
        subject,
        body,
        toUserId: userId,
        toEmail: user.email,
        entityType,
        entityId
      })

      logger.info('Email sent successfully', { userId, subject })
    } catch (error) {
      logger.error('Error sending email', { error, userId })
      throw error
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(userId: string, message: string): Promise<void> {
    try {
      // Get user phone number
      const userResult = await pool.query(
        'SELECT phone, first_name, last_name FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length === 0 || !userResult.rows[0].phone) {
        logger.warn('User phone not found for SMS notification', { userId })
        return
      }

      const user = userResult.rows[0]

      // Check if Twilio is configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        logger.warn('Twilio not configured, skipping SMS')
        return
      }

      // Import Twilio dynamically
      const twilio = require('twilio')
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone
      })

      logger.info('SMS sent successfully', { userId, phone: user.phone })
    } catch (error) {
      logger.error('Error sending SMS', { error, userId })
      // Don't throw - SMS failures shouldn't block other notifications
    }
  }

  /**
   * Send Teams notification
   */
  private async sendTeamsNotification(
    userId: string,
    message: string,
    notificationType: string,
    data: any
  ): Promise<void> {
    try {
      // Get user's default Teams channel (from user preferences or tenant config)
      const configResult = await pool.query(
        `SELECT team_id, channel_id FROM tenant_teams_config
         WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = $1)
         AND is_default = true
         LIMIT 1`,
        [userId]
      )

      if (configResult.rows.length === 0) {
        logger.warn('No default Teams channel configured')
        return
      }

      const { team_id, channel_id } = configResult.rows[0]

      // Format adaptive card for Teams
      const card = this.formatTeamsCard(notificationType, data)

      await teamsService.sendMessage({
        teamId: team_id,
        channelId: channel_id,
        message,
        attachments: [card]
      })

      logger.info('Teams notification sent successfully', { userId })
    } catch (error) {
      logger.error('Error sending Teams notification', { error, userId })
      // Don't throw - Teams failures shouldn't block other notifications
    }
  }

  /**
   * Get notification template for specific type
   */
  private getTemplate(type: string, data: any): NotificationTemplate {
    const templates: Record<string, (data: any) => NotificationTemplate> = {
      reservation_request: (d) => ({
        emailSubject: `New Vehicle Reservation Request - ${d.make} ${d.model}`,
        emailBody: this.renderEmailTemplate('reservation_request', d),
        smsText: `New reservation request for ${d.make} ${d.model} from ${d.reserved_by_name}. Approve/reject in Fleet app.`,
        teamsMessage: `**New Reservation Request**\n\n**Vehicle:** ${d.make} ${d.model} (${d.license_plate})\n**Requested by:** ${d.reserved_by_name}\n**Period:** ${this.formatDateTime(d.start_time)} - ${this.formatDateTime(d.end_time)}\n**Purpose:** ${d.purpose || 'Not specified'}`
      }),

      reservation_approved: (d) => ({
        emailSubject: `Reservation Approved - ${d.make} ${d.model}`,
        emailBody: this.renderEmailTemplate('reservation_approved', d),
        smsText: `Your reservation for ${d.make} ${d.model} has been approved. Pickup: ${this.formatDateTime(d.start_time)}`,
        teamsMessage: `✅ **Reservation Approved**\n\n**Vehicle:** ${d.make} ${d.model}\n**Pickup:** ${this.formatDateTime(d.start_time)}\n**Return:** ${this.formatDateTime(d.end_time)}`
      }),

      reservation_rejected: (d) => ({
        emailSubject: `Reservation Declined - ${d.make} ${d.model}`,
        emailBody: this.renderEmailTemplate('reservation_rejected', d),
        smsText: `Your reservation for ${d.make} ${d.model} was declined. Reason: ${d.rejection_reason}`,
        teamsMessage: `❌ **Reservation Declined**\n\n**Vehicle:** ${d.make} ${d.model}\n**Reason:** ${d.rejection_reason}`
      }),

      reservation_reminder: (d) => ({
        emailSubject: `Reminder: Vehicle Reservation in ${d.hours_until} hour(s)`,
        emailBody: this.renderEmailTemplate('reservation_reminder', d),
        smsText: `Reminder: Your reservation for ${d.make} ${d.model} starts in ${d.hours_until} hour(s) at ${d.pickup_location || 'facility'}`,
        teamsMessage: `⏰ **Reservation Reminder**\n\n**Starting in:** ${d.hours_until} hour(s)\n**Vehicle:** ${d.make} ${d.model}\n**Location:** ${d.pickup_location || 'Facility'}`
      }),

      maintenance_reminder: (d) => ({
        emailSubject: `Reminder: Maintenance Appointment in ${d.hours_until} hour(s)`,
        emailBody: this.renderEmailTemplate('maintenance_reminder', d),
        smsText: `Reminder: Maintenance for ${d.make} ${d.model} in ${d.hours_until} hour(s) at ${d.bay_name}`,
        teamsMessage: `🔧 **Maintenance Reminder**\n\n**Starting in:** ${d.hours_until} hour(s)\n**Vehicle:** ${d.make} ${d.model}\n**Service:** ${d.appointment_type}\n**Bay:** ${d.bay_name}`
      }),

      conflict_detected: (d) => ({
        emailSubject: `Scheduling Conflict Detected - ${d.description}`,
        emailBody: this.renderEmailTemplate('conflict_detected', d),
        smsText: `Scheduling conflict: ${d.description}. Please check Fleet app.`,
        teamsMessage: `⚠️ **Scheduling Conflict**\n\n**Type:** ${d.type}\n**Severity:** ${d.severity}\n**Description:** ${d.description}`
      })
    }

    const templateFn = templates[type]
    if (!templateFn) {
      throw new Error(`Unknown notification template type: ${type}`)
    }

    return templateFn(data)
  }

  /**
   * Render email template from HTML file
   */
  private renderEmailTemplate(type: string, data: any): string {
    // Load and render HTML template
    const fs = require('fs')
    const path = require('path')

    const templatePath = path.join(__dirname, '../templates/scheduling', `${type}.html`)

    try {
      let template = fs.readFileSync(templatePath, 'utf8')

      // Replace variables
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        template = template.replace(regex, String(value || ''))
      }

      return template
    } catch (error) {
      logger.warn('Template file not found, using fallback', { type })
      return this.getFallbackTemplate(type, data)
    }
  }

  /**
   * Get fallback inline template if file not found
   */
  private getFallbackTemplate(type: string, data: any): string {
    const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>This is an automated notification from Fleet Management System.</p>
      <p>You can manage your notification preferences in your account settings.</p>
    </div>
  </div>
</body>
</html>`

    switch (type) {
      case 'reservation_request':
        return baseTemplate(`
          <div class="header"><h1>New Reservation Request</h1></div>
          <div class="content">
            <p>A new vehicle reservation request requires your approval:</p>
            <div class="info-box">
              <strong>Vehicle:</strong> ${data.make} ${data.model} (${data.license_plate})<br>
              <strong>Requested by:</strong> ${data.reserved_by_name}<br>
              <strong>Period:</strong> ${this.formatDateTime(data.start_time)} - ${this.formatDateTime(data.end_time)}<br>
              <strong>Purpose:</strong> ${data.purpose || 'Not specified'}
            </div>
            <a href="${process.env.APP_URL}/scheduling/reservations/${data.id}" class="button">Review Request</a>
          </div>
        `)

      case 'reservation_approved':
        return baseTemplate(`
          <div class="header"><h1>Reservation Approved</h1></div>
          <div class="content">
            <p>Good news! Your vehicle reservation has been approved.</p>
            <div class="info-box">
              <strong>Vehicle:</strong> ${data.make} ${data.model} (${data.license_plate})<br>
              <strong>Pickup:</strong> ${this.formatDateTime(data.start_time)}<br>
              <strong>Return:</strong> ${this.formatDateTime(data.end_time)}<br>
              <strong>Location:</strong> ${data.pickup_location || 'Facility'}
            </div>
            <a href="${process.env.APP_URL}/scheduling/reservations/${data.id}" class="button">View Details</a>
          </div>
        `)

      default:
        return baseTemplate(`
          <div class="header"><h1>Scheduling Notification</h1></div>
          <div class="content">
            <p>You have a new scheduling notification.</p>
            <div class="info-box">${JSON.stringify(data, null, 2)}</div>
          </div>
        `)
    }
  }

  /**
   * Format Teams adaptive card
   */
  private formatTeamsCard(type: string, data: any): any {
    return {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: this.getCardTitle(type),
            weight: 'Bolder',
            size: 'Large'
          },
          {
            type: 'FactSet',
            facts: this.getCardFacts(type, data)
          }
        ],
        actions: this.getCardActions(type, data)
      }
    }
  }

  private getCardTitle(type: string): string {
    const titles: Record<string, string> = {
      reservation_request: '🚗 New Reservation Request',
      reservation_approved: '✅ Reservation Approved',
      reservation_rejected: '❌ Reservation Declined',
      reservation_reminder: '⏰ Reservation Reminder',
      maintenance_reminder: '🔧 Maintenance Reminder',
      conflict_detected: '⚠️ Scheduling Conflict'
    }
    return titles[type] || 'Scheduling Notification'
  }

  private getCardFacts(type: string, data: any): any[] {
    const facts = []

    if (data.make && data.model) {
      facts.push({ title: 'Vehicle', value: `${data.make} ${data.model}` })
    }
    if (data.start_time) {
      facts.push({ title: 'Start Time', value: this.formatDateTime(data.start_time) })
    }
    if (data.end_time) {
      facts.push({ title: 'End Time', value: this.formatDateTime(data.end_time) })
    }
    if (data.purpose) {
      facts.push({ title: 'Purpose', value: data.purpose })
    }
    if (data.rejection_reason) {
      facts.push({ title: 'Reason', value: data.rejection_reason })
    }

    return facts
  }

  private getCardActions(type: string, data: any): any[] {
    const baseUrl = process.env.APP_URL || 'https://fleet.example.com'

    if (type === 'reservation_request' && data.id) {
      return [
        {
          type: 'Action.OpenUrl',
          title: 'Approve',
          url: `${baseUrl}/scheduling/reservations/${data.id}/approve`
        },
        {
          type: 'Action.OpenUrl',
          title: 'View Details',
          url: `${baseUrl}/scheduling/reservations/${data.id}`
        }
      ]
    }

    if (data.id) {
      return [
        {
          type: 'Action.OpenUrl',
          title: 'View Details',
          url: `${baseUrl}/scheduling/reservations/${data.id}`
        }
      ]
    }

    return []
  }

  /**
   * Get user notification preferences
   */
  private async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const result = await pool.query(
      `SELECT 
      id,
      user_id,
      email_enabled,
      sms_enabled,
      push_enabled,
      schedule_changes,
      shift_reminders,
      created_at,
      updated_at FROM scheduling_notification_preferences WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      // Return default preferences
      return {
        userId,
        emailEnabled: true,
        smsEnabled: false,
        teamsEnabled: true,
        reminderTimes: [24, 1] // 24 hours and 1 hour before
      }
    }

    const prefs = result.rows[0]
    return {
      userId: prefs.user_id,
      emailEnabled: prefs.email_enabled,
      smsEnabled: prefs.sms_enabled,
      teamsEnabled: prefs.teams_enabled,
      reminderTimes: prefs.reminder_times || [24, 1],
      quietHoursStart: prefs.quiet_hours_start,
      quietHoursEnd: prefs.quiet_hours_end
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    await pool.query(
      `INSERT INTO scheduling_notification_preferences (
        user_id, email_enabled, sms_enabled, teams_enabled, reminder_times,
        quiet_hours_start, quiet_hours_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        email_enabled = COALESCE($2, scheduling_notification_preferences.email_enabled),
        sms_enabled = COALESCE($3, scheduling_notification_preferences.sms_enabled),
        teams_enabled = COALESCE($4, scheduling_notification_preferences.teams_enabled),
        reminder_times = COALESCE($5, scheduling_notification_preferences.reminder_times),
        quiet_hours_start = COALESCE($6, scheduling_notification_preferences.quiet_hours_start),
        quiet_hours_end = COALESCE($7, scheduling_notification_preferences.quiet_hours_end),
        updated_at = NOW()`,
      [
        userId,
        preferences.emailEnabled,
        preferences.smsEnabled,
        preferences.teamsEnabled,
        preferences.reminderTimes,
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      ]
    )
  }

  /**
   * Log communication to database
   */
  private async logCommunication(data: {
    tenantId: string
    communicationType: string
    direction: string
    subject: string
    body: string
    toUserId: string
    toEmail: string
    entityType: string
    entityId: string | null
  }): Promise<void> {
    try {
      const result = await pool.query(
        `INSERT INTO communications (
          communication_type, direction, subject, body,
          to_contact_emails, communication_datetime, status
        ) VALUES ($1, $2, $3, $4, $5, NOW(), 'Sent')
        RETURNING id`,
        [
          data.communicationType,
          data.direction,
          data.subject,
          data.body,
          [data.toEmail]
        ]
      )

      const communicationId = result.rows[0].id

      // Link to entity if provided
      if (data.entityId && data.entityType) {
        await pool.query(
          `INSERT INTO communication_entity_links (
            communication_id, entity_type, entity_id, link_type
          ) VALUES ($1, $2, $3, 'Primary Subject')`,
          [communicationId, data.entityType, data.entityId]
        )
      }

      logger.info('Communication logged successfully', { communicationId })
    } catch (error) {
      logger.error('Error logging communication', { error })
      // Don't throw - logging failure shouldn't block notifications
    }
  }

  /**
   * Mark reminder as sent to avoid duplicates
   */
  private async markReminderSent(
    entityId: string,
    entityType: string,
    hoursUntil: number
  ): Promise<void> {
    await pool.query(
      `INSERT INTO scheduling_reminders_sent (
        entity_id, entity_type, hours_before, sent_at
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (entity_id, entity_type, hours_before) DO UPDATE
      SET sent_at = NOW()`,
      [entityId, entityType, hoursUntil]
    )
  }

  /**
   * Check if reminder already sent
   */
  async isReminderSent(
    entityId: string,
    entityType: string,
    hoursUntil: number
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM scheduling_reminders_sent
       WHERE entity_id = $1 AND entity_type = $2 AND hours_before = $3
       AND sent_at > NOW() - INTERVAL '2 hours'`,
      [entityId, entityType, hoursUntil]
    )

    return result.rows.length > 0
  }

  /**
   * Format date/time for display
   */
  private formatDateTime(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId: string, channels: string[]): Promise<void> {
    const testData = {
      make: 'Test',
      model: 'Vehicle',
      license_plate: 'TEST-123',
      reserved_by_name: 'Test User',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end_time: new Date(Date.now() + 25 * 60 * 60 * 1000),
      purpose: 'Test notification',
      id: 'test-123'
    }

    const template = this.getTemplate('reservation_reminder', { ...testData, hours_until: 24 })

    if (channels.includes('email')) {
      await this.sendEmail(userId, template.emailSubject, template.emailBody, 'test', 'test', null)
    }

    if (channels.includes('sms')) {
      await this.sendSMS(userId, template.smsText)
    }

    if (channels.includes('teams')) {
      await this.sendTeamsNotification(userId, template.teamsMessage, 'reservation_reminder', testData)
    }
  }
}

// Export singleton instance
export const schedulingNotificationService = new SchedulingNotificationService()
export default schedulingNotificationService
