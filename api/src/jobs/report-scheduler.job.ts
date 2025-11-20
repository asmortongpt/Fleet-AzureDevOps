/**
 * Report Scheduler - Scheduled Job
 *
 * Executes scheduled reports and sends them to recipients
 * Runs every hour to check for due reports
 *
 * Schedule types:
 * - Daily: Run at specific time each day
 * - Weekly: Run on specific day of week
 * - Monthly: Run on specific day of month
 * - Quarterly: Run on first day of quarter
 * - Custom: Cron expression
 */

import cron from 'node-cron'
import winston from 'winston'
import pool from '../config/database'
import customReportService from '../services/custom-report.service'

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/report-scheduler.log',
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

// Configuration
const CRON_SCHEDULE = process.env.REPORT_SCHEDULER_CRON || '0 * * * *' // Every hour
const ENABLE_SCHEDULER = process.env.ENABLE_REPORT_SCHEDULER !== 'false'

/**
 * Main report scheduler function
 */
async function runReportScheduler(): Promise<void> {
  const startTime = Date.now()
  logger.info('=== Report Scheduler Started ===')

  try {
    // Get all active schedules that are due
    const dueSchedules = await getDueSchedules()

    if (dueSchedules.length === 0) {
      logger.info('No reports due for execution')
      return
    }

    logger.info(`Found ${dueSchedules.length} reports due for execution`)

    let successCount = 0
    let failureCount = 0

    // Execute each due report
    for (const schedule of dueSchedules) {
      try {
        logger.info(`Executing scheduled report: ${schedule.report_name}`, {
          scheduleId: schedule.id,
          reportId: schedule.report_id
        })

        // Execute the report
        const { executionId, filePath, rowCount } = await customReportService.executeReport(
          schedule.report_id,
          schedule.tenant_id,
          null as any, // System execution
          schedule.format
        )

        logger.info(`Report executed successfully`, {
          scheduleId: schedule.id,
          executionId,
          rowCount
        })

        // Send email to recipients
        if (schedule.recipients && schedule.recipients.length > 0) {
          await customReportService.sendReportEmail(
            executionId,
            schedule.recipients,
            schedule.report_name
          )

          logger.info(`Report emailed to ${schedule.recipients.length} recipients`, {
            scheduleId: schedule.id,
            recipients: schedule.recipients
          })
        }

        // Update schedule with last run and next run
        await updateScheduleAfterExecution(schedule.id, schedule.schedule_type, schedule.schedule_config)

        successCount++
      } catch (error: any) {
        logger.error(`Error executing scheduled report ${schedule.id}`, {
          scheduleId: schedule.id,
          reportId: schedule.report_id,
          error: error.message,
          stack: error.stack
        })
        failureCount++
      }
    }

    const duration = Date.now() - startTime
    logger.info('=== Report Scheduler Completed ===', {
      duration: `${duration}ms`,
      successCount,
      failureCount,
      totalSchedules: dueSchedules.length
    })
  } catch (error: any) {
    logger.error('Fatal error in report scheduler', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * Get schedules that are due for execution
 */
async function getDueSchedules(): Promise<any[]> {
  const result = await pool.query(
    `SELECT
      rs.*,
      cr.report_name,
      cr.tenant_id
    FROM report_schedules rs
    JOIN custom_reports cr ON rs.report_id = cr.id
    WHERE rs.is_active = true
    AND rs.next_run <= NOW()
    ORDER BY rs.next_run ASC`
  )

  return result.rows
}

/**
 * Update schedule after execution
 */
async function updateScheduleAfterExecution(
  scheduleId: string,
  scheduleType: string,
  scheduleConfig: any
): Promise<void> {
  const now = new Date()
  const nextRun = calculateNextRun(scheduleType, scheduleConfig, now)

  await pool.query(
    `UPDATE report_schedules
     SET last_run = $1, next_run = $2
     WHERE id = $3`,
    [now, nextRun, scheduleId]
  )

  logger.info(`Updated schedule ${scheduleId}`, {
    lastRun: now,
    nextRun
  })
}

/**
 * Calculate next run time based on schedule type
 */
function calculateNextRun(
  scheduleType: string,
  scheduleConfig: any,
  fromDate: Date = new Date()
): Date {
  const nextRun = new Date(fromDate)

  switch (scheduleType) {
    case 'daily':
      // Run at specific time each day
      nextRun.setDate(nextRun.getDate() + 1)
      nextRun.setHours(scheduleConfig.hour || 9, scheduleConfig.minute || 0, 0, 0)
      break

    case 'weekly':
      // Run on specific day of week
      nextRun.setDate(nextRun.getDate() + 7)
      nextRun.setHours(scheduleConfig.hour || 9, scheduleConfig.minute || 0, 0, 0)
      break

    case 'monthly':
      // Run on specific day of month
      nextRun.setMonth(nextRun.getMonth() + 1)
      nextRun.setDate(scheduleConfig.dayOfMonth || 1)
      nextRun.setHours(scheduleConfig.hour || 9, scheduleConfig.minute || 0, 0, 0)
      break

    case 'quarterly':
      // Run on first day of next quarter
      const currentMonth = nextRun.getMonth()
      const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3
      nextRun.setMonth(nextQuarterMonth)
      nextRun.setDate(1)
      nextRun.setHours(scheduleConfig.hour || 9, scheduleConfig.minute || 0, 0, 0)
      break

    case 'custom':
      // Use cron expression (simplified - just add 1 day for now)
      nextRun.setDate(nextRun.getDate() + 1)
      break

    default:
      // Default to 1 day
      nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun
}

/**
 * Create a new schedule
 */
export async function createSchedule(
  reportId: string,
  scheduleType: string,
  scheduleConfig: any,
  recipients: string[],
  format: 'xlsx' | 'csv' | 'pdf',
  userId: string
): Promise<string> {
  const nextRun = calculateNextRun(scheduleType, scheduleConfig)

  const result = await pool.query(
    `INSERT INTO report_schedules (
      report_id, schedule_type, schedule_config,
      recipients, format, is_active, next_run, created_by
    ) VALUES ($1, $2, $3, $4, $5, true, $6, $7)
    RETURNING id`,
    [
      reportId,
      scheduleType,
      JSON.stringify(scheduleConfig),
      recipients,
      format,
      nextRun,
      userId
    ]
  )

  logger.info('Schedule created', {
    scheduleId: result.rows[0].id,
    reportId,
    nextRun
  })

  return result.rows[0].id
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  scheduleId: string,
  updates: {
    scheduleType?: string
    scheduleConfig?: any
    recipients?: string[]
    format?: 'xlsx' | 'csv' | 'pdf'
    isActive?: boolean
  }
): Promise<void> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.scheduleType !== undefined) {
    fields.push(`schedule_type = $${paramIndex}`)
    values.push(updates.scheduleType)
    paramIndex++
  }

  if (updates.scheduleConfig !== undefined) {
    fields.push(`schedule_config = $${paramIndex}`)
    values.push(JSON.stringify(updates.scheduleConfig))
    paramIndex++
  }

  if (updates.recipients !== undefined) {
    fields.push(`recipients = $${paramIndex}`)
    values.push(updates.recipients)
    paramIndex++
  }

  if (updates.format !== undefined) {
    fields.push(`format = $${paramIndex}`)
    values.push(updates.format)
    paramIndex++
  }

  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex}`)
    values.push(updates.isActive)
    paramIndex++
  }

  if (fields.length === 0) {
    return
  }

  // Recalculate next run if schedule changed
  if (updates.scheduleType || updates.scheduleConfig) {
    const schedule = await pool.query(
      'SELECT schedule_type, schedule_config FROM report_schedules WHERE id = $1`,
      [scheduleId]
    )

    if (schedule.rows.length > 0) {
      const scheduleType = updates.scheduleType || schedule.rows[0].schedule_type
      const scheduleConfig = updates.scheduleConfig || schedule.rows[0].schedule_config
      const nextRun = calculateNextRun(scheduleType, scheduleConfig)

      fields.push(`next_run = $${paramIndex}`)
      values.push(nextRun)
      paramIndex++
    }
  }

  values.push(scheduleId)

  await pool.query(
    `UPDATE report_schedules SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  )

  logger.info('Schedule updated', { scheduleId })
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  await pool.query('DELETE FROM report_schedules WHERE id = $1`, [scheduleId])
  logger.info('Schedule deleted', { scheduleId })
}

/**
 * Get schedules for a report
 */
export async function getSchedulesForReport(reportId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT
      id,
      tenant_id,
      report_id,
      name,
      schedule_type,
      schedule_config,
      last_run,
      next_run,
      is_active,
      created_at,
      updated_at FROM report_schedules WHERE report_id = $1 ORDER BY created_at DESC`,
    [reportId]
  )

  return result.rows
}

/**
 * Initialize and start the cron job
 */
export function startReportScheduler(): void {
  if (!ENABLE_SCHEDULER) {
    logger.warn('Report scheduler is disabled by configuration')
    return
  }

  logger.info('Initializing report scheduler', {
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
      await runReportScheduler()
    },
    {
      timezone: process.env.TZ || 'UTC'
    }
  )

  task.start()

  logger.info('Report scheduler started successfully', {
    schedule: CRON_SCHEDULE
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping report scheduler')
    task.stop()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping report scheduler')
    task.stop()
  })
}

/**
 * Manual trigger for testing
 */
export async function triggerSchedulerNow(): Promise<void> {
  logger.info('Manual trigger of report scheduler requested')
  await runReportScheduler()
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  enabled: boolean
  schedule: string
} {
  return {
    enabled: ENABLE_SCHEDULER,
    schedule: CRON_SCHEDULE
  }
}

// Export for use in server.ts
export default {
  start: startReportScheduler,
  triggerNow: triggerSchedulerNow,
  getStatus: getSchedulerStatus,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesForReport
}
