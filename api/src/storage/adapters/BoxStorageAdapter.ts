/**
 * Box.com Storage Adapter
 *
 * Integrates with Box.com for enterprise content management
 * Note: Requires box-node-sdk package (install separately)
 */

import { Readable } from 'stream';
import axios from 'axios';
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

export class BoxStorageAdapter extends BaseStorageAdapter {
  readonly provider = 'box';
  private accessToken: string;
  private folderId: string;

  private readonly API_BASE = 'https://api.box.com/2.0';
  private readonly UPLOAD_BASE = 'https://upload.box.com/api/2.0';

  constructor(config: StorageConfig) {
    super(config);

    if (!config.box?.accessToken) {
      throw new Error('Box access token is required');
    }

    this.accessToken = config.box.accessToken;
    this.folderId = config.box.folderId || '0'; // 0 = root folder
  }

  async initialize(): Promise<void> {
    try {
      // Verify access token by getting user info
      const response = await axios.get(`${this.API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (!response.data) {
        throw new Error('Failed to verify Box credentials');
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Box storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const filename = normalizedKey.split('/').pop() || normalizedKey;

    const buffer = Buffer.isBuffer(data) ? data : await this.streamToBuffer(data);

    const FormData = (await import('form-data')).default;
    const form = new FormData();

    form.append('attributes', JSON.stringify({
      name: filename,
      parent: { id: this.folderId }
    }));
    form.append('file', buffer, { filename });

    try {
      const response = await axios.post(`${this.UPLOAD_BASE}/files/content`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      const file = response.data.entries[0];

      return {
        key: normalizedKey,
        url: await this.getUrl(normalizedKey, { expiresIn: 3600 }),
        publicUrl: this.getPublicUrl(normalizedKey),
        etag: file.etag,
        size: file.size,
        metadata: options?.metadata
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new FileAlreadyExistsError(normalizedKey);
      }
      throw new Error(`Failed to upload to Box: ${error.message}`);
    }
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    // Box handles large files automatically via chunked uploads
    return this.upload(key, data, options);
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const fileId = await this.getFileIdByName(normalizedKey);

    if (!fileId) {
      throw new FileNotFoundError(normalizedKey);
    }

    const response = await axios.get(`${this.API_BASE}/files/${fileId}/content`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      responseType: 'stream'
    });

    const metadata = await this.getMetadata(normalizedKey);

    return {
      stream: response.data,
      metadata,
      contentLength: metadata.size || 0
    };
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const fileId = await this.getFileIdByName(normalizedKey);

    if (!fileId) {
      throw new FileNotFoundError(normalizedKey);
    }

    await axios.delete(`${this.API_BASE}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
  }

  async list(options?: ListOptions): Promise<ListResult> {
    this.ensureInitialized();

    const response = await axios.get(`${this.API_BASE}/folders/${this.folderId}/items`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      params: {
        limit: options?.maxKeys || 1000,
        offset: options?.continuationToken || 0
      }
    });

    const files: FileInfo[] = response.data.entries
      .filter((item: any) => item.type === 'file')
      .map((item: any) => ({
        key: item.name,
        name: item.name,
        size: item.size,
        lastModified: new Date(item.modified_at),
        etag: item.etag,
        url: this.getPublicUrl(item.name)
      }));

    return {
      files,
      directories: [],
      isTruncated: response.data.entries.length === (options?.maxKeys || 1000)
    };
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedSource = this.normalizeKey(sourceKey);
    const normalizedDest = this.normalizeKey(destinationKey);
    const fileId = await this.getFileIdByName(normalizedSource);

    if (!fileId) {
      throw new FileNotFoundError(normalizedSource);
    }

    const response = await axios.post(
      `${this.API_BASE}/files/${fileId}/copy`,
      {
        parent: { id: this.folderId },
        name: normalizedDest.split('/').pop()
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      key: normalizedDest,
      url: await this.getUrl(normalizedDest, { expiresIn: 3600 }),
      publicUrl: this.getPublicUrl(normalizedDest),
      etag: response.data.etag,
      size: response.data.size,
      metadata: await this.getMetadata(normalizedDest)
    };
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const fileId = await this.getFileIdByName(normalizedKey);

    if (!fileId) {
      throw new FileNotFoundError(normalizedKey);
    }

    const response = await axios.get(`${this.API_BASE}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    return {
      filename: response.data.name,
      size: response.data.size,
      createdAt: new Date(response.data.created_at),
      updatedAt: new Date(response.data.modified_at)
    };
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    // Box metadata updates require separate API calls
    throw new Error('Metadata updates not fully implemented for Box');
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const fileId = await this.getFileIdByName(normalizedKey);

    if (!fileId) {
      throw new FileNotFoundError(normalizedKey);
    }

    // Box doesn't have presigned URLs like S3, so we return a download link
    return `${this.API_BASE}/files/${fileId}/content`;
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    return `/storage/box/${normalizedKey}`;
  }

  async getStats(): Promise<StorageStats> {
    const result = await this.list();

    return {
      totalFiles: result.files.length,
      totalSize: result.files.reduce((sum, file) => sum + file.size, 0),
      lastModified: result.files.reduce(
        (latest, file) =>
          !latest || file.lastModified > latest ? file.lastModified : latest,
        undefined as Date | undefined
      )
    };
  }

  private async getFileIdByName(filename: string): Promise<string | null> {
    const result = await this.list();
    const file = result.files.find(f => f.name === filename);
    return file ? (file as any).id : null;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
