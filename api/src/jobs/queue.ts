/**
 * Bull Queue Setup with Redis
 *
 * Implements centralized queue management for async job processing
 * Supports: Email sending, Push notifications, Report generation
 */

import Bull, { Queue, Job, JobOptions } from 'bull'

import redisClient from '../config/redis'
import logger from '../utils/logger'

/**
 * Queue configuration with retry logic and error handling
 */
const defaultJobOptions: JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
}

/**
 * Create a Bull queue with standardized configuration
 */
function createQueue(name: string): Queue {
  const queue = new Bull(name, {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    defaultJobOptions,
    settings: {
      lockDuration: 30000, // 30 seconds
      lockRenewTime: 15000, // 15 seconds
      stalledInterval: 30000, // Check for stalled jobs every 30s
      maxStalledCount: 3, // Retry stalled jobs 3 times
    },
  })

  // Queue event handlers
  queue.on('error', (error) => {
    logger.error(`Queue ${name} error:`, error)
  })

  queue.on('waiting', (jobId) => {
    logger.debug(`Job ${jobId} waiting in queue ${name}`)
  })

  queue.on('active', (job) => {
    logger.info(`Job ${job.id} started processing in queue ${name}`)
  })

  queue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed in queue ${name}`, { result })
  })

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} failed in queue ${name}:`, error)
  })

  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled in queue ${name}`)
  })

  return queue
}

/**
 * Email Queue - Vehicle alerts, maintenance reminders
 */
export const emailQueue = createQueue('email')

/**
 * Notification Queue - Push notifications to mobile devices
 */
export const notificationQueue = createQueue('notification')

/**
 * Report Queue - Report generation (maintenance, cost analysis, etc.)
 */
export const reportQueue = createQueue('report')

/**
 * Add job to email queue
 */
export async function addEmailJob(
  data: {
    to: string | string[]
    subject: string
    template?: string
    body?: string
    html?: string
    context?: Record<string, any>
    attachments?: Array<{
      filename: string
      content?: Buffer
      path?: string
    }>
  },
  options?: JobOptions
): Promise<Job> {
  return emailQueue.add(data, {
    ...defaultJobOptions,
    ...options,
    priority: options?.priority || 2,
  })
}

/**
 * Add job to notification queue
 */
export async function addNotificationJob(
  data: {
    userId: string | string[]
    title: string
    body: string
    data?: Record<string, any>
    badge?: number
    sound?: string
    channel?: string
    priority?: 'high' | 'normal' | 'low'
  },
  options?: JobOptions
): Promise<Job> {
  return notificationQueue.add(data, {
    ...defaultJobOptions,
    ...options,
    priority: data.priority === 'high' ? 1 : data.priority === 'low' ? 3 : 2,
  })
}

/**
 * Add job to report queue
 */
export async function addReportJob(
  data: {
    reportType: 'maintenance' | 'cost-analysis' | 'fuel-usage' | 'vehicle-utilization' | 'driver-performance' | 'custom'
    userId: string
    parameters?: Record<string, any>
    format?: 'pdf' | 'excel' | 'csv'
    deliveryMethod?: 'download' | 'email'
    recipients?: string[]
  },
  options?: JobOptions
): Promise<Job> {
  return reportQueue.add(data, {
    ...defaultJobOptions,
    ...options,
    priority: options?.priority || 3,
    timeout: 300000, // 5 minutes for report generation
  })
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: 'email' | 'notification' | 'report') {
  const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue

  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getPausedCount(),
  ])

  return {
    name: queueName,
    counts: {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed,
    },
  }
}

/**
 * Get all queue statistics
 */
export async function getAllQueueStats() {
  const [emailStats, notificationStats, reportStats] = await Promise.all([
    getQueueStats('email'),
    getQueueStats('notification'),
    getQueueStats('report'),
  ])

  return {
    queues: [emailStats, notificationStats, reportStats],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get failed jobs from a queue
 */
export async function getFailedJobs(queueName: 'email' | 'notification' | 'report', start = 0, end = 10) {
  const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue
  const jobs = await queue.getFailed(start, end)

  return jobs.map((job) => ({
    id: job.id,
    data: job.data,
    failedReason: job.failedReason,
    stacktrace: job.stacktrace,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  }))
}

/**
 * Retry a failed job
 */
export async function retryFailedJob(queueName: 'email' | 'notification' | 'report', jobId: string) {
  const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue
  const job = await queue.getJob(jobId)

  if (!job) {
    throw new Error(`Job ${jobId} not found in queue ${queueName}`)
  }

  await job.retry()
  logger.info(`Job ${jobId} in queue ${queueName} scheduled for retry`)

  return { success: true, jobId, queue: queueName }
}

/**
 * Remove a job from queue
 */
export async function removeJob(queueName: 'email' | 'notification' | 'report', jobId: string) {
  const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue
  const job = await queue.getJob(jobId)

  if (!job) {
    throw new Error(`Job ${jobId} not found in queue ${queueName}`)
  }

  await job.remove()
  logger.info(`Job ${jobId} removed from queue ${queueName}`)

  return { success: true, jobId, queue: queueName }
}

/**
 * Clean completed jobs older than specified time
 */
export async function cleanQueue(
  queueName: 'email' | 'notification' | 'report',
  grace: number = 3600000 // 1 hour default
) {
  const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue

  const [completedCleaned, failedCleaned] = await Promise.all([
    queue.clean(grace, 'completed'),
    queue.clean(grace * 24, 'failed'), // Keep failed jobs longer for debugging
  ])

  logger.info(`Cleaned queue ${queueName}: ${completedCleaned.length} completed, ${failedCleaned.length} failed jobs`)

  return {
    queue: queueName,
    completedCleaned: completedCleaned.length,
    failedCleaned: failedCleaned.length,
  }
}

/**
 * Pause queue processing
 */
export async function pauseQueue(queueName: 'email' | 'notification' | 'report') {
  const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue
  await queue.pause()
  logger.info(`Queue ${queueName} paused`)
  return { success: true, queue: queueName, status: 'paused' }
}

/**
 * Resume queue processing
 */
export async function resumeQueue(queueName: 'email' | 'notification' | 'report') {
  const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue
  await queue.resume()
  logger.info(`Queue ${queueName} resumed`)
  return { success: true, queue: queueName, status: 'active' }
}

/**
 * Close all queues gracefully
 */
export async function closeAllQueues() {
  logger.info('Closing all queues...')

  await Promise.all([
    emailQueue.close(),
    notificationQueue.close(),
    reportQueue.close(),
  ])

  logger.info('All queues closed')
}

/**
 * Health check for queue system
 */
export async function getQueueHealth() {
  try {
    const stats = await getAllQueueStats()
    const redisHealthy = await redisClient.ping() === 'PONG'

    return {
      healthy: redisHealthy,
      redis: redisHealthy ? 'connected' : 'disconnected',
      queues: stats.queues,
      timestamp: stats.timestamp,
    }
  } catch (error) {
    logger.error('Queue health check failed:', error)
    return {
      healthy: false,
      redis: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
