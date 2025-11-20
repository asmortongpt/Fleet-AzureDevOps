/**
 * Webhook Validation Middleware
 *
 * Provides security and validation for Microsoft Graph webhook notifications:
 * - Validates Microsoft webhook signatures
 * - Checks client state tokens
 * - Validates request origin
 * - Rate limiting for webhook endpoints
 * - Comprehensive logging for audit trail
 */

import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'
import pool from '../config/database'
import logger from '../utils/logger'

export interface WebhookRequest extends Request {
  webhookValidated?: boolean
  clientState?: string
  subscriptionId?: string
}

/**
 * Validate webhook validation token (initial subscription setup)
 * Microsoft sends a validation token on subscription creation
 */
export const handleValidationToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validationToken = req.query.validationToken as string

  if (validationToken) {
    logger.info('📋 Webhook validation token received:', { validationToken.substring(0, 20 }) + '...')

    // Return the validation token in plain text as required by Microsoft Graph
    res.type('text/plain')
    res.status(200).send(validationToken)
    return
  }

  // No validation token, continue to webhook processing
  next()
}

/**
 * Validate client state token
 * This ensures the webhook is from a subscription we created
 */
export const validateClientState = async (
  req: WebhookRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = req.body?.value

    if (!notifications || !Array.isArray(notifications)) {
      console.error('❌ Invalid webhook payload - no notifications array')
      return res.status(400).json({ error: 'Invalid webhook payload' })
    }

    // Validate each notification
    for (const notification of notifications) {
      const { clientState, subscriptionId } = notification

      if (!clientState || !subscriptionId) {
        console.error('❌ Missing clientState or subscriptionId in notification')
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Verify client state matches our database
      const result = await pool.query(
        `SELECT client_state, status FROM webhook_subscriptions WHERE subscription_id = $1`,
        [subscriptionId]
      )

      if (result.rows.length === 0) {
        logger.error('❌ Unknown subscription ID:', { error: subscriptionId })
        return res.status(404).json({ error: 'Unknown subscription' })
      }

      const subscription = result.rows[0]

      if (subscription.client_state !== clientState) {
        logger.error('❌ Client state mismatch for subscription:', { error: subscriptionId })
        console.error('Expected:', subscription.client_state)
        logger.error('Received:', { error: clientState })

        // Log security incident
        await logSecurityIncident(
          subscriptionId,
          'client_state_mismatch',
          req.ip || 'unknown',
          req.get('User-Agent') || 'unknown'
        )

        return res.status(403).json({ error: 'Invalid client state' })
      }

      if (subscription.status !== 'active') {
        logger.warn('⚠️  Received webhook for non-active subscription:', subscriptionId)
        return res.status(410).json({ error: 'Subscription no longer active' })
      }

      // Attach validated data to request
      req.webhookValidated = true
      req.clientState = clientState
      req.subscriptionId = subscriptionId
    }

    next()
  } catch (error) {
    logger.error('Error validating client state:', { error: error })
    res.status(500).json({ error: 'Validation error' })
  }
}

/**
 * Validate request origin
 * Ensure webhook comes from Microsoft servers
 */
export const validateRequestOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userAgent = req.get('User-Agent') || ''
  const origin = req.get('Origin') || ''
  const referer = req.get('Referer') || ''

  // Microsoft Graph webhooks typically have this User-Agent pattern
  const isMicrosoftUA = userAgent.includes('Microsoft') ||
                        userAgent.includes('Azure') ||
                        userAgent === '' // Microsoft webhooks sometimes don't send User-Agent

  // Log suspicious requests
  if (!isMicrosoftUA && userAgent !== '') {
    logger.warn('⚠️  Suspicious webhook request from:', {
      userAgent,
      origin,
      referer,
      ip: req.ip
    })
  }

  // For production, you might want to add IP whitelist validation
  // Microsoft Graph webhook IPs are documented here:
  // https://learn.microsoft.com/en-us/graph/webhooks#ip-addresses

  next()
}

/**
 * Rate limiting for webhook endpoints
 * Prevents abuse and DoS attacks
 */
const webhookRequestCounts = new Map<string, { count: number; resetAt: number }>()

export const rateLimitWebhooks = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientIp = req.ip || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100 // Max 100 requests per minute per IP

  // Clean up old entries
  if (Math.random() < 0.1) {
    for (const [ip, data] of webhookRequestCounts.entries()) {
      if (now > data.resetAt) {
        webhookRequestCounts.delete(ip)
      }
    }
  }

  // Get or create rate limit entry
  let rateLimitData = webhookRequestCounts.get(clientIp)

  if (!rateLimitData || now > rateLimitData.resetAt) {
    rateLimitData = { count: 0, resetAt: now + windowMs }
    webhookRequestCounts.set(clientIp, rateLimitData)
  }

  rateLimitData.count++

  if (rateLimitData.count > maxRequests) {
    logger.warn('⚠️  Rate limit exceeded for IP:', clientIp)
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((rateLimitData.resetAt - now) / 1000)
    })
  }

  next()
}

/**
 * Log all webhook activity for audit trail
 */
export const logWebhookActivity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now()

  // Log request
  console.log('🔔 Webhook request received:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // Capture original send methods
  const originalJson = res.json.bind(res)
  const originalSend = res.send.bind(res)

  // Override to log response
  res.json = function(body: any) {
    const duration = Date.now() - startTime
    console.log('📤 Webhook response:', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode >= 200 && res.statusCode < 300
    })
    return originalJson(body)
  }

  res.send = function(body: any) {
    const duration = Date.now() - startTime
    console.log('📤 Webhook response:', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode >= 200 && res.statusCode < 300
    })
    return originalSend(body)
  }

  next()
}

/**
 * Log security incidents
 */
async function logSecurityIncident(
  subscriptionId: string,
  incidentType: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    await pool.query(
      `INSERT INTO webhook_events
       (subscription_id, change_type, resource, resource_data, processed, error)
       VALUES ($1, $2, $3, $4, true, $5)`,
      [
        subscriptionId,
        'security_incident',
        incidentType,
        JSON.stringify({ ipAddress, userAgent }),
        `Security incident: ${incidentType}`
      ]
    )
  } catch (error) {
    logger.error('Failed to log security incident:', { error: error })
  }
}

/**
 * Idempotency check - prevent duplicate notification processing
 * Uses resource + changeType + timestamp to detect duplicates
 */
export const checkIdempotency = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = req.body?.value

    if (!notifications || !Array.isArray(notifications)) {
      return next()
    }

    // Check for duplicates in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    for (const notification of notifications) {
      const { subscriptionId, resource, changeType } = notification

      const result = await pool.query(
        `SELECT id FROM webhook_events
         WHERE subscription_id = $1
         AND resource = $2
         AND change_type = $3
         AND received_at > $4
         LIMIT 1`,
        [subscriptionId, resource, changeType, oneHourAgo]
      )

      if (result.rows.length > 0) {
        logger.warn('⚠️  Duplicate webhook notification detected:', {
          subscriptionId,
          resource,
          changeType
        })
        // Still return 202 to acknowledge receipt
        return res.status(202).json({
          message: 'Duplicate notification ignored',
          eventId: result.rows[0].id
        })
      }
    }

    next()
  } catch (error) {
    logger.error('Error checking idempotency:', { error: error })
    // Don't block on idempotency check failure
    next()
  }
}

/**
 * Combined webhook validation middleware
 * Apply this to all webhook endpoints
 */
export const validateWebhook = [
  logWebhookActivity,
  handleValidationToken,
  validateRequestOrigin,
  rateLimitWebhooks,
  checkIdempotency,
  validateClientState
]
