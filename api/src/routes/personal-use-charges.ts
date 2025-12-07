import { Router } from "express"
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { db } from "../db/connection"
import { csrfProtection } from '../middleware/csrf'

const router = Router()

router.get("/", asyncHandler(async (req, res) => {
  try {
    res.json({ data: [], message: "Personal use charges route - under construction" })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
}))

export default router
