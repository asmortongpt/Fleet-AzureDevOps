import { Router } from "express"

import logger from '../config/logger'
import { fuelTransactionEmulator } from '../emulators/fuel/FuelEmulator'
import { NotFoundError } from '../errors/app-error'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { validate } from '../middleware/validation'
import {
  createFuelTransactionSchema,
  updateFuelTransactionSchema,
  getFuelTransactionsQuerySchema
} from '../schemas/fuel-transactions.schema'

const router = Router()

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
