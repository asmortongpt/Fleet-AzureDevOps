/**
 * Storage Manager Service
 *
 * Central service for managing multiple storage adapters with features:
 * - Dynamic adapter selection based on configuration
 * - Storage quotas and usage tracking
 * - Automatic failover between providers
 * - Deduplication across storage backends
 * - Hot/cold storage tiering based on access patterns
 * - Storage migration tools
 */

import crypto from 'crypto';
import { Readable } from 'stream';
import pool from '../config/database';
import {
  IStorageAdapter,
  StorageConfig,
  UploadOptions,
  UploadResult,
  DownloadOptions,
  DownloadResult,
  FileMetadata,
  ListOptions,
  ListResult,
  CopyOptions,
  GetUrlOptions,
  StorageStats,
  QuotaExceededError,
  FileNotFoundError
} from '../storage/StorageAdapter';
import { LocalStorageAdapter } from '../storage/adapters/LocalStorageAdapter';
import { S3StorageAdapter } from '../storage/adapters/S3StorageAdapter';
import { AzureBlobStorageAdapter } from '../storage/adapters/AzureBlobStorageAdapter';
import { GoogleCloudStorageAdapter } from '../storage/adapters/GoogleCloudStorageAdapter';
import { DropboxStorageAdapter } from '../storage/adapters/DropboxStorageAdapter';
import { BoxStorageAdapter } from '../storage/adapters/BoxStorageAdapter';
import { SharePointStorageAdapter } from '../storage/adapters/SharePointStorageAdapter';

export interface StorageTier {
  name: 'hot' | 'warm' | 'cold' | 'archive';
  adapter: IStorageAdapter;
  priority: number;
  accessFrequencyThreshold?: number; // Days since last access
  costPerGB?: number;
  maxSize?: number; // Maximum size in bytes
}

export interface QuotaConfig {
  maxTotalSize?: number; // Bytes
  maxFileSize?: number; // Bytes
  maxFiles?: number;
  warnThreshold?: number; // Percentage (e.g., 80 = warn at 80%)
}

export interface UsageStats {
  totalSize: number;
  totalFiles: number;
  quotaUsedPercent: number;
  byTier: Record<string, { size: number; files: number }>;
  byProvider: Record<string, { size: number; files: number }>;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingKey?: string;
  hash?: string;
  savedBytes?: number;
}

export interface MigrationJob {
  id: string;
  sourceProvider: string;
  targetProvider: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class StorageManager {
  private adapters: Map<string, IStorageAdapter> = new Map();
  private tiers: StorageTier[] = [];
  private quotaConfig?: QuotaConfig;
  private enableDeduplication: boolean = false;
  private failoverOrder: string[] = [];

  constructor(private config: StorageConfig, private options?: {
    enableDeduplication?: boolean;
    quotaConfig?: QuotaConfig;
    failoverOrder?: string[];
  }) {
    this.enableDeduplication = options?.enableDeduplication || false;
    this.quotaConfig = options?.quotaConfig;
    this.failoverOrder = options?.failoverOrder || [];
  }

  /**
   * Initialize storage manager and all configured adapters
   */
  async initialize(): Promise<void> {
    const primaryAdapter = await this.createAdapter(this.config);
    await primaryAdapter.initialize();
    this.adapters.set(this.config.provider, primaryAdapter);

    // Setup storage tiers
    await this.setupStorageTiers();

    // Initialize database tables for tracking
    await this.initializeDatabase();
  }

  /**
   * Upload a file with automatic tiering and deduplication
   */
  async upload(
    key: string,
    data: Buffer | Readable,
    options?: UploadOptions & { tier?: 'hot' | 'warm' | 'cold' | 'archive' }
  ): Promise<UploadResult> {
    // Check quota
    if (this.quotaConfig) {
      await this.enforceQuota(Buffer.isBuffer(data) ? data.length : 0);
    }

    // Deduplication check
    if (this.enableDeduplication && Buffer.isBuffer(data)) {
      const dedupResult = await this.checkDeduplication(data);
      if (dedupResult.isDuplicate && dedupResult.existingKey) {
        // Create a reference instead of uploading duplicate
        await this.createFileReference(key, dedupResult.existingKey);

        return {
          key,
          url: await this.getUrl(dedupResult.existingKey),
          size: data.length,
          etag: dedupResult.hash,
          metadata: options?.metadata
        };
      }
    }

    // Select adapter based on tier
    const tier = options?.tier || 'hot';
    const adapter = this.getAdapterForTier(tier);

    try {
      const result = await adapter.upload(key, data, options);

      // Track upload in database
      await this.trackFile({
        key,
        size: result.size,
        provider: adapter.provider,
        tier,
        hash: this.enableDeduplication && Buffer.isBuffer(data)
          ? this.calculateHash(data)
          : undefined,
        metadata: options?.metadata
      });

      return result;
    } catch (error) {
      // Attempt failover if configured
      if (this.failoverOrder.length > 0) {
        return this.uploadWithFailover(key, data, options, tier);
      }
      throw error;
    }
  }

  /**
   * Download a file with automatic tier detection
   */
  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    const fileInfo = await this.getFileInfo(key);

    if (!fileInfo) {
      throw new FileNotFoundError(key);
    }

    // Check if this is a deduplicated reference
    if (fileInfo.reference_key) {
      key = fileInfo.reference_key;
    }

    const adapter = this.adapters.get(fileInfo.provider);
    if (!adapter) {
      throw new Error(`Adapter ${fileInfo.provider} not available`);
    }

    try {
      const result = await adapter.download(key, options);

      // Update access timestamp for tiering
      await this.updateAccessTime(key);

      return result;
    } catch (error) {
      // Attempt failover
      if (this.failoverOrder.length > 0) {
        return this.downloadWithFailover(key, options);
      }
      throw error;
    }
  }

  /**
   * Delete a file from all tiers
   */
  async delete(key: string): Promise<void> {
    const fileInfo = await this.getFileInfo(key);

    if (!fileInfo) {
      throw new FileNotFoundError(key);
    }

    const adapter = this.adapters.get(fileInfo.provider);
    if (adapter) {
      await adapter.delete(key);
    }

    // Remove from database
    await this.removeFileTracking(key);
  }

  /**
   * List files across all adapters
   */
  async list(options?: ListOptions & { tier?: string; provider?: string }): Promise<ListResult> {
    if (options?.provider) {
      const adapter = this.adapters.get(options.provider);
      if (!adapter) {
        throw new Error(`Adapter ${options.provider} not found`);
      }
      return adapter.list(options);
    }

    // Aggregate results from database
    return this.listFromDatabase(options);
  }

  /**
   * Get presigned URL for file access
   */
  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    const fileInfo = await this.getFileInfo(key);

    if (!fileInfo) {
      throw new FileNotFoundError(key);
    }

    const actualKey = fileInfo.reference_key || key;
    const adapter = this.adapters.get(fileInfo.provider);

    if (!adapter) {
      throw new Error(`Adapter ${fileInfo.provider} not available`);
    }

    return adapter.getUrl(actualKey, options);
  }

  /**
   * Get storage usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_files,
        SUM(size) as total_size,
        tier,
        provider
      FROM storage_files
      WHERE deleted_at IS NULL
      GROUP BY tier, provider
    `);

    const byTier: Record<string, { size: number; files: number }> = {};
    const byProvider: Record<string, { size: number; files: number }> = {};
    let totalSize = 0;
    let totalFiles = 0;

    result.rows.forEach(row => {
      const size = parseInt(row.total_size) || 0;
      const files = parseInt(row.total_files) || 0;

      totalSize += size;
      totalFiles += files;

      // By tier
      if (!byTier[row.tier]) {
        byTier[row.tier] = { size: 0, files: 0 };
      }
      byTier[row.tier].size += size;
      byTier[row.tier].files += files;

      // By provider
      if (!byProvider[row.provider]) {
        byProvider[row.provider] = { size: 0, files: 0 };
      }
      byProvider[row.provider].size += size;
      byProvider[row.provider].files += files;
    });

    const quotaUsedPercent = this.quotaConfig?.maxTotalSize
      ? (totalSize / this.quotaConfig.maxTotalSize) * 100
      : 0;

    return {
      totalSize,
      totalFiles,
      quotaUsedPercent,
      byTier,
      byProvider
    };
  }

  /**
   * Migrate files from one provider to another
   */
  async migrateFiles(
    sourceProvider: string,
    targetProvider: string,
    options?: {
      filter?: (file: any) => boolean;
      deleteSou rce?: boolean;
      onProgress?: (progress: { completed: number; total: number; current: string }) => void;
    }
  ): Promise<MigrationJob> {
    const sourceAdapter = this.adapters.get(sourceProvider);
    const targetAdapter = this.adapters.get(targetProvider);

    if (!sourceAdapter || !targetAdapter) {
      throw new Error('Source or target adapter not found');
    }

    const jobId = crypto.randomUUID();

    // Create migration job
    await pool.query(`
      INSERT INTO storage_migrations (id, source_provider, target_provider, status, started_at)
      VALUES ($1, $2, $3, 'in_progress', NOW())
    `, [jobId, sourceProvider, targetProvider]);

    // Get files to migrate
    const files = await this.getFilesByProvider(sourceProvider);
    const filteredFiles = options?.filter ? files.filter(options.filter) : files;

    const job: MigrationJob = {
      id: jobId,
      sourceProvider,
      targetProvider,
      status: 'in_progress',
      totalFiles: filteredFiles.length,
      completedFiles: 0,
      failedFiles: 0,
      startedAt: new Date()
    };

    // Process migration in background
    this.processMigration(job, filteredFiles, sourceAdapter, targetAdapter, options).catch(console.error);

    return job;
  }

  /**
   * Automatically tier files based on access patterns
   */
  async performAutoTiering(): Promise<{ moved: number; errors: number }> {
    let moved = 0;
    let errors = 0;

    // Get files eligible for tiering
    const candidates = await this.getTieringCandidates();

    for (const file of candidates) {
      try {
        const currentTier = file.tier;
        const suggestedTier = this.suggestTier(file);

        if (currentTier !== suggestedTier) {
          await this.moveFileToTier(file.key, suggestedTier);
          moved++;
        }
      } catch (error) {
        console.error(`Failed to tier file ${file.key}:`, error);
        errors++;
      }
    }

    return { moved, errors };
  }

  // Private helper methods

  private async createAdapter(config: StorageConfig): Promise<IStorageAdapter> {
    switch (config.provider) {
      case 'local':
        return new LocalStorageAdapter(config);
      case 's3':
        return new S3StorageAdapter(config);
      case 'azure':
        return new AzureBlobStorageAdapter(config);
      case 'gcs':
        return new GoogleCloudStorageAdapter(config);
      case 'dropbox':
        return new DropboxStorageAdapter(config);
      case 'box':
        return new BoxStorageAdapter(config);
      case 'sharepoint':
        return new SharePointStorageAdapter(config);
      default:
        throw new Error(`Unsupported storage provider: ${config.provider}`);
    }
  }

  private async setupStorageTiers(): Promise<void> {
    // Default tier setup (can be customized via configuration)
    this.tiers = [
      {
        name: 'hot',
        adapter: this.adapters.get(this.config.provider)!,
        priority: 1,
        accessFrequencyThreshold: 7, // Files accessed within 7 days
        costPerGB: 0.023
      },
      {
        name: 'warm',
        adapter: this.adapters.get(this.config.provider)!,
        priority: 2,
        accessFrequencyThreshold: 30,
        costPerGB: 0.0125
      },
      {
        name: 'cold',
        adapter: this.adapters.get(this.config.provider)!,
        priority: 3,
        accessFrequencyThreshold: 90,
        costPerGB: 0.004
      },
      {
        name: 'archive',
        adapter: this.adapters.get(this.config.provider)!,
        priority: 4,
        accessFrequencyThreshold: 365,
        costPerGB: 0.001
      }
    ];
  }

  private async initializeDatabase(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage_files (
        key VARCHAR(1024) PRIMARY KEY,
        size BIGINT NOT NULL,
        provider VARCHAR(50) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        hash VARCHAR(64),
        reference_key VARCHAR(1024),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed_at TIMESTAMP DEFAULT NOW(),
        access_count INT DEFAULT 0,
        deleted_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage_migrations (
        id UUID PRIMARY KEY,
        source_provider VARCHAR(50) NOT NULL,
        target_provider VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        total_files INT DEFAULT 0,
        completed_files INT DEFAULT 0,
        failed_files INT DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error TEXT
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_storage_files_provider ON storage_files(provider);
      CREATE INDEX IF NOT EXISTS idx_storage_files_tier ON storage_files(tier);
      CREATE INDEX IF NOT EXISTS idx_storage_files_hash ON storage_files(hash);
      CREATE INDEX IF NOT EXISTS idx_storage_files_last_accessed ON storage_files(last_accessed_at);
    `);
  }

  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async checkDeduplication(data: Buffer): Promise<DeduplicationResult> {
    if (!this.enableDeduplication) {
      return { isDuplicate: false };
    }

    const hash = this.calculateHash(data);

    const result = await pool.query(
      'SELECT key, size FROM storage_files WHERE hash = $1 AND deleted_at IS NULL LIMIT 1',
      [hash]
    );

    if (result.rows.length > 0) {
      return {
        isDuplicate: true,
        existingKey: result.rows[0].key,
        hash,
        savedBytes: data.length
      };
    }

    return { isDuplicate: false, hash };
  }

  private async createFileReference(key: string, referenceKey: string): Promise<void> {
    const refFile = await this.getFileInfo(referenceKey);

    await pool.query(`
      INSERT INTO storage_files (key, size, provider, tier, hash, reference_key, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [key, refFile.size, refFile.provider, refFile.tier, refFile.hash, referenceKey]);
  }

  private async trackFile(file: {
    key: string;
    size: number;
    provider: string;
    tier: string;
    hash?: string;
    metadata?: any;
  }): Promise<void> {
    await pool.query(`
      INSERT INTO storage_files (key, size, provider, tier, hash, metadata, created_at, last_accessed_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (key) DO UPDATE SET
        size = $2,
        provider = $3,
        tier = $4,
        hash = $5,
        metadata = $6,
        last_accessed_at = NOW()
    `, [file.key, file.size, file.provider, file.tier, file.hash, JSON.stringify(file.metadata)]);
  }

  private async getFileInfo(key: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM storage_files WHERE key = $1 AND deleted_at IS NULL',
      [key]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  private async updateAccessTime(key: string): Promise<void> {
    await pool.query(`
      UPDATE storage_files
      SET last_accessed_at = NOW(), access_count = access_count + 1
      WHERE key = $1
    `, [key]);
  }

  private async removeFileTracking(key: string): Promise<void> {
    await pool.query(
      'UPDATE storage_files SET deleted_at = NOW() WHERE key = $1',
      [key]
    );
  }

  private async enforceQuota(additionalSize: number): Promise<void> {
    if (!this.quotaConfig) return;

    const stats = await this.getUsageStats();

    if (this.quotaConfig.maxTotalSize && stats.totalSize + additionalSize > this.quotaConfig.maxTotalSize) {
      throw new QuotaExceededError(`Storage quota exceeded: ${stats.totalSize + additionalSize} bytes`);
    }

    if (this.quotaConfig.maxFiles && stats.totalFiles + 1 > this.quotaConfig.maxFiles) {
      throw new QuotaExceededError(`File count quota exceeded: ${stats.totalFiles + 1} files`);
    }
  }

  private getAdapterForTier(tier: string): IStorageAdapter {
    const tierConfig = this.tiers.find(t => t.name === tier);
    if (!tierConfig) {
      // Default to primary adapter
      return this.adapters.get(this.config.provider)!;
    }
    return tierConfig.adapter;
  }

  private async uploadWithFailover(
    key: string,
    data: Buffer | Readable,
    options: any,
    tier: string
  ): Promise<UploadResult> {
    for (const provider of this.failoverOrder) {
      const adapter = this.adapters.get(provider);
      if (adapter) {
        try {
          return await adapter.upload(key, data, options);
        } catch (error) {
          console.error(`Failover upload to ${provider} failed:`, error);
          continue;
        }
      }
    }
    throw new Error('All failover attempts failed');
  }

  private async downloadWithFailover(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    for (const provider of this.failoverOrder) {
      const adapter = this.adapters.get(provider);
      if (adapter) {
        try {
          return await adapter.download(key, options);
        } catch (error) {
          console.error(`Failover download from ${provider} failed:`, error);
          continue;
        }
      }
    }
    throw new Error('All failover attempts failed');
  }

  private async listFromDatabase(options?: ListOptions & { tier?: string }): Promise<ListResult> {
    let query = 'SELECT * FROM storage_files WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (options?.tier) {
      params.push(options.tier);
      query += ` AND tier = $${params.length}`;
    }

    if (options?.prefix) {
      params.push(`${options.prefix}%`);
      query += ` AND key LIKE $${params.length}`;
    }

    query += ` LIMIT ${options?.maxKeys || 1000}`;

    const result = await pool.query(query, params);

    return {
      files: result.rows.map(row => ({
        key: row.key,
        name: row.key.split('/').pop() || row.key,
        size: parseInt(row.size),
        lastModified: row.last_accessed_at,
        metadata: row.metadata
      })),
      directories: [],
      isTruncated: result.rows.length === (options?.maxKeys || 1000)
    };
  }

  private async getFilesByProvider(provider: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM storage_files WHERE provider = $1 AND deleted_at IS NULL',
      [provider]
    );
    return result.rows;
  }

  private async getTieringCandidates(): Promise<any[]> {
    const result = await pool.query(`
      SELECT * FROM storage_files
      WHERE deleted_at IS NULL
      AND last_accessed_at < NOW() - INTERVAL '7 days'
      ORDER BY last_accessed_at ASC
    `);
    return result.rows;
  }

  private suggestTier(file: any): 'hot' | 'warm' | 'cold' | 'archive' {
    const daysSinceAccess = Math.floor(
      (Date.now() - new Date(file.last_accessed_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceAccess < 7) return 'hot';
    if (daysSinceAccess < 30) return 'warm';
    if (daysSinceAccess < 90) return 'cold';
    return 'archive';
  }

  private async moveFileToTier(key: string, targetTier: string): Promise<void> {
    await pool.query(
      'UPDATE storage_files SET tier = $1 WHERE key = $2',
      [targetTier, key]
    );
  }

  private async processMigration(
    job: MigrationJob,
    files: any[],
    sourceAdapter: IStorageAdapter,
    targetAdapter: IStorageAdapter,
    options?: any
  ): Promise<void> {
    for (const file of files) {
      try {
        // Download from source
        const download = await sourceAdapter.download(file.key);
        const chunks: Buffer[] = [];

        for await (const chunk of download.stream) {
          chunks.push(chunk as Buffer);
        }

        const data = Buffer.concat(chunks);

        // Upload to target
        await targetAdapter.upload(file.key, data);

        // Update database
        await pool.query(
          'UPDATE storage_files SET provider = $1 WHERE key = $2',
          [targetAdapter.provider, file.key]
        );

        // Delete from source if requested
        if (options?.deleteSource) {
          await sourceAdapter.delete(file.key);
        }

        job.completedFiles++;

        if (options?.onProgress) {
          options.onProgress({
            completed: job.completedFiles,
            total: job.totalFiles,
            current: file.key
          });
        }
      } catch (error) {
        console.error(`Failed to migrate file ${file.key}:`, error);
        job.failedFiles++;
      }
    }

    job.status = 'completed';
    job.completedAt = new Date();

    await pool.query(`
      UPDATE storage_migrations
      SET status = $1, completed_files = $2, failed_files = $3, completed_at = $4
      WHERE id = $5
    `, [job.status, job.completedFiles, job.failedFiles, job.completedAt, job.id]);
  }
}

export default StorageManager;
