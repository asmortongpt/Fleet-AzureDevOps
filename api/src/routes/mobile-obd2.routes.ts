/**
 * Mobile OBD2 API Routes
 *
 * Endpoints for OBD2 adapter management and vehicle diagnostics
 */

import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import obd2Service from '../services/obd2.service'
import { z } from 'zod'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * Register Adapter Schema
 */
const RegisterAdapterSchema = z.object({
  adapter_type: z.enum(['ELM327', 'Vgate', 'OBDLink', 'BlueDriver', 'Generic']),
  connection_type: z.enum(['bluetooth', 'wifi', 'usb']),
  device_id: z.string().min(1),
  device_name: z.string().min(1),
  mac_address: z.string().optional(),
  ip_address: z.string().optional(),
  port: z.number().int().positive().optional(),
  firmware_version: z.string().optional(),
  hardware_version: z.string().optional(),
  supported_protocols: z.array(z.string()).optional(),
  vehicle_id: z.number().int().positive().optional(),
  vin: z.string().length(17).optional(),
  protocol_detected: z.string().optional()
})

/**
 * Report DTCs Schema
 */
const ReportDTCsSchema = z.object({
  vehicle_id: z.number().int().positive(),
  adapter_id: z.number().int().positive(),
  dtcs: z.array(z.object({
    dtc_code: z.string().min(4).max(10),
    dtc_type: z.enum(['powertrain', 'chassis', 'body', 'network']),
    description: z.string(),
    severity: z.enum(['critical', 'major', 'moderate', 'minor', 'informational']),
    is_mil_on: z.boolean(),
    freeze_frame_data: z.any().optional(),
    detected_at: z.string().datetime()
  }))
})

/**
 * Live Data Schema
 */
const LiveDataSchema = z.object({
  vehicle_id: z.number().int().positive(),
  adapter_id: z.number().int().positive(),
  session_id: z.string().min(1),
  data: z.object({
    engine_rpm: z.number().optional(),
    vehicle_speed: z.number().optional(),
    throttle_position: z.number().optional(),
    engine_coolant_temp: z.number().optional(),
    intake_air_temp: z.number().optional(),
    maf_air_flow_rate: z.number().optional(),
    fuel_pressure: z.number().optional(),
    intake_manifold_pressure: z.number().optional(),
    timing_advance: z.number().optional(),
    fuel_level: z.number().optional(),
    short_term_fuel_trim: z.number().optional(),
    long_term_fuel_trim: z.number().optional(),
    fuel_consumption_rate: z.number().optional(),
    o2_sensor_voltage: z.number().optional(),
    catalyst_temperature: z.number().optional(),
    battery_voltage: z.number().optional(),
    odometer_reading: z.number().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      altitude: z.number().optional(),
      accuracy: z.number().optional()
    }).optional(),
    all_pids: z.any().optional()
  })
})

/**
 * Connection Log Schema
 */
const ConnectionLogSchema = z.object({
  adapter_id: z.number().int().positive(),
  vehicle_id: z.number().int().positive().optional(),
  connection_type: z.enum(['bluetooth', 'wifi', 'usb']),
  connection_status: z.enum(['success', 'failed', 'disconnected', 'timeout']),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  session_duration_seconds: z.number().int().optional(),
  data_points_received: z.number().int().optional(),
  signal_strength: z.number().int().optional(),
  connection_speed: z.string().optional(),
  connected_at: z.string().datetime().optional(),
  disconnected_at: z.string().datetime().optional()
})

/**
 * @swagger
 * /api/mobile/obd2/connect:
 *   post:
 *     summary: Register or update OBD2 adapter
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adapter_type
 *               - connection_type
 *               - device_id
 *               - device_name
 *             properties:
 *               adapter_type:
 *                 type: string
 *                 enum: [ELM327, Vgate, OBDLink, BlueDriver, Generic]
 *               connection_type:
 *                 type: string
 *                 enum: [bluetooth, wifi, usb]
 *               device_id:
 *                 type: string
 *               device_name:
 *                 type: string
 *               mac_address:
 *                 type: string
 *               ip_address:
 *                 type: string
 *               port:
 *                 type: integer
 *               firmware_version:
 *                 type: string
 *               hardware_version:
 *                 type: string
 *               supported_protocols:
 *                 type: array
 *                 items:
 *                   type: string
 *               vehicle_id:
 *                 type: integer
 *               vin:
 *                 type: string
 *               protocol_detected:
 *                 type: string
 *     responses:
 *       200:
 *         description: Adapter registered successfully
 *       400:
 *         description: Invalid request
 */
router.post('/connect', requirePermission('vehicle:update:fleet'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = RegisterAdapterSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const adapter = await obd2Service.registerAdapter(tenantId, userId, validated)

    res.json(adapter)
  } catch (error: any) {
    console.error('Error registering OBD2 adapter:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/adapters:
 *   get:
 *     summary: Get user's OBD2 adapters
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of adapters
 *       400:
 *         description: Error retrieving adapters
 */
router.get('/adapters', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const adapters = await obd2Service.getUserAdapters(tenantId, userId)

    res.json(adapters)
  } catch (error: any) {
    console.error('Error getting adapters:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/adapters/{adapterId}:
 *   get:
 *     summary: Get adapter by ID
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adapterId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Adapter details
 *       404:
 *         description: Adapter not found
 */
router.get('/adapters/:adapterId', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const adapterId = parseInt(req.params.adapterId)

    const adapter = await obd2Service.getAdapterById(tenantId, adapterId)

    if (!adapter) {
      return res.status(404).json({ error: 'Adapter not found' })
    }

    res.json(adapter)
  } catch (error: any) {
    console.error('Error getting adapter:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/dtcs:
 *   post:
 *     summary: Report diagnostic trouble codes
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - adapter_id
 *               - dtcs
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               adapter_id:
 *                 type: integer
 *               dtcs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dtc_code:
 *                       type: string
 *                     dtc_type:
 *                       type: string
 *                       enum: [powertrain, chassis, body, network]
 *                     description:
 *                       type: string
 *                     severity:
 *                       type: string
 *                       enum: [critical, major, moderate, minor, informational]
 *                     is_mil_on:
 *                       type: boolean
 *                     freeze_frame_data:
 *                       type: object
 *                     detected_at:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       201:
 *         description: DTCs reported successfully
 *       400:
 *         description: Invalid request
 */
router.post('/dtcs', requirePermission('maintenance:create:fleet'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = ReportDTCsSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const dtcs = await obd2Service.reportDiagnosticCodes(
      tenantId,
      validated.vehicle_id,
      validated.adapter_id,
      userId,
      validated.dtcs.map(dtc => ({
        ...dtc,
        detected_at: new Date(dtc.detected_at)
      }))
    )

    res.status(201).json(dtcs)
  } catch (error: any) {
    console.error('Error reporting DTCs:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/dtcs/{vehicleId}:
 *   get:
 *     summary: Get diagnostic codes for vehicle
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, cleared, resolved]
 *     responses:
 *       200:
 *         description: List of diagnostic codes
 */
router.get('/dtcs/:vehicleId', requirePermission('maintenance:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const vehicleId = parseInt(req.params.vehicleId)
    const status = req.query.status as any

    const dtcs = await obd2Service.getVehicleDiagnosticCodes(tenantId, vehicleId, status)

    res.json(dtcs)
  } catch (error: any) {
    console.error('Error getting DTCs:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/dtcs/{vehicleId}:
 *   delete:
 *     summary: Clear diagnostic codes for vehicle
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: DTCs cleared successfully
 *       400:
 *         description: Error clearing DTCs
 */
router.delete('/dtcs/:vehicleId', requirePermission('maintenance:update:fleet'), auditLog, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id
    const vehicleId = parseInt(req.params.vehicleId)

    const count = await obd2Service.clearDiagnosticCodes(tenantId, vehicleId, userId)

    res.json({
      success: true,
      cleared_count: count,
      message: `Cleared ${count} diagnostic code(s)`
    })
  } catch (error: any) {
    console.error('Error clearing DTCs:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/live-data:
 *   post:
 *     summary: Stream real-time OBD2 data
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - adapter_id
 *               - session_id
 *               - data
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               adapter_id:
 *                 type: integer
 *               session_id:
 *                 type: string
 *               data:
 *                 type: object
 *                 properties:
 *                   engine_rpm:
 *                     type: number
 *                   vehicle_speed:
 *                     type: number
 *                   throttle_position:
 *                     type: number
 *                   engine_coolant_temp:
 *                     type: number
 *                   intake_air_temp:
 *                     type: number
 *                   maf_air_flow_rate:
 *                     type: number
 *                   fuel_pressure:
 *                     type: number
 *                   intake_manifold_pressure:
 *                     type: number
 *                   timing_advance:
 *                     type: number
 *                   fuel_level:
 *                     type: number
 *                   battery_voltage:
 *                     type: number
 *                   all_pids:
 *                     type: object
 *     responses:
 *       201:
 *         description: Live data stored successfully
 */
router.post('/live-data', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const validated = LiveDataSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const liveData = await obd2Service.storeLiveData(
      tenantId,
      validated.vehicle_id,
      validated.adapter_id,
      userId,
      validated.session_id,
      validated.data
    )

    res.status(201).json(liveData)
  } catch (error: any) {
    console.error('Error storing live data:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/live-data/{vehicleId}:
 *   get:
 *     summary: Get recent live data for vehicle
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Recent live data
 */
router.get('/live-data/:vehicleId', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const vehicleId = parseInt(req.params.vehicleId)
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100

    const liveData = await obd2Service.getRecentLiveData(tenantId, vehicleId, limit)

    res.json(liveData)
  } catch (error: any) {
    console.error('Error getting live data:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/connection-log:
 *   post:
 *     summary: Log OBD2 connection event
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adapter_id
 *               - connection_type
 *               - connection_status
 *             properties:
 *               adapter_id:
 *                 type: integer
 *               vehicle_id:
 *                 type: integer
 *               connection_type:
 *                 type: string
 *                 enum: [bluetooth, wifi, usb]
 *               connection_status:
 *                 type: string
 *                 enum: [success, failed, disconnected, timeout]
 *               error_code:
 *                 type: string
 *               error_message:
 *                 type: string
 *               session_duration_seconds:
 *                 type: integer
 *               data_points_received:
 *                 type: integer
 *               signal_strength:
 *                 type: integer
 *               connection_speed:
 *                 type: string
 *     responses:
 *       201:
 *         description: Connection logged successfully
 */
router.post('/connection-log', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const validated = ConnectionLogSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const log = await obd2Service.logConnection(
      tenantId,
      validated.adapter_id,
      userId,
      validated.vehicle_id || null,
      validated.connection_type,
      validated.connection_status,
      {
        error_code: validated.error_code,
        error_message: validated.error_message,
        session_duration_seconds: validated.session_duration_seconds,
        data_points_received: validated.data_points_received,
        signal_strength: validated.signal_strength,
        connection_speed: validated.connection_speed,
        connected_at: validated.connected_at ? new Date(validated.connected_at) : undefined,
        disconnected_at: validated.disconnected_at ? new Date(validated.disconnected_at) : undefined
      }
    )

    res.status(201).json(log)
  } catch (error: any) {
    console.error('Error logging connection:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/health/{vehicleId}:
 *   get:
 *     summary: Get vehicle health summary from OBD2 data
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle health summary
 */
router.get('/health/:vehicleId', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const vehicleId = parseInt(req.params.vehicleId)

    const health = await obd2Service.getVehicleHealthSummary(tenantId, vehicleId)

    if (!health) {
      return res.json({
        vehicle_id: vehicleId,
        health_status: 'unknown',
        active_dtc_count: 0,
        message: 'No OBD2 data available for this vehicle'
      })
    }

    res.json(health)
  } catch (error: any) {
    console.error('Error getting vehicle health:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/fuel-economy/{vehicleId}:
 *   get:
 *     summary: Get fuel economy trends from OBD2 data
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Fuel economy trends
 */
router.get('/fuel-economy/:vehicleId', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const vehicleId = parseInt(req.params.vehicleId)
    const days = req.query.days ? parseInt(req.query.days as string) : 30

    const trends = await obd2Service.getFuelEconomyTrends(tenantId, vehicleId, days)

    res.json(trends)
  } catch (error: any) {
    console.error('Error getting fuel economy trends:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/mobile/obd2/dtc-info/{dtcCode}:
 *   get:
 *     summary: Get DTC information from library
 *     tags: [Mobile OBD2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dtcCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DTC information
 *       404:
 *         description: DTC not found in library
 */
router.get('/dtc-info/:dtcCode', requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const dtcCode = req.params.dtcCode.toUpperCase()

    const info = await obd2Service.getDTCInfo(dtcCode)

    if (!info) {
      return res.status(404).json({
        error: 'DTC not found in library',
        dtc_code: dtcCode
      })
    }

    res.json(info)
  } catch (error: any) {
    console.error('Error getting DTC info:', error)
    res.status(400).json({ error: error.message })
  }
})

export default router
