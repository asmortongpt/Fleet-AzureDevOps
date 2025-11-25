/**
 * Teams Sync Job - Scheduled Synchronization
 *
 * Syncs Teams messages every 30 seconds (configurable)
 * Uses delta queries for efficiency
 * Handles pagination and batch operations
 * Skips sync if webhooks are active and working
 *
 * Features:
 * - Configurable sync interval via environment variable
 * - Delta query support for incremental sync
 * - Error handling and retry logic
 * - Performance metrics logging
 * - Webhook health checking (fallback mode)
 */

import cron from 'node-cron'
import winston from 'winston'
import pool from '../config/database'
import syncService from '../services/sync.service'

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/teams-sync.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Configuration from environment
const SYNC_INTERVAL_SECONDS = parseInt(process.env.TEAMS_SYNC_INTERVAL_SECONDS || '30', 10)
const ENABLE_TEAMS_SYNC = process.env.ENABLE_TEAMS_SYNC !== 'false' // Enabled by default
const USE_WEBHOOK_FALLBACK = process.env.USE_WEBHOOK_FALLBACK !== 'false' // Enabled by default
const WEBHOOK_HEALTH_CHECK_MINUTES = parseInt(process.env.WEBHOOK_HEALTH_CHECK_MINUTES || '5', 10)

// Convert seconds to cron expression
// For 30 seconds: */30 * * * * *
// For 60 seconds: */60 * * * * * or 0 * * * * *
function secondsToCronExpression(seconds: number): string {
  if (seconds < 60) {
    return `*/${seconds} * * * * *`
  } else if (seconds === 60) {
    return '0 * * * * *'
  } else {
    const minutes = Math.floor(seconds / 60)
    return `0 */${minutes} * * * *`
  }
}

const CRON_SCHEDULE = secondsToCronExpression(SYNC_INTERVAL_SECONDS)

/**
 * Main Teams sync function
 */
async function runTeamsSync(): Promise<void> {
  const startTime = Date.now()
  const jobId = `teams-sync-${Date.now()}`

  logger.info('=== Teams Sync Started ===', { jobId })

  try {
    // Check if webhooks are healthy
    const webhooksHealthy = await syncService.areWebhooksHealthy()

    if (webhooksHealthy && USE_WEBHOOK_FALLBACK) {
      logger.info('Webhooks are healthy, skipping polling sync', { jobId })
      await logSyncJobMetrics(jobId, 'skipped', 0, 0, 0, Date.now() - startTime, {
        reason: 'webhooks_healthy'
      })
      return
    }

    if (!webhooksHealthy && USE_WEBHOOK_FALLBACK) {
      logger.warn('Webhooks are not healthy, falling back to polling', { jobId })
    }

    // Check if any users are online (optional optimization)
    const hasActiveUsers = await checkActiveUsers()

    if (!hasActiveUsers && process.env.SKIP_SYNC_NO_USERS === 'true') {
      logger.info('No active users, skipping sync', { jobId })
      await logSyncJobMetrics(jobId, 'skipped', 0, 0, 0, Date.now() - startTime, {
        reason: 'no_active_users'
      })
      return
    }

    // Record job start
    const jobRecordResult = await pool.query(
      `INSERT INTO sync_jobs (job_type, status, started_at)
       VALUES ('teams_sync', 'running', NOW())
       RETURNING id',
      []
    )
    const jobRecordId = jobRecordResult.rows[0].id

    // Sync all Teams channels
    const { totalSynced, totalErrors } = await syncService.syncAllTeamsChannels()

    // Update job record
    const duration = Date.now() - startTime
    await pool.query(
      `UPDATE sync_jobs
       SET status = $1, completed_at = NOW(), duration_ms = $2,
           items_synced = $3, errors_count = $4
       WHERE id = $5`,
      [totalErrors > 0 ? 'completed_with_errors' : 'completed', duration, totalSynced, totalErrors, jobRecordId]
    )

    logger.info('=== Teams Sync Completed ===', {
      jobId,
      duration: `${duration}ms`,
      totalSynced,
      totalErrors
    })

    await logSyncJobMetrics(jobId, 'completed', totalSynced, totalErrors, 0, duration)
  } catch (error: any) {
    const duration = Date.now() - startTime

    logger.error('Fatal error in Teams sync', {
      jobId,
      error: error.message,
      stack: error.stack
    })

    await logSyncJobMetrics(jobId, 'failed', 0, 1, 0, duration, {
      error: error.message
    })
  }
}

/**
 * Check if there are any active users (WebSocket connections)
 */
async function checkActiveUsers(): Promise<boolean> {
  try {
    // Check for recent user activity (last 5 minutes)
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_login_at > NOW() - INTERVAL '5 minutes'
    `)

    const activeUsers = parseInt(result.rows[0].count) || 0
    return activeUsers > 0
  } catch (error: any) {
    logger.error('Error checking active users', {
      error: error.message
    })
    return true // Assume users are active if check fails
  }
}

/**
 * Log sync job metrics to database
 */
async function logSyncJobMetrics(
  jobId: string,
  status: string,
  itemsSynced: number,
  errorsCount: number,
  resourcesProcessed: number,
  duration: number,
  metadata?: any
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id,
        changes, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        null, // System action
        'TEAMS_SYNC_RUN',
        'teams_messages',
        jobId,
        JSON.stringify({
          status,
          items_synced: itemsSynced,
          errors_count: errorsCount,
          resources_processed: resourcesProcessed,
          duration_ms: duration,
          ...metadata
        }),
        'system',
        'teams-sync-cron'
      ]
    )
  } catch (error: any) {
    logger.error('Error logging sync job metrics', {
      error: error.message
    })
  }
}

/**
 * Sync on startup to catch missed messages
 */
async function syncOnStartup(): Promise<void> {
  logger.info('Running startup sync to catch any missed messages')

  try {
    await runTeamsSync()
  } catch (error: any) {
    logger.error('Error during startup sync', {
      error: error.message
    })
  }
}

/**
 * Initialize and start the cron job
 */
export function startTeamsSync(): void {
  if (!ENABLE_TEAMS_SYNC) {
    logger.warn('Teams sync is disabled by configuration')
    return
  }

  logger.info('Initializing Teams sync job', {
    schedule: CRON_SCHEDULE,
    intervalSeconds: SYNC_INTERVAL_SECONDS,
    timezone: process.env.TZ || 'UTC',
    useWebhookFallback: USE_WEBHOOK_FALLBACK
  })

  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    logger.error('Invalid cron schedule expression', { schedule: CRON_SCHEDULE })
    throw new Error(`Invalid cron schedule: ${CRON_SCHEDULE}`)
  }

  // Run initial sync on startup
  syncOnStartup().catch(error => {
    logger.error('Startup sync failed', { error: error.message })
  })

  // Schedule the job
  const task = cron.schedule(
    CRON_SCHEDULE,
    async () => {
      await runTeamsSync()
    },
    {
      timezone: process.env.TZ || 'UTC'
    }
  )

  task.start()

  logger.info('Teams sync job started successfully', {
    schedule: CRON_SCHEDULE,
    intervalSeconds: SYNC_INTERVAL_SECONDS
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping Teams sync')
    task.stop()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping Teams sync')
    task.stop()
  })
}

/**
 * Manual trigger for testing or one-time runs
 */
export async function triggerTeamsSyncNow(): Promise<void> {
  logger.info('Manual trigger of Teams sync requested')
  await runTeamsSync()
}

/**
 * Get Teams sync status
 */
export function getTeamsSyncStatus(): {
  enabled: boolean
  schedule: string
  intervalSeconds: number
  useWebhookFallback: boolean
} {
  return {
    enabled: ENABLE_TEAMS_SYNC,
    schedule: CRON_SCHEDULE,
    intervalSeconds: SYNC_INTERVAL_SECONDS,
    useWebhookFallback: USE_WEBHOOK_FALLBACK
  }
}

// Export for use in server.ts
export default {
  start: startTeamsSync,
  triggerNow: triggerTeamsSyncNow,
  getStatus: getTeamsSyncStatus
}
