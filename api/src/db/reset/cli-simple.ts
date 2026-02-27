#!/usr/bin/env node

/**
 * Simple Database Reset CLI (No external dependencies)
 * Fallback CLI when commander/chalk/ora are not available
 */

import { getResetHarness } from './reset-harness';
import { getSnapshotManager } from './snapshot-manager';
import { getIsolationManager } from './test-isolation';

const [,, command, ...args] = process.argv;

async function main() {
  try {
    switch (command) {
      case 'reset':
        await fullReset();
        break;
      case 'reset:fast':
        await fastReset();
        break;
      case 'snapshot':
        await createSnapshot(args[0]);
        break;
      case 'restore':
        await restoreSnapshot(args[0]);
        break;
      case 'snapshots':
        await listSnapshots();
        break;
      case 'cleanup':
        await cleanup();
        break;
      case 'stats':
        await showStats();
        break;
      case 'benchmark':
        await benchmark();
        break;
      default:
        showHelp();
        process.exit(1);
    }
  } catch (error: unknown) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'An unexpected error occurred');
    process.exit(1);
  }
}

async function fullReset() {
  console.log('\n🔄 Starting full database reset...\n');

  const harness = getResetHarness();
  const result = await harness.resetDatabase({ seed: true });

  if (!result.success) {
    console.error('❌ Reset failed:', result.errors);
    process.exit(1);
  }

  console.log(`✅ Reset completed in ${result.duration.toFixed(2)}s`);
  console.log(`   Tables: ${result.tablesReset}`);
  if (result.rowsSeeded) {
    console.log(`   Rows: ${result.rowsSeeded.toLocaleString()}`);
  }

  // Create snapshot
  console.log('\n📸 Creating e2e-baseline snapshot...');
  const snapshotMgr = getSnapshotManager();
  await snapshotMgr.createSnapshot('e2e-baseline', {
    compress: true,
    format: 'custom',
  });

  await harness.close();
}

async function fastReset() {
  console.log('\n⚡ Fast reset from snapshot...\n');

  const harness = getResetHarness();
  const result = await harness.resetWithSnapshot('e2e-baseline');

  if (!result.success) {
    console.error('❌ Fast reset failed:', result.errors);
    process.exit(1);
  }

  console.log(`✅ Reset completed in ${result.duration.toFixed(2)}s`);

  if (result.duration > 10) {
    console.log('⚠️  Warning: Reset took longer than 10s target');
  }

  await harness.close();
}

async function createSnapshot(name: string) {
  if (!name) {
    console.error('❌ Snapshot name required');
    process.exit(1);
  }

  console.log(`\n📸 Creating snapshot: ${name}...\n`);

  const snapshotMgr = getSnapshotManager();
  const metadata = await snapshotMgr.createSnapshot(name, {
    compress: true,
    format: 'custom',
  });

  console.log('✅ Snapshot created');
  console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Tables: ${metadata.tables}`);
}

async function restoreSnapshot(name: string) {
  if (!name) {
    console.error('❌ Snapshot name required');
    process.exit(1);
  }

  console.log(`\n♻️  Restoring snapshot: ${name}...\n`);

  const snapshotMgr = getSnapshotManager();
  await snapshotMgr.restoreSnapshot(name, {
    parallel: 4,
    clean: true,
    ifExists: true,
  });

  console.log('✅ Snapshot restored');
}

async function listSnapshots() {
  const snapshotMgr = getSnapshotManager();
  const snapshots = await snapshotMgr.listSnapshots();

  if (snapshots.length === 0) {
    console.log('\n⚠️  No snapshots found\n');
    return;
  }

  console.log(`\n📸 Found ${snapshots.length} snapshot(s):\n`);

  for (const snapshot of snapshots) {
    console.log(`  ${snapshot.name}`);
    console.log(`    Size: ${(snapshot.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    Tables: ${snapshot.tables}`);
    console.log(`    Created: ${new Date(snapshot.timestamp).toLocaleString()}`);
    console.log();
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test databases...\n');

  const manager = getIsolationManager();
  const stats = await manager.getStatistics();

  console.log(`Found ${stats.total} test databases`);

  const cleaned = await manager.cleanupTestDatabases(true);

  console.log(`✅ Cleaned up ${cleaned} database(s)`);

  await manager.close();
}

async function showStats() {
  const manager = getIsolationManager();
  const stats = await manager.getStatistics();

  console.log('\n📊 Test Database Statistics:\n');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Active: ${stats.active}`);
  console.log(`  Available: ${stats.available}`);
  console.log(`  Max: ${stats.maxDatabases}`);
  console.log(`  Utilization: ${stats.utilizationPercent}%`);

  if (stats.databases.length > 0) {
    console.log('\n📋 Active Databases:\n');
    for (const db of stats.databases) {
      console.log(`  ${db.name}`);
      console.log(`    Test: ${db.testFile || 'unknown'}`);
      console.log(`    Duration: ${(db.acquiredMs / 1000).toFixed(0)}s`);
      console.log();
    }
  }

  await manager.close();
}

async function benchmark() {
  console.log('\n⏱️  Running performance benchmark...\n');

  const harness = getResetHarness();
  const iterations = 5;
  const durations: number[] = [];

  for (let i = 1; i <= iterations; i++) {
    console.log(`Iteration ${i}/${iterations}...`);

    const startTime = Date.now();
    const result = await harness.resetWithSnapshot('e2e-baseline');
    const duration = (Date.now() - startTime) / 1000;

    if (result.success) {
      durations.push(duration);
      console.log(`  ✅ ${duration.toFixed(2)}s`);
    } else {
      console.log('  ❌ Failed');
    }
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  console.log('\n📊 Benchmark Results:\n');
  console.log(`  Iterations: ${iterations}`);
  console.log(`  Average: ${avg.toFixed(2)}s`);
  console.log(`  Min: ${min.toFixed(2)}s`);
  console.log(`  Max: ${max.toFixed(2)}s`);

  if (avg <= 10) {
    console.log('\n✅ Target met! (< 10s average)');
  } else {
    console.log(`\n⚠️  Target not met (${avg.toFixed(2)}s > 10s)`);
  }

  await harness.close();
}

function showHelp() {
  console.log(`
Database Reset Harness CLI

Usage: npm run db:<command>

Commands:
  reset          Full database reset with seed
  reset:fast     Fast reset from snapshot (< 10s)
  snapshot <name>  Create a named snapshot
  restore <name>   Restore from snapshot
  snapshots      List all snapshots
  cleanup        Cleanup test databases
  stats          Show test database statistics
  benchmark      Run performance benchmark

Examples:
  npm run db:reset
  npm run db:reset:fast
  npm run db:snapshot my-snapshot
  npm run db:benchmark
`);
}

void main();
