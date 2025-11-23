/**
 * Fleet Management API Client
 * Production-ready REST client with authentication, error handling, and retry logic
 */

// API base URL - defaults to current origin since endpoints already include /api
import logger from '@/utils/logger'
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

class APIClient {
  private baseURL: string
  private token: string | null = null
  private csrfToken: string | null = null
  private csrfTokenPromise: Promise<void> | null = null
  private refreshTokenPromise: Promise<void> | null = null
  private isRefreshing: boolean = false

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('token')
    // Initialize CSRF token on construction
    this.initializeCsrfToken()
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
  }

  /**
   * Fetches a CSRF token from the server
   * Only fetches once and caches the result
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
        const response = await fetch(`${this.baseURL}/api/csrf`, {
          method: 'GET',
          credentials: 'include', // Required for cookies
        })

        if (response.ok) {
          const data = await response.json()
          this.csrfToken = data.csrfToken
          logger.info('CSRF token initialized successfully')
        } else {
          logger.warn('Failed to fetch CSRF token:', { status: response.status })
        }
      } catch (error) {
        logger.error('Error fetching CSRF token:', { error })
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

  /**
   * Refresh the access token using the httpOnly refresh token cookie
   * OWASP ASVS 3.0 compliant automatic token refresh
   */
  private async refreshAccessToken(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (this.isRefreshing) {
      if (this.refreshTokenPromise) {
        await this.refreshTokenPromise
        return !!this.token
      }
      return false
    }

    this.isRefreshing = true
    this.refreshTokenPromise = (async () => {
      try {
        logger.info('Attempting to refresh access token...')
        const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Required for httpOnly cookie
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          this.setToken(data.token)
          logger.info('Access token refreshed successfully')
          return true
        } else {
          logger.warn('Token refresh failed:', { status: response.status })
          this.clearToken()
          return false
        }
      } catch (error) {
        logger.error('Token refresh error:', { error })
        this.clearToken()
        return false
      } finally {
        this.isRefreshing = false
        this.refreshTokenPromise = null
      }
    })()

    const result = await this.refreshTokenPromise
    return result as boolean
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

    // Always re-read token from localStorage to handle SSO login flow
    // The token may have been set after the singleton was constructed
    const currentToken = this.token || localStorage.getItem('token')
    if (currentToken) {
      // Update internal token reference if found in localStorage
      if (!this.token && currentToken) {
        this.token = currentToken
      }
      headers['Authorization'] = `Bearer ${currentToken}`
    }

    // Add CSRF token to headers for state-changing requests
    if (isStateChanging && this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken
    }

    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // Required for CSRF cookies
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))

        // If CSRF token is invalid, refresh and retry once
        if (response.status === 403 && error.error?.includes('CSRF')) {
          logger.warn('CSRF token invalid, refreshing...')
          await this.refreshCsrfToken()

          // Retry the request with new CSRF token
          if (isStateChanging && this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken
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
      if (error instanceof APIError) {
        // OWASP ASVS 3.0: Automatic token refresh on 401 Unauthorized
        if (error.status === 401 && !endpoint.includes('/auth/')) {
          logger.info('Received 401, attempting token refresh...')
          const refreshed = await this.refreshAccessToken()

          if (refreshed) {
            // Retry the original request with new token
            logger.info('Token refreshed, retrying original request...')
            const retryHeaders: HeadersInit = {
              'Content-Type': 'application/json',
              ...options.headers
            }

            // Re-read token from localStorage after refresh
            const refreshedToken = this.token || localStorage.getItem('token')
            if (refreshedToken) {
              retryHeaders['Authorization'] = `Bearer ${refreshedToken}`
            }

            // Re-add CSRF token if needed
            const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
              options.method?.toUpperCase() || 'GET'
            )
            if (isStateChanging && this.csrfToken) {
              retryHeaders['X-CSRF-Token'] = this.csrfToken
            }

            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
              credentials: 'include'
            })

            if (retryResponse.ok) {
              if (retryResponse.status === 204) {
                return {} as T
              }
              return await retryResponse.json()
            }
          }

          // If refresh failed or retry failed, logout
          this.clearToken()
          window.location.href = '/login'
        }
        throw error
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
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' })
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await this.post<{ token: string; user: any }>(
      '/api/v1/auth/login',
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
    return this.post('/api/v1/auth/register', data)
  }

  async logout() {
    await this.post('/api/v1/auth/logout', {})
    this.clearToken()
  }

  // Vehicle endpoints
  vehicles = {
    list: (params?: any) => this.get('/api/vehicles', params),
    get: (id: string) => this.get(`/api/vehicles/${id}`),
    create: (data: any) => this.post('/api/vehicles', data),
    update: (id: string, data: any) => this.put(`/api/vehicles/${id}`, data),
    delete: (id: string) => this.delete(`/api/vehicles/${id}`),
    updateTelemetry: (id: string, data: any) =>
      this.post(`/api/vehicles/${id}/telemetry`, data)
  }

  // Driver endpoints
  drivers = {
    list: (params?: any) => this.get('/api/drivers', params),
    get: (id: string) => this.get(`/api/drivers/${id}`),
    create: (data: any) => this.post('/api/drivers', data),
    update: (id: string, data: any) => this.put(`/api/drivers/${id}`, data),
    delete: (id: string) => this.delete(`/api/drivers/${id}`)
  }

  // Work Order endpoints
  workOrders = {
    list: (params?: any) => this.get('/api/work-orders', params),
    get: (id: string) => this.get(`/api/work-orders/${id}`),
    create: (data: any) => this.post('/api/work-orders', data),
    update: (id: string, data: any) => this.put(`/api/work-orders/${id}`, data),
    delete: (id: string) => this.delete(`/api/work-orders/${id}`)
  }

  // Maintenance Schedule endpoints
  maintenanceSchedules = {
    list: (params?: any) => this.get('/api/maintenance-schedules', params),
    get: (id: string) => this.get(`/api/maintenance-schedules/${id}`),
    create: (data: any) => this.post('/api/maintenance-schedules', data),
    update: (id: string, data: any) =>
      this.put(`/api/maintenance-schedules/${id}`, data),
    delete: (id: string) => this.delete(`/api/maintenance-schedules/${id}`)
  }

  // Fuel Transaction endpoints
  fuelTransactions = {
    list: (params?: any) => this.get('/api/fuel-transactions', params),
    get: (id: string) => this.get(`/api/fuel-transactions/${id}`),
    create: (data: any) => this.post('/api/fuel-transactions', data),
    update: (id: string, data: any) =>
      this.put(`/api/fuel-transactions/${id}`, data),
    delete: (id: string) => this.delete(`/api/fuel-transactions/${id}`)
  }

  // Route endpoints
  routes = {
    list: (params?: any) => this.get('/api/routes', params),
    get: (id: string) => this.get(`/api/routes/${id}`),
    create: (data: any) => this.post('/api/routes', data),
    update: (id: string, data: any) => this.put(`/api/routes/${id}`, data),
    delete: (id: string) => this.delete(`/api/routes/${id}`)
  }

  // Geofence endpoints
  geofences = {
    list: (params?: any) => this.get('/api/geofences', params),
    get: (id: string) => this.get(`/api/geofences/${id}`),
    create: (data: any) => this.post('/api/geofences', data),
    update: (id: string, data: any) => this.put(`/api/geofences/${id}`, data),
    delete: (id: string) => this.delete(`/api/geofences/${id}`)
  }

  // Inspection endpoints
  inspections = {
    list: (params?: any) => this.get('/api/inspections', params),
    get: (id: string) => this.get(`/api/inspections/${id}`),
    create: (data: any) => this.post('/api/inspections', data),
    update: (id: string, data: any) => this.put(`/api/inspections/${id}`, data),
    delete: (id: string) => this.delete(`/api/inspections/${id}`)
  }

  // Safety Incident endpoints
  safetyIncidents = {
    list: (params?: any) => this.get('/api/safety-incidents', params),
    get: (id: string) => this.get(`/api/safety-incidents/${id}`),
    create: (data: any) => this.post('/api/safety-incidents', data),
    update: (id: string, data: any) =>
      this.put(`/api/safety-incidents/${id}`, data),
    delete: (id: string) => this.delete(`/api/safety-incidents/${id}`)
  }

  // Charging Station endpoints
  chargingStations = {
    list: (params?: any) => this.get('/api/charging-stations', params),
    get: (id: string) => this.get(`/api/charging-stations/${id}`),
    create: (data: any) => this.post('/api/charging-stations', data),
    update: (id: string, data: any) =>
      this.put(`/api/charging-stations/${id}`, data),
    delete: (id: string) => this.delete(`/api/charging-stations/${id}`)
  }

  // Purchase Order endpoints
  purchaseOrders = {
    list: (params?: any) => this.get('/api/purchase-orders', params),
    get: (id: string) => this.get(`/api/purchase-orders/${id}`),
    create: (data: any) => this.post('/api/purchase-orders', data),
    update: (id: string, data: any) =>
      this.put(`/api/purchase-orders/${id}`, data),
    delete: (id: string) => this.delete(`/api/purchase-orders/${id}`)
  }

  // Facility endpoints
  facilities = {
    list: (params?: any) => this.get('/api/facilities', params),
    get: (id: string) => this.get(`/api/facilities/${id}`),
    create: (data: any) => this.post('/api/facilities', data),
    update: (id: string, data: any) => this.put(`/api/facilities/${id}`, data),
    delete: (id: string) => this.delete(`/api/facilities/${id}`)
  }

  // Vendor endpoints
  vendors = {
    list: (params?: any) => this.get('/api/vendors', params),
    get: (id: string) => this.get(`/api/vendors/${id}`),
    create: (data: any) => this.post('/api/vendors', data),
    update: (id: string, data: any) => this.put(`/api/vendors/${id}`, data),
    delete: (id: string) => this.delete(`/api/vendors/${id}`)
  }

  // Telemetry endpoints
  telemetry = {
    list: (params?: any) => this.get('/api/telemetry', params),
    get: (id: string) => this.get(`/api/telemetry/${id}`),
    create: (data: any) => this.post('/api/telemetry', data)
  }

  // AI endpoints (to be implemented)
  ai = {
    query: (query: string) =>
      this.post('/api/ai/query', { query }),
    assistant: (messages: any[]) =>
      this.post('/api/ai/assistant', { messages }),
    processReceipt: (imageUrl: string) =>
      this.post('/api/ai/receipt', { imageUrl })
  }

  // Traffic Camera endpoints
  trafficCameras = {
    list: async (params?: any) => {
      const response: any = await this.get('/api/traffic-cameras', params)
      return response.cameras || []
    },
    get: async (id: string) => {
      const response: any = await this.get(`/api/traffic-cameras/${id}`)
      return response.camera
    },
    nearby: async (lat: number, lng: number, radiusMiles?: number) => {
      const response: any = await this.get('/api/traffic-cameras/nearby', {
        lat, lng, radius_miles: radiusMiles || 5
      })
      return response.cameras || []
    },
    sources: async () => {
      const response: any = await this.get('/api/traffic-cameras/sources/list')
      return response.sources || []
    },
    sync: () => this.post('/api/traffic-cameras/sync', {}),
    syncSource: (sourceId: string) => this.post(`/api/traffic-cameras/sources/${sourceId}/sync`, {})
  }

  // ArcGIS Layer endpoints
  arcgisLayers = {
    list: async () => {
      const response: any = await this.get('/api/arcgis-layers')
      return response.layers || []
    },
    get: async (id: string) => {
      const response: any = await this.get(`/api/arcgis-layers/${id}`)
      return response.layer
    },
    listEnabled: async () => {
      const response: any = await this.get('/api/arcgis-layers/enabled/list')
      return response.layers || []
    },
    create: (data: any) => this.post('/api/arcgis-layers', data),
    update: (id: string, data: any) => this.put(`/api/arcgis-layers/${id}`, data),
    delete: (id: string) => this.delete(`/api/arcgis-layers/${id}`)
  }

  // Microsoft Teams endpoints
  teams = {
    // Teams
    listTeams: () => this.get('/api/teams'),
    getTeam: (teamId: string) => this.get(`/api/teams/${teamId}`),

    // Channels
    listChannels: (teamId: string) => this.get(`/api/teams/${teamId}/channels`),
    getChannel: (teamId: string, channelId: string) =>
      this.get(`/api/teams/${teamId}/channels/${channelId}`),

    // Messages
    listMessages: (teamId: string, channelId: string, params?: any) =>
      this.get(`/api/teams/${teamId}/channels/${channelId}/messages`, params),
    getMessage: (teamId: string, channelId: string, messageId: string) =>
      this.get(`/api/teams/${teamId}/channels/${channelId}/messages/${messageId}`),
    sendMessage: (teamId: string, channelId: string, data: any) =>
      this.post(`/api/teams/${teamId}/channels/${channelId}/messages`, data),
    replyToMessage: (teamId: string, channelId: string, messageId: string, data: any) =>
      this.post(`/api/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`, data),
    deleteMessage: (teamId: string, channelId: string, messageId: string) =>
      this.delete(`/api/teams/${teamId}/channels/${channelId}/messages/${messageId}`),

    // Reactions
    addReaction: (teamId: string, channelId: string, messageId: string, reaction: string) =>
      this.post(`/api/teams/${teamId}/channels/${channelId}/messages/${messageId}/reactions`, { reaction }),
    removeReaction: (teamId: string, channelId: string, messageId: string, reactionId: string) =>
      this.delete(`/api/teams/${teamId}/channels/${channelId}/messages/${messageId}/reactions/${reactionId}`),

    // File uploads
    uploadFile: async (teamId: string, channelId: string, file: File, onProgress?: (progress: number) => void) => {
      const formData = new FormData()
      formData.append('file', file)

      // Re-read token from localStorage to handle SSO login flow
      const uploadToken = this.token || localStorage.getItem('token')
      const response = await fetch(`${this.baseURL}/api/teams/${teamId}/channels/${channelId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uploadToken}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new APIError('File upload failed', response.status)
      }

      return response.json()
    }
  }

  // Microsoft Outlook endpoints
  outlook = {
    // Folders
    listFolders: () => this.get('/api/outlook/folders'),
    getFolder: (folderId: string) => this.get(`/api/outlook/folders/${folderId}`),

    // Messages
    listMessages: (params?: any) => this.get('/api/outlook/messages', params),
    getMessage: (messageId: string) => this.get(`/api/outlook/messages/${messageId}`),
    sendEmail: (data: any) => this.post('/api/outlook/send', data),
    replyToEmail: (messageId: string, data: any) =>
      this.post(`/api/outlook/messages/${messageId}/reply`, data),
    replyAllToEmail: (messageId: string, data: any) =>
      this.post(`/api/outlook/messages/${messageId}/replyAll`, data),
    forwardEmail: (messageId: string, data: any) =>
      this.post(`/api/outlook/messages/${messageId}/forward`, data),
    deleteEmail: (messageId: string) => this.delete(`/api/outlook/messages/${messageId}`),
    moveEmail: (messageId: string, destinationId: string) =>
      this.post(`/api/outlook/messages/${messageId}/move`, { destinationId }),

    // Message actions
    markAsRead: (messageId: string) =>
      this.patch(`/api/outlook/messages/${messageId}`, { isRead: true }),
    markAsUnread: (messageId: string) =>
      this.patch(`/api/outlook/messages/${messageId}`, { isRead: false }),
    flagMessage: (messageId: string, flagStatus: string) =>
      this.patch(`/api/outlook/messages/${messageId}`, { flag: { flagStatus } }),
    categorizeMessage: (messageId: string, categories: string[]) =>
      this.patch(`/api/outlook/messages/${messageId}`, { categories }),

    // Attachments
    listAttachments: (messageId: string) =>
      this.get(`/api/outlook/messages/${messageId}/attachments`),
    getAttachment: (messageId: string, attachmentId: string) =>
      this.get(`/api/outlook/messages/${messageId}/attachments/${attachmentId}`),
    uploadAttachment: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      // Re-read token from localStorage to handle SSO login flow
      const attachToken = this.token || localStorage.getItem('token')
      const response = await fetch(`${this.baseURL}/api/outlook/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${attachToken}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new APIError('Attachment upload failed', response.status)
      }

      return response.json()
    },

    // Search
    searchMessages: (query: string, params?: any) =>
      this.get('/api/outlook/messages/search', { query, ...params })
  }

  // Microsoft Calendar endpoints
  calendar = {
    // Events
    listEvents: (params?: any) => this.get('/api/calendar/events', params),
    getEvent: (eventId: string) => this.get(`/api/calendar/events/${eventId}`),
    createEvent: (data: any) => this.post('/api/calendar/events', data),
    updateEvent: (eventId: string, data: any) =>
      this.patch(`/api/calendar/events/${eventId}`, data),
    deleteEvent: (eventId: string) => this.delete(`/api/calendar/events/${eventId}`),

    // Event actions
    acceptEvent: (eventId: string, comment?: string) =>
      this.post(`/api/calendar/events/${eventId}/accept`, { comment }),
    tentativelyAcceptEvent: (eventId: string, comment?: string) =>
      this.post(`/api/calendar/events/${eventId}/tentativelyAccept`, { comment }),
    declineEvent: (eventId: string, comment?: string) =>
      this.post(`/api/calendar/events/${eventId}/decline`, { comment }),

    // Meeting times
    findMeetingTimes: (data: any) =>
      this.post('/api/calendar/findMeetingTimes', data),

    // Calendars
    listCalendars: () => this.get('/api/calendar/calendars'),
    getCalendar: (calendarId: string) => this.get(`/api/calendar/calendars/${calendarId}`)
  }

  // Adaptive Cards endpoints
  adaptiveCards = {
    // Send cards to Teams
    sendToTeamsChannel: (teamId: string, channelId: string, card: any) =>
      this.post(`/api/teams/${teamId}/channels/${channelId}/cards`, { card }),
    sendToUser: (userId: string, card: any) =>
      this.post(`/api/teams/users/${userId}/cards`, { card }),

    // Handle card actions
    submitCardAction: (cardId: string, actionData: any) =>
      this.post(`/api/adaptive-cards/${cardId}/actions`, actionData),

    // Pre-built cards for fleet management
    sendMaintenanceCard: (teamId: string, channelId: string, data: any) =>
      this.post(`/api/adaptive-cards/maintenance`, { teamId, channelId, ...data }),
    sendWorkOrderCard: (teamId: string, channelId: string, data: any) =>
      this.post(`/api/adaptive-cards/work-order`, { teamId, channelId, ...data }),
    sendApprovalCard: (teamId: string, channelId: string, data: any) =>
      this.post(`/api/adaptive-cards/approval`, { teamId, channelId, ...data }),
    sendInspectionCard: (teamId: string, channelId: string, data: any) =>
      this.post(`/api/adaptive-cards/inspection`, { teamId, channelId, ...data })
  }

  // User presence endpoints
  presence = {
    getUserPresence: (userId: string) => this.get(`/api/presence/${userId}`),
    setPresence: (availability: string, activity: string) =>
      this.post('/api/presence', { availability, activity })
  }

  // Personal Use endpoints
  personalUse = {
    getPolicies: () => this.get('/api/personal-use-policies'),
    createTripUsage: (data: any) => this.post('/api/trip-usage', data),
    markTrip: (tripId: string, data: any) =>
      this.post(`/api/trips/${tripId}/mark`, data),
    getTripUsages: (params?: any) => this.get('/api/trip-usage', params),
    getTripUsage: (id: string) => this.get(`/api/trip-usage/${id}`),
    updateTripUsage: (id: string, data: any) =>
      this.put(`/api/trip-usage/${id}`, data),
    deleteTripUsage: (id: string) => this.delete(`/api/trip-usage/${id}`)
  }

  // PATCH request helper
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}

// Create singleton instance
export const apiClient = new APIClient(API_BASE_URL)

// Export for convenience
export default apiClient
