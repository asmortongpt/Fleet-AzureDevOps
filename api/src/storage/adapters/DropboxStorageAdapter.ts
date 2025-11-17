/**
 * Dropbox Storage Adapter
 *
 * Integrates with Dropbox Business API for cloud file storage
 * Note: Requires dropbox package (install separately)
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

export class DropboxStorageAdapter extends BaseStorageAdapter {
  readonly provider = 'dropbox';
  private accessToken: string;
  private basePath: string;

  // Dropbox API endpoints
  private readonly API_UPLOAD = 'https://content.dropboxapi.com/2/files/upload';
  private readonly API_UPLOAD_SESSION_START = 'https://content.dropboxapi.com/2/files/upload_session/start';
  private readonly API_UPLOAD_SESSION_APPEND = 'https://content.dropboxapi.com/2/files/upload_session/append_v2';
  private readonly API_UPLOAD_SESSION_FINISH = 'https://content.dropboxapi.com/2/files/upload_session/finish';
  private readonly API_DOWNLOAD = 'https://content.dropboxapi.com/2/files/download';
  private readonly API_DELETE = 'https://api.dropboxapi.com/2/files/delete_v2';
  private readonly API_LIST = 'https://api.dropboxapi.com/2/files/list_folder';
  private readonly API_COPY = 'https://api.dropboxapi.com/2/files/copy_v2';
  private readonly API_METADATA = 'https://api.dropboxapi.com/2/files/get_metadata';
  private readonly API_TEMPORARY_LINK = 'https://api.dropboxapi.com/2/files/get_temporary_link';

  private readonly CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks

  constructor(config: StorageConfig) {
    super(config);

    if (!config.dropbox?.accessToken) {
      throw new Error('Dropbox access token is required');
    }

    this.accessToken = config.dropbox.accessToken;
    this.basePath = config.dropbox.basePath || '';
  }

  async initialize(): Promise<void> {
    try {
      // Verify access token by getting account info
      const response = await axios.post(
        'https://api.dropboxapi.com/2/users/get_current_account',
        null,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data) {
        throw new Error('Failed to verify Dropbox credentials');
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize Dropbox storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async upload(key: string, data: Buffer | Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const dropboxPath = this.getDropboxPath(normalizedKey);

    const buffer = Buffer.isBuffer(data) ? data : await this.streamToBuffer(data);

    // Use upload session for files > 150MB
    if (buffer.length > 150 * 1024 * 1024) {
      return this.uploadMultipart(normalizedKey, Readable.from([buffer]), options);
    }

    try {
      const response = await axios.post(this.API_UPLOAD, buffer, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: dropboxPath,
            mode: options?.overwrite ? 'overwrite' : 'add',
            autorename: false,
            mute: false
          })
        }
      });

      return {
        key: normalizedKey,
        url: await this.getUrl(normalizedKey),
        publicUrl: this.getPublicUrl(normalizedKey),
        etag: response.data.content_hash,
        size: response.data.size,
        metadata: options?.metadata
      };
    } catch (error: any) {
      if (error.response?.data?.error_summary?.includes('conflict')) {
        throw new FileAlreadyExistsError(normalizedKey);
      }
      throw new Error(`Failed to upload to Dropbox: ${error.message}`);
    }
  }

  async uploadMultipart(key: string, data: Readable, options?: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const dropboxPath = this.getDropboxPath(normalizedKey);

    try {
      // Start upload session
      const startResponse = await axios.post(this.API_UPLOAD_SESSION_START, Buffer.alloc(0), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ close: false })
        }
      });

      const sessionId = startResponse.data.session_id;
      let offset = 0;
      const chunks: Buffer[] = [];

      // Read all chunks
      for await (const chunk of data) {
        chunks.push(chunk as Buffer);
      }

      const totalBuffer = Buffer.concat(chunks);
      const totalSize = totalBuffer.length;

      // Upload chunks
      for (let i = 0; i < totalBuffer.length; i += this.CHUNK_SIZE) {
        const chunk = totalBuffer.slice(i, Math.min(i + this.CHUNK_SIZE, totalBuffer.length));

        await axios.post(this.API_UPLOAD_SESSION_APPEND, chunk, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              cursor: { session_id: sessionId, offset },
              close: false
            })
          }
        });

        offset += chunk.length;

        if (options?.onProgress) {
          options.onProgress(this.calculateProgress(offset, totalSize));
        }
      }

      // Finish upload session
      const finishResponse = await axios.post(this.API_UPLOAD_SESSION_FINISH, Buffer.alloc(0), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            cursor: { session_id: sessionId, offset },
            commit: {
              path: dropboxPath,
              mode: options?.overwrite ? 'overwrite' : 'add',
              autorename: false,
              mute: false
            }
          })
        }
      });

      return {
        key: normalizedKey,
        url: await this.getUrl(normalizedKey),
        publicUrl: this.getPublicUrl(normalizedKey),
        etag: finishResponse.data.content_hash,
        size: finishResponse.data.size,
        metadata: options?.metadata
      };
    } catch (error: any) {
      throw new Error(`Failed to upload to Dropbox via multipart: ${error.message}`);
    }
  }

  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const dropboxPath = this.getDropboxPath(normalizedKey);

    try {
      const response = await axios.post(this.API_DOWNLOAD, null, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath })
        },
        responseType: 'stream'
      });

      const stream = response.data;
      const metadata = JSON.parse(response.headers['dropbox-api-result']);

      return {
        stream,
        metadata: {
          filename: metadata.name,
          size: metadata.size,
          mimeType: 'application/octet-stream'
        },
        etag: metadata.content_hash,
        lastModified: new Date(metadata.server_modified),
        contentLength: metadata.size
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const dropboxPath = this.getDropboxPath(normalizedKey);

    try {
      await axios.post(
        this.API_DELETE,
        { path: dropboxPath },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      if (error.response?.data?.error_summary?.includes('not_found')) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    this.ensureInitialized();

    const path = options?.prefix
      ? this.getDropboxPath(this.normalizeKey(options.prefix))
      : this.getDropboxPath('');

    const response = await axios.post(
      this.API_LIST,
      {
        path: path || '',
        recursive: options?.recursive !== false,
        limit: options?.maxKeys || 1000
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const files: FileInfo[] = response.data.entries
      .filter((entry: any) => entry['.tag'] === 'file')
      .map((entry: any) => ({
        key: entry.path_display.replace(this.basePath, '').replace(/^\//, ''),
        name: entry.name,
        size: entry.size,
        lastModified: new Date(entry.server_modified),
        etag: entry.content_hash,
        url: this.getPublicUrl(entry.path_display)
      }));

    return {
      files,
      directories: [],
      isTruncated: response.data.has_more
    };
  }

  async copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<UploadResult> {
    this.ensureInitialized();

    const normalizedSource = this.normalizeKey(sourceKey);
    const normalizedDest = this.normalizeKey(destinationKey);

    const response = await axios.post(
      this.API_COPY,
      {
        from_path: this.getDropboxPath(normalizedSource),
        to_path: this.getDropboxPath(normalizedDest),
        allow_ownership_transfer: false
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
      url: await this.getUrl(normalizedDest),
      publicUrl: this.getPublicUrl(normalizedDest),
      etag: response.data.content_hash,
      size: response.data.size,
      metadata: await this.getMetadata(normalizedDest)
    };
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const dropboxPath = this.getDropboxPath(normalizedKey);

    try {
      const response = await axios.post(
        this.API_METADATA,
        { path: dropboxPath },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        filename: response.data.name,
        size: response.data.size,
        createdAt: new Date(response.data.client_modified),
        updatedAt: new Date(response.data.server_modified)
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new FileNotFoundError(normalizedKey);
      }
      throw error;
    }
  }

  async updateMetadata(key: string, metadata: Partial<FileMetadata>): Promise<void> {
    // Dropbox doesn't support custom metadata updates via standard API
    throw new Error('Metadata updates not supported for Dropbox');
  }

  async getUrl(key: string, options?: GetUrlOptions): Promise<string> {
    this.ensureInitialized();

    const normalizedKey = this.normalizeKey(key);
    const dropboxPath = this.getDropboxPath(normalizedKey);

    const response = await axios.post(
      this.API_TEMPORARY_LINK,
      { path: dropboxPath },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.link;
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    return `/storage/dropbox/${normalizedKey}`;
  }

  async getStats(): Promise<StorageStats> {
    const result = await this.list({ recursive: true });

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

  private getDropboxPath(key: string): string {
    const fullPath = this.basePath ? `${this.basePath}/${key}` : `/${key}`;
    return fullPath.replace(/\/+/g, '/');
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
