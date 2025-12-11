Here's the complete refactored file with `pool.query` and `db.query` replaced by a repository pattern:


import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'
import express, { Request, Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import SmartcarService from '../services/smartcar.service'
import { buildSafeRedirectUrl, validateInternalPath } from '../utils/redirect-validator'
import { csrfProtection } from '../middleware/csrf'
import { SmartcarRepository } from '../repositories/smartcar.repository'
import { UserRepository } from '../repositories/user.repository'
import { VehicleRepository } from '../repositories/vehicle.repository'

const router = express.Router()

// Initialize Smartcar service
let smartcarService: SmartcarService | null = null
let smartcarRepository: SmartcarRepository | null = null
let userRepository: UserRepository | null = null
let vehicleRepository: VehicleRepository | null = null

try {
  if (process.env.SMARTCAR_CLIENT_ID && process.env.SMARTCAR_CLIENT_SECRET) {
    smartcarRepository = container.resolve(SmartcarRepository)
    userRepository = container.resolve(UserRepository)
    vehicleRepository = container.resolve(VehicleRepository)
    smartcarService = new SmartcarService(smartcarRepository)
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
      throw new ValidationError("vehicle_id query parameter is required")
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
    logger.error('Smartcar connect error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * GET /api/smartcar/callback
 * OAuth callback endpoint
 */
router.get('/callback', async (req: Request, res: Response) => {
  if (!smartcarService || !smartcarRepository || !userRepository || !vehicleRepository) {
    return res.status(503).json({ error: 'Smartcar service not available' })
  }

  try {
    const { code, state, error } = req.query

    if (error) {
      logger.error('Smartcar OAuth error:', error)
      const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
        error: 'smartcar_auth_failed',
        message: error as string
      })
      return res.redirect(safeErrorUrl)
    }

    if (!code || !state) {
      const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
        error: 'smartcar_auth_failed',
        message: 'Missing authorization code'
      })
      return res.redirect(safeErrorUrl)
    }

    // Decode state parameter
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'))
    const { vehicle_id, user_id, tenant_id } = stateData

    // SECURITY: Validate vehicle_id is a valid integer to prevent path traversal
    const parsedVehicleId = parseInt(vehicle_id, 10)
    if (isNaN(parsedVehicleId) || parsedVehicleId <= 0) {
      logger.warn(`Invalid vehicle_id in state parameter: ${vehicle_id}`)
      const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
        error: 'invalid_state',
        message: 'Invalid vehicle identifier'
      })
      return res.redirect(safeErrorUrl)
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

    // Store connection in database
    await smartcarService.storeVehicleConnection(
      parsedVehicleId,
      smartcarVehicleId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      {
        ...vehicleInfo,
        vin,
        connected_at: new Date()
      }
    )

    // Log the connection event
    auditLog(req, 'vehicle_connected', {
      vehicle_id: parsedVehicleId,
      smartcar_vehicle_id: smartcarVehicleId,
      user_id,
      tenant_id
    })

    // Redirect to success page
    const safeSuccessUrl = buildSafeRedirectUrl('/vehicles', {
      success: 'vehicle_connected',
      message: 'Vehicle successfully connected'
    })
    res.redirect(safeSuccessUrl)

  } catch (error: any) {
    logger.error('Smartcar callback error:', error)
    const safeErrorUrl = buildSafeRedirectUrl('/vehicles', {
      error: 'smartcar_callback_failed',
      message: error.message || 'Internal server error'
    })
    res.redirect(safeErrorUrl)
  }
})

/**
 * GET /api/smartcar/disconnect
 * Disconnect a vehicle from Smartcar
 */
router.get('/disconnect', authenticateJWT, requirePermission('vehicle:manage:global'), async (req: AuthRequest, res: Response) => {
  if (!smartcarService || !smartcarRepository || !userRepository || !vehicleRepository) {
    return res.status(503).json({ error: 'Smartcar service not available' })
  }

  try {
    const { vehicle_id } = req.query

    if (!vehicle_id) {
      throw new ValidationError("vehicle_id query parameter is required")
    }

    const parsedVehicleId = parseInt(vehicle_id as string, 10)
    if (isNaN(parsedVehicleId) || parsedVehicleId <= 0) {
      throw new ValidationError("Invalid vehicle_id")
    }

    // Get vehicle connection
    const vehicleConnection = await smartcarRepository.getVehicleConnection(parsedVehicleId, req.user!.tenant_id)

    if (!vehicleConnection) {
      throw new NotFoundError("Vehicle connection not found")
    }

    // Disconnect vehicle
    await smartcarService.disconnectVehicle(vehicleConnection.smartcar_vehicle_id, vehicleConnection.access_token)

    // Remove connection from database
    await smartcarRepository.removeVehicleConnection(parsedVehicleId, req.user!.tenant_id)

    // Log the disconnection event
    auditLog(req, 'vehicle_disconnected', {
      vehicle_id: parsedVehicleId,
      smartcar_vehicle_id: vehicleConnection.smartcar_vehicle_id,
      user_id: req.user!.id,
      tenant_id: req.user!.tenant_id
    })

    res.json({
      success: true,
      message: 'Vehicle successfully disconnected'
    })

  } catch (error: any) {
    logger.error('Smartcar disconnect error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * GET /api/smartcar/vehicle/:id
 * Get vehicle details
 */
router.get('/vehicle/:id', authenticateJWT, requirePermission('vehicle:view:global'), async (req: AuthRequest, res: Response) => {
  if (!smartcarService || !smartcarRepository || !userRepository || !vehicleRepository) {
    return res.status(503).json({ error: 'Smartcar service not available' })
  }

  try {
    const vehicleId = parseInt(req.params.id, 10)
    if (isNaN(vehicleId) || vehicleId <= 0) {
      throw new ValidationError("Invalid vehicle_id")
    }

    // Get vehicle connection
    const vehicleConnection = await smartcarRepository.getVehicleConnection(vehicleId, req.user!.tenant_id)

    if (!vehicleConnection) {
      throw new NotFoundError("Vehicle connection not found")
    }

    // Get vehicle details
    const vehicleDetails = await smartcarService.getVehicleDetails(vehicleConnection.smartcar_vehicle_id, vehicleConnection.access_token)

    res.json({
      ...vehicleDetails,
      connected_at: vehicleConnection.connected_at
    })

  } catch (error: any) {
    logger.error('Smartcar get vehicle details error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router


This refactored version of the `smartcar.routes.ts` file eliminates all direct database queries by using repository methods. The necessary repositories (`SmartcarRepository`, `UserRepository`, and `VehicleRepository`) are imported at the top of the file and initialized in the try-catch block.

All database operations are now handled through the repository methods, maintaining the business logic and tenant_id filtering. The refactored code should be more maintainable and easier to test, as the database interactions are abstracted away from the route handlers.