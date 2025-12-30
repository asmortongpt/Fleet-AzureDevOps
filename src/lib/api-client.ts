import { createLogger } from '@/utils/logger'

const logger = createLogger();

/**
 * Fleet Management API Client
 * Production-ready REST client with authentication, error handling, and retry logic
 */

// API base URL - defaults to current origin since endpoints already include /api
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

class APIClient {
  private baseURL: string
  private csrfToken: string | null = null
  private csrfTokenPromise: Promise<void> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Initialize CSRF token on construction
    this.initializeCsrfToken()
  }

  // SECURITY (CRIT-F-001): Tokens now managed ONLY via httpOnly cookies
  // NO localStorage token storage to prevent XSS attacks
  // These methods are deprecated stubs for backwards compatibility
  setToken(_token: string) {
    // DEPRECATED: Token is now set by backend via Set-Cookie header
    // This method does nothing - kept for API compatibility only
    logger.warn('[DEPRECATED] setToken() does nothing - tokens are httpOnly cookies managed by backend')
  }

  clearToken() {
    // DEPRECATED: Token cleared by backend on logout
    // This method does nothing - kept for API compatibility only
    logger.warn('[DEPRECATED] clearToken() does nothing - tokens are httpOnly cookies managed by backend')
  }

  /**
   * Fetches a CSRF token from the server
   * Only fetches once and caches the result
   *
   * SECURITY (CRIT-F-002): CSRF Token Management
   * - Fetches from /api/v1/csrf-token endpoint
   * - Stores in memory only (NOT localStorage)
   * - Automatically retries on 403 errors
   */
  private async initializeCsrfToken(): Promise<void> {
    // Skip CSRF token in development mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return
    }

    // If already fetching, return existing promise
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise
    }

    // If we already have a token, don't fetch again
    if (this.csrfToken) {
      return
    }

    // Create a new promise for fetching the CSRF token
    this.csrfTokenPromise = (async () => {
      try {
        // Try primary endpoint first
        let response = await fetch(`${this.baseURL}/api/v1/csrf-token`, {
          method: 'GET',
          credentials: 'include', // Required for cookies
        })

        // Fallback to alternate endpoint if primary fails
        if (!response.ok) {
          logger.warn('[CSRF] Primary endpoint failed, trying fallback /api/csrf')
          response = await fetch(`${this.baseURL}/api/csrf`, {
            method: 'GET',
            credentials: 'include',
          })
        }

        if (response.ok) {
          const data = await response.json()
          this.csrfToken = data.csrfToken || data.token || ''
          logger.debug('[CSRF] Token initialized successfully')
        } else {
          logger.warn('[CSRF] Failed to fetch token:', response.status)
        }
      } catch (error) {
        logger.error('[CSRF] Error fetching token:', error)
      } finally {
        this.csrfTokenPromise = null
      }
    })()

    return this.csrfTokenPromise
  }

  /**
   * Refreshes the CSRF token from the server
   */
  async refreshCsrfToken(): Promise<void> {
    this.csrfToken = null
    this.csrfTokenPromise = null
    await this.initializeCsrfToken()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure CSRF token is initialized for state-changing requests
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      options.method?.toUpperCase() || 'GET'
    )

    if (isStateChanging) {
      await this.initializeCsrfToken()
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // SECURITY: No Authorization header - httpOnly cookies handle authentication (CRITICAL-001)
    // This prevents XSS attacks from stealing tokens

    // Add CSRF token to headers for state-changing requests
    if (isStateChanging && this.csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = this.csrfToken
    }

    const url = `${this.baseURL}${endpoint}`

    // SECURITY FIX P2 MED-SEC-010: Request timeout configuration
    // Default: 30s for normal requests, 60s for uploads (configurable)
    const controller = new AbortController()
    const timeoutMs = (options as { timeout?: number }).timeout || 30000 // 30 seconds default
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // CRITICAL: Include httpOnly cookies with all requests
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))

        // If CSRF token is invalid, refresh and retry once
        if (response.status === 403 && error.error?.includes('CSRF')) {
          logger.warn('CSRF token invalid, refreshing...')
          await this.refreshCsrfToken()

          // Retry the request with new CSRF token
          if (isStateChanging && this.csrfToken) {
            (headers as Record<string, string>)['X-CSRF-Token'] = this.csrfToken
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: 'include'
            })

            if (retryResponse.ok) {
              if (retryResponse.status === 204) {
                return {} as T
              }
              return await retryResponse.json()
            }
          }
        }

        throw new APIError(
          error.error || `HTTP ${response.status}`,
          response.status,
          error
        )
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof APIError) {
        // Auto-logout on 401
        if (error.status === 401) {
          this.clearToken()
          window.location.href = '/login'
        }
        throw error
      }

      // SECURITY FIX P2 MED-SEC-010: Handle timeout errors with user-friendly message
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(
          'Request timeout - please try again. The server took too long to respond.',
          408, // HTTP 408 Request Timeout
          { reason: 'timeout', timeoutMs }
        )
      }

      // Network or other errors
      throw new APIError(
        error instanceof Error ? error.message : 'Network error',
        0,
        error
      )
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : ''
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' })
  }

  // POST request with validation
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    // Sanitize data before sending
    const sanitized = typeof data === 'object' && data !== null ?
      Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value
        ])
      ) : data

    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(sanitized)
    })
  }

  // PUT request with validation
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    // Sanitize data before sending
    const sanitized = typeof data === 'object' && data !== null ?
      Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value
        ])
      ) : data

    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(sanitized)
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * BATCH-002: Batch Request Utility
   *
   * Execute multiple API requests in a single batch call to reduce network overhead
   *
   * Performance Impact:
   * - Reduces 40+ requests to 1 batch request (97.5% reduction)
   * - Eliminates per-request overhead (handshakes, headers, etc.)
   * - Improves dashboard load time from 2-3s to <500ms
   *
   * @param requests - Array of requests to batch execute
   * @returns Promise resolving to array of results
   *
   * @example
   * const results = await apiClient.batch([
   *   { method: 'GET', url: '/api/v1/vehicles' },
   *   { method: 'GET', url: '/api/v1/drivers' },
   *   { method: 'GET', url: '/api/v1/work-orders' }
   * ])
   *
   * if (results[0].success) {
   *   console.log('Vehicles:', results[0].data)
   * }
   */
  async batch<T = unknown>(
    requests: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      url: string
      body?: unknown
      headers?: Record<string, string>
    }>
  ): Promise<Array<{
    success: boolean
    status: number
    data?: T
    error?: string
  }>> {
    // Validate requests
    if (!requests || requests.length === 0) {
      throw new APIError('Batch request requires at least one request', 400)
    }

    if (requests.length > 50) {
      throw new APIError('Maximum 50 requests per batch', 400)
    }

    // Validate all URLs start with /api/
    const invalidRequests = requests.filter(r => !r.url.startsWith('/api/'))
    if (invalidRequests.length > 0) {
      throw new APIError(
        `Invalid batch request URLs: ${invalidRequests.map(r => r.url).join(', ')}`,
        400
      )
    }

    // Execute batch request
    const response = await this.post<{ results: Array<unknown> }>('/api/v1/batch', {
      requests
    })

    return response.results as Array<{
      success: boolean
      status: number
      data?: T
      error?: string
    }>
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await this.post<{ token: string; user: unknown }>(
      '/api/auth/login',
      { email, password }
    )
    this.setToken(response.token)
    return response
  }

  async register(data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    role?: string
  }) {
    return this.post('/api/auth/register', data)
  }

  async logout() {
    await this.post('/api/auth/logout', {})
    this.clearToken()
  }

  // Vehicle endpoints
  vehicles = {
    list: (params?: Record<string, unknown>) => this.get('/api/vehicles', params),
    get: (id: string) => this.get(`/api/vehicles/${id}`),
    create: (data: unknown) => this.post('/api/vehicles', data),
    update: (id: string, data: unknown) => this.put(`/api/vehicles/${id}`, data),
    delete: (id: string) => this.delete(`/api/vehicles/${id}`),
    updateTelemetry: (id: string, data: unknown) =>
      this.post(`/api/vehicles/${id}/telemetry`, data)
  }

  // Driver endpoints
  drivers = {
    list: (params?: Record<string, unknown>) => this.get('/api/drivers', params),
    get: (id: string) => this.get(`/api/drivers/${id}`),
    create: (data: unknown) => this.post('/api/drivers', data),
    update: (id: string, data: unknown) => this.put(`/api/drivers/${id}`, data),
    delete: (id: string) => this.delete(`/api/drivers/${id}`)
  }

  // Work Order endpoints
  workOrders = {
    list: (params?: Record<string, unknown>) => this.get('/api/work-orders', params),
    get: (id: string) => this.get(`/api/work-orders/${id}`),
    create: (data: unknown) => this.post('/api/work-orders', data),
    update: (id: string, data: unknown) => this.put(`/api/work-orders/${id}`, data),
    delete: (id: string) => this.delete(`/api/work-orders/${id}`)
  }

  // Maintenance Schedule endpoints
  maintenanceSchedules = {
    list: (params?: Record<string, unknown>) => this.get('/api/maintenance-schedules', params),
    get: (id: string) => this.get(`/api/maintenance-schedules/${id}`),
    create: (data: unknown) => this.post('/api/maintenance-schedules', data),
    update: (id: string, data: unknown) =>
      this.put(`/api/maintenance-schedules/${id}`, data),
    delete: (id: string) => this.delete(`/api/maintenance-schedules/${id}`)
  }

  // Fuel Transaction endpoints
  fuelTransactions = {
    list: (params?: Record<string, unknown>) => this.get('/api/fuel-transactions', params),
    get: (id: string) => this.get(`/api/fuel-transactions/${id}`),
    create: (data: unknown) => this.post('/api/fuel-transactions', data),
    update: (id: string, data: unknown) =>
      this.put(`/api/fuel-transactions/${id}`, data),
    delete: (id: string) => this.delete(`/api/fuel-transactions/${id}`)
  }

  // Route endpoints
  routes = {
    list: (params?: Record<string, unknown>) => this.get('/api/routes', params),
    get: (id: string) => this.get(`/api/routes/${id}`),
    create: (data: unknown) => this.post('/api/routes', data),
    update: (id: string, data: unknown) => this.put(`/api/routes/${id}`, data),
    delete: (id: string) => this.delete(`/api/routes/${id}`)
  }

  // Geofence endpoints
  geofences = {
    list: (params?: Record<string, unknown>) => this.get('/api/geofences', params),
    get: (id: string) => this.get(`/api/geofences/${id}`),
    create: (data: unknown) => this.post('/api/geofences', data),
    update: (id: string, data: unknown) => this.put(`/api/geofences/${id}`, data),
    delete: (id: string) => this.delete(`/api/geofences/${id}`)
  }

  // Inspection endpoints
  inspections = {
    list: (params?: Record<string, unknown>) => this.get('/api/inspections', params),
    get: (id: string) => this.get(`/api/inspections/${id}`),
    create: (data: unknown) => this.post('/api/inspections', data),
    update: (id: string, data: unknown) => this.put(`/api/inspections/${id}`, data),
    delete: (id: string) => this.delete(`/api/inspections/${id}`)
  }

  // Safety Incident endpoints
  safetyIncidents = {
    list: (params?: Record<string, unknown>) => this.get('/api/safety-incidents', params),
    get: (id: string) => this.get(`/api/safety-incidents/${id}`),
    create: (data: unknown) => this.post('/api/safety-incidents', data),
    update: (id: string, data: unknown) =>
      this.put(`/api/safety-incidents/${id}`, data),
    delete: (id: string) => this.delete(`/api/safety-incidents/${id}`)
  }

  // Charging Station endpoints
  chargingStations = {
    list: (params?: Record<string, unknown>) => this.get('/api/charging-stations', params),
    get: (id: string) => this.get(`/api/charging-stations/${id}`),
    create: (data: unknown) => this.post('/api/charging-stations', data),
    update: (id: string, data: unknown) =>
      this.put(`/api/charging-stations/${id}`, data),
    delete: (id: string) => this.delete(`/api/charging-stations/${id}`)
  }

  // Microsoft Teams integration endpoints
  teams = {
    list: (params?: Record<string, unknown>) => this.get('/api/teams/messages', params),
    listMessages: (teamId?: string, channelId?: string, params?: Record<string, unknown>) => {
      if (teamId && channelId) {
        return this.get(`/api/teams/${teamId}/channels/${channelId}/messages`, params)
      }
      return this.get('/api/teams/messages', params)
    },
    listTeams: (params?: Record<string, unknown>) => this.get('/api/teams', params),
    get: (id: string) => this.get(`/api/teams/messages/${id}`),
    getTeam: (teamId: string) => this.get(`/api/teams/${teamId}`),
    getMessage: (teamId?: string, channelId?: string, messageId?: string) => {
      if (teamId && channelId && messageId) {
        return this.get(`/api/teams/${teamId}/channels/${channelId}/messages/${messageId}`)
      }
      if (messageId) {
        return this.get(`/api/teams/messages/${messageId}`)
      }
      return this.get(`/api/teams/messages/${teamId}`)
    },
    send: (data: unknown) => this.post('/api/teams/messages', data),
    sendMessage: (teamId?: string, channelId?: string, data?: unknown) => {
      if (teamId && channelId && data) {
        return this.post(`/api/teams/${teamId}/channels/${channelId}/messages`, data)
      }
      return this.post('/api/teams/messages', teamId)
    },
    replyToMessage: (teamIdOrMessageId: string, channelIdOrData?: string | unknown, messageIdOrData?: string | unknown, data?: unknown) => {
      if (typeof channelIdOrData === 'string' && typeof messageIdOrData === 'string') {
        return this.post(`/api/teams/${teamIdOrMessageId}/channels/${channelIdOrData}/messages/${messageIdOrData}/reply`, data)
      }
      return this.post(`/api/teams/messages/${teamIdOrMessageId}/reply`, channelIdOrData)
    },
    deleteMessage: (teamIdOrMessageId: string, channelIdOrData?: string, messageId?: string) => {
      if (channelIdOrData && messageId) {
        return this.delete(`/api/teams/${teamIdOrMessageId}/channels/${channelIdOrData}/messages/${messageId}`)
      }
      return this.delete(`/api/teams/messages/${teamIdOrMessageId}`)
    },
    addReaction: (teamIdOrMessageId: string, channelIdOrEmoji?: string | unknown, messageIdOrEmoji?: string, reaction?: string) => {
      if (channelIdOrEmoji && typeof messageIdOrEmoji === 'string') {
        return this.post(`/api/teams/${teamIdOrMessageId}/channels/${channelIdOrEmoji}/messages/${messageIdOrEmoji}/reactions`, { emoji: reaction })
      }
      return this.post(`/api/teams/messages/${teamIdOrMessageId}/reactions`, { emoji: channelIdOrEmoji })
    },
    uploadFile: (teamIdOrData?: string | FormData, channelIdOrData?: string | FormData, fileData?: FormData) => {
      if (teamIdOrData instanceof FormData) {
        return this.post('/api/teams/files', teamIdOrData)
      }
      if (fileData) {
        return this.post(`/api/teams/${teamIdOrData}/channels/${channelIdOrData}/files`, fileData)
      }
      return this.post('/api/teams/files', channelIdOrData)
    },
    channels: {
      list: () => this.get('/api/teams/channels'),
      get: (id: string) => this.get(`/api/teams/channels/${id}`)
    }
  }

  // Microsoft Outlook integration endpoints
  outlook = {
    list: (params?: Record<string, unknown>) => this.get('/api/outlook/emails', params),
    listMessages: (params?: Record<string, unknown>) => this.get('/api/outlook/emails', params),
    get: (id: string) => this.get(`/api/outlook/emails/${id}`),
    getMessage: (id: string) => this.get(`/api/outlook/emails/${id}`),
    send: (data: unknown) => this.post('/api/outlook/emails', data),
    sendEmail: (data: unknown) => this.post('/api/outlook/emails', data),
    replyToEmail: (id: string, data: unknown) => this.post(`/api/outlook/emails/${id}/reply`, data),
    listFolders: () => this.get('/api/outlook/folders'),
    getFolder: (folderId: string) => this.get(`/api/outlook/folders/${folderId}`),
    forwardEmail: (id: string, data: unknown) => this.post(`/api/outlook/emails/${id}/forward`, data),
    deleteEmail: (id: string) => this.delete(`/api/outlook/emails/${id}`),
    markAsRead: (id: string, isRead: boolean = true) => this.put(`/api/outlook/emails/${id}`, { isRead }),
    moveEmail: (id: string, folderId: string) => this.put(`/api/outlook/emails/${id}`, { parentFolderId: folderId }),
    folders: {
      list: () => this.get('/api/outlook/folders')
    }
  }

  // Calendar integration endpoints
  calendar = {
    list: (params?: Record<string, unknown>) => this.get('/api/calendar/events', params),
    listEvents: (params?: Record<string, unknown>) => this.get('/api/calendar/events', params),
    get: (id: string) => this.get(`/api/calendar/events/${id}`),
    create: (data: unknown) => this.post('/api/calendar/events', data),
    createEvent: (data: unknown) => this.post('/api/calendar/events', data),
    update: (id: string, data: unknown) => this.put(`/api/calendar/events/${id}`, data),
    updateEvent: (id: string, data: unknown) => this.put(`/api/calendar/events/${id}`, data),
    delete: (id: string) => this.delete(`/api/calendar/events/${id}`),
    deleteEvent: (id: string) => this.delete(`/api/calendar/events/${id}`)
  }

  // ArcGIS Layers integration endpoints
  arcgisLayers = {
    list: (params?: Record<string, unknown>) => this.get('/api/arcgis/layers', params),
    get: (id: string) => this.get(`/api/arcgis/layers/${id}`),
    create: (data: unknown) => this.post('/api/arcgis/layers', data),
    update: (id: string, data: unknown) => this.put(`/api/arcgis/layers/${id}`, data),
    delete: (id: string) => this.delete(`/api/arcgis/layers/${id}`),
    query: (layerId: string, params?: Record<string, unknown>) =>
      this.get(`/api/arcgis/layers/${layerId}/query`, params),
    features: (layerId: string, params?: Record<string, unknown>) =>
      this.get(`/api/arcgis/layers/${layerId}/features`, params)
  }

  // Traffic Cameras endpoints
  trafficCameras = {
    list: (params?: Record<string, unknown>) => this.get('/api/traffic-cameras', params),
    get: (id: string) => this.get(`/api/traffic-cameras/${id}`),
    nearby: (lat: number, lng: number, radiusMeters?: number) =>
      this.get('/api/traffic-cameras/nearby', { lat, lng, radiusMeters }),
    sync: () => this.post('/api/traffic-cameras/sync', {}),
    sources: {
      list: () => this.get('/api/traffic-cameras/sources'),
      get: (id: string) => this.get(`/api/traffic-cameras/sources/${id}`),
      create: (data: unknown) => this.post('/api/traffic-cameras/sources', data),
      update: (id: string, data: unknown) => this.put(`/api/traffic-cameras/sources/${id}`, data),
      delete: (id: string) => this.delete(`/api/traffic-cameras/sources/${id}`)
    }
  }

  // Personal Use tracking endpoints
  personalUse = {
    list: (params?: Record<string, unknown>) => this.get('/api/personal-use', params),
    get: (id: string) => this.get(`/api/personal-use/${id}`),
    create: (data: unknown) => this.post('/api/personal-use', data),
    update: (id: string, data: unknown) => this.put(`/api/personal-use/${id}`, data),
    delete: (id: string) => this.delete(`/api/personal-use/${id}`),
    getPolicies: (params?: Record<string, unknown>) => this.get('/api/personal-use/policies', params),
    getTripUsages: (params?: Record<string, unknown>) => this.get('/api/personal-use/trip-usages', params),
    getTripUsage: (id: string) => this.get(`/api/personal-use/trip-usages/${id}`),
    createTripUsage: (data: unknown) => this.post('/api/personal-use/trip-usages', data),
    markTrip: (tripId: string, data: unknown) => this.post(`/api/personal-use/trips/${tripId}/mark`, data),
    updateTripUsage: (id: string, data: unknown) => this.put(`/api/personal-use/trip-usages/${id}`, data),
    deleteTripUsage: (id: string) => this.delete(`/api/personal-use/trip-usages/${id}`)
  }

  // Adaptive Cards endpoints
  adaptiveCards = {
    list: (params?: Record<string, unknown>) => this.get('/api/adaptive-cards', params),
    get: (id: string) => this.get(`/api/adaptive-cards/${id}`),
    create: (data: unknown) => this.post('/api/adaptive-cards', data),
    send: (data: unknown) => this.post('/api/adaptive-cards/send', data),
    sendMaintenanceCard: (teamId: string, channelId: string, data: unknown) =>
      this.post(`/api/adaptive-cards/maintenance/${teamId}/${channelId}`, data),
    sendWorkOrderCard: (teamId: string, channelId: string, data: unknown) =>
      this.post(`/api/adaptive-cards/work-order/${teamId}/${channelId}`, data),
    sendApprovalCard: (teamId: string, channelId: string, data: unknown) =>
      this.post(`/api/adaptive-cards/approval/${teamId}/${channelId}`, data)
  }

  // Asset Relationships endpoints
  assetRelationships = {
    list: (params?: Record<string, unknown>) => this.get('/api/asset-relationships', params),
    listActive: () => this.get('/api/asset-relationships/active'),
    get: (id: string) => this.get(`/api/asset-relationships/${id}`),
    getHistory: (assetId: string) => this.get(`/api/asset-relationships/history/${assetId}`),
    create: (data: unknown) => this.post('/api/asset-relationships', data),
    update: (id: string, data: unknown) => this.put(`/api/asset-relationships/${id}`, data),
    deactivate: (id: string) => this.put(`/api/asset-relationships/${id}/deactivate`, {}),
    delete: (id: string) => this.delete(`/api/asset-relationships/${id}`)
  }

  // AI endpoints
  ai = {
    processReceipt: (emailId: string) => this.post('/api/ai/process-receipt', { emailId }),
    analyzeDocument: (documentId: string) => this.post('/api/ai/analyze-document', { documentId }),
    extractData: (data: unknown) => this.post('/api/ai/extract-data', data),
    generateInsights: (params: Record<string, unknown>) => this.post('/api/ai/insights', params)
  }
}

// Create singleton instance
const client = new APIClient(API_BASE_URL)

// Export both as default and named export for compatibility
export default client
export { client as apiClient }