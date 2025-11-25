/**
 * Scheduling Reminders Job
 *
 * Scheduled job to send reminders for upcoming reservations and maintenance appointments
 * Runs every 15 minutes to check for upcoming events
 *
 * Features:
 * - Sends reminders based on user preferences (24h, 1h before)
 * - Checks for upcoming vehicle reservations
 * - Checks for upcoming maintenance appointments
 * - Avoids duplicate reminders
 * - Respects user notification preferences
 */

import cron from 'node-cron'
import winston from 'winston'
import pool from '../config/database'
import schedulingNotificationService from '../services/scheduling-notification.service'

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/scheduling-reminders.log',
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
const CRON_SCHEDULE = process.env.SCHEDULING_REMINDERS_CRON || '*/15 * * * *' // Every 15 minutes
const ENABLE_REMINDERS = process.env.ENABLE_SCHEDULING_REMINDERS !== 'false' // Enabled by default
const REMINDER_TIMES = [24, 1] // Hours before event to send reminders

/**
 * Main reminder checker function
 */
async function runSchedulingReminders(): Promise<void> {
  const startTime = Date.now()
  logger.info('=== Scheduling Reminders Job Started ===')

  try {
    let totalReminders = 0

    // Process reservation reminders
    const reservationReminders = await processReservationReminders()
    totalReminders += reservationReminders

    // Process maintenance reminders
    const maintenanceReminders = await processMaintenanceReminders()
    totalReminders += maintenanceReminders

    const duration = Date.now() - startTime
    logger.info('=== Scheduling Reminders Job Completed ===', {
      duration: `${duration}ms`,
      totalReminders,
      reservationReminders,
      maintenanceReminders
    })

    // Log metrics
    await logReminderMetrics({
      total_reminders: totalReminders,
      reservation_reminders: reservationReminders,
      maintenance_reminders: maintenanceReminders,
      duration_ms: duration
    })
  } catch (error: any) {
    logger.error('Fatal error in scheduling reminders job', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * Process reservation reminders
 */
async function processReservationReminders(): Promise<number> {
  let remindersSent = 0

  try {
    logger.info('Processing reservation reminders...')

    for (const hours of REMINDER_TIMES) {
      const windowStart = new Date(Date.now() + (hours * 60 * 60 * 1000) - 15 * 60 * 1000)
      const windowEnd = new Date(Date.now() + (hours * 60 * 60 * 1000) + 15 * 60 * 1000)

      // Find reservations starting in the reminder window
      const result = await pool.query(
        `SELECT
          vr.*,
          v.make, v.model, v.license_plate, v.vin,
          u.first_name || ' ' || u.last_name as reserved_by_name,
          u.email as reserved_by_email,
          vr.tenant_id
        FROM vehicle_reservations vr
        JOIN vehicles v ON vr.vehicle_id = v.id
        JOIN users u ON vr.reserved_by = u.id
        WHERE vr.status IN ('confirmed', 'pending')
          AND vr.start_time BETWEEN $1 AND $2
        ORDER BY vr.start_time`,
        [windowStart, windowEnd]
      )

      logger.info(`Found ${result.rows.length} reservations for ${hours}h reminder window`)

      for (const reservation of result.rows) {
        try {
          // Check if reminder already sent
          const alreadySent = await schedulingNotificationService.isReminderSent(
            reservation.id,
            'reservation',
            hours
          )

          if (alreadySent) {
            logger.debug('Reminder already sent, skipping', {
              reservationId: reservation.id,
              hours
            })
            continue
          }

          // Get user notification preferences
          const prefsResult = await pool.query(
            `SELECT reminder_times FROM scheduling_notification_preferences WHERE user_id = $1',
            [reservation.reserved_by]
          )

          let userReminderTimes = REMINDER_TIMES
          if (prefsResult.rows.length > 0 && prefsResult.rows[0].reminder_times) {
            userReminderTimes = prefsResult.rows[0].reminder_times
          }

          // Check if user wants this reminder time
          if (!userReminderTimes.includes(hours)) {
            logger.debug('User does not want reminder at this time', {
              userId: reservation.reserved_by,
              hours
            })
            continue
          }

          // Send reminder
          await schedulingNotificationService.sendReservationReminder(
            reservation.tenant_id,
            reservation,
            hours
          )

          remindersSent++
          logger.info('Reservation reminder sent', {
            reservationId: reservation.id,
            userId: reservation.reserved_by,
            hours
          })
        } catch (error: any) {
          logger.error('Error sending reservation reminder', {
            reservationId: reservation.id,
            error: error.message
          })
        }
      }
    }

    logger.info(`Reservation reminders completed: ${remindersSent} sent`)
    return remindersSent
  } catch (error: any) {
    logger.error('Error processing reservation reminders', {
      error: error.message,
      stack: error.stack
    })
    return remindersSent
  }
}

/**
 * Process maintenance appointment reminders
 */
async function processMaintenanceReminders(): Promise<number> {
  let remindersSent = 0

  try {
    logger.info('Processing maintenance reminders...')

    for (const hours of REMINDER_TIMES) {
      const windowStart = new Date(Date.now() + (hours * 60 * 60 * 1000) - 15 * 60 * 1000)
      const windowEnd = new Date(Date.now() + (hours * 60 * 60 * 1000) + 15 * 60 * 1000)

      // Find maintenance appointments starting in the reminder window
      const result = await pool.query(
        `SELECT
          sbs.*,
          v.make, v.model, v.license_plate, v.vin,
          at.name as appointment_type,
          sb.bay_name,
          u.first_name || ' ' || u.last_name as technician_name,
          u.email as technician_email,
          sbs.tenant_id
        FROM service_bay_schedules sbs
        LEFT JOIN vehicles v ON sbs.vehicle_id = v.id
        LEFT JOIN appointment_types at ON sbs.appointment_type_id = at.id
        LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
        LEFT JOIN users u ON sbs.assigned_technician_id = u.id
        WHERE sbs.status IN ('scheduled', 'in_progress')
          AND sbs.scheduled_start BETWEEN $1 AND $2
          AND sbs.assigned_technician_id IS NOT NULL
        ORDER BY sbs.scheduled_start`,
        [windowStart, windowEnd]
      )

      logger.info(`Found ${result.rows.length} maintenance appointments for ${hours}h reminder window`)

      for (const appointment of result.rows) {
        try {
          // Check if reminder already sent
          const alreadySent = await schedulingNotificationService.isReminderSent(
            appointment.id,
            'maintenance',
            hours
          )

          if (alreadySent) {
            logger.debug('Reminder already sent, skipping', {
              appointmentId: appointment.id,
              hours
            })
            continue
          }

          // Get user notification preferences
          const prefsResult = await pool.query(
            `SELECT reminder_times FROM scheduling_notification_preferences WHERE user_id = $1',
            [appointment.assigned_technician_id]
          )

          let userReminderTimes = REMINDER_TIMES
          if (prefsResult.rows.length > 0 && prefsResult.rows[0].reminder_times) {
            userReminderTimes = prefsResult.rows[0].reminder_times
          }

          // Check if user wants this reminder time
          if (!userReminderTimes.includes(hours)) {
            logger.debug('User does not want reminder at this time', {
              userId: appointment.assigned_technician_id,
              hours
            })
            continue
          }

          // Send reminder
          await schedulingNotificationService.sendMaintenanceReminder(
            appointment.tenant_id,
            appointment,
            hours
          )

          remindersSent++
          logger.info('Maintenance reminder sent', {
            appointmentId: appointment.id,
            technicianId: appointment.assigned_technician_id,
            hours
          })
        } catch (error: any) {
          logger.error('Error sending maintenance reminder', {
            appointmentId: appointment.id,
            error: error.message
          })
        }
      }
    }

    logger.info(`Maintenance reminders completed: ${remindersSent} sent`)
    return remindersSent
  } catch (error: any) {
    logger.error('Error processing maintenance reminders', {
      error: error.message,
      stack: error.stack
    })
    return remindersSent
  }
}

/**
 * Log reminder metrics to database
 */
async function logReminderMetrics(metrics: {
  total_reminders: number
  reservation_reminders: number
  maintenance_reminders: number
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
        'SCHEDULING_REMINDERS_RUN',
        'scheduling',
        null,
        JSON.stringify(metrics),
        'system',
        'scheduling-reminders-cron'
      ]
    )
  } catch (error: any) {
    logger.error('Error logging reminder metrics', {
      error: error.message
    })
  }
}

/**
 * Check for conflicts and send notifications
 */
async function checkForConflicts(): Promise<void> {
  try {
    logger.info('Checking for scheduling conflicts...')

    // Check for double-booked vehicles
    const conflictResult = await pool.query(
      `SELECT
        v.id as vehicle_id,
        v.make, v.model, v.license_plate,
        array_agg(vr.id) as reservation_ids,
        array_agg(vr.reserved_by) as user_ids,
        COUNT(*) as conflict_count
      FROM vehicles v
      JOIN vehicle_reservations vr ON v.id = vr.vehicle_id
      WHERE vr.status IN ('confirmed', 'pending')
        AND vr.start_time < NOW() + INTERVAL '7 days'
        AND vr.end_time > NOW()
      GROUP BY v.id, v.make, v.model, v.license_plate
      HAVING COUNT(*) > 1`
    )

    if (conflictResult.rows.length > 0) {
      logger.warn(`Found ${conflictResult.rows.length} vehicle conflicts`)

      for (const conflict of conflictResult.rows) {
        const conflictData = {
          type: 'vehicle_double_booked',
          severity: 'high',
          description: `Vehicle ${conflict.make} ${conflict.model} (${conflict.license_plate}) has overlapping reservations`,
          vehicle_id: conflict.vehicle_id,
          reservation_ids: conflict.reservation_ids
        }

        // Notify affected users
        await schedulingNotificationService.sendConflictDetected(
          '', // tenant_id will be fetched from users
          conflictData,
          conflict.user_ids
        )
      }
    }
  } catch (error: any) {
    logger.error('Error checking for conflicts', {
      error: error.message
    })
  }
}

/**
 * Initialize and start the cron job
 */
export function startSchedulingReminders(): void {
  if (!ENABLE_REMINDERS) {
    logger.warn('Scheduling reminders job is disabled by configuration')
    return
  }

  logger.info('Initializing scheduling reminders job', {
    schedule: CRON_SCHEDULE,
    timezone: process.env.TZ || 'UTC',
    reminderTimes: REMINDER_TIMES
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
      await runSchedulingReminders()
    },
    {
      timezone: process.env.TZ || 'UTC'
    }
  )

  task.start()

  logger.info('Scheduling reminders job started successfully', {
    schedule: CRON_SCHEDULE
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping scheduling reminders job')
    task.stop()
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping scheduling reminders job')
    task.stop()
  })
}

/**
 * Manual trigger for testing
 */
export async function triggerSchedulingRemindersNow(): Promise<void> {
  logger.info('Manual trigger of scheduling reminders requested')
  await runSchedulingReminders()
}

/**
 * Get job status
 */
export function getSchedulingRemindersStatus(): {
  enabled: boolean
  schedule: string
  reminderTimes: number[]
} {
  return {
    enabled: ENABLE_REMINDERS,
    schedule: CRON_SCHEDULE,
    reminderTimes: REMINDER_TIMES
  }
}

// Export for use in server.ts
export default {
  start: startSchedulingReminders,
  triggerNow: triggerSchedulingRemindersNow,
  getStatus: getSchedulingRemindersStatus
}
