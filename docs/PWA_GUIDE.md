# PWA Implementation Guide

## Overview

The Fleet Management System is now a fully-featured Progressive Web App (PWA) with offline support, install capability, and push notifications.

## Features

### 1. Service Worker (v3.0.0)

**Location:** `/public/sw.js`

#### Caching Strategies

##### Multi-Tier Caching
- **Static Cache:** HTML, CSS, JS, icons, manifest
- **Dynamic Cache:** Runtime assets and pages
- **API Cache:** API responses with TTL
- **Image Cache:** Images with cache-first strategy
- **3D Model Cache:** Large GLTF/GLB models
- **Font Cache:** Web fonts

##### Cache Strategies Implemented

**Network First** - For dynamic content
```javascript
/api/v1/vehicles - 5min TTL
/api/v1/drivers - 10min TTL
/api/v1/fleet-stats - 2min TTL
```

**Cache First** - For static assets
```javascript
/api/v1/maintenance - 15min TTL
/api/v1/routes - 30min TTL
Images, fonts, 3D models
```

**Stale While Revalidate** - For HTML and JS
```javascript
Document requests
Static asset requests
```

#### Background Sync

The service worker supports background sync for offline operations:

```javascript
// Automatically syncs when back online
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-fleet-data');
});
```

#### Push Notifications

Service worker handles push notifications with:
- Custom notification content
- Action buttons
- Badge icons
- Vibration patterns
- Click handlers

### 2. IndexedDB Offline Storage

**Location:** `/src/lib/offline-storage.ts`

#### Database Schema

```typescript
interface FleetDB {
  vehicles: Vehicle[];    // Full vehicle records
  drivers: Driver[];      // Driver information
  sync-queue: SyncQueue[]; // Pending operations
  metadata: Metadata[];    // App settings
  cache: Cache[];          // Cached API responses
}
```

#### Usage Examples

```typescript
import {
  saveVehicle,
  getAllVehicles,
  queueForSync,
  initDB
} from '@/lib/offline-storage';

// Initialize database
await initDB();

// Save vehicle offline
await saveVehicle({
  id: 'v123',
  name: 'Truck 1',
  status: 'active',
  mileage: 50000,
  lastUpdated: Date.now()
});

// Get all vehicles (works offline)
const vehicles = await getAllVehicles();

// Queue API request for when back online
await queueForSync(
  '/api/v1/vehicles/v123',
  'PUT',
  { mileage: 50100 },
  'high' // priority
);
```

#### Sync Queue

Operations queued while offline are automatically synced when connection is restored:

```typescript
// Listen for online/offline events
setupOfflineListeners(
  () => console.log('Back online - syncing...'),
  () => console.log('Offline - using cached data')
);
```

### 3. Push Notifications

**Location:** `/src/lib/push-notifications.ts`

#### Setup

1. **Request Permission**
```typescript
import { requestNotificationPermission } from '@/lib/push-notifications';

const permission = await requestNotificationPermission();
if (permission === 'granted') {
  console.log('Notifications enabled');
}
```

2. **Subscribe to Push**
```typescript
import { subscribeToPushNotifications } from '@/lib/push-notifications';

const subscription = await subscribeToPushNotifications();
// Subscription is automatically sent to backend
```

3. **Show Local Notifications**
```typescript
import { showFleetAlert } from '@/lib/push-notifications';

await showFleetAlert(
  'Vehicle V123 requires maintenance',
  'v123'
);
```

#### Notification Templates

```typescript
// Fleet Alert
showFleetAlert(message, vehicleId);

// Maintenance Reminder
showMaintenanceReminder(vehicleName, maintenanceType);

// Driver Assignment
showDriverAssignment(driverName, vehicleName);
```

#### Custom Notifications

```typescript
import { showLocalNotification } from '@/lib/push-notifications';

await showLocalNotification({
  title: 'Custom Alert',
  body: 'This is a custom notification',
  icon: '/icons/icon-192.png',
  badge: '/icons/badge-72.png',
  vibrate: [200, 100, 200],
  tag: 'custom-alert',
  requireInteraction: true,
  data: {
    customField: 'value'
  },
  actions: [
    { action: 'view', title: 'View Details' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
});
```

### 4. Install Prompt

**Location:** `/src/components/common/InstallPrompt.tsx`

The install prompt appears automatically after 30 seconds (configurable) if:
- App is not already installed
- Browser supports PWA installation
- User hasn't dismissed it in the last 7 days

#### Usage

```tsx
import { InstallPrompt } from '@/components/common/InstallPrompt';

function App() {
  return (
    <>
      {/* Your app content */}
      <InstallPrompt
        delay={30000}
        title="Install Fleet Manager"
        description="Get quick access and offline support"
        onInstall={() => console.log('App installed!')}
        onDismiss={() => console.log('User dismissed')}
      />
    </>
  );
}
```

#### Manual Installation

```typescript
import { showInstallPrompt } from '@/components/common/InstallPrompt';

// Trigger install prompt manually
showInstallPrompt();
```

#### Check Installation Status

```typescript
import {
  isAppInstalled,
  isInstallPromptAvailable,
  getInstallationStatus
} from '@/components/common/InstallPrompt';

// Check if installed
const installed = isAppInstalled();

// Check if can install
const canInstall = isInstallPromptAvailable();

// Get full status
const status = getInstallationStatus();
console.log(status);
// {
//   isInstalled: false,
//   canInstall: true,
//   wasDismissed: false
// }
```

## Offline Support

### How It Works

1. **On First Visit**
   - Service worker installs and caches static assets
   - Critical routes are pre-cached

2. **During Normal Use**
   - API responses are cached with TTL
   - Images and assets are cached on first load
   - User can navigate entire app offline

3. **When Offline**
   - Reads from IndexedDB cache
   - Shows offline page for network errors
   - Queues POST/PUT/DELETE requests for later sync

4. **When Back Online**
   - Background sync triggers automatically
   - Queued requests are sent to server
   - Cache is updated with fresh data

### Testing Offline Mode

#### Chrome DevTools
1. Open DevTools (F12)
2. Go to **Application** tab
3. Select **Service Workers**
4. Check **Offline** checkbox

#### Network Panel
1. Open DevTools (F12)
2. Go to **Network** tab
3. Select **Offline** from throttling dropdown

### Offline-First Development

```typescript
import { isOffline } from '@/lib/offline-storage';

async function loadVehicles() {
  if (isOffline()) {
    // Load from IndexedDB
    return await getAllVehicles();
  } else {
    try {
      // Try network first
      const response = await fetch('/api/v1/vehicles');
      const vehicles = await response.json();

      // Save to IndexedDB
      await saveVehicles(vehicles);

      return vehicles;
    } catch (error) {
      // Fallback to IndexedDB
      return await getAllVehicles();
    }
  }
}
```

## Web App Manifest

**Location:** `/public/manifest.json`

### Key Features

- **Display Mode:** `standalone` (full-screen, no browser chrome)
- **Theme Color:** `#1e40af` (primary blue)
- **Icons:** Multiple sizes (16px to 512px) for all devices
- **Shortcuts:** Quick actions for Dashboard, GPS, Maintenance, Reports
- **Share Target:** Accept shared files and URLs
- **Categories:** Business, Productivity, Utilities

### Screenshots

Add screenshots for app stores:

```json
{
  "screenshots": [
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

## Performance Optimizations

### Service Worker Caching

- **Static Cache:** Pre-cache critical assets on install
- **Runtime Cache:** Cache assets as they're requested
- **TTL Expiration:** Automatic cache invalidation
- **Size Limits:** Prevent unlimited cache growth

### IndexedDB

- **Batch Operations:** Save multiple records in single transaction
- **Indexed Queries:** Fast lookups by status, email, etc.
- **Automatic Cleanup:** Remove expired cache entries

### Background Sync

- **Queued Operations:** POST/PUT/DELETE stored for later
- **Priority System:** High/normal/low priority queues
- **Retry Logic:** Automatic retries with exponential backoff

## Browser Support

### Fully Supported
- Chrome 90+
- Edge 90+
- Opera 76+
- Samsung Internet 14+

### Partially Supported
- Safari 15+ (iOS)
  - No background sync
  - No push notifications on iOS
  - Install prompt not supported
- Firefox 90+
  - Push notifications supported
  - Background sync not supported

### Graceful Degradation

The app works in all browsers, with enhanced features for supported browsers:

```typescript
// Check for service worker support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Check for push support
if ('PushManager' in window) {
  // Enable push notifications
}

// Check for background sync
if ('sync' in ServiceWorkerRegistration.prototype) {
  // Enable background sync
}
```

## Debugging

### Service Worker

**Chrome DevTools**
1. Application > Service Workers
2. View active service worker
3. Unregister or update
4. Skip waiting on update

**Console Logging**
```javascript
// Service worker logs are prefixed with [SW]
console.log('[SW] Installing v3.0.0');
```

### IndexedDB

**Chrome DevTools**
1. Application > Storage > IndexedDB
2. Browse databases and object stores
3. View records
4. Delete databases

**Programmatic Inspection**
```typescript
import { getDBStats } from '@/lib/offline-storage';

const stats = await getDBStats();
console.log(stats);
// {
//   vehicles: 150,
//   drivers: 45,
//   syncQueue: 3,
//   metadata: 5,
//   cache: 82
// }
```

### Cache

**Chrome DevTools**
1. Application > Cache Storage
2. View cached resources
3. Clear caches

**Programmatic Clearing**
```typescript
// Send message to service worker
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAR_CACHE'
});
```

## Deployment

### Build for Production

```bash
npm run build
```

This automatically:
- Bundles and minifies code
- Generates service worker
- Optimizes images
- Creates manifest with hashes

### Server Configuration

#### NGINX

```nginx
# Service Worker must be served with correct MIME type
location /sw.js {
    add_header Cache-Control "no-cache";
    add_header Content-Type "application/javascript";
}

# Manifest
location /manifest.json {
    add_header Content-Type "application/manifest+json";
}

# Cache static assets
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Apache

```apache
# Service Worker
<Files "sw.js">
    Header set Cache-Control "no-cache"
    Header set Content-Type "application/javascript"
</Files>

# Manifest
<Files "manifest.json">
    Header set Content-Type "application/manifest+json"
</Files>

# Cache static assets
<LocationMatch "^/assets/">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</LocationMatch>
```

## Best Practices

### 1. Update Service Worker Carefully

```typescript
// In your app
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // Service worker updated
  window.location.reload();
});

// Or prompt user to refresh
if (registration.waiting) {
  showUpdatePrompt(() => {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  });
}
```

### 2. Cache Invalidation

Update `CACHE_VERSION` in service worker when deploying changes:

```javascript
const CACHE_VERSION = 'v3.0.1'; // Increment version
```

### 3. Handle Network Errors

```typescript
try {
  const response = await fetch(url);
  return response.json();
} catch (error) {
  // Check if offline
  if (!navigator.onLine) {
    // Load from cache
    return getCachedData();
  }
  throw error;
}
```

### 4. Optimize Cache Size

```javascript
// In service worker
const MAX_CACHE_SIZE = {
  [DYNAMIC_CACHE]: 100,
  [IMAGE_CACHE]: 200,
};

async function trimCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > MAX_CACHE_SIZE[cacheName]) {
    const toDelete = keys.length - MAX_CACHE_SIZE[cacheName];
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}
```

### 5. Analytics

Track PWA metrics:

```typescript
// Installation
window.addEventListener('appinstalled', () => {
  analytics.track('pwa_installed');
});

// Offline usage
if (!navigator.onLine) {
  analytics.track('offline_usage');
}

// Service worker updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
  analytics.track('sw_updated');
});
```

## Troubleshooting

### Issue: Service Worker Not Installing

**Solution:**
1. Check HTTPS (required for SW)
2. Verify sw.js is accessible
3. Check console for errors
4. Clear browser cache and re-register

### Issue: Offline Page Not Showing

**Solution:**
1. Verify offline.html is in static cache
2. Check network request in DevTools
3. Ensure service worker is active
4. Test with DevTools offline mode

### Issue: Push Notifications Not Working

**Solution:**
1. Check browser support
2. Verify VAPID keys configured
3. Request permission explicitly
4. Check notification settings
5. Test on HTTPS domain

### Issue: Cache Growing Too Large

**Solution:**
1. Implement cache size limits
2. Set appropriate TTL values
3. Clear old caches on update
4. Use cache-first only for static assets

## Next Steps

1. **Add to Home Screen Prompt:** Implement on mobile devices
2. **App Shortcuts:** Add more quick actions to manifest
3. **Share Target:** Handle shared files in app
4. **Periodic Background Sync:** Sync data at intervals
5. **Advanced Caching:** Implement LRU cache eviction

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Service Worker Spec](https://w3c.github.io/ServiceWorker/)
- [Push API Spec](https://w3c.github.io/push-api/)
- [Web App Manifest](https://w3c.github.io/manifest/)
- [Background Sync](https://wicg.github.io/background-sync/spec/)

---

**Last Updated:** 2025-12-31
**Version:** 3.0.0
