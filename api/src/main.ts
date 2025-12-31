/**
 * Fleet Management API - Main Server
 * Production-ready Express server with essential middleware and routes
 */

import cors from 'cors';
import { eq } from 'drizzle-orm';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

import { db, checkDatabaseConnection } from './db/connection';
import { schema } from './schemas/production.schema';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// 1. Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// 2. CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// 3. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Vehicles
app.get('/api/vehicles', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const vehicles = await db
      .select()
      .from(schema.vehicles)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: vehicles,
      pagination: {
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

app.get('/api/vehicles/:id', async (req: Request, res: Response) => {
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

// Drivers
app.get('/api/drivers', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const drivers = await db
      .select()
      .from(schema.drivers)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: drivers,
      pagination: {
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
app.get('/api/work-orders', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const workOrders = await db
      .select()
      .from(schema.workOrders)
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({
      data: workOrders,
      pagination: {
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

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString(),
  });
});

// Global error middleware (must be last)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      console.error('❌ Database connection failed. Check DATABASE_URL in .env');
      process.exit(1);
    }

    console.log('✅ Database connection successful');

    const server = app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('🚀 Fleet Management API Server');
      console.log('='.repeat(60));
      console.log('');
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('📊 Available endpoints:');
      console.log('   GET  /api/vehicles');
      console.log('   GET  /api/vehicles/:id');
      console.log('   GET  /api/drivers');
      console.log('   GET  /api/work-orders');
      console.log('');
      console.log('💡 Use ?page=1&limit=10 for pagination');
      console.log('');
    });

    // Graceful shutdown handlers
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;