/**
 * Smartcar Connected Vehicle Routes
 * OAuth flow and remote vehicle control
 */

import express, { Request, Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import SmartcarService from '../services/smartcar.service'

const router = express.Router()

// Initialize Smartcar service
let smartcarService: SmartcarService | null = null
try {
  if (process.env.SMARTCAR_CLIENT_ID && process.env.SMARTCAR_CLIENT_SECRET) {
    smartcarService = new SmartcarService(pool)
    console.log('✅ Smartcar service initialized')
  }
} catch (error: any) {
  console.warn('⚠️  Smartcar service not initialized:', error.message)
}

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

    if (!vehicle_id) {
      return res.status(400).json({ error: 'vehicle_id query parameter is required' })
    }

    // Generate state parameter with vehicle_id and user info
    const state = Buffer.from(
      JSON.stringify({
        vehicle_id,
        user_id: req.user!.id,
        tenant_id: req.user!.tenant_id
      })
    ).toString('base64')

    const authUrl = smartcarService.getAuthUrl(state)

    res.json({
      authUrl,
      message: 'Redirect user to this URL to connect their vehicle'
    })
  } catch (error: any) {
    console.error('Smartcar connect error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
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
    const { code, state, error } = req.query

    if (error) {
      console.error('Smartcar OAuth error:', error)
      return res.redirect(`/vehicles?error=smartcar_auth_failed&message=${encodeURIComponent(error as string)}`)
    }

    if (!code || !state) {
      return res.redirect('/vehicles?error=smartcar_auth_failed&message=Missing+authorization+code')
    }

    // Decode state parameter
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'))
    const { vehicle_id, user_id, tenant_id } = stateData

    // Exchange code for access token
    const tokens = await smartcarService.exchangeCode(code as string)

    // Get Smartcar vehicle IDs
    const smartcarVehicles = await smartcarService.getVehicles(tokens.access_token)

    if (smartcarVehicles.length === 0) {
      return res.redirect('/vehicles?error=no_vehicles&message=No+vehicles+found+in+Smartcar+account')
    }

    // Use first vehicle (in production, let user select if multiple)
    const smartcarVehicleId = smartcarVehicles[0]

    // Get vehicle info
    const vehicleInfo = await smartcarService.getVehicleInfo(smartcarVehicleId, tokens.access_token)
    const vin = await smartcarService.getVehicleVin(smartcarVehicleId, tokens.access_token)

    // Store connection in database
    await smartcarService.storeVehicleConnection(
      parseInt(vehicle_id),
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
        vehicle_id,
        JSON.stringify({ smartcar_vehicle_id: smartcarVehicleId, ...vehicleInfo }),
        req.ip,
        req.get('User-Agent'),
        'success',
        'Smartcar vehicle connected successfully'
      ]
    )

    res.redirect(`/vehicles/${vehicle_id}?smartcar_connected=true`)
  } catch (error: any) {
    console.error('Smartcar callback error:', error)
    res.redirect(`/vehicles?error=smartcar_auth_failed&message=${encodeURIComponent(error.message)}`)
  }
})

/**
 * GET /api/smartcar/vehicles/:id/location
 * Get real-time vehicle location
 */
router.get(
  '/vehicles/:id/location',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_location' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
      }

      const location = await smartcarService.getLocation(connection.external_vehicle_id, accessToken)

      res.json(location)
    } catch (error: any) {
      console.error('Get Smartcar location error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * GET /api/smartcar/vehicles/:id/battery
 * Get EV battery level
 */
router.get(
  '/vehicles/:id/battery',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_battery' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
      }

      const battery = await smartcarService.getBattery(connection.external_vehicle_id, accessToken)

      res.json(battery)
    } catch (error: any) {
      console.error('Get Smartcar battery error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * GET /api/smartcar/vehicles/:id/charge
 * Get EV charge status
 */
router.get(
  '/vehicles/:id/charge',
  authenticateJWT,
  requirePermission('vehicle:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'smartcar_charge' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)
      const accessToken = await smartcarService.ensureValidToken(vehicleId)
      const connection = await smartcarService.getVehicleConnection(vehicleId)

      if (!connection) {
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
      }

      const charge = await smartcarService.getChargeStatus(connection.external_vehicle_id, accessToken)

      res.json(charge)
    } catch (error: any) {
      console.error('Get Smartcar charge error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * POST /api/smartcar/vehicles/:id/lock
 * Lock vehicle doors
 */
router.post(
  '/vehicles/:id/lock',
  authenticateJWT,
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
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
      }

      const result = await smartcarService.lockDoors(connection.external_vehicle_id, accessToken)

      res.json(result)
    } catch (error: any) {
      console.error('Lock vehicle error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * POST /api/smartcar/vehicles/:id/unlock
 * Unlock vehicle doors
 */
router.post(
  '/vehicles/:id/unlock',
  authenticateJWT,
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
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
      }

      const result = await smartcarService.unlockDoors(connection.external_vehicle_id, accessToken)

      res.json(result)
    } catch (error: any) {
      console.error('Unlock vehicle error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * POST /api/smartcar/vehicles/:id/charge/start
 * Start EV charging
 */
router.post(
  '/vehicles/:id/charge/start',
  authenticateJWT,
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
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
      }

      const result = await smartcarService.startCharging(connection.external_vehicle_id, accessToken)

      res.json(result)
    } catch (error: any) {
      console.error('Start charging error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * POST /api/smartcar/vehicles/:id/charge/stop
 * Stop EV charging
 */
router.post(
  '/vehicles/:id/charge/stop',
  authenticateJWT,
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
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
      }

      const result = await smartcarService.stopCharging(connection.external_vehicle_id, accessToken)

      res.json(result)
    } catch (error: any) {
      console.error('Stop charging error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * DELETE /api/smartcar/vehicles/:id/disconnect
 * Disconnect Smartcar from vehicle
 */
router.delete(
  '/vehicles/:id/disconnect',
  authenticateJWT,
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
        return res.status(404).json({ error: 'Vehicle not connected to Smartcar' })
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

      res.json({ message: 'Smartcar disconnected successfully' })
    } catch (error: any) {
      console.error('Disconnect Smartcar error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

/**
 * POST /api/smartcar/vehicles/:id/sync
 * Manually sync vehicle data to telemetry
 */
router.post(
  '/vehicles/:id/sync',
  authenticateJWT,
  requirePermission('vehicle:update:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'smartcar_sync' }),
  async (req: AuthRequest, res: Response) => {
    if (!smartcarService) {
      return res.status(503).json({ error: 'Smartcar service not available' })
    }

    try {
      const vehicleId = parseInt(req.params.id)

      await smartcarService.syncVehicleData(vehicleId)

      res.json({ message: 'Vehicle data synced successfully' })
    } catch (error: any) {
      console.error('Sync Smartcar data error:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
)

export default router
