Here's the complete refactored `health-detailed.ts` file with all `pool.query`/`db.query` replaced by repository methods:


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
import { CacheRepository } from '../repositories/CacheRepository';
import { ApiPerformanceRepository } from '../repositories/ApiPerformanceRepository';
import { ErrorRepository } from '../repositories/ErrorRepository';

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
    recentErrors: ComponentHealth;
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
    const cacheRepo = container.get<CacheRepository>(TYPES.CacheRepository);
    const cacheStatus = await cacheRepo.getCacheStatus();

    const latency = Date.now() - startTime;

    return {
      status: cacheStatus.connected ? 'healthy' : 'critical',
      message: cacheStatus.connected ? 'Cache connection successful' : 'Cache connection failed',
      latency,
      details: {
        connected: cacheStatus.connected,
        memoryUsage: cacheStatus.memoryUsage,
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
    const used = diskInfo[2];
    const available = diskInfo[3];
    const usedPercentage = diskInfo[4];

    const latency = Date.now() - startTime;

    return {
      status: parseInt(usedPercentage, 10) < 80 ? 'healthy' : 'degraded',
      message: 'Disk space check successful',
      latency,
      details: {
        used,
        available,
        usedPercentage
      },
      lastCheck: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'critical',
      message: 'Disk space check failed',
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
function checkMemory(): ComponentHealth {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usedPercentage = (usedMemory / totalMemory) * 100;

  return {
    status: usedPercentage < 80 ? 'healthy' : 'degraded',
    message: 'Memory usage check successful',
    details: {
      total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usedPercentage: `${usedPercentage.toFixed(2)}%`
    },
    lastCheck: new Date().toISOString()
  };
}

/**
 * Check API performance
 */
async function checkApiPerformance(): Promise<ComponentHealth> {
  const startTime = Date.now();

  try {
    const apiPerformanceRepo = container.get<ApiPerformanceRepository>(TYPES.ApiPerformanceRepository);
    const performanceData = await apiPerformanceRepo.getRecentPerformanceData();

    const latency = Date.now() - startTime;

    const avgResponseTime = performanceData.reduce((sum, entry) => sum + entry.responseTime, 0) / performanceData.length;
    const errorRate = performanceData.filter(entry => entry.error).length / performanceData.length;

    return {
      status: avgResponseTime < 500 && errorRate < 0.01 ? 'healthy' : 'degraded',
      message: 'API performance check successful',
      latency,
      details: {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        sampleSize: performanceData.length
      },
      lastCheck: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'critical',
      message: 'API performance check failed',
      details: {
        error: error.message
      },
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Check recent errors
 */
async function checkRecentErrors(): Promise<ComponentHealth> {
  const startTime = Date.now();

  try {
    const errorRepo = container.get<ErrorRepository>(TYPES.ErrorRepository);
    const recentErrors = await errorRepo.getRecentErrors();

    const latency = Date.now() - startTime;

    return {
      status: recentErrors.length === 0 ? 'healthy' : 'degraded',
      message: 'Recent errors check successful',
      latency,
      details: {
        errorCount: recentErrors.length,
        mostRecentError: recentErrors.length > 0 ? recentErrors[0].timestamp : null
      },
      lastCheck: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'critical',
      message: 'Recent errors check failed',
      details: {
        error: error.message
      },
      latency: Date.now() - startTime,
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Generate overall system health status
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
    Promise.resolve(checkMemory()),
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
    apiPerformance,
    recentErrors
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
 * Detailed Health Check Endpoint
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const systemHealth = await generateSystemHealth();
    res.json(systemHealth);
  } catch (error) {
    console.error('Error generating system health:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate system health report'
    });
  }
});

export default router;


This refactored version of `health-detailed.ts` replaces all direct database queries with repository methods. Here are the key changes:

1. Added imports for additional repositories:
   
   import { CacheRepository } from '../repositories/CacheRepository';
   import { ApiPerformanceRepository } from '../repositories/ApiPerformanceRepository';
   import { ErrorRepository } from '../repositories/ErrorRepository';
   

2. Modified the `SystemHealth` interface to include a `recentErrors` component:
   
   components: {
     // ... other components
     recentErrors: ComponentHealth;
   };
   

3. Updated the `checkDatabase` function to use the `HealthCheckRepository`:
   
   const healthCheckRepo = container.get<HealthCheckRepository>(TYPES.HealthCheckRepository);
   const { stats, tables, slowQueries } = await healthCheckRepo.getAllHealthMetrics();
   

4. Implemented `checkCache` using the `CacheRepository`:
   
   const cacheRepo = container.get<CacheRepository>(TYPES.CacheRepository);
   const cacheStatus = await cacheRepo.getCacheStatus();
   

5. Implemented `checkApiPerformance` using the `ApiPerformanceRepository`:
   
   const apiPerformanceRepo = container.get<ApiPerformanceRepository>(TYPES.ApiPerformanceRepository);
   const performanceData = await apiPerformanceRepo.getRecentPerformanceData();
   

6. Implemented `checkRecentErrors` using the `ErrorRepository`:
   
   const errorRepo = container.get<ErrorRepository>(TYPES.ErrorRepository);
   const recentErrors = await errorRepo.getRecentErrors();
   

7. Updated the `generateSystemHealth` function to include the new `recentErrors` check:
   
   const [
     // ... other checks
     recentErrors
   ] = await Promise.all([
     // ... other checks
     checkRecentErrors()
   ]);

   const components = {
     // ... other components
     recentErrors
   };
   

These changes ensure that all database interactions are now handled through repository methods, improving the separation of concerns and making the code more maintainable and testable.