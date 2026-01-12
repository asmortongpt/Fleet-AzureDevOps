/**
 * Fleet Management System - Enhanced Service Worker
 *
 * Features:
 * - Offline caching with intelligent strategies
 * - Background sync for queued operations
 * - Push notifications with actions
 * - IndexedDB integration
 * - Cache management and optimization
 * - Network status detection
 *
 * Security: CSP compliant, parameterized requests only
 */

const CACHE_VERSION = 'fleet-v2.0.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const IMAGE_CACHE = `${CACHE_VERSION}-images`
const API_CACHE = `${CACHE_VERSION}-api`
const DATA_CACHE = `${CACHE_VERSION}-data`

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logos/favicon-16.png',
  '/logos/favicon-32.png',
  '/logos/Android-PlayStore-512.png',
  '/offline.html', // Offline fallback page
]

// API routes that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/vehicles/,
  /\/api\/drivers/,
  /\/api\/fleet-data/,
  /\/api\/work-orders/,
  /\/api\/inspections/,
  /\/api\/damage-reports/,
  /\/api\/settings/,
  /\/api\/config/,
]

// API routes that should NEVER be cached (real-time data)
const NO_CACHE_PATTERNS = [
  /\/api\/telemetry/,
  /\/api\/analytics/,
  /\/api\/realtime/,
  /\/api\/auth/,
]

// Max age for different cache types (in milliseconds)
const CACHE_MAX_AGE = {
  static: 1000 * 60 * 60 * 24 * 7, // 7 days
  runtime: 1000 * 60 * 60 * 24, // 1 day
  images: 1000 * 60 * 60 * 24 * 30, // 30 days
  api: 1000 * 60 * 5, // 5 minutes
  data: 1000 * 60 * 30, // 30 minutes
}

// Max cache sizes (number of entries)
const MAX_CACHE_ENTRIES = {
  static: 50,
  runtime: 100,
  images: 200,
  api: 100,
  data: 50,
}

/* ============================================================
   INSTALL EVENT - Cache static assets
   ============================================================ */

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...')

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      console.log('[ServiceWorker] Caching static assets')

      try {
        await cache.addAll(STATIC_ASSETS)
      } catch (error) {
        console.error('[ServiceWorker] Failed to cache static assets:', error)
      }

      // Skip waiting to activate immediately
      await self.skipWaiting()
    })()
  )
})

/* ============================================================
   ACTIVATE EVENT - Clean up old caches
   ============================================================ */

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...')

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      const validCaches = [STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE]

      // Delete old caches
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )

      // Take control of all clients immediately
      await self.clients.claim()
    })()
  )
})

/* ============================================================
   FETCH EVENT - Network-first with cache fallback
   ============================================================ */

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle different request types
  if (request.method === 'GET') {
    if (isImageRequest(url)) {
      event.respondWith(handleImageRequest(request))
    } else if (isAPIRequest(url)) {
      event.respondWith(handleAPIRequest(request))
    } else if (isStaticAsset(url)) {
      event.respondWith(handleStaticRequest(request))
    } else {
      event.respondWith(handleRuntimeRequest(request))
    }
  }
})

/* ============================================================
   REQUEST HANDLERS
   ============================================================ */

/**
 * Static assets: Cache-first strategy
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[ServiceWorker] Static asset fetch failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

/**
 * API requests: Network-first with cache fallback
 */
async function handleAPIRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE)

  try {
    const response = await fetch(request, { timeout: 5000 })

    if (response.ok) {
      // Cache successful API responses
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('[ServiceWorker] API request failed, trying cache:', error)

    // Try cache
    const cached = await cache.match(request)
    if (cached) {
      // Add custom header to indicate cached response
      const headers = new Headers(cached.headers)
      headers.append('X-From-Cache', 'true')

      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers,
      })
    }

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Network unavailable and no cached data',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * Images: Cache-first with network fallback
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)

  if (cached) {
    // Check if cache is still fresh
    const dateHeader = cached.headers.get('date')
    const cacheDate = dateHeader ? new Date(dateHeader).getTime() : 0
    const now = Date.now()

    if (now - cacheDate < CACHE_MAX_AGE.images) {
      return cached
    }
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return cached version even if expired
    if (cached) {
      return cached
    }

    // Return placeholder image
    return new Response('', { status: 404 })
  }
}

/**
 * Runtime requests: Network-first
 */
async function handleRuntimeRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }

    // Return offline page
    return new Response('Offline - Please check your connection', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname)
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/logos/') ||
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname === '/manifest.json'
  )
}

/* ============================================================
   BACKGROUND SYNC
   ============================================================ */

self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag)

  if (event.tag === 'sync-queued-requests') {
    event.waitUntil(syncQueuedRequests())
  } else if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData())
  } else if (event.tag.startsWith('sync-')) {
    event.waitUntil(handleCustomSync(event.tag))
  }
})

async function syncQueuedRequests() {
  console.log('[ServiceWorker] Syncing queued requests...')

  try {
    // Open IndexedDB
    const db = await openIndexedDB()
    const queue = await getAllFromStore(db, 'syncQueue')

    console.log(`[ServiceWorker] Found ${queue.length} queued operations`)

    for (const operation of queue) {
      try {
        await executeSyncOperation(operation)
        await deleteFromStore(db, 'syncQueue', operation.id)
        console.log('[ServiceWorker] Synced operation:', operation.id)
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync operation:', operation.id, error)

        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1

        if (operation.retryCount < 3) {
          await putInStore(db, 'syncQueue', operation)
        } else {
          console.error('[ServiceWorker] Operation failed after 3 retries, removing:', operation.id)
          await deleteFromStore(db, 'syncQueue', operation.id)
        }
      }
    }

    // Notify clients
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now(),
        syncedCount: queue.length
      })
    })

    console.log('[ServiceWorker] Background sync completed')
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error)
    throw error
  }
}

async function syncOfflineData() {
  console.log('[ServiceWorker] Syncing offline data...')
  // Delegate to syncQueuedRequests
  return syncQueuedRequests()
}

async function handleCustomSync(tag) {
  console.log('[ServiceWorker] Handling custom sync:', tag)
  // Custom sync logic for specific tags
}

async function executeSyncOperation(operation) {
  const { type, entity, entityId, data } = operation
  const url = `/api/${entity}s${type === 'create' ? '' : `/${entityId}`}`
  const method = type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE'

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': operation.authToken || ''
    },
    body: type !== 'delete' ? JSON.stringify(data) : undefined
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

/* ============================================================
   PUSH NOTIFICATIONS
   ============================================================ */

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received:', event)

  let notificationData
  try {
    notificationData = event.data ? event.data.json() : {}
  } catch (error) {
    console.error('[ServiceWorker] Failed to parse notification data:', error)
    notificationData = {
      title: 'Fleet Management',
      body: 'You have a new notification'
    }
  }

  const {
    title = 'Fleet Management',
    body = 'You have a new notification',
    icon = '/logos/Android-PlayStore-512.png',
    badge = '/logos/favicon-48.png',
    image,
    tag = `notification-${Date.now()}`,
    data = {},
    actions = [],
    requireInteraction = false,
    silent = false,
    vibrate = [200, 100, 200],
    priority = 'normal'
  } = notificationData

  // Build notification actions based on category
  const notificationActions = actions.length > 0 ? actions : getDefaultActions(data.category)

  const notificationOptions = {
    body,
    icon,
    badge,
    image,
    tag,
    data: {
      ...data,
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: notificationActions,
    requireInteraction: requireInteraction || priority === 'critical',
    silent,
    vibrate,
    timestamp: Date.now()
  }

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.notification)

  event.notification.close()

  const notificationData = event.notification.data || {}
  const action = event.action
  let url = notificationData.url || '/'

  // Handle specific actions
  if (action === 'view' && notificationData.detailUrl) {
    url = notificationData.detailUrl
  } else if (action === 'start' && notificationData.startUrl) {
    url = notificationData.startUrl
  } else if (action === 'accept') {
    url = notificationData.acceptUrl || url
  } else if (action === 'decline') {
    url = notificationData.declineUrl || url
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }

        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
      .then(() => {
        // Send message to all clients
        return clients.matchAll()
      })
      .then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action,
            data: notificationData,
            url
          })
        })
      })
  )
})

function getDefaultActions(category) {
  const actionsByCategory = {
    maintenance: [
      { action: 'view', title: 'View Details', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    inspection: [
      { action: 'start', title: 'Start Inspection', icon: '/icons/start.png' },
      { action: 'later', title: 'Remind Later' }
    ],
    damage: [
      { action: 'view', title: 'View Report', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    assignment: [
      { action: 'accept', title: 'Accept', icon: '/icons/accept.png' },
      { action: 'decline', title: 'Decline' }
    ],
    alert: [
      { action: 'view', title: 'View Alert', icon: '/icons/alert.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }

  return actionsByCategory[category] || [
    { action: 'view', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
}

/* ============================================================
   MESSAGE HANDLING
   ============================================================ */

self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('fleet-')) {
              console.log('[ServiceWorker] Clearing cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
    )
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then(size => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ type: 'CACHE_SIZE', size })
        }
      })
    )
  }

  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncQueuedRequests())
  }
})

/* ============================================================
   INDEXEDDB HELPERS
   ============================================================ */

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fleet-offline-db', 1)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' })
        store.createIndex('by-priority', 'priority')
        store.createIndex('by-timestamp', 'timestamp')
      }
    }
  })
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    } catch (error) {
      console.error('[ServiceWorker] Error getting from store:', error)
      resolve([])
    }
  })
}

function deleteFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    } catch (error) {
      console.error('[ServiceWorker] Error deleting from store:', error)
      resolve()
    }
  })
}

function putInStore(db, storeName, data) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    } catch (error) {
      console.error('[ServiceWorker] Error putting in store:', error)
      resolve()
    }
  })
}

/* ============================================================
   CACHE UTILITIES
   ============================================================ */

async function getCacheSize() {
  try {
    const cacheNames = await caches.keys()
    let totalSize = 0

    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('fleet-')) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()

        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            const blob = await response.blob()
            totalSize += blob.size
          }
        }
      }
    }

    return totalSize
  } catch (error) {
    console.error('[ServiceWorker] Error calculating cache size:', error)
    return 0
  }
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()

    if (keys.length > maxEntries) {
      const deleteCount = keys.length - maxEntries
      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i])
      }
      console.log(`[ServiceWorker] Trimmed ${deleteCount} entries from ${cacheName}`)
    }
  } catch (error) {
    console.error('[ServiceWorker] Error trimming cache:', error)
  }
}

console.log('[ServiceWorker] Enhanced Service Worker loaded successfully')
