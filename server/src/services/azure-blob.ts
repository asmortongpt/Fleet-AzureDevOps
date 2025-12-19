/**
 * Azure Blob Storage Service for 3D Models
 * Handles upload, download, and management of GLB/GLTF files
 */

import * as crypto from 'crypto';
import * as path from 'path';

import {
  BlobServiceClient,
  ContainerClient,
  BlobUploadCommonResponse,
} from '@azure/storage-blob';

import { logger } from './logger';

interface UploadOptions {
  fileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

interface ModelFile {
  url: string;
  cdnUrl: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

/**
 * Azure Blob Storage Service for 3D Vehicle Models
 */
export class AzureBlobService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;
  private cdnEndpoint?: string;

  constructor(
    connectionString: string,
    containerName: string = 'vehicle-models',
    cdnEndpoint?: string
  ) {
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
    this.cdnEndpoint = cdnEndpoint;
  }

  /**
   * Initialize container if it doesn't exist
   */
  async initializeContainer(): Promise<void> {
    try {
      const containerClient =
        this.blobServiceClient.getContainerClient(this.containerName);

      const exists = await containerClient.exists();
      if (!exists) {
        await containerClient.create({
          access: 'blob', // Public read access for blobs
        });
        logger.info(`Created blob container: ${this.containerName}`);
      }

      // Set CORS rules for web access
      // @ts-ignore - Azure SDK type mismatch with CORS configuration
      await this.blobServiceClient.setProperties({
        cors: [
          {
            allowedOrigins: ['*'], // Configure this properly in production
            allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            allowedHeaders: ['*'],
            exposedHeaders: ['*'],
            maxAgeInSeconds: 86400,
          },
        ],
      });
    } catch (error) {
      logger.error('Error initializing blob container:', error);
      throw error;
    }
  }

  /**
   * Get container client
   */
  private getContainerClient(): ContainerClient {
    return this.blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Generate unique blob name
   */
  private generateBlobName(originalName: string): string {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const sanitized = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    return `${sanitized}_${hash}${ext}`;
  }

  /**
   * Validate file type
   */
  private validateFileType(fileName: string): void {
    const allowedExtensions = ['.glb', '.gltf', '.fbx', '.obj', '.usdz'];
    const ext = path.extname(fileName).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      throw new Error(
        `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`
      );
    }
  }

  /**
   * Get content type for file
   */
  private getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.glb': 'model/gltf-binary',
      '.gltf': 'model/gltf+json',
      '.fbx': 'application/octet-stream',
      '.obj': 'model/obj',
      '.usdz': 'model/vnd.usdz+zip',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Upload 3D model file to blob storage
   */
  async uploadModel(
    fileBuffer: Buffer,
    originalFileName: string,
    options: UploadOptions = {}
  ): Promise<ModelFile> {
    try {
      // Validate file
      this.validateFileType(originalFileName);

      // Generate blob name
      const blobName =
        options.fileName || this.generateBlobName(originalFileName);
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Determine content type
      const contentType =
        options.contentType || this.getContentType(originalFileName);

      // Upload with metadata
      // @ts-ignore - Azure SDK type compatibility
      const uploadResponse: BlobUploadCommonResponse =
        await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
          blobHTTPHeaders: {
            blobContentType: contentType,
            blobCacheControl: 'public, max-age=31536000', // 1 year
          },
          metadata: {
            originalFileName: originalFileName,
            uploadedAt: new Date().toISOString(),
            ...options.metadata,
          },
          tags: options.tags,
        });

      // Get blob URL
      const url = blockBlobClient.url;
      const cdnUrl = this.cdnEndpoint
        ? `${this.cdnEndpoint}/${this.containerName}/${blobName}`
        : url;

      logger.info(`Uploaded model to blob storage: ${blobName}`);

      return {
        url,
        cdnUrl,
        size: fileBuffer.length,
        contentType,
        uploadedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error uploading model to blob storage:', error);
      throw error;
    }
  }

  /**
   * Upload from local file path
   */
  async uploadFromFile(
    filePath: string,
    options: UploadOptions = {}
  ): Promise<ModelFile> {
    try {
      const fs = await import('fs/promises');
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      return this.uploadModel(fileBuffer, fileName, options);
    } catch (error) {
      logger.error('Error uploading file from path:', error);
      throw error;
    }
  }

  /**
   * Upload from URL (e.g., from Sketchfab)
   */
  async uploadFromUrl(
    url: string,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<ModelFile> {
    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes
      });

      const fileBuffer = Buffer.from(response.data);
      return this.uploadModel(fileBuffer, fileName, options);
    } catch (error) {
      logger.error('Error uploading from URL:', error);
      throw error;
    }
  }

  /**
   * Delete a model file
   */
  async deleteModel(blobName: string): Promise<boolean> {
    try {
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const deleteResponse = await blockBlobClient.deleteIfExists();
      logger.info(`Deleted blob: ${blobName}`);

      return deleteResponse.succeeded;
    } catch (error) {
      logger.error('Error deleting model:', error);
      throw error;
    }
  }

  /**
   * Get model metadata
   */
  async getModelMetadata(blobName: string): Promise<Record<string, string>> {
    try {
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const properties = await blockBlobClient.getProperties();
      return properties.metadata || {};
    } catch (error) {
      logger.error('Error getting model metadata:', error);
      throw error;
    }
  }

  /**
   * List all models in container
   */
  async listModels(
    prefix?: string,
    maxResults: number = 100
  ): Promise<
    Array<{
      name: string;
      url: string;
      size: number;
      lastModified: Date;
    }>
  > {
    try {
      const containerClient = this.getContainerClient();
      const models = [];

      for await (const blob of containerClient.listBlobsFlat({
        prefix,
      })) {
        if (models.length >= maxResults) break;

        models.push({
          name: blob.name,
          url: `${containerClient.url}/${blob.name}`,
          size: blob.properties.contentLength || 0,
          lastModified: blob.properties.lastModified || new Date(),
        });
      }

      return models;
    } catch (error) {
      logger.error('Error listing models:', error);
      throw error;
    }
  }

  /**
   * Generate SAS URL for temporary access
   */
  async generateSasUrl(
    blobName: string,
    expiresInMinutes: number = 60
  ): Promise<string> {
    try {
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      // Note: This requires account key access
      // For production, use Azure AD authentication
      // @ts-ignore - Azure SDK type for permissions
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: 'r', // read only
        expiresOn,
      });

      return sasUrl;
    } catch (error) {
      logger.error('Error generating SAS URL:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalBlobs: number;
    totalSize: number;
    averageSize: number;
  }> {
    try {
      const containerClient = this.getContainerClient();
      let totalBlobs = 0;
      let totalSize = 0;

      for await (const blob of containerClient.listBlobsFlat()) {
        totalBlobs++;
        totalSize += blob.properties.contentLength || 0;
      }

      return {
        totalBlobs,
        totalSize,
        averageSize: totalBlobs > 0 ? totalSize / totalBlobs : 0,
      };
    } catch (error) {
      logger.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

// Singleton instance
let azureBlobService: AzureBlobService | null = null;

export function getAzureBlobService(): AzureBlobService {
  if (!azureBlobService) {
    const connectionString =
      process.env.AZURE_STORAGE_CONNECTION_STRING ||
      process.env.AZURE_BLOB_CONNECTION_STRING;
    const containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME || 'vehicle-models';
    const cdnEndpoint = process.env.AZURE_CDN_ENDPOINT;

    if (!connectionString) {
      throw new Error(
        'AZURE_STORAGE_CONNECTION_STRING environment variable is required'
      );
    }

    azureBlobService = new AzureBlobService(
      connectionString,
      containerName,
      cdnEndpoint
    );

    // Initialize container on first access
    azureBlobService.initializeContainer().catch((error) => {
      logger.error('Failed to initialize blob container:', error);
    });
  }

  return azureBlobService;
}

export default AzureBlobService;
