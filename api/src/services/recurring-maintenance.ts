/**
 * Recurring Maintenance Service
 *
 * Core business logic for automated recurring maintenance scheduling
 * and work order generation.
 */

import pool from '../config/database'
import winston from 'winston'
import {
  MaintenanceSchedule,
  RecurrencePattern,
  DueSchedule,
  ScheduleGenerationResult,
  VehicleTelemetrySnapshot,
  WorkOrderTemplate,
  RecurringScheduleStats
} from '../types/maintenance'

// Configure logger
const logger = winston.createLogger({
  level: 'info',
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

/**
 * Calculate the next due date based on recurrence pattern
 */
export async function calculateNextDueDate(
  schedule: MaintenanceSchedule,
  currentDate: Date = new Date(),
  vehicleData?: VehicleTelemetrySnapshot
): Promise<Date> {
  if (!schedule.recurrence_pattern) {
    throw new Error('Schedule does not have a recurrence pattern')
  }

  const pattern = schedule.recurrence_pattern
  const nextDue = new Date(currentDate)

  switch (pattern.type) {
    case 'time':
      return addTimeInterval(nextDue, pattern)

    case 'mileage':
      // Estimate based on average daily mileage
      if (vehicleData?.odometer_reading && schedule.current_mileage) {
        const avgMilesPerDay = await getAverageDailyMileage(schedule.vehicle_id, schedule.tenant_id)
        const milesUntilDue = pattern.interval_value
        const daysUntilDue = Math.ceil(milesUntilDue / (avgMilesPerDay || 50))
        nextDue.setDate(nextDue.getDate() + daysUntilDue)
      } else {
        // Fallback: assume 90 days if no data
        nextDue.setDate(nextDue.getDate() + 90)
      }
      return nextDue

    case 'engine_hours':
      // Estimate based on average daily engine hours
      const avgHoursPerDay = await getAverageEngineHoursPerDay(schedule.vehicle_id, schedule.tenant_id)
      const hoursUntilDue = pattern.interval_value
      const daysUntilDueHours = Math.ceil(hoursUntilDue / (avgHoursPerDay || 8))
      nextDue.setDate(nextDue.getDate() + daysUntilDueHours)
      return nextDue

    case 'combined':
      // Return whichever comes first: time or mileage
      const timeBasedDue = addTimeInterval(new Date(currentDate), pattern)
      const mileageBasedDue = await calculateNextDueDate(
        { ...schedule, recurrence_pattern: { ...pattern, type: 'mileage' } },
        currentDate,
        vehicleData
      )
      return timeBasedDue < mileageBasedDue ? timeBasedDue : mileageBasedDue

    default:
      return addTimeInterval(nextDue, pattern)
  }
}

/**
 * Add time interval to a date
 */
function addTimeInterval(date: Date, pattern: RecurrencePattern): Date {
  const result = new Date(date)
  const value = pattern.interval_value

  switch (pattern.interval_unit) {
    case 'days':
      result.setDate(result.getDate() + value)
      break
    case 'weeks':
      result.setDate(result.getDate() + value * 7)
      break
    case 'months':
      result.setMonth(result.getMonth() + value)
      break
    default:
      result.setDate(result.getDate() + value)
  }

  return result
}

/**
 * Get average daily mileage for a vehicle
 */
async function getAverageDailyMileage(vehicleId: string, tenantId: string): Promise<number> {
  const result = await pool.query(
    `
    SELECT
      (MAX(odometer_reading) - MIN(odometer_reading)) as total_miles,
      EXTRACT(EPOCH FROM (MAX(snapshot_date) - MIN(snapshot_date))) / 86400 as days
    FROM vehicle_telemetry_snapshots
    WHERE vehicle_id = $1 AND tenant_id = $2
      AND odometer_reading IS NOT NULL
      AND snapshot_date > NOW() - INTERVAL '90 days'
    `,
    [vehicleId, tenantId]
  )

  if (result.rows.length > 0 && result.rows[0].days > 0) {
    return Math.ceil(result.rows[0].total_miles / result.rows[0].days)
  }

  return 50 // Default fallback
}

/**
 * Get average engine hours per day for a vehicle
 */
async function getAverageEngineHoursPerDay(vehicleId: string, tenantId: string): Promise<number> {
  const result = await pool.query(
    `
    SELECT
      (MAX(engine_hours) - MIN(engine_hours)) as total_hours,
      EXTRACT(EPOCH FROM (MAX(snapshot_date) - MIN(snapshot_date))) / 86400 as days
    FROM vehicle_telemetry_snapshots
    WHERE vehicle_id = $1 AND tenant_id = $2
      AND engine_hours IS NOT NULL
      AND snapshot_date > NOW() - INTERVAL '90 days'
    `,
    [vehicleId, tenantId]
  )

  if (result.rows.length > 0 && result.rows[0].days > 0) {
    return Math.ceil(result.rows[0].total_hours / result.rows[0].days)
  }

  return 8 // Default fallback
}

/**
 * Check all schedules that are due now or within the specified window
 */
export async function checkDueSchedules(
  tenantId: string,
  daysAhead: number = 1,
  includeOverdue: boolean = true
): Promise<DueSchedule[]> {
  // Validate and sanitize daysAhead parameter
  const daysAheadNum = Math.max(1, Math.min(365, daysAhead || 1))

  const query = `
    WITH latest_telemetry AS (
      SELECT DISTINCT ON (vehicle_id)
        vehicle_id,
        odometer_reading,
        engine_hours,
        snapshot_date
      FROM vehicle_telemetry_snapshots
      WHERE tenant_id = $1
      ORDER BY vehicle_id, snapshot_date DESC
    )
    SELECT
      ms.*,
      v.vehicle_number, v.make, v.model, v.year, v.vin,
      lt.odometer_reading, lt.engine_hours,
      EXTRACT(EPOCH FROM (ms.next_due - NOW())) / 86400 as days_until_due
    FROM maintenance_schedules ms
    INNER JOIN vehicles v ON ms.vehicle_id = v.id
    LEFT JOIN latest_telemetry lt ON v.id = lt.vehicle_id
    WHERE ms.tenant_id = $1
      AND ms.is_recurring = true
      AND ms.auto_create_work_order = true
      AND (
        ms.next_due <= NOW() + ($2 || ' days')::INTERVAL
        ${includeOverdue ? '' : 'AND ms.next_due >= NOW()'}
      )
      AND (
        ms.last_work_order_created_at IS NULL
        OR ms.last_work_order_created_at < ms.next_due - INTERVAL '1 day'
      )
    ORDER BY ms.next_due ASC
  `

  const result = await pool.query(query, [tenantId, daysAheadNum])

  return result.rows.map((row) => ({
    schedule: row as MaintenanceSchedule,
    vehicle: {
      id: row.vehicle_id,
      vehicle_number: row.vehicle_number,
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin
    },
    telemetry: row.odometer_reading
      ? ({
          id: '',
          tenant_id: row.tenant_id,
          vehicle_id: row.vehicle_id,
          odometer_reading: row.odometer_reading,
          engine_hours: row.engine_hours,
          snapshot_date: new Date(),
          created_at: new Date()
        } as VehicleTelemetrySnapshot)
      : undefined,
    days_until_due: parseFloat(row.days_until_due),
    is_overdue: parseFloat(row.days_until_due) < 0,
    miles_until_due:
      row.recurrence_pattern?.type === 'mileage' && row.odometer_reading
        ? row.current_mileage + row.recurrence_pattern.interval_value - row.odometer_reading
        : undefined,
    hours_until_due:
      row.recurrence_pattern?.type === 'engine_hours' && row.engine_hours
        ? row.current_engine_hours + row.recurrence_pattern.interval_value - row.engine_hours
        : undefined
  }))
}

/**
 * Generate a work order from a maintenance schedule
 */
export async function generateWorkOrder(
  schedule: MaintenanceSchedule,
  vehicleData?: VehicleTelemetrySnapshot,
  overrideTemplate?: Partial<WorkOrderTemplate>
): Promise<string> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const template = { ...schedule.work_order_template, ...overrideTemplate }

    // Generate work order number
    const woNumberResult = await client.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
       FROM work_orders WHERE tenant_id = $1',
      [schedule.tenant_id]
    )
    const workOrderNumber = 'WO-${String(woNumberResult.rows[0].next_num).padStart(6, '0')}'

    // Create work order
    const workOrderResult = await client.query(
      `INSERT INTO work_orders (
        tenant_id, vehicle_id, schedule_id, work_order_number,
        title, description, status, priority,
        assigned_to, estimated_cost, estimated_hours,
        parts_used, scheduled_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id',
      [
        schedule.tenant_id,
        schedule.vehicle_id,
        schedule.id,
        workOrderNumber,
        `${schedule.service_type} - Scheduled Maintenance`,
        template?.description || `Recurring ${schedule.service_type} for vehicle`,
        'open',
        template?.priority || schedule.priority,
        template?.assigned_technician,
        template?.estimated_cost || schedule.estimated_cost,
        template?.estimated_duration_hours,
        template?.parts ? JSON.stringify(template.parts) : null,
        schedule.next_due
      ]
    )

    const workOrderId = workOrderResult.rows[0].id

    // Calculate next due date
    const nextDueDate = await calculateNextDueDate(schedule, new Date(), vehicleData)

    // Update schedule with new next_due and last_work_order_created_at
    await client.query(
      `UPDATE maintenance_schedules
       SET next_due = $1,
           last_work_order_created_at = NOW(),
           current_mileage = $2,
           current_engine_hours = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [nextDueDate, vehicleData?.odometer_reading, vehicleData?.engine_hours, schedule.id]
    )

    // Create history record
    await client.query(
      `INSERT INTO maintenance_schedule_history (
        tenant_id, schedule_id, work_order_id, execution_type,
        next_due_before, next_due_after,
        mileage_at_creation, engine_hours_at_creation, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        schedule.tenant_id,
        schedule.id,
        workOrderId,
        'auto_scheduled',
        schedule.next_due,
        nextDueDate,
        vehicleData?.odometer_reading,
        vehicleData?.engine_hours,
        'success'
      ]
    )

    // Create notification for assigned technician
    if (template?.assigned_technician) {
      const techResult = await client.query(
        `SELECT id FROM users WHERE tenant_id = $1 AND (username = $2 OR email = $2) LIMIT 1`,
        [schedule.tenant_id, template.assigned_technician]
      )

      if (techResult.rows.length > 0) {
        await client.query(
          `INSERT INTO maintenance_notifications (
            tenant_id, schedule_id, work_order_id, user_id,
            notification_type, message
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            schedule.tenant_id,
            schedule.id,
            workOrderId,
            techResult.rows[0].id,
            'work_order_created',
            `New work order ${workOrderNumber} created for ${schedule.service_type}`
          ]
        )
      }
    }

    await client.query('COMMIT')

    logger.info('Work order generated successfully', {
      scheduleId: schedule.id,
      workOrderId,
      workOrderNumber,
      nextDueDate
    })

    return workOrderId
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error generating work order', { scheduleId: schedule.id, error })
    throw error
  } finally {
    client.release()
  }
}

/**
 * Process all recurring schedules for a tenant
 * This is the main function called by the cron job
 */
export async function processRecurringSchedules(
  tenantId?: string,
  daysAhead: number = 1
): Promise<ScheduleGenerationResult[]> {
  logger.info('Starting recurring maintenance schedule processing', { tenantId, daysAhead })

  try {
    // Get all tenants if not specified
    const tenants = tenantId
      ? [{ id: tenantId }]
      : (await pool.query('SELECT id FROM tenants WHERE active = true')).rows

    const results: ScheduleGenerationResult[] = []

    for (const tenant of tenants) {
      const dueSchedules = await checkDueSchedules(tenant.id, daysAhead)

      logger.info(`Found ${dueSchedules.length} due schedules for tenant ${tenant.id}`)

      for (const dueSchedule of dueSchedules) {
        try {
          const workOrderId = await generateWorkOrder(
            dueSchedule.schedule,
            dueSchedule.telemetry as VehicleTelemetrySnapshot
          )

          const nextDueDate = await calculateNextDueDate(
            dueSchedule.schedule,
            new Date(),
            dueSchedule.telemetry as VehicleTelemetrySnapshot
          )

          results.push({
            success: true,
            schedule_id: dueSchedule.schedule.id,
            work_order_id: workOrderId,
            next_due_date: nextDueDate,
            history_id: '' // This would be populated from the history insert
          })
        } catch (error: any) {
          logger.error('Failed to generate work order', {
            scheduleId: dueSchedule.schedule.id,
            error: error.message
          })

          // Record failed attempt in history
          await pool.query(
            `INSERT INTO maintenance_schedule_history (
              tenant_id, schedule_id, execution_type, status, error_message
            ) VALUES ($1, $2, $3, $4, $5)`,
            [tenant.id, dueSchedule.schedule.id, 'auto_scheduled', 'failed', error.message]
          )

          results.push({
            success: false,
            schedule_id: dueSchedule.schedule.id,
            error_message: error.message,
            history_id: ''
          })
        }
      }
    }

    logger.info('Completed recurring maintenance schedule processing', {
      totalProcessed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length
    })

    return results
  } catch (error) {
    logger.error('Error in processRecurringSchedules', { error })
    throw error
  }
}

/**
 * Get statistics for recurring schedules
 */
export async function getRecurringScheduleStats(tenantId: string): Promise<RecurringScheduleStats> {
  const result = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE is_recurring = true) as total_recurring,
      COUNT(*) FILTER (WHERE is_recurring = true AND auto_create_work_order = true) as total_active,
      COUNT(*) FILTER (WHERE is_recurring = true AND auto_create_work_order = false) as total_paused,
      COUNT(*) FILTER (WHERE is_recurring = true AND next_due <= NOW() + INTERVAL '7 days' AND next_due >= NOW()) as due_within_7_days,
      COUNT(*) FILTER (WHERE is_recurring = true AND next_due <= NOW() + INTERVAL '30 days' AND next_due >= NOW()) as due_within_30_days,
      COUNT(*) FILTER (WHERE is_recurring = true AND next_due < NOW()) as overdue,
      COALESCE(AVG(estimated_cost) FILTER (WHERE is_recurring = true), 0) as avg_cost_per_schedule,
      COALESCE(SUM(estimated_cost) FILTER (WHERE is_recurring = true AND next_due <= NOW() + INTERVAL '30 days'), 0) as total_estimated_cost_next_30_days
    FROM maintenance_schedules
    WHERE tenant_id = $1
    `,
    [tenantId]
  )

  const historyResult = await pool.query(
    `
    SELECT COUNT(*) as work_orders_created
    FROM maintenance_schedule_history
    WHERE tenant_id = $1
      AND created_at > NOW() - INTERVAL '30 days'
      AND status = 'success'
    `,
    [tenantId]
  )

  return {
    total_recurring: parseInt(result.rows[0].total_recurring) || 0,
    total_active: parseInt(result.rows[0].total_active) || 0,
    total_paused: parseInt(result.rows[0].total_paused) || 0,
    due_within_7_days: parseInt(result.rows[0].due_within_7_days) || 0,
    due_within_30_days: parseInt(result.rows[0].due_within_30_days) || 0,
    overdue: parseInt(result.rows[0].overdue) || 0,
    work_orders_created_last_30_days: parseInt(historyResult.rows[0].work_orders_created) || 0,
    avg_cost_per_schedule: parseFloat(result.rows[0].avg_cost_per_schedule) || 0,
    total_estimated_cost_next_30_days: parseFloat(result.rows[0].total_estimated_cost_next_30_days) || 0
  }
}

/**
 * Validate recurrence pattern
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!pattern.type) {
    errors.push('Recurrence type is required')
  }

  if (!['mileage', 'time', 'engine_hours', 'combined'].includes(pattern.type)) {
    errors.push('Invalid recurrence type')
  }

  if (!pattern.interval_value || pattern.interval_value <= 0) {
    errors.push('Interval value must be greater than 0')
  }

  if (!pattern.interval_unit) {
    errors.push('Interval unit is required')
  }

  // Validate unit matches type
  if (pattern.type === 'mileage' && pattern.interval_unit !== 'miles') {
    errors.push('Mileage-based schedules must use "miles" as interval unit')
  }

  if (pattern.type === 'engine_hours' && pattern.interval_unit !== 'engine_hours') {
    errors.push('Engine hours-based schedules must use "engine_hours" as interval unit')
  }

  if (pattern.type === 'time' && !['days', 'weeks', 'months'].includes(pattern.interval_unit)) {
    errors.push('Time-based schedules must use days, weeks, or months as interval unit')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
