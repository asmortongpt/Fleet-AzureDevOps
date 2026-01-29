const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store active emulator sessions
const emulatorSessions = new Map();
const wsClients = new Map();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'fleet-postgres-service',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'fleet_db',
  user: process.env.DB_USER || 'fleet_user',
  password: process.env.DB_PASSWORD || 'fleet_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

// Middleware
app.use(express.json());

// CORS middleware - allow credentials from frontend
app.use((req, res, next) => {
  const origin = req.headers.origin || 'http://localhost:5173';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, x-requested-with');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============================================================================
// Health check endpoints (both /health and /api/health)
// ============================================================================
const healthHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as db_time, version() as db_version');
    res.json({
      status: 'healthy',
      service: 'fleet-api',
      version: '2.0.1',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: result.rows[0].db_time,
      dbVersion: result.rows[0].db_version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        googleMaps: true,
        postgreSQL: true,
        realTimeData: true
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ============================================================================
// Vehicles API
// ============================================================================
app.get('/api/v1/vehicles', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT
        v.id, v.vin, v.make, v.model, v.year, v.license_plate, v.status,
        v.odometer as mileage, v.fuel_type,
        v.latitude, v.longitude, v.vehicle_type,
        v.assigned_driver_id, v.assigned_facility_id,
        v.purchase_date, v.purchase_price, v.current_value,
        v.speed, v.heading, v.gps_device_id, v.engine_hours,
        CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as name,
        v.created_at, v.updated_at,
        u.first_name || ' ' || u.last_name as driver_name,
        f.name as facility_name
      FROM vehicles v
      LEFT JOIN users u ON v.assigned_driver_id = u.id
      LEFT JOIN facilities f ON v.assigned_facility_id = f.id
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM vehicles');

    res.json({
      vehicles: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Vehicles endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicles',
      details: error.message
    });
  }
});

// Single vehicle endpoint
app.get('/api/v1/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      vehicle: result.rows[0],
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Vehicle fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle',
      details: error.message
    });
  }
});

// ============================================================================
// Drivers API
// ============================================================================
app.get('/api/v1/drivers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT
        d.id, d.license_number, d.license_state, d.license_expiration,
        d.cdl_class, d.cdl_endorsements, d.medical_card_expiration,
        d.hire_date, d.status, d.safety_score,
        d.total_miles_driven, d.total_hours_driven,
        d.incidents_count, d.violations_count,
        d.user_id, d.created_at, d.updated_at,
        u.first_name, u.last_name, u.email, u.phone,
        u.first_name || ' ' || u.last_name as name
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM drivers');

    res.json({
      drivers: result.rows,
      data: result.rows,
      count: result.rowCount,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });
  } catch (error) {
    console.error('Drivers endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch drivers',
      details: error.message
    });
  }
});

// Single driver endpoint
app.get('/api/v1/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM drivers WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      driver: result.rows[0],
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Driver fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch driver',
      details: error.message
    });
  }
});

// ============================================================================
// Stats API
// ============================================================================
app.get('/api/v1/stats', async (req, res) => {
  try {
    const vehicleCount = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    const driverCount = await pool.query('SELECT COUNT(*) as count FROM drivers');
    const activeVehicles = await pool.query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'");
    const activeDrivers = await pool.query("SELECT COUNT(*) as count FROM drivers WHERE status = 'active'");

    res.json({
      vehicles: {
        total: parseInt(vehicleCount.rows[0].count),
        active: parseInt(activeVehicles.rows[0].count)
      },
      drivers: {
        total: parseInt(driverCount.rows[0].count),
        active: parseInt(activeDrivers.rows[0].count)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error.message
    });
  }
});

// ============================================================================
// Alias endpoints (without /v1/) for frontend compatibility
// ============================================================================
app.get('/api/vehicles', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT v.*, CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as name,
              u.first_name || ' ' || u.last_name as driver_name,
              f.name as facility_name
       FROM vehicles v
       LEFT JOIN users u ON v.assigned_driver_id = u.id
       LEFT JOIN facilities f ON v.assigned_facility_id = f.id
       ORDER BY v.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM vehicles');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Vehicles endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles', details: error.message });
  }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT d.*, u.first_name, u.last_name, u.email, u.phone,
              u.first_name || ' ' || u.last_name as name
       FROM drivers d
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM drivers');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Drivers endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers', details: error.message });
  }
});

// Work orders endpoint - real database query
app.get('/api/work-orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT w.*, v.make || ' ' || v.model as vehicle_name, v.license_plate,
              f.name as facility_name, u.first_name || ' ' || u.last_name as technician_name
       FROM work_orders w
       LEFT JOIN vehicles v ON w.vehicle_id = v.id
       LEFT JOIN facilities f ON w.facility_id = f.id
       LEFT JOIN users u ON w.assigned_technician_id = u.id
       ORDER BY w.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM work_orders');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Work orders endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch work orders', details: error.message });
  }
});

// Facilities endpoint - real database query
app.get('/api/facilities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT * FROM facilities ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM facilities');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Facilities endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch facilities', details: error.message });
  }
});

// Maintenance schedules endpoint - real database query
app.get('/api/maintenance-schedules', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT m.*, v.make || ' ' || v.model as vehicle_name, v.license_plate, v.vin
       FROM maintenance_schedules m
       LEFT JOIN vehicles v ON m.vehicle_id = v.id
       ORDER BY m.next_service_due_date ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM maintenance_schedules');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Maintenance schedules endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedules', details: error.message });
  }
});

// Fuel transactions endpoint - real database query
app.get('/api/fuel-transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT ft.*, v.make || ' ' || v.model as vehicle_name, v.license_plate,
              u.first_name || ' ' || u.last_name as driver_name
       FROM fuel_transactions ft
       LEFT JOIN vehicles v ON ft.vehicle_id = v.id
       LEFT JOIN drivers d ON ft.driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY ft.transaction_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM fuel_transactions');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Fuel transactions endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch fuel transactions', details: error.message });
  }
});

// Routes endpoint - real database query
app.get('/api/routes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT r.*, v.make || ' ' || v.model as vehicle_name, v.license_plate,
              u.first_name || ' ' || u.last_name as driver_name
       FROM routes r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM routes');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Routes endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch routes', details: error.message });
  }
});

// Safety incidents endpoint - real database query
app.get('/api/safety-incidents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT si.*, v.make || ' ' || v.model as vehicle_name, v.license_plate,
              u.first_name || ' ' || u.last_name as driver_name
       FROM safety_incidents si
       LEFT JOIN vehicles v ON si.vehicle_id = v.id
       LEFT JOIN drivers d ON si.driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY si.incident_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM safety_incidents');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Safety incidents endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch safety incidents', details: error.message });
  }
});

// Inspections endpoint - real database query
app.get('/api/inspections', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT i.*, v.make || ' ' || v.model as vehicle_name, v.license_plate,
              u.first_name || ' ' || u.last_name as driver_name
       FROM inspections i
       LEFT JOIN vehicles v ON i.vehicle_id = v.id
       LEFT JOIN drivers d ON i.driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY i.inspection_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) as total FROM inspections');
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].total), limit, offset });
  } catch (error) {
    console.error('Inspections endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch inspections', details: error.message });
  }
});

// Telemetry data endpoint
app.get('/api/telemetry', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const vehicleId = req.query.vehicleId;

    let query = `SELECT t.*, v.make || ' ' || v.model as vehicle_name, v.license_plate
                 FROM telemetry_data t
                 LEFT JOIN vehicles v ON t.vehicle_id = v.id`;
    const params = [];

    if (vehicleId) {
      query += ` WHERE t.vehicle_id = $1`;
      params.push(vehicleId);
    }

    query += ` ORDER BY t.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ data: result.rows, total: result.rowCount, limit, offset });
  } catch (error) {
    console.error('Telemetry endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry data', details: error.message });
  }
});

// ============================================================================
// Operations API - Routes, Fuel Transactions, Tasks
// These endpoints return arrays directly (not wrapped in { data: ... })
// to match the Zod validation schemas in use-reactive-operations-data.ts
// ============================================================================

// Mock routes data
const mockRoutes = [
  {
    id: '1',
    driverId: '1',
    vehicleId: '1',
    status: 'in_transit',
    startTime: '2024-01-15T08:00:00Z',
    endTime: '2024-01-15T16:00:00Z',
    distance: 125.5,
    estimatedDuration: 480,
    actualDuration: 450,
    origin: 'Chicago Depot',
    destination: 'Milwaukee Distribution Center',
    stops: 3,
    priority: 'high',
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-15T08:30:00Z'
  },
  {
    id: '2',
    driverId: '2',
    vehicleId: '2',
    status: 'completed',
    startTime: '2024-01-14T06:00:00Z',
    endTime: '2024-01-14T14:00:00Z',
    distance: 89.2,
    estimatedDuration: 360,
    actualDuration: 380,
    origin: 'Downtown Terminal',
    destination: 'O\'Hare Airport',
    stops: 5,
    priority: 'medium',
    createdAt: '2024-01-13T14:00:00Z',
    updatedAt: '2024-01-14T14:30:00Z'
  },
  {
    id: '3',
    driverId: '3',
    vehicleId: '3',
    status: 'scheduled',
    startTime: '2024-01-16T07:00:00Z',
    distance: 156.8,
    estimatedDuration: 540,
    origin: 'North Side Facility',
    destination: 'Gary Industrial Park',
    stops: 4,
    priority: 'low',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: '4',
    driverId: '4',
    vehicleId: '4',
    status: 'delayed',
    startTime: '2024-01-15T09:00:00Z',
    distance: 78.3,
    estimatedDuration: 300,
    actualDuration: 420,
    origin: 'South Loop',
    destination: 'Naperville Hub',
    stops: 2,
    priority: 'critical',
    createdAt: '2024-01-14T16:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: '5',
    driverId: '5',
    vehicleId: '5',
    status: 'completed',
    startTime: '2024-01-13T05:30:00Z',
    endTime: '2024-01-13T11:30:00Z',
    distance: 112.0,
    estimatedDuration: 360,
    actualDuration: 340,
    origin: 'West Side Depot',
    destination: 'Aurora Distribution',
    stops: 6,
    priority: 'medium',
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-13T12:00:00Z'
  }
];

// Mock fuel transactions data
const mockFuelTransactions = [
  {
    id: '1',
    vehicleId: '1',
    driverId: '1',
    amount: 45.5,
    cost: 156.75,
    pricePerUnit: 3.45,
    fuelType: 'diesel',
    location: 'Shell Station - I-94',
    odometer: 125432,
    createdAt: '2024-01-15T10:30:00Z',
    receiptNumber: 'SH-2024-001234',
    notes: 'Regular fill-up'
  },
  {
    id: '2',
    vehicleId: '2',
    driverId: '2',
    amount: 38.2,
    cost: 131.79,
    pricePerUnit: 3.45,
    fuelType: 'diesel',
    location: 'BP Station - Downtown',
    odometer: 89234,
    createdAt: '2024-01-14T14:15:00Z',
    receiptNumber: 'BP-2024-005678'
  },
  {
    id: '3',
    vehicleId: '3',
    driverId: '3',
    amount: 52.0,
    cost: 179.40,
    pricePerUnit: 3.45,
    fuelType: 'diesel',
    location: 'Pilot Travel Center',
    odometer: 156789,
    createdAt: '2024-01-14T08:00:00Z',
    receiptNumber: 'PIL-2024-009012'
  },
  {
    id: '4',
    vehicleId: '4',
    driverId: '4',
    amount: 28.5,
    cost: 107.73,
    pricePerUnit: 3.78,
    fuelType: 'gasoline',
    location: 'Mobil Station - Naperville',
    odometer: 78456,
    createdAt: '2024-01-13T16:45:00Z',
    receiptNumber: 'MOB-2024-003456'
  },
  {
    id: '5',
    vehicleId: '5',
    driverId: '5',
    amount: 41.0,
    cost: 141.45,
    pricePerUnit: 3.45,
    fuelType: 'diesel',
    location: 'Love\'s Travel Stop',
    odometer: 112567,
    createdAt: '2024-01-13T11:20:00Z',
    receiptNumber: 'LOV-2024-007890'
  }
];

// Mock tasks data
const mockTasks = [
  {
    id: '1',
    title: 'Complete vehicle inspection for Bus #101',
    description: 'Monthly safety inspection including brakes, lights, and tire condition',
    status: 'open',
    priority: 'high',
    assignedTo: 'John Smith',
    dueDate: '2024-01-16T17:00:00Z',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z'
  },
  {
    id: '2',
    title: 'Review driver training records',
    description: 'Ensure all drivers have completed annual safety training',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'Sarah Johnson',
    dueDate: '2024-01-18T17:00:00Z',
    createdAt: '2024-01-13T10:00:00Z',
    updatedAt: '2024-01-15T08:30:00Z'
  },
  {
    id: '3',
    title: 'Schedule oil change for Fleet Vehicle #205',
    description: 'Vehicle approaching 5000 mile service interval',
    status: 'completed',
    priority: 'low',
    assignedTo: 'Mike Davis',
    dueDate: '2024-01-14T17:00:00Z',
    completedAt: '2024-01-14T15:00:00Z',
    createdAt: '2024-01-10T14:00:00Z',
    updatedAt: '2024-01-14T15:00:00Z'
  },
  {
    id: '4',
    title: 'Update route optimization parameters',
    description: 'Adjust routing algorithm for new construction zones',
    status: 'overdue',
    priority: 'critical',
    assignedTo: 'Emily Chen',
    dueDate: '2024-01-12T17:00:00Z',
    createdAt: '2024-01-08T11:00:00Z',
    updatedAt: '2024-01-12T17:00:00Z'
  },
  {
    id: '5',
    title: 'Process fuel expense reports',
    description: 'Monthly fuel expense reconciliation for accounting',
    status: 'open',
    priority: 'medium',
    assignedTo: 'Tom Wilson',
    dueDate: '2024-01-20T17:00:00Z',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  }
];

// Routes endpoint - returns array directly for Zod validation
app.get('/api/routes', (req, res) => {
  res.json(mockRoutes);
});

// Fuel transactions endpoint - returns array directly for Zod validation
app.get('/api/fuel-transactions', (req, res) => {
  res.json(mockFuelTransactions);
});

// Tasks endpoint - returns array directly for Zod validation
app.get('/api/tasks', (req, res) => {
  res.json(mockTasks);
});

// ============================================================================
// Drivers API - Assignments and Performance Trend
// These endpoints return arrays directly for Zod validation
// ============================================================================

// Mock assignments data
const mockAssignments = [
  {
    id: '1',
    driverId: '1',
    vehicleId: '1',
    startDate: '2024-01-01T08:00:00Z',
    endDate: '2024-01-15T17:00:00Z',
    status: 'completed'
  },
  {
    id: '2',
    driverId: '2',
    vehicleId: '2',
    startDate: '2024-01-10T08:00:00Z',
    status: 'active'
  },
  {
    id: '3',
    driverId: '3',
    vehicleId: '3',
    startDate: '2024-01-12T08:00:00Z',
    status: 'active'
  },
  {
    id: '4',
    driverId: '4',
    vehicleId: '4',
    startDate: '2024-01-20T08:00:00Z',
    status: 'pending'
  },
  {
    id: '5',
    driverId: '5',
    vehicleId: '5',
    startDate: '2024-01-05T08:00:00Z',
    endDate: '2024-01-18T17:00:00Z',
    status: 'completed'
  }
];

// Mock performance trend data (last 7 days)
const mockPerformanceTrend = [
  { date: '2024-01-09T00:00:00Z', avgScore: 82, violations: 3 },
  { date: '2024-01-10T00:00:00Z', avgScore: 85, violations: 2 },
  { date: '2024-01-11T00:00:00Z', avgScore: 84, violations: 4 },
  { date: '2024-01-12T00:00:00Z', avgScore: 86, violations: 1 },
  { date: '2024-01-13T00:00:00Z', avgScore: 88, violations: 2 },
  { date: '2024-01-14T00:00:00Z', avgScore: 87, violations: 3 },
  { date: '2024-01-15T00:00:00Z', avgScore: 89, violations: 1 }
];

// Assignments endpoint - returns array directly for Zod validation
app.get('/api/assignments', (req, res) => {
  res.json(mockAssignments);
});

// Performance trend endpoint - returns array directly for Zod validation
app.get('/api/performance-trend', (req, res) => {
  res.json(mockPerformanceTrend);
});

app.get('/api/alerts/notifications', (req, res) => {
  res.json({ data: [], total: 0, unread: 0, message: 'Alerts notifications endpoint - placeholder' });
});

app.get('/api/traffic-cameras/sources', (req, res) => {
  res.json({ data: [], total: 0, message: 'Traffic cameras endpoint - placeholder' });
});

// ============================================================================
// Documents API - Mock data for document management
// ============================================================================
const mockDocuments = [
  {
    id: '1',
    title: 'Vehicle Maintenance Manual',
    description: 'Comprehensive maintenance guide for fleet vehicles',
    filename: 'maintenance-manual-2024.pdf',
    originalFilename: 'Vehicle_Maintenance_Manual_2024.pdf',
    mimeType: 'application/pdf',
    fileSize: 2456000,
    category: 'maintenance',
    subcategory: 'manuals',
    tags: ['maintenance', 'manual', 'vehicles'],
    status: 'published',
    accessLevel: 'internal',
    ownerName: 'Fleet Operations',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-06-20T14:45:00Z',
    downloadCount: 156,
    aiGeneratedSummary: 'Complete maintenance procedures for all fleet vehicles.'
  },
  {
    id: '2',
    title: 'Driver Safety Training Guide',
    description: 'Safety protocols and training materials for drivers',
    filename: 'safety-training-guide.pdf',
    originalFilename: 'Driver_Safety_Training_2024.pdf',
    mimeType: 'application/pdf',
    fileSize: 1850000,
    category: 'safety',
    subcategory: 'training',
    tags: ['safety', 'training', 'drivers'],
    status: 'published',
    accessLevel: 'public',
    ownerName: 'Safety Department',
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-07-15T11:20:00Z',
    downloadCount: 243,
    aiGeneratedSummary: 'Essential safety guidelines and training for all drivers.'
  },
  {
    id: '3',
    title: 'Compliance Checklist 2024',
    description: 'Annual compliance requirements checklist',
    filename: 'compliance-checklist-2024.xlsx',
    originalFilename: 'Compliance_Checklist_2024.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 456000,
    category: 'compliance',
    subcategory: 'checklists',
    tags: ['compliance', 'checklist', 'annual'],
    status: 'published',
    accessLevel: 'internal',
    ownerName: 'Compliance Team',
    createdAt: '2024-01-02T08:00:00Z',
    updatedAt: '2024-08-01T16:30:00Z',
    downloadCount: 89,
    aiGeneratedSummary: 'Complete checklist for annual fleet compliance requirements.'
  },
  {
    id: '4',
    title: 'Fleet Insurance Policy',
    description: 'Current fleet insurance policy documents',
    filename: 'fleet-insurance-2024.pdf',
    originalFilename: 'Fleet_Insurance_Policy_2024.pdf',
    mimeType: 'application/pdf',
    fileSize: 3200000,
    category: 'legal',
    subcategory: 'insurance',
    tags: ['insurance', 'legal', 'policy'],
    status: 'published',
    accessLevel: 'confidential',
    ownerName: 'Legal Department',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-05-10T09:15:00Z',
    downloadCount: 34,
    aiGeneratedSummary: 'Comprehensive insurance coverage for the entire fleet.'
  },
  {
    id: '5',
    title: 'Fuel Efficiency Report Q2',
    description: 'Quarterly fuel efficiency analysis report',
    filename: 'fuel-report-q2-2024.pdf',
    originalFilename: 'Fuel_Efficiency_Report_Q2_2024.pdf',
    mimeType: 'application/pdf',
    fileSize: 1200000,
    category: 'reports',
    subcategory: 'fuel',
    tags: ['fuel', 'efficiency', 'quarterly', 'report'],
    status: 'published',
    accessLevel: 'internal',
    ownerName: 'Analytics Team',
    createdAt: '2024-07-05T10:00:00Z',
    updatedAt: '2024-07-05T10:00:00Z',
    downloadCount: 67,
    aiGeneratedSummary: 'Analysis of fleet fuel consumption and efficiency metrics for Q2.'
  },
  {
    id: '6',
    title: 'Vehicle Inspection Form',
    description: 'Standard vehicle inspection form template',
    filename: 'inspection-form.docx',
    originalFilename: 'Vehicle_Inspection_Form.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 85000,
    category: 'forms',
    subcategory: 'inspection',
    tags: ['inspection', 'form', 'template'],
    status: 'published',
    accessLevel: 'public',
    ownerName: 'Operations',
    createdAt: '2024-03-12T11:30:00Z',
    updatedAt: '2024-06-01T08:45:00Z',
    downloadCount: 312,
    aiGeneratedSummary: 'Standard template for conducting vehicle inspections.'
  },
  {
    id: '7',
    title: 'Emergency Procedures Guide',
    description: 'Emergency response procedures for fleet operations',
    filename: 'emergency-procedures.pdf',
    originalFilename: 'Emergency_Procedures_Guide.pdf',
    mimeType: 'application/pdf',
    fileSize: 980000,
    category: 'safety',
    subcategory: 'emergency',
    tags: ['emergency', 'safety', 'procedures'],
    status: 'published',
    accessLevel: 'public',
    ownerName: 'Safety Department',
    createdAt: '2024-04-08T13:00:00Z',
    updatedAt: '2024-09-15T10:20:00Z',
    downloadCount: 178,
    aiGeneratedSummary: 'Step-by-step emergency response procedures for all situations.'
  },
  {
    id: '8',
    title: 'New Driver Onboarding Packet',
    description: 'Complete onboarding materials for new drivers',
    filename: 'onboarding-packet.zip',
    originalFilename: 'New_Driver_Onboarding_Packet.zip',
    mimeType: 'application/zip',
    fileSize: 5600000,
    category: 'hr',
    subcategory: 'onboarding',
    tags: ['onboarding', 'hr', 'new-hire', 'drivers'],
    status: 'pending-review',
    accessLevel: 'internal',
    ownerName: 'HR Department',
    createdAt: '2024-10-01T09:00:00Z',
    updatedAt: '2024-10-01T09:00:00Z',
    downloadCount: 12,
    aiGeneratedSummary: 'Complete packet of documents for new driver orientation.'
  },
  {
    id: '9',
    title: 'Route Optimization Guidelines',
    description: 'Best practices for route optimization',
    filename: 'route-optimization.pdf',
    originalFilename: 'Route_Optimization_Guidelines.pdf',
    mimeType: 'application/pdf',
    fileSize: 1450000,
    category: 'operations',
    subcategory: 'routing',
    tags: ['routing', 'optimization', 'efficiency'],
    status: 'published',
    accessLevel: 'internal',
    ownerName: 'Operations',
    createdAt: '2024-05-22T15:30:00Z',
    updatedAt: '2024-08-12T14:00:00Z',
    downloadCount: 95,
    aiGeneratedSummary: 'Guidelines for optimizing delivery routes and reducing costs.'
  },
  {
    id: '10',
    title: 'Annual Fleet Report 2023',
    description: 'Comprehensive annual fleet performance report',
    filename: 'annual-report-2023.pdf',
    originalFilename: 'Annual_Fleet_Report_2023.pdf',
    mimeType: 'application/pdf',
    fileSize: 8900000,
    category: 'reports',
    subcategory: 'annual',
    tags: ['annual', 'report', 'performance', '2023'],
    status: 'archived',
    accessLevel: 'internal',
    ownerName: 'Executive Team',
    createdAt: '2024-01-31T17:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
    downloadCount: 203,
    aiGeneratedSummary: 'Complete analysis of fleet performance for fiscal year 2023.'
  }
];

// Documents search endpoint
app.post('/api/documents/search', (req, res) => {
  const { pagination = { page: 1, limit: 100 }, sort = { field: 'updatedAt', order: 'desc' }, filters = {} } = req.body;

  let filteredDocs = [...mockDocuments];

  // Apply filters if provided
  if (filters.category) {
    filteredDocs = filteredDocs.filter(doc => doc.category === filters.category);
  }
  if (filters.status) {
    filteredDocs = filteredDocs.filter(doc => doc.status === filters.status);
  }
  if (filters.accessLevel) {
    filteredDocs = filteredDocs.filter(doc => doc.accessLevel === filters.accessLevel);
  }
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredDocs = filteredDocs.filter(doc =>
      doc.title.toLowerCase().includes(searchLower) ||
      doc.description?.toLowerCase().includes(searchLower) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Apply sorting
  filteredDocs.sort((a, b) => {
    const aVal = a[sort.field];
    const bVal = b[sort.field];
    const order = sort.order === 'asc' ? 1 : -1;
    if (aVal < bVal) return -1 * order;
    if (aVal > bVal) return 1 * order;
    return 0;
  });

  // Apply pagination
  const startIndex = (pagination.page - 1) * pagination.limit;
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + pagination.limit);

  res.json({
    data: {
      documents: paginatedDocs,
      total: filteredDocs.length,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(filteredDocs.length / pagination.limit)
    }
  });
});

// Documents analytics endpoint
app.get('/api/documents/analytics', (req, res) => {
  const totalDocuments = mockDocuments.length;
  const totalStorage = mockDocuments.reduce((sum, doc) => sum + doc.fileSize, 0);
  const totalDownloads = mockDocuments.reduce((sum, doc) => sum + doc.downloadCount, 0);

  const statusCounts = mockDocuments.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {});

  const categoryCounts = mockDocuments.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {});

  const accessLevelCounts = mockDocuments.reduce((acc, doc) => {
    acc[doc.accessLevel] = (acc[doc.accessLevel] || 0) + 1;
    return acc;
  }, {});

  res.json({
    data: {
      analytics: {
        totalDocuments,
        totalStorage,
        totalDownloads,
        averageFileSize: Math.round(totalStorage / totalDocuments),
        statusDistribution: statusCounts,
        categoryDistribution: categoryCounts,
        accessLevelDistribution: accessLevelCounts,
        recentUploads: mockDocuments.filter(doc => {
          const uploadDate = new Date(doc.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return uploadDate >= thirtyDaysAgo;
        }).length,
        topCategories: Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }))
      }
    }
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const vehicleCount = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    const driverCount = await pool.query('SELECT COUNT(*) as count FROM drivers');
    const activeVehicles = await pool.query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'");
    const activeDrivers = await pool.query("SELECT COUNT(*) as count FROM drivers WHERE status = 'active'");
    res.json({
      vehicles: { total: parseInt(vehicleCount.rows[0].count), active: parseInt(activeVehicles.rows[0].count) },
      drivers: { total: parseInt(driverCount.rows[0].count), active: parseInt(activeDrivers.rows[0].count) },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// ============================================================================
// Root API endpoint
// ============================================================================
app.get('/api', (req, res) => {
  res.json({
    name: 'Fleet Management API',
    version: '2.0.1',
    status: 'running',
    features: {
      googleMaps: true,
      realTimeTracking: true,
      grokAI: true
    },
    endpoints: {
      health: '/api/health',
      vehicles: '/api/v1/vehicles',
      drivers: '/api/v1/drivers',
      stats: '/api/v1/stats'
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Fleet Management API',
    version: '2.0.1',
    status: 'operational',
    endpoints: ['/api', '/health', '/api/health', '/api/v1/vehicles', '/api/v1/drivers', '/api/v1/stats']
  });
});

// ============================================================================
// OBD2 Emulator API
// ============================================================================

// Generate random OBD2 data based on profile and scenario
function generateOBD2Data(sessionId, vehicleId, profile, scenario) {
  const baseData = {
    timestamp: new Date().toISOString(),
    sessionId,
    vehicleId,
    adapterId: 1,
  };

  // Profile-based characteristics
  const profiles = {
    sedan: { maxRpm: 6500, maxSpeed: 140, fuelEfficiency: 32 },
    truck: { maxRpm: 5000, maxSpeed: 90, fuelEfficiency: 18 },
    electric: { maxRpm: 0, maxSpeed: 130, fuelEfficiency: 100 },
    diesel: { maxRpm: 4500, maxSpeed: 120, fuelEfficiency: 28 },
    sports: { maxRpm: 8000, maxSpeed: 180, fuelEfficiency: 22 }
  };

  // Scenario-based behavior
  const scenarios = {
    idle: { speedRange: [0, 5], rpmRange: [700, 900], throttle: [0, 10] },
    city: { speedRange: [0, 45], rpmRange: [1000, 3500], throttle: [5, 60] },
    highway: { speedRange: [55, 80], rpmRange: [2000, 3500], throttle: [20, 50] },
    aggressive: { speedRange: [30, 100], rpmRange: [3000, 6500], throttle: [40, 100] }
  };

  const profileConfig = profiles[profile] || profiles.sedan;
  const scenarioConfig = scenarios[scenario] || scenarios.city;

  const randomInRange = (min, max) => Math.random() * (max - min) + min;

  const speed = randomInRange(...scenarioConfig.speedRange);
  const rpm = profile === 'electric' ? 0 : randomInRange(...scenarioConfig.rpmRange);
  const throttle = randomInRange(...scenarioConfig.throttle);

  return {
    ...baseData,
    engineRpm: Math.round(rpm),
    vehicleSpeed: Math.round(speed),
    throttlePosition: Math.round(throttle),
    engineLoad: Math.round(randomInRange(10, 85)),
    engineCoolantTemp: Math.round(randomInRange(85, 105)),
    intakeAirTemp: Math.round(randomInRange(20, 45)),
    fuelLevel: Math.round(randomInRange(25, 95)),
    batteryVoltage: parseFloat(randomInRange(12.2, 14.5).toFixed(1)),
    estimatedMpg: parseFloat(randomInRange(profileConfig.fuelEfficiency * 0.7, profileConfig.fuelEfficiency * 1.2).toFixed(1)),
    distanceTraveled: parseFloat(randomInRange(0, 500).toFixed(1)),
    tripTime: Math.round(randomInRange(0, 480)),
    location: {
      latitude: 41.8781 + (Math.random() - 0.5) * 0.1,
      longitude: -87.6298 + (Math.random() - 0.5) * 0.1,
      speed: Math.round(speed),
      heading: Math.round(randomInRange(0, 360))
    }
  };
}

// Generate unique session ID
function generateSessionId() {
  return 'obd2-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Start OBD2 emulator
app.post('/api/obd2-emulator/start', (req, res) => {
  const { vehicleId = 1, profile = 'sedan', scenario = 'city', updateIntervalMs = 1000 } = req.body;

  const sessionId = generateSessionId();

  const session = {
    sessionId,
    vehicleId,
    profile,
    scenario,
    updateIntervalMs,
    startedAt: new Date(),
    isRunning: true,
    dataPointsGenerated: 0,
    interval: null
  };

  emulatorSessions.set(sessionId, session);

  console.log(`🚗 OBD2 Emulator started: ${sessionId} (Vehicle ${vehicleId}, ${profile}, ${scenario})`);

  res.json({
    success: true,
    sessionId,
    vehicleId,
    profile,
    scenario,
    wsUrl: `/ws/obd2/${sessionId}`,
    message: 'OBD2 emulator started. Connect via WebSocket to receive data.'
  });
});

// Stop OBD2 emulator
app.post('/api/obd2-emulator/stop/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  const session = emulatorSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  if (session.interval) {
    clearInterval(session.interval);
  }
  session.isRunning = false;

  // Close WebSocket connections for this session
  const clients = wsClients.get(sessionId) || [];
  clients.forEach(ws => {
    ws.send(JSON.stringify({ type: 'session_ended', sessionId }));
    ws.close();
  });
  wsClients.delete(sessionId);

  console.log(`🛑 OBD2 Emulator stopped: ${sessionId}`);

  res.json({
    success: true,
    sessionId,
    dataPointsGenerated: session.dataPointsGenerated,
    duration: Date.now() - session.startedAt.getTime()
  });
});

// Get emulator status
app.get('/api/obd2-emulator/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  const session = emulatorSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  res.json({
    success: true,
    data: {
      sessionId: session.sessionId,
      vehicleId: session.vehicleId,
      profile: session.profile,
      scenario: session.scenario,
      isRunning: session.isRunning,
      startedAt: session.startedAt,
      dataPointsGenerated: session.dataPointsGenerated,
      connectedClients: (wsClients.get(sessionId) || []).length
    }
  });
});

// List all emulator sessions
app.get('/api/obd2-emulator/sessions', (req, res) => {
  const sessions = [];
  emulatorSessions.forEach((session, id) => {
    sessions.push({
      sessionId: id,
      vehicleId: session.vehicleId,
      profile: session.profile,
      scenario: session.scenario,
      isRunning: session.isRunning,
      startedAt: session.startedAt,
      dataPointsGenerated: session.dataPointsGenerated
    });
  });

  res.json({ success: true, data: sessions });
});

// ============================================================================
// General Emulator Status Endpoints (for EmulatorDashboard)
// ============================================================================

app.get('/api/emulator/status', (req, res) => {
  let activeEmulators = 0;
  let pausedEmulators = 0;
  let stoppedEmulators = 0;
  let totalDataPoints = 0;

  emulatorSessions.forEach(session => {
    totalDataPoints += session.dataPointsGenerated;
    if (session.isRunning) {
      activeEmulators++;
    } else {
      stoppedEmulators++;
    }
  });

  res.json({
    success: true,
    data: {
      activeEmulators,
      pausedEmulators,
      stoppedEmulators,
      errors: 0,
      totalDataPoints,
      vehicles: Array.from(emulatorSessions.values()).map(s => s.vehicleId)
    }
  });
});

app.post('/api/emulator/start', (req, res) => {
  const { count = 5 } = req.body;
  const started = [];

  for (let i = 1; i <= count; i++) {
    const sessionId = generateSessionId();
    const profiles = ['sedan', 'truck', 'diesel', 'sports'];
    const scenarios = ['city', 'highway', 'idle'];

    const session = {
      sessionId,
      vehicleId: i,
      profile: profiles[i % profiles.length],
      scenario: scenarios[i % scenarios.length],
      updateIntervalMs: 1000,
      startedAt: new Date(),
      isRunning: true,
      dataPointsGenerated: 0,
      interval: null
    };

    emulatorSessions.set(sessionId, session);
    started.push(sessionId);
  }

  console.log(`🚀 Started ${count} emulators`);
  res.json({ success: true, data: { started, count: started.length } });
});

app.post('/api/emulator/stop', (req, res) => {
  const stopped = [];

  emulatorSessions.forEach((session, sessionId) => {
    if (session.interval) {
      clearInterval(session.interval);
    }
    session.isRunning = false;
    stopped.push(sessionId);
  });

  console.log(`🛑 Stopped all emulators`);
  res.json({ success: true, data: { stopped, count: stopped.length } });
});

// Video emulator endpoints (mock)
app.get('/api/emulator/video/status', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/emulator/video/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      dashcamCount: 10,
      dashcamsRunning: 0,
      telematicsRunning: false,
      totalVideoFiles: 0,
      totalStorageGB: 0,
      mobileUploadsCount: 0,
      eventsTriggered: 0
    }
  });
});

app.post('/api/emulator/video/telematics/start', (req, res) => {
  res.json({ success: true, message: 'Video telematics started (mock)' });
});

app.post('/api/emulator/video/stop-all', (req, res) => {
  res.json({ success: true, message: 'All video emulators stopped (mock)' });
});

app.post('/api/emulator/video/dashcam/:vehicleId/start', (req, res) => {
  res.json({ success: true, message: `Dashcam started for vehicle ${req.params.vehicleId} (mock)` });
});

app.post('/api/emulator/video/dashcam/:vehicleId/stop', (req, res) => {
  res.json({ success: true, message: `Dashcam stopped for vehicle ${req.params.vehicleId} (mock)` });
});

app.post('/api/emulator/video/dashcam/:vehicleId/event', (req, res) => {
  res.json({ success: true, message: `Event triggered for vehicle ${req.params.vehicleId} (mock)` });
});

// ============================================================================
// WebSocket Connection Handling
// ============================================================================

wss.on('connection', (ws, req) => {
  const url = req.url;
  console.log(`🔌 WebSocket connected: ${url}`);

  // Parse session ID from URL (e.g., /ws/obd2/session-id)
  const obd2Match = url.match(/\/ws\/obd2\/(.+)/);

  if (obd2Match) {
    const sessionId = obd2Match[1];
    const session = emulatorSessions.get(sessionId);

    if (!session) {
      ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
      ws.close();
      return;
    }

    // Track this client
    if (!wsClients.has(sessionId)) {
      wsClients.set(sessionId, []);
    }
    wsClients.get(sessionId).push(ws);

    // Send initial connection success
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      message: 'Connected to OBD2 emulator stream'
    }));

    // Start sending data if not already
    if (!session.interval && session.isRunning) {
      session.interval = setInterval(() => {
        if (!session.isRunning) {
          clearInterval(session.interval);
          return;
        }

        const data = generateOBD2Data(
          session.sessionId,
          session.vehicleId,
          session.profile,
          session.scenario
        );

        session.dataPointsGenerated++;

        const clients = wsClients.get(sessionId) || [];
        const message = JSON.stringify({ type: 'obd2_data', data });

        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }, session.updateIntervalMs);
    }

    ws.on('close', () => {
      console.log(`🔌 WebSocket disconnected: ${sessionId}`);
      const clients = wsClients.get(sessionId) || [];
      const index = clients.indexOf(ws);
      if (index > -1) {
        clients.splice(index, 1);
      }
    });
  } else {
    // General WebSocket connection
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Fleet API WebSocket' }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📨 WebSocket message:', data);

        // Echo back for testing
        ws.send(JSON.stringify({ type: 'echo', data }));
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });
  }

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url,
    method: req.method,
    availableEndpoints: ['/api', '/health', '/api/health', '/api/v1/vehicles', '/api/v1/drivers', '/api/v1/stats']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server (use HTTP server for WebSocket support)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ========================================`);
  console.log(`   FleetOps API Server v2.0.1 Started`);
  console.log(`   Connected to PostgreSQL`);
  console.log(`   Google Maps Integration: ENABLED`);
  console.log(`   WebSocket Support: ENABLED`);
  console.log(`========================================`);
  console.log(``);
  console.log(`✅ API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🚚 Vehicles: http://localhost:${PORT}/api/v1/vehicles`);
  console.log(`👤 Drivers: http://localhost:${PORT}/api/v1/drivers`);
  console.log(`📈 Stats: http://localhost:${PORT}/api/v1/stats`);
  console.log(`🚗 OBD2 Emulator: http://localhost:${PORT}/api/obd2-emulator/start`);
  console.log(``);
  console.log(`Database host: ${process.env.DB_HOST || 'fleet-postgres-service'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
