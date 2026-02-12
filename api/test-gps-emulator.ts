/**
 * Test GPS Emulator
 * Simple test to verify GPS emulator functionality
 */

import { gpsEmulator } from './src/emulators/GPSEmulator'

console.log('Testing GPS Emulator...')

// Start the emulator
gpsEmulator.start()

// Listen for position updates
gpsEmulator.on('positionsUpdate', (positions) => {
  console.log(`📍 Updated ${positions.length} vehicle positions`)

  // Show a sample of vehicles
  const sample = positions.slice(0, 5)
  sample.forEach(pos => {
    console.log(`  Vehicle ${pos.vehicleId}: ${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)} - ${pos.speed.toFixed(1)} mph - ${pos.status}`)
  })
})

// Listen for geofence alerts
gpsEmulator.on('geofenceAlert', (alert) => {
  console.log(`⚠️ Geofence Alert: Vehicle ${alert.vehicleId} near ${alert.facilityName} (${alert.distance}m)`)
})

// Test API functions
setTimeout(() => {
  console.log('\n📊 Testing API functions...')

  // Get all positions
  const { positions, total } = gpsEmulator.getAllPositions()
  console.log(`Total vehicles: ${total}`)

  // Get positions by status
  const moving = gpsEmulator.getAllPositions({ status: 'moving' })
  const idle = gpsEmulator.getAllPositions({ status: 'idle' })
  const stopped = gpsEmulator.getAllPositions({ status: 'stopped' })

  console.log(`  Moving: ${moving.total}, Idle: ${idle.total}, Stopped: ${stopped.total}`)

  // Get specific vehicle
  const vehicle1 = gpsEmulator.getVehiclePosition(1)
  if (vehicle1) {
    console.log(`\nVehicle 1 Details:`)
    console.log(`  Position: ${vehicle1.latitude.toFixed(4)}, ${vehicle1.longitude.toFixed(4)}`)
    console.log(`  Speed: ${vehicle1.speed} mph`)
    console.log(`  Status: ${vehicle1.status}`)
    console.log(`  Address: ${vehicle1.address}`)
  }

  // Get vehicle history
  const history = gpsEmulator.getVehicleHistory(1)
  console.log(`\nVehicle 1 History: ${history.length} breadcrumbs`)

  // Get facilities
  const facilities = gpsEmulator.getFacilities()
  console.log(`\nFacilities/Geofences: ${facilities.length}`)
  facilities.forEach(f => {
    console.log(`  - ${f.name} (${f.type})`)
  })
}, 2000)

// Stop after 30 seconds
setTimeout(() => {
  gpsEmulator.stop()
  console.log('\n✅ GPS Emulator test complete')
  process.exit(0)
}, 30000)

console.log('GPS Emulator test running for 30 seconds...')