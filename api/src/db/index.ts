/**
 * Drizzle ORM Database Instance
 * Provides type-safe database access using Drizzle ORM with PostgreSQL
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import logger from '../config/logger'
import * as schema from './schema'

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL || (process.env.NODE_ENV !== 'production' ? 'postgresql://postgres:postgres@localhost:5432/fleet_local' : (() => {
 throw new Error('DATABASE_URL must be set in production'); 
})());
const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Fail fast if connection takes more than 2 seconds
})

// Error handling for the pool
pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message })
})

pool.on('connect', () => {
  logger.debug('New database connection established')
})

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema })

// Export pool for advanced usage (transactions, etc.)
export { pool }

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW() as current_time')
    logger.info('Database connection test successful')
    return true
  } catch (error) {
    logger.error('Database connection test failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    return false
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  await pool.end()
  logger.info('Database pool closed')
}
