import { Router } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import vehicleIdentificationService from '../services/vehicle-identification.service'
import { z } from 'zod'
import asyncHandler from 'express-async-handler'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import csurf from 'csurf'

const router = Router()
router.use(authenticateJWT)
router.use(helmet())
router.use(csurf())

const qrGenerateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

const qrScanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

const vehicleIdSchema = z.object({
  vehicleId: z.string(),
})

const qrDataSchema = z.object({
  qrData: z.string(),
})

router.post(
  '/qr/generate/:vehicleId',
  requirePermission('vehicle:update:fleet'),
  qrGenerateLimiter,
  asyncHandler(async (req, res) => {
    // TODO: const service = container.resolve('"Service"')
    const { vehicleId } = vehicleIdSchema.parse(req.params)
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    const qrCode = await vehicleIdentificationService.generateVehicleQRCode(vehicleId, tenantId)

    res.json({
      qrCode,
      message: 'QR code generated successfully',
    })
  })
)

router.post(
  '/qr/scan',
  requirePermission('vehicle:view:fleet'),
  qrScanLimiter,
  asyncHandler(async (req, res) => {
    // TODO: const service = container.resolve('"Service"')
    const { qrData } = qrDataSchema.parse(req.body)
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    const vehicle = await vehicleIdentificationService.identifyByQRCode(qrData, tenantId)

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    res.json({ vehicle })
  })
)

export default router
