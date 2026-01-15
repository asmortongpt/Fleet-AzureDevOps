/**
 * Database Reset Harness
 * Orchestrates fast database reset for E2E testing
 * Target: < 10 seconds for reset + reseed
 */

import { Pool } from 'pg';
import { SnapshotManager, getSnapshotManager } from './snapshot-manager';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface ResetOptions {
  seed?: boolean;
  useSnapshot?: boolean;
  snapshotName?: string;
  parallel?: number;
  verbose?: boolean;
}

export interface ResetResult {
  success: boolean;
  duration: number;
  method: 'snapshot' | 'migrations' | 'full';
  tablesReset: number;
  rowsSeeded?: number;
  errors?: string[];
}

export class DatabaseResetHarness {
  private databaseUrl: string;
  private snapshotManager: SnapshotManager;
  private pool: Pool;
  private migrationDir: string;

  constructor(databaseUrl?: string) {
    this.databaseUrl = databaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_dev';
    this.snapshotManager = getSnapshotManager(this.databaseUrl);
    this.pool = new Pool({ connectionString: this.databaseUrl });
    this.migrationDir = process.env.MIGRATION_DIR || path.join(process.cwd(), 'api/src/migrations');
  }

  /**
   * Safety check: Prevent operations on production database
   */
  private validateSafety(): void {
    const dbName = new URL(this.databaseUrl.replace('postgresql://', 'http://')).pathname.slice(1);

    if (dbName.includes('prod') ||
        dbName.includes('production') ||
        process.env.NODE_ENV === 'production') {
      throw new Error('🚨 SAFETY: Database reset is prohibited in production environment!');
    }

    console.log(`🔍 Safety check passed: ${dbName} (${process.env.NODE_ENV || 'development'})`);
  }

  /**
   * Fast reset using snapshot restore
   * This is the primary method for E2E testing
   */
  async resetWithSnapshot(
    snapshotName?: string,
    options: ResetOptions = {}
  ): Promise<ResetResult> {
    const startTime = Date.now();
    this.validateSafety();

    console.log('♻️  Starting fast reset using snapshot...');

    try {
      // Use latest snapshot if no name provided
      const name = snapshotName || 'e2e-baseline';

      // Verify snapshot exists and is valid
      const isValid = await this.snapshotManager.verifySnapshot(name);
      if (!isValid) {
        throw new Error(`Snapshot '${name}' is invalid or corrupted`);
      }

      // Disconnect all active sessions
      await this.terminateConnections();

      // Restore snapshot with parallel jobs
      await this.snapshotManager.restoreSnapshot(name, {
        parallel: options.parallel || 4,
        clean: true,
        ifExists: true,
      });

      const tableCount = await this.getTableCount();
      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ Fast reset completed in ${duration.toFixed(2)}s`);

      return {
        success: true,
        duration,
        method: 'snapshot',
        tablesReset: tableCount,
      };
    } catch (error: any) {
      console.error('❌ Snapshot reset failed:', error.message);
      return {
        success: false,
        duration: (Date.now() - startTime) / 1000,
        method: 'snapshot',
        tablesReset: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Full reset: Drop all tables, run migrations, and seed
   * Use this to create initial snapshot
   */
  async resetDatabase(options: ResetOptions = {}): Promise<ResetResult> {
    const startTime = Date.now();
    this.validateSafety();

    console.log('🔄 Starting full database reset...');

    const errors: string[] = [];

    try {
      // Step 1: Disconnect all connections
      await this.terminateConnections();

      // Step 2: Drop all tables
      console.log('🗑️  Dropping all tables...');
      await this.dropAllTables();

      // Step 3: Run migrations
      console.log('📦 Running migrations...');
      await this.runMigrations();

      // Step 4: Seed database (if requested)
      let rowsSeeded = 0;
      if (options.seed !== false) {
        console.log('🌱 Seeding database...');
        rowsSeeded = await this.seedDatabase();
      }

      const tableCount = await this.getTableCount();
      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ Full reset completed in ${duration.toFixed(2)}s`);

      return {
        success: true,
        duration,
        method: 'full',
        tablesReset: tableCount,
        rowsSeeded,
      };
    } catch (error: any) {
      console.error('❌ Full reset failed:', error.message);
      errors.push(error.message);

      return {
        success: false,
        duration: (Date.now() - startTime) / 1000,
        method: 'full',
        tablesReset: 0,
        errors,
      };
    }
  }

  /**
   * Create a fresh database snapshot after seed
   * Use this to create baseline for fast resets
   */
  async seedFreshDatabase(snapshotName = 'e2e-baseline'): Promise<ResetResult> {
    console.log('🌱 Creating fresh seeded database with snapshot...');

    // Full reset with seed
    const resetResult = await this.resetDatabase({ seed: true });

    if (!resetResult.success) {
      return resetResult;
    }

    // Create snapshot
    console.log(`📸 Creating snapshot: ${snapshotName}`);
    await this.snapshotManager.createSnapshot(snapshotName, {
      compress: true,
      format: 'custom',
    });

    return resetResult;
  }

  /**
   * Terminate all active database connections
   * Required before restore operations
   */
  private async terminateConnections(): Promise<void> {
    try {
      const dbName = new URL(this.databaseUrl.replace('postgresql://', 'http://')).pathname.slice(1);

      await this.pool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [dbName]);

      console.log('🔌 Terminated active connections');
    } catch (error) {
      console.warn('⚠️  Failed to terminate connections:', error);
    }
  }

  /**
   * Drop all tables in the database
   * Uses CASCADE to handle foreign key dependencies
   */
  private async dropAllTables(): Promise<void> {
    try {
      // Disable triggers for faster drop
      await this.pool.query('SET session_replication_role = replica;');

      // Drop all tables in public schema
      await this.pool.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
          LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);

      // Drop all sequences
      await this.pool.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public')
          LOOP
            EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
          END LOOP;
        END $$;
      `);

      // Drop all custom types
      await this.pool.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e')
          LOOP
            EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
          END LOOP;
        END $$;
      `);

      // Re-enable triggers
      await this.pool.query('SET session_replication_role = DEFAULT;');

      console.log('✅ All tables dropped');
    } catch (error: any) {
      throw new Error(`Failed to drop tables: ${error.message}`);
    }
  }

  /**
   * Run database migrations
   * Supports multiple migration directories
   */
  private async runMigrations(): Promise<void> {
    try {
      // Check if drizzle-kit is available
      const hasDrizzle = await this.commandExists('drizzle-kit');

      if (hasDrizzle) {
        // Use drizzle-kit for migrations
        const { stdout } = await execAsync('npx drizzle-kit push:pg', {
          cwd: path.join(process.cwd(), 'api'),
          env: { ...process.env, DATABASE_URL: this.databaseUrl },
        });
        console.log(stdout);
      } else {
        // Fallback: Run SQL migrations manually
        console.log('⚠️  drizzle-kit not found, running SQL migrations...');
        await this.runSqlMigrations();
      }

      console.log('✅ Migrations completed');
    } catch (error: any) {
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  /**
   * Run SQL migrations from files
   */
  private async runSqlMigrations(): Promise<void> {
    const fs = require('fs/promises');

    try {
      const files = await fs.readdir(this.migrationDir);
      const sqlFiles = files
        .filter((f: string) => f.endsWith('.sql'))
        .sort(); // Run in alphabetical order

      for (const file of sqlFiles) {
        const filePath = path.join(this.migrationDir, file);
        const sql = await fs.readFile(filePath, 'utf-8');

        console.log(`  Running: ${file}`);
        await this.pool.query(sql);
      }
    } catch (error: any) {
      throw new Error(`SQL migration failed: ${error.message}`);
    }
  }

  /**
   * Seed database with test data
   * Uses COPY for bulk inserts (faster than INSERT)
   */
  private async seedDatabase(): Promise<number> {
    try {
      // Check if seed script exists
      const seedScriptPath = path.join(process.cwd(), 'api/src/db/seeds/index.ts');
      const fs = require('fs');

      if (fs.existsSync(seedScriptPath)) {
        // Run seed script
        const { stdout } = await execAsync('npm run db:seed', {
          cwd: path.join(process.cwd(), 'api'),
          env: { ...process.env, DATABASE_URL: this.databaseUrl },
        });
        console.log(stdout);
      } else {
        console.log('⚠️  No seed script found, skipping...');
        return 0;
      }

      // Count total rows
      const result = await this.pool.query(`
        SELECT SUM(n_live_tup) as total
        FROM pg_stat_user_tables
      `);

      const totalRows = parseInt(result.rows[0]?.total || '0');
      console.log(`✅ Seeded ${totalRows} rows`);

      return totalRows;
    } catch (error: any) {
      console.warn('⚠️  Seed failed:', error.message);
      return 0;
    }
  }

  /**
   * Get table count
   */
  private async getTableCount(): Promise<number> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
      `);
      return parseInt(result.rows[0].count);
    } catch {
      return 0;
    }
  }

  /**
   * Check if command exists
   */
  private async commandExists(command: string): Promise<boolean> {
    try {
      await execAsync(`which ${command}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Singleton instance
let resetHarness: DatabaseResetHarness | null = null;

export function getResetHarness(databaseUrl?: string): DatabaseResetHarness {
  if (!resetHarness) {
    resetHarness = new DatabaseResetHarness(databaseUrl);
  }
  return resetHarness;
}
