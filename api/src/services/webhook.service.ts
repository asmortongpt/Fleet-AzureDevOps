/**
 * Webhook Service for Microsoft Graph Subscriptions
 *
 * Manages webhook subscriptions for Teams and Outlook:
 * - Create and manage Graph API subscriptions
 * - Auto-renew subscriptions before expiration
 * - Process incoming notifications
 * - Store messages/emails in communications table
 * - Trigger real-time updates via WebSocket
 * - Auto-categorize with AI
 */

import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'
import pool from '../config/database'
import * as crypto from 'crypto'
import axios from 'axios'
import { analyzeDocument } from './ai-ocr'
import OpenAI from 'openai'
import { validateURL, SSRFError } from '../utils/safe-http-request'
import { env } from '../config/environment'

// Lazy initialization of OpenAI client - only create when needed and API key is available
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (openai) return openai

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not configured. AI categorization will be disabled.')
    return null
  }

  openai = new OpenAI({ apiKey })
  return openai
}

// Azure AD Configuration
// IMPORTANT: These env vars come from environment or Azure Key Vault
const AZURE_AD_CONFIG = {
  clientId: env.get('MICROSOFT_CLIENT_ID') || '',
  clientSecret: env.get('MICROSOFT_CLIENT_SECRET') || '',
  tenantId: env.get('MICROSOFT_TENANT_ID') || ''
}

// Validate Microsoft OAuth configuration
if (!AZURE_AD_CONFIG.clientId || !AZURE_AD_CONFIG.clientSecret || !AZURE_AD_CONFIG.tenantId) {
  console.warn('⚠️  WARNING: Microsoft OAuth is not configured. Webhook service will not work.')
}

// Webhook notification URL (must be HTTPS and publicly accessible)
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'https://fleet.capitaltechalliance.com/api/webhooks'

export interface SubscriptionParams {
  tenantId: string
  subscriptionType: 'teams_messages' | 'outlook_emails' | 'calendar_events'
  teamId?: string
  channelId?: string
  userEmail?: string
  folderId?: string
}

export interface TeamsMessage {
  id: string
  body: {
    content: string
    contentType: string
  }
  from: {
    user: {
      id: string
      displayName: string
      userIdentifier?: string
    }
  }
  createdDateTime: string
  lastModifiedDateTime: string
  subject?: string
  mentions?: any[]
  attachments?: any[]
}

export interface OutlookEmail {
  id: string
  subject: string
  body: {
    content: string
    contentType: string
  }
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  receivedDateTime: string
  hasAttachments: boolean
  importance: string
  categories: string[]
}

class WebhookService {
  private graphClient: Client | null = null

  constructor() {
    this.initializeGraphClient()
  }

  /**
   * Initialize Microsoft Graph Client
   */
  private initializeGraphClient() {
    try {
      const credential = new ClientSecretCredential(
        AZURE_AD_CONFIG.tenantId,
        AZURE_AD_CONFIG.clientId,
        AZURE_AD_CONFIG.clientSecret
      )

      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default']
      })

      this.graphClient = Client.initWithMiddleware({ authProvider })
      console.log('✅ Microsoft Graph client initialized for webhooks')
    } catch (error) {
      console.error('⚠️  Failed to initialize Graph client:', error)
    }
  }

  /**
   * Generate a secure client state token
   */
  private generateClientState(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Subscribe to Teams channel messages
   */
  async subscribeToTeamsMessages(params: SubscriptionParams): Promise<any> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized')
    }

    if (!params.teamId || !params.channelId) {
      throw new Error('teamId and channelId are required for Teams subscriptions')
    }

    const clientState = this.generateClientState()
    const resource = `/teams/${params.teamId}/channels/${params.channelId}/messages`
    const notificationUrl = `${WEBHOOK_BASE_URL}/teams`

    // Microsoft Graph subscription expiration: max 60 minutes for Teams messages
    const expirationDateTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    try {
      const subscription = await this.graphClient
        .api('/subscriptions')
        .post({
          changeType: 'created,updated',
          notificationUrl,
          resource,
          expirationDateTime: expirationDateTime.toISOString(),
          clientState
        })

      console.log('✅ Teams subscription created:', subscription.id)

      // Store subscription in database
      await pool.query(
        `INSERT INTO webhook_subscriptions
         (subscription_id, resource, change_type, notification_url, expiration_date_time,
          client_state, status, subscription_type, tenant_id, team_id, channel_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          subscription.id,
          resource,
          'created,updated',
          notificationUrl,
          expirationDateTime,
          clientState,
          'active',
          'teams_messages',
          params.tenantId,
          params.teamId,
          params.channelId,
          JSON.stringify(subscription)
        ]
      )

      return subscription
    } catch (error: any) {
      console.error('Failed to create Teams subscription:', error.message)
      throw error
    }
  }

  /**
   * Subscribe to Outlook emails
   */
  async subscribeToOutlookEmails(params: SubscriptionParams): Promise<any> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized')
    }

    if (!params.userEmail) {
      throw new Error('userEmail is required for Outlook subscriptions')
    }

    const clientState = this.generateClientState()
    const folderId = params.folderId || 'inbox'
    const resource = `/users/${params.userEmail}/mailFolders/${folderId}/messages`
    const notificationUrl = `${WEBHOOK_BASE_URL}/outlook`

    // Microsoft Graph subscription expiration: max 4230 minutes (about 3 days) for mail
    const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days

    try {
      const subscription = await this.graphClient
        .api('/subscriptions')
        .post({
          changeType: 'created',
          notificationUrl,
          resource,
          expirationDateTime: expirationDateTime.toISOString(),
          clientState
        })

      console.log('✅ Outlook subscription created:', subscription.id)

      // Store subscription in database
      await pool.query(
        `INSERT INTO webhook_subscriptions
         (subscription_id, resource, change_type, notification_url, expiration_date_time,
          client_state, status, subscription_type, tenant_id, user_email, folder_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          subscription.id,
          resource,
          'created',
          notificationUrl,
          expirationDateTime,
          clientState,
          'active',
          'outlook_emails',
          params.tenantId,
          params.userEmail,
          folderId,
          JSON.stringify(subscription)
        ]
      )

      return subscription
    } catch (error: any) {
      console.error('Failed to create Outlook subscription:', error.message)
      throw error
    }
  }

  /**
   * Renew a subscription before it expires
   */
  async renewSubscription(subscriptionId: string): Promise<void> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized')
    }

    try {
      // Get subscription details from database
      const result = await pool.query(
        `SELECT subscription_id, resource, change_type, notification_url,
                expiration_date_time, client_state, status, subscription_type,
                tenant_id, team_id, channel_id, user_email, folder_id,
                renewal_failure_count, last_renewed_at, created_at
         FROM webhook_subscriptions
         WHERE subscription_id = $1',
        [subscriptionId]
      )

      if (result.rows.length === 0) {
        throw new Error(`Subscription ${subscriptionId} not found`)
      }

      const subscription = result.rows[0]

      // Calculate new expiration based on subscription type
      let expirationDateTime: Date
      if (subscription.subscription_type === 'teams_messages') {
        expirationDateTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      } else {
        expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      }

      // Renew via Graph API
      await this.graphClient
        .api(`/subscriptions/${subscriptionId}`)
        .patch({
          expirationDateTime: expirationDateTime.toISOString()
        })

      // Update database
      await pool.query(
        `UPDATE webhook_subscriptions
         SET expiration_date_time = $1,
             last_renewed_at = NOW(),
             renewal_failure_count = 0,
             status = 'active'
         WHERE subscription_id = $2',
        [expirationDateTime, subscriptionId]
      )

      console.log('✅ Subscription renewed:', subscriptionId)
    } catch (error: any) {
      console.error('Failed to renew subscription:', subscriptionId, error.message)

      // Increment failure count
      await pool.query(
        `UPDATE webhook_subscriptions
         SET renewal_failure_count = renewal_failure_count + 1
         WHERE subscription_id = $1',
        [subscriptionId]
      )

      throw error
    }
  }

  /**
   * Delete a subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized')
    }

    try {
      // Delete from Graph API
      await this.graphClient
        .api(`/subscriptions/${subscriptionId}`)
        .delete()

      // Update database
      await pool.query(
        `UPDATE webhook_subscriptions
         SET status = 'deleted'
         WHERE subscription_id = $1',
        [subscriptionId]
      )

      console.log('✅ Subscription deleted:', subscriptionId)
    } catch (error: any) {
      console.error('Failed to delete subscription:', subscriptionId, error.message)
      throw error
    }
  }

  /**
   * List all active subscriptions
   */
  async listSubscriptions(): Promise<any[]> {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized')
    }

    try {
      const response = await this.graphClient
        .api('/subscriptions')
        .get()

      return response.value || []
    } catch (error: any) {
      console.error('Failed to list subscriptions:', error.message)
      throw error
    }
  }

  /**
   * Process Teams message notification
   */
  async processTeamsNotification(notification: any): Promise<void> {
    const { subscriptionId, resource, resourceData, changeType } = notification

    try {
      console.log('📨 Processing Teams notification:', { subscriptionId, resource, changeType })

      // Store webhook event
      const eventResult = await pool.query(
        `INSERT INTO webhook_events
         (subscription_id, change_type, resource, resource_data)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [subscriptionId, changeType, resource, JSON.stringify(notification)]
      )

      const eventId = eventResult.rows[0].id

      // Extract team and channel IDs from resource
      const resourceMatch = resource.match(/teams\/([^/]+)\/channels\/([^/]+)\/messages\/(.+)/)
      if (!resourceMatch) {
        throw new Error('Invalid Teams resource format')
      }

      const [, teamId, channelId, messageId] = resourceMatch

      // Fetch full message details from Graph API
      const message: TeamsMessage = await this.graphClient!
        .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`)
        .get()

      // Auto-categorize message with AI
      const category = await this.categorizeMessage(message.body.content)

      // Detect mentions of the bot/app
      const hasBotMention = message.mentions?.some(m =>
        m.mentioned?.application?.id === AZURE_AD_CONFIG.clientId
      )

      // Store in communications table
      const commResult = await pool.query(
        `INSERT INTO communications
         (communication_type, from_contact_name, from_contact_email, subject, body,
          communication_datetime, ai_detected_category, source_platform, source_platform_id,
          metadata, requires_follow_up)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          'Teams Message',
          message.from.user.displayName,
          message.from.user.userIdentifier || message.from.user.id,
          message.subject || 'Teams Message',
          message.body.content,
          message.createdDateTime,
          category,
          'Microsoft Teams',
          messageId,
          JSON.stringify({
            teamId,
            channelId,
            messageId,
            mentions: message.mentions,
            attachments: message.attachments
          }),
          hasBotMention
        ]
      )

      const communicationId = commResult.rows[0].id

      // Process attachments if present
      if (message.attachments && message.attachments.length > 0) {
        await this.processTeamsAttachments(communicationId, message.attachments, teamId, channelId, messageId)
      }

      // Update webhook event as processed
      await pool.query(
        `UPDATE webhook_events
         SET processed = true, processed_at = NOW(), communication_id = $1
         WHERE id = $2',
        [communicationId, eventId]
      )

      // Trigger real-time WebSocket update (if dispatch service is available)
      await this.triggerRealtimeUpdate('teams_message', {
        communicationId,
        messageId,
        teamId,
        channelId,
        category,
        hasBotMention
      })

      console.log('✅ Teams message processed and stored:', communicationId)
    } catch (error: any) {
      console.error('Failed to process Teams notification:', error.message)

      // Log error in webhook_events
      await pool.query(
        `UPDATE webhook_events
         SET error = $1
         WHERE subscription_id = $2 AND resource = $3',
        [error.message, subscriptionId, resource]
      )

      throw error
    }
  }

  /**
   * Process Outlook email notification
   */
  async processOutlookNotification(notification: any): Promise<void> {
    const { subscriptionId, resource, resourceData, changeType } = notification

    try {
      console.log('📧 Processing Outlook notification:', { subscriptionId, resource, changeType })

      // Store webhook event
      const eventResult = await pool.query(
        `INSERT INTO webhook_events
         (subscription_id, change_type, resource, resource_data)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [subscriptionId, changeType, resource, JSON.stringify(notification)]
      )

      const eventId = eventResult.rows[0].id

      // Extract user email and message ID from resource
      const resourceMatch = resource.match(/users\/([^/]+)\/messages\/(.+)/)
      if (!resourceMatch) {
        throw new Error('Invalid Outlook resource format')
      }

      const [, userEmail, messageId] = resourceMatch

      // Fetch full email from Graph API
      const email: OutlookEmail = await this.graphClient!
        .api(`/users/${userEmail}/messages/${messageId}`)
        .select('id,subject,body,from,receivedDateTime,hasAttachments,importance,categories,toRecipients')
        .get()

      // Auto-categorize email with AI
      const category = await this.categorizeEmail(email)

      // Determine priority based on importance and category
      const priority = email.importance === 'high' || category === 'Critical' ? 'High' : 'Normal'

      // Store in communications table
      const commResult = await pool.query(
        `INSERT INTO communications
         (communication_type, from_contact_name, from_contact_email, subject, body,
          communication_datetime, ai_detected_category, ai_detected_priority,
          source_platform, source_platform_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          'Email',
          email.from.emailAddress.name,
          email.from.emailAddress.address,
          email.subject,
          email.body.content,
          email.receivedDateTime,
          category,
          priority,
          'Microsoft Outlook',
          messageId,
          JSON.stringify({
            userEmail,
            messageId,
            hasAttachments: email.hasAttachments,
            importance: email.importance,
            categories: email.categories
          })
        ]
      )

      const communicationId = commResult.rows[0].id

      // Process attachments if present
      if (email.hasAttachments) {
        await this.processEmailAttachments(communicationId, userEmail, messageId)
      }

      // Extract receipt data if it's a receipt
      if (category === 'Receipt' || category === 'Invoice') {
        await this.extractReceiptData(communicationId, email)
      }

      // Update webhook event as processed
      await pool.query(
        `UPDATE webhook_events
         SET processed = true, processed_at = NOW(), communication_id = $1
         WHERE id = $2',
        [communicationId, eventId]
      )

      // Trigger real-time WebSocket update
      await this.triggerRealtimeUpdate('outlook_email', {
        communicationId,
        messageId,
        userEmail,
        category,
        priority
      })

      console.log('✅ Outlook email processed and stored:', communicationId)
    } catch (error: any) {
      console.error('Failed to process Outlook notification:', error.message)

      // Log error in webhook_events
      await pool.query(
        `UPDATE webhook_events
         SET error = $1
         WHERE subscription_id = $2 AND resource = $3',
        [error.message, subscriptionId, resource]
      )

      throw error
    }
  }

  /**
   * Categorize Teams message using AI
   */
  private async categorizeMessage(content: string): Promise<string> {
    try {
      const client = getOpenAIClient()
      if (!client) {
        console.log('AI categorization disabled (no API key) - using default category')
        return 'General Discussion'
      }

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a fleet management assistant. Categorize messages into: Vehicle Issue, Driver Question, Maintenance Request, Administrative, General Discussion, Urgent Alert, or Other.'
          },
          {
            role: 'user',
            content: `Categorize this Teams message: "${content}"\n\nReturn only the category name.`
          }
        ],
        max_tokens: 20,
        temperature: 0.3
      })

      return completion.choices[0].message.content?.trim() || 'General Discussion'
    } catch (error) {
      console.error('AI categorization failed:', error)
      return 'Uncategorized'
    }
  }

  /**
   * Categorize email using AI
   */
  private async categorizeEmail(email: OutlookEmail): Promise<string> {
    try {
      const client = getOpenAIClient()
      if (!client) {
        console.log('AI categorization disabled (no API key) - using default category')
        return 'Administrative'
      }

      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a fleet management assistant. Categorize emails into: Receipt, Invoice, Vendor Communication, Driver Issue, Maintenance Quote, Insurance, Critical, Administrative, or Other.'
          },
          {
            role: 'user',
            content: `Categorize this email:\nSubject: ${email.subject}\nFrom: ${email.from.emailAddress.address}\nBody preview: ${email.body.content.substring(0, 500)}\n\nReturn only the category name.`
          }
        ],
        max_tokens: 20,
        temperature: 0.3
      })

      return completion.choices[0].message.content?.trim() || 'Administrative'
    } catch (error) {
      console.error('AI categorization failed:', error)
      return 'Uncategorized'
    }
  }

  /**
   * Process Teams message attachments
   */
  private async processTeamsAttachments(
    communicationId: string,
    attachments: any[],
    teamId: string,
    channelId: string,
    messageId: string
  ): Promise<void> {
    for (const attachment of attachments) {
      try {
        // Download attachment if it's a hosted content
        if (attachment.contentType === 'reference' && attachment.contentUrl) {
          // SSRF Protection: Validate attachment URL
          try {
            validateURL(attachment.contentUrl, {
              allowedDomains: [
                'graph.microsoft.com',
                '*.sharepoint.com',
                'onedrive.live.com',
                '*.onedrive.com',
                'teams.microsoft.com',
                '*.office.com'
              ]
            })
          } catch (error) {
            if (error instanceof SSRFError) {
              console.error(`SSRF Protection blocked Teams attachment URL: ${attachment.contentUrl}`, {
                reason: error.reason
              })
              // Skip this attachment but continue processing others
              continue
            }
            throw error
          }

          await pool.query(
            `INSERT INTO communication_attachments
             (communication_id, file_name, file_url, file_type, file_size)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              communicationId,
              attachment.name,
              attachment.contentUrl,
              attachment.contentType,
              attachment.contentSize || 0
            ]
          )
        }
      } catch (error) {
        console.error('Failed to process attachment:', error)
      }
    }
  }

  /**
   * Process email attachments
   */
  private async processEmailAttachments(
    communicationId: string,
    userEmail: string,
    messageId: string
  ): Promise<void> {
    try {
      const attachments = await this.graphClient!
        .api(`/users/${userEmail}/messages/${messageId}/attachments`)
        .get()

      for (const attachment of attachments.value || []) {
        await pool.query(
          `INSERT INTO communication_attachments
           (communication_id, file_name, file_type, file_size, attachment_data)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            communicationId,
            attachment.name,
            attachment.contentType,
            attachment.size || 0,
            attachment.contentBytes // Base64 encoded
          ]
        )

        // If it's an image, run OCR
        if (attachment.contentType?.startsWith('image/')) {
          await this.processImageAttachment(communicationId, attachment)
        }
      }
    } catch (error) {
      console.error('Failed to process email attachments:', error)
    }
  }

  /**
   * Process image attachment with OCR
   */
  private async processImageAttachment(communicationId: string, attachment: any): Promise<void> {
    try {
      // Convert base64 to data URL
      const dataUrl = `data:${attachment.contentType};base64,${attachment.contentBytes}`

      // Run OCR analysis (using existing AI OCR service)
      // Note: In production, you'd upload to blob storage first
      // For now, we'll skip the actual OCR to avoid issues with base64 URLs
      console.log('📸 Image attachment detected, OCR would run here:', attachment.name)
    } catch (error) {
      console.error('Failed to process image attachment:', error)
    }
  }

  /**
   * Extract receipt data from email
   */
  private async extractReceiptData(communicationId: string, email: OutlookEmail): Promise<void> {
    try {
      const client = getOpenAIClient()
      if (!client) {
        console.log('AI receipt extraction disabled (no API key) - skipping structured data extraction')
        return
      }

      // Use AI to extract structured data from email body
      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Extract receipt/invoice data from emails. Return JSON with: vendor, amount, date, invoice_number, description.'
          },
          {
            role: 'user',
            content: `Extract data from this email:\n${email.body.content.substring(0, 2000)}`
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      })

      const extracted = JSON.parse(completion.choices[0].message.content || '{}')

      // Store extracted data in metadata
      await pool.query(
        `UPDATE communications
         SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{extracted_data}', $1::jsonb)
         WHERE id = $2',
        [JSON.stringify(extracted), communicationId]
      )

      console.log('💰 Receipt data extracted:', extracted)
    } catch (error) {
      console.error('Failed to extract receipt data:', error)
    }
  }

  /**
   * Trigger real-time update via WebSocket
   */
  private async triggerRealtimeUpdate(eventType: string, data: any): Promise<void> {
    try {
      // If dispatch service WebSocket is available, broadcast update
      // This would integrate with the existing dispatch.service.ts WebSocket infrastructure
      console.log('📡 Real-time update triggered:', { eventType, data })

      // In production, you would:
      // import dispatchService from './dispatch.service'
      // dispatchService.broadcastToChannel('communications', { type: eventType, ...data })
    } catch (error) {
      console.error('Failed to trigger real-time update:', error)
    }
  }

  /**
   * Check and renew expiring subscriptions
   * Should be run as a cron job (e.g., every hour)
   */
  async renewExpiringSubscriptions(): Promise<void> {
    try {
      // Find subscriptions expiring in the next 12 hours
      const result = await pool.query(
        `SELECT subscription_id, subscription_type
         FROM webhook_subscriptions
         WHERE status = 'active'
         AND expiration_date_time < NOW() + INTERVAL '12 hours'
         AND renewal_failure_count < 3`
      )

      console.log(`🔄 Renewing ${result.rows.length} expiring subscriptions...`)

      for (const subscription of result.rows) {
        try {
          await this.renewSubscription(subscription.subscription_id)
        } catch (error) {
          console.error(`Failed to renew subscription ${subscription.subscription_id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to renew expiring subscriptions:', error)
    }
  }

  /**
   * Clean up expired subscriptions
   */
  async cleanupExpiredSubscriptions(): Promise<void> {
    try {
      await pool.query(
        `UPDATE webhook_subscriptions
         SET status = 'expired'
         WHERE status = 'active'
         AND expiration_date_time < NOW()`
      )

      console.log('✅ Expired subscriptions cleaned up')
    } catch (error) {
      console.error('Failed to cleanup expired subscriptions:', error)
    }
  }
}

export default new WebhookService()
