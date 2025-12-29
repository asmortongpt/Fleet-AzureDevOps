#!/usr/bin/env node
/**
 * Database Migration Deployment Script
 *
 * Safely deploys database migrations with automatic backup and verification.
 *
 * Usage:
 *   node scripts/migrate-deploy.js [--dry-run] [--skip-backup]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipBackup = args.includes('--skip-backup');

function log(message, level = 'info') {
  const prefix = {
    info: '📊',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[level] || '📊';

  console.log(`${prefix} ${message}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      stdio: isDryRun ? 'inherit' : 'pipe',
      encoding: 'utf-8',
      ...options
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

async function deployMigration() {
  log('Starting migration deployment...', 'info');

  // 1. Verify environment
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'info');
  log(`Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`, 'info');

  if (isDryRun) {
    log('DRY RUN MODE - No changes will be made', 'warning');
  }

  // 2. Create backup (unless skipped)
  if (!skipBackup && !isDryRun) {
    log('Creating database backup...', 'info');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    try {
      exec(`pg_dump "${process.env.DATABASE_URL}" > "${backupFile}"`);
      const stats = fs.statSync(backupFile);
      log(`Backup created: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
    } catch (error) {
      log('Backup failed - aborting migration', 'error');
      throw error;
    }
  }

  // 3. Run migration
  log('Running migration...', 'info');

  try {
    if (isDryRun) {
      exec('npx drizzle-kit push:pg --dry-run', { stdio: 'inherit' });
      log('Dry run completed - no changes made', 'success');
    } else {
      exec('npx drizzle-kit push:pg', { stdio: 'inherit' });
      log('Migration applied successfully', 'success');
    }
  } catch (error) {
    log('Migration failed!', 'error');
    if (!skipBackup && !isDryRun) {
      log('Backup is available for rollback', 'warning');
    }
    throw error;
  }

  // 4. Verify migration (only if not dry-run)
  if (!isDryRun) {
    log('Verifying migration...', 'info');

    try {
      const verifyScript = path.join(__dirname, 'migrate-verify.js');
      if (fs.existsSync(verifyScript)) {
        exec(`node "${verifyScript}"`, { stdio: 'inherit' });
        log('Verification passed', 'success');
      } else {
        log('Verification script not found - skipping', 'warning');
      }
    } catch (error) {
      log('Verification failed - manual review required', 'warning');
      console.error(error);
    }
  }

  log('Migration deployment complete!', 'success');
}

// Run deployment
deployMigration().catch((error) => {
  log('Deployment failed', 'error');
  console.error(error);
  process.exit(1);
});
