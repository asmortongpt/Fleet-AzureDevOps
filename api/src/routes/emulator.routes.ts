import fs from 'fs'
import path from 'path'

/**
 * Emulator API Routes
 * Comprehensive REST API for controlling the fleet emulation system
 * Integrated with TelemetryService for production-ready database-backed telemetry
 */

import express, { Request, Response } from 'express'

import { EmulatorOrchestrator } from '../emulators/EmulatorOrchestrator'
import { csrfProtection } from '../middleware/csrf'
import { telemetryService } from '../services/TelemetryService'
import { getVideoDatasetService } from '../services/video-dataset.service'

const router = express.Router()

// Singleton instance of EmulatorOrchestrator
let orchestrator: EmulatorOrchestrator | null = null
let isInitialized = false

/**
 * Initialize the telemetry service and orchestrator
 */
async function ensureInitialized(): Promise<void> {
  if (isInitialized) return

  try {
    await telemetryService.initialize()
    isInitialized = true
    console.log('Emulator routes: TelemetryService initialized')
  } catch (error) {
    console.warn('Emulator routes: TelemetryService initialization warning:', error)
    isInitialized = true // Continue anyway with mock data
  }
}

/**
 * Get or create orchestrator instance
 */
async function getOrchestrator(): Promise<EmulatorOrchestrator> {
  await ensureInitialized()

  if (!orchestrator) {
    orchestrator = new EmulatorOrchestrator()
  }
  return orchestrator
}

// ============================================================================
// SYSTEM STATUS ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/status:
 *   get:
 *     tags: [Emulator]
 *     summary: Get emulator system status
 *     description: Returns current status of all emulators and telemetry service
 *     responses:
 *       200:
 *         description: Emulator status retrieved successfully
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const orch = await getOrchestrator()
    const status = orch.getStatus()

    res.json({
      success: true,
      data: {
        ...status,
        telemetryService: {
          initialized: isInitialized,
          vehicleCount: telemetryService.getVehicles().length,
          routeCount: telemetryService.getRoutes().length,
          channelCount: telemetryService.getRadioChannels().length
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// EMULATOR CONTROL ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/start:
 *   post:
 *     tags: [Emulator]
 *     summary: Start emulators
 *     description: Start emulation for specified vehicles or all vehicles from database
 */
router.post('/start', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { vehicleIds, count } = req.body
    const orch = await getOrchestrator()

    // If count is specified, start that many vehicles
    let idsToStart = vehicleIds
    if (!idsToStart && count) {
      const allVehicles = telemetryService.getVehicles()
      idsToStart = allVehicles.slice(0, count).map(v => v.id)
    }

    await orch.start(idsToStart)

    res.json({
      success: true,
      message: 'Emulators started successfully',
      data: orch.getStatus()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/stop:
 *   post:
 *     tags: [Emulator]
 *     summary: Stop all emulators
 */
router.post('/stop', csrfProtection, async (req: Request, res: Response) => {
  try {
    const orch = await getOrchestrator()
    await orch.stop()

    res.json({
      success: true,
      message: 'Emulators stopped successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/pause:
 *   post:
 *     tags: [Emulator]
 *     summary: Pause all emulators
 */
router.post('/pause', csrfProtection, async (req: Request, res: Response) => {
  try {
    const orch = await getOrchestrator()
    await orch.pause()

    res.json({
      success: true,
      message: 'Emulators paused successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/resume:
 *   post:
 *     tags: [Emulator]
 *     summary: Resume all emulators
 */
router.post('/resume', csrfProtection, async (req: Request, res: Response) => {
  try {
    const orch = await getOrchestrator()
    await orch.resume()

    res.json({
      success: true,
      message: 'Emulators resumed successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/scenario/{scenarioId}:
 *   post:
 *     tags: [Emulator]
 *     summary: Run a predefined scenario
 */
router.post('/scenario/:scenarioId', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.params
    const orch = await getOrchestrator()

    await orch.runScenario(scenarioId)

    res.json({
      success: true,
      message: `Scenario "${scenarioId}" started successfully`,
      data: orch.getStatus()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// VEHICLE ENDPOINTS - DATABASE-BACKED
// ============================================================================

/**
 * @openapi
 * /api/emulator/vehicles:
 *   get:
 *     tags: [Emulator]
 *     summary: List available vehicles from database
 *     description: Get list of all vehicles available for emulation (from TelemetryService)
 */
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    await ensureInitialized()
    const vehicles = telemetryService.getVehicles()

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
      source: 'database'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/vehicles/{vehicleId}:
 *   get:
 *     tags: [Emulator]
 *     summary: Get vehicle details
 */
router.get('/vehicles/:vehicleId', async (req: Request, res: Response) => {
  try {
    await ensureInitialized()
    const { vehicleId } = req.params
    const vehicle = telemetryService.getVehicle(vehicleId)

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      })
    }

    res.json({
      success: true,
      data: vehicle
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/vehicles/{vehicleId}/telemetry:
 *   get:
 *     tags: [Emulator]
 *     summary: Get real-time vehicle telemetry data
 *     description: Get current telemetry data for a specific vehicle
 */
router.get('/vehicles/:vehicleId/telemetry', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params
    const orch = await getOrchestrator()

    // Get live data from orchestrator if running
    const liveTelemetry = orch.getVehicleTelemetry(vehicleId)

    // Also try to get historical data from database
    const dbTelemetry = await telemetryService.getLatestTelemetry(vehicleId)

    // Combine or prefer live data
    const telemetry = liveTelemetry || dbTelemetry

    if (!telemetry) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found or no telemetry available'
      })
    }

    res.json({
      success: true,
      data: telemetry,
      source: liveTelemetry ? 'live' : 'database',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/vehicles/{vehicleId}/telemetry/history:
 *   get:
 *     tags: [Emulator]
 *     summary: Get vehicle telemetry history
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [gps, obd2, iot, radio, driver]
 *         description: Type of telemetry data
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 */
router.get('/vehicles/:vehicleId/telemetry/history', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params
    const {
      type = 'gps',
      startTime = new Date(Date.now() - 3600000).toISOString(), // Default: last hour
      endTime = new Date().toISOString(),
      limit = '100'
    } = req.query

    const history = await telemetryService.getTelemetryHistory(
      vehicleId,
      type as any,
      new Date(startTime as string),
      new Date(endTime as string),
      parseInt(limit as string, 10)
    )

    res.json({
      success: true,
      data: history,
      count: history.length,
      type,
      timeRange: { startTime, endTime }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// ROUTE ENDPOINTS - DATABASE-BACKED
// ============================================================================

/**
 * @openapi
 * /api/emulator/routes:
 *   get:
 *     tags: [Emulator]
 *     summary: List available routes from database
 */
router.get('/routes', async (req: Request, res: Response) => {
  try {
    await ensureInitialized()
    const routes = telemetryService.getRoutes()
    const geofences = telemetryService.getGeofences()

    res.json({
      success: true,
      data: {
        routes,
        geofences
      },
      count: {
        routes: routes.length,
        geofences: geofences.length
      },
      source: 'database'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/routes/{routeId}:
 *   get:
 *     tags: [Emulator]
 *     summary: Get route details
 */
router.get('/routes/:routeId', async (req: Request, res: Response) => {
  try {
    await ensureInitialized()
    const { routeId } = req.params
    const route = telemetryService.getRoute(routeId)

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      })
    }

    res.json({
      success: true,
      data: route
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// RADIO CHANNEL ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/channels:
 *   get:
 *     tags: [Emulator]
 *     summary: List radio channels
 */
router.get('/channels', async (req: Request, res: Response) => {
  try {
    await ensureInitialized()
    const channels = telemetryService.getRadioChannels()

    res.json({
      success: true,
      data: channels,
      count: channels.length
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// FLEET OVERVIEW ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/fleet/overview:
 *   get:
 *     tags: [Emulator]
 *     summary: Get fleet overview with all vehicle positions and status
 */
router.get('/fleet/overview', async (req: Request, res: Response) => {
  try {
    const orch = await getOrchestrator()
    const status = orch.getStatus()
    const vehicles = telemetryService.getVehicles()

    // Get telemetry for all running vehicles
    const vehiclesWithTelemetry = await Promise.all(
      vehicles.map(async (vehicle) => {
        const telemetry = orch.getVehicleTelemetry(vehicle.id)
        return {
          ...vehicle,
          telemetry: telemetry || null,
          isActive: !!telemetry
        }
      })
    )

    res.json({
      success: true,
      data: {
        status,
        vehicles: vehiclesWithTelemetry,
        summary: {
          total: vehicles.length,
          active: vehiclesWithTelemetry.filter(v => v.isActive).length,
          inactive: vehiclesWithTelemetry.filter(v => !v.isActive).length
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/fleet/positions:
 *   get:
 *     tags: [Emulator]
 *     summary: Get all active vehicle positions (optimized for map display)
 */
router.get('/fleet/positions', async (req: Request, res: Response) => {
  try {
    const orch = await getOrchestrator()
    const vehicles = telemetryService.getVehicles()

    // Get just position data for efficiency
    const positions = vehicles.map(vehicle => {
      const telemetry = orch.getVehicleTelemetry(vehicle.id)
      if (!telemetry?.gps) {
        return {
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          lat: vehicle.startingLocation.lat,
          lng: vehicle.startingLocation.lng,
          speed: 0,
          heading: 0,
          status: 'inactive'
        }
      }

      const gps = telemetry.gps
      return {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        make: vehicle.make,
        model: vehicle.model,
        lat: gps.location.lat,
        lng: gps.location.lng,
        speed: gps.speed,
        heading: gps.heading,
        status: gps.speed > 1 ? 'moving' : 'stopped'
      }
    })

    res.json({
      success: true,
      data: positions,
      count: positions.length,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// INVENTORY ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/inventory:
 *   get:
 *     tags: [Emulator]
 *     summary: Get inventory data
 */
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const orch = await getOrchestrator()
    const inventoryData = orch.getInventoryData()

    res.json({
      success: true,
      data: inventoryData
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/inventory/category/{category}:
 *   get:
 *     tags: [Emulator]
 *     summary: Get inventory by category
 */
router.get('/inventory/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params
    const orch = await getOrchestrator()
    const items = orch.getInventoryByCategory(category)

    res.json({
      success: true,
      data: items,
      category
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/inventory/search:
 *   get:
 *     tags: [Emulator]
 *     summary: Search inventory by SKU
 */
router.get('/inventory/search', async (req: Request, res: Response) => {
  try {
    const { sku } = req.query
    if (!sku) {
      return res.status(400).json({
        success: false,
        error: 'SKU query parameter is required'
      })
    }

    const orch = await getOrchestrator()
    const items = orch.searchInventory(sku as string)

    res.json({
      success: true,
      data: items,
      query: sku
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// SCENARIO ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/scenarios:
 *   get:
 *     tags: [Emulator]
 *     summary: List available scenarios
 */
router.get('/scenarios', async (req: Request, res: Response) => {
  try {

    const scenariosPath = path.join(__dirname, '..', 'emulators', 'config', 'scenarios.json')
    const data = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'))

    res.json({
      success: true,
      data: data.scenarios
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// VIDEO EMULATOR ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/video/library:
 *   get:
 *     tags: [Emulator]
 *     summary: Get video library
 */
router.get('/video/library', async (req: Request, res: Response) => {
  try {
    const videoService = getVideoDatasetService()

    // Initialize if needed
    if (!videoService.isInitialized()) {
      await videoService.initialize()
    }

    const { cameraAngle, scenario, weather, timeOfDay, tags } = req.query

    const filter: any = {}
    if (cameraAngle) filter.cameraAngle = cameraAngle
    if (scenario) filter.scenario = scenario
    if (weather) filter.weather = weather
    if (timeOfDay) filter.timeOfDay = timeOfDay
    if (tags) filter.tags = Array.isArray(tags) ? tags : [tags]

    const videos = videoService.getVideos(filter)

    res.json({
      success: true,
      data: videos,
      count: videos.length
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/video/library/:videoId:
 *   get:
 *     tags: [Emulator]
 *     summary: Get specific video
 */
router.get('/video/library/:videoId', async (req: Request, res: Response) => {
  try {
    const videoService = getVideoDatasetService()
    const { videoId } = req.params

    if (!videoService.isInitialized()) {
      await videoService.initialize()
    }

    const video = videoService.getVideoById(videoId)

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      })
    }

    res.json({
      success: true,
      data: video
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/video/stream/:vehicleId/:cameraAngle/start:
 *   post:
 *     tags: [Emulator]
 *     summary: Start video stream
 */
router.post('/video/stream/:vehicleId/:cameraAngle/start', csrfProtection, async (req: Request, res: Response) => {
  try {
    const videoService = getVideoDatasetService()
    const { vehicleId, cameraAngle } = req.params
    const { videoId } = req.body

    if (!videoService.isInitialized()) {
      await videoService.initialize()
    }

    const stream = videoService.startStream(vehicleId, cameraAngle as any, videoId)

    if (!stream) {
      return res.status(400).json({
        success: false,
        error: 'Failed to start stream - video not found or invalid camera angle'
      })
    }

    res.json({
      success: true,
      data: stream
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/video/stream/:vehicleId/:cameraAngle/stop:
 *   post:
 *     tags: [Emulator]
 *     summary: Stop video stream
 */
router.post('/video/stream/:vehicleId/:cameraAngle/stop', csrfProtection, async (req: Request, res: Response) => {
  try {
    const videoService = getVideoDatasetService()
    const { vehicleId, cameraAngle } = req.params

    if (!videoService.isInitialized()) {
      await videoService.initialize()
    }

    const stopped = videoService.stopStream(vehicleId, cameraAngle as any)

    res.json({
      success: true,
      stopped
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/video/stream/:vehicleId/:cameraAngle:
 *   get:
 *     tags: [Emulator]
 *     summary: Get stream status
 */
router.get('/video/stream/:vehicleId/:cameraAngle', async (req: Request, res: Response) => {
  try {
    const videoService = getVideoDatasetService()
    const { vehicleId, cameraAngle } = req.params

    if (!videoService.isInitialized()) {
      await videoService.initialize()
    }

    const stream = videoService.getStream(vehicleId, cameraAngle as any)

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      })
    }

    res.json({
      success: true,
      data: stream
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

/**
 * @openapi
 * /api/emulator/video/streams:
 *   get:
 *     tags: [Emulator]
 *     summary: Get all active streams
 */
router.get('/video/streams', async (req: Request, res: Response) => {
  try {
    const videoService = getVideoDatasetService()

    if (!videoService.isInitialized()) {
      await videoService.initialize()
    }

    const streams = videoService.getAllStreams()
    const stats = videoService.getStats()

    res.json({
      success: true,
      data: {
        streams,
        stats
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// GEOFENCE ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /api/emulator/geofences:
 *   get:
 *     tags: [Emulator]
 *     summary: List all geofences
 */
router.get('/geofences', async (req: Request, res: Response) => {
  try {
    await ensureInitialized()
    const geofences = telemetryService.getGeofences()

    res.json({
      success: true,
      data: geofences,
      count: geofences.length
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
})

// ============================================================================
// CLEANUP
// ============================================================================

// Cleanup on process exit
process.on('SIGINT', async () => {
  console.log('\nShutting down emulator system...')
  if (orchestrator) {
    await orchestrator.shutdown()
  }
  await telemetryService.shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  if (orchestrator) {
    await orchestrator.shutdown()
  }
  await telemetryService.shutdown()
  process.exit(0)
})

export default router
