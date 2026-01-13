/**
 * Dropbox Storage Adapter
 *
 * Integrates with Dropbox for file storage
 * Note: Requires dropbox package (install separately)
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
  StorageStats
} from '../StorageAdapter';

export class DropboxStorageAdapter extends BaseStorageAdapter {
  readonly provider = 'dropbox';

  constructor(config: StorageConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    // Stub implementation
    this.initialized = true;
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  async delete(key: string): Promise<void> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  async list(options?: ListOptions): Promise<ListResult> {
    return {
      files: [],
      directories: [],
      isTruncated: false
    };
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    throw new Error('Dropbox adapter not fully implemented');
  }

  getPublicUrl(key: string): string {
    return `/storage/dropbox/${key}`;
  }

  async getStats(): Promise<StorageStats> {
    return {
      totalFiles: 0,
      totalSize: 0
    };
  }
}
