/**
 * Test Setup and Configuration
 * Provides utilities and setup for testing the Fleet Management API
 */

import { Pool } from 'pg'
import jwt from 'jsonwebtoken'

// Test database configuration
export const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'fleet_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres'
}

export const testPool = new Pool(testDbConfig)

// Test data generators
export const generateTestUser = (overrides: any = {}) => ({
  id: overrides.id || 'test-user-id',
  tenant_id: overrides.tenant_id || 'test-tenant-id',
  email: overrides.email || 'test@example.com',
  first_name: overrides.first_name || 'Test',
  last_name: overrides.last_name || 'User',
  role: overrides.role || 'admin',
  ...overrides
})

export const generateTestAsset = (overrides: any = {}) => ({
  asset_name: overrides.asset_name || 'Test Vehicle',
  asset_type: overrides.asset_type || 'vehicle',
  asset_tag: overrides.asset_tag || `TAG-${Date.now()}`,
  serial_number: overrides.serial_number || `SN-${Date.now()}`,
  manufacturer: overrides.manufacturer || 'Test Manufacturer',
  model: overrides.model || 'Test Model',
  purchase_date: overrides.purchase_date || '2023-01-01',
  purchase_price: overrides.purchase_price || '50000',
  current_value: overrides.current_value || '45000',
  depreciation_rate: overrides.depreciation_rate || '10',
  status: overrides.status || 'active',
  ...overrides
})

export const generateTestTask = (overrides: any = {}) => ({
  title: overrides.title || 'Test Task',
  description: overrides.description || 'Test task description',
  category: overrides.category || 'maintenance',
  priority: overrides.priority || 'medium',
  status: overrides.status || 'todo',
  ...overrides
})

export const generateTestIncident = (overrides: any = {}) => ({
  incident_title: overrides.incident_title || 'Test Incident',
  incident_type: overrides.incident_type || 'accident',
  severity: overrides.severity || 'medium',
  incident_date: overrides.incident_date || '2024-01-01',
  incident_time: overrides.incident_time || '12:00:00',
  location: overrides.location || 'Test Location',
  description: overrides.description || 'Test incident description',
  status: overrides.status || 'open',
  ...overrides
})

// Generate JWT token for testing
export const generateTestToken = (user: any = {}) => {
  const testUser = generateTestUser(user)
  const secret = process.env.JWT_SECRET || 'test-secret'
  return jwt.sign(testUser, secret, { expiresIn: '1h' })
}

// Database cleanup utilities
export const cleanupDatabase = async () => {
  const client = await testPool.connect()
  try {
    await client.query('BEGIN')

    // Delete in order to respect foreign key constraints
    await client.query('DELETE FROM task_time_entries WHERE 1=1')
    await client.query('DELETE FROM task_comments WHERE 1=1')
    await client.query('DELETE FROM task_attachments WHERE 1=1')
    await client.query('DELETE FROM task_checklist WHERE 1=1')
    await client.query('DELETE FROM tasks WHERE 1=1')

    await client.query('DELETE FROM incident_timeline WHERE 1=1')
    await client.query('DELETE FROM incident_witnesses WHERE 1=1')
    await client.query('DELETE FROM incident_actions WHERE 1=1')
    await client.query('DELETE FROM incident_photos WHERE 1=1')
    await client.query('DELETE FROM incidents WHERE 1=1')

    await client.query('DELETE FROM asset_history WHERE 1=1')
    await client.query('DELETE FROM assets WHERE 1=1')

    await client.query('DELETE FROM alert_notifications WHERE 1=1')
    await client.query('DELETE FROM alerts WHERE 1=1')

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Create test user in database
export const createTestUser = async (userData: any = {}) => {
  const user = generateTestUser(userData)
  const client = await testPool.connect()
  try {
    const result = await client.query(
      `INSERT INTO users (id, tenant_id, email, first_name, last_name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user.id, user.tenant_id, user.email, user.first_name, user.last_name, user.role, 'hashed-password']
    )
    return result.rows[0]
  } finally {
    client.release()
  }
}

// Create test tenant
export const createTestTenant = async (tenantData: any = {}) => {
  const client = await testPool.connect()
  try {
    const result = await client.query(
      `INSERT INTO tenants (id, name, subscription_tier, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        tenantData.id || 'test-tenant-id',
        tenantData.name || 'Test Tenant',
        tenantData.subscription_tier || 'enterprise',
        tenantData.status || 'active'
      ]
    )
    return result.rows[0]
  } finally {
    client.release()
  }
}

// Seed test database with minimal required data
export const seedTestDatabase = async () => {
  await createTestTenant()
  await createTestUser()
}

// Close database connections
export const closeTestDatabase = async () => {
  await testPool.end()
}
