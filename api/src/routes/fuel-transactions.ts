import { Router, Request, Response } from "express"
import { container } from '../container'
import { TYPES } from '../types'
import { FueltransactionService } from '../services/FuelTransactionService'
import { NotFoundError } from '../errors/app-error'
import { doubleCsrfProtection as csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { validate } from '../middleware/validation'
import {
  createFuelTransactionSchema,
  updateFuelTransactionSchema,
  getFuelTransactionsQuerySchema
} from '../schemas/fuel-transactions.schema'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

// SECURITY: All routes require authentication
router.use(authenticateJWT)

// GET all fuel transactions
router.get("/", validate(getFuelTransactionsQuerySchema, 'query'), asyncHandler(async (req: Request, res: Response) => {
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

  const tenantId = (req as any).user?.tenant_id
  if (!tenantId) throw new Error('Tenant ID is required')

  const service = container.get<FueltransactionService>(TYPES.FuelTransactionService)

  // In a real implementation Service would handle filters
  // For now getting all and filtering in memory or ideally upgrading Service to support filters
  // Passing filters to service (assuming service update in future)
  const transactions = await service.getAll(tenantId, { search, vehicleId, driverId, paymentMethod, startDate, endDate })

  const total = transactions.length
  const offset = (Number(page) - 1) * Number(pageSize)
  const data = transactions.slice(offset, offset + Number(pageSize))

  res.json({ data, total })
}))

// GET fuel transaction by ID
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const service = container.get<FueltransactionService>(TYPES.FuelTransactionService)
  const tenantId = (req as any).user?.tenant_id
  const transaction = await service.getById(Number(req.params.id), tenantId)

  if (!transaction) throw new NotFoundError("Fuel transaction not found")
  res.json({ data: transaction })
}))

// POST create fuel transaction
router.post("/", csrfProtection, validate(createFuelTransactionSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
  const service = container.get<FueltransactionService>(TYPES.FuelTransactionService)
  const tenantId = (req as any).user?.tenant_id
  const transaction = await service.create(req.body, tenantId)
  res.status(201).json({ data: transaction })
}))

// PUT update fuel transaction
// Note: Verification of vehicle/driver ownership should ideally be in Service or Middleware
router.put("/:id", csrfProtection, validate(updateFuelTransactionSchema, 'body'), asyncHandler(async (req: Request, res: Response) => {
  const service = container.get<FueltransactionService>(TYPES.FuelTransactionService)
  const tenantId = (req as any).user?.tenant_id

  const transaction = await service.update(Number(req.params.id), req.body, tenantId)
  if (!transaction) throw new NotFoundError("Fuel transaction not found")
  res.json({ data: transaction })
}))

// DELETE fuel transaction
router.delete("/:id", csrfProtection, asyncHandler(async (req: Request, res: Response) => {
  const service = container.get<FueltransactionService>(TYPES.FuelTransactionService)
  const tenantId = (req as any).user?.tenant_id
  const deleted = await service.delete(Number(req.params.id), tenantId)

  if (!deleted) throw new NotFoundError("Fuel transaction not found")
  res.json({ message: "Fuel transaction deleted successfully" })
}))

export default router
