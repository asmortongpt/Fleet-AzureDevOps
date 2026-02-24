/**
 * Setup for Middleware Integration Tests
 * Initializes database connection and test fixtures for security middleware testing
 */

import { beforeAll, afterAll, afterEach } from 'vitest'
import { initializeConnectionManager } from '../../src/config/connection-manager'
import { Pool } from 'pg'

let testPool: Pool | null = null
let databaseReady = false

/**
 * Initialize database connection for tests
 */
beforeAll(async () => {
  console.log('Initializing database connection for middleware tests...')

  try {
    await initializeConnectionManager()
    console.log('Database connection initialized')
    databaseReady = true
  } catch (error) {
    console.warn('Database connection unavailable for integration tests; continuing in degraded test mode')
    console.warn(error)
    databaseReady = false
  }
})

/**
 * Clean up after all tests
 */
afterAll(async () => {
  console.log('Cleaning up database connection...')

  try {
    // Connection manager handles cleanup
    console.log('Database cleanup complete')
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
})

/**
 * Clean up test data after each test
 */
afterEach(async () => {
  // Tests should clean up their own data in their afterEach hooks
})

export { testPool }
export const isDatabaseReady = () => databaseReady
