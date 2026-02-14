// Fleet API Server - Full Functional Version (Database-backed)
// This server is safe to run in demo/prod because it uses real data sources only.
import cors from 'cors'
import express from 'express'
import { Pool } from 'pg'

const app = express()
const PORT = Number(process.env.PORT || 3001)

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true, ca: process.env.DB_SSL_CA } : (process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// CORS (allowlist, no wildcard with credentials)
const corsOrigin = process.env.CORS_ORIGIN
const allowedOrigins = corsOrigin
  ? corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean)
  : []

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

const isDevelopment = process.env.NODE_ENV !== 'production'
const allowlist = [...allowedOrigins, ...(isDevelopment ? defaultDevOrigins : [])]

if (!isDevelopment && allowlist.length === 0) {
  throw new Error('CORS_ORIGIN must be set in production to at least one allowed origin (no wildcard allowed when credentials=true)')
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }
    if (allowlist.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}))

app.use(express.json())

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

const getLimit = (value: unknown, fallback = 100) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.min(parsed, 1000)
}

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0-full',
      service: 'fleet-api',
    })
  } catch (error: unknown) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database unavailable',
    })
  }
})

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0-full',
    })
  } catch (error: unknown) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database unavailable',
    })
  }
})

// ============================================================================
// CORE DATA ENDPOINTS (DB-backed)
// ============================================================================

app.get('/api/vehicles', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, vin, name, number, type, make, model, year, license_plate, status,
              fuel_type, fuel_level, odometer, latitude, longitude, location_address,
              last_service_date, next_service_date, next_service_mileage,
              assigned_driver_id, assigned_facility_id, is_active, created_at, updated_at
       FROM vehicles
       ORDER BY updated_at DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch vehicles',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/drivers', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, employee_number, license_number,
              license_state, license_expiry_date, cdl, cdl_class, status, hire_date,
              termination_date, date_of_birth, performance_score, created_at, updated_at
       FROM drivers
       ORDER BY updated_at DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch drivers',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/work-orders', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, vehicle_id, number, title, description, type, priority, status,
              assigned_to_id, requested_by_id, approved_by_id,
              scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date,
              estimated_cost, actual_cost, labor_hours, odometer_at_start, odometer_at_end,
              created_at, updated_at
       FROM work_orders
       ORDER BY updated_at DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch work orders',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/fuel-transactions', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, vehicle_id, driver_id, transaction_date, fuel_type, gallons,
              cost_per_gallon, total_cost, odometer, location, latitude, longitude,
              vendor_name, receipt_number, payment_method, card_last4, created_at
       FROM fuel_transactions
       ORDER BY transaction_date DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch fuel transactions',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/facilities', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, name, code, type, address, city, state, zip_code, country,
              latitude, longitude, capacity, current_occupancy, contact_name,
              contact_phone, contact_email, is_active, created_at, updated_at
       FROM facilities
       ORDER BY updated_at DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch facilities',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/maintenance-schedules', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, vehicle_id, service_type, interval_miles, interval_days,
              last_service_date, last_service_mileage, next_service_date,
              next_service_mileage, is_active, created_at
       FROM maintenance_schedules
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch maintenance schedules',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/routes', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, name, number, description, type, status, assigned_vehicle_id,
              assigned_driver_id, scheduled_start_time, scheduled_end_time,
              actual_start_time, actual_end_time, estimated_distance, actual_distance,
              estimated_duration, actual_duration, waypoints, created_at, updated_at
       FROM routes
       ORDER BY updated_at DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch routes',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/inspections', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, vehicle_id, inspector_id, inspection_date, inspection_type,
              odometer, passed, notes, findings, created_at, updated_at
       FROM inspections
       ORDER BY inspection_date DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch inspections',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

app.get('/api/incidents', async (req, res) => {
  try {
    const limit = getLimit(req.query.limit, 100)
    const result = await pool.query(
      `SELECT id, vehicle_id, driver_id, incident_date, incident_type, severity,
              location, latitude, longitude, description, damage_description,
              estimated_damage_cost, injuries, police_report_number,
              insurance_claim_number, status, created_at, updated_at
       FROM incidents
       ORDER BY incident_date DESC
       LIMIT $1`,
      [limit]
    )
    res.json({ data: result.rows, count: result.rowCount })
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch incidents',
      details: error instanceof Error ? error.message : 'Unexpected error',
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`✅ Fleet API server (DB-backed) running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  pool.end(() => {
    process.exit(0)
  })
})
