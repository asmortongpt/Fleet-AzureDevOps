/**
 * Cloud Storage Adapter
 * Implements file storage for cloud providers (S3, Azure Blob, GCP)
 * This is a template - integrate with @azure/storage-blob or aws-sdk as needed
 */

import { StorageAdapter, StorageMetadata, UploadOptions } from './storage-adapter.base'
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'

export interface CloudStorageConfig {
  provider: 's3' | 'azure_blob' | 'gcp_storage'
  connectionString?: string
  containerName?: string
  accountName?: string
  accountKey?: string
  bucketName?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  publicUrlBase?: string
}

/**
 * Azure Blob Storage Adapter
 */
export class AzureBlobStorageAdapter extends StorageAdapter {
  private blobServiceClient?: BlobServiceClient
  private containerClient?: ContainerClient
  private containerName: string
  private publicUrlBase?: string

  constructor(config: CloudStorageConfig) {
    super(config)

    if (!config.connectionString && (!config.accountName || !config.accountKey)) {
      throw new Error(
        'Azure Blob Storage requires either connectionString or accountName + accountKey'
      )
    }

    this.containerName = config.containerName || 'documents'
    this.publicUrlBase = config.publicUrlBase
  }

  async initialize(): Promise<void> {
    try {
      const connectionString = this.config.connectionString as string

      if (connectionString) {
        this.blobServiceClient =
          BlobServiceClient.fromConnectionString(connectionString)
      } else {
        // Create from account name and key
        const accountName = this.config.accountName as string
        const accountKey = this.config.accountKey as string
        const credentials = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
        this.blobServiceClient = BlobServiceClient.fromConnectionString(credentials)
      }

      // Get container client
      this.containerClient = this.blobServiceClient.getContainerClient(
        this.containerName
      )

      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'blob' // Allow public read access to blobs
      })

      console.log(`✅ Azure Blob Storage initialized: ${this.containerName}`)
    } catch (error) {
      console.error('❌ Failed to initialize Azure Blob Storage:', error)
      throw new Error(`Failed to initialize Azure Blob Storage: ${error}`)
    }
  }

  async upload(
    file: Buffer,
    filePath: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const blobClient = this.containerClient.getBlockBlobClient(filePath)

      await blobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: options?.contentType,
          blobCacheControl: options?.cacheControl,
          blobContentDisposition: options?.contentDisposition
        },
        metadata: options?.metadata
      })

      console.log(`✅ File uploaded to Azure Blob: ${filePath}`)
      return blobClient.url
    } catch (error) {
      console.error('❌ Failed to upload file to Azure Blob:', error)
      throw new Error(`Failed to upload file: ${error}`)
    }
  }

  async download(filePath: string): Promise<Buffer> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const blobClient = this.containerClient.getBlockBlobClient(filePath)
      const downloadResponse = await blobClient.download()

      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to get file stream')
      }

      const chunks: Buffer[] = []
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk))
      }

      console.log(`✅ File downloaded from Azure Blob: ${filePath}`)
      return Buffer.concat(chunks)
    } catch (error) {
      console.error('❌ Failed to download file from Azure Blob:', error)
      throw new Error(`Failed to download file: ${error}`)
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const blobClient = this.containerClient.getBlockBlobClient(filePath)
      await blobClient.deleteIfExists()

      console.log(`✅ File deleted from Azure Blob: ${filePath}`)
    } catch (error) {
      console.error('❌ Failed to delete file from Azure Blob:', error)
      throw new Error(`Failed to delete file: ${error}`)
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const blobClient = this.containerClient.getBlockBlobClient(filePath)
      return await blobClient.exists()
    } catch (error) {
      console.error('❌ Failed to check file existence:', error)
      return false
    }
  }

  async getMetadata(filePath: string): Promise<StorageMetadata> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const blobClient = this.containerClient.getBlockBlobClient(filePath)
      const properties = await blobClient.getProperties()

      return {
        size: properties.contentLength || 0,
        mimeType: properties.contentType,
        lastModified: properties.lastModified,
        etag: properties.etag,
        ...properties.metadata
      }
    } catch (error) {
      console.error('❌ Failed to get metadata from Azure Blob:', error)
      throw new Error(`Failed to get metadata: ${error}`)
    }
  }

  async copy(sourcePath: string, destPath: string): Promise<string> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const sourceBlob = this.containerClient.getBlockBlobClient(sourcePath)
      const destBlob = this.containerClient.getBlockBlobClient(destPath)

      const copyPoller = await destBlob.beginCopyFromURL(sourceBlob.url)
      await copyPoller.pollUntilDone()

      console.log(`✅ File copied in Azure Blob: ${sourcePath} -> ${destPath}`)
      return destBlob.url
    } catch (error) {
      console.error('❌ Failed to copy file in Azure Blob:', error)
      throw new Error(`Failed to copy file: ${error}`)
    }
  }

  async move(sourcePath: string, destPath: string): Promise<string> {
    try {
      // Copy then delete
      const url = await this.copy(sourcePath, destPath)
      await this.delete(sourcePath)

      console.log(`✅ File moved in Azure Blob: ${sourcePath} -> ${destPath}`)
      return url
    } catch (error) {
      console.error('❌ Failed to move file in Azure Blob:', error)
      throw new Error(`Failed to move file: ${error}`)
    }
  }

  async list(
    directoryPath: string,
    prefix?: string
  ): Promise<Array<{ path: string; size: number; lastModified: Date }>> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const files: Array<{ path: string; size: number; lastModified: Date }> = []
      const searchPrefix = prefix
        ? `${directoryPath}/${prefix}`
        : directoryPath

      for await (const blob of this.containerClient.listBlobsFlat({
        prefix: searchPrefix
      })) {
        files.push({
          path: blob.name,
          size: blob.properties.contentLength || 0,
          lastModified: blob.properties.lastModified || new Date()
        })
      }

      return files
    } catch (error) {
      console.error('❌ Failed to list files in Azure Blob:', error)
      return []
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number): Promise<string> {
    try {
      if (!this.containerClient) {
        throw new Error('Storage not initialized')
      }

      const blobClient = this.containerClient.getBlockBlobClient(filePath)

      // Generate SAS token
      const expiresOn = new Date(Date.now() + expiresIn * 1000)

      // In production, use generateBlobSASQueryParameters
      // This is a simplified version
      const sasUrl = await blobClient.generateSasUrl({
        permissions: 'r', // Read only
        expiresOn
      })

      return sasUrl
    } catch (error) {
      console.error('❌ Failed to generate signed URL:', error)
      throw new Error(`Failed to generate signed URL: ${error}`)
    }
  }

  getPublicUrl(filePath: string): string {
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${filePath}`
    }

    if (this.containerClient) {
      const blobClient = this.containerClient.getBlockBlobClient(filePath)
      return blobClient.url
    }

    return filePath
  }
}

/**
 * S3 Storage Adapter (Template)
 * In production, use AWS SDK v3
 */
export class S3StorageAdapter extends StorageAdapter {
  constructor(config: CloudStorageConfig) {
    super(config)
    console.warn(
      '⚠️  S3 Storage Adapter is a template. Integrate with AWS SDK for production use.'
    )
  }

  async initialize(): Promise<void> {
    // TODO: Implement AWS S3 initialization
    throw new Error('S3 Storage not yet implemented. Use AWS SDK v3.')
  }

  async upload(file: Buffer, path: string, options?: UploadOptions): Promise<string> {
    throw new Error('S3 Storage not yet implemented')
  }

  async download(path: string): Promise<Buffer> {
    throw new Error('S3 Storage not yet implemented')
  }

  async delete(path: string): Promise<void> {
    throw new Error('S3 Storage not yet implemented')
  }

  async exists(path: string): Promise<boolean> {
    throw new Error('S3 Storage not yet implemented')
  }

  async getMetadata(path: string): Promise<StorageMetadata> {
    throw new Error('S3 Storage not yet implemented')
  }

  async copy(sourcePath: string, destPath: string): Promise<string> {
    throw new Error('S3 Storage not yet implemented')
  }

  async move(sourcePath: string, destPath: string): Promise<string> {
    throw new Error('S3 Storage not yet implemented')
  }

  async list(
    directoryPath: string,
    prefix?: string
  ): Promise<Array<{ path: string; size: number; lastModified: Date }>> {
    throw new Error('S3 Storage not yet implemented')
  }

  async getSignedUrl(path: string, expiresIn: number): Promise<string> {
    throw new Error('S3 Storage not yet implemented')
  }

  getPublicUrl(path: string): string {
    throw new Error('S3 Storage not yet implemented')
  }
}
