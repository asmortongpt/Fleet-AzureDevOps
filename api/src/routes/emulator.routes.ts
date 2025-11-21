/**
 * Emulator API Routes
 * Comprehensive REST API for controlling the fleet emulation system
 */

import express, { Request, Response } from 'express'
import { EmulatorOrchestrator } from '../emulators/EmulatorOrchestrator'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()

// Singleton instance of EmulatorOrchestrator
let orchestrator: EmulatorOrchestrator | null = null

/**
 * Get or create orchestrator instance
 */
function getOrchestrator(): EmulatorOrchestrator {
  if (!orchestrator) {
    orchestrator = new EmulatorOrchestrator()
  }
  return orchestrator
}

/**
 * @openapi
 * /api/emulator/status:
 *   get:
 *     tags: [Emulator]
 *     summary: Get emulator system status
 *     description: Returns current status of all emulators
 *     responses:
 *       200:
 *         description: Emulator status retrieved successfully
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const orch = getOrchestrator()
    const status = orch.getStatus()

    res.json({
      success: true,
      data: status
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/start:
 *   post:
 *     tags: [Emulator]
 *     summary: Start emulators
 *     description: Start emulation for specified vehicles or all vehicles
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of vehicle IDs to emulate
 *     responses:
 *       200:
 *         description: Emulators started successfully
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { vehicleIds } = req.body
    const orch = getOrchestrator()

    await orch.start(vehicleIds)

    res.json({
      success: true,
      message: 'Emulators started successfully',
      data: orch.getStatus()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/stop:
 *   post:
 *     tags: [Emulator]
 *     summary: Stop all emulators
 *     description: Stop all running emulators
 *     responses:
 *       200:
 *         description: Emulators stopped successfully
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const orch = getOrchestrator()
    await orch.stop()

    res.json({
      success: true,
      message: 'Emulators stopped successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/pause:
 *   post:
 *     tags: [Emulator]
 *     summary: Pause all emulators
 *     description: Pause all running emulators
 *     responses:
 *       200:
 *         description: Emulators paused successfully
 */
router.post('/pause', async (req: Request, res: Response) => {
  try {
    const orch = getOrchestrator()
    await orch.pause()

    res.json({
      success: true,
      message: 'Emulators paused successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/resume:
 *   post:
 *     tags: [Emulator]
 *     summary: Resume all emulators
 *     description: Resume paused emulators
 *     responses:
 *       200:
 *         description: Emulators resumed successfully
 */
router.post('/resume', async (req: Request, res: Response) => {
  try {
    const orch = getOrchestrator()
    await orch.resume()

    res.json({
      success: true,
      message: 'Emulators resumed successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/scenario/{scenarioId}:
 *   post:
 *     tags: [Emulator]
 *     summary: Run a predefined scenario
 *     description: Load and run a specific emulation scenario
 *     parameters:
 *       - in: path
 *         name: scenarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scenario ID to run
 *     responses:
 *       200:
 *         description: Scenario started successfully
 */
router.post('/scenario/:scenarioId', async (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.params
    const orch = getOrchestrator()

    await orch.runScenario(scenarioId)

    res.json({
      success: true,
      message: `Scenario '${scenarioId}' started successfully`,
      data: orch.getStatus()
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/vehicles/{vehicleId}/telemetry:
 *   get:
 *     tags: [Emulator]
 *     summary: Get vehicle telemetry data
 *     description: Get current telemetry data for a specific vehicle
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Telemetry data retrieved successfully
 */
router.get('/vehicles/:vehicleId/telemetry', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params
    const orch = getOrchestrator()

    const telemetry = orch.getVehicleTelemetry(vehicleId)

    if (!telemetry) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found or not running'
      })
    }

    res.json({
      success: true,
      data: telemetry
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/scenarios:
 *   get:
 *     tags: [Emulator]
 *     summary: List available scenarios
 *     description: Get list of all available emulation scenarios
 *     responses:
 *       200:
 *         description: Scenarios retrieved successfully
 */
router.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const fs = require('fs')
    const path = require('path')

    const scenariosPath = path.join(__dirname, '..', 'emulators', 'config', 'scenarios.json')
    const data = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'))

    res.json({
      success: true,
      data: data.scenarios
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/vehicles:
 *   get:
 *     tags: [Emulator]
 *     summary: List available vehicles
 *     description: Get list of all vehicles available for emulation
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 */
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const fs = require('fs')
    const path = require('path')

    const vehiclesPath = path.join(__dirname, '..', 'emulators', 'config', 'vehicles.json')
    const data = JSON.parse(fs.readFileSync(vehiclesPath, 'utf-8'))

    res.json({
      success: true,
      data: data.vehicles
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/emulator/routes:
 *   get:
 *     tags: [Emulator]
 *     summary: List available routes
 *     description: Get list of all available routes
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
 */
router.get('/routes', async (req: Request, res: Response) => {
  try {
    const fs = require('fs')
    const path = require('path')

    const routesPath = path.join(__dirname, '..', 'emulators', 'config', 'routes.json')
    const data = JSON.parse(fs.readFileSync(routesPath, 'utf-8'))

    res.json({
      success: true,
      data: {
        routes: data.routes,
        geofences: data.geofences
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: getErrorMessage(error)
    })
  }
})

// Cleanup on process exit
process.on('SIGINT', async () => {
  if (orchestrator) {
    console.log('\nShutting down emulator orchestrator...')
    await orchestrator.shutdown()
    process.exit(0)
  }
})

process.on('SIGTERM', async () => {
  if (orchestrator) {
    await orchestrator.shutdown()
    process.exit(0)
  }
})

export default router
