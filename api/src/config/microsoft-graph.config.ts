/**
 * Microsoft Graph API Configuration
 *
 * Centralized configuration for Graph API endpoints, scopes, retry policies,
 * and timeout settings. Used by the MicrosoftGraphService.
 */

import { RetryPolicy, GraphServiceConfig, GraphPermissionScope } from '../types/microsoft-graph.types'

/**
 * Microsoft Graph API Base URL
 */
export const GRAPH_API_BASE_URL = 'https://graph.microsoft.com/v1.0'
export const GRAPH_API_BETA_URL = 'https://graph.microsoft.com/beta'

/**
 * Microsoft Identity Platform URLs
 */
export const MICROSOFT_LOGIN_BASE_URL = 'https://login.microsoftonline.com'
export const OAUTH_TOKEN_ENDPOINT = (tenantId: string) =>
  `${MICROSOFT_LOGIN_BASE_URL}/${tenantId}/oauth2/v2.0/token`
export const OAUTH_AUTHORIZE_ENDPOINT = (tenantId: string) =>
  `${MICROSOFT_LOGIN_BASE_URL}/${tenantId}/oauth2/v2.0/authorize`

/**
 * Default Retry Policy for Graph API requests
 * Implements exponential backoff with jitter
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 32000, // 32 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [
    408, // Request Timeout
    429, // Too Many Requests (Rate Limit)
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ],
}

/**
 * Aggressive Retry Policy for critical operations
 */
export const AGGRESSIVE_RETRY_POLICY: RetryPolicy = {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

/**
 * Conservative Retry Policy for non-critical operations
 */
export const CONSERVATIVE_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  initialDelayMs: 2000,
  maxDelayMs: 16000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 503, 504],
}

/**
 * Default timeout for Graph API requests (in milliseconds)
 */
export const DEFAULT_REQUEST_TIMEOUT = 30000 // 30 seconds

/**
 * Token expiration buffer (refresh tokens this many seconds before they expire)
 */
export const TOKEN_EXPIRATION_BUFFER_SECONDS = 300 // 5 minutes

/**
 * Token cache TTL (time to live in seconds)
 */
export const TOKEN_CACHE_TTL_SECONDS = 3600 // 1 hour

/**
 * Maximum number of tokens to cache in memory
 */
export const MAX_TOKEN_CACHE_SIZE = 1000

/**
 * Rate limit defaults
 */
export const RATE_LIMIT_CONFIG = {
  maxRequestsPerSecond: 10,
  maxRequestsPerMinute: 600,
  burstLimit: 20,
}

/**
 * Common Graph API Scopes by Category
 */
export const GRAPH_SCOPES = {
  // Basic user scopes (typically for delegated access)
  USER_BASIC: [
    GraphPermissionScope.USER_READ,
    'openid',
    'profile',
    'email',
  ],

  // Calendar scopes
  CALENDAR_READ: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.CALENDARS_READ,
  ],
  CALENDAR_WRITE: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.CALENDARS_READ_WRITE,
  ],
  CALENDAR_SHARED: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.CALENDARS_READ_SHARED,
    GraphPermissionScope.CALENDARS_READ_WRITE_SHARED,
  ],

  // Mail scopes
  MAIL_READ: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.MAIL_READ,
  ],
  MAIL_SEND: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.MAIL_READ,
    GraphPermissionScope.MAIL_SEND,
  ],
  MAIL_FULL: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.MAIL_READ_WRITE,
    GraphPermissionScope.MAIL_SEND,
  ],

  // Teams scopes
  TEAMS_READ: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.TEAM_READ,
    GraphPermissionScope.CHANNEL_MESSAGE_READ,
  ],
  TEAMS_WRITE: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.TEAM_READ,
    GraphPermissionScope.CHANNEL_MESSAGE_READ,
    GraphPermissionScope.CHANNEL_MESSAGE_SEND,
  ],
  TEAMS_CHAT: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.CHAT_READ,
    GraphPermissionScope.CHAT_READ_WRITE,
  ],

  // Files scopes
  FILES_READ: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.FILES_READ,
  ],
  FILES_WRITE: [
    GraphPermissionScope.USER_READ,
    GraphPermissionScope.FILES_READ_WRITE,
  ],

  // Application scopes (for app-only access)
  APP_FULL_ACCESS: [
    GraphPermissionScope.USER_READ_ALL,
    GraphPermissionScope.CALENDARS_READ_WRITE,
    GraphPermissionScope.MAIL_READ_WRITE,
    GraphPermissionScope.CHANNEL_MESSAGE_READ,
  ],
}

/**
 * Common Graph API Endpoints
 */
export const GRAPH_ENDPOINTS = {
  // User endpoints
  ME: '/me',
  USERS: '/users',
  USER_BY_ID: (userId: string) => `/users/${userId}`,
  USER_PHOTO: (userId?: string) => userId ? '/users/${userId}/photo` : '/me/photo',

  // Calendar endpoints
  MY_CALENDARS: '/me/calendars',
  MY_EVENTS: '/me/events',
  MY_CALENDAR_VIEW: '/me/calendarView',
  USER_CALENDARS: (userId: string) => `/users/${userId}/calendars`,
  USER_EVENTS: (userId: string) => `/users/${userId}/events`,
  CALENDAR_EVENTS: (calendarId: string) => `/me/calendars/${calendarId}/events`,
  EVENT_BY_ID: (eventId: string) => `/me/events/${eventId}`,

  // Mail endpoints
  MY_MESSAGES: '/me/messages',
  MY_MAIL_FOLDERS: '/me/mailFolders',
  SEND_MAIL: '/me/sendMail',
  MESSAGE_BY_ID: (messageId: string) => `/me/messages/${messageId}`,
  FOLDER_MESSAGES: (folderId: string) => `/me/mailFolders/${folderId}/messages`,

  // Teams endpoints
  MY_TEAMS: '/me/joinedTeams',
  TEAM_BY_ID: (teamId: string) => `/teams/${teamId}`,
  TEAM_CHANNELS: (teamId: string) => `/teams/${teamId}/channels`,
  CHANNEL_BY_ID: (teamId: string, channelId: string) => `/teams/${teamId}/channels/${channelId}`,
  CHANNEL_MESSAGES: (teamId: string, channelId: string) =>
    `/teams/${teamId}/channels/${channelId}/messages`,
  SEND_CHANNEL_MESSAGE: (teamId: string, channelId: string) =>
    `/teams/${teamId}/channels/${channelId}/messages`,
  MY_CHATS: '/me/chats',
  CHAT_MESSAGES: (chatId: string) => `/chats/${chatId}/messages`,

  // Files endpoints (OneDrive)
  MY_DRIVE: '/me/drive',
  MY_DRIVE_ROOT: '/me/drive/root',
  MY_DRIVE_CHILDREN: '/me/drive/root/children',
  DRIVE_ITEM: (itemId: string) => `/me/drive/items/${itemId}`,
  DRIVE_ITEM_CHILDREN: (itemId: string) => `/me/drive/items/${itemId}/children`,

  // Group endpoints
  GROUPS: '/groups',
  GROUP_BY_ID: (groupId: string) => `/groups/${groupId}`,
  GROUP_MEMBERS: (groupId: string) => `/groups/${groupId}/members`,

  // Subscription endpoints (webhooks)
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTION_BY_ID: (subscriptionId: string) => `/subscriptions/${subscriptionId}`,

  // Batch endpoint
  BATCH: '/$batch',
}

/**
 * Graph API Request Headers
 */
export const GRAPH_HEADERS = {
  CONTENT_TYPE_JSON: { 'Content-Type': 'application/json' },
  PREFER_MINIMAL: { Prefer: 'return=minimal' },
  PREFER_REPRESENTATION: { Prefer: 'return=representation' },
  CONSISTENCY_EVENTUAL: { ConsistencyLevel: 'eventual' },
}

/**
 * Common query parameters
 */
export const GRAPH_QUERY_PARAMS = {
  TOP: '$top',
  SKIP: '$skip',
  SELECT: '$select',
  FILTER: '$filter',
  EXPAND: '$expand',
  ORDER_BY: '$orderby',
  SEARCH: '$search',
  COUNT: '$count',
}

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 999,
}

/**
 * Get Graph Service Configuration from environment variables
 */
export const getGraphServiceConfig = (): GraphServiceConfig => {
  const clientId = process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.AZURE_AD_TENANT_ID || process.env.MICROSOFT_TENANT_ID
  const redirectUri = process.env.AZURE_AD_REDIRECT_URI || process.env.MICROSOFT_REDIRECT_URI

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      'Missing required Microsoft Graph configuration. Please set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID environment variables.'
    )
  }

  return {
    clientId,
    clientSecret,
    tenantId,
    redirectUri,
    scopes: GRAPH_SCOPES.USER_BASIC,
    retryPolicy: DEFAULT_RETRY_POLICY,
    timeout: DEFAULT_REQUEST_TIMEOUT,
    enableLogging: process.env.NODE_ENV !== 'production',
  }
}

/**
 * Get scope string from scope array
 */
export const getScopeString = (scopes: string[]): string => {
  return scopes.join(' ')
}

/**
 * Check if a scope includes offline access (refresh token)
 */
export const includesOfflineAccess = (scopes: string[]): boolean => {
  return scopes.includes('offline_access')
}

/**
 * Add offline access to scopes if not present
 */
export const ensureOfflineAccess = (scopes: string[]): string[] => {
  if (!includesOfflineAccess(scopes)) {
    return [...scopes, 'offline_access']
  }
  return scopes
}

/**
 * Build authorization URL for OAuth flow
 */
export const buildAuthorizationUrl = (
  tenantId: string,
  clientId: string,
  redirectUri: string,
  scopes: string[],
  state?: string,
  prompt: 'select_account' | 'consent' | 'login' | 'none' = 'select_account'
): string => {
  const scopeString = getScopeString(ensureOfflineAccess(scopes))
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: scopeString,
    prompt,
  })

  if (state) {
    params.set('state', state)
  }

  return `${OAUTH_AUTHORIZE_ENDPOINT(tenantId)}?${params.toString()}`
}

/**
 * Error code mappings for better error handling
 */
export const GRAPH_ERROR_CODES = {
  // Authentication errors
  INVALID_AUTH_TOKEN: 'InvalidAuthenticationToken',
  UNAUTHENTICATED: 'Unauthenticated',
  UNAUTHORIZED: 'Unauthorized',
  ACCESS_DENIED: 'AccessDenied',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'ActivityLimitReached',
  TOO_MANY_REQUESTS: 'TooManyRequests',

  // Resource errors
  ITEM_NOT_FOUND: 'ItemNotFound',
  RESOURCE_NOT_FOUND: 'ResourceNotFound',
  MALWARE_DETECTED: 'MalwareDetected',

  // Request errors
  INVALID_REQUEST: 'InvalidRequest',
  BAD_REQUEST: 'BadRequest',
  REQUEST_TIMEOUT: 'RequestTimeout',

  // Service errors
  SERVICE_NOT_AVAILABLE: 'ServiceNotAvailable',
  INTERNAL_SERVER_ERROR: 'InternalServerError',
  GENERAL_EXCEPTION: 'GeneralException',
}

export default {
  GRAPH_API_BASE_URL,
  GRAPH_API_BETA_URL,
  DEFAULT_RETRY_POLICY,
  AGGRESSIVE_RETRY_POLICY,
  CONSERVATIVE_RETRY_POLICY,
  DEFAULT_REQUEST_TIMEOUT,
  TOKEN_EXPIRATION_BUFFER_SECONDS,
  TOKEN_CACHE_TTL_SECONDS,
  MAX_TOKEN_CACHE_SIZE,
  RATE_LIMIT_CONFIG,
  GRAPH_SCOPES,
  GRAPH_ENDPOINTS,
  GRAPH_HEADERS,
  GRAPH_QUERY_PARAMS,
  PAGINATION,
  GRAPH_ERROR_CODES,
  getGraphServiceConfig,
  getScopeString,
  buildAuthorizationUrl,
}
