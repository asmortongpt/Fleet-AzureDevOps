import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, validateScope } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// Validation schema for work order creation
const createWorkOrderSchema = z.object({
  work_order_number: z.string(),
  vehicle_id: z.string().uuid(),
  facility_id: z.string().uuid().optional(),
  assigned_technician_id: z.string().uuid().optional(),
  type: z.enum(['preventive', 'corrective', 'inspection']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('open'),
  description: z.string().min(1),
  odometer_reading: z.number().optional(),
  engine_hours_reading: z.number().optional(),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  notes: z.string().optional()
})

// GET /work-orders
router.get(
  '/',
  requirePermission('work_order:view:team'),
  applyFieldMasking('work_order'),
  auditLog({ action: 'READ', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, priority, facility_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Get user's scope for row-level filtering
      const userResult = await pool.query(
        'SELECT facility_ids, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      let scopeParams: any[] = [req.user!.tenant_id]

      if (user.scope_level === 'own') {
        // Mechanics only see their assigned work orders
        scopeFilter = 'AND assigned_technician_id = $2'
        scopeParams.push(req.user!.id)
      } else if (user.scope_level === 'team' && user.facility_ids && user.facility_ids.length > 0) {
        // Supervisors see work orders in their facilities
        scopeFilter = 'AND facility_id = ANY($2::uuid[])'
        scopeParams.push(user.facility_ids)
      }
      // fleet/global scope sees all

      // Build dynamic query
      let whereClause = `WHERE tenant_id = $1 ${scopeFilter}`
      let queryParams = [...scopeParams]

      if (status) {
        queryParams.push(status)
        whereClause += ` AND status = $${queryParams.length}`
      }
      if (priority) {
        queryParams.push(priority)
        whereClause += ` AND priority = $${queryParams.length}`
      }
      if (facility_id) {
        queryParams.push(facility_id)
        whereClause += ` AND facility_id = $${queryParams.length}`
      }

      const result = await pool.query(
        `SELECT id, tenant_id, work_order_number, vehicle_id, facility_id,
                assigned_technician_id, type, priority, status, description,
                scheduled_start, scheduled_end, actual_start, actual_end,
                labor_hours, labor_cost, parts_cost, odometer_reading,
                engine_hours_reading, created_by, created_at, updated_at
         FROM work_orders ${whereClause} ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM work_orders ${whereClause}`,
        queryParams
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
      console.error('Get work-orders error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /work-orders/:id
router.get(
  '/:id',
  requirePermission('work_order:view:own'),
  validateScope('work_order'), // BOLA protection: validate user has access based on scope (own/team/fleet)
  applyFieldMasking('work_order'),
  auditLog({ action: 'READ', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, work_order_number, vehicle_id, facility_id,
                assigned_technician_id, type, priority, status, description,
                scheduled_start, scheduled_end, actual_start, actual_end,
                labor_hours, labor_cost, parts_cost, notes, odometer_reading,
                engine_hours_reading, created_by, created_at, updated_at
         FROM work_orders WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Work order not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get work-order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /work-orders
router.post(
  '/',
  requirePermission('work_order:create:team'),
  auditLog({ action: 'CREATE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = createWorkOrderSchema.parse(req.body)

      // Validate facility_id is in user's scope
      if (validated.facility_id) {
        const userResult = await pool.query(
          'SELECT facility_ids, scope_level FROM users WHERE id = $1',
          [req.user!.id]
        )
        const user = userResult.rows[0]

        if (user.scope_level === 'team' && user.facility_ids) {
          if (!user.facility_ids.includes(validated.facility_id)) {
            return res.status(403).json({
              error: 'Cannot create work order for facility outside your scope'
            })
          }
        }
      }

      const result = await pool.query(
        `INSERT INTO work_orders (
          tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
          type, priority, status, description, odometer_reading, engine_hours_reading,
          scheduled_start, scheduled_end, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          req.user!.tenant_id,
          validated.work_order_number,
          validated.vehicle_id,
          validated.facility_id || null,
          validated.assigned_technician_id || null,
          validated.type,
          validated.priority,
          validated.status,
          validated.description,
          validated.odometer_reading || null,
          validated.engine_hours_reading || null,
          validated.scheduled_start || null,
          validated.scheduled_end || null,
          validated.notes || null,
          req.user!.id
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Create work-order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /work-orders/:id/complete
router.put(
  '/:id/complete',
  requirePermission('work_order:complete:own'),
  auditLog({ action: 'COMPLETE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { labor_hours, labor_cost, parts_cost, notes } = req.body

      // Verify work order is assigned to current user
      const checkResult = await pool.query(
        'SELECT assigned_technician_id FROM work_orders WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Work order not found' })
      }

      if (checkResult.rows[0].assigned_technician_id !== req.user!.id) {
        return res.status(403).json({
          error: 'You can only complete work orders assigned to you'
        })
      }

      const result = await pool.query(
        `UPDATE work_orders SET
           status = 'completed',
           actual_end = NOW(),
           labor_hours = $3,
           labor_cost = $4,
           parts_cost = $5,
           notes = COALESCE(notes, '') || ' ' || COALESCE($6, ''),
           updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, labor_hours, labor_cost, parts_cost, notes]
      )

      res.json(result.rows[0])
    } catch (error) {
      console.error('Complete work-order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /work-orders/:id/approve
router.put(
  '/:id/approve',
  requirePermission('work_order:approve:fleet'),
  auditLog({ action: 'APPROVE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check for self-approval (SoD)
      const checkResult = await pool.query(
        'SELECT created_by FROM work_orders WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Work order not found' })
      }

      if (checkResult.rows[0].created_by === req.user!.id) {
        return res.status(403).json({
          error: 'Separation of Duties violation: You cannot approve work orders you created'
        })
      }

      const result = await pool.query(
        `UPDATE work_orders SET
           status = 'approved',
           updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id]
      )

      res.json(result.rows[0])
    } catch (error) {
      console.error('Approve work-order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /work-orders/:id
router.delete(
  '/:id',
  requirePermission('work_order:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'DELETE FROM work_orders WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Work order not found' })
      }

      res.json({ message: 'Work order deleted successfully' })
    } catch (error) {
      console.error('Delete work-order error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
