import { Stream } from 'stream';

import { BlobServiceClient } from '@azure/storage-blob';
import sharp from 'sharp';

/**
 * Service for storing photos in Azure Blob Storage with WebP compression and thumbnail generation.
 */
class PhotoStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(connectionString: string, containerName: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
  }

  /**
   * Uploads a photo to Azure Blob Storage after compressing it to WebP format and generates a thumbnail.
   * @param {Buffer} photoBuffer - The photo as a buffer.
   * @param {string} blobName - The name of the blob in Azure Blob Storage.
   * @returns {Promise<{ originalUrl: string; thumbnailUrl: string }>} URLs of the uploaded photo and its thumbnail.
   */
  async uploadPhoto(photoBuffer: Buffer, blobName: string): Promise<{ originalUrl: string; thumbnailUrl: string }> {
    try {
      // Compress photo to WebP format
      const compressedPhoto = await sharp(photoBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      // Generate thumbnail
      const thumbnail = await sharp(photoBuffer)
        .resize(150, 150)
        .webp({ quality: 80 })
        .toBuffer();

      // Upload original photo
      const originalBlobURL = await this.uploadBlob(compressedPhoto, `${blobName}.webp`);

      // Upload thumbnail
      const thumbnailBlobURL = await this.uploadBlob(thumbnail, `thumbnails/${blobName}.webp`);

      return { originalUrl: originalBlobURL, thumbnailUrl: thumbnailBlobURL };
    } catch (error) {
      console.error('Error uploading photo to Azure Blob Storage:', error);
      throw new Error('Failed to upload photo');
    }
  }

  /**
   * Uploads a buffer to Azure Blob Storage.
   * @param {Buffer} buffer - The buffer to upload.
   * @param {string} blobName - The name of the blob in Azure Blob Storage.
   * @returns {Promise<string>} The URL of the uploaded blob.
   */
  private async uploadBlob(buffer: Buffer, blobName: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const stream = new Stream.PassThrough();
    stream.end(buffer);
    await blockBlobClient.uploadStream(stream, buffer.length, 5);
    return blockBlobClient.url;
  }
}

export default PhotoStorageService;