#!/usr/bin/env node

/**
 * WebSocket Test Client for Fleet Emulator
 * Connects to the emulator WebSocket stream and displays real-time events
 */

const WebSocket = require('ws')

const WS_URL = 'ws://localhost:3001/emulator/stream'

console.log('🔌 Connecting to Fleet Emulator WebSocket...')
console.log(`   URL: ${WS_URL}`)
console.log('')

const ws = new WebSocket(WS_URL)

let eventCount = 0
const eventCounts = {}
let startTime = null

ws.on('open', () => {
  console.log('✅ Connected to emulator stream')
  console.log('📡 Listening for events...')
  console.log('   Press Ctrl+C to stop')
  console.log('')
  startTime = Date.now()
})

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString())
    eventCount++

    // Track event types
    if (!eventCounts[message.type]) {
      eventCounts[message.type] = 0
    }
    eventCounts[message.type]++

    // Display based on message type
    switch (message.type) {
      case 'connection':
        console.log('📋 Initial Connection Data:')
        console.log(`   Vehicles: ${message.data.vehicles?.length || 0}`)
        console.log(`   Routes: ${message.data.routes?.length || 0}`)
        console.log(`   Scenarios: ${message.data.scenarios?.length || 0}`)
        console.log('')
        break

      case 'status':
        const status = message.data
        console.log(`📊 Status Update: ${status.status} at ${status.timestamp}`)
        break

      case 'stats':
        const stats = message.data
        const uptime = Math.floor(stats.uptime / 1000)
        console.log('')
        console.log('📈 Performance Statistics:')
        console.log(`   Active Vehicles: ${stats.activeVehicles}`)
        console.log(`   Total Events: ${stats.totalEvents}`)
        console.log(`   Events/Second: ${stats.eventsPerSecond}`)
        console.log(`   Memory Usage: ${Math.round(stats.memoryUsage)}MB`)
        console.log(`   Uptime: ${uptime}s`)
        console.log('')
        break

      case 'event':
        const event = message.data
        displayEvent(event)
        break

      case 'scenario':
        console.log(`🎬 Scenario: ${message.data.name}`)
        console.log('')
        break

      default:
        // Generic event
        if (message.data?.vehicleId) {
          displayEvent(message)
        }
    }

    // Display running summary every 50 events
    if (eventCount % 50 === 0) {
      displaySummary()
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error.message)
  }
})

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message)
  console.log('')
  console.log('Troubleshooting:')
  console.log('  1. Make sure the API server is running')
  console.log('  2. Start emulation: curl -X POST http://localhost:3000/api/emulator/start')
  console.log('  3. Check if port 3001 is available: lsof -ti:3001')
})

ws.on('close', () => {
  console.log('')
  console.log('🔌 Connection closed')
  displayFinalSummary()
  process.exit(0)
})

function displayEvent(event) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString()
  const vehicleId = event.vehicleId || 'N/A'

  switch (event.type) {
    case 'gps':
      const gps = event.data
      console.log(`🛰️  [${timestamp}] ${vehicleId} GPS: ` +
        `${gps.location.lat.toFixed(4)}, ${gps.location.lng.toFixed(4)} | ` +
        `${Math.round(gps.speed)} mph | ${Math.round(gps.heading)}°`)
      break

    case 'obd2':
      const obd = event.data
      console.log(`🔧 [${timestamp}] ${vehicleId} OBD-II: ` +
        `RPM=${obd.rpm} | Fuel=${obd.fuelLevel}% | Temp=${obd.coolantTemp}°F` +
        (obd.checkEngineLight ? ' ⚠️  CHECK ENGINE' : ''))
      break

    case 'fuel':
      const fuel = event.data
      console.log(`⛽ [${timestamp}] ${vehicleId} Fuel Purchase: ` +
        `${fuel.gallons.toFixed(1)}gal @ $${fuel.pricePerGallon.toFixed(2)} = $${fuel.totalCost.toFixed(2)} | ` +
        `${fuel.stationName}`)
      break

    case 'maintenance':
      const maint = event.data
      console.log(`🔨 [${timestamp}] ${vehicleId} Maintenance: ` +
        `${maint.description} | $${maint.totalCost.toFixed(2)} | ${maint.vendorName}`)
      break

    case 'driver':
      const driver = event.data
      const severity = driver.severity === 'high' ? '🔴' : driver.severity === 'medium' ? '🟡' : '🟢'
      console.log(`${severity} [${timestamp}] ${vehicleId} Driver Event: ` +
        `${driver.eventType} (${driver.severity}) | Score: ${driver.score}`)
      break

    case 'iot':
      const iot = event.data
      const sensors = iot.sensors
      console.log(`📡 [${timestamp}] ${vehicleId} IoT: ` +
        `Engine=${Math.round(sensors.engineTemp || 0)}°F | ` +
        `Cabin=${Math.round(sensors.cabinTemp || 0)}°F | ` +
        `Tire Pressure: ${sensors.tirePressure ? Object.values(sensors.tirePressure).map(p => Math.round(p)).join('/') : 'N/A'} PSI`)
      break

    case 'cost':
      const cost = event.data
      console.log(`💰 [${timestamp}] ${vehicleId} Cost: ` +
        `${cost.category} | $${cost.amount.toFixed(2)} | ${cost.description}`)
      break

    default:
      console.log(`📦 [${timestamp}] ${vehicleId} ${event.type}: ` +
        JSON.stringify(event.data).substring(0, 100))
  }
}

function displaySummary() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const eventsPerSecond = elapsed > 0 ? (eventCount / elapsed).toFixed(1) : 0

  console.log('')
  console.log('─'.repeat(80))
  console.log(`📊 Running Summary (${elapsed}s elapsed)`)
  console.log(`   Total Events: ${eventCount} (${eventsPerSecond}/s)`)
  console.log('   Event Breakdown:')

  Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / eventCount) * 100).toFixed(1)
      console.log(`     ${type.padEnd(15)} ${count.toString().padStart(6)} (${percentage}%)`)
    })

  console.log('─'.repeat(80))
  console.log('')
}

function displayFinalSummary() {
  if (eventCount === 0) {
    console.log('No events received.')
    return
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000)

  console.log('')
  console.log('═'.repeat(80))
  console.log('📊 Final Summary')
  console.log('═'.repeat(80))
  console.log(`   Duration: ${elapsed} seconds`)
  console.log(`   Total Events: ${eventCount}`)
  console.log(`   Average Rate: ${(eventCount / elapsed).toFixed(2)} events/second`)
  console.log('')
  console.log('   Event Type Distribution:')

  Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / eventCount) * 100).toFixed(1)
      const bar = '█'.repeat(Math.floor(percentage / 2))
      console.log(`     ${type.padEnd(15)} ${count.toString().padStart(6)} ${bar} ${percentage}%`)
    })

  console.log('═'.repeat(80))
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('')
  console.log('Disconnecting...')
  ws.close()
})
