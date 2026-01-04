import { FullConfig } from '@playwright/test';
import { Pool } from 'pg';
import { unlink } from 'fs/promises';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 E2E Global Teardown Starting...\n');

  // Clean up test database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_test',
  });

  try {
    console.log('🗑️  Cleaning up test data...');

    // Get test tenant ID
    const tenantResult = await pool.query(
      `SELECT id FROM tenants WHERE name = $1`,
      ['Test Organization']
    );

    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].id;

      // Delete test data in correct order (respecting foreign keys)
      await pool.query('DELETE FROM vehicle_locations WHERE vehicle_id IN (SELECT vehicle_id FROM vehicles WHERE tenant_id = $1)', [tenantId]);
      await pool.query('DELETE FROM maintenance_records WHERE vehicle_id IN (SELECT vehicle_id FROM vehicles WHERE tenant_id = $1)', [tenantId]);
      await pool.query('DELETE FROM fuel_records WHERE vehicle_id IN (SELECT vehicle_id FROM vehicles WHERE tenant_id = $1)', [tenantId]);
      await pool.query('DELETE FROM incidents WHERE tenant_id = $1', [tenantId]);
      await pool.query('DELETE FROM vehicles WHERE tenant_id = $1', [tenantId]);
      await pool.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
      await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);

      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  } finally {
    await pool.end();
  }

  // Clean up auth state file
  try {
    await unlink('tests/e2e/fixtures/auth.json');
    console.log('✅ Auth state file removed');
  } catch (error) {
    // File may not exist - that's okay
  }

  console.log('\n✅ E2E Global Teardown Complete\n');
}

export default globalTeardown;
