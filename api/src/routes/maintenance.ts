import { Router } from "express"
import { maintenanceRecordEmulator } from "../emulators/MaintenanceRecordEmulator"

const router = Router()

// GET all maintenance records
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search,
      serviceType,
      status,
      category,
      vehicleNumber,
      startDate,
      endDate
    } = req.query

    let records = maintenanceRecordEmulator.getAll()

    // Apply search filter
    if (search && typeof search === 'string') {
      records = maintenanceRecordEmulator.search(search)
    }

    // Apply service type filter
    if (serviceType && typeof serviceType === 'string') {
      records = maintenanceRecordEmulator.filterByServiceType(serviceType)
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      records = maintenanceRecordEmulator.filterByStatus(status)
    }

    // Apply category filter
    if (category && typeof category === 'string') {
      records = maintenanceRecordEmulator.filterByCategory(category)
    }

    // Apply vehicle number filter
    if (vehicleNumber && typeof vehicleNumber === 'string') {
      records = maintenanceRecordEmulator.filterByVehicle(vehicleNumber)
    }

    // Apply date range filter
    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      records = maintenanceRecordEmulator.filterByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
    }

    // Apply pagination
    const total = records.length
    const offset = (Number(page) - 1) * Number(pageSize)
    const data = records.slice(offset, offset + Number(pageSize))

    res.json({ data, total })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch maintenance records" })
  }
})

// GET maintenance record by ID
router.get("/:id", async (req, res) => {
  try {
    const record = maintenanceRecordEmulator.getById(Number(req.params.id))
    if (!record) return res.status(404).json({ error: "Maintenance record not found" })
    res.json({ data: record })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch maintenance record" })
  }
})

// GET maintenance records by vehicle ID
router.get("/vehicle/:vehicleId", async (req, res) => {
  try {
    const records = maintenanceRecordEmulator.getByVehicleId(Number(req.params.vehicleId))
    res.json({ data: records, total: records.length })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vehicle maintenance records" })
  }
})

// POST create maintenance record
router.post("/", async (req, res) => {
  try {
    const record = maintenanceRecordEmulator.create(req.body)
    res.status(201).json({ data: record })
  } catch (error) {
    res.status(500).json({ error: "Failed to create maintenance record" })
  }
})

// PUT update maintenance record
router.put("/:id", async (req, res) => {
  try {
    const record = maintenanceRecordEmulator.update(Number(req.params.id), req.body)
    if (!record) return res.status(404).json({ error: "Maintenance record not found" })
    res.json({ data: record })
  } catch (error) {
    res.status(500).json({ error: "Failed to update maintenance record" })
  }
})

// DELETE maintenance record
router.delete("/:id", async (req, res) => {
  try {
    const deleted = maintenanceRecordEmulator.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ error: "Maintenance record not found" })
    res.json({ message: "Maintenance record deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete maintenance record" })
  }
})

export default router
