/**
 * Database Connection Pool Manager
 *
 * Provides robust connection pool management with:
 * - Lazy initialization (don't connect until first query)
 * - Graceful shutdown handling on SIGTERM/SIGINT
 * - Automatic reconnection with exponential backoff
 * - Connection pool configuration optimized for production
 *
 * @module database/connectionManager
 */

import { Pool, PoolConfig, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Pool types for different database access levels
 */
export enum PoolType {
  ADMIN = 'admin',
  WEBAPP = 'webapp',
  READONLY = 'readonly',
  READ_REPLICA = 'read_replica'
}

/**
 * Connection pool configuration interface
 */
interface PoolConfiguration extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl: boolean | { rejectUnauthorized: boolean; ca?: string };
}

/**
 * Pool state tracking
 */
interface PoolState {
  pool: Pool | null;
  config: PoolConfiguration;
  initialized: boolean;
  lastError: Error | null;
  lastErrorTime: Date | null;
  reconnectAttempts: number;
  isReconnecting: boolean;
}

/**
 * Exponential backoff configuration
 */
interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
  multiplier: number;
}

/**
 * Database SSL configuration helper
 */
function getDatabaseSSLConfig(): boolean | { rejectUnauthorized: boolean; ca?: string } {
  if (process.env.DATABASE_SSL === 'true') {
    if (process.env.NODE_ENV === 'production') {
      return {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA
      };
    }
    return { rejectUnauthorized: false };
  }
  return false;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: BackoffConfig): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(config.multiplier, attempt),
    config.maxDelayMs
  );
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Sleep utility for async/await
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced Connection Manager with lazy initialization and exponential backoff
 *
 * Features:
 * - Lazy pool initialization (pools created on first use)
 * - Automatic reconnection with exponential backoff
 * - Graceful shutdown with active query waiting
 * - Health monitoring and metrics
 */
export class DatabaseConnectionManager {
  private poolStates: Map<PoolType, PoolState> = new Map();
  private healthCheckIntervals: Map<PoolType, NodeJS.Timeout> = new Map();
  private shutdownInProgress: boolean = false;
  private activeQueries: number = 0;
  private shutdownHandlersRegistered: boolean = false;

  private readonly backoffConfig: BackoffConfig = {
    baseDelayMs: parseInt(process.env.DB_RECONNECT_BASE_DELAY_MS || '1000'),
    maxDelayMs: parseInt(process.env.DB_RECONNECT_MAX_DELAY_MS || '30000'),
    maxAttempts: parseInt(process.env.DB_RECONNECT_MAX_ATTEMPTS || '10'),
    multiplier: parseFloat(process.env.DB_RECONNECT_MULTIPLIER || '2')
  };

  private readonly shutdownConfig = {
    maxWaitMs: parseInt(process.env.DB_SHUTDOWN_WAIT_MS || '30000'),
    checkIntervalMs: 500
  };

  constructor() {
    this.setupConfigurations();
  }

  /**
   * Setup configurations for different pool types
   */
  private setupConfigurations(): void {
    const baseConfig = {
      host: process.env.DB_HOST || 'fleet-postgres-service',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleetdb',
      ssl: getDatabaseSSLConfig(),
      // TCP keepalive to prevent idle connection timeouts in AKS/Azure Load Balancer
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // Start keepalive after 10 seconds of idle
    };

    // Admin pool configuration (for migrations and schema changes)
    this.poolStates.set(PoolType.ADMIN, {
      pool: null,
      config: {
        ...baseConfig,
        user: process.env.DB_ADMIN_USER || process.env.DB_USER || 'fleetadmin',
        password: process.env.DB_ADMIN_PASSWORD || process.env.DB_PASSWORD || '',
        max: parseInt(process.env.DB_ADMIN_POOL_SIZE || '5'),
        min: parseInt(process.env.DB_ADMIN_POOL_MIN || '1'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      },
      initialized: false,
      lastError: null,
      lastErrorTime: null,
      reconnectAttempts: 0,
      isReconnecting: false
    });

    // Web app pool configuration (for normal application operations)
    // PRODUCTION OPTIMIZED: 20 max connections, 5 min, proper timeouts
    this.poolStates.set(PoolType.WEBAPP, {
      pool: null,
      config: {
        ...baseConfig,
        user: process.env.DB_WEBAPP_USER || process.env.DB_USER || 'fleetadmin',
        password: process.env.DB_WEBAPP_PASSWORD || process.env.DB_PASSWORD || '',
        max: parseInt(process.env.DB_WEBAPP_POOL_SIZE || '20'),
        min: parseInt(process.env.DB_WEBAPP_POOL_MIN || '5'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '10000')
      },
      initialized: false,
      lastError: null,
      lastErrorTime: null,
      reconnectAttempts: 0,
      isReconnecting: false
    });

    // Read-only pool configuration (for reporting and analytics)
    this.poolStates.set(PoolType.READONLY, {
      pool: null,
      config: {
        ...baseConfig,
        user: process.env.DB_READONLY_USER || process.env.DB_USER || 'fleetadmin',
        password: process.env.DB_READONLY_PASSWORD || process.env.DB_PASSWORD || '',
        max: parseInt(process.env.DB_READONLY_POOL_SIZE || '10'),
        min: parseInt(process.env.DB_READONLY_POOL_MIN || '2'),
        idleTimeoutMillis: parseInt(process.env.DB_READONLY_IDLE_TIMEOUT_MS || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_READONLY_CONNECTION_TIMEOUT_MS || '10000')
      },
      initialized: false,
      lastError: null,
      lastErrorTime: null,
      reconnectAttempts: 0,
      isReconnecting: false
    });

    // Read replica pool configuration (if configured)
    const readReplicaHost = process.env.DB_READ_REPLICA_HOST;
    if (readReplicaHost && readReplicaHost !== baseConfig.host) {
      this.poolStates.set(PoolType.READ_REPLICA, {
        pool: null,
        config: {
          ...baseConfig,
          host: readReplicaHost,
          user: process.env.DB_READONLY_USER || process.env.DB_USER || 'fleetadmin',
          password: process.env.DB_READONLY_PASSWORD || process.env.DB_PASSWORD || '',
          max: parseInt(process.env.DB_READ_REPLICA_POOL_SIZE || '50'),
          min: parseInt(process.env.DB_READ_REPLICA_POOL_MIN || '5'),
          idleTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_IDLE_TIMEOUT_MS || '30000'),
          connectionTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_CONNECTION_TIMEOUT_MS || '10000')
        },
        initialized: false,
        lastError: null,
        lastErrorTime: null,
        reconnectAttempts: 0,
        isReconnecting: false
      });
    }
  }

  /**
   * Lazy initialization of a connection pool
   * Only connects when first query is made
   */
  private async initializePool(poolType: PoolType): Promise<Pool> {
    const state = this.poolStates.get(poolType);
    if (!state) {
      throw new Error(`Unknown pool type: ${poolType}`);
    }

    if (state.pool && state.initialized) {
      return state.pool;
    }

    if (state.isReconnecting) {
      // Wait for reconnection to complete
      while (state.isReconnecting) {
        await sleep(100);
      }
      if (state.pool) {
        return state.pool;
      }
    }

    console.log(`[${poolType}] Lazy initializing connection pool...`);

    try {
      const pool = new Pool(state.config);
      this.setupPoolEventHandlers(pool, poolType);

      // Test the connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      state.pool = pool;
      state.initialized = true;
      state.reconnectAttempts = 0;
      state.lastError = null;

      console.log(`[${poolType}] Pool initialized (max: ${state.config.max}, min: ${state.config.min})`);

      // Start health check for this pool
      this.startHealthCheck(poolType);

      return pool;
    } catch (error) {
      state.lastError = error as Error;
      state.lastErrorTime = new Date();
      console.error(`[${poolType}] Failed to initialize pool:`, error);
      throw error;
    }
  }

  /**
   * Setup event handlers for a pool
   */
  private setupPoolEventHandlers(pool: Pool, poolType: PoolType): void {
    pool.on('connect', () => {
      console.log(`[${poolType}] New connection established`);
    });

    pool.on('acquire', () => {
      this.activeQueries++;
    });

    pool.on('release', () => {
      this.activeQueries = Math.max(0, this.activeQueries - 1);
    });

    pool.on('remove', () => {
      console.log(`[${poolType}] Connection removed from pool`);
    });

    pool.on('error', async (err) => {
      console.error(`[${poolType}] Pool error:`, err);
      const state = this.poolStates.get(poolType);
      if (state) {
        state.lastError = err;
        state.lastErrorTime = new Date();
      }

      // Attempt reconnection for critical pools
      if (poolType === PoolType.WEBAPP && !this.shutdownInProgress) {
        await this.attemptReconnection(poolType);
      }
    });
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private async attemptReconnection(poolType: PoolType): Promise<void> {
    const state = this.poolStates.get(poolType);
    if (!state || state.isReconnecting || this.shutdownInProgress) {
      return;
    }

    state.isReconnecting = true;
    console.log(`[${poolType}] Starting reconnection with exponential backoff...`);

    try {
      // Close existing pool if any
      if (state.pool) {
        try {
          await state.pool.end();
        } catch (e) {
          // Ignore close errors
        }
        state.pool = null;
        state.initialized = false;
      }

      // Attempt reconnection with exponential backoff
      for (let attempt = 0; attempt < this.backoffConfig.maxAttempts; attempt++) {
        if (this.shutdownInProgress) {
          console.log(`[${poolType}] Shutdown in progress, aborting reconnection`);
          break;
        }

        state.reconnectAttempts = attempt + 1;
        const delay = calculateBackoffDelay(attempt, this.backoffConfig);

        console.log(`[${poolType}] Reconnection attempt ${attempt + 1}/${this.backoffConfig.maxAttempts} in ${delay}ms`);
        await sleep(delay);

        try {
          const pool = new Pool(state.config);
          this.setupPoolEventHandlers(pool, poolType);

          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();

          state.pool = pool;
          state.initialized = true;
          state.lastError = null;
          state.reconnectAttempts = 0;

          console.log(`[${poolType}] Reconnection successful after ${attempt + 1} attempts`);
          return;
        } catch (error) {
          console.error(`[${poolType}] Reconnection attempt ${attempt + 1} failed:`, error);
          state.lastError = error as Error;
          state.lastErrorTime = new Date();
        }
      }

      console.error(`[${poolType}] All reconnection attempts exhausted`);
    } finally {
      state.isReconnecting = false;
    }
  }

  /**
   * Start health check monitoring for a pool
   */
  private startHealthCheck(poolType: PoolType): void {
    // Clear existing interval if any
    const existingInterval = this.healthCheckIntervals.get(poolType);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000');

    const healthCheckInterval = setInterval(async () => {
      if (this.shutdownInProgress) {
        return;
      }

      const state = this.poolStates.get(poolType);
      if (!state || !state.pool) {
        return;
      }

      try {
        const client = await state.pool.connect();
        await client.query('SELECT 1');
        client.release();
      } catch (error) {
        console.error(`[${poolType}] Health check failed:`, error);
        state.lastError = error as Error;
        state.lastErrorTime = new Date();

        // Trigger reconnection for webapp pool
        if (poolType === PoolType.WEBAPP) {
          this.attemptReconnection(poolType);
        }
      }
    }, interval);

    this.healthCheckIntervals.set(poolType, healthCheckInterval);
  }

  /**
   * Get a pool by type with lazy initialization
   */
  async getPool(poolType: PoolType = PoolType.WEBAPP): Promise<Pool> {
    if (this.shutdownInProgress) {
      throw new Error('Database connection manager is shutting down');
    }

    return this.initializePool(poolType);
  }

  /**
   * Get pool for read operations
   */
  async getReadPool(): Promise<Pool> {
    // Priority: READ_REPLICA > READONLY > WEBAPP
    if (this.poolStates.has(PoolType.READ_REPLICA)) {
      try {
        return await this.getPool(PoolType.READ_REPLICA);
      } catch (error) {
        console.warn('[READ_REPLICA] Failed, falling back to READONLY');
      }
    }

    try {
      return await this.getPool(PoolType.READONLY);
    } catch (error) {
      console.warn('[READONLY] Failed, falling back to WEBAPP');
      return this.getPool(PoolType.WEBAPP);
    }
  }

  /**
   * Get pool for write operations
   */
  async getWritePool(): Promise<Pool> {
    return this.getPool(PoolType.WEBAPP);
  }

  /**
   * Get pool for admin operations
   */
  async getAdminPool(): Promise<Pool> {
    return this.getPool(PoolType.ADMIN);
  }

  /**
   * Get synchronous pool access (for backward compatibility)
   * Will throw if pool not initialized
   */
  getPoolSync(poolType: PoolType = PoolType.WEBAPP): Pool {
    const state = this.poolStates.get(poolType);
    if (!state || !state.pool || !state.initialized) {
      throw new Error(`Pool ${poolType} not initialized. Use getPool() for lazy initialization.`);
    }
    return state.pool;
  }

  /**
   * Get pool statistics
   */
  getPoolStats(poolType: PoolType): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    activeCount: number;
    maxConnections: number;
    minConnections: number;
  } | null {
    const state = this.poolStates.get(poolType);
    if (!state || !state.pool) {
      return null;
    }

    return {
      totalCount: state.pool.totalCount,
      idleCount: state.pool.idleCount,
      waitingCount: state.pool.waitingCount,
      activeCount: state.pool.totalCount - state.pool.idleCount,
      maxConnections: state.config.max,
      minConnections: state.config.min
    };
  }

  /**
   * Get all pool statistics
   */
  getAllPoolStats(): Record<string, ReturnType<typeof this.getPoolStats>> {
    const stats: Record<string, ReturnType<typeof this.getPoolStats>> = {};
    Array.from(this.poolStates.keys()).forEach(poolType => {
      stats[poolType] = this.getPoolStats(poolType);
    });
    return stats;
  }

  /**
   * Get health status of all pools
   */
  async getHealthStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    for (const entry of Array.from(this.poolStates.entries())) {
      const [poolType, state] = entry;
      if (!state.pool || !state.initialized) {
        status[poolType] = {
          healthy: false,
          initialized: false,
          lastError: state.lastError?.message || null,
          lastErrorTime: state.lastErrorTime?.toISOString() || null
        };
        continue;
      }

      try {
        const client = await state.pool.connect();
        const result = await client.query('SELECT NOW() as timestamp, current_user');
        client.release();

        status[poolType] = {
          healthy: true,
          initialized: true,
          user: result.rows[0].current_user,
          timestamp: result.rows[0].timestamp,
          stats: this.getPoolStats(poolType),
          lastError: null,
          reconnectAttempts: state.reconnectAttempts
        };
      } catch (error: any) {
        status[poolType] = {
          healthy: false,
          initialized: state.initialized,
          error: error.message,
          lastError: state.lastError?.message || null,
          lastErrorTime: state.lastErrorTime?.toISOString() || null,
          reconnectAttempts: state.reconnectAttempts
        };
      }
    }

    return status;
  }

  /**
   * Get active query count
   */
  getActiveQueryCount(): number {
    return this.activeQueries;
  }

  /**
   * Graceful shutdown with waiting for active queries
   */
  async gracefulShutdown(): Promise<void> {
    if (this.shutdownInProgress) {
      console.log('Shutdown already in progress');
      return;
    }

    this.shutdownInProgress = true;
    console.log('[ConnectionManager] Initiating graceful shutdown...');

    // Clear all health check intervals
    Array.from(this.healthCheckIntervals.entries()).forEach(([poolType, interval]) => {
      clearInterval(interval);
      console.log(`[${poolType}] Health check stopped`);
    });
    this.healthCheckIntervals.clear();

    // Wait for active queries to complete
    const startTime = Date.now();
    while (this.activeQueries > 0) {
      const elapsed = Date.now() - startTime;
      if (elapsed >= this.shutdownConfig.maxWaitMs) {
        console.warn(`[ConnectionManager] Timeout waiting for ${this.activeQueries} active queries`);
        break;
      }

      console.log(`[ConnectionManager] Waiting for ${this.activeQueries} active queries (${Math.floor(elapsed / 1000)}s)`);
      await sleep(this.shutdownConfig.checkIntervalMs);
    }

    // Close all pools
    const closePromises: Promise<void>[] = [];

    Array.from(this.poolStates.entries()).forEach(([poolType, state]) => {
      if (state.pool) {
        closePromises.push(
          state.pool.end()
            .then(() => {
              console.log(`[${poolType}] Pool closed successfully`);
              state.pool = null;
              state.initialized = false;
            })
            .catch((error) => {
              console.error(`[${poolType}] Error closing pool:`, error);
            })
        );
      }
    });

    await Promise.all(closePromises);
    console.log('[ConnectionManager] All pools closed. Shutdown complete.');
  }

  /**
   * Setup graceful shutdown handlers for SIGTERM and SIGINT
   */
  setupGracefulShutdown(): void {
    if (this.shutdownHandlersRegistered) {
      console.warn('Shutdown handlers already registered');
      return;
    }

    const shutdown = async (signal: string) => {
      console.log(`[ConnectionManager] Received ${signal} signal`);
      await this.gracefulShutdown();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    this.shutdownHandlersRegistered = true;
    console.log('[ConnectionManager] Graceful shutdown handlers registered');
  }

  /**
   * Check if shutdown is in progress
   */
  isShuttingDown(): boolean {
    return this.shutdownInProgress;
  }
}

// Singleton instance
export const databaseConnectionManager = new DatabaseConnectionManager();

/**
 * Initialize the database connection manager
 * Call this during application startup
 */
export async function initializeDatabaseManager(): Promise<void> {
  console.log('[DatabaseConnectionManager] Setting up graceful shutdown handlers...');
  databaseConnectionManager.setupGracefulShutdown();

  // Pre-initialize the webapp pool (optional - for faster first query)
  if (process.env.DB_EAGER_INIT === 'true') {
    console.log('[DatabaseConnectionManager] Eager initialization enabled, connecting webapp pool...');
    await databaseConnectionManager.getWritePool();
  } else {
    console.log('[DatabaseConnectionManager] Lazy initialization enabled, pools will connect on first use');
  }
}

export default databaseConnectionManager;
