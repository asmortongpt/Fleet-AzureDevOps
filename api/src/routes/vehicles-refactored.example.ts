import { Router, Request, Response } from 'express'

import { inject } from '../config/container'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validate'
import { vehicleCreateSchema, vehicleUpdateSchema } from '../schemas/vehicle.schema'
import { VehicleService } from '../services/VehicleService'


const router = Router()

// Inject service via DI container
const vehicleService = inject<VehicleService>('VehicleService')

// GET /vehicles - List with pagination
router.get('/', async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId
  const { page, limit } = req.query

  const result = await vehicleService.getAllVehicles(tenantId, {
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 20,
  })

  res.json(result)
})

// POST /vehicles - Create with validation
router.post('/',csrfProtection,  csrfProtection, validate(vehicleCreateSchema), async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId
  const vehicle = await vehicleService.createVehicle(req.body, tenantId)
  res.status(201).json({ success: true, data: vehicle })
})

// PUT /vehicles/:id - Update with validation + IDOR protection
router.put('/:id',csrfProtection,  csrfProtection, validate(vehicleUpdateSchema), async (req: Request, res: Response) => {
  const { id } = req.params
  const tenantId = req.user?.tenantId

  const vehicle = await vehicleService.updateVehicle(parseInt(id), req.body, tenantId)
  res.json({ success: true, data: vehicle })
})

// DELETE /vehicles/:id - Soft delete with IDOR protection
router.delete('/:id',csrfProtection,  csrfProtection, async (req: Request, res: Response) => {
  const { id } = req.params
  const tenantId = req.user?.tenantId

  await vehicleService.deleteVehicle(parseInt(id), tenantId)
  res.json({ success: true, message: 'Vehicle deleted' })
})

export default router
