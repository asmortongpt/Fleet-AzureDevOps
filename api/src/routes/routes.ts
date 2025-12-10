import express, { Response } from 'express'
import { RouteRepository } from '../repositories/RouteRepository'
import { DriverRepository } from '../repositories/DriverRepository'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger' // Wave 17: Add Winston logger
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { TenantValidator } from '../utils/tenant-validator'
import { csrfProtection } from '../middleware/csrf'
import { connectionManager } from '../config/connection-manager'

const router = express.Router()
const routeRepo = new RouteRepository()
const driverRepo = new DriverRepository()
const pool = connectionManager.getWritePool()
const validator = new TenantValidator(pool)

router.use(authenticateJWT)

// GET /routes
router.get(
  '/',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const tenantId = req.user!.tenant_id

      // Row-level filtering: check if user is a driver
      const driver = await driverRepo.findOne(
        { user_id: req.user!.id, tenant_id: tenantId }
      )

      let result

      // If user is a driver, filter to only their routes
      if (driver) {
        result = await routeRepo.findByDriver(
          driver.id,
          tenantId,
          { page: Number(page), limit: Number(limit) }
        )
      } else {
        // Fleet manager/admin - show all routes
        result = await routeRepo.findByTenant(
          tenantId,
          { page: Number(page), limit: Number(limit) }
        )
      }

      res.json(result)
    } catch (error) {
      logger.error('Get routes error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/:id
router.get(
  '/:id',
  requirePermission('route:view:own', {
    customCheck: async (req: AuthRequest) => {
      // IDOR check: verify the route belongs to the user if they're a driver
      const driver = await driverRepo.findOne({
        user_id: req.user!.id,
        tenant_id: req.user!.tenant_id
      })

      // If user is not a driver, allow access (fleet managers/admins)
      if (!driver) {
        return true
      }

      // If user is a driver, verify the route belongs to them
      return await routeRepo.routeBelongsToDriver(
        req.params.id,
        driver.id,
        req.user!.tenant_id
      )
    }
  }),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const route = await routeRepo.findByIdAndTenant(
        req.params.id,
        req.user!.tenant_id
      )

      if (!route) {
        return res.status(404).json({ error: 'Routes not found' })
      }

      res.json(route)
    } catch (error) {
      logger.error('Get routes error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /routes
router.post(
  '/',
  csrfProtection,
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // SECURITY: Validate foreign keys belong to tenant (if provided)
      const { vehicle_id, driver_id } = data

      if (vehicle_id && !(await validator.validateVehicle(vehicle_id, req.user!.tenant_id))) {
        return res.status(403).json({
          success: false,
          error: 'Vehicle Id not found or access denied'
        })
      }
      if (driver_id && !(await validator.validateDriver(driver_id, req.user!.tenant_id))) {
        return res.status(403).json({
          success: false,
          error: 'Driver Id not found or access denied'
        })
      }

      const route = await routeRepo.createRoute(req.user!.tenant_id, data)

      res.status(201).json(route)
    } catch (error) {
      logger.error('Create routes error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /routes/:id

// SECURITY: Allow-list for updateable fields (prevents mass assignment)
const ALLOWED_UPDATE_FIELDS = [
  'notes',
  'status',
  'start_location',
  'end_location',
  'waypoints',
  'distance'
]

router.put(
  '/:id',
  csrfProtection,
  requirePermission('route:update:fleet', {
    customCheck: async (req: AuthRequest) => {
      // Prevent modifying completed routes
      const status = await routeRepo.getRouteStatus(
        req.params.id,
        req.user!.tenant_id
      )

      if (!status) {
        return false
      }

      // Block updates to completed routes
      if (status === 'completed') {
        return false
      }

      return true
    }
  }),
  auditLog({ action: 'UPDATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // SECURITY: IDOR Protection - Validate foreign keys belong to tenant
      const { vehicle_id, driver_id } = data

      if (vehicle_id && !(await validator.validateVehicle(vehicle_id, req.user!.tenant_id))) {
        return res.status(403).json({
          success: false,
          error: 'Vehicle Id not found or access denied'
        })
      }
      if (driver_id && !(await validator.validateDriver(driver_id, req.user!.tenant_id))) {
        return res.status(403).json({
          success: false,
          error: 'Driver Id not found or access denied'
        })
      }

      const route = await routeRepo.updateRoute(
        req.params.id,
        req.user!.tenant_id,
        data
      )

      res.json(route)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: 'Routes not found' })
      }
      logger.error('Update routes error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /routes/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('route:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await routeRepo.deleteRoute(
        req.params.id,
        req.user!.tenant_id
      )

      if (!deleted) {
        throw new NotFoundError('Routes not found')
      }

      res.json({ message: 'Routes deleted successfully' })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: 'Routes not found' })
      }
      logger.error('Delete routes error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
