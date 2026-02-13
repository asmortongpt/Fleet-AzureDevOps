import dotenv from 'dotenv'
import { Pool } from 'pg'
import * as promClient from 'prom-client'

import { ConnectionError } from '../services/dal/errors'
import { logger } from '../utils/logger'

dotenv.config()

/**
 * P0-5 SECURITY FIX: Prometheus metrics for database connection pool monitoring
 * CRITICAL: Prevents production outages by monitoring pool exhaustion and connection leaks
 */
const poolMetrics = {
  totalConnections: new promClient.Gauge({
    name: 'db_pool_total_connections',
    help: 'Total number of connections in pool',
    labelNames: ['pool_type']
  }),
  idleConnections: new promClient.Gauge({
    name: 'db_pool_idle_connections',
    help: 'Number of idle connections in pool',
    labelNames: ['pool_type']
  }),
  waitingClients: new promClient.Gauge({
    name: 'db_pool_waiting_clients',
    help: 'Number of clients waiting for connection',
    labelNames: ['pool_type']
  }),
  activeConnections: new promClient.Gauge({
    name: 'db_pool_active_connections',
    help: 'Number of active connections in pool',
    labelNames: ['pool_type']
  }),
  utilizationPercentage: new promClient.Gauge({
    name: 'db_pool_utilization_percentage',
    help: 'Pool utilization percentage (active/max)',
    labelNames: ['pool_type']
  }),
  connectionErrors: new promClient.Counter({
    name: 'db_pool_connection_errors_total',
    help: 'Total number of connection errors',
    labelNames: ['pool_type', 'error_type']
  }),
  connectionAcquisitionDuration: new promClient.Histogram({
    name: 'db_pool_connection_acquisition_duration_seconds',
    help: 'Time taken to acquire a connection from the pool',
    labelNames: ['pool_type'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10] // 1ms to 10s
  }),
  queryDuration: new promClient.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query execution time',
    labelNames: ['pool_type', 'query_type'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 5, 10, 30] // 1ms to 30s
  }),
  healthCheckFailures: new promClient.Counter({
    name: 'db_pool_health_check_failures_total',
    help: 'Total number of health check failures',
    labelNames: ['pool_type']
  })
}

/**
 * Pool types for different database access levels
 */
export enum PoolType {
  ADMIN = 'admin',      // Full admin privileges (migrations, schema changes)
  WEBAPP = 'webapp',    // Standard web app user (read/write on app tables)
  READONLY = 'readonly', // Read-only access (reporting, analytics)
  READ_REPLICA = 'read_replica' // Read replica for load distribution
}

/**
 * Connection pool configuration
 */
interface PoolConfiguration {
  // Prefer a single DATABASE_URL when provided (common in PaaS/K8s/12-factor deployments).
  // If present, we rely on the connection string for host/user/db and only override pool/ssl settings.
  connectionString?: string

  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  max: number
  idleTimeoutMillis: number
  connectionTimeoutMillis: number
  ssl: any
}

/**
 * Database SSL configuration helper
 */
function getDatabaseSSLConfig() {
  if (process.env.DATABASE_SSL === 'true') {
    // Production: Enforce certificate validation
    if (process.env.NODE_ENV === 'production') {
      return {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA, // Provide CA certificate in production
      }
    }
    // Development: Allow self-signed certificates
    return { rejectUnauthorized: false }
  }
  return false
}

/**
 * Connection Manager for multiple database pools
 * Manages admin, webapp, and read-only connection pools with health monitoring
 */
export class ConnectionManager {
  private pools: Map<PoolType, Pool> = new Map()
  private healthCheckIntervals: Map<PoolType, NodeJS.Timeout> = new Map()
  private poolConfigs: Map<PoolType, PoolConfiguration> = new Map()
  private initialized: boolean = false
  private metricsInterval: NodeJS.Timeout | null = null // P0-5: Metrics collection interval

  constructor() {
    this.setupConfigurations()
    this.createPools() // Create pools immediately to support DI at module load
    this.startMetricsCollection() // P0-5: Start Prometheus metrics collection
  }

  /**
   * Create pool instances synchronously
   */
  private createPools(): void {
    if (this.pools.size > 0) {
      return;
    }

    for (const [poolType, config] of this.poolConfigs.entries()) {
      try {
        const pool = new Pool(config)
        // Setup pool event handlers
        this.setupPoolEventHandlers(pool, poolType)
        this.pools.set(poolType, pool)
      } catch (error) {
        logger.error(`❌ Failed to create ${poolType} pool:`, error)
      }
    }
  }

  /**
   * Setup configurations for different pool types
   */
  private setupConfigurations(): void {
    const databaseUrl = process.env.DATABASE_URL

    // NOTE: Many parts of this codebase run under different server entrypoints:
    // - "server-simple" (drizzle) relies on DATABASE_URL
    // - the legacy pool manager relied on DB_HOST/DB_NAME/etc.
    // If we don't honor DATABASE_URL, authentication can succeed in one layer while /auth/me fails in another,
    // creating an SSO login loop.
    const baseConfig = databaseUrl
      ? {
          connectionString: databaseUrl,
          ssl: getDatabaseSSLConfig(),
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000
        }
      : {
          host: process.env.DB_HOST || (process.env.NODE_ENV === 'production' ? 'fleet-postgres-service' : 'localhost'),
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'fleetdb',
          ssl: getDatabaseSSLConfig(),
          // TCP keepalive to prevent idle connection timeouts in AKS/Azure Load Balancer
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000
        }

    // Admin pool configuration (for migrations and schema changes)
    this.poolConfigs.set(PoolType.ADMIN, {
      ...baseConfig,
      ...(databaseUrl
        ? {}
        : {
            user: process.env.DB_ADMIN_USER || process.env.DB_USER || 'fleetadmin',
            password: process.env.DB_ADMIN_PASSWORD || process.env.DB_PASSWORD || ''
          }),
      max: parseInt(process.env.DB_ADMIN_POOL_SIZE || '5'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })

    // Web app pool configuration (for normal application operations)
    // PERFORMANCE OPTIMIZED for high-throughput API workloads:
    // - max: 20 connections (balances throughput vs resource usage)
    // - idleTimeout: 30s (releases idle connections to reduce memory)
    // - connectionTimeout: 2s (fast fail for overloaded scenarios)
    this.poolConfigs.set(PoolType.WEBAPP, {
      ...baseConfig,
      ...(databaseUrl
        ? {}
        : {
            user: process.env.DB_WEBAPP_USER || process.env.DB_USER || 'fleetadmin',
            password: process.env.DB_WEBAPP_PASSWORD || process.env.DB_PASSWORD || ''
          }),
      max: parseInt(process.env.DB_WEBAPP_POOL_SIZE || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000')
    })

    // Read-only pool configuration (for reporting and analytics)
    // PERFORMANCE OPTIMIZED for long-running analytical queries:
    // - max: 10 connections (reporting workloads are fewer but longer)
    // - idleTimeout: 60s (keep connections warm for dashboard refreshes)
    // - connectionTimeout: 5s (analytics can tolerate slightly higher latency)
    this.poolConfigs.set(PoolType.READONLY, {
      ...baseConfig,
      ...(databaseUrl
        ? {}
        : {
            user: process.env.DB_READONLY_USER || process.env.DB_USER || 'fleetadmin',
            password: process.env.DB_READONLY_PASSWORD || process.env.DB_PASSWORD || ''
          }),
      max: parseInt(process.env.DB_READONLY_POOL_SIZE || '10'),
      idleTimeoutMillis: parseInt(process.env.DB_READONLY_IDLE_TIMEOUT_MS || '60000'),
      connectionTimeoutMillis: parseInt(process.env.DB_READONLY_CONNECTION_TIMEOUT_MS || '5000')
    })

    // Read replica pool configuration (for distributed read operations)
    // PERFORMANCE OPTIMIZED for high-volume read queries:
    // - max: 50 connections (handle high read throughput)
    // - idleTimeout: 30s (balance between connection reuse and resource conservation)
    // - connectionTimeout: 3s (fast fail for read queries)
    // - Connects to read replica host if configured, otherwise uses main DB
    // Read replicas require host-based configuration. When DATABASE_URL is used, callers should
    // provide a separate DATABASE_URL for the replica and run a distinct ConnectionManager.
    if (!databaseUrl) {
      const readReplicaHost = process.env.DB_READ_REPLICA_HOST || baseConfig.host
      if (readReplicaHost !== baseConfig.host) {
      this.poolConfigs.set(PoolType.READ_REPLICA, {
        ...baseConfig,
        host: readReplicaHost,
        ...(databaseUrl
          ? {}
          : {
              user: process.env.DB_READONLY_USER || process.env.DB_USER || 'fleetadmin',
              password: process.env.DB_READONLY_PASSWORD || process.env.DB_PASSWORD || ''
            }),
        max: parseInt(process.env.DB_READ_REPLICA_POOL_SIZE || '50'),
        idleTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_IDLE_TIMEOUT_MS || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_CONNECTION_TIMEOUT_MS || '3000')
      })
    }
    }
  }

  /**
   * Initialize all connection pools
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Connection manager already initialized')
      return
    }

    logger.info(`Initializing database connection pools...`)

    // Verify connections and start health checks
    for (const [poolType, pool] of this.pools.entries()) {
      try {
        const config = this.poolConfigs.get(poolType)!;

        // Test connection
        await this.testConnection(pool, poolType)

        logger.info(`✅ ${poolType} pool initialized (user: ${config.user}, max: ${config.max})`)

        // Start health check monitoring
        this.startHealthCheck(poolType)
      } catch (error) {
        logger.error(`❌ Failed to initialize ${poolType} pool:`, error)

        // For WEBAPP pool, this is critical - throw error
        if (poolType === PoolType.WEBAPP) {
          throw new ConnectionError(`Failed to initialize webapp pool: ${error}`)
        }

        // For other pools, log warning and continue
        logger.warn(`⚠️  ${poolType} pool not available, falling back to webapp pool`)
      }
    }

    this.initialized = true
  }

  /**
   * P0-5: Start Prometheus metrics collection
   */
  private startMetricsCollection(): void {
    // Update metrics every 10 seconds
    const interval = parseInt(process.env.DB_METRICS_INTERVAL || '10000')

    this.metricsInterval = setInterval(() => {
      this.updatePoolMetrics()
    }, interval)

    logger.info(`[ConnectionManager] Prometheus metrics collection started (interval: ${interval}ms)`)
  }

  /**
   * P0-5: Update Prometheus metrics for all pools
   */
  private updatePoolMetrics(): void {
    for (const [poolType, pool] of this.pools.entries()) {
      const config = this.poolConfigs.get(poolType)
      if (!config) continue

      const totalCount = pool.totalCount
      const idleCount = pool.idleCount
      const waitingCount = pool.waitingCount
      const activeCount = totalCount - idleCount
      const utilization = (activeCount / config.max) * 100

      // Update Prometheus gauges
      poolMetrics.totalConnections.set({ pool_type: poolType }, totalCount)
      poolMetrics.idleConnections.set({ pool_type: poolType }, idleCount)
      poolMetrics.waitingClients.set({ pool_type: poolType }, waitingCount)
      poolMetrics.activeConnections.set({ pool_type: poolType }, activeCount)
      poolMetrics.utilizationPercentage.set({ pool_type: poolType }, utilization)

      // P0-5: Alert on high utilization
      if (utilization > 80) {
        logger.warn(
          `[ConnectionManager] HIGH UTILIZATION WARNING: ${poolType} pool at ${utilization.toFixed(1)}% ` +
          `(${activeCount}/${config.max} connections in use)`
        )
      }

      // P0-5: Alert on waiting clients (connection pool exhaustion)
      if (waitingCount > 0) {
        logger.error(
          `[ConnectionManager] POOL EXHAUSTION: ${poolType} has ${waitingCount} clients waiting for connections!`
        )
        poolMetrics.connectionErrors.inc({
          pool_type: poolType,
          error_type: 'pool_exhaustion'
        })
      }

      // P0-5: Alert on near-capacity
      if (waitingCount > 5 || utilization > 90) {
        logger.error(
          `[ConnectionManager] CRITICAL: ${poolType} pool near capacity - ` +
          `waiting: ${waitingCount}, utilization: ${utilization.toFixed(1)}%`
        )
      }
    }
  }

  /**
   * Setup event handlers for a pool
   */
  private setupPoolEventHandlers(pool: Pool, poolType: PoolType): void {
    pool.on(`connect`, (client) => {
      logger.info(`[${poolType}] Database connection established`)
    })

    pool.on(`acquire`, (client) => {
      // Client acquired from pool
    })

    pool.on(`remove`, (client) => {
      logger.info(`[${poolType}] Client removed from pool`)
    })

    pool.on(`error`, (err, client) => {
      logger.error(`[${poolType}] Database pool error:`, err)
      // P0-5: Track errors in Prometheus
      poolMetrics.connectionErrors.inc({
        pool_type: poolType,
        error_type: err.name || 'unknown'
      })
    })
  }

  /**
   * Test database connection
   */
  private async testConnection(pool: Pool, poolType: PoolType): Promise<void> {
    try {
      const client = await pool.connect()
      const result = await client.query(`SELECT NOW() as now, current_user, version()`)
      logger.info(`[${poolType}] Connection test successful:`, {
        user: result.rows[0].current_user,
        timestamp: result.rows[0].now
      })
      client.release()
    } catch (error) {
      throw new ConnectionError(`Connection test failed for ${poolType}: ${error}`)
    }
  }

  /**
   * Get a pool by type with fallback logic
   */
  getPool(poolType: PoolType = PoolType.WEBAPP): Pool {
    // If pools are created, we can return them even if not fully "initialized" (verified)
    // This supports dependency injection during module loading
    if (this.pools.size === 0) {
      this.createPools(); // Fallback if somehow called before constructor finished?
    }

    // Try to get requested pool
    let pool = this.pools.get(poolType)

    if (!pool) {
      logger.warn(`Pool ${poolType} not available, falling back to webapp pool`)
      pool = this.pools.get(PoolType.WEBAPP)
    }

    if (!pool) {
      throw new ConnectionError(`No database pools available`)
    }

    return pool
  }

  /**
   * Get pool for read operations (uses read replica if available, falls back to readonly, then webapp)
   * This method intelligently routes read queries to the best available pool
   */
  getReadPool(): Pool {
    // Priority: READ_REPLICA > READONLY > WEBAPP
    const readReplicaPool = this.pools.get(PoolType.READ_REPLICA)
    if (readReplicaPool) {
      return readReplicaPool
    }

    const readOnlyPool = this.pools.get(PoolType.READONLY)
    if (readOnlyPool) {
      return readOnlyPool
    }

    return this.getPool(PoolType.WEBAPP)
  }

  /**
   * Get pool for write operations (uses webapp pool)
   */
  getWritePool(): Pool {
    return this.getPool(PoolType.WEBAPP)
  }

  /**
   * Get pool for admin operations (uses admin pool)
   */
  getAdminPool(): Pool {
    return this.getPool(PoolType.ADMIN)
  }

  /**
   * P0-5: Instrumented connection acquisition with timing metrics
   */
  async getConnection(poolType: PoolType = PoolType.WEBAPP): Promise<any> {
    const startTime = Date.now()
    const pool = this.getPool(poolType)

    try {
      const client = await pool.connect()
      const acquisitionTime = (Date.now() - startTime) / 1000 // Convert to seconds

      // P0-5: Record connection acquisition time
      poolMetrics.connectionAcquisitionDuration.observe(
        { pool_type: poolType },
        acquisitionTime
      )

      // P0-5: Warn on slow connection acquisition
      if (acquisitionTime > 1.0) {
        logger.warn(
          `[ConnectionManager] SLOW CONNECTION ACQUISITION: ${poolType} took ${acquisitionTime.toFixed(3)}s ` +
          `(pool stats: total=${pool.totalCount}, idle=${pool.idleCount}, waiting=${pool.waitingCount})`
        )
      }

      return client
    } catch (error) {
      // P0-5: Track connection errors
      poolMetrics.connectionErrors.inc({
        pool_type: poolType,
        error_type: 'connection_failed'
      })
      throw error
    }
  }

  /**
   * Start health check monitoring for a pool
   */
  private startHealthCheck(poolType: PoolType): void {
    const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000') // Default 60 seconds

    const healthCheckInterval = setInterval(async () => {
      const pool = this.pools.get(poolType)
      if (!pool) {
        return
      }

      let client;
      try {
        client = await pool.connect()
        await client.query(`SELECT 1`)
      } catch (error) {
        logger.error(`[${poolType}] Health check failed:`, error)
        // P0-5: Track health check failures
        poolMetrics.healthCheckFailures.inc({ pool_type: poolType })
      } finally {
        if (client) {
          try {
            client.release()
          } catch (releaseError) {
            logger.error(`[${poolType}] Error releasing client:`, releaseError)
          }
        }
      }
    }, interval)

    this.healthCheckIntervals.set(poolType, healthCheckInterval)
  }

  /**
   * Get health status of all pools
   */
  async getHealthStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {}

    for (const [poolType, pool] of this.pools.entries()) {
      try {
        const client = await pool.connect()
        const result = await client.query(`SELECT NOW() as timestamp, current_user`)
        client.release()

        status[poolType] = {
          healthy: true,
          user: result.rows[0].current_user,
          timestamp: result.rows[0].timestamp,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        }
      } catch (error: unknown) {
        status[poolType] = {
          healthy: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
    }

    return status
  }

  /**
   * Get pool statistics
   */
  getPoolStats(poolType: PoolType): {
    totalCount: number
    idleCount: number
    waitingCount: number
  } | null {
    const pool = this.pools.get(poolType)
    if (!pool) {
      return null
    }

    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    }
  }

  /**
   * Get all pool statistics
   */
  getAllPoolStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    for (const poolType of this.pools.keys()) {
      stats[poolType] = this.getPoolStats(poolType)
    }

    return stats
  }

  /**
   * Check replica lag for read replica
   * Returns lag in milliseconds, or null if not a replica or check fails
   */
  async getReplicaLag(): Promise<number | null> {
    const replicaPool = this.pools.get(PoolType.READ_REPLICA)
    if (!replicaPool) {
      return null
    }

    try {
      const client = await replicaPool.connect()

      // PostgreSQL-specific replica lag check
      const result = await client.query(`
        SELECT
          CASE
            WHEN pg_is_in_recovery() THEN
              EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::INTEGER * 1000
            ELSE
              0
          END as lag_ms
      `)

      client.release()
      return result.rows[0]?.lag_ms || 0
    } catch (error) {
      logger.error('[READ_REPLICA] Failed to check replica lag:', error)
      return null
    }
  }

  /**
   * Get connection leak detection info
   * Identifies connections that have been checked out for too long
   */
  async detectConnectionLeaks(maxConnectionAgeMs: number = 60000): Promise<Record<string, any>> {
    const leaks: Record<string, any> = {}

    for (const [poolType, pool] of this.pools.entries()) {
      const activeConnections = pool.totalCount - pool.idleCount
      const waitingClients = pool.waitingCount

      if (activeConnections > 0 || waitingClients > 0) {
        leaks[poolType] = {
          activeConnections,
          waitingClients,
          potentialLeak: activeConnections > (this.poolConfigs.get(poolType)?.max || 0) * 0.8,
          warning: waitingClients > 0 ? 'Clients are waiting for connections' : null
        }
      }
    }

    return leaks
  }

  /**
   * Get enhanced pool diagnostics for performance monitoring
   */
  async getPoolDiagnostics(): Promise<Record<string, any>> {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      pools: {},
      replicaLag: await this.getReplicaLag(),
      connectionLeaks: await this.detectConnectionLeaks()
    }

    for (const [poolType, pool] of this.pools.entries()) {
      const config = this.poolConfigs.get(poolType)

      diagnostics.pools[poolType] = {
        config: {
          max: config?.max,
          idleTimeoutMillis: config?.idleTimeoutMillis,
          connectionTimeoutMillis: config?.connectionTimeoutMillis
        },
        stats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
          activeCount: pool.totalCount - pool.idleCount
        },
        utilization: {
          percentage: ((pool.totalCount - pool.idleCount) / (config?.max || 1) * 100).toFixed(2) + `%`,
          available: pool.idleCount,
          inUse: pool.totalCount - pool.idleCount
        },
        health: {
          hasWaitingClients: pool.waitingCount > 0,
          nearCapacity: (pool.totalCount / (config?.max || 1)) > 0.8,
          hasIdleConnections: pool.idleCount > 0
        }
      }
    }

    return diagnostics
  }

  /**
   * Close all connection pools
   */
  async closeAll(): Promise<void> {
    logger.info(`Closing all database connection pools...`)

    // P0-5: Clear metrics collection interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }

    // Clear health check intervals
    for (const [poolType, interval] of this.healthCheckIntervals.entries()) {
      clearInterval(interval)
    }
    this.healthCheckIntervals.clear()

    // Close all pools
    const closePromises: Promise<void>[] = []

    for (const [poolType, pool] of this.pools.entries()) {
      closePromises.push(
        pool.end().then(() => {
          logger.info(`✅ ${poolType} pool closed`)
        }).catch((error) => {
          logger.error(`❌ Error closing ${poolType} pool:`, error)
        })
      )
    }

    await Promise.all(closePromises)
    this.pools.clear()
    this.initialized = false
    logger.info(`All database pools closed`)
  }

  /**
   * P0-5: Get Prometheus metrics registry
   * Use this to expose metrics at /metrics endpoint
   */
  getMetricsRegistry(): typeof promClient.register {
    return promClient.register
  }

  /**
   * P0-5: Get formatted metrics for Prometheus scraping
   */
  async getMetrics(): Promise<string> {
    // Update metrics one final time before returning
    this.updatePoolMetrics()
    return promClient.register.metrics()
  }

  /**
   * Graceful shutdown handler
   */
  setupGracefulShutdown(): void {
    const shutdown = async () => {
      logger.info(`Received shutdown signal, closing database connections...`)
      await this.closeAll()
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager()

// Initialize on module load (async)
// Note: You should call this explicitly in your app startup
export async function initializeConnectionManager(): Promise<void> {
  await connectionManager.initialize()
  connectionManager.setupGracefulShutdown()
}

/**
 * Get the default pool for backward compatibility
 * This is a function to avoid calling getPool() during module initialization
 *
 * DEPRECATED: Use connectionManager.getWritePool() for new code
 */
export function getDefaultPool(): Pool {
  return connectionManager.getPool(PoolType.WEBAPP)
}

export default connectionManager
