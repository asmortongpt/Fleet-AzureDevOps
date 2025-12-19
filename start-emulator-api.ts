#!/usr/bin/env tsx
/**
 * Fleet Emulator API Startup Script
 *
 * Starts the EmulatorOrchestrator with REST API and WebSocket support
 * Provides control endpoints for starting/stopping emulation
 */

import { createServer } from 'http'

import express from 'express'
import { WebSocketServer } from 'ws'

const PORT = process.env.EMULATOR_PORT || 3002
const WS_PORT = process.env.EMULATOR_WS_PORT || 3003

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║     Fleet Emulator API - Control & Streaming         ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  // Create Express app
  const app = express()
  app.use(express.json())

  // Add CORS for local development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)
    }
    next()
  })

  // Import and mount emulator routes dynamically
  const emulatorRoutesModule = await import('./api/src/routes/emulator.routes')
  const emulatorRoutes = emulatorRoutesModule.default
  app.use('/api/emulator', emulatorRoutes)

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'fleet-emulator-api'
    })
  })

  // Start HTTP server
  const server = createServer(app)
  server.listen(PORT, () => {
    console.log(`✅ HTTP Server listening on port ${PORT}`)
    console.log(`\nAvailable endpoints:`)
    console.log(`  GET  /health                           - Health check`)
    console.log(`  GET  /api/emulator/status              - Get emulator status`)
    console.log(`  POST /api/emulator/start               - Start emulators`)
    console.log(`  POST /api/emulator/stop                - Stop emulators`)
    console.log(`  POST /api/emulator/pause               - Pause emulators`)
    console.log(`  POST /api/emulator/resume              - Resume emulators`)
    console.log(`  GET  /api/emulator/vehicles            - List vehicles`)
    console.log(`  GET  /api/emulator/scenarios           - List scenarios`)
    console.log(`  POST /api/emulator/scenario/:id        - Run scenario`)
    console.log(`  GET  /api/emulator/vehicles/:id/telemetry - Get vehicle data\n`)
  })

  // Create WebSocket server
  const wss = new WebSocketServer({ port: Number(WS_PORT) })

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected')

    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Fleet Emulator WebSocket',
      timestamp: new Date().toISOString()
    }))

    ws.on('close', () => {
      console.log('WebSocket client disconnected')
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })

  console.log(`✅ WebSocket Server listening on port ${WS_PORT}\n`)
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║               EMULATOR API NOW RUNNING                ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')
  console.log('Quick Start:')
  console.log(`  curl http://localhost:${PORT}/api/emulator/status`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/emulator/start`)
  console.log('\nPress Ctrl+C to stop\n')

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down...')
    server.close(() => {
      console.log('HTTP server closed')
      wss.close(() => {
        console.log('WebSocket server closed')
        process.exit(0)
      })
    })
  })
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
