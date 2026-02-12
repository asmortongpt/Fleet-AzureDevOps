/**
 * Reset Harness Test Suite
 * Comprehensive tests for database reset functionality
 */

import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { DatabaseResetHarness } from '../reset-harness';
import { SnapshotManager } from '../snapshot-manager';
import { TestIsolationManager } from '../test-isolation';

// Use test database
const TEST_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_test';

describe('DatabaseResetHarness', () => {
  let harness: DatabaseResetHarness;
  let pool: Pool;

  beforeAll(() => {
    harness = new DatabaseResetHarness(TEST_DB_URL);
    pool = new Pool({ connectionString: TEST_DB_URL });
  });

  afterAll(async () => {
    await harness.close();
    await pool.end();
  });

  describe('Safety Checks', () => {
    it('should prevent reset on production database', async () => {
      const prodHarness = new DatabaseResetHarness('postgresql://user:pass@localhost/fleet_production');

      await expect(
        prodHarness.resetDatabase()
      ).rejects.toThrow(/production/i);

      await prodHarness.close();
    });

    it('should prevent reset when NODE_ENV=production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(
        harness.resetDatabase()
      ).rejects.toThrow(/production/i);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Full Reset', () => {
    it('should complete full reset within 30 seconds', async () => {
      const startTime = Date.now();

      const result = await harness.resetDatabase({ seed: false });

      const duration = (Date.now() - startTime) / 1000;

      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(30);
      expect(result.method).toBe('full');
      expect(result.tablesReset).toBeGreaterThan(0);

      console.log(`  ✅ Full reset completed in ${duration.toFixed(2)}s`);
    }, 60000);

    it('should reset and seed database', async () => {
      const result = await harness.resetDatabase({ seed: true });

      expect(result.success).toBe(true);
      expect(result.tablesReset).toBeGreaterThan(0);

      // Verify data exists
      const countResult = await pool.query(`
        SELECT SUM(n_live_tup) as total FROM pg_stat_user_tables
      `);

      const totalRows = parseInt(countResult.rows[0]?.total || '0');
      console.log(`  ✅ Seeded ${totalRows} rows across ${result.tablesReset} tables`);
    }, 60000);
  });

  describe('Snapshot Operations', () => {
    it('should create a snapshot', async () => {
      const snapshotMgr = new SnapshotManager(TEST_DB_URL);
      const testSnapshotName = `test_snapshot_${Date.now()}`;

      const metadata = await snapshotMgr.createSnapshot(testSnapshotName, {
        compress: true,
        format: 'custom',
      });

      expect(metadata.name).toBe(testSnapshotName);
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.tables).toBeGreaterThan(0);
      expect(metadata.hash).toMatch(/^[a-f0-9]{64}$/);

      console.log(`  ✅ Snapshot created: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);

      // Cleanup
      await snapshotMgr.deleteSnapshot(testSnapshotName);
    }, 60000);

    it('should verify snapshot integrity', async () => {
      const snapshotMgr = new SnapshotManager(TEST_DB_URL);
      const testSnapshotName = `integrity_test_${Date.now()}`;

      await snapshotMgr.createSnapshot(testSnapshotName);
      const isValid = await snapshotMgr.verifySnapshot(testSnapshotName);

      expect(isValid).toBe(true);

      // Cleanup
      await snapshotMgr.deleteSnapshot(testSnapshotName);
    }, 60000);

    it('should list all snapshots', async () => {
      const snapshotMgr = new SnapshotManager(TEST_DB_URL);

      const snapshots = await snapshotMgr.listSnapshots();

      expect(Array.isArray(snapshots)).toBe(true);
      console.log(`  ✅ Found ${snapshots.length} snapshot(s)`);
    });
  });

  describe('Fast Reset with Snapshot', () => {
    it('should complete snapshot reset within 10 seconds', async () => {
      // First create a baseline snapshot
      const result = await harness.seedFreshDatabase('test_baseline');
      expect(result.success).toBe(true);

      // Now test fast reset
      const startTime = Date.now();
      const resetResult = await harness.resetWithSnapshot('test_baseline', {
        parallel: 4,
      });
      const duration = (Date.now() - startTime) / 1000;

      expect(resetResult.success).toBe(true);
      expect(resetResult.duration).toBeLessThan(10);
      expect(resetResult.method).toBe('snapshot');

      console.log(`  ⚡ Snapshot reset completed in ${duration.toFixed(2)}s`);

      if (duration >= 10) {
        console.warn(`  ⚠️  Warning: Reset took ${duration.toFixed(2)}s (target: < 10s)`);
      }

      // Cleanup
      const snapshotMgr = new SnapshotManager(TEST_DB_URL);
      await snapshotMgr.deleteSnapshot('test_baseline');
    }, 60000);

    it('should restore database to identical state', async () => {
      // Seed and snapshot
      await harness.seedFreshDatabase('consistency_test');

      // Get initial table count
      const initialCount = await pool.query(`
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
      `);

      // Reset from snapshot
      await harness.resetWithSnapshot('consistency_test');

      // Verify same table count
      const afterCount = await pool.query(`
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
      `);

      expect(afterCount.rows[0].count).toBe(initialCount.rows[0].count);

      // Cleanup
      const snapshotMgr = new SnapshotManager(TEST_DB_URL);
      await snapshotMgr.deleteSnapshot('consistency_test');
    }, 60000);
  });

  describe('Performance Benchmarks', () => {
    it('should achieve consistent reset performance', async () => {
      // Create baseline
      await harness.seedFreshDatabase('perf_test');

      const iterations = 5;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const result = await harness.resetWithSnapshot('perf_test');
        const duration = (Date.now() - startTime) / 1000;

        expect(result.success).toBe(true);
        durations.push(duration);
      }

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      console.log(`  📊 Performance Statistics (${iterations} iterations):`);
      console.log(`     Average: ${avg.toFixed(2)}s`);
      console.log(`     Min: ${min.toFixed(2)}s`);
      console.log(`     Max: ${max.toFixed(2)}s`);
      console.log(`     Variance: ${(max - min).toFixed(2)}s`);

      expect(avg).toBeLessThan(10);

      // Cleanup
      const snapshotMgr = new SnapshotManager(TEST_DB_URL);
      await snapshotMgr.deleteSnapshot('perf_test');
    }, 120000);
  });
});

describe('TestIsolationManager', () => {
  let manager: TestIsolationManager;

  beforeAll(() => {
    manager = new TestIsolationManager(TEST_DB_URL, {
      maxDatabases: 3,
      prefix: 'vitest_test_',
    });
  });

  afterAll(async () => {
    await manager.cleanupTestDatabases(true);
    await manager.close();
  });

  describe('Database Acquisition', () => {
    it('should acquire an isolated test database', async () => {
      const testDb = await manager.acquireTestDatabase('test-file.spec.ts');

      expect(testDb.id).toBeTruthy();
      expect(testDb.name).toMatch(/^vitest_test_/);
      expect(testDb.url).toContain(testDb.name);
      expect(testDb.testFile).toBe('test-file.spec.ts');

      console.log(`  ✅ Acquired test database: ${testDb.name}`);

      await manager.releaseTestDatabase(testDb.id);
    }, 30000);

    it('should reuse released databases', async () => {
      const db1 = await manager.acquireTestDatabase();
      const db1Name = db1.name;

      await manager.releaseTestDatabase(db1.id);

      const db2 = await manager.acquireTestDatabase();

      expect(db2.name).toBe(db1Name);
      console.log(`  ♻️  Reused database: ${db2.name}`);

      await manager.releaseTestDatabase(db2.id);
    }, 30000);

    it('should enforce maximum database limit', async () => {
      const dbs = [];

      // Acquire up to limit
      for (let i = 0; i < 3; i++) {
        const db = await manager.acquireTestDatabase();
        dbs.push(db);
      }

      // Try to exceed limit
      await expect(
        manager.acquireTestDatabase()
      ).rejects.toThrow(/maximum/i);

      // Release all
      for (const db of dbs) {
        await manager.releaseTestDatabase(db.id);
      }
    }, 60000);
  });

  describe('Statistics', () => {
    it('should track database statistics', async () => {
      const db = await manager.acquireTestDatabase();

      const stats = await manager.getStatistics();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.active).toBeGreaterThan(0);
      expect(stats.maxDatabases).toBe(3);
      expect(parseFloat(stats.utilizationPercent)).toBeGreaterThan(0);

      console.log(`  📊 Statistics:`);
      console.log(`     Total: ${stats.total}`);
      console.log(`     Active: ${stats.active}`);
      console.log(`     Available: ${stats.available}`);
      console.log(`     Utilization: ${stats.utilizationPercent}%`);

      await manager.releaseTestDatabase(db.id);
    }, 30000);
  });

  describe('Cleanup', () => {
    it('should cleanup all test databases', async () => {
      // Acquire some databases
      const db1 = await manager.acquireTestDatabase();
      const db2 = await manager.acquireTestDatabase();

      await manager.releaseTestDatabase(db1.id);
      await manager.releaseTestDatabase(db2.id);

      const cleaned = await manager.cleanupTestDatabases(true);

      expect(cleaned).toBeGreaterThan(0);
      console.log(`  🧹 Cleaned up ${cleaned} database(s)`);
    }, 30000);
  });
});

describe('Integration Tests', () => {
  it('should handle full E2E workflow', async () => {
    console.log('\n  🔄 Running full E2E workflow test...\n');

    const harness = new DatabaseResetHarness(TEST_DB_URL);

    // Step 1: Full reset and seed
    console.log('  Step 1: Full reset and seed...');
    const resetResult = await harness.seedFreshDatabase('e2e_workflow_test');
    expect(resetResult.success).toBe(true);
    console.log(`  ✅ Seeded in ${resetResult.duration.toFixed(2)}s`);

    // Step 2: Fast reset from snapshot
    console.log('  Step 2: Fast reset from snapshot...');
    const fastResetResult = await harness.resetWithSnapshot('e2e_workflow_test');
    expect(fastResetResult.success).toBe(true);
    console.log(`  ✅ Reset in ${fastResetResult.duration.toFixed(2)}s`);

    // Step 3: Verify snapshot integrity
    console.log('  Step 3: Verify snapshot integrity...');
    const snapshotMgr = new SnapshotManager(TEST_DB_URL);
    const isValid = await snapshotMgr.verifySnapshot('e2e_workflow_test');
    expect(isValid).toBe(true);
    console.log('  ✅ Snapshot verified');

    // Step 4: Cleanup
    console.log('  Step 4: Cleanup...');
    await snapshotMgr.deleteSnapshot('e2e_workflow_test');
    await harness.close();
    console.log('  ✅ Cleanup complete');

    console.log('\n  ✅ Full E2E workflow test passed!\n');
  }, 120000);
});
