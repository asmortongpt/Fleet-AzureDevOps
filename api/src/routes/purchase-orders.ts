import { Router } from "express"
const router = Router()

router.get("/", async (req, res) => {
  res.json({ data: [], message: "purchase-orders endpoint working" })
})

router.get("/:id", async (req, res) => {
  res.json({ data: null, id: req.params.id })
})

router.post("/", async (req, res) => {
  res.status(201).json({ data: req.body, message: "Created" })
})

router.put("/:id", async (req, res) => {
  res.json({ data: req.body, id: req.params.id, message: "Updated" })
})

router.delete("/:id", async (req, res) => {
  res.json({ message: "Deleted", id: req.params.id })
})

export default router
