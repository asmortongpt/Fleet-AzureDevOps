/**
 * Server configuration with GPS routes
 */

import cors from 'cors'
import express from 'express'

import { gpsEmulator } from './emulators/GPSEmulator'
import driversRouter from './routes/drivers'
import fuelRouter from './routes/fuel-transactions'
import gpsRouter from './routes/gps'
import incidentsRouter from './routes/incidents'
import invoicesRouter from './routes/invoices'
import maintenanceRouter from './routes/maintenance'
import partsRouter from './routes/parts'
import purchaseOrdersRouter from './routes/purchase-orders'
import vehiclesRouter from './routes/vehicles'
import vendorsRouter from './routes/vendors'
import tasksRouter from './routes/tasks'
import chargesRouter from './routes/personal-use-charges'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/vehicles', vehiclesRouter)
app.use('/api/drivers', driversRouter)
app.use('/api/fuel-transactions', fuelRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/incidents', incidentsRouter)
app.use('/api/parts', partsRouter)
app.use('/api/vendors', vendorsRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/purchase-orders', purchaseOrdersRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/personal-use-charges', chargesRouter)
app.use('/api/gps', gpsRouter) // GPS routes

// Start GPS emulator when server starts
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)

  // Start GPS emulation
  gpsEmulator.start()
  console.log('🛰️ GPS Emulator started - tracking 50 vehicles')
})