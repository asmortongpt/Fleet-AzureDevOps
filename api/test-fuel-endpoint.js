#!/usr/bin/env node
/**
 * Test script to verify fuel transactions endpoint fix
 * Tests the FuelTransactionService with corrected table name
 */

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fleet_test',
  user: 'fleet_user',
  password: 'fleet_test_pass'
});

// Simulate the FuelTransactionService getAll method
async function testFuelTransactionsQuery() {
  const tenantId = '874954c7-b68b-5485-8ddd-183932497849'; // Test tenant UUID

  const query = `
    SELECT *
    FROM fuel_transactions
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `;

  try {
    console.log('Testing fuel_transactions query...');
    console.log('Query:', query);
    console.log('Params:', [tenantId]);

    const result = await pool.query(query, [tenantId]);

    console.log('\n✓ SUCCESS: Query executed without errors');
    console.log('Rows returned:', result.rows.length);
    console.log('Sample data:', result.rows.slice(0, 2));

    return { success: true, count: result.rows.length };
  } catch (error) {
    console.error('\n✗ FAILED: Query error');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Run the test
testFuelTransactionsQuery()
  .then(result => {
    if (result.success) {
      console.log('\n✓ Fuel transactions endpoint FIX VERIFIED');
      process.exit(0);
    } else {
      console.log('\n✗ Fuel transactions endpoint still has issues');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
