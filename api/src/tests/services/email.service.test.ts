/**
 * Email Service Tests
 *
 * Tests for email delivery functionality:
 * - Send email operations
 * - Email template processing
 * - Recipient validation
 * - Error handling
 * - Email queue/retry logic
 * - Multi-recipient support
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

interface EmailMessage {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  body: string
  html?: string
  attachments?: any[]
  sendAt?: Date
}

interface SendResult {
  id: string
  status: 'sent' | 'queued' | 'failed'
  error?: string
  sentAt?: Date
}

class EmailService {
  private sentEmails: Map<string, EmailMessage & { id: string; sentAt: Date }> = new Map()
  private failedEmails: Map<string, EmailMessage & { error: string }> = new Map()
  private emailQueue: (EmailMessage & { id: string })[] = []

  async sendEmail(message: EmailMessage): Promise<SendResult> {
    try {
      // Validate recipients
      if (!message.to) {
        throw new Error('No recipients specified')
      }

      if (!message.subject || !message.body) {
        throw new Error('Subject and body are required')
      }

      // Validate email addresses
      const recipients = Array.isArray(message.to) ? message.to : [message.to]
      for (const recipient of recipients) {
        if (!this.isValidEmail(recipient)) {
          throw new Error(`Invalid email address: ${recipient}`)
        }
      }

      // Simulate email sending
      const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const sentEmail = {
        ...message,
        id: emailId,
        sentAt: new Date()
      }

      this.sentEmails.set(emailId, sentEmail)

      return {
        id: emailId,
        status: 'sent',
        sentAt: sentEmail.sentAt
      }
    } catch (error: any) {
      const emailId = `email-${Date.now()}-failed`
      this.failedEmails.set(emailId, {
        ...message,
        error: error.message
      })

      return {
        id: emailId,
        status: 'failed',
        error: error.message
      }
    }
  }

  async sendEmailBatch(messages: EmailMessage[]): Promise<SendResult[]> {
    return Promise.all(messages.map(msg => this.sendEmail(msg)))
  }

  async sendEmailTemplate(
    to: string | string[],
    templateName: string,
    variables: Record<string, any>
  ): Promise<SendResult> {
    // Simulate template processing
    const subject = `[${templateName}] Test Subject`
    const body = this.processTemplate(templateName, variables)

    return this.sendEmail({
      to,
      subject,
      body
    })
  }

  async queueEmail(message: EmailMessage, delay: number = 0): Promise<string> {
    const emailId = `queued-${Date.now()}`
    this.emailQueue.push({ ...message, id: emailId })

    return emailId
  }

  async getQueuedEmails(): Promise<string[]> {
    return this.emailQueue.map(e => e.id)
  }

  async getSentEmail(id: string): Promise<EmailMessage & { sentAt: Date } | null> {
    return this.sentEmails.get(id) || null
  }

  async getFailedEmail(id: string) {
    return this.failedEmails.get(id) || null
  }

  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  private processTemplate(templateName: string, variables: Record<string, any>): string {
    let template = this.getTemplate(templateName)

    for (const [key, value] of Object.entries(variables)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }

    return template
  }

  private getTemplate(name: string): string {
    const templates: Record<string, string> = {
      'welcome': 'Welcome {{name}}! Your account has been created.',
      'password_reset': 'Click here to reset your password: {{link}}',
      'notification': 'You have a new {{type}}: {{message}}'
    }

    return templates[name] || `Template ${name} not found`
  }

  // Test helpers
  getSentEmails() {
    return Array.from(this.sentEmails.values())
  }

  getFailedEmails() {
    return Array.from(this.failedEmails.values())
  }
}

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(() => {
    emailService = new EmailService()
  })

  describe('Send Email', () => {
    it('should send email successfully', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email'
      })

      expect(result.status).toBe('sent')
      expect(result.id).toBeDefined()
      expect(result.sentAt).toBeInstanceOf(Date)
    })

    it('should send email to multiple recipients', async () => {
      const result = await emailService.sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Team Email',
        body: 'Team message'
      })

      expect(result.status).toBe('sent')
    })

    it('should include CC and BCC recipients', async () => {
      const result = await emailService.sendEmail({
        to: 'main@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Email with CC/BCC',
        body: 'Content'
      })

      expect(result.status).toBe('sent')
      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.cc).toBe('cc@example.com')
      expect(sent?.bcc).toBe('bcc@example.com')
    })

    it('should include HTML content', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'HTML Email',
        body: 'Plain text',
        html: '<p>HTML content</p>'
      })

      expect(result.status).toBe('sent')
      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.html).toBe('<p>HTML content</p>')
    })

    it('should reject email without recipients', async () => {
      const result = await emailService.sendEmail({
        to: '',
        subject: 'No Recipients',
        body: 'Content'
      })

      expect(result.status).toBe('failed')
      expect(result.error).toContain('No recipients')
    })

    it('should reject invalid email addresses', async () => {
      const result = await emailService.sendEmail({
        to: 'not-an-email',
        subject: 'Bad Email',
        body: 'Content'
      })

      expect(result.status).toBe('failed')
      expect(result.error).toContain('Invalid email')
    })

    it('should reject email without subject', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: '',
        body: 'Content'
      })

      expect(result.status).toBe('failed')
      expect(result.error).toContain('Subject')
    })

    it('should reject email without body', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Subject',
        body: ''
      })

      expect(result.status).toBe('failed')
      expect(result.error).toContain('body')
    })

    it('should support attachments', async () => {
      const attachments = [
        { filename: 'test.txt', content: 'content' }
      ]

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Email with Attachment',
        body: 'See attachment',
        attachments
      })

      expect(result.status).toBe('sent')
      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.attachments).toEqual(attachments)
    })
  })

  describe('Batch Email Sending', () => {
    it('should send multiple emails', async () => {
      const messages = [
        { to: 'user1@example.com', subject: 'Email 1', body: 'Content 1' },
        { to: 'user2@example.com', subject: 'Email 2', body: 'Content 2' }
      ]

      const results = await emailService.sendEmailBatch(messages)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.status === 'sent')).toBe(true)
    })

    it('should handle partial batch failures', async () => {
      const messages = [
        { to: 'valid@example.com', subject: 'Valid', body: 'Content' },
        { to: 'invalid', subject: 'Invalid', body: 'Content' }
      ]

      const results = await emailService.sendEmailBatch(messages)

      expect(results[0].status).toBe('sent')
      expect(results[1].status).toBe('failed')
    })
  })

  describe('Email Templates', () => {
    it('should send email using template', async () => {
      const result = await emailService.sendEmailTemplate(
        'user@example.com',
        'welcome',
        { name: 'John' }
      )

      expect(result.status).toBe('sent')
      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.body).toContain('John')
    })

    it('should process template variables', async () => {
      const result = await emailService.sendEmailTemplate(
        'user@example.com',
        'password_reset',
        { link: 'https://example.com/reset' }
      )

      expect(result.status).toBe('sent')
      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.body).toContain('https://example.com/reset')
    })

    it('should handle multiple template variables', async () => {
      const result = await emailService.sendEmailTemplate(
        'user@example.com',
        'notification',
        { type: 'alert', message: 'System maintenance' }
      )

      expect(result.status).toBe('sent')
      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.body).toContain('alert')
      expect(sent?.body).toContain('System maintenance')
    })
  })

  describe('Email Queue', () => {
    it('should queue email for delayed sending', async () => {
      const emailId = await emailService.queueEmail({
        to: 'test@example.com',
        subject: 'Queued Email',
        body: 'Content'
      }, 5000)

      expect(emailId).toBeDefined()
      const queued = await emailService.getQueuedEmails()
      expect(queued).toContain(emailId)
    })

    it('should retrieve queued emails', async () => {
      await emailService.queueEmail({
        to: 'user1@example.com',
        subject: 'Email 1',
        body: 'Content 1'
      })

      await emailService.queueEmail({
        to: 'user2@example.com',
        subject: 'Email 2',
        body: 'Content 2'
      })

      const queued = await emailService.getQueuedEmails()
      expect(queued).toHaveLength(2)
    })
  })

  describe('Email Validation', () => {
    it('should validate correct email format', async () => {
      const validEmails = [
        'user@example.com',
        'name.surname@example.co.uk',
        'user+tag@example.com'
      ]

      for (const email of validEmails) {
        const result = await emailService.sendEmail({
          to: email,
          subject: 'Test',
          body: 'Content'
        })

        expect(result.status).toBe('sent')
      }
    })

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'plaintext',
        'user@',
        '@example.com',
        'user @example.com',
        'user@example'
      ]

      for (const email of invalidEmails) {
        const result = await emailService.sendEmail({
          to: email,
          subject: 'Test',
          body: 'Content'
        })

        expect(result.status).toBe('failed')
      }
    })
  })

  describe('Email Tracking', () => {
    it('should track sent emails', async () => {
      const result1 = await emailService.sendEmail({
        to: 'test1@example.com',
        subject: 'Email 1',
        body: 'Content'
      })

      const result2 = await emailService.sendEmail({
        to: 'test2@example.com',
        subject: 'Email 2',
        body: 'Content'
      })

      const sent = emailService.getSentEmails()
      expect(sent).toHaveLength(2)
      expect(sent.map(e => e.id)).toContain(result1.id)
      expect(sent.map(e => e.id)).toContain(result2.id)
    })

    it('should track failed emails', async () => {
      await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Bad Email',
        body: 'Content'
      })

      const failed = emailService.getFailedEmails()
      expect(failed).toHaveLength(1)
      expect(failed[0].error).toContain('Invalid')
    })

    it('should retrieve sent email by ID', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Specific Email',
        body: 'Specific content'
      })

      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.subject).toBe('Specific Email')
      expect(sent?.body).toBe('Specific content')
    })
  })

  describe('Email Timing', () => {
    it('should support scheduled sending', async () => {
      const futureDate = new Date(Date.now() + 3600000) // 1 hour from now

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Scheduled Email',
        body: 'Will send later',
        sendAt: futureDate
      })

      expect(result.status).toBe('sent')
      const sent = await emailService.getSentEmail(result.id)
      expect(sent?.sendAt).toEqual(futureDate)
    })

    it('should include sent timestamp', async () => {
      const beforeTime = Date.now()
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Timed Email',
        body: 'Content'
      })
      const afterTime = Date.now()

      expect(result.sentAt!.getTime()).toBeGreaterThanOrEqual(beforeTime)
      expect(result.sentAt!.getTime()).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('Error Handling', () => {
    it('should not throw on send failure', async () => {
      let threw = false
      try {
        await emailService.sendEmail({
          to: 'invalid',
          subject: '',
          body: ''
        })
      } catch (error) {
        threw = true
      }

      expect(threw).toBe(false)
    })

    it('should return failed status for all error types', async () => {
      const scenarios = [
        { to: '', subject: 'Test', body: 'Content' },
        { to: 'invalid', subject: 'Test', body: 'Content' },
        { to: 'valid@example.com', subject: '', body: 'Content' },
        { to: 'valid@example.com', subject: 'Test', body: '' }
      ]

      for (const scenario of scenarios) {
        const result = await emailService.sendEmail(scenario)
        expect(result.status).toBe('failed')
        expect(result.error).toBeDefined()
      }
    })
  })
})
