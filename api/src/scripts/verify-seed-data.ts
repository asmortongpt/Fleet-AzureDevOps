#!/usr/bin/env node
/**
 * Verify Seed Data Script
 * Checks that all test data was created correctly
 * Run with: npm run seed:verify
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'fleet-postgres-service',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

interface TableCount {
  table: string;
  count: number;
}

// Allowlist of valid table names to prevent SQL injection
const ALLOWED_TABLES = [
  'tenants',
  'users',
  'vehicles',
  'fuel_transactions',
  'work_orders',
  'maintenance_records',
  'routes'
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

async function verifyData() {
  const client = await pool.connect();

  try {
    console.log('\n🔍 Verifying Seed Data...\n');
    console.log('='.repeat(80));

    // ========================================
    // 1. Count all records by table
    // ========================================
    const tables: AllowedTable[] = [
      'tenants',
      'users',
      'vehicles',
      'fuel_transactions',
      'work_orders',
      'maintenance_records'
    ];

    const counts: Record<string, number> = {};

    for (const table of tables) {
      // Table names are validated against allowlist, safe to use in query
      if (!isAllowedTable(table)) {
        throw new Error(`Invalid table name: ${table}`);
      }
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
    }

    console.log('\n📊 RECORD COUNTS');
    console.log('-'.repeat(80));
    console.log(`   Tenants:                ${counts.tenants.toString().padStart(6)}`);
    console.log(`   Users:                  ${counts.users.toString().padStart(6)}`);
    console.log(`   Vehicles:               ${counts.vehicles.toString().padStart(6)}`);
    console.log(`   Fuel Transactions:      ${counts.fuel_transactions.toString().padStart(6)}`);
    console.log(`   Work Orders:            ${counts.work_orders.toString().padStart(6)}`);
    console.log(`   Maintenance Records:    ${counts.maintenance_records.toString().padStart(6)}`);

    // Check routes table if exists
    const routesCheck = await client.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'routes')`
    );
    if (routesCheck.rows[0].exists) {
      const routesCount = await client.query(`SELECT COUNT(*) as count FROM routes`);
      console.log(`   Routes:                 ${routesCount.rows[0].count.toString().padStart(6)}`);
    }

    // ========================================
    // 2. Breakdown by Tenant
    // ========================================
    console.log('\n\n📦 BREAKDOWN BY TENANT');
    console.log('-'.repeat(80));

    const tenants = await client.query(`SELECT id, name, domain FROM tenants ORDER BY name`);

    for (const tenant of tenants.rows) {
      console.log(`\n   ${tenant.name} (${tenant.domain})`);

      const userCount = await client.query(
        `SELECT COUNT(*) as count FROM users WHERE tenant_id = $1`,
        [tenant.id]
      );
      console.log(`      └─ Users: ${userCount.rows[0].count}`);

      const usersByRole = await client.query(
        `SELECT role, COUNT(*) as count FROM users WHERE tenant_id = $1 GROUP BY role ORDER BY role`,
        [tenant.id]
      );
      for (const role of usersByRole.rows) {
        console.log(`         └─ ${role.role}: ${role.count}`);
      }

      const vehicleCount = await client.query(
        `SELECT COUNT(*) as count FROM vehicles WHERE tenant_id = $1`,
        [tenant.id]
      );
      console.log(`      └─ Vehicles: ${vehicleCount.rows[0].count}`);

      const vehiclesByStatus = await client.query(
        `SELECT status, COUNT(*) as count FROM vehicles WHERE tenant_id = $1 GROUP BY status ORDER BY status`,
        [tenant.id]
      );
      for (const status of vehiclesByStatus.rows) {
        console.log(`         └─ ${status.status}: ${status.count}`);
      }
    }

    // ========================================
    // 3. Data Quality Checks
    // ========================================
    console.log('\n\n✅ DATA QUALITY CHECKS');
    console.log('-'.repeat(80));

    // Check for vehicles without VIN
    const noVin = await client.query(`SELECT COUNT(*) FROM vehicles WHERE vin IS NULL OR vin = ''`);
    console.log(`   Vehicles without VIN:             ${noVin.rows[0].count === '0' ? '✅ None' : '❌ ' + noVin.rows[0].count}`);

    // Check for users without email
    const noEmail = await client.query(`SELECT COUNT(*) FROM users WHERE email IS NULL OR email = ''`);
    console.log(`   Users without email:              ${noEmail.rows[0].count === '0' ? '✅ None' : '❌ ' + noEmail.rows[0].count}`);

    // Check for orphaned fuel transactions
    const orphanedFuel = await client.query(
      `SELECT COUNT(*) FROM fuel_transactions ft
       WHERE NOT EXISTS (SELECT 1 FROM vehicles v WHERE v.id = ft.vehicle_id)`
    );
    console.log(`   Orphaned fuel transactions:       ${orphanedFuel.rows[0].count === '0' ? '✅ None' : '❌ ' + orphanedFuel.rows[0].count}`);

    // Check for orphaned work orders
    const orphanedWO = await client.query(
      `SELECT COUNT(*) FROM work_orders wo
       WHERE NOT EXISTS (SELECT 1 FROM vehicles v WHERE v.id = wo.vehicle_id)`
    );
    console.log(`   Orphaned work orders:             ${orphanedWO.rows[0].count === '0' ? '✅ None' : '❌ ' + orphanedWO.rows[0].count}`);

    // Check tenant isolation
    const crossTenantUsers = await client.query(
      `SELECT COUNT(*) FROM users u
       WHERE NOT EXISTS (SELECT 1 FROM tenants t WHERE t.id = u.tenant_id)`
    );
    console.log(`   Users with invalid tenant:        ${crossTenantUsers.rows[0].count === '0' ? '✅ None' : '❌ ' + crossTenantUsers.rows[0].count}`);

    // ========================================
    // 4. Sample Data Preview
    // ========================================
    console.log('\n\n📋 SAMPLE DATA PREVIEW');
    console.log('-'.repeat(80));

    // Sample Vehicles
    const sampleVehicles = await client.query(
      `SELECT v.make, v.model, v.year, v.license_plate, v.status, t.name as tenant
       FROM vehicles v
       JOIN tenants t ON v.tenant_id = t.id
       LIMIT 5`
    );
    console.log('\n   Sample Vehicles:');
    for (const vehicle of sampleVehicles.rows) {
      console.log(`      • ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) - ${vehicle.status} - ${vehicle.tenant}`);
    }

    // Sample Work Orders
    const sampleWorkOrders = await client.query(
      `SELECT wo.title, wo.status, wo.priority, v.make, v.model
       FROM work_orders wo
       JOIN vehicles v ON wo.vehicle_id = v.id
       ORDER BY wo.created_at DESC
       LIMIT 5`
    );
    console.log('\n   Recent Work Orders:');
    for (const wo of sampleWorkOrders.rows) {
      console.log(`      • ${wo.title} - ${wo.status} (${wo.priority}) - ${wo.make} ${wo.model}`);
    }

    // Fuel Statistics
    const fuelStats = await client.query(
      `SELECT
         COUNT(*) as total_transactions,
         SUM(gallons)::NUMERIC(10,2) as total_gallons,
         SUM(cost)::NUMERIC(10,2) as total_cost,
         AVG(price_per_gallon)::NUMERIC(10,2) as avg_price
       FROM fuel_transactions`
    );
    console.log('\n   Fuel Statistics:');
    const stats = fuelStats.rows[0];
    console.log(`      • Total Transactions: ${stats.total_transactions}`);
    console.log(`      • Total Gallons: ${stats.total_gallons}`);
    console.log(`      • Total Cost: $${stats.total_cost}`);
    console.log(`      • Average Price/Gallon: $${stats.avg_price}`);

    // ========================================
    // 5. Test Credentials
    // ========================================
    console.log('\n\n🔐 TEST CREDENTIALS');
    console.log('-'.repeat(80));

    const testUsers = await client.query(
      `SELECT u.email, u.role, t.name as tenant_name, t.domain
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.role = 'admin'
       ORDER BY t.name`
    );

    console.log('\n   Login with any of these admin accounts:');
    for (const user of testUsers.rows) {
      console.log(`      • Email: ${user.email}`);
      console.log(`        Password: TestPassword123!`);
      console.log(`        Tenant: ${user.tenant_name}`);
      console.log('');
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log('\n💡 Quick SQL Queries for Manual Verification:');
    console.log('\n   -- List all tenants');
    console.log('   SELECT ` + (await getTableColumns(pool, 'tenants')).join(', ') + ` FROM tenants;');
    console.log('\n   -- Count vehicles by status');
    console.log('   SELECT status, COUNT(*) FROM vehicles GROUP BY status;');
    console.log('\n   -- Recent fuel transactions');
    console.log('   SELECT ` + (await getTableColumns(pool, 'fuel_transactions')).join(', ') + ` FROM fuel_transactions ORDER BY transaction_date DESC LIMIT 10;');
    console.log('\n   -- Work orders by status');
    console.log('   SELECT status, priority, COUNT(*) FROM work_orders GROUP BY status, priority;');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error verifying data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run verification
verifyData()
  .then(() => {
    console.log('✅ Verification completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
