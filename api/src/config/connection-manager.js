"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = exports.ConnectionManager = exports.PoolType = void 0;
exports.initializeConnectionManager = initializeConnectionManager;
exports.getDefaultPool = getDefaultPool;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const errors_1 = require("../services/dal/errors");
dotenv_1.default.config();
/**
 * Pool types for different database access levels
 */
var PoolType;
(function (PoolType) {
    PoolType["ADMIN"] = "admin";
    PoolType["WEBAPP"] = "webapp";
    PoolType["READONLY"] = "readonly";
    PoolType["READ_REPLICA"] = "read_replica"; // Read replica for load distribution
})(PoolType || (exports.PoolType = PoolType = {}));
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
            };
        }
        // Development: Allow self-signed certificates
        return { rejectUnauthorized: false };
    }
    return false;
}
/**
 * Connection Manager for multiple database pools
 * Manages admin, webapp, and read-only connection pools with health monitoring
 */
class ConnectionManager {
    pools = new Map();
    healthCheckIntervals = new Map();
    poolConfigs = new Map();
    initialized = false;
    constructor() {
        this.setupConfigurations();
    }
    /**
     * Setup configurations for different pool types
     */
    setupConfigurations() {
        const baseConfig = {
            host: process.env.DB_HOST || 'fleet-postgres-service',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'fleetdb',
            ssl: getDatabaseSSLConfig(),
            // TCP keepalive to prevent idle connection timeouts in AKS/Azure Load Balancer
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000
        };
        // Admin pool configuration (for migrations and schema changes)
        this.poolConfigs.set(PoolType.ADMIN, {
            ...baseConfig,
            user: process.env.DB_ADMIN_USER || process.env.DB_USER || 'fleetadmin',
            password: process.env.DB_ADMIN_PASSWORD || process.env.DB_PASSWORD || '',
            max: parseInt(process.env.DB_ADMIN_POOL_SIZE || '5'),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });
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
        });
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
        });
        // Read replica pool configuration (for distributed read operations)
        // PERFORMANCE OPTIMIZED for high-volume read queries:
        // - max: 50 connections (handle high read throughput)
        // - idleTimeout: 30s (balance between connection reuse and resource conservation)
        // - connectionTimeout: 3s (fast fail for read queries)
        // - Connects to read replica host if configured, otherwise uses main DB
        const readReplicaHost = process.env.DB_READ_REPLICA_HOST || baseConfig.host;
        if (readReplicaHost !== baseConfig.host) {
            this.poolConfigs.set(PoolType.READ_REPLICA, {
                ...baseConfig,
                host: readReplicaHost,
                user: process.env.DB_READONLY_USER || process.env.DB_USER || 'fleetadmin',
                password: process.env.DB_READONLY_PASSWORD || process.env.DB_PASSWORD || '',
                max: parseInt(process.env.DB_READ_REPLICA_POOL_SIZE || '50'),
                idleTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_IDLE_TIMEOUT_MS || '30000'),
                connectionTimeoutMillis: parseInt(process.env.DB_READ_REPLICA_CONNECTION_TIMEOUT_MS || '3000')
            });
        }
    }
    /**
     * Initialize all connection pools
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Connection manager already initialized');
            return;
        }
        console.log(`Initializing database connection pools...`);
        // Create pools based on available configurations
        for (const [poolType, config] of this.poolConfigs.entries()) {
            try {
                const pool = new pg_1.Pool(config);
                // Setup pool event handlers
                this.setupPoolEventHandlers(pool, poolType);
                // Test connection
                await this.testConnection(pool, poolType);
                this.pools.set(poolType, pool);
                console.log(`✅ ${poolType} pool initialized (user: ${config.user}, max: ${config.max})`);
                // Start health check monitoring
                this.startHealthCheck(poolType);
            }
            catch (error) {
                console.error(`❌ Failed to initialize ${poolType} pool:`, error);
                // For WEBAPP pool, this is critical - throw error
                if (poolType === PoolType.WEBAPP) {
                    throw new errors_1.ConnectionError(`Failed to initialize webapp pool: ${error}`);
                }
                // For other pools, log warning and continue
                console.warn(`⚠️  ${poolType} pool not available, falling back to webapp pool`);
            }
        }
        this.initialized = true;
    }
    /**
     * Setup event handlers for a pool
     */
    setupPoolEventHandlers(pool, poolType) {
        pool.on(`connect`, (client) => {
            console.log(`[${poolType}] Database connection established`);
        });
        pool.on(`acquire`, (client) => {
            // Client acquired from pool
        });
        pool.on(`remove`, (client) => {
            console.log(`[${poolType}] Client removed from pool`);
        });
        pool.on(`error`, (err, client) => {
            console.error(`[${poolType}] Database pool error:`, err);
        });
    }
    /**
     * Test database connection
     */
    async testConnection(pool, poolType) {
        try {
            const client = await pool.connect();
            const result = await client.query(`SELECT NOW() as now, current_user, version()`);
            console.log(`[${poolType}] Connection test successful:`, {
                user: result.rows[0].current_user,
                timestamp: result.rows[0].now
            });
            client.release();
        }
        catch (error) {
            throw new errors_1.ConnectionError(`Connection test failed for ${poolType}: ${error}`);
        }
    }
    /**
     * Get a pool by type with fallback logic
     */
    getPool(poolType = PoolType.WEBAPP) {
        if (!this.initialized) {
            throw new errors_1.ConnectionError(`Connection manager not initialized. Call initialize() first.`);
        }
        // Try to get requested pool
        let pool = this.pools.get(poolType);
        if (!pool) {
            console.warn(`Pool ${poolType} not available, falling back to webapp pool`);
            pool = this.pools.get(PoolType.WEBAPP);
        }
        if (!pool) {
            throw new errors_1.ConnectionError(`No database pools available`);
        }
        return pool;
    }
    /**
     * Get pool for read operations (uses read replica if available, falls back to readonly, then webapp)
     * This method intelligently routes read queries to the best available pool
     */
    getReadPool() {
        // Priority: READ_REPLICA > READONLY > WEBAPP
        const readReplicaPool = this.pools.get(PoolType.READ_REPLICA);
        if (readReplicaPool) {
            return readReplicaPool;
        }
        const readOnlyPool = this.pools.get(PoolType.READONLY);
        if (readOnlyPool) {
            return readOnlyPool;
        }
        return this.getPool(PoolType.WEBAPP);
    }
    /**
     * Get pool for write operations (uses webapp pool)
     */
    getWritePool() {
        return this.getPool(PoolType.WEBAPP);
    }
    /**
     * Get pool for admin operations (uses admin pool)
     */
    getAdminPool() {
        return this.getPool(PoolType.ADMIN);
    }
    /**
     * Start health check monitoring for a pool
     */
    startHealthCheck(poolType) {
        const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000'); // Default 60 seconds
        const healthCheckInterval = setInterval(async () => {
            const pool = this.pools.get(poolType);
            if (!pool)
                return;
            try {
                const client = await pool.connect();
                await client.query(`SELECT 1`);
                client.release();
            }
            catch (error) {
                console.error(`[${poolType}] Health check failed:`, error);
            }
        }, interval);
        this.healthCheckIntervals.set(poolType, healthCheckInterval);
    }
    /**
     * Get health status of all pools
     */
    async getHealthStatus() {
        const status = {};
        for (const [poolType, pool] of this.pools.entries()) {
            try {
                const client = await pool.connect();
                const result = await client.query(`SELECT NOW() as timestamp, current_user`);
                client.release();
                status[poolType] = {
                    healthy: true,
                    user: result.rows[0].current_user,
                    timestamp: result.rows[0].timestamp,
                    totalCount: pool.totalCount,
                    idleCount: pool.idleCount,
                    waitingCount: pool.waitingCount
                };
            }
            catch (error) {
                status[poolType] = {
                    healthy: false,
                    error: error.message
                };
            }
        }
        return status;
    }
    /**
     * Get pool statistics
     */
    getPoolStats(poolType) {
        const pool = this.pools.get(poolType);
        if (!pool)
            return null;
        return {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        };
    }
    /**
     * Get all pool statistics
     */
    getAllPoolStats() {
        const stats = {};
        for (const poolType of this.pools.keys()) {
            stats[poolType] = this.getPoolStats(poolType);
        }
        return stats;
    }
    /**
     * Check replica lag for read replica
     * Returns lag in milliseconds, or null if not a replica or check fails
     */
    async getReplicaLag() {
        const replicaPool = this.pools.get(PoolType.READ_REPLICA);
        if (!replicaPool) {
            return null;
        }
        try {
            const client = await replicaPool.connect();
            // PostgreSQL-specific replica lag check
            const result = await client.query(`
        SELECT
          CASE
            WHEN pg_is_in_recovery() THEN
              EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::INTEGER * 1000
            ELSE
              0
          END as lag_ms
      `);
            client.release();
            return result.rows[0]?.lag_ms || 0;
        }
        catch (error) {
            console.error('[READ_REPLICA] Failed to check replica lag:', error);
            return null;
        }
    }
    /**
     * Get connection leak detection info
     * Identifies connections that have been checked out for too long
     */
    async detectConnectionLeaks(maxConnectionAgeMs = 60000) {
        const leaks = {};
        for (const [poolType, pool] of this.pools.entries()) {
            const activeConnections = pool.totalCount - pool.idleCount;
            const waitingClients = pool.waitingCount;
            if (activeConnections > 0 || waitingClients > 0) {
                leaks[poolType] = {
                    activeConnections,
                    waitingClients,
                    potentialLeak: activeConnections > (this.poolConfigs.get(poolType)?.max || 0) * 0.8,
                    warning: waitingClients > 0 ? 'Clients are waiting for connections' : null
                };
            }
        }
        return leaks;
    }
    /**
     * Get enhanced pool diagnostics for performance monitoring
     */
    async getPoolDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            pools: {},
            replicaLag: await this.getReplicaLag(),
            connectionLeaks: await this.detectConnectionLeaks()
        };
        for (const [poolType, pool] of this.pools.entries()) {
            const config = this.poolConfigs.get(poolType);
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
            };
        }
        return diagnostics;
    }
    /**
     * Close all connection pools
     */
    async closeAll() {
        console.log(`Closing all database connection pools...`);
        // Clear health check intervals
        for (const [poolType, interval] of this.healthCheckIntervals.entries()) {
            clearInterval(interval);
        }
        this.healthCheckIntervals.clear();
        // Close all pools
        const closePromises = [];
        for (const [poolType, pool] of this.pools.entries()) {
            closePromises.push(pool.end().then(() => {
                console.log(`✅ ${poolType} pool closed`);
            }).catch((error) => {
                console.error(`❌ Error closing ${poolType} pool:`, error);
            }));
        }
        await Promise.all(closePromises);
        this.pools.clear();
        this.initialized = false;
        console.log(`All database pools closed`);
    }
    /**
     * Graceful shutdown handler
     */
    setupGracefulShutdown() {
        const shutdown = async () => {
            console.log(`Received shutdown signal, closing database connections...`);
            await this.closeAll();
            process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
}
exports.ConnectionManager = ConnectionManager;
// Singleton instance
exports.connectionManager = new ConnectionManager();
// Initialize on module load (async)
// Note: You should call this explicitly in your app startup
async function initializeConnectionManager() {
    await exports.connectionManager.initialize();
    exports.connectionManager.setupGracefulShutdown();
}
/**
 * Get the default pool for backward compatibility
 * This is a function to avoid calling getPool() during module initialization
 *
 * DEPRECATED: Use connectionManager.getWritePool() for new code
 */
function getDefaultPool() {
    return exports.connectionManager.getPool(PoolType.WEBAPP);
}
exports.default = exports.connectionManager;
//# sourceMappingURL=connection-manager.js.map