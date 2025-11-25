/**
 * OCR Queue Service
 *
 * Manages background OCR processing with:
 * - Job queuing and scheduling
 * - Progress tracking
 * - Retry logic with exponential backoff
 * - Batch processing
 * - Priority handling
 * - Error recovery
 */

import { queueService } from './queue.service';
import ocrService, { OcrOptions, OcrProvider, OcrResult } from './OcrService';
import pool from '../config/database';
import { JobPriority, QueueName } from '../types/queue.types';

// OCR Job Status
export enum OcrJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// OCR Job Data
export interface OcrJobData {
  documentId: string;
  tenantId: string;
  userId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  options: OcrOptions;
  priority?: JobPriority;
  metadata?: Record<string, any>;
}

// OCR Job Result
export interface OcrJobResult {
  jobId: string;
  documentId: string;
  status: OcrJobStatus;
  ocrResult?: OcrResult;
  error?: string;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  processingTime?: number;
}

// Batch OCR Job
export interface BatchOcrJob {
  batchId: string;
  tenantId: string;
  userId: string;
  documents: Array<{
    documentId: string;
    filePath: string;
    fileName: string;
  }>;
  options: OcrOptions;
  totalDocuments: number;
  completedDocuments: number;
  failedDocuments: number;
  status: OcrJobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class OcrQueueService {
  private isInitialized = false;

  /**
   * Initialize OCR queue processing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ OCR Queue Service already initialized');
      return;
    }

    try {
      // Ensure queue service is initialized
      await queueService.initialize();

      // Register OCR job processor
      await this.registerProcessors();

      // Resume any pending jobs
      await this.resumePendingJobs();

      this.isInitialized = true;
      console.log('✅ OCR Queue Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OCR Queue Service:', error);
      throw error;
    }
  }

  /**
   * Register queue processors
   */
  private async registerProcessors(): Promise<void> {
    // Process single OCR jobs
    await queueService.processQueue('ocr-processing', async (job) => {
      return this.processOcrJob(job);
    });

    // Process batch OCR jobs
    await queueService.processQueue('ocr-batch-processing', async (job) => {
      return this.processBatchOcrJob(job);
    });

    console.log('✅ OCR queue processors registered');
  }

  /**
   * Enqueue OCR job
   */
  async enqueueOcrJob(jobData: OcrJobData): Promise<string> {
    try {
      // Create job tracking record
      const jobRecord = await pool.query(
        `INSERT INTO ocr_jobs (
          document_id, tenant_id, user_id, file_path, file_name, file_size,
          mime_type, options, status, priority, progress
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          jobData.documentId,
          jobData.tenantId,
          jobData.userId,
          jobData.filePath,
          jobData.fileName,
          jobData.fileSize,
          jobData.mimeType,
          JSON.stringify(jobData.options),
          OcrJobStatus.PENDING,
          jobData.priority || JobPriority.NORMAL,
          0
        ]
      );

      const jobId = jobRecord.rows[0].id;

      // Enqueue to processing queue
      const queueJobId = await queueService.enqueueJob(
        'ocr-processing' as any,
        {
          type: 'ocr-processing',
          payload: { ...jobData, jobId },
          priority: jobData.priority || JobPriority.NORMAL,
          metadata: {
            documentId: jobData.documentId,
            tenantId: jobData.tenantId,
            userId: jobData.userId,
            timestamp: new Date(),
            ...jobData.metadata
          }
        } as any,
        {
          priority: jobData.priority || JobPriority.NORMAL,
          retryLimit: 3,
          retryBackoff: true,
          expireInSeconds: 7200 // 2 hours
        }
      );

      // Update with queue job ID
      await pool.query(
        'UPDATE ocr_jobs SET queue_job_id = $1 WHERE id = $2',
        [queueJobId, jobId]
      );

      console.log(`✅ OCR job enqueued: ${jobId} (queue: ${queueJobId})`);
      return jobId;
    } catch (error) {
      console.error('❌ Failed to enqueue OCR job:', error);
      throw error;
    }
  }

  /**
   * Enqueue batch OCR job
   */
  async enqueueBatchOcrJob(
    tenantId: string,
    userId: string,
    documents: Array<{ documentId: string; filePath: string; fileName: string }>,
    options: OcrOptions = {}
  ): Promise<string> {
    try {
      // Create batch record
      const batchRecord = await pool.query(
        `INSERT INTO ocr_batch_jobs (
          tenant_id, user_id, total_documents, completed_documents,
          failed_documents, status, options
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          tenantId,
          userId,
          documents.length,
          0,
          0,
          OcrJobStatus.PENDING,
          JSON.stringify(options)
        ]
      );

      const batchId = batchRecord.rows[0].id;

      // Enqueue individual jobs
      const jobIds: string[] = [];
      for (const doc of documents) {
        const jobId = await this.enqueueOcrJob({
          documentId: doc.documentId,
          tenantId,
          userId,
          filePath: doc.filePath,
          fileName: doc.fileName,
          fileSize: 0, // Will be determined during processing
          mimeType: '',
          options,
          priority: JobPriority.LOW,
          metadata: { batchId }
        });
        jobIds.push(jobId);
      }

      // Link jobs to batch
      await pool.query(
        `UPDATE ocr_jobs SET batch_id = $1 WHERE id = ANY($2)`,
        [batchId, jobIds]
      );

      console.log(`✅ Batch OCR job enqueued: ${batchId} (${documents.length} documents)`);
      return batchId;
    } catch (error) {
      console.error('❌ Failed to enqueue batch OCR job:', error);
      throw error;
    }
  }

  /**
   * Process OCR job
   */
  private async processOcrJob(job: any): Promise<any> {
    const { jobId, documentId, filePath, options } = job.data.payload;

    try {
      console.log(`🔄 Processing OCR job ${jobId} for document ${documentId}`);

      // Update status to processing
      await this.updateJobStatus(jobId, OcrJobStatus.PROCESSING, 0);

      // Process document with OCR
      const result = await ocrService.processDocument(filePath, documentId, options);

      // Update job as completed
      await this.updateJobStatus(jobId, OcrJobStatus.COMPLETED, 100, result);

      // Update batch if applicable
      await this.updateBatchProgress(jobId);

      // Update document status
      await pool.query(
        `UPDATE documents
         SET ocr_status = 'completed', ocr_completed_at = NOW(), extracted_text = $1
         WHERE id = $2`,
        [result.fullText, documentId]
      );

      console.log(`✅ OCR job ${jobId} completed`);

      return {
        success: true,
        jobId,
        documentId,
        result
      };
    } catch (error: any) {
      console.error(`❌ OCR job ${jobId} failed:`, error);

      // Update job as failed
      await this.updateJobStatus(jobId, OcrJobStatus.FAILED, 0, undefined, error.message);

      // Update batch if applicable
      await this.updateBatchProgress(jobId, true);

      // Update document status
      await pool.query(
        `UPDATE documents SET ocr_status = 'failed' WHERE id = $1`,
        [documentId]
      );

      throw error;
    }
  }

  /**
   * Process batch OCR job
   */
  private async processBatchOcrJob(job: any): Promise<any> {
    const { batchId, documents, options } = job.data.payload;

    console.log(`🔄 Processing batch OCR job ${batchId} (${documents.length} documents)`);

    const results = {
      batchId,
      totalDocuments: documents.length,
      completed: 0,
      failed: 0,
      results: [] as any[]
    };

    // Process documents in parallel (with concurrency limit)
    const concurrency = 3;
    for (let i = 0; i < documents.length; i += concurrency) {
      const batch = documents.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(doc =>
          ocrService.processDocument(doc.filePath, doc.documentId, options)
        )
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.completed++;
          results.results.push({
            documentId: batch[idx].documentId,
            success: true,
            result: result.value
          });
        } else {
          results.failed++;
          results.results.push({
            documentId: batch[idx].documentId,
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Update batch progress
      await pool.query(
        `UPDATE ocr_batch_jobs
         SET completed_documents = $1, failed_documents = $2, updated_at = NOW()
         WHERE id = $3`,
        [results.completed, results.failed, batchId]
      );
    }

    // Mark batch as completed
    await pool.query(
      `UPDATE ocr_batch_jobs SET status = $1, updated_at = NOW() WHERE id = $2`,
      [OcrJobStatus.COMPLETED, batchId]
    );

    console.log(`✅ Batch OCR job ${batchId} completed: ${results.completed} success, ${results.failed} failed`);

    return results;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: OcrJobStatus,
    progress: number,
    result?: OcrResult,
    error?: string
  ): Promise<void> {
    try {
      const updates: string[] = ['status = $2', 'progress = $3', 'updated_at = NOW()'];
      const values: any[] = [jobId, status, progress];
      let paramCount = 3;

      if (status === OcrJobStatus.PROCESSING) {
        paramCount++;
        updates.push(`started_at = NOW()`);
      }

      if (status === OcrJobStatus.COMPLETED && result) {
        paramCount++;
        updates.push(`completed_at = NOW()`);
        updates.push(`result = $${paramCount}`);
        values.push(JSON.stringify(result));
        paramCount++;
        updates.push(`processing_time = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000`);
      }

      if (status === OcrJobStatus.FAILED && error) {
        paramCount++;
        updates.push(`failed_at = NOW()`);
        updates.push(`error = $${paramCount}`);
        values.push(error);
      }

      await pool.query(
        `UPDATE ocr_jobs SET ${updates.join(', ')} WHERE id = $1`,
        values
      );
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }

  /**
   * Update batch progress
   */
  private async updateBatchProgress(jobId: string, isFailed: boolean = false): Promise<void> {
    try {
      // Check if job is part of a batch
      const jobResult = await pool.query(
        'SELECT batch_id FROM ocr_jobs WHERE id = $1',
        [jobId]
      );

      if (jobResult.rows.length === 0 || !jobResult.rows[0].batch_id) {
        return; // Not part of a batch
      }

      const batchId = jobResult.rows[0].batch_id;

      // Update batch counters
      if (isFailed) {
        await pool.query(
          `UPDATE ocr_batch_jobs
           SET failed_documents = failed_documents + 1, updated_at = NOW()
           WHERE id = $1`,
          [batchId]
        );
      } else {
        await pool.query(
          `UPDATE ocr_batch_jobs
           SET completed_documents = completed_documents + 1, updated_at = NOW()
           WHERE id = $1`,
          [batchId]
        );
      }

      // Check if batch is complete
      const batchResult = await pool.query(
        `SELECT total_documents, completed_documents, failed_documents
         FROM ocr_batch_jobs WHERE id = $1`,
        [batchId]
      );

      if (batchResult.rows.length > 0) {
        const batch = batchResult.rows[0];
        const totalProcessed = batch.completed_documents + batch.failed_documents;

        if (totalProcessed >= batch.total_documents) {
          // Batch is complete
          await pool.query(
            `UPDATE ocr_batch_jobs SET status = $1, updated_at = NOW() WHERE id = $2`,
            [OcrJobStatus.COMPLETED, batchId]
          );
          console.log(`✅ Batch ${batchId} completed`);
        }
      }
    } catch (error) {
      console.error('Error updating batch progress:', error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<OcrJobResult | null> {
    try {
      const result = await pool.query(
        `SELECT
          id, document_id, status, progress, result, error,
          started_at, completed_at, processing_time
        FROM ocr_jobs
        WHERE id = $1`,
        [jobId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const job = result.rows[0];
      return {
        jobId: job.id,
        documentId: job.document_id,
        status: job.status,
        ocrResult: job.result ? JSON.parse(job.result) : undefined,
        error: job.error,
        progress: job.progress,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        processingTime: job.processing_time
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<BatchOcrJob | null> {
    try {
      const result = await pool.query(
        `SELECT 
      id,
      tenant_id,
      user_id,
      total_documents,
      completed_documents,
      failed_documents,
      status,
      options,
      created_at,
      updated_at,
      REFERENCES,
      ON,
      REFERENCES,
      ON FROM ocr_batch_jobs WHERE id = $1`,
        [batchId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const batch = result.rows[0];
      return {
        batchId: batch.id,
        tenantId: batch.tenant_id,
        userId: batch.user_id,
        documents: [], // Would need to join with ocr_jobs to get documents
        options: JSON.parse(batch.options),
        totalDocuments: batch.total_documents,
        completedDocuments: batch.completed_documents,
        failedDocuments: batch.failed_documents,
        status: batch.status,
        createdAt: batch.created_at,
        updatedAt: batch.updated_at
      };
    } catch (error) {
      console.error('Error getting batch status:', error);
      throw error;
    }
  }

  /**
   * Cancel OCR job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE ocr_jobs
         SET status = $1, updated_at = NOW()
         WHERE id = $2 AND status IN ($3, $4)`,
        [OcrJobStatus.CANCELLED, jobId, OcrJobStatus.PENDING, OcrJobStatus.PROCESSING]
      );

      console.log(`⏹️ OCR job ${jobId} cancelled`);
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<string> {
    try {
      // Get job details
      const jobResult = await pool.query(
        `SELECT 
      id,
      document_id,
      tenant_id,
      user_id,
      batch_id,
      queue_job_id,
      file_path,
      file_name,
      file_size,
      mime_type,
      options,
      status,
      priority,
      progress,
      result,
      error,
      started_at,
      completed_at,
      failed_at,
      processing_time,
      retry_count,
      max_retries,
      created_at,
      updated_at,
      REFERENCES,
      ON,
      REFERENCES,
      ON FROM ocr_jobs WHERE id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error('Job not found');
      }

      const job = jobResult.rows[0];

      // Create new job
      const newJobId = await this.enqueueOcrJob({
        documentId: job.document_id,
        tenantId: job.tenant_id,
        userId: job.user_id,
        filePath: job.file_path,
        fileName: job.file_name,
        fileSize: job.file_size,
        mimeType: job.mime_type,
        options: JSON.parse(job.options),
        priority: job.priority
      });

      console.log(`🔄 Retrying OCR job ${jobId} as ${newJobId}`);
      return newJobId;
    } catch (error) {
      console.error('Error retrying job:', error);
      throw error;
    }
  }

  /**
   * Get pending jobs count
   */
  async getPendingJobsCount(tenantId?: string): Promise<number> {
    try {
      const query = tenantId
        ? 'SELECT COUNT(*) as count FROM ocr_jobs WHERE status = $1 AND tenant_id = $2'
        : 'SELECT COUNT(*) as count FROM ocr_jobs WHERE status = $1';

      const params = tenantId ? [OcrJobStatus.PENDING, tenantId] : [OcrJobStatus.PENDING];

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error('Error getting pending jobs count:', error);
      throw error;
    }
  }

  /**
   * Resume pending jobs (on startup)
   */
  private async resumePendingJobs(): Promise<void> {
    try {
      // Get pending jobs that were interrupted
      const result = await pool.query(
        `SELECT id FROM ocr_jobs
         WHERE status IN ($1, $2)
         AND created_at > NOW() - INTERVAL '24 hours'
         ORDER BY priority ASC, created_at ASC
         LIMIT 100`,
        [OcrJobStatus.PENDING, OcrJobStatus.PROCESSING]
      );

      if (result.rows.length > 0) {
        console.log(`📋 Resuming ${result.rows.length} pending OCR jobs...`);

        for (const job of result.rows) {
          // Reset status to pending
          await pool.query(
            'UPDATE ocr_jobs SET status = $1, progress = 0 WHERE id = $2',
            [OcrJobStatus.PENDING, job.id]
          );
        }
      }
    } catch (error) {
      console.error('Error resuming pending jobs:', error);
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      // Validate and sanitize daysOld parameter
      const daysOldNum = Math.max(1, Math.min(365, daysOld || 30))

      const result = await pool.query(
        `DELETE FROM ocr_jobs
         WHERE status IN ($1, $2)
         AND completed_at < NOW() - ($3 || ' days')::INTERVAL`,
        [OcrJobStatus.COMPLETED, OcrJobStatus.FAILED, daysOldNum]
      );

      console.log(`Cleaned up ${result.rowCount} old OCR jobs`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      throw error;
    }
  }

  /**
   * Get OCR statistics
   */
  async getStatistics(tenantId?: string): Promise<any> {
    try {
      const query = tenantId
        ? `SELECT
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'processing') as processing,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            AVG(processing_time) as avg_processing_time,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as jobs_24h
           FROM ocr_jobs
           WHERE tenant_id = $1`
        : `SELECT
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'processing') as processing,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            AVG(processing_time) as avg_processing_time,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as jobs_24h
           FROM ocr_jobs`;

      const params = tenantId ? [tenantId] : [];
      const result = await pool.query(query, params);

      return {
        pending: parseInt(result.rows[0].pending) || 0,
        processing: parseInt(result.rows[0].processing) || 0,
        completed: parseInt(result.rows[0].completed) || 0,
        failed: parseInt(result.rows[0].failed) || 0,
        avgProcessingTime: parseFloat(result.rows[0].avg_processing_time) || 0,
        jobs24h: parseInt(result.rows[0].jobs_24h) || 0
      };
    } catch (error) {
      console.error('Error getting OCR statistics:', error);
      throw error;
    }
  }
}

export default new OcrQueueService();
