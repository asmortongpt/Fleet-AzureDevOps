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

const router = express.Router()

// Initialize Smartcar service
let smartcarService: SmartcarService | null = null
let smartcarRepository: SmartcarRepository | null = null

try {
  if (process.env.SMARTCAR_CLIENT_ID && process.env.SMARTCAR_CLIENT_SECRET) {
    smartcarRepository = container.resolve(SmartcarRepository)
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
  if (!smartcarService || !smartcarRepository) {
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
  if (!smartcarService || !smartcarRepository) {
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

    // Retrieve Smartcar connection details
    const connection = await smartcarRepository.getVehicleConnection(parsedVehicleId)

    if (!connection) {
      throw new NotFoundError("Vehicle not connected to Smartcar")
    }

    // Disconnect from Smartcar
    await smartcarService.disconnectVehicle(connection.smartcar_vehicle_id, connection.access_token)

    // Remove connection from database
    await smartcarRepository.removeVehicleConnection(parsedVehicleId)

    // Log the disconnection event
    auditLog(req, 'vehicle_disconnected', {
      vehicle_id: parsedVehicleId,
      smartcar_vehicle_id: connection.smartcar_vehicle_id,
      user_id: req.user!.id,
      tenant_id: req.user!.tenant_id
    })

    res.json({
      success: true,
      message: 'Vehicle successfully disconnected from Smartcar'
    })

  } catch (error: any) {
    logger.error('Smartcar disconnect error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router


In this refactored version:

1. The `pool.query` and `db.query` calls have been replaced with methods from the `SmartcarRepository` class. This implements the repository pattern, abstracting the database operations.

2. The `SmartcarRepository` is resolved from the dependency injection container and passed to the `SmartcarService` constructor.

3. The `SmartcarService` now uses the repository methods instead of direct database queries.

4. The file is complete, including all necessary imports, route definitions, and error handling.

5. Minor improvements have been made for consistency and clarity, such as consistent error handling and logging.

This refactored version maintains the same functionality as the original while improving the separation of concerns and making the code more testable and maintainable.