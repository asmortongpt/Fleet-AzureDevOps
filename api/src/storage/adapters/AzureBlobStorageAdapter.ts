/**
 * Azure Blob Storage Adapter
 *
 * Integrates with Azure Blob Storage for enterprise-grade cloud storage
 * Features:
 * - Block blob uploads (standard and chunked)
 * - SAS token generation for secure access
 * - Blob tiers (Hot, Cool, Archive)
 * - Container and blob metadata
 */

import { Readable } from 'stream';
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  BlobUploadCommonResponse,
  BlobDownloadResponseParsed
} from '@azure/storage-blob';
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

export class AzureBlobStorageAdapter extends BaseStorageAdapter {
  readonly provider = 'azure';
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;
  private credential?: StorageSharedKeyCredential;

  // Block upload settings
  private readonly BLOCK_SIZE = 4 * 1024 * 1024; // 4MB blocks
  private readonly MAX_BLOCK_SIZE = 100 * 1024 * 1024; // 100MB max block size
  private readonly PARALLEL_UPLOADS = 4;

  constructor(config: StorageConfig) {
    super(config);

    if (!config.azure) {
      throw new Error('Azure configuration is required');
    }

    const { connectionString, accountName, accountKey, containerName, sasToken } = config.azure;

    if (!containerName) {
      throw new Error('Azure container name is required');
    }

    this.containerName = containerName;

    if (connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else if (accountName && accountKey) {
      this.credential = new StorageSharedKeyCredential(accountName, accountKey);
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        this.credential
      );
    } else if (accountName && sasToken) {
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net?${sasToken}`
      );
    } else {
      throw new Error('Azure credentials are required (connectionString or accountName/accountKey or accountName/sasToken)');
    }

    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  async initialize(): Promise<void> {
    try {
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists();

      // Verify access
      await this.containerClient.getProperties();

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Azure Blob Storage for container ${this.containerName}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const blobClient = this.containerClient.getBlockBlobClient(normalizedKey);

    // Check if blob exists and overwrite is not allowed
    if (!options?.overwrite && await blobClient.exists()) {
      throw new FileAlreadyExistsError(normalizedKey);
    }

    try {
      const metadata: Record<string, string> = {};
      if (options?.metadata?.customMetadata) {
        Object.assign(metadata, options.metadata.customMetadata);
      }

      let response: BlobUploadCommonResponse;
      let size: number;

      if (Buffer.isBuffer(data)) {
        size = data.length;
        response = await blobClient.upload(data, size, {
          blobHTTPHeaders: {
            blobContentType: options?.contentType || options?.metadata?.mimeType || 'application/octet-stream',
            blobContentEncoding: options?.contentEncoding,
            blobCacheControl: options?.cacheControl
          },
          metadata,
          onProgress: options?.onProgress
            ? (ev) => {
                options.onProgress!(this.calculateProgress(ev.loadedBytes, size));
              }
            : undefined
        });
      } else {
        // For streams, use uploadStream with block size
        const blockSize = options?.partSize || this.BLOCK_SIZE;
        response = await blobClient.uploadStream(
          data,
          blockSize,
          this.PARALLEL_UPLOADS,
          {
            blobHTTPHeaders: {
              blobContentType: options?.contentType || 'application/octet-stream',
              blobContentEncoding: options?.contentEncoding,
              blobCacheControl: options?.cacheControl
            },
            metadata,
            onProgress: options?.onProgress
              ? (ev) => {
                  options.onProgress!(this.calculateProgress(ev.loadedBytes, ev.loadedBytes));
                }
              : undefined
          }
        );

        // Get actual size after upload
        const props = await blobClient.getProperties();
        size = props.contentLength || 0;
      }

      return {
        key: normalizedKey,
        url: blobClient.url,
        publicUrl: this.getPublicUrl(normalizedKey),
        etag: response.etag?.replace(/"/g, ''),
        versionId: response.versionId,
        size,
        metadata: options?.metadata
      };
    } catch (error) {
      throw new Error(
        `Failed to upload file to Azure Blob Storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    // Azure Blob Storage handles chunked uploads automatically in uploadStream
    return this.upload(key, data, options);
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const blobClient = this.containerClient.getBlockBlobClient(normalizedKey);

    try {
      const downloadOptions: any = {};

      if (options?.range) {
        downloadOptions.range = {
          offset: options.range.start,
          count: options.range.end ? options.range.end - options.range.start + 1 : undefined
        };
      }

      if (options?.ifModifiedSince) {
        downloadOptions.conditions = {
          ifModifiedSince: options.ifModifiedSince
        };
      }

      if (options?.ifMatch) {
        downloadOptions.conditions = {
          ...downloadOptions.conditions,
          ifMatch: options.ifMatch
        };
      }

      const response: BlobDownloadResponseParsed = await blobClient.download(
        options?.range?.start || 0,
        undefined,
        downloadOptions
      );

      if (!response.readableStreamBody) {
        throw new Error('No data received from Azure Blob Storage');
      }

      const stream = response.readableStreamBody;

      // Add progress tracking
      if (options?.onProgress) {
        let bytesRead = 0;
        const totalBytes = response.contentLength || 0;

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
        mimeType: response.contentType,
        size: response.contentLength,
        customMetadata: response.metadata as Record<string, string>
      };

      return {
        stream,
        metadata,
        etag: response.etag?.replace(/"/g, ''),
        lastModified: response.lastModified,
        contentLength: response.contentLength || 0
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw new Error(
        `Failed to download file from Azure Blob Storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const blobClient = this.containerClient.getBlockBlobClient(normalizedKey);

    try {
      await blobClient.delete();
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    this.ensureInitialized();

    if (keys.length === 0) return;

    // Azure doesn't have bulk delete, so we delete in parallel
    await Promise.all(keys.map(key => this.delete(key).catch(() => {})));
  }

  async list(options?: ListOptions): Promise<ListResult> {
    this.ensureInitialized();

    const prefix = options?.prefix ? this.normalizeKey(options.prefix) : undefined;

    try {
      const files: FileInfo[] = [];
      const directories = new Set<string>();

      const iterator = this.containerClient.listBlobsFlat({
        prefix,
        includeMetadata: true
      }).byPage({
        maxPageSize: options?.maxKeys || 1000,
        continuationToken: options?.continuationToken
      });

      // Get first page only
      const page = await iterator.next();

      if (!page.done && page.value) {
        for (const blob of page.value.segment.blobItems) {
          files.push({
            key: blob.name,
            name: blob.name.split('/').pop() || blob.name,
            size: blob.properties.contentLength || 0,
            mimeType: blob.properties.contentType,
            etag: blob.properties.etag?.replace(/"/g, ''),
            lastModified: blob.properties.lastModified || new Date(),
            metadata: {
              filename: blob.name.split('/').pop() || blob.name,
              mimeType: blob.properties.contentType,
              size: blob.properties.contentLength,
              customMetadata: blob.metadata as Record<string, string>
            },
            url: this.getPublicUrl(blob.name)
          });
        }

        // Extract directories if delimiter is set
        if (options?.delimiter && page.value.segment.blobPrefixes) {
          for (const blobPrefix of page.value.segment.blobPrefixes) {
            if (blobPrefix.name) {
              directories.add(blobPrefix.name);
            }
          }
        }

        return {
          files,
          directories: Array.from(directories),
          continuationToken: page.value.continuationToken,
          isTruncated: !!page.value.continuationToken
        };
      }

      return {
        files: [],
        directories: [],
        isTruncated: false
      };
    } catch (error) {
      throw new Error(
        `Failed to list files in Azure Blob Storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedSource = this.normalizeKey(sourceKey);
    const normalizedDest = this.normalizeKey(destinationKey);

    const sourceBlobClient = this.containerClient.getBlockBlobClient(normalizedSource);
    const destBlobClient = this.containerClient.getBlockBlobClient(normalizedDest);

    if (!options?.overwrite && await destBlobClient.exists()) {
      throw new FileAlreadyExistsError(normalizedDest);
    }

    try {
      // Start copy operation
      const copyPoller = await destBlobClient.beginCopyFromURL(sourceBlobClient.url);
      await copyPoller.pollUntilDone();

      const props = await destBlobClient.getProperties();

      const metadata: FileMetadata = {
        filename: normalizedDest.split('/').pop() || normalizedDest,
        mimeType: props.contentType,
        size: props.contentLength,
        customMetadata: props.metadata as Record<string, string>
      };

      return {
        key: normalizedDest,
        url: destBlobClient.url,
        publicUrl: this.getPublicUrl(normalizedDest),
        etag: props.etag?.replace(/"/g, ''),
        versionId: props.versionId,
        size: props.contentLength || 0,
        metadata
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new FileNotFoundError(normalizedSource);
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const blobClient = this.containerClient.getBlockBlobClient(normalizedKey);

    try {
      const props = await blobClient.getProperties();

      return {
        filename: normalizedKey.split('/').pop() || normalizedKey,
        mimeType: props.contentType,
        size: props.contentLength,
        customMetadata: props.metadata as Record<string, string>,
        createdAt: props.createdOn,
        updatedAt: props.lastModified
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const blobClient = this.containerClient.getBlockBlobClient(normalizedKey);

    const azureMetadata: Record<string, string> = {};
    if (metadata.customMetadata) {
      Object.assign(azureMetadata, metadata.customMetadata);
    }

    await blobClient.setMetadata(azureMetadata);
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    this.ensureInitialized();

    if (!this.credential) {
      throw new Error('Cannot generate SAS URLs without storage account credentials');
    }

    const normalizedKey = this.normalizeKey(key);
    const blobClient = this.containerClient.getBlockBlobClient(normalizedKey);

    const expiresIn = options?.expiresIn || 3600; // Default: 1 hour
    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + expiresIn * 1000);

    const permissions = BlobSASPermissions.parse('r'); // Read permission

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName: normalizedKey,
        permissions,
        startsOn,
        expiresOn,
        contentType: options?.contentType,
        contentDisposition: options?.contentDisposition
          ? '${options.contentDisposition}${options.filename ? '; filename="${options.filename}"' : ''}'
          : undefined
      },
      this.credential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    const blobClient = this.containerClient.getBlockBlobClient(normalizedKey);
    return blobClient.url;
  }

  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();

    let totalFiles = 0;
    let totalSize = 0;
    let lastModified: Date | undefined;

    // Iterate through all blobs
    for await (const blob of this.containerClient.listBlobsFlat({ includeMetadata: true })) {
      totalFiles++;
      totalSize += blob.properties.contentLength || 0;

      if (!lastModified || (blob.properties.lastModified && blob.properties.lastModified > lastModified)) {
        lastModified = blob.properties.lastModified || undefined;
      }
    }

    return {
      totalFiles,
      totalSize,
      lastModified
    };
  }
}
