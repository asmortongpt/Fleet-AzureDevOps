/**
 * Email Job Processor
 *
 * Processes email jobs for:
 * - Vehicle alerts (maintenance due, inspection overdue, etc.)
 * - Maintenance reminders
 * - General notifications
 */

import { Job } from 'bull'
import nodemailer from 'nodemailer'

import { pool } from '../../config/database'
import logger from '../../utils/logger'

/**
 * Email transporter configuration
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false,
  },
})

/**
 * Email templates for different alert types
 */
const emailTemplates = {
  maintenanceDue: (data: any) => ({
    subject: `Maintenance Due: ${data.vehicleName || 'Vehicle'}`,
    html: `
      <h2>Maintenance Due Notification</h2>
      <p>The following vehicle requires maintenance:</p>
      <ul>
        <li><strong>Vehicle:</strong> ${data.vehicleName}</li>
        <li><strong>VIN:</strong> ${data.vin}</li>
        <li><strong>Service Type:</strong> ${data.serviceType}</li>
        <li><strong>Due Date:</strong> ${data.dueDate}</li>
        <li><strong>Odometer:</strong> ${data.odometer} miles</li>
      </ul>
      <p>Please schedule this maintenance as soon as possible to ensure vehicle reliability and safety.</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/maintenance">View Maintenance Dashboard</a></p>
    `,
  }),

  inspectionOverdue: (data: any) => ({
    subject: `URGENT: Inspection Overdue - ${data.vehicleName || 'Vehicle'}`,
    html: `
      <h2 style="color: #d32f2f;">Inspection Overdue Alert</h2>
      <p><strong>This vehicle has an overdue inspection and may not be compliant for operation.</strong></p>
      <ul>
        <li><strong>Vehicle:</strong> ${data.vehicleName}</li>
        <li><strong>VIN:</strong> ${data.vin}</li>
        <li><strong>Inspection Type:</strong> ${data.inspectionType}</li>
        <li><strong>Due Date:</strong> ${data.dueDate}</li>
        <li><strong>Days Overdue:</strong> ${data.daysOverdue}</li>
      </ul>
      <p style="color: #d32f2f;"><strong>Action Required:</strong> Schedule inspection immediately.</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/inspections">View Inspections</a></p>
    `,
  }),

  vehicleAlert: (data: any) => ({
    subject: `Vehicle Alert: ${data.alertType} - ${data.vehicleName || 'Vehicle'}`,
    html: `
      <h2>Vehicle Alert</h2>
      <p>A vehicle alert has been triggered:</p>
      <ul>
        <li><strong>Alert Type:</strong> ${data.alertType}</li>
        <li><strong>Vehicle:</strong> ${data.vehicleName}</li>
        <li><strong>VIN:</strong> ${data.vin}</li>
        <li><strong>Description:</strong> ${data.description}</li>
        <li><strong>Time:</strong> ${data.timestamp}</li>
        ${data.location ? `<li><strong>Location:</strong> ${data.location}</li>` : ''}
      </ul>
      ${data.severity === 'high' ? '<p style="color: #d32f2f;"><strong>High Priority - Immediate attention required</strong></p>' : ''}
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/vehicles/${data.vehicleId}">View Vehicle Details</a></p>
    `,
  }),

  maintenanceReminder: (data: any) => ({
    subject: `Upcoming Maintenance Reminder - ${data.vehicleName || 'Vehicle'}`,
    html: `
      <h2>Maintenance Reminder</h2>
      <p>This is a reminder that maintenance is coming due soon:</p>
      <ul>
        <li><strong>Vehicle:</strong> ${data.vehicleName}</li>
        <li><strong>VIN:</strong> ${data.vin}</li>
        <li><strong>Service Type:</strong> ${data.serviceType}</li>
        <li><strong>Due Date:</strong> ${data.dueDate}</li>
        <li><strong>Days Until Due:</strong> ${data.daysUntilDue}</li>
        <li><strong>Estimated Cost:</strong> ${data.estimatedCost ? `$${data.estimatedCost}` : 'N/A'}</li>
      </ul>
      <p>Consider scheduling this maintenance in advance to avoid downtime.</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/maintenance/schedule">Schedule Maintenance</a></p>
    `,
  }),

  fuelAlert: (data: any) => ({
    subject: `Fuel Alert: ${data.alertType} - ${data.vehicleName || 'Vehicle'}`,
    html: `
      <h2>Fuel Alert</h2>
      <ul>
        <li><strong>Vehicle:</strong> ${data.vehicleName}</li>
        <li><strong>Alert:</strong> ${data.alertType}</li>
        <li><strong>Fuel Level:</strong> ${data.fuelLevel}%</li>
        <li><strong>Location:</strong> ${data.location || 'Unknown'}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/fuel">View Fuel Dashboard</a></p>
    `,
  }),
}

/**
 * Process email job
 */
export async function processEmailJob(job: Job): Promise<any> {
  const { to, subject, template, body, html, context, attachments } = job.data

  logger.info(`Processing email job ${job.id}`, {
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    template,
  })

  try {
    let emailContent: { subject: string; html: string } | undefined

    // Use template if provided
    if (template && emailTemplates[template as keyof typeof emailTemplates]) {
      emailContent = emailTemplates[template as keyof typeof emailTemplates](context || {})
    }

    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@fleet.com',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: emailContent?.subject || subject,
      text: body,
      html: emailContent?.html || html || body,
      attachments: attachments || [],
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    logger.info(`Email sent successfully: ${info.messageId}`, {
      jobId: job.id,
      to: mailOptions.to,
      subject: mailOptions.subject,
    })

    // Log email in database
    await pool.query(
      `INSERT INTO communication_logs
       (message_id, channel, direction, content, status, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        info.messageId,
        'email',
        'outbound',
        mailOptions.subject,
        'sent',
        JSON.stringify({
          to: mailOptions.to,
          template,
          context,
          jobId: job.id,
        }),
      ]
    )

    return {
      success: true,
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
      sentAt: new Date().toISOString(),
    }
  } catch (error: any) {
    logger.error(`Failed to send email in job ${job.id}:`, error)

    // Log failed email
    await pool.query(
      `INSERT INTO communication_logs
       (channel, direction, content, status, error, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        'email',
        'outbound',
        subject || 'Unknown Subject',
        'failed',
        error.message,
        JSON.stringify({
          to: Array.isArray(to) ? to.join(', ') : to,
          template,
          jobId: job.id,
        }),
      ]
    )

    throw error
  }
}

/**
 * Verify email transporter configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify()
    logger.info('Email transporter configuration verified')
    return true
  } catch (error) {
    logger.error('Email transporter verification failed:', error)
    return false
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(to: string): Promise<any> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@fleet.com',
    to,
    subject: 'Fleet Management System - Test Email',
    html: `
      <h2>Test Email</h2>
      <p>This is a test email from the Fleet Management System.</p>
      <p>Email configuration is working correctly.</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `,
  }

  return transporter.sendMail(mailOptions)
}
