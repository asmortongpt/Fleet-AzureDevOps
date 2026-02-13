/**
 * Database Connection Utility
 * Manages PostgreSQL connection pool with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '../schemas/production.schema';
import { logger } from '../utils/logger';

const DATABASE_URL = process.env.DATABASE_URL || (process.env.NODE_ENV !== 'production' ? 'postgresql://postgres:postgres@localhost:5432/fleet_dev' : (() => { throw new Error('DATABASE_URL must be set in production'); })());

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000'),
});

// Create Drizzle instance
export const db = drizzle(pool, { schema: schema.schema });

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

// Export schema for convenience
export { schema };
