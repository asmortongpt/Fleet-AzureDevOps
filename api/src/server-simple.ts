/**
 * Simple Express Server - Fleet Management API
 * Basic server to get started quickly
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db, checkDatabaseConnection } from './db/connection';
import { schema } from './schemas/production.schema';
import { eq } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

// Basic CRUD routes for vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const vehicles = await db
      .select()
      .from(schema.vehicles)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: vehicles,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: vehicles.length,
      },
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [vehicle] = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Basic CRUD routes for drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const drivers = await db
      .select()
      .from(schema.drivers)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: drivers,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: drivers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Work orders
app.get('/api/work-orders', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const workOrders = await db
      .select()
      .from(schema.workOrders)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: workOrders,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: workOrders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fuel transactions
app.get('/api/fuel-transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const transactions = await db
      .select()
      .from(schema.fuelTransactions)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: transactions,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: transactions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching fuel transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes
app.get('/api/routes', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const routes = await db
      .select()
      .from(schema.routes)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: routes,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: routes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Facilities
app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await db
      .select()
      .from(schema.facilities);

    res.json({
      data: facilities,
      meta: {
        total: facilities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inspections
app.get('/api/inspections', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const inspections = await db
      .select()
      .from(schema.inspections)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: inspections,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: inspections.length,
      },
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const incidents = await db
      .select()
      .from(schema.incidents)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: incidents,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: incidents.length,
      },
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GPS Tracks
app.get('/api/gps-tracks', async (req, res) => {
  try {
    const { vehicleId, limit = 100 } = req.query;
    let query = db.select().from(schema.gpsTracks);

    if (vehicleId) {
      query = query.where(eq(schema.gpsTracks.vehicleId, vehicleId as string));
    }

    const tracks = await query.limit(Number(limit));

    res.json({
      data: tracks,
      meta: {
        total: tracks.length,
      },
    });
  } catch (error) {
    console.error('Error fetching GPS tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      console.error('❌ Database connection failed. Please check your DATABASE_URL in .env');
      process.exit(1);
    }

    console.log('✅ Database connection successful');

    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('🚀 Fleet Management API Server');
      console.log('='.repeat(60));
      console.log('');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📊 Available endpoints:');
      console.log('   GET  /api/vehicles');
      console.log('   GET  /api/drivers');
      console.log('   GET  /api/work-orders');
      console.log('   GET  /api/fuel-transactions');
      console.log('   GET  /api/routes');
      console.log('   GET  /api/facilities');
      console.log('   GET  /api/inspections');
      console.log('   GET  /api/incidents');
      console.log('   GET  /api/gps-tracks');
      console.log('');
      console.log('💡 Tip: Add ?page=1&limit=10 for pagination');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
