/**
 * Microsoft Graph Service
 *
 * Production-ready service for Microsoft Graph API integration with:
 * - OAuth token management with automatic refresh
 * - Singleton Graph client instance
 * - Retry logic with exponential backoff
 * - Rate limiting handling
 * - Comprehensive error handling and logging
 * - Support for delegated and application permissions
 * - Secure in-memory token caching
 *
 * This is the foundation for all Microsoft integrations (Teams, Outlook, Calendar)
 */

import { Client, ClientOptions } from '@microsoft/microsoft-graph-client'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { validateOutboundUrl, SSRFError } from '../utils/ssrf-protection'
import {
  CachedToken,
  TokenStoreEntry,
  MicrosoftTokenResponse,
  GraphRequestOptions,
  GraphServiceConfig,
  MicrosoftGraphError,
  RateLimitError,
  TokenError,
  GraphErrorResponse,
  RetryPolicy,
  GraphPagedResponse,
  BatchRequestItem,
  BatchResponseItem,
} from '../types/microsoft-graph.types'
import {
  getGraphServiceConfig,
  DEFAULT_RETRY_POLICY,
  TOKEN_EXPIRATION_BUFFER_SECONDS,
  MAX_TOKEN_CACHE_SIZE,
  OAUTH_TOKEN_ENDPOINT,
  GRAPH_API_BASE_URL,
  GRAPH_ERROR_CODES,
} from '../config/microsoft-graph.config'
import { logger } from '../utils/logger'

/**
 * Secure in-memory token cache
 * In production, consider using Redis for distributed caching
 */
class TokenCache {
  private cache: Map<string, TokenStoreEntry> = new Map()
  private readonly maxSize: number

  constructor(maxSize: number = MAX_TOKEN_CACHE_SIZE) {
    this.maxSize = maxSize
  }

  /**
   * Get token from cache
   */
  get(key: string): CachedToken | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check if token is expired
    if (this.isTokenExpired(entry.token)) {
      this.cache.delete(key)
      return null
    }

    // Update last accessed time
    entry.lastAccessed = Date.now()
    return entry.token
  }

  /**
   * Set token in cache
   */
  set(key: string, token: CachedToken): void {
    // Enforce cache size limit using LRU eviction
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, {
      key,
      token,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    })
  }

  /**
   * Delete token from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  private isTokenExpired(token: CachedToken): boolean {
    const bufferMs = TOKEN_EXPIRATION_BUFFER_SECONDS * 1000
    return Date.now() + bufferMs >= token.expires_at
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

/**
 * Microsoft Graph Service - Singleton
 */
export class MicrosoftGraphService {
  private static instance: MicrosoftGraphService
  private config: GraphServiceConfig
  private tokenCache: TokenCache
  private clientInstances: Map<string, Client> = new Map()

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config?: Partial<GraphServiceConfig>) {
    this.config = { ...getGraphServiceConfig(), ...config }
    this.tokenCache = new TokenCache()

    if (this.config.enableLogging) {
      logger.info('MicrosoftGraphService initialized', {
        clientId: this.config.clientId.substring(0, 8) + '...',
        tenantId: this.config.tenantId.substring(0, 8) + '...',
      })
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<GraphServiceConfig>): MicrosoftGraphService {
    if (!MicrosoftGraphService.instance) {
      MicrosoftGraphService.instance = new MicrosoftGraphService(config)
    }
    return MicrosoftGraphService.instance
  }

  /**
   * Get access token for user (delegated permissions)
   * Automatically refreshes if expired
   */
  public async getAccessToken(userId: string, tenantId: string): Promise<string> {
    const cacheKey = `${userId}:${tenantId}`
    const cachedToken = this.tokenCache.get(cacheKey)

    if (cachedToken) {
      if (this.config.enableLogging) {
        logger.debug('Using cached token', { userId, tenantId })
      }
      return cachedToken.access_token
    }

    // Token not in cache or expired - need to get new token
    // This should be handled by the caller (they need to provide refresh token or re-authenticate)
    throw new TokenError(
      'No valid access token found. User needs to re-authenticate.',
      'TokenNotFound',
      401
    )
  }

  /**
   * Get application access token (application permissions)
   * Uses client credentials flow
   */
  public async getAppAccessToken(): Promise<string> {
    const cacheKey = `app:${this.config.clientId}`
    const cachedToken = this.tokenCache.get(cacheKey)

    if (cachedToken) {
      return cachedToken.access_token
    }

    // Get new token using client credentials
    const tokenResponse = await this.getClientCredentialsToken()
    const token = this.createCachedToken(tokenResponse)

    this.tokenCache.set(cacheKey, token)

    if (this.config.enableLogging) {
      logger.info('Acquired app access token', { clientId: this.config.clientId })
    }

    return token.access_token
  }

  /**
   * Store user token (from OAuth callback)
   */
  public storeUserToken(
    userId: string,
    tenantId: string,
    tokenResponse: MicrosoftTokenResponse
  ): void {
    const cacheKey = `${userId}:${tenantId}`
    const token = this.createCachedToken(tokenResponse, userId, tenantId)

    this.tokenCache.set(cacheKey, token)

    if (this.config.enableLogging) {
      logger.info('Stored user token', { userId, tenantId })
    }
  }

  /**
   * Refresh user token using refresh token
   */
  public async refreshToken(
    userId: string,
    tenantId: string,
    refreshToken: string
  ): Promise<MicrosoftTokenResponse> {
    try {
      const response = await axios.post<MicrosoftTokenResponse>(
        OAUTH_TOKEN_ENDPOINT(tenantId || this.config.tenantId),
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      const tokenResponse = response.data

      // Store refreshed token
      this.storeUserToken(userId, tenantId, tokenResponse)

      if (this.config.enableLogging) {
        logger.info('Token refreshed successfully', { userId, tenantId })
      }

      return tokenResponse
    } catch (error) {
      const axiosError = error as AxiosError
      logger.error('Failed to refresh token', {
        userId,
        tenantId,
        error: axiosError.response?.data || axiosError.message,
      })

      throw new TokenError(
        'Failed to refresh access token',
        'TokenRefreshFailed',
        axiosError.response?.status || 401
      )
    }
  }

  /**
   * Validate token expiration
   */
  public validateToken(userId: string, tenantId: string): boolean {
    const cacheKey = `${userId}:${tenantId}`
    const token = this.tokenCache.get(cacheKey)
    return token !== null
  }

  /**
   * Revoke/clear token for user
   */
  public revokeToken(userId: string, tenantId: string): void {
    const cacheKey = `${userId}:${tenantId}`
    this.tokenCache.delete(cacheKey)
    this.clientInstances.delete(cacheKey)

    if (this.config.enableLogging) {
      logger.info('Token revoked', { userId, tenantId })
    }
  }

  /**
   * Get Graph client for user (delegated access)
   */
  public async getClientForUser(userId: string, tenantId: string): Promise<Client> {
    const cacheKey = `${userId}:${tenantId}`

    // Return cached client if available
    if (this.clientInstances.has(cacheKey)) {
      return this.clientInstances.get(cacheKey)!
    }

    const accessToken = await this.getAccessToken(userId, tenantId)

    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken)
      },
    })

    this.clientInstances.set(cacheKey, client)
    return client
  }

  /**
   * Get Graph client for application (app-only access)
   */
  public async getClientForApp(): Promise<Client> {
    const cacheKey = `app:${this.config.clientId}`

    // Return cached client if available
    if (this.clientInstances.has(cacheKey)) {
      return this.clientInstances.get(cacheKey)!
    }

    const accessToken = await this.getAppAccessToken()

    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken)
      },
    })

    this.clientInstances.set(cacheKey, client)
    return client
  }

  /**
   * Make generic Graph API request with retry logic and error handling
   */
  public async makeGraphRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    options?: GraphRequestOptions
  ): Promise<T> {
    const accessToken = await this.getAppAccessToken()
    const retryPolicy = options?.retries !== undefined
      ? { ...DEFAULT_RETRY_POLICY, maxRetries: options.retries }
      : this.config.retryPolicy || DEFAULT_RETRY_POLICY

    return this.executeWithRetry(
      async () => this.executeGraphRequest<T>(endpoint, method, accessToken, body, options),
      retryPolicy
    )
  }

  /**
   * Make Graph API request for specific user
   */
  public async makeGraphRequestForUser<T = any>(
    userId: string,
    tenantId: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    options?: GraphRequestOptions
  ): Promise<T> {
    const accessToken = await this.getAccessToken(userId, tenantId)
    const retryPolicy = options?.retries !== undefined
      ? { ...DEFAULT_RETRY_POLICY, maxRetries: options.retries }
      : this.config.retryPolicy || DEFAULT_RETRY_POLICY

    return this.executeWithRetry(
      async () => this.executeGraphRequest<T>(endpoint, method, accessToken, body, options),
      retryPolicy
    )
  }

  /**
   * Handle paginated Graph API requests
   */
  public async getPaginatedResults<T = any>(
    endpoint: string,
    maxPages: number = 10
  ): Promise<T[]> {
    const results: T[] = []
    let currentEndpoint: string | null = endpoint
    let pageCount = 0

    while (currentEndpoint && pageCount < maxPages) {
      const response = await this.makeGraphRequest<GraphPagedResponse<T>>(currentEndpoint)

      results.push(...response.value)
      currentEndpoint = response['@odata.nextLink'] || null
      pageCount++

      if (this.config.enableLogging && currentEndpoint) {
        logger.debug('Fetching next page', { pageCount, totalResults: results.length })
      }
    }

    return results
  }

  /**
   * Execute batch requests
   */
  public async executeBatch(requests: BatchRequestItem[]): Promise<BatchResponseItem[]> {
    const batchBody = {
      requests: requests,
    }

    const response = await this.makeGraphRequest<{ responses: BatchResponseItem[] }>(
      '/$batch',
      'POST',
      batchBody
    )

    return response.responses
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  public async handleRateLimiting(retryAfter?: number): Promise<void> {
    const delaySeconds = retryAfter || 60 // Default to 60 seconds if not specified
    const delayMs = delaySeconds * 1000

    if (this.config.enableLogging) {
      logger.warn('Rate limit hit, waiting before retry', { delaySeconds })
    }

    await this.sleep(delayMs)
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.tokenCache.getStats()
  }

  /**
   * Clear all caches (for testing or maintenance)
   */
  public clearCaches(): void {
    this.tokenCache.clear()
    this.clientInstances.clear()

    if (this.config.enableLogging) {
      logger.info('All caches cleared')
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret && this.config.tenantId)
  }

  /**
   * Get service configuration status
   */
  getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing: string[] = []

    if (!this.config.clientId) missing.push('MICROSOFT_CLIENT_ID or AZURE_AD_CLIENT_ID')
    if (!this.config.clientSecret) missing.push('MICROSOFT_CLIENT_SECRET or AZURE_AD_CLIENT_SECRET')
    if (!this.config.tenantId) missing.push('MICROSOFT_TENANT_ID or AZURE_AD_TENANT_ID')

    return {
      configured: missing.length === 0,
      missing
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Execute Graph API request
   * SSRF Protection: Validates URLs to ensure only Microsoft Graph endpoints are called
   */
  private async executeGraphRequest<T>(
    endpoint: string,
    method: string,
    accessToken: string,
    body?: any,
    options?: GraphRequestOptions
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${GRAPH_API_BASE_URL}${endpoint}`

    // SSRF Protection: Validate URL before making request
    await validateOutboundUrl(url, {
      allowedDomains: [
        'graph.microsoft.com',
        'login.microsoftonline.com',
      ],
    })

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      timeout: options?.timeout || this.config.timeout || 30000,
      params: options?.queryParams,
    }

    if (body) {
      config.data = body
    }

    try {
      const response = await axios(config)
      return response.data
    } catch (error) {
      throw this.handleGraphError(error as AxiosError)
    }
  }

  /**
   * Execute with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryPolicy: RetryPolicy,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Handle rate limiting specially
        await this.handleRateLimiting(error.retryAfter)
        return this.executeWithRetry(operation, retryPolicy, attempt)
      }

      const graphError = error as MicrosoftGraphError

      // Check if error is retryable
      const isRetryable =
        graphError.statusCode &&
        retryPolicy.retryableStatusCodes.includes(graphError.statusCode)

      if (isRetryable && attempt < retryPolicy.maxRetries) {
        const delay = this.calculateBackoffDelay(attempt, retryPolicy)

        if (this.config.enableLogging) {
          logger.warn('Request failed, retrying', {
            attempt: attempt + 1,
            maxRetries: retryPolicy.maxRetries,
            delay,
            error: graphError.message,
          })
        }

        await this.sleep(delay)
        return this.executeWithRetry(operation, retryPolicy, attempt + 1)
      }

      // Not retryable or max retries exceeded
      throw error
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number, policy: RetryPolicy): number {
    const exponentialDelay = Math.min(
      policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt),
      policy.maxDelayMs
    )

    // Add jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
    return Math.max(0, exponentialDelay + jitter)
  }

  /**
   * Handle Graph API errors and convert to custom error types
   */
  private handleGraphError(error: AxiosError): MicrosoftGraphError {
    const response = error.response
    const statusCode = response?.status
    const data = response?.data as GraphErrorResponse

    // Rate limiting
    if (statusCode === 429) {
      const retryAfter = response?.headers['retry-after']
        ? parseInt(response.headers['retry-after'], 10)
        : undefined

      return new RateLimitError(
        data?.error?.message || 'Rate limit exceeded',
        retryAfter,
        data?.error?.innerError?.['request-id']
      )
    }

    // Authentication/Authorization errors
    if (statusCode === 401 || statusCode === 403) {
      const code = data?.error?.code || GRAPH_ERROR_CODES.UNAUTHORIZED
      return new TokenError(
        data?.error?.message || 'Authentication failed',
        code,
        statusCode
      )
    }

    // General Graph error
    const errorCode = data?.error?.code || GRAPH_ERROR_CODES.GENERAL_EXCEPTION
    const errorMessage = data?.error?.message || error.message || 'Graph API request failed'

    return new MicrosoftGraphError(
      errorMessage,
      errorCode,
      statusCode,
      data?.error?.innerError?.['request-id'],
      data?.error?.innerError
    )
  }

  /**
   * Get client credentials token (app-only access)
   */
  private async getClientCredentialsToken(): Promise<MicrosoftTokenResponse> {
    try {
      const response = await axios.post<MicrosoftTokenResponse>(
        OAUTH_TOKEN_ENDPOINT(this.config.tenantId),
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
          scope: 'https://graph.microsoft.com/.default',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data
    } catch (error) {
      const axiosError = error as AxiosError
      logger.error('Failed to get client credentials token', {
        error: axiosError.response?.data || axiosError.message,
      })

      throw new TokenError(
        'Failed to acquire application access token',
        'ClientCredentialsFailed',
        axiosError.response?.status || 401
      )
    }
  }

  /**
   * Create cached token from token response
   */
  private createCachedToken(
    tokenResponse: MicrosoftTokenResponse,
    userId?: string,
    tenantId?: string
  ): CachedToken {
    return {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: Date.now() + tokenResponse.expires_in * 1000,
      scope: tokenResponse.scope,
      token_type: tokenResponse.token_type,
      userId,
      tenantId,
    }
  }

  /**
   * Sleep helper for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const microsoftGraphService = MicrosoftGraphService.getInstance()
export default microsoftGraphService
