# CTAFleet Service Worker Cache Strategy

## Overview

This document explains the service worker caching strategy and how to handle cache-related issues, particularly the "white screen" problem caused by stale cached assets.

## The Problem: Cache Poisoning

**What happened:**
- Vite builds create content-hashed JavaScript bundles (e.g., `index-C9M4iZQ2.js`)
- On each deployment, these hash values change (e.g., `index-CouUt7cy.js`)
- The old service worker used **cache-first** strategy for `index.html`
- Users with cached `index.html` were loading old HTML that referenced non-existent JS bundles
- Result: 404 errors on JavaScript files → White screen

## The Solution: Smart Cache Strategy

### Current Implementation (v1.0.2)

| Resource Type | Strategy | Reason |
|--------------|----------|--------|
| **index.html** | Network-first (NEVER cache) | Ensures users always get latest HTML with correct bundle references |
| **runtime-config.js** | Network-first (NEVER cache) | Dynamic config must be fresh on every load |
| **JS/CSS bundles** | Stale-while-revalidate | Fast initial load, auto-updates in background |
| **API data** | Network-first with cache fallback | Fresh data when online, cached data when offline |
| **Static assets** | Cache-first | Icons, fonts, images can be cached aggressively |

### Key Features

1. **Automatic Cache Invalidation**
   - Cache version: `ctafleet-v1.0.2`
   - On activation, ALL old caches are deleted
   - `skipWaiting()` + `clients.claim()` ensures immediate activation

2. **Service Worker Update Detection**
   - Checks for updates every 60 seconds
   - Quick checks every 10 seconds for first 2 minutes after page load
   - Automatic page reload when new SW version activates

3. **Client Notification**
   - Service worker sends `SW_UPDATED` message to all clients
   - Clients automatically reload to apply updates

## Cache Clear Utility

For users experiencing white screen issues:

### Option 1: Cache Clear Page
Navigate to: `https://your-domain.com/clear-cache.html`

This page will:
1. Unregister all service workers
2. Clear all application caches
3. Clear localStorage and sessionStorage
4. Clear IndexedDB databases
5. Reload the page with fresh content

### Option 2: Manual Browser Clear
1. Open DevTools (F12)
2. Go to Application → Storage
3. Click "Clear site data"
4. Reload the page

### Option 3: Incognito/Private Mode
- Open the app in incognito/private browsing mode
- No cached data will be used

## Service Worker Lifecycle

```
┌─────────────┐
│   Install   │  ← New SW downloaded, caches offline.html & manifest.json
└──────┬──────┘
       │ skipWaiting()
       ↓
┌─────────────┐
│  Activate   │  ← Delete old caches, claim all clients
└──────┬──────┘
       │ clients.claim()
       ↓
┌─────────────┐
│   Fetch     │  ← Intercept requests, apply cache strategies
└─────────────┘
```

## For Developers

### Testing Service Worker Updates

1. **Local testing:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Force update:**
   - DevTools → Application → Service Workers
   - Click "Update" or "Unregister"
   - Reload page

3. **Bypass service worker:**
   - DevTools → Application → Service Workers
   - Check "Bypass for network"
   - Or use DevTools → Network → "Disable cache"

### Deploying Service Worker Changes

When you update `public/sw.js`:

1. **Increment CACHE_VERSION:**
   ```javascript
   const CACHE_VERSION = 'ctafleet-v1.0.3'; // Bump this
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # Deploy dist/ folder
   ```

3. **User experience:**
   - Users will get new SW within 60 seconds (or 10 seconds if page just loaded)
   - Page automatically reloads when new SW activates
   - Old caches are deleted automatically

### Never Cache These Files

```javascript
const NEVER_CACHE = [
  '/index.html',
  '/',
  '/runtime-config.js',
];
```

These files MUST always be fetched from network (except when truly offline) to prevent cache poisoning.

## Troubleshooting

### White Screen Issue

**Symptoms:**
- App shows blank white screen
- DevTools Console shows 404 errors for JS bundles
- E.g., `Failed to load resource: index-C9M4iZQ2.js (404)`

**Root cause:**
- Cached `index.html` references old JS bundle that no longer exists

**Fix:**
1. Visit `/clear-cache.html?autoclear=1` to auto-clear
2. Or manually clear site data in DevTools
3. Or use incognito mode

### Service Worker Not Updating

**Symptoms:**
- Console shows old CACHE_VERSION
- Changes not appearing

**Fix:**
1. Check DevTools → Application → Service Workers
2. Click "Unregister" on old service worker
3. Reload page to register new version
4. Verify CACHE_VERSION in console logs

### Cache Not Being Used Offline

**Symptoms:**
- App doesn't work offline
- No cached data available

**Expected behavior:**
- `index.html` and `runtime-config.js` are NEVER cached (by design)
- JS/CSS bundles ARE cached (stale-while-revalidate)
- Offline page (`offline.html`) is served for navigation when truly offline

## Monitoring

### DevTools Console Logs

Look for these key messages:

```
[ServiceWorker] Installing version: ctafleet-v1.0.2
[ServiceWorker] Activating version: ctafleet-v1.0.2
[ServiceWorker] Deleting old cache: ctafleet-cache-ctafleet-v1.0.1-fix-white-screen
[ServiceWorker] Claimed all clients
[ServiceWorker] Network-only (never cache): /index.html
```

### Production Monitoring

After deployment:
1. Check Azure Static Web App deployment status
2. Visit app URL and check console for new CACHE_VERSION
3. Verify old caches are deleted (Application → Cache Storage)
4. Test offline functionality

## Cache Strategy Decision Matrix

| Scenario | Strategy | Example |
|----------|----------|---------|
| HTML entry point | Network-only | `index.html` |
| Vite bundles (content-hashed) | Stale-while-revalidate | `index-CouUt7cy.js` |
| API data | Network-first | `/api/vehicles` |
| User-uploaded images | Cache-first | `/uploads/vehicle-123.jpg` |
| Static icons | Cache-first | `/icons/icon-192x192.png` |

## Version History

- **v1.0.0** - Initial service worker (cache-first for all static assets)
- **v1.0.1-fix-white-screen** - First attempt at fixing cache poisoning
- **v1.0.2** - Complete fix: Network-first for index.html, stale-while-revalidate for bundles, auto-reload on update

## Future Improvements

1. **Precaching optimization**: Use Workbox for intelligent precaching
2. **Background sync**: Implement retry logic for failed API requests
3. **Push notifications**: Enable real-time alerts for fleet events
4. **Offline queue**: Store user actions while offline, sync when online
5. **Cache size management**: Limit cache size to prevent storage bloat
