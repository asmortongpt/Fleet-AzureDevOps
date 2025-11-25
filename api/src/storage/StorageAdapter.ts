/**
 * Storage Adapter Interface
 *
 * Provides a unified interface for multiple cloud storage providers
 * Supports: Local filesystem, AWS S3, Azure Blob, Google Cloud Storage,
 * Dropbox, Box.com, and SharePoint
 */

import { Readable, Writable } from 'stream';

/**
 * Storage configuration for different providers
 */
export interface StorageConfig {
  provider: 'local' | 's3' | 'azure' | 'gcs' | 'dropbox' | 'box' | 'sharepoint';

  // Common settings
  basePath?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  enableCompression?: boolean;

  // Provider-specific settings
  local?: LocalStorageConfig;
  s3?: S3StorageConfig;
  azure?: AzureStorageConfig;
  gcs?: GCSStorageConfig;
  dropbox?: DropboxStorageConfig;
  box?: BoxStorageConfig;
  sharepoint?: SharePointStorageConfig;
}

export interface LocalStorageConfig {
  storagePath: string;
  createDirs?: boolean;
}

export interface S3StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string; // For S3-compatible services
  forcePathStyle?: boolean;
}

export interface AzureStorageConfig {
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  containerName: string;
  sasToken?: string;
}

export interface GCSStorageConfig {
  projectId: string;
  keyFilename?: string;
  credentials?: any;
  bucket: string;
}

export interface DropboxStorageConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  basePath?: string;
}

export interface BoxStorageConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken?: string;
  folderId?: string;
}

export interface SharePointStorageConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteUrl: string;
  libraryName: string;
}

/**
 * File metadata for storage operations
 */
export interface FileMetadata {
  filename: string;
  mimeType?: string;
  size?: number;
  contentType?: string;
  customMetadata?: Record<string, string>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  permissions?: FilePermissions;
}

export interface FilePermissions {
  read?: string[];
  write?: string[];
  delete?: string[];
  public?: boolean;
}

/**
 * Upload options
 */
export interface UploadOptions {
  metadata?: FileMetadata;
  contentType?: string;
  contentEncoding?: string;
  cacheControl?: string;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  multipart?: boolean;
  partSize?: number; // For multipart uploads (default: 5MB)
  onProgress?: (progress: UploadProgress) => void;
  overwrite?: boolean;
}

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  part?: number;
  totalParts?: number;
}

/**
 * Download options
 */
export interface DownloadOptions {
  range?: {
    start: number;
    end?: number;
  };
  ifModifiedSince?: Date;
  ifMatch?: string; // ETag matching
  onProgress?: (progress: DownloadProgress) => void;
}

export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
}

/**
 * Result of upload operation
 */
export interface UploadResult {
  key: string;
  url: string;
  publicUrl?: string;
  versionId?: string;
  etag?: string;
  size: number;
  metadata?: FileMetadata;
}

/**
 * Result of download operation
 */
export interface DownloadResult {
  stream: Readable;
  metadata: FileMetadata;
  etag?: string;
  lastModified?: Date;
  contentLength: number;
}

/**
 * File information
 */
export interface FileInfo {
  key: string;
  name: string;
  size: number;
  mimeType?: string;
  etag?: string;
  lastModified: Date;
  metadata?: FileMetadata;
  url?: string;
  isDirectory?: boolean;
}

/**
 * List options
 */
export interface ListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
  recursive?: boolean;
}

/**
 * List result
 */
export interface ListResult {
  files: FileInfo[];
  directories?: string[];
  continuationToken?: string;
  isTruncated: boolean;
}

/**
 * Copy/Move options
 */
export interface CopyOptions {
  metadata?: FileMetadata;
  overwrite?: boolean;
  preserveMetadata?: boolean;
}

/**
 * URL generation options
 */
export interface GetUrlOptions {
  expiresIn?: number; // Seconds
  contentType?: string;
  contentDisposition?: 'inline' | 'attachment';
  filename?: string;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  lastModified?: Date;
  quota?: {
    used: number;
    total: number;
    available: number;
  };
}

/**
 * Base Storage Adapter Interface
 * All storage adapters must implement this interface
 */
export interface IStorageAdapter {
  /**
   * Provider name
   */
  readonly provider: string;

  /**
   * Initialize the storage adapter
   */
  initialize(): Promise<void>;

  /**
   * Upload a file from buffer
   * @param key - File key/path
   * @param data - File data as Buffer or Readable stream
   * @param options - Upload options
   */
  upload(
    key: string,
    data: Buffer | Readable,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Upload a file with multipart support for large files (>100MB)
   * @param key - File key/path
   * @param data - File data as Buffer or Readable stream
   * @param options - Upload options
   */
  uploadMultipart(
    key: string,
    data: Readable,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Download a file
   * @param key - File key/path
   * @param options - Download options
   */
  download(key: string, options?: DownloadOptions): Promise<DownloadResult>;

  /**
   * Delete a file
   * @param key - File key/path
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple files
   * @param keys - Array of file keys/paths
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * List files
   * @param options - List options
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Copy a file
   * @param sourceKey - Source file key/path
   * @param destinationKey - Destination file key/path
   * @param options - Copy options
   */
  copy(
    sourceKey: string,
    destinationKey: string,
    options?: CopyOptions
  ): Promise<UploadResult>;

  /**
   * Move a file (copy + delete source)
   * @param sourceKey - Source file key/path
   * @param destinationKey - Destination file key/path
   * @param options - Copy options
   */
  move(
    sourceKey: string,
    destinationKey: string,
    options?: CopyOptions
  ): Promise<UploadResult>;

  /**
   * Check if a file exists
   * @param key - File key/path
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   * @param key - File key/path
   */
  getMetadata(key: string): Promise<FileMetadata>;

  /**
   * Update file metadata
   * @param key - File key/path
   * @param metadata - New metadata
   */
  updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void>;

  /**
   * Generate a signed/presigned URL for file access
   * @param key - File key/path
   * @param options - URL generation options
   */
  getUrl(key: string, options?: GetUrlOptions): Promise<string>;

  /**
   * Get public URL (if supported)
   * @param key - File key/path
   */
  getPublicUrl(key: string): string;

  /**
   * Get storage statistics
   */
  getStats(): Promise<StorageStats>;

  /**
   * Cleanup/dispose resources
   */
  dispose(): Promise<void>;
}

/**
 * Abstract base class for storage adapters
 * Provides common functionality
 */
export abstract class BaseStorageAdapter implements IStorageAdapter {
  protected config: StorageConfig;
  protected initialized: boolean = false;

  abstract readonly provider: string;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult>;
  abstract uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult>;
  abstract download(key: string, options?: DownloadOptions): Promise<DownloadResult>;
  abstract delete(key: string): Promise<void>;
  abstract list(options?: ListOptions): Promise<ListResult>;
  abstract copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult>;
  abstract getMetadata(key: string): Promise<FileMetadata>;
  abstract updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void>;
  abstract getUrl(key: string, options?: GetUrlOptions): Promise<string>;
  abstract getPublicUrl(key: string): string;
  abstract getStats(): Promise<StorageStats>;

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.delete(key)));
  }

  async move(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    const result = await this.copy(sourceKey, destinationKey, options);
    await this.delete(sourceKey);
    return result;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.getMetadata(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async dispose(): Promise<void> {
    // Default implementation - override if cleanup needed
    this.initialized = false;
  }

  /**
   * Validate file against allowed MIME types and size limits
   */
  protected validateFile(metadata: FileMetadata): void {
    const { allowedMimeTypes, maxFileSize } = this.config;

    if (maxFileSize && metadata.size && metadata.size > maxFileSize) {
      throw new Error(
        `File size ${metadata.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes`
      );
    }

    if (allowedMimeTypes && metadata.mimeType && !allowedMimeTypes.includes(metadata.mimeType)) {
      throw new Error(
        'MIME type ${metadata.mimeType} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }
  }

  /**
   * Normalize file key/path
   */
  protected normalizeKey(key: string): string {
    // Remove leading/trailing slashes
    let normalized = key.trim().replace(/^\/+|\/+$/g, '');

    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');

    // Add base path if configured
    if (this.config.basePath) {
      const basePath = this.config.basePath.replace(/^\/+|\/+$/g, '');
      normalized = `${basePath}/${normalized}`;
    }

    return normalized;
  }

  /**
   * Calculate upload progress
   */
  protected calculateProgress(bytesUploaded: number, totalBytes: number): UploadProgress {
    const percentage = totalBytes > 0 ? (bytesUploaded / totalBytes) * 100 : 0;
    return {
      bytesUploaded,
      totalBytes,
      percentage: Math.min(100, Math.max(0, percentage))
    };
  }

  /**
   * Ensure adapter is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Storage adapter '${this.provider}' is not initialized. Call initialize() first.`);
    }
  }
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class FileNotFoundError extends StorageError {
  constructor(key: string) {
    super('File not found: ${key}`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
  }
}

export class FileAlreadyExistsError extends StorageError {
  constructor(key: string) {
    super('File already exists: ${key}`, 'FILE_ALREADY_EXISTS', 409);
    this.name = 'FileAlreadyExistsError';
  }
}

export class QuotaExceededError extends StorageError {
  constructor(message: string = 'Storage quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 507);
    this.name = 'QuotaExceededError';
  }
}

export class InvalidFileTypeError extends StorageError {
  constructor(mimeType: string) {
    super('Invalid file type: ${mimeType}`, 'INVALID_FILE_TYPE', 400);
    this.name = 'InvalidFileTypeError';
  }
}
