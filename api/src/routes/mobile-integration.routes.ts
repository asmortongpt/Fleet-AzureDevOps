/**
 * Mobile App Integration API Routes
 *
 * Unified API endpoints for mobile app integration with all features
 */

import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import mobileIntegrationService from '../services/mobile-integration.service'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * Device Registration Schema
 */
const DeviceRegistrationSchema = z.object({
  device_type: z.enum(['ios', 'android']),
  device_id: z.string().min(1),
  device_name: z.string().min(1),
  app_version: z.string().min(1),
  os_version: z.string().min(1),
  push_token: z.string().optional()
})

/**
 * Mobile Sync Schema
 */
const MobileSyncSchema = z.object({
  device_id: z.string().min(1),
  last_sync_at: z.string().datetime().optional(),
  data: z.object({
    inspections: z.array(z.any()).optional(),
    reports: z.array(z.any()).optional(),
    photos: z.array(z.any()).optional(),
    hos_logs: z.array(z.any()).optional()
  })
})

/**
 * Keyless Entry Schema
 */
const KeylessEntrySchema = z.object({
  vehicle_id: z.number().int().positive(),
  device_id: z.string().min(1),
  command: z.enum(['lock', 'unlock', 'start', 'stop']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
})

/**
 * AR Navigation Schema
 */
const ARNavigationSchema = z.object({
  vehicle_id: z.number().int().positive(),
  route_id: z.number().int().positive().optional(),
  current_location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }),
  heading: z.number(),
  include_pois: z.boolean().optional(),
  include_geofences: z.boolean().optional()
})

/**
 * Damage Detection Schema
 */
const DamageDetectionSchema = z.object({
  vehicle_id: z.number().int().positive(),
  photo_url: z.string().url(),
  ai_detections: z.array(z.any()),
  severity: z.enum(['minor', 'moderate', 'major', 'severe']),
  estimated_cost: z.number().optional()
})

/**
 * @swagger
 * /api/mobile/register:
 *   post:
 *     summary: Register or update mobile device
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_type:
 *                 type: string
 *                 enum: [ios, android]
 *               device_id:
 *                 type: string
 *               device_name:
 *                 type: string
 *               app_version:
 *                 type: string
 *               os_version:
 *                 type: string
 *               push_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device registered successfully
 */
router.post('/register', requirePermission('driver:create:global'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = DeviceRegistrationSchema.parse(req.body)
    const userId = (req as any).user.id

    const device = await mobileIntegrationService.registerDevice(
      userId,
      validated.device_type,
      validated.device_id,
      {
        device_name: validated.device_name,
        app_version: validated.app_version,
        os_version: validated.os_version,
        push_token: validated.push_token
      }
    )

    res.json(device)
  } catch (error: any) {
    console.error('Error registering device:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/sync:
 *   post:
 *     summary: Sync mobile data with server
 *     description: Upload offline data and download server updates
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_id:
 *                 type: string
 *               last_sync_at:
 *                 type: string
 *                 format: date-time
 *               data:
 *                 type: object
 *                 properties:
 *                   inspections:
 *                     type: array
 *                   reports:
 *                     type: array
 *                   photos:
 *                     type: array
 *                   hos_logs:
 *                     type: array
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
router.post('/sync', requirePermission('driver:update:global'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = MobileSyncSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const syncRequest = {
      device_id: validated.device_id,
      last_sync_at: validated.last_sync_at ? new Date(validated.last_sync_at) : undefined,
      data: validated.data
    }

    const result = await mobileIntegrationService.syncMobileData(
      tenantId,
      userId,
      syncRequest
    )

    res.json(result)
  } catch (error: any) {
    console.error('Error syncing mobile data:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/route/{vehicleId}:
 *   get:
 *     summary: Get optimized route for mobile navigation
 *     tags: [Mobile Integration]
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
 *         description: Route data with waypoints
 */
router.get('/route/:vehicleId', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const route = await mobileIntegrationService.getMobileRoute(
      tenantId,
      userId,
      vehicleId
    )

    if (!route) {
      return res.status(404).json({ error: 'No active route found for this vehicle' })
    }

    res.json(route)
  } catch (error: any) {
    console.error('Error getting mobile route:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/ar-navigation:
 *   post:
 *     summary: Get AR navigation data
 *     description: Get route, POIs, and geofences for AR overlay
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               route_id:
 *                 type: integer
 *               current_location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               heading:
 *                 type: number
 *               include_pois:
 *                 type: boolean
 *               include_geofences:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: AR navigation data
 */
router.post('/ar-navigation', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const validated = ARNavigationSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id

    const data = await mobileIntegrationService.getARNavigationData(tenantId, validated)

    res.json(data)
  } catch (error: any) {
    console.error('Error getting AR navigation data:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/keyless-entry:
 *   post:
 *     summary: Execute keyless entry command
 *     description: Lock, unlock, start, or stop vehicle remotely
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               device_id:
 *                 type: string
 *               command:
 *                 type: string
 *                 enum: [lock, unlock, start, stop]
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       200:
 *         description: Command executed successfully
 */
router.post('/keyless-entry', requirePermission('vehicle:update:fleet'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = KeylessEntrySchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const result = await mobileIntegrationService.executeKeylessEntry(
      tenantId,
      userId,
      validated
    )

    res.json(result)
  } catch (error: any) {
    console.error('Error executing keyless entry:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/damage-detection:
 *   post:
 *     summary: Submit AI damage detection from mobile
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_id:
 *                 type: integer
 *               photo_url:
 *                 type: string
 *               ai_detections:
 *                 type: array
 *               severity:
 *                 type: string
 *                 enum: [minor, moderate, major, severe]
 *               estimated_cost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Damage detection created
 */
router.post('/damage-detection', requirePermission('safety_incident:create:global'), auditLog, async (req: Request, res: Response) => {
  try {
    const validated = DamageDetectionSchema.parse(req.body)
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id

    const result = await mobileIntegrationService.submitDamageDetection(
      tenantId,
      userId,
      validated
    )

    res.status(201).json(result)
  } catch (error: any) {
    console.error('Error submitting damage detection:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/dispatch/messages:
 *   get:
 *     summary: Get dispatch messages for mobile
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: channel_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of dispatch messages
 */
router.get('/dispatch/messages', requirePermission('communication:view:global'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.id
    const channelId = req.query.channel_id ? parseInt(req.query.channel_id as string) : undefined
    const since = req.query.since ? new Date(req.query.since as string) : undefined

    const messages = await mobileIntegrationService.getDispatchMessagesForMobile(
      tenantId,
      userId,
      channelId,
      since
    )

    res.json(messages)
  } catch (error: any) {
    console.error('Error getting dispatch messages:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/charging-stations/nearby:
 *   get:
 *     summary: Get nearby EV charging stations
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: List of nearby charging stations
 */
router.get('/charging-stations/nearby', requirePermission('charging_station:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const latitude = parseFloat(req.query.latitude as string)
    const longitude = parseFloat(req.query.longitude as string)
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' })
    }

    const stations = await mobileIntegrationService.getNearbyChargingStations(
      tenantId,
      latitude,
      longitude,
      radius
    )

    res.json(stations)
  } catch (error: any) {
    console.error('Error getting nearby charging stations:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

/**
 * @swagger
 * /api/mobile/push-notification:
 *   post:
 *     summary: Send push notification to device (admin only)
 *     tags: [Mobile Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_id:
 *                 type: string
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [high, normal]
 *     responses:
 *       200:
 *         description: Push notification sent
 */
router.post('/push-notification', requirePermission('communication:send:global'), auditLog, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const userRole = (req as any).user.role
    if (userRole !== 'admin' && userRole !== 'fleet_manager') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { device_id, title, body, data, priority } = req.body

    if (!device_id || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const success = await mobileIntegrationService.sendPushNotification(device_id, {
      title,
      body,
      data,
      priority: priority || 'normal'
    })

    res.json({ success })
  } catch (error: any) {
    console.error('Error sending push notification:', error)
    res.status(400).json({ error: getErrorMessage(error) })
  }
})

export default router
