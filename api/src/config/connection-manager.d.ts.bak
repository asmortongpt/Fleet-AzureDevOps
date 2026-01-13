import { Pool } from 'pg';
/**
 * Pool types for different database access levels
 */
export declare enum PoolType {
    ADMIN = "admin",// Full admin privileges (migrations, schema changes)
    WEBAPP = "webapp",// Standard web app user (read/write on app tables)
    READONLY = "readonly",// Read-only access (reporting, analytics)
    READ_REPLICA = "read_replica"
}
/**
 * Connection Manager for multiple database pools
 * Manages admin, webapp, and read-only connection pools with health monitoring
 */
export declare class ConnectionManager {
    private pools;
    private healthCheckIntervals;
    private poolConfigs;
    private initialized;
    constructor();
    /**
     * Setup configurations for different pool types
     */
    private setupConfigurations;
    /**
     * Initialize all connection pools
     */
    initialize(): Promise<void>;
    /**
     * Setup event handlers for a pool
     */
    private setupPoolEventHandlers;
    /**
     * Test database connection
     */
    private testConnection;
    /**
     * Get a pool by type with fallback logic
     */
    getPool(poolType?: PoolType): Pool;
    /**
     * Get pool for read operations (uses read replica if available, falls back to readonly, then webapp)
     * This method intelligently routes read queries to the best available pool
     */
    getReadPool(): Pool;
    /**
     * Get pool for write operations (uses webapp pool)
     */
    getWritePool(): Pool;
    /**
     * Get pool for admin operations (uses admin pool)
     */
    getAdminPool(): Pool;
    /**
     * Start health check monitoring for a pool
     */
    private startHealthCheck;
    /**
     * Get health status of all pools
     */
    getHealthStatus(): Promise<Record<string, any>>;
    /**
     * Get pool statistics
     */
    getPoolStats(poolType: PoolType): {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    } | null;
    /**
     * Get all pool statistics
     */
    getAllPoolStats(): Record<string, any>;
    /**
     * Check replica lag for read replica
     * Returns lag in milliseconds, or null if not a replica or check fails
     */
    getReplicaLag(): Promise<number | null>;
    /**
     * Get connection leak detection info
     * Identifies connections that have been checked out for too long
     */
    detectConnectionLeaks(maxConnectionAgeMs?: number): Promise<Record<string, any>>;
    /**
     * Get enhanced pool diagnostics for performance monitoring
     */
    getPoolDiagnostics(): Promise<Record<string, any>>;
    /**
     * Close all connection pools
     */
    closeAll(): Promise<void>;
    /**
     * Graceful shutdown handler
     */
    setupGracefulShutdown(): void;
}
export declare const connectionManager: ConnectionManager;
export declare function initializeConnectionManager(): Promise<void>;
/**
 * Get the default pool for backward compatibility
 * This is a function to avoid calling getPool() during module initialization
 *
 * DEPRECATED: Use connectionManager.getWritePool() for new code
 */
export declare function getDefaultPool(): Pool;
export default connectionManager;
//# sourceMappingURL=connection-manager.d.ts.map