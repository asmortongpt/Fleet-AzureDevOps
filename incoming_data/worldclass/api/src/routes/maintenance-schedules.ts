import express, { Response } from 'express'

import pool from '../config/database'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import {
  CreateRecurringScheduleRequest,
  UpdateRecurrencePatternRequest,
  ManualWorkOrderGenerationRequest
} from '../types/maintenance'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// Simple pagination helper
const getPaginationParams = (req: any) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

const createPaginatedResponse = (data: any[], total: number, params: any) => {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit)
    }
  }
}

// Simple validation helpers
const validateRecurrencePattern = (pattern: any) => {
  if (!pattern || !pattern.frequency) {
    return { valid: false, errors: ['Recurrence pattern must have a frequency'] }
  }
  return { valid: true, errors: [] }
}

const calculateNextDueDate = async (schedule: any, fromDate: Date) => {
  // Simple calculation - add interval to current date
  const pattern = schedule.recurrence_pattern
  const date = new Date(fromDate)

  if (pattern.frequency === 'daily') {
    date.setDate(date.getDate() + (pattern.interval || 1))
  } else if (pattern.frequency === 'weekly') {
    date.setDate(date.getDate() + (pattern.interval || 1) * 7)
  } else if (pattern.frequency === 'monthly') {
    date.setMonth(date.getMonth() + (pattern.interval || 1))
  }

  return date
}

const checkDueSchedules = async (tenantId: string, daysAhead: number, includeOverdue: boolean) => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const query = includeOverdue
    ? 'SELECT * FROM maintenance_schedules WHERE tenant_id = $1 AND (next_due <= $2 OR next_due < NOW())'
    : 'SELECT * FROM maintenance_schedules WHERE tenant_id = $1 AND next_due <= $2 AND next_due >= NOW()'

  const result = await pool.query(query, [tenantId, futureDate])

  return result.rows.map((schedule: any) => ({
    schedule,
    vehicle: { id: schedule.vehicle_id },
    is_overdue: new Date(schedule.next_due) < new Date(),
    days_until_due: Math.floor((new Date(schedule.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }))
}

const generateWorkOrder = async (schedule: any, telemetry: any, overrideTemplate: any) => {
  const workOrder = {
    tenant_id: schedule.tenant_id,
    vehicle_id: schedule.vehicle_id,
    type: 'preventive',
    priority: schedule.priority || 'medium',
    description: schedule.service_type,
    estimated_cost: schedule.estimated_cost || 0,
    status: 'open',
    metadata: { schedule_id: schedule.id, ...overrideTemplate },
    created_at: new Date()
  }

  const result = await pool.query(
    `INSERT INTO work_orders (tenant_id, vehicle_id, type, priority, description, estimated_cost, status, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [workOrder.tenant_id, workOrder.vehicle_id, workOrder.type, workOrder.priority,
     workOrder.description, workOrder.estimated_cost, workOrder.status,
     JSON.stringify(workOrder.metadata), workOrder.created_at]
  )

  return result.rows[0].id
}

const getRecurringScheduleStats = async (tenantId: string) => {
  const result = await pool.query(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN auto_create_work_order THEN 1 ELSE 0 END) as active,
            SUM(estimated_cost) as total_estimated_cost
     FROM maintenance_schedules
     WHERE tenant_id = $1 AND is_recurring = true`,
    [tenantId]
  )

  return result.rows[0]
}

// GET /maintenance-schedules
router.get(
  '/',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const paginationParams = getPaginationParams(req)
      const {
        trigger_metric,
        vehicle_id,
        service_type
      } = req.query

      // Build multi-metric filters
      let filters = `WHERE tenant_id = $1`
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (trigger_metric) {
        filters += ` AND trigger_metric = $${paramIndex++}`
        params.push(trigger_metric)
      }

      if (vehicle_id) {
        filters += ` AND vehicle_id = $${paramIndex++}`
        params.push(vehicle_id)
      }

      if (service_type) {
        filters += ` AND service_type = $${paramIndex++}`
        params.push(service_type)
      }

      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, service_type, priority, status,
                trigger_metric, trigger_value, current_value, next_due,
                estimated_cost, is_recurring, recurrence_pattern,
                auto_create_work_order, work_order_template, notes,
                created_at, updated_at
         FROM maintenance_schedules ${filters} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, paginationParams.limit, paginationParams.offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM maintenance_schedules ${filters}`,
        params
      )

      const paginatedResponse = createPaginatedResponse(
        result.rows,
        parseInt(countResult.rows[0].count),
        paginationParams
      )

      res.json(paginatedResponse)
    } catch (error) {
      console.error(`Get maintenance-schedules error:`, error)
      res.status(500).json({ error: `Failed to retrieve maintenance schedules` })
    }
  }
)

// GET /maintenance-schedules/:id
router.get(
  '/:id',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, vehicle_id, service_type, priority, status,
                trigger_metric, trigger_value, current_value, next_due,
                estimated_cost, is_recurring, recurrence_pattern,
                auto_create_work_order, work_order_template, parts,
                notes, created_at, updated_at
         FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Maintenance schedule not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      console.error('Get maintenance-schedules error:', error)
      res.status(500).json({ error: 'Failed to retrieve maintenance schedule' })
    }
  }
)

// POST /maintenance-schedules
router.post(
  '/',
  csrfProtection,
  requirePermission('maintenance_schedule:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await pool.query(
        `INSERT INTO maintenance_schedules (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json({ data: result.rows[0] })
    } catch (error) {
      console.error(`Create maintenance-schedules error:`, error)
      res.status(500).json({ error: 'Failed to create maintenance schedule' })
    }
  }
)

// PUT /maintenance-schedules/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE maintenance_schedules SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Maintenance schedule not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      console.error(`Update maintenance-schedules error:`, error)
      res.status(500).json({ error: 'Failed to update maintenance schedule' })
    }
  }
)

// DELETE /maintenance-schedules/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('maintenance_schedule:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `DELETE FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Maintenance schedule not found' })
      }

      res.json({ message: 'Maintenance schedule deleted successfully', id: result.rows[0].id })
    } catch (error) {
      console.error('Delete maintenance-schedules error:', error)
      res.status(500).json({ error: 'Failed to delete maintenance schedule' })
    }
  }
)

// ============================================================================
// RECURRING MAINTENANCE ENDPOINTS
// ============================================================================

// POST /maintenance-schedules/recurring - Create recurring schedule
router.post(
  '/recurring',
 csrfProtection, requirePermission('maintenance_schedule:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'maintenance_schedules_recurring' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data: CreateRecurringScheduleRequest = req.body

      // Validate recurrence pattern
      const validation = validateRecurrencePattern(data.recurrence_pattern)
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid recurrence pattern',
          errors: validation.errors
        })
      }

      // Calculate initial next_due date
      const now = new Date()
      const nextDue = await calculateNextDueDate(
        {
          recurrence_pattern: data.recurrence_pattern,
          vehicle_id: data.vehicle_id,
          tenant_id: req.user!.tenant_id
        } as any,
        now
      )

      // Create schedule
      const result = await pool.query(
        `INSERT INTO maintenance_schedules (
          tenant_id, vehicle_id, service_type, priority, estimated_cost,
          is_recurring, recurrence_pattern, auto_create_work_order,
          work_order_template, next_due, notes, parts, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          req.user!.tenant_id,
          data.vehicle_id,
          data.service_type,
          data.priority,
          data.estimated_cost || 0,
          true,
          JSON.stringify(data.recurrence_pattern),
          data.auto_create_work_order,
          JSON.stringify(data.work_order_template),
          nextDue,
          data.notes,
          data.parts ? JSON.stringify(data.parts) : null,
          'scheduled'
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error: any) {
      console.error(`Create recurring schedule error:`, error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// PUT /maintenance-schedules/:id/recurrence - Update recurrence pattern
router.put(
  '/:id/recurrence',
 csrfProtection, requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules_recurrence' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data: UpdateRecurrencePatternRequest = req.body

      // Validate recurrence pattern
      const validation = validateRecurrencePattern(data.recurrence_pattern)
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid recurrence pattern',
          errors: validation.errors
        })
      }

      const updateFields: string[] = [`recurrence_pattern = $3`]
      const updateValues: any[] = [JSON.stringify(data.recurrence_pattern)]
      let paramIndex = 4

      if (data.auto_create_work_order !== undefined) {
        updateFields.push(`auto_create_work_order = $${paramIndex}`)
        updateValues.push(data.auto_create_work_order)
        paramIndex++
      }

      if (data.work_order_template) {
        updateFields.push(`work_order_template = $${paramIndex}`)
        updateValues.push(JSON.stringify(data.work_order_template))
        paramIndex++
      }

      const result = await pool.query(
        `UPDATE maintenance_schedules
         SET ${updateFields.join(`, `)}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_recurring = true
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...updateValues]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Recurring schedule not found` })
      }

      res.json(result.rows[0])
    } catch (error: any) {
      console.error(`Update recurrence pattern error:`, error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// GET /maintenance-schedules/due - Get schedules due soon
router.get(
  '/due',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules_due' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        days_ahead = 7,
        include_overdue = 'true',
        vehicle_id,
        service_type,
        priority
      } = req.query as any

      let dueSchedules = await checkDueSchedules(
        req.user!.tenant_id,
        parseInt(days_ahead),
        include_overdue === 'true'
      )

      // Apply filters
      if (vehicle_id) {
        dueSchedules = dueSchedules.filter((s) => s.vehicle.id === vehicle_id)
      }

      if (service_type) {
        dueSchedules = dueSchedules.filter((s) => s.schedule.service_type === service_type)
      }

      if (priority) {
        dueSchedules = dueSchedules.filter((s) => s.schedule.priority === priority)
      }

      res.json({
        data: dueSchedules,
        summary: {
          total: dueSchedules.length,
          overdue: dueSchedules.filter((s) => s.is_overdue).length,
          due_within_7_days: dueSchedules.filter((s) => s.days_until_due <= 7 && !s.is_overdue).length,
          total_estimated_cost: dueSchedules.reduce((sum, s) => sum + s.schedule.estimated_cost, 0)
        }
      })
    } catch (error: any) {
      console.error('Get due schedules error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// POST /maintenance-schedules/:id/generate-work-order - Manual work order creation
router.post(
  '/:id/generate-work-order',
 csrfProtection, requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'work_orders_from_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { override_template, skip_due_check } = req.body as ManualWorkOrderGenerationRequest

      // Get schedule
      const scheduleResult = await pool.query(
        `SELECT id, tenant_id, vehicle_id, service_type, description, scheduled_date, completed_date, status, odometer_reading, estimated_cost, actual_cost, assigned_vendor_id, assigned_technician, notes, recurring, recurring_interval_miles, recurring_interval_days, next_service_date, next_service_odometer, priority, created_at, updated_at, deleted_at FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (scheduleResult.rows.length === 0) {
        return res.status(404).json({ error: `Schedule not found` })
      }

      const schedule = scheduleResult.rows[0]

      // Check if due (unless skip_due_check is true)
      if (!skip_due_check) {
        const now = new Date()
        const nextDue = new Date(schedule.next_due)
        if (nextDue > now) {
          return res.status(400).json({
            error: 'Schedule is not due yet',
            next_due: schedule.next_due
          })
        }
      }

      // Get vehicle telemetry
      const telemetryResult = await pool.query(
        `SELECT * FROM vehicle_telemetry_snapshots
         WHERE vehicle_id = $1 AND tenant_id = $2
         ORDER BY snapshot_date DESC LIMIT 1`,
        [schedule.vehicle_id, req.user!.tenant_id]
      )

      const telemetry = telemetryResult.rows[0] || undefined

      // Generate work order
      const workOrderId = await generateWorkOrder(schedule, telemetry, override_template)

      // Get created work order
      const workOrderResult = await pool.query(
        `SELECT id, tenant_id, vehicle_id, type, priority, description, estimated_cost, actual_cost, status, created_at, updated_at, deleted_at, metadata, created_by, assigned_to FROM work_orders WHERE id = $1`,
        [workOrderId]
      )

      res.status(201).json({
        message: `Work order created successfully`,
        work_order: workOrderResult.rows[0],
        schedule: schedule
      })
    } catch (error: any) {
      console.error('Generate work order error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// GET /maintenance-schedules/:id/history - View history of generated work orders
router.get(
  '/:id/history',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedule_history' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Get schedule
      const scheduleResult = await pool.query(
        `SELECT id, tenant_id, vehicle_id, service_type, description, scheduled_date, completed_date, status, odometer_reading, estimated_cost, actual_cost, assigned_vendor_id, assigned_technician, notes, recurring, recurring_interval_miles, recurring_interval_days, next_service_date, next_service_odometer, priority, created_at, updated_at, deleted_at FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (scheduleResult.rows.length === 0) {
        return res.status(404).json({ error: `Schedule not found` })
      }

      // Get history with work orders
      const historyResult = await pool.query(
        `SELECT
          msh.*,
          wo.work_order_number, wo.title, wo.status as work_order_status,
          wo.actual_cost, wo.completed_date
         FROM maintenance_schedule_history msh
         LEFT JOIN work_orders wo ON msh.work_order_id = wo.id
         WHERE msh.schedule_id = $1 AND msh.tenant_id = $2
         ORDER BY msh.created_at DESC`,
        [req.params.id, req.user!.tenant_id]
      )

      // Calculate statistics
      const totalWorkOrders = historyResult.rows.filter((h) => h.status === `success`).length
      const totalCost = historyResult.rows.reduce((sum, h) => sum + (h.actual_cost || 0), 0)

      res.json({
        schedule: scheduleResult.rows[0],
        history: historyResult.rows,
        stats: {
          total_work_orders: totalWorkOrders,
          total_cost: totalCost,
          success_rate: historyResult.rows.length > 0
            ? (totalWorkOrders / historyResult.rows.length) * 100
            : 0
        }
      })
    } catch (error: any) {
      console.error(`Get schedule history error:`, error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// GET /maintenance-schedules/stats - Get recurring schedule statistics
router.get(
  '/stats/recurring',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules_stats' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await getRecurringScheduleStats(req.user!.tenant_id)
      res.json(stats)
    } catch (error: any) {
      console.error('Get recurring schedule stats error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// PATCH /maintenance-schedules/:id/pause - Pause auto work order generation
router.patch(
  '/:id/pause',
 csrfProtection, requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules_pause' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE maintenance_schedules
         SET auto_create_work_order = false, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_recurring = true
         RETURNING *`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Recurring schedule not found` })
      }

      res.json({
        message: `Auto work order generation paused`,
        schedule: result.rows[0]
      })
    } catch (error: any) {
      console.error('Pause schedule error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// PATCH /maintenance-schedules/:id/resume - Resume auto work order generation
router.patch(
  '/:id/resume',
 csrfProtection, requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules_resume' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE maintenance_schedules
         SET auto_create_work_order = true, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_recurring = true
         RETURNING *`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Recurring schedule not found` })
      }

      res.json({
        message: `Auto work order generation resumed`,
        schedule: result.rows[0]
      })
    } catch (error: any) {
      console.error('Resume schedule error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// ============================================================================
// MULTI-METRIC MAINTENANCE ENDPOINTS (Migration 032)
// ============================================================================

/**
 * @openapi
 * /api/maintenance-schedules/multi-metric/due:
 *   get:
 *     summary: Get multi-metric maintenance schedules with overdue status
 *     tags: [Maintenance Schedules]
 *     description: Uses vw_multi_metric_maintenance_due view to show schedules tracked by various metrics
 *     parameters:
 *       - name: trigger_metric
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ODOMETER, ENGINE_HOURS, PTO_HOURS, AUX_HOURS, CYCLES, CALENDAR]
 *       - name: is_overdue
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: vehicle_id
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of maintenance schedules with multi-metric tracking
 */
router.get(
  '/multi-metric/due',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules_multi_metric' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        trigger_metric,
        is_overdue,
        vehicle_id
      } = req.query

      let filters = `WHERE tenant_id = $1`
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (trigger_metric) {
        filters += ` AND trigger_metric = $${paramIndex++}`
        params.push(trigger_metric)
      }

      if (is_overdue !== undefined) {
        filters += ` AND is_overdue = $${paramIndex++}`
        params.push(is_overdue === `true`)
      }

      if (vehicle_id) {
        filters += ` AND vehicle_id = $${paramIndex++}`
        params.push(vehicle_id)
      }

      const result = await pool.query(
        `SELECT vehicle_id, vehicle_name, last_service_date, days_since_service, miles_since_service, next_due_date FROM vw_multi_metric_maintenance_due ${filters} ORDER BY
          CASE WHEN is_overdue THEN 0 ELSE 1 END,
          units_until_due ASC NULLS LAST`,
        params
      )

      // Calculate summary statistics
      const schedules = result.rows
      const summary = {
        total: schedules.length,
        overdue: schedules.filter((s: any) => s.is_overdue).length,
        by_metric: {
          ODOMETER: schedules.filter((s: any) => s.trigger_metric === `ODOMETER`).length,
          ENGINE_HOURS: schedules.filter((s: any) => s.trigger_metric === `ENGINE_HOURS`).length,
          PTO_HOURS: schedules.filter((s: any) => s.trigger_metric === `PTO_HOURS`).length,
          AUX_HOURS: schedules.filter((s: any) => s.trigger_metric === 'AUX_HOURS').length,
          CYCLES: schedules.filter((s: any) => s.trigger_metric === 'CYCLES').length,
          CALENDAR: schedules.filter((s: any) => s.trigger_metric === 'CALENDAR').length
        },
        overdue_by_metric: {
          ODOMETER: schedules.filter((s: any) => s.trigger_metric === 'ODOMETER' && s.is_overdue).length,
          ENGINE_HOURS: schedules.filter((s: any) => s.trigger_metric === 'ENGINE_HOURS' && s.is_overdue).length,
          PTO_HOURS: schedules.filter((s: any) => s.trigger_metric === 'PTO_HOURS' && s.is_overdue).length,
          AUX_HOURS: schedules.filter((s: any) => s.trigger_metric === 'AUX_HOURS' && s.is_overdue).length,
          CYCLES: schedules.filter((s: any) => s.trigger_metric === 'CYCLES' && s.is_overdue).length,
          CALENDAR: schedules.filter((s: any) => s.trigger_metric === 'CALENDAR' && s.is_overdue).length
        }
      }

      res.json({
        data: schedules,
        summary
      })
    } catch (error: any) {
      console.error('Get multi-metric maintenance due error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * @openapi
 * /api/maintenance-schedules/multi-metric/by-vehicle/{vehicleId}:
 *   get:
 *     summary: Get all multi-metric schedules for a specific vehicle
 *     tags: [Maintenance Schedules]
 *     parameters:
 *       - name: vehicleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle maintenance schedules grouped by metric
 */
router.get(
  '/multi-metric/by-vehicle/:vehicleId',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules_by_vehicle' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT vehicle_id, vehicle_name, last_service_date, days_since_service, miles_since_service, next_due_date FROM vw_multi_metric_maintenance_due
         WHERE vehicle_id = $1 AND tenant_id = $2
         ORDER BY
           CASE WHEN is_overdue THEN 0 ELSE 1 END,
           trigger_metric,
           units_until_due ASC NULLS LAST`,
        [req.params.vehicleId, req.user!.tenant_id]
      )

      // Group by trigger metric
      const byMetric = result.rows.reduce((acc: any, schedule: any) => {
        const metric = schedule.trigger_metric || `CALENDAR`
        if (!acc[metric]) {
          acc[metric] = []
        }
        acc[metric].push(schedule)
        return acc
      }, {})

      res.json({
        vehicle_id: req.params.vehicleId,
        schedules: result.rows,
        by_metric: byMetric,
        summary: {
          total: result.rows.length,
          overdue: result.rows.filter((s: any) => s.is_overdue).length,
          metrics_tracked: Object.keys(byMetric)
        }
      })
    } catch (error: any) {
      console.error(`Get vehicle multi-metric schedules error:`, error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

export default router
