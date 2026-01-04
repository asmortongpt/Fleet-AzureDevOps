/**
 * Simple Express Server - Fleet Management API
 * Basic server to get started quickly
 */

import cors from 'cors';
import { eq } from 'drizzle-orm';
import express from 'express';
import helmet from 'helmet';

import { db, checkDatabaseConnection } from './db/connection';
import { schema } from './schemas/production.schema';


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://20.161.96.87',
    'https://fleet.capitaltechalliance.com'
  ],
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
      .orderBy(schema.vehicles.number)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    // Transform coordinates to numbers and create location object for Google Maps compatibility
    const transformedVehicles = vehicles.map(v => ({
      ...v,
      latitude: v.latitude ? parseFloat(v.latitude as any) : null,
      longitude: v.longitude ? parseFloat(v.longitude as any) : null,
      location: {
        lat: v.latitude ? parseFloat(v.latitude as any) : 0,
        lng: v.longitude ? parseFloat(v.longitude as any) : 0,
        latitude: v.latitude ? parseFloat(v.latitude as any) : 0,
        longitude: v.longitude ? parseFloat(v.longitude as any) : 0,
        address: v.locationAddress || ''
      }
    }));

    res.json({
      data: transformedVehicles,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: transformedVehicles.length,
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
      .orderBy(schema.drivers.createdAt)
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

// GPS
app.get('/api/gps', async (req, res) => {
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
    console.error('Error fetching GPS data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Geofences
app.get('/api/geofences', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const geofences = await db
      .select()
      .from(schema.geofences)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: geofences,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: geofences.length,
      },
    });
  } catch (error) {
    console.error('Error fetching geofences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Maintenance Records (Work Orders)
app.get('/api/maintenance-records', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const records = await db
      .select()
      .from(schema.workOrders)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: records,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: records.length,
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Maintenance Schedules
app.get('/api/maintenance-schedules', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const schedules = await db
      .select()
      .from(schema.maintenanceSchedules)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: schedules,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: schedules.length,
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Parts
app.get('/api/parts', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const parts = await db
      .select()
      .from(schema.partsInventory)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: parts,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: parts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const vendors = await db
      .select()
      .from(schema.vendors)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: vendors,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: vendors.length,
      },
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const invoices = await db
      .select()
      .from(schema.invoices)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: invoices,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: invoices.length,
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const orders = await db
      .select()
      .from(schema.purchaseOrders)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: orders,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: orders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tasks = await db
      .select()
      .from(schema.tasks)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: tasks,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: tasks.length,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Costs (using invoices table)
app.get('/api/costs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const costs = await db
      .select()
      .from(schema.invoices)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: costs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: costs.length,
      },
    });
  } catch (error) {
    console.error('Error fetching costs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// EV Chargers
app.get('/api/ev/chargers', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const chargers = await db
      .select()
      .from(schema.chargingStations)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: chargers,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: chargers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching EV chargers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Damage endpoint (placeholder - requires implementation)
app.get('/api/damage', async (req, res) => {
  try {
    // Placeholder - damage data would need a dedicated table
    res.json({
      data: [],
      meta: {
        total: 0,
        message: 'Damage tracking endpoint - requires database schema',
      },
    });
  } catch (error) {
    console.error('Error fetching damage data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Config endpoint
app.get('/api/config', async (req, res) => {
  try {
    // Return basic configuration
    res.json({
      data: {
        apiVersion: '1.0.0',
        features: {
          gps: true,
          maintenance: true,
          fuel: true,
          ev: true,
        },
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Feature Flags endpoint
app.get('/api/feature-flags', async (req, res) => {
  try {
    // Return feature flags
    res.json({
      data: {
        enableGPS: true,
        enableMaintenance: true,
        enableFuel: true,
        enableEV: true,
        enableDamageTracking: false,
        enableAuth: false,
      },
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth Me endpoint (placeholder)
app.get('/api/auth/me', async (req, res) => {
  try {
    // Placeholder - authentication requires implementation
    res.status(401).json({
      error: 'Authentication not configured',
      message: 'This endpoint requires authentication setup',
    });
  } catch (error) {
    console.error('Error in auth endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  try {
    // Check database connection (skip if using mock data)
    const useMockData = process.env.USE_MOCK_DATA === 'true';

    if (!useMockData) {
      const dbHealthy = await checkDatabaseConnection();
      if (!dbHealthy) {
        console.error('❌ Database connection failed. Please check your DATABASE_URL in .env');
        process.exit(1);
      }
      console.log('✅ Database connection successful');
    } else {
      console.log('⚠️  Running in MOCK DATA mode - Database connection skipped');
    }

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
      console.log('   GET  /api/maintenance-records');
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
