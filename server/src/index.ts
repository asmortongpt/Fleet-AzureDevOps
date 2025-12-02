import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './services/config';
import { logger } from './services/logger';
import { db } from './services/database';
import authRoutes from './routes/auth';
import vehiclesRoutes from './routes/vehicles';
import driversRoutes from './routes/drivers';
import facilitiesRoutes from './routes/facilities';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import {
  authRateLimiter,
  writeRateLimiter,
  readRateLimiter,
  publicRateLimiter,
  bannedIPMiddleware,
} from './middleware/rate-limit';
import { getRedisClient, closeRedisConnection, pingRedis } from './lib/redis-client';

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

// ============================================================================
// PRODUCTION RATE LIMITING - 6-TIER SYSTEM
// FedRAMP SC-5 (Denial of Service Protection) Compliance
// ============================================================================

// Apply banned IP middleware first (blocks banned IPs immediately)
app.use(bannedIPMiddleware);

// TIER 1: STRICT - Authentication endpoints (5 req/15min)
app.use('/api/v1/auth/login', authRateLimiter);
app.use('/api/v1/auth/register', authRateLimiter);
app.use('/api/v1/auth/reset-password', authRateLimiter);
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/reset-password', authRateLimiter);

// TIER 4: GENEROUS - Public endpoints (5000 req/15min)
// Health check endpoint (public rate limiting)
app.get('/health', publicRateLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbHealthy = await db.testConnection();

    if (!dbHealthy) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
      });
      return;
    }

    // Check Redis connection status
    const redisHealthy = await pingRedis();

    res.json({
      status: 'healthy',
      database: 'connected',
      redis: redisHealthy ? 'connected' : 'disconnected',
      rateLimiting: redisHealthy ? 'redis-backed' : 'in-memory-fallback',
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

// API routes with TIER 1: STRICT rate limiting
app.use('/api/v1/auth', authRoutes);

// TIER 2: AGGRESSIVE - Write operations (POST, PUT, DELETE) - 100 req/15min
// Apply to all write operations across all API routes
app.use('/api', (req, _res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return writeRateLimiter(req, _res, next);
  }
  next();
});

// TIER 3: STANDARD - Read operations (GET) - 1000 req/15min
// Apply to all GET requests
app.use('/api', (req, _res, next) => {
  if (req.method === 'GET') {
    return readRateLimiter(req, _res, next);
  }
  next();
});

// Fleet management routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/facilities', facilitiesRoutes);

// Health endpoint at /api/health (frontend expects this) - TIER 4: PUBLIC
app.get('/api/health', publicRateLimiter, async (_req: Request, res: Response): Promise<void> => {
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

// Global error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize Redis client for rate limiting
    logger.info('Initializing Redis client for rate limiting...');
    try {
      const redisClient = getRedisClient();
      const redisHealthy = await pingRedis();
      if (redisHealthy) {
        logger.info('Redis connection successful - Rate limiting will use Redis backend');
      } else {
        logger.warn('Redis connection failed - Rate limiting will use in-memory fallback');
      }
    } catch (redisError) {
      logger.warn('Redis initialization error - Rate limiting will use in-memory fallback', {
        error: redisError instanceof Error ? redisError.message : redisError,
      });
    }

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
        await closeRedisConnection();
        await db.close();
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await closeRedisConnection();
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

  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

startServer();

export default app;
