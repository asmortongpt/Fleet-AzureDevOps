/**
 * Database Configuration
 *
 * This module provides database connection management with multiple connection pools
 * for different access levels (admin, webapp, readonly).
 *
 * IMPORTANT: The legacy single pool export is maintained for backward compatibility,
 * but new code should use the ConnectionManager for better security.
 *
 * Migration Path:
 * 1. Old code: import pool from './config/database'
 * 2. New code: import { connectionManager, PoolType } from './config/connection-manager'
 *
 * Usage Examples:
 *
 * // For standard CRUD operations (recommended)
 * const pool = connectionManager.getWritePool()
 *
 * // For read-only operations (reporting, analytics)
 * const pool = connectionManager.getReadPool()
 *
 * // For admin operations (migrations only)
 * const pool = connectionManager.getAdminPool()
 *
 * // Or use the DAL (Data Access Layer) for better abstraction
 * import { BaseRepository } from './services/dal'
 * class VendorRepository extends BaseRepository<Vendor> {
 *   constructor() {
 *     super('vendors', connectionManager.getWritePool())
 *   }
 * }
 */
import { Pool } from 'pg';

import { connectionManager, PoolType } from './connection-manager';
/**
 * Initialize the connection manager
 * This should be called once during application startup
 */
export declare function initializeDatabase(): Promise<void>;
/**
 * Export the connection manager for advanced usage
 */
export { connectionManager, PoolType };
/**
 * Convenience exports for different pool types
 */
export declare const getReadPool: () => Pool;
export declare const getWritePool: () => Pool;
export declare const getAdminPool: () => Pool;
/**
 * Get database health status
 */
export declare const getDatabaseHealth: () => Promise<Record<string, any>>;
/**
 * Get pool statistics
 */
export declare const getPoolStats: () => Record<string, any>;
export declare const pool: Pool;
/**
 * Default export (legacy compatibility)
 */
export default pool;
//# sourceMappingURL=database.d.ts.map