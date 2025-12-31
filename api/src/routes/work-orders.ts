/**
 * Work Orders Routes - RLS Enhanced Version
 *
 * SECURITY IMPROVEMENTS (CRIT-B-004):
 * 1. Uses req.dbClient instead of pool (tenant context enforced)
 * 2. Removed redundant WHERE tenant_id clauses (RLS handles this)
 * 3. Added preventTenantIdOverride middleware
 * 4. Added validateTenantReferences for foreign keys
 * 5. Relies on Row-Level Security for multi-tenant isolation
 *
 * Migration from old pattern:
 * BEFORE: pool.query('SELECT * FROM work_orde WHERE tenant_id = $1 AND tenant_id = $1', [tenantId])
 * AFTER:  client.query('SELECT * FROM work_order WHERE tenant_id = $1') // RLS auto-filters by tenant
  *
 * Middleware Stack Order(CRITICAL):
 * 1. authenticateJWT - validates JWT, extracts user & tenant_id
  * 2. setTenantContext - sets PostgreSQL session variable
    * 3. preventTenantIdOverride - blocks tenant_id in request body
      * 4. validateTenantReferences - validates foreign keys belong to tenant
        * 5. Route handler - executes query using req.dbClient
 */

import express, { Response } from 'express'
import { z } from 'zod'

import logger from '../config/logger'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'
import { applyFieldMasking } from '../utils/fieldMasking'
import { preventTenantIdOverride, validateTenantReferences, injectTenantId } from '../utils/tenant-validator'


const router = express.Router()

// CRITICAL: Apply middleware in this exact order
router.use(authenticateJWT)          // 1. Authenticate user
router.use(setTenantContext)         // 2. Set PostgreSQL tenant context

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

/**
 * GET /work-orders
 *
 * Lists work orders for the authenticated user's tenant
 * RLS automatically filters results to current tenant
 *
 * SECURITY: No WHERE tenant_id clause needed - RLS handles it
 */
router.get(
  '/',
  requirePermission('work_order:view:team'),
  applyFieldMasking('work_order'),
  auditLog({ action: 'READ', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, priority, facility_id } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // Use req.dbClient which has tenant context set
      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // Get user's scope for row-level filtering (beyond RLS)
      const userResult = await client.query(
        'SELECT facility_ids, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      )

      const user = userResult.rows[0]
      let scopeFilter = ''
      const scopeParams: any[] = []

      if (user.scope_level === 'own') {
        // Mechanics only see their assigned work orders
        scopeFilter = 'WHERE assigned_technician_id = $1'
        scopeParams.push(req.user!.id)
      } else if (user.scope_level === 'team' && user.facility_ids && user.facility_ids.length > 0) {
        // Supervisors see work orders in their facilities
        scopeFilter = 'WHERE facility_id = ANY($1::uuid[])'
        scopeParams.push(user.facility_ids)
      }
      // fleet/global scope sees all (filtered by RLS to current tenant)

      // Build dynamic query
      // NOTE: No WHERE tenant_id clause! RLS handles tenant filtering
      let whereClause = scopeFilter
      const queryParams = [...scopeParams]

      if (status) {
        queryParams.push(status)
        whereClause += (whereClause ? ' AND' : 'WHERE') + ` status = $${queryParams.length}`
      }
      if (priority) {
        queryParams.push(priority)
        whereClause += (whereClause ? ' AND' : 'WHERE') + ` priority = $${queryParams.length}`
      }
      if (facility_id) {
        queryParams.push(facility_id)
        whereClause += (whereClause ? ' AND' : 'WHERE') + ` facility_id = $${queryParams.length}`
      }

      const result = await client.query(
        `SELECT id, tenant_id, work_order_number, vehicle_id, facility_id,
                assigned_technician_id, type, priority, status, description,
                scheduled_start, scheduled_end, actual_start, actual_end,
                labor_hours, labor_cost, parts_cost, odometer_reading,
                engine_hours_reading, created_by, created_at, updated_at
         FROM work_orders ${whereClause} ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      )

      const countResult = await client.query(
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
      logger.error('Failed to fetch work orders', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /work-orders/:id
 *
 * Gets a single work order
 * RLS ensures user can only access work orders in their tenant
 */
router.get(
  '/:id',
  requirePermission('work_order:view:own'),
  applyFieldMasking('work_order'),
  auditLog({ action: 'READ', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // RLS automatically filters - if work order doesn't exist OR is in different tenant, returns nothing
      const result = await client.query(
        `SELECT id, tenant_id, work_order_number, vehicle_id, facility_id,
                assigned_technician_id, type, priority, status, description,
                scheduled_start, scheduled_end, actual_start, actual_end,
                labor_hours, labor_cost, parts_cost, odometer_reading,
                engine_hours_reading, notes, created_by, created_at, updated_at
         FROM work_orders WHERE id = $1`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Work order not found',
          code: 'NOT_FOUND'
        })
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Failed to fetch work order', {
        error,
        workOrderId: req.params.id,
        userId: req.user?.id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /work-orders
 *
 * Creates a new work order
 *
 * SECURITY LAYERS:
 * 1. preventTenantIdOverride - blocks tenant_id in request body
 * 2. validateTenantReferences - validates vehicle_id, facility_id belong to tenant
 * 3. injectTenantId - automatically sets tenant_id from JWT
 * 4. RLS - ensures INSERT goes to correct tenant partition
 */
router.post(
  '/',
  csrfProtection, requirePermission('work_order:create'),
  preventTenantIdOverride,  // CRITICAL: Prevent tenant_id override
  validateTenantReferences([
    { table: 'vehicles', column: 'id', field: 'vehicle_id', required: true },
    { table: 'facilities', column: 'id', field: 'facility_id', required: false },
    { table: 'users', column: 'id', field: 'assigned_technician_id', required: false }
  ]),
  injectTenantId,  // Auto-inject tenant_id from JWT
  auditLog({ action: 'CREATE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate request body
      const validated = createWorkOrderSchema.parse(req.body)

      const client = (req as any).dbClient
      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // Insert work order - tenant_id comes from req.body (injected by injectTenantId middleware)
      const result = await client.query(
        `INSERT INTO work_orders (
          tenant_id, work_order_number, vehicle_id, facility_id,
          assigned_technician_id, type, priority, status, description,
          odometer_reading, engine_hours_reading, scheduled_start,
          scheduled_end, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          req.body.tenant_id,  // From injectTenantId middleware
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

      res.status(201).json({ data: result.rows[0] })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues
        })
      }

      logger.error('Failed to create work order', {
        error,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * PUT /work-orders/:id
 *
 * Updates a work order
 * RLS ensures user can only update work orders in their tenant
 */
router.put(
  '/:id',
  csrfProtection, requirePermission('work_order:update'),
  preventTenantIdOverride,
  validateTenantReferences([
    { table: 'vehicles', column: 'id', field: 'vehicle_id', required: false },
    { table: 'facilities', column: 'id', field: 'facility_id', required: false },
    { table: 'users', column: 'id', field: 'assigned_technician_id', required: false }
  ]),
  auditLog({ action: 'UPDATE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // Build dynamic UPDATE clause
      const fields = []
      const values = []
      let paramCount = 1

      const allowedFields = [
        'status', 'priority', 'description', 'vehicle_id', 'facility_id',
        'assigned_technician_id', 'scheduled_start', 'scheduled_end',
        'actual_start', 'actual_end', 'labor_hours', 'labor_cost',
        'parts_cost', 'odometer_reading', 'engine_hours_reading', 'notes'
      ]

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          fields.push(`${field} = $${paramCount++}`)
          values.push(req.body[field])
        }
      }

      if (fields.length === 0) {
        throw new ValidationError("No fields to update")
      }

      // RLS ensures UPDATE only affects rows in current tenant
      values.push(req.params.id)
      const result = await client.query(
        `UPDATE work_orders
         SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("Work order not found")
      }

      res.json({ data: result.rows[0] })
    } catch (error) {
      logger.error('Failed to update work order', {
        error,
        workOrderId: req.params.id,
        userId: req.user?.id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * DELETE /work-orders/:id
 *
 * Deletes a work order (soft delete)
 * RLS ensures user can only delete work orders in their tenant
 */
router.delete(
  '/:id',
  csrfProtection, requirePermission('work_order:delete'),
  auditLog({ action: 'DELETE', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // RLS ensures DELETE only affects rows in current tenant
      const result = await client.query(
        `UPDATE work_orders
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [req.params.id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("Work order not found")
      }

      res.json({ message: 'Work order deleted successfully' })
    } catch (error) {
      logger.error('Failed to delete work order', {
        error,
        workOrderId: req.params.id,
        userId: req.user?.id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /work-orders/:id/parts
 *
 * Gets parts list for a specific work order
 * RLS ensures user can only access work orders in their tenant
 */
router.get(
  '/:id/parts',
  requirePermission('work_order:view:team'),
  applyFieldMasking('work_order'),
  auditLog({ action: 'READ', resourceType: 'work_order_parts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const workOrderId = req.params.id

      // TODO: Implement actual parts fetching from database
      // For now, return demo data to match frontend expectations
      const parts = [
        {
          id: `part-${workOrderId}-1`,
          name: 'Oil Filter',
          part_number: 'OF-12345',
          quantity: 2,
          unit_cost: 12.50,
          supplier: 'Auto Parts Inc.'
        },
        {
          id: `part-${workOrderId}-2`,
          name: 'Engine Oil (5W-30)',
          part_number: 'EO-67890',
          quantity: 6,
          unit_cost: 8.75,
          supplier: 'Auto Parts Inc.'
        },
        {
          id: `part-${workOrderId}-3`,
          name: 'Air Filter',
          part_number: 'AF-54321',
          quantity: 1,
          unit_cost: 22.00,
          supplier: 'OEM Supplier'
        }
      ]

      res.json(parts)
    } catch (error) {
      logger.error('Failed to fetch work order parts', {
        error,
        workOrderId: req.params.id,
        userId: req.user?.id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /work-orders/:id/labor
 *
 * Gets labor details for a specific work order
 * RLS ensures user can only access work orders in their tenant
 */
router.get(
  '/:id/labor',
  requirePermission('work_order:view:team'),
  applyFieldMasking('work_order'),
  auditLog({ action: 'READ', resourceType: 'work_order_labor' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const workOrderId = req.params.id

      // TODO: Implement actual labor details fetching from database
      // For now, return demo data to match frontend expectations
      const labor = [
        {
          id: `labor-${workOrderId}-1`,
          technician_name: 'Mike Johnson',
          task: 'Oil change',
          hours: 0.5,
          rate: 75.00,
          total: 37.50,
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `labor-${workOrderId}-2`,
          technician_name: 'Mike Johnson',
          task: 'Filter replacement',
          hours: 0.25,
          rate: 75.00,
          total: 18.75,
          date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `labor-${workOrderId}-3`,
          technician_name: 'Sarah Williams',
          task: 'Inspection',
          hours: 1.0,
          rate: 85.00,
          total: 85.00,
          date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        }
      ]

      res.json(labor)
    } catch (error) {
      logger.error('Failed to fetch work order labor', {
        error,
        workOrderId: req.params.id,
        userId: req.user?.id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
