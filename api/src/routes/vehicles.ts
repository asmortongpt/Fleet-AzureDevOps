import { Router } from "express"
import { vehicles } from "../db/schema"
import { eq, like, or, and, desc } from "drizzle-orm"
import { authenticateToken, requireRole } from "../middleware/auth"
import { drizzle } from "drizzle-orm/node-postgres"
import { pool } from "../config/database"

// Lazy-load db connection to avoid initialization issues
const getDb = () => drizzle(pool)

const router = Router()

// GET all vehicles with pagination, filtering, sorting
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search, status, make, sortBy = 'vehicleNumber', sortOrder = 'asc' } = req.query
    const db = getDb()
    let query = db.select().from(vehicles)

    // Apply filters
    const filters = []
    if (search) {
      filters.push(or(
        like(vehicles.vehicleNumber, `%${search}%`),
        like(vehicles.make, `%${search}%`),
        like(vehicles.model, `%${search}%`),
        like(vehicles.vin, `%${search}%`)
      ))
    }
    if (status) filters.push(eq(vehicles.status, status as string))
    if (make) filters.push(eq(vehicles.make, make as string))

    if (filters.length > 0) {
      query = query.where(and(...filters))
    }

    // Apply sorting
    const sortColumn = vehicles[sortBy as keyof typeof vehicles]
    query = sortOrder === 'desc' ? query.orderBy(desc(sortColumn)) : query.orderBy(sortColumn)

    // Apply pagination
    const offset = (Number(page) - 1) * Number(pageSize)
    query = query.limit(Number(pageSize)).offset(offset)

    const data = await query
    const total = await db.select({ count: vehicles.id }).from(vehicles)

    res.json({
      data,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: total[0]?.count || 0,
        totalPages: Math.ceil((total[0]?.count || 0) / Number(pageSize))
      }
    })
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    res.status(500).json({ error: "Failed to fetch vehicles" })
  }
})

// GET vehicle by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, Number(id))).limit(1)

    if (!vehicle.length) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    res.json({ data: vehicle[0] })
  } catch (error) {
    console.error("Error fetching vehicle:", error)
    res.status(500).json({ error: "Failed to fetch vehicle" })
  }
})

// POST create vehicle
router.post("/", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const vehicleData = req.body
    const result = await db.insert(vehicles).values(vehicleData).returning()
    res.status(201).json({ data: result[0], message: "Vehicle created successfully" })
  } catch (error) {
    console.error("Error creating vehicle:", error)
    res.status(500).json({ error: "Failed to create vehicle" })
  }
})

// PUT update vehicle
router.put("/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { id } = req.params
    const vehicleData = req.body
    const result = await db.update(vehicles)
      .set({ ...vehicleData, updatedAt: new Date() })
      .where(eq(vehicles.id, Number(id)))
      .returning()

    if (!result.length) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    res.json({ data: result[0], message: "Vehicle updated successfully" })
  } catch (error) {
    console.error("Error updating vehicle:", error)
    res.status(500).json({ error: "Failed to update vehicle" })
  }
})

// DELETE vehicle
router.delete("/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.delete(vehicles).where(eq(vehicles.id, Number(id))).returning()

    if (!result.length) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    res.json({ message: "Vehicle deleted successfully" })
  } catch (error) {
    console.error("Error deleting vehicle:", error)
    res.status(500).json({ error: "Failed to delete vehicle" })
  }
})

export default router
