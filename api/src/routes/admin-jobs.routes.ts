/**
 * Admin Jobs Dashboard Routes
 *
 * Provides administrative interface for Bull queue management
 * Endpoints for monitoring, retrying, and managing async jobs
 */

import { Router, Request, Response, NextFunction } from 'express'

import {
  getAllQueueStats,
  getQueueStats,
  getFailedJobs,
  retryFailedJob,
  removeJob,
  cleanQueue,
  pauseQueue,
  resumeQueue,
  getQueueHealth,
  emailQueue,
  notificationQueue,
  reportQueue,
} from '../jobs/queue'
import { csrfProtection } from '../middleware/csrf'
import logger from '../config/logger'


const router = Router()

/**
 * GET /api/admin/jobs
 * Get overview of all job queues
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getAllQueueStats()
    res.json(stats)
  } catch (error) {
    logger.error('Failed to get queue stats:', error)
    next(error)
  }
})

/**
 * GET /api/admin/jobs/health
 * Health check for queue system
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await getQueueHealth()
    res.json(health)
  } catch (error) {
    logger.error('Failed to get queue health:', error)
    next(error)
  }
})

/**
 * GET /api/admin/jobs/:queueName
 * Get statistics for specific queue
 */
router.get('/:queueName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const stats = await getQueueStats(queueName as 'email' | 'notification' | 'report')
    res.json(stats)
  } catch (error) {
    logger.error('Failed to get queue stats:', error)
    next(error)
  }
})

/**
 * GET /api/admin/jobs/:queueName/jobs
 * Get jobs from specific queue with pagination
 */
router.get('/:queueName/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params
    const { status = 'failed', start = '0', end = '10' } = req.query

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue

    let jobs: any[] = []

    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(parseInt(start as string), parseInt(end as string))
        break
      case 'active':
        jobs = await queue.getActive(parseInt(start as string), parseInt(end as string))
        break
      case 'completed':
        jobs = await queue.getCompleted(parseInt(start as string), parseInt(end as string))
        break
      case 'failed':
        jobs = await queue.getFailed(parseInt(start as string), parseInt(end as string))
        break
      case 'delayed':
        jobs = await queue.getDelayed(parseInt(start as string), parseInt(end as string))
        break
      default:
        return res.status(400).json({ error: 'Invalid status' })
    }

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      timestamp: job.timestamp,
    }))

    res.json({
      queue: queueName,
      status,
      jobs: formattedJobs,
      count: formattedJobs.length,
    })
  } catch (error) {
    logger.error('Failed to get jobs:', error)
    next(error)
  }
})

/**
 * GET /api/admin/jobs/:queueName/failed
 * Get failed jobs from specific queue
 */
router.get('/:queueName/failed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params
    const { start = '0', end = '10' } = req.query

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const failedJobs = await getFailedJobs(
      queueName as 'email' | 'notification' | 'report',
      parseInt(start as string),
      parseInt(end as string)
    )

    res.json({
      queue: queueName,
      jobs: failedJobs,
      count: failedJobs.length,
    })
  } catch (error) {
    logger.error('Failed to get failed jobs:', error)
    next(error)
  }
})

/**
 * POST /api/admin/jobs/:queueName/retry/:jobId
 * Retry a failed job
 */
router.post('/:queueName/retry/:jobId', csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName, jobId } = req.params

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const result = await retryFailedJob(queueName as 'email' | 'notification' | 'report', jobId)

    logger.info(`Job ${jobId} in queue ${queueName} retried by admin`)

    res.json(result)
  } catch (error) {
    logger.error('Failed to retry job:', error)
    next(error)
  }
})

/**
 * DELETE /api/admin/jobs/:queueName/:jobId
 * Remove a job from queue
 */
router.delete('/:queueName/:jobId', csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName, jobId } = req.params

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const result = await removeJob(queueName as 'email' | 'notification' | 'report', jobId)

    logger.info(`Job ${jobId} in queue ${queueName} removed by admin`)

    res.json(result)
  } catch (error) {
    logger.error('Failed to remove job:', error)
    next(error)
  }
})

/**
 * POST /api/admin/jobs/:queueName/clean
 * Clean completed/failed jobs from queue
 */
router.post('/:queueName/clean', csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params
    const { grace = 3600000 } = req.body // 1 hour default

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const result = await cleanQueue(queueName as 'email' | 'notification' | 'report', grace)

    logger.info(`Queue ${queueName} cleaned by admin`)

    res.json(result)
  } catch (error) {
    logger.error('Failed to clean queue:', error)
    next(error)
  }
})

/**
 * POST /api/admin/jobs/:queueName/pause
 * Pause queue processing
 */
router.post('/:queueName/pause', csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const result = await pauseQueue(queueName as 'email' | 'notification' | 'report')

    logger.info(`Queue ${queueName} paused by admin`)

    res.json(result)
  } catch (error) {
    logger.error('Failed to pause queue:', error)
    next(error)
  }
})

/**
 * POST /api/admin/jobs/:queueName/resume
 * Resume queue processing
 */
router.post('/:queueName/resume', csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName } = req.params

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const result = await resumeQueue(queueName as 'email' | 'notification' | 'report')

    logger.info(`Queue ${queueName} resumed by admin`)

    res.json(result)
  } catch (error) {
    logger.error('Failed to resume queue:', error)
    next(error)
  }
})

/**
 * GET /api/admin/jobs/:queueName/job/:jobId
 * Get specific job details
 */
router.get('/:queueName/job/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName, jobId } = req.params

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue

    const job = await queue.getJob(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const jobDetails = {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress(),
      delay: job.delay,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    }

    res.json(jobDetails)
  } catch (error) {
    logger.error('Failed to get job details:', error)
    next(error)
  }
})

/**
 * POST /api/admin/jobs/:queueName/job/:jobId/promote
 * Promote a delayed job to execute immediately
 */
router.post('/:queueName/job/:jobId/promote', csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueName, jobId } = req.params

    if (!['email', 'notification', 'report'].includes(queueName)) {
      return res.status(400).json({ error: 'Invalid queue name' })
    }

    const queue = queueName === 'email' ? emailQueue : queueName === 'notification' ? notificationQueue : reportQueue

    const job = await queue.getJob(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    await job.promote()

    logger.info(`Job ${jobId} in queue ${queueName} promoted by admin`)

    res.json({ success: true, jobId, queue: queueName, message: 'Job promoted' })
  } catch (error) {
    logger.error('Failed to promote job:', error)
    next(error)
  }
})

export default router
