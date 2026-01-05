/**
 * Drizzle ORM Database Instance
 * Provides type-safe database access using Drizzle ORM with PostgreSQL
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_local',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Fail fast if connection takes more than 2 seconds
})

// Error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error', err)
})

pool.on('connect', () => {
  console.log('New database connection established')
})

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema })

// Export pool for advanced usage (transactions, etc.)
export { pool }

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW() as current_time')
    console.log('Database connection test successful', result.rows[0])
    return true
  } catch (error) {
    console.error('Database connection test failed', error)
    return false
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  await pool.end()
  console.log('Database pool closed')
}
