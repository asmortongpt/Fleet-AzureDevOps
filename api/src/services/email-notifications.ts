import nodemailer from 'nodemailer'
import { logger } from '../config/logger'
import { outlookService } from './outlook.service'
import { microsoftGraphService, MicrosoftGraphService } from './microsoft-graph.service'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface TripApprovalNotification {
  driverEmail: string
  driverName: string
  tripDate: string
  miles: number
  usageType: string
  purpose?: string
  approvalUrl: string
}

interface ApprovalResultNotification {
  driverEmail: string
  driverName: string
  tripDate: string
  miles: number
  status: 'approved' | 'rejected'
  rejectionReason?: string
}

interface LimitWarningNotification {
  driverEmail: string
  driverName: string
  currentMiles: number
  limitMiles: number
  percentageUsed: number
  period: 'month' | 'year'
}

type EmailProvider = 'graph' | 'smtp' | 'auto'

class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null
  private fromEmail: string
  private frontendUrl: string
  private preferredProvider: EmailProvider

  constructor() {
    // SECURITY: Require email configuration - no hardcoded defaults
    if (!process.env.EMAIL_FROM) {
      logger.warn('EMAIL_FROM not set - email notifications will use fallback')
    }
    if (!process.env.FRONTEND_URL) {
      logger.warn('FRONTEND_URL not set - email links may not work correctly')
    }

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@fleet.example.com' // Fallback to non-production domain
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173' // Fallback to local dev

    // Determine preferred email provider: 'graph', 'smtp', or 'auto' (default)
    // 'auto' will try Graph API first, fall back to SMTP if Graph is not configured
    this.preferredProvider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'auto'

    this.initializeTransporter()
  }

  private initializeTransporter() {
    try {
      const emailHost = process.env.EMAIL_HOST
      const emailUser = process.env.EMAIL_USER
      const emailPass = process.env.EMAIL_PASS

      if (!emailHost || !emailUser || !emailPass) {
        logger.warn('Email configuration missing, notifications will be logged only')
        return
      }

      const config: EmailConfig = {
        host: emailHost,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      }

      this.transporter = nodemailer.createTransport(config)

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          logger.error('Email transporter verification failed', { error: error.message })
          this.transporter = null
        } else {
          logger.info('Email notification service initialized successfully')
        }
      })
    } catch (error) {
      logger.error('Failed to initialize email transporter', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async sendTripApprovalRequest(notification: TripApprovalNotification): Promise<boolean> {
    const subject = `Personal Use Trip Approval Required - ${notification.driverName}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Personal Vehicle Use Approval Request</h2>

        <p>Hello,</p>

        <p><strong>${notification.driverName}</strong> has submitted a ${notification.usageType} use trip that requires your approval:</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${notification.tripDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Miles:</strong></td>
              <td style="padding: 8px 0;">${notification.miles}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Usage Type:</strong></td>
              <td style="padding: 8px 0;">${notification.usageType}</td>
            </tr>
            ${notification.purpose ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Purpose:</strong></td>
              <td style="padding: 8px 0;">${notification.purpose}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <p>
          <a href="${notification.approvalUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review and Approve
          </a>
        </p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated notification from Fleet Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `

    return this.sendEmail(notification.driverEmail, subject, html, 'trip_approval_request')
  }

  async sendApprovalResult(notification: ApprovalResultNotification): Promise<boolean> {
    const isApproved = notification.status === 'approved'
    const subject = `Personal Use Trip ${isApproved ? 'Approved' : 'Rejected'}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">
          Trip ${isApproved ? 'Approved' : 'Rejected'}
        </h2>

        <p>Hello ${notification.driverName},</p>

        <p>Your personal use trip has been <strong>${notification.status}</strong>:</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${notification.tripDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Miles:</strong></td>
              <td style="padding: 8px 0;">${notification.miles}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Status:</strong></td>
              <td style="padding: 8px 0; color: ${isApproved ? '#10b981' : '#ef4444'};">
                <strong>${notification.status.toUpperCase()}</strong>
              </td>
            </tr>
            ${notification.rejectionReason ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Reason:</strong></td>
              <td style="padding: 8px 0;">${notification.rejectionReason}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <p>
          <a href="${this.frontendUrl}/personal-use"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Personal Use Dashboard
          </a>
        </p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated notification from Fleet Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `

    return this.sendEmail(notification.driverEmail, subject, html, 'approval_result')
  }

  async sendLimitWarning(notification: LimitWarningNotification): Promise<boolean> {
    const subject = `Personal Use Limit Warning - ${notification.percentageUsed}% Used`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⚠️ Personal Use Limit Warning</h2>

        <p>Hello ${notification.driverName},</p>

        <p>You are approaching your ${notification.period}ly personal use limit:</p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Current Usage</h3>
          <div style="font-size: 24px; font-weight: bold; color: #92400e; margin: 10px 0;">
            ${notification.currentMiles} / ${notification.limitMiles} miles (${notification.percentageUsed}%)
          </div>

          <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 15px 0;">
            <div style="background: ${notification.percentageUsed >= 95 ? '#ef4444' : '#f59e0b'};
                        height: 100%; width: ${notification.percentageUsed}%;"></div>
          </div>
        </div>

        ${notification.percentageUsed >= 95 ? `
          <p style="color: #dc2626; font-weight: bold;">
            ⚠️ You have less than 5% of your ${notification.period}ly limit remaining!
          </p>
        ` : ''}

        <p>Please review your upcoming trips and ensure essential personal use only.</p>

        <p>
          <a href="${this.frontendUrl}/personal-use"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Usage Details
          </a>
        </p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated notification from Fleet Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `

    return this.sendEmail(notification.driverEmail, subject, html, 'limit_warning')
  }

  /**
   * Send email via Microsoft Graph API (Outlook)
   * @param to Recipient email address
   * @param subject Email subject
   * @param html HTML body
   * @param type Email type for logging
   * @returns Success status
   */
  async sendViaOutlook(to: string, subject: string, html: string, type: string): Promise<boolean> {
    try {
      // Check if Graph API is configured
      if (!microsoftGraphService.isConfigured()) {
        logger.warn('Microsoft Graph API not configured, cannot send via Outlook', { type, to })
        return false
      }

      const result = await outlookService.sendEmail({
        to,
        subject,
        body: html,
        bodyType: 'html',
        importance: type.includes('critical') || type.includes('warning') ? 'high' : 'normal'
      })

      if (result.success) {
        logger.info('Email notification sent via Outlook successfully', {
          type,
          to,
          subject
        })
        return true
      } else {
        logger.error('Failed to send email via Outlook', {
          type,
          to,
          error: result.error
        })
        return false
      }
    } catch (error) {
      logger.error('Error sending email via Outlook', {
        type,
        to,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  /**
   * Send email via SMTP (existing implementation)
   * @param to Recipient email address
   * @param subject Email subject
   * @param html HTML body
   * @param type Email type for logging
   * @returns Success status
   */
  async sendViaSMTP(to: string, subject: string, html: string, type: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.info('Email notification (logging only - no SMTP transporter)', {
          type,
          to,
          subject
        })
        return true // Return true to not block workflow
      }

      const mailOptions = {
        from: this.fromEmail,
        to,
        subject,
        html
      }

      await this.transporter.sendMail(mailOptions)

      logger.info('Email notification sent via SMTP successfully', {
        type,
        to,
        subject
      })

      return true
    } catch (error) {
      logger.error('Failed to send email notification via SMTP', {
        type,
        to,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  /**
   * Send email using configured provider (Graph API or SMTP)
   * Supports automatic fallback from Graph to SMTP
   */
  private async sendEmail(to: string, subject: string, html: string, type: string): Promise<boolean> {
    try {
      // Determine which provider to use
      let provider = this.preferredProvider

      if (provider === 'auto') {
        // Auto mode: Try Graph API first if configured, otherwise use SMTP
        provider = microsoftGraphService.isConfigured() ? 'graph' : 'smtp'
      }

      // Try primary provider
      if (provider === 'graph') {
        const success = await this.sendViaOutlook(to, subject, html, type)
        if (success) {
          return true
        }

        // If Graph fails and we're in auto mode, fallback to SMTP
        if (this.preferredProvider === 'auto' && this.transporter) {
          logger.warn('Graph API send failed, falling back to SMTP', { type, to })
          return await this.sendViaSMTP(to, subject, html, type)
        }

        return false
      } else {
        // Use SMTP
        return await this.sendViaSMTP(to, subject, html, type)
      }
    } catch (error) {
      logger.error('Failed to send email notification', {
        type,
        to,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  /**
   * Get current email provider configuration
   */
  getProviderStatus(): { provider: EmailProvider; graphConfigured: boolean; smtpConfigured: boolean } {
    return {
      provider: this.preferredProvider,
      graphConfigured: microsoftGraphService.isConfigured(),
      smtpConfigured: this.transporter !== null
    }
  }
}

export const emailNotificationService = new EmailNotificationService()
export default emailNotificationService
