/**
 * Integration Test Setup
 *
 * This file provides:
 * - Test database configuration and connection
 * - Test fixtures for common entities
 * - Test authentication token generation
 * - Database cleanup utilities
 * - App instance for supertest
 */

import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Test database configuration
export const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'fleet_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  max: 5 // Limited pool for tests
}

export const testPool = new Pool(testDbConfig)

// JWT Secret for testing (must be at least 32 characters)
export const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long'

// Test tenant data
export const TEST_TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Test Tenant',
  subscription_tier: 'enterprise',
  status: 'active'
}

// Test users with different roles
export const TEST_USERS = {
  admin: {
    id: '00000000-0000-0000-0000-000000000010',
    tenant_id: TEST_TENANT.id,
    email: 'admin@test.fleet.local',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
    password: 'AdminPass123!',
    scope_level: 'global'
  },
  manager: {
    id: '00000000-0000-0000-0000-000000000011',
    tenant_id: TEST_TENANT.id,
    email: 'manager@test.fleet.local',
    first_name: 'Manager',
    last_name: 'User',
    role: 'manager',
    is_active: true,
    password: 'ManagerPass123!',
    scope_level: 'fleet'
  },
  driver: {
    id: '00000000-0000-0000-0000-000000000012',
    tenant_id: TEST_TENANT.id,
    email: 'driver@test.fleet.local',
    first_name: 'Driver',
    last_name: 'User',
    role: 'driver',
    is_active: true,
    password: 'DriverPass123!',
    scope_level: 'own'
  },
  viewer: {
    id: '00000000-0000-0000-0000-000000000013',
    tenant_id: TEST_TENANT.id,
    email: 'viewer@test.fleet.local',
    first_name: 'Viewer',
    last_name: 'User',
    role: 'viewer',
    is_active: true,
    password: 'ViewerPass123!',
    scope_level: 'own'
  }
}

// Test vehicles
export const TEST_VEHICLES = {
  vehicle1: {
    id: '00000000-0000-0000-0000-000000000100',
    tenant_id: TEST_TENANT.id,
    vin: 'TEST1234567890001',
    license_plate: 'TEST-001',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    color: 'Silver',
    current_mileage: 15000,
    status: 'active'
  },
  vehicle2: {
    id: '00000000-0000-0000-0000-000000000101',
    tenant_id: TEST_TENANT.id,
    vin: 'TEST1234567890002',
    license_plate: 'TEST-002',
    make: 'Ford',
    model: 'F-150',
    year: 2022,
    color: 'Blue',
    current_mileage: 30000,
    status: 'active'
  },
  retiredVehicle: {
    id: '00000000-0000-0000-0000-000000000102',
    tenant_id: TEST_TENANT.id,
    vin: 'TEST1234567890003',
    license_plate: 'TEST-003',
    make: 'Honda',
    model: 'Accord',
    year: 2020,
    color: 'Black',
    current_mileage: 80000,
    status: 'retired'
  }
}

/**
 * Generate a JWT token for a test user
 */
export function generateTestToken(
  user: typeof TEST_USERS[keyof typeof TEST_USERS],
  options: { expiresIn?: string; type?: string } = {}
): string {
  const { expiresIn = '1h', type = 'access' } = options

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      type
    },
    TEST_JWT_SECRET,
    { expiresIn }
  )
}

/**
 * Generate an expired token for testing
 */
export function generateExpiredToken(user: typeof TEST_USERS[keyof typeof TEST_USERS]): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      type: 'access'
    },
    TEST_JWT_SECRET,
    { expiresIn: '-1h' } // Already expired
  )
}

/**
 * Generate a refresh token for a test user
 */
export function generateRefreshToken(user: typeof TEST_USERS[keyof typeof TEST_USERS]): string {
  return jwt.sign(
    {
      id: user.id,
      tenant_id: user.tenant_id,
      type: 'refresh',
      jti: `${user.id}-${Date.now()}-test`
    },
    TEST_JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/**
 * Hash a password for test database seeding
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Create test tenant in database
 */
export async function createTestTenant(): Promise<void> {
  try {
    await testPool.query(
      `INSERT INTO tenants (id, name, subscription_tier, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [TEST_TENANT.id, TEST_TENANT.name, TEST_TENANT.subscription_tier, TEST_TENANT.status]
    )
  } catch (error) {
    console.error('Error creating test tenant:', error)
    throw error
  }
}

/**
 * Create test users in database
 */
export async function createTestUsers(): Promise<void> {
  for (const [key, user] of Object.entries(TEST_USERS)) {
    const passwordHash = await hashPassword(user.password)
    try {
      await testPool.query(
        `INSERT INTO users (id, tenant_id, email, first_name, last_name, role, is_active, password_hash, scope_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           is_active = EXCLUDED.is_active`,
        [
          user.id,
          user.tenant_id,
          user.email,
          user.first_name,
          user.last_name,
          user.role,
          user.is_active,
          passwordHash,
          user.scope_level
        ]
      )
    } catch (error) {
      console.error(`Error creating test user ${key}:`, error)
      throw error
    }
  }
}

/**
 * Create test vehicles in database
 */
export async function createTestVehicles(): Promise<void> {
  for (const [key, vehicle] of Object.entries(TEST_VEHICLES)) {
    try {
      await testPool.query(
        `INSERT INTO vehicles (id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          vehicle.id,
          vehicle.tenant_id,
          vehicle.vin,
          vehicle.license_plate,
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.color,
          vehicle.current_mileage,
          vehicle.status
        ]
      )
    } catch (error) {
      console.error(`Error creating test vehicle ${key}:`, error)
      throw error
    }
  }
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(): Promise<void> {
  const client = await testPool.connect()
  try {
    await client.query('BEGIN')

    // Delete in order to respect foreign key constraints
    // First, delete related records
    await client.query('DELETE FROM refresh_tokens WHERE user_id LIKE $1', ['00000000-0000-0000-0000-%'])
    await client.query('DELETE FROM audit_logs WHERE tenant_id = $1', [TEST_TENANT.id])

    // Delete vehicles
    for (const vehicle of Object.values(TEST_VEHICLES)) {
      await client.query('DELETE FROM vehicles WHERE id = $1', [vehicle.id])
    }

    // Delete users
    for (const user of Object.values(TEST_USERS)) {
      await client.query('DELETE FROM users WHERE id = $1', [user.id])
    }

    // Delete tenant
    await client.query('DELETE FROM tenants WHERE id = $1', [TEST_TENANT.id])

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error cleaning up test data:', error)
    // Don't throw - cleanup should be best-effort
  } finally {
    client.release()
  }
}

/**
 * Seed the test database with all fixtures
 */
export async function seedTestDatabase(): Promise<void> {
  try {
    await createTestTenant()
    await createTestUsers()
    await createTestVehicles()
    console.log('Test database seeded successfully')
  } catch (error) {
    console.error('Error seeding test database:', error)
    throw error
  }
}

/**
 * Check if the test database is available
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await testPool.query('SELECT 1')
    return true
  } catch (error) {
    console.warn('Test database not available:', error)
    return false
  }
}

/**
 * Close test database connections
 */
export async function closeTestDatabase(): Promise<void> {
  await testPool.end()
}

// Global test setup
let dbAvailable = false

beforeAll(async () => {
  dbAvailable = await checkDatabaseConnection()
  if (dbAvailable) {
    await seedTestDatabase()
  } else {
    console.warn('Skipping database seed - running in mock mode')
  }
})

afterAll(async () => {
  if (dbAvailable) {
    await cleanupTestData()
  }
  await closeTestDatabase()
})

// Export helper for tests to check DB availability
export { dbAvailable }
