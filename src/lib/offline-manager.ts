/**
 * Offline Manager
 * Handles offline state, Service Worker registration, and cache management
 */

/* ============================================================
   TYPES
   ============================================================ */

export interface CachedResponse {
  url: string
  method: string
  body: string
  headers: Record<string, string>
  timestamp: number
  expiresAt: number
}

export interface QueuedRequest {
  id: string
  url: string
  method: string
  body: string
  headers: Record<string, string>
  timestamp: number
  retries: number
  maxRetries: number
}

export interface OfflineState {
  isOnline: boolean
  isServiceWorkerRegistered: boolean
  queuedRequests: QueuedRequest[]
  lastSync: number | null
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const DB_NAME = 'fleet-offline-db'
const DB_VERSION = 1
const CACHE_STORE = 'api-cache'
const QUEUE_STORE = 'request-queue'
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24 // 24 hours
const MAX_RETRIES = 3

/* ============================================================
   INDEXEDDB UTILITIES
   ============================================================ */

class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'url' })
          cacheStore.createIndex('timestamp', 'timestamp')
          cacheStore.createIndex('expiresAt', 'expiresAt')
        }

        // Create queue store
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
          queueStore.createIndex('timestamp', 'timestamp')
          queueStore.createIndex('retries', 'retries')
        }
      }
    })
  }

  async getCachedResponse(url: string): Promise<CachedResponse | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly')
      const store = transaction.objectStore(CACHE_STORE)
      const request = store.get(url)

      request.onsuccess = () => {
        const cached = request.result as CachedResponse | undefined
        if (cached && cached.expiresAt > Date.now()) {
          resolve(cached)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async setCachedResponse(response: CachedResponse): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)
      const request = store.put(response)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async addToQueue(request: QueuedRequest): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const req = store.put(request)

      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readonly')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite')
      const store = transaction.objectStore(CACHE_STORE)
      const index = store.index('expiresAt')
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()))

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}

/* ============================================================
   OFFLINE MANAGER CLASS
   ============================================================ */

export class OfflineManager {
  private db: OfflineDB
  private isOnline: boolean
  private listeners: Set<(state: OfflineState) => void>
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.db = new OfflineDB()
    this.isOnline = navigator.onLine
    this.listeners = new Set()

    // Initialize
    this.init()
  }

  private async init() {
    await this.db.init()
    await this.registerServiceWorker()
    this.setupEventListeners()
    await this.db.clearExpiredCache()
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js')
        logger.debug('[OfflineManager] Service Worker registered successfully')
      } catch (error) {
        logger.error('[OfflineManager] Service Worker registration failed:', error)
      }
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners()
      this.processPendingRequests()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners()
    })
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }

  public subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public async getState(): Promise<OfflineState> {
    const queuedRequests = await this.db.getQueuedRequests()

    return {
      isOnline: this.isOnline,
      isServiceWorkerRegistered: !!this.serviceWorkerRegistration,
      queuedRequests,
      lastSync: queuedRequests.length > 0 ? Math.max(...queuedRequests.map((r) => r.timestamp)) : null,
    }
  }

  public async fetchWithCache(url: string, options: RequestInit = {}): Promise<Response> {
    const cacheKey = `${options.method || 'GET'}:${url}`

    // Try network first if online
    if (this.isOnline) {
      try {
        const response = await fetch(url, options)

        // Cache successful GET requests
        if (response.ok && (!options.method || options.method === 'GET')) {
          const clonedResponse = response.clone()
          const body = await clonedResponse.text()

          await this.db.setCachedResponse({
            url: cacheKey,
            method: options.method || 'GET',
            body,
            headers: Object.fromEntries(response.headers.entries()),
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_EXPIRY_MS,
          })
        }

        return response
      } catch (error) {
        // Network failed, fall through to cache
        logger.warn('[OfflineManager] Network request failed, trying cache:', error)
      }
    }

    // Try cache if offline or network failed
    const cached = await this.db.getCachedResponse(cacheKey)
    if (cached) {
      return new Response(cached.body, {
        status: 200,
        headers: new Headers(cached.headers),
      })
    }

    // No cache available
    throw new Error('No cached response available and network is offline')
  }

  public async queueRequest(url: string, options: RequestInit = {}): Promise<void> {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      method: options.method || 'GET',
      body: options.body ? options.body.toString() : '',
      headers: options.headers ? Object.fromEntries(Object.entries(options.headers)) : {},
      timestamp: Date.now(),
      retries: 0,
      maxRetries: MAX_RETRIES,
    }

    await this.db.addToQueue(request)
    this.notifyListeners()
  }

  private async processPendingRequests() {
    const queuedRequests = await this.db.getQueuedRequests()

    for (const request of queuedRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: new Headers(request.headers),
          body: request.body || undefined,
        })

        if (response.ok) {
          await this.db.removeFromQueue(request.id)
        } else {
          // Increment retry count
          request.retries++
          if (request.retries >= request.maxRetries) {
            await this.db.removeFromQueue(request.id)
          } else {
            await this.db.addToQueue(request)
          }
        }
      } catch (error) {
        logger.error('[OfflineManager] Failed to process queued request:', error)
        request.retries++
        if (request.retries >= request.maxRetries) {
          await this.db.removeFromQueue(request.id)
        } else {
          await this.db.addToQueue(request)
        }
      }
    }

    this.notifyListeners()
  }

  public async clearCache(): Promise<void> {
    await this.db.clearExpiredCache()
  }

  public isOnlineNow(): boolean {
    return this.isOnline
  }
}

/* ============================================================
   SINGLETON INSTANCE
   ============================================================ */

export const offlineManager = new OfflineManager()
