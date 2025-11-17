/**
 * Maintenance Scheduler - Cron Job
 *
 * Automatically checks for due maintenance schedules and generates work orders
 * Runs on a configurable schedule (default: every hour)
 */

import cron from 'node-cron'
import winston from 'winston'
import { processRecurringSchedules, getRecurringScheduleStats } from '../services/recurring-maintenance'
import pool from '../config/database'

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
const CRON_SCHEDULE = process.env.MAINTENANCE_CRON_SCHEDULE || '0 * * * *' // Every hour at minute 0
const DAYS_AHEAD = parseInt(process.env.MAINTENANCE_DAYS_AHEAD || '1') // Check 1 day ahead
const ENABLE_SCHEDULER = process.env.ENABLE_MAINTENANCE_SCHEDULER !== 'false' // Enabled by default

/**
 * Main scheduler function
 */
async function runMaintenanceScheduler(): Promise<void> {
  const startTime = Date.now()
  logger.info('=== Maintenance Scheduler Started ===')

  try {
    // Get all active tenants
    const tenantsResult = await pool.query(
      'SELECT id, name FROM tenants WHERE is_active = true'
    )

    if (tenantsResult.rows.length === 0) {
      logger.warn('No active tenants found')
      return
    }

    logger.info(`Processing ${tenantsResult.rows.length} active tenants`)

    let totalWorkOrders = 0
    let totalErrors = 0

    // Process each tenant
    for (const tenant of tenantsResult.rows) {
      try {
        logger.info(`Processing tenant: ${tenant.name} (${tenant.id})`)

        // Get stats before processing
        const statsBefore = await getRecurringScheduleStats(tenant.id)
        logger.info('Tenant stats before processing', {
          tenantId: tenant.id,
          stats: statsBefore
        })

        // Process recurring schedules
        const results = await processRecurringSchedules(tenant.id, DAYS_AHEAD)

        const successful = results.filter((r) => r.success).length
        const failed = results.filter((r) => !r.success).length

        totalWorkOrders += successful
        totalErrors += failed

        logger.info(`Tenant processing complete: ${tenant.name}`, {
          tenantId: tenant.id,
          processed: results.length,
          successful,
          failed
        })

        // Get stats after processing
        const statsAfter = await getRecurringScheduleStats(tenant.id)
        logger.info('Tenant stats after processing', {
          tenantId: tenant.id,
          stats: statsAfter
        })

        // Send summary notification to fleet managers if work orders were created
        if (successful > 0) {
          await sendSummaryNotification(tenant.id, successful, failed, statsAfter)
        }
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
    logger.info('=== Maintenance Scheduler Completed ===', {
      duration: `${duration}ms`,
      totalWorkOrders,
      totalErrors,
      tenantsProcessed: tenantsResult.rows.length
    })

    // Log metrics to audit table
    await logSchedulerMetrics({
      total_tenants: tenantsResult.rows.length,
      total_work_orders_created: totalWorkOrders,
      total_errors: totalErrors,
      duration_ms: duration
    })
  } catch (error: any) {
    logger.error('Fatal error in maintenance scheduler', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * Send summary notification to fleet managers
 */
async function sendSummaryNotification(
  tenantId: string,
  workOrdersCreated: number,
  errors: number,
  stats: any
): Promise<void> {
  try {
    // Get fleet manager users
    const managersResult = await pool.query(
      `SELECT id, email FROM users
       WHERE tenant_id = $1 AND role IN ('admin', 'fleet_manager')
       AND active = true`,
      [tenantId]
    )

    const message = `
Maintenance Scheduler Summary:
- Work Orders Created: ${workOrdersCreated}
- Errors: ${errors}
- Due within 7 days: ${stats.due_within_7_days}
- Due within 30 days: ${stats.due_within_30_days}
- Overdue: ${stats.overdue}
- Estimated cost (next 30 days): $${stats.total_estimated_cost_next_30_days.toFixed(2)}
    `.trim()

    // Create notifications for each manager
    for (const manager of managersResult.rows) {
      await pool.query(
        `INSERT INTO maintenance_notifications (
          tenant_id, user_id, notification_type, message
        ) VALUES ($1, $2, $3, $4)`,
        [tenantId, manager.id, 'work_order_created', message]
      )
    }

    logger.info('Summary notifications sent', {
      tenantId,
      managersNotified: managersResult.rows.length
    })
  } catch (error: any) {
    logger.error('Error sending summary notification', {
      tenantId,
      error: error.message
    })
  }
}

/**
 * Log scheduler metrics to database
 */
async function logSchedulerMetrics(metrics: {
  total_tenants: number
  total_work_orders_created: number
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
        'MAINTENANCE_SCHEDULER_RUN',
        'maintenance_schedules',
        null,
        JSON.stringify(metrics),
        'system',
        'maintenance-scheduler-cron'
      ]
    )
  } catch (error: any) {
    logger.error('Error logging scheduler metrics', {
      error: error.message
    })
  }
}

/**
 * Initialize and start the cron job
 */
export function startMaintenanceScheduler(): void {
  if (!ENABLE_SCHEDULER) {
    logger.warn('Maintenance scheduler is disabled by configuration')
    return
  }

  logger.info('Initializing maintenance scheduler', {
    schedule: CRON_SCHEDULE,
    daysAhead: DAYS_AHEAD,
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
      await runMaintenanceScheduler()
    },
    {
      timezone: process.env.TZ || 'UTC'
    }
  )

  task.start()

  logger.info('Maintenance scheduler started successfully', {
    schedule: CRON_SCHEDULE
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping maintenance scheduler')
    task.stop()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping maintenance scheduler')
    task.stop()
  })
}

/**
 * Manual trigger for testing or one-time runs
 */
export async function triggerMaintenanceSchedulerNow(): Promise<void> {
  logger.info('Manual trigger of maintenance scheduler requested')
  await runMaintenanceScheduler()
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  enabled: boolean
  schedule: string
  daysAhead: number
} {
  return {
    enabled: ENABLE_SCHEDULER,
    schedule: CRON_SCHEDULE,
    daysAhead: DAYS_AHEAD
  }
}

// Export for use in server.ts
export default {
  start: startMaintenanceScheduler,
  triggerNow: triggerMaintenanceSchedulerNow,
  getStatus: getSchedulerStatus
}
