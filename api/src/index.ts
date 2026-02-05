import express from 'express';
import pg from 'pg';

// This file is a legacy/experimental entrypoint and is not part of the supported server runtime.
// Prevent accidental deployment by requiring explicit opt-in in *all* environments.
if (process.env.ENABLE_LEGACY_API !== 'true') {
  console.error('Legacy API entrypoint disabled. Set ENABLE_LEGACY_API=true to run.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'fleet-postgres-service',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'fleet_db',
  user: process.env.DB_USER || 'fleet_user',
  password: process.env.DB_PASSWORD || 'fleet_password',
});

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: result.rows[0].now
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Vehicles endpoint
app.get('/api/v1/vehicles', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, vin, make, model, year, status FROM vehicles LIMIT 100');
    res.json({
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch vehicles',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Fleet API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    process.exit(0);
  });
});
