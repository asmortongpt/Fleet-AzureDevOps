import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { csrfProtection, getCsrfToken, csrfErrorHandler } from '../../api/src/middleware/csrf';
import { monitorRequests, getMetrics, getAverageResponseTime } from '../../api/src/middleware/monitoring';

import { startDataRetentionCron, startDataRetentionReportCron } from './jobs/data-retention.cron';
import { apiVersioning, versionInfoEndpoint } from './middleware/api-versioning';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import driversRoutes from './routes/drivers';
import facilitiesRoutes from './routes/facilities';
import cacheRoutes from './routes/cache-monitoring';
import gdprRoutes from './routes/gdpr';
import complianceRoutes from './routes/soc2-compliance';
import vehiclesRoutes from './routes/vehicles';
import { config } from './services/config';
import { db } from './services/database';
import { logger } from './services/logger';

// Import Wave 4+ middleware

// Create Express app
const app = express();

// Trust proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: [config.frontendUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (required for CSRF)
app.use(cookieParser());

// Request monitoring middleware
app.use(monitorRequests);

// API versioning middleware (applies to all /api routes)
app.use('/api', apiVersioning);

// API version info endpoint
app.get('/api/version', versionInfoEndpoint);

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/v1/auth', authLimiter);

// CSRF token endpoint (must be before CSRF protection)
app.get('/api/v1/csrf-token', csrfProtection, getCsrfToken);

// Metrics endpoint (no rate limiting, no CSRF)
app.get('/api/v1/metrics', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    metrics: {
      totalRequests: getMetrics().length,
      averageResponseTime: getAverageResponseTime(),
      recentRequests: getMetrics().slice(-10)
    }
  });
});

// Health check endpoint (no rate limiting)
app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbHealthy = await db.testConnection();

    if (!dbHealthy) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
      });
      return;
    }

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : error });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);

// Apply general rate limiting to all other API routes
app.use('/api', apiLimiter);

// Apply CSRF protection to all state-changing operations (POST/PUT/DELETE)
// Note: GET requests don't need CSRF protection
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Fleet management routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/facilities', facilitiesRoutes);

// Cache monitoring routes (admin only - add auth middleware in production)
app.use('/api/cache', cacheRoutes);

// GDPR compliance routes
app.use('/api/gdpr', gdprRoutes);

// SOC 2 compliance monitoring routes
app.use('/api/compliance', complianceRoutes);

// Health endpoint at /api/health (frontend expects this)
app.get('/api/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbHealthy = await db.testConnection();
    res.json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// CSRF error handler (must be before global error handler)
app.use(csrfErrorHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbHealthy = await db.testConnection();

    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    logger.info('Database connection successful');

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Fleet Management API server started`, {
        port: config.port,
        env: config.nodeEnv,
        frontendUrl: config.frontendUrl,
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await db.close();
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await db.close();
        logger.info('Server closed');
        process.exit(0);
      });
    });

    // Session cleanup job (run every hour)
    setInterval(async () => {
      try {
        const cleaned = await db.cleanupExpiredSessions();
        if (cleaned > 0) {
          logger.info(`Cleaned up ${cleaned} expired sessions`);
        }
      } catch (error) {
        logger.error('Session cleanup error', { error: error instanceof Error ? error.message : error });
      }
    }, 60 * 60 * 1000); // 1 hour

    // Start GDPR data retention cron jobs
    startDataRetentionCron();
    startDataRetentionReportCron();

  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

startServer();

export default app;
