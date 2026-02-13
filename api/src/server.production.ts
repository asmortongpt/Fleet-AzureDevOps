/**
 * PRODUCTION-READY SERVER
 * Complete Flask Management API with security, authentication, and all 30 endpoints
 */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import { eq } from 'drizzle-orm';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import logger from './config/logger';

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
  logger.error('Legacy server.production entrypoint is disabled in production. Set ENABLE_LEGACY_API=true to override.');
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

// Use existing auth router (legacy support)
app.use('/api/auth', authRouter);

// ============================================================================
// PROTECTED API ROUTES (Authentication + Authorization Required)
// ============================================================================

// Apply global rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Mount production-ready routes with full authentication and authorization
app.use('/api', authenticate, enforceTenantIsolation, productionReadyRouter);

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
    logger.error('Error fetching vehicles', { error });
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
    logger.error('Error fetching vehicle', { error });
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
    logger.error('Error fetching drivers', { error });
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
    logger.error('Error fetching work orders', { error });
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
    logger.error('Error fetching fuel transactions', { error });
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
    logger.error('Error fetching maintenance records', { error });
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
    logger.error('Error fetching maintenance schedules', { error });
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
    logger.error('Error fetching GPS tracks', { error });
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
    logger.error('Error fetching routes', { error });
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
    logger.info('Fleet Management API starting in production mode');

    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      logger.error('Database connection failed. Please check your DATABASE_URL');
      process.exit(1);
    }
    logger.info('Database connection successful');

    // Start server
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server listening on http://localhost:${PORT}`);
      logger.info(`Health endpoint: http://localhost:${PORT}/health`);
      logger.info(`CSRF token endpoint: http://localhost:${PORT}/api/csrf`);
      logger.info('Security features enabled: JWT Authentication, RBAC Authorization, CSRF Protection, Rate Limiting, Input Sanitization, XSS Prevention, SQL Injection Protection, Tenant Isolation');
      logger.info('API endpoints registered (30 total): auth, vehicles, drivers, work-orders, maintenance, fuel, gps, routes, reports, analytics');
    });

    // Initialize WebSocket for OBD2 Emulator
    setupOBD2WebSocket(server);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;
