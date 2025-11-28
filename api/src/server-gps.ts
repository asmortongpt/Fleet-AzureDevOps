/**
 * Server configuration with GPS routes
 */

import express from 'express'
import cors from 'cors'
import vehiclesRouter from './routes/vehicles'
import driversRouter from './routes/drivers'
import fuelRouter from './routes/fuel-transactions'
import maintenanceRouter from './routes/maintenance'
import incidentsRouter from './routes/incidents'
import partsRouter from './routes/parts'
import vendorsRouter from './routes/vendors'
import invoicesRouter from './routes/invoices'
import purchaseOrdersRouter from './routes/purchase-orders'
import tasksRouter from './routes/tasks'
import chargesRouter from './routes/personal-use-charges'
import gpsRouter from './routes/gps'
import { gpsEmulator } from './emulators/GPSEmulator'

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