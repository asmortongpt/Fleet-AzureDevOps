import { Router } from "express"
import { db } from "../db/connection"
import { vehicles } from "../db/schema"
import { eq, like, or, and, desc } from "drizzle-orm"

const router = Router()

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search } = req.query
    let query = db.select().from(vehicles)

    if (search) {
      query = query.where(or(
        like(vehicles.vehicleNumber, `%${search}%`),
        like(vehicles.make, `%${search}%`),
        like(vehicles.model, `%${search}%`)
      ))
    }

    const offset = (Number(page) - 1) * Number(pageSize)
    const data = await query.limit(Number(pageSize)).offset(offset)
    const total = await db.select().from(vehicles)

    res.json({ data, total: total.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch vehicles" })
  }
})

// GET vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, Number(req.params.id))).limit(1)
    if (!vehicle.length) return res.status(404).json({ error: "Not found" })
    res.json({ data: vehicle[0] })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vehicle" })
  }
})

// POST create vehicle
router.post("/", async (req, res) => {
  try {
    const result = await db.insert(vehicles).values(req.body).returning()
    res.status(201).json({ data: result[0] })
  } catch (error) {
    res.status(500).json({ error: "Failed to create vehicle" })
  }
})

// PUT update vehicle
router.put("/:id", async (req, res) => {
  try {
    const result = await db.update(vehicles).set(req.body).where(eq(vehicles.id, Number(req.params.id))).returning()
    if (!result.length) return res.status(404).json({ error: "Not found" })
    res.json({ data: result[0] })
  } catch (error) {
    res.status(500).json({ error: "Failed to update vehicle" })
  }
})

// DELETE vehicle
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(vehicles).where(eq(vehicles.id, Number(req.params.id)))
    res.json({ message: "Deleted" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete vehicle" })
  }
})

export default router
