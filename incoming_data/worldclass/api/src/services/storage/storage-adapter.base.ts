/**
 * Storage Adapter Base Class
 * Abstract base for different storage backends (local, S3, Azure Blob, GCP)
 */

export interface StorageMetadata {
  size: number
  mimeType?: string
  lastModified?: Date
  etag?: string
  [key: string]: any
}

export interface UploadOptions {
  metadata?: Record<string, any>
  contentType?: string
  cacheControl?: string
  contentDisposition?: string
}

export abstract class StorageAdapter {
  protected config: Record<string, any>

  constructor(config: Record<string, any>) {
    this.config = config
  }

  /**
   * Initialize the storage adapter
   */
  abstract initialize(): Promise<void>

  /**
   * Upload a file
   * @param file File buffer to upload
   * @param path Destination path
   * @param options Upload options
   * @returns URL or path to the uploaded file
   */
  abstract upload(
    file: Buffer,
    path: string,
    options?: UploadOptions
  ): Promise<string>

  /**
   * Download a file
   * @param path Path to the file
   * @returns File buffer
   */
  abstract download(path: string): Promise<Buffer>

  /**
   * Delete a file
   * @param path Path to the file
   */
  abstract delete(path: string): Promise<void>

  /**
   * Check if a file exists
   * @param path Path to the file
   */
  abstract exists(path: string): Promise<boolean>

  /**
   * Get file metadata
   * @param path Path to the file
   */
  abstract getMetadata(path: string): Promise<StorageMetadata>

  /**
   * Copy a file
   * @param sourcePath Source file path
   * @param destPath Destination file path
   * @returns URL or path to the copied file
   */
  abstract copy(sourcePath: string, destPath: string): Promise<string>

  /**
   * Move a file
   * @param sourcePath Source file path
   * @param destPath Destination file path
   * @returns URL or path to the moved file
   */
  abstract move(sourcePath: string, destPath: string): Promise<string>

  /**
   * List files in a directory
   * @param directoryPath Path to the directory
   * @param prefix Optional prefix filter
   */
  abstract list(
    directoryPath: string,
    prefix?: string
  ): Promise<Array<{ path: string; size: number; lastModified: Date }>>

  /**
   * Get signed URL for temporary access
   * @param path Path to the file
   * @param expiresIn Expiration time in seconds
   */
  abstract getSignedUrl(path: string, expiresIn: number): Promise<string>

  /**
   * Get public URL for the file (if applicable)
   * @param path Path to the file
   */
  abstract getPublicUrl(path: string): string

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Override if needed
  }
}
