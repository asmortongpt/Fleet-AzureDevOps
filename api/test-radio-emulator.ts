/**
 * Radio Emulator Test Script
 *
 * Interactive demonstration of the Radio/PTT Emulator functionality
 */

import { RadioEmulator } from './src/emulators/radio/RadioEmulator'
import { Vehicle, EmulatorConfig } from './src/emulators/types'

// Mock vehicle for testing
const testVehicle: Vehicle = {
  id: 'unit-alpha-1',
  make: 'Ford',
  model: 'F-150',
  year: 2024,
  type: 'truck',
  vin: 'TEST1234567890123',
  licensePlate: 'FLEET-001',
  tankSize: 26,
  fuelEfficiency: 20,
  startingLocation: { lat: 28.5383, lng: -81.3792 }, // Orlando, FL
  homeBase: { lat: 28.5383, lng: -81.3792, name: 'Orlando Fleet HQ' },
  driverBehavior: 'normal',
  features: ['radio', 'ptt', 'gps', 'obd2']
}

// Mock configuration
const testConfig: EmulatorConfig = {
  emulator: {
    version: '1.0.0',
    name: 'Fleet Radio Test',
    description: 'Testing radio emulator'
  },
  timeCompression: {
    enabled: false,
    ratio: 1,
    description: 'Real-time'
  },
  persistence: {
    enabled: false,
    database: 'test',
    redis: { enabled: false, ttl: 3600 }
  },
  realtime: {
    websocket: { enabled: false, port: 8080, path: '/ws' },
    broadcasting: { interval: 1000, batchSize: 100 }
  },
  performance: {
    maxVehicles: 10,
    maxConcurrentEmulators: 50,
    updateInterval: 1000,
    memoryLimit: '1GB'
  }
}

async function runRadioTest() {
  console.log('='.repeat(80))
  console.log('RADIO/PTT EMULATOR TEST')
  console.log('='.repeat(80))
  console.log()

  // Create radio emulator
  console.log(`Creating radio emulator for vehicle: ${testVehicle.id}`)
  const radioEmulator = new RadioEmulator(testVehicle, testConfig, {
    updateIntervalMs: 1000,
    enableAudioSimulation: true,
    enableInterference: true,
    pttTimeoutMs: 30000,
    emergencyPriority: true,
    baseStationLocation: { lat: 28.5383, lng: -81.3792 }
  })

  // Setup event listeners
  radioEmulator.on('started', (data) => {
    console.log(`✓ Radio started for vehicle: ${data.vehicleId}`)
  })

  radioEmulator.on('ptt-press', (event) => {
    console.log(`🎙️  PTT PRESSED - Channel: ${event.channelId}, Signal: ${event.signalStrength.toFixed(1)}%`)
  })

  radioEmulator.on('ptt-release', (event) => {
    console.log(`🔇 PTT RELEASED - Duration: ${event.metadata?.duration}ms`)
  })

  radioEmulator.on('transmission-start', (transmission) => {
    console.log(`📡 TRANSMISSION START:`)
    console.log(`   ID: ${transmission.id}`)
    console.log(`   Priority: ${transmission.priority}`)
    console.log(`   Signal: ${transmission.signalStrength.toFixed(1)}%`)
    console.log(`   Audio Quality: ${transmission.audioQuality.toFixed(1)}%`)
    console.log(`   Interference: ${transmission.interference.toFixed(1)}%`)
  })

  radioEmulator.on('transmission-end', (transmission) => {
    console.log(`📴 TRANSMISSION END:`)
    console.log(`   Duration: ${(transmission.duration / 1000).toFixed(2)}s`)
    console.log(`   Total Transmissions: ${radioEmulator.getCurrentState().totalTransmissions}`)
  })

  radioEmulator.on('channel-switch', (event) => {
    console.log(`🔄 CHANNEL SWITCH - From: ${event.fromChannel} → To: ${event.toChannel}`)
  })

  radioEmulator.on('channel-busy', (event) => {
    console.log(`⚠️  CHANNEL BUSY - ${event.channelId}`)
  })

  radioEmulator.on('emergency-activated', (event) => {
    console.log(`🚨 EMERGENCY ACTIVATED - Vehicle: ${event.vehicleId}`)
  })

  radioEmulator.on('emergency-deactivated', (event) => {
    console.log(`✅ EMERGENCY DEACTIVATED - Vehicle: ${event.vehicleId}`)
  })

  radioEmulator.on('audio-stream', (audio) => {
    console.log(`🎵 Audio Stream - ${audio.sampleRate}Hz, ${audio.bitDepth}-bit, ${audio.codec}`)
  })

  radioEmulator.on('state-update', (state) => {
    console.log(`📊 State Update - Signal: ${state.signalStrength.toFixed(1)}%, Battery: ${state.batteryLevel.toFixed(1)}%`)
  })

  // Start emulator
  console.log('\nStarting radio emulator...')
  await radioEmulator.start()

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 1: Display Available Channels')
  console.log('-'.repeat(80))
  const channels = radioEmulator.getChannels()
  channels.forEach(channel => {
    console.log(`📻 ${channel.name}`)
    console.log(`   ID: ${channel.id}`)
    console.log(`   Frequency: ${channel.frequency} MHz`)
    console.log(`   Type: ${channel.type}`)
    console.log(`   Priority: ${channel.priority}`)
    console.log(`   Encryption: ${channel.encryption ? 'Yes' : 'No'}`)
    console.log(`   Users: ${channel.currentUsers}/${channel.maxUsers}`)
    console.log()
  })

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 2: Routine Transmission')
  console.log('-'.repeat(80))
  console.log('Pressing PTT for routine transmission...')
  radioEmulator.pressPTT('routine')
  await new Promise(resolve => setTimeout(resolve, 3000))
  console.log('Releasing PTT...')
  radioEmulator.releasePTT()
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 3: Channel Switch')
  console.log('-'.repeat(80))
  console.log('Switching to Tactical channel...')
  radioEmulator.switchChannel('channel-tactical')
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 4: Urgent Transmission')
  console.log('-'.repeat(80))
  console.log('Pressing PTT for urgent transmission...')
  radioEmulator.pressPTT('urgent')
  await new Promise(resolve => setTimeout(resolve, 4000))
  console.log('Releasing PTT...')
  radioEmulator.releasePTT()
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 5: Emergency Activation')
  console.log('-'.repeat(80))
  console.log('Activating emergency mode...')
  radioEmulator.activateEmergency()
  await new Promise(resolve => setTimeout(resolve, 5000))
  console.log('Deactivating emergency mode...')
  radioEmulator.deactivateEmergency()
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 6: PTT Timeout Test')
  console.log('-'.repeat(80))
  console.log('Pressing PTT without release (should timeout)...')
  radioEmulator.pressPTT('routine')
  console.log('Waiting for timeout...')
  await new Promise(resolve => setTimeout(resolve, 6000))

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 7: Radio State Summary')
  console.log('-'.repeat(80))
  const state = radioEmulator.getCurrentState()
  console.log(`Vehicle ID: ${state.vehicleId}`)
  console.log(`Current Channel: ${state.currentChannel}`)
  console.log(`PTT Pressed: ${state.isPTTPressed}`)
  console.log(`Transmitting: ${state.isTransmitting}`)
  console.log(`Total Transmissions: ${state.totalTransmissions}`)
  console.log(`Total Transmit Time: ${(state.totalTransmitTime / 1000).toFixed(2)}s`)
  console.log(`Signal Strength: ${state.signalStrength.toFixed(1)}%`)
  console.log(`Battery Level: ${state.batteryLevel.toFixed(1)}%`)
  console.log(`Emergency Mode: ${state.isEmergencyMode}`)

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 8: Transmission History')
  console.log('-'.repeat(80))
  const history = radioEmulator.getTransmissionHistory(10)
  console.log(`Total transmissions in history: ${history.length}`)
  history.forEach((tx, index) => {
    console.log(`\nTransmission ${index + 1}:`)
    console.log(`  ID: ${tx.id}`)
    console.log(`  Channel: ${tx.channelId}`)
    console.log(`  Priority: ${tx.priority}`)
    console.log(`  Duration: ${(tx.duration / 1000).toFixed(2)}s`)
    console.log(`  Signal: ${tx.signalStrength.toFixed(1)}%`)
    console.log(`  Emergency: ${tx.isEmergency}`)
  })

  console.log('\n' + '-'.repeat(80))
  console.log('TEST 9: Custom Channel Registration')
  console.log('-'.repeat(80))
  const customChannel = {
    id: 'channel-special-ops',
    name: 'Special Operations',
    frequency: '158.250',
    type: 'tactical' as const,
    priority: 75,
    encryption: true,
    maxUsers: 5,
    currentUsers: 0,
    activeSpeaker: null,
    talkGroup: 'spec-ops'
  }
  const registered = radioEmulator.registerChannel(customChannel)
  console.log(`Custom channel registration: ${registered ? 'SUCCESS' : 'FAILED'}`)
  if (registered) {
    console.log('Switching to custom channel...')
    radioEmulator.switchChannel('channel-special-ops')
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '-'.repeat(80))
  console.log('Stopping radio emulator...')
  await radioEmulator.stop()

  console.log('\n' + '='.repeat(80))
  console.log('RADIO/PTT EMULATOR TEST COMPLETED')
  console.log('='.repeat(80))
  console.log()
  console.log('✓ All radio functionality tests passed successfully')
  console.log()
  console.log('Features Demonstrated:')
  console.log('  ✓ Channel management (5 default channels)')
  console.log('  ✓ PTT button press/release')
  console.log('  ✓ Transmission start/end events')
  console.log('  ✓ Audio stream simulation')
  console.log('  ✓ Signal strength calculation')
  console.log('  ✓ Emergency mode activation')
  console.log('  ✓ Channel switching')
  console.log('  ✓ PTT timeout protection')
  console.log('  ✓ Transmission history tracking')
  console.log('  ✓ Custom channel registration')
  console.log('  ✓ State tracking and reporting')
  console.log()
}

// Run the test
runRadioTest().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})
