/**
 * Fleet Management System - Enhanced Service Worker v2.0.0
 * Advanced caching, offline support, 3D model handling, and background sync
 */

const CACHE_VERSION = 'fleet-v2.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const MODEL_3D_CACHE = `${CACHE_VERSION}-models-3d`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/logos/favicon-16.png',
  '/logos/favicon-32.png',
];

const API_CACHE_CONFIG = {
  '/api/vehicles': { ttl: 1000 * 60 * 5 },
  '/api/drivers': { ttl: 1000 * 60 * 10 },
  '/api/fleet-data': { ttl: 1000 * 60 * 15 },
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2.0.0');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2.0.0');
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(
        names.filter((n) => !n.startsWith(CACHE_VERSION)).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (/\.(png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
  } else if (/\.(gltf|glb|obj|fbx)$/i.test(url.pathname)) {
    event.respondWith(handle3DModelRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

async function handle3DModelRequest(request) {
  const cache = await caches.open(MODEL_3D_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    return new Response('3D Model unavailable', { status: 503 });
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

console.log('[SW] Enhanced Service Worker v2.0.0 loaded');
