#!/usr/bin/env ts-node

/**
 * Database Migration CLI
 *
 * Usage:
 *   npm run migrate up           - Run all pending migrations
 *   npm run migrate down          - Rollback last batch
 *   npm run migrate down --all    - Rollback all migrations
 *   npm run migrate status        - Show migration status
 *   npm run migrate create <name> - Create new migration
 *   npm run migrate test          - Test migration system
 */

import { MigrationService } from '../lib/migrations';
import { logger } from '../services/logger';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'up':
      case 'latest':
        await MigrationService.runMigrations();
        break;

      case 'down':
      case 'rollback':
        const all = args.includes('--all');
        await MigrationService.rollbackMigrations(all);
        break;

      case 'status':
        const status = await MigrationService.getMigrationStatus();
        console.log('\n=== Migration Status ===');
        console.log(`Current Batch: ${status.currentBatch}`);
        console.log(`\nCompleted Migrations (${status.completed.length}):`);
        status.completed.forEach((m) => console.log(`  ✅ ${m}`));
        console.log(`\nPending Migrations (${status.pending.length}):`);
        status.pending.forEach((m) => console.log(`  ⏳ ${m}`));
        break;

      case 'create':
      case 'make':
        const migrationName = args[0];
        if (!migrationName) {
          console.error('❌ Error: Migration name required');
          console.log('Usage: npm run migrate create <name>');
          process.exit(1);
        }
        const path = await MigrationService.createMigration(migrationName);
        console.log(`✅ Migration created: ${path}`);
        break;

      case 'test':
        const testPassed = await MigrationService.testMigrations();
        if (testPassed) {
          console.log('✅ Migration system test passed');
        } else {
          console.error('❌ Migration system test failed');
          process.exit(1);
        }
        break;

      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }

    await MigrationService.close();
    process.exit(0);
  } catch (error) {
    logger.error('Migration command failed', { error: error instanceof Error ? error.message : error });
    console.error(`❌ Migration failed: ${error instanceof Error ? error.message : error}`);
    await MigrationService.close();
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
📊 Fleet Database Migration CLI

Commands:
  up, latest              Run all pending migrations
  down, rollback          Rollback last migration batch
  down --all              Rollback all migrations (DANGER!)
  status                  Show migration status (completed & pending)
  create <name>           Create a new migration file
  test                    Test migration system connectivity
  help                    Show this help message

Examples:
  npm run migrate up
  npm run migrate down
  npm run migrate status
  npm run migrate create add_vehicle_images
  npm run migrate down --all

Migration Files:
  Location: server/migrations/
  Format: YYYYMMDDHHMMSS_description.ts

Best Practices:
  ✅ Always test migrations locally before production
  ✅ Write rollback (down) functions for all migrations
  ✅ Use transactions for multi-step migrations
  ✅ Document breaking changes in migration comments
  ✅ Test rollback immediately after running migration
  ⚠️  Never edit existing migrations in production
  ⚠️  Always backup database before production migrations

For more info, see: /server/docs/MIGRATION_GUIDE.md
  `);
}

main();
