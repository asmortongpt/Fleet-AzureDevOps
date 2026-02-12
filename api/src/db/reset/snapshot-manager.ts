/**
 * Database Snapshot Manager
 * Provides fast database reset via pg_dump/restore snapshots
 * Optimized for E2E testing with < 10s reset target
 */

import { exec } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SnapshotMetadata {
  name: string;
  timestamp: number;
  size: number;
  hash: string;
  databaseUrl: string;
  tables: number;
  rows?: number;
}

export interface SnapshotOptions {
  compress?: boolean;
  format?: 'custom' | 'plain' | 'tar';
  excludeTables?: string[];
  dataOnly?: boolean;
  schemaOnly?: boolean;
}

export class SnapshotManager {
  private snapshotDir: string;
  private databaseUrl: string;
  private connectionParams: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };

  constructor(databaseUrl?: string) {
    this.databaseUrl = databaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_dev';
    this.snapshotDir = process.env.SNAPSHOT_DIR || path.join(process.cwd(), 'api/src/db/reset/snapshots');
    this.connectionParams = this.parseConnectionString(this.databaseUrl);
  }

  /**
   * Parse PostgreSQL connection string
   */
  private parseConnectionString(url: string) {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5].split('?')[0], // Remove query params
    };
  }

  /**
   * Ensure snapshot directory exists
   */
  private async ensureSnapshotDir(): Promise<void> {
    try {
      await fs.mkdir(this.snapshotDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create snapshot directory:', error);
      throw error;
    }
  }

  /**
   * Create a database snapshot using pg_dump
   * Uses custom format (-Fc) for fast parallel restore
   */
  async createSnapshot(
    name: string,
    options: SnapshotOptions = {}
  ): Promise<SnapshotMetadata> {
    const startTime = Date.now();
    await this.ensureSnapshotDir();

    // Prevent snapshot of production database
    if (this.connectionParams.database.includes('prod') ||
        this.connectionParams.database.includes('production')) {
      throw new Error('🚨 SAFETY: Cannot create snapshot of production database!');
    }

    const format = options.format || 'custom';
    const extension = format === 'custom' ? 'dump' : format === 'tar' ? 'tar' : 'sql';
    const snapshotFile = path.join(this.snapshotDir, `${name}.${extension}`);

    // Build pg_dump command
    const pgDumpArgs = [
      `-h ${this.connectionParams.host}`,
      `-p ${this.connectionParams.port}`,
      `-U ${this.connectionParams.user}`,
      `-d ${this.connectionParams.database}`,
      `-F${format.charAt(0)}`, // -Fc for custom, -Ft for tar, -Fp for plain
      options.compress !== false && format === 'custom' ? '-Z9' : '', // Max compression
      options.dataOnly ? '--data-only' : '',
      options.schemaOnly ? '--schema-only' : '',
      options.excludeTables?.map(t => `--exclude-table=${t}`).join(' ') || '',
      '--no-owner',
      '--no-acl',
      '--verbose',
      `-f ${snapshotFile}`,
    ].filter(Boolean).join(' ');

    const command = `PGPASSWORD="${this.connectionParams.password}" pg_dump ${pgDumpArgs}`;

    console.log(`📸 Creating snapshot: ${name}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 100 * 1024 * 1024, // 100MB buffer
      });

      if (stderr && !stderr.includes('NOTICE')) {
        console.warn('pg_dump warnings:', stderr);
      }

      // Get file stats
      const stats = await fs.stat(snapshotFile);
      const hash = await this.calculateFileHash(snapshotFile);
      const tableCount = await this.getTableCount();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Snapshot created in ${duration}s (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      const metadata: SnapshotMetadata = {
        name,
        timestamp: Date.now(),
        size: stats.size,
        hash,
        databaseUrl: this.databaseUrl,
        tables: tableCount,
      };

      // Save metadata
      await fs.writeFile(
        `${snapshotFile}.meta.json`,
        JSON.stringify(metadata, null, 2)
      );

      return metadata;
    } catch (error: any) {
      console.error('❌ Snapshot creation failed:', error.message);
      throw new Error(`Snapshot creation failed: ${error.message}`);
    }
  }

  /**
   * Restore database from snapshot using pg_restore
   * Optimized for speed with parallel jobs
   */
  async restoreSnapshot(
    name: string,
    options: {
      parallel?: number;
      clean?: boolean;
      createDb?: boolean;
      ifExists?: boolean;
    } = {}
  ): Promise<void> {
    const startTime = Date.now();
    const snapshotFile = path.join(this.snapshotDir, `${name}.dump`);

    // Verify snapshot exists
    try {
      await fs.access(snapshotFile);
    } catch {
      throw new Error(`Snapshot not found: ${name}`);
    }

    // Load metadata
    let metadata: SnapshotMetadata | null = null;
    try {
      const metaContent = await fs.readFile(`${snapshotFile}.meta.json`, 'utf-8');
      metadata = JSON.parse(metaContent);
    } catch {
      console.warn('⚠️  Snapshot metadata not found, continuing anyway...');
    }

    console.log(`♻️  Restoring snapshot: ${name}`);

    // Prevent restore to production database
    if (this.connectionParams.database.includes('prod') ||
        this.connectionParams.database.includes('production')) {
      throw new Error('🚨 SAFETY: Cannot restore to production database!');
    }

    // Build pg_restore command
    const parallel = options.parallel || Math.max(2, require('os').cpus().length - 1);
    const pgRestoreArgs = [
      `-h ${this.connectionParams.host}`,
      `-p ${this.connectionParams.port}`,
      `-U ${this.connectionParams.user}`,
      `-d ${this.connectionParams.database}`,
      `-j ${parallel}`, // Parallel jobs for faster restore
      options.clean ? '--clean' : '',
      options.ifExists ? '--if-exists' : '',
      '--no-owner',
      '--no-acl',
      '--verbose',
      '--exit-on-error',
      snapshotFile,
    ].filter(Boolean).join(' ');

    const command = `PGPASSWORD="${this.connectionParams.password}" pg_restore ${pgRestoreArgs}`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 100 * 1024 * 1024,
      });

      if (stderr && !stderr.includes('NOTICE') && !stderr.includes('already exists')) {
        console.warn('pg_restore warnings:', stderr);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Snapshot restored in ${duration}s using ${parallel} parallel jobs`);
    } catch (error: any) {
      // pg_restore may exit with error code even on success if --clean is used
      if (options.clean && error.message.includes('already exists')) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Snapshot restored in ${duration}s (with warnings)`);
      } else {
        console.error('❌ Snapshot restore failed:', error.message);
        throw new Error(`Snapshot restore failed: ${error.message}`);
      }
    }
  }

  /**
   * List all available snapshots
   */
  async listSnapshots(): Promise<SnapshotMetadata[]> {
    await this.ensureSnapshotDir();

    try {
      const files = await fs.readdir(this.snapshotDir);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));

      const snapshots: SnapshotMetadata[] = [];

      for (const metaFile of metaFiles) {
        try {
          const content = await fs.readFile(
            path.join(this.snapshotDir, metaFile),
            'utf-8'
          );
          snapshots.push(JSON.parse(content));
        } catch (error) {
          console.warn(`Failed to read metadata: ${metaFile}`);
        }
      }

      return snapshots.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to list snapshots:', error);
      return [];
    }
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(name: string): Promise<void> {
    const patterns = [`${name}.dump`, `${name}.sql`, `${name}.tar`, `${name}.dump.meta.json`];

    for (const pattern of patterns) {
      const filePath = path.join(this.snapshotDir, pattern);
      try {
        await fs.unlink(filePath);
        console.log(`🗑️  Deleted: ${pattern}`);
      } catch (error) {
        // File doesn't exist, ignore
      }
    }
  }

  /**
   * Get the latest snapshot
   */
  async getLatestSnapshot(): Promise<SnapshotMetadata | null> {
    const snapshots = await this.listSnapshots();
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  /**
   * Calculate SHA256 hash of file
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get table count from database
   */
  private async getTableCount(): Promise<number> {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: this.databaseUrl });

      const result = await pool.query(`
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      await pool.end();
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.warn('Failed to get table count:', error);
      return 0;
    }
  }

  /**
   * Verify snapshot integrity
   */
  async verifySnapshot(name: string): Promise<boolean> {
    const snapshotFile = path.join(this.snapshotDir, `${name}.dump`);
    const metaFile = `${snapshotFile}.meta.json`;

    try {
      // Check files exist
      await fs.access(snapshotFile);
      await fs.access(metaFile);

      // Load metadata
      const metaContent = await fs.readFile(metaFile, 'utf-8');
      const metadata: SnapshotMetadata = JSON.parse(metaContent);

      // Verify file size
      const stats = await fs.stat(snapshotFile);
      if (stats.size !== metadata.size) {
        console.error('❌ Snapshot file size mismatch');
        return false;
      }

      // Verify hash
      const currentHash = await this.calculateFileHash(snapshotFile);
      if (currentHash !== metadata.hash) {
        console.error('❌ Snapshot hash mismatch (file corrupted)');
        return false;
      }

      console.log('✅ Snapshot verification passed');
      return true;
    } catch (error) {
      console.error('❌ Snapshot verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
let snapshotManager: SnapshotManager | null = null;

export function getSnapshotManager(databaseUrl?: string): SnapshotManager {
  if (!snapshotManager) {
    snapshotManager = new SnapshotManager(databaseUrl);
  }
  return snapshotManager;
}
