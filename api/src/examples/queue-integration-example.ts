/**
 * Queue Integration Examples
 * Demonstrates how to integrate the queue system with existing services
 */

import { queueService } from '../services/queue.service';
import { JobPriority } from '../types/queue.types';

/**
 * Example 1: Integration with Teams Service
 * Replace direct API calls with queued operations
 */
export class TeamsServiceWithQueue {
  /**
   * Send a Teams message (queued)
   * Before: Direct API call
   * After: Enqueue for reliable delivery with retry
   */
  async sendMessage(chatId: string, message: string, urgent: boolean = false) {
    try {
      // Enqueue the message for sending
      const jobId = await queueService.enqueueTeamsMessage(
        {
          chatId,
          content: message,
          contentType: 'text',
          importance: urgent ? 'urgent' : 'normal',
          metadata: {
            source: 'teams-service',
            userId: 'current-user-id'
          }
        },
        urgent ? JobPriority.HIGH : JobPriority.NORMAL
      );

      return {
        success: true,
        jobId,
        message: 'Message queued for delivery'
      };
    } catch (error) {
      console.error('Failed to queue Teams message:', error);
      throw error;
    }
  }

  /**
   * Send a message to a channel
   */
  async sendChannelMessage(teamId: string, channelId: string, message: string) {
    const jobId = await queueService.enqueueTeamsMessage({
      teamId,
      channelId,
      content: message,
      contentType: 'html',
      importance: 'normal'
    });

    return { jobId };
  }

  /**
   * Send a message with mentions
   */
  async sendMessageWithMentions(
    chatId: string,
    message: string,
    mentions: Array<{ userId: string; displayName: string }>
  ) {
    const jobId = await queueService.enqueueTeamsMessage({
      chatId,
      content: message,
      mentions: mentions.map(m => ({
        id: m.userId,
        mentionText: `@${m.displayName}`,
        userId: m.userId
      }))
    });

    return { jobId };
  }
}

/**
 * Example 2: Integration with Email Service
 */
export class EmailServiceWithQueue {
  /**
   * Send an email (queued)
   */
  async sendEmail(to: string[], subject: string, body: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    const jobId = await queueService.enqueueOutlookEmail(
      {
        to,
        subject,
        body,
        bodyType: 'html',
        importance: priority,
        metadata: {
          source: 'email-service',
          timestamp: new Date()
        }
      },
      priority === 'high' ? JobPriority.HIGH : JobPriority.NORMAL
    );

    return { jobId };
  }

  /**
   * Send email with attachments
   */
  async sendEmailWithAttachments(
    to: string[],
    subject: string,
    body: string,
    attachments: Array<{ name: string; content: Buffer; contentType: string }>
  ) {
    const jobId = await queueService.enqueueOutlookEmail({
      to,
      subject,
      body,
      bodyType: 'html',
      attachments: attachments.map(att => ({
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.content.toString('base64')
      }))
    });

    return { jobId };
  }

  /**
   * Schedule email for later delivery
   */
  async scheduleEmail(
    to: string[],
    subject: string,
    body: string,
    sendAt: Date
  ) {
    const jobId = await queueService.scheduleJob(
      'outlook-outbound' as any,
      {
        type: 'outlook-outbound',
        payload: { to, subject, body, bodyType: 'html' }
      },
      sendAt
    );

    return { jobId, scheduledFor: sendAt };
  }
}

/**
 * Example 3: Integration with Webhook Handler
 */
export class WebhookHandlerWithQueue {
  /**
   * Handle incoming webhook (queued for processing)
   */
  async handleWebhook(webhookData: any) {
    // Immediately acknowledge webhook receipt
    const webhookId = webhookData.subscriptionId || `webhook_${Date.now()}`;

    // Queue for processing (prevents webhook timeout)
    const jobId = await queueService.enqueueWebhookProcessing({
      webhookId,
      source: webhookData.source || 'graph',
      eventType: webhookData.changeType || 'unknown',
      data: webhookData,
      receivedAt: new Date(),
      subscriptionId: webhookData.subscriptionId
    });

    return {
      success: true,
      webhookId,
      jobId,
      message: 'Webhook queued for processing'
    };
  }
}

/**
 * Example 4: Integration with File Upload Service
 */
export class FileUploadServiceWithQueue {
  /**
   * Upload file (queued)
   */
  async uploadFile(file: { name: string; size: number; type: string }, userId: string) {
    const fileId = `file_${Date.now()}`;

    const jobId = await queueService.enqueueAttachmentUpload(
      {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        operation: 'upload',
        source: 'manual',
        metadata: { userId }
      },
      { userId }
    );

    return { fileId, jobId };
  }

  /**
   * Scan file for malware and OCR (queued)
   */
  async scanFile(fileId: string, fileName: string) {
    const jobId = await queueService.enqueueAttachmentUpload({
      fileId,
      fileName,
      fileSize: 0,
      contentType: 'application/octet-stream',
      operation: 'scan',
      source: 'manual'
    });

    return { jobId };
  }
}

/**
 * Example 5: Integration with Sync Service
 */
export class SyncServiceWithQueue {
  /**
   * Sync Teams messages (queued)
   */
  async syncTeamsMessages(teamId: string, channelId?: string, userId?: string) {
    const jobId = await queueService.enqueueSync({
      resourceType: 'messages',
      teamId,
      channelId,
      userId,
      fullSync: false
    });

    return { jobId };
  }

  /**
   * Full sync of all messages (queued with low priority)
   */
  async fullSyncMessages(userId: string) {
    const jobId = await queueService.enqueueSync({
      resourceType: 'messages',
      userId,
      fullSync: true
    });

    return { jobId };
  }

  /**
   * Sync calendar events
   */
  async syncCalendar(userId: string) {
    const jobId = await queueService.enqueueSync({
      resourceType: 'calendar',
      userId,
      fullSync: false
    });

    return { jobId };
  }
}

/**
 * Example 6: Batch Operations
 */
export class BatchOperationsWithQueue {
  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(users: Array<{ email: string; message: string }>) {
    const jobIds = await Promise.all(
      users.map(user =>
        queueService.enqueueOutlookEmail(
          {
            to: [user.email],
            subject: 'Fleet Notification',
            body: user.message,
            bodyType: 'html'
          },
          JobPriority.LOW
        )
      )
    );

    return {
      totalQueued: jobIds.length,
      jobIds
    };
  }

  /**
   * Bulk file processing
   */
  async processBulkFiles(files: Array<{ id: string; name: string; size: number }>) {
    const jobIds = await Promise.all(
      files.map(file =>
        queueService.enqueueAttachmentUpload({
          fileId: file.id,
          fileName: file.name,
          fileSize: file.size,
          contentType: 'application/octet-stream',
          operation: 'scan',
          source: 'manual'
        })
      )
    );

    return { totalQueued: jobIds.length, jobIds };
  }
}

/**
 * Example 7: Error Handling and Monitoring
 */
export class QueueMonitoringExample {
  /**
   * Check if message was delivered
   */
  async checkMessageStatus(jobId: string) {
    try {
      const response = await fetch(`/api/queue/teams-outbound/job/${jobId}`, {
        headers: { 'x-admin-key': process.env.ADMIN_KEY || '' }
      });

      const { data } = await response.json();

      return {
        jobId: data.job_id,
        status: data.status,
        retryCount: data.retry_count,
        error: data.error,
        completedAt: data.completed_at
      };
    } catch (error) {
      console.error('Failed to check message status:', error);
      throw error;
    }
  }

  /**
   * Get queue health
   */
  async getQueueHealth() {
    const health = await queueService.getQueueHealth();
    return health;
  }

  /**
   * Retry failed job
   */
  async retryFailedMessage(jobId: string) {
    const newJobId = await queueService.retryFailedJob(jobId);
    return { originalJobId: jobId, newJobId };
  }
}

/**
 * Example 8: Integration in Express Route
 */
export function setupQueueRoutes(app: any) {
  const teamsService = new TeamsServiceWithQueue();
  const emailService = new EmailServiceWithQueue();

  // Send Teams message endpoint
  app.post('/api/teams/send-message', async (req: any, res: any) => {
    try {
      const { chatId, message, urgent } = req.body;
      const result = await teamsService.sendMessage(chatId, message, urgent);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send email endpoint
  app.post('/api/email/send', async (req: any, res: any) => {
    try {
      const { to, subject, body, priority } = req.body;
      const result = await emailService.sendEmail(to, subject, body, priority);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Schedule email endpoint
  app.post('/api/email/schedule', async (req: any, res: any) => {
    try {
      const { to, subject, body, sendAt } = req.body;
      const result = await emailService.scheduleEmail(
        to,
        subject,
        body,
        new Date(sendAt)
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default {
  TeamsServiceWithQueue,
  EmailServiceWithQueue,
  WebhookHandlerWithQueue,
  FileUploadServiceWithQueue,
  SyncServiceWithQueue,
  BatchOperationsWithQueue,
  QueueMonitoringExample,
  setupQueueRoutes
};
