import { Pool, PoolConfig } from 'pg'
import dotenv from 'dotenv'
import { ConnectionError } from '../services/dal/errors'

dotenv.config()

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
  host: string
  port: number
  database: string
  user: string
  password: string
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

  constructor() {
    this.setupConfigurations()
  }

  /**
   * Setup configurations for different pool types
   */
  private setupConfigurations(): void {
    const baseConfig = {
      host: process.env.DB_HOST || 'fleet-postgres-service',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleetdb',
      ssl: getDatabaseSSLConfig()
    }

    // Admin pool configuration (for migrations and schema changes)
    this.poolConfigs.set(PoolType.ADMIN, {
      ...baseConfig,
      user: process.env.DB_ADMIN_USER || process.env.DB_USER || 'fleetadmin',
      password: process.env.DB_ADMIN_PASSWORD || process.env.DB_PASSWORD || '',
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
      user: process.env.DB_WEBAPP_USER || process.env.DB_USER || 'fleetadmin',
      password: process.env.DB_WEBAPP_PASSWORD || process.env.DB_PASSWORD || '',
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
      user: process.env.DB_READONLY_USER || process.env.DB_USER || 'fleetadmin',
      password: process.env.DB_READONLY_PASSWORD || process.env.DB_PASSWORD || '',
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
    const readReplicaHost = process.env.DB_READ_REPLICA_HOST || baseConfig.host
    if (readReplicaHost !== baseConfig.host) {
      this.poolConfigs.set(PoolType.READ_REPLICA, {
        ...baseConfig,
        host: readReplicaHost,
        user: process.env.DB_READONLY_USER || process.env.DB_USER || 'fleetadmin',
        password: process.env.DB_READONLY_PASSWORD || process.env.DB_PASSWORD || '',
        max: parseInt(process.env.DB_READ_REPLICA_POOL_SIZE || '50'),
        idleTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_IDLE_TIMEOUT_MS || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_CONNECTION_TIMEOUT_MS || '3000')
      })
    }
  }

  /**
   * Initialize all connection pools
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Connection manager already initialized')
      return
    }

    console.log('Initializing database connection pools...')

    // Create pools based on available configurations
    for (const [poolType, config] of this.poolConfigs.entries()) {
      try {
        const pool = new Pool(config)

        // Setup pool event handlers
        this.setupPoolEventHandlers(pool, poolType)

        // Test connection
        await this.testConnection(pool, poolType)

        this.pools.set(poolType, pool)
        console.log(`✅ ${poolType} pool initialized (user: ${config.user}, max: ${config.max})`)

        // Start health check monitoring
        this.startHealthCheck(poolType)
      } catch (error) {
        console.error(`❌ Failed to initialize ${poolType} pool:`, error)

        // For WEBAPP pool, this is critical - throw error
        if (poolType === PoolType.WEBAPP) {
          throw new ConnectionError(`Failed to initialize webapp pool: ${error}`)
        }

        // For other pools, log warning and continue
        console.warn(`⚠️  ${poolType} pool not available, falling back to webapp pool`)
      }
    }

    this.initialized = true
  }

  /**
   * Setup event handlers for a pool
   */
  private setupPoolEventHandlers(pool: Pool, poolType: PoolType): void {
    pool.on('connect', (client) => {
      console.log(`[${poolType}] Database connection established`)
    })

    pool.on('acquire', (client) => {
      // Client acquired from pool
    })

    pool.on('remove', (client) => {
      console.log(`[${poolType}] Client removed from pool`)
    })

    pool.on('error', (err, client) => {
      console.error(`[${poolType}] Database pool error:`, err)
    })
  }

  /**
   * Test database connection
   */
  private async testConnection(pool: Pool, poolType: PoolType): Promise<void> {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT NOW() as now, current_user, version()')
      console.log(`[${poolType}] Connection test successful:`, {
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
    if (!this.initialized) {
      throw new ConnectionError('Connection manager not initialized. Call initialize() first.')
    }

    // Try to get requested pool
    let pool = this.pools.get(poolType)

    if (!pool) {
      console.warn(`Pool ${poolType} not available, falling back to webapp pool`)
      pool = this.pools.get(PoolType.WEBAPP)
    }

    if (!pool) {
      throw new ConnectionError('No database pools available')
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
   * Start health check monitoring for a pool
   */
  private startHealthCheck(poolType: PoolType): void {
    const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000') // Default 60 seconds

    const healthCheckInterval = setInterval(async () => {
      const pool = this.pools.get(poolType)
      if (!pool) return

      try {
        const client = await pool.connect()
        await client.query('SELECT 1')
        client.release()
      } catch (error) {
        console.error(`[${poolType}] Health check failed:`, error)
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
        const result = await client.query('SELECT NOW() as timestamp, current_user')
        client.release()

        status[poolType] = {
          healthy: true,
          user: result.rows[0].current_user,
          timestamp: result.rows[0].timestamp,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        }
      } catch (error: any) {
        status[poolType] = {
          healthy: false,
          error: error.message
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
    if (!pool) return null

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
      console.error('[READ_REPLICA] Failed to check replica lag:', error)
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
          percentage: ((pool.totalCount - pool.idleCount) / (config?.max || 1) * 100).toFixed(2) + '%',
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
    console.log('Closing all database connection pools...')

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
          console.log(`✅ ${poolType} pool closed`)
        }).catch((error) => {
          console.error(`❌ Error closing ${poolType} pool:`, error)
        })
      )
    }

    await Promise.all(closePromises)
    this.pools.clear()
    this.initialized = false
    console.log('All database pools closed')
  }

  /**
   * Graceful shutdown handler
   */
  setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('Received shutdown signal, closing database connections...')
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
