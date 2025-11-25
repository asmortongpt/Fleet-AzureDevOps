/**
 * Service Worker - DISABLED FOR EMERGENCY CACHE FIX
 * This service worker immediately unregisters itself and clears all caches
 */

console.log('[ServiceWorker] EMERGENCY: Unregistering and clearing all caches');

// Immediately unregister this service worker
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] EMERGENCY: Install - skipping wait');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] EMERGENCY: Activate - clearing ALL caches');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log(`[ServiceWorker] EMERGENCY: Deleting ${cacheNames.length} cache(s):`, cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`[ServiceWorker] EMERGENCY: Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] EMERGENCY: Claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients to unregister
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'EMERGENCY_UNREGISTER',
              message: 'Service worker disabled - please refresh'
            });
          });
        });
      })
      .then(() => {
        console.log('[ServiceWorker] EMERGENCY: Unregistering self');
        return self.registration.unregister();
      })
  );
});

// Do NOT intercept any fetch requests - let everything go to network
self.addEventListener('fetch', (event) => {
  // Pass through - no caching
  return;
});

console.log('[ServiceWorker] EMERGENCY MODE LOADED');
