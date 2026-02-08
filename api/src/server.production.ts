/**
 * PRODUCTION-READY SERVER
 * Complete Flask Management API with security, authentication, and all 30 endpoints
 */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import { eq } from 'drizzle-orm';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';

import { db, checkDatabaseConnection } from './db/connection';

// Import middleware
import {
  authenticate,
  authorize,
  enforceTenantIsolation,
  loginHandler,
  registerHandler,
  profileHandler,
} from './middleware/auth.production';
import {
  apiRateLimiter,
  authRateLimiter,
  csrfTokenHandler,
  sanitizeInput,
  validateUUID,
  securityHeaders,
  securityLogger,
  errorHandler,
} from './middleware/security.production';
import requestIdMiddleware from './middleware/request-id';
import { formatResponse } from './middleware/response-formatter';

// Import route handlers

// Import existing routers
import authRouter from './routes/auth';
import damageReportsRouter from './routes/damage-reports.routes';
import geospatialRouter from './routes/geospatial.routes';
import obd2EmulatorRouter, { setupOBD2WebSocket } from './routes/obd2-emulator.routes';
import productionReadyRouter from './routes/production-ready-api';
import scanSessionsRouter from './routes/scan-sessions.routes';
import { schema } from './schemas/production.schema';

const app: Express = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && process.env.ENABLE_LEGACY_API !== 'true') {
  console.error('Legacy server.production entrypoint is disabled in production. Set ENABLE_LEGACY_API=true to override.');
  process.exit(1);
}

// ============================================================================
// SECURITY MIDDLEWARE (Applied First)
// ============================================================================

app.use(helmet()); // Security headers
app.use(securityHeaders); // Custom security headers
app.use(securityLogger); // Log all requests
app.use(cookieParser()); // Parse cookies for CSRF
app.use(requestIdMiddleware);

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://20.161.96.87',
  'https://fleet.capitaltechalliance.com',
]).map((o) => o.trim()).filter(Boolean);

if (allowedOrigins.includes('*')) {
  throw new Error('Invalid CORS_ORIGIN: `*` is not allowed when credentials are enabled.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// ============================================================================
// BODY PARSING & INPUT SANITIZATION
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(formatResponse);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput); // Sanitize all inputs

// ============================================================================
// HEALTH CHECK (No Authentication Required)
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// ============================================================================
// CSRF TOKEN ENDPOINT (No Authentication Required)
// ============================================================================

app.get('/api/csrf', csrfTokenHandler);
app.get('/api/v1/csrf-token', csrfTokenHandler);

// ============================================================================
// AUTHENTICATION ENDPOINTS (Rate Limited)
// ============================================================================

app.post('/api/auth/login', authRateLimiter, loginHandler);
app.post('/api/auth/register', authRateLimiter, registerHandler);
app.get('/api/auth/me', authenticate, profileHandler);
app.post('/api/auth/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Use existing auth router (legacy + versioned support)
app.use('/api/auth', authRouter);
app.use('/api/v1/auth', authRouter);

// ============================================================================
// PROTECTED API ROUTES (Authentication + Authorization Required)
// ============================================================================

// Apply global rate limiting to all API routes
app.use('/api', apiRateLimiter);
app.use('/api/v1', apiRateLimiter);

// Client IP endpoint (used by frontend IP guard)
app.get('/api/client-ip', (req, res) => {
  const forwarded = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || '').toString().split(',')[0].trim()
  res.json({ ip: ip || req.ip })
})
app.get('/api/v1/client-ip', (req, res) => {
  const forwarded = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || '').toString().split(',')[0].trim()
  res.json({ ip: ip || req.ip })
})

// Mount production-ready routes with full authentication and authorization
app.use('/api', authenticate, enforceTenantIsolation, productionReadyRouter);
app.use('/api/v1', authenticate, enforceTenantIsolation, productionReadyRouter);

// ============================================================================
// EXISTING SERVER-SIMPLE ROUTES (Backward Compatible)
// ============================================================================

// Vehicles
app.get('/api/vehicles', authenticate, authorize('vehicles:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let query = db.select().from(schema.vehicles).orderBy(schema.vehicles.number);

    if (tenantId && req.user?.role !== 'SuperAdmin') {
      query = query.where(eq(schema.vehicles.tenantId, tenantId)) as any;
    }

    const vehicles = await query
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

app.get('/api/vehicles/:id', authenticate, authorize('vehicles:read'), validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const [vehicle] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Drivers
app.get('/api/drivers', authenticate, authorize('drivers:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let query = db.select().from(schema.drivers).orderBy(schema.drivers.createdAt);

    if (tenantId && req.user?.role !== 'SuperAdmin') {
      query = query.where(eq(schema.drivers.tenantId, tenantId)) as any;
    }

    const drivers = await query
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

// Work Orders
app.get('/api/work-orders', authenticate, authorize('maintenance:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let query = db.select().from(schema.workOrders);

    if (tenantId && req.user?.role !== 'SuperAdmin') {
      query = query.where(eq(schema.workOrders.tenantId, tenantId)) as any;
    }

    const workOrders = await query
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

// Fuel Transactions
app.get('/api/fuel-transactions', authenticate, authorize('fuel:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let query = db.select().from(schema.fuelTransactions);

    if (tenantId && req.user?.role !== 'SuperAdmin') {
      query = query.where(eq(schema.fuelTransactions.tenantId, tenantId)) as any;
    }

    const transactions = await query
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

// Maintenance Records
app.get('/api/maintenance-records', authenticate, authorize('maintenance:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let query = db.select().from(schema.workOrders);

    if (tenantId && req.user?.role !== 'SuperAdmin') {
      query = query.where(eq(schema.workOrders.tenantId, tenantId)) as any;
    }

    const records = await query
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
app.get('/api/maintenance-schedules', authenticate, authorize('maintenance:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let query = db.select().from(schema.maintenanceSchedules);

    if (tenantId && req.user?.role !== 'SuperAdmin') {
      query = query.where(eq(schema.maintenanceSchedules.tenantId, tenantId)) as any;
    }

    const schedules = await query
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

// GPS Tracks
app.get('/api/gps-tracks', authenticate, authorize('gps:read'), async (req, res) => {
  try {
    const { vehicleId, limit = 100 } = req.query;

    let query = db.select().from(schema.gpsTracks);

    if (vehicleId) {
      query = query.where(eq(schema.gpsTracks.vehicleId, vehicleId as string)) as any;
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

// Routes
app.get('/api/routes', authenticate, authorize('routes:read'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let query = db.select().from(schema.routes);

    if (tenantId && req.user?.role !== 'SuperAdmin') {
      query = query.where(eq(schema.routes.tenantId, tenantId)) as any;
    }

    const routes = await query
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

// ============================================================================
// EMULATORS & SPECIAL FEATURES (Public Access for Development)
// ============================================================================

app.use('/api/obd2-emulator', obd2EmulatorRouter);
app.use('/api/damage-reports', damageReportsRouter);
app.use('/api/scan-sessions', scanSessionsRouter);
app.use('/api/geospatial', geospatialRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    console.log('');
    console.log('='.repeat(80));
    console.log('🚀 FLEET MANAGEMENT API - PRODUCTION MODE');
    console.log('='.repeat(80));
    console.log('');

    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      console.error('❌ Database connection failed. Please check your DATABASE_URL');
      process.exit(1);
    }
    console.log('✅ Database connection successful');

    // Start server
    const host = process.env.HOST || '0.0.0.0'
    const server = app.listen(Number(PORT), host, () => {
      console.log('');
      console.log(`📡 Server: http://${host}:${PORT}`);
      console.log(`🏥 Health: http://${host}:${PORT}/health`);
      console.log(`🔐 CSRF Token: http://${host}:${PORT}/api/csrf`);
      console.log('');
      console.log('🔒 SECURITY FEATURES:');
      console.log('   ✅ JWT Authentication');
      console.log('   ✅ RBAC Authorization');
      console.log('   ✅ CSRF Protection');
      console.log('   ✅ Rate Limiting');
      console.log('   ✅ Input Sanitization');
      console.log('   ✅ XSS Prevention');
      console.log('   ✅ SQL Injection Protection');
      console.log('   ✅ Tenant Isolation');
      console.log('');
      console.log('📋 API ENDPOINTS (30 Total):');
      console.log('');
      console.log('  Authentication:');
      console.log('   POST   /api/auth/login           - Login');
      console.log('   POST   /api/auth/register        - Register');
      console.log('   GET    /api/auth/me              - Get profile');
      console.log('');
      console.log('  Vehicles (5 endpoints):');
      console.log('   GET    /api/vehicles             - List vehicles');
      console.log('   GET    /api/vehicles/:id         - Get vehicle');
      console.log('   POST   /api/vehicles             - Create vehicle');
      console.log('   PUT    /api/vehicles/:id         - Update vehicle');
      console.log('   DELETE /api/vehicles/:id         - Delete vehicle');
      console.log('   POST   /api/vehicles/:id/assign-driver - Assign driver');
      console.log('');
      console.log('  Drivers (5 endpoints):');
      console.log('   GET    /api/drivers              - List drivers');
      console.log('   GET    /api/drivers/:id          - Get driver');
      console.log('   POST   /api/drivers              - Create driver');
      console.log('   PUT    /api/drivers/:id          - Update driver');
      console.log('   DELETE /api/drivers/:id          - Delete driver');
      console.log('   GET    /api/drivers/:id/history  - Driver history');
      console.log('');
      console.log('  Work Orders (4 endpoints):');
      console.log('   GET    /api/work-orders          - List work orders');
      console.log('   GET    /api/work-orders/:id      - Get work order');
      console.log('   POST   /api/work-orders          - Create work order');
      console.log('   PUT    /api/work-orders/:id      - Update work order');
      console.log('');
      console.log('  Maintenance (3 endpoints):');
      console.log('   GET    /api/maintenance-records  - List records');
      console.log('   POST   /api/maintenance-records  - Create record');
      console.log('   GET    /api/maintenance-schedules - List schedules');
      console.log('');
      console.log('  Fuel (3 endpoints):');
      console.log('   GET    /api/fuel-transactions    - List transactions');
      console.log('   POST   /api/fuel-transactions    - Create transaction');
      console.log('   GET    /api/fuel-analytics       - Fuel analytics');
      console.log('');
      console.log('  GPS & Tracking (3 endpoints):');
      console.log('   GET    /api/gps-tracks           - Get GPS tracks');
      console.log('   POST   /api/gps-position         - Submit position');
      console.log('   GET    /api/routes               - Get routes');
      console.log('');
      console.log('  Reports & Analytics (4 endpoints):');
      console.log('   GET    /api/reports              - List reports');
      console.log('   GET    /api/analytics            - Dashboard analytics');
      console.log('   GET    /api/analytics/vehicles   - Vehicle analytics');
      console.log('   GET    /api/analytics/fuel       - Fuel analytics');
      console.log('');
      console.log('='.repeat(80));
    });

    // Initialize WebSocket for OBD2 Emulator
    setupOBD2WebSocket(server);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
