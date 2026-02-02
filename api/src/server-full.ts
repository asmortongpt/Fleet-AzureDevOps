// Fleet API Server - Full Functional Version
// Provides all required routes with mock data to bypass TypeScript compilation issues
import http from 'http'

import cors from 'cors'
import express from 'express'
import { Server as WebSocketServer } from 'ws'


const app = express()
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(cors({
  origin: '*',
  credentials: true
}))
app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateVehicles = (count = 50) => {
  const makes = ['Ford', 'Chevrolet', 'Toyota', 'Honda', 'Dodge']
  const models = ['F-150', 'Silverado', 'Camry', 'Civic', 'RAM 1500']
  const statuses = ['active', 'maintenance', 'retired']

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    vin: `VIN${String(i + 1).padStart(14, '0')}`,
    make: makes[i % makes.length],
    model: models[i % models.length],
    year: 2020 + (i % 5),
    license_plate: `ABC${String(i + 1).padStart(4, '0')}`,
    status: statuses[i % statuses.length],
    mileage: 10000 + (i * 1000),
    fuel_type: i % 3 === 0 ? 'electric' : 'gasoline',
    department: `Department ${(i % 5) + 1}`,
    assigned_driver_id: (i % 10) + 1,
    location: { lat: 30.4 + (i * 0.01), lng: -84.2 + (i * 0.01) },
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }))
}

const generateDrivers = (count = 30) => {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Mike']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones']
  const statuses = ['active', 'on_leave', 'inactive']

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    first_name: firstNames[i % firstNames.length],
    last_name: lastNames[i % lastNames.length],
    employee_id: `EMP${String(i + 1).padStart(5, '0')}`,
    license_number: `DL${String(i + 1).padStart(8, '0')}`,
    license_expiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    status: statuses[i % statuses.length],
    phone: `555-0${String(i + 100).padStart(3, '0')}`,
    email: `driver${i + 1}@fleet.com`,
    department: `Department ${(i % 5) + 1}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }))
}

const generateWorkOrders = (count = 100) => {
  const types = ['preventive', 'repair', 'inspection']
  const statuses = ['open', 'in_progress', 'completed', 'cancelled']
  const priorities = ['low', 'medium', 'high', 'critical']

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    work_order_number: `WO-${String(i + 1).padStart(6, '0')}`,
    vehicle_id: (i % 50) + 1,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    description: `Work order description ${i + 1}`,
    assigned_to: `Technician ${(i % 10) + 1}`,
    estimated_cost: 100 + (i * 50),
    actual_cost: i % 2 === 0 ? 100 + (i * 45) : null,
    scheduled_date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    completed_date: i % 2 === 0 ? new Date().toISOString().split('T')[0] : null,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }))
}

const generateFuelTransactions = (count = 200) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    vehicle_id: (i % 50) + 1,
    driver_id: (i % 30) + 1,
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    gallons: 10 + (i % 20),
    cost: 30 + (i % 50),
    odometer: 10000 + (i * 100),
    fuel_type: i % 3 === 0 ? 'diesel' : 'gasoline',
    vendor: `Station ${(i % 5) + 1}`,
    location: `Location ${(i % 10) + 1}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString()
  }))
}

const generateFacilities = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Facility ${i + 1}`,
    type: i % 2 === 0 ? 'garage' : 'parking',
    address: `${100 + i} Main St`,
    city: 'Tallahassee',
    state: 'FL',
    zip: '32301',
    capacity: 50 + (i * 10),
    current_occupancy: 20 + (i * 5),
    manager: `Manager ${i + 1}`,
    phone: `850-555-0${String(i + 100).padStart(3, '0')}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }))
}

const generateMaintenanceSchedules = (count = 75) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    vehicle_id: (i % 50) + 1,
    service_type: i % 2 === 0 ? 'oil_change' : 'tire_rotation',
    interval_miles: 5000,
    interval_days: 180,
    last_service_date: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    last_service_mileage: 5000 + (i * 1000),
    next_service_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    next_service_mileage: 10000 + (i * 1000),
    is_active: true,
    created_at: new Date(Date.now() - i * 86400000).toISOString()
  }))
}

const generateRoutes = (count = 40) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Route ${i + 1}`,
    vehicle_id: (i % 50) + 1,
    driver_id: (i % 30) + 1,
    start_location: `Start ${i + 1}`,
    end_location: `End ${i + 1}`,
    waypoints: [],
    distance_miles: 10 + (i * 2),
    estimated_duration_minutes: 30 + (i * 5),
    status: i % 3 === 0 ? 'completed' : 'active',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: i % 3 === 0 ? new Date().toISOString() : null,
    created_at: new Date(Date.now() - i * 86400000).toISOString()
  }))
}

// Generate mock data
const vehicles = generateVehicles()
const drivers = generateDrivers()
const workOrders = generateWorkOrders()
const fuelTransactions = generateFuelTransactions()
const facilities = generateFacilities()
const maintenanceSchedules = generateMaintenanceSchedules()
const routes = generateRoutes()

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-full',
    service: 'fleet-api',
    endpoints: {
      vehicles: '/api/vehicles',
      drivers: '/api/drivers',
      workOrders: '/api/work-orders',
      fuel: '/api/fuel-transactions',
      facilities: '/api/facilities',
      maintenance: '/api/maintenance-schedules',
      routes: '/api/routes'
    }
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-full',
    service: 'fleet-api'
  })
})

app.get('/', (req, res) => {
  res.json({
    message: 'Fleet API - Full Version',
    version: '2.0.0-full',
    status: 'operational'
  })
})

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

app.post('/api/v1/auth/verify', (req, res) => {
  res.json({
    valid: true,
    user: {
      id: 1,
      email: 'admin@fleet.com',
      name: 'Admin User',
      role: 'admin',
      tenant_id: 1
    }
  })
})

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: {
      id: 1,
      email: req.body.email || 'admin@fleet.com',
      name: 'Admin User',
      role: 'admin',
      tenant_id: 1
    }
  })
})

// ============================================================================
// VEHICLES ENDPOINTS
// ============================================================================

app.get('/api/vehicles', (req, res) => {
  const { tenant_id, page = 1, limit = 20, search, status } = req.query

  let filtered = vehicles

  if (search) {
    const searchLower = String(search).toLowerCase()
    filtered = filtered.filter(v =>
      v.make.toLowerCase().includes(searchLower) ||
      v.model.toLowerCase().includes(searchLower) ||
      v.license_plate.toLowerCase().includes(searchLower)
    )
  }

  if (status) {
    filtered = filtered.filter(v => v.status === status)
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: filtered.slice(start, end),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum)
  })
})

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === Number(req.params.id))
  if (vehicle) {
    res.json(vehicle)
  } else {
    res.status(404).json({ error: 'Vehicle not found' })
  }
})

app.post('/api/vehicles', (req, res) => {
  const newVehicle = {
    id: vehicles.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  vehicles.push(newVehicle)
  res.status(201).json(newVehicle)
})

app.put('/api/vehicles/:id', (req, res) => {
  const index = vehicles.findIndex(v => v.id === Number(req.params.id))
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...req.body, updated_at: new Date().toISOString() }
    res.json(vehicles[index])
  } else {
    res.status(404).json({ error: 'Vehicle not found' })
  }
})

app.delete('/api/vehicles/:id', (req, res) => {
  const index = vehicles.findIndex(v => v.id === Number(req.params.id))
  if (index !== -1) {
    vehicles.splice(index, 1)
    res.status(204).send()
  } else {
    res.status(404).json({ error: 'Vehicle not found' })
  }
})

// ============================================================================
// DRIVERS ENDPOINTS
// ============================================================================

app.get('/api/drivers', (req, res) => {
  const { tenant_id, page = 1, limit = 20, search, status } = req.query

  let filtered = drivers

  if (search) {
    const searchLower = String(search).toLowerCase()
    filtered = filtered.filter(d =>
      d.first_name.toLowerCase().includes(searchLower) ||
      d.last_name.toLowerCase().includes(searchLower) ||
      d.employee_id.toLowerCase().includes(searchLower)
    )
  }

  if (status) {
    filtered = filtered.filter(d => d.status === status)
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: filtered.slice(start, end),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum)
  })
})

app.get('/api/drivers/:id', (req, res) => {
  const driver = drivers.find(d => d.id === Number(req.params.id))
  if (driver) {
    res.json(driver)
  } else {
    res.status(404).json({ error: 'Driver not found' })
  }
})

app.post('/api/drivers', (req, res) => {
  const newDriver = {
    id: drivers.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  drivers.push(newDriver)
  res.status(201).json(newDriver)
})

app.put('/api/drivers/:id', (req, res) => {
  const index = drivers.findIndex(d => d.id === Number(req.params.id))
  if (index !== -1) {
    drivers[index] = { ...drivers[index], ...req.body, updated_at: new Date().toISOString() }
    res.json(drivers[index])
  } else {
    res.status(404).json({ error: 'Driver not found' })
  }
})

app.delete('/api/drivers/:id', (req, res) => {
  const index = drivers.findIndex(d => d.id === Number(req.params.id))
  if (index !== -1) {
    drivers.splice(index, 1)
    res.status(204).send()
  } else {
    res.status(404).json({ error: 'Driver not found' })
  }
})

// ============================================================================
// WORK ORDERS ENDPOINTS
// ============================================================================

app.get('/api/work-orders', (req, res) => {
  const { tenant_id, page = 1, limit = 20, status, priority } = req.query

  let filtered = workOrders

  if (status) {
    filtered = filtered.filter(w => w.status === status)
  }

  if (priority) {
    filtered = filtered.filter(w => w.priority === priority)
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: filtered.slice(start, end),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum)
  })
})

app.get('/api/work-orders/:id', (req, res) => {
  const workOrder = workOrders.find(w => w.id === Number(req.params.id))
  if (workOrder) {
    res.json(workOrder)
  } else {
    res.status(404).json({ error: 'Work order not found' })
  }
})

app.post('/api/work-orders', (req, res) => {
  const newWorkOrder = {
    id: workOrders.length + 1,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  workOrders.push(newWorkOrder)
  res.status(201).json(newWorkOrder)
})

app.put('/api/work-orders/:id', (req, res) => {
  const index = workOrders.findIndex(w => w.id === Number(req.params.id))
  if (index !== -1) {
    workOrders[index] = { ...workOrders[index], ...req.body, updated_at: new Date().toISOString() }
    res.json(workOrders[index])
  } else {
    res.status(404).json({ error: 'Work order not found' })
  }
})

// ============================================================================
// FUEL TRANSACTIONS ENDPOINTS
// ============================================================================

app.get('/api/fuel-transactions', (req, res) => {
  const { tenant_id, page = 1, limit = 20, vehicle_id } = req.query

  let filtered = fuelTransactions

  if (vehicle_id) {
    filtered = filtered.filter(f => f.vehicle_id === Number(vehicle_id))
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: filtered.slice(start, end),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum)
  })
})

app.post('/api/fuel-transactions', (req, res) => {
  const newTransaction = {
    id: fuelTransactions.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  }
  fuelTransactions.push(newTransaction)
  res.status(201).json(newTransaction)
})

// ============================================================================
// FACILITIES ENDPOINTS
// ============================================================================

app.get('/api/facilities', (req, res) => {
  const { tenant_id, page = 1, limit = 20 } = req.query

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: facilities.slice(start, end),
    total: facilities.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(facilities.length / limitNum)
  })
})

app.get('/api/facilities/:id', (req, res) => {
  const facility = facilities.find(f => f.id === Number(req.params.id))
  if (facility) {
    res.json(facility)
  } else {
    res.status(404).json({ error: 'Facility not found' })
  }
})

// ============================================================================
// MAINTENANCE SCHEDULES ENDPOINTS
// ============================================================================

app.get('/api/maintenance-schedules', (req, res) => {
  const { tenant_id, page = 1, limit = 20, vehicle_id } = req.query

  let filtered = maintenanceSchedules

  if (vehicle_id) {
    filtered = filtered.filter(m => m.vehicle_id === Number(vehicle_id))
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: filtered.slice(start, end),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum)
  })
})

app.post('/api/maintenance-schedules', (req, res) => {
  const newSchedule = {
    id: maintenanceSchedules.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  }
  maintenanceSchedules.push(newSchedule)
  res.status(201).json(newSchedule)
})

// ============================================================================
// ROUTES ENDPOINTS
// ============================================================================

app.get('/api/routes', (req, res) => {
  const { tenant_id, page = 1, limit = 20, status } = req.query

  let filtered = routes

  if (status) {
    filtered = filtered.filter(r => r.status === status)
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: filtered.slice(start, end),
    total: filtered.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filtered.length / limitNum)
  })
})

app.get('/api/routes/:id', (req, res) => {
  const route = routes.find(r => r.id === Number(req.params.id))
  if (route) {
    res.json(route)
  } else {
    res.status(404).json({ error: 'Route not found' })
  }
})

// ============================================================================
// DASHBOARD & ANALYTICS ENDPOINTS
// ============================================================================

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    total_vehicles: vehicles.length,
    active_vehicles: vehicles.filter(v => v.status === 'active').length,
    total_drivers: drivers.length,
    active_drivers: drivers.filter(d => d.status === 'active').length,
    open_work_orders: workOrders.filter(w => w.status === 'open').length,
    total_fuel_cost: fuelTransactions.reduce((sum, f) => sum + f.cost, 0),
    avg_vehicle_mileage: Math.round(vehicles.reduce((sum, v) => sum + v.mileage, 0) / vehicles.length)
  })
})

app.get('/api/metrics/fleet-utilization', (req, res) => {
  res.json({
    utilization_rate: 0.85,
    active_vehicles: vehicles.filter(v => v.status === 'active').length,
    idle_vehicles: vehicles.filter(v => v.status !== 'active').length,
    total_miles_driven: vehicles.reduce((sum, v) => sum + v.mileage, 0)
  })
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /api/vehicles',
      'GET /api/drivers',
      'GET /api/work-orders',
      'GET /api/fuel-transactions',
      'GET /api/facilities',
      'GET /api/maintenance-schedules',
      'GET /api/routes'
    ]
  })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  })
})

// ============================================================================
// SERVER STARTUP WITH WEBSOCKET
// ============================================================================

const server = http.createServer(app)

// WebSocket server for emulator
const wss = new WebSocketServer({
  server,
  path: '/api/emulator/ws'
})

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')

  // Send initial vehicle data
  ws.send(JSON.stringify({
    type: 'vehicle_update',
    data: vehicles.slice(0, 10)
  }))

  // Send periodic updates
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'vehicle_telemetry',
        timestamp: new Date().toISOString(),
        vehicle_id: Math.floor(Math.random() * 50) + 1,
        speed: Math.floor(Math.random() * 80),
        location: {
          lat: 30.4 + Math.random() * 0.5,
          lng: -84.2 + Math.random() * 0.5
        }
      }))
    }
  }, 5000)

  ws.on('close', () => {
    console.log('WebSocket client disconnected')
    clearInterval(interval)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    clearInterval(interval)
  })
})

server.listen(PORT, () => {
  console.log('')
  console.log('='.repeat(60))
  console.log('🚀 Fleet API Server - FULL VERSION')
  console.log('='.repeat(60))
  console.log(`✅ HTTP Server running on port ${PORT}`)
  console.log(`✅ WebSocket Server running on ws://localhost:${PORT}/api/emulator/ws`)
  console.log('')
  console.log('Available Endpoints:')
  console.log('  Health:        GET  /health')
  console.log('  Vehicles:      GET  /api/vehicles')
  console.log('  Drivers:       GET  /api/drivers')
  console.log('  Work Orders:   GET  /api/work-orders')
  console.log('  Fuel:          GET  /api/fuel-transactions')
  console.log('  Facilities:    GET  /api/facilities')
  console.log('  Maintenance:   GET  /api/maintenance-schedules')
  console.log('  Routes:        GET  /api/routes')
  console.log('  Dashboard:     GET  /api/dashboard/stats')
  console.log('  Auth:          POST /api/v1/auth/verify')
  console.log('')
  console.log('Mock Data Generated:')
  console.log(`  🚗 ${vehicles.length} vehicles`)
  console.log(`  👤 ${drivers.length} drivers`)
  console.log(`  🔧 ${workOrders.length} work orders`)
  console.log(`  ⛽ ${fuelTransactions.length} fuel transactions`)
  console.log(`  🏢 ${facilities.length} facilities`)
  console.log(`  📅 ${maintenanceSchedules.length} maintenance schedules`)
  console.log(`  🗺️  ${routes.length} routes`)
  console.log('='.repeat(60))
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
