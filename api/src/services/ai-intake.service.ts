/**
 * AI Intake Service
 * Handles incoming AI requests, validation, queueing, and routing
 * Integrates with Azure OpenAI for processing
 */

import { Queue } from 'bull'
import { z } from 'zod'
import pool from '../config/database'
import { logger } from '../utils/logger'
import aiValidationService from './ai-validation.service'
import aiControlsService from './ai-controls.service'

// Request schemas
export const AIRequestSchema = z.object({
  request_type: z.enum([
    'chat',
    'completion',
    'document_analysis',
    'image_analysis',
    'route_optimization',
    'maintenance_prediction',
    'driver_coaching',
    'cost_analysis'
  ]),
  prompt: z.string().min(1).max(10000),
  context: z.record(z.any()).optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'document', 'data']),
        url: z.string().optional(),
        data: z.string().optional(),
        mime_type: z.string().optional()
      })
    )
    .optional(),
  parameters: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().min(1).max(4000).optional(),
      model: z.string().optional(),
      stream: z.boolean().optional()
    })
    .optional()
})

export type AIRequest = z.infer<typeof AIRequestSchema>

export interface AIIntakeResult {
  request_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  queue_position?: number
  estimated_wait_seconds?: number
  message?: string
}

export interface AIRequestRecord {
  id: string
  tenant_id: string
  user_id: string
  request_type: string
  prompt: string
  context: any
  attachments: any[]
  parameters: any
  status: string
  priority: number
  queue_position: number
  created_at: Date
  started_at?: Date
  completed_at?: Date
  error_message?: string
}

class AIIntakeService {
  private requestQueue: Queue | null = null

  constructor() {
    this.initializeQueue()
  }

  /**
   * Initialize Bull queue for AI requests
   */
  private initializeQueue(): void {
    try {
      // Only initialize if Redis is configured
      if (process.env.REDIS_URL) {
        this.requestQueue = new Queue('ai-requests', process.env.REDIS_URL, {
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            },
            removeOnComplete: 100,
            removeOnFail: 50
          }
        })

        this.requestQueue.on('error', (error) => {
          logger.error('AI Request Queue Error:', error)
        })

        logger.info('AI Request Queue initialized successfully')
      } else {
        logger.warn('Redis not configured - AI requests will process synchronously')
      }
    } catch (error) {
      logger.error('Failed to initialize AI request queue:', error)
    }
  }

  /**
   * Submit AI request for processing
   */
  async submitRequest(
    tenantId: string,
    userId: string,
    request: AIRequest
  ): Promise<AIIntakeResult> {
    try {
      // 1. Validate request format
      const validatedRequest = AIRequestSchema.parse(request)

      // 2. Check rate limits and user permissions
      const controlsCheck = await aiControlsService.checkRateLimits(tenantId, userId)
      if (!controlsCheck.allowed) {
        logger.warn(`Rate limit exceeded for user ${userId}`, {
          tenantId,
          userId,
          reason: controlsCheck.reason
        })
        return {
          request_id: '',
          status: 'failed',
          message: `Rate limit exceeded: ${controlsCheck.reason}`
        }
      }

      // 3. Validate content (safety, injection, etc.)
      const validationResult = await aiValidationService.validateRequest(validatedRequest)
      if (!validationResult.isValid) {
        logger.warn(`AI request validation failed for user ${userId}`, {
          tenantId,
          userId,
          reason: validationResult.reason
        })
        return {
          request_id: '',
          status: 'failed',
          message: `Request validation failed: ${validationResult.reason}`
        }
      }

      // 4. Calculate priority
      const priority = this.calculatePriority(validatedRequest.request_type, controlsCheck.userTier)

      // 5. Insert into database
      const result = await pool.query<AIRequestRecord>(
        `INSERT INTO ai_requests (
          tenant_id, user_id, request_type, prompt, context,
          attachments, parameters, status, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, status, priority, queue_position`,
        [
          tenantId,
          userId,
          validatedRequest.request_type,
          validatedRequest.prompt,
          validatedRequest.context || {},
          JSON.stringify(validatedRequest.attachments || []),
          validatedRequest.parameters || {},
          'queued',
          priority
        ]
      )

      const requestRecord = result.rows[0]

      // 6. Add to processing queue if available
      if (this.requestQueue) {
        await this.requestQueue.add(
          {
            requestId: requestRecord.id,
            tenantId,
            userId,
            request: validatedRequest
          },
          {
            priority,
            jobId: requestRecord.id
          }
        )
      }

      // 7. Record usage for rate limiting
      await aiControlsService.recordUsage(tenantId, userId, validatedRequest.request_type)

      // 8. Audit log
      await aiControlsService.logRequest(tenantId, userId, requestRecord.id, validatedRequest)

      // 9. Calculate estimated wait time
      const queueStats = await this.getQueueStatistics()
      const estimatedWait = this.estimateWaitTime(priority, queueStats)

      logger.info(`AI request submitted successfully`, {
        requestId: requestRecord.id,
        tenantId,
        userId,
        requestType: validatedRequest.request_type,
        priority
      })

      return {
        request_id: requestRecord.id,
        status: 'queued',
        queue_position: requestRecord.queue_position,
        estimated_wait_seconds: estimatedWait,
        message: 'Request queued for processing'
      }
    } catch (error: any) {
      logger.error('Failed to submit AI request:', error)

      if (error.name === 'ZodError') {
        return {
          request_id: '',
          status: 'failed',
          message: 'Validation error: ${error.errors.map((e: any) => e.message).join(', ')}'
        }
      }

      return {
        request_id: '',
        status: 'failed',
        message: 'Failed to submit request'
      }
    }
  }

  /**
   * Get request status
   */
  async getRequestStatus(
    requestId: string,
    tenantId: string,
    userId: string
  ): Promise<AIRequestRecord | null> {
    try {
      const result = await pool.query<AIRequestRecord>(
        `SELECT * FROM ai_requests
         WHERE id = $1 AND tenant_id = $2 AND user_id = $3',
        [requestId, tenantId, userId]
      )

      return result.rows[0] || null
    } catch (error) {
      logger.error('Failed to get request status:', error)
      return null
    }
  }

  /**
   * Cancel pending request
   */
  async cancelRequest(requestId: string, tenantId: string, userId: string): Promise<boolean> {
    try {
      // Update database
      const result = await pool.query(
        `UPDATE ai_requests
         SET status = 'cancelled', completed_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND user_id = $3
           AND status IN ('queued', 'processing')',
        [requestId, tenantId, userId]
      )

      if (result.rowCount === 0) {
        return false
      }

      // Remove from queue if exists
      if (this.requestQueue) {
        const job = await this.requestQueue.getJob(requestId)
        if (job) {
          await job.remove()
        }
      }

      logger.info(`AI request cancelled`, { requestId, tenantId, userId })
      return true
    } catch (error) {
      logger.error('Failed to cancel request:', error)
      return false
    }
  }

  /**
   * Get user's request history
   */
  async getRequestHistory(
    tenantId: string,
    userId: string,
    limit: number = 50
  ): Promise<AIRequestRecord[]> {
    try {
      const result = await pool.query<AIRequestRecord>(
        `SELECT id, request_type, prompt, status, priority,
                created_at, started_at, completed_at, error_message
         FROM ai_requests
         WHERE tenant_id = $1 AND user_id = $2
         ORDER BY created_at DESC
         LIMIT $3',
        [tenantId, userId, limit]
      )

      return result.rows
    } catch (error) {
      logger.error('Failed to get request history:', error)
      return []
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
  }> {
    try {
      if (this.requestQueue) {
        const counts = await this.requestQueue.getJobCounts()
        return {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0
        }
      }

      // Fallback to database counts
      const result = await pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'queued') as waiting,
          COUNT(*) FILTER (WHERE status = 'processing') as active,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
         FROM ai_requests
         WHERE created_at > NOW() - INTERVAL '1 hour''
      )

      return result.rows[0]
    } catch (error) {
      logger.error('Failed to get queue statistics:', error)
      return { waiting: 0, active: 0, completed: 0, failed: 0 }
    }
  }

  /**
   * Calculate request priority (1-10, higher = more important)
   */
  private calculatePriority(requestType: string, userTier: string): number {
    let priority = 5 // Default

    // Adjust based on request type
    const typeWeights: Record<string, number> = {
      chat: 3,
      completion: 3,
      document_analysis: 5,
      image_analysis: 5,
      route_optimization: 8,
      maintenance_prediction: 7,
      driver_coaching: 6,
      cost_analysis: 6
    }

    priority = typeWeights[requestType] || 5

    // Adjust based on user tier
    if (userTier === 'enterprise') {
      priority += 2
    } else if (userTier === 'premium') {
      priority += 1
    }

    return Math.min(10, priority)
  }

  /**
   * Estimate wait time in seconds
   */
  private estimateWaitTime(
    priority: number,
    stats: { waiting: number; active: number }
  ): number {
    const avgProcessingTime = 30 // seconds per request
    const queueDepth = stats.waiting + stats.active

    // Higher priority = shorter wait
    const priorityMultiplier = (11 - priority) / 10

    return Math.round(queueDepth * avgProcessingTime * priorityMultiplier)
  }

  /**
   * Clean up old completed requests
   */
  async cleanupOldRequests(daysToKeep: number = 30): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM ai_requests
         WHERE completed_at < NOW() - INTERVAL '${daysToKeep} days'
           AND status IN ('completed', 'failed', 'cancelled')'
      )

      logger.info(`Cleaned up ${result.rowCount} old AI requests`)
      return result.rowCount || 0
    } catch (error) {
      logger.error('Failed to clean up old requests:', error)
      return 0
    }
  }
}

export default new AIIntakeService()
