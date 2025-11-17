/**
 * Outlook Email Service
 * Full-featured service for sending, receiving, and managing emails via Microsoft Graph API
 * Integrates with communications logging for complete email tracking
 */

import { microsoftGraphService, MicrosoftGraphService } from './microsoft-graph.service'
import { logger } from '../config/logger'
import pool from '../config/database'
import {
  Email,
  EmailMessage,
  MailFolder,
  EmailAttachment,
  SendEmailRequest,
  GetEmailsRequest,
  ReplyEmailRequest,
  ForwardEmailRequest,
  UpdateEmailRequest,
  MoveEmailRequest,
  CreateFolderRequest,
  SearchEmailsRequest,
  CategorizeEmailRequest,
  SendEmailResponse,
  EmailListResponse,
  AttachmentListResponse,
  FolderListResponse,
  EmailRecipient,
  EmailFilter,
  EmailToCommunicationLog
} from '../types/outlook.types'

class OutlookService {
  private defaultUserId: string

  constructor() {
    // Default user email for sending emails (can be overridden per request)
    this.defaultUserId = process.env.OUTLOOK_DEFAULT_USER_EMAIL || process.env.EMAIL_FROM || ''
  }

  /**
   * Send email via Microsoft Graph API
   * @param request Email send request parameters
   * @param userId User email or ID to send from (optional, uses default if not specified)
   * @param logToCommunications Whether to log this email to communications table (default: true)
   * @returns Send result with message ID
   */
  async sendEmail(
    request: SendEmailRequest,
    userId?: string,
    logToCommunications: boolean = true
  ): Promise<SendEmailResponse> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for sending email')
      }

      // Build email message
      const message = this.buildEmailMessage(request)

      // Send via Graph API
      const endpoint = `/users/${user}/sendMail`
      const payload = {
        message,
        saveToSentItems: request.saveToSentItems !== false
      }

      await microsoftGraphService.makeGraphRequest(endpoint, 'POST', payload)

      logger.info('Email sent successfully via Outlook', {
        user,
        to: request.to,
        subject: request.subject
      })

      // Log to communications table if enabled
      if (logToCommunications) {
        await this.logEmailToCommunications({
          direction: 'Outbound',
          subject: request.subject,
          body: request.body,
          to_contact_emails: Array.isArray(request.to) ? request.to : [request.to],
          cc_emails: request.cc ? (Array.isArray(request.cc) ? request.cc : [request.cc]) : undefined,
          bcc_emails: request.bcc ? (Array.isArray(request.bcc) ? request.bcc : [request.bcc]) : undefined,
          from_contact_email: user
        })
      }

      return {
        success: true,
        messageId: undefined // Graph API doesn't return message ID on send
      }
    } catch (error) {
      logger.error('Failed to send email via Outlook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: request.to,
        subject: request.subject
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  /**
   * Get list of emails with filtering and pagination
   * @param request Query parameters for filtering emails
   * @param userId User email or ID (optional, uses default if not specified)
   * @returns List of emails with pagination info
   */
  async getEmails(request: GetEmailsRequest = {}, userId?: string): Promise<EmailListResponse> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for fetching emails')
      }

      // Build endpoint with folder if specified
      const folderPath = request.folderId ? `/mailFolders/${request.folderId}` : ''
      const endpoint = `/users/${user}${folderPath}/messages`

      // Build query parameters
      const params: string[] = []

      if (request.filter) {
        params.push(`$filter=${encodeURIComponent(request.filter)}`)
      }

      if (request.search) {
        params.push(`$search="${encodeURIComponent(request.search)}"`)
      }

      if (request.orderBy) {
        params.push(`$orderby=${encodeURIComponent(request.orderBy)}`)
      } else {
        params.push('$orderby=receivedDateTime desc')
      }

      if (request.select && request.select.length > 0) {
        params.push(`$select=${request.select.join(',')}`)
      }

      if (request.top) {
        params.push(`$top=${request.top}`)
      }

      if (request.skip) {
        params.push(`$skip=${request.skip}`)
      }

      if (request.includeAttachments) {
        params.push('$expand=attachments')
      }

      const queryString = params.length > 0 ? `?${params.join('&')}` : ''
      const fullEndpoint = `${endpoint}${queryString}`

      const response = await microsoftGraphService.makeGraphRequest<EmailListResponse>(fullEndpoint, 'GET')

      logger.info('Emails fetched successfully', {
        user,
        count: response.value.length,
        hasMore: !!response['@odata.nextLink']
      })

      return response
    } catch (error) {
      logger.error('Failed to fetch emails', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get single email with full details including attachments
   * @param messageId Email message ID
   * @param userId User email or ID (optional)
   * @returns Complete email message with attachments
   */
  async getEmail(messageId: string, userId?: string): Promise<EmailMessage> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for fetching email')
      }

      const endpoint = `/users/${user}/messages/${messageId}?$expand=attachments`
      const email = await microsoftGraphService.makeGraphRequest<EmailMessage>(endpoint, 'GET')

      logger.info('Email fetched successfully', {
        user,
        messageId,
        subject: email.subject
      })

      return email
    } catch (error) {
      logger.error('Failed to fetch email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Reply to an email
   * @param messageId Original message ID to reply to
   * @param request Reply parameters
   * @param userId User email or ID (optional)
   */
  async replyToEmail(messageId: string, request: ReplyEmailRequest, userId?: string): Promise<void> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for replying to email')
      }

      const action = request.replyAll ? 'replyAll' : 'reply'
      const endpoint = `/users/${user}/messages/${messageId}/${action}`

      const payload = {
        message: {
          body: {
            contentType: request.bodyType || 'html',
            content: request.body
          },
          attachments: request.attachments?.map(att => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: att.name,
            contentType: att.contentType,
            contentBytes: att.contentBytes,
            isInline: att.isInline || false,
            contentId: att.contentId
          }))
        }
      }

      await microsoftGraphService.makeGraphRequest(endpoint, 'POST', payload)

      logger.info('Email reply sent successfully', {
        user,
        messageId,
        replyAll: request.replyAll
      })

      // Log to communications
      const originalEmail = await this.getEmail(messageId, user)
      await this.logEmailToCommunications({
        direction: 'Outbound',
        subject: originalEmail.subject ? `RE: ${originalEmail.subject}` : 'RE: (no subject)',
        body: request.body,
        to_contact_emails: originalEmail.from?.emailAddress.address ? [originalEmail.from.emailAddress.address] : [],
        from_contact_email: user,
        external_message_id: messageId
      })
    } catch (error) {
      logger.error('Failed to reply to email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Forward an email
   * @param messageId Message ID to forward
   * @param request Forward parameters
   * @param userId User email or ID (optional)
   */
  async forwardEmail(messageId: string, request: ForwardEmailRequest, userId?: string): Promise<void> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for forwarding email')
      }

      const endpoint = `/users/${user}/messages/${messageId}/forward`

      const toRecipients = Array.isArray(request.to) ? request.to : [request.to]
      const ccRecipients = request.cc ? (Array.isArray(request.cc) ? request.cc : [request.cc]) : []

      const payload = {
        message: {
          body: request.body ? {
            contentType: request.bodyType || 'html',
            content: request.body
          } : undefined,
          toRecipients: toRecipients.map(email => ({
            emailAddress: { address: email }
          })),
          ccRecipients: ccRecipients.map(email => ({
            emailAddress: { address: email }
          }))
        }
      }

      await microsoftGraphService.makeGraphRequest(endpoint, 'POST', payload)

      logger.info('Email forwarded successfully', {
        user,
        messageId,
        to: request.to
      })

      // Log to communications
      const originalEmail = await this.getEmail(messageId, user)
      await this.logEmailToCommunications({
        direction: 'Outbound',
        subject: originalEmail.subject ? `FW: ${originalEmail.subject}` : 'FW: (no subject)',
        body: request.body || originalEmail.body?.content || '',
        to_contact_emails: toRecipients,
        cc_emails: ccRecipients.length > 0 ? ccRecipients : undefined,
        from_contact_email: user,
        external_message_id: messageId
      })
    } catch (error) {
      logger.error('Failed to forward email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Move email to a different folder
   * @param messageId Message ID to move
   * @param destinationFolderId Destination folder ID
   * @param userId User email or ID (optional)
   */
  async moveEmail(messageId: string, destinationFolderId: string, userId?: string): Promise<Email> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for moving email')
      }

      const endpoint = `/users/${user}/messages/${messageId}/move`
      const payload = { destinationId: destinationFolderId }

      const movedEmail = await microsoftGraphService.makeGraphRequest<Email>(endpoint, 'POST', payload)

      logger.info('Email moved successfully', {
        user,
        messageId,
        destinationFolderId
      })

      return movedEmail
    } catch (error) {
      logger.error('Failed to move email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId,
        destinationFolderId
      })
      throw error
    }
  }

  /**
   * Delete email (move to deleted items or permanent delete)
   * @param messageId Message ID to delete
   * @param userId User email or ID (optional)
   * @param permanent If true, permanently delete; if false, move to deleted items
   */
  async deleteEmail(messageId: string, userId?: string, permanent: boolean = false): Promise<void> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for deleting email')
      }

      const endpoint = `/users/${user}/messages/${messageId}`
      await microsoftGraphService.makeGraphRequest(endpoint, 'DELETE')

      logger.info('Email deleted successfully', {
        user,
        messageId,
        permanent
      })
    } catch (error) {
      logger.error('Failed to delete email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Mark email as read or unread
   * @param messageId Message ID
   * @param isRead True to mark as read, false for unread
   * @param userId User email or ID (optional)
   */
  async markAsRead(messageId: string, isRead: boolean = true, userId?: string): Promise<void> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for updating email')
      }

      const endpoint = `/users/${user}/messages/${messageId}`
      const payload = { isRead }

      await microsoftGraphService.makeGraphRequest(endpoint, 'PATCH', payload)

      logger.info('Email read status updated', {
        user,
        messageId,
        isRead
      })
    } catch (error) {
      logger.error('Failed to update email read status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Get list of mail folders
   * @param userId User email or ID (optional)
   * @param includeChildFolders Include child folders in the list
   */
  async getFolders(userId?: string, includeChildFolders: boolean = false): Promise<FolderListResponse> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for fetching folders')
      }

      const endpoint = includeChildFolders
        ? `/users/${user}/mailFolders?$expand=childFolders`
        : `/users/${user}/mailFolders`

      const response = await microsoftGraphService.makeGraphRequest<FolderListResponse>(endpoint, 'GET')

      logger.info('Mail folders fetched successfully', {
        user,
        count: response.value.length
      })

      return response
    } catch (error) {
      logger.error('Failed to fetch mail folders', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Create new mail folder
   * @param request Folder creation parameters
   * @param userId User email or ID (optional)
   */
  async createFolder(request: CreateFolderRequest, userId?: string): Promise<MailFolder> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for creating folder')
      }

      const endpoint = request.parentFolderId
        ? `/users/${user}/mailFolders/${request.parentFolderId}/childFolders`
        : `/users/${user}/mailFolders`

      const payload = {
        displayName: request.displayName,
        isHidden: request.isHidden || false
      }

      const folder = await microsoftGraphService.makeGraphRequest<MailFolder>(endpoint, 'POST', payload)

      logger.info('Mail folder created successfully', {
        user,
        folderName: request.displayName,
        parentFolderId: request.parentFolderId
      })

      return folder
    } catch (error) {
      logger.error('Failed to create mail folder', {
        error: error instanceof Error ? error.message : 'Unknown error',
        folderName: request.displayName
      })
      throw error
    }
  }

  /**
   * Get attachments for an email
   * @param messageId Message ID
   * @param userId User email or ID (optional)
   */
  async getAttachments(messageId: string, userId?: string): Promise<EmailAttachment[]> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for fetching attachments')
      }

      const endpoint = `/users/${user}/messages/${messageId}/attachments`
      const response = await microsoftGraphService.makeGraphRequest<AttachmentListResponse>(endpoint, 'GET')

      logger.info('Email attachments fetched successfully', {
        user,
        messageId,
        count: response.value.length
      })

      return response.value
    } catch (error) {
      logger.error('Failed to fetch email attachments', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Download a specific attachment
   * @param messageId Message ID
   * @param attachmentId Attachment ID
   * @param userId User email or ID (optional)
   */
  async downloadAttachment(messageId: string, attachmentId: string, userId?: string): Promise<EmailAttachment> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for downloading attachment')
      }

      const endpoint = `/users/${user}/messages/${messageId}/attachments/${attachmentId}`
      const attachment = await microsoftGraphService.makeGraphRequest<EmailAttachment>(endpoint, 'GET')

      logger.info('Email attachment downloaded successfully', {
        user,
        messageId,
        attachmentId,
        name: attachment.name
      })

      return attachment
    } catch (error) {
      logger.error('Failed to download email attachment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId,
        attachmentId
      })
      throw error
    }
  }

  /**
   * Search emails using Graph API search
   * @param request Search parameters
   * @param userId User email or ID (optional)
   */
  async searchEmails(request: SearchEmailsRequest, userId?: string): Promise<EmailListResponse> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for searching emails')
      }

      const folderPath = request.folderId ? `/mailFolders/${request.folderId}` : ''
      const endpoint = `/users/${user}${folderPath}/messages`

      const params: string[] = [
        `$search="${encodeURIComponent(request.query)}"`
      ]

      if (request.top) {
        params.push(`$top=${request.top}`)
      }

      if (request.skip) {
        params.push(`$skip=${request.skip}`)
      }

      if (request.orderBy) {
        params.push(`$orderby=${encodeURIComponent(request.orderBy)}`)
      }

      const queryString = params.join('&')
      const fullEndpoint = `${endpoint}?${queryString}`

      const response = await microsoftGraphService.makeGraphRequest<EmailListResponse>(fullEndpoint, 'GET')

      logger.info('Email search completed', {
        user,
        query: request.query,
        count: response.value.length
      })

      return response
    } catch (error) {
      logger.error('Failed to search emails', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: request.query
      })
      throw error
    }
  }

  /**
   * Categorize email (add/update categories)
   * @param messageId Message ID
   * @param request Categorization parameters
   * @param userId User email or ID (optional)
   */
  async categorizeEmail(messageId: string, request: CategorizeEmailRequest, userId?: string): Promise<void> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for categorizing email')
      }

      let categories = request.categories

      // If not replacing, get existing categories and merge
      if (!request.replace) {
        const email = await this.getEmail(messageId, user)
        const existingCategories = email.categories || []
        categories = [...new Set([...existingCategories, ...request.categories])]
      }

      const endpoint = `/users/${user}/messages/${messageId}`
      const payload = { categories }

      await microsoftGraphService.makeGraphRequest(endpoint, 'PATCH', payload)

      logger.info('Email categorized successfully', {
        user,
        messageId,
        categories
      })
    } catch (error) {
      logger.error('Failed to categorize email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Update email properties (read status, importance, flag, categories)
   * @param messageId Message ID
   * @param request Update parameters
   * @param userId User email or ID (optional)
   */
  async updateEmail(messageId: string, request: UpdateEmailRequest, userId?: string): Promise<Email> {
    try {
      const user = userId || this.defaultUserId

      if (!user) {
        throw new Error('No user email specified for updating email')
      }

      const endpoint = `/users/${user}/messages/${messageId}`
      const updatedEmail = await microsoftGraphService.makeGraphRequest<Email>(endpoint, 'PATCH', request)

      logger.info('Email updated successfully', {
        user,
        messageId,
        updates: Object.keys(request)
      })

      return updatedEmail
    } catch (error) {
      logger.error('Failed to update email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      })
      throw error
    }
  }

  /**
   * Build email filter query string for Graph API
   */
  buildEmailFilter(filter: EmailFilter): string {
    const conditions: string[] = []

    if (filter.isRead !== undefined) {
      conditions.push(`isRead eq ${filter.isRead}`)
    }

    if (filter.hasAttachments !== undefined) {
      conditions.push(`hasAttachments eq ${filter.hasAttachments}`)
    }

    if (filter.importance) {
      conditions.push(`importance eq '${filter.importance}'`)
    }

    if (filter.from) {
      conditions.push(`from/emailAddress/address eq '${filter.from}'`)
    }

    if (filter.subject) {
      conditions.push(`contains(subject, '${filter.subject}')`)
    }

    if (filter.receivedAfter) {
      conditions.push(`receivedDateTime ge ${filter.receivedAfter.toISOString()}`)
    }

    if (filter.receivedBefore) {
      conditions.push(`receivedDateTime le ${filter.receivedBefore.toISOString()}`)
    }

    if (filter.categories && filter.categories.length > 0) {
      const categoryConditions = filter.categories.map(cat => `categories/any(c:c eq '${cat}')`).join(' or ')
      conditions.push(`(${categoryConditions})`)
    }

    return conditions.join(' and ')
  }

  /**
   * Build email message object for sending
   */
  private buildEmailMessage(request: SendEmailRequest): any {
    const toRecipients = Array.isArray(request.to) ? request.to : [request.to]
    const ccRecipients = request.cc ? (Array.isArray(request.cc) ? request.cc : [request.cc]) : []
    const bccRecipients = request.bcc ? (Array.isArray(request.bcc) ? request.bcc : [request.bcc]) : []
    const replyToRecipients = request.replyTo ? (Array.isArray(request.replyTo) ? request.replyTo : [request.replyTo]) : []

    return {
      subject: request.subject,
      body: {
        contentType: request.bodyType || 'html',
        content: request.body
      },
      toRecipients: toRecipients.map(email => ({
        emailAddress: { address: email }
      })),
      ccRecipients: ccRecipients.map(email => ({
        emailAddress: { address: email }
      })),
      bccRecipients: bccRecipients.map(email => ({
        emailAddress: { address: email }
      })),
      replyTo: replyToRecipients.map(email => ({
        emailAddress: { address: email }
      })),
      importance: request.importance || 'normal',
      isDeliveryReceiptRequested: request.isDeliveryReceiptRequested || false,
      isReadReceiptRequested: request.isReadReceiptRequested || false,
      attachments: request.attachments?.map(att => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes,
        isInline: att.isInline || false,
        contentId: att.contentId
      }))
    }
  }

  /**
   * Log email to communications table for tracking
   */
  private async logEmailToCommunications(data: Partial<EmailToCommunicationLog>): Promise<void> {
    try {
      const insertData = {
        communication_type: 'Email',
        direction: data.direction || 'Outbound',
        subject: data.subject,
        body: data.body || '',
        from_contact_email: data.from_contact_email,
        to_contact_emails: data.to_contact_emails,
        cc_emails: data.cc_emails,
        bcc_emails: data.bcc_emails,
        communication_datetime: data.communication_datetime || new Date(),
        status: 'Open'
      }

      await pool.query(
        `INSERT INTO communications (
          communication_type, direction, subject, body,
          from_contact_email, to_contact_emails, cc_emails, bcc_emails,
          communication_datetime, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          insertData.communication_type,
          insertData.direction,
          insertData.subject,
          insertData.body,
          insertData.from_contact_email,
          insertData.to_contact_emails,
          insertData.cc_emails,
          insertData.bcc_emails,
          insertData.communication_datetime,
          insertData.status
        ]
      )

      logger.info('Email logged to communications table', {
        subject: insertData.subject,
        direction: insertData.direction
      })
    } catch (error) {
      logger.error('Failed to log email to communications', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // Don't throw - logging failure shouldn't block email operations
    }
  }
}

// Export singleton instance
export const outlookService = new OutlookService()
export default outlookService
