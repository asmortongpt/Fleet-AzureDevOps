/**
 * AI Controls Service
 * Rate limiting, user permissions, audit logging, and usage tracking for AI features
 */

import pool from '../config/database'
import { logger } from '../utils/logger'
import Redis from 'ioredis'

export interface RateLimitCheck {
  allowed: boolean
  reason?: string
  remaining?: number
  resetAt?: Date
  userTier: string
}

export interface UsageStats {
  requestsToday: number
  requestsThisMonth: number
  tokensToday: number
  tokensThisMonth: number
  costToday: number
  costThisMonth: number
  quotaUsagePercent: number
}

export interface AuditLogEntry {
  id: string
  tenant_id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  details: any
  ip_address?: string
  user_agent?: string
  created_at: Date
}

class AIControlsService {
  private redis: Redis | null = null

  // Rate limits by tier (requests per hour / requests per day / tokens per day)
  private readonly RATE_LIMITS = {
    free: { hourly: 10, daily: 50, tokensDaily: 10000 },
    basic: { hourly: 50, daily: 200, tokensDaily: 50000 },
    premium: { hourly: 200, daily: 1000, tokensDaily: 200000 },
    enterprise: { hourly: 1000, daily: 10000, tokensDaily: 1000000 }
  }

  constructor() {
    this.initializeRedis()
  }

  /**
   * Initialize Redis client for rate limiting
   */
  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: false
        })

        this.redis.on('error', (error) => {
          logger.error('Redis connection error:', error)
        })

        this.redis.on('connect', () => {
          logger.info('Redis connected for rate limiting')
        })
      } else {
        logger.warn('Redis not configured - rate limiting will use database')
      }
    } catch (error) {
      logger.error('Failed to initialize Redis:', error)
    }
  }

  /**
   * Check rate limits for user
   */
  async checkRateLimits(tenantId: string, userId: string): Promise<RateLimitCheck> {
    try {
      // Get user tier
      const userTier = await this.getUserTier(tenantId, userId)
      const limits = this.RATE_LIMITS[userTier as keyof typeof this.RATE_LIMITS] || this.RATE_LIMITS.free

      // Check hourly limit
      const hourlyCount = await this.getRequestCount(tenantId, userId, 'hour')
      if (hourlyCount >= limits.hourly) {
        return {
          allowed: false,
          reason: `Hourly limit exceeded (${limits.hourly} requests/hour for ${userTier} tier)`,
          remaining: 0,
          resetAt: this.getNextHourReset(),
          userTier
        }
      }

      // Check daily limit
      const dailyCount = await this.getRequestCount(tenantId, userId, 'day')
      if (dailyCount >= limits.daily) {
        return {
          allowed: false,
          reason: `Daily limit exceeded (${limits.daily} requests/day for ${userTier} tier)`,
          remaining: 0,
          resetAt: this.getNextDayReset(),
          userTier
        }
      }

      // Check token limit
      const tokensToday = await this.getTokenCount(tenantId, userId, 'day')
      if (tokensToday >= limits.tokensDaily) {
        return {
          allowed: false,
          reason: `Daily token limit exceeded (${limits.tokensDaily} tokens/day for ${userTier} tier)`,
          remaining: 0,
          resetAt: this.getNextDayReset(),
          userTier
        }
      }

      return {
        allowed: true,
        remaining: limits.daily - dailyCount,
        resetAt: this.getNextDayReset(),
        userTier
      }
    } catch (error) {
      logger.error('Rate limit check failed:', error)
      // Fail open to avoid blocking legitimate requests
      return {
        allowed: true,
        userTier: 'free'
      }
    }
  }

  /**
   * Get user tier from database or cache
   */
  private async getUserTier(tenantId: string, userId: string): Promise<string> {
    try {
      // Try Redis cache first
      if (this.redis) {
        const cached = await this.redis.get(`user:tier:${userId}`)
        if (cached) return cached
      }

      // Query database
      const result = await pool.query(
        `SELECT subscription_tier
         FROM users u
         JOIN tenants t ON u.tenant_id = t.id
         WHERE u.id = $1 AND t.id = $2`,
        [userId, tenantId]
      )

      const tier = result.rows[0]?.subscription_tier || 'free'

      // Cache for 1 hour
      if (this.redis) {
        await this.redis.setex(`user:tier:${userId}`, 3600, tier)
      }

      return tier
    } catch (error) {
      logger.error('Failed to get user tier:', error)
      return 'free'
    }
  }

  /**
   * Get request count for time period
   */
  private async getRequestCount(
    tenantId: string,
    userId: string,
    period: 'hour' | 'day'
  ): Promise<number> {
    try {
      const key = `ratelimit:${userId}:${period}`

      // Try Redis first (faster)
      if (this.redis) {
        const count = await this.redis.get(key)
        if (count !== null) return parseInt(count)
      }

      // Fallback to database
      const interval = period === 'hour' ? '1 hour' : '1 day'
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM ai_requests
         WHERE tenant_id = $1 AND user_id = $2
           AND created_at > NOW() - INTERVAL '${interval}'`,
        [tenantId, userId]
      )

      const count = parseInt(result.rows[0].count) || 0

      // Cache in Redis
      if (this.redis) {
        const ttl = period === 'hour' ? 3600 : 86400
        await this.redis.setex(key, ttl, count.toString())
      }

      return count
    } catch (error) {
      logger.error('Failed to get request count:', error)
      return 0
    }
  }

  /**
   * Get token count for time period
   */
  private async getTokenCount(
    tenantId: string,
    userId: string,
    period: 'day' | 'month'
  ): Promise<number> {
    try {
      const interval = period === 'day' ? '1 day' : '1 month'
      const result = await pool.query(
        `SELECT COALESCE(SUM(tokens_used), 0) as total_tokens
         FROM ai_requests
         WHERE tenant_id = $1 AND user_id = $2
           AND created_at > NOW() - INTERVAL '${interval}'`,
        [tenantId, userId]
      )

      return parseInt(result.rows[0].total_tokens) || 0
    } catch (error) {
      logger.error('Failed to get token count:', error)
      return 0
    }
  }

  /**
   * Record usage after processing
   */
  async recordUsage(
    tenantId: string,
    userId: string,
    requestType: string,
    tokensUsed: number = 0,
    cost: number = 0
  ): Promise<void> {
    try {
      // Increment Redis counters
      if (this.redis) {
        const hourKey = `ratelimit:${userId}:hour`
        const dayKey = `ratelimit:${userId}:day`

        await Promise.all([
          this.redis.incr(hourKey),
          this.redis.incr(dayKey),
          this.redis.expire(hourKey, 3600),
          this.redis.expire(dayKey, 86400)
        ])
      }

      // Record in database for analytics
      await pool.query(
        `INSERT INTO ai_usage_logs (
          tenant_id, user_id, request_type, tokens_used, cost, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [tenantId, userId, requestType, tokensUsed, cost]
      )
    } catch (error) {
      logger.error('Failed to record usage:', error)
    }
  }

  /**
   * Check user permission for AI feature
   */
  async checkPermission(
    tenantId: string,
    userId: string,
    feature: string
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT EXISTS(
          SELECT 1 FROM user_permissions
          WHERE user_id = $1 AND tenant_id = $2
            AND permission_name = $3
            AND is_granted = true
        ) as has_permission`,
        [userId, tenantId, `ai:${feature}`]
      )

      return result.rows[0]?.has_permission || false
    } catch (error) {
      logger.error('Permission check failed:', error)
      return false
    }
  }

  /**
   * Log AI request for audit trail
   */
  async logRequest(
    tenantId: string,
    userId: string,
    requestId: string,
    request: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ai_audit_logs (
          tenant_id, user_id, action, resource_type, resource_id,
          details, ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          tenantId,
          userId,
          'ai_request',
          'ai_request',
          requestId,
          JSON.stringify({
            request_type: request.request_type,
            prompt_length: request.prompt?.length || 0,
            has_attachments: !!request.attachments?.length
          }),
          ipAddress,
          userAgent
        ]
      )
    } catch (error) {
      logger.error('Failed to log request:', error)
    }
  }

  /**
   * Get usage statistics for user
   */
  async getUsageStats(tenantId: string, userId: string): Promise<UsageStats> {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as requests_today,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 month') as requests_month,
          COALESCE(SUM(tokens_used) FILTER (WHERE created_at > NOW() - INTERVAL '1 day'), 0) as tokens_today,
          COALESCE(SUM(tokens_used) FILTER (WHERE created_at > NOW() - INTERVAL '1 month'), 0) as tokens_month,
          COALESCE(SUM(cost) FILTER (WHERE created_at > NOW() - INTERVAL '1 day'), 0) as cost_today,
          COALESCE(SUM(cost) FILTER (WHERE created_at > NOW() - INTERVAL '1 month'), 0) as cost_month
         FROM ai_usage_logs
         WHERE tenant_id = $1 AND user_id = $2`,
        [tenantId, userId]
      )

      const userTier = await this.getUserTier(tenantId, userId)
      const limits = this.RATE_LIMITS[userTier as keyof typeof this.RATE_LIMITS] || this.RATE_LIMITS.free

      const requestsToday = parseInt(result.rows[0].requests_today) || 0
      const quotaUsagePercent = (requestsToday / limits.daily) * 100

      return {
        requestsToday,
        requestsThisMonth: parseInt(result.rows[0].requests_month) || 0,
        tokensToday: parseInt(result.rows[0].tokens_today) || 0,
        tokensThisMonth: parseInt(result.rows[0].tokens_month) || 0,
        costToday: parseFloat(result.rows[0].cost_today) || 0,
        costThisMonth: parseFloat(result.rows[0].cost_month) || 0,
        quotaUsagePercent: Math.round(quotaUsagePercent)
      }
    } catch (error) {
      logger.error('Failed to get usage stats:', error)
      return {
        requestsToday: 0,
        requestsThisMonth: 0,
        tokensToday: 0,
        tokensThisMonth: 0,
        costToday: 0,
        costThisMonth: 0,
        quotaUsagePercent: 0
      }
    }
  }

  /**
   * Get audit logs for tenant
   */
  async getAuditLogs(
    tenantId: string,
    filters: {
      userId?: string
      action?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<AuditLogEntry[]> {
    try {
      let query = 'SELECT * FROM ai_audit_logs WHERE tenant_id = $1'
      const params: any[] = [tenantId]
      let paramCount = 1

      if (filters.userId) {
        paramCount++
        query += ` AND user_id = $${paramCount}`
        params.push(filters.userId)
      }

      if (filters.action) {
        paramCount++
        query += ` AND action = $${paramCount}`
        params.push(filters.action)
      }

      if (filters.startDate) {
        paramCount++
        query += ` AND created_at >= $${paramCount}`
        params.push(filters.startDate)
      }

      if (filters.endDate) {
        paramCount++
        query += ` AND created_at <= $${paramCount}`
        params.push(filters.endDate)
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (paramCount + 1)
      params.push(filters.limit || 100)

      const result = await pool.query<AuditLogEntry>(query, params)
      return result.rows
    } catch (error) {
      logger.error('Failed to get audit logs:', error)
      return []
    }
  }

  /**
   * Helper: Get next hour reset time
   */
  private getNextHourReset(): Date {
    const now = new Date()
    const nextHour = new Date(now)
    nextHour.setHours(now.getHours() + 1, 0, 0, 0)
    return nextHour
  }

  /**
   * Helper: Get next day reset time
   */
  private getNextDayReset(): Date {
    const now = new Date()
    const nextDay = new Date(now)
    nextDay.setDate(now.getDate() + 1)
    nextDay.setHours(0, 0, 0, 0)
    return nextDay
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<{
    auditLogs: number
    usageLogs: number
  }> {
    try {
      const [auditResult, usageResult] = await Promise.all([
        pool.query(
          `DELETE FROM ai_audit_logs
           WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`
        ),
        pool.query(
          `DELETE FROM ai_usage_logs
           WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`
        )
      ])

      logger.info(`Cleaned up old logs: ${auditResult.rowCount} audit, ${usageResult.rowCount} usage`)

      return {
        auditLogs: auditResult.rowCount || 0,
        usageLogs: usageResult.rowCount || 0
      }
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error)
      return { auditLogs: 0, usageLogs: 0 }
    }
  }
}

export default new AIControlsService()
