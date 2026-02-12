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
import { z } from 'zod'

import logger from '../config/logger'; // Wave 24: Add Winston logger
import { pool } from '../db/connection'
import { ValidationError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'
import { getErrorMessage } from '../utils/error-handler'


const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)
router.use(setTenantContext)

/**
 * Ensure supporting tables exist for mobile hardware features.
 * Uses CREATE TABLE IF NOT EXISTS so it is safe to run on every startup.
 */
async function ensureMobileHardwareTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS beacons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        vehicle_id UUID NOT NULL,
        uuid VARCHAR(36) NOT NULL,
        major INTEGER NOT NULL,
        minor INTEGER NOT NULL,
        registered_by UUID,
        registered_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashcam_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        vehicle_id UUID,
        driver_id UUID,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20),
        notes TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        speed DECIMAL(8, 2),
        heading DECIMAL(6, 2),
        dashcam_brand VARCHAR(100),
        dashcam_model VARCHAR(100),
        dashcam_serial VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending_review',
        video_url TEXT,
        event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        vehicle_id UUID NOT NULL,
        checked_in_by UUID NOT NULL,
        checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL,
        check_in_method VARCHAR(20) NOT NULL,
        requires_inspection BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Indexes for performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_beacons_tenant ON beacons(tenant_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_beacons_vehicle ON beacons(vehicle_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_dashcam_events_tenant ON dashcam_events(tenant_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_dashcam_events_vehicle ON dashcam_events(vehicle_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_dashcam_events_type ON dashcam_events(event_type)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_vehicle_checkins_tenant ON vehicle_checkins(tenant_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_vehicle_checkins_vehicle ON vehicle_checkins(vehicle_id)`)

    logger.info('Mobile hardware tables ensured')
  } catch (error) {
    logger.error('Error ensuring mobile hardware tables:', error)
  }
}

// Run table creation on module load
ensureMobileHardwareTables()

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
    const tenantId = (req as any).user?.tenant_id
    const client = (req as any).dbClient

    if (!tenantId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    const result = await client.query(
      `SELECT
        id,
        part_number,
        name,
        description,
        manufacturer,
        unit_cost,
        quantity_on_hand,
        location_in_warehouse,
        metadata
       FROM parts_inventory
       WHERE tenant_id = $1 AND part_number = $2 AND is_active = true
       LIMIT 1`,
      [tenantId, validated.barcode]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found', barcode: validated.barcode })
    }

    const row = result.rows[0]
    res.json({
      part: {
        id: row.id,
        partNumber: row.part_number,
        name: row.name,
        description: row.description,
        manufacturer: row.manufacturer,
        price: row.unit_cost ? Number(row.unit_cost) : null,
        inStock: Number(row.quantity_on_hand ?? 0) > 0,
        quantity: Number(row.quantity_on_hand ?? 0),
        location: row.location_in_warehouse,
        imageUrl: row.metadata?.image_url ?? null,
      }
    })
  } catch (error: any) {
    logger.error('Error scanning part:', error) // Wave 24: Winston logger
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
      throw new ValidationError("Search query required")
    }

    const tenantId = (req as any).user?.tenant_id
    const client = (req as any).dbClient

    if (!tenantId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    const q = `%${query}%`
    const result = await client.query(
      `SELECT
        id,
        part_number,
        name,
        description,
        manufacturer,
        unit_cost,
        quantity_on_hand,
        location_in_warehouse,
        metadata
       FROM parts_inventory
       WHERE tenant_id = $1 AND is_active = true
         AND (part_number ILIKE $2 OR name ILIKE $2 OR description ILIKE $2)
       ORDER BY name ASC
       LIMIT 25`,
      [tenantId, q]
    )

    const parts = result.rows.map((row: any) => ({
      id: row.id,
      partNumber: row.part_number,
      name: row.name,
      description: row.description,
      manufacturer: row.manufacturer,
      price: row.unit_cost ? Number(row.unit_cost) : null,
      inStock: Number(row.quantity_on_hand ?? 0) > 0,
      quantity: Number(row.quantity_on_hand ?? 0),
      location: row.location_in_warehouse,
      imageUrl: row.metadata?.image_url ?? null,
    }))

    res.json({ parts, total: parts.length })
  } catch (error: any) {
    logger.error('Error searching parts:', error) // Wave 24: Winston logger
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * Part Order Schema
 */
const PartOrderSchema = z.object({
  partNumber: z.string().min(1),
  quantity: z.number().int().positive(),
  vendorId: z.string().optional(),
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
router.post(
  `/parts/order`,
  requirePermission(`inventory:create:global`),
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'purchase_orders' }),
  async (req: Request, res: Response) => {
  try {
    const validated = PartOrderSchema.parse(req.body)
    const tenantId = (req as any).user?.tenant_id
    const userId = (req as any).user?.id
    const client = (req as any).dbClient

    if (!tenantId || !userId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    // Lookup part in inventory
    const partResult = await client.query(
      `SELECT id, part_number, name, unit_cost, metadata
       FROM parts_inventory
       WHERE tenant_id = $1 AND part_number = $2 AND is_active = true
       LIMIT 1`,
      [tenantId, validated.partNumber]
    )

    if (partResult.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found', partNumber: validated.partNumber })
    }

    const part = partResult.rows[0]
    const unitCost = part.unit_cost ? Number(part.unit_cost) : null
    if (unitCost === null) {
      return res.status(400).json({ error: 'Part unit cost is missing; cannot create purchase order.', partNumber: validated.partNumber })
    }

    const vendorId = validated.vendorId ?? part.metadata?.vendor_id ?? null
    if (!vendorId) {
      return res.status(400).json({
        error: 'vendorId is required (or configure parts_inventory.metadata.vendor_id for this part)',
        partNumber: validated.partNumber
      })
    }

    const orderDate = new Date().toISOString().slice(0, 10)
    const number = `PO-${Date.now()}`
    const subtotal = unitCost * validated.quantity
    const totalAmount = subtotal

    const lineItems = [
      {
        partId: part.id,
        partNumber: part.part_number,
        name: part.name,
        quantity: validated.quantity,
        unitCost,
        total: subtotal,
        workOrderId: validated.workOrderId ?? null,
        vehicleId: validated.vehicleId ?? null,
        notes: validated.notes ?? null,
      }
    ]

    const poResult = await client.query(
      `INSERT INTO purchase_orders (
        tenant_id, number, vendor_id, order_date,
        subtotal, tax_amount, shipping_cost, total_amount,
        notes, line_items, requested_by_id
      ) VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, $8, $9)
      RETURNING id, number, status, total_amount as "totalAmount"`,
      [tenantId, number, vendorId, orderDate, subtotal, totalAmount, validated.notes ?? null, JSON.stringify(lineItems), userId]
    )

    res.status(201).json({ data: poResult.rows[0] })
  } catch (error: any) {
    logger.error('Error ordering part:', error) // Wave 24: Winston logger
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
router.post('/checkin/nfc', requirePermission('vehicle:update:fleet'), auditLog({ action: 'CREATE', resourceType: 'vehicle_checkins' }), async (req: Request, res: Response) => {
  try {
    const validated = VehicleCheckInSchema.parse(req.body)
    const tenantId = (req as any).user?.tenant_id
    const userId = (req as any).user?.id
    const client = (req as any).dbClient

    if (!tenantId || !userId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    if (!validated.vehicleId && !validated.vin) {
      return res.status(400).json({ error: `Either vehicleId or vin is required` })
    }

    // Verify vehicle exists in the database
    let vehicleResult
    if (validated.vehicleId) {
      vehicleResult = await client.query(
        `SELECT id, vin, make, model, year, status
         FROM vehicles
         WHERE id = $1 AND tenant_id = $2`,
        [validated.vehicleId, tenantId]
      )
    } else {
      vehicleResult = await client.query(
        `SELECT id, vin, make, model, year, status
         FROM vehicles
         WHERE vin = $1 AND tenant_id = $2`,
        [validated.vin, tenantId]
      )
    }

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const vehicle = vehicleResult.rows[0]

    // Create check-in record in the database
    const checkinResult = await client.query(
      `INSERT INTO vehicle_checkins (
        tenant_id, vehicle_id, checked_in_by, checked_in_at, check_in_method, requires_inspection
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, vehicle_id, checked_in_by, checked_in_at, check_in_method, requires_inspection`,
      [tenantId, vehicle.id, userId, validated.timestamp, validated.checkInMethod, true]
    )

    const checkin = checkinResult.rows[0]

    res.json({
      reservationId: checkin.id,
      vehicleId: String(checkin.vehicle_id),
      checkedInBy: String(checkin.checked_in_by),
      checkedInAt: checkin.checked_in_at,
      method: checkin.check_in_method,
      requiresInspection: checkin.requires_inspection
    })
  } catch (error: any) {
    logger.error(`Error during vehicle check-in:`, error) // Wave 24: Winston logger
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
    const tenantId = (req as any).user?.tenant_id
    const client = (req as any).dbClient

    if (!tenantId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    if (!vehicleId && !vin) {
      return res.status(400).json({ error: `Either vehicleId or vin is required` })
    }

    let result
    if (vehicleId) {
      result = await client.query(
        `SELECT
          id,
          vin,
          make,
          model,
          year,
          license_plate,
          number AS fleet_number,
          odometer AS mileage,
          fuel_level,
          status,
          location_address AS location,
          metadata
        FROM vehicles
        WHERE id = $1 AND tenant_id = $2`,
        [vehicleId, tenantId]
      )
    } else {
      result = await client.query(
        `SELECT
          id,
          vin,
          make,
          model,
          year,
          license_plate,
          number AS fleet_number,
          odometer AS mileage,
          fuel_level,
          status,
          location_address AS location,
          metadata
        FROM vehicles
        WHERE vin = $1 AND tenant_id = $2`,
        [vin, tenantId]
      )
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const row = result.rows[0]
    res.json({
      id: String(row.id),
      vin: row.vin,
      make: row.make,
      model: row.model,
      year: row.year ? Number(row.year) : null,
      licensePlate: row.license_plate,
      fleetNumber: row.fleet_number,
      mileage: row.mileage ? Number(row.mileage) : null,
      fuelLevel: row.fuel_level ? Number(row.fuel_level) : null,
      status: row.status,
      location: row.location,
      imageUrl: row.metadata?.image_url ?? null
    })
  } catch (error: any) {
    logger.error('Error getting vehicle details:', error) // Wave 24: Winston logger
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
router.post('/beacons/register', requirePermission(`vehicle:update:fleet`), auditLog({ action: 'CREATE', resourceType: 'beacons' }), async (req: Request, res: Response) => {
  try {
    const validated = BeaconRegistrationSchema.parse(req.body)
    const tenantId = (req as any).user?.tenant_id
    const userId = (req as any).user?.id
    const client = (req as any).dbClient

    if (!tenantId || !userId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    // Verify the vehicle exists
    const vehicleCheck = await client.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2`,
      [validated.vehicleId, tenantId]
    )

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found', vehicleId: validated.vehicleId })
    }

    // Insert beacon into the database
    const result = await client.query(
      `INSERT INTO beacons (
        tenant_id, vehicle_id, uuid, major, minor, registered_by, registered_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, vehicle_id, uuid, major, minor, registered_by, registered_at, is_active`,
      [tenantId, validated.vehicleId, validated.uuid, validated.major, validated.minor, userId, validated.registeredAt, true]
    )

    const row = result.rows[0]
    res.status(201).json({
      beaconId: String(row.id),
      vehicleId: String(row.vehicle_id),
      uuid: row.uuid,
      major: row.major,
      minor: row.minor,
      registeredBy: String(row.registered_by),
      registeredAt: row.registered_at,
      active: row.is_active
    })
  } catch (error: any) {
    logger.error(`Error registering beacon:`, error) // Wave 24: Winston logger
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
    const tenantId = (req as any).user?.tenant_id
    const client = (req as any).dbClient

    if (!tenantId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    // Query active beacons for this tenant, joined with vehicle details
    const result = await client.query(
      `SELECT
        b.id AS beacon_id,
        b.vehicle_id,
        b.uuid,
        b.major,
        b.minor,
        v.vin,
        v.make,
        v.model,
        v.license_plate,
        v.location_address AS location
      FROM beacons b
      JOIN vehicles v ON b.vehicle_id = v.id AND v.tenant_id = $1
      WHERE b.tenant_id = $1 AND b.is_active = true
      ORDER BY b.created_at DESC
      LIMIT 100`,
      [tenantId]
    )

    const beacons = result.rows.map((row: any) => ({
      beaconId: String(row.beacon_id),
      vehicleId: String(row.vehicle_id),
      uuid: row.uuid,
      major: row.major,
      minor: row.minor,
      vin: row.vin,
      make: row.make,
      model: row.model,
      licensePlate: row.license_plate,
      location: row.location
    }))

    res.json({ beacons })
  } catch (error: any) {
    logger.error('Error getting nearby beacons:', error) // Wave 24: Winston logger
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
router.post(`/dashcam/event`, requirePermission(`safety_incident:create:global`), auditLog({ action: 'CREATE', resourceType: 'dashcam_events' }), async (req: Request, res: Response) => {
  try {
    const validated = DashcamEventSchema.parse(req.body)
    const tenantId = (req as any).user?.tenant_id
    const userId = (req as any).user?.id
    const client = (req as any).dbClient

    if (!tenantId || !userId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    const result = await client.query(
      `INSERT INTO dashcam_events (
        tenant_id, event_type, severity, notes,
        latitude, longitude, speed, heading,
        dashcam_brand, dashcam_model, dashcam_serial,
        status, event_timestamp, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, event_type, severity, notes, latitude, longitude, speed, heading,
                dashcam_brand, dashcam_model, dashcam_serial, status, video_url,
                event_timestamp, created_by, created_at`,
      [
        tenantId,
        validated.type,
        validated.severity ?? null,
        validated.notes ?? null,
        validated.gpsData?.latitude ?? null,
        validated.gpsData?.longitude ?? null,
        validated.gpsData?.speed ?? null,
        validated.gpsData?.heading ?? null,
        validated.dashcamInfo?.brand ?? null,
        validated.dashcamInfo?.model ?? null,
        validated.dashcamInfo?.serialNumber ?? null,
        'pending_review',
        validated.timestamp,
        userId
      ]
    )

    const row = result.rows[0]
    res.status(201).json({
      eventId: String(row.id),
      timestamp: row.event_timestamp,
      type: row.event_type,
      severity: row.severity,
      notes: row.notes,
      gpsData: (row.latitude != null && row.longitude != null) ? {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        speed: row.speed ? Number(row.speed) : undefined,
        heading: row.heading ? Number(row.heading) : undefined
      } : undefined,
      dashcamInfo: row.dashcam_brand ? {
        brand: row.dashcam_brand,
        model: row.dashcam_model,
        serialNumber: row.dashcam_serial
      } : undefined,
      createdBy: String(row.created_by),
      createdAt: row.created_at,
      status: row.status,
      videoUrl: row.video_url
    })
  } catch (error: any) {
    logger.error('Error tagging dashcam event:', error) // Wave 24: Winston logger
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
    const tenantId = (req as any).user?.tenant_id
    const client = (req as any).dbClient

    if (!tenantId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    const vehicleId = req.query.vehicleId as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    const eventType = req.query.type as string

    // Build dynamic query with parameterized values
    let queryText = `
      SELECT
        de.id AS event_id,
        de.event_timestamp AS timestamp,
        de.event_type AS type,
        de.severity,
        de.vehicle_id,
        de.driver_id,
        de.latitude,
        de.longitude,
        de.speed,
        de.heading,
        de.status,
        de.video_url,
        de.notes,
        de.created_by,
        de.created_at
      FROM dashcam_events de
      WHERE de.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramIndex = 2

    if (vehicleId) {
      queryText += ` AND de.vehicle_id = $${paramIndex}`
      params.push(vehicleId)
      paramIndex++
    }

    if (startDate) {
      queryText += ` AND de.event_timestamp >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      queryText += ` AND de.event_timestamp <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    if (eventType) {
      queryText += ` AND de.event_type = $${paramIndex}`
      params.push(eventType)
      paramIndex++
    }

    queryText += ` ORDER BY de.event_timestamp DESC LIMIT 100`

    const result = await client.query(queryText, params)

    const events = result.rows.map((row: any) => ({
      eventId: String(row.event_id),
      timestamp: row.timestamp,
      type: row.type,
      severity: row.severity,
      vehicleId: row.vehicle_id ? String(row.vehicle_id) : null,
      driverId: row.driver_id ? String(row.driver_id) : null,
      gpsData: (row.latitude != null && row.longitude != null) ? {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        speed: row.speed ? Number(row.speed) : undefined
      } : undefined,
      status: row.status,
      videoUrl: row.video_url
    }))

    res.json({ events })
  } catch (error: any) {
    logger.error('Error getting dashcam events:', error) // Wave 24: Winston logger
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
    const tenantId = (req as any).user?.tenant_id
    const client = (req as any).dbClient

    if (!tenantId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    // Verify work order exists for this tenant
    const woCheck = await client.query(
      `SELECT id FROM work_orders WHERE id = $1 AND tenant_id = $2`,
      [workOrderId, tenantId]
    )

    if (woCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' })
    }

    const result = await client.query(
      `SELECT
        wop.id,
        wop.part_number,
        wop.name AS description,
        wop.quantity,
        wop.unit_cost AS unit_price,
        wop.total_cost AS total_price,
        wop.supplier,
        wop.notes,
        wop.created_at
      FROM work_order_parts wop
      WHERE wop.work_order_id = $1 AND wop.tenant_id = $2
      ORDER BY wop.created_at ASC`,
      [workOrderId, tenantId]
    )

    const parts = result.rows.map((row: any) => ({
      id: String(row.id),
      partNumber: row.part_number,
      description: row.description,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      totalPrice: Number(row.total_price),
      status: 'ordered'
    }))

    res.json({ parts })
  } catch (error: any) {
    logger.error('Error getting work order parts:', error) // Wave 24: Winston logger
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
router.post('/work-orders/:workOrderId/parts', requirePermission(`work_order:update:global`), auditLog({ action: 'CREATE', resourceType: 'work_order_parts' }), async (req: Request, res: Response) => {
  try {
    const workOrderId = req.params.workOrderId
    const validated = AddPartToWorkOrderSchema.parse(req.body)
    const tenantId = (req as any).user?.tenant_id
    const userId = (req as any).user?.id
    const client = (req as any).dbClient

    if (!tenantId || !userId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    // Verify work order exists for this tenant
    const woCheck = await client.query(
      `SELECT id FROM work_orders WHERE id = $1 AND tenant_id = $2`,
      [workOrderId, tenantId]
    )

    if (woCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' })
    }

    const totalCost = validated.quantity * validated.unitPrice

    // Try to find the part name from parts_inventory, fall back to the part number
    const partLookup = await client.query(
      `SELECT name FROM parts_inventory WHERE tenant_id = $1 AND part_number = $2 AND is_active = true LIMIT 1`,
      [tenantId, validated.partNumber]
    )
    const partName = partLookup.rows.length > 0 ? partLookup.rows[0].name : validated.partNumber

    const result = await client.query(
      `INSERT INTO work_order_parts (
        tenant_id, work_order_id, part_number, name, quantity, unit_cost, total_cost, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, work_order_id, part_number, name, quantity, unit_cost, total_cost, notes, created_at`,
      [tenantId, workOrderId, validated.partNumber, partName, validated.quantity, validated.unitPrice, totalCost, validated.notes ?? null]
    )

    const row = result.rows[0]
    res.status(201).json({
      id: String(row.id),
      workOrderId: String(row.work_order_id),
      partNumber: row.part_number,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_cost),
      totalPrice: Number(row.total_cost),
      notes: row.notes,
      status: 'pending',
      addedBy: userId,
      addedAt: row.created_at
    })
  } catch (error: any) {
    logger.error('Error adding part to work order:', error) // Wave 24: Winston logger
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
router.post('/work-orders/:workOrderId/parts/batch', requirePermission(`work_order:update:global`), auditLog({ action: 'CREATE', resourceType: 'work_order_parts' }), async (req: Request, res: Response) => {
  try {
    const workOrderId = req.params.workOrderId
    const validated = BatchAddPartsSchema.parse(req.body)
    const tenantId = (req as any).user?.tenant_id
    const userId = (req as any).user?.id
    const client = (req as any).dbClient

    if (!tenantId || !userId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    if (validated.parts.length === 0) {
      return res.status(400).json({ error: 'At least one part is required' })
    }

    // Verify work order exists for this tenant
    const woCheck = await client.query(
      `SELECT id FROM work_orders WHERE id = $1 AND tenant_id = $2`,
      [workOrderId, tenantId]
    )

    if (woCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' })
    }

    // Use a transaction for batch insert
    await client.query('BEGIN')

    try {
      const addedParts = []

      for (const part of validated.parts) {
        const totalCost = part.quantity * part.unitPrice

        // Try to look up part name from inventory
        const partLookup = await client.query(
          `SELECT name FROM parts_inventory WHERE tenant_id = $1 AND part_number = $2 AND is_active = true LIMIT 1`,
          [tenantId, part.partNumber]
        )
        const partName = partLookup.rows.length > 0 ? partLookup.rows[0].name : part.partNumber

        const result = await client.query(
          `INSERT INTO work_order_parts (
            tenant_id, work_order_id, part_number, name, quantity, unit_cost, total_cost
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, work_order_id, part_number, name, quantity, unit_cost, total_cost, created_at`,
          [tenantId, workOrderId, part.partNumber, partName, part.quantity, part.unitPrice, totalCost]
        )

        const row = result.rows[0]
        addedParts.push({
          id: String(row.id),
          workOrderId: String(row.work_order_id),
          partNumber: row.part_number,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unit_cost),
          totalPrice: Number(row.total_cost),
          status: 'pending',
          addedBy: userId,
          addedAt: row.created_at
        })
      }

      await client.query('COMMIT')
      res.status(201).json({ parts: addedParts, count: addedParts.length })
    } catch (txError) {
      await client.query('ROLLBACK')
      throw txError
    }
  } catch (error: any) {
    logger.error('Error adding parts batch to work order:', error) // Wave 24: Winston logger
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
router.post('/assets/scan', requirePermission(`asset:view:global`), async (req: Request, res: Response) => {
  try {
    const validated = AssetScanSchema.parse(req.body)
    const tenantId = (req as any).user?.tenant_id
    const client = (req as any).dbClient

    if (!tenantId || !client) {
      return res.status(500).json({ error: 'Internal server error', code: 'MISSING_TENANT_CONTEXT' })
    }

    // Search by asset_tag, qr_code, or asset_number
    const result = await client.query(
      `SELECT
        a.id,
        a.asset_tag,
        a.asset_name,
        a.asset_type,
        a.category,
        a.status,
        a.location,
        a.serial_number,
        a.manufacturer,
        a.model,
        u.first_name,
        u.last_name
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.tenant_id = $1
        AND (a.asset_tag = $2 OR a.qr_code = $2)
      LIMIT 1`,
      [tenantId, validated.barcode]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found', barcode: validated.barcode })
    }

    const row = result.rows[0]
    const assignedToName = (row.first_name || row.last_name)
      ? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim()
      : null

    res.json({
      asset: {
        assetId: String(row.id),
        assetTag: row.asset_tag,
        name: row.asset_name,
        category: row.category ?? row.asset_type,
        assignedTo: assignedToName,
        location: row.location,
        status: row.status
      }
    })
  } catch (error: any) {
    logger.error('Error scanning asset:', error) // Wave 24: Winston logger
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

export default router
