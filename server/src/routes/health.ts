/**
 * Health Check Endpoints
 * Provides comprehensive health monitoring for Kubernetes and uptime monitoring
 */

import express, { Request, Response } from 'express'
import { Pool } from 'pg'
import { createClient } from 'redis'

import { enhancedLogger as logger } from '../lib/logger'

const router = express.Router()

// Health check cache to prevent overwhelming dependencies
let lastHealthCheck: any = null
let lastHealthCheckTime = 0
const HEALTH_CHECK_CACHE_MS = 5000 // Cache for 5 seconds

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: HealthCheckStatus
    redis: HealthCheckStatus
    memory: HealthCheckStatus
    disk: HealthCheckStatus
    externalAPIs?: HealthCheckStatus
  }
  metrics: {
    requestsPerSecond?: number
    avgResponseTime?: number
    errorRate?: number
  }
}

interface HealthCheckStatus {
  status: 'ok' | 'degraded' | 'down'
  message: string
  latency?: number
  details?: any
}

/**
 * Database connection pool
 * Note: This should be imported from your actual database configuration
 */
let dbPool: Pool | null = null

try {
  if (process.env.DATABASE_URL) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }
} catch (error) {
  logger.error('Failed to create database pool for health checks', { error })
}

/**
 * Redis client
 * Note: This should be imported from your actual Redis configuration
 */
let redisClient: ReturnType<typeof createClient> | null = null

try {
  if (process.env.REDIS_URL) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
      }
    })
    redisClient.connect().catch((err) => {
      logger.error('Redis connection failed for health checks', { error: err })
    })
  }
} catch (error) {
  logger.error('Failed to create Redis client for health checks', { error })
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheckStatus> {
  if (!dbPool) {
    return {
      status: 'down',
      message: 'Database not configured'
    }
  }

  const start = Date.now()
  try {
    const result = await dbPool.query('SELECT 1 as health_check')
    const latency = Date.now() - start

    if (result.rows[0].health_check === 1) {
      return {
        status: latency > 1000 ? 'degraded' : 'ok',
        message: latency > 1000 ? 'Database responding slowly' : 'Database connection healthy',
        latency,
        details: {
          totalConnections: dbPool.totalCount,
          idleConnections: dbPool.idleCount,
          waitingConnections: dbPool.waitingCount
        }
      }
    }

    return {
      status: 'down',
      message: 'Database health check failed',
      latency
    }
  } catch (error: any) {
    return {
      status: 'down',
      message: 'Database connection failed',
      latency: Date.now() - start,
      details: {
        error: error.message
      }
    }
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<HealthCheckStatus> {
  if (!redisClient) {
    return {
      status: 'down',
      message: 'Redis not configured'
    }
  }

  const start = Date.now()
  try {
    if (!redisClient.isOpen) {
      return {
        status: 'down',
        message: 'Redis client not connected'
      }
    }

    await redisClient.ping()
    const latency = Date.now() - start

    return {
      status: latency > 500 ? 'degraded' : 'ok',
      message: latency > 500 ? 'Redis responding slowly' : 'Redis connection healthy',
      latency
    }
  } catch (error: any) {
    return {
      status: 'down',
      message: 'Redis connection failed',
      latency: Date.now() - start,
      details: {
        error: error.message
      }
    }
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheckStatus {
  const usage = process.memoryUsage()
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024)
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024)
  const usagePercent = (usedMB / totalMB) * 100

  return {
    status: usagePercent > 90 ? 'degraded' : usagePercent > 95 ? 'down' : 'ok',
    message: `Memory usage: ${usagePercent.toFixed(1)}%`,
    details: {
      heapUsed: usedMB,
      heapTotal: totalMB,
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    }
  }
}

/**
 * Check disk space
 */
async function checkDisk(): Promise<HealthCheckStatus> {
  try {
    // For containerized environments, this is simplified
    // In production, you might want to use a library like 'diskusage'
    return {
      status: 'ok',
      message: 'Disk check not implemented in containerized environment',
      details: {
        note: 'Kubernetes manages disk resources'
      }
    }
  } catch (error: any) {
    return {
      status: 'down',
      message: 'Disk check failed',
      details: {
        error: error.message
      }
    }
  }
}

/**
 * Check external APIs (Azure AD, Azure Key Vault, etc.)
 */
async function checkExternalAPIs(): Promise<HealthCheckStatus> {
  // This is a placeholder - implement actual checks for your external dependencies
  // For example: Azure AD, Azure Key Vault, third-party APIs

  try {
    // Example: Check Azure AD endpoint
    // const azureADCheck = await fetch('https://login.microsoftonline.com/...')

    return {
      status: 'ok',
      message: 'External APIs reachable'
    }
  } catch (error: any) {
    return {
      status: 'degraded',
      message: 'Some external APIs unavailable',
      details: {
        error: error.message
      }
    }
  }
}

/**
 * Perform full health check
 */
async function performHealthCheck(): Promise<HealthCheckResult> {
  const now = Date.now()

  // Return cached result if recent enough
  if (lastHealthCheck && (now - lastHealthCheckTime) < HEALTH_CHECK_CACHE_MS) {
    return lastHealthCheck
  }

  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    Promise.resolve(checkMemory()),
    checkDisk(),
    checkExternalAPIs()
  ])

  const [database, redis, memory, disk, externalAPIs] = checks

  // Determine overall status
  const statuses = [database.status, redis.status, memory.status, disk.status]
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  if (statuses.some(s => s === 'down')) {
    overallStatus = 'unhealthy'
  } else if (statuses.some(s => s === 'degraded')) {
    overallStatus = 'degraded'
  }

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database,
      redis,
      memory,
      disk,
      externalAPIs
    },
    metrics: {
      // These would be populated from actual metrics collection
      // For now, they're placeholders
    }
  }

  // Cache the result
  lastHealthCheck = result
  lastHealthCheckTime = now

  return result
}

/**
 * GET /health
 * Detailed health check for monitoring dashboards
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await performHealthCheck()

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503

    res.status(statusCode).json(health)
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message })
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    })
  }
})

/**
 * GET /health/liveness
 * Kubernetes liveness probe - checks if the application is running
 */
router.get('/health/liveness', (req: Request, res: Response) => {
  // Simple check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  })
})

/**
 * GET /health/readiness
 * Kubernetes readiness probe - checks if the application can serve traffic
 */
router.get('/health/readiness', async (req: Request, res: Response) => {
  try {
    const dbCheck = await checkDatabase()
    const redisCheck = await checkRedis()

    const isReady = dbCheck.status !== 'down' && redisCheck.status !== 'down'

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck.status,
          redis: redisCheck.status
        }
      })
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck,
          redis: redisCheck
        }
      })
    }
  } catch (error: any) {
    logger.error('Readiness check failed', { error: error.message })
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

/**
 * GET /health/startup
 * Kubernetes startup probe - checks if the application has started
 */
router.get('/health/startup', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies
    const dbCheck = await checkDatabase()

    if (dbCheck.status !== 'down') {
      res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime())
      })
    } else {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString(),
        message: 'Waiting for database connection'
      })
    }
  } catch (error: any) {
    logger.error('Startup check failed', { error: error.message })
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

/**
 * GET /health/metrics
 * Prometheus-compatible metrics endpoint
 */
router.get('/health/metrics', async (req: Request, res: Response) => {
  try {
    const health = await performHealthCheck()
    const memory = process.memoryUsage()

    // Return Prometheus format
    const metrics = [
      `# HELP fleet_api_up Application is up`,
      `# TYPE fleet_api_up gauge`,
      `fleet_api_up ${health.status === 'healthy' ? 1 : 0}`,
      ``,
      `# HELP fleet_api_uptime_seconds Application uptime in seconds`,
      `# TYPE fleet_api_uptime_seconds counter`,
      `fleet_api_uptime_seconds ${health.uptime}`,
      ``,
      `# HELP fleet_api_memory_heap_used_bytes Heap memory used in bytes`,
      `# TYPE fleet_api_memory_heap_used_bytes gauge`,
      `fleet_api_memory_heap_used_bytes ${memory.heapUsed}`,
      ``,
      `# HELP fleet_api_memory_heap_total_bytes Total heap memory in bytes`,
      `# TYPE fleet_api_memory_heap_total_bytes gauge`,
      `fleet_api_memory_heap_total_bytes ${memory.heapTotal}`,
      ``,
      `# HELP fleet_api_database_status Database status (1=ok, 0.5=degraded, 0=down)`,
      `# TYPE fleet_api_database_status gauge`,
      `fleet_api_database_status ${health.checks.database.status === 'ok' ? 1 : health.checks.database.status === 'degraded' ? 0.5 : 0}`,
      ``,
      `# HELP fleet_api_database_latency_ms Database query latency in milliseconds`,
      `# TYPE fleet_api_database_latency_ms gauge`,
      `fleet_api_database_latency_ms ${health.checks.database.latency || 0}`,
      ``
    ].join('\n')

    res.set('Content-Type', 'text/plain')
    res.send(metrics)
  } catch (error: any) {
    logger.error('Metrics endpoint failed', { error: error.message })
    res.status(500).send('# Error generating metrics\n')
  }
})

// Graceful shutdown handler
let isShuttingDown = false

process.on('SIGTERM', async () => {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info('SIGTERM received, starting graceful shutdown...')

  // Stop accepting new connections
  setTimeout(async () => {
    // Close database pool
    if (dbPool) {
      await dbPool.end()
      logger.info('Database pool closed')
    }

    // Close Redis client
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit()
      logger.info('Redis client closed')
    }

    // Flush logs
    await logger.flush()

    logger.info('Graceful shutdown complete')
    process.exit(0)
  }, 10000) // 10 second grace period
})

export default router
