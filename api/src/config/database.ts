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

import { Pool } from 'pg'
import dotenv from 'dotenv'
import { connectionManager, initializeConnectionManager, PoolType } from './connection-manager'

dotenv.config()

/**
 * Initialize the connection manager
 * This should be called once during application startup
 */
export async function initializeDatabase(): Promise<void> {
  console.log('🔄 Initializing database connections...')

  try {
    await initializeConnectionManager()
    console.log('✅ Database initialization complete')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

/**
 * Export the connection manager for advanced usage
 */
export { connectionManager, PoolType }

/**
 * Convenience exports for different pool types
 */
export const getReadPool = () => connectionManager.getReadPool()
export const getWritePool = () => connectionManager.getWritePool()
export const getAdminPool = () => connectionManager.getAdminPool()

/**
 * Get database health status
 */
export const getDatabaseHealth = () => connectionManager.getHealthStatus()

/**
 * Get pool statistics
 */
export const getPoolStats = () => connectionManager.getAllPoolStats()

/**
 * Legacy pool export with lazy initialization for backward compatibility
 * Uses a Proxy to defer pool access until it's actually used
 *
 * DEPRECATED: Use getWritePool() for new code
 */
const poolProxy = new Proxy({} as Pool, {
  get(target, prop) {
    const pool = connectionManager.getWritePool()
    return (pool as any)[prop]
  }
})

export const pool = poolProxy

/**
 * Default export (legacy compatibility)
 */
export default pool
