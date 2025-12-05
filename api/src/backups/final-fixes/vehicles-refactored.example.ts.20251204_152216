import { Router, Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { inject } from '../config/container'
import { VehicleService } from '../services/VehicleService'
import { validate } from '../middleware/validate'
import { vehicleCreateSchema, vehicleUpdateSchema } from '../schemas/vehicle.schema'

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
router.post('/', validate(vehicleCreateSchema), async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId
  const vehicle = await vehicleService.createVehicle(req.body, tenantId)
  res.status(201).json({ success: true, data: vehicle })
})

// PUT /vehicles/:id - Update with validation + IDOR protection
router.put('/:id', validate(vehicleUpdateSchema), async (req: Request, res: Response) => {
  const { id } = req.params
  const tenantId = req.user?.tenantId

  const vehicle = await vehicleService.updateVehicle(parseInt(id), req.body, tenantId)
  res.json({ success: true, data: vehicle })
})

// DELETE /vehicles/:id - Soft delete with IDOR protection
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const tenantId = req.user?.tenantId

  await vehicleService.deleteVehicle(parseInt(id), tenantId)
  res.json({ success: true, message: 'Vehicle deleted' })
})

export default router
