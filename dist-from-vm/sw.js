/**
 * Fleet Management System - Enhanced Service Worker v3.0.0
 *
 * Features:
 * - Advanced multi-tier caching strategies
 * - Offline-first architecture
 * - Background sync for queued operations
 * - Push notification support
 * - 3D model and asset optimization
 * - Intelligent cache invalidation
 * - Network resilience
 */

const CACHE_VERSION = 'v3.0.0';
const STATIC_CACHE = `fleet-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `fleet-dynamic-${CACHE_VERSION}`;
const API_CACHE = `fleet-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `fleet-images-${CACHE_VERSION}`;
const MODEL_3D_CACHE = `fleet-models-${CACHE_VERSION}`;
const FONT_CACHE = `fleet-fonts-${CACHE_VERSION}`;

// Critical assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logos/favicon-16.png',
  '/logos/favicon-32.png',
];

// API endpoints with cache TTL configurations
const API_CACHE_CONFIG = {
  '/api/v1/vehicles': { ttl: 5 * 60 * 1000, strategy: 'network-first' }, // 5 min
  '/api/v1/drivers': { ttl: 10 * 60 * 1000, strategy: 'network-first' }, // 10 min
  '/api/v1/fleet-stats': { ttl: 2 * 60 * 1000, strategy: 'network-first' }, // 2 min
  '/api/v1/maintenance': { ttl: 15 * 60 * 1000, strategy: 'cache-first' }, // 15 min
  '/api/v1/routes': { ttl: 30 * 60 * 1000, strategy: 'cache-first' }, // 30 min
};

// Maximum cache sizes (number of items)
const MAX_CACHE_SIZE = {
  [DYNAMIC_CACHE]: 100,
  [API_CACHE]: 50,
  [IMAGE_CACHE]: 200,
  [MODEL_3D_CACHE]: 50,
};

// ============================================================================
// SERVICE WORKER LIFECYCLE EVENTS
// ============================================================================

/**
 * Install Event - Cache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3.0.0');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate Event - Clean old caches and claim clients
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3.0.0');

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove caches that don't match current version
              return cacheName.startsWith('fleet-') && !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim all clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] Activation complete, ready to serve requests');
    })
  );
});

/**
 * Fetch Event - Intelligent request routing
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS GET requests
  if (!request.url.startsWith('http')) return;
  if (request.method !== 'GET') return;

  // Route to appropriate handler based on request type
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request, url));
  } else if (isImageRequest(url.pathname)) {
    event.respondWith(handleImageRequest(request));
  } else if (is3DModelRequest(url.pathname)) {
    event.respondWith(handle3DModelRequest(request));
  } else if (isFontRequest(url.pathname)) {
    event.respondWith(handleFontRequest(request));
  } else if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(handleDocumentRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

/**
 * Network First Strategy - Try network, fallback to cache
 * Best for: Dynamic content that should be fresh but needs offline support
 */
async function networkFirstStrategy(request, cacheName, options = {}) {
  const { timeout = 5000, ttl } = options;

  try {
    // Race network request against timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);

    if (response && response.ok) {
      // Cache successful response with metadata
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();

      // Add timestamp for TTL validation
      if (ttl) {
        const metadata = {
          timestamp: Date.now(),
          ttl,
        };
        responseToCache.headers.set('sw-cache-metadata', JSON.stringify(metadata));
      }

      cache.put(request, responseToCache);
      return response;
    }
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
  }

  // Network failed, try cache
  const cached = await caches.match(request);
  if (cached) {
    // Check if cached response is still valid
    if (ttl && isCacheExpired(cached, ttl)) {
      console.log('[SW] Cache expired for:', request.url);
    }
    return cached;
  }

  // Both failed
  throw new Error('Network and cache failed');
}

/**
 * Cache First Strategy - Try cache, fallback to network
 * Best for: Static assets that rarely change
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);

  if (cached) {
    // Return cached version and update in background
    updateCacheInBackground(request, cacheName);
    return cached;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());

      // Enforce cache size limits
      trimCache(cacheName);
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    throw error;
  }
}

/**
 * Stale While Revalidate - Return cache immediately, update in background
 * Best for: Content that can be slightly stale but needs to be fast
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  // Always fetch fresh data in background
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok) {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  // Return cached version immediately if available
  return cached || fetchPromise;
}

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

/**
 * Handle API requests with intelligent caching
 */
async function handleAPIRequest(request, url) {
  const config = getAPIConfig(url.pathname);
  const strategy = config?.strategy || 'network-first';

  try {
    if (strategy === 'network-first') {
      return await networkFirstStrategy(request, API_CACHE, {
        timeout: 5000,
        ttl: config?.ttl,
      });
    } else if (strategy === 'cache-first') {
      return await cacheFirstStrategy(request, API_CACHE);
    }
  } catch (error) {
    console.error('[SW] API request failed:', error);

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        offline: true,
        message: 'Unable to connect to server. Please check your connection.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle image requests - Cache first with background update
 */
async function handleImageRequest(request) {
  return cacheFirstStrategy(request, IMAGE_CACHE);
}

/**
 * Handle 3D model requests - Cache first (models are large and static)
 */
async function handle3DModelRequest(request) {
  return cacheFirstStrategy(request, MODEL_3D_CACHE);
}

/**
 * Handle font requests - Cache first (fonts never change)
 */
async function handleFontRequest(request) {
  return cacheFirstStrategy(request, FONT_CACHE);
}

/**
 * Handle document requests - Network first with offline page fallback
 */
async function handleDocumentRequest(request) {
  try {
    return await networkFirstStrategy(request, DYNAMIC_CACHE, { timeout: 3000 });
  } catch (error) {
    console.log('[SW] Document request failed, showing offline page');
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

/**
 * Handle static asset requests - Stale while revalidate
 */
async function handleStaticRequest(request) {
  return staleWhileRevalidate(request, DYNAMIC_CACHE);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if URL is an image
 */
function isImageRequest(pathname) {
  return /\.(png|jpg|jpeg|svg|gif|webp|avif|ico)$/i.test(pathname);
}

/**
 * Check if URL is a 3D model
 */
function is3DModelRequest(pathname) {
  return /\.(gltf|glb|obj|fbx|dae)$/i.test(pathname);
}

/**
 * Check if URL is a font
 */
function isFontRequest(pathname) {
  return /\.(woff2?|eot|ttf|otf)$/i.test(pathname);
}

/**
 * Get API cache configuration
 */
function getAPIConfig(pathname) {
  for (const [pattern, config] of Object.entries(API_CACHE_CONFIG)) {
    if (pathname.includes(pattern)) {
      return config;
    }
  }
  return null;
}

/**
 * Check if cached response has expired
 */
function isCacheExpired(response, ttl) {
  try {
    const metadata = response.headers.get('sw-cache-metadata');
    if (!metadata) return false;

    const { timestamp } = JSON.parse(metadata);
    return Date.now() - timestamp > ttl;
  } catch {
    return false;
  }
}

/**
 * Update cache in background without blocking response
 */
function updateCacheInBackground(request, cacheName) {
  fetch(request)
    .then((response) => {
      if (response && response.ok) {
        return caches.open(cacheName).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {
      // Silently fail - user already got cached version
    });
}

/**
 * Trim cache to maximum size
 */
async function trimCache(cacheName) {
  const maxSize = MAX_CACHE_SIZE[cacheName];
  if (!maxSize) return;

  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Delete oldest entries
    const toDelete = keys.length - maxSize;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[SW] Trimmed ${cacheName}: removed ${toDelete} entries`);
  }
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

/**
 * Handle background sync events
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-fleet-data') {
    event.waitUntil(syncFleetData());
  } else if (event.tag === 'sync-queued-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

/**
 * Sync fleet data when back online
 */
async function syncFleetData() {
  try {
    console.log('[SW] Syncing fleet data...');

    // Get queued data from IndexedDB (if available)
    const db = await openDB();
    const queue = await db.getAll('sync-queue');

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          await db.delete('sync-queue', item.id);
          console.log('[SW] Synced item:', item.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }

    console.log('[SW] Fleet data sync complete');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error; // Retry sync later
  }
}

/**
 * Sync queued requests
 */
async function syncQueuedRequests() {
  console.log('[SW] Syncing queued requests...');
  // Implementation would depend on your queue storage mechanism
}

/**
 * Simple IndexedDB helper (if idb library not available in SW)
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fleet-management', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = { title: 'Fleet Alert', body: 'New notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'fleet-notification',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open', icon: '/icons/action-open.png' },
      { action: 'close', title: 'Dismiss', icon: '/icons/action-close.png' },
    ],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }

          // Open new window if none exists
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

/**
 * Handle notification close
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);

  // Optional: Track notification dismissals
  event.waitUntil(
    fetch('/api/v1/analytics/notification-dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag: event.notification.tag,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail - analytics not critical
    })
  );
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      })
    );
  }
});

/**
 * Calculate total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }

  return totalSize;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('[SW] Enhanced Service Worker v3.0.0 loaded successfully');
console.log('[SW] Features: Multi-tier caching, Background sync, Push notifications, Offline support');
