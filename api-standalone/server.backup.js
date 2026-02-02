const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as db_time, version() as db_version');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: result.rows[0].db_time,
      dbVersion: result.rows[0].db_version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Vehicles endpoint
app.get('/api/v1/vehicles', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      'SELECT id, vin, make, model, year, license_plate, status, mileage, created_at FROM vehicles ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM vehicles');

    res.json({
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

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Vehicle fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle',
      details: error.message
    });
  }
});

// Drivers endpoint
app.get('/api/v1/drivers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      'SELECT id, first_name, last_name, email, phone, license_number, status, created_at FROM drivers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM drivers');

    res.json({
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

// Database stats endpoint
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

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Fleet Management API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      vehicles: '/api/v1/vehicles',
      drivers: '/api/v1/drivers',
      stats: '/api/v1/stats'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.url,
    method: req.method
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Fleet API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
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
