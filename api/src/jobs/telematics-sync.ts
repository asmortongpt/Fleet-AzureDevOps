/**
 * Telematics Sync Job - Cron Job
 *
 * Automatically syncs telemetry data from Samsara and other providers
 * Runs on a configurable schedule (default: every 5 minutes)
 */

import cron from 'node-cron'
import winston from 'winston'
import pool from '../config/database'
import SamsaraService from '../services/samsara.service'

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Configuration from environment
const CRON_SCHEDULE = process.env.TELEMATICS_CRON_SCHEDULE || '*/5 * * * *' // Every 5 minutes
const ENABLE_SYNC = process.env.ENABLE_TELEMATICS_SYNC !== 'false' // Enabled by default
const SYNC_VEHICLES_INTERVAL = parseInt(process.env.SYNC_VEHICLES_INTERVAL_HOURS || '24') // Sync vehicles every 24 hours

let lastVehicleSync: Date | null = null
let samsaraService: SamsaraService | null = null

/**
 * Initialize Samsara service
 */
function initializeSamsaraService(): boolean {
  if (samsaraService) return true

  if (!process.env.SAMSARA_API_TOKEN) {
    logger.warn('SAMSARA_API_TOKEN not configured, Samsara sync disabled')
    return false
  }

  try {
    samsaraService = new SamsaraService(pool)
    logger.info('✅ Samsara service initialized for sync job')
    return true
  } catch (error: any) {
    logger.error('Failed to initialize Samsara service', {
      error: error.message
    })
    return false
  }
}

/**
 * Main sync function
 */
async function runTelematicsSync(): Promise<void> {
  const startTime = Date.now()
  logger.info('=== Telematics Sync Started ===')

  try {
    // Initialize Samsara service if not already initialized
    if (!initializeSamsaraService()) {
      logger.warn('No telematics providers configured, skipping sync')
      return
    }

    let vehiclesSynced = 0
    let telemetrySynced = 0
    let eventsSynced = 0
    let errors = 0

    // Check if we should sync vehicles (every 24 hours)
    const shouldSyncVehicles = !lastVehicleSync ||
      Date.now() - lastVehicleSync.getTime() > SYNC_VEHICLES_INTERVAL * 60 * 60 * 1000

    // Sync vehicles if needed
    if (shouldSyncVehicles && samsaraService) {
      try {
        logger.info('Syncing vehicles from Samsara...')
        vehiclesSynced = await samsaraService.syncVehicles()
        lastVehicleSync = new Date()
        logger.info(`✅ Synced ${vehiclesSynced} vehicles`)
      } catch (error: any) {
        logger.error('Error syncing vehicles', {
          error: error.message,
          stack: error.stack
        })
        errors++
      }
    }

    // Sync telemetry (location, stats) - runs every time
    if (samsaraService) {
      try {
        logger.info('Syncing telemetry from Samsara...')
        telemetrySynced = await samsaraService.syncTelemetry()
        logger.info(`✅ Synced telemetry for ${telemetrySynced} vehicles`)
      } catch (error: any) {
        logger.error('Error syncing telemetry', {
          error: error.message,
          stack: error.stack
        })
        errors++
      }
    }

    // Sync safety events (last hour) - runs every time
    if (samsaraService) {
      try {
        logger.info('Syncing safety events from Samsara...')
        eventsSynced = await samsaraService.syncSafetyEvents()
        logger.info(`✅ Synced ${eventsSynced} safety events`)
      } catch (error: any) {
        logger.error('Error syncing safety events', {
          error: error.message,
          stack: error.stack
        })
        errors++
      }
    }

    const duration = Date.now() - startTime
    logger.info('=== Telematics Sync Completed ===', {
      duration: `${duration}ms`,
      vehiclesSynced,
      telemetrySynced,
      eventsSynced,
      errors
    })

    // Log metrics to database
    await logSyncMetrics({
      vehicles_synced: vehiclesSynced,
      telemetry_records_synced: telemetrySynced,
      events_synced: eventsSynced,
      errors,
      duration_ms: duration
    })

    // Alert on errors
    if (errors > 0) {
      await sendErrorNotification(errors)
    }

  } catch (error: any) {
    logger.error('Fatal error in telematics sync', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * Send error notification to administrators
 */
async function sendErrorNotification(errorCount: number): Promise<void> {
  try {
    // Get admin users across all tenants
    const adminsResult = await pool.query(
      `SELECT id, email, tenant_id FROM users
       WHERE role = 'admin' AND is_active = true'
    )

    const message = `⚠️ Telematics Sync Errors: ${errorCount} error(s) occurred during the latest sync. Check logs for details.`

    // Create notifications for each admin
    for (const admin of adminsResult.rows) {
      await pool.query(
        `INSERT INTO telematics_webhook_events (
          provider_id, event_type, payload, processed
        ) VALUES (
          (SELECT id FROM telematics_providers WHERE name = 'system'),
          'sync_error',
          $1,
          true
        )`,
        [JSON.stringify({ message, errors: errorCount, timestamp: new Date() })]
      )
    }

    logger.info('Error notifications created', {
      adminsNotified: adminsResult.rows.length
    })
  } catch (error: any) {
    logger.error('Error sending error notification', {
      error: error.message
    })
  }
}

/**
 * Log sync metrics to database
 */
async function logSyncMetrics(metrics: {
  vehicles_synced: number
  telemetry_records_synced: number
  events_synced: number
  errors: number
  duration_ms: number
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, tenant_id, action, resource_type, resource_id,
        changes, ip_address, user_agent, status, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        null, // System action
        null, // System-wide
        'TELEMATICS_SYNC',
        'vehicle_telemetry',
        null,
        JSON.stringify(metrics),
        'system',
        'telematics-sync-cron',
        metrics.errors > 0 ? 'warning' : 'success',
        `Synced ${metrics.telemetry_records_synced} telemetry records and ${metrics.events_synced} events`
      ]
    )
  } catch (error: any) {
    logger.error('Error logging sync metrics', {
      error: error.message
    })
  }
}

/**
 * Initialize and start the cron job
 */
export function startTelematicsSync(): void {
  if (!ENABLE_SYNC) {
    logger.warn('Telematics sync is disabled by configuration')
    return
  }

  logger.info('Initializing telematics sync job', {
    schedule: CRON_SCHEDULE,
    vehicleSyncInterval: `${SYNC_VEHICLES_INTERVAL} hours`,
    timezone: process.env.TZ || 'UTC'
  })

  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    logger.error('Invalid cron schedule expression', { schedule: CRON_SCHEDULE })
    throw new Error(`Invalid cron schedule: ${CRON_SCHEDULE}`)
  }

  // Initialize Samsara service
  initializeSamsaraService()

  // Schedule the job
  const task = cron.schedule(
    CRON_SCHEDULE,
    async () => {
      await runTelematicsSync()
    },
    {
      timezone: process.env.TZ || 'UTC'
    }
  )

  task.start()

  logger.info('Telematics sync job started successfully', {
    schedule: CRON_SCHEDULE,
    nextRun: '~5 minutes'
  })

  // Run initial sync after 30 seconds
  setTimeout(async () => {
    logger.info('Running initial telematics sync...')
    await runTelematicsSync()
  }, 30000)

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping telematics sync')
    task.stop()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping telematics sync')
    task.stop()
  })
}

/**
 * Manual trigger for testing or one-time runs
 */
export async function triggerTelematicsSyncNow(): Promise<void> {
  logger.info('Manual trigger of telematics sync requested')
  await runTelematicsSync()
}

/**
 * Get sync job status
 */
export function getSyncStatus(): {
  enabled: boolean
  schedule: string
  lastVehicleSync: Date | null
  samsaraConfigured: boolean
} {
  return {
    enabled: ENABLE_SYNC,
    schedule: CRON_SCHEDULE,
    lastVehicleSync,
    samsaraConfigured: !!process.env.SAMSARA_API_TOKEN
  }
}

// Export for use in server.ts
export default {
  start: startTelematicsSync,
  triggerNow: triggerTelematicsSyncNow,
  getStatus: getSyncStatus
}
