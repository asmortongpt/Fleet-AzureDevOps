/**
 * Queue Service
 * Manages message queues for reliable asynchronous processing using pg-boss
 */

import PgBoss from 'pg-boss';
import Bottleneck from 'bottleneck';
import { pool } from '../config/database';
import {
  QueueName,
  JobPriority,
  JobStatus,
  JobData,
  JobOptions,
  JobResult,
  QueueStats,
  JobTracking,
  DeadLetterJob,
  RateLimitConfig,
  ScheduledJob,
  ErrorType,
  RetryDecision,
  QueueHealth,
  TeamsMessagePayload,
  OutlookEmailPayload,
  AttachmentPayload,
  WebhookPayload,
  SyncPayload
} from '../types/queue.types';

class QueueService {
  private boss: PgBoss | null = null;
  private rateLimiters: Map<string, Bottleneck> = new Map();
  private isInitialized = false;

  /**
   * Initialize the queue service and pg-boss
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Queue service already initialized');
      return;
    }

    try {
      // Initialize pg-boss with PostgreSQL connection
      this.boss = new PgBoss({
        host: process.env.DB_HOST || 'fleet-postgres-service',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'fleetdb',
        user: process.env.DB_USER || 'fleetadmin',
        password: process.env.DB_PASSWORD,
        max: 10,
        // Archive completed jobs after 24 hours
        archiveCompletedAfterSeconds: 86400,
        // Delete archived jobs after 7 days
        deleteAfterDays: 7,
        // Monitor interval
        monitorStateIntervalSeconds: 60
      });

      // Start pg-boss
      await this.boss.start();

      // Initialize rate limiters
      this.initializeRateLimiters();

      // Set up event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('✅ Queue service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize queue service:', error);
      throw error;
    }
  }

  /**
   * Initialize rate limiters for Microsoft Graph API
   */
  private initializeRateLimiters(): void {
    // Teams rate limiter: 50 requests per second
    this.rateLimiters.set('teams', new Bottleneck({
      reservoir: 50,
      reservoirRefreshAmount: 50,
      reservoirRefreshInterval: 1000,
      maxConcurrent: 10,
      minTime: 20 // 50 requests per second = 20ms between requests
    }));

    // Outlook rate limiter: 10,000 requests per 10 minutes
    this.rateLimiters.set('outlook', new Bottleneck({
      reservoir: 10000,
      reservoirRefreshAmount: 10000,
      reservoirRefreshInterval: 600000, // 10 minutes
      maxConcurrent: 20,
      minTime: 60 // ~16 requests per second
    }));

    // Attachment uploads: Lower concurrency
    this.rateLimiters.set('attachments', new Bottleneck({
      maxConcurrent: 5,
      minTime: 200
    }));
  }

  /**
   * Set up event handlers for job lifecycle
   */
  private setupEventHandlers(): void {
    if (!this.boss) return;

    this.boss.on('error', (error) => {
      console.error('❌ Queue error:', error);
    });

    this.boss.on('monitor-states', (states) => {
      console.log('📊 Queue states:', states);
    });
  }

  /**
   * Enqueue a Teams message for sending
   */
  async enqueueTeamsMessage(
    message: TeamsMessagePayload,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<string> {
    const jobData: JobData = {
      type: 'teams-outbound',
      payload: message,
      priority,
      metadata: {
        timestamp: new Date(),
        correlationId: this.generateCorrelationId()
      }
    };

    return this.enqueueJob(QueueName.TEAMS_OUTBOUND, jobData, {
      priority,
      retryLimit: 5,
      retryBackoff: true,
      expireInSeconds: 3600 // 1 hour
    });
  }

  /**
   * Enqueue an Outlook email for sending
   */
  async enqueueOutlookEmail(
    email: OutlookEmailPayload,
    priority: JobPriority = JobPriority.NORMAL
  ): Promise<string> {
    const jobData: JobData = {
      type: 'outlook-outbound',
      payload: email,
      priority,
      metadata: {
        timestamp: new Date(),
        correlationId: this.generateCorrelationId()
      }
    };

    return this.enqueueJob(QueueName.OUTLOOK_OUTBOUND, jobData, {
      priority,
      retryLimit: 5,
      retryBackoff: true,
      expireInSeconds: 7200 // 2 hours
    });
  }

  /**
   * Enqueue an attachment upload/download operation
   */
  async enqueueAttachmentUpload(
    file: AttachmentPayload,
    metadata?: Record<string, any>
  ): Promise<string> {
    const jobData: JobData = {
      type: 'attachment-operation',
      payload: file,
      priority: JobPriority.LOW,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        correlationId: this.generateCorrelationId()
      }
    };

    return this.enqueueJob(QueueName.ATTACHMENTS, jobData, {
      priority: JobPriority.LOW,
      retryLimit: 3,
      retryBackoff: true,
      expireInSeconds: 14400 // 4 hours
    });
  }

  /**
   * Enqueue webhook processing
   */
  async enqueueWebhookProcessing(webhook: WebhookPayload): Promise<string> {
    const jobData: JobData = {
      type: 'webhook-processing',
      payload: webhook,
      priority: JobPriority.HIGH,
      metadata: {
        timestamp: new Date(),
        correlationId: this.generateCorrelationId()
      }
    };

    return this.enqueueJob(QueueName.WEBHOOKS, jobData, {
      priority: JobPriority.HIGH,
      retryLimit: 3,
      retryBackoff: true,
      expireInSeconds: 1800, // 30 minutes
      singletonKey: webhook.webhookId // Prevent duplicate processing
    });
  }

  /**
   * Enqueue sync operation
   */
  async enqueueSync(resource: SyncPayload): Promise<string> {
    const jobData: JobData = {
      type: 'sync-operation',
      payload: resource,
      priority: JobPriority.LOW,
      metadata: {
        timestamp: new Date(),
        correlationId: this.generateCorrelationId()
      }
    };

    const singletonKey = `sync-${resource.resourceType}-${resource.userId || 'all'}`;

    return this.enqueueJob(QueueName.SYNC, jobData, {
      priority: JobPriority.LOW,
      retryLimit: 3,
      retryBackoff: true,
      expireInSeconds: 3600,
      singletonKey // Prevent concurrent syncs of the same resource
    });
  }

  /**
   * Generic job enqueue method
   */
  private async enqueueJob(
    queueName: QueueName,
    data: JobData,
    options: JobOptions = {}
  ): Promise<string> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    try {
      const jobId = await this.boss.send(queueName, data, {
        priority: options.priority || JobPriority.NORMAL,
        retryLimit: options.retryLimit || 5,
        retryDelay: options.retryDelay || 1000,
        retryBackoff: options.retryBackoff || true,
        expireInSeconds: options.expireInSeconds || 3600,
        retentionSeconds: options.retentionSeconds || 86400,
        startAfter: options.startAfter,
        singletonKey: options.singletonKey,
        onComplete: options.onComplete || false
      });

      if (!jobId) {
        throw new Error('Failed to enqueue job - no job ID returned');
      }

      // Track job in database
      await this.trackJob(jobId, queueName, data, JobStatus.PENDING);

      console.log(`✅ Job enqueued: ${jobId} in queue: ${queueName}`);
      return jobId;
    } catch (error) {
      console.error('❌ Failed to enqueue job:', error);
      throw error;
    }
  }

  /**
   * Schedule a job for future execution
   */
  async scheduleJob(
    queueName: QueueName,
    payload: any,
    delay: number | Date
  ): Promise<string> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    const startAfter = delay instanceof Date ? delay : new Date(Date.now() + delay);

    const jobData: JobData = {
      type: `${queueName}-scheduled`,
      payload,
      metadata: {
        scheduledFor: startAfter,
        timestamp: new Date()
      }
    };

    return this.enqueueJob(queueName, jobData, { startAfter });
  }

  /**
   * Process queue with registered handler
   */
  async processQueue(queueName: string, handler: (job: any) => Promise<any>): Promise<void> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    const rateLimiterKey = this.getRateLimiterKey(queueName);
    const rateLimiter = this.rateLimiters.get(rateLimiterKey);

    await this.boss.work(queueName, { teamSize: 5, teamConcurrency: 2 }, async (job) => {
      const startTime = Date.now();

      try {
        console.log(`🔄 Processing job ${job.id} from queue ${queueName}`);

        // Update job status to active
        await this.updateJobStatus(job.id, JobStatus.ACTIVE);

        // Apply rate limiting if configured
        const result = rateLimiter
          ? await rateLimiter.schedule(() => handler(job))
          : await handler(job);

        // Calculate processing time
        const processingTime = Date.now() - startTime;

        // Mark job as completed
        await this.completeJob(job.id, result, processingTime);

        console.log(`✅ Job ${job.id} completed in ${processingTime}ms`);
        return result;
      } catch (error: any) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Job ${job.id} failed:`, error);

        // Determine retry strategy
        const retryDecision = this.determineRetryStrategy(error, job);

        if (!retryDecision.shouldRetry) {
          // Move to dead letter queue
          await this.moveToDeadLetterQueue(job, error);
        }

        // Mark job as failed
        await this.failJob(job.id, error, processingTime);

        throw error; // pg-boss will handle retry
      }
    });
  }

  /**
   * Determine if job should be retried based on error type
   */
  private determineRetryStrategy(error: any, job: any): RetryDecision {
    const errorType = this.classifyError(error);
    const retryCount = job.retrycount || 0;
    const maxRetries = job.retrylimit || 5;

    // No more retries available
    if (retryCount >= maxRetries) {
      return {
        shouldRetry: false,
        delayMs: 0,
        reason: 'Max retries reached',
        errorType
      };
    }

    switch (errorType) {
      case ErrorType.VALIDATION:
        // Don't retry validation errors
        return {
          shouldRetry: false,
          delayMs: 0,
          reason: 'Validation error - no retry',
          errorType
        };

      case ErrorType.RATE_LIMIT:
        // Retry with exponential backoff for rate limits
        const rateLimitDelay = this.calculateExponentialBackoff(retryCount, 60000);
        return {
          shouldRetry: true,
          delayMs: rateLimitDelay,
          reason: 'Rate limit - retry with backoff',
          errorType
        };

      case ErrorType.AUTHENTICATION:
        // Retry once for auth errors (token might be refreshed)
        return {
          shouldRetry: retryCount === 0,
          delayMs: 5000,
          reason: 'Auth error - retry once',
          errorType
        };

      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        // Retry with exponential backoff
        const delay = this.calculateExponentialBackoff(retryCount);
        return {
          shouldRetry: true,
          delayMs: delay,
          reason: 'Network/timeout error - retry with backoff',
          errorType
        };

      default:
        // Unknown errors - retry with backoff
        const defaultDelay = this.calculateExponentialBackoff(retryCount);
        return {
          shouldRetry: true,
          delayMs: defaultDelay,
          reason: 'Unknown error - retry with backoff',
          errorType
        };
    }
  }

  /**
   * Classify error type
   */
  private classifyError(error: any): ErrorType {
    const message = error.message?.toLowerCase() || '';
    const statusCode = error.statusCode || error.status || error.code;

    if (statusCode === 429 || message.includes('rate limit')) {
      return ErrorType.RATE_LIMIT;
    }
    if (statusCode === 401 || statusCode === 403 || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION;
    }
    if (statusCode === 400 || message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.TIMEOUT;
    }
    if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
      return ErrorType.NETWORK;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateExponentialBackoff(retryCount: number, baseDelay: number = 1000): number {
    // 1s, 2s, 4s, 8s, 16s
    const delay = baseDelay * Math.pow(2, retryCount);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, 60000); // Cap at 1 minute
  }

  /**
   * Get rate limiter key for queue
   */
  private getRateLimiterKey(queueName: string): string {
    if (queueName.includes('teams')) return 'teams';
    if (queueName.includes('outlook')) return 'outlook';
    if (queueName.includes('attachment')) return 'attachments';
    return 'default';
  }

  /**
   * Track job in database
   */
  private async trackJob(
    jobId: string,
    queueName: QueueName,
    data: JobData,
    status: JobStatus
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO job_tracking
         (job_id, queue_name, job_type, status, priority, payload, retry_count, max_retries)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (job_id) DO UPDATE SET
         status = $4, updated_at = NOW()`,
        [
          jobId,
          queueName,
          data.type,
          status,
          data.priority || JobPriority.NORMAL,
          JSON.stringify(data.payload),
          0,
          5
        ]
      );
    } catch (error) {
      console.error('Failed to track job:', error);
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    try {
      const setFields: string[] = ['status = $2', 'updated_at = NOW()'];
      const values: any[] = [jobId, status];

      if (status === JobStatus.ACTIVE) {
        setFields.push('started_at = NOW()');
      }

      await pool.query(
        `UPDATE job_tracking SET ${setFields.join(', ')} WHERE job_id = $1`,
        values
      );
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  }

  /**
   * Mark job as completed
   */
  private async completeJob(jobId: string, result: any, processingTime: number): Promise<void> {
    try {
      await pool.query(
        `UPDATE job_tracking
         SET status = $2, result = $3, completed_at = NOW(), updated_at = NOW()
         WHERE job_id = $1`,
        [jobId, JobStatus.COMPLETED, JSON.stringify({ data: result, processingTime })]
      );
    } catch (error) {
      console.error('Failed to complete job:', error);
    }
  }

  /**
   * Mark job as failed
   */
  private async failJob(jobId: string, error: any, processingTime: number): Promise<void> {
    try {
      await pool.query(
        `UPDATE job_tracking
         SET status = $2, error = $3, stack_trace = $4, failed_at = NOW(),
             retry_count = retry_count + 1, updated_at = NOW()
         WHERE job_id = $1`,
        [jobId, JobStatus.FAILED, error.message, error.stack]
      );
    } catch (err) {
      console.error('Failed to fail job:', err);
    }
  }

  /**
   * Move job to dead letter queue
   */
  private async moveToDeadLetterQueue(job: any, error: any): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO dead_letter_queue
         (job_id, queue_name, job_type, payload, error, stack_trace, retry_count, original_created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          job.id,
          job.name,
          job.data?.type || 'unknown',
          JSON.stringify(job.data),
          error.message,
          error.stack,
          job.retrycount || 0,
          job.createdon || new Date()
        ]
      );

      await this.updateJobStatus(job.id, JobStatus.DEAD_LETTER);
      console.log(`📪 Job ${job.id} moved to dead letter queue`);
    } catch (err) {
      console.error('Failed to move job to dead letter queue:', err);
    }
  }

  /**
   * Retry a failed job manually
   */
  async retryFailedJob(jobId: string): Promise<string> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    try {
      // Get job from dead letter queue
      const result = await pool.query(
        'SELECT * FROM dead_letter_queue WHERE job_id = $1 AND reviewed = FALSE',
        [jobId]
      );

      if (result.rows.length === 0) {
        throw new Error('Job not found in dead letter queue');
      }

      const dlqJob = result.rows[0];
      const payload = JSON.parse(dlqJob.payload);

      // Re-enqueue the job
      const newJobId = await this.enqueueJob(
        dlqJob.queue_name,
        payload,
        { retryLimit: 3 }
      );

      // Mark as retry attempted
      await pool.query(
        `UPDATE dead_letter_queue
         SET retry_attempted = TRUE, retry_attempted_at = NOW()
         WHERE job_id = $1`,
        [jobId]
      );

      console.log(`🔄 Retried job ${jobId}, new job ID: ${newJobId}`);
      return newJobId;
    } catch (error) {
      console.error('Failed to retry job:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<QueueStats> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    try {
      // Get stats from job_tracking table
      const result = await pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
            FILTER (WHERE completed_at IS NOT NULL) as avg_processing_time_ms,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 minute') as jobs_last_minute
         FROM job_tracking
         WHERE queue_name = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
        [queueName]
      );

      const row = result.rows[0];

      return {
        queueName,
        pending: parseInt(row.pending) || 0,
        active: parseInt(row.active) || 0,
        completed: parseInt(row.completed) || 0,
        failed: parseInt(row.failed) || 0,
        avgProcessingTimeMs: parseFloat(row.avg_processing_time_ms) || 0,
        jobsPerMinute: parseFloat(row.jobs_last_minute) || 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Clear queue (admin only)
   */
  async clearQueue(queueName: string): Promise<void> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    try {
      await this.boss.deleteQueue(queueName);
      console.log(`🗑️ Queue ${queueName} cleared`);
    } catch (error) {
      console.error('Failed to clear queue:', error);
      throw error;
    }
  }

  /**
   * Pause queue processing
   */
  async pauseQueue(queueName: string): Promise<void> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    try {
      await this.boss.pause();
      console.log(`⏸️ Queue ${queueName} paused`);
    } catch (error) {
      console.error('Failed to pause queue:', error);
      throw error;
    }
  }

  /**
   * Resume queue processing
   */
  async resumeQueue(queueName: string): Promise<void> {
    if (!this.boss) {
      throw new Error('Queue service not initialized');
    }

    try {
      await this.boss.resume();
      console.log(`▶️ Queue ${queueName} resumed`);
    } catch (error) {
      console.error('Failed to resume queue:', error);
      throw error;
    }
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(): Promise<QueueHealth> {
    try {
      const queues = Object.values(QueueName).filter(q => q !== QueueName.DEAD_LETTER);
      const queueStats: any = {};

      for (const queueName of queues) {
        const stats = await this.getQueueStats(queueName);
        const failureRate = stats.completed > 0
          ? (stats.failed / (stats.completed + stats.failed)) * 100
          : 0;

        queueStats[queueName] = {
          isRunning: true,
          backlog: stats.pending + stats.active,
          failureRate,
          avgProcessingTime: stats.avgProcessingTimeMs
        };
      }

      // Get dead letter count
      const dlqResult = await pool.query(
        'SELECT COUNT(*) as count FROM dead_letter_queue WHERE reviewed = FALSE'
      );
      const deadLetterCount = parseInt(dlqResult.rows[0].count) || 0;

      const healthy = Object.values(queueStats).every(
        (q: any) => q.failureRate < 10 && q.backlog < 1000
      );

      return {
        healthy,
        queues: queueStats,
        deadLetterCount,
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('Failed to get queue health:', error);
      throw error;
    }
  }

  /**
   * Generate correlation ID for tracking
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.boss) {
      console.log('🛑 Shutting down queue service...');
      await this.boss.stop();
      this.isInitialized = false;
      console.log('✅ Queue service stopped');
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();
export default queueService;
