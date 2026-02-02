/**
 * Job Queue Tests
 * Tests for Bull queue setup and management
 */

import { describe, it, expect, afterAll } from 'vitest'

import {
  emailQueue,
  notificationQueue,
  reportQueue,
  addEmailJob,
  addNotificationJob,
  addReportJob,
  getAllQueueStats,
  getQueueHealth,
  closeAllQueues,
} from '../../jobs/queue'

describe('Job Queue System', () => {
  afterAll(async () => {
    // Clean up queues after tests
    await closeAllQueues()
  })

  describe('Queue Creation', () => {
    it('should create email queue', () => {
      expect(emailQueue).toBeDefined()
      expect(emailQueue.name).toBe('email')
    })

    it('should create notification queue', () => {
      expect(notificationQueue).toBeDefined()
      expect(notificationQueue.name).toBe('notification')
    })

    it('should create report queue', () => {
      expect(reportQueue).toBeDefined()
      expect(reportQueue.name).toBe('report')
    })
  })

  describe('Email Queue', () => {
    it('should add email job to queue', async () => {
      const job = await addEmailJob({
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
      })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data.to).toBe('test@example.com')
      expect(job.data.subject).toBe('Test Email')
    })

    it('should add email job with template', async () => {
      const job = await addEmailJob({
        to: 'test@example.com',
        subject: 'Maintenance Due',
        template: 'maintenanceDue',
        context: {
          vehicleName: 'Test Vehicle',
          vin: 'TEST123',
          serviceType: 'Oil Change',
          dueDate: '2024-12-31',
          odometer: 50000,
        },
      })

      expect(job).toBeDefined()
      expect(job.data.template).toBe('maintenanceDue')
      expect(job.data.context.vehicleName).toBe('Test Vehicle')
    })

    it('should add email job with attachments', async () => {
      const job = await addEmailJob({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Report Attached',
        body: 'Please find the report attached',
        attachments: [
          {
            filename: 'report.pdf',
            path: '/tmp/report.pdf',
          },
        ],
      })

      expect(job).toBeDefined()
      expect(job.data.attachments).toHaveLength(1)
      expect(job.data.attachments[0].filename).toBe('report.pdf')
    })
  })

  describe('Notification Queue', () => {
    it('should add notification job to queue', async () => {
      const job = await addNotificationJob({
        userId: 'user123',
        title: 'Test Notification',
        body: 'This is a test notification',
      })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data.userId).toBe('user123')
      expect(job.data.title).toBe('Test Notification')
    })

    it('should add high priority notification', async () => {
      const job = await addNotificationJob({
        userId: 'user123',
        title: 'URGENT: Vehicle Alert',
        body: 'Critical vehicle issue detected',
        priority: 'high',
      })

      expect(job).toBeDefined()
      expect(job.data.priority).toBe('high')
      expect(job.opts.priority).toBe(1) // High priority = 1
    })

    it('should add notification with custom data', async () => {
      const job = await addNotificationJob({
        userId: ['user1', 'user2', 'user3'],
        title: 'New Assignment',
        body: 'You have been assigned a new vehicle',
        data: {
          vehicleId: 'vehicle123',
          assignmentId: 'assignment456',
          action: 'view_assignment',
        },
        badge: 5,
        sound: 'notification.wav',
      })

      expect(job).toBeDefined()
      expect(job.data.data.vehicleId).toBe('vehicle123')
      expect(job.data.badge).toBe(5)
    })
  })

  describe('Report Queue', () => {
    it('should add report job to queue', async () => {
      const job = await addReportJob({
        reportType: 'maintenance',
        userId: 'user123',
        format: 'pdf',
      })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data.reportType).toBe('maintenance')
      expect(job.data.format).toBe('pdf')
    })

    it('should add report job with parameters', async () => {
      const job = await addReportJob({
        reportType: 'cost-analysis',
        userId: 'user123',
        parameters: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          vehicleIds: ['v1', 'v2', 'v3'],
        },
        format: 'excel',
        deliveryMethod: 'email',
        recipients: ['manager@example.com'],
      })

      expect(job).toBeDefined()
      expect(job.data.reportType).toBe('cost-analysis')
      expect(job.data.parameters.vehicleIds).toHaveLength(3)
      expect(job.data.deliveryMethod).toBe('email')
    })

    it('should add report job with longer timeout', async () => {
      const job = await addReportJob({
        reportType: 'vehicle-utilization',
        userId: 'user123',
      })

      expect(job).toBeDefined()
      expect(job.opts.timeout).toBe(300000) // 5 minutes
    })
  })

  describe('Queue Statistics', () => {
    it('should get statistics for all queues', async () => {
      const stats = await getAllQueueStats()

      expect(stats).toBeDefined()
      expect(stats.queues).toHaveLength(3)
      expect(stats.timestamp).toBeDefined()

      const emailStats = stats.queues.find((q) => q.name === 'email')
      expect(emailStats).toBeDefined()
      expect(emailStats?.counts).toBeDefined()
    })

    it('should get queue health', async () => {
      const health = await getQueueHealth()

      expect(health).toBeDefined()
      expect(health.healthy).toBeDefined()
      expect(health.redis).toBeDefined()
      expect(health.queues).toBeDefined()
    })
  })

  describe('Job Management', () => {
    it('should handle job with custom priority', async () => {
      const job = await addEmailJob(
        {
          to: 'urgent@example.com',
          subject: 'URGENT',
          body: 'This is urgent',
        },
        { priority: 1 }
      )

      expect(job.opts.priority).toBe(1)
    })

    it('should handle job with delay', async () => {
      const job = await addEmailJob(
        {
          to: 'delayed@example.com',
          subject: 'Delayed Email',
          body: 'This email is delayed',
        },
        { delay: 5000 }
      )

      expect(job.opts.delay).toBe(5000)
    })

    it('should handle job with retry configuration', async () => {
      const job = await addEmailJob(
        {
          to: 'retry@example.com',
          subject: 'Will Retry',
          body: 'This will retry on failure',
        },
        {
          attempts: 5,
          backoff: {
            type: 'fixed',
            delay: 1000,
          },
        }
      )

      expect(job.opts.attempts).toBe(5)
      expect(job.opts.backoff).toEqual({
        type: 'fixed',
        delay: 1000,
      })
    })
  })
})
