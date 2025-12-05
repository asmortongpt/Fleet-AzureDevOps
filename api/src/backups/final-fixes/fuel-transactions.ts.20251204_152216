import { Router } from "express"
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 16: Add Winston logger
import { fuelTransactionEmulator } import { TenantValidator } from '../utils/tenant-validator';
import { validate } from '../middleware/validation'
import {
  createFuelTransactionSchema,
  updateFuelTransactionSchema,
  getFuelTransactionsQuerySchema
} from '../schemas/fuel-transactions.schema'

const router = Router()
const validator = new TenantValidator(db);

// GET all fuel transactions
router.get("/", validate(getFuelTransactionsQuerySchema, 'query'), async (req, res) => {
  try {
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

    let transactions = fuelTransactionEmulator.getAll()

    // Apply search filter
    if (search && typeof search === 'string') {
      transactions = fuelTransactionEmulator.search(search)
    }

    // Apply vehicle filter
    if (vehicleId && typeof vehicleId === 'string') {
      transactions = fuelTransactionEmulator.filterByVehicle(Number(vehicleId)
    }

    // Apply driver filter
    if (driverId && typeof driverId === 'string') {
      transactions = fuelTransactionEmulator.filterByDriver(Number(driverId)
    }

    // Apply payment method filter
    if (paymentMethod && typeof paymentMethod === 'string') {
      transactions = fuelTransactionEmulator.filterByPaymentMethod(paymentMethod)
    }

    // Apply date range filter
    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      transactions = fuelTransactionEmulator.filterByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
    }

    // Apply pagination
    const total = transactions.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = transactions.slice(offset, offset + Number(pageSize)

    res.json({ data, total })
  } catch (error) {
    logger.error(error) // Wave 16: Winston logger
    res.status(500).json({ error: "Failed to fetch fuel transactions" })
  }
})

// GET fuel transaction by ID
router.get("/:id", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  try {
    const transaction = fuelTransactionEmulator.getById(Number(req.params.id)
    if (!transaction) return throw new NotFoundError("Fuel transaction not found")
    res.json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch fuel transaction" })
  }
})

// POST create fuel transaction
router.post("/", validate(createFuelTransactionSchema, 'body'), async (req, res) => {
  try {
    const transaction = fuelTransactionEmulator.create(req.body)
    res.status(201).json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to create fuel transaction" })
  }
})

// PUT update fuel transaction
router.put("/:id", validate(updateFuelTransactionSchema, 'body'), async (req, res) => {
  try {
    const transaction = fuelTransactionEmulator.update(Number(req.params.id), req.body)

    // SECURITY: IDOR Protection - Validate foreign keys belong to tenant
    const { vehicle_id, driver_id } = data

    if (vehicle_id && !(await validator.validateVehicle(vehicle_id, req.user!.tenant_id)) {
      return res.status(403).json({
        success: false,
        error: 'Vehicle Id not found or access denied'
      })
    }
    if (driver_id && !(await validator.validateDriver(driver_id, req.user!.tenant_id)) {
      return res.status(403).json({
        success: false,
        error: 'Driver Id not found or access denied'
      })
    }
    if (!transaction) return throw new NotFoundError("Fuel transaction not found")
    res.json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to update fuel transaction" })
  }
})

// DELETE fuel transaction
router.delete("/:id", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  try {
    const deleted = fuelTransactionEmulator.delete(Number(req.params.id)
    if (!deleted) return throw new NotFoundError("Fuel transaction not found")
    res.json({ message: "Fuel transaction deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete fuel transaction" })
  }
})

export default router

// IDOR Protection for UPDATE
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  // Validate ownership before update
  const validator = new TenantValidator(pool);
  const isValid = await validator.validateOwnership(tenantId, 'fuel_transactions', parseInt(id);

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Access denied - resource not found or belongs to different tenant'
    });
  }

  // Proceed with update...
  const data = req.body;
  // ... existing update logic
});

// IDOR Protection for DELETE
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  // Validate ownership before delete
  const validator = new TenantValidator(pool);
  const isValid = await validator.validateOwnership(tenantId, 'fuel_transactions', parseInt(id);

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Access denied - resource not found or belongs to different tenant'
    });
  }

  // Proceed with soft delete...
  // ... existing delete logic
});
