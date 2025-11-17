/**
 * Photo Processing Queue Service
 *
 * Backend service for processing uploaded photos from mobile app
 * Features:
 * - Process uploaded photos
 * - Generate thumbnails
 * - Extract EXIF data
 * - Compress for storage
 * - Trigger OCR if needed
 * - Update database records
 * - Queue-based async processing
 */

import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import OcrService from './ocr.service';

export interface PhotoProcessingJob {
  id: string;
  tenant_id: number;
  user_id: number;
  photo_id: number;
  blob_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'high' | 'normal' | 'low';
  retry_count: number;
  max_retries: number;
  error_message?: string;
  processing_started_at?: Date;
  processing_completed_at?: Date;
  created_at: Date;
}

export interface ProcessingResult {
  success: boolean;
  photo_id: number;
  thumbnail_url?: string;
  compressed_url?: string;
  exif_data?: any;
  ocr_text?: string;
  width?: number;
  height?: number;
  file_size?: number;
  format?: string;
  error?: string;
  processing_time_ms?: number;
}

export interface ProcessingOptions {
  generateThumbnail?: boolean;
  thumbnailSize?: number;
  compress?: boolean;
  compressionQuality?: number;
  maxDimension?: number;
  extractExif?: boolean;
  runOcr?: boolean;
  ocrLanguage?: string;
  updateRelatedRecords?: boolean;
}

class PhotoProcessingService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerName: string = 'mobile-photos';
  private thumbnailContainerName: string = 'mobile-thumbnails';
  private compressedContainerName: string = 'mobile-photos-compressed';
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 5;
  private readonly PROCESSING_INTERVAL = 10000; // 10 seconds

  /**
   * Initialize the photo processing service
   */
  async initialize(connectionString: string): Promise<void> {
    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

      // Ensure containers exist
      await this.ensureContainersExist();

      console.log('PhotoProcessingService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PhotoProcessingService:', error);
      throw error;
    }
  }

  /**
   * Start the processing queue worker
   */
  startProcessingQueue(): void {
    if (this.processingInterval) {
      console.log('Processing queue already running');
      return;
    }

    console.log('Starting photo processing queue worker...');

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processPendingPhotos();
      }
    }, this.PROCESSING_INTERVAL);

    // Process immediately on start
    this.processPendingPhotos().catch(err =>
      console.error('Initial processing failed:', err)
    );
  }

  /**
   * Stop the processing queue worker
   */
  stopProcessingQueue(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Photo processing queue worker stopped');
    }
  }

  /**
   * Add photo to processing queue
   */
  async addToQueue(
    tenantId: number,
    userId: number,
    photoId: number,
    blobUrl: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    try {
      const jobId = uuidv4();

      await pool.query(
        `INSERT INTO photo_processing_queue
         (id, tenant_id, user_id, photo_id, blob_url, status, priority, retry_count, max_retries)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, 0, 3)`,
        [jobId, tenantId, userId, photoId, blobUrl, priority]
      );

      console.log(`Photo ${photoId} added to processing queue (job: ${jobId})`);

      // If high priority, trigger immediate processing
      if (priority === 'high' && !this.isProcessing) {
        setImmediate(() => this.processPendingPhotos());
      }

      return jobId;
    } catch (error) {
      console.error('Failed to add photo to processing queue:', error);
      throw error;
    }
  }

  /**
   * Process a single photo
   */
  async processPhoto(
    photoId: number,
    blobUrl: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log(`Processing photo ${photoId}...`);

      // Download photo from blob storage
      const photoBuffer = await this.downloadBlob(blobUrl);

      // Get image metadata using sharp
      const metadata = await sharp(photoBuffer).metadata();

      const result: ProcessingResult = {
        success: true,
        photo_id: photoId,
        width: metadata.width,
        height: metadata.height,
        file_size: photoBuffer.length,
        format: metadata.format,
      };

      // Extract EXIF data
      if (options.extractExif !== false) {
        try {
          result.exif_data = await this.extractExifData(photoBuffer);
        } catch (error) {
          console.warn('EXIF extraction failed:', error);
        }
      }

      // Generate thumbnail
      if (options.generateThumbnail !== false) {
        try {
          const thumbnailSize = options.thumbnailSize || 300;
          result.thumbnail_url = await this.generateThumbnail(
            photoId,
            photoBuffer,
            thumbnailSize
          );
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
        }
      }

      // Compress image
      if (options.compress) {
        try {
          result.compressed_url = await this.compressImage(
            photoId,
            photoBuffer,
            options.compressionQuality || 85,
            options.maxDimension || 1920
          );
        } catch (error) {
          console.error('Image compression failed:', error);
        }
      }

      // Run OCR if needed
      if (options.runOcr) {
        try {
          const ocrResult = await OcrService.processImage(photoBuffer, {
            language: options.ocrLanguage || 'eng',
            detectOrientation: true,
          });

          result.ocr_text = ocrResult.text;
        } catch (error) {
          console.error('OCR processing failed:', error);
        }
      }

      result.processing_time_ms = Date.now() - startTime;

      console.log(`Photo ${photoId} processed successfully in ${result.processing_time_ms}ms`);

      return result;
    } catch (error: any) {
      console.error(`Failed to process photo ${photoId}:`, error);

      return {
        success: false,
        photo_id: photoId,
        error: error.message,
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(tenantId?: number): Promise<any> {
    try {
      let query = `
        SELECT
          status,
          priority,
          COUNT(*) as count,
          AVG(retry_count) as avg_retries
        FROM photo_processing_queue
      `;

      const params: any[] = [];

      if (tenantId) {
        params.push(tenantId);
        query += ` WHERE tenant_id = $1`;
      }

      query += ` GROUP BY status, priority`;

      const result = await pool.query(query, params);

      return {
        byStatus: result.rows.reduce((acc, row) => {
          acc[row.status] = (acc[row.status] || 0) + parseInt(row.count);
          return acc;
        }, {}),
        byPriority: result.rows.reduce((acc, row) => {
          acc[row.priority] = (acc[row.priority] || 0) + parseInt(row.count);
          return acc;
        }, {}),
        details: result.rows,
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Retry failed processing jobs
   */
  async retryFailed(tenantId?: number): Promise<number> {
    try {
      let query = `
        UPDATE photo_processing_queue
        SET status = 'pending',
            retry_count = 0,
            error_message = NULL
        WHERE status = 'failed'
      `;

      const params: any[] = [];

      if (tenantId) {
        params.push(tenantId);
        query += ` AND tenant_id = $1`;
      }

      const result = await pool.query(query, params);

      console.log(`Retrying ${result.rowCount} failed jobs`);

      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to retry failed jobs:', error);
      throw error;
    }
  }

  /**
   * Clear completed jobs older than specified days
   */
  async clearCompletedJobs(daysOld: number = 7): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM photo_processing_queue
         WHERE status = 'completed'
           AND processing_completed_at < NOW() - INTERVAL '1 day' * $1`,
        [daysOld]
      );

      console.log(`Cleared ${result.rowCount} completed jobs older than ${daysOld} days`);

      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to clear completed jobs:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Process pending photos from queue
   */
  private async processPendingPhotos(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending jobs with priority ordering
      const result = await pool.query(
        `SELECT *
         FROM photo_processing_queue
         WHERE status = 'pending'
           AND retry_count < max_retries
         ORDER BY
           CASE priority
             WHEN 'high' THEN 1
             WHEN 'normal' THEN 2
             WHEN 'low' THEN 3
           END,
           created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [this.BATCH_SIZE]
      );

      if (result.rows.length === 0) {
        return;
      }

      console.log(`Processing ${result.rows.length} photos from queue...`);

      // Process each photo
      for (const job of result.rows) {
        await this.processQueuedPhoto(job);
      }
    } catch (error) {
      console.error('Error processing pending photos:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a queued photo job
   */
  private async processQueuedPhoto(job: any): Promise<void> {
    try {
      // Update status to processing
      await pool.query(
        `UPDATE photo_processing_queue
         SET status = 'processing',
             processing_started_at = NOW()
         WHERE id = $1`,
        [job.id]
      );

      // Get photo details
      const photoResult = await pool.query(
        `SELECT * FROM mobile_photos WHERE id = $1`,
        [job.photo_id]
      );

      if (photoResult.rows.length === 0) {
        throw new Error(`Photo ${job.photo_id} not found`);
      }

      const photo = photoResult.rows[0];

      // Determine processing options based on photo metadata
      const options: ProcessingOptions = {
        generateThumbnail: true,
        compress: photo.metadata?.compress !== false,
        extractExif: true,
        runOcr: photo.metadata?.reportType === 'damage' || photo.metadata?.reportType === 'fuel',
        updateRelatedRecords: true,
      };

      // Process the photo
      const processingResult = await this.processPhoto(
        job.photo_id,
        job.blob_url,
        options
      );

      if (processingResult.success) {
        // Update photo record with processing results
        await this.updatePhotoRecord(job.photo_id, processingResult);

        // Update related records if needed
        if (options.updateRelatedRecords) {
          await this.updateRelatedRecords(photo, processingResult);
        }

        // Mark job as completed
        await pool.query(
          `UPDATE photo_processing_queue
           SET status = 'completed',
               processing_completed_at = NOW()
           WHERE id = $1`,
          [job.id]
        );

        console.log(`Photo processing job ${job.id} completed successfully`);
      } else {
        // Handle failure
        throw new Error(processingResult.error || 'Processing failed');
      }
    } catch (error: any) {
      console.error(`Photo processing job ${job.id} failed:`, error);

      // Update job with error
      const retryCount = job.retry_count + 1;
      const status = retryCount >= job.max_retries ? 'failed' : 'pending';

      await pool.query(
        `UPDATE photo_processing_queue
         SET status = $1,
             retry_count = $2,
             error_message = $3
         WHERE id = $4`,
        [status, retryCount, error.message, job.id]
      );
    }
  }

  /**
   * Update photo record with processing results
   */
  private async updatePhotoRecord(
    photoId: number,
    result: ProcessingResult
  ): Promise<void> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (result.thumbnail_url) {
        updates.push(`thumbnail_url = $${paramIndex++}`);
        values.push(result.thumbnail_url);
      }

      if (result.compressed_url) {
        updates.push(`compressed_url = $${paramIndex++}`);
        values.push(result.compressed_url);
      }

      if (result.exif_data) {
        updates.push(`exif_data = $${paramIndex++}`);
        values.push(JSON.stringify(result.exif_data));
      }

      if (result.ocr_text) {
        updates.push(`ocr_text = $${paramIndex++}`);
        values.push(result.ocr_text);
      }

      if (result.width && result.height) {
        updates.push(`width = $${paramIndex++}, height = $${paramIndex++}`);
        values.push(result.width, result.height);
      }

      if (result.file_size) {
        updates.push(`file_size = $${paramIndex++}`);
        values.push(result.file_size);
      }

      updates.push(`processed_at = NOW()`);

      if (updates.length > 0) {
        values.push(photoId);
        await pool.query(
          `UPDATE mobile_photos
           SET ${updates.join(', ')}
           WHERE id = $${paramIndex}`,
          values
        );
      }
    } catch (error) {
      console.error('Failed to update photo record:', error);
    }
  }

  /**
   * Update related records (damage reports, inspections, etc.)
   */
  private async updateRelatedRecords(
    photo: any,
    result: ProcessingResult
  ): Promise<void> {
    try {
      const metadata = photo.metadata || {};

      // Update damage report if applicable
      if (metadata.damageReportId) {
        await pool.query(
          `UPDATE damage_reports
           SET processed_photo_url = $1,
               thumbnail_url = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [result.compressed_url || photo.photo_url, result.thumbnail_url, metadata.damageReportId]
        );
      }

      // Update inspection if applicable
      if (metadata.inspectionId) {
        await pool.query(
          `UPDATE vehicle_inspections
           SET photo_urls = COALESCE(photo_urls, '[]'::jsonb) || $1::jsonb,
               updated_at = NOW()
           WHERE id = $2`,
          [JSON.stringify([{ url: result.compressed_url || photo.photo_url, thumbnail: result.thumbnail_url }]), metadata.inspectionId]
        );
      }

      // Update fuel transaction if applicable
      if (metadata.fuelTransactionId) {
        await pool.query(
          `UPDATE fuel_transactions
           SET receipt_url = $1,
               receipt_ocr_text = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [result.compressed_url || photo.photo_url, result.ocr_text, metadata.fuelTransactionId]
        );
      }
    } catch (error) {
      console.error('Failed to update related records:', error);
    }
  }

  /**
   * Download blob from Azure storage
   */
  private async downloadBlob(blobUrl: string): Promise<Buffer> {
    if (!this.blobServiceClient) {
      throw new Error('PhotoProcessingService not initialized');
    }

    try {
      // Parse blob URL to get container and blob name
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split('/');
      const containerName = pathParts[1];
      const blobName = pathParts.slice(2).join('/');

      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);

      const downloadResponse = await blobClient.download();
      const chunks: Buffer[] = [];

      if (downloadResponse.readableStreamBody) {
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(Buffer.from(chunk));
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Failed to download blob:', error);
      throw error;
    }
  }

  /**
   * Extract EXIF data from photo
   */
  private async extractExifData(photoBuffer: Buffer): Promise<any> {
    try {
      const tags = ExifReader.load(photoBuffer);

      return {
        dateTime: tags.DateTime?.description,
        make: tags.Make?.description,
        model: tags.Model?.description,
        orientation: tags.Orientation?.value,
        software: tags.Software?.description,
        gps: tags.GPSLatitude && tags.GPSLongitude ? {
          latitude: this.convertDMSToDD(
            tags.GPSLatitude.description,
            tags.GPSLatitudeRef?.value?.[0]
          ),
          longitude: this.convertDMSToDD(
            tags.GPSLongitude.description,
            tags.GPSLongitudeRef?.value?.[0]
          ),
          altitude: tags.GPSAltitude?.description,
        } : undefined,
        width: tags.ImageWidth?.value,
        height: tags.ImageHeight?.value,
      };
    } catch (error) {
      console.warn('EXIF extraction error:', error);
      return {};
    }
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(
    photoId: number,
    photoBuffer: Buffer,
    size: number
  ): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('PhotoProcessingService not initialized');
    }

    try {
      // Generate thumbnail using sharp
      const thumbnailBuffer = await sharp(photoBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload to blob storage
      const containerClient = this.blobServiceClient.getContainerClient(
        this.thumbnailContainerName
      );
      const blobName = `thumb_${photoId}_${Date.now()}.jpg`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(thumbnailBuffer, thumbnailBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'image/jpeg',
        },
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw error;
    }
  }

  /**
   * Compress image
   */
  private async compressImage(
    photoId: number,
    photoBuffer: Buffer,
    quality: number,
    maxDimension: number
  ): Promise<string> {
    if (!this.blobServiceClient) {
      throw new Error('PhotoProcessingService not initialized');
    }

    try {
      // Compress using sharp
      const compressedBuffer = await sharp(photoBuffer)
        .resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer();

      // Upload to blob storage
      const containerClient = this.blobServiceClient.getContainerClient(
        this.compressedContainerName
      );
      const blobName = `compressed_${photoId}_${Date.now()}.jpg`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(compressedBuffer, compressedBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: 'image/jpeg',
        },
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  }

  /**
   * Ensure blob containers exist
   */
  private async ensureContainersExist(): Promise<void> {
    if (!this.blobServiceClient) return;

    try {
      const containers = [
        this.containerName,
        this.thumbnailContainerName,
        this.compressedContainerName,
      ];

      for (const containerName of containers) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists({ access: 'blob' });
      }

      console.log('All blob containers ensured');
    } catch (error) {
      console.error('Failed to create containers:', error);
    }
  }

  /**
   * Convert DMS (degrees, minutes, seconds) to decimal degrees
   */
  private convertDMSToDD(dms: string, ref: string): number {
    const parts = dms.split(/[°'"]/);
    const degrees = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]) / 60;
    const seconds = parseFloat(parts[2]) / 3600;

    let dd = degrees + minutes + seconds;

    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }

    return dd;
  }
}

export default new PhotoProcessingService();
