/**
 * Database Health Monitor
 *
 * Monitors database connection pool health and logs warnings when issues are detected.
 * This helps prevent SSO authentication failures due to database connectivity problems.
 *
 * Key Monitoring:
 * - Connection pool exhaustion
 * - Connection timeout errors
 * - Query failures
 * - Slow queries affecting SSO endpoints
 */

import { Pool } from 'pg'
import logger from '../utils/logger'

interface PoolStats {
  total: number
  idle: number
  waiting: number
  active: number
}

interface HealthCheckResult {
  healthy: boolean
  message: string
  stats: PoolStats
  timestamp: Date
}

export class DatabaseHealthMonitor {
  private pool: Pool
  private checkInterval: NodeJS.Timeout | null = null
  private readonly INTERVAL_MS = 30000 // Check every 30 seconds
  private readonly POOL_WARNING_THRESHOLD = 0.8 // Warn at 80% utilization
  private lastCheckResult: HealthCheckResult | null = null

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Start monitoring database health
   */
  start(): void {
    if (this.checkInterval) {
      logger.warn('[DB Health Monitor] Already running')
      return
    }

    logger.info('[DB Health Monitor] Starting database health monitoring')

    // Perform initial check
    this.performHealthCheck()

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.INTERVAL_MS)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      logger.info('[DB Health Monitor] Stopped')
    }
  }

  /**
   * Perform a health check
   */
  private async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Get pool stats
      const stats = this.getPoolStats()

      // Test connection with simple query
      const client = await this.pool.connect()
      try {
        await client.query('SELECT 1')
      } finally {
        client.release()
      }

      const duration = Date.now() - startTime

      // Check for warning conditions
      const maxConnections = (this.pool as any).options?.max || 20
      const utilizationPercent = stats.total / maxConnections

      let healthy = true
      let message = 'Database connection healthy'

      if (utilizationPercent >= this.POOL_WARNING_THRESHOLD) {
        healthy = false
        message = `Connection pool utilization high: ${(utilizationPercent * 100).toFixed(1)}%`
        logger.warn('[DB Health Monitor] ' + message, { stats, maxConnections })
      }

      if (stats.waiting > 5) {
        healthy = false
        message = `${stats.waiting} clients waiting for connections`
        logger.warn('[DB Health Monitor] ' + message, { stats })
      }

      if (duration > 1000) {
        healthy = false
        message = `Health check slow: ${duration}ms`
        logger.warn('[DB Health Monitor] ' + message, { duration })
      }

      const result: HealthCheckResult = {
        healthy,
        message,
        stats,
        timestamp: new Date()
      }

      this.lastCheckResult = result

      if (healthy) {
        logger.debug('[DB Health Monitor] Health check passed', { stats, duration })
      }

      return result

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      const errorCode = (error as Record<string, unknown>).code
      const result: HealthCheckResult = {
        healthy: false,
        message: `Database connection failed: ${errorMessage}`,
        stats: this.getPoolStats(),
        timestamp: new Date()
      }

      this.lastCheckResult = result

      logger.error('[DB Health Monitor] Health check failed', {
        error: errorMessage,
        code: errorCode,
        stack: error instanceof Error ? error.stack : undefined
      })

      // CRITICAL: This error will cause SSO authentication to fail!
      if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
        logger.error('[DB Health Monitor] 🚨 CRITICAL: Database unreachable - SSO authentication will fail!')
      }

      return result
    }
  }

  /**
   * Get current pool statistics
   */
  private getPoolStats(): PoolStats {
    const pool = this.pool as any
    return {
      total: pool.totalCount || 0,
      idle: pool.idleCount || 0,
      waiting: pool.waitingCount || 0,
      active: (pool.totalCount || 0) - (pool.idleCount || 0)
    }
  }

  /**
   * Get last health check result
   */
  getLastCheckResult(): HealthCheckResult | null {
    return this.lastCheckResult
  }

  /**
   * Get current pool statistics (public method)
   */
  getCurrentStats(): PoolStats {
    return this.getPoolStats()
  }

  /**
   * Check if database is currently healthy
   */
  isHealthy(): boolean {
    return this.lastCheckResult?.healthy ?? true
  }
}

// Singleton instance
let monitorInstance: DatabaseHealthMonitor | null = null

/**
 * Initialize database health monitoring
 */
export function initializeDatabaseHealthMonitor(pool: Pool): DatabaseHealthMonitor {
  if (monitorInstance) {
    logger.warn('[DB Health Monitor] Already initialized')
    return monitorInstance
  }

  monitorInstance = new DatabaseHealthMonitor(pool)
  monitorInstance.start()

  // Setup graceful shutdown
  process.on('SIGTERM', () => {
    monitorInstance?.stop()
  })

  process.on('SIGINT', () => {
    monitorInstance?.stop()
  })

  return monitorInstance
}

/**
 * Get monitor instance
 */
export function getDatabaseHealthMonitor(): DatabaseHealthMonitor | null {
  return monitorInstance
}
