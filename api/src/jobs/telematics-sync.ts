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
import SmartcarService from '../services/smartcar.service'

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
let smartcarService: SmartcarService | null = null

/**
 * Initialize Samsara service
 */
function initializeSamsaraService(): boolean {
  if (samsaraService) {
return true
}

  if (!process.env.SAMSARA_API_TOKEN) {
    logger.warn('SAMSARA_API_TOKEN not configured, Samsara sync disabled')
    return false
  }

  try {
    samsaraService = new SamsaraService(pool)
    logger.info('✅ Samsara service initialized for sync job')
    return true
  } catch (error: unknown) {
    logger.error('Failed to initialize Samsara service', {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
    return false
  }
}

/**
 * Initialize Smartcar service
 */
function initializeSmartcarService(): boolean {
  if (smartcarService) {
    return true
  }

  if (!process.env.SMARTCAR_CLIENT_ID || !process.env.SMARTCAR_CLIENT_SECRET || !process.env.SMARTCAR_REDIRECT_URI) {
    logger.warn('Smartcar not fully configured, Smartcar sync disabled')
    return false
  }

  try {
    smartcarService = new SmartcarService(pool)
    logger.info('✅ Smartcar service initialized for sync job')
    return true
  } catch (error: unknown) {
    logger.error('Failed to initialize Smartcar service', {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
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
    let vehiclesSynced = 0
    let telemetrySynced = 0
    let eventsSynced = 0
    let errors = 0

    // Initialize Samsara service if not already initialized
    initializeSamsaraService()

    // Check if we should sync vehicles (every 24 hours)
    const shouldSyncVehicles = !lastVehicleSync ||
      Date.now() - lastVehicleSync.getTime() > SYNC_VEHICLES_INTERVAL * 60 * 60 * 1000

    // Sync vehicles from Samsara if available
    if (shouldSyncVehicles && samsaraService) {
      try {
        logger.info(`Syncing vehicles from Samsara...`)
        vehiclesSynced = await samsaraService.syncVehicles()
        lastVehicleSync = new Date()
        logger.info(`✅ Synced ${vehiclesSynced} vehicles`)
      } catch (error: unknown) {
        logger.error(`Error syncing vehicles`, {
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
          stack: error instanceof Error ? error.stack : undefined
        })
        errors++
      }
    }

    // Sync telemetry (location, stats) from Samsara if available
    if (samsaraService) {
      try {
        logger.info(`Syncing telemetry from Samsara...`)
        telemetrySynced = await samsaraService.syncTelemetry()
        logger.info(`✅ Synced telemetry for ${telemetrySynced} vehicles`)
      } catch (error: unknown) {
        logger.error(`Error syncing telemetry`, {
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
          stack: error instanceof Error ? error.stack : undefined
        })
        errors++
      }
    }

    // Sync safety events (last hour) from Samsara if available
    if (samsaraService) {
      try {
        logger.info(`Syncing safety events from Samsara...`)
        eventsSynced = await samsaraService.syncSafetyEvents()
        logger.info(`✅ Synced ${eventsSynced} safety events`)
      } catch (error: unknown) {
        logger.error(`Error syncing safety events`, {
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
          stack: error instanceof Error ? error.stack : undefined
        })
        errors++
      }
    }

    // Sync Smartcar data for all connected vehicles
    if (initializeSmartcarService() && smartcarService) {
      try {
        logger.info(`Syncing telemetry from Smartcar...`)

        // Get all vehicles with active Smartcar connections
        const smartcarConnectionsResult = await pool.query(
          `SELECT DISTINCT vtc.vehicle_id
           FROM vehicle_telematics_connections vtc
           JOIN telematics_providers tp ON vtc.provider_id = tp.id
           WHERE tp.name = 'smartcar' AND vtc.sync_status != 'disconnected'`
        )

        let smartcarSynced = 0
        for (const row of smartcarConnectionsResult.rows) {
          try {
            await smartcarService.syncVehicleData(row.vehicle_id)
            smartcarSynced++
          } catch (error: unknown) {
            logger.error(`Error syncing Smartcar data for vehicle ${row.vehicle_id}`, {
              error: error instanceof Error ? error.message : 'An unexpected error occurred'
            })
            errors++
          }
        }

        logger.info(`✅ Synced telemetry for ${smartcarSynced} Smartcar vehicles`)
      } catch (error: unknown) {
        logger.error(`Error syncing Smartcar telemetry`, {
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
          stack: error instanceof Error ? error.stack : undefined
        })
        errors++
      }
    }

    const duration = Date.now() - startTime
    logger.info(`=== Telematics Sync Completed ===`, {
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

  } catch (error: unknown) {
    logger.error(`Fatal error in telematics sync`, {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      stack: error instanceof Error ? error.stack : undefined
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
       WHERE role = 'admin' AND is_active = true`
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
  } catch (error: unknown) {
    logger.error('Error sending error notification', {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
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
  } catch (error: unknown) {
    logger.error(`Error logging sync metrics`, {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
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

  logger.info(`Initializing telematics sync job`, {
    schedule: CRON_SCHEDULE,
    vehicleSyncInterval: `${SYNC_VEHICLES_INTERVAL} hours`,
    timezone: process.env.TZ || 'UTC'
  })

  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    logger.error(`Invalid cron schedule expression`, { schedule: CRON_SCHEDULE })
    throw new Error(`Invalid cron schedule: ${CRON_SCHEDULE}`)
  }

  // Initialize telematics providers
  initializeSamsaraService()
  initializeSmartcarService()

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

  void task.start()

  logger.info('Telematics sync job started successfully', {
    schedule: CRON_SCHEDULE,
    nextRun: '~5 minutes'
  })

  // Run initial sync after 30 seconds
  setTimeout(() => {
    logger.info('Running initial telematics sync...')
    void runTelematicsSync()
  }, 30000)

  // --- Realtime position simulation (test mode only) ---
  // Updates vehicle lat/lng every 10 seconds to simulate driving around Tallahassee
  if (process.env.SMARTCAR_MODE === 'test') {
    const POSITION_UPDATE_INTERVAL_MS = 1_000 // 1 second
    const ROUTES: [number, number][][] = [
      // Route 1 (Camry): Downtown → FSU → Airport loop
      [
        [30.4383, -84.2807], [30.4450, -84.2920], [30.4427, -84.2985],
        [30.4350, -84.3050], [30.4250, -84.3150], [30.4100, -84.3300],
        [30.3970, -84.3450], [30.3926, -84.3503], [30.4000, -84.3400],
        [30.4100, -84.3200], [30.4200, -84.3050], [30.4300, -84.2920],
      ],
      // Route 2 (RAV 4): Thomasville Rd → Capital Circle loop
      [
        [30.4550, -84.2750], [30.4620, -84.2680], [30.4720, -84.2600],
        [30.4830, -84.2550], [30.4900, -84.2650], [30.4880, -84.2800],
        [30.4800, -84.2950], [30.4700, -84.3020], [30.4600, -84.2950],
        [30.4530, -84.2850],
      ],
    ]
    const CYCLE_DURATION_MS = 300_000 // 5 minutes per full loop

    function getSimulatedPosition(routeIdx: number): { lat: number; lng: number } {
      const route = ROUTES[routeIdx % ROUTES.length]
      const now = Date.now()
      const progress = (now % CYCLE_DURATION_MS) / CYCLE_DURATION_MS
      const totalSegments = route.length
      const segFloat = progress * totalSegments
      const segIdx = Math.floor(segFloat) % totalSegments
      const segProgress = segFloat - Math.floor(segFloat)
      const start = route[segIdx]
      const end = route[(segIdx + 1) % totalSegments]
      return {
        lat: start[0] + (end[0] - start[0]) * segProgress,
        lng: start[1] + (end[1] - start[1]) * segProgress,
      }
    }

    const positionTimer = setInterval(async () => {
      try {
        const { rows } = await pool.query(
          `SELECT vtc.vehicle_id
           FROM vehicle_telematics_connections vtc
           JOIN telematics_providers tp ON vtc.provider_id = tp.id
           WHERE tp.name = 'smartcar' AND vtc.sync_status != 'disconnected'
           ORDER BY vtc.vehicle_id`
        )
        for (let i = 0; i < rows.length; i++) {
          const pos = getSimulatedPosition(i)
          await pool.query(
            `UPDATE vehicles SET latitude = $2, longitude = $3, last_gps_update = NOW(), updated_at = NOW() WHERE id = $1`,
            [rows[i].vehicle_id, pos.lat.toFixed(6), pos.lng.toFixed(6)]
          )
        }
      } catch (err) {
        logger.error('Position simulation error', { error: err instanceof Error ? err.message : err })
      }
    }, POSITION_UPDATE_INTERVAL_MS)

    logger.info('Realtime position simulation started (test mode)', { intervalMs: POSITION_UPDATE_INTERVAL_MS })

    // Clean up on shutdown
    process.on('SIGTERM', () => clearInterval(positionTimer))
    process.on('SIGINT', () => clearInterval(positionTimer))
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping telematics sync')
    void task.stop()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping telematics sync')
    void task.stop()
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
