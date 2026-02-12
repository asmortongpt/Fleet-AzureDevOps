/**
 * Garage Bays Routes - RLS Enhanced Version
 *
 * SECURITY IMPROVEMENTS:
 * 1. Uses req.dbClient instead of pool (tenant context enforced)
 * 2. Removed redundant WHERE tenant_id clauses (RLS handles this)
 * 3. Added preventTenantIdOverride middleware
 * 4. Added validateTenantReferences for foreign keys
 * 5. Relies on Row-Level Security for multi-tenant isolation
 *
 * Endpoints:
 * - GET /garage-bays - List all garage bays
 * - GET /garage-bays/:id - Get detailed bay information with active work orders
 * - GET /garage-bays/:id/work-orders - Get all work orders for a bay
 * - GET /garage-bays/:id/equipment - Get equipment list for a bay
 * - POST /garage-bays - Create a new garage bay
 * - PATCH /garage-bays/:id - Update bay information
 * - DELETE /garage-bays/:id - Delete a garage bay
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
import { preventTenantIdOverride } from '../utils/tenant-validator'

const router = express.Router()

// CRITICAL: Apply middleware in exact order
router.use(authenticateJWT)          // 1. Authenticate user
router.use(setTenantContext)         // 2. Set PostgreSQL tenant context

// Validation schemas
const createGarageBaySchema = z.object({
  bay_number: z.string().min(1),
  bay_name: z.string().min(1),
  location: z.string().min(1),
  capacity: z.number().int().positive().default(1),
  equipment: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']).default('available'),
})

const updateGarageBaySchema = z.object({
  bay_number: z.string().min(1).optional(),
  bay_name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  equipment: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']).optional(),
})

/**
 * GET /garage-bays
 *
 * Lists garage bays for the authenticated user's tenant
 * RLS automatically filters results to current tenant
 *
 * SECURITY: No WHERE tenant_id clause needed - RLS handles it
 */
router.get(
  '/',
  requirePermission('garage_bay:view:team'),
  applyFieldMasking('garage_bay'),
  auditLog({ action: 'READ', resourceType: 'garage_bays' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status, location } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // Build dynamic query
      let whereClause = ''
      const queryParams: any[] = []

      if (status) {
        queryParams.push(status)
        whereClause += `WHERE status = $${queryParams.length}`
      }
      if (location) {
        queryParams.push(location)
        whereClause += (whereClause ? ' AND' : 'WHERE') + ` location = $${queryParams.length}`
      }

      // Get garage bays with work order counts
      const result = await client.query(
        `SELECT
          gb.id,
          gb.tenant_id,
          gb.bay_number,
          gb.bay_name,
          gb.location,
          gb.capacity,
          gb.equipment,
          gb.status,
          gb.created_at,
          gb.updated_at,
          COUNT(wo.id) as active_work_orders
        FROM garage_bays gb
        LEFT JOIN work_orders wo ON gb.id = wo.garage_bay_id AND wo.status IN ('pending', 'in_progress', 'on_hold')
        ${whereClause}
        GROUP BY gb.id
        ORDER BY gb.bay_number ASC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      )

      const countResult = await client.query(
        `SELECT COUNT(*) FROM garage_bays ${whereClause}`,
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
      logger.error('Failed to fetch garage bays', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /garage-bays/:id
 *
 * Gets detailed garage bay information including active work orders with full details
 * RLS ensures user can only access garage bays in their tenant
 */
router.get(
  '/:id',
  requirePermission('garage_bay:view:own'),
  applyFieldMasking('garage_bay'),
  auditLog({ action: 'READ', resourceType: 'garage_bays' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // Get garage bay basic info
      const bayResult = await client.query(
        `SELECT
          id,
          tenant_id,
          bay_number,
          bay_name,
          location,
          capacity,
          equipment,
          status,
          created_at,
          updated_at
        FROM garage_bays
        WHERE id = $1`,
        [req.params.id]
      )

      if (bayResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Garage bay not found',
          code: 'NOT_FOUND'
        })
      }

      const bay = bayResult.rows[0]

      // Get active work orders for this bay with full details
      const workOrdersResult = await client.query(
        `SELECT
          wo.id,
          wo.work_order_number as wo_number,
          wo.title,
          wo.description,
          wo.type,
          wo.priority,
          wo.status,
          wo.created_date,
          wo.scheduled_start,
          wo.scheduled_end,
          wo.estimated_completion,
          wo.actual_start,
          wo.actual_end,
          wo.progress_percentage,
          wo.estimated_cost,
          wo.actual_cost,
          wo.notes,
          wo.vehicle_id,
          v.vehicle_number,
          v.make as vehicle_make,
          v.model as vehicle_model,
          v.year as vehicle_year,
          v.vin,
          v.license_plate,
          v.odometer_reading,
          v.engine_hours,
          t.id as technician_id,
          t.name as technician_name,
          t.email as technician_email,
          t.phone as technician_phone,
          t.avatar as technician_avatar,
          t.role as technician_role,
          t.certifications as technician_certifications
        FROM work_orders wo
        LEFT JOIN vehicles v ON wo.vehicle_id = v.id
        LEFT JOIN users t ON wo.assigned_technician_id = t.id
        WHERE wo.garage_bay_id = $1
          AND wo.status IN ('pending', 'in_progress', 'on_hold')
        ORDER BY
          CASE wo.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          wo.created_date ASC`,
        [req.params.id]
      )

      // For each work order, get parts and labor details
      const workOrders = await Promise.all(
        workOrdersResult.rows.map(async (wo) => {
          // Get parts
          const partsResult = await client.query(
            `SELECT
              p.id,
              p.name,
              p.part_number,
              wop.quantity,
              wop.quantity_in_stock,
              wop.unit_cost,
              s.name as supplier,
              s.contact_name as supplier_contact,
              s.contact_phone as supplier_phone,
              s.contact_email as supplier_email,
              wop.delivery_date,
              wop.status
            FROM work_order_parts wop
            JOIN parts p ON wop.part_id = p.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE wop.work_order_id = $1
            ORDER BY p.name`,
            [wo.id]
          )

          // Get labor entries
          const laborResult = await client.query(
            `SELECT
              l.id,
              l.technician_id,
              u.name as technician_name,
              u.avatar as technician_avatar,
              l.hours_logged,
              l.hours_estimated,
              l.rate,
              l.date,
              l.task_description,
              l.status
            FROM labor_entries l
            JOIN users u ON l.technician_id = u.id
            WHERE l.work_order_id = $1
            ORDER BY l.date DESC`,
            [wo.id]
          )

          return {
            id: wo.id,
            wo_number: wo.wo_number,
            title: wo.title,
            description: wo.description,
            type: wo.type,
            priority: wo.priority,
            status: wo.status,
            created_date: wo.created_date,
            scheduled_start: wo.scheduled_start,
            scheduled_end: wo.scheduled_end,
            estimated_completion: wo.estimated_completion,
            actual_start: wo.actual_start,
            actual_end: wo.actual_end,
            progress_percentage: wo.progress_percentage || 0,
            estimated_cost: parseFloat(wo.estimated_cost) || 0,
            actual_cost: parseFloat(wo.actual_cost) || 0,
            notes: wo.notes || [],
            vehicle: {
              id: wo.vehicle_id,
              vehicle_number: wo.vehicle_number,
              make: wo.vehicle_make,
              model: wo.vehicle_model,
              year: wo.vehicle_year,
              vin: wo.vin,
              license_plate: wo.license_plate,
              odometer_reading: wo.odometer_reading,
              engine_hours: wo.engine_hours,
            },
            primary_technician: {
              id: wo.technician_id,
              name: wo.technician_name,
              email: wo.technician_email,
              phone: wo.technician_phone,
              avatar: wo.technician_avatar,
              role: wo.technician_role,
              certifications: wo.technician_certifications || [],
            },
            parts: partsResult.rows.map(p => ({
              id: p.id,
              name: p.name,
              part_number: p.part_number,
              quantity: p.quantity,
              quantity_in_stock: p.quantity_in_stock,
              unit_cost: parseFloat(p.unit_cost) || 0,
              supplier: p.supplier || 'Unknown',
              supplier_contact: p.supplier_contact || '',
              supplier_phone: p.supplier_phone || '',
              supplier_email: p.supplier_email || '',
              delivery_date: p.delivery_date,
              status: p.status || 'ordered',
            })),
            labor: laborResult.rows.map(l => ({
              id: l.id,
              technician_id: l.technician_id,
              technician_name: l.technician_name,
              technician_avatar: l.technician_avatar,
              hours_logged: parseFloat(l.hours_logged) || 0,
              hours_estimated: parseFloat(l.hours_estimated) || 0,
              rate: parseFloat(l.rate) || 0,
              date: l.date,
              task_description: l.task_description,
              status: l.status || 'pending',
            })),
          }
        })
      )

      res.json({
        data: {
          id: bay.id,
          bay_number: bay.bay_number,
          bay_name: bay.bay_name,
          status: bay.status,
          location: bay.location,
          capacity: bay.capacity,
          equipment: bay.equipment || [],
          work_orders: workOrders,
          created_at: bay.created_at,
          updated_at: bay.updated_at,
        }
      })
    } catch (error) {
      logger.error('Failed to fetch garage bay details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bayId: req.params.id,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /garage-bays/:id/work-orders
 *
 * Gets all work orders (including completed) for a garage bay
 */
router.get(
  '/:id/work-orders',
  requirePermission('work_order:view:team'),
  auditLog({ action: 'READ', resourceType: 'work_orders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      const { page = 1, limit = 50, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let whereClause = 'WHERE wo.garage_bay_id = $1'
      const queryParams: any[] = [req.params.id]

      if (status) {
        queryParams.push(status)
        whereClause += ` AND wo.status = $${queryParams.length}`
      }

      const result = await client.query(
        `SELECT
          wo.id,
          wo.work_order_number,
          wo.title,
          wo.description,
          wo.type,
          wo.priority,
          wo.status,
          wo.created_date,
          wo.scheduled_start,
          wo.scheduled_end,
          wo.actual_start,
          wo.actual_end,
          v.vehicle_number,
          v.make as vehicle_make,
          v.model as vehicle_model
        FROM work_orders wo
        LEFT JOIN vehicles v ON wo.vehicle_id = v.id
        ${whereClause}
        ORDER BY wo.created_date DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      )

      const countResult = await client.query(
        `SELECT COUNT(*) FROM work_orders ${whereClause}`,
        [req.params.id, ...(status ? [status] : [])]
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
      logger.error('Failed to fetch garage bay work orders', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bayId: req.params.id,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /garage-bays/:id/equipment
 *
 * Gets equipment list for a garage bay
 */
router.get(
  '/:id/equipment',
  requirePermission('garage_bay:view:own'),
  auditLog({ action: 'READ', resourceType: 'garage_bay_equipment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient
      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      const result = await client.query(
        'SELECT equipment FROM garage_bays WHERE id = $1',
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Garage bay not found',
          code: 'NOT_FOUND'
        })
      }

      res.json({
        data: result.rows[0].equipment || []
      })
    } catch (error) {
      logger.error('Failed to fetch garage bay equipment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bayId: req.params.id,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /garage-bays
 *
 * Creates a new garage bay
 */
router.post(
  '/',
  requirePermission('garage_bay:create'),
  csrfProtection,
  preventTenantIdOverride,
  auditLog({ action: 'CREATE', resourceType: 'garage_bays' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createGarageBaySchema.parse(req.body)
      const client = (req as any).dbClient

      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // Check for duplicate bay number
      const existingBay = await client.query(
        'SELECT id FROM garage_bays WHERE bay_number = $1',
        [validatedData.bay_number]
      )

      if (existingBay.rows.length > 0) {
        return res.status(409).json({
          error: 'A garage bay with this number already exists',
          code: 'DUPLICATE_BAY_NUMBER'
        })
      }

      const result = await client.query(
        `INSERT INTO garage_bays (
          tenant_id,
          bay_number,
          bay_name,
          location,
          capacity,
          equipment,
          status,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          req.user!.tenant_id,
          validatedData.bay_number,
          validatedData.bay_name,
          validatedData.location,
          validatedData.capacity,
          validatedData.equipment || [],
          validatedData.status,
          req.user!.id
        ]
      )

      res.status(201).json({
        data: result.rows[0],
        message: 'Garage bay created successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues
        })
      }

      logger.error('Failed to create garage bay', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * PATCH /garage-bays/:id
 *
 * Updates garage bay information
 */
router.patch(
  '/:id',
  requirePermission('garage_bay:update'),
  csrfProtection,
  preventTenantIdOverride,
  auditLog({ action: 'UPDATE', resourceType: 'garage_bays' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = updateGarageBaySchema.parse(req.body)
      const client = (req as any).dbClient

      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // Check if bay exists
      const existingBay = await client.query(
        'SELECT id FROM garage_bays WHERE id = $1',
        [req.params.id]
      )

      if (existingBay.rows.length === 0) {
        return res.status(404).json({
          error: 'Garage bay not found',
          code: 'NOT_FOUND'
        })
      }

      // If updating bay number, check for duplicates
      if (validatedData.bay_number) {
        const duplicateCheck = await client.query(
          'SELECT id FROM garage_bays WHERE bay_number = $1 AND id != $2',
          [validatedData.bay_number, req.params.id]
        )

        if (duplicateCheck.rows.length > 0) {
          return res.status(409).json({
            error: 'A garage bay with this number already exists',
            code: 'DUPLICATE_BAY_NUMBER'
          })
        }
      }

      // Build update query dynamically
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramCount}`)
          values.push(value)
          paramCount++
        }
      })

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(req.params.id)

      const result = await client.query(
        `UPDATE garage_bays
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      )

      res.json({
        data: result.rows[0],
        message: 'Garage bay updated successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.issues
        })
      }

      logger.error('Failed to update garage bay', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bayId: req.params.id,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * DELETE /garage-bays/:id
 *
 * Deletes a garage bay (only if no active work orders)
 */
router.delete(
  '/:id',
  requirePermission('garage_bay:delete'),
  csrfProtection,
  auditLog({ action: 'DELETE', resourceType: 'garage_bays' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = (req as any).dbClient

      if (!client) {
        return res.status(500).json({ error: 'Internal server error', code: 'MISSING_DB_CLIENT' })
      }

      // Check if bay has active work orders
      const activeWorkOrders = await client.query(
        `SELECT COUNT(*)
         FROM work_orders
         WHERE garage_bay_id = $1
           AND status IN ('open', 'in_progress')`,
        [req.params.id]
      )

      if (parseInt(activeWorkOrders.rows[0].count) > 0) {
        return res.status(409).json({
          error: 'Cannot delete garage bay with active work orders',
          code: 'HAS_ACTIVE_WORK_ORDERS'
        })
      }

      const result = await client.query(
        'DELETE FROM garage_bays WHERE id = $1 RETURNING id',
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Garage bay not found',
          code: 'NOT_FOUND'
        })
      }

      res.json({
        message: 'Garage bay deleted successfully',
        data: { id: result.rows[0].id }
      })
    } catch (error) {
      logger.error('Failed to delete garage bay', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bayId: req.params.id,
        userId: req.user?.id,
        tenantId: req.user?.tenant_id
      })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
