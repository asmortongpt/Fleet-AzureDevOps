/**
 * Microsoft Graph API Type Definitions
 *
 * TypeScript interfaces for Microsoft Graph API responses and entities
 * Used across Teams, Outlook, Calendar integrations
 */

/**
 * OAuth Token Response from Microsoft Identity Platform
 */
export interface MicrosoftTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
  id_token?: string
}

/**
 * Cached Token with metadata
 */
export interface CachedToken {
  access_token: string
  refresh_token?: string
  expires_at: number // Unix timestamp in milliseconds
  scope: string
  token_type: string
  userId?: string
  tenantId?: string
}

/**
 * Token Store Entry - includes user/app context
 */
export interface TokenStoreEntry {
  key: string // Composite key: userId:tenantId or appId
  token: CachedToken
  createdAt: number
  lastAccessed: number
}

/**
 * Microsoft Graph User Profile
 */
export interface GraphUser {
  id: string
  displayName: string
  givenName: string
  surname: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  officeLocation?: string
  mobilePhone?: string
  businessPhones?: string[]
  preferredLanguage?: string
}

/**
 * Microsoft Teams Channel
 */
export interface TeamsChannel {
  id: string
  displayName: string
  description?: string
  email?: string
  webUrl?: string
  membershipType?: 'standard' | 'private' | 'shared'
  createdDateTime?: string
}

/**
 * Microsoft Teams Team
 */
export interface TeamsTeam {
  id: string
  displayName: string
  description?: string
  webUrl?: string
  isArchived?: boolean
  internalId?: string
  createdDateTime?: string
  classification?: string
  visibility?: 'private' | 'public'
}

/**
 * Microsoft Teams Message
 */
export interface TeamsMessage {
  id: string
  messageType: 'message' | 'chatMessage' | 'systemEventMessage'
  createdDateTime: string
  lastModifiedDateTime?: string
  deletedDateTime?: string
  subject?: string | null
  body: {
    contentType: 'text' | 'html'
    content: string
  }
  from: {
    user?: GraphUser
    application?: {
      id: string
      displayName: string
    }
  }
  attachments?: TeamsMessageAttachment[]
  mentions?: TeamsMention[]
  reactions?: TeamsReaction[]
  importance?: 'normal' | 'high' | 'urgent'
}

/**
 * Microsoft Teams Message Attachment
 */
export interface TeamsMessageAttachment {
  id: string
  contentType: string
  contentUrl?: string
  content?: string
  name?: string
  thumbnailUrl?: string
}

/**
 * Microsoft Teams Mention
 */
export interface TeamsMention {
  id: number
  mentionText: string
  mentioned: {
    user?: GraphUser
  }
}

/**
 * Microsoft Teams Reaction
 */
export interface TeamsReaction {
  reactionType: string
  createdDateTime: string
  user: GraphUser
}

/**
 * Outlook Calendar Event
 */
export interface OutlookEvent {
  id: string
  subject: string
  bodyPreview?: string
  body?: {
    contentType: 'text' | 'html'
    content: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
    address?: any
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  locations?: Array<{
    displayName: string
    locationUri?: string
  }>
  attendees?: OutlookAttendee[]
  organizer: {
    emailAddress: {
      name: string
      address: string
    }
  }
  isAllDay?: boolean
  isCancelled?: boolean
  isOnlineMeeting?: boolean
  onlineMeetingUrl?: string
  recurrence?: any
  responseStatus?: {
    response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded'
    time: string
  }
  createdDateTime: string
  lastModifiedDateTime: string
  webLink?: string
}

/**
 * Outlook Event Attendee
 */
export interface OutlookAttendee {
  type: 'required' | 'optional' | 'resource'
  status: {
    response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded'
    time: string
  }
  emailAddress: {
    name: string
    address: string
  }
}

/**
 * Outlook Calendar
 */
export interface OutlookCalendar {
  id: string
  name: string
  color?: string
  isDefaultCalendar?: boolean
  canEdit?: boolean
  canShare?: boolean
  canViewPrivateItems?: boolean
  owner?: {
    name: string
    address: string
  }
}

/**
 * Outlook Mail Message
 */
export interface OutlookMessage {
  id: string
  subject: string
  bodyPreview: string
  body?: {
    contentType: 'text' | 'html'
    content: string
  }
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  toRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  ccRecipients?: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  bccRecipients?: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  isRead: boolean
  isDraft: boolean
  hasAttachments: boolean
  importance: 'low' | 'normal' | 'high'
  receivedDateTime: string
  sentDateTime?: string
  createdDateTime: string
  lastModifiedDateTime: string
  webLink?: string
}

/**
 * Graph API Error Response
 */
export interface GraphError {
  code: string
  message: string
  innerError?: {
    date: string
    'request-id': string
    'client-request-id': string
  }
}

/**
 * Graph API Error with full context
 */
export interface GraphErrorResponse {
  error: GraphError
  statusCode?: number
  requestId?: string
}

/**
 * Custom Error Types for Graph API Operations
 */
export class MicrosoftGraphError extends Error {
  public readonly code: string
  public readonly statusCode?: number
  public readonly requestId?: string
  public readonly innerError?: any

  constructor(message: string, code: string, statusCode?: number, requestId?: string, innerError?: any) {
    super(message)
    this.name = 'MicrosoftGraphError'
    this.code = code
    this.statusCode = statusCode
    this.requestId = requestId
    this.innerError = innerError

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MicrosoftGraphError)
    }
  }
}

/**
 * Rate Limit Error - thrown when API rate limits are hit
 */
export class RateLimitError extends MicrosoftGraphError {
  public readonly retryAfter?: number // seconds

  constructor(message: string, retryAfter?: number, requestId?: string) {
    super(message, 'RateLimitExceeded', 429, requestId)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Token Error - authentication/authorization issues
 */
export class TokenError extends MicrosoftGraphError {
  constructor(message: string, code: string = 'TokenError', statusCode: number = 401) {
    super(message, code, statusCode)
    this.name = 'TokenError'
  }
}

/**
 * Graph API Request Options
 */
export interface GraphRequestOptions {
  headers?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  timeout?: number
  retries?: number
  useCache?: boolean
}

/**
 * Retry Policy Configuration
 */
export interface RetryPolicy {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatusCodes: number[]
}

/**
 * Token Refresh Callback
 */
export type TokenRefreshCallback = (userId: string, tenantId: string) => Promise<MicrosoftTokenResponse>

/**
 * Graph Service Configuration
 */
export interface GraphServiceConfig {
  clientId: string
  clientSecret: string
  tenantId: string
  redirectUri?: string
  scopes?: string[]
  retryPolicy?: RetryPolicy
  timeout?: number
  enableLogging?: boolean
}

/**
 * Graph API Paginated Response
 */
export interface GraphPagedResponse<T> {
  '@odata.context'?: string
  '@odata.count'?: number
  '@odata.nextLink'?: string
  value: T[]
}

/**
 * Batch Request Item
 */
export interface BatchRequestItem {
  id: string
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  url: string
  headers?: Record<string, string>
  body?: any
}

/**
 * Batch Response Item
 */
export interface BatchResponseItem {
  id: string
  status: number
  headers?: Record<string, string>
  body?: any
}

/**
 * Subscription (Webhook) for change notifications
 */
export interface GraphSubscription {
  id?: string
  resource: string
  changeType: string // "created,updated,deleted"
  notificationUrl: string
  expirationDateTime: string
  clientState?: string
  latestSupportedTlsVersion?: string
}

/**
 * Change Notification
 */
export interface GraphChangeNotification {
  subscriptionId: string
  subscriptionExpirationDateTime: string
  changeType: 'created' | 'updated' | 'deleted'
  resource: string
  resourceData?: {
    '@odata.type': string
    '@odata.id': string
    id: string
  }
  clientState?: string
  tenantId: string
}

/**
 * Permission Scope Categories
 */
export enum GraphPermissionScope {
  // User scopes
  USER_READ = 'User.Read',
  USER_READ_ALL = 'User.Read.All',
  USER_READ_WRITE = 'User.ReadWrite',
  USER_READ_WRITE_ALL = 'User.ReadWrite.All',

  // Calendar scopes
  CALENDARS_READ = 'Calendars.Read',
  CALENDARS_READ_WRITE = 'Calendars.ReadWrite',
  CALENDARS_READ_SHARED = 'Calendars.Read.Shared',
  CALENDARS_READ_WRITE_SHARED = 'Calendars.ReadWrite.Shared',

  // Mail scopes
  MAIL_READ = 'Mail.Read',
  MAIL_READ_WRITE = 'Mail.ReadWrite',
  MAIL_SEND = 'Mail.Send',

  // Teams scopes
  CHANNEL_MESSAGE_READ = 'ChannelMessage.Read.All',
  CHANNEL_MESSAGE_SEND = 'ChannelMessage.Send',
  CHAT_READ = 'Chat.Read',
  CHAT_READ_WRITE = 'Chat.ReadWrite',
  TEAM_READ = 'Team.ReadBasic.All',

  // Files scopes
  FILES_READ = 'Files.Read',
  FILES_READ_ALL = 'Files.Read.All',
  FILES_READ_WRITE = 'Files.ReadWrite',
  FILES_READ_WRITE_ALL = 'Files.ReadWrite.All',
}
