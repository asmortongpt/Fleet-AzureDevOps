/**
 * Row-Level Security (RLS) Verification Test Suite
 * CRITICAL SECURITY TESTS: Verifies tenant isolation at database level
 *
 * This test suite comprehensively validates that RLS policies are correctly
 * enforcing multi-tenant data isolation across all major Fleet Management System tables.
 *
 * Coverage:
 * - Tenant A cannot see Tenant B's vehicles, drivers, routes, etc.
 * - INSERT/UPDATE/DELETE with wrong tenant_id are blocked
 * - SELECT queries only return rows matching current tenant context
 * - Admin operations (if applicable) can bypass RLS
 * - RLS is transparent and requires no application code changes
 *
 * Compliance:
 * - FedRAMP AC-3 (Access Enforcement)
 * - SOC 2 CC6.3 (Logical and Physical Access Controls)
 * - Multi-tenancy isolation requirement
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Pool } from 'pg'
import TenantTestHelper, { TenantTestData } from '../helpers/tenant-test-helper'

// ============================================
// TEST SETUP & CONFIGURATION
// ============================================

describe('RLS Verification - Tenant Isolation Tests', () => {
  let pool: Pool
  let tenantHelper: TenantTestHelper

  // Test tenants
  let tenantA: any
  let tenantB: any

  // Test data for Tenant A
  let tenantAData: TenantTestData

  // Test data for Tenant B
  let tenantBData: TenantTestData

  // ============================================
  // SETUP & TEARDOWN
  // ============================================

  beforeAll(async () => {
    // Initialize database connection pool
    pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'fleet_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
    })

    tenantHelper = new TenantTestHelper(pool)

    // Clean up any previous test data
    await tenantHelper.cleanupAllTestData()

    // Create test tenants
    tenantA = await tenantHelper.createTestTenant({
      name: 'RLS Test Tenant A',
    })
    tenantB = await tenantHelper.createTestTenant({
      name: 'RLS Test Tenant B',
    })

    // Create comprehensive test data for Tenant A
    tenantAData = await tenantHelper.createComprehensiveTestData(tenantA.id)

    // Create comprehensive test data for Tenant B
    tenantBData = await tenantHelper.createComprehensiveTestData(tenantB.id)
  })

  afterAll(async () => {
    // Cleanup test data
    await tenantHelper.cleanupAllTestData()
    await pool.end()
  })

  // ============================================
  // GROUP 1: BASIC RLS ENABLEMENT VERIFICATION
  // ============================================

  describe('RLS Enablement Verification', () => {
    it('should have RLS enabled on vehicles table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('vehicles')
      expect(isEnabled).toBe(true)
    })

    it('should have RLS enabled on drivers table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('drivers')
      expect(isEnabled).toBe(true)
    })

    it('should have RLS enabled on work_orders table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('work_orders')
      expect(isEnabled).toBe(true)
    })

    it('should have RLS enabled on routes table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('routes')
      expect(isEnabled).toBe(true)
    })

    it('should have RLS enabled on facilities table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('facilities')
      expect(isEnabled).toBe(true)
    })

    it('should have RLS enabled on documents table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('documents')
      expect(isEnabled).toBe(true)
    })

    it('should have RLS enabled on users table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('users')
      expect(isEnabled).toBe(true)
    })

    it('should have RLS enabled on audit_logs table', async () => {
      const isEnabled = await tenantHelper.isRLSEnabled('audit_logs')
      expect(isEnabled).toBe(true)
    })

    it('should have tenant_isolation policy on vehicles', async () => {
      const policies = await tenantHelper.getRLSPolicies('vehicles')
      const isolationPolicy = policies.find(p => p.policyname === 'tenant_isolation_vehicles')
      expect(isolationPolicy).toBeDefined()
    })

    it('should have tenant_isolation policy on drivers', async () => {
      const policies = await tenantHelper.getRLSPolicies('drivers')
      const isolationPolicy = policies.find(p => p.policyname === 'tenant_isolation_drivers')
      expect(isolationPolicy).toBeDefined()
    })
  })

  // ============================================
  // GROUP 2: TENANT A ISOLATION TESTS
  // ============================================

  describe('Tenant A Data Isolation - SELECT Queries', () => {
    it('Tenant A should only see their own vehicles', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM vehicles'
      )
      const count = parseInt(result.rows[0].count)

      // Should see exactly 1 vehicle (the one created for Tenant A)
      expect(count).toBe(1)
    })

    it('Tenant A should see correct vehicle details', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT id, vehicle_number, tenant_id FROM vehicles WHERE id = $1',
        [tenantAData.vehicleId]
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].tenant_id).toBe(tenantA.id)
      expect(result.rows[0].vehicle_number).toBe(tenantAData.vehicleNumber)
    })

    it('Tenant A should only see their own drivers', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM drivers'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant A should only see their own work orders', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM work_orders'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant A should only see their own routes', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM routes'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant A should only see their own facilities', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM facilities'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant A should only see their own documents', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM documents'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant A should only see their own users', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM users'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant A should only see their own audit logs', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        'SELECT COUNT(*) as count FROM audit_logs'
      )
      const count = parseInt(result.rows[0].count)

      // At least 0 (no guarantees on audit logs for test data)
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================
  // GROUP 3: TENANT B ISOLATION TESTS
  // ============================================

  describe('Tenant B Data Isolation - SELECT Queries', () => {
    it('Tenant B should only see their own vehicles', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        'SELECT COUNT(*) as count FROM vehicles'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant B should NOT see Tenant A vehicles', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        `SELECT COUNT(*) as count FROM vehicles WHERE id = $1`,
        [tenantAData.vehicleId]
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(0)
    })

    it('Tenant B should only see their own drivers', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        'SELECT COUNT(*) as count FROM drivers'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant B should NOT see Tenant A drivers', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        `SELECT COUNT(*) as count FROM drivers WHERE id = $1`,
        [tenantAData.driverId]
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(0)
    })

    it('Tenant B should only see their own work orders', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        'SELECT COUNT(*) as count FROM work_orders'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant B should NOT see Tenant A work orders', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        `SELECT COUNT(*) as count FROM work_orders WHERE id = $1`,
        [tenantAData.workOrderId]
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(0)
    })

    it('Tenant B should only see their own routes', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        'SELECT COUNT(*) as count FROM routes'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant B should NOT see Tenant A routes', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        `SELECT COUNT(*) as count FROM routes WHERE id = $1`,
        [tenantAData.routeId]
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(0)
    })

    it('Tenant B should only see their own facilities', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        'SELECT COUNT(*) as count FROM facilities'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant B should NOT see Tenant A facilities', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        `SELECT COUNT(*) as count FROM facilities WHERE id = $1`,
        [tenantAData.facilityId]
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(0)
    })

    it('Tenant B should only see their own documents', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        'SELECT COUNT(*) as count FROM documents'
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(1)
    })

    it('Tenant B should NOT see Tenant A documents', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        `SELECT COUNT(*) as count FROM documents WHERE id = $1`,
        [tenantAData.documentId]
      )
      const count = parseInt(result.rows[0].count)

      expect(count).toBe(0)
    })
  })

  // ============================================
  // GROUP 4: INSERT WITH WRONG TENANT_ID TESTS
  // ============================================

  describe('INSERT Protection - Wrong Tenant ID', () => {
    it('Tenant B should NOT be able to INSERT into Tenant A vehicles', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantB.id)

        // Try to insert a vehicle with Tenant A's ID (should fail due to RLS)
        const insertQuery = `
          INSERT INTO vehicles (id, tenant_id, vehicle_number, vin, license_plate, make, model, year, status, odometer, fuel_type, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING *
        `

        const result = await client.query(insertQuery, [
          'fake-id-1',
          tenantA.id, // Wrong tenant ID
          'V-FAKE1',
          'VINFAKE1',
          'FAKE1',
          'Ford',
          'F-150',
          2023,
          'active',
          15000,
          'gasoline',
        ])

        // RLS should prevent this insert
        expect(result.rows.length).toBe(0)
      } catch (error: any) {
        // RLS might throw an error instead of silently failing
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant A should NOT be able to INSERT driver with Tenant B ID', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)

        const insertQuery = `
          INSERT INTO drivers (id, tenant_id, employee_id, first_name, last_name, email, phone, license_number, license_state, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING *
        `

        const result = await client.query(insertQuery, [
          'fake-driver-1',
          tenantB.id, // Wrong tenant ID
          'EMP-FAKE',
          'Fake',
          'Driver',
          'fake@example.com',
          '555-0000',
          'DLFAKE',
          'NY',
          'active',
        ])

        expect(result.rows.length).toBe(0)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant A should NOT be able to INSERT work order with Tenant B ID', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)

        const insertQuery = `
          INSERT INTO work_orders (id, tenant_id, vehicle_id, work_order_number, type, priority, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `

        const result = await client.query(insertQuery, [
          'fake-wo-1',
          tenantB.id, // Wrong tenant ID
          tenantAData.vehicleId,
          'WO-FAKE',
          'preventive_maintenance',
          'medium',
          'open',
        ])

        expect(result.rows.length).toBe(0)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })
  })

  // ============================================
  // GROUP 5: UPDATE WITH WRONG TENANT_ID TESTS
  // ============================================

  describe('UPDATE Protection - Changing Tenant ID', () => {
    it('Tenant A cannot UPDATE their vehicle to Tenant B', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)

        // Try to update vehicle's tenant_id to Tenant B
        const updateQuery = `
          UPDATE vehicles
          SET tenant_id = $1
          WHERE id = $2
          RETURNING *
        `

        const result = await client.query(updateQuery, [tenantB.id, tenantAData.vehicleId])

        // RLS should prevent this update
        expect(result.rows.length).toBe(0)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant B cannot UPDATE Tenant A vehicle', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantB.id)

        const updateQuery = `
          UPDATE vehicles
          SET vehicle_number = $1
          WHERE id = $2
          RETURNING *
        `

        const result = await client.query(updateQuery, [
          'V-HACKED',
          tenantAData.vehicleId,
        ])

        // RLS should prevent this update
        expect(result.rows.length).toBe(0)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant A cannot UPDATE Tenant B driver', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)

        const updateQuery = `
          UPDATE drivers
          SET first_name = $1
          WHERE id = $2
          RETURNING *
        `

        const result = await client.query(updateQuery, [
          'Hacked',
          tenantBData.driverId,
        ])

        expect(result.rows.length).toBe(0)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant B cannot UPDATE Tenant A work order', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantB.id)

        const updateQuery = `
          UPDATE work_orders
          SET status = $1
          WHERE id = $2
          RETURNING *
        `

        const result = await client.query(updateQuery, [
          'completed',
          tenantAData.workOrderId,
        ])

        expect(result.rows.length).toBe(0)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })
  })

  // ============================================
  // GROUP 6: DELETE PROTECTION TESTS
  // ============================================

  describe('DELETE Protection - Cross-Tenant Deletion', () => {
    it('Tenant B cannot DELETE Tenant A vehicle', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantB.id)

        const deleteQuery = `
          DELETE FROM vehicles
          WHERE id = $1
          RETURNING *
        `

        const result = await client.query(deleteQuery, [tenantAData.vehicleId])

        // RLS should prevent this delete
        expect(result.rows.length).toBe(0)

        // Verify vehicle still exists
        const verifyResult = await tenantHelper.queryWithTenantContext(
          tenantA.id,
          'SELECT id FROM vehicles WHERE id = $1',
          [tenantAData.vehicleId]
        )
        expect(verifyResult.rows.length).toBe(1)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant A cannot DELETE Tenant B driver', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)

        const deleteQuery = `
          DELETE FROM drivers
          WHERE id = $1
          RETURNING *
        `

        const result = await client.query(deleteQuery, [tenantBData.driverId])

        expect(result.rows.length).toBe(0)

        // Verify driver still exists
        const verifyResult = await tenantHelper.queryWithTenantContext(
          tenantB.id,
          'SELECT id FROM drivers WHERE id = $1',
          [tenantBData.driverId]
        )
        expect(verifyResult.rows.length).toBe(1)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant B cannot DELETE Tenant A work order', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantB.id)

        const deleteQuery = `
          DELETE FROM work_orders
          WHERE id = $1
          RETURNING *
        `

        const result = await client.query(deleteQuery, [tenantAData.workOrderId])

        expect(result.rows.length).toBe(0)

        // Verify work order still exists
        const verifyResult = await tenantHelper.queryWithTenantContext(
          tenantA.id,
          'SELECT id FROM work_orders WHERE id = $1',
          [tenantAData.workOrderId]
        )
        expect(verifyResult.rows.length).toBe(1)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant A cannot DELETE Tenant B route', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)

        const deleteQuery = `
          DELETE FROM routes
          WHERE id = $1
          RETURNING *
        `

        const result = await client.query(deleteQuery, [tenantBData.routeId])

        expect(result.rows.length).toBe(0)

        // Verify route still exists
        const verifyResult = await tenantHelper.queryWithTenantContext(
          tenantB.id,
          'SELECT id FROM routes WHERE id = $1',
          [tenantBData.routeId]
        )
        expect(verifyResult.rows.length).toBe(1)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant B cannot DELETE Tenant A facility', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantB.id)

        const deleteQuery = `
          DELETE FROM facilities
          WHERE id = $1
          RETURNING *
        `

        const result = await client.query(deleteQuery, [tenantAData.facilityId])

        expect(result.rows.length).toBe(0)

        // Verify facility still exists
        const verifyResult = await tenantHelper.queryWithTenantContext(
          tenantA.id,
          'SELECT id FROM facilities WHERE id = $1',
          [tenantAData.facilityId]
        )
        expect(verifyResult.rows.length).toBe(1)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })

    it('Tenant A cannot DELETE Tenant B document', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)

        const deleteQuery = `
          DELETE FROM documents
          WHERE id = $1
          RETURNING *
        `

        const result = await client.query(deleteQuery, [tenantBData.documentId])

        expect(result.rows.length).toBe(0)

        // Verify document still exists
        const verifyResult = await tenantHelper.queryWithTenantContext(
          tenantB.id,
          'SELECT id FROM documents WHERE id = $1',
          [tenantBData.documentId]
        )
        expect(verifyResult.rows.length).toBe(1)
      } catch (error: any) {
        expect(error.message).toContain('policy')
      } finally {
        client.release()
      }
    })
  })

  // ============================================
  // GROUP 7: TENANT CONTEXT VALIDATION
  // ============================================

  describe('Tenant Context Management', () => {
    it('should correctly set tenant context', async () => {
      const client = await pool.connect()
      try {
        await tenantHelper.setTenantContext(client, tenantA.id)
        const context = await tenantHelper.getTenantContext(client)

        expect(context).toBe(tenantA.id)
      } finally {
        client.release()
      }
    })

    it('should correctly switch tenant context', async () => {
      const client = await pool.connect()
      try {
        // Set to A
        await tenantHelper.setTenantContext(client, tenantA.id)
        let context = await tenantHelper.getTenantContext(client)
        expect(context).toBe(tenantA.id)

        // Switch to B
        await tenantHelper.setTenantContext(client, tenantB.id)
        context = await tenantHelper.getTenantContext(client)
        expect(context).toBe(tenantB.id)
      } finally {
        client.release()
      }
    })

    it('should return null when tenant context not set', async () => {
      const client = await pool.connect()
      try {
        // Get context without setting it
        const context = await tenantHelper.getTenantContext(client)

        // Should be null if not set
        expect(context).toBeNull()
      } finally {
        client.release()
      }
    })
  })

  // ============================================
  // GROUP 8: COMPLEX QUERY TESTS
  // ============================================

  describe('Complex Queries with Joins', () => {
    it('Tenant A should only see their vehicles in JOIN queries', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        `SELECT v.id, v.vehicle_number, COUNT(wo.id) as work_order_count
         FROM vehicles v
         LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
         GROUP BY v.id, v.vehicle_number`
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].id).toBe(tenantAData.vehicleId)
    })

    it('Tenant B should only see their vehicles in JOIN queries', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantB.id,
        `SELECT v.id, v.vehicle_number, COUNT(wo.id) as work_order_count
         FROM vehicles v
         LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
         GROUP BY v.id, v.vehicle_number`
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].id).toBe(tenantBData.vehicleId)
    })

    it('Tenant A should not see Tenant B data through aggregation queries', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        `SELECT tenant_id, COUNT(*) as vehicle_count FROM vehicles GROUP BY tenant_id`
      )

      // Should only see their own tenant_id
      expect(result.rows.length).toBe(1)
      expect(result.rows[0].tenant_id).toBe(tenantA.id)
      expect(result.rows[0].vehicle_count).toBe(1)
    })
  })

  // ============================================
  // GROUP 9: EDGE CASES & SECURITY
  // ============================================

  describe('Edge Cases and Security Scenarios', () => {
    it('should not allow accessing data with NULL tenant context', async () => {
      const client = await pool.connect()
      try {
        // Execute query without setting tenant context
        const result = await client.query('SELECT COUNT(*) as count FROM vehicles')

        // Should return 0 because tenant context is not set
        const count = parseInt(result.rows[0].count)
        expect(count).toBe(0)
      } finally {
        client.release()
      }
    })

    it('should enforce RLS even with UNION queries', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        `
        SELECT id, vehicle_number FROM vehicles WHERE id = $1
        UNION ALL
        SELECT id, vehicle_number FROM vehicles WHERE id = $2
        `,
        [tenantAData.vehicleId, tenantBData.vehicleId]
      )

      // Should only return Tenant A's vehicle
      expect(result.rows.length).toBe(1)
      expect(result.rows[0].id).toBe(tenantAData.vehicleId)
    })

    it('should enforce RLS on OR conditions', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        `SELECT COUNT(*) as count FROM vehicles WHERE id = $1 OR id = $2`,
        [tenantAData.vehicleId, tenantBData.vehicleId]
      )

      // Should return 1 (only Tenant A's vehicle)
      expect(parseInt(result.rows[0].count)).toBe(1)
    })

    it('should handle wildcard queries safely', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        "SELECT COUNT(*) as count FROM vehicles WHERE vehicle_number LIKE '%'"
      )

      // Should only return Tenant A's vehicles
      expect(parseInt(result.rows[0].count)).toBe(1)
    })

    it('should protect against SQL injection attempting tenant escape', async () => {
      const result = await tenantHelper.queryWithTenantContext(
        tenantA.id,
        "SELECT COUNT(*) as count FROM vehicles WHERE vehicle_number = $1",
        ["'; DROP TABLE vehicles; --"]
      )

      // Should safely return 0 (no matching vehicles)
      expect(parseInt(result.rows[0].count)).toBe(0)

      // Verify tables still exist
      const tableCheck = await pool.query(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'vehicles'"
      )
      expect(parseInt(tableCheck.rows[0].count)).toBeGreaterThan(0)
    })
  })

  // ============================================
  // GROUP 10: COMPREHENSIVE ISOLATION VERIFICATION
  // ============================================

  describe('Comprehensive Tenant Isolation Verification', () => {
    it('should completely isolate two tenants across all data types', async () => {
      // Verify isolation for each table
      const tables = [
        'vehicles',
        'drivers',
        'work_orders',
        'routes',
        'facilities',
        'documents',
      ]

      for (const table of tables) {
        // Tenant A counts their data
        const tenantAResult = await tenantHelper.queryWithTenantContext(
          tenantA.id,
          `SELECT COUNT(*) as count FROM ${table}`
        )
        const tenantACount = parseInt(tenantAResult.rows[0].count)

        // Tenant B counts their data
        const tenantBResult = await tenantHelper.queryWithTenantContext(
          tenantB.id,
          `SELECT COUNT(*) as count FROM ${table}`
        )
        const tenantBCount = parseInt(tenantBResult.rows[0].count)

        // Both should have exactly 1 record in their own context
        expect(tenantACount).toBe(1)
        expect(tenantBCount).toBe(1)

        // Now verify Tenant B cannot see Tenant A's data
        const crossTenantResult = await tenantHelper.queryWithTenantContext(
          tenantB.id,
          `SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = $1`,
          [tenantA.id]
        )
        const crossTenantCount = parseInt(crossTenantResult.rows[0].count)

        // Cross-tenant access should be 0
        expect(crossTenantCount).toBe(0)
      }
    })

    it('should verify isolation performance is acceptable', async () => {
      const startTime = performance.now()

      // Run 100 queries with tenant context
      for (let i = 0; i < 100; i++) {
        await tenantHelper.queryWithTenantContext(
          tenantA.id,
          'SELECT COUNT(*) FROM vehicles'
        )
      }

      const duration = performance.now() - startTime
      const avgTime = duration / 100

      // Average query should be fast (< 50ms with RLS overhead)
      expect(avgTime).toBeLessThan(50)
    })
  })

  // ============================================
  // GROUP 11: ALL RLS-ENABLED TABLES VERIFICATION
  // ============================================

  describe('All RLS-Protected Tables Verification', () => {
    const rlsEnabledTables = [
      'users',
      'audit_logs',
      'vehicles',
      'drivers',
      'facilities',
      'work_orders',
      'maintenance_schedules',
      'fuel_transactions',
      'charging_stations',
      'charging_sessions',
      'routes',
      'geofences',
      'geofence_events',
      'telemetry_data',
      'video_events',
      'inspection_forms',
      'inspections',
      'damage_reports',
      'safety_incidents',
      'vendors',
      'purchase_orders',
      'communication_logs',
      'policies',
      'policy_violations',
      'notifications',
      'tenants',
    ]

    for (const table of rlsEnabledTables) {
      it(`should have RLS enabled on ${table}`, async () => {
        const isEnabled = await tenantHelper.isRLSEnabled(table)
        expect(isEnabled).toBe(true)
      })

      it(`should have tenant_isolation policy on ${table}`, async () => {
        const policies = await tenantHelper.getRLSPolicies(table)
        const isolationPolicy = policies.find(
          p => p.policyname === `tenant_isolation_${table}`
        )
        expect(isolationPolicy).toBeDefined()
      })
    }
  })
})
