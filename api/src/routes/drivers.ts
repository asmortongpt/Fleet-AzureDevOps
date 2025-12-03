import { Router } from "express"
import { driverCreateSchema, driverUpdateSchema } from '../schemas/driver.schema';
import { validate } from '../middleware/validate';
import logger from '../config/logger'; // Wave 10: Add Winston logger
import { driverEmulator } from "../emulators/DriverEmulator"

const router = Router()

// GET all drivers
router.get("/", async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search, status } = req.query

    let drivers = driverEmulator.getAll()

    // Apply search filter
    if (search && typeof search === 'string') {
      drivers = driverEmulator.search(search)
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      drivers = drivers.filter(d => d.status === status)
    }

    // Apply pagination
    const total = drivers.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = drivers.slice(offset, offset + Number(pageSize))

    res.json({ data, total })
  } catch (error) {
    logger.error('Failed to fetch drivers', { error }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to fetch drivers" })
  }
})

// GET driver by ID
router.get("/:id", async (req, res) => {
  try {
    const driver = driverEmulator.getById(Number(req.params.id))
    if (!driver) return res.status(404).json({ error: "Driver not found" })
    res.json({ data: driver })
  } catch (error) {
    logger.error('Failed to fetch driver', { error, driverId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to fetch driver" })
  }
})

// POST create driver
router.post("/", validate(driverCreateSchema), async (req, res) => { // Wave 9: Add Zod validation
  try {
    const driver = driverEmulator.create(req.body)
    res.status(201).json({ data: driver })
  } catch (error) {
    logger.error('Failed to create driver', { error }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to create driver" })
  }
})

// PUT update driver
router.put("/:id", validate(driverUpdateSchema), async (req, res) => { // Wave 9: Add Zod validation
  try {
    const driver = driverEmulator.update(Number(req.params.id), req.body)
    if (!driver) return res.status(404).json({ error: "Driver not found" })
    res.json({ data: driver })
  } catch (error) {
    logger.error('Failed to update driver', { error, driverId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to update driver" })
  }
})

// DELETE driver
router.delete("/:id", async (req, res) => {
  try {
    const deleted = driverEmulator.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ error: "Driver not found" })
    res.json({ message: "Driver deleted successfully" })
  } catch (error) {
    logger.error('Failed to delete driver', { error, driverId: req.params.id }) // Wave 10: Winston logger
    res.status(500).json({ error: "Failed to delete driver" })
  }
})

export default router
