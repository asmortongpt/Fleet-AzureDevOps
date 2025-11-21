/**
 * SMS Service
 * Handles SMS and MMS messaging via Twilio
 */

import twilio from 'twilio';
import { pool as db } from '../config/database';
import Bottleneck from 'bottleneck';

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
}

export interface BulkSMSMessage {
  recipients: string[];
  body: string;
  from?: string;
  mediaUrl?: string[];
}

export interface SMSTemplate {
  id?: string;
  name: string;
  tenantId: string;
  body: string;
  category: string;
  variables?: string[];
}

export interface SMSLog {
  id: string;
  tenantId: string;
  to: string;
  from: string;
  body: string;
  status: string;
  messageSid?: string;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdBy?: string;
}

export interface WebhookPayload {
  MessageSid: string;
  MessageStatus: string;
  To: string;
  From: string;
  Body?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private limiter: Bottleneck;
  private isDevelopment = process.env.NODE_ENV !== 'production';

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.initializeTwilio();
    this.initializeRateLimiter();
  }

  /**
   * Initialize Twilio client
   */
  private initializeTwilio(): void {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!this.isDevelopment && accountSid && authToken) {
        this.client = twilio(accountSid, authToken);
        console.log('Twilio client initialized');
      } else {
        console.log('Twilio running in mock mode (development)');
      }
    } catch (error) {
      console.error('Failed to initialize Twilio:', error);
    }
  }

  /**
   * Initialize rate limiter (Twilio limits)
   */
  private initializeRateLimiter(): void {
    // Twilio rate limits: 1 message per second per phone number
    this.limiter = new Bottleneck({
      minTime: 1000, // 1 second between requests
      maxConcurrent: 1,
    });
  }

  /**
   * Send SMS message
   */
  async sendSMS(message: SMSMessage, tenantId: string, createdBy?: string): Promise<string> {
    try {
      const from = message.from || this.fromNumber;

      if (!from) {
        throw new Error('No from number configured');
      }

      // Log message to database
      const logId = await this.logMessage({
        tenantId,
        to: message.to,
        from,
        body: message.body,
        status: 'sending',
        createdBy,
      });

      // Send via Twilio (with rate limiting)
      const result = await this.limiter.schedule(() =>
        this.sendViaTwilio(message, from)
      );

      // Update log with success
      await this.updateMessageLog(logId, {
        status: 'sent',
        messageSid: result.sid,
        sentAt: new Date(),
      });

      return result.sid;
    } catch (error: any) {
      console.error('Error sending SMS:', error);

      // Log error
      if (error.logId) {
        await this.updateMessageLog(error.logId, {
          status: 'failed',
          errorCode: error.code?.toString(),
          errorMessage: error.message,
        });
      }

      throw error;
    }
  }

  /**
   * Send MMS with media
   */
  async sendMMS(
    message: SMSMessage & { mediaUrl: string[] },
    tenantId: string,
    createdBy?: string
  ): Promise<string> {
    try {
      const from = message.from || this.fromNumber;

      if (!from) {
        throw new Error('No from number configured');
      }

      // Log message to database
      const logId = await this.logMessage({
        tenantId,
        to: message.to,
        from,
        body: message.body,
        status: 'sending',
        createdBy,
      });

      // Send via Twilio
      const result = await this.limiter.schedule(() =>
        this.sendViaTwilio(message, from)
      );

      // Update log with success
      await this.updateMessageLog(logId, {
        status: 'sent',
        messageSid: result.sid,
        sentAt: new Date(),
      });

      return result.sid;
    } catch (error: any) {
      console.error('Error sending MMS:', error);
      throw error;
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(
    bulkMessage: BulkSMSMessage,
    tenantId: string,
    createdBy?: string
  ): Promise<{ successful: number; failed: number; errors: any[] }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const recipient of bulkMessage.recipients) {
      try {
        await this.sendSMS(
          {
            to: recipient,
            body: bulkMessage.body,
            from: bulkMessage.from,
            mediaUrl: bulkMessage.mediaUrl,
          },
          tenantId,
          createdBy
        );

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          recipient,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Send from template
   */
  async sendFromTemplate(
    templateName: string,
    tenantId: string,
    to: string,
    variables: Record<string, any>,
    createdBy?: string
  ): Promise<string> {
    try {
      // Get template
      const template = await this.getTemplate(templateName, tenantId);

      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      // Replace variables
      const body = this.replaceVariables(template.body, variables);

      // Send SMS
      return await this.sendSMS(
        {
          to,
          body,
        },
        tenantId,
        createdBy
      );
    } catch (error) {
      console.error('Error sending from template:', error);
      throw error;
    }
  }

  /**
   * Handle Twilio webhook (delivery status)
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    try {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = payload;

      // Update message log
      await db.query(
        `UPDATE sms_logs
         SET status = $1,
             error_code = $2,
             error_message = $3,
             delivered_at = CASE WHEN $1 = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE message_sid = $4`,
        [MessageStatus, ErrorCode, ErrorMessage, MessageSid]
      );

      console.log(`SMS status updated: ${MessageSid} -> ${MessageStatus}`);
    } catch (error) {
      console.error('Error handling webhook:', error);
    }
  }

  /**
   * Get SMS history
   */
  async getSMSHistory(
    tenantId: string,
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<SMSLog[]> {
    try {
      let query = `
        SELECT * FROM sms_logs
        WHERE tenant_id = $1
      `;

      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (filters?.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters?.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting SMS history:', error);
      throw error;
    }
  }

  /**
   * Get SMS templates
   */
  async getTemplates(tenantId: string, category?: string): Promise<SMSTemplate[]> {
    try {
      let query = 'SELECT * FROM sms_templates WHERE tenant_id = $1';
      const params: any[] = [tenantId];

      if (category) {
        query += ' AND category = $2';
        params.push(category);
      }

      query += ' ORDER BY name ASC';

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Get specific template
   */
  async getTemplate(name: string, tenantId: string): Promise<SMSTemplate | null> {
    try {
      const result = await db.query(
        'SELECT * FROM sms_templates WHERE name = $1 AND tenant_id = $2',
        [name, tenantId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  /**
   * Create SMS template
   */
  async createTemplate(template: SMSTemplate): Promise<string> {
    try {
      const result = await db.query(
        `INSERT INTO sms_templates (tenant_id, name, body, category, variables)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          template.tenantId,
          template.name,
          template.body,
          template.category,
          JSON.stringify(template.variables || []),
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get SMS statistics
   */
  async getStatistics(
    tenantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalSent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }> {
    try {
      let query = `
        SELECT
          COUNT(*) as total_sent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM sms_logs
        WHERE tenant_id = $1
      `;

      const params: any[] = [tenantId];

      if (dateRange) {
        query += ` AND created_at BETWEEN $2 AND $3`;
        params.push(dateRange.start, dateRange.end);
      }

      const result = await db.query(query, params);
      const row = result.rows[0];

      const totalSent = parseInt(row.total_sent) || 0;
      const delivered = parseInt(row.delivered) || 0;
      const failed = parseInt(row.failed) || 0;

      return {
        totalSent,
        delivered,
        failed,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Send via Twilio API
   */
  private async sendViaTwilio(message: SMSMessage, from: string): Promise<any> {
    if (this.isDevelopment || !this.client) {
      // Mock mode
      console.log(`[MOCK SMS] To: ${message.to}, From: ${from}, Body: ${message.body}`);
      return {
        sid: `MOCK_${Date.now()}`,
        status: 'sent',
      };
    }

    try {
      const result = await this.client.messages.create({
        body: message.body,
        from: from,
        to: message.to,
        mediaUrl: message.mediaUrl,
      });

      return result;
    } catch (error) {
      console.error('Twilio API error:', error);
      throw error;
    }
  }

  /**
   * Log SMS message to database
   */
  private async logMessage(data: {
    tenantId: string;
    to: string;
    from: string;
    body: string;
    status: string;
    createdBy?: string;
  }): Promise<string> {
    try {
      const result = await db.query(
        `INSERT INTO sms_logs (tenant_id, to_number, from_number, body, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [data.tenantId, data.to, data.from, data.body, data.status, data.createdBy]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error logging message:', error);
      throw error;
    }
  }

  /**
   * Update message log
   */
  private async updateMessageLog(
    id: string,
    updates: {
      status?: string;
      messageSid?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      errorCode?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      const sets: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.status) {
        sets.push(`status = $${paramIndex}`);
        params.push(updates.status);
        paramIndex++;
      }

      if (updates.messageSid) {
        sets.push(`message_sid = $${paramIndex}`);
        params.push(updates.messageSid);
        paramIndex++;
      }

      if (updates.sentAt) {
        sets.push(`sent_at = $${paramIndex}`);
        params.push(updates.sentAt);
        paramIndex++;
      }

      if (updates.deliveredAt) {
        sets.push(`delivered_at = $${paramIndex}`);
        params.push(updates.deliveredAt);
        paramIndex++;
      }

      if (updates.errorCode) {
        sets.push(`error_code = $${paramIndex}`);
        params.push(updates.errorCode);
        paramIndex++;
      }

      if (updates.errorMessage) {
        sets.push(`error_message = $${paramIndex}`);
        params.push(updates.errorMessage);
        paramIndex++;
      }

      sets.push('updated_at = CURRENT_TIMESTAMP');

      params.push(id);
      const query = `UPDATE sms_logs SET ${sets.join(', ')} WHERE id = $${paramIndex}`;

      await db.query(query, params);
    } catch (error) {
      console.error('Error updating message log:', error);
    }
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }
}

export const smsService = new SMSService();
export default smsService;
