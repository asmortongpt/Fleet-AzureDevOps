import { Router } from "express"

import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

router.get("/", asyncHandler(async (req, res) => {
  res.json({ data: [], message: "tasks endpoint working" })
}))

router.get("/:id", asyncHandler(async (req, res) => {
  res.json({ data: null, id: req.params.id })
}))

router.post("/", csrfProtection, asyncHandler(async (req, res) => {
  res.status(201).json({ data: req.body, message: "Created" })
}))

router.put("/:id", csrfProtection, asyncHandler(async (req, res) => {
  res.json({ data: req.body, id: req.params.id, message: "Updated" })
}))

router.delete("/:id", csrfProtection, asyncHandler(async (req, res) => {
  res.json({ message: "Deleted", id: req.params.id })
}))

export default router
