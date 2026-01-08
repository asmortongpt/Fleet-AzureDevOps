/**
 * Fleet Management API - Main Application
 *
 * Production-ready Express application with complete middleware stack
 * and service integration.
 *
 * Features:
 * - JWT authentication with session management
 * - Role-based authorization
 * - Rate limiting with Redis
 * - Comprehensive audit logging
 * - Secrets and configuration management
 * - Graceful shutdown
 * - Health checks
 * - OpenAPI documentation
 */

import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import Redis from 'ioredis';
import { Pool } from 'pg';

// Services
import { createAuthMiddleware } from './middleware/auth.middleware';
import { createAuthzMiddleware } from './middleware/authz.middleware';
import { createErrorMiddleware } from './middleware/error.middleware';
import { createRateLimitMiddleware } from './middleware/rate-limit.middleware';
import { createAuthRoutes } from './routes/auth.routes';
import { AuditService } from './services/audit/AuditService';
import { AuthenticationService } from './services/auth/AuthenticationService';
import { AuthorizationService } from './services/authz/AuthorizationService';
import { ConfigurationManagementService } from './services/config/ConfigurationManagementService';
import { SecretsManagementService } from './services/secrets/SecretsManagementService';

// Middleware

// Routes

export class FleetAPI {
  private app: Application;
  private pool: Pool;
  private redis: Redis;

  // Services
  private auditService: AuditService;
  private authService: AuthenticationService;
  private authzService: AuthorizationService;
  private secretsService: SecretsManagementService;
  private configService: ConfigurationManagementService;

  constructor() {
    this.app = express();

    // Initialize database connection
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize Redis
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    // Initialize services
    this.auditService = new AuditService(this.pool, {
      azureBlobConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      azureKeyVaultUrl: process.env.AZURE_KEYVAULT_URL
    });

    this.authService = new AuthenticationService(this.pool, this.redis);
    this.authzService = new AuthorizationService(this.pool, true, process.env.REDIS_URL);
    this.secretsService = new SecretsManagementService(this.pool);
    this.configService = new ConfigurationManagementService(this.pool, { redis: this.redis });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security headers (FIRST)
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID
    this.app.use((req: Request, res: Response, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] ||
        `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
      next();
    });

    // Rate limiting
    const rateLimitMiddleware = createRateLimitMiddleware(this.redis);
    this.app.use(rateLimitMiddleware.global);

    // Request logging
    this.app.use((req: Request, res: Response, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        // Check database
        await this.pool.query('SELECT 1');

        // Check Redis
        await this.redis.ping();

        res.json({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0'
          }
        });
      } catch (_error) {
        res.status(503).json({
          success: false,
          error: {
            code: 'UNHEALTHY',
            message: 'Service is unhealthy'
          }
        });
      }
    });

    // API root
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Fleet Management API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health'
      });
    });

    // Auth middleware instances
    const authMiddleware = createAuthMiddleware(this.pool, this.redis, this.auditService);
    const authzMiddleware = createAuthzMiddleware(this.pool, this.auditService);

    // Public routes (no authentication required)
    this.app.use('/auth', createAuthRoutes(this.pool, this.redis, this.auditService));

    // Protected routes (authentication required)
    // Config routes
    this.app.get('/config/:key', authMiddleware.authenticate, async (req: Request, res: Response, next) => {
      try {
        const value = await this.configService.get(req.params.key);
        res.json({ success: true, data: value });
      } catch (error) {
        next(error);
      }
    });

    this.app.post('/config/:key',
      authMiddleware.authenticate,
      authzMiddleware.requirePermission('config:write:global'),
      async (req: Request, res: Response, next) => {
        try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
          }
          const version = await this.configService.set(
            req.params.key,
            req.body.value,
            { scope: req.body.scope || 'global', scopeId: req.body.scopeId },
            req.user.userId.toString(),
            req.body.comment
          );
          res.json({ success: true, data: version });
        } catch (error) {
          next(error);
        }
      }
    );

    // Secrets routes
    this.app.get('/secrets/:name',
      authMiddleware.authenticate,
      authzMiddleware.requirePermission('secrets:read:global'),
      async (req: Request, res: Response, next) => {
        try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
          }
          const value = await this.secretsService.getSecret(req.params.name, {
            userId: req.user.userId.toString(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
          res.json({ success: true, data: { value } });
        } catch (error) {
          next(error);
        }
      }
    );

    this.app.post('/secrets/:name',
      authMiddleware.authenticate,
      authzMiddleware.requirePermission('secrets:write:global'),
      async (req: Request, res: Response, next) => {
        try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
          }
          await this.secretsService.setSecret(
            req.params.name,
            req.body.value,
            req.body.metadata,
            {
              userId: req.user.userId.toString(),
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            }
          );
          res.json({ success: true, message: 'Secret stored successfully' });
        } catch (error) {
          next(error);
        }
      }
    );

    // Audit routes
    this.app.get('/audit/logs',
      authMiddleware.authenticate,
      authzMiddleware.requireRole(['Admin', 'Auditor']),
      async (req: Request, res: Response, next) => {
        try {
          const logs = await this.auditService.query({
            userId: req.query.userId as string,
            action: req.query.action as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            limit: parseInt(req.query.limit as string) || 100,
            offset: parseInt(req.query.offset as string) || 0
          });
          res.json({ success: true, data: logs });
        } catch (error) {
          next(error);
        }
      }
    );

    this.app.get('/audit/verify',
      authMiddleware.authenticate,
      authzMiddleware.requireRole(['Admin']),
      async (req: Request, res: Response, next) => {
        try {
          const verification = await this.auditService.verifyChain();
          res.json({ success: true, data: verification });
        } catch (error) {
          next(error);
        }
      }
    );

    // Admin routes
    this.app.post('/admin/users/:id/roles',
      authMiddleware.authenticate,
      authzMiddleware.requireRole(['Admin']),
      async (req: Request, res: Response, next) => {
        try {
          if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
          }
          await this.authzService.assignRole(
            req.params.id,
            req.body.roleId,
            req.user.userId.toString(),
            req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
          );
          res.json({ success: true, message: 'Role assigned successfully' });
        } catch (error) {
          next(error);
        }
      }
    );

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    const errorMiddleware = createErrorMiddleware(this.auditService);
    this.app.use(errorMiddleware.handle);
  }

  async start(port: number = 3000): Promise<void> {
    try {
      // Connect to Redis
      await this.redis.connect();
      console.log('✓ Redis connected');

      // Initialize secrets service
      await this.secretsService.initialize();
      console.log('✓ Secrets service initialized');

      // Test database connection
      await this.pool.query('SELECT 1');
      console.log('✓ Database connected');

      // Start server
      this.app.listen(port, () => {
        console.log(`✓ Fleet Management API running on port ${port}`);
        console.log(`  Health: http://localhost:${port}/health`);
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      try {
        // Close Redis
        await this.redis.quit();
        console.log('✓ Redis connection closed');

        // Close database pool
        await this.pool.end();
        console.log('✓ Database pool closed');

        // Shutdown secrets service
        await this.secretsService.shutdown();
        console.log('✓ Secrets service shutdown complete');

        console.log('✓ Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  getApp(): Application {
    return this.app;
  }
}

// Start server if run directly
if (require.main === module) {
  const api = new FleetAPI();
  const port = parseInt(process.env.PORT || '3000', 10);
  api.start(port);
}

export default FleetAPI;
