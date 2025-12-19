import { Router } from "express"

import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

router.get("/", asyncHandler(async (req, res) => {
  try {
    res.json({ data: [], message: "Personal use charges route - under construction" })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
}))

export default router
