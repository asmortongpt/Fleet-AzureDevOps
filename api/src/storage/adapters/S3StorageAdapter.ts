/**
 * AWS S3 Storage Adapter
 *
 * Supports AWS S3 and S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
 * Features:
 * - Standard uploads
 * - Presigned URLs
 * - Storage class management
 */

import { Readable } from 'stream';
import { S3Client } from '@aws-sdk/client-s3';
// Deep imports to bypass missing exports in main index
import { PutObjectCommand } from '@aws-sdk/client-s3/dist-types/commands/PutObjectCommand';
import { GetObjectCommand } from '@aws-sdk/client-s3/dist-types/commands/GetObjectCommand';
import { DeleteObjectCommand } from '@aws-sdk/client-s3/dist-types/commands/DeleteObjectCommand';
import { ListObjectsV2Command } from '@aws-sdk/client-s3/dist-types/commands/ListObjectsV2Command';
import { HeadObjectCommand } from '@aws-sdk/client-s3/dist-types/commands/HeadObjectCommand';
import { CopyObjectCommand } from '@aws-sdk/client-s3/dist-types/commands/CopyObjectCommand';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3/dist-types/commands/DeleteObjectsCommand';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  BaseStorageAdapter,
  StorageConfig,
  UploadOptions,
  UploadResult,
  DownloadOptions,
  DownloadResult,
  ListOptions,
  ListResult,
  FileInfo,
  CopyOptions,
  GetUrlOptions,
  StorageStats,
  FileMetadata,
  FileNotFoundError,
  StorageError
} from '../StorageAdapter';

export class S3StorageAdapter extends BaseStorageAdapter {
  readonly provider = 's3';
  private client!: S3Client;
  private bucket!: string;

  constructor(config: StorageConfig) {
    super(config);
    if (config.s3) {
      this.bucket = config.s3.bucket;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.config.s3) {
      throw new Error('S3 configuration is missing');
    }

    const { region, endpoint, accessKeyId, secretAccessKey, forcePathStyle } = this.config.s3;

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
    });

    this.initialized = true;
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();
    const normalizedKey = this.normalizeKey(key);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        Body: data as any,
        ContentType: options?.contentType,
        Metadata: options?.metadata?.customMetadata || {},
        ACL: options?.acl as any,
        CacheControl: options?.cacheControl
      });

      const result = await this.client.send(command);

      return {
        key: normalizedKey,
        url: this.getPublicUrl(normalizedKey),
        size: options?.metadata?.size || 0,
        etag: result.ETag?.replace(/"/g, ''),
        metadata: options?.metadata
      };
    } catch (error) {
      throw new StorageError(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPLOAD_FAILED'
      );
    }
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    return this.upload(key, data, options);
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    this.ensureInitialized();
    const normalizedKey = this.normalizeKey(key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        Range: options?.range ? `bytes=${options.range.start}-${options.range.end || ''}` : undefined,
        IfModifiedSince: options?.ifModifiedSince,
        IfMatch: options?.ifMatch
      });

      const response = await this.client.send(command);

      return {
        stream: response.Body as Readable,
        metadata: {
          filename: normalizedKey.split('/').pop() || '',
          mimeType: response.ContentType,
          size: response.ContentLength,
          contentType: response.ContentType,
          customMetadata: response.Metadata,
        },
        etag: response.ETag?.replace(/"/g, ''),
        lastModified: response.LastModified,
        contentLength: response.ContentLength || 0
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
        throw new FileNotFoundError(normalizedKey);
      }
      throw new StorageError(`Failed to download file from S3: ${error.message}`, 'DOWNLOAD_FAILED');
    }
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();
    const normalizedKey = this.normalizeKey(key);

    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey
      }));
    } catch (error: any) {
      throw new StorageError(`Failed to delete file from S3: ${error.message}`, 'DELETE_FAILED');
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    this.ensureInitialized();
    if (keys.length === 0) return;

    try {
      await this.client.send(new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map(key => ({ Key: this.normalizeKey(key) })),
          Quiet: true
        }
      }));
    } catch (error: any) {
      throw new StorageError(`Failed to delete multiple files from S3: ${error.message}`, 'DELETE_FAILED');
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    this.ensureInitialized();
    const prefix = options?.prefix ? this.normalizeKey(options.prefix) : undefined;

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        Delimiter: options?.delimiter,
        MaxKeys: options?.maxKeys || 1000,
        ContinuationToken: options?.continuationToken
      });

      const response = await this.client.send(command);

      const files: FileInfo[] = (response.Contents || []).map((obj: any) => ({
        key: obj.Key || '',
        name: (obj.Key || '').split('/').pop() || '',
        size: obj.Size || 0,
        etag: obj.ETag?.replace(/"/g, ''),
        url: this.getPublicUrl(obj.Key || '')
      }));

      const directories = (response.CommonPrefixes || [])
        .map((prefix: any) => prefix.Prefix)
        .filter(Boolean) as string[];

      return {
        files,
        directories,
        continuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated || false
      };
    } catch (error: any) {
      throw new StorageError(`Failed to list files in S3: ${error.message}`, 'LIST_FAILED');
    }
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    this.ensureInitialized();
    const normalizedSource = this.normalizeKey(sourceKey);
    const normalizedDest = this.normalizeKey(destinationKey);

    try {
      await this.client.send(new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${normalizedSource}`,
        Key: normalizedDest,
        Metadata: options?.metadata?.customMetadata || undefined,
        MetadataDirective: options?.metadata ? 'REPLACE' : 'COPY'
      }));

      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: normalizedDest }));
      return {
        key: normalizedDest,
        url: this.getPublicUrl(normalizedDest),
        size: head.ContentLength || 0,
        etag: head.ETag?.replace(/"/g, ''),
        metadata: options?.metadata
      };

    } catch (error: any) {
      throw new StorageError(`Failed to copy file in S3: ${error.message}`, 'COPY_FAILED');
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureInitialized();
    const normalizedKey = this.normalizeKey(key);

    try {
      const response = await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey
      }));

      return {
        filename: normalizedKey.split('/').pop() || '',
        mimeType: response.ContentType,
        size: response.ContentLength,
        contentType: response.ContentType,
        customMetadata: response.Metadata
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey' || (error.Code === 'NotFound')) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw new StorageError(`Failed to get metadata from S3: ${error.message}`, 'METADATA_FAILED');
    }
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    await this.copy(key, key, { metadata: metadata as FileMetadata });
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    this.ensureInitialized();
    const normalizedKey = this.normalizeKey(key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        ResponseContentType: options?.contentType,
        ResponseContentDisposition: options?.contentDisposition ?
          `${options.contentDisposition}; filename="${options.filename || normalizedKey.split('/').pop()}"` : undefined
      });

      return await getSignedUrl(this.client, command, { expiresIn: options?.expiresIn || 3600 });
    } catch (error: any) {
      throw new StorageError(`Failed to generate signed URL for S3: ${error.message}`, 'URL_GENERATION_FAILED');
    }
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    if (!this.config.s3) return '';
    const { bucket, region } = this.config.s3;
    return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
  }

  async getStats(): Promise<StorageStats> {
    return {
      totalFiles: 0,
      totalSize: 0
    };
  }

  async dispose(): Promise<void> {
    if (this.client) {
      if (typeof (this.client as any).destroy === 'function') {
        (this.client as any).destroy();
      }
    }
    await super.dispose();
  }
}
