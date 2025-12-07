import { Router } from "express"
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError } from '../errors/app-error'
import logger from '../config/logger'
import { fuelTransactionEmulator } from '../emulators/FuelTransactionEmulator'
import pool from '../config/database'
import { validate } from '../middleware/validation'
import { csrfProtection } from '../middleware/csrf'

import {
  createFuelTransactionSchema,
  updateFuelTransactionSchema,
  getFuelTransactionsQuerySchema
} from '../schemas/fuel-transactions.schema'

const router = Router()
// TEMPORARY: Disable DB validation to allow API to start
// const db = container.resolve('db')
// const validator = new TenantValidator(db)

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

    if (search && typeof search === 'string') {
      transactions = fuelTransactionEmulator.search(search)
    }

    if (vehicleId && typeof vehicleId === 'string') {
      transactions = fuelTransactionEmulator.filterByVehicle(Number(vehicleId))
    }

    if (driverId && typeof driverId === 'string') {
      transactions = fuelTransactionEmulator.filterByDriver(Number(driverId))
    }

    if (paymentMethod && typeof paymentMethod === 'string') {
      transactions = fuelTransactionEmulator.filterByPaymentMethod(paymentMethod)
    }

    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      transactions = fuelTransactionEmulator.filterByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
    }

    const total = transactions.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = transactions.slice(offset, offset + Number(pageSize))

    res.json({ data, total })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: "Failed to fetch fuel transactions" })
  }
})

// GET fuel transaction by ID
router.get("/:id", asyncHandler(async (req, res) => {
  try {
    const transaction = fuelTransactionEmulator.getById(Number(req.params.id))
    if (!transaction) throw new NotFoundError("Fuel transaction not found")
    res.json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch fuel transaction" })
  }
}))

// POST create fuel transaction
router.post("/", csrfProtection, validate(createFuelTransactionSchema, 'body'), async (req, res) => {
  try {
    const transaction = fuelTransactionEmulator.create(req.body)
    res.status(201).json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to create fuel transaction" })
  }
})

// PUT update fuel transaction
router.put("/:id", csrfProtection, validate(updateFuelTransactionSchema, 'body'), async (req, res) => {
  try {
    const { vehicle_id, driver_id } = req.body

    // Validate vehicle ownership if vehicle_id is provided
    if (vehicle_id) {
      const vehicleCheck = await pool.query(
        'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [vehicle_id, (req as any).user?.tenant_id]
      )
      if (vehicleCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Vehicle Id not found or access denied'
        })
      }
    }

    // Validate driver ownership if driver_id is provided
    if (driver_id) {
      const driverCheck = await pool.query(
        'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
        [driver_id, (req as any).user?.tenant_id]
      )
      if (driverCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Driver Id not found or access denied'
        })
      }
    }

    const transaction = fuelTransactionEmulator.update(Number(req.params.id), req.body)
    if (!transaction) throw new NotFoundError("Fuel transaction not found")
    res.json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to update fuel transaction" })
  }
})

// DELETE fuel transaction
router.delete("/:id", csrfProtection, asyncHandler(async (req, res) => {
  try {
    const deleted = fuelTransactionEmulator.delete(Number(req.params.id))
    if (!deleted) throw new NotFoundError("Fuel transaction not found")
    res.json({ message: "Fuel transaction deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete fuel transaction" })
  }
}))

export default router
