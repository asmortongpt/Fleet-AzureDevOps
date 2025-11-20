/**
 * AWS S3 Storage Adapter
 *
 * Supports AWS S3 and S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
 * Features:
 * - Standard and multipart uploads
 * - Presigned URLs
 * - Server-side encryption
 * - Storage class management
 */

import { Readable } from 'stream';

// Optional AWS SDK dependencies - lazy loaded
let S3Client: any = null;
let PutObjectCommand: any = null;
let GetObjectCommand: any = null;
let DeleteObjectCommand: any = null;
let DeleteObjectsCommand: any = null;
let CopyObjectCommand: any = null;
let HeadObjectCommand: any = null;
let ListObjectsV2Command: any = null;
let CreateMultipartUploadCommand: any = null;
let UploadPartCommand: any = null;
let CompleteMultipartUploadCommand: any = null;
let AbortMultipartUploadCommand: any = null;
let GetObjectAttributesCommand: any = null;
let PutObjectAclCommand: any = null;
let ObjectCannedACL: any = null;
let getSignedUrl: any = null;

// Lazy load AWS SDK
async function loadAwsS3() {
  if (S3Client) return true;

  try {
    const clientModule = await import('@aws-sdk/client-s3');
    S3Client = clientModule.S3Client;
    PutObjectCommand = clientModule.PutObjectCommand;
    GetObjectCommand = clientModule.GetObjectCommand;
    DeleteObjectCommand = clientModule.DeleteObjectCommand;
    DeleteObjectsCommand = clientModule.DeleteObjectsCommand;
    CopyObjectCommand = clientModule.CopyObjectCommand;
    HeadObjectCommand = clientModule.HeadObjectCommand;
    ListObjectsV2Command = clientModule.ListObjectsV2Command;
    CreateMultipartUploadCommand = clientModule.CreateMultipartUploadCommand;
    UploadPartCommand = clientModule.UploadPartCommand;
    CompleteMultipartUploadCommand = clientModule.CompleteMultipartUploadCommand;
    AbortMultipartUploadCommand = clientModule.AbortMultipartUploadCommand;
    GetObjectAttributesCommand = clientModule.GetObjectAttributesCommand;
    PutObjectAclCommand = clientModule.PutObjectAclCommand;
    ObjectCannedACL = clientModule.ObjectCannedACL;

    const presignerModule = await import('@aws-sdk/s3-request-presigner');
    getSignedUrl = presignerModule.getSignedUrl;

    return true;
  } catch (err) {
    console.warn('AWS S3 SDK not available - S3 storage will be disabled. Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner for S3 storage support.');
    return false;
  }
}
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

export class S3StorageAdapter extends BaseStorageAdapter {
  readonly provider = 's3';
  private client: S3Client;
  private bucket: string;

  // Multipart upload settings
  private readonly MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private readonly DEFAULT_PART_SIZE = 5 * 1024 * 1024; // 5MB (AWS minimum)
  private readonly MAX_PARTS = 10000; // AWS limit

  constructor(config: StorageConfig) {
    super(config);

    if (!config.s3) {
      console.warn('S3 configuration not provided - S3 storage adapter will be unavailable');
      return;
    }

    const { accessKeyId, secretAccessKey, region, bucket, endpoint, forcePathStyle } = config.s3;

    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      console.warn('S3 credentials, region, or bucket not provided - S3 storage adapter will be unavailable');
      return;
    }

    this.bucket = bucket;

    // Note: S3Client will be instantiated during initialize() after AWS SDK is loaded
    this.config.s3 = { accessKeyId, secretAccessKey, region, bucket, endpoint, forcePathStyle };
  }

  async initialize(): Promise<void> {
    // Load AWS SDK if not already loaded
    const sdkAvailable = await loadAwsS3();

    if (!sdkAvailable) {
      console.warn('S3 storage adapter unavailable - AWS SDK not installed');
      return;
    }

    if (!this.bucket || !this.config.s3) {
      console.warn('S3 storage adapter unavailable - configuration not provided');
      return;
    }

    try {
      // Create S3Client now that SDK is loaded
      const { accessKeyId, secretAccessKey, region, endpoint, forcePathStyle } = this.config.s3;

      this.client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey
        },
        endpoint,
        forcePathStyle: forcePathStyle || false
      });

      // Verify bucket exists by attempting to list objects
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          MaxKeys: 1
        })
      );

      this.initialized = true;
      console.log(`✅ S3 storage adapter initialized for bucket: ${this.bucket}`);
    } catch (error) {
      console.warn(
        `S3 storage adapter unavailable - failed to initialize bucket ${this.bucket}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      // Don't throw - allow app to continue without S3
    }
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);

    // Check if file exists and overwrite is not allowed
    if (!options?.overwrite && await this.exists(normalizedKey)) {
      throw new FileAlreadyExistsError(normalizedKey);
    }

    // For large files or streams, use multipart upload
    if (data instanceof Readable || (Buffer.isBuffer(data) && data.length > this.MULTIPART_THRESHOLD)) {
      return this.uploadMultipart(normalizedKey, data instanceof Readable ? data : Readable.from([data]), options);
    }

    // Single-part upload for smaller files
    const body = Buffer.isBuffer(data) ? data : await this.streamToBuffer(data);
    const size = body.length;

    try {
      const metadata: Record<string, string> = {};
      if (options?.metadata?.customMetadata) {
        Object.assign(metadata, options.metadata.customMetadata);
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        Body: body,
        ContentType: options?.contentType || options?.metadata?.mimeType || 'application/octet-stream',
        ContentEncoding: options?.contentEncoding,
        CacheControl: options?.cacheControl,
        Metadata: metadata,
        ACL: this.mapAclToS3(options?.acl),
        ServerSideEncryption: 'AES256',
        Tagging: options?.metadata?.tags ? options.metadata.tags.join('&') : undefined
      });

      const response = await this.client.send(command);

      return {
        key: normalizedKey,
        url: this.getPublicUrl(normalizedKey),
        publicUrl: this.getPublicUrl(normalizedKey),
        etag: response.ETag?.replace(/"/g, ''),
        versionId: response.VersionId,
        size,
        metadata: options?.metadata
      };
    } catch (error) {
      throw new Error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const partSize = options?.partSize || this.DEFAULT_PART_SIZE;

    let uploadId: string | undefined;

    try {
      // Initiate multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        ContentType: options?.contentType || 'application/octet-stream',
        ServerSideEncryption: 'AES256',
        ACL: this.mapAclToS3(options?.acl)
      });

      const { UploadId } = await this.client.send(createCommand);
      uploadId = UploadId;

      if (!uploadId) {
        throw new Error('Failed to initiate multipart upload');
      }

      // Upload parts
      const parts: Array<{ ETag: string; PartNumber: number }> = [];
      let partNumber = 1;
      let buffer = Buffer.alloc(0);
      let totalBytes = 0;

      for await (const chunk of data) {
        buffer = Buffer.concat([buffer, chunk as Buffer]);

        // Upload part when buffer reaches part size
        while (buffer.length >= partSize) {
          const partData = buffer.slice(0, partSize);
          buffer = buffer.slice(partSize);

          const uploadCommand = new UploadPartCommand({
            Bucket: this.bucket,
            Key: normalizedKey,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: partData
          });

          const { ETag } = await this.client.send(uploadCommand);

          if (!ETag) {
            throw new Error(`Failed to upload part ${partNumber}`);
          }

          parts.push({ ETag, PartNumber: partNumber });
          totalBytes += partData.length;
          partNumber++;

          // Report progress
          if (options?.onProgress) {
            options.onProgress({
              bytesUploaded: totalBytes,
              totalBytes: totalBytes,
              percentage: 0, // Can't determine without total size
              part: partNumber - 1,
              totalParts: 0
            });
          }

          if (partNumber > this.MAX_PARTS) {
            throw new Error(`Exceeded maximum number of parts (${this.MAX_PARTS})`);
          }
        }
      }

      // Upload remaining data as final part
      if (buffer.length > 0) {
        const uploadCommand = new UploadPartCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: buffer
        });

        const { ETag } = await this.client.send(uploadCommand);

        if (!ETag) {
          throw new Error(`Failed to upload final part ${partNumber}`);
        }

        parts.push({ ETag, PartNumber: partNumber });
        totalBytes += buffer.length;
      }

      // Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts }
      });

      const response = await this.client.send(completeCommand);

      return {
        key: normalizedKey,
        url: this.getPublicUrl(normalizedKey),
        publicUrl: this.getPublicUrl(normalizedKey),
        etag: response.ETag?.replace(/"/g, ''),
        versionId: response.VersionId,
        size: totalBytes,
        metadata: options?.metadata
      };
    } catch (error) {
      // Abort multipart upload on error
      if (uploadId) {
        try {
          await this.client.send(
            new AbortMultipartUploadCommand({
              Bucket: this.bucket,
              Key: normalizedKey,
              UploadId: uploadId
            })
          );
        } catch {}
      }

      throw new Error(
        `Failed to upload file via multipart: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        Range: options?.range
          ? `bytes=${options.range.start}-${options.range.end || ''}`
          : undefined,
        IfModifiedSince: options?.ifModifiedSince,
        IfMatch: options?.ifMatch
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const stream = response.Body as Readable;

      // Add progress tracking
      if (options?.onProgress) {
        let bytesRead = 0;
        const totalBytes = response.ContentLength || 0;

        stream.on('data', (chunk: Buffer) => {
          bytesRead += chunk.length;
          options.onProgress!({
            bytesDownloaded: bytesRead,
            totalBytes,
            percentage: totalBytes > 0 ? (bytesRead / totalBytes) * 100 : 0
          });
        });
      }

      const metadata: FileMetadata = {
        filename: normalizedKey.split('/').pop() || normalizedKey,
        mimeType: response.ContentType,
        size: response.ContentLength,
        customMetadata: response.Metadata as Record<string, string>
      };

      return {
        stream,
        metadata,
        etag: response.ETag?.replace(/"/g, ''),
        lastModified: response.LastModified,
        contentLength: response.ContentLength || 0
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        throw new FileNotFoundError(normalizedKey);
      }
      throw new Error(
        `Failed to download file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey
        })
      );
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    this.ensureInitialized();

    if (keys.length === 0) return;

    const normalizedKeys = keys.map(k => this.normalizeKey(k));

    // S3 supports deleting up to 1000 objects at once
    const chunks = this.chunkArray(normalizedKeys, 1000);

    for (const chunk of chunks) {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: chunk.map(key => ({ Key: key }))
          }
        })
      );
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

      const files: FileInfo[] = (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        name: (obj.Key || '').split('/').pop() || '',
        size: obj.Size || 0,
        etag: obj.ETag?.replace(/"/g, ''),
        lastModified: obj.LastModified || new Date(),
        url: this.getPublicUrl(obj.Key || '')
      }));

      const directories = (response.CommonPrefixes || [])
        .map(prefix => prefix.Prefix)
        .filter(Boolean) as string[];

      return {
        files,
        directories,
        continuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated || false
      };
    } catch (error) {
      throw new Error(
        `Failed to list files in S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedSource = this.normalizeKey(sourceKey);
    const normalizedDest = this.normalizeKey(destinationKey);

    if (!options?.overwrite && await this.exists(normalizedDest)) {
      throw new FileAlreadyExistsError(normalizedDest);
    }

    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${normalizedSource}`,
        Key: normalizedDest,
        MetadataDirective: options?.preserveMetadata ? 'COPY' : 'REPLACE',
        ServerSideEncryption: 'AES256'
      });

      const response = await this.client.send(command);

      const metadata = await this.getMetadata(normalizedDest);

      return {
        key: normalizedDest,
        url: this.getPublicUrl(normalizedDest),
        publicUrl: this.getPublicUrl(normalizedDest),
        etag: response.CopyObjectResult?.ETag?.replace(/"/g, ''),
        versionId: response.VersionId,
        size: metadata.size || 0,
        metadata
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        throw new FileNotFoundError(normalizedSource);
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey
      });

      const response = await this.client.send(command);

      return {
        filename: normalizedKey.split('/').pop() || normalizedKey,
        mimeType: response.ContentType,
        size: response.ContentLength,
        customMetadata: response.Metadata as Record<string, string>,
        createdAt: response.LastModified,
        updatedAt: response.LastModified
      };
    } catch (error: any) {
      if (error.name === 'NotFound') {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    // S3 doesn't support in-place metadata updates
    // We need to copy the object to itself with new metadata
    const normalizedKey = this.normalizeKey(key);

    const customMetadata: Record<string, string> = {};
    if (metadata.customMetadata) {
      Object.assign(customMetadata, metadata.customMetadata);
    }

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${normalizedKey}`,
        Key: normalizedKey,
        Metadata: customMetadata,
        MetadataDirective: 'REPLACE'
      })
    );
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const expiresIn = options?.expiresIn || 3600; // Default: 1 hour

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: normalizedKey,
      ResponseContentType: options?.contentType,
      ResponseContentDisposition: options?.contentDisposition
        ? `${options.contentDisposition}${options.filename ? `; filename="${options.filename}"` : ''}`
        : undefined
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    const region = this.config.s3?.region;
    const endpoint = this.config.s3?.endpoint;

    if (endpoint) {
      return `${endpoint}/${this.bucket}/${normalizedKey}`;
    }

    return `https://${this.bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
  }

  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();

    let totalFiles = 0;
    let totalSize = 0;
    let lastModified: Date | undefined;
    let continuationToken: string | undefined;

    // Iterate through all objects to calculate statistics
    do {
      const result = await this.list({
        maxKeys: 1000,
        continuationToken
      });

      totalFiles += result.files.length;
      totalSize += result.files.reduce((sum, file) => sum + file.size, 0);

      result.files.forEach(file => {
        if (!lastModified || file.lastModified > lastModified) {
          lastModified = file.lastModified;
        }
      });

      continuationToken = result.continuationToken;
    } while (continuationToken);

    return {
      totalFiles,
      totalSize,
      lastModified
    };
  }

  // Helper methods

  private mapAclToS3(acl?: string): ObjectCannedACL | undefined {
    if (!acl) return undefined;

    const aclMap: Record<string, ObjectCannedACL> = {
      'private': 'private',
      'public-read': 'public-read',
      'public-read-write': 'public-read-write',
      'authenticated-read': 'authenticated-read'
    };

    return aclMap[acl];
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async dispose(): Promise<void> {
    this.client.destroy();
    await super.dispose();
  }
}
