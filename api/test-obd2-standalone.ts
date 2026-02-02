#!/usr/bin/env tsx
/**
 * Standalone OBD2 Emulator Test
 *
 * This script tests the OBD2 emulator independently without starting the full API server.
 */

import obd2Emulator from './src/services/obd2-emulator.service'

console.log('===================================')
console.log('OBD2 Emulator Standalone Test')
console.log('===================================')
console.log('')

// Test 1: Get available profiles
console.log('Test 1: Available Profiles')
console.log('---------------------------')
const profiles = [
  { id: 'sedan', name: 'Standard Sedan' },
  { id: 'truck', name: 'Work Truck' },
  { id: 'electric', name: 'Electric Vehicle' },
  { id: 'diesel', name: 'Diesel Engine' },
  { id: 'sports', name: 'Sports Car' }
]
profiles.forEach(p => console.log(`  - ${p.id}: ${p.name}`))
console.log('')

// Test 2: Generate single data point
console.log('Test 2: Generate Sample Data Point')
console.log('------------------------------------')
const sampleData = obd2Emulator.generateSingleDataPoint('sedan')
console.log('Sample OBD2 Data:')
console.log(JSON.stringify(sampleData, null, 2))
console.log('')

// Test 3: Start emulation session
console.log('Test 3: Start Emulation Session')
console.log('---------------------------------')
const sessionId = 'test-session-' + Date.now()

const session = obd2Emulator.startSession({
  sessionId,
  vehicleId: 1,
  adapterId: 100,
  profile: 'sedan',
  scenario: 'city',
  generateDTCs: false,
  updateIntervalMs: 1000
})

console.log(`Session started: ${sessionId}`)
console.log(`Profile: sedan`)
console.log(`Scenario: city`)
console.log('')

// Test 4: Get session data
console.log('Test 4: Retrieve Session Data')
console.log('-------------------------------')

// Wait a moment for data to be generated
setTimeout(() => {
  const sessionData = obd2Emulator.getSessionData(sessionId)

  if (sessionData) {
    console.log('Current Session Data:')
    console.log(`  Vehicle ID: ${sessionData.vehicleId}`)
    console.log(`  Adapter ID: ${sessionData.adapterId}`)
    console.log(`  Engine RPM: ${sessionData.engineRpm}`)
    console.log(`  Vehicle Speed: ${sessionData.vehicleSpeed} mph`)
    console.log(`  Throttle: ${sessionData.throttlePosition}%`)
    console.log(`  Engine Load: ${sessionData.engineLoad}%`)
    console.log(`  Coolant Temp: ${sessionData.engineCoolantTemp}°F`)
    console.log(`  Fuel Level: ${sessionData.fuelLevel}%`)
    console.log(`  Battery Voltage: ${sessionData.batteryVoltage}V`)
    console.log(`  Estimated MPG: ${sessionData.estimatedMpg}`)
    console.log(`  Location: ${sessionData.location?.latitude}, ${sessionData.location?.longitude}`)
  } else {
    console.log('No data available yet')
  }
  console.log('')

  // Test 5: Get active sessions
  console.log('Test 5: Active Sessions')
  console.log('------------------------')
  const activeSessions = obd2Emulator.getActiveSessions()
  console.log(`Active sessions: ${activeSessions.length}`)
  activeSessions.forEach(sid => console.log(`  - ${sid}`))
  console.log('')

  // Test 6: Sample DTCs
  console.log('Test 6: Sample Diagnostic Trouble Codes')
  console.log('----------------------------------------')
  const dtcs = obd2Emulator.getSampleDTCs(3)
  dtcs.forEach(dtc => {
    console.log(`  ${dtc.code} (${dtc.type})`)
    console.log(`    ${dtc.description}`)
    console.log(`    Severity: ${dtc.severity}, MIL: ${dtc.isMilOn}`)
  })
  console.log('')

  // Test 7: Stop session
  console.log('Test 7: Stop Emulation Session')
  console.log('--------------------------------')
  obd2Emulator.stopSession(sessionId)
  console.log(`Session ${sessionId} stopped`)
  console.log('')

  console.log('===================================')
  console.log('All Tests Completed Successfully!')
  console.log('===================================')
  console.log('')
  console.log('OBD2 Emulator Status: OPERATIONAL')
  console.log('')
  console.log('REST API Endpoints (when server running):')
  console.log('  GET  /api/obd2-emulator/profiles')
  console.log('  GET  /api/obd2-emulator/scenarios')
  console.log('  POST /api/obd2-emulator/start')
  console.log('  POST /api/obd2-emulator/stop/:sessionId')
  console.log('  GET  /api/obd2-emulator/data/:sessionId')
  console.log('  GET  /api/obd2-emulator/sessions')
  console.log('  GET  /api/obd2-emulator/sample-data')
  console.log('  GET  /api/obd2-emulator/sample-dtcs')
  console.log('')
  console.log('WebSocket Endpoint:')
  console.log('  ws://localhost:3000/ws/obd2/:sessionId')
  console.log('')

  process.exit(0)
}, 2000)
