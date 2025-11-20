/**
 * Mobile Hardware Integration API Routes
 *
 * Comprehensive API endpoints for mobile hardware features:
 * - Barcode/QR code scanning
 * - NFC check-in
 * - Beacon management
 * - Dashcam integration
 * - Parts lookup and ordering
 */

import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * ============================================================================
 * PARTS SCANNING & INVENTORY
 * ============================================================================
 */

/**
 * Part Scan Schema
 */
const PartScanSchema = z.object({
  barcode: z.string().min(1)
})

/**
 * @swagger
 * /api/mobile/parts/scan:
 *   post:
 *     summary: Look up part by barcode
 *     description: Scan a part barcode and retrieve part details from inventory
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               barcode:
 *                 type: string
 *                 description: Barcode value from scanner
 *     responses:
 *       200:
 *         description: Part found
 *       404:
 *         description: Part not found
 */
router.post('/parts/scan', requirePermission('inventory:view:global'), async (req: Request, res: Response) => {
  try {
    const validated = PartScanSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id

    // TODO: Implement actual part lookup from inventory database
    // This is a mock implementation
    const part = {
      partNumber: validated.barcode,
      description: 'Sample Part Description',
      manufacturer: 'OEM',
      price: 49.99,
      inStock: true,
      quantity: 15,
      location: 'Shelf A-12',
      imageUrl: 'https://example.com/part-image.jpg'
    }

    // Check if part exists (mock)
    if (validated.barcode.includes('NOTFOUND')) {
      return res.status(404).json({
        error: 'Part not found',
        barcode: validated.barcode
      })
    }

    res.json({ part })
  } catch (error: any) {
    console.error('Error scanning part:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * Part Search Schema
 */
const PartSearchSchema = z.object({
  q: z.string().min(1)
})

/**
 * @swagger
 * /api/mobile/parts/search:
 *   get:
 *     summary: Search parts by number or description
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/parts/search', requirePermission('inventory:view:global'), async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string

    if (!query || query.length < 1) {
      return res.status(400).json({ error: 'Search query required' })
    }

    const tenantId = (req as any).user.tenant_id

    // TODO: Implement actual part search
    const parts = [
      {
        partNumber: 'BRK-12345',
        description: 'Brake Pad Set - Front',
        manufacturer: 'Bosch',
        price: 89.99,
        inStock: true,
        quantity: 8,
        location: 'Shelf B-4'
      },
      {
        partNumber: 'FLT-98765',
        description: 'Oil Filter',
        manufacturer: 'Mann',
        price: 12.99,
        inStock: true,
        quantity: 24,
        location: 'Shelf C-1'
      }
    ]

    res.json({ parts })
  } catch (error: any) {
    console.error('Error searching parts:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * Part Order Schema
 */
const PartOrderSchema = z.object({
  partNumber: z.string().min(1),
  quantity: z.number().int().positive(),
  workOrderId: z.string().optional(),
  vehicleId: z.string().optional(),
  notes: z.string().optional()
})

/**
 * @swagger
 * /api/mobile/parts/order:
 *   post:
 *     summary: Order a part
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partNumber:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               workOrderId:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Part ordered successfully
 */
router.post('/parts/order', requirePermission('inventory:create:global'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = PartOrderSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    // TODO: Implement actual part ordering
    const order = {
      orderId: `ORD-${Date.now()}`,
      partNumber: validated.partNumber,
      quantity: validated.quantity,
      status: 'pending',
      orderedBy: userId,
      orderedAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }

    res.status(201).json(order)
  } catch (error: any) {
    console.error('Error ordering part:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * ============================================================================
 * VEHICLE CHECK-IN (NFC / QR)
 * ============================================================================
 */

/**
 * Vehicle Check-In Schema
 */
const VehicleCheckInSchema = z.object({
  vehicleId: z.string().optional(),
  vin: z.string().optional(),
  checkInMethod: z.enum(['nfc', 'qr', 'manual']),
  timestamp: z.string().datetime()
})

/**
 * @swagger
 * /api/mobile/checkin/nfc:
 *   post:
 *     summary: Vehicle check-in via NFC or QR code
 *     description: Check in to a vehicle using NFC tap, QR scan, or manual VIN entry
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: string
 *               vin:
 *                 type: string
 *               checkInMethod:
 *                 type: string
 *                 enum: [nfc, qr, manual]
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Check-in successful
 */
router.post('/checkin/nfc', requirePermission('vehicle:update:fleet'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = VehicleCheckInSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    if (!validated.vehicleId && !validated.vin) {
      return res.status(400).json({ error: 'Either vehicleId or vin is required' })
    }

    // TODO: Implement actual vehicle check-in logic
    // - Verify vehicle exists
    // - Check if user has reservation
    // - Create or update check-in record
    // - Start pre-trip inspection if configured

    const checkIn = {
      reservationId: `RSV-${Date.now()}`,
      vehicleId: validated.vehicleId || `VEH-${Date.now()}`,
      checkedInBy: userId,
      checkedInAt: validated.timestamp,
      method: validated.checkInMethod,
      requiresInspection: true
    }

    res.json(checkIn)
  } catch (error: any) {
    console.error('Error during vehicle check-in:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/vehicles/details:
 *   get:
 *     summary: Get vehicle details by ID or VIN
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vin
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle details
 */
router.get('/vehicles/details', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const vehicleId = req.query.vehicleId as string
    const vin = req.query.vin as string
    const tenantId = (req as any).user.tenant_id

    if (!vehicleId && !vin) {
      return res.status(400).json({ error: 'Either vehicleId or vin is required' })
    }

    // TODO: Implement actual vehicle lookup
    const vehicle = {
      id: vehicleId || `VEH-${Date.now()}`,
      vin: vin || '1HGBH41JXMN109186',
      make: 'Ford',
      model: 'Transit',
      year: 2023,
      licensePlate: 'ABC-1234',
      fleetNumber: 'FL-001',
      mileage: 45678,
      fuelLevel: 75,
      status: 'active',
      location: 'Parking Lot A',
      imageUrl: 'https://example.com/vehicle.jpg'
    }

    res.json(vehicle)
  } catch (error: any) {
    console.error('Error getting vehicle details:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * ============================================================================
 * BEACON MANAGEMENT
 * ============================================================================
 */

/**
 * Beacon Registration Schema
 */
const BeaconRegistrationSchema = z.object({
  vehicleId: z.string().min(1),
  uuid: z.string().uuid(),
  major: z.number().int().min(0).max(65535),
  minor: z.number().int().min(0).max(65535),
  registeredAt: z.string().datetime()
})

/**
 * @swagger
 * /api/mobile/beacons/register:
 *   post:
 *     summary: Register a beacon for a vehicle
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: string
 *               uuid:
 *                 type: string
 *                 format: uuid
 *               major:
 *                 type: integer
 *               minor:
 *                 type: integer
 *               registeredAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Beacon registered successfully
 */
router.post('/beacons/register', requirePermission('vehicle:update:fleet'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = BeaconRegistrationSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    // TODO: Implement actual beacon registration
    const beacon = {
      beaconId: `BCN-${Date.now()}`,
      vehicleId: validated.vehicleId,
      uuid: validated.uuid,
      major: validated.major,
      minor: validated.minor,
      registeredBy: userId,
      registeredAt: validated.registeredAt,
      active: true
    }

    res.status(201).json(beacon)
  } catch (error: any) {
    console.error('Error registering beacon:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/beacons/nearby:
 *   get:
 *     summary: Get nearby vehicle beacons
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 100
 *     responses:
 *       200:
 *         description: List of nearby beacons
 */
router.get('/beacons/nearby', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined
    const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 100

    // TODO: Implement actual nearby beacon lookup based on location
    // For now, return all beacons for the tenant

    const beacons = [
      {
        beaconId: 'BCN-001',
        vehicleId: 'VEH-001',
        uuid: '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6',
        major: 100,
        minor: 1,
        vin: '1HGBH41JXMN109186',
        make: 'Ford',
        model: 'Transit',
        licensePlate: 'ABC-1234',
        location: 'Parking Lot A'
      },
      {
        beaconId: 'BCN-002',
        vehicleId: 'VEH-002',
        uuid: '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6',
        major: 100,
        minor: 2,
        vin: '1HGBH41JXMN109187',
        make: 'Mercedes',
        model: 'Sprinter',
        licensePlate: 'XYZ-5678',
        location: 'Parking Lot B'
      }
    ]

    res.json({ beacons })
  } catch (error: any) {
    console.error('Error getting nearby beacons:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * ============================================================================
 * DASHCAM INTEGRATION
 * ============================================================================
 */

/**
 * Dashcam Event Schema
 */
const DashcamEventSchema = z.object({
  eventId: z.string().optional(),
  timestamp: z.string().datetime(),
  type: z.enum(['impact', 'harsh_braking', 'harsh_acceleration', 'harsh_turn', 'manual']),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
  gpsData: z.object({
    latitude: z.number(),
    longitude: z.number(),
    speed: z.number().optional(),
    heading: z.number().optional()
  }).optional(),
  dashcamInfo: z.object({
    brand: z.string(),
    model: z.string(),
    serialNumber: z.string()
  }).optional()
})

/**
 * @swagger
 * /api/mobile/dashcam/event:
 *   post:
 *     summary: Tag a dashcam event
 *     description: Create an event marker for dashcam footage (impact, harsh braking, etc.)
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [impact, harsh_braking, harsh_acceleration, harsh_turn, manual]
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *               notes:
 *                 type: string
 *               gpsData:
 *                 type: object
 *               dashcamInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event tagged successfully
 */
router.post('/dashcam/event', requirePermission('safety_incident:create:global'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = DashcamEventSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    // TODO: Implement actual dashcam event storage
    // - Store event record
    // - Trigger video capture/download if configured
    // - Create safety incident if severity is high
    // - Send notifications to fleet managers

    const event = {
      eventId: validated.eventId || `DCE-${Date.now()}`,
      timestamp: validated.timestamp,
      type: validated.type,
      severity: validated.severity,
      notes: validated.notes,
      gpsData: validated.gpsData,
      dashcamInfo: validated.dashcamInfo,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
      videoUrl: null // Will be populated when video is captured/uploaded
    }

    res.status(201).json(event)
  } catch (error: any) {
    console.error('Error tagging dashcam event:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/dashcam/events:
 *   get:
 *     summary: Get dashcam events
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of dashcam events
 */
router.get('/dashcam/events', requirePermission('safety_incident:view:global'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const vehicleId = req.query.vehicleId as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    const type = req.query.type as string

    // TODO: Implement actual dashcam event retrieval with filters

    const events = [
      {
        eventId: 'DCE-001',
        timestamp: new Date().toISOString(),
        type: 'harsh_braking',
        severity: 'medium',
        vehicleId: 'VEH-001',
        driverId: 'DRV-001',
        gpsData: {
          latitude: 40.7128,
          longitude: -74.0060,
          speed: 45
        },
        status: 'reviewed',
        videoUrl: 'https://example.com/dashcam/video-001.mp4'
      }
    ]

    res.json({ events })
  } catch (error: any) {
    console.error('Error getting dashcam events:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * ============================================================================
 * WORK ORDER PARTS MANAGEMENT
 * ============================================================================
 */

/**
 * @swagger
 * /api/mobile/work-orders/{workOrderId}/parts:
 *   get:
 *     summary: Get parts for a work order
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workOrderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order parts
 */
router.get('/work-orders/:workOrderId/parts', requirePermission('work_order:view:global'), async (req: Request, res: Response) => {
  try {
    const workOrderId = req.params.workOrderId
    const tenantId = (req as any).user.tenant_id

    // TODO: Implement actual work order parts retrieval

    const parts = [
      {
        id: 'WOP-001',
        partNumber: 'BRK-12345',
        description: 'Brake Pad Set - Front',
        quantity: 2,
        unitPrice: 89.99,
        totalPrice: 179.98,
        status: 'ordered'
      }
    ]

    res.json({ parts })
  } catch (error: any) {
    console.error('Error getting work order parts:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * Add Part to Work Order Schema
 */
const AddPartToWorkOrderSchema = z.object({
  partNumber: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  notes: z.string().optional()
})

/**
 * @swagger
 * /api/mobile/work-orders/{workOrderId}/parts:
 *   post:
 *     summary: Add a part to work order
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workOrderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partNumber:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Part added to work order
 */
router.post('/work-orders/:workOrderId/parts', requirePermission('work_order:update:global'), auditLog, async (req: Request, res: Response) => {
  try {
    const workOrderId = req.params.workOrderId
    const validated = AddPartToWorkOrderSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    // TODO: Implement actual part addition to work order

    const workOrderPart = {
      id: `WOP-${Date.now()}`,
      workOrderId,
      partNumber: validated.partNumber,
      quantity: validated.quantity,
      unitPrice: validated.unitPrice,
      totalPrice: validated.quantity * validated.unitPrice,
      notes: validated.notes,
      status: 'pending',
      addedBy: userId,
      addedAt: new Date().toISOString()
    }

    res.status(201).json(workOrderPart)
  } catch (error: any) {
    console.error('Error adding part to work order:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * Batch Add Parts Schema
 */
const BatchAddPartsSchema = z.object({
  parts: z.array(z.object({
    partNumber: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0)
  }))
})

/**
 * @swagger
 * /api/mobile/work-orders/{workOrderId}/parts/batch:
 *   post:
 *     summary: Add multiple parts to work order
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workOrderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Parts added to work order
 */
router.post('/work-orders/:workOrderId/parts/batch', requirePermission('work_order:update:global'), auditLog, async (req: Request, res: Response) => {
  try {
    const workOrderId = req.params.workOrderId
    const validated = BatchAddPartsSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    // TODO: Implement actual batch part addition

    const addedParts = validated.parts.map((part, index) => ({
      id: `WOP-${Date.now()}-${index}`,
      workOrderId,
      partNumber: part.partNumber,
      quantity: part.quantity,
      unitPrice: part.unitPrice,
      totalPrice: part.quantity * part.unitPrice,
      status: 'pending',
      addedBy: userId,
      addedAt: new Date().toISOString()
    }))

    res.status(201).json({ parts: addedParts, count: addedParts.length })
  } catch (error: any) {
    console.error('Error adding parts batch to work order:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * ============================================================================
 * ASSET SCANNING
 * ============================================================================
 */

/**
 * Asset Scan Schema
 */
const AssetScanSchema = z.object({
  barcode: z.string().min(1)
})

/**
 * @swagger
 * /api/mobile/assets/scan:
 *   post:
 *     summary: Scan asset barcode
 *     description: Scan an asset tag and retrieve asset details
 *     tags: [Mobile Hardware]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               barcode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset found
 *       404:
 *         description: Asset not found
 */
router.post('/assets/scan', requirePermission('asset:view:global'), async (req: Request, res: Response) => {
  try {
    const validated = AssetScanSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id

    // TODO: Implement actual asset lookup

    const asset = {
      assetId: `AST-${Date.now()}`,
      assetTag: validated.barcode,
      name: 'Laptop - Dell XPS 15',
      category: 'IT Equipment',
      assignedTo: 'John Doe',
      location: 'Office Building A',
      status: 'active' as const
    }

    res.json({ asset })
  } catch (error: any) {
    console.error('Error scanning asset:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

export default router
