/**
 * Alert Checker - Scheduled Job
 *
 * Proactive alert generation based on configurable rules
 * Runs every 5 minutes to check for conditions requiring alerts
 *
 * Checks include:
 * - Maintenance due within threshold
 * - Overdue tasks
 * - Critical incidents
 * - Fuel anomalies
 * - Geofence violations
 * - Driver certification expiration
 * - Asset expiration
 */

import cron from 'node-cron'
import winston from 'winston'
import pool from '../config/database'
import alertEngine from '../services/alert-engine.service'

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/alert-checker.log',
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
const CRON_SCHEDULE = process.env.ALERT_CHECKER_CRON_SCHEDULE || '*/5 * * * *' // Every 5 minutes
const ENABLE_ALERT_CHECKER = process.env.ENABLE_ALERT_CHECKER !== 'false' // Enabled by default

/**
 * Main alert checker function
 */
async function runAlertChecker(): Promise<void> {
  const startTime = Date.now()
  logger.info('=== Alert Checker Started ===')

  try {
    // Get all active tenants
    const tenantsResult = await pool.query(
      'SELECT id, name FROM tenants WHERE active = true'
    )

    if (tenantsResult.rows.length === 0) {
      logger.warn('No active tenants found')
      return
    }

    logger.info(`Checking alerts for ${tenantsResult.rows.length} active tenants`)

    let totalAlertsGenerated = 0
    let totalErrors = 0

    // Process each tenant
    for (const tenant of tenantsResult.rows) {
      try {
        logger.info(`Processing tenant: ${tenant.name} (${tenant.id})`)

        // Run all alert checks for this tenant
        await alertEngine.runAlertChecks(tenant.id)

        // Count new alerts generated in the last 5 minutes
        const countResult = await pool.query(
          `SELECT COUNT(*) as count FROM alerts
           WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '5 minutes'',
          [tenant.id]
        )

        const alertsGenerated = parseInt(countResult.rows[0].count) || 0
        totalAlertsGenerated += alertsGenerated

        logger.info(`Tenant processing complete: ${tenant.name}`, {
          tenantId: tenant.id,
          alertsGenerated
        })
      } catch (error: any) {
        logger.error(`Error processing tenant ${tenant.name}`, {
          tenantId: tenant.id,
          error: error.message,
          stack: error.stack
        })
        totalErrors++
      }
    }

    const duration = Date.now() - startTime
    logger.info('=== Alert Checker Completed ===', {
      duration: `${duration}ms`,
      totalAlertsGenerated,
      totalErrors,
      tenantsProcessed: tenantsResult.rows.length
    })

    // Log metrics to audit table
    await logAlertCheckerMetrics({
      total_tenants: tenantsResult.rows.length,
      total_alerts_generated: totalAlertsGenerated,
      total_errors: totalErrors,
      duration_ms: duration
    })
  } catch (error: any) {
    logger.error('Fatal error in alert checker', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * Log alert checker metrics to database
 */
async function logAlertCheckerMetrics(metrics: {
  total_tenants: number
  total_alerts_generated: number
  total_errors: number
  duration_ms: number
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id,
        changes, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        null, // System action
        'ALERT_CHECKER_RUN',
        'alerts',
        null,
        JSON.stringify(metrics),
        'system',
        'alert-checker-cron'
      ]
    )
  } catch (error: any) {
    logger.error('Error logging alert checker metrics', {
      error: error.message
    })
  }
}

/**
 * Check for driver certification expiration
 */
async function checkDriverCertificationAlerts(tenantId: string): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT d.id, d.first_name, d.last_name, d.license_expiry
       FROM drivers d
       WHERE d.tenant_id = $1
       AND d.license_expiry IS NOT NULL
       AND d.license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       AND NOT EXISTS (
         SELECT 1 FROM alerts a
         WHERE a.entity_id = d.id::text
         AND a.alert_type = 'driver_certification'
         AND a.created_at > CURRENT_DATE - INTERVAL '7 days'
       )`,
      [tenantId]
    )

    for (const row of result.rows) {
      const daysUntil = Math.ceil(
        (new Date(row.license_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      await alertEngine.createAlert(tenantId, {
        alert_type: 'driver_certification',
        severity: daysUntil <= 7 ? 'critical' : 'warning',
        title: `Driver License Expiring: ${row.first_name} ${row.last_name}`,
        message: `Driver license for ${row.first_name} ${row.last_name} expires in ${daysUntil} day(s)`,
        entity_type: 'driver',
        entity_id: row.id,
        metadata: { license_expiry: row.license_expiry }
      })
    }

    logger.info(`Generated ${result.rows.length} driver certification alerts for tenant ${tenantId}`)
  } catch (error: any) {
    logger.error('Error checking driver certification alerts', {
      tenantId,
      error: error.message
    })
  }
}

/**
 * Initialize and start the cron job
 */
export function startAlertChecker(): void {
  if (!ENABLE_ALERT_CHECKER) {
    logger.warn('Alert checker is disabled by configuration')
    return
  }

  logger.info('Initializing alert checker', {
    schedule: CRON_SCHEDULE,
    timezone: process.env.TZ || 'UTC'
  })

  // Validate cron expression
  if (!cron.validate(CRON_SCHEDULE)) {
    logger.error('Invalid cron schedule expression', { schedule: CRON_SCHEDULE })
    throw new Error(`Invalid cron schedule: ${CRON_SCHEDULE}`)
  }

  // Schedule the job
  const task = cron.schedule(
    CRON_SCHEDULE,
    async () => {
      await runAlertChecker()
    },
    {
      timezone: process.env.TZ || 'UTC'
    }
  )

  task.start()

  logger.info('Alert checker started successfully', {
    schedule: CRON_SCHEDULE
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping alert checker')
    task.stop()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping alert checker')
    task.stop()
  })
}

/**
 * Manual trigger for testing or one-time runs
 */
export async function triggerAlertCheckerNow(): Promise<void> {
  logger.info('Manual trigger of alert checker requested')
  await runAlertChecker()
}

/**
 * Get alert checker status
 */
export function getAlertCheckerStatus(): {
  enabled: boolean
  schedule: string
} {
  return {
    enabled: ENABLE_ALERT_CHECKER,
    schedule: CRON_SCHEDULE
  }
}

// Export for use in server.ts
export default {
  start: startAlertChecker,
  triggerNow: triggerAlertCheckerNow,
  getStatus: getAlertCheckerStatus
}
