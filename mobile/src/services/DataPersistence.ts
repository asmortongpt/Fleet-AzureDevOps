/**
 * Data Persistence Service
 *
 * Handles all data persistence operations including:
 * - SQLite database for structured data
 * - AsyncStorage for key-value pairs
 * - File system for photos and documents
 * - Cache management
 * - Data migration support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';
import { CacheEntry, StorageStats, DatabaseMigration } from '../types/queue';
import RNFS from 'react-native-fs';

// Enable SQLite debugging
SQLite.DEBUG(false);
SQLite.enablePromise(true);

const DATABASE_NAME = 'fleet_offline.db';
const DATABASE_VERSION = 1;
const CACHE_PREFIX = '@fleet_cache:';
const CONFIG_PREFIX = '@fleet_config:';

/**
 * Data Persistence Manager
 * Singleton service for all persistence operations
 */
export class DataPersistenceManager {
  private static instance: DataPersistenceManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private migrations: DatabaseMigration[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DataPersistenceManager {
    if (!DataPersistenceManager.instance) {
      DataPersistenceManager.instance = new DataPersistenceManager();
    }
    return DataPersistenceManager.instance;
  }

  /**
   * Initialize database and storage
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Open database
      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      // Create tables
      await this.createTables();

      // Run migrations
      await this.runMigrations();

      // Create directories for file storage
      await this.createDirectories();

      this.isInitialized = true;
      console.log('[DataPersistence] Initialized successfully');
    } catch (error) {
      console.error('[DataPersistence] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Queue items table
      `CREATE TABLE IF NOT EXISTS queue_items (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        headers TEXT,
        body TEXT,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 5,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        scheduled_at INTEGER,
        error TEXT,
        metadata TEXT
      )`,

      // Conflicts table
      `CREATE TABLE IF NOT EXISTS conflicts (
        id TEXT PRIMARY KEY,
        queue_item_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        conflict_type TEXT NOT NULL,
        local_version TEXT NOT NULL,
        server_version TEXT NOT NULL,
        local_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER NOT NULL,
        resolution TEXT,
        resolved_data TEXT,
        created_at INTEGER NOT NULL,
        resolved_at INTEGER,
        FOREIGN KEY (queue_item_id) REFERENCES queue_items(id)
      )`,

      // Cache table
      `CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expires_at INTEGER,
        etag TEXT,
        version INTEGER
      )`,

      // Sync metadata table
      `CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,

      // Attachments table (for photos/documents)
      `CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded BOOLEAN DEFAULT 0,
        cloud_url TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    ];

    for (const table of tables) {
      await this.db.executeSql(table);
    }

    // Create indexes for better performance
    await this.createIndexes();
  }

  /**
   * Create database indexes
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_items(status)',
      'CREATE INDEX IF NOT EXISTS idx_queue_priority ON queue_items(priority)',
      'CREATE INDEX IF NOT EXISTS idx_queue_created ON queue_items(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_queue_resource ON queue_items(resource_type, resource_id)',
      'CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON conflicts(resolved_at)',
      'CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_attachments_uploaded ON attachments(uploaded)',
    ];

    for (const index of indexes) {
      await this.db.executeSql(index);
    }
  }

  /**
   * Create file system directories
   */
  private async createDirectories(): Promise<void> {
    const directories = [
      `${RNFS.DocumentDirectoryPath}/photos`,
      `${RNFS.DocumentDirectoryPath}/documents`,
      `${RNFS.DocumentDirectoryPath}/temp`,
    ];

    for (const dir of directories) {
      if (!(await RNFS.exists(dir))) {
        await RNFS.mkdir(dir);
      }
    }
  }

  /**
   * Register database migration
   */
  public registerMigration(migration: DatabaseMigration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Run pending migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) return;

    // Get current version
    const currentVersion = await this.getDatabaseVersion();

    // Run migrations
    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        console.log(`[DataPersistence] Running migration ${migration.name}`);
        await migration.up(this.db);
        await this.setDatabaseVersion(migration.version);
      }
    }
  }

  /**
   * Get database version
   */
  private async getDatabaseVersion(): Promise<number> {
    try {
      const value = await this.getMetadata('database_version');
      return value ? parseInt(value, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Set database version
   */
  private async setDatabaseVersion(version: number): Promise<void> {
    await this.setMetadata('database_version', version.toString());
  }

  // ==================== Queue Operations ====================

  /**
   * Execute SQL query
   */
  public async executeSql(
    sql: string,
    params: any[] = []
  ): Promise<SQLite.ResultSet> {
    if (!this.db) throw new Error('Database not initialized');
    const [result] = await this.db.executeSql(sql, params);
    return result;
  }

  /**
   * Execute transaction
   */
  public async transaction(
    fn: (tx: SQLite.Transaction) => Promise<void>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.transaction(fn);
  }

  // ==================== AsyncStorage Operations ====================

  /**
   * Set cache item
   */
  public async setCache<T>(
    key: string,
    data: T,
    expiresIn?: number
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
    };

    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(entry)
    );
  }

  /**
   * Get cache item
   */
  public async getCache<T>(key: string): Promise<T | null> {
    const item = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      await this.removeCache(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Remove cache item
   */
  public async removeCache(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  }

  /**
   * Clear all cache
   */
  public async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  /**
   * Set configuration value
   */
  public async setConfig(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(
      `${CONFIG_PREFIX}${key}`,
      JSON.stringify(value)
    );
  }

  /**
   * Get configuration value
   */
  public async getConfig<T>(key: string): Promise<T | null> {
    const item = await AsyncStorage.getItem(`${CONFIG_PREFIX}${key}`);
    return item ? JSON.parse(item) : null;
  }

  /**
   * Set metadata
   */
  public async setMetadata(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [key, value, Date.now()]
    );
  }

  /**
   * Get metadata
   */
  public async getMetadata(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      'SELECT value FROM sync_metadata WHERE key = ?',
      [key]
    );

    return result.rows.length > 0 ? result.rows.item(0).value : null;
  }

  // ==================== File Operations ====================

  /**
   * Save file to local storage
   */
  public async saveFile(
    fileName: string,
    data: string,
    type: 'photo' | 'document'
  ): Promise<string> {
    const directory =
      type === 'photo'
        ? `${RNFS.DocumentDirectoryPath}/photos`
        : `${RNFS.DocumentDirectoryPath}/documents`;

    const filePath = `${directory}/${fileName}`;
    await RNFS.writeFile(filePath, data, 'base64');

    return filePath;
  }

  /**
   * Read file from local storage
   */
  public async readFile(filePath: string): Promise<string> {
    return await RNFS.readFile(filePath, 'base64');
  }

  /**
   * Delete file
   */
  public async deleteFile(filePath: string): Promise<void> {
    if (await RNFS.exists(filePath)) {
      await RNFS.unlink(filePath);
    }
  }

  /**
   * Get file info
   */
  public async getFileInfo(filePath: string): Promise<RNFS.StatResult> {
    return await RNFS.stat(filePath);
  }

  /**
   * Copy file
   */
  public async copyFile(source: string, destination: string): Promise<void> {
    await RNFS.copyFile(source, destination);
  }

  /**
   * Move file
   */
  public async moveFile(source: string, destination: string): Promise<void> {
    await RNFS.moveFile(source, destination);
  }

  // ==================== Storage Statistics ====================

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<StorageStats> {
    if (!this.db) throw new Error('Database not initialized');

    // Get queue item count
    const [queueResult] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM queue_items'
    );
    const queueItemCount = queueResult.rows.item(0).count;

    // Get cache item count
    const keys = await AsyncStorage.getAllKeys();
    const cacheItemCount = keys.filter((key) =>
      key.startsWith(CACHE_PREFIX)
    ).length;

    // Get database size
    const dbPath = `${RNFS.DocumentDirectoryPath}/${DATABASE_NAME}`;
    const dbStats = await RNFS.stat(dbPath);
    const databaseSize = dbStats.size;

    // Get disk space info
    const diskSpace = await RNFS.getFSInfo();

    return {
      totalSize: diskSpace.totalSpace,
      usedSize: diskSpace.totalSpace - diskSpace.freeSpace,
      availableSize: diskSpace.freeSpace,
      queueItemCount,
      cacheItemCount,
      databaseSize,
    };
  }

  /**
   * Optimize database (vacuum)
   */
  public async vacuum(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.executeSql('VACUUM');
    console.log('[DataPersistence] Database optimized');
  }

  /**
   * Clear all expired cache entries
   */
  public async clearExpiredCache(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const [result] = await this.db.executeSql(
      'DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?',
      [Date.now()]
    );

    console.log(`[DataPersistence] Cleared ${result.rowsAffected} expired cache entries`);
    return result.rowsAffected;
  }

  /**
   * Clear old attachments that have been uploaded
   */
  public async clearOldAttachments(olderThanDays: number = 30): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    // Get attachments to delete
    const [result] = await this.db.executeSql(
      `SELECT file_path FROM attachments
       WHERE uploaded = 1 AND created_at < ?`,
      [cutoffTime]
    );

    // Delete files
    let deletedCount = 0;
    for (let i = 0; i < result.rows.length; i++) {
      const filePath = result.rows.item(i).file_path;
      try {
        await this.deleteFile(filePath);
        deletedCount++;
      } catch (error) {
        console.error(`[DataPersistence] Failed to delete file: ${filePath}`, error);
      }
    }

    // Delete database records
    await this.db.executeSql(
      'DELETE FROM attachments WHERE uploaded = 1 AND created_at < ?',
      [cutoffTime]
    );

    console.log(`[DataPersistence] Cleared ${deletedCount} old attachments`);
    return deletedCount;
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[DataPersistence] Database closed');
    }
  }

  /**
   * Reset database (dangerous!)
   */
  public async reset(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }

    // Delete database file
    const dbPath = `${RNFS.DocumentDirectoryPath}/${DATABASE_NAME}`;
    if (await RNFS.exists(dbPath)) {
      await RNFS.unlink(dbPath);
    }

    // Clear AsyncStorage
    await AsyncStorage.clear();

    // Clear file directories
    const photosDir = `${RNFS.DocumentDirectoryPath}/photos`;
    const docsDir = `${RNFS.DocumentDirectoryPath}/documents`;
    const tempDir = `${RNFS.DocumentDirectoryPath}/temp`;

    for (const dir of [photosDir, docsDir, tempDir]) {
      if (await RNFS.exists(dir)) {
        await RNFS.unlink(dir);
      }
    }

    this.isInitialized = false;
    console.log('[DataPersistence] Database reset complete');

    // Reinitialize
    await this.initialize();
  }
}

// Export singleton instance
export default DataPersistenceManager.getInstance();
