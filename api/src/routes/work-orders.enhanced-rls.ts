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
 * BEFORE: Direct query example removed('SELECT * FROM work_orde WHERE tenant_id = $1 AND tenant_id = $1', [tenantId])
 * AFTER: Using repository with RLS('SELECT * FROM work_order WHERE tenant_id = $1 /* tenant_id validated */s WHERE tenant_id = $1 /* tenant_id validated */') // RLS auto-filters by tenant
 *
 * Middleware Stack Order (CRITICAL):
 * 1. authenticateJWT - validates JWT, extracts user & tenant_id
 * 2. setTenantContext - sets PostgreSQL session variable
 * 3. preventTenantIdOverride - blocks tenant_id in request body
 * 4. validateTenantReferences - validates foreign keys belong to tenant
 * 5. Route handler - executes query using req.dbClient
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { setTenantContext } from '../middleware/tenant-context'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import { preventTenantIdOverride, validateTenantReferences, injectTenantId } from '../utils/tenant-validator'
import logger from '../config/logger'
import { z } from 'zod'
import { csrfProtection } from '../middleware/csrf'

// Import necessary repositories
import { WorkOrderRepository } from '../repositories/workOrderRepository'
import { UserRepository } from '../repositories/userRepository'

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

      const client = (req as any).dbClient
      if (!client) {
        logger.error('dbClient not available - tenant context middleware not run')
        return res.status(500).json({
          error: 'Internal server error',
          code: 'MISSING_DB_CLIENT'
        })
      }

      // Initialize repositories
      const workOrderRepository = new WorkOrderRepository(client)
      const userRepository = new UserRepository(client)

      // Get user's scope for row-level filtering (beyond RLS)
      const user = await userRepository.getUserById(req.user!.id)

      let scopeFilter = ''
      let scopeParams: any[] = []

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
      let queryParams = [...scopeParams]

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

      const result = await workOrderRepository.getWorkOrders(whereClause, queryParams, Number(limit), offset)

      const countResult = await workOrderRepository.countWorkOrders(whereClause, queryParams)

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(countResult),
          total_pages: Math.ceil(Number(countResult) / Number(limit))
        }
      })
    } catch (error) {
      logger.error('Error fetching work orders:', error)
      res.status(500).json({ error: 'Internal server error', code: 'FETCH_WORK_ORDERS_ERROR' })
    }
  }
)

/**
 * GET /work-orders/:id
 *
 * Retrieves a specific work order for the authenticated user's tenant
 * RLS automatically filters results to current tenant
 *
 * SECURITY: No WHERE tenant_id clause needed - RLS handles it
 */
router.get(
  '/:id',
  requirePermission('work_order:view:team'),
  applyFieldMasking('work_order'),
  auditLog({ action: 'READ', resourceType: 'work_order' }),
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

      const workOrderRepository = new WorkOrderRepository(client)

      const result = await workOrderRepository.getWorkOrderById(req.params.id)

      if (!result) {
        return res.status(404).json({ error: 'Work order not found', code: 'WORK_ORDER_NOT_FOUND' })
      }

      res.json(result)
    } catch (error) {
      logger.error('Error fetching work order:', error)
      res.status(500).json({ error: 'Internal server error', code: 'FETCH_WORK_ORDER_ERROR' })
    }
  }
)

/**
 * POST /work-orders
 *
 * Creates a new work order for the authenticated user's tenant
 * RLS automatically assigns the correct tenant_id
 *
 * SECURITY: No need to pass tenant_id - RLS handles it
 */
router.post(
  '/',
  requirePermission('work_order:create'),
  preventTenantIdOverride,
  validateTenantReferences,
  applyFieldMasking('work_order'),
  auditLog({ action: 'CREATE', resourceType: 'work_order' }),
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

      const workOrderRepository = new WorkOrderRepository(client)

      const parsedData = createWorkOrderSchema.safeParse(req.body)
      if (!parsedData.success) {
        return res.status(400).json({ error: 'Invalid input', code: 'INVALID_INPUT', details: parsedData.error })
      }

      const workOrderData = {
        ...parsedData.data,
        created_by: req.user!.id
      }

      const result = await workOrderRepository.createWorkOrder(workOrderData)

      res.status(201).json(result)
    } catch (error) {
      logger.error('Error creating work order:', error)
      res.status(500).json({ error: 'Internal server error', code: 'CREATE_WORK_ORDER_ERROR' })
    }
  }
)

/**
 * PUT /work-orders/:id
 *
 * Updates an existing work order for the authenticated user's tenant
 * RLS automatically filters results to current tenant
 *
 * SECURITY: No WHERE tenant_id clause needed - RLS handles it
 */
router.put(
  '/:id',
  requirePermission('work_order:update'),
  preventTenantIdOverride,
  validateTenantReferences,
  applyFieldMasking('work_order'),
  auditLog({ action: 'UPDATE', resourceType: 'work_order' }),
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

      const workOrderRepository = new WorkOrderRepository(client)

      const parsedData = createWorkOrderSchema.partial().safeParse(req.body)
      if (!parsedData.success) {
        return res.status(400).json({ error: 'Invalid input', code: 'INVALID_INPUT', details: parsedData.error })
      }

      const workOrderData = {
        ...parsedData.data,
        updated_by: req.user!.id
      }

      const result = await workOrderRepository.updateWorkOrder(req.params.id, workOrderData)

      if (!result) {
        return res.status(404).json({ error: 'Work order not found', code: 'WORK_ORDER_NOT_FOUND' })
      }

      res.json(result)
    } catch (error) {
      logger.error('Error updating work order:', error)
      res.status(500).json({ error: 'Internal server error', code: 'UPDATE_WORK_ORDER_ERROR' })
    }
  }
)

/**
 * DELETE /work-orders/:id
 *
 * Deletes a specific work order for the authenticated user's tenant
 * RLS automatically filters results to current tenant
 *
 * SECURITY: No WHERE tenant_id clause needed - RLS handles it
 */
router.delete(
  '/:id',
  requirePermission('work_order:delete'),
  auditLog({ action: 'DELETE', resourceType: 'work_order' }),
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

      const workOrderRepository = new WorkOrderRepository(client)

      const result = await workOrderRepository.deleteWorkOrder(req.params.id)

      if (!result) {
        return res.status(404).json({ error: 'Work order not found', code: 'WORK_ORDER_NOT_FOUND' })
      }

      res.status(204).send()
    } catch (error) {
      logger.error('Error deleting work order:', error)
      res.status(500).json({ error: 'Internal server error', code: 'DELETE_WORK_ORDER_ERROR' })
    }
  }
)

export default router


This refactored version of the `work-orders.enhanced-rls.ts` file eliminates all direct database queries by using repository methods. The `WorkOrderRepository` and `UserRepository` are imported and used to handle database operations. The business logic and tenant_id filtering are maintained throughout the refactoring process.