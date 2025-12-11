Here's the refactored `health-detailed.ts` file with all `pool.query`/`db.query` replaced by repository methods:


/**
 * Detailed Health Check API Endpoint
 * Provides comprehensive system status for production monitoring
 *
 * Protected endpoint - requires admin authentication
 *
 * Returns:
 * - Database connectivity and stats
 * - Azure AD configuration status
 * - Application Insights status
 * - Cache status (Redis)
 * - Disk space and system resources
 * - Memory usage
 * - API response times
 * - Recent errors
 */

import express, { Request, Response } from 'express';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';
import { container } from '../container';
import { HealthCheckRepository } from '../repositories/HealthCheckRepository';
import { TYPES } from '../types';


const router = express.Router();
const execAsync = promisify(exec);

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: {
    database: ComponentHealth;
    azureAd: ComponentHealth;
    applicationInsights: ComponentHealth;
    cache: ComponentHealth;
    disk: ComponentHealth;
    memory: ComponentHealth;
    apiPerformance: ComponentHealth;
  };
  summary: {
    healthy: number;
    degraded: number;
    critical: number;
    total: number;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  details?: Record<string, any>;
  latency?: number;
  lastCheck?: string;
}

/**
 * Middleware to require admin authentication
 * Verifies admin API key or JWT with admin role
 */
const requireAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const adminKey = process.env.ADMIN_API_KEY || process.env.ADMIN_KEY;

  // Check for API key
  if (apiKey && apiKey === adminKey) {
    return next();
  }

  // Check for JWT with admin role (if using JWT authentication)
  const user = (req as any).user;
  if (user && (user.role === 'admin' || user.role === 'system_admin')) {
    return next();
  }

  // Production mode requires authentication
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  // Development mode allows through (with warning)
  console.warn('⚠️  Admin endpoint accessed without authentication in development mode');
  next();
};

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const startTime = Date.now();

  try {
    if (!process.env.DATABASE_URL) {
      return {
        status: 'critical',
        message: 'Database URL not configured',
        latency: Date.now() - startTime
      };
    }

    // Get repository from DI container
    const healthCheckRepo = container.get<HealthCheckRepository>(TYPES.HealthCheckRepository);

    // Use repository methods instead of direct pool.query()
    const { stats, tables, slowQueries } = await healthCheckRepo.getAllHealthMetrics();

    const latency = Date.now() - startTime;
    const connections = stats.connections || 0;

    return {
      status: latency < 100 && connections < 50 ? 'healthy' : 'degraded',
      message: 'Database connection successful',
      latency,
      details: {
        database: stats.datname || 'unknown',
        size: stats.size || 'unknown',
        activeConnections: connections,
        tables: tables[0]?.table_count || 0,
        slowQueries: slowQueries.slow_query_count || 0,
        responseTime: `${latency}ms`
      },
      lastCheck: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'critical',
      message: 'Database connection failed',
      details: {
        error: error.message
      },
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Check Azure AD configuration
 */
async function checkAzureAd(): Promise<ComponentHealth> {
  const requiredVars = ['AZURE_AD_CLIENT_ID', 'AZURE_AD_TENANT_ID', 'AZURE_AD_CLIENT_SECRET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    return {
      status: 'critical',
      message: 'Azure AD configuration incomplete',
      details: {
        missingVariables: missingVars
      }
    };
  }

  return {
    status: 'healthy',
    message: 'Azure AD configuration complete'
  };
}

/**
 * Check Application Insights configuration
 */
async function checkApplicationInsights(): Promise<ComponentHealth> {
  if (!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    return {
      status: 'critical',
      message: 'Application Insights not configured'
    };
  }

  return {
    status: 'healthy',
    message: 'Application Insights configured'
  };
}

/**
 * Check cache (Redis) status
 */
async function checkCache(): Promise<ComponentHealth> {
  const startTime = Date.now();

  try {
    if (!process.env.REDIS_URL) {
      return {
        status: 'critical',
        message: 'Redis URL not configured',
        latency: Date.now() - startTime
      };
    }

    const healthCheckRepo = container.get<HealthCheckRepository>(TYPES.HealthCheckRepository);
    const cacheStatus = await healthCheckRepo.checkCacheStatus();

    const latency = Date.now() - startTime;

    return {
      status: cacheStatus.connected ? 'healthy' : 'critical',
      message: cacheStatus.connected ? 'Cache connection successful' : 'Cache connection failed',
      latency,
      details: {
        connected: cacheStatus.connected,
        responseTime: `${latency}ms`
      },
      lastCheck: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'critical',
      message: 'Cache check failed',
      details: {
        error: error.message
      },
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Check disk space and system resources
 */
async function checkDisk(): Promise<ComponentHealth> {
  const startTime = Date.now();

  try {
    const { stdout } = await execAsync('df -h /');
    const lines = stdout.split('\n');
    const diskInfo = lines[1].split(/\s+/);
    const used = parseInt(diskInfo[2].replace('%', ''), 10);
    const available = parseInt(diskInfo[3].replace('G', ''), 10);

    const latency = Date.now() - startTime;

    return {
      status: used < 80 && available > 10 ? 'healthy' : 'degraded',
      message: 'Disk space checked',
      latency,
      details: {
        used: `${used}%`,
        available: `${available}G`,
        responseTime: `${latency}ms`
      },
      lastCheck: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'critical',
      message: 'Disk check failed',
      details: {
        error: error.message
      },
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<ComponentHealth> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usedPercentage = (usedMem / totalMem) * 100;

  return {
    status: usedPercentage < 80 ? 'healthy' : 'degraded',
    message: 'Memory usage checked',
    details: {
      total: `${Math.round(totalMem / 1024 / 1024)}MB`,
      used: `${Math.round(usedMem / 1024 / 1024)}MB`,
      free: `${Math.round(freeMem / 1024 / 1024)}MB`,
      usedPercentage: `${usedPercentage.toFixed(2)}%`
    }
  };
}

/**
 * Check API performance
 */
async function checkApiPerformance(): Promise<ComponentHealth> {
  const healthCheckRepo = container.get<HealthCheckRepository>(TYPES.HealthCheckRepository);
  const apiPerformance = await healthCheckRepo.getApiPerformance();

  const avgResponseTime = apiPerformance.reduce((sum, perf) => sum + perf.responseTime, 0) / apiPerformance.length;

  return {
    status: avgResponseTime < 500 ? 'healthy' : 'degraded',
    message: 'API performance checked',
    details: {
      averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      numberOfRequests: apiPerformance.length
    }
  };
}

/**
 * Check recent errors
 */
async function checkRecentErrors(): Promise<ComponentHealth> {
  const healthCheckRepo = container.get<HealthCheckRepository>(TYPES.HealthCheckRepository);
  const recentErrors = await healthCheckRepo.getRecentErrors();

  return {
    status: recentErrors.length === 0 ? 'healthy' : 'degraded',
    message: 'Recent errors checked',
    details: {
      errorCount: recentErrors.length,
      lastError: recentErrors.length > 0 ? recentErrors[0] : null
    }
  };
}

/**
 * Generate overall system health
 */
async function generateSystemHealth(): Promise<SystemHealth> {
  const [
    database,
    azureAd,
    applicationInsights,
    cache,
    disk,
    memory,
    apiPerformance,
    recentErrors
  ] = await Promise.all([
    checkDatabase(),
    checkAzureAd(),
    checkApplicationInsights(),
    checkCache(),
    checkDisk(),
    checkMemory(),
    checkApiPerformance(),
    checkRecentErrors()
  ]);

  const components = {
    database,
    azureAd,
    applicationInsights,
    cache,
    disk,
    memory,
    apiPerformance
  };

  const summary = Object.values(components).reduce((acc, component) => {
    acc[component.status] = (acc[component.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const overallStatus = summary.critical > 0 ? 'critical' : summary.degraded > 0 ? 'degraded' : 'healthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    components,
    summary: summary as SystemHealth['summary']
  };
}

/**
 * Health check endpoint
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const health = await generateSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('Error generating health check:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate health check'
    });
  }
});

export default router;


In this refactored version, all database-related operations have been replaced with repository methods from the `HealthCheckRepository`. The specific changes are:

1. In the `checkDatabase` function, `pool.query`/`db.query` calls have been replaced with a single call to `healthCheckRepo.getAllHealthMetrics()`.

2. In the `checkCache` function, a new repository method `checkCacheStatus()` has been added to replace any direct Redis connection checks.

3. In the `checkApiPerformance` function, `healthCheckRepo.getApiPerformance()` is used to retrieve API performance data.

4. In the `checkRecentErrors` function, `healthCheckRepo.getRecentErrors()` is used to fetch recent errors.

These changes assume that the `HealthCheckRepository` class has been updated to include the following methods:

- `getAllHealthMetrics()`
- `checkCacheStatus()`
- `getApiPerformance()`
- `getRecentErrors()`

Make sure to implement these methods in the `HealthCheckRepository` class to complete the refactoring process.