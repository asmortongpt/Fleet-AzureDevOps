/**
 * Fleet Management System - Service Worker
 * Handles offline caching, background sync, and push notifications
 */

const CACHE_VERSION = 'fleet-v1.0.1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const IMAGE_CACHE = `${CACHE_VERSION}-images`

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logos/favicon-16.png',
  '/logos/favicon-32.png',
  '/logos/Android-PlayStore-512.png',
]

// API routes that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/vehicles/,
  /\/api\/drivers/,
  /\/api\/fleet-data/,
  /\/api\/telemetry/,
]

// Max age for different cache types (in milliseconds)
const CACHE_MAX_AGE = {
  static: 1000 * 60 * 60 * 24 * 7, // 7 days
  runtime: 1000 * 60 * 60 * 24, // 1 day
  images: 1000 * 60 * 60 * 24 * 30, // 30 days
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
  if (event.tag === 'sync-queued-requests') {
    event.waitUntil(syncQueuedRequests())
  }
})

async function syncQueuedRequests() {
  console.log('[ServiceWorker] Syncing queued requests...')
  // This will be handled by the OfflineManager in the app
}

/* ============================================================
   PUSH NOTIFICATIONS
   ============================================================ */

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Fleet Notification'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logos/Android-PlayStore-512.png',
    badge: '/logos/favicon-48.png',
    data: data.url || '/',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

/* ============================================================
   MESSAGE HANDLING
   ============================================================ */

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})

console.log('[ServiceWorker] Service Worker loaded successfully')
