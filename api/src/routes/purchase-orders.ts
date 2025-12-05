import { Router } from "express"
import { csrfProtection } from '../middleware/csrf'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
const router = Router()

router.get("/", asyncHandler(async (req, res) => {
  res.json({ data: [], message: "purchase-orders endpoint working" }))
}))

router.get("/:id", asyncHandler(async (req, res) => {
  res.json({ data: null, id: req.params.id }))
}))

router.post("/",csrfProtection,  csrfProtection, asyncHandler(async (req, res) => {
  res.status(201).json({ data: req.body, message: "Created" }))
}))

router.put("/:id",csrfProtection,  csrfProtection, asyncHandler(async (req, res) => {
  res.json({ data: req.body, id: req.params.id, message: "Updated" }))
}))

router.delete("/:id",csrfProtection,  csrfProtection, asyncHandler(async (req, res) => {
  res.json({ message: "Deleted", id: req.params.id }))
}))

export default router
