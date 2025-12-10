import { Router } from "express"
import { z } from 'zod'

import logger from '../config/logger'
import { container } from '../container'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac'
import { validateBody, validateParams, validateQuery } from '../middleware/validate'
import { FuelRepository } from '../repositories/FuelRepository'
import {
  createFuelTransactionSchema,
  updateFuelTransactionSchema,
  getFuelTransactionsQuerySchema
} from '../schemas/fuel-transactions.schema'
import { TYPES } from '../types'

const router = Router()
const fuelRepository = container.get<FuelRepository>(TYPES.FuelRepository)

const fuelIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number)
})

// SECURITY: All routes require authentication
router.use(authenticateJWT)

// GET all fuel transactions
// ARCHITECTURE: Repository Pattern with tenant isolation and pagination
router.get("/",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.FUEL_READ],
    enforceTenantIsolation: true,
    resourceType: 'fuel'
  }),
  validateQuery(getFuelTransactionsQuerySchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    const {
      page = 1,
      pageSize = 20,
      search,
      vehicleId,
      driverId,
      paymentMethod,
      startDate,
      endDate
    } = req.query

    let result: { data: any[], total: number }

    // ARCHITECTURE: Use repository methods instead of emulator
    if (search && typeof search === 'string') {
      result = await fuelRepository.search(search, tenantId, Number(page), Number(pageSize))
    } else if (vehicleId && typeof vehicleId === 'string') {
      result = await fuelRepository.findByVehicle(Number(vehicleId), tenantId, Number(page), Number(pageSize))
    } else if (driverId && typeof driverId === 'string') {
      result = await fuelRepository.findByDriver(Number(driverId), tenantId, Number(page), Number(pageSize))
    } else if (paymentMethod && typeof paymentMethod === 'string') {
      result = await fuelRepository.findByPaymentMethod(paymentMethod, tenantId, Number(page), Number(pageSize))
    } else if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      result = await fuelRepository.findByDateRange(
        new Date(startDate),
        new Date(endDate),
        tenantId,
        Number(page),
        Number(pageSize)
      )
    } else {
      result = await fuelRepository.findAllPaginated(tenantId, Number(page), Number(pageSize))
    }

    logger.info('Fetched fuel transactions', { tenantId, count: result.data.length, total: result.total })
    res.json(result)
  })
)

// GET fuel transaction by ID
// ARCHITECTURE: Repository Pattern with tenant isolation
router.get("/:id",
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER, Role.GUEST],
    permissions: [PERMISSIONS.FUEL_READ],
    enforceTenantIsolation: true,
    resourceType: 'fuel'
  }),
  validateParams(fuelIdSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const id = Number(req.params.id)

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // ARCHITECTURE: Use repository method with tenant isolation
    const transaction = await fuelRepository.findById(id, tenantId)

    if (!transaction) {
      throw new NotFoundError(`Fuel transaction ${id} not found`)
    }

    logger.info('Fetched fuel transaction', { id, tenantId })
    res.json({ data: transaction })
  })
)

// POST create fuel transaction
// ARCHITECTURE: Repository Pattern with tenant isolation
router.post("/",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FUEL_CREATE],
    enforceTenantIsolation: true,
    resourceType: 'fuel'
  }),
  validateBody(createFuelTransactionSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // ARCHITECTURE: Use repository method with tenant isolation
    const transaction = await fuelRepository.create(req.body, tenantId)

    logger.info('Fuel transaction created', { id: transaction.id, tenantId })
    res.status(201).json({ data: transaction })
  })
)

// PUT update fuel transaction
// ARCHITECTURE: Repository Pattern with tenant isolation
router.put("/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FUEL_UPDATE],
    enforceTenantIsolation: true,
    resourceType: 'fuel'
  }),
  validateParams(fuelIdSchema),
  validateBody(updateFuelTransactionSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const id = Number(req.params.id)

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // ARCHITECTURE: Use repository method with tenant isolation
    const transaction = await fuelRepository.update(id, req.body, tenantId)

    if (!transaction) {
      throw new NotFoundError(`Fuel transaction ${id} not found`)
    }

    logger.info('Fuel transaction updated', { id, tenantId })
    res.json({ data: transaction })
  })
)

// DELETE fuel transaction
// ARCHITECTURE: Repository Pattern with tenant isolation
router.delete("/:id",
  csrfProtection,
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.FUEL_DELETE],
    enforceTenantIsolation: true,
    resourceType: 'fuel'
  }),
  validateParams(fuelIdSchema),
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).user?.tenant_id
    const id = Number(req.params.id)

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required')
    }

    // ARCHITECTURE: Use repository method with tenant isolation
    const deleted = await fuelRepository.delete(id, tenantId)

    if (!deleted) {
      throw new NotFoundError(`Fuel transaction ${id} not found`)
    }

    logger.info('Fuel transaction deleted', { id, tenantId })
    res.json({ message: "Fuel transaction deleted successfully" })
  })
)

export default router
