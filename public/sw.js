/**
 * Service Worker for CTAFleet PWA
 * Provides offline support, caching strategies, and background sync
 *
 * CACHE STRATEGY:
 * - index.html: Network-first (CRITICAL - prevents cache poisoning)
 * - JS/CSS bundles: Stale-while-revalidate (fast load + auto-update)
 * - API data: Network-first with cache fallback
 * - Static assets: Cache-first for offline support
 */

const CACHE_VERSION = 'ctafleet-v1.0.2';
const CACHE_NAME = `ctafleet-cache-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `ctafleet-data-${CACHE_VERSION}`;

// Critical assets that MUST NOT be cached (always fetch fresh)
const NEVER_CACHE = [
  '/index.html',
  '/',
  '/runtime-config.js',
];

// Assets to cache on install (offline fallback only)
const STATIC_CACHE_URLS = [
  '/manifest.json',
  '/offline.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching offline fallback assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting to activate immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating version:', CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // Delete ALL old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete any ctafleet cache that's not current version
              return cacheName.startsWith('ctafleet-') &&
                     cacheName !== CACHE_NAME &&
                     cacheName !== DATA_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients immediately (force reload of cached pages)
      self.clients.claim().then(() => {
        console.log('[ServiceWorker] Claimed all clients');
        // Notify all clients to reload
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            console.log('[ServiceWorker] Notifying client to reload:', client.url);
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION,
              message: 'New version available - page will reload'
            });
          });
        });
      })
    ])
  );
});

// Fetch event - implement smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // CRITICAL: NEVER cache index.html or runtime-config.js - always fetch fresh
  if (NEVER_CACHE.some(path => url.pathname === path || url.pathname === path + 'index.html')) {
    console.log('[ServiceWorker] Network-only (never cache):', url.pathname);
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => {
          // Only if truly offline, serve cached offline page for navigation
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((response) => {
              if (response) {
                console.log('[ServiceWorker] Serving API from cache:', url.pathname);
                return response;
              }
              // Return offline error for failed API requests
              return new Response(
                JSON.stringify({ error: 'Offline', offline: true }),
                {
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                }
              );
            });
        })
    );
    return;
  }

  // JavaScript/CSS bundles - Stale-while-revalidate for fast load + auto-update
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Update cache with fresh version
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Network failed - return cached version if available
              return cachedResponse;
            });

          // Return cached version immediately if available, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // All other static assets - Cache first with network fallback
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      syncData()
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CTAFleet', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.payload))
    );
  }
});

// Helper function to sync offline data
async function syncData() {
  try {
    // Get all pending requests from IndexedDB
    const db = await openDatabase();
    const pendingRequests = await getPendingRequests(db);

    // Replay all pending requests
    for (const request of pendingRequests) {
      try {
        await fetch(request.url, request.options);
        await removePendingRequest(db, request.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers (simplified - expand as needed)
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ctafleet-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingRequests(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-requests'], 'readonly');
    const store = transaction.objectStore('pending-requests');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingRequest(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-requests'], 'readwrite');
    const store = transaction.objectStore('pending-requests');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[ServiceWorker] Loaded');
