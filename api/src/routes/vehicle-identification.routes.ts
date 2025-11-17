/**
 * Vehicle Identification Routes
 *
 * API endpoints for:
 * - VIN scanning and lookup
 * - License plate OCR and lookup
 * - QR code generation and scanning
 * - Vehicle search
 */

import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import vehicleIdentificationService from '../services/vehicle-identification.service'

const router = Router()
router.use(authenticateJWT)

/**
 * @openapi
 * /api/vehicle-identification/qr/generate/{vehicleId}:
 *   post:
 *     summary: Generate QR code for a vehicle
 *     description: Admin can generate a printable QR code to affix to vehicle
 *     tags:
 *       - Vehicle Identification
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *       404:
 *         description: Vehicle not found
 */
router.post('/qr/generate/:vehicleId', requirePermission('vehicle:update:fleet'), async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.params
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    const qrCode = await vehicleIdentificationService.generateVehicleQRCode(vehicleId, tenantId)

    res.json({
      qrCode,
      message: 'QR code generated successfully'
    })
  } catch (error: any) {
    console.error('Error generating QR code:', error)
    res.status(500).json({ error: error.message || 'Failed to generate QR code' })
  }
})

/**
 * @openapi
 * /api/vehicle-identification/qr/scan:
 *   post:
 *     summary: Identify vehicle by scanning QR code
 *     tags:
 *       - Vehicle Identification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle identified
 *       404:
 *         description: Vehicle not found
 */
router.post('/qr/scan', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { qrData } = req.body
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    if (!qrData) {
      return res.status(400).json({ error: 'QR data required' })
    }

    const vehicle = await vehicleIdentificationService.identifyByQRCode(qrData, tenantId)

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    res.json({ vehicle })
  } catch (error: any) {
    console.error('Error scanning QR code:', error)
    res.status(500).json({ error: error.message || 'Failed to scan QR code' })
  }
})

/**
 * @openapi
 * /api/vehicle-identification/vin:
 *   post:
 *     summary: Identify vehicle by VIN
 *     description: Lookup vehicle by VIN from barcode scan or manual entry
 *     tags:
 *       - Vehicle Identification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle identified
 *       400:
 *         description: Invalid VIN format
 *       404:
 *         description: Vehicle not found
 */
router.post('/vin', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { vin } = req.body
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    if (!vin) {
      return res.status(400).json({ error: 'VIN required' })
    }

    // Validate VIN format
    if (!vehicleIdentificationService.isValidVIN(vin)) {
      return res.status(400).json({
        error: 'Invalid VIN format',
        details: 'VIN must be 17 characters, alphanumeric, excluding I, O, Q'
      })
    }

    const vehicle = await vehicleIdentificationService.identifyByVIN(vin, tenantId)

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found with this VIN' })
    }

    res.json({ vehicle })
  } catch (error: any) {
    console.error('Error identifying by VIN:', error)
    res.status(500).json({ error: error.message || 'Failed to identify vehicle' })
  }
})

/**
 * @openapi
 * /api/vehicle-identification/license-plate:
 *   post:
 *     summary: Identify vehicle by license plate
 *     description: Lookup vehicle by license plate from manual entry
 *     tags:
 *       - Vehicle Identification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licensePlate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle identified
 *       404:
 *         description: Vehicle not found
 */
router.post('/license-plate', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { licensePlate } = req.body
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    if (!licensePlate) {
      return res.status(400).json({ error: 'License plate required' })
    }

    const vehicle = await vehicleIdentificationService.identifyByLicensePlate(
      licensePlate,
      tenantId
    )

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found with this license plate' })
    }

    res.json({ vehicle })
  } catch (error: any) {
    console.error('Error identifying by license plate:', error)
    res.status(500).json({ error: error.message || 'Failed to identify vehicle' })
  }
})

/**
 * @openapi
 * /api/vehicle-identification/license-plate/ocr:
 *   post:
 *     summary: Identify vehicle by license plate photo (OCR)
 *     description: Process license plate image using OCR and lookup vehicle
 *     tags:
 *       - Vehicle Identification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageData:
 *                 type: string
 *                 description: Base64 encoded image data
 *     responses:
 *       200:
 *         description: Vehicle identified
 *       404:
 *         description: Vehicle not found
 *       501:
 *         description: OCR service not configured
 */
router.post('/license-plate/ocr', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { imageData } = req.body
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    if (!imageData) {
      return res.status(400).json({ error: 'Image data required' })
    }

    const vehicle = await vehicleIdentificationService.processLicensePlateImage(
      imageData,
      tenantId
    )

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    res.json({ vehicle })
  } catch (error: any) {
    console.error('Error processing license plate image:', error)

    if (error.message.includes('Azure Computer Vision')) {
      return res.status(501).json({
        error: 'OCR service not configured',
        details: error.message
      })
    }

    res.status(500).json({ error: error.message || 'Failed to process image' })
  }
})

/**
 * @openapi
 * /api/vehicle-identification/search:
 *   get:
 *     summary: Search vehicles by multiple criteria
 *     tags:
 *       - Vehicle Identification
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results returned
 */
router.get('/search', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { q } = req.query
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' })
    }

    const vehicles = await vehicleIdentificationService.searchVehicles(q, tenantId)

    res.json({ vehicles, total: vehicles.length })
  } catch (error: any) {
    console.error('Error searching vehicles:', error)
    res.status(500).json({ error: error.message || 'Failed to search vehicles' })
  }
})

/**
 * @openapi
 * /api/vehicle-identification/label/{vehicleId}:
 *   get:
 *     summary: Generate printable QR code label
 *     description: Generate a printable label with QR code and vehicle info
 *     tags:
 *       - Vehicle Identification
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Printable label generated
 */
router.get('/label/:vehicleId', requirePermission('vehicle:view:fleet'), async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.params
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID required' })
    }

    const label = await vehicleIdentificationService.generatePrintableLabel(vehicleId, tenantId)

    res.json(label)
  } catch (error: any) {
    console.error('Error generating label:', error)
    res.status(500).json({ error: error.message || 'Failed to generate label' })
  }
})

export default router
