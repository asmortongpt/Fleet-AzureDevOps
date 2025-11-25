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
import { Pool } from 'pg';
import os from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

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
 * In production, this should verify JWT and check role
 */
const requireAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  // TODO: Implement proper admin authentication
  // For now, check for admin API key or JWT with admin role

  const apiKey = req.headers['x-api-key'] as string;
  const adminKey = process.env.ADMIN_API_KEY || 'admin-key-change-in-production';

  if (apiKey === adminKey) {
    next();
  } else {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
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

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Test connection
    const pingResult = await pool.query('SELECT 1 as ping');

    // Get database stats
    const statsResult = await pool.query(`
      SELECT
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) AS connections
      FROM pg_database
      WHERE datname = current_database()
    `);

    // Get table counts
    const tableCountResult = await pool.query(`
      SELECT
        schemaname,
        COUNT(*) as table_count
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      GROUP BY schemaname
    `);

    // Check for slow queries
    const slowQueriesResult = await pool.query(`
      SELECT COUNT(*) as slow_query_count
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
      LIMIT 1
    `).catch(() => ({ rows: [{ slow_query_count: 0 }] })); // If pg_stat_statements not available

    await pool.end();

    const latency = Date.now() - startTime;
    const connections = statsResult.rows[0]?.connections || 0;

    return {
      status: latency < 100 && connections < 50 ? 'healthy' : 'degraded',
      message: 'Database connection successful',
      latency,
      details: {
        database: statsResult.rows[0]?.datname || 'unknown',
        size: statsResult.rows[0]?.size || 'unknown',
        activeConnections: connections,
        tables: tableCountResult.rows[0]?.table_count || 0,
        slowQueries: slowQueriesResult.rows[0]?.slow_query_count || 0,
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
  const requiredVars = [
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET',
    'AZURE_AD_TENANT_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    return {
      status: 'critical',
      message: 'Azure AD not fully configured',
      details: {
        missingVariables: missingVars,
        configured: requiredVars.filter(v => process.env[v])
      }
    };
  }

  return {
    status: 'healthy',
    message: 'Azure AD properly configured',
    details: {
      clientId: process.env.AZURE_AD_CLIENT_ID?.substring(0, 8) + '...',
      tenantId: process.env.AZURE_AD_TENANT_ID?.substring(0, 8) + '...',
      hasSecret: !!process.env.AZURE_AD_CLIENT_SECRET
    }
  };
}

/**
 * Check Application Insights configuration
 */
async function checkApplicationInsights(): Promise<ComponentHealth> {
  const connectionString = process.env.APPLICATION_INSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    return {
      status: 'degraded',
      message: 'Application Insights not configured',
      details: {
        configured: false
      }
    };
  }

  const hasInstrumentationKey = connectionString.includes('InstrumentationKey=');

  return {
    status: hasInstrumentationKey ? 'healthy' : 'degraded',
    message: hasInstrumentationKey ? 'Application Insights configured' : 'Invalid connection string',
    details: {
      configured: true,
      hasInstrumentationKey,
      endpoint: connectionString.includes('IngestionEndpoint=') ? 'configured' : 'default'
    }
  };
}

/**
 * Check cache status (Redis if available)
 */
async function checkCache(): Promise<ComponentHealth> {
  // Check if Redis is configured
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return {
      status: 'degraded',
      message: 'Redis not configured (using in-memory cache)',
      details: {
        type: 'in-memory',
        configured: false
      }
    };
  }

  try {
    // Try to connect to Redis
    const { createClient } = await import('redis');
    const client = createClient({ url: redisUrl });

    const startTime = Date.now();
    await client.connect();

    // Ping Redis
    await client.ping();

    // Get info
    const info = await client.info();
    const latency = Date.now() - startTime;

    // Parse Redis info
    const usedMemory = info.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown';
    const connectedClients = info.match(/connected_clients:(\d+)/)?.[1] || 'unknown';

    await client.quit();

    return {
      status: 'healthy',
      message: 'Redis cache operational',
      latency,
      details: {
        type: 'redis',
        configured: true,
        usedMemory,
        connectedClients,
        responseTime: `${latency}ms`
      }
    };
  } catch (error: any) {
    return {
      status: 'critical',
      message: 'Redis connection failed',
      details: {
        error: error.message,
        configured: true
      }
    };
  }
}

/**
 * Check disk space
 */
async function checkDisk(): Promise<ComponentHealth> {
  try {
    // Get disk usage
    const { stdout } = await execAsync('df -h / | tail -1');
    const parts = stdout.trim().split(/\s+/);

    const usage = parts[4] || '0%';
    const usagePercent = parseInt(usage.replace('%', ''));

    return {
      status: usagePercent < 80 ? 'healthy' : usagePercent < 90 ? 'degraded' : 'critical',
      message: `Disk usage: ${usage}`,
      details: {
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        available: parts[3],
        usagePercent: `${usagePercent}%`,
        mountPoint: parts[5]
      }
    };
  } catch (error: any) {
    return {
      status: 'degraded',
      message: 'Could not check disk space',
      details: {
        error: error.message
      }
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<ComponentHealth> {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercent = Math.round((usedMemory / totalMemory) * 100);

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  return {
    status: usagePercent < 80 ? 'healthy' : usagePercent < 90 ? 'degraded' : 'critical',
    message: `Memory usage: ${usagePercent}%`,
    details: {
      total: formatBytes(totalMemory),
      used: formatBytes(usedMemory),
      free: formatBytes(freeMemory),
      usagePercent: `${usagePercent}%`
    }
  };
}

/**
 * Check API performance metrics
 */
async function checkApiPerformance(): Promise<ComponentHealth> {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(2)} MB`;
  };

  return {
    status: 'healthy',
    message: 'API process healthy',
    details: {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      nodeVersion: process.version,
      processMemory: {
        rss: formatBytes(memUsage.rss),
        heapTotal: formatBytes(memUsage.heapTotal),
        heapUsed: formatBytes(memUsage.heapUsed),
        external: formatBytes(memUsage.external)
      },
      cpuUsage: process.cpuUsage()
    }
  };
}

/**
 * GET /api/health/detailed - Comprehensive system health check
 * Protected endpoint requiring admin authentication
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [
      database,
      azureAd,
      applicationInsights,
      cache,
      disk,
      memory,
      apiPerformance
    ] = await Promise.all([
      checkDatabase(),
      checkAzureAd(),
      checkApplicationInsights(),
      checkCache(),
      checkDisk(),
      checkMemory(),
      checkApiPerformance()
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

    // Calculate summary
    const summary = {
      healthy: 0,
      degraded: 0,
      critical: 0,
      total: Object.keys(components).length
    };

    Object.values(components).forEach(component => {
      if (component.status === 'healthy') summary.healthy++;
      else if (component.status === 'degraded') summary.degraded++;
      else if (component.status === 'critical') summary.critical++;
    });

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (summary.critical > 0) overallStatus = 'critical';
    else if (summary.degraded > 0) overallStatus = 'degraded';

    const response: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components,
      summary
    };

    const httpStatus = overallStatus === 'healthy' ? 200 :
                       overallStatus === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(response);

  } catch (error: any) {
    res.status(500).json({
      status: 'critical',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/detailed/component/:name - Check specific component
 */
router.get('/component/:name', requireAdmin, async (req: Request, res: Response) => {
  const { name } = req.params;

  const checks: Record<string, () => Promise<ComponentHealth>> = {
    database: checkDatabase,
    azureAd: checkAzureAd,
    applicationInsights: checkApplicationInsights,
    cache: checkCache,
    disk: checkDisk,
    memory: checkMemory,
    apiPerformance: checkApiPerformance
  };

  const checkFunction = checks[name];

  if (!checkFunction) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Component '${name}' not found`,
      availableComponents: Object.keys(checks)
    });
  }

  try {
    const result = await checkFunction();
    const httpStatus = result.status === 'healthy' ? 200 :
                       result.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json({
      component: name,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      component: name,
      status: 'critical',
      message: 'Check failed',
      error: error.message
    });
  }
});

export default router;
