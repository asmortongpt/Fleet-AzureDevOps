import { Router } from "express"
import { vehicleEmulator } from "../emulators/VehicleEmulator"

const router = Router()

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search, status } = req.query

    let vehicles = vehicleEmulator.getAll()

    // Apply search filter
    if (search && typeof search === 'string') {
      vehicles = vehicleEmulator.search(search)
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      vehicles = vehicleEmulator.filterByStatus(status)
    }

    // Apply pagination
    const total = vehicles.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = vehicles.slice(offset, offset + Number(pageSize))

    res.json({ data, total })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch vehicles" })
  }
})

// GET vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = vehicleEmulator.getById(Number(req.params.id))
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" })
    res.json({ data: vehicle })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vehicle" })
  }
})

// POST create vehicle
router.post("/", async (req, res) => {
  try {
    const vehicle = vehicleEmulator.create(req.body)
    res.status(201).json({ data: vehicle })
  } catch (error) {
    res.status(500).json({ error: "Failed to create vehicle" })
  }
})

// PUT update vehicle
router.put("/:id", async (req, res) => {
  try {
    const vehicle = vehicleEmulator.update(Number(req.params.id), req.body)
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" })
    res.json({ data: vehicle })
  } catch (error) {
    res.status(500).json({ error: "Failed to update vehicle" })
  }
})

// DELETE vehicle
router.delete("/:id", async (req, res) => {
  try {
    const deleted = vehicleEmulator.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ error: "Vehicle not found" })
    res.json({ message: "Vehicle deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete vehicle" })
  }
})

export default router
