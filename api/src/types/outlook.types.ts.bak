/**
 * Outlook/Email Integration Type Definitions
 * Comprehensive types for Microsoft Graph API email operations
 */

// ============================================================================
// Email Core Types
// ============================================================================

export interface EmailRecipient {
  emailAddress: {
    address: string
    name?: string
  }
}

export interface EmailAddress {
  address: string
  name?: string
}

export interface EmailAttachment {
  id?: string
  name: string
  contentType: string
  size: number
  isInline: boolean
  contentId?: string
  contentLocation?: string
  contentBytes?: string // Base64 encoded
  lastModifiedDateTime?: string
}

export interface EmailBody {
  contentType: 'text' | 'html'
  content: string
}

export interface InternetMessageHeader {
  name: string
  value: string
}

export interface Flag {
  flagStatus: 'notFlagged' | 'complete' | 'flagged'
  completedDateTime?: string
  dueDateTime?: string
  startDateTime?: string
}

export interface InferenceClassification {
  id: string
  displayName: string
}

// ============================================================================
// Email Message Types
// ============================================================================

export interface Email {
  id: string
  createdDateTime: string
  lastModifiedDateTime: string
  changeKey?: string
  categories?: string[]
  receivedDateTime?: string
  sentDateTime?: string
  hasAttachments: boolean
  internetMessageId?: string
  subject?: string
  bodyPreview?: string
  importance: 'low' | 'normal' | 'high'
  parentFolderId?: string
  conversationId?: string
  conversationIndex?: string
  isDeliveryReceiptRequested?: boolean
  isReadReceiptRequested?: boolean
  isRead: boolean
  isDraft: boolean
  webLink?: string
  inferenceClassification?: 'focused' | 'other'
  body?: EmailBody
  sender?: EmailRecipient
  from?: EmailRecipient
  toRecipients?: EmailRecipient[]
  ccRecipients?: EmailRecipient[]
  bccRecipients?: EmailRecipient[]
  replyTo?: EmailRecipient[]
  flag?: Flag
  internetMessageHeaders?: InternetMessageHeader[]
  uniqueBody?: EmailBody
}

export interface EmailMessage extends Email {
  attachments?: EmailAttachment[]
}

// ============================================================================
// Email Folder Types
// ============================================================================

export interface MailFolder {
  id: string
  displayName: string
  parentFolderId?: string
  childFolderCount: number
  unreadItemCount: number
  totalItemCount: number
  sizeInBytes?: number
  isHidden?: boolean
}

// ============================================================================
// Request Types
// ============================================================================

export interface SendEmailRequest {
  to: string | string[]
  subject: string
  body: string
  bodyType?: 'text' | 'html'
  cc?: string | string[]
  bcc?: string | string[]
  importance?: 'low' | 'normal' | 'high'
  attachments?: AttachmentInput[]
  replyTo?: string | string[]
  isDeliveryReceiptRequested?: boolean
  isReadReceiptRequested?: boolean
  saveToSentItems?: boolean
}

export interface AttachmentInput {
  name: string
  contentType: string
  contentBytes: string // Base64 encoded
  isInline?: boolean
  contentId?: string
}

export interface GetEmailsRequest {
  folderId?: string
  filter?: string
  search?: string
  orderBy?: string
  select?: string[]
  top?: number
  skip?: number
  includeAttachments?: boolean
}

export interface ReplyEmailRequest {
  body: string
  bodyType?: 'text' | 'html'
  replyAll?: boolean
  attachments?: AttachmentInput[]
}

export interface ForwardEmailRequest {
  to: string | string[]
  body?: string
  bodyType?: 'text' | 'html'
  cc?: string | string[]
  attachments?: AttachmentInput[]
}

export interface UpdateEmailRequest {
  isRead?: boolean
  categories?: string[]
  importance?: 'low' | 'normal' | 'high'
  flag?: {
    flagStatus: 'notFlagged' | 'complete' | 'flagged'
    dueDateTime?: string
    startDateTime?: string
  }
}

export interface MoveEmailRequest {
  destinationFolderId: string
}

export interface CreateFolderRequest {
  displayName: string
  parentFolderId?: string
  isHidden?: boolean
}

export interface SearchEmailsRequest {
  query: string
  folderId?: string
  top?: number
  skip?: number
  orderBy?: string
}

export interface CategorizeEmailRequest {
  categories: string[]
  replace?: boolean // If true, replace all categories; if false, add to existing
}

// ============================================================================
// Response Types
// ============================================================================

export interface SendEmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailListResponse {
  value: Email[]
  '@odata.nextLink'?: string
  '@odata.count'?: number
}

export interface AttachmentListResponse {
  value: EmailAttachment[]
  '@odata.nextLink'?: string
}

export interface FolderListResponse {
  value: MailFolder[]
  '@odata.nextLink'?: string
}

// ============================================================================
// Communication Log Integration Types
// ============================================================================

export interface EmailToCommunicationLog {
  communication_type: 'Email'
  direction: 'Inbound' | 'Outbound'
  subject?: string
  body: string
  from_contact_name?: string
  from_contact_email?: string
  to_contact_emails?: string[]
  cc_emails?: string[]
  bcc_emails?: string[]
  communication_datetime: Date
  external_message_id?: string // Store Graph API message ID
  external_conversation_id?: string // Store conversation ID
  attachments?: Array<{
    filename: string
    file_size_bytes: number
    mime_type: string
    storage_path: string
  }>
}

// ============================================================================
// Graph API Configuration
// ============================================================================

export interface GraphAPIConfig {
  clientId: string
  clientSecret: string
  tenantId: string
  userId?: string // User email or ID to send emails on behalf of
  scopes?: string[]
}

export interface GraphAPIToken {
  access_token: string
  token_type: string
  expires_in: number
  ext_expires_in?: number
  scope?: string
}

// ============================================================================
// Filter & Query Helpers
// ============================================================================

export interface EmailFilter {
  isRead?: boolean
  hasAttachments?: boolean
  importance?: 'low' | 'normal' | 'high'
  from?: string
  subject?: string
  receivedAfter?: Date
  receivedBefore?: Date
  categories?: string[]
}

export interface EmailSort {
  field: 'receivedDateTime' | 'sentDateTime' | 'subject' | 'from' | 'importance'
  order: 'asc' | 'desc'
}

// ============================================================================
// Webhook/Subscription Types (for future real-time email sync)
// ============================================================================

export interface EmailSubscription {
  id: string
  resource: string
  changeType: string
  clientState?: string
  notificationUrl: string
  expirationDateTime: string
  creatorId?: string
}

export interface EmailNotification {
  subscriptionId: string
  subscriptionExpirationDateTime: string
  changeType: 'created' | 'updated' | 'deleted'
  resource: string
  resourceData?: {
    '@odata.type': string
    '@odata.id': string
    '@odata.etag': string
    id: string
  }
}

// ============================================================================
// Error Types
// ============================================================================

export interface OutlookError {
  code: string
  message: string
  innerError?: {
    code: string
    message: string
    date?: string
    'request-id'?: string
  }
}

export interface OutlookAPIError extends Error {
  code: string
  statusCode?: number
  requestId?: string
  innerError?: OutlookError['innerError']
}

// ============================================================================
// Batch Operations (for bulk email operations)
// ============================================================================

export interface BatchRequest {
  requests: Array<{
    id: string
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    url: string
    headers?: Record<string, string>
    body?: any
  }>
}

export interface BatchResponse {
  responses: Array<{
    id: string
    status: number
    headers?: Record<string, string>
    body?: any
  }>
}
