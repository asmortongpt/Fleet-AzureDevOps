import { Router } from "express"
import { db } from "../db/connection"
const router = Router()

router.get("/", async (req, res) => {
  try {
    res.json({ data: [], message: "Personal use charges route - under construction" })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

export default router
