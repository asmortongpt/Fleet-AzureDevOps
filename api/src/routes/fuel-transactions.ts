import { Router } from "express"
import { fuelTransactionEmulator } from "../emulators/FuelTransactionEmulator"

const router = Router()

// GET all fuel transactions
router.get("/", async (req, res) => {
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
      transactions = fuelTransactionEmulator.filterByVehicle(Number(vehicleId))
    }

    // Apply driver filter
    if (driverId && typeof driverId === 'string') {
      transactions = fuelTransactionEmulator.filterByDriver(Number(driverId))
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
    const data = transactions.slice(offset, offset + Number(pageSize))

    res.json({ data, total })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch fuel transactions" })
  }
})

// GET fuel transaction by ID
router.get("/:id", async (req, res) => {
  try {
    const transaction = fuelTransactionEmulator.getById(Number(req.params.id))
    if (!transaction) return res.status(404).json({ error: "Fuel transaction not found" })
    res.json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch fuel transaction" })
  }
})

// POST create fuel transaction
router.post("/", async (req, res) => {
  try {
    const transaction = fuelTransactionEmulator.create(req.body)
    res.status(201).json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to create fuel transaction" })
  }
})

// PUT update fuel transaction
router.put("/:id", async (req, res) => {
  try {
    const transaction = fuelTransactionEmulator.update(Number(req.params.id), req.body)
    if (!transaction) return res.status(404).json({ error: "Fuel transaction not found" })
    res.json({ data: transaction })
  } catch (error) {
    res.status(500).json({ error: "Failed to update fuel transaction" })
  }
})

// DELETE fuel transaction
router.delete("/:id", async (req, res) => {
  try {
    const deleted = fuelTransactionEmulator.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ error: "Fuel transaction not found" })
    res.json({ message: "Fuel transaction deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete fuel transaction" })
  }
})

export default router
