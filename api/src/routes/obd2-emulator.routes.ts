/**
 * OBD2 Emulator API Routes
 *
 * REST and WebSocket endpoints for the OBD2 emulator service.
 * Used for development, testing, and demo purposes.
 */

import express, { Request, Response } from 'express'
import { WebSocket, WebSocketServer } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import obd2Emulator, { VehicleProfile, EmulatedOBD2Data } from '../services/obd2-emulator.service'

const router = express.Router()

// Store for demo sessions (no auth required for emulator)
const demoSessions: Map<string, { vehicleId: number; adapterId: number; profile: VehicleProfile }> = new Map()

/**
 * @swagger
 * /api/obd2-emulator/profiles:
 *   get:
 *     summary: Get available vehicle profiles
 *     tags: [OBD2 Emulator]
 *     responses:
 *       200:
 *         description: List of vehicle profiles
 */
router.get('/profiles', (_req: Request, res: Response) => {
  const profiles = [
    { id: 'sedan', name: 'Standard Sedan', description: 'Typical gasoline sedan' },
    { id: 'truck', name: 'Work Truck', description: 'Diesel work truck' },
    { id: 'electric', name: 'Electric Vehicle', description: 'Battery electric vehicle' },
    { id: 'diesel', name: 'Diesel Engine', description: 'Diesel passenger vehicle' },
    { id: 'sports', name: 'Sports Car', description: 'High-performance sports car' }
  ]
  res.json(profiles)
})

/**
 * @swagger
 * /api/obd2-emulator/scenarios:
 *   get:
 *     summary: Get available driving scenarios
 *     tags: [OBD2 Emulator]
 *     responses:
 *       200:
 *         description: List of driving scenarios
 */
router.get('/scenarios', (_req: Request, res: Response) => {
  const scenarios = [
    { id: 'idle', name: 'Idle', description: 'Vehicle at idle, stationary' },
    { id: 'city', name: 'City Driving', description: 'Stop-and-go urban traffic' },
    { id: 'highway', name: 'Highway Cruising', description: 'Steady highway speeds' },
    { id: 'aggressive', name: 'Aggressive Driving', description: 'Hard acceleration and braking' }
  ]
  res.json(scenarios)
})

/**
 * @swagger
 * /api/obd2-emulator/start:
 *   post:
 *     summary: Start a new emulation session
 *     tags: [OBD2 Emulator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleId:
 *                 type: number
 *               profile:
 *                 type: string
 *                 enum: [sedan, truck, electric, diesel, sports]
 *               scenario:
 *                 type: string
 *                 enum: [idle, city, highway, aggressive]
 *               generateDTCs:
 *                 type: boolean
 *               updateIntervalMs:
 *                 type: number
 *     responses:
 *       200:
 *         description: Emulation session started
 */
router.post('/start', (req: Request, res: Response) => {
  try {
    const {
      vehicleId = 1,
      profile = 'sedan',
      scenario = 'city',
      generateDTCs = false,
      updateIntervalMs = 1000,
      location
    } = req.body

    const sessionId = uuidv4()
    const adapterId = Math.floor(Math.random() * 1000) + 1

    // Store session info
    demoSessions.set(sessionId, {
      vehicleId,
      adapterId,
      profile: profile as VehicleProfile
    })

    // Start emulation
    obd2Emulator.startSession({
      sessionId,
      vehicleId,
      adapterId,
      profile: profile as VehicleProfile,
      scenario,
      generateDTCs,
      updateIntervalMs,
      location
    })

    res.json({
      success: true,
      sessionId,
      vehicleId,
      adapterId,
      profile,
      scenario,
      message: 'Emulation session started',
      wsUrl: `/ws/obd2/${sessionId}`
    })
  } catch (error: any) {
    console.error('Error starting emulation:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/obd2-emulator/stop/{sessionId}:
 *   post:
 *     summary: Stop an emulation session
 *     tags: [OBD2 Emulator]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Emulation session stopped
 */
router.post('/stop/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    obd2Emulator.stopSession(sessionId)
    demoSessions.delete(sessionId)

    res.json({
      success: true,
      sessionId,
      message: 'Emulation session stopped'
    })
  } catch (error: any) {
    console.error('Error stopping emulation:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/obd2-emulator/data/{sessionId}:
 *   get:
 *     summary: Get current data from emulation session
 *     tags: [OBD2 Emulator]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current emulated data
 */
router.get('/data/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const data = obd2Emulator.getSessionData(sessionId)

    if (!data) {
      return res.status(404).json({ error: 'Session not found or no data available' })
    }

    res.json(data)
  } catch (error: any) {
    console.error('Error getting emulation data:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/obd2-emulator/sessions:
 *   get:
 *     summary: Get all active emulation sessions
 *     tags: [OBD2 Emulator]
 *     responses:
 *       200:
 *         description: List of active sessions
 */
router.get('/sessions', (_req: Request, res: Response) => {
  try {
    const sessions = obd2Emulator.getActiveSessions()
    const sessionDetails = sessions.map(sessionId => ({
      sessionId,
      ...demoSessions.get(sessionId),
      currentData: obd2Emulator.getSessionData(sessionId)
    }))

    res.json(sessionDetails)
  } catch (error: any) {
    console.error('Error getting sessions:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/obd2-emulator/sample-data:
 *   get:
 *     summary: Get a single sample data point (no session required)
 *     tags: [OBD2 Emulator]
 *     parameters:
 *       - in: query
 *         name: profile
 *         schema:
 *           type: string
 *           enum: [sedan, truck, electric, diesel, sports]
 *     responses:
 *       200:
 *         description: Sample OBD2 data point
 */
router.get('/sample-data', (req: Request, res: Response) => {
  try {
    const profile = (req.query.profile as VehicleProfile) || 'sedan'
    const data = obd2Emulator.generateSingleDataPoint(profile)

    res.json(data)
  } catch (error: any) {
    console.error('Error generating sample data:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/obd2-emulator/sample-dtcs:
 *   get:
 *     summary: Get sample diagnostic trouble codes
 *     tags: [OBD2 Emulator]
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Sample DTCs
 */
router.get('/sample-dtcs', (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 3
    const dtcs = obd2Emulator.getSampleDTCs(count)

    res.json(dtcs)
  } catch (error: any) {
    console.error('Error getting sample DTCs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Setup WebSocket server for real-time OBD2 data streaming
 */
export function setupOBD2WebSocket(server: any): void {
  const wss = new WebSocketServer({ noServer: true })

  // Handle upgrade requests
  server.on('upgrade', (request: any, socket: any, head: any) => {
    const url = new URL(request.url, `http://${request.headers.host}`)

    if (url.pathname.startsWith('/ws/obd2/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
  })

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, request: any) => {
    const url = new URL(request.url, `http://${request.headers.host}`)
    const pathParts = url.pathname.split('/')
    const sessionId = pathParts[pathParts.length - 1]
    const clientId = uuidv4()

    console.log(`[OBD2 WebSocket] Client ${clientId} connected for session ${sessionId}`)

    // Register client
    obd2Emulator.registerWSClient(clientId, ws)

    // Subscribe to session if it exists
    if (sessionId && sessionId !== 'obd2') {
      const subscribed = obd2Emulator.subscribeToSession(clientId, sessionId)
      if (subscribed) {
        ws.send(JSON.stringify({
          type: 'subscribed',
          sessionId,
          message: 'Successfully subscribed to OBD2 data stream'
        }))
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: `Session ${sessionId} not found. Start a session first.`
        }))
      }
    }

    // Handle messages from client
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString())

        switch (data.type) {
          case 'subscribe':
            const subscribed = obd2Emulator.subscribeToSession(clientId, data.sessionId)
            ws.send(JSON.stringify({
              type: subscribed ? 'subscribed' : 'error',
              sessionId: data.sessionId,
              message: subscribed ? 'Subscribed to session' : 'Session not found'
            }))
            break

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
            break

          case 'get_data':
            const sessionData = obd2Emulator.getSessionData(data.sessionId)
            ws.send(JSON.stringify({
              type: 'obd2_data',
              sessionId: data.sessionId,
              data: sessionData
            }))
            break

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }))
        }
      } catch (error) {
        console.error('[OBD2 WebSocket] Error processing message:', error)
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
      }
    })

    // Handle disconnection
    ws.on('close', () => {
      console.log(`[OBD2 WebSocket] Client ${clientId} disconnected`)
      obd2Emulator.unregisterWSClient(clientId)
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error(`[OBD2 WebSocket] Error for client ${clientId}:`, error)
      obd2Emulator.unregisterWSClient(clientId)
    })

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'Connected to OBD2 emulator WebSocket'
    }))
  })

  console.log('[OBD2 Emulator] WebSocket server initialized')
}

export default router
