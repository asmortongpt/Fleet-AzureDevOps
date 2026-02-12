import express, { Response } from 'express'

import pool from '../config/database'
import logger from '../config/logger'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'
import {
  CreateRecurringScheduleRequest,
  UpdateRecurrencePatternRequest,
  ManualWorkOrderGenerationRequest
} from '../types/maintenance'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()

// CRITICAL: Apply middleware in exact order
router.use(authenticateJWT)          // 1. Authenticate user
router.use(setTenantContext)         // 2. Set PostgreSQL tenant context

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

const checkDueSchedules = async (client: any, daysAhead: number, includeOverdue: boolean) => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  // RLS handles tenant filtering, no need for tenant_id in WHERE clause
  const query = includeOverdue
    ? 'SELECT * FROM maintenance_schedules WHERE (next_service_date <= $1 OR next_service_date < NOW())'
    : 'SELECT * FROM maintenance_schedules WHERE next_service_date <= $1 AND next_service_date >= NOW()'

  const result = await client.query(query, [futureDate])

  return result.rows.map((schedule: any) => ({
    schedule,
    vehicle: { id: schedule.vehicle_id },
    is_overdue: new Date(schedule.next_service_date) < new Date(),
    days_until_due: Math.floor((new Date(schedule.next_service_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }))
}

const generateWorkOrder = async (client: any, schedule: any, telemetry: any, overrideTemplate: any) => {
  const workOrder = {
    tenant_id: schedule.tenant_id,
    vehicle_id: schedule.vehicle_id,
    type: 'preventive',
    priority: 'medium',
    description: schedule.description || schedule.name,
    estimated_cost: schedule.estimated_cost || 0,
    status: 'open',
    metadata: { schedule_id: schedule.id, ...overrideTemplate },
    created_at: new Date()
  }

  // RLS handles tenant_id, but we include it for data integrity
  const result = await client.query(
    `INSERT INTO work_orders (tenant_id, vehicle_id, type, priority, description, estimated_cost, status, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [workOrder.tenant_id, workOrder.vehicle_id, workOrder.type, workOrder.priority,
     workOrder.description, workOrder.estimated_cost, workOrder.status,
     JSON.stringify(workOrder.metadata), workOrder.created_at]
  )

  return result.rows[0].id
}

const getRecurringScheduleStats = async (client: any) => {
  // RLS handles tenant filtering
  const result = await client.query(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active,
            SUM(estimated_cost) as total_estimated_cost
     FROM maintenance_schedules`
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const paginationParams = getPaginationParams(req)
      const {
        vehicle_id,
        service_type
      } = req.query

      // Build filters - RLS handles tenant filtering
      // NOTE: RLS is not enabled on all tables in local/demo environments.
      // Always enforce tenant isolation in the query itself.
      let filters = 'WHERE tenant_id = $1'
      const params: any[] = [tenantId]
      let paramIndex = 2

      if (vehicle_id) {
        filters += `${filters ? ' AND' : 'WHERE'} vehicle_id = $${paramIndex++}`
        params.push(vehicle_id)
      }

      if (service_type) {
        filters += `${filters ? ' AND' : 'WHERE'} type = $${paramIndex++}`
        params.push(service_type)
      }

      const result = await client.query(
        `SELECT id, tenant_id, vehicle_id, name, description, type,
                interval_miles, interval_days, last_service_date, last_service_mileage,
                next_service_date, next_service_mileage, estimated_cost, estimated_duration,
                is_active, metadata, created_at, updated_at
         FROM maintenance_schedules ${filters} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, paginationParams.limit, paginationParams.offset]
      )

      const countResult = await client.query(
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
      logger.error('Get maintenance-schedules error:', error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }
      const tenantId = req.user?.tenant_id
      if (!tenantId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      // RLS handles tenant filtering
      const result = await client.query(
        `SELECT id, tenant_id, vehicle_id, name, description, type,
                interval_miles, interval_days, last_service_date, last_service_mileage,
                next_service_date, next_service_mileage, estimated_cost, estimated_duration,
                is_active, metadata, created_at, updated_at
         FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Maintenance schedule not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Get maintenance-schedules error:', error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const data = req.body

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      )

      const result = await client.query(
        `INSERT INTO maintenance_schedules (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Create maintenance-schedules error:', error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const data = req.body
      const { fields, values } = buildUpdateClause(data, 2)

      // RLS handles tenant filtering
      const result = await client.query(
        `UPDATE maintenance_schedules SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [req.params.id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Maintenance schedule not found' })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error(`Update maintenance-schedules error:`, error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // RLS handles tenant filtering
      const result = await client.query(
        `DELETE FROM maintenance_schedules WHERE id = $1 RETURNING id`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Maintenance schedule not found' })
      }

      res.json({ message: 'Maintenance schedule deleted successfully', id: result.rows[0].id })
    } catch (error) {
      logger.error('Delete maintenance-schedules error:', error)
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
  csrfProtection,
  requirePermission('maintenance_schedule:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'maintenance_schedules_recurring' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const data: CreateRecurringScheduleRequest = req.body

      // Validate recurrence pattern
      const validation = validateRecurrencePattern(data.recurrence_pattern)
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid recurrence pattern',
          errors: validation.errors
        })
      }

      // Calculate initial next service date
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
      const result = await client.query(
        `INSERT INTO maintenance_schedules (
          tenant_id, vehicle_id, name, description, type,
          interval_days, next_service_date, estimated_cost,
          is_active, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          req.user!.tenant_id,
          data.vehicle_id,
          data.name || data.service_type || 'Recurring Maintenance',
          data.description || data.notes || '',
          data.type || data.service_type || 'preventive',
          data.recurrence_pattern?.interval || 30,
          nextDue,
          data.estimated_cost || 0,
          data.is_active !== false && data.auto_create_work_order !== false,
          JSON.stringify({
            recurrence_pattern: data.recurrence_pattern,
            work_order_template: data.work_order_template,
            parts: data.parts,
            priority: data.priority
          })
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error: any) {
      logger.error(`Create recurring schedule error:`, error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// PUT /maintenance-schedules/:id/recurrence - Update recurrence pattern
router.put(
  '/:id/recurrence',
  csrfProtection,
  requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules_recurrence' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const data: UpdateRecurrencePatternRequest = req.body

      // Validate recurrence pattern
      const validation = validateRecurrencePattern(data.recurrence_pattern)
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid recurrence pattern',
          errors: validation.errors
        })
      }

      // Get existing metadata (RLS handles tenant filtering)
      const existing = await client.query(
        `SELECT metadata FROM maintenance_schedules WHERE id = $1`,
        [req.params.id]
      )

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: `Recurring schedule not found` })
      }

      const currentMetadata = existing.rows[0].metadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        recurrence_pattern: data.recurrence_pattern
      }

      const updateFields: string[] = [`metadata = $3`]
      const updateValues: any[] = [JSON.stringify(updatedMetadata)]
      let paramIndex = 4

      if (data.auto_create_work_order !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`)
        updateValues.push(data.auto_create_work_order)
        paramIndex++
      }

      if (data.work_order_template) {
        updatedMetadata.work_order_template = data.work_order_template
        updateValues[0] = JSON.stringify(updatedMetadata)
      }

      // RLS handles tenant filtering
      const result = await client.query(
        `UPDATE maintenance_schedules
         SET ${updateFields.join(`, `)}, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [req.params.id, ...updateValues]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Recurring schedule not found` })
      }

      res.json(result.rows[0])
    } catch (error: any) {
      logger.error(`Update recurrence pattern error:`, error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const {
        days_ahead = 7,
        include_overdue = 'true',
        vehicle_id,
        service_type,
        priority
      } = req.query as any

      let dueSchedules = await checkDueSchedules(
        client,
        parseInt(days_ahead),
        include_overdue === 'true'
      )

      // Apply filters
      if (vehicle_id) {
        dueSchedules = dueSchedules.filter((s) => s.vehicle.id === vehicle_id)
      }

      if (service_type) {
        dueSchedules = dueSchedules.filter((s) => s.schedule.type === service_type)
      }

      if (priority) {
        const priorityFilter = priority as string
        dueSchedules = dueSchedules.filter((s) => {
          const metadata = s.schedule.metadata || {}
          return metadata.priority === priorityFilter
        })
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
      logger.error('Get due schedules error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// POST /maintenance-schedules/:id/generate-work-order - Manual work order creation
router.post(
  '/:id/generate-work-order',
  csrfProtection,
  requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'work_orders_from_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const { override_template, skip_due_check } = req.body as ManualWorkOrderGenerationRequest

      // Get schedule (RLS handles tenant filtering)
      const scheduleResult = await client.query(
        `SELECT id, tenant_id, vehicle_id, name, description, type,
                interval_miles, interval_days, last_service_date, last_service_mileage,
                next_service_date, next_service_mileage, estimated_cost, estimated_duration,
                is_active, metadata, created_at, updated_at
         FROM maintenance_schedules WHERE id = $1`,
        [req.params.id]
      )

      if (scheduleResult.rows.length === 0) {
        return res.status(404).json({ error: `Schedule not found` })
      }

      const schedule = scheduleResult.rows[0]

      // Check if due (unless skip_due_check is true)
      if (!skip_due_check) {
        const now = new Date()
        const nextDue = new Date(schedule.next_service_date)
        if (nextDue > now) {
          return res.status(400).json({
            error: 'Schedule is not due yet',
            next_service_date: schedule.next_service_date
          })
        }
      }

      // Get vehicle telemetry (RLS handles tenant filtering)
      const telemetryResult = await client.query(
        `SELECT * FROM vehicle_telemetry_snapshots
         WHERE vehicle_id = $1
         ORDER BY snapshot_date DESC LIMIT 1`,
        [schedule.vehicle_id]
      )

      const telemetry = telemetryResult.rows[0] || undefined

      // Generate work order
      const workOrderId = await generateWorkOrder(client, schedule, telemetry, override_template)

      // Get created work order
      const workOrderResult = await client.query(
        `SELECT id, tenant_id, vehicle_id, type, priority, description, estimated_cost, actual_cost, status, created_at, updated_at, deleted_at, metadata, created_by, assigned_to FROM work_orders WHERE id = $1`,
        [workOrderId]
      )

      res.status(201).json({
        message: `Work order created successfully`,
        work_order: workOrderResult.rows[0],
        schedule: schedule
      })
    } catch (error: any) {
      logger.error('Generate work order error:', error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // Get schedule (RLS handles tenant filtering)
      const scheduleResult = await client.query(
        `SELECT id, tenant_id, vehicle_id, name, description, type,
                interval_miles, interval_days, last_service_date, last_service_mileage,
                next_service_date, next_service_mileage, estimated_cost, estimated_duration,
                is_active, metadata, created_at, updated_at
         FROM maintenance_schedules WHERE id = $1`,
        [req.params.id]
      )

      if (scheduleResult.rows.length === 0) {
        return res.status(404).json({ error: `Schedule not found` })
      }

      // Get history with work orders (RLS handles tenant filtering)
      const historyResult = await client.query(
        `SELECT
          msh.*,
          wo.work_order_number, wo.title, wo.status as work_order_status,
          wo.actual_cost, wo.completed_date
         FROM maintenance_schedule_history msh
         LEFT JOIN work_orders wo ON msh.work_order_id = wo.id
         WHERE msh.schedule_id = $1
         ORDER BY msh.created_at DESC`,
        [req.params.id]
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
      logger.error(`Get schedule history error:`, error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const stats = await getRecurringScheduleStats(client)
      res.json(stats)
    } catch (error: any) {
      logger.error('Get recurring schedule stats error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// PATCH /maintenance-schedules/:id/pause - Pause auto work order generation
router.patch(
  '/:id/pause',
  csrfProtection,
  requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules_pause' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // RLS handles tenant filtering
      const result = await client.query(
        `UPDATE maintenance_schedules
         SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Recurring schedule not found` })
      }

      res.json({
        message: `Auto work order generation paused`,
        schedule: result.rows[0]
      })
    } catch (error: any) {
      logger.error('Pause schedule error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// PATCH /maintenance-schedules/:id/resume - Resume auto work order generation
router.patch(
  '/:id/resume',
  csrfProtection,
  requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules_resume' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // RLS handles tenant filtering
      const result = await client.query(
        `UPDATE maintenance_schedules
         SET is_active = true, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Recurring schedule not found` })
      }

      res.json({
        message: `Auto work order generation resumed`,
        schedule: result.rows[0]
      })
    } catch (error: any) {
      logger.error('Resume schedule error:', error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      const {
        trigger_metric,
        is_overdue,
        vehicle_id
      } = req.query

      // RLS handles tenant filtering on the view
      let filters = ''
      const params: any[] = []
      let paramIndex = 1

      if (trigger_metric) {
        filters += `${filters ? ' AND' : 'WHERE'} trigger_metric = $${paramIndex++}`
        params.push(trigger_metric)
      }

      if (is_overdue !== undefined) {
        filters += `${filters ? ' AND' : 'WHERE'} is_overdue = $${paramIndex++}`
        params.push(is_overdue === `true`)
      }

      if (vehicle_id) {
        filters += `${filters ? ' AND' : 'WHERE'} vehicle_id = $${paramIndex++}`
        params.push(vehicle_id)
      }

      const result = await client.query(
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
      logger.error('Get multi-metric maintenance due error:', error)
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
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // RLS handles tenant filtering on the view
      const result = await client.query(
        `SELECT vehicle_id, vehicle_name, last_service_date, days_since_service, miles_since_service, next_due_date FROM vw_multi_metric_maintenance_due
         WHERE vehicle_id = $1
         ORDER BY
           CASE WHEN is_overdue THEN 0 ELSE 1 END,
           trigger_metric,
           units_until_due ASC NULLS LAST`,
        [req.params.vehicleId]
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
      logger.error(`Get vehicle multi-metric schedules error:`, error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

export default router
