/**
 * Test GPS API Endpoints
 */

import cors from 'cors'
import express from 'express'

import { gpsEmulator } from './src/emulators/GPSEmulator'
import gpsRouter from './src/routes/gps'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// GPS routes
app.use('/api/gps', gpsRouter)

// Start server
const server = app.listen(PORT, async () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`)

  // Start GPS emulation
  gpsEmulator.start()
  console.log('🛰️ GPS Emulator started - tracking 50 vehicles')

  // Wait a bit for data to generate
  setTimeout(async () => {
    console.log('\n📊 Testing API endpoints...\n')

    // Test GET /api/gps
    const allPositions = await fetch(`http://localhost:${PORT}/api/gps?limit=10`)
      .then(res => res.json())
    console.log('GET /api/gps - All positions:')
    console.log(`  Success: ${allPositions.success}`)
    console.log(`  Vehicles returned: ${allPositions.data?.length || 0}`)
    console.log(`  Total vehicles: ${allPositions.pagination?.total || 0}`)

    // Test filtering by status
    const movingVehicles = await fetch(`http://localhost:${PORT}/api/gps?status=moving`)
      .then(res => res.json())
    console.log('\nGET /api/gps?status=moving:')
    console.log(`  Moving vehicles: ${movingVehicles.pagination?.total || 0}`)

    // Test specific vehicle
    const vehicle1 = await fetch(`http://localhost:${PORT}/api/gps/1`)
      .then(res => res.json())
    console.log('\nGET /api/gps/1 - Vehicle 1:')
    if (vehicle1.success && vehicle1.data) {
      console.log(`  Position: ${vehicle1.data.latitude.toFixed(4)}, ${vehicle1.data.longitude.toFixed(4)}`)
      console.log(`  Speed: ${vehicle1.data.speed} mph`)
      console.log(`  Status: ${vehicle1.data.status}`)
    }

    // Test vehicle history
    const history = await fetch(`http://localhost:${PORT}/api/gps/1/history`)
      .then(res => res.json())
    console.log('\nGET /api/gps/1/history:')
    console.log(`  Breadcrumbs: ${history.count || 0}`)

    // Test facilities
    const facilities = await fetch(`http://localhost:${PORT}/api/gps/facilities`)
      .then(res => res.json())
    console.log('\nGET /api/gps/facilities:')
    console.log(`  Facilities: ${facilities.data?.length || 0}`)
    if (facilities.data) {
      facilities.data.slice(0, 3).forEach((f: any) => {
        console.log(`    - ${f.name} (${f.type})`)
      })
    }

    // Test geofence alerts
    const alerts = await fetch(`http://localhost:${PORT}/api/gps/geofence/alerts`)
      .then(res => res.json())
    console.log('\nGET /api/gps/geofence/alerts:')
    console.log(`  Total alerts: ${alerts.total || 0}`)

    // Sample response data
    console.log('\n📄 Sample API Response from GET /api/gps?limit=3:')
    const sample = await fetch(`http://localhost:${PORT}/api/gps?limit=3`)
      .then(res => res.json())
    console.log(JSON.stringify(sample, null, 2))

    // Show sample breadcrumb data
    console.log('\n📍 Sample Breadcrumb Data (Vehicle 1):')
    // Wait for more updates to get breadcrumbs
    setTimeout(async () => {
      const historyWithData = await fetch(`http://localhost:${PORT}/api/gps/1/history`)
        .then(res => res.json())
      if (historyWithData.data && historyWithData.data.length > 0) {
        console.log(JSON.stringify(historyWithData.data.slice(0, 3), null, 2))
      } else {
        console.log('  No breadcrumbs yet (vehicle needs to move)')
      }

      console.log('\n✅ API test complete')
      gpsEmulator.stop()
      server.close()
      process.exit(0)
    }, 5000)
  }, 3000)
})

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
  process.exit(1)
})