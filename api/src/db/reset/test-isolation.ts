/**
 * Test Isolation Manager
 * Provides isolated databases for parallel test execution
 * Supports database pooling and automatic cleanup
 */

import crypto from 'crypto';

import { Pool } from 'pg';

import { SnapshotManager, getSnapshotManager } from './snapshot-manager';

export interface TestDatabase {
  id: string;
  name: string;
  url: string;
  pid: number;
  acquiredAt: number;
  testFile?: string;
}

export interface IsolationOptions {
  maxDatabases?: number;
  prefix?: string;
  baseSnapshot?: string;
  autoCleanup?: boolean;
  idleTimeout?: number;
}

export class TestIsolationManager {
  private baseUrl: string;
  private adminPool: Pool;
  private activeDatabases: Map<string, TestDatabase>;
  private availableDatabases: string[];
  private snapshotManager: SnapshotManager;
  private options: Required<IsolationOptions>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(baseUrl?: string, options: IsolationOptions = {}) {
    this.baseUrl = baseUrl || process.env.DATABASE_URL || (process.env.NODE_ENV !== 'production' ? 'postgresql://postgres:postgres@localhost:5432/postgres' : (() => { throw new Error('DATABASE_URL must be set in production'); })());

    // Connect to postgres database for admin operations
    const adminUrl = this.baseUrl.replace(/\/[^/]+$/, '/postgres');
    this.adminPool = new Pool({ connectionString: adminUrl });

    this.activeDatabases = new Map();
    this.availableDatabases = [];
    this.snapshotManager = getSnapshotManager(this.baseUrl);

    this.options = {
      maxDatabases: options.maxDatabases || 10,
      prefix: options.prefix || 'fleet_test_',
      baseSnapshot: options.baseSnapshot || 'e2e-baseline',
      autoCleanup: options.autoCleanup !== false,
      idleTimeout: options.idleTimeout || 300000, // 5 minutes
    };

    if (this.options.autoCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * Acquire an isolated test database
   * Returns connection URL for exclusive use by one test
   */
  async acquireTestDatabase(testFile?: string): Promise<TestDatabase> {
    // Check if we can reuse an available database
    if (this.availableDatabases.length > 0) {
      const dbName = this.availableDatabases.pop()!;
      const testDb = await this.markDatabaseAcquired(dbName, testFile);
      console.log(`♻️  Reusing test database: ${dbName}`);
      return testDb;
    }

    // Check if we've hit the limit
    if (this.activeDatabases.size >= this.options.maxDatabases) {
      throw new Error(`Maximum test databases (${this.options.maxDatabases}) exceeded. Release databases when done.`);
    }

    // Create a new test database
    const dbName = this.generateDatabaseName();
    console.log(`🔨 Creating test database: ${dbName}`);

    try {
      // Create database
      await this.adminPool.query(`CREATE DATABASE ${dbName}`);

      // Restore from snapshot
      const dbUrl = this.baseUrl.replace(/\/[^/]+$/, `/${dbName}`);
      const tempSnapshot = getSnapshotManager(dbUrl);

      try {
        await tempSnapshot.restoreSnapshot(this.options.baseSnapshot, {
          parallel: 2,
          clean: false,
        });
      } catch (error: any) {
        // If snapshot doesn't exist, create an empty database
        console.warn(`⚠️  Snapshot '${this.options.baseSnapshot}' not found, using empty database`);
      }

      const testDb = await this.markDatabaseAcquired(dbName, testFile);
      console.log(`✅ Test database ready: ${dbName}`);
      return testDb;
    } catch (error: any) {
      console.error(`❌ Failed to create test database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Release a test database back to the pool
   * Database is reset and made available for reuse
   */
  async releaseTestDatabase(id: string): Promise<void> {
    const testDb = this.activeDatabases.get(id);

    if (!testDb) {
      console.warn(`⚠️  Test database ${id} not found in active pool`);
      return;
    }

    console.log(`🔓 Releasing test database: ${testDb.name}`);

    try {
      // Terminate any lingering connections
      await this.terminateConnections(testDb.name);

      // Quick reset: truncate all tables instead of full restore
      await this.quickReset(testDb.name);

      // Move to available pool
      this.activeDatabases.delete(id);
      this.availableDatabases.push(testDb.name);

      console.log(`✅ Test database released: ${testDb.name}`);
    } catch (error: any) {
      console.error(`❌ Failed to release database: ${error.message}`);
      // Don't reuse this database if reset failed
      this.activeDatabases.delete(id);
    }
  }

  /**
   * Quick reset: Truncate all tables (faster than restore)
   */
  private async quickReset(dbName: string): Promise<void> {
    const dbUrl = this.baseUrl.replace(/\/[^/]+$/, `/${dbName}`);
    const pool = new Pool({ connectionString: dbUrl });

    try {
      // Disable triggers for faster truncate
      await pool.query('SET session_replication_role = replica;');

      // Truncate all tables
      await pool.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
          LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);

      // Re-enable triggers
      await pool.query('SET session_replication_role = DEFAULT;');
    } finally {
      await pool.end();
    }
  }

  /**
   * Cleanup all test databases
   * Use this after test run completion
   */
  async cleanupTestDatabases(force = false): Promise<number> {
    console.log('🧹 Cleaning up test databases...');

    const allDatabases = [
      ...this.activeDatabases.keys(),
      ...this.availableDatabases,
    ];

    if (!force && this.activeDatabases.size > 0) {
      console.warn(`⚠️  ${this.activeDatabases.size} databases still active. Use force=true to cleanup anyway.`);
      return 0;
    }

    let cleaned = 0;

    for (const dbName of allDatabases) {
      try {
        await this.terminateConnections(dbName);
        await this.adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
        cleaned++;
        console.log(`  ✅ Dropped: ${dbName}`);
      } catch (error: any) {
        console.error(`  ❌ Failed to drop ${dbName}: ${error.message}`);
      }
    }

    // Clear tracking
    this.activeDatabases.clear();
    this.availableDatabases = [];

    console.log(`✅ Cleaned up ${cleaned} test databases`);
    return cleaned;
  }

  /**
   * List all test databases (active and available)
   */
  async listTestDatabases(): Promise<{ active: TestDatabase[]; available: string[] }> {
    return {
      active: Array.from(this.activeDatabases.values()),
      available: [...this.availableDatabases],
    };
  }

  /**
   * Get statistics about test database usage
   */
  async getStatistics() {
    const now = Date.now();
    const active = Array.from(this.activeDatabases.values());

    return {
      total: this.activeDatabases.size + this.availableDatabases.length,
      active: this.activeDatabases.size,
      available: this.availableDatabases.length,
      maxDatabases: this.options.maxDatabases,
      utilizationPercent: ((this.activeDatabases.size / this.options.maxDatabases) * 100).toFixed(1),
      longestAcquired: active.length > 0
        ? Math.max(...active.map(db => now - db.acquiredAt))
        : 0,
      databases: active.map(db => ({
        id: db.id,
        name: db.name,
        testFile: db.testFile,
        acquiredMs: now - db.acquiredAt,
      })),
    };
  }

  /**
   * Cleanup idle databases
   */
  private async cleanupIdleDatabases(): Promise<void> {
    const now = Date.now();
    const idleDatabases: string[] = [];

    for (const [id, db] of this.activeDatabases.entries()) {
      const idleTime = now - db.acquiredAt;
      if (idleTime > this.options.idleTimeout) {
        idleDatabases.push(id);
        console.warn(`⚠️  Database ${db.name} idle for ${(idleTime / 1000).toFixed(0)}s, releasing...`);
      }
    }

    for (const id of idleDatabases) {
      await this.releaseTestDatabase(id);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleDatabases().catch(console.error);
    }, 60000); // Check every minute

    // Don't keep process alive for cleanup timer
    this.cleanupTimer.unref();
  }

  /**
   * Terminate all connections to a database
   */
  private async terminateConnections(dbName: string): Promise<void> {
    try {
      await this.adminPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [dbName]);
    } catch (error) {
      // Ignore errors, database might not exist
    }
  }

  /**
   * Generate unique database name
   */
  private generateDatabaseName(): string {
    const random = crypto.randomBytes(4).toString('hex');
    return `${this.options.prefix}${Date.now()}_${random}`;
  }

  /**
   * Mark database as acquired
   */
  private async markDatabaseAcquired(dbName: string, testFile?: string): Promise<TestDatabase> {
    const id = crypto.randomUUID();
    const dbUrl = this.baseUrl.replace(/\/[^/]+$/, `/${dbName}`);

    const testDb: TestDatabase = {
      id,
      name: dbName,
      url: dbUrl,
      pid: process.pid,
      acquiredAt: Date.now(),
      testFile,
    };

    this.activeDatabases.set(id, testDb);
    return testDb;
  }

  /**
   * Close manager and cleanup
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    await this.cleanupTestDatabases(true);
    await this.adminPool.end();
  }
}

// Singleton instance
let isolationManager: TestIsolationManager | null = null;

export function getIsolationManager(baseUrl?: string, options?: IsolationOptions): TestIsolationManager {
  if (!isolationManager) {
    isolationManager = new TestIsolationManager(baseUrl, options);
  }
  return isolationManager;
}

/**
 * Helper for Playwright/Vitest: Acquire database for test
 */
export async function setupTestDatabase(testInfo?: { file?: string }): Promise<string> {
  const manager = getIsolationManager();
  const testDb = await manager.acquireTestDatabase(testInfo?.file);

  // Store ID for cleanup
  process.env.CURRENT_TEST_DB_ID = testDb.id;

  return testDb.url;
}

/**
 * Helper for Playwright/Vitest: Release database after test
 */
export async function teardownTestDatabase(): Promise<void> {
  const id = process.env.CURRENT_TEST_DB_ID;
  if (!id) return;

  const manager = getIsolationManager();
  await manager.releaseTestDatabase(id);
  delete process.env.CURRENT_TEST_DB_ID;
}
