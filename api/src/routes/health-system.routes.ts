/**
 * Comprehensive System Health Check Endpoint (BACKEND-12)
 *
 * Provides detailed health monitoring for:
 * - Database connectivity and latency
 * - Redis connectivity (if configured)
 * - Memory usage and limits
 * - Disk space availability
 * - System uptime
 * - Application Insights status
 */

import * as fs from 'fs'
import * as os from 'os'

import { Router, Request, Response } from 'express'

import { pool } from '../config/db-pool'
import telemetryService from '../monitoring/applicationInsights'

const router = Router()

interface HealthCheck {
  status: 'healthy' | 'warning' | 'unhealthy' | 'not_configured'
  latency?: string
  error?: string
  [key: string]: any
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    database: HealthCheck
    redis: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
    applicationInsights: HealthCheck
  }
}

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()

  try {
    await pool.query('SELECT 1')
    const latency = Date.now() - startTime

    // Also get pool stats for additional info
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    }

    return {
      status: latency < 100 ? 'healthy' : 'warning',
      latency: `${latency}ms`,
      poolStats,
      threshold: '100ms'
    }
  } catch (error: any) {
    telemetryService.trackError(error, { context: 'database-health-check' })
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

/**
 * Check Redis connectivity (if configured)
 * Note: Redis is optional in Fleet architecture
 */
async function checkRedis(): Promise<HealthCheck> {
  // Check if Redis is configured
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return {
      status: 'not_configured',
      message: 'Redis is not configured (optional for development)'
    }
  }

  const startTime = Date.now()

  try {
    // Dynamically import Redis to avoid errors if not installed
    const Redis = await import('ioredis').catch(() => null)

    if (!Redis) {
      return {
        status: 'not_configured',
        message: 'Redis client not installed'
      }
    }

    const redis = new Redis.default(process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000
    })

    // Test connection with ping
    await redis.ping()
    const latency = Date.now() - startTime

    // Get Redis info
    const info = await redis.info('server')
    await redis.quit()

    return {
      status: latency < 50 ? 'healthy' : 'warning',
      latency: `${latency}ms`,
      version: info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown',
      threshold: '50ms'
    }
  } catch (error: any) {
    telemetryService.trackError(error, { context: 'redis-health-check' })
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const usage = process.memoryUsage()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()

  // Convert to MB for readability
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
  const rssMB = Math.round(usage.rss / 1024 / 1024)
  const totalMemoryMB = Math.round(totalMemory / 1024 / 1024)
  const freeMemoryMB = Math.round(freeMemory / 1024 / 1024)

  // Calculate percentages
  const heapPercentage = Math.round((heapUsedMB / heapTotalMB) * 100)
  const systemMemoryPercentage = Math.round(((totalMemory - freeMemory) / totalMemory) * 100)

  // Determine status based on memory usage
  let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy'
  if (heapPercentage > 90 || systemMemoryPercentage > 90) {
    status = 'unhealthy'
  } else if (heapPercentage > 75 || systemMemoryPercentage > 75) {
    status = 'warning'
  }

  return {
    status,
    heapUsedMB,
    heapTotalMB,
    heapPercentage,
    rssMB,
    systemMemoryUsedMB: totalMemoryMB - freeMemoryMB,
    systemMemoryTotalMB: totalMemoryMB,
    systemMemoryPercentage,
    thresholds: {
      warning: '75%',
      critical: '90%'
    }
  }
}

/**
 * Check disk space availability
 */
function checkDisk(): HealthCheck {
  try {
    // Get disk stats for current working directory
    const stats = fs.statfsSync(process.cwd())

    // Calculate available and total space in GB
    const blockSize = stats.bsize
    const totalBlocks = stats.blocks
    const availableBlocks = stats.bavail

    const totalGB = Math.round((totalBlocks * blockSize) / (1024 ** 3))
    const availableGB = Math.round((availableBlocks * blockSize) / (1024 ** 3))
    const usedGB = totalGB - availableGB
    const usedPercentage = Math.round((usedGB / totalGB) * 100)

    // Determine status based on available space
    let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy'
    if (availableGB < 1) {
      status = 'unhealthy'
    } else if (availableGB < 5 || usedPercentage > 90) {
      status = 'warning'
    }

    return {
      status,
      totalGB,
      usedGB,
      availableGB,
      usedPercentage,
      path: process.cwd(),
      thresholds: {
        warning: '5GB or 90% used',
        critical: '1GB remaining'
      }
    }
  } catch (error: any) {
    // If statfs fails, provide basic info
    return {
      status: 'healthy',
      message: 'Disk check not available on this platform',
      error: error.message
    }
  }
}

/**
 * Check Application Insights status
 */
function checkApplicationInsights(): HealthCheck {
  const isActive = telemetryService.isActive()

  return {
    status: isActive ? 'healthy' : 'not_configured',
    enabled: isActive,
    message: isActive
      ? 'Application Insights is collecting telemetry'
      : 'Application Insights is not configured (set APPLICATIONINSIGHTS_CONNECTION_STRING)'
  }
}

/**
 * GET / - Comprehensive health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now()

  // Run all health checks in parallel
  const [database, redis, memory, disk, applicationInsights] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkDisk()),
    Promise.resolve(checkApplicationInsights())
  ])

  // Prepare response
  const health: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    checks: {
      database,
      redis,
      memory,
      disk,
      applicationInsights
    }
  }

  // Determine overall status
  const checks = Object.values(health.checks)
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy')
  const hasWarning = checks.some(c => c.status === 'warning')

  if (hasUnhealthy) {
    health.status = 'unhealthy'
  } else if (hasWarning) {
    health.status = 'degraded'
  }

  // Set appropriate HTTP status code
  const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 200 : 503

  // Track health check in telemetry
  const duration = Date.now() - startTime
  telemetryService.trackEvent('HealthCheck', {
    status: health.status,
    duration,
    databaseLatency: database.latency,
    redisStatus: redis.status,
    memoryPercentage: memory.heapPercentage,
    diskUsedPercentage: disk.usedPercentage
  })

  res.status(statusCode).json(health)
})

/**
 * GET /simple - Simple health check for load balancers
 * Returns 200 OK if database is accessible, 503 otherwise
 */
router.get('/simple', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1')
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message
    })
  }
})

/**
 * GET /ready - Kubernetes readiness probe
 * Checks if application is ready to serve traffic
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await pool.query('SELECT 1')

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      reason: error.message
    })
  }
})

/**
 * GET /live - Kubernetes liveness probe
 * Checks if application is alive (basic process check)
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  })
})

export default router
