/**
 * Tenant Test Helper
 * Provides utilities for testing Row-Level Security (RLS) and multi-tenant isolation
 *
 * Features:
 * - Create test tenants with isolated data
 * - Switch tenant context for RLS testing
 * - Generate test data for multiple tenants
 * - Verify RLS policy enforcement
 * - Cleanup utilities
 */

import { Pool, PoolClient } from 'pg'
import { randomUUID } from 'crypto'

export interface TenantTestContext {
  tenantId: string
  client: PoolClient
  data: {
    users: any[]
    vehicles: any[]
    drivers: any[]
    workOrders: any[]
    routes: any[]
    facilities: any[]
    documents: any[]
  }
}

export interface TenantTestData {
  tenantId: string
  userId: string
  userEmail: string
  vehicleId: string
  vehicleNumber: string
  driverId: string
  driverEmail: string
  workOrderId: string
  routeId: string
  facilityId: string
  documentId: string
}

/**
 * Helper class for testing RLS and tenant isolation
 * Provides utilities to create test tenants, set context, and verify isolation
 */
export class TenantTestHelper {
  constructor(private pool: Pool) {}

  /**
   * Create a test tenant
   * @param overrides - Optional overrides for tenant properties
   * @returns Tenant object with id, name, and settings
   */
  async createTestTenant(overrides: any = {}): Promise<any> {
    const client = await this.pool.connect()
    try {
      const tenantId = overrides.id || randomUUID()
      const tenantName = overrides.name || `Test Tenant ${Date.now()}`

      const result = await client.query(
        `INSERT INTO tenants (id, name, subscription_tier, status, settings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [
          tenantId,
          tenantName,
          'enterprise',
          'active',
          JSON.stringify({
            timezone: 'America/New_York',
            currency: 'USD',
            date_format: 'MM/DD/YYYY',
          }),
        ]
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create multiple test tenants
   * @param count - Number of tenants to create
   * @returns Array of tenant objects
   */
  async createMultipleTenants(count: number): Promise<any[]> {
    const tenants = []
    for (let i = 0; i < count; i++) {
      const tenant = await this.createTestTenant({
        name: `Test Tenant ${i + 1} ${Date.now()}`,
      })
      tenants.push(tenant)
    }
    return tenants
  }

  /**
   * Set tenant context for a client connection
   * This simulates the middleware behavior that sets the session variable
   *
   * @param client - PostgreSQL client
   * @param tenantId - Tenant ID to set as context
   */
  async setTenantContext(client: PoolClient, tenantId: string): Promise<void> {
    await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId])
  }

  /**
   * Get the current tenant context from a client
   * @param client - PostgreSQL client
   * @returns Current tenant ID or null if not set
   */
  async getTenantContext(client: PoolClient): Promise<string | null> {
    try {
      const result = await client.query(
        "SELECT current_setting('app.current_tenant_id', true) as tenant_id"
      )
      return result.rows[0]?.tenant_id || null
    } catch (error) {
      return null
    }
  }

  /**
   * Execute a query with tenant context
   * Automatically sets tenant context before executing the query
   *
   * @param tenantId - Tenant ID context
   * @param query - SQL query
   * @param params - Query parameters
   * @returns Query result
   */
  async queryWithTenantContext(
    tenantId: string,
    query: string,
    params: any[] = []
  ): Promise<any> {
    const client = await this.pool.connect()
    try {
      await this.setTenantContext(client, tenantId)
      const result = await client.query(query, params)
      return result
    } finally {
      client.release()
    }
  }

  /**
   * Create test user for a tenant
   * @param tenantId - Tenant ID
   * @param overrides - Optional overrides
   * @returns User object
   */
  async createTestUser(tenantId: string, overrides: any = {}): Promise<any> {
    const client = await this.pool.connect()
    try {
      const userId = overrides.id || randomUUID()
      const email = overrides.email || `user${Date.now()}@example.com`

      const result = await client.query(
        `INSERT INTO users (id, tenant_id, email, first_name, last_name, role, status, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          userId,
          tenantId,
          email,
          'Test',
          'User',
          'fleet_manager',
          'active',
          '$2b$10$abcdefghijklmnopqrstuvwxyz',
        ]
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create test vehicle for a tenant
   * @param tenantId - Tenant ID
   * @param overrides - Optional overrides
   * @returns Vehicle object
   */
  async createTestVehicle(tenantId: string, overrides: any = {}): Promise<any> {
    const client = await this.pool.connect()
    try {
      const vehicleId = overrides.id || randomUUID()
      const vehicleNumber = overrides.vehicle_number || `V-${Math.random().toString(36).slice(2, 7)}`
      const vin = overrides.vin || `VIN${Date.now()}${Math.random().toString(36).slice(2, 7)}`

      const result = await client.query(
        `INSERT INTO vehicles (id, tenant_id, vehicle_number, vin, license_plate, make, model, year, status, odometer, fuel_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING *`,
        [
          vehicleId,
          tenantId,
          vehicleNumber,
          vin,
          `PLT${Math.floor(Math.random() * 10000)}`,
          'Ford',
          'F-150',
          2023,
          'active',
          15000,
          'gasoline',
        ]
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create test driver for a tenant
   * @param tenantId - Tenant ID
   * @param overrides - Optional overrides
   * @returns Driver object
   */
  async createTestDriver(tenantId: string, overrides: any = {}): Promise<any> {
    const client = await this.pool.connect()
    try {
      const driverId = overrides.id || randomUUID()
      const email = overrides.email || `driver${Date.now()}@example.com`

      const result = await client.query(
        `INSERT INTO drivers (id, tenant_id, employee_id, first_name, last_name, email, phone, license_number, license_state, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING *`,
        [
          driverId,
          tenantId,
          `EMP${Math.floor(Math.random() * 100000)}`,
          'John',
          'Driver',
          email,
          '555-0123',
          `DL${Math.floor(Math.random() * 1000000)}`,
          'NY',
          'active',
        ]
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create test work order for a tenant
   * @param tenantId - Tenant ID
   * @param vehicleId - Vehicle ID
   * @param overrides - Optional overrides
   * @returns Work order object
   */
  async createTestWorkOrder(
    tenantId: string,
    vehicleId: string,
    overrides: any = {}
  ): Promise<any> {
    const client = await this.pool.connect()
    try {
      const workOrderId = overrides.id || randomUUID()

      const result = await client.query(
        `INSERT INTO work_orders (id, tenant_id, vehicle_id, work_order_number, type, priority, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          workOrderId,
          tenantId,
          vehicleId,
          `WO-${Math.floor(Math.random() * 100000)}`,
          'preventive_maintenance',
          'medium',
          'open',
        ]
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create test route for a tenant
   * @param tenantId - Tenant ID
   * @param overrides - Optional overrides
   * @returns Route object
   */
  async createTestRoute(tenantId: string, overrides: any = {}): Promise<any> {
    const client = await this.pool.connect()
    try {
      const routeId = overrides.id || randomUUID()

      const result = await client.query(
        `INSERT INTO routes (id, tenant_id, route_name, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [routeId, tenantId, `Route ${Date.now()}`, 'active']
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create test facility for a tenant
   * @param tenantId - Tenant ID
   * @param overrides - Optional overrides
   * @returns Facility object
   */
  async createTestFacility(tenantId: string, overrides: any = {}): Promise<any> {
    const client = await this.pool.connect()
    try {
      const facilityId = overrides.id || randomUUID()

      const result = await client.query(
        `INSERT INTO facilities (id, tenant_id, name, type, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [
          facilityId,
          tenantId,
          `Facility ${Date.now()}`,
          'garage',
          'active',
        ]
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create test document for a tenant
   * @param tenantId - Tenant ID
   * @param overrides - Optional overrides
   * @returns Document object
   */
  async createTestDocument(tenantId: string, overrides: any = {}): Promise<any> {
    const client = await this.pool.connect()
    try {
      const documentId = overrides.id || randomUUID()

      const result = await client.query(
        `INSERT INTO documents (id, tenant_id, title, document_type, file_url, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          documentId,
          tenantId,
          `Document ${Date.now()}`,
          'vehicle_registration',
          'https://example.com/document.pdf',
          'active',
        ]
      )

      return result.rows[0]
    } finally {
      client.release()
    }
  }

  /**
   * Create comprehensive test data for a tenant
   * @param tenantId - Tenant ID
   * @returns Object containing all created test data
   */
  async createComprehensiveTestData(tenantId: string): Promise<TenantTestData> {
    const user = await this.createTestUser(tenantId)
    const vehicle = await this.createTestVehicle(tenantId)
    const driver = await this.createTestDriver(tenantId)
    const workOrder = await this.createTestWorkOrder(tenantId, vehicle.id)
    const route = await this.createTestRoute(tenantId)
    const facility = await this.createTestFacility(tenantId)
    const document = await this.createTestDocument(tenantId)

    return {
      tenantId,
      userId: user.id,
      userEmail: user.email,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicle_number,
      driverId: driver.id,
      driverEmail: driver.email,
      workOrderId: workOrder.id,
      routeId: route.id,
      facilityId: facility.id,
      documentId: document.id,
    }
  }

  /**
   * Verify RLS is working by checking isolation between tenants
   * @param tenantId1 - First tenant ID
   * @param tenantId2 - Second tenant ID
   * @returns Object with isolation verification results
   */
  async verifyTenantIsolation(tenantId1: string, tenantId2: string): Promise<{
    isolated: boolean
    details: {
      tenant1DataVisible: number
      tenant2DataVisible: number
      crossTenantAccessBlocked: boolean
    }
  }> {
    // Tenant 1 queries their own data
    const tenant1Result = await this.queryWithTenantContext(
      tenantId1,
      'SELECT COUNT(*) as count FROM vehicles'
    )
    const tenant1Count = parseInt(tenant1Result.rows[0].count)

    // Tenant 2 queries (should see 0 vehicles from tenant 1)
    const tenant2Result = await this.queryWithTenantContext(
      tenantId2,
      'SELECT COUNT(*) as count FROM vehicles'
    )
    const tenant2Count = parseInt(tenant2Result.rows[0].count)

    // Both should see only their own data (not each other's)
    const isolated = tenant1Count > 0 && tenant2Count === 0 // tenant2 shouldn't see tenant1's vehicles

    return {
      isolated,
      details: {
        tenant1DataVisible: tenant1Count,
        tenant2DataVisible: tenant2Count,
        crossTenantAccessBlocked: !isolated,
      },
    }
  }

  /**
   * Clean up all data for a specific tenant
   * @param tenantId - Tenant ID to clean up
   */
  async cleanupTenantData(tenantId: string): Promise<void> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Delete in reverse dependency order
      const tables = [
        'telemetry_data',
        'fuel_transactions',
        'maintenance_schedules',
        'work_orders',
        'charging_sessions',
        'geofence_events',
        'geofences',
        'routes',
        'inspections',
        'damage_reports',
        'safety_incidents',
        'documents',
        'video_events',
        'purchase_orders',
        'communication_logs',
        'policy_violations',
        'policies',
        'notifications',
        'drivers',
        'vehicles',
        'facilities',
        'vendors',
        'audit_logs',
        'users',
        'tenants',
      ]

      for (const table of tables) {
        await client.query(
          `DELETE FROM ${table} WHERE tenant_id = $1 OR id = $1`,
          [tenantId]
        )
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Clean up all test data from the database
   */
  async cleanupAllTestData(): Promise<void> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Delete in reverse dependency order
      const tables = [
        'telemetry_data',
        'fuel_transactions',
        'maintenance_schedules',
        'work_orders',
        'charging_sessions',
        'geofence_events',
        'geofences',
        'routes',
        'inspections',
        'damage_reports',
        'safety_incidents',
        'documents',
        'video_events',
        'purchase_orders',
        'communication_logs',
        'policy_violations',
        'policies',
        'notifications',
        'drivers',
        'vehicles',
        'facilities',
        'vendors',
        'audit_logs',
        'users',
        'tenants',
      ]

      for (const table of tables) {
        await client.query(`DELETE FROM ${table}`)
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Check if RLS is enabled on a table
   * @param tableName - Table name
   * @returns True if RLS is enabled
   */
  async isRLSEnabled(tableName: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        `SELECT rowsecurity FROM pg_tables WHERE tablename = $1`,
        [tableName]
      )
      return result.rows[0]?.rowsecurity || false
    } finally {
      client.release()
    }
  }

  /**
   * Get all RLS policies for a table
   * @param tableName - Table name
   * @returns Array of policy objects
   */
  async getRLSPolicies(tableName: string): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        `SELECT tablename, policyname, cmd, roles
         FROM pg_policies
         WHERE tablename = $1
         ORDER BY policyname`,
        [tableName]
      )
      return result.rows
    } finally {
      client.release()
    }
  }

  /**
   * Verify that a user cannot see another tenant's data
   * @param tenantId1 - First tenant
   * @param tenantId2 - Second tenant
   * @param tableName - Table to check
   * @returns True if isolation is enforced
   */
  async verifyDataIsolation(
    tenantId1: string,
    tenantId2: string,
    tableName: string
  ): Promise<boolean> {
    // Tenant 1 creates data
    const createResult = await this.queryWithTenantContext(
      tenantId1,
      `SELECT COUNT(*) as count FROM ${tableName}`
    )

    // Tenant 2 tries to see that data
    const readResult = await this.queryWithTenantContext(
      tenantId2,
      `SELECT COUNT(*) as count FROM ${tableName}`
    )

    // Tenant 2 should see 0 if there's any data in tenant1
    return parseInt(readResult.rows[0].count) === 0
  }
}

export default TenantTestHelper
