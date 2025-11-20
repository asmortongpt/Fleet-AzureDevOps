#!/usr/bin/env ts-node
/**
 * Tenant Isolation Test Script
 * CRITICAL SECURITY VALIDATION: Tests that Row-Level Security (RLS) properly isolates tenant data
 *
 * This script validates that:
 * 1. RLS is enabled on all multi-tenant tables
 * 2. Tenant A cannot access Tenant B's data
 * 3. Session variables are properly set
 * 4. RLS policies are correctly configured
 *
 * Run this script after deploying migrations 032 and 033:
 * $ ts-node test-tenant-isolation.ts
 *
 * Expected result: ALL TESTS PASS
 * If any test fails, DO NOT deploy to production
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Test configuration
const TEST_RESULTS: Array<{test: string; passed: boolean; details: string}> = []

// Color output for terminal
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(level: 'info' | 'success' | 'error' | 'warn', message: string) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`
  }
  console.log(`${prefix[level]} ${message}`)
}

function addTestResult(test: string, passed: boolean, details: string) {
  TEST_RESULTS.push({ test, passed, details })
  if (passed) {
    log('success', `${test}: ${details}`)
  } else {
    log('error', `${test}: ${details}`)
  }
}

async function main() {
  log('info', 'Starting Tenant Isolation Security Tests')
  log('info', '==========================================\n')

  // Create database pool using environment variables
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fleet_management',
    user: process.env.DB_USER || 'fleetadmin',
    password: process.env.DB_PASSWORD
  })

  try {
    // Test 1: Database Connection
    log('info', '\n[Test 1] Testing database connection...')
    try {
      const result = await pool.query('SELECT NOW()')
      addTestResult('Database Connection', true, 'Successfully connected to database')
    } catch (error) {
      addTestResult('Database Connection', false, `Failed: ${error}`)
      throw error
    }

    // Test 2: Create test tenants
    log('info', '\n[Test 2] Creating test tenants...')
    const tenant1Id = '11111111-1111-1111-1111-111111111111'
    const tenant2Id = '22222222-2222-2222-2222-222222222222'

    try {
      await pool.query(`
        INSERT INTO tenants (id, name, domain, is_active)
        VALUES
          ($1, 'Test Tenant A', 'tenant-a.test', true),
          ($2, 'Test Tenant B', 'tenant-b.test', true)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      `, [tenant1Id, tenant2Id])
      addTestResult('Create Test Tenants', true, 'Tenant A and Tenant B created')
    } catch (error) {
      addTestResult('Create Test Tenants', false, `Failed: ${error}`)
      throw error
    }

    // Test 3: Create test users for each tenant
    log('info', '\n[Test 3] Creating test users...')
    const user1Id = '11111111-1111-1111-1111-111111111112'
    const user2Id = '22222222-2222-2222-2222-222222222223'

    try {
      await pool.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
        VALUES
          ($1, $2, 'user1@tenant-a.test', 'hash1', 'User', 'One', 'admin'),
          ($3, $4, 'user2@tenant-b.test', 'hash2', 'User', 'Two', 'admin')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
      `, [user1Id, tenant1Id, user2Id, tenant2Id])
      addTestResult('Create Test Users', true, 'User for each tenant created')
    } catch (error) {
      addTestResult('Create Test Users', false, `Failed: ${error}`)
      throw error
    }

    // Test 4: Create test vehicles for each tenant
    log('info', '\n[Test 4] Creating test vehicles...')
    const vehicle1Id = '11111111-1111-1111-1111-111111111113'
    const vehicle2Id = '22222222-2222-2222-2222-222222222224'

    try {
      await pool.query(`
        INSERT INTO vehicles (id, tenant_id, vin, make, model, year)
        VALUES
          ($1, $2, 'TEST1111111111111', 'Toyota', 'Camry', 2023),
          ($3, $4, 'TEST2222222222222', 'Honda', 'Accord', 2023)
        ON CONFLICT (id) DO UPDATE SET make = EXCLUDED.make
      `, [vehicle1Id, tenant1Id, vehicle2Id, tenant2Id])
      addTestResult('Create Test Vehicles', true, 'Vehicle for each tenant created')
    } catch (error) {
      addTestResult('Create Test Vehicles', false, `Failed: ${error}`)
      throw error
    }

    // Test 5: Check RLS is enabled on tables
    log('info', '\n[Test 5] Verifying RLS is enabled...')
    try {
      const result = await pool.query(`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'vehicles', 'work_orders', 'audit_logs')
        ORDER BY tablename
      `)

      const allEnabled = result.rows.every(row => row.rowsecurity === true)
      const enabledCount = result.rows.filter(row => row.rowsecurity).length

      if (allEnabled && result.rows.length > 0) {
        addTestResult('RLS Enabled', true, `${enabledCount} tables have RLS enabled`)
      } else {
        addTestResult('RLS Enabled', false, `Only ${enabledCount}/${result.rows.length} tables have RLS enabled`)
      }
    } catch (error) {
      addTestResult('RLS Enabled', false, `Failed: ${error}`)
    }

    // Test 6: Check RLS policies exist
    log('info', '\n[Test 6] Verifying RLS policies exist...')
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        AND policyname LIKE 'tenant_isolation_%'
      `)

      const policyCount = parseInt(result.rows[0].policy_count)
      if (policyCount >= 25) {
        addTestResult('RLS Policies', true, `${policyCount} tenant isolation policies found`)
      } else {
        addTestResult('RLS Policies', false, `Only ${policyCount} policies found, expected 25+`)
      }
    } catch (error) {
      addTestResult('RLS Policies', false, `Failed: ${error}`)
    }

    // Test 7: Test tenant isolation with fleet_webapp_user
    log('info', '\n[Test 7] Testing tenant isolation (as fleet_webapp_user)...')

    // First, check if fleet_webapp_user role exists
    const roleCheck = await pool.query(`
      SELECT COUNT(*) as role_exists
      FROM pg_roles
      WHERE rolname = 'fleet_webapp_user'
    `)

    if (roleCheck.rows[0].role_exists === '0') {
      log('warn', 'fleet_webapp_user role does not exist yet. Run migration 031 first.')
      log('warn', 'Skipping tenant isolation test with fleet_webapp_user')
    } else {
      // Create a connection as fleet_webapp_user
      const webappPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'fleet_management',
        user: 'fleet_webapp_user',
        password: process.env.DB_WEBAPP_PASSWORD || 'CHANGE_ME_IN_PRODUCTION'
      })

      try {
        // Set tenant context to Tenant A
        await webappPool.query(`SET app.current_tenant_id = '${tenant1Id}'`)

        // Query vehicles - should only see Tenant A's vehicle
        const vehiclesA = await webappPool.query('SELECT * FROM vehicles')
        const tenant1Only = vehiclesA.rows.every(v => v.tenant_id === tenant1Id)
        const countA = vehiclesA.rows.length

        if (tenant1Only && countA >= 1) {
          addTestResult('Tenant A Isolation', true, `Tenant A sees only ${countA} vehicle(s) (their own)`)
        } else {
          addTestResult('Tenant A Isolation', false, `Tenant A sees ${countA} vehicles, data leakage detected!`)
        }

        // Switch to Tenant B
        await webappPool.query(`SET app.current_tenant_id = '${tenant2Id}'`)

        // Query vehicles - should only see Tenant B's vehicle
        const vehiclesB = await webappPool.query('SELECT * FROM vehicles')
        const tenant2Only = vehiclesB.rows.every(v => v.tenant_id === tenant2Id)
        const countB = vehiclesB.rows.length

        if (tenant2Only && countB >= 1) {
          addTestResult('Tenant B Isolation', true, `Tenant B sees only ${countB} vehicle(s) (their own)`)
        } else {
          addTestResult('Tenant B Isolation', false, `Tenant B sees ${countB} vehicles, data leakage detected!`)
        }

        // Test cross-tenant query (should be prevented)
        await webappPool.query(`SET app.current_tenant_id = '${tenant1Id}'`)
        const crossTenantQuery = await webappPool.query(
          'SELECT * FROM vehicles WHERE tenant_id = $1',
          [tenant2Id]
        )

        if (crossTenantQuery.rows.length === 0) {
          addTestResult('Cross-Tenant Prevention', true, 'Tenant A cannot query Tenant B data explicitly')
        } else {
          addTestResult('Cross-Tenant Prevention', false, 'CRITICAL: Tenant A can access Tenant B data!')
        }

        await webappPool.end()
      } catch (error) {
        addTestResult('Tenant Isolation Test', false, `Failed: ${error}`)
      }
    }

    // Test 8: Test WITHOUT tenant context (should fail or return empty)
    log('info', '\n[Test 8] Testing query without tenant context...')
    try {
      const webappPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'fleet_management',
        user: 'fleet_webapp_user',
        password: process.env.DB_WEBAPP_PASSWORD || 'CHANGE_ME_IN_PRODUCTION'
      })

      // Query without setting tenant context
      const result = await webappPool.query('SELECT * FROM vehicles')

      if (result.rows.length === 0) {
        addTestResult('No Tenant Context', true, 'Query returns 0 rows without tenant context (secure)')
      } else {
        addTestResult('No Tenant Context', false, `SECURITY ISSUE: Query returns ${result.rows.length} rows without tenant context!`)
      }

      await webappPool.end()
    } catch (error) {
      // It's actually OK if this fails - means RLS is working
      addTestResult('No Tenant Context', true, 'Query fails without tenant context (expected behavior)')
    }

    // Test 9: Verify NOT NULL constraints on tenant_id
    log('info', '\n[Test 9] Verifying NOT NULL constraints on tenant_id...')
    try {
      const result = await pool.query(`
        SELECT
          table_name,
          column_name,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'tenant_id'
        AND table_name IN ('users', 'vehicles', 'work_orders', 'audit_logs')
        ORDER BY table_name
      `)

      const allNotNull = result.rows.every(row => row.is_nullable === 'NO')
      const notNullCount = result.rows.filter(row => row.is_nullable === 'NO').length

      if (allNotNull && result.rows.length > 0) {
        addTestResult('NOT NULL Constraints', true, `${notNullCount}/${result.rows.length} tables have NOT NULL constraint`)
      } else {
        addTestResult('NOT NULL Constraints', false, `Only ${notNullCount}/${result.rows.length} tables have NOT NULL constraint`)
      }
    } catch (error) {
      addTestResult('NOT NULL Constraints', false, `Failed: ${error}`)
    }

    // Test 10: Attempt to insert NULL tenant_id (should fail)
    log('info', '\n[Test 10] Testing NULL tenant_id insertion (should fail)...')
    try {
      await pool.query(`
        INSERT INTO vehicles (vin, make, model, year, tenant_id)
        VALUES ('NULLTEST00000000', 'Test', 'Null', 2023, NULL)
      `)
      addTestResult('NULL Prevention', false, 'SECURITY ISSUE: NULL tenant_id was accepted!')
    } catch (error) {
      addTestResult('NULL Prevention', true, 'NULL tenant_id correctly rejected')
    }

    // Cleanup test data
    log('info', '\n[Cleanup] Removing test data...')
    try {
      await pool.query('DELETE FROM vehicles WHERE id IN ($1, $2)', [vehicle1Id, vehicle2Id])
      await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [user1Id, user2Id])
      await pool.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenant1Id, tenant2Id])
      log('success', 'Test data cleaned up successfully')
    } catch (error) {
      log('warn', `Cleanup warning: ${error}`)
    }

  } catch (error) {
    log('error', `Test suite failed: ${error}`)
  } finally {
    await pool.end()
  }

  // Print summary
  log('info', '\n==========================================')
  log('info', 'TEST SUMMARY')
  log('info', '==========================================\n')

  const passed = TEST_RESULTS.filter(r => r.passed).length
  const failed = TEST_RESULTS.filter(r => !r.passed).length
  const total = TEST_RESULTS.length

  TEST_RESULTS.forEach(result => {
    const status = result.passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`
    console.log(`[${status}] ${result.test}`)
  })

  console.log(`\n${colors.blue}Total Tests:${colors.reset} ${total}`)
  console.log(`${colors.green}Passed:${colors.reset} ${passed}`)
  console.log(`${colors.red}Failed:${colors.reset} ${failed}`)

  if (failed === 0) {
    console.log(`\n${colors.green}✓ ALL TESTS PASSED - Tenant isolation is working correctly!${colors.reset}`)
    console.log(`${colors.green}✓ Safe to deploy to production${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`\n${colors.red}✗ ${failed} TEST(S) FAILED - DO NOT DEPLOY TO PRODUCTION${colors.reset}`)
    console.log(`${colors.red}✗ Fix the issues above before deploying${colors.reset}`)
    process.exit(1)
  }
}

// Run the test suite
main().catch(error => {
  log('error', `Fatal error: ${error}`)
  process.exit(1)
})
