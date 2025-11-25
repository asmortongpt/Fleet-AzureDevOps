/**
 * Telematics Integration Routes (Samsara, Geotab, Verizon, Motive)
 * Real-time fleet tracking, driver safety, and compliance
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, rateLimit } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import SamsaraService from '../services/samsara.service'
import crypto from 'crypto'
import { cacheMiddleware, invalidateOnWrite } from '../middleware/cache'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()
router.use(authenticateJWT)

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
      const result = await pool.query(
        `SELECT id, name, display_name, supports_webhooks, supports_video,
                supports_temperature, supports_hos, created_at
         FROM telematics_providers
         ORDER BY display_name`
      )

      res.json({
        providers: result.rows,
        configured: {
          samsara: !!process.env.SAMSARA_API_TOKEN,
          geotab: !!process.env.GEOTAB_DATABASE,
          verizon: !!process.env.VERIZON_API_KEY,
          motive: !!process.env.MOTIVE_API_KEY,
          smartcar: !!process.env.SMARTCAR_CLIENT_ID
        }
      })
    } catch (error) {
      console.error('Get providers error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /api/telematics/connect
 * Connect a vehicle to a telematics provider
 */
router.post(
  '/connect',
  requirePermission('telemetry:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'vehicle_telematics_connections' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicle_id, provider_name, external_vehicle_id, access_token, metadata } = req.body

      if (!vehicle_id || !provider_name || !external_vehicle_id) {
        return res.status(400).json({
          error: 'vehicle_id, provider_name, and external_vehicle_id are required'
        })
      }

      // Get provider ID
      const providerResult = await pool.query(
        'SELECT id FROM telematics_providers WHERE name = $1',
        [provider_name]
      )

      if (providerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Provider not found' })
      }

      const provider_id = providerResult.rows[0].id

      // Create connection
      const result = await pool.query(
        `INSERT INTO vehicle_telematics_connections
         (vehicle_id, provider_id, external_vehicle_id, access_token, metadata, last_sync_at, sync_status)
         VALUES ($1, $2, $3, $4, $5, NOW(), 'active')
         ON CONFLICT (vehicle_id, provider_id)
         DO UPDATE SET
           external_vehicle_id = EXCLUDED.external_vehicle_id,
           access_token = EXCLUDED.access_token,
           metadata = EXCLUDED.metadata,
           sync_status = 'active',
           updated_at = NOW()
         RETURNING *`,
        [vehicle_id, provider_id, external_vehicle_id, access_token, JSON.stringify(metadata || {})]
      )

      res.status(201).json({
        message: 'Vehicle connected successfully',
        connection: result.rows[0]
      })
    } catch (error: any) {
      console.error('Connect vehicle error:', error)
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
      const result = await pool.query(
        `SELECT
           vtc.id, vtc.vehicle_id, vtc.external_vehicle_id,
           vtc.last_sync_at, vtc.sync_status, vtc.sync_error, vtc.metadata,
           tp.name as provider_name, tp.display_name as provider_display_name,
           v.name as vehicle_name, v.vin
         FROM vehicle_telematics_connections vtc
         JOIN telematics_providers tp ON vtc.provider_id = tp.id
         JOIN vehicles v ON vtc.vehicle_id = v.id
         WHERE v.tenant_id = $1
         ORDER BY v.name, tp.display_name`,
        [req.user!.tenant_id]
      )

      res.json({ connections: result.rows })
    } catch (error) {
      console.error('Get connections error:', error)
      res.status(500).json({ error: 'Internal server error' })
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
      const result = await pool.query(
        `SELECT
           vt.latitude, vt.longitude, vt.heading, vt.speed_mph, vt.address,
           vt.timestamp, vt.engine_state,
           tp.display_name as provider
         FROM vehicle_telemetry vt
         JOIN telematics_providers tp ON vt.provider_id = tp.id
         JOIN vehicles v ON vt.vehicle_id = v.id
         WHERE vt.vehicle_id = $1 AND v.tenant_id = $2
         ORDER BY vt.timestamp DESC
         LIMIT 1`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No location data found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get vehicle location error:', error)
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
      const result = await pool.query(
        `SELECT
           vt.odometer_miles, vt.fuel_percent, vt.fuel_gallons,
           vt.battery_percent, vt.battery_voltage_12v,
           vt.engine_rpm, vt.engine_state, vt.engine_hours,
           vt.temperature_f, vt.oil_life_percent, vt.coolant_temp_f,
           vt.is_charging, vt.charge_rate_kw, vt.estimated_range_miles,
           vt.timestamp,
           tp.display_name as provider
         FROM vehicle_telemetry vt
         JOIN telematics_providers tp ON vt.provider_id = tp.id
         JOIN vehicles v ON vt.vehicle_id = v.id
         WHERE vt.vehicle_id = $1 AND v.tenant_id = $2
         ORDER BY vt.timestamp DESC
         LIMIT 1`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No stats data found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Get vehicle stats error:', error)
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

      let query = `
        SELECT
          vt.latitude, vt.longitude, vt.heading, vt.speed_mph,
          vt.odometer_miles, vt.timestamp, vt.address
        FROM vehicle_telemetry vt
        JOIN vehicles v ON vt.vehicle_id = v.id
        WHERE vt.vehicle_id = $1 AND v.tenant_id = $2
      `
      const params: any[] = [req.params.id, req.user!.tenant_id]

      if (start_time) {
        params.push(start_time)
        query += ` AND vt.timestamp >= $${params.length}`
      }

      if (end_time) {
        params.push(end_time)
        query += ` AND vt.timestamp <= $${params.length}`
      }

      query += ` ORDER BY vt.timestamp DESC LIMIT $${params.length + 1}`
      params.push(limit)

      const result = await pool.query(query, params)

      res.json({
        vehicle_id: req.params.id,
        points: result.rows,
        count: result.rows.length
      })
    } catch (error) {
      console.error('Get vehicle history error:', error)
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

      let query = `
        SELECT
          dse.id, dse.event_type, dse.severity, dse.latitude, dse.longitude,
          dse.address, dse.speed_mph, dse.g_force, dse.timestamp,
          dse.video_url, dse.video_thumbnail_url,
          v.name as vehicle_name, v.vin,
          d.first_name || ' ' || d.last_name as driver_name,
          tp.display_name as provider
        FROM driver_safety_events dse
        JOIN vehicles v ON dse.vehicle_id = v.id
        LEFT JOIN drivers d ON dse.driver_id = d.id
        LEFT JOIN telematics_providers tp ON dse.provider_id = tp.id
        WHERE v.tenant_id = $1
      `
      const params: any[] = [req.user!.tenant_id]

      if (vehicle_id) {
        params.push(vehicle_id)
        query += ` AND dse.vehicle_id = $${params.length}`
      }

      if (driver_id) {
        params.push(driver_id)
        query += ` AND dse.driver_id = $${params.length}`
      }

      if (event_type) {
        params.push(event_type)
        query += ` AND dse.event_type = $${params.length}`
      }

      if (severity) {
        params.push(severity)
        query += ` AND dse.severity = $${params.length}`
      }

      if (start_date) {
        params.push(start_date)
        query += ` AND dse.timestamp >= $${params.length}`
      }

      if (end_date) {
        params.push(end_date)
        query += ` AND dse.timestamp <= $${params.length}`
      }

      query += ` ORDER BY dse.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = query.split('ORDER BY')[0].replace(/SELECT .* FROM/, 'SELECT COUNT(*) FROM')
      const countResult = await pool.query(countQuery, params.slice(0, -2))

      res.json({
        events: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get safety events error:', error)
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
  requirePermission('telemetry:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'video_request' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!samsaraService) {
        return res.status(503).json({ error: 'Samsara service not available' })
      }

      const { vehicle_id, start_time, duration_seconds = 30 } = req.body

      if (!vehicle_id || !start_time) {
        return res.status(400).json({ error: 'vehicle_id and start_time are required' })
      }

      // Get Samsara external ID
      const connResult = await pool.query(
        `SELECT external_vehicle_id FROM vehicle_telematics_connections vtc
         JOIN vehicles v ON vtc.vehicle_id = v.id
         WHERE vtc.vehicle_id = $1 AND v.tenant_id = $2
         AND vtc.provider_id = (SELECT id FROM telematics_providers WHERE name = 'samsara')',
        [vehicle_id, req.user!.tenant_id]
      )

      if (connResult.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not connected to Samsara' })
      }

      const externalVehicleId = connResult.rows[0].external_vehicle_id

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
      console.error('Request video error:', error)
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
      console.error('Get video status error:', error)
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
  async (req: express.Request, res: Response) => {
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
          console.error('Invalid webhook signature')
          return res.status(401).json({ error: 'Invalid signature' })
        }
      }

      // Log webhook event
      await pool.query(
        `INSERT INTO telematics_webhook_events
         (provider_id, event_type, external_id, payload, processed)
         VALUES ((SELECT id FROM telematics_providers WHERE name = 'samsara'), $1, $2, $3, false)',
        [req.body.eventType, req.body.id, JSON.stringify(req.body)]
      )

      // TODO: Process webhook event based on type
      // - gps: Update vehicle_telemetry
      // - safety_event: Insert into driver_safety_events
      // - hos: Update driver_hos_logs
      // - diagnostic: Insert into vehicle_diagnostic_codes

      res.json({ message: 'Webhook received' })
    } catch (error) {
      console.error('Webhook error:', error)
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
  requirePermission('telemetry:create:fleet'),
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
      console.error('Sync error:', error)
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
      // Get latest locations for all vehicles
      const locationsResult = await pool.query(
        `SELECT DISTINCT ON (v.id)
           v.id, v.name, v.vin, v.make, v.model,
           lvt.latitude, lvt.longitude, lvt.heading, lvt.speed_mph,
           lvt.address, lvt.engine_state, lvt.timestamp
         FROM vehicles v
         LEFT JOIN latest_vehicle_telemetry lvt ON v.id = lvt.vehicle_id
         WHERE v.tenant_id = $1 AND v.status = 'active'
         ORDER BY v.id, lvt.timestamp DESC`,
        [req.user!.tenant_id]
      )

      // Get recent safety events (last 24 hours)
      const eventsResult = await pool.query(
        `SELECT COUNT(*) as count, event_type, severity
         FROM driver_safety_events dse
         JOIN vehicles v ON dse.vehicle_id = v.id
         WHERE v.tenant_id = $1 AND dse.timestamp >= NOW() - INTERVAL '24 hours'
         GROUP BY event_type, severity
         ORDER BY count DESC`,
        [req.user!.tenant_id]
      )

      // Get active diagnostic codes
      const diagnosticsResult = await pool.query(
        `SELECT COUNT(*) as count, severity
         FROM vehicle_diagnostic_codes vdc
         JOIN vehicles v ON vdc.vehicle_id = v.id
         WHERE v.tenant_id = $1 AND vdc.cleared_at IS NULL
         GROUP BY severity`,
        [req.user!.tenant_id]
      )

      res.json({
        vehicles: locationsResult.rows,
        safety_events: eventsResult.rows,
        diagnostics: diagnosticsResult.rows,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Get dashboard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
