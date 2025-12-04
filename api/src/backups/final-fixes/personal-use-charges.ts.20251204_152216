import { Router } from "express"
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { db } from "../db/connection"
const router = Router()

router.get("/", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  try {
    res.json({ data: [], message: "Personal use charges route - under construction" }))
  } catch (error) {
    res.status(500).json({ error: "Server error" }))
  }
}))

export default router
