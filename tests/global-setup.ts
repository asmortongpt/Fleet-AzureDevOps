/**
 * Playwright Global Setup
 * Prepares database for E2E testing with fast reset harness
 */

import { FullConfig } from '@playwright/test';
import { getResetHarness } from '../api/src/db/reset/reset-harness';
import { getSnapshotManager } from '../api/src/db/reset/snapshot-manager';

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Playwright Global Setup: Database Reset Harness\n');

  const startTime = Date.now();
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_test';

  try {
    // Initialize reset harness
    const harness = getResetHarness(databaseUrl);
    const snapshotMgr = getSnapshotManager(databaseUrl);

    // Check if baseline snapshot exists
    const snapshots = await snapshotMgr.listSnapshots();
    const hasBaseline = snapshots.some(s => s.name === 'e2e-baseline');

    if (!hasBaseline || process.env.FORCE_RESET === 'true') {
      console.log('📦 Creating fresh database with baseline snapshot...');

      // Full reset with seed
      const result = await harness.seedFreshDatabase('e2e-baseline');

      if (!result.success) {
        console.error('❌ Database setup failed:', result.errors);
        throw new Error('Failed to setup test database');
      }

      console.log(`✅ Database seeded in ${result.duration.toFixed(2)}s`);
      console.log(`   - Tables: ${result.tablesReset}`);
      console.log(`   - Rows: ${result.rowsSeeded?.toLocaleString() || 'N/A'}`);
      console.log(`   - Snapshot created: e2e-baseline`);
    } else {
      console.log('♻️  Using existing baseline snapshot...');

      // Fast reset from snapshot
      const result = await harness.resetWithSnapshot('e2e-baseline');

      if (!result.success) {
        console.error('❌ Snapshot restore failed:', result.errors);
        console.log('🔄 Falling back to full reset...');

        // Fallback to full reset
        const fallbackResult = await harness.seedFreshDatabase('e2e-baseline');
        if (!fallbackResult.success) {
          throw new Error('Failed to setup test database (fallback also failed)');
        }
      } else {
        console.log(`✅ Database reset in ${result.duration.toFixed(2)}s`);
      }
    }

    await harness.close();

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⚡ Total setup time: ${totalDuration}s`);

    if (parseFloat(totalDuration) > 10) {
      console.log('⚠️  Warning: Setup took longer than 10s target');
    }

    console.log('\n✅ Global setup complete. Tests can now run.\n');
  } catch (error: any) {
    console.error('\n❌ Global setup failed:', error.message);
    console.error('\nStack trace:', error.stack);
    throw error;
  }
}

export default globalSetup;
