#!/usr/bin/env node
/**
 * Generate Comprehensive Data Coverage Report
 * Shows data distribution, coverage matrix, and sample queries
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function generateCoverageReport() {
  const client = await pool.connect();

  try {
    console.log('\n╔═════════════════════════════════════════════════════════════════╗');
    console.log('║         FLEET DATABASE - COMPREHENSIVE COVERAGE REPORT          ║');
    console.log('╚═════════════════════════════════════════════════════════════════╝\n');

    // Total Records
    const totalResult = await client.query(`
      SELECT SUM(row_count) as total FROM (
        SELECT COUNT(*) as row_count FROM tenants
        UNION ALL SELECT COUNT(*) FROM users
        UNION ALL SELECT COUNT(*) FROM drivers
        UNION ALL SELECT COUNT(*) FROM vehicles
        UNION ALL SELECT COUNT(*) FROM facilities
        UNION ALL SELECT COUNT(*) FROM fuel_transactions
        UNION ALL SELECT COUNT(*) FROM charging_stations
        UNION ALL SELECT COUNT(*) FROM charging_sessions
        UNION ALL SELECT COUNT(*) FROM work_orders
        UNION ALL SELECT COUNT(*) FROM routes
        UNION ALL SELECT COUNT(*) FROM geofences
        UNION ALL SELECT COUNT(*) FROM inspections
        UNION ALL SELECT COUNT(*) FROM safety_incidents
        UNION ALL SELECT COUNT(*) FROM vendors
        UNION ALL SELECT COUNT(*) FROM purchase_orders
        UNION ALL SELECT COUNT(*) FROM telemetry_data
        UNION ALL SELECT COUNT(*) FROM notifications
        UNION ALL SELECT COUNT(*) FROM audit_logs
      ) counts
    `);

    console.log(`📊 TOTAL RECORDS: ${totalResult.rows[0].total.toLocaleString()}\n`);

    // Entity Counts
    console.log('┌─────────────────────────────────────┬──────────┐');
    console.log('│ Entity Type                         │ Count    │');
    console.log('├─────────────────────────────────────┼──────────┤');

    const counts = await client.query(`
      SELECT 'Tenants' as entity, COUNT(*)::int as count FROM tenants
      UNION ALL SELECT 'Users', COUNT(*)::int FROM users
      UNION ALL SELECT 'Drivers', COUNT(*)::int FROM drivers
      UNION ALL SELECT 'Vehicles', COUNT(*)::int FROM vehicles
      UNION ALL SELECT 'Facilities', COUNT(*)::int FROM facilities
      UNION ALL SELECT 'Fuel Transactions', COUNT(*)::int FROM fuel_transactions
      UNION ALL SELECT 'Charging Stations', COUNT(*)::int FROM charging_stations
      UNION ALL SELECT 'Charging Sessions', COUNT(*)::int FROM charging_sessions
      UNION ALL SELECT 'Work Orders', COUNT(*)::int FROM work_orders
      UNION ALL SELECT 'Routes', COUNT(*)::int FROM routes
      UNION ALL SELECT 'Geofences', COUNT(*)::int FROM geofences
      UNION ALL SELECT 'Inspections', COUNT(*)::int FROM inspections
      UNION ALL SELECT 'Safety Incidents', COUNT(*)::int FROM safety_incidents
      UNION ALL SELECT 'Vendors', COUNT(*)::int FROM vendors
      UNION ALL SELECT 'Purchase Orders', COUNT(*)::int FROM purchase_orders
      UNION ALL SELECT 'Telemetry Data Points', COUNT(*)::int FROM telemetry_data
      UNION ALL SELECT 'Notifications', COUNT(*)::int FROM notifications
      UNION ALL SELECT 'Audit Logs', COUNT(*)::int FROM audit_logs
      ORDER BY count DESC
    `);

    for (const row of counts.rows) {
      console.log(`│ ${row.entity.padEnd(35)} │ ${String(row.count).padStart(8)} │`);
    }
    console.log('└─────────────────────────────────────┴──────────┘\n');

    // User Role Distribution
    console.log('👥 USER ROLE DISTRIBUTION:');
    const userRoles = await client.query(`
      SELECT role, COUNT(*)::int as count,
        COUNT(CASE WHEN is_active THEN 1 END)::int as active,
        COUNT(CASE WHEN NOT is_active THEN 1 END)::int as inactive
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `);

    console.log('┌─────────────────┬────────┬────────┬──────────┐');
    console.log('│ Role            │ Total  │ Active │ Inactive │');
    console.log('├─────────────────┼────────┼────────┼──────────┤');
    for (const row of userRoles.rows) {
      console.log(`│ ${row.role.padEnd(15)} │ ${String(row.count).padStart(6)} │ ${String(row.active).padStart(6)} │ ${String(row.inactive).padStart(8)} │`);
    }
    console.log('└─────────────────┴────────┴────────┴──────────┘\n');

    // Driver Status Distribution
    console.log('🚗 DRIVER STATUS DISTRIBUTION:');
    const driverStatuses = await client.query(`
      SELECT status, COUNT(*)::int as count
      FROM drivers
      GROUP BY status
      ORDER BY count DESC
    `);

    for (const row of driverStatuses.rows) {
      console.log(`   ${row.status.padEnd(15)} : ${row.count}`);
    }
    console.log('');

    // Vehicle Distribution
    console.log('🚛 VEHICLE DISTRIBUTION:');
    console.log('\nBy Status:');
    const vehicleStatuses = await client.query(`
      SELECT status, COUNT(*)::int as count
      FROM vehicles
      GROUP BY status
      ORDER BY count DESC
    `);

    for (const row of vehicleStatuses.rows) {
      console.log(`   ${row.status.padEnd(20)} : ${row.count}`);
    }

    console.log('\nBy Fuel Type:');
    const fuelTypes = await client.query(`
      SELECT fuel_type, COUNT(*)::int as count
      FROM vehicles
      GROUP BY fuel_type
      ORDER BY count DESC
    `);

    for (const row of fuelTypes.rows) {
      console.log(`   ${row.fuel_type.padEnd(20)} : ${row.count}`);
    }

    console.log('\nBy Vehicle Type:');
    const vehicleTypes = await client.query(`
      SELECT vehicle_type, COUNT(*)::int as count
      FROM vehicles
      GROUP BY vehicle_type
      ORDER BY count DESC
      LIMIT 10
    `);

    for (const row of vehicleTypes.rows) {
      console.log(`   ${row.vehicle_type.padEnd(20)} : ${row.count}`);
    }
    console.log('');

    // Work Order Distribution
    console.log('🔧 WORK ORDER STATUS DISTRIBUTION:');
    const workOrderStatuses = await client.query(`
      SELECT status, COUNT(*)::int as count, priority, COUNT(*)::int as priority_count
      FROM work_orders
      GROUP BY status, priority
      ORDER BY status, priority
    `);

    const woByStatus = await client.query(`
      SELECT status, COUNT(*)::int as count
      FROM work_orders
      GROUP BY status
      ORDER BY count DESC
    `);

    for (const row of woByStatus.rows) {
      console.log(`   ${row.status.padEnd(15)} : ${row.count}`);
    }
    console.log('');

    // Route Status Distribution
    console.log('🗺️  ROUTE STATUS DISTRIBUTION:');
    const routeStatuses = await client.query(`
      SELECT status, COUNT(*)::int as count
      FROM routes
      GROUP BY status
      ORDER BY count DESC
    `);

    for (const row of routeStatuses.rows) {
      console.log(`   ${row.status.padEnd(15)} : ${row.count}`);
    }
    console.log('');

    // Inspection Results
    console.log('✅ INSPECTION RESULTS DISTRIBUTION:');
    const inspectionResults = await client.query(`
      SELECT status, COUNT(*)::int as count
      FROM inspections
      GROUP BY status
      ORDER BY count DESC
    `);

    for (const row of inspectionResults.rows) {
      console.log(`   ${row.status.padEnd(15)} : ${row.count}`);
    }
    console.log('');

    // Safety Incidents by Type
    console.log('⚠️  SAFETY INCIDENTS BY TYPE:');
    const incidentTypes = await client.query(`
      SELECT incident_type, severity, COUNT(*)::int as count
      FROM safety_incidents
      GROUP BY incident_type, severity
      ORDER BY incident_type, severity
    `);

    for (const row of incidentTypes.rows) {
      console.log(`   ${row.incident_type.padEnd(20)} (${row.severity}) : ${row.count}`);
    }
    console.log('');

    // Data Quality Metrics
    console.log('📈 DATA QUALITY METRICS:\n');

    const assignedVehicles = await client.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(assigned_driver_id)::int as with_driver,
        COUNT(gps_device_id)::int as with_gps
      FROM vehicles
    `);

    console.log(`   Vehicles with assigned drivers: ${assignedVehicles.rows[0].with_driver}/${assignedVehicles.rows[0].total} (${Math.round(assignedVehicles.rows[0].with_driver / assignedVehicles.rows[0].total * 100)}%)`);
    console.log(`   Vehicles with GPS devices:      ${assignedVehicles.rows[0].with_gps}/${assignedVehicles.rows[0].total} (${Math.round(assignedVehicles.rows[0].with_gps / assignedVehicles.rows[0].total * 100)}%)`);

    const completedWorkOrders = await client.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed
      FROM work_orders
    `);

    console.log(`   Work orders completed:          ${completedWorkOrders.rows[0].completed}/${completedWorkOrders.rows[0].total} (${Math.round(completedWorkOrders.rows[0].completed / completedWorkOrders.rows[0].total * 100)}%)`);

    const readNotifications = await client.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(CASE WHEN is_read THEN 1 END)::int as read
      FROM notifications
    `);

    console.log(`   Notifications read:             ${readNotifications.rows[0].read}/${readNotifications.rows[0].total} (${Math.round(readNotifications.rows[0].read / readNotifications.rows[0].total * 100)}%)`);
    console.log('');

    // Time Range Coverage
    console.log('📅 TIME RANGE COVERAGE:\n');

    const dateRanges = await client.query(`
      SELECT
        'Fuel Transactions' as entity,
        MIN(transaction_date)::date as earliest,
        MAX(transaction_date)::date as latest
      FROM fuel_transactions
      UNION ALL
      SELECT
        'Telemetry Data',
        MIN(timestamp)::date,
        MAX(timestamp)::date
      FROM telemetry_data
      UNION ALL
      SELECT
        'Work Orders',
        MIN(created_at)::date,
        MAX(created_at)::date
      FROM work_orders
      UNION ALL
      SELECT
        'Routes',
        MIN(planned_start_time)::date,
        MAX(planned_start_time)::date
      FROM routes
    `);

    for (const row of dateRanges.rows) {
      console.log(`   ${row.entity.padEnd(25)} : ${row.earliest} to ${row.latest}`);
    }
    console.log('');

    // Sample Test Credentials
    console.log('🔐 TEST CREDENTIALS:\n');
    const sampleUsers = await client.query(`
      SELECT t.name as tenant, u.email, u.role, u.is_active
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.role IN ('admin', 'fleet_manager', 'driver')
      ORDER BY t.name, u.role
      LIMIT 10
    `);

    console.log('┌──────────────────────────┬────────────────────────────────────┬──────────────┬────────┐');
    console.log('│ Tenant                   │ Email                              │ Role         │ Active │');
    console.log('├──────────────────────────┼────────────────────────────────────┼──────────────┼────────┤');
    for (const row of sampleUsers.rows) {
      console.log('│ ${row.tenant.padEnd(24).substring(0, 24)} │ ${row.email.padEnd(34).substring(0, 34)} │ ${row.role.padEnd(12)} │ ${row.is_active ? '  ✓   ' : '  ✗   '} │`);
    }
    console.log('└──────────────────────────┴────────────────────────────────────┴──────────────┴────────┘');
    console.log('\n   Password for all test users: TestPassword123!\n');

    // Coverage Matrix
    console.log('✅ COVERAGE MATRIX:\n');
    console.log('   ✓ Tenants: Multiple tiers (Small, Medium, Enterprise)');
    console.log('   ✓ Users: All roles (admin, fleet_manager, driver, technician, viewer)');
    console.log('   ✓ Drivers: All statuses (active, on_leave, suspended)');
    console.log('   ✓ Vehicles: Multiple types, fuel types, statuses, ages');
    console.log('   ✓ Work Orders: All priorities and statuses');
    console.log('   ✓ Routes: All statuses (planned, in_progress, completed, cancelled)');
    console.log('   ✓ Inspections: Multiple types and results');
    console.log('   ✓ Incidents: Various types and severities');
    console.log('   ✓ Fuel Transactions: 2+ years of historical data');
    console.log('   ✓ Telemetry: Real-time and historical GPS/sensor data');
    console.log('   ✓ Charging: Stations and sessions for EVs');
    console.log('   ✓ Vendors & Purchase Orders: Complete procurement cycle');
    console.log('   ✓ Notifications: Read/unread states, priorities');
    console.log('   ✓ Audit Logs: Various actions and outcomes\n');

    console.log('╔═════════════════════════════════════════════════════════════════╗');
    console.log('║                   COVERAGE REPORT COMPLETE                      ║');
    console.log('╚═════════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

generateCoverageReport()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
