/**
 * Local Filesystem Storage Adapter
 *
 * Default storage adapter using local filesystem
 * Suitable for development and small deployments
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import crypto from 'crypto';
import {
  BaseStorageAdapter,
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
  FileInfo,
  FileNotFoundError,
  FileAlreadyExistsError
} from '../StorageAdapter';
import { validatePathWithinDirectory } from '../../utils/safe-file-operations';

const pipelineAsync = promisify(pipeline);

interface LocalFileMetadata extends FileMetadata {
  localPath: string;
}

export class LocalStorageAdapter extends BaseStorageAdapter {
  readonly provider = 'local';
  private storagePath: string;
  private metadataPath: string;

  constructor(config: StorageConfig) {
    super(config);

    if (!config.local?.storagePath) {
      throw new Error('Local storage path is required');
    }

    this.storagePath = path.resolve(config.local.storagePath);
    this.metadataPath = path.join(this.storagePath, '.metadata');
  }

  async initialize(): Promise<void> {
    try {
      // Create storage directory if it doesn't exist
      await fs.mkdir(this.storagePath, { recursive: true });
      await fs.mkdir(this.metadataPath, { recursive: true });

      // Test write permissions
      const testFile = path.join(this.storagePath, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize local storage at ${this.storagePath}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const filePath = this.getFilePath(normalizedKey);
    const metadataFilePath = this.getMetadataPath(normalizedKey);

    // Check if file exists and overwrite is not allowed
    if (!options?.overwrite && await this.exists(normalizedKey)) {
      throw new FileAlreadyExistsError(normalizedKey);
    }

    // Create parent directory
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.mkdir(path.dirname(metadataFilePath), { recursive: true });

    let size = 0;
    let etag = '';

    try {
      if (Buffer.isBuffer(data)) {
        // Upload from buffer
        size = data.length;
        await fs.writeFile(filePath, data);

        // Calculate ETag (MD5 hash)
        etag = crypto.createHash('md5').update(data).digest('hex');
      } else {
        // Upload from stream
        const writeStream = fsSync.createWriteStream(filePath);
        const hash = crypto.createHash('md5');
        let bytesWritten = 0;

        await pipelineAsync(
          data,
          async function* (source: AsyncIterable<Buffer>) {
            for await (const chunk of source) {
              bytesWritten += chunk.length;
              hash.update(chunk);

              // Report progress
              if (options?.onProgress) {
                options.onProgress({
                  bytesUploaded: bytesWritten,
                  totalBytes: bytesWritten,
                  percentage: 0 // Can't determine percentage without total size
                });
              }

              yield chunk;
            }
          },
          writeStream
        );

        size = bytesWritten;
        etag = hash.digest('hex');
      }

      // Save metadata
      const metadata: LocalFileMetadata = {
        ...options?.metadata,
        filename: options?.metadata?.filename || path.basename(normalizedKey),
        mimeType: options?.contentType || options?.metadata?.mimeType,
        size,
        localPath: filePath,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));

      return {
        key: normalizedKey,
        url: `file://${filePath}`,
        publicUrl: this.getPublicUrl(normalizedKey),
        etag,
        size,
        metadata
      };
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(filePath).catch(() => {});
        await fs.unlink(metadataFilePath).catch(() => {});
      } catch {}

      throw new Error(
        'Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}'
      );
    }
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    // For local filesystem, multipart upload is the same as regular upload
    return this.upload(key, data, options);
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const filePath = this.getFilePath(normalizedKey);

    if (!await this.exists(normalizedKey)) {
      throw new FileNotFoundError(normalizedKey);
    }

    const metadata = await this.getMetadata(normalizedKey);
    const stats = await fs.stat(filePath);

    let stream: Readable;

    if (options?.range) {
      // Create read stream with range
      stream = fsSync.createReadStream(filePath, {
        start: options.range.start,
        end: options.range.end
      });
    } else {
      stream = fsSync.createReadStream(filePath);
    }

    // Add progress tracking
    if (options?.onProgress) {
      let bytesRead = 0;
      const totalBytes = options?.range
        ? (options.range.end || stats.size) - options.range.start
        : stats.size;

      stream.on('data', (chunk: Buffer) => {
        bytesRead += chunk.length;
        options.onProgress!({
          bytesDownloaded: bytesRead,
          totalBytes,
          percentage: (bytesRead / totalBytes) * 100
        });
      });
    }

    const etag = await this.calculateETag(filePath);

    return {
      stream,
      metadata,
      etag,
      lastModified: stats.mtime,
      contentLength: stats.size
    };
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const filePath = this.getFilePath(normalizedKey);
    const metadataFilePath = this.getMetadataPath(normalizedKey);

    try {
      await fs.unlink(filePath);
      await fs.unlink(metadataFilePath).catch(() => {}); // Ignore if metadata doesn't exist

      // Clean up empty directories
      await this.cleanupEmptyDirectories(path.dirname(filePath));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.delete(key)));
  }

  async list(options?: ListOptions): Promise<ListResult> {
    this.ensureInitialized();

    const prefix = options?.prefix ? this.normalizeKey(options.prefix) : '';
    const searchPath = prefix ? this.getFilePath(prefix) : this.storagePath;

    const files: FileInfo[] = [];
    const directories = new Set<string>();

    try {
      await this.listDirectory(searchPath, prefix, files, directories, options);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          files: [],
          directories: [],
          isTruncated: false
        };
      }
      throw error;
    }

    // Apply maxKeys limit
    const maxKeys = options?.maxKeys || 1000;
    const limitedFiles = files.slice(0, maxKeys);

    return {
      files: limitedFiles,
      directories: Array.from(directories),
      isTruncated: files.length > maxKeys
    };
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedSource = this.normalizeKey(sourceKey);
    const normalizedDest = this.normalizeKey(destinationKey);

    const sourcePath = this.getFilePath(normalizedSource);
    const destPath = this.getFilePath(normalizedDest);

    if (!await this.exists(normalizedSource)) {
      throw new FileNotFoundError(normalizedSource);
    }

    if (!options?.overwrite && await this.exists(normalizedDest)) {
      throw new FileAlreadyExistsError(normalizedDest);
    }

    // Create destination directory
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    // Copy file
    await fs.copyFile(sourcePath, destPath);

    // Copy or create metadata
    if (options?.preserveMetadata) {
      const sourceMetadataPath = this.getMetadataPath(normalizedSource);
      const destMetadataPath = this.getMetadataPath(normalizedDest);
      await fs.mkdir(path.dirname(destMetadataPath), { recursive: true });
      await fs.copyFile(sourceMetadataPath, destMetadataPath).catch(() => {});
    }

    const stats = await fs.stat(destPath);
    const metadata = options?.metadata || await this.getMetadata(normalizedSource);

    return {
      key: normalizedDest,
      url: `file://${destPath}`,
      publicUrl: this.getPublicUrl(normalizedDest),
      etag: await this.calculateETag(destPath),
      size: stats.size,
      metadata
    };
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const metadataFilePath = this.getMetadataPath(normalizedKey);
    const filePath = this.getFilePath(normalizedKey);

    try {
      // Try to read metadata file
      const metadataContent = await fs.readFile(metadataFilePath, 'utf-8');
      return JSON.parse(metadataContent);
    } catch {
      // If metadata file doesn't exist, create from file stats
      try {
        const stats = await fs.stat(filePath);
        return {
          filename: path.basename(normalizedKey),
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime
        };
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new FileNotFoundError(normalizedKey);
        }
        throw error;
      }
    }
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const metadataFilePath = this.getMetadataPath(normalizedKey);

    if (!await this.exists(normalizedKey)) {
      throw new FileNotFoundError(normalizedKey);
    }

    const currentMetadata = await this.getMetadata(normalizedKey);
    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
      updatedAt: new Date()
    };

    await fs.mkdir(path.dirname(metadataFilePath), { recursive: true });
    await fs.writeFile(metadataFilePath, JSON.stringify(updatedMetadata, null, 2));
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    // For local storage, we return a file:// URL
    // In production, this should be served through HTTP
    const normalizedKey = this.normalizeKey(key);
    const filePath = this.getFilePath(normalizedKey);
    return `file://${filePath}`;
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    // In production, this should return an HTTP URL served by the application
    return `/storage/${normalizedKey}`;
  }

  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();

    const stats = await this.calculateDirectorySize(this.storagePath);

    return {
      totalFiles: stats.fileCount,
      totalSize: stats.totalSize,
      lastModified: stats.lastModified
    };
  }

  // Helper methods

  /**
   * Get file path with security validation
   * SECURITY: Prevents path traversal attacks
   */
  private getFilePath(key: string): string {
    return validatePathWithinDirectory(key, this.storagePath);
  }

  /**
   * Get metadata path with security validation
   * SECURITY: Prevents path traversal attacks
   */
  private getMetadataPath(key: string): string {
    const metadataKey = `${key}.json`;
    return validatePathWithinDirectory(metadataKey, this.metadataPath);
  }

  private async calculateETag(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fsSync.createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async listDirectory(
    dirPath: string,
    prefix: string,
    files: FileInfo[],
    directories: Set<string>,
    options?: ListOptions
  ): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.storagePath, fullPath);

      if (entry.isDirectory()) {
        if (options?.recursive !== false) {
          await this.listDirectory(fullPath, prefix, files, directories, options);
        }
        directories.add(relativePath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        const metadata = await this.getMetadata(relativePath).catch(() => ({
          filename: entry.name,
          size: stats.size
        }));

        files.push({
          key: relativePath,
          name: entry.name,
          size: stats.size,
          mimeType: metadata.mimeType,
          lastModified: stats.mtime,
          metadata,
          url: this.getPublicUrl(relativePath)
        });
      }
    }
  }

  private async calculateDirectorySize(
    dirPath: string
  ): Promise<{ totalSize: number; fileCount: number; lastModified?: Date }> {
    let totalSize = 0;
    let fileCount = 0;
    let lastModified: Date | undefined;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip metadata directory
          if (fullPath === this.metadataPath) continue;

          const subStats = await this.calculateDirectorySize(fullPath);
          totalSize += subStats.totalSize;
          fileCount += subStats.fileCount;

          if (subStats.lastModified) {
            if (!lastModified || subStats.lastModified > lastModified) {
              lastModified = subStats.lastModified;
            }
          }
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
          fileCount++;

          if (!lastModified || stats.mtime > lastModified) {
            lastModified = stats.mtime;
          }
        }
      }
    } catch (error) {
      // Ignore errors (directory might not exist)
    }

    return { totalSize, fileCount, lastModified };
  }

  private async cleanupEmptyDirectories(dirPath: string): Promise<void> {
    // Don't clean up root storage path
    if (dirPath === this.storagePath) return;

    try {
      const entries = await fs.readdir(dirPath);
      if (entries.length === 0) {
        await fs.rmdir(dirPath);
        // Recursively clean up parent
        await this.cleanupEmptyDirectories(path.dirname(dirPath));
      }
    } catch {
      // Ignore errors
    }
  }
}
