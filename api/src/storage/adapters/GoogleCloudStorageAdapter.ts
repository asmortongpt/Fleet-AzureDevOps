/**
 * Google Cloud Storage Adapter
 *
 * Integrates with Google Cloud Storage for scalable object storage
 * Note: Requires @google-cloud/storage package (install separately)
 */

import { Readable } from 'stream';
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

// Type definitions for @google-cloud/storage
interface GCSFile {
  save(data: Buffer | Readable, options?: any): Promise<void>;
  download(options?: any): Promise<[Buffer]>;
  createReadStream(options?: any): Readable;
  delete(): Promise<void>;
  copy(destination: any): Promise<void>;
  getMetadata(): Promise<any[]>;
  setMetadata(metadata: any): Promise<void>;
  exists(): Promise<[boolean]>;
  getSignedUrl(config: any): Promise<[string]>;
  publicUrl(): string;
  name: string;
}

interface GCSBucket {
  file(name: string): GCSFile;
  getFiles(options?: any): Promise<any[]>;
  exists(): Promise<[boolean]>;
  upload(localPath: string, options?: any): Promise<any>;
}

interface GCSStorage {
  bucket(name: string): GCSBucket;
}

export class GoogleCloudStorageAdapter extends BaseStorageAdapter {
  readonly provider = 'gcs';
  private storage: GCSStorage | null = null;
  private bucket: GCSBucket | null = null;
  private bucketName: string;

  constructor(config: StorageConfig) {
    super(config);

    if (!config.gcs) {
      throw new Error('Google Cloud Storage configuration is required');
    }

    const { projectId, bucket } = config.gcs;

    if (!projectId || !bucket) {
      throw new Error('GCS project ID and bucket are required');
    }

    this.bucketName = bucket;
  }

  async initialize(): Promise<void> {
    try {
      // Dynamically import @google-cloud/storage
      const { Storage } = await import('@google-cloud/storage');

      const storageOptions: any = {
        projectId: this.config.gcs!.projectId
      };

      if (this.config.gcs!.keyFilename) {
        storageOptions.keyFilename = this.config.gcs!.keyFilename;
      } else if (this.config.gcs!.credentials) {
        storageOptions.credentials = this.config.gcs!.credentials;
      }

      this.storage = new Storage(storageOptions) as unknown as GCSStorage;
      this.bucket = this.storage.bucket(this.bucketName);

      // Verify bucket exists
      const [exists] = await this.bucket.exists();
      if (!exists) {
        throw new Error(`Bucket ${this.bucketName} does not exist`);
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Google Cloud Storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const normalizedKey = this.normalizeKey(key);
    const file = this.bucket.file(normalizedKey);

    // Check if file exists and overwrite is not allowed
    if (!options?.overwrite) {
      const [exists] = await file.exists();
      if (exists) {
        throw new FileAlreadyExistsError(normalizedKey);
      }
    }

    try {
      const uploadOptions: any = {
        contentType: options?.contentType || options?.metadata?.mimeType || 'application/octet-stream',
        metadata: {
          contentEncoding: options?.contentEncoding,
          cacheControl: options?.cacheControl,
          metadata: options?.metadata?.customMetadata || {}
        },
        resumable: data instanceof Readable || (Buffer.isBuffer(data) && data.length > 10 * 1024 * 1024)
      };

      if (options?.acl === 'public-read') {
        uploadOptions.public = true;
      }

      let size: number;

      if (Buffer.isBuffer(data)) {
        size = data.length;
        await file.save(data, uploadOptions);
      } else {
        // Stream upload
        await new Promise<void>((resolve, reject) => {
          const writeStream = (file as any).createWriteStream(uploadOptions);
          let bytesWritten = 0;

          writeStream.on('error', reject);
          writeStream.on('finish', resolve);

          data.on('data', (chunk: Buffer) => {
            bytesWritten += chunk.length;
            if (options?.onProgress) {
              options.onProgress(this.calculateProgress(bytesWritten, bytesWritten));
            }
          });

          data.pipe(writeStream);
        });

        const [metadata] = await file.getMetadata();
        size = metadata.size || 0;
      }

      const [metadata] = await file.getMetadata();

      return {
        key: normalizedKey,
        url: file.publicUrl(),
        publicUrl: this.getPublicUrl(normalizedKey),
        etag: metadata.etag,
        size,
        metadata: options?.metadata
      };
    } catch (error) {
      throw new Error(
        'Failed to upload file to GCS: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    // GCS handles resumable uploads automatically
    return this.upload(key, data, { ...options, resumable: true } as any);
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const normalizedKey = this.normalizeKey(key);
    const file = this.bucket.file(normalizedKey);

    const [exists] = await file.exists();
    if (!exists) {
      throw new FileNotFoundError(normalizedKey);
    }

    const streamOptions: any = {};
    if (options?.range) {
      streamOptions.start = options.range.start;
      streamOptions.end = options.range.end;
    }

    const stream = file.createReadStream(streamOptions);

    const [metadata] = await file.getMetadata();

    // Add progress tracking
    if (options?.onProgress) {
      let bytesRead = 0;
      const totalBytes = metadata.size || 0;

      stream.on('data', (chunk: Buffer) => {
        bytesRead += chunk.length;
        options.onProgress!({
          bytesDownloaded: bytesRead,
          totalBytes,
          percentage: totalBytes > 0 ? (bytesRead / totalBytes) * 100 : 0
        });
      });
    }

    const fileMetadata: FileMetadata = {
      filename: normalizedKey.split('/').pop() || normalizedKey,
      mimeType: metadata.contentType,
      size: metadata.size,
      customMetadata: metadata.metadata || {}
    };

    return {
      stream,
      metadata: fileMetadata,
      etag: metadata.etag,
      lastModified: new Date(metadata.updated || metadata.timeCreated),
      contentLength: metadata.size || 0
    };
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const normalizedKey = this.normalizeKey(key);
    const file = this.bucket.file(normalizedKey);

    try {
      await file.delete();
    } catch (error: any) {
      if (error.code === 404) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const prefix = options?.prefix ? this.normalizeKey(options.prefix) : undefined;

    try {
      const [files] = await this.bucket.getFiles({
        prefix,
        delimiter: options?.delimiter,
        maxResults: options?.maxKeys || 1000,
        pageToken: options?.continuationToken,
        autoPaginate: false
      });

      const fileInfos: FileInfo[] = await Promise.all(
        files.map(async (file: any) => {
          const [metadata] = await file.getMetadata();
          return {
            key: file.name,
            name: file.name.split('/').pop() || file.name,
            size: metadata.size || 0,
            mimeType: metadata.contentType,
            etag: metadata.etag,
            lastModified: new Date(metadata.updated || metadata.timeCreated),
            url: this.getPublicUrl(file.name)
          };
        })
      );

      return {
        files: fileInfos,
        directories: [],
        isTruncated: files.length === (options?.maxKeys || 1000)
      };
    } catch (error) {
      throw new Error(
        'Failed to list files in GCS: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const normalizedSource = this.normalizeKey(sourceKey);
    const normalizedDest = this.normalizeKey(destinationKey);

    const sourceFile = this.bucket.file(normalizedSource);
    const destFile = this.bucket.file(normalizedDest);

    const [sourceExists] = await sourceFile.exists();
    if (!sourceExists) {
      throw new FileNotFoundError(normalizedSource);
    }

    if (!options?.overwrite) {
      const [destExists] = await destFile.exists();
      if (destExists) {
        throw new FileAlreadyExistsError(normalizedDest);
      }
    }

    await sourceFile.copy(destFile);

    const [metadata] = await destFile.getMetadata();

    return {
      key: normalizedDest,
      url: destFile.publicUrl(),
      publicUrl: this.getPublicUrl(normalizedDest),
      etag: metadata.etag,
      size: metadata.size || 0,
      metadata: await this.getMetadata(normalizedDest)
    };
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const normalizedKey = this.normalizeKey(key);
    const file = this.bucket.file(normalizedKey);

    try {
      const [metadata] = await file.getMetadata();

      return {
        filename: normalizedKey.split('/').pop() || normalizedKey,
        mimeType: metadata.contentType,
        size: metadata.size,
        customMetadata: metadata.metadata || {},
        createdAt: new Date(metadata.timeCreated),
        updatedAt: new Date(metadata.updated)
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const normalizedKey = this.normalizeKey(key);
    const file = this.bucket.file(normalizedKey);

    await file.setMetadata({
      metadata: metadata.customMetadata || {}
    });
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    const normalizedKey = this.normalizeKey(key);
    const file = this.bucket.file(normalizedKey);

    const expiresIn = options?.expiresIn || 3600;
    const expires = Date.now() + expiresIn * 1000;

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires,
      contentType: options?.contentType,
      responseDisposition: options?.contentDisposition
        ? '${options.contentDisposition}${options.filename ? `; filename="${options.filename}"` : ''}`
        : undefined
    });

    return url;
  }

  getPublicUrl(key: string): string {
    if (!this.bucket) throw new Error('Bucket not initialized');
    const normalizedKey = this.normalizeKey(key);
    const file = this.bucket.file(normalizedKey);
    return file.publicUrl();
  }

  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();
    if (!this.bucket) throw new Error('Bucket not initialized');

    let totalFiles = 0;
    let totalSize = 0;
    let lastModified: Date | undefined;

    const [files] = await this.bucket.getFiles();

    for (const file of files) {
      const [metadata] = await file.getMetadata();
      totalFiles++;
      totalSize += metadata.size || 0;

      const updated = new Date(metadata.updated || metadata.timeCreated);
      if (!lastModified || updated > lastModified) {
        lastModified = updated;
      }
    }

    return {
      totalFiles,
      totalSize,
      lastModified
    };
  }
}
