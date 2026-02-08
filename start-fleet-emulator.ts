#!/usr/bin/env tsx
/**
 * Fleet Emulator Startup Script
 *
 * Initializes and starts the comprehensive fleet emulation system
 * - Multiple vehicles with realistic GPS tracking
 * - OBD2 telemetry (speed, RPM, fuel level)
 * - Route simulation with real-time position updates
 * - WebSocket streaming to frontend
 */

import { EmulatorOrchestrator } from './api/src/emulators/EmulatorOrchestrator'

// Configuration
const CONFIG = {
  vehicleIdOffset: 0,
  vehiclesPerPod: 10, // Start with 10 vehicles for comprehensive demo
  updateIntervalMs: 2000, // Update every 2 seconds for real-time feel
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║   Fleet Emulator - Comprehensive Vehicle Tracking    ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  console.log('Configuration:')
  console.log(`  Vehicles: ${CONFIG.vehiclesPerPod}`)
  console.log(`  Update Interval: ${CONFIG.updateIntervalMs}ms`)
  console.log(`  Location: Tallahassee, FL (30.4383°N, 84.2807°W)\n`)

  // Initialize emulator orchestrator (DB-backed telemetry only)
  const emulator = EmulatorOrchestrator.getInstance()

  console.log('Initializing vehicles from database...')
  // Give the orchestrator a moment to load DB-backed vehicles
  await new Promise((r) => setTimeout(r, 1000))

  console.log('\n✅ Initialization complete!\n')

  // Start emulation
  console.log('Starting real-time emulation...\n')
  await emulator.start()

  // Display status
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║               EMULATOR NOW RUNNING                    ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')
  console.log('Vehicle data is being generated and streamed to:')
  console.log('  • PostgreSQL database (emulator_* tables)')
  console.log('  • WebSocket clients (real-time updates)')
  console.log('  • Frontend dashboard (via API)\n')
  console.log('Features:')
  console.log('  ✓ Real-time GPS tracking')
  console.log('  ✓ OBD2 telemetry (RPM, speed, fuel)')
  console.log('  ✓ Route simulation')
  console.log('  ✓ Driver behavior')
  console.log('  ✓ Fuel transactions')
  console.log('  ✓ Maintenance events')
  console.log('  ✓ Safety events\n')
  console.log('Press Ctrl+C to stop the emulator\n')

  // Setup event listener for vehicle updates
  emulator.on('vehicle-update', (data) => {
    console.log(`[${new Date().toISOString()}] ${data.vehicleId}: ` +
      `Lat: ${data.location.latitude.toFixed(6)}, ` +
      `Lng: ${data.location.longitude.toFixed(6)}, ` +
      `Speed: ${data.telemetry.speed.toFixed(1)} mph, ` +
      `Fuel: ${data.telemetry.fuelLevel.toFixed(1)}%, ` +
      `Status: ${data.status}`)
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down emulator...')
    await emulator.stop()
    console.log('Emulator stopped successfully')
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n\nShutting down emulator...')
    await emulator.stop()
    console.log('Emulator stopped successfully')
    process.exit(0)
  })
}

// Run the emulator
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
