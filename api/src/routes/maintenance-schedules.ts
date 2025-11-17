import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import {
  checkDueSchedules,
  generateWorkOrder,
  getRecurringScheduleStats,
  validateRecurrencePattern,
  calculateNextDueDate
} from '../services/recurring-maintenance'
import {
  CreateRecurringScheduleRequest,
  UpdateRecurrencePatternRequest,
  GetDueSchedulesRequest,
  ManualWorkOrderGenerationRequest
} from '../types/maintenance'

const router = express.Router()
router.use(authenticateJWT)

// GET /maintenance-schedules
router.get(
  '/',
  requirePermission('maintenance_schedule:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await pool.query(
        `SELECT * FROM maintenance_schedules WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user!.tenant_id, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM maintenance_schedules WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get maintenance-schedules error:', error)
      res.status(500).json({ error: 'Internal server error' })
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
        'SELECT * FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'MaintenanceSchedules not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get maintenance-schedules error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /maintenance-schedules
router.post(
  '/',
  requirePermission('maintenance_schedule:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const columns = Object.keys(data)
      const values = Object.values(data)

      const placeholders = values.map((_, i) => `$${i + 2}`).join(', ')
      const columnNames = ['tenant_id', ...columns].join(', ')

      const result = await pool.query(
        `INSERT INTO maintenance_schedules (${columnNames}) VALUES ($1, ${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create maintenance-schedules error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /maintenance-schedules/:id
router.put(
  '/:id',
  requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const fields = Object.keys(data).map((key, i) => `${key} = $${i + 3}`).join(', ')
      const values = Object.values(data)

      const result = await pool.query(
        `UPDATE maintenance_schedules SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'MaintenanceSchedules not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update maintenance-schedules error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /maintenance-schedules/:id
router.delete(
  '/:id',
  requirePermission('maintenance_schedule:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'maintenance_schedules' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'MaintenanceSchedules not found' })
      }

      res.json({ message: 'MaintenanceSchedules deleted successfully' })
    } catch (error) {
      console.error('Delete maintenance-schedules error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// RECURRING MAINTENANCE ENDPOINTS
// ============================================================================

// POST /maintenance-schedules/recurring - Create recurring schedule
router.post(
  '/recurring',
  requirePermission('maintenance_schedule:create:fleet'),
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
      console.error('Create recurring schedule error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

// PUT /maintenance-schedules/:id/recurrence - Update recurrence pattern
router.put(
  '/:id/recurrence',
  requirePermission('maintenance_schedule:update:fleet'),
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

      const updateFields: string[] = ['recurrence_pattern = $3']
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
         SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_recurring = true
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...updateValues]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Recurring schedule not found' })
      }

      res.json(result.rows[0])
    } catch (error: any) {
      console.error('Update recurrence pattern error:', error)
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
  requirePermission('maintenance_schedule:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'work_orders_from_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { override_template, skip_due_check } = req.body as ManualWorkOrderGenerationRequest

      // Get schedule
      const scheduleResult = await pool.query(
        'SELECT * FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (scheduleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' })
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
        'SELECT * FROM work_orders WHERE id = $1',
        [workOrderId]
      )

      res.status(201).json({
        message: 'Work order created successfully',
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
        'SELECT * FROM maintenance_schedules WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (scheduleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' })
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
      const totalWorkOrders = historyResult.rows.filter((h) => h.status === 'success').length
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
      console.error('Get schedule history error:', error)
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
  requirePermission('maintenance_schedule:update:fleet'),
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
        return res.status(404).json({ error: 'Recurring schedule not found' })
      }

      res.json({
        message: 'Auto work order generation paused',
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
  requirePermission('maintenance_schedule:update:fleet'),
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
        return res.status(404).json({ error: 'Recurring schedule not found' })
      }

      res.json({
        message: 'Auto work order generation resumed',
        schedule: result.rows[0]
      })
    } catch (error: any) {
      console.error('Resume schedule error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

export default router
