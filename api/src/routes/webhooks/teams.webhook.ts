/**
 * Microsoft Teams Webhook Endpoint
 *
 * Receives and processes incoming Teams message notifications via Microsoft Graph webhooks
 *
 * Features:
 * - Handles validation requests (returns validation token)
 * - Processes notification payloads
 * - Fetches full message details from Graph API
 * - Stores messages in communications table
 * - Triggers real-time updates via WebSocket
 * - Handles different event types: messageCreated, messageUpdated
 * - Processes @mentions of the bot/app
 * - Extracts and downloads attachments
 * - Auto-categorizes messages with AI
 */

import express, { Request, Response } from 'express'
import { AuthRequest, authenticateJWT } from '../../middleware/auth'
import { validateWebhook, WebhookRequest } from '../../middleware/webhook-validation'
import { requirePermission } from '../../middleware/permissions'
import webhookService from '../../services/webhook.service'
import pool from '../../config/database'

const router = express.Router()

/**
 * POST /api/webhooks/teams
 * Receive Teams message notifications from Microsoft Graph
 */
router.post(
  '/',
  validateWebhook,
  async (req: WebhookRequest, res: Response) => {
    try {
      const notifications = req.body?.value

      if (!notifications || !Array.isArray(notifications)) {
        console.error('❌ Invalid webhook payload structure')
        return res.status(400).json({ error: 'Invalid payload structure' })
      }

      console.log(`📨 Received ${notifications.length} Teams notification(s)`)

      // Process notifications asynchronously
      // Return 202 Accepted immediately to avoid timeout
      res.status(202).json({
        message: 'Notifications received and queued for processing',
        count: notifications.length
      })

      // Process each notification in the background
      for (const notification of notifications) {
        processNotificationAsync(notification).catch(error => {
          console.error('Failed to process notification:', error)
        })
      }

    } catch (error: any) {
      console.error('Teams webhook error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * Process notification asynchronously
 */
async function processNotificationAsync(notification: any): Promise<void> {
  try {
    const { changeType, resource, resourceData, subscriptionId, clientState } = notification

    console.log('🔄 Processing Teams notification:', {
      changeType,
      resource,
      subscriptionId: subscriptionId?.substring(0, 10) + '...'
    })

    // Determine event type
    switch (changeType) {
      case 'created':
        await webhookService.processTeamsNotification(notification)
        break

      case 'updated':
        await handleMessageUpdate(notification)
        break

      case 'deleted':
        await handleMessageDelete(notification)
        break

      default:
        console.warn('⚠️  Unknown change type:', changeType)
    }

  } catch (error: any) {
    console.error('Error processing Teams notification:', error.message)

    // Log error to database for retry
    try {
      await pool.query(
        `UPDATE webhook_processing_queue
         SET status = 'failed',
             error_message = $1,
             attempts = attempts + 1
         WHERE webhook_event_id = (
           SELECT id FROM webhook_events
           WHERE subscription_id = $2
           AND resource = $3
           ORDER BY received_at DESC
           LIMIT 1
         )`,
        [error.message, notification.subscriptionId, notification.resource]
      )
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError)
    }

    throw error
  }
}

/**
 * Handle message update event
 */
async function handleMessageUpdate(notification: any): Promise<void> {
  try {
    const { resource } = notification

    // Extract message ID from resource
    const resourceMatch = resource.match(/teams\/([^/]+)\/channels\/([^/]+)\/messages\/(.+)/)
    if (!resourceMatch) {
      throw new Error('Invalid Teams resource format')
    }

    const [, teamId, channelId, messageId] = resourceMatch

    // Check if message exists in our database
    const result = await pool.query(
      `SELECT id FROM communications
       WHERE source_platform = 'Microsoft Teams'
       AND source_platform_id = $1',
      [messageId]
    )

    if (result.rows.length === 0) {
      // Message not in our DB, treat as new message
      await webhookService.processTeamsNotification(notification)
      return
    }

    const communicationId = result.rows[0].id

    // Fetch updated message from Graph API
    const { Client } = require('@microsoft/microsoft-graph-client')
    const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials')
    const { ClientSecretCredential } = require('@azure/identity')

    const AZURE_AD_CONFIG = {
      clientId: process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || process.env.MICROSOFT_TENANT_ID || ''
    }

    const credential = new ClientSecretCredential(
      AZURE_AD_CONFIG.tenantId,
      AZURE_AD_CONFIG.clientId,
      AZURE_AD_CONFIG.clientSecret
    )

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    })

    const graphClient = Client.initWithMiddleware({ authProvider })

    const message = await graphClient
      .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`)
      .get()

    // Update communication record
    await pool.query(
      `UPDATE communications
       SET body = $1,
           updated_at = NOW(),
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{lastModifiedDateTime}',
             $2::jsonb
           )
       WHERE id = $3',
      [message.body.content, JSON.stringify(message.lastModifiedDateTime), communicationId]
    )

    console.log('✅ Teams message updated:', messageId)

  } catch (error: any) {
    console.error('Failed to handle message update:', error.message)
    throw error
  }
}

/**
 * Handle message delete event
 */
async function handleMessageDelete(notification: any): Promise<void> {
  try {
    const { resource } = notification

    // Extract message ID from resource
    const resourceMatch = resource.match(/messages\/(.+)/)
    if (!resourceMatch) {
      throw new Error('Invalid Teams resource format')
    }

    const messageId = resourceMatch[1]

    // Mark message as deleted in our database
    const result = await pool.query(
      `UPDATE communications
       SET status = 'Deleted',
           updated_at = NOW(),
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{deletedAt}',
             $1::jsonb
           )
       WHERE source_platform = 'Microsoft Teams'
       AND source_platform_id = $2
       RETURNING id',
      [JSON.stringify(new Date().toISOString()), messageId]
    )

    if (result.rows.length > 0) {
      console.log('✅ Teams message marked as deleted:', messageId)
    } else {
      console.warn('⚠️  Message not found for deletion:', messageId)
    }

  } catch (error: any) {
    console.error('Failed to handle message delete:', error.message)
    throw error
  }
}

/**
 * GET /api/webhooks/teams/subscriptions
 * List all active Teams subscriptions
 * Requires: Authentication, webhook:read permission, tenant isolation
 */
router.get(
  '/subscriptions',
  authenticateJWT,
  requirePermission('webhook:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Only return subscriptions for user's tenant
      const result = await pool.query(
        'SELECT ' + (await getTableColumns(pool, 'webhook_subscriptions')).join(', ') + ' FROM webhook_subscriptions
         WHERE subscription_type = 'teams_messages'
         AND status = 'active'
         AND tenant_id = $1
         ORDER BY created_at DESC`,
        [req.user!.tenant_id]
      )

      res.json({
        subscriptions: result.rows,
        count: result.rows.length
      })

    } catch (error: any) {
      console.error('Failed to list Teams subscriptions:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /api/webhooks/teams/subscribe
 * Create a new Teams channel subscription
 * Requires: Authentication, webhook:create permission, tenant validation
 */
router.post(
  '/subscribe',
  authenticateJWT,
  requirePermission('webhook:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId, teamId, channelId } = req.body

      if (!tenantId || !teamId || !channelId) {
        return res.status(400).json({
          error: 'Missing required fields: tenantId, teamId, channelId'
        })
      }

      // Validate user can only create subscriptions for their own tenant
      if (tenantId !== req.user!.tenant_id) {
        console.warn('Unauthorized tenant access attempt', {
          requestedTenant: tenantId,
          userTenant: req.user!.tenant_id,
          userId: req.user!.id
        })
        return res.status(403).json({
          error: 'Access denied: Cannot create subscriptions for other tenants'
        })
      }

      // Create subscription
      const subscription = await webhookService.subscribeToTeamsMessages({
        tenantId,
        subscriptionType: 'teams_messages',
        teamId,
        channelId
      })

      res.status(201).json({
        message: 'Teams subscription created successfully',
        subscription: {
          id: subscription.id,
          resource: subscription.resource,
          expirationDateTime: subscription.expirationDateTime
        }
      })

    } catch (error: any) {
      console.error('Failed to create Teams subscription:', error)
      res.status(500).json({
        error: 'Failed to create subscription',
        details: error.message
      })
    }
  }
)

/**
 * DELETE /api/webhooks/teams/subscribe/:subscriptionId
 * Delete a Teams subscription
 * Requires: Authentication, webhook:delete permission, tenant validation
 */
router.delete(
  '/subscribe/:subscriptionId',
  authenticateJWT,
  requirePermission('webhook:delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { subscriptionId } = req.params

      // Validate subscription belongs to user's tenant
      const checkResult = await pool.query(
        'SELECT tenant_id FROM webhook_subscriptions WHERE subscription_id = $1',
        [subscriptionId]
      )

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription not found' })
      }

      if (checkResult.rows[0].tenant_id !== req.user!.tenant_id) {
        console.warn('Unauthorized subscription deletion attempt', {
          subscriptionId,
          userId: req.user!.id,
          userTenant: req.user!.tenant_id
        })
        return res.status(403).json({
          error: 'Access denied: Cannot delete subscriptions from other tenants'
        })
      }

      await webhookService.deleteSubscription(subscriptionId)

      res.json({
        message: 'Subscription deleted successfully',
        subscriptionId
      })

    } catch (error: any) {
      console.error('Failed to delete Teams subscription:', error)
      res.status(500).json({
        error: 'Failed to delete subscription',
        details: error.message
      })
    }
  }
)

/**
 * POST /api/webhooks/teams/renew/:subscriptionId
 * Manually renew a Teams subscription
 * Requires: Authentication, webhook:update permission, tenant validation
 */
router.post(
  '/renew/:subscriptionId',
  authenticateJWT,
  requirePermission('webhook:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { subscriptionId } = req.params

      // Validate subscription belongs to user's tenant
      const checkResult = await pool.query(
        'SELECT tenant_id FROM webhook_subscriptions WHERE subscription_id = $1',
        [subscriptionId]
      )

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Subscription not found' })
      }

      if (checkResult.rows[0].tenant_id !== req.user!.tenant_id) {
        console.warn('Unauthorized subscription renewal attempt', {
          subscriptionId,
          userId: req.user!.id,
          userTenant: req.user!.tenant_id
        })
        return res.status(403).json({
          error: 'Access denied: Cannot renew subscriptions from other tenants'
        })
      }

      await webhookService.renewSubscription(subscriptionId)

      res.json({
        message: 'Subscription renewed successfully',
        subscriptionId
      })

    } catch (error: any) {
      console.error('Failed to renew Teams subscription:', error)
      res.status(500).json({
        error: 'Failed to renew subscription',
        details: error.message
      })
    }
  }
)

/**
 * GET /api/webhooks/teams/events
 * Get recent webhook events for debugging
 * Requires: Authentication, webhook:read permission, tenant isolation
 */
router.get(
  '/events',
  authenticateJWT,
  requirePermission('webhook:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit = 50, processed } = req.query

      let query = `
        SELECT we.*, ws.team_id, ws.channel_id, ws.subscription_type
        FROM webhook_events we
        LEFT JOIN webhook_subscriptions ws ON we.subscription_id = ws.subscription_id
        WHERE ws.subscription_type = 'teams_messages'
        AND ws.tenant_id = $1
      `

      const params: any[] = [req.user!.tenant_id]

      if (processed !== undefined) {
        query += ` AND we.processed = $${params.length + 1}`
        params.push(processed === 'true')
      }

      query += ` ORDER BY we.received_at DESC LIMIT $${params.length + 1}`
      params.push(limit)

      const result = await pool.query(query, params)

      res.json({
        events: result.rows,
        count: result.rows.length
      })

    } catch (error: any) {
      console.error('Failed to fetch webhook events:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /api/webhooks/teams/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'teams-webhook',
    timestamp: new Date().toISOString()
  })
})

export default router
