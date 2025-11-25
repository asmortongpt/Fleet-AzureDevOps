/**
 * Microsoft Outlook Webhook Endpoint
 *
 * Receives and processes incoming email notifications via Microsoft Graph webhooks
 *
 * Features:
 * - Handles validation requests
 * - Processes new email notifications
 * - Fetches full email from Graph API
 * - Stores in communications table with type='Email'
 * - Auto-categorizes (receipts, vendor emails, etc.) using AI
 * - Extracts receipt data using OCR
 * - Processes calendar invites
 * - Handles email events: created, updated, deleted
 * - Downloads and processes attachments
 */

import express, { Request, Response } from 'express'
import { AuthRequest, authenticateJWT } from '../../middleware/auth'
import { validateWebhook, WebhookRequest } from '../../middleware/webhook-validation'
import { requirePermission } from '../../middleware/permissions'
import webhookService from '../../services/webhook.service'
import pool from '../../config/database'

const router = express.Router()

/**
 * POST /api/webhooks/outlook
 * Receive Outlook email notifications from Microsoft Graph
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

      console.log(`📧 Received ${notifications.length} Outlook notification(s)`)

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
      console.error('Outlook webhook error:', error)
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

    console.log('🔄 Processing Outlook notification:', {
      changeType,
      resource,
      subscriptionId: subscriptionId?.substring(0, 10) + '...'
    })

    // Determine event type
    switch (changeType) {
      case 'created':
        await webhookService.processOutlookNotification(notification)
        break

      case 'updated':
        await handleEmailUpdate(notification)
        break

      case 'deleted':
        await handleEmailDelete(notification)
        break

      default:
        console.warn('⚠️  Unknown change type:', changeType)
    }

  } catch (error: any) {
    console.error('Error processing Outlook notification:', error.message)

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
 * Handle email update event
 */
async function handleEmailUpdate(notification: any): Promise<void> {
  try {
    const { resource } = notification

    // Extract message ID from resource
    const resourceMatch = resource.match(/users\/([^/]+)\/messages\/(.+)/)
    if (!resourceMatch) {
      throw new Error('Invalid Outlook resource format')
    }

    const [, userEmail, messageId] = resourceMatch

    // Check if email exists in our database
    const result = await pool.query(
      `SELECT id FROM communications
       WHERE source_platform = 'Microsoft Outlook'
       AND source_platform_id = $1',
      [messageId]
    )

    if (result.rows.length === 0) {
      // Email not in our DB, treat as new email
      await webhookService.processOutlookNotification(notification)
      return
    }

    const communicationId = result.rows[0].id

    // Fetch updated email from Graph API
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

    const email = await graphClient
      .api(`/users/${userEmail}/messages/${messageId}`)
      .select('id,subject,body,categories,isRead,flag')
      .get()

    // Update communication record
    await pool.query(
      `UPDATE communications
       SET body = $1,
           updated_at = NOW(),
           status = CASE WHEN $2 THEN 'Read' ELSE 'Unread' END,
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{categories}',
             $3::jsonb
           )
       WHERE id = $4`,
      [
        email.body.content,
        email.isRead,
        JSON.stringify(email.categories || []),
        communicationId
      ]
    )

    console.log('✅ Outlook email updated:', messageId)

  } catch (error: any) {
    console.error('Failed to handle email update:', error.message)
    throw error
  }
}

/**
 * Handle email delete event
 */
async function handleEmailDelete(notification: any): Promise<void> {
  try {
    const { resource } = notification

    // Extract message ID from resource
    const resourceMatch = resource.match(/messages\/(.+)/)
    if (!resourceMatch) {
      throw new Error('Invalid Outlook resource format')
    }

    const messageId = resourceMatch[1]

    // Mark email as deleted in our database
    const result = await pool.query(
      `UPDATE communications
       SET status = 'Deleted',
           updated_at = NOW(),
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{deletedAt}',
             $1::jsonb
           )
       WHERE source_platform = 'Microsoft Outlook'
       AND source_platform_id = $2
       RETURNING id',
      [JSON.stringify(new Date().toISOString()), messageId]
    )

    if (result.rows.length > 0) {
      console.log('✅ Outlook email marked as deleted:', messageId)
    } else {
      console.warn('⚠️  Email not found for deletion:', messageId)
    }

  } catch (error: any) {
    console.error('Failed to handle email delete:', error.message)
    throw error
  }
}

/**
 * GET /api/webhooks/outlook/subscriptions
 * List all active Outlook subscriptions
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
        'SELECT ` + (await getTableColumns(pool, 'webhook_subscriptions')).join(', ') + ` FROM webhook_subscriptions
         WHERE subscription_type = 'outlook_emails'
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
      console.error('Failed to list Outlook subscriptions:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /api/webhooks/outlook/subscribe
 * Create a new Outlook mailbox subscription
 * Requires: Authentication, webhook:create permission, tenant validation
 */
router.post(
  '/subscribe',
  authenticateJWT,
  requirePermission('webhook:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId, userEmail, folderId } = req.body

      if (!tenantId || !userEmail) {
        return res.status(400).json({
          error: 'Missing required fields: tenantId, userEmail'
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
      const subscription = await webhookService.subscribeToOutlookEmails({
        tenantId,
        subscriptionType: 'outlook_emails',
        userEmail,
        folderId: folderId || 'inbox'
      })

      res.status(201).json({
        message: 'Outlook subscription created successfully',
        subscription: {
          id: subscription.id,
          resource: subscription.resource,
          expirationDateTime: subscription.expirationDateTime
        }
      })

    } catch (error: any) {
      console.error('Failed to create Outlook subscription:', error)
      res.status(500).json({
        error: 'Failed to create subscription',
        details: error.message
      })
    }
  }
)

/**
 * DELETE /api/webhooks/outlook/subscribe/:subscriptionId
 * Delete an Outlook subscription
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
      console.error('Failed to delete Outlook subscription:', error)
      res.status(500).json({
        error: 'Failed to delete subscription',
        details: error.message
      })
    }
  }
)

/**
 * POST /api/webhooks/outlook/renew/:subscriptionId
 * Manually renew an Outlook subscription
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
      console.error('Failed to renew Outlook subscription:', error)
      res.status(500).json({
        error: 'Failed to renew subscription',
        details: error.message
      })
    }
  }
)

/**
 * GET /api/webhooks/outlook/events
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
        SELECT we.*, ws.user_email, ws.folder_id, ws.subscription_type
        FROM webhook_events we
        LEFT JOIN webhook_subscriptions ws ON we.subscription_id = ws.subscription_id
        WHERE ws.subscription_type = 'outlook_emails'
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
 * POST /api/webhooks/outlook/categorize/:communicationId
 * Manually trigger AI categorization for an email
 * Requires: Authentication, communication:update permission, tenant validation
 */
router.post(
  '/categorize/:communicationId',
  authenticateJWT,
  requirePermission('communication:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { communicationId } = req.params

      // Get communication with tenant validation
      const result = await pool.query(
        `SELECT 
      id,
      communication_type,
      direction,
      subject,
      body,
      from_user_id,
      from_contact_name,
      from_contact_email,
      from_contact_phone,
      to_user_ids,
      to_contact_names,
      to_contact_emails,
      to_contact_phones,
      cc_emails,
      bcc_emails,
      communication_datetime,
      duration_seconds,
      ai_detected_category,
      ai_detected_priority,
      ai_detected_sentiment,
      ai_confidence_score,
      ai_extracted_keywords,
      ai_summary,
      ai_suggested_actions,
      manual_category,
      manual_priority,
      manual_tags,
      status,
      requires_follow_up,
      follow_up_by_date,
      follow_up_completed,
      follow_up_completed_date,
      attachments,
      parent_communication_id,
      thread_id,
      is_thread_start,
      full_text_search,
      created_at,
      created_by,
      updated_at,
      updated_by FROM communications WHERE id = $1 AND tenant_id = $2',
        [communicationId, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Communication not found or access denied' })
      }

      const communication = result.rows[0]

      // Re-categorize using AI
      const OpenAI = require('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a fleet management assistant. Categorize emails into: Receipt, Invoice, Vendor Communication, Driver Issue, Maintenance Quote, Insurance, Critical, Administrative, or Other.'
          },
          {
            role: 'user',
            content: `Categorize this email:\nSubject: ${communication.subject}\nFrom: ${communication.from_contact_email}\nBody: ${communication.body.substring(0, 1000)}\n\nReturn only the category name.`
          }
        ],
        max_tokens: 20,
        temperature: 0.3
      })

      const category = completion.choices[0].message.content?.trim() || 'Uncategorized'

      // Update category
      await pool.query(
        `UPDATE communications
         SET ai_detected_category = $1
         WHERE id = $2',
        [category, communicationId]
      )

      res.json({
        message: 'Email re-categorized successfully',
        category
      })

    } catch (error: any) {
      console.error('Failed to categorize email:', error)
      res.status(500).json({
        error: 'Failed to categorize',
        details: error.message
      })
    }
  }
)

/**
 * GET /api/webhooks/outlook/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'outlook-webhook',
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /api/webhooks/outlook/stats
 * Get statistics about processed emails
 * Requires: Authentication, webhook:read permission, tenant isolation
 */
router.get(
  '/stats',
  authenticateJWT,
  requirePermission('webhook:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Total emails processed (tenant-specific)
      const totalResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM communications
         WHERE communication_type = 'Email'
         AND source_platform = 'Microsoft Outlook'
         AND tenant_id = $1',
        [req.user!.tenant_id]
      )

      // By category (tenant-specific)
      const categoryResult = await pool.query(
        `SELECT ai_detected_category, COUNT(*) as count
         FROM communications
         WHERE communication_type = 'Email'
         AND source_platform = 'Microsoft Outlook'
         AND tenant_id = $1
         GROUP BY ai_detected_category
         ORDER BY count DESC
         LIMIT 10`,
        [req.user!.tenant_id]
      )

      // By priority (tenant-specific)
      const priorityResult = await pool.query(
        `SELECT ai_detected_priority, COUNT(*) as count
         FROM communications
         WHERE communication_type = 'Email'
         AND source_platform = 'Microsoft Outlook'
         AND tenant_id = $1
         GROUP BY ai_detected_priority
         ORDER BY count DESC`,
        [req.user!.tenant_id]
      )

      // Recent activity (last 24 hours, tenant-specific)
      const recentResult = await pool.query(
        `SELECT COUNT(*) as recent_count
         FROM communications
         WHERE communication_type = 'Email'
         AND source_platform = 'Microsoft Outlook'
         AND tenant_id = $1
         AND communication_datetime > NOW() - INTERVAL '24 hours'`,
        [req.user!.tenant_id]
      )

      // Processing queue status (tenant-specific)
      const queueResult = await pool.query(
        `SELECT status, COUNT(*) as count
         FROM webhook_processing_queue wpq
         JOIN webhook_events we ON wpq.webhook_event_id = we.id
         JOIN webhook_subscriptions ws ON we.subscription_id = ws.subscription_id
         WHERE ws.subscription_type = 'outlook_emails'
         AND ws.tenant_id = $1
         GROUP BY status`,
        [req.user!.tenant_id]
      )

      res.json({
        total: parseInt(totalResult.rows[0].total),
        by_category: categoryResult.rows,
        by_priority: priorityResult.rows,
        last_24_hours: parseInt(recentResult.rows[0].recent_count),
        processing_queue: queueResult.rows
      })

    } catch (error: any) {
      console.error('Failed to fetch stats:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
