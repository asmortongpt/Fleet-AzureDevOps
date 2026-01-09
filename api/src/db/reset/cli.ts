#!/usr/bin/env node

/**
 * Database Reset CLI Tool
 * Command-line interface for database reset operations
 *
 * Usage:
 *   npm run db:reset              # Full reset with seed
 *   npm run db:reset:fast         # Fast restore from snapshot
 *   npm run db:snapshot           # Create named snapshot
 *   npm run db:restore <name>     # Restore from snapshot
 *   npm run db:cleanup            # Cleanup test databases
 */

import { Command } from 'commander';
import { getResetHarness } from './reset-harness';
import { getSnapshotManager } from './snapshot-manager';
import { getIsolationManager } from './test-isolation';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('db-reset')
  .description('Fleet Database Reset Harness CLI')
  .version('1.0.0');

/**
 * Full database reset command
 */
program
  .command('reset')
  .description('Full database reset: drop, migrate, seed')
  .option('-n, --no-seed', 'Skip seeding')
  .option('-s, --snapshot <name>', 'Create snapshot after reset', 'e2e-baseline')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be done without executing')
  .action(async (options) => {
    const spinner = ora('Starting full database reset...').start();

    try {
      if (options.dryRun) {
        spinner.info('DRY RUN MODE - No changes will be made');
        console.log('\n📋 Operations that would be performed:');
        console.log('  1. Terminate active connections');
        console.log('  2. Drop all tables, sequences, and types');
        console.log('  3. Run database migrations');
        if (options.seed) {
          console.log('  4. Seed database with test data');
        }
        if (options.snapshot) {
          console.log(`  5. Create snapshot: ${options.snapshot}`);
        }
        return;
      }

      const harness = getResetHarness();

      // Confirm if not in CI
      if (!process.env.CI) {
        const dbUrl = process.env.DATABASE_URL || '';
        const dbName = new URL(dbUrl.replace('postgresql://', 'http://')).pathname.slice(1);

        spinner.warn(`About to reset database: ${chalk.yellow(dbName)}`);

        if (dbName.includes('prod') || dbName.includes('production')) {
          spinner.fail(chalk.red('🚨 ABORTED: Cannot reset production database!'));
          process.exit(1);
        }

        // Simple confirmation in Node (commander doesn't have built-in prompts)
        console.log(chalk.yellow('\n⚠️  This will DELETE ALL DATA in the database!'));
        console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      spinner.text = 'Resetting database...';

      const result = await harness.resetDatabase({
        seed: options.seed,
        verbose: options.verbose,
      });

      if (!result.success) {
        spinner.fail(chalk.red('Database reset failed'));
        console.error(chalk.red('\n❌ Errors:'));
        result.errors?.forEach(err => console.error(chalk.red(`  - ${err}`)));
        process.exit(1);
      }

      spinner.succeed(`Database reset completed in ${result.duration.toFixed(2)}s`);

      console.log(chalk.green('\n✅ Reset Summary:'));
      console.log(`  Tables: ${result.tablesReset}`);
      if (result.rowsSeeded) {
        console.log(`  Rows seeded: ${result.rowsSeeded.toLocaleString()}`);
      }

      // Create snapshot if requested
      if (options.snapshot && options.seed) {
        spinner.start(`Creating snapshot: ${options.snapshot}...`);

        const snapshotMgr = getSnapshotManager();
        const metadata = await snapshotMgr.createSnapshot(options.snapshot, {
          compress: true,
          format: 'custom',
        });

        spinner.succeed(`Snapshot created: ${options.snapshot}`);
        console.log(chalk.green('\n📸 Snapshot Info:'));
        console.log(`  Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Tables: ${metadata.tables}`);
        console.log(`  Hash: ${metadata.hash.substring(0, 16)}...`);
      }

      await harness.close();
    } catch (error: any) {
      spinner.fail(chalk.red('Reset failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Fast reset using snapshot
 */
program
  .command('reset:fast')
  .description('Fast database reset from snapshot')
  .option('-s, --snapshot <name>', 'Snapshot name to restore', 'e2e-baseline')
  .option('-p, --parallel <jobs>', 'Parallel restore jobs', '4')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const spinner = ora(`Restoring from snapshot: ${options.snapshot}...`).start();

    try {
      const harness = getResetHarness();

      const result = await harness.resetWithSnapshot(options.snapshot, {
        parallel: parseInt(options.parallel),
        verbose: options.verbose,
      });

      if (!result.success) {
        spinner.fail(chalk.red('Fast reset failed'));
        console.error(chalk.red('\n❌ Errors:'));
        result.errors?.forEach(err => console.error(chalk.red(`  - ${err}`)));
        process.exit(1);
      }

      spinner.succeed(`Fast reset completed in ${result.duration.toFixed(2)}s`);

      console.log(chalk.green('\n⚡ Performance:'));
      console.log(`  Duration: ${result.duration.toFixed(2)}s`);
      console.log(`  Tables: ${result.tablesReset}`);
      console.log(`  Method: ${result.method}`);

      if (result.duration > 10) {
        console.log(chalk.yellow('\n⚠️  Warning: Reset took longer than 10s target'));
      }

      await harness.close();
    } catch (error: any) {
      spinner.fail(chalk.red('Fast reset failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Create snapshot
 */
program
  .command('snapshot')
  .description('Create database snapshot')
  .argument('<name>', 'Snapshot name')
  .option('-c, --no-compress', 'Disable compression')
  .option('-f, --format <format>', 'Format: custom, tar, plain', 'custom')
  .option('--data-only', 'Snapshot data only (no schema)')
  .option('--schema-only', 'Snapshot schema only (no data)')
  .action(async (name, options) => {
    const spinner = ora(`Creating snapshot: ${name}...`).start();

    try {
      const snapshotMgr = getSnapshotManager();

      const metadata = await snapshotMgr.createSnapshot(name, {
        compress: options.compress,
        format: options.format,
        dataOnly: options.dataOnly,
        schemaOnly: options.schemaOnly,
      });

      spinner.succeed(`Snapshot created: ${name}`);

      console.log(chalk.green('\n📸 Snapshot Details:'));
      console.log(`  Name: ${metadata.name}`);
      console.log(`  Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Tables: ${metadata.tables}`);
      console.log(`  Hash: ${metadata.hash}`);
      console.log(`  Timestamp: ${new Date(metadata.timestamp).toISOString()}`);
    } catch (error: any) {
      spinner.fail(chalk.red('Snapshot creation failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Restore snapshot
 */
program
  .command('restore')
  .description('Restore database from snapshot')
  .argument('<name>', 'Snapshot name')
  .option('-p, --parallel <jobs>', 'Parallel restore jobs', '4')
  .option('--no-clean', 'Don\'t clean existing objects')
  .action(async (name, options) => {
    const spinner = ora(`Restoring snapshot: ${name}...`).start();

    try {
      const snapshotMgr = getSnapshotManager();

      // Verify snapshot first
      const isValid = await snapshotMgr.verifySnapshot(name);
      if (!isValid) {
        spinner.fail(chalk.red('Snapshot verification failed'));
        process.exit(1);
      }

      await snapshotMgr.restoreSnapshot(name, {
        parallel: parseInt(options.parallel),
        clean: options.clean,
        ifExists: true,
      });

      spinner.succeed(`Snapshot restored: ${name}`);
    } catch (error: any) {
      spinner.fail(chalk.red('Restore failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * List snapshots
 */
program
  .command('snapshots')
  .description('List all available snapshots')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      const snapshotMgr = getSnapshotManager();
      const snapshots = await snapshotMgr.listSnapshots();

      if (snapshots.length === 0) {
        console.log(chalk.yellow('No snapshots found'));
        return;
      }

      console.log(chalk.green(`\n📸 Found ${snapshots.length} snapshot(s):\n`));

      for (const snapshot of snapshots) {
        console.log(chalk.bold(snapshot.name));
        console.log(`  Size: ${(snapshot.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Tables: ${snapshot.tables}`);
        console.log(`  Created: ${new Date(snapshot.timestamp).toLocaleString()}`);

        if (options.verbose) {
          console.log(`  Hash: ${snapshot.hash}`);
          console.log(`  Database: ${snapshot.databaseUrl}`);
        }

        console.log();
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Delete snapshot
 */
program
  .command('delete')
  .description('Delete a snapshot')
  .argument('<name>', 'Snapshot name')
  .action(async (name) => {
    const spinner = ora(`Deleting snapshot: ${name}...`).start();

    try {
      const snapshotMgr = getSnapshotManager();
      await snapshotMgr.deleteSnapshot(name);

      spinner.succeed(`Snapshot deleted: ${name}`);
    } catch (error: any) {
      spinner.fail(chalk.red('Delete failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Cleanup test databases
 */
program
  .command('cleanup')
  .description('Cleanup all test databases')
  .option('-f, --force', 'Force cleanup even if databases are active')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const spinner = ora('Cleaning up test databases...').start();

    try {
      const manager = getIsolationManager();

      // Show stats first
      const stats = await manager.getStatistics();
      spinner.info(`Found ${stats.total} test databases (${stats.active} active, ${stats.available} available)`);

      if (stats.active > 0 && !options.force) {
        spinner.warn(chalk.yellow('Active test databases found. Use --force to cleanup anyway.'));
        process.exit(0);
      }

      const cleaned = await manager.cleanupTestDatabases(options.force);

      spinner.succeed(`Cleaned up ${cleaned} test database(s)`);
      await manager.close();
    } catch (error: any) {
      spinner.fail(chalk.red('Cleanup failed'));
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Show test database statistics
 */
program
  .command('stats')
  .description('Show test database statistics')
  .action(async () => {
    try {
      const manager = getIsolationManager();
      const stats = await manager.getStatistics();

      console.log(chalk.green('\n📊 Test Database Statistics:\n'));
      console.log(`  Total: ${stats.total}`);
      console.log(`  Active: ${stats.active}`);
      console.log(`  Available: ${stats.available}`);
      console.log(`  Max: ${stats.maxDatabases}`);
      console.log(`  Utilization: ${stats.utilizationPercent}%`);

      if (stats.longestAcquired > 0) {
        console.log(`  Longest acquired: ${(stats.longestAcquired / 1000).toFixed(0)}s`);
      }

      if (stats.databases.length > 0) {
        console.log(chalk.green('\n📋 Active Databases:\n'));
        for (const db of stats.databases) {
          console.log(chalk.bold(`  ${db.name}`));
          console.log(`    Test: ${db.testFile || 'unknown'}`);
          console.log(`    Duration: ${(db.acquiredMs / 1000).toFixed(0)}s`);
          console.log();
        }
      }

      await manager.close();
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Benchmark reset performance
 */
program
  .command('benchmark')
  .description('Benchmark reset performance')
  .option('-n, --iterations <n>', 'Number of iterations', '5')
  .option('-s, --snapshot <name>', 'Snapshot to use', 'e2e-baseline')
  .action(async (options) => {
    console.log(chalk.green('\n⏱️  Database Reset Performance Benchmark\n'));

    const iterations = parseInt(options.iterations);
    const durations: number[] = [];

    try {
      const harness = getResetHarness();

      for (let i = 1; i <= iterations; i++) {
        const spinner = ora(`Iteration ${i}/${iterations}...`).start();

        const result = await harness.resetWithSnapshot(options.snapshot, {
          parallel: 4,
        });

        if (result.success) {
          durations.push(result.duration);
          spinner.succeed(`Iteration ${i}: ${result.duration.toFixed(2)}s`);
        } else {
          spinner.fail(`Iteration ${i} failed`);
        }
      }

      await harness.close();

      // Calculate statistics
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const median = durations.sort()[Math.floor(durations.length / 2)];

      console.log(chalk.green('\n📊 Benchmark Results:\n'));
      console.log(`  Iterations: ${iterations}`);
      console.log(`  Average: ${avg.toFixed(2)}s`);
      console.log(`  Median: ${median.toFixed(2)}s`);
      console.log(`  Min: ${min.toFixed(2)}s`);
      console.log(`  Max: ${max.toFixed(2)}s`);

      if (avg <= 10) {
        console.log(chalk.green(`\n✅ Target met! (< 10s average)`));
      } else {
        console.log(chalk.yellow(`\n⚠️  Target not met (${avg.toFixed(2)}s > 10s)`));
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Benchmark failed: ${error.message}`));
      process.exit(1);
    }
  });

// Parse and execute
program.parse();

// Export for programmatic use
export { program };
