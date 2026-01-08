#!/usr/bin/env tsx
/**
 * Simple Fleet Emulator
 *
 * A lightweight emulator that generates realistic vehicle data without database dependencies
 * Suitable for frontend development and testing
 */

import { EventEmitter } from 'events'
import { createServer } from 'http'

import { WebSocketServer, WebSocket } from 'ws'

interface VehicleState {
  id: string
  name: string
  type: string
  status: 'idle' | 'active' | 'responding' | 'maintenance'
  location: {
    latitude: number
    longitude: number
    speed: number
    heading: number
  }
  telemetry: {
    rpm: number
    speed: number
    fuelLevel: number
    coolantTemp: number
    batteryVoltage: number
    engineLoad: number
    odometer: number
  }
  driver: {
    name: string
    badge: string
    shift: string
  } | null
}

class SimpleFleetEmulator extends EventEmitter {
  private vehicles: Map<string, VehicleState> = new Map()
  private isRunning = false
  private updateInterval: NodeJS.Timeout | null = null

  // Tallahassee bounds
  private readonly BOUNDS = {
    center: { lat: 30.4383, lng: -84.2807 },
    radius: 0.1 // About 11km
  }

  constructor(numVehicles: number = 5) {
    super()
    this.initializeVehicles(numVehicles)
  }

  private initializeVehicles(count: number) {
    const types = ['Police Cruiser', 'Fire Engine', 'Public Works Truck', 'Transit Bus', 'Service Van']
    const statuses: Array<'idle' | 'active' | 'responding'> = ['active', 'active', 'idle', 'active', 'responding']

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length]
      const deptCode = type.split(' ')[0].substring(0, 3).toUpperCase()

      const vehicle: VehicleState = {
        id: `COT-${deptCode}-${String(i + 1).padStart(4, '0')}`,
        name: `${type} ${i + 1}`,
        type,
        status: statuses[i % statuses.length],
        location: {
          latitude: this.BOUNDS.center.lat + (Math.random() - 0.5) * this.BOUNDS.radius,
          longitude: this.BOUNDS.center.lng + (Math.random() - 0.5) * this.BOUNDS.radius,
          speed: 0,
          heading: Math.random() * 360
        },
        telemetry: {
          rpm: 750,
          speed: 0,
          fuelLevel: 50 + Math.random() * 40,
          coolantTemp: 180,
          batteryVoltage: 12.6,
          engineLoad: 0,
          odometer: Math.floor(Math.random() * 100000)
        },
        driver: {
          name: this.generateDriverName(),
          badge: `BADGE-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
          shift: this.getCurrentShift()
        }
      }

      this.vehicles.set(vehicle.id, vehicle)
    }

    console.log(`Initialized ${this.vehicles.size} vehicles`)
  }

  start() {
    if (this.isRunning) {
      console.log('Emulator already running')
      return
    }

    this.isRunning = true
    console.log('Starting emulator...')

    // Update every 2 seconds
    this.updateInterval = setInterval(() => {
      this.updateAllVehicles()
    }, 2000)

    console.log('Emulator started - generating real-time data')
  }

  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    console.log('Emulator stopped')
  }

  private updateAllVehicles() {
    for (const [id, vehicle] of this.vehicles) {
      this.updateVehicle(vehicle)

      // Emit update event
      this.emit('vehicle-update', {
        vehicleId: id,
        timestamp: new Date().toISOString(),
        location: vehicle.location,
        telemetry: vehicle.telemetry,
        status: vehicle.status,
        driver: vehicle.driver
      })
    }
  }

  private updateVehicle(vehicle: VehicleState) {
    // Determine target speed based on status
    let targetSpeed = 0
    if (vehicle.status === 'active') {
      targetSpeed = 25 + Math.random() * 20 // 25-45 mph
    } else if (vehicle.status === 'responding') {
      targetSpeed = 55 + Math.random() * 15 // 55-70 mph
    }

    // Smooth speed transition
    vehicle.location.speed += (targetSpeed - vehicle.location.speed) * 0.2

    // Update location if moving
    if (vehicle.location.speed > 1) {
      const distanceKm = (vehicle.location.speed * 1.60934 / 3600) * 2 // 2-second interval
      const distanceDegrees = distanceKm / 111.32

      // Random heading changes
      if (Math.random() < 0.1) {
        vehicle.location.heading += (Math.random() - 0.5) * 30
        vehicle.location.heading = vehicle.location.heading % 360
      }

      const headingRad = vehicle.location.heading * Math.PI / 180
      vehicle.location.latitude += distanceDegrees * Math.cos(headingRad)
      vehicle.location.longitude += distanceDegrees * Math.sin(headingRad) / Math.cos(vehicle.location.latitude * Math.PI / 180)

      // Keep within bounds
      const maxLat = this.BOUNDS.center.lat + this.BOUNDS.radius / 2
      const minLat = this.BOUNDS.center.lat - this.BOUNDS.radius / 2
      const maxLng = this.BOUNDS.center.lng + this.BOUNDS.radius / 2
      const minLng = this.BOUNDS.center.lng - this.BOUNDS.radius / 2

      if (vehicle.location.latitude > maxLat || vehicle.location.latitude < minLat) {
        vehicle.location.heading = (vehicle.location.heading + 180) % 360
        vehicle.location.latitude = Math.max(minLat, Math.min(maxLat, vehicle.location.latitude))
      }

      if (vehicle.location.longitude > maxLng || vehicle.location.longitude < minLng) {
        vehicle.location.heading = (vehicle.location.heading + 180) % 360
        vehicle.location.longitude = Math.max(minLng, Math.min(maxLng, vehicle.location.longitude))
      }

      // Update odometer
      vehicle.telemetry.odometer += distanceKm * 0.621371 // km to miles
    }

    // Update telemetry
    vehicle.telemetry.speed = vehicle.location.speed
    vehicle.telemetry.rpm = vehicle.location.speed > 0 ? 750 + vehicle.location.speed * 60 : 750
    vehicle.telemetry.engineLoad = Math.min(100, (vehicle.location.speed / 70) * 100)
    vehicle.telemetry.coolantTemp = vehicle.location.speed > 0 ? 195 : 180
    vehicle.telemetry.batteryVoltage = vehicle.location.speed > 0 ? 14.2 : 12.6

    // Consume fuel
    if (vehicle.location.speed > 0) {
      vehicle.telemetry.fuelLevel -= 0.01
    } else {
      vehicle.telemetry.fuelLevel -= 0.001 // Idle consumption
    }

    // Refuel if low
    if (vehicle.telemetry.fuelLevel < 15) {
      vehicle.telemetry.fuelLevel = 95
      console.log(`  Refueled: ${vehicle.id} at ${vehicle.telemetry.odometer.toFixed(1)} miles`)
    }

    // Occasionally change status
    if (Math.random() < 0.01) {
      const statuses: Array<'idle' | 'active' | 'responding'> = ['idle', 'active', 'responding']
      vehicle.status = statuses[Math.floor(Math.random() * statuses.length)]
    }
  }

  getVehicles(): VehicleState[] {
    return Array.from(this.vehicles.values())
  }

  getVehicle(id: string): VehicleState | undefined {
    return this.vehicles.get(id)
  }

  private generateDriverName(): string {
    const firstNames = ['John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'James', 'Mary', 'Robert', 'Patricia']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']

    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
  }

  private getCurrentShift(): string {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 14) return 'Day Shift'
    if (hour >= 14 && hour < 22) return 'Evening Shift'
    return 'Night Shift'
  }
}

// Main execution
async function main() {
  const NUM_VEHICLES = parseInt(process.env.NUM_VEHICLES || '5')
  const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3002')
  const WS_PORT = parseInt(process.env.WS_PORT || '3003')

  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║        Simple Fleet Emulator - Real-time Demo        ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')
  console.log(`Vehicles: ${NUM_VEHICLES}`)
  console.log(`HTTP API: http://localhost:${HTTP_PORT}`)
  console.log(`WebSocket: ws://localhost:${WS_PORT}\n`)

  // Create emulator
  const emulator = new SimpleFleetEmulator(NUM_VEHICLES)

  // Setup WebSocket server
  const wss = new WebSocketServer({ port: WS_PORT })
  const clients = new Set<WebSocket>()

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected')
    clients.add(ws)

    // Send initial vehicle list
    ws.send(JSON.stringify({
      type: 'init',
      vehicles: emulator.getVehicles()
    }))

    ws.on('close', () => {
      console.log('WebSocket client disconnected')
      clients.delete(ws)
    })
  })

  // Broadcast vehicle updates to all WebSocket clients
  emulator.on('vehicle-update', (data) => {
    const message = JSON.stringify({
      type: 'vehicle-update',
      data
    })

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })

  // Setup HTTP API
  const server = createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (req.url === '/health') {
      res.writeHead(200)
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    } else if (req.url === '/vehicles') {
      res.writeHead(200)
      res.end(JSON.stringify({ vehicles: emulator.getVehicles() }))
    } else if (req.url?.startsWith('/vehicles/')) {
      const id = req.url.split('/')[2]
      const vehicle = emulator.getVehicle(id)

      if (vehicle) {
        res.writeHead(200)
        res.end(JSON.stringify(vehicle))
      } else {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Vehicle not found' }))
      }
    } else if (req.url === '/start' && req.method === 'POST') {
      emulator.start()
      res.writeHead(200)
      res.end(JSON.stringify({ message: 'Emulator started' }))
    } else if (req.url === '/stop' && req.method === 'POST') {
      emulator.stop()
      res.writeHead(200)
      res.end(JSON.stringify({ message: 'Emulator stopped' }))
    } else {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  })

  server.listen(HTTP_PORT, () => {
    console.log(`✅ HTTP server running on http://localhost:${HTTP_PORT}`)
    console.log(`✅ WebSocket server running on ws://localhost:${WS_PORT}\n`)
    console.log('API Endpoints:')
    console.log(`  GET  /health               - Health check`)
    console.log(`  GET  /vehicles             - List all vehicles`)
    console.log(`  GET  /vehicles/:id         - Get vehicle details`)
    console.log(`  POST /start                - Start emulation`)
    console.log(`  POST /stop                 - Stop emulation\n`)
  })

  // Start emulation automatically
  emulator.start()

  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║              EMULATOR NOW RUNNING                     ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')
  console.log('Real-time vehicle updates:')

  // Show console updates
  emulator.on('vehicle-update', (data) => {
    console.log(`  ${data.vehicleId}: Lat ${data.location.latitude.toFixed(6)}, ` +
      `Lng ${data.location.longitude.toFixed(6)}, ` +
      `${data.location.speed.toFixed(1)} mph, ` +
      `Fuel ${data.telemetry.fuelLevel.toFixed(1)}%`)
  })

  console.log('\nPress Ctrl+C to stop\n')

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down...')
    emulator.stop()
    server.close(() => {
      wss.close(() => {
        console.log('Stopped successfully')
        process.exit(0)
      })
    })
  })
}

main().catch(console.error)
