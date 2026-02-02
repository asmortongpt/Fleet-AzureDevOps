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

import dotenv from 'dotenv'
import { Pool } from 'pg'

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
let isInitializing = false
let initializationPromise: Promise<void> | null = null

const poolProxy = new Proxy({} as Pool, {
  get(target, prop) {
    // Lazy initialize on first access
    if (!isInitializing && !(connectionManager as any).initialized) {
      isInitializing = true
      // Initialize synchronously by calling it without await
      // The first actual pool.connect() will wait for initialization
      initializationPromise = initializeConnectionManager().then(() => {
        isInitializing = false
      }).catch(err => {
        console.error('Failed to initialize connection manager:', err)
        isInitializing = false
        throw err
      })
    }

    try {
      const pool = connectionManager.getWritePool()
      return (pool as any)[prop]
    } catch (error) {
      // If pools not initialized yet, wait for initialization
      if (initializationPromise) {
        // Return a promise that waits for initialization then retries
        if (prop === 'connect' || typeof (Pool.prototype as any)[prop] === 'function') {
          return async (...args: any[]) => {
            await initializationPromise
            const pool = connectionManager.getWritePool()
            return (pool as any)[prop](...args)
          }
        }
      }
      throw error
    }
  }
})

export const pool = poolProxy

/**
 * Default export (legacy compatibility)
 */
export default pool
