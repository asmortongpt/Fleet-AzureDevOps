import { Router } from "express"
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
const router = Router()

router.get("/", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  res.json({ data: [], message: "parts endpoint working" }))
}))

router.get("/:id", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  res.json({ data: null, id: req.params.id }))
}))

router.post("/", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  res.status(201).json({ data: req.body, message: "Created" }))
}))

router.put("/:id", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  res.json({ data: req.body, id: req.params.id, message: "Updated" }))
}))

router.delete("/:id", asyncHandler(async (req, res) => {
// TODO: const service = container.resolve('"Service"')
  res.json({ message: "Deleted", id: req.params.id }))
}))

export default router
