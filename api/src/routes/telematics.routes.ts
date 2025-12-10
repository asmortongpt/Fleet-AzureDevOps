/**
 * Telematics Integration Routes (Samsara, Geotab, Verizon, Motive)
 * Real-time fleet tracking, driver safety, and compliance
 */

import crypto from 'crypto'

import express, { Response } from 'express'

import pool from '../config/database' // SECURITY: Import database pool
import logger from '../config/logger' // Wave 23: Add Winston logger
import { NotFoundError, ValidationError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission, rateLimit } from '../middleware/permissions'
import { TelematicsRepository } from '../repositories/TelematicsRepository'
import SamsaraService from '../services/samsara.service'
import { getErrorMessage } from '../utils/error-handler'
import { container } from '../container'
import { TYPES } from '../types'

const router = express.Router()
router.use(authenticateJWT)

// Initialize TelematicsRepository
const telematicsRepo = container.get<TelematicsRepository>(TYPES.TelematicsRepository)

// Initialize Samsara service
let samsaraService: SamsaraService | null = null
try {
  if (process.env.SAMSARA_API_TOKEN) {
    samsaraService = new SamsaraService(pool)
    console.log('✅ Samsara service initialized')
  }
} catch (error: any) {
  console.warn('⚠️  Samsara service not initialized:', getErrorMessage(error))
}

/**
 * GET /api/telematics/providers
 * List all supported telematics providers
 */
router.get(
  '/providers',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'telematics_providers' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const providers = await telematicsRepo.getAllProviders()

      res.json({
        providers,
        configured: {
          samsara: !!process.env.SAMSARA_API_TOKEN,
          geotab: !!process.env.GEOTAB_DATABASE,
          verizon: !!process.env.VERIZON_API_KEY,
          motive: !!process.env.MOTIVE_API_KEY,
          smartcar: !!process.env.SMARTCAR_CLIENT_ID
        }
      })
    } catch (error) {
      logger.error(`Get providers error:`, error) // Wave 23: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

/**
 * POST /api/telematics/connect
 * Connect a vehicle to a telematics provider
 */
router.post(
  '/connect',
 csrfProtection, requirePermission('telemetry:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'vehicle_telematics_connections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicle_id, provider_name, external_vehicle_id, access_token, metadata } = req.body

      if (!vehicle_id || !provider_name || !external_vehicle_id) {
        return res.status(400).json({
          error: 'vehicle_id, provider_name, and external_vehicle_id are required'
        })
      }

      // SECURITY: Verify vehicle belongs to tenant before connecting
      const vehicleOwned = await telematicsRepo.verifyVehicleOwnership(vehicle_id, req.user!.tenant_id)

      if (!vehicleOwned) {
        return res.status(404).json({ error: 'Vehicle not found or access denied' })
      }

      // Get provider ID (system table, no tenant_id required)
      const provider = await telematicsRepo.getProviderByName(provider_name)

      if (!provider) {
        return res.status(404).json({ error: `Provider not found` })
      }

      // SECURITY: Create connection with tenant_id isolation
      const connection = await telematicsRepo.upsertConnection(
        vehicle_id,
        provider.id,
        external_vehicle_id,
        access_token,
        metadata,
        req.user!.tenant_id
      )

      res.status(201).json({
        message: 'Vehicle connected successfully',
        connection
      })
    } catch (error: any) {
      logger.error('Connect vehicle error:', error) // Wave 23: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /api/telematics/connections
 * Get all telematics connections for vehicles
 */
router.get(
  '/connections',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'vehicle_telematics_connections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // SECURITY: Tenant-safe connections query with double check
      const connections = await telematicsRepo.getAllConnections(req.user!.tenant_id)

      res.json({ connections })
    } catch (error) {
      logger.error(`Get connections error:`, error) // Wave 23: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

/**
 * GET /api/telematics/vehicles/:id/location
 * Get real-time location for a vehicle
 */
router.get(
  '/vehicles/:id/location',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'vehicle_telemetry' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // SECURITY: Get real-time location with tenant isolation
      const location = await telematicsRepo.getLatestLocation(
        parseInt(req.params.id, 10),
        req.user!.tenant_id
      )

      if (!location) {
        return res.status(404).json({ error: `No location data found` })
      }

      res.json(location)
    } catch (error) {
      logger.error(`Get vehicle location error:`, error) // Wave 23: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /api/telematics/vehicles/:id/stats
 * Get vehicle statistics (odometer, fuel, battery, etc.)
 */
router.get(
  '/vehicles/:id/stats',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'vehicle_telemetry' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // SECURITY: Get vehicle stats with tenant isolation
      const stats = await telematicsRepo.getLatestStats(
        parseInt(req.params.id, 10),
        req.user!.tenant_id
      )

      if (!stats) {
        return res.status(404).json({ error: `No stats data found` })
      }

      res.json(stats)
    } catch (error) {
      logger.error(`Get vehicle stats error:`, error) // Wave 23: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /api/telematics/vehicles/:id/history
 * Get historical location data for a vehicle
 */
router.get(
  '/vehicles/:id/history',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'vehicle_telemetry' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { start_time, end_time, limit = 1000 } = req.query

      // SECURITY: Build tenant-safe historical location query
      const points = await telematicsRepo.getHistoricalTelemetry(
        parseInt(req.params.id, 10),
        req.user!.tenant_id,
        start_time as string | undefined,
        end_time as string | undefined,
        Number(limit)
      )

      res.json({
        vehicle_id: req.params.id,
        points,
        count: points.length
      })
    } catch (error) {
      logger.error(`Get vehicle history error:`, error) // Wave 23: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /api/telematics/safety-events
 * Get driver safety events (harsh braking, acceleration, etc.)
 */
router.get(
  '/safety-events',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'driver_safety_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicle_id, driver_id, event_type, severity, start_date, end_date, page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // SECURITY: Build tenant-safe safety events query with defense in depth
      const filters = {
        vehicleId: vehicle_id ? Number(vehicle_id) : undefined,
        driverId: driver_id ? Number(driver_id) : undefined,
        eventType: event_type as string | undefined,
        severity: severity as string | undefined,
        startDate: start_date as string | undefined,
        endDate: end_date as string | undefined
      }

      const events = await telematicsRepo.getSafetyEvents(
        req.user!.tenant_id,
        filters,
        { limit: Number(limit), offset }
      )

      const total = await telematicsRepo.countSafetyEvents(req.user!.tenant_id, filters)

      res.json({
        events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      logger.error(`Get safety events error:`, error) // Wave 23: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /api/telematics/video/request
 * Request dash cam video clip from Samsara
 */
router.post(
  '/video/request',
 csrfProtection, requirePermission('telemetry:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'video_request' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!samsaraService) {
        return res.status(503).json({ error: 'Samsara service not available' })
      }

      const { vehicle_id, start_time, duration_seconds = 30 } = req.body

      if (!vehicle_id || !start_time) {
        throw new ValidationError("vehicle_id and start_time are required")
      }

      // SECURITY: Get Samsara external ID with tenant isolation
      const connection = await telematicsRepo.getConnection(
        vehicle_id,
        'samsara',
        req.user!.tenant_id
      )

      if (!connection) {
        throw new NotFoundError("Vehicle not connected to Samsara")
      }

      const externalVehicleId = connection.external_vehicle_id

      // Request video from Samsara
      const videoRequest = await samsaraService.requestVideo(
        externalVehicleId,
        start_time,
        duration_seconds
      )

      res.json({
        message: 'Video request submitted',
        request_id: videoRequest.requestId,
        status: videoRequest.status,
        expires_at: videoRequest.expiresAt
      })
    } catch (error: any) {
      logger.error('Request video error:', error) // Wave 23: Winston logger
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
    }
  }
)

/**
 * GET /api/telematics/video/:requestId
 * Check video request status and get download URL
 */
router.get(
  '/video/:requestId',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'video_request' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!samsaraService) {
        return res.status(503).json({ error: 'Samsara service not available' })
      }

      const status = await samsaraService.getVideoStatus(req.params.requestId)

      res.json(status)
    } catch (error: any) {
      logger.error('Get video status error:', error) // Wave 23: Winston logger
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
    }
  }
)

/**
 * POST /api/telematics/webhook/samsara
 * Webhook handler for Samsara real-time events
 */
router.post(
  '/webhook/samsara',
csrfProtection, async (req: express.Request, res: Response) => {
    try {
      // Verify webhook signature (if configured)
      const signature = req.headers['x-samsara-signature'] as string
      const webhookSecret = process.env.SAMSARA_WEBHOOK_SECRET

      if (webhookSecret && signature) {
        const payload = JSON.stringify(req.body)
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(payload)
          .digest('hex')

        if (signature !== expectedSignature) {
          logger.error('Invalid webhook signature') // Wave 23: Winston logger
          return res.status(401).json({ error: 'Invalid signature' })
        }
      }

      // Get Samsara provider ID
      const provider = await telematicsRepo.getProviderByName('samsara')
      if (!provider) {
        throw new Error('Samsara provider not found')
      }

      // Log webhook event
      await telematicsRepo.logWebhookEvent(
        provider.id,
        req.body.eventType,
        req.body.id,
        req.body
      )

      // TODO: Process webhook event based on type
      // - gps: Update vehicle_telemetry
      // - safety_event: Insert into driver_safety_events
      // - hos: Update driver_hos_logs
      // - diagnostic: Insert into vehicle_diagnostic_codes

      res.json({ message: 'Webhook received' })
    } catch (error) {
      logger.error('Webhook error:', error) // Wave 23: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /api/telematics/sync
 * Manually trigger Samsara synchronization
 */
router.post(
  '/sync',
 csrfProtection, requirePermission('telemetry:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'telematics_sync' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!samsaraService) {
        return res.status(503).json({ error: 'Samsara service not available' })
      }

      const { sync_type = 'full' } = req.body

      let result: any

      switch (sync_type) {
        case 'vehicles':
          result = { vehicles: await samsaraService.syncVehicles() }
          break
        case 'telemetry':
          result = { telemetry: await samsaraService.syncTelemetry() }
          break
        case 'safety':
          result = { events: await samsaraService.syncSafetyEvents() }
          break
        case 'full':
        default:
          result = await samsaraService.fullSync()
          break
      }

      res.json({
        message: 'Sync completed successfully',
        sync_type,
        result
      })
    } catch (error: any) {
      logger.error('Sync error:', error) // Wave 23: Winston logger
      res.status(500).json({ error: getErrorMessage(error) || 'Internal server error' })
    }
  }
)

/**
 * GET /api/telematics/dashboard
 * Get fleet dashboard data (live map, stats, alerts)
 */
router.get(
  '/dashboard',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'telematics_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // SECURITY: Get latest locations for all vehicles with tenant isolation
      const vehicles = await telematicsRepo.getDashboardVehicles(req.user!.tenant_id)

      // SECURITY: Get recent safety events (last 24 hours) with tenant isolation
      const safety_events = await telematicsRepo.getDashboardSafetyEvents(req.user!.tenant_id)

      // SECURITY: Get active diagnostic codes with tenant isolation
      const diagnostics = await telematicsRepo.getDashboardDiagnostics(req.user!.tenant_id)

      res.json({
        vehicles,
        safety_events,
        diagnostics,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error(`Get dashboard error:`, error) // Wave 23: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

export default router
