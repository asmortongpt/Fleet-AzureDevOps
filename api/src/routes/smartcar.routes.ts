/**
 * Smartcar Connected Vehicle Routes
 * OAuth flow, signal retrieval, and remote vehicle control
 */

import express, { Request, Response } from 'express'

import logger from '../config/logger'
import { pool } from '../db/connection'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import SmartcarService from '../services/smartcar.service'
import { buildSafeRedirectUrl } from '../utils/redirect-validator'


const router = express.Router()

// Initialize Smartcar service - only if all required env vars are present
let smartcarService: SmartcarService | null = null
try {
  if (process.env.SMARTCAR_CLIENT_ID &&
      process.env.SMARTCAR_CLIENT_SECRET &&
      process.env.SMARTCAR_REDIRECT_URI) {
    smartcarService = new SmartcarService(pool)
    logger.info('Smartcar service initialized')
  } else if (process.env.SMARTCAR_CLIENT_ID) {
    logger.warn('Smartcar partially configured - missing SMARTCAR_REDIRECT_URI or SMARTCAR_CLIENT_SECRET')
  }
} catch (error: unknown) {
  logger.warn('Smartcar service not initialized:', error instanceof Error ? error.message : 'Unknown error')
}

// ---------------------------------------------------------------------------
// Helper: standard route handler for single-signal endpoints
// ---------------------------------------------------------------------------
function signalRoute(
  signalName: string,
  fetchFn: (service: SmartcarService, externalId: string, accessToken: string) => Promise<any>
) {
  return async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = req.params.id
      // Validate UUID format (basic check)
      if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.length === 0) {
        return res.status(400).json({ error: 'Invalid vehicle ID' })
      }

      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        throw new NotFoundError('Vehicle not connected to Smartcar')
      }

      const data = await fetchFn(smartcarService, connection.external_vehicle_id, accessToken)
      res.json({ success: true, data })
    } catch (error: unknown) {
      logger.error(`Get Smartcar ${signalName} error:`, error)
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// ===========================================================================
// Status & OAuth
// ===========================================================================

/**
 * GET /api/smartcar/status
 * Get Smartcar integration status (public)
 */
router.get('/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      configured: smartcarService !== null,
      mode: smartcarService ? smartcarService.getMode() : null,
      message: smartcarService ? 'Smartcar integration is active' : 'Smartcar integration is not configured'
    }
  })
})

/**
 * GET /api/smartcar/connect
 * Initiate Smartcar OAuth flow
 */
router.get('/connect', authenticateJWT, requirePermission('vehicle:manage:global'), (req: AuthRequest, res: Response) => {
  if (!smartcarService) {
    return res.status(503).json({ error: 'Smartcar service not available' })
  }

  try {
    const { vehicle_id } = req.query

    // vehicle_id is now optional - users can connect without specifying a vehicle upfront
    // If provided, it will be used to auto-connect the first Smartcar vehicle to this fleet vehicle

    // Generate state parameter with user info (vehicle_id is optional)
    const state = Buffer.from(
      JSON.stringify({
        vehicle_id: vehicle_id || null,
        user_id: req.user!.id,
        tenant_id: req.user!.tenant_id
      })
    ).toString('base64')

    const authUrl = smartcarService.getAuthUrl(state)

    res.json({
      success: true,
      data: {
        authUrl,
        message: 'Redirect user to this URL to connect their vehicle'
      }
    })
  } catch (error: unknown) {
    logger.error('Smartcar connect error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/smartcar/callback
 * OAuth callback endpoint
 */
router.get('/callback', async (req: Request, res: Response) => {
  if (!smartcarService) {
    return res.status(503).json({ error: 'Smartcar service not available' })
  }

  try {
    const { code, state, error, user_id: queryUserId, tenant_id: queryTenantId } = req.query

    if (error) {
      logger.error('Smartcar OAuth error:', error)
      const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
        error: 'smartcar_auth_failed',
        message: error as string
      })
      return res.redirect(safeErrorUrl)
    }

    if (!code) {
      const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
        error: 'smartcar_auth_failed',
        message: 'Missing authorization code'
      })
      return res.redirect(safeErrorUrl)
    }

    // Handle both state parameter (standard OAuth) and direct query params (Smartcar test mode)
    let vehicle_id: string | number | null = null
    let user_id: string | null = null
    let tenant_id: string | null = null

    if (state) {
      // Standard OAuth: state parameter contains encoded user context
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'))
      vehicle_id = stateData.vehicle_id
      user_id = stateData.user_id
      tenant_id = stateData.tenant_id
    } else if (queryUserId) {
      // Smartcar test mode: user_id and tenant_id passed as query parameters
      user_id = queryUserId as string
      tenant_id = (queryTenantId as string) || '874954c7-b68b-5485-8ddd-183932497849'
    }

    // Validate user_id and tenant_id are present
    if (!user_id || !tenant_id) {
      logger.warn('Missing user_id or tenant_id in state parameter')
      const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
        error: 'invalid_state',
        message: 'Invalid authentication state'
      })
      return res.redirect(safeErrorUrl)
    }

    // vehicle_id is now optional - only validate if provided
    // Can be either UUID (fleet vehicle) or legacy numeric ID
    let parsedVehicleId: string | number | null = null
    if (vehicle_id) {
      // Check if UUID format (contains hyphens)
      if (typeof vehicle_id === 'string' && vehicle_id.includes('-')) {
        // UUID format - validate basic UUID pattern
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(vehicle_id)) {
          logger.warn(`Invalid UUID format in state parameter: ${vehicle_id}`)
          const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
            error: 'invalid_state',
            message: 'Invalid vehicle identifier'
          })
          return res.redirect(safeErrorUrl)
        }
        parsedVehicleId = vehicle_id
      } else {
        // Legacy numeric ID
        const numId = parseInt(String(vehicle_id), 10)
        if (isNaN(numId) || numId <= 0) {
          logger.warn(`Invalid vehicle_id in state parameter: ${vehicle_id}`)
          const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
            error: 'invalid_state',
            message: 'Invalid vehicle identifier'
          })
          return res.redirect(safeErrorUrl)
        }
        parsedVehicleId = numId
      }
    }

    // Exchange code for access token
    const tokens = await smartcarService.exchangeCode(code as string)

    // Get Smartcar vehicle IDs
    const smartcarVehicles = await smartcarService.getVehicles(tokens.access_token)

    if (smartcarVehicles.length === 0) {
      const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
        error: 'no_vehicles',
        message: 'No vehicles found in Smartcar account'
      })
      return res.redirect(safeErrorUrl)
    }

    // Use first vehicle (in production, let user select if multiple)
    const smartcarVehicleId = smartcarVehicles[0]

    // Get vehicle info
    const vehicleInfo = await smartcarService.getVehicleInfo(smartcarVehicleId, tokens.access_token)
    const vin = await smartcarService.getVehicleVin(smartcarVehicleId, tokens.access_token)

    // If we have a specific vehicle_id, store the connection immediately
    if (parsedVehicleId) {
      // Store connection in database (convert to number for legacy DB schema)
      const numericVehicleId = typeof parsedVehicleId === 'string'
        ? parseInt(parsedVehicleId, 10)
        : parsedVehicleId
      await smartcarService.storeVehicleConnection(
        numericVehicleId,
        smartcarVehicleId,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
        {
          ...vehicleInfo,
          vin,
          connected_at: new Date().toISOString()
        }
      )

      // Create audit log
      await pool.query(
        `INSERT INTO audit_logs
         (user_id, tenant_id, action, resource_type, resource_id, changes, ip_address, user_agent, status, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          user_id,
          tenant_id,
          'CONNECT',
          'smartcar_vehicle',
          parsedVehicleId,
          JSON.stringify({ smartcar_vehicle_id: smartcarVehicleId, ...vehicleInfo }),
          req.ip,
          req.get('User-Agent'),
          'success',
          'Smartcar vehicle connected successfully'
        ]
      )

      // Redirect back to vehicle details with success
      const safeSuccessUrl = buildSafeRedirectUrl(`/vehicles/${parsedVehicleId}`, {
        smartcar_connected: 'true'
      })
      return res.redirect(safeSuccessUrl)
    }

    // No specific vehicle was selected - show success page or redirect to vehicles list
    // In the future, this could show a vehicle selection UI
    const safeSuccessUrl = buildSafeRedirectUrl('/vehicles', {
      smartcar_auth_success: 'true',
      message: 'Smartcar account authenticated successfully'
    })
    res.redirect(safeSuccessUrl)
  } catch (error: unknown) {
    logger.error('Smartcar callback error:', error)
    const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
      error: 'smartcar_auth_failed',
      message: 'Connection failed'
    })
    res.redirect(safeErrorUrl)
  }
})

// ===========================================================================
// Signal Endpoints (read-only)
// ===========================================================================

router.get(
  '/vehicles/:id/location',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_location' }),
  signalRoute('location', (svc, extId, token) => svc.getLocation(extId, token))
)

router.get(
  '/vehicles/:id/battery',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_battery' }),
  signalRoute('battery', (svc, extId, token) => svc.getBattery(extId, token))
)

router.get(
  '/vehicles/:id/charge',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_charge' }),
  signalRoute('charge', (svc, extId, token) => svc.getChargeStatus(extId, token))
)

router.get(
  '/vehicles/:id/fuel',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_fuel' }),
  signalRoute('fuel', (svc, extId, token) => svc.getFuel(extId, token))
)

router.get(
  '/vehicles/:id/oil',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_oil' }),
  signalRoute('oil', (svc, extId, token) => svc.getEngineOil(extId, token))
)

router.get(
  '/vehicles/:id/tires',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_tires' }),
  signalRoute('tires', (svc, extId, token) => svc.getTirePressure(extId, token))
)

router.get(
  '/vehicles/:id/diagnostics',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_diagnostics' }),
  signalRoute('diagnostics', (svc, extId, token) => svc.getDiagnostics(extId, token))
)

router.get(
  '/vehicles/:id/lock-status',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_security' }),
  signalRoute('lock-status', (svc, extId, token) => svc.getLockStatus(extId, token))
)

router.get(
  '/vehicles/:id/info',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_info' }),
  signalRoute('info', (svc, extId, token) => svc.getExtendedInfo(extId, token))
)

router.get(
  '/vehicles/:id/vin',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_vin' }),
  signalRoute('vin', async (svc, extId, token) => {
    const vin = await svc.getVehicleVin(extId, token)
    return { vin }
  })
)

/**
 * GET /api/smartcar/vehicles/:id/signals
 * Batch endpoint — fetch all available signals in one request
 */
router.get(
  '/vehicles/:id/signals',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_signals' }),
  signalRoute('signals', (svc, extId, token) => svc.getAllSignals(extId, token))
)

/**
 * GET /api/smartcar/vehicles/:id/connection
 * Get connection status for a vehicle
 */
router.get(
  '/vehicles/:id/connection',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = req.params.id
      if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.length === 0) {
        return res.status(400).json({ error: 'Invalid vehicle ID' })
      }

      const connection = await smartcarService.getVehicleConnection(vehicleId)

      res.json({
        success: true,
        data: {
          connected: !!connection,
          syncStatus: connection?.sync_status || null,
          syncError: connection?.sync_error || null,
          lastSync: connection?.updated_at || null,
          metadata: connection?.metadata || null,
        }
      })
    } catch (error: unknown) {
      logger.error('Get Smartcar connection error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ===========================================================================
// Remote Control (write operations — require CSRF)
// ===========================================================================

router.post(
  '/vehicles/:id/lock',
  csrfProtection, authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'smartcar_security' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        throw new NotFoundError('Vehicle not connected to Smartcar')
      }

      const result = await smartcarService.lockDoors(connection.external_vehicle_id, accessToken)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      logger.error('Lock vehicle error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/vehicles/:id/unlock',
  csrfProtection, authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'smartcar_security' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        throw new NotFoundError('Vehicle not connected to Smartcar')
      }

      const result = await smartcarService.unlockDoors(connection.external_vehicle_id, accessToken)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      logger.error('Unlock vehicle error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/vehicles/:id/charge/start',
  csrfProtection, authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'smartcar_charge' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        throw new NotFoundError('Vehicle not connected to Smartcar')
      }

      const result = await smartcarService.startCharging(connection.external_vehicle_id, accessToken)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      logger.error('Start charging error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/vehicles/:id/charge/stop',
  csrfProtection, authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'smartcar_charge' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        throw new NotFoundError('Vehicle not connected to Smartcar')
      }

      const result = await smartcarService.stopCharging(connection.external_vehicle_id, accessToken)
      res.json({ success: true, data: result })
    } catch (error: unknown) {
      logger.error('Stop charging error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ===========================================================================
// Sync & Disconnect
// ===========================================================================

router.post(
  '/vehicles/:id/sync',
  csrfProtection, authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'smartcar_sync' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      await smartcarService.syncVehicleData(vehicleId)
      res.json({ success: true, data: { message: 'Vehicle data synced successfully' } })
    } catch (error: unknown) {
      logger.error('Sync Smartcar data error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.delete(
  '/vehicles/:id/disconnect',
  csrfProtection, authenticateJWT,
  requirePermission('vehicle:manage:global'),
  auditLog({ action: 'DELETE', resourceType: 'smartcar_connection' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        throw new NotFoundError('Vehicle not connected to Smartcar')
      }

      // Revoke access on Smartcar side
      await smartcarService.disconnectVehicle(connection.access_token)

      // Update database
      await pool.query(
        `UPDATE vehicle_telematics_connections
         SET sync_status = 'disconnected', updated_at = NOW()
         WHERE vehicle_id = $1
         AND provider_id = (SELECT id FROM telematics_providers WHERE name = 'smartcar')`,
        [vehicleId]
      )

      res.json({ success: true, data: { message: 'Smartcar disconnected successfully' } })
    } catch (error: unknown) {
      logger.error('Disconnect Smartcar error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ===========================================================================
// Admin: List all connections
// ===========================================================================

router.get(
  '/connections',
  authenticateJWT,
  requirePermission('vehicle:manage:global'),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const connections = await smartcarService.getAllConnections(req.user?.tenant_id)
      res.json({
        success: true,
        data: {
          connections,
          total: connections.length,
          mode: smartcarService.getMode(),
        }
      })
    } catch (error: unknown) {
      logger.error('List Smartcar connections error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ===========================================================================
// Webhook Verification
// ===========================================================================

/**
 * POST /api/smartcar/callback
 * Smartcar webhook verification and event handling
 * Smartcar sends a VERIFY challenge that must be signed with the management token
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const payload = req.body

    if (!payload) {
      return res.status(400).json({ error: 'Invalid JSON in request body' })
    }

    const eventType = payload.eventType

    // Handle webhook verification challenge
    if (eventType === 'VERIFY') {
      const managementToken = process.env.SMARTCAR_MANAGEMENT_TOKEN

      if (!managementToken) {
        logger.warn('SMARTCAR_MANAGEMENT_TOKEN not configured - webhook verification will fail')
        return res.status(503).json({ error: 'Webhook verification not configured' })
      }

      const data = payload.data || {}
      const challenge = data.challenge

      if (!challenge) {
        return res.status(400).json({ error: 'Challenge not provided in payload' })
      }

      // Generate HMAC-SHA256 signature
      const crypto = require('crypto')
      const hmac = crypto
        .createHmac('sha256', managementToken)
        .update(challenge)
        .digest('hex')

      logger.info('Webhook verification challenge received and signed', { challengeId: challenge.substring(0, 20) })

      return res.json({ challenge: hmac })
    }

    // Handle vehicle state events
    if (eventType === 'VEHICLE_STATE') {
      logger.info('Vehicle state event received from Smartcar webhook', { payload })

      // Store webhook event in database
      try {
        const smartcarProviderId = await pool.query(
          `SELECT id FROM telematics_providers WHERE name = 'smartcar' LIMIT 1`
        )

        if (smartcarProviderId.rows.length > 0) {
          await pool.query(
            `INSERT INTO telematics_webhook_events
             (provider_id, event_type, external_id, payload, processed, tenant_id)
             VALUES ($1, $2, $3, $4, false, $5)`,
            [
              smartcarProviderId.rows[0].id,
              'VEHICLE_STATE',
              payload.data?.vehicleId || 'unknown',
              JSON.stringify(payload),
              '874954c7-b68b-5485-8ddd-183932497849' // dev tenant
            ]
          )
          logger.info('Vehicle state event stored in database')
        }
      } catch (dbError) {
        logger.error('Failed to store webhook event:', dbError)
      }

      return res.status(200).json({ status: 'received' })
    }

    // Handle vehicle error events
    if (eventType === 'VEHICLE_ERROR') {
      logger.warn('Vehicle error event received from Smartcar webhook', { payload })

      // Store webhook event in database
      try {
        const smartcarProviderId = await pool.query(
          `SELECT id FROM telematics_providers WHERE name = 'smartcar' LIMIT 1`
        )

        if (smartcarProviderId.rows.length > 0) {
          await pool.query(
            `INSERT INTO telematics_webhook_events
             (provider_id, event_type, external_id, payload, processed, tenant_id)
             VALUES ($1, $2, $3, $4, false, $5)`,
            [
              smartcarProviderId.rows[0].id,
              'VEHICLE_ERROR',
              payload.data?.vehicleId || 'unknown',
              JSON.stringify(payload),
              '874954c7-b68b-5485-8ddd-183932497849' // dev tenant
            ]
          )
          logger.info('Vehicle error event stored in database')
        }
      } catch (dbError) {
        logger.error('Failed to store webhook event:', dbError)
      }

      return res.status(200).json({ status: 'received' })
    }

    // Unknown event type
    logger.warn('Unknown Smartcar webhook event type', { eventType })
    res.status(400).json({ error: 'Unknown event type' })
  } catch (error: unknown) {
    logger.error('Smartcar webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
