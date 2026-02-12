// Service Worker for PWA Offline Support
// Provides offline caching, background sync, push notifications
/// <reference lib="webworker" />

import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import logger from '@/utils/logger';

declare const self: ServiceWorkerGlobalScope;

// Precache all build assets
precacheAndRoute((self as any).__WB_MANIFEST);

// Cache API responses with Network First strategy
registerRoute(
  ({ url }: any) => url.pathname.startsWith('/api/v1/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
  })
);

// Cache images with Cache First strategy
registerRoute(
  ({ request }: any) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache static assets with Stale While Revalidate
registerRoute(
  ({ request }: any) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-cache',
  })
);

// Background Sync for offline mutations
const bgSyncPlugin = new BackgroundSyncPlugin('fleet-mutations', {
  maxRetentionTime: 24 * 60, // 24 hours in minutes
});

registerRoute(
  ({ url, request }: any) =>
    url.pathname.startsWith('/api/v1/') &&
    (request.method === 'POST' ||
      request.method === 'PATCH' ||
      request.method === 'DELETE'),
  new NetworkFirst({
    cacheName: 'mutations-cache',
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// Push Notification Handling
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New fleet notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Fleet Alert', options)
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  );
});

// Periodic Background Sync (for vehicle location updates)
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'sync-vehicle-locations') {
    event.waitUntil(syncVehicleLocations());
  }
});

async function syncVehicleLocations() {
  try {
    const response = await fetch('/api/v1/vehicles/sync-locations', {
      method: 'POST',
    });

    if (response.ok) {
      logger.info('Vehicle locations synced');
    }
  } catch (error) {
    logger.error('Background sync failed:', error);
  }
}

// Install event
self.addEventListener('install', (_event: any) => {
  logger.info('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event: any) => {
  logger.info('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});
