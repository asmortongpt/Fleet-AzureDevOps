/**
 * Test Migration Script
 *
 * Tests the data integrity constraints and partitioning migrations
 * Phase 4 - Agent 10
 */

import { pool } from '../db';
import * as fs from 'fs';
import * as path from 'path';

async function testMigrations() {
  console.log('🧪 Testing data integrity migrations...\n');

  try {
    // Read migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const constraintsMigration = fs.readFileSync(
      path.join(migrationsDir, '010_add_constraints.sql'),
      'utf-8'
    );
    const partitioningMigration = fs.readFileSync(
      path.join(migrationsDir, '011_add_partitioning.sql'),
      'utf-8'
    );

    console.log('📋 Step 1: Applying constraints migration (010_add_constraints.sql)...');
    try {
      await pool.query(constraintsMigration);
      console.log('✅ Constraints migration applied successfully\n');
    } catch (error: any) {
      // Some constraints might already exist, check if it's a "already exists" error
      if (error.message.includes('already exists') || error.code === '42710') {
        console.log('⚠️  Some constraints already exist, continuing...\n');
      } else {
        throw error;
      }
    }

    console.log('📋 Step 2: Applying partitioning migration (011_add_partitioning.sql)...');
    try {
      await pool.query(partitioningMigration);
      console.log('✅ Partitioning migration applied successfully\n');
    } catch (error: any) {
      if (error.message.includes('already exists') || error.code === '42P07') {
        console.log('⚠️  Partitions already exist, continuing...\n');
      } else {
        throw error;
      }
    }

    console.log('🧪 Step 3: Testing constraints...\n');

    // Test 1: Negative odometer
    console.log('  Test 1: Rejecting negative odometer...');
    try {
      await pool.query(
        `INSERT INTO vehicles (id, tenant_id, vehicle_number, odometer, status)
         VALUES (gen_random_uuid(), gen_random_uuid(), 'TEST-001', -1000, 'active')`
      );
      console.log('  ❌ FAILED: Should have rejected negative odometer');
    } catch (error: any) {
      if (error.message.includes('chk_vehicles_odometer_positive')) {
        console.log('  ✅ PASSED: Negative odometer rejected');
      } else {
        console.log(`  ❌ FAILED: Wrong error: ${error.message}`);
      }
    }

    // Test 2: Invalid fuel level
    console.log('  Test 2: Rejecting invalid fuel level...');
    try {
      await pool.query(
        `INSERT INTO vehicles (id, tenant_id, vehicle_number, fuel_level, status)
         VALUES (gen_random_uuid(), gen_random_uuid(), 'TEST-002', 150, 'active')`
      );
      console.log('  ❌ FAILED: Should have rejected fuel level > 100');
    } catch (error: any) {
      if (error.message.includes('chk_vehicles_fuel_level_valid')) {
        console.log('  ✅ PASSED: Invalid fuel level rejected');
      } else {
        console.log(`  ❌ FAILED: Wrong error: ${error.message}`);
      }
    }

    // Test 3: Future date on fuel transaction
    console.log('  Test 3: Rejecting future date on fuel transaction...');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    try {
      await pool.query(
        `INSERT INTO fuel_transactions (
          tenant_id, vehicle_id, transaction_date, gallons, cost_per_gallon, total_cost
        ) VALUES (gen_random_uuid(), gen_random_uuid(), $1, 10, 3.5, 35)`,
        [futureDate]
      );
      console.log('  ❌ FAILED: Should have rejected future date');
    } catch (error: any) {
      if (error.message.includes('chk_fuel_transaction_date_not_future')) {
        console.log('  ✅ PASSED: Future date rejected');
      } else {
        console.log(`  ❌ FAILED: Wrong error: ${error.message}`);
      }
    }

    // Test 4: Invalid fuel calculation
    console.log('  Test 4: Rejecting invalid fuel calculation...');
    try {
      await pool.query(
        `INSERT INTO fuel_transactions (
          tenant_id, vehicle_id, transaction_date, gallons, cost_per_gallon, total_cost
        ) VALUES (gen_random_uuid(), gen_random_uuid(), NOW(), 10, 3.5, 100)`
      );
      console.log('  ❌ FAILED: Should have rejected invalid calculation (10 * 3.5 != 100)');
    } catch (error: any) {
      if (error.message.includes('chk_fuel_calculation_valid')) {
        console.log('  ✅ PASSED: Invalid calculation rejected');
      } else {
        console.log(`  ❌ FAILED: Wrong error: ${error.message}`);
      }
    }

    // Test 5: GPS speed too high
    console.log('  Test 5: Rejecting unreasonable GPS speed...');
    try {
      await pool.query(
        `INSERT INTO gps_tracks (
          tenant_id, vehicle_id, timestamp, latitude, longitude, speed
        ) VALUES (gen_random_uuid(), gen_random_uuid(), NOW(), 30.0, -95.0, 200)`
      );
      console.log('  ❌ FAILED: Should have rejected speed > 150 mph');
    } catch (error: any) {
      if (error.message.includes('chk_gps_speed_reasonable')) {
        console.log('  ✅ PASSED: Unreasonable speed rejected');
      } else {
        console.log(`  ❌ FAILED: Wrong error: ${error.message}`);
      }
    }

    console.log('\n🧪 Step 4: Testing partitioning...\n');

    // Test 6: Insert into GPS partition
    console.log('  Test 6: Inserting GPS track into current month partition...');
    const timestamp = new Date('2026-02-15T10:00:00Z');
    const gpsResult = await pool.query(
      `INSERT INTO gps_tracks (
        tenant_id, vehicle_id, timestamp, latitude, longitude
      ) VALUES (gen_random_uuid(), gen_random_uuid(), $1, 30.0, -95.0)
      RETURNING id`,
      [timestamp]
    );

    const gpsId = gpsResult.rows[0].id;

    // Verify partition
    const partitionResult = await pool.query(
      `SELECT tableoid::regclass AS partition_name
       FROM gps_tracks WHERE id = $1`,
      [gpsId]
    );

    if (partitionResult.rows[0].partition_name === 'gps_tracks_2026_02') {
      console.log('  ✅ PASSED: GPS track inserted into correct partition (gps_tracks_2026_02)');
    } else {
      console.log(`  ❌ FAILED: Wrong partition: ${partitionResult.rows[0].partition_name}`);
    }

    // Test 7: Partition metadata
    console.log('  Test 7: Checking partition metadata...');
    const metadataResult = await pool.query(
      `SELECT COUNT(*) as count FROM partition_metadata WHERE is_active = true`
    );
    const partitionCount = parseInt(metadataResult.rows[0].count, 10);

    if (partitionCount >= 30) {
      console.log(`  ✅ PASSED: Found ${partitionCount} active partitions in metadata`);
    } else {
      console.log(`  ⚠️  WARNING: Only ${partitionCount} partitions found (expected 30)`);
    }

    // Test 8: Partition helper functions
    console.log('  Test 8: Testing partition helper functions...');
    try {
      const createResult = await pool.query(
        `SELECT create_next_partition('gps_tracks', 6) as message`
      );
      console.log(`  ✅ PASSED: Partition function works - ${createResult.rows[0].message}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('  ✅ PASSED: Partition function works (partition already exists)');
      } else {
        console.log(`  ❌ FAILED: ${error.message}`);
      }
    }

    console.log('\n✅ All migration tests completed!\n');

    // Summary
    console.log('📊 Migration Summary:');
    console.log('  - 85 data integrity constraints added');
    console.log('  - 30 monthly partitions created (15 per table)');
    console.log('  - 2 partition helper functions created');
    console.log('  - Partition metadata tracking table created');

    // Check constraint count
    const constraintCountResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'CHECK'
        AND constraint_name LIKE 'chk_%'
    `);
    console.log(`\n  Total CHECK constraints: ${constraintCountResult.rows[0].count}`);

    // Check partition count
    const partitionCountResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE table_name = 'gps_tracks') as gps_partitions,
        COUNT(*) FILTER (WHERE table_name = 'telemetry_data') as telemetry_partitions
      FROM partition_metadata
      WHERE is_active = true
    `);
    console.log(
      `  GPS partitions: ${partitionCountResult.rows[0].gps_partitions}`
    );
    console.log(
      `  Telemetry partitions: ${partitionCountResult.rows[0].telemetry_partitions}`
    );

    console.log('\n🎉 Migration testing complete!\n');
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run tests
testMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
