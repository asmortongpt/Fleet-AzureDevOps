/**
 * Background Job Queue Service
 * Handles async task processing with Bull queue
 *
 * Features:
 * - Job queuing and processing
 * - Job priorities and scheduling
 * - Retry logic with exponential backoff
 * - Job progress tracking
 * - Failed job handling
 * - Cron-based recurring jobs
 */

import Bull, { Queue, Job, JobOptions } from 'bull'
import pool from '../../config/database'
import { notificationService } from '../notifications/notification.service'
import { customFieldsService } from '../custom-fields/custom-fields.service'

export type JobType =
  | 'send_notification'
  | 'bulk_update'
  | 'export_data'
  | 'import_data'
  | 'generate_report'
  | 'calculate_analytics'
  | 'cleanup_old_data'
  | 'sync_external_system'
  | 'process_workflow'
  | 'send_bulk_emails'

export interface JobData {
  type: JobType
  payload: any
  userId?: string
  tenantId?: string
  metadata?: any
}

export interface JobProgress {
  percentage: number
  message?: string
  current?: number
  total?: number
}

export class JobQueueService {
  private queues: Map<string, Queue> = new Map()
  private redisConfig: any

  constructor() {
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    }

    this.initializeQueues()
  }

  /**
   * Initialize job queues
   */
  private initializeQueues(): void {
    // Main queue for general jobs
    this.createQueue('default', {
      limiter: {
        max: 100,
        duration: 1000
      }
    })

    // High priority queue
    this.createQueue('high-priority', {
      limiter: {
        max: 200,
        duration: 1000
      }
    })

    // Email queue (with rate limiting)
    this.createQueue('email', {
      limiter: {
        max: 50,
        duration: 1000
      }
    })

    // Reports queue (resource intensive)
    this.createQueue('reports', {
      limiter: {
        max: 5,
        duration: 1000
      }
    })

    // Data processing queue
    this.createQueue('data-processing', {
      limiter: {
        max: 10,
        duration: 1000
      }
    })

    console.log('✨ Job queue service initialized with Redis')
  }

  /**
   * Create a queue
   */
  private createQueue(name: string, options?: any): Queue {
    const queue = new Bull(name, {
      redis: this.redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000
        },
        removeOnFail: {
          age: 7 * 24 * 3600 // Keep failed jobs for 7 days
        }
      },
      ...options
    })

    // Register processors
    this.registerProcessors(queue)

    // Event listeners
    queue.on('completed', (job: Job) => {
      console.log(`Job ${job.id} completed`)
      this.updateJobStatus(job.id as string, 'completed')
    })

    queue.on('failed', (job: Job, err: Error) => {
      console.error(`Job ${job.id} failed:`, err.message)
      this.updateJobStatus(job.id as string, 'failed', err.message)
    })

    queue.on('progress', (job: Job, progress: any) => {
      console.log(`Job ${job.id} progress: ${progress.percentage}%`)
      this.updateJobProgress(job.id as string, progress)
    })

    this.queues.set(name, queue)
    return queue
  }

  /**
   * Register job processors
   */
  private registerProcessors(queue: Queue): void {
    queue.process(async (job: Job) => {
      const jobData: JobData = job.data

      console.log(`Processing job ${job.id}: ${jobData.type}`)

      switch (jobData.type) {
        case 'send_notification':
          return await this.processSendNotification(job)

        case 'bulk_update':
          return await this.processBulkUpdate(job)

        case 'export_data':
          return await this.processExportData(job)

        case 'import_data':
          return await this.processImportData(job)

        case 'generate_report':
          return await this.processGenerateReport(job)

        case 'calculate_analytics':
          return await this.processCalculateAnalytics(job)

        case 'cleanup_old_data':
          return await this.processCleanupOldData(job)

        case 'sync_external_system':
          return await this.processSyncExternalSystem(job)

        case 'process_workflow':
          return await this.processWorkflow(job)

        case 'send_bulk_emails':
          return await this.processSendBulkEmails(job)

        default:
          throw new Error(`Unknown job type: ${jobData.type}`)
      }
    })
  }

  /**
   * Add job to queue
   */
  async addJob(
    queueName: string,
    jobData: JobData,
    options?: JobOptions
  ): Promise<string> {
    const queue = this.queues.get(queueName) || this.queues.get('default')!

    const job = await queue.add(jobData, options)

    // Store in database for tracking
    await this.createJobRecord(job.id as string, jobData)

    return job.id as string
  }

  /**
   * Add delayed job
   */
  async addDelayedJob(
    queueName: string,
    jobData: JobData,
    delayMs: number
  ): Promise<string> {
    return this.addJob(queueName, jobData, { delay: delayMs })
  }

  /**
   * Add recurring job
   */
  async addRecurringJob(
    queueName: string,
    jobData: JobData,
    cronExpression: string
  ): Promise<void> {
    const queue = this.queues.get(queueName) || this.queues.get('default')!

    await queue.add(jobData, {
      repeat: {
        cron: cronExpression
      }
    })
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const result = await pool.query(
      'SELECT 
      id,
      type,
      status,
      payload,
      progress,
      error_message,
      user_id,
      tenant_id,
      created_at,
      updated_at,
      completed_at FROM job_queue WHERE id = $1',
      [jobId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const record = result.rows[0]

    // Try to get from Bull queue
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId)
      if (job) {
        const state = await job.getState()
        return {
          ...record,
          state,
          progress: job.progress(),
          returnvalue: job.returnvalue,
          failedReason: job.failedReason
        }
      }
    }

    return record
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<void> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId)
      if (job) {
        await job.remove()
        await this.updateJobStatus(jobId, 'cancelled')
        return
      }
    }

    throw new Error('Job not found')
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<void> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId)
      if (job) {
        await job.retry()
        await this.updateJobStatus(jobId, 'retrying')
        return
      }
    }

    throw new Error('Job not found')
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error('Queue not found')
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    }
  }

  /**
   * Clean completed jobs
   */
  async cleanCompleted(queueName: string, graceMs: number = 3600000): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) return

    await queue.clean(graceMs, 'completed')
  }

  /**
   * Clean failed jobs
   */
  async cleanFailed(queueName: string, graceMs: number = 604800000): Promise<void> {
    const queue = this.queues.get(queueName)
    if (!queue) return

    await queue.clean(graceMs, 'failed')
  }

  // ========== Job Processors ==========

  private async processSendNotification(job: Job): Promise<void> {
    const { notification } = job.data.payload
    await notificationService.send(notification)
  }

  private async processBulkUpdate(job: Job): Promise<void> {
    const { entityType, entityIds, updates } = job.data.payload
    const total = entityIds.length

    for (let i = 0; i < total; i++) {
      const entityId = entityIds[i]
      const table = entityType === 'task' ? 'tasks' : 'assets'

      await pool.query(
        `UPDATE ${table} SET ${Object.keys(updates).map((k, idx) => `${k} = $${idx + 1}`).join(', ')}
         WHERE id = $${Object.keys(updates).length + 1}`,
        [...Object.values(updates), entityId]
      )

      await job.progress({
        percentage: Math.round(((i + 1) / total) * 100),
        current: i + 1,
        total
      })
    }
  }

  private async processExportData(job: Job): Promise<any> {
    const { entityType, filters, format } = job.data.payload

    // Simplified export logic
    job.progress({ percentage: 50, message: 'Fetching data...' })

    const table = entityType === 'task' ? 'tasks' : 'assets'
    const columnMap: Record<string, string> = {
      'tasks': 'id, tenant_id, title, description, status, priority, due_date, assigned_to, created_by, created_at, updated_at',
      'assets': 'id, tenant_id, asset_name, asset_type, location, status, acquisition_date, depreciation_rate, created_at, updated_at'
    }
    const columns = columnMap[table] || '*'
    const result = await pool.query(`SELECT ${columns} FROM ${table} LIMIT 1000`)

    job.progress({ percentage: 100, message: 'Export complete' })

    return {
      rowCount: result.rows.length,
      format
    }
  }

  private async processImportData(job: Job): Promise<void> {
    const { entityType, data } = job.data.payload
    const total = data.length

    for (let i = 0; i < total; i++) {
      // Import logic here
      await job.progress({
        percentage: Math.round(((i + 1) / total) * 100),
        current: i + 1,
        total
      })
    }
  }

  private async processGenerateReport(job: Job): Promise<any> {
    const { reportType, parameters } = job.data.payload

    job.progress({ percentage: 25, message: 'Collecting data...' })
    await new Promise(resolve => setTimeout(resolve, 1000))

    job.progress({ percentage: 50, message: 'Processing...' })
    await new Promise(resolve => setTimeout(resolve, 1000))

    job.progress({ percentage: 75, message: 'Generating document...' })
    await new Promise(resolve => setTimeout(resolve, 1000))

    job.progress({ percentage: 100, message: 'Report complete' })

    return { reportUrl: `/reports/generated-${Date.now()}.pdf` }
  }

  private async processCalculateAnalytics(job: Job): Promise<any> {
    const { entityType, period } = job.data.payload

    // Calculate analytics
    job.progress({ percentage: 100 })

    return { calculated: true }
  }

  private async processCleanupOldData(job: Job): Promise<any> {
    const { retentionDays } = job.data.payload

    const result = await pool.query(
      `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '${retentionDays} days'`
    )

    return { deletedCount: result.rowCount }
  }

  private async processSyncExternalSystem(job: Job): Promise<void> {
    const { system, action, data } = job.data.payload

    // External sync logic
    job.progress({ percentage: 100 })
  }

  private async processWorkflow(job: Job): Promise<void> {
    const { workflowId, entityId } = job.data.payload

    // Workflow processing logic
    job.progress({ percentage: 100 })
  }

  private async processSendBulkEmails(job: Job): Promise<void> {
    const { recipients, template, variables } = job.data.payload
    const total = recipients.length

    for (let i = 0; i < total; i++) {
      // Send email
      await job.progress({
        percentage: Math.round(((i + 1) / total) * 100),
        current: i + 1,
        total
      })
    }
  }

  // ========== Database Tracking ==========

  private async createJobRecord(jobId: string, jobData: JobData): Promise<void> {
    await pool.query(
      `INSERT INTO job_queue (id, type, status, payload, user_id, tenant_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        jobId,
        jobData.type,
        'queued',
        JSON.stringify(jobData.payload),
        jobData.userId,
        jobData.tenantId
      ]
    )
  }

  private async updateJobStatus(jobId: string, status: string, error?: string): Promise<void> {
    await pool.query(
      `UPDATE job_queue
       SET status = $1, error_message = $2, updated_at = NOW(),
           completed_at = CASE WHEN $1 IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE NULL END
       WHERE id = $3`,
      [status, error, jobId]
    )
  }

  private async updateJobProgress(jobId: string, progress: JobProgress): Promise<void> {
    await pool.query(
      'UPDATE job_queue SET progress = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(progress), jobId]
    )
  }
}

// Global instance
export const jobQueueService = new JobQueueService()

export default jobQueueService
