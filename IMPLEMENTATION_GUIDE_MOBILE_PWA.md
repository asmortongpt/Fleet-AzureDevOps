# Mobile PWA Implementation Guide

**Priority:** P0 - Critical
**Status:** Implementation Ready
**Last Updated:** November 16, 2025

## Overview

### Business Value
- Access fleet management features on any mobile device
- Works offline with automatic synchronization
- Reduced app development cost (single codebase for iOS/Android)
- Improved user engagement through home screen installation
- Push notifications for critical fleet events
- Significant cost savings vs. native app development

### Technical Complexity
- **Medium:** Requires service worker implementation, offline sync strategy, responsive design
- Leverages existing React infrastructure
- Can share business logic with web app
- Testing across different devices and network conditions is critical

### Key Dependencies
- Existing React web application (already available)
- Service worker support in target browsers
- IndexedDB or localStorage for offline data
- Web app manifest configuration
- Push notification service (Firebase Cloud Messaging)

### Timeline Estimate
- **Phase 1 (Service Worker & Manifest):** 2-3 weeks
- **Phase 2 (Offline Sync):** 2-3 weeks
- **Phase 3 (Responsive Design):** 2-3 weeks
- **Phase 4 (Push Notifications):** 1-2 weeks
- **Phase 5 (Testing & Optimization):** 2-3 weeks
- **Total:** 9-14 weeks

---

## Architecture

### System Diagram
```
┌────────────────────────────────────────────────────────────┐
│                  PWA APPLICATION                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         React Components (Responsive UI)            │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │     Service Worker (Offline Support)                │  │
│  │  • Cache Management                                  │  │
│  │  • Background Sync                                   │  │
│  │  • Push Notifications                                │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │   IndexedDB      │  │  Web App Manifest            │   │
│  │  (Offline Data)  │  │  (Install Configuration)     │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
        │                                  │
        ├─────────────┬──────────────┬────┤
        │             │              │    │
        ▼             ▼              ▼    ▼
    ┌────────┐  ┌─────────┐   ┌─────────┐  ┌──────────┐
    │Browser │  │  Cloud  │   │ Sync    │  │ Push     │
    │Cache   │  │  Sync   │   │ Queue   │  │Notif Svc │
    └────────┘  └─────────┘   └─────────┘  └──────────┘
        │             │              │         │
        └─────────────┼──────────────┴─────────┘
                      │
          ┌───────────▼───────────┐
          │   Backend API Server  │
          │  • REST Endpoints     │
          │  • WebSocket (Real-time)
          │  • Sync Reconciliation │
          └───────────────────────┘
```

### PWA Architecture Layers

#### Layer 1: UI & Presentation
- Responsive React components
- Touch-optimized interactions
- Adaptive layouts for different screen sizes
- Gesture support (swipe, pinch, long-press)

#### Layer 2: Service Worker
- Request interception and caching
- Offline functionality
- Background synchronization
- Push notification handling

#### Layer 3: Data & Storage
- IndexedDB for structured data
- Session storage for temporary state
- Cache API for HTTP responses
- SyncTag for background sync operations

#### Layer 4: Sync & Offline
- Conflict resolution strategy
- Queue-based data synchronization
- Retry logic with exponential backoff
- Partial synchronization support

### Data Flow - Online Mode
```
User Action → React Component → API Call →
Server Response → Update State & UI →
Cache Response
```

### Data Flow - Offline Mode
```
User Action → React Component → Check Offline Status →
IndexedDB Write → Queue Sync Operation →
Show "Pending Sync" Badge
```

### Data Flow - Reconnection
```
Connection Restored → Check Sync Queue →
Validate Cached Data → Batch API Calls →
Reconcile Conflicts → Update IndexedDB →
Clear Queue → Notify User
```

---

## Service Worker Configuration

### Service Worker Registration

```typescript
// src/serviceWorkerSetup.ts
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Clear old service workers to prevent update issues
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope !== new URL('/').pathname) {
          await registration.unregister();
        }
      }

      const registration = await navigator.serviceWorker.register(
        '/sw.js',
        {
          scope: '/',
          updateViaCache: 'none' // Always fetch fresh sw.js
        }
      );

      // Listen for controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update().catch(err => {
          console.error('Service worker update check failed:', err);
        });
      }, 60000); // Check every 60 seconds

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
}
```

### Service Worker Implementation

```typescript
// public/sw.js
const CACHE_NAME = 'fleet-app-v1';
const API_CACHE = 'fleet-api-v1';
const IMAGE_CACHE = 'fleet-images-v1';
const CRITICAL_PATHS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_PATHS)
        .catch(err => console.error('Cache critical resources failed:', err));
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE &&
              cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Static assets: Cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;

        return fetch(request).then((response) => {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // API requests: Network-first strategy
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response.ok) throw new Error('API request failed');

          // Cache successful API responses
          const cache = caches.open(API_CACHE);
          cache.then(c => c.put(request, response.clone()));

          return response;
        })
        .catch(() => {
          // Fall back to cache if offline
          return caches.match(request).then((response) => {
            if (response) return response;

            // Return offline fallback
            return new Response(
              JSON.stringify({ error: 'Offline' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Images: Stale-while-revalidate
  if (isImagePath(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (!networkResponse.ok) return response;

          const cache = caches.open(IMAGE_CACHE);
          cache.then(c => c.put(request, networkResponse.clone()));
          return networkResponse;
        }).catch(() => response);

        return response || fetchPromise;
      })
    );
    return;
  }

  // Default: Network-first
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-updates') {
    event.waitUntil(syncPendingUpdates());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    badge: '/images/badge-128x128.png',
    icon: '/images/icon-192x192.png',
    title: data.title || 'Fleet Alert',
    body: data.message || '',
    tag: data.tag || 'notification',
    data: data.metadata || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if app is already open
      for (let client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Helper functions
function isStaticAsset(pathname) {
  return /\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|gif)$/.test(pathname);
}

function isImagePath(pathname) {
  return /\.(png|jpg|jpeg|gif|svg|webp)$/.test(pathname);
}

async function syncPendingUpdates() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pending_sync', 'readonly');
    const store = tx.objectStore('pending_sync');
    const items = await store.getAll();

    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body ? JSON.stringify(item.body) : undefined
        });

        if (response.ok) {
          // Remove from pending
          const removeTx = db.transaction('pending_sync', 'readwrite');
          removeTx.objectStore('pending_sync').delete(item.id);
        }
      } catch (err) {
        console.error('Sync failed for item:', item.id, err);
      }
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}
```

### Web App Manifest

```json
{
  "name": "Fleet Management System",
  "short_name": "Fleet",
  "description": "Real-time fleet tracking and management application",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#1f2937",
  "icons": [
    {
      "src": "/images/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/icon-256x256.png",
      "sizes": "256x256",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/maskable-icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/images/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/images/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/images/screenshot-2.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "View Live Tracking",
      "short_name": "Tracking",
      "description": "See real-time vehicle locations",
      "url": "/dashboard/tracking?utm_source=shortcut",
      "icons": [
        {
          "src": "/images/shortcut-tracking-96x96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Create Dispatch",
      "short_name": "Dispatch",
      "description": "Create a new dispatch order",
      "url": "/dispatch/create?utm_source=shortcut",
      "icons": [
        {
          "src": "/images/shortcut-dispatch-96x96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "image",
          "accept": ["image/*"]
        }
      ]
    }
  }
}
```

---

## Offline Data Sync Strategy

### IndexedDB Schema

```typescript
// Database schema for offline support
const DB_NAME = 'FleetAppDB';
const DB_VERSION = 1;

interface IndexedDBSchema {
  vehicles: {
    keyPath: 'id';
    indexes: [
      { name: 'fleet_id', unique: false },
      { name: 'status', unique: false }
    ];
  };
  drivers: {
    keyPath: 'id';
    indexes: [
      { name: 'fleet_id', unique: false },
      { name: 'license_number', unique: true }
    ];
  };
  dispatches: {
    keyPath: 'id';
    indexes: [
      { name: 'vehicle_id', unique: false },
      { name: 'status', unique: false },
      { name: 'created_at', unique: false }
    ];
  };
  locations: {
    keyPath: ['vehicle_id', 'timestamp'];
    indexes: [
      { name: 'timestamp', unique: false },
      { name: 'vehicle_id', unique: false }
    ];
  };
  pending_sync: {
    keyPath: 'id';
    indexes: [
      { name: 'created_at', unique: false },
      { name: 'status', unique: false }
    ];
  };
  sync_log: {
    keyPath: 'id';
    indexes: [
      { name: 'timestamp', unique: false },
      { name: 'status', unique: false }
    ];
  };
}
```

### Database Setup & Management

```typescript
// src/lib/offline/indexedDB.ts
class OfflineDatabase {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FleetAppDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('vehicles')) {
          const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
          vehicleStore.createIndex('fleet_id', 'fleet_id', { unique: false });
          vehicleStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('pending_sync')) {
          const syncStore = db.createObjectStore('pending_sync', {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('created_at', 'created_at', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_log')) {
          const logStore = db.createObjectStore('sync_log', {
            keyPath: 'id',
            autoIncrement: true
          });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveVehicles(vehicles: Vehicle[]): Promise<void> {
    return this.writeTransaction('vehicles', 'readwrite', (store) => {
      for (const vehicle of vehicles) {
        store.put(vehicle);
      }
    });
  }

  async queueSyncOperation(operation: SyncOperation): Promise<void> {
    return this.writeTransaction('pending_sync', 'readwrite', (store) => {
      store.add({
        ...operation,
        created_at: new Date(),
        status: 'pending'
      });
    });
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    return this.readTransaction('pending_sync', 'readonly', (store) => {
      return store.index('status').getAll('pending');
    });
  }

  async removePendingSyncOperation(id: number): Promise<void> {
    return this.writeTransaction('pending_sync', 'readwrite', (store) => {
      store.delete(id);
    });
  }

  private writeTransaction(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, mode);
      const store = tx.objectStore(storeName);

      callback(store);

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
    });
  }

  private readTransaction(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = callback(store);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
```

### Offline Sync Strategy

```typescript
// src/lib/offline/syncManager.ts
class SyncManager extends EventTarget {
  private db: OfflineDatabase;
  private isOnline = navigator.onLine;
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;

  constructor(db: OfflineDatabase) {
    super();
    this.db = db;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.dispatchEvent(new CustomEvent('online'));
    this.startSync().catch(console.error);
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.dispatchEvent(new CustomEvent('offline'));
  }

  /**
   * Queue an operation to be synced when online
   */
  async queueOperation(operation: {
    method: 'POST' | 'PUT' | 'DELETE';
    url: string;
    data?: unknown;
    optimisticUpdate?: (data: any) => void;
  }): Promise<void> {
    // Optimistically update local state
    if (operation.optimisticUpdate) {
      operation.optimisticUpdate(operation.data);
    }

    if (this.isOnline) {
      // Try to sync immediately
      try {
        await this.performSync(operation);
      } catch (error) {
        // If it fails, queue it
        await this.db.queueSyncOperation({
          method: operation.method,
          url: operation.url,
          body: operation.data,
          retry_count: 0,
          last_error: String(error)
        });
      }
    } else {
      // Queue for later
      await this.db.queueSyncOperation({
        method: operation.method,
        url: operation.url,
        body: operation.data,
        retry_count: 0
      });

      this.dispatchEvent(new CustomEvent('operation_queued', {
        detail: { operation }
      }));
    }
  }

  /**
   * Start syncing pending operations
   */
  async startSync(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    this.dispatchEvent(new CustomEvent('sync_started'));

    try {
      const operations = await this.db.getPendingSyncOperations();

      for (const operation of operations) {
        try {
          await this.performSync(operation);
          await this.db.removePendingSyncOperation(operation.id);

          this.dispatchEvent(new CustomEvent('operation_synced', {
            detail: { operation }
          }));
        } catch (error) {
          // Log error and continue with next operation
          await this.logSyncError(operation, error);

          // Implement exponential backoff
          if (operation.retry_count < 5) {
            operation.retry_count++;
            await this.db.queueSyncOperation(operation);
          }
        }
      }

      this.dispatchEvent(new CustomEvent('sync_completed', {
        detail: { successCount: operations.length }
      }));
    } finally {
      this.isSyncing = false;
    }
  }

  private async performSync(operation: SyncOperation): Promise<Response> {
    const response = await fetch(operation.url, {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Operation': 'true'
      },
      body: operation.body ? JSON.stringify(operation.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private async logSyncError(operation: SyncOperation, error: unknown): Promise<void> {
    await this.db.addSyncLog({
      operation_id: operation.id,
      status: 'error',
      error: String(error),
      timestamp: new Date()
    });
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  isPending(): boolean {
    return this.isSyncing;
  }
}
```

---

## Responsive Breakpoint Strategy

### Tailwind CSS Breakpoints
```typescript
// tailwind.config.ts
const breakpoints = {
  xs: '320px',   // Extra small phones
  sm: '640px',   // Small phones
  md: '768px',   // Tablets (portrait)
  lg: '1024px',  // Tablets (landscape)
  xl: '1280px',  // Small laptops
  '2xl': '1536px' // Large screens
};
```

### Responsive Component Examples

```typescript
// Mobile-first responsive layout
export function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
      <MapCard />
      <MetricsCard />
      <AlertsCard />
    </div>
  );
}

// Responsive typography
export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
      {children}
    </h1>
  );
}

// Responsive sidebar
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Mobile: overlay sidebar, Desktop: permanent */}
      <aside className={`
        fixed lg:static
        inset-y-0 left-0
        w-64 bg-gray-900
        transform lg:transform-none
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar content */}
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

---

## Touch Optimization Patterns

### Touch-Friendly Targets

```typescript
// Ensure minimum 44x44px touch targets
const touchTargetStyles = `
  min-h-[44px]
  min-w-[44px]
  p-3
`;

export function TouchButton({ children, ...props }) {
  return (
    <button
      className={`
        ${touchTargetStyles}
        rounded-lg
        active:bg-gray-100
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
      `}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Gesture Handling

```typescript
// src/hooks/useGestures.ts
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Usage
export function SwipeableCard() {
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture(
    () => console.log('Swiped left'),
    () => console.log('Swiped right')
  );

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Card content */}
    </div>
  );
}
```

### Long Press Detection

```typescript
export function useLongPress(callback: () => void, delay = 500) {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const onMouseDown = () => {
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      callback();
    }, delay);
  };

  const onMouseUp = () => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return { onMouseDown, onMouseUp, isPressed };
}
```

---

## Push Notification Setup

### Firebase Cloud Messaging (FCM) Integration

```typescript
// src/lib/pushNotifications.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestPushNotificationPermission(): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }
    }

    // Get registration token
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FCM_VAPID_KEY
    });

    if (token) {
      // Send token to backend
      await sendTokenToServer(token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Failed to get notification token:', error);
    return null;
  }
}

export function listenForNotifications(): void {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);

    if (payload.notification) {
      new Notification(payload.notification.title || '', {
        body: payload.notification.body,
        icon: payload.notification.icon || '/images/icon-192x192.png',
        badge: '/images/badge-128x128.png',
        data: payload.data
      });
    }
  });
}

async function sendTokenToServer(token: string): Promise<void> {
  await fetch('/api/v1/notifications/register-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
}
```

### Push Notification Types

```typescript
interface PushNotificationTypes {
  // Vehicle alerts
  vehicle_overspeed: {
    title: 'Speed Alert';
    body: `Vehicle ${vehicleId} exceeding speed limit`;
  };

  // Geofence events
  geofence_entry: {
    title: 'Geofence Alert';
    body: `Vehicle ${vehicleId} entered ${geofenceName}`;
  };

  // Dispatch updates
  dispatch_assigned: {
    title: 'New Dispatch';
    body: `Dispatch ${dispatchId} assigned to you`;
  };

  // Maintenance alerts
  maintenance_due: {
    title: 'Maintenance Alert';
    body: `Vehicle ${vehicleId} maintenance due`;
  };

  // Critical alerts
  accident_detected: {
    title: 'Critical Alert';
    body: `Potential accident detected - Vehicle ${vehicleId}`;
  };
}
```

---

## Installation Flow

### Install Prompt

```typescript
// src/components/InstallPrompt.tsx
export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const beforeInstallPromptHandler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
      <h3 className="font-bold mb-2">Install Fleet App</h3>
      <p className="text-gray-600 text-sm mb-4">
        Get quick access to fleet management on your home screen
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded"
        >
          Later
        </button>
      </div>
    </div>
  );
}
```

### Installation Success Tracking

```typescript
// Track successful installs
useEffect(() => {
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    // Track in analytics
    analytics.trackEvent('pwa_installed');
  });
}, []);

// Detect if already installed
function isAppInstalled(): boolean {
  return (
    window.navigator.standalone === true ||
    (window.matchMedia('(display-mode: standalone)').matches)
  );
}
```

---

## Testing on iOS and Android

### iOS Testing

```typescript
// Safari requirements for iOS PWA
// manifest.json: add apple-specific meta tags
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Fleet">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

// Testing checklist:
// - [ ] Can add to home screen (iOS 16.4+)
// - [ ] Splash screen displays correctly
// - [ ] Status bar styling works
// - [ ] Safe area insets respected (notch, home indicator)
// - [ ] Touch icons display properly
// - [ ] Offline pages load correctly
// - [ ] Gestures work (swipe back disabled)
```

### Android Testing

```typescript
// Android testing checklist:
// - [ ] Install prompt shows after use
// - [ ] App installs to home screen
// - [ ] Standalone mode displays correctly
// - [ ] Status bar color matches theme
// - [ ] Back button works correctly
// - [ ] Web content debugging via DevTools
// - [ ] Notification permissions grant correctly
// - [ ] Location permissions work
```

### Testing Tools

```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse https://localhost:5173 --view

# Service worker debugging
# Chrome DevTools > Application > Service Workers

# Device testing
# Android: chrome://inspect
# iOS: Safari > Develop menu

# Emulators
android-studio  # Android emulator
Xcode          # iOS simulator
```

---

## Performance Benchmarks & Core Web Vitals

### Target Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Largest Contentful Paint (LCP)** | < 2.5s | Critical |
| **First Input Delay (FID)** | < 100ms | Critical |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Critical |
| **First Contentful Paint (FCP)** | < 1.8s | Important |
| **Time to Interactive (TTI)** | < 3.8s | Important |

### Optimization Strategies

```typescript
// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Dispatch = lazy(() => import('./pages/Dispatch'));

// Image optimization
export function OptimizedImage({ src, alt, ...props }) {
  return (
    <picture>
      <source
        srcSet={`${src}?w=1280&h=720&fit=cover&webp`}
        type="image/webp"
      />
      <source
        srcSet={`${src}?w=1280&h=720&fit=cover`}
        type="image/jpeg"
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </picture>
  );
}

// Font optimization
import { inter, roboto } from '@next/font/google';

const inter = Inter({ subsets: ['latin'] });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'] });

// Resource hints
<link rel="preconnect" href="https://api.fleet.local" />
<link rel="dns-prefetch" href="https://cdn.example.com" />
<link rel="prefetch" href="/pages/next-page.js" />
```

### Monitoring Performance

```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

reportWebVitals();

// Analytics integration
function sendMetric(metric: Metric) {
  const body = JSON.stringify(metric);

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/v1/analytics/metrics', body);
  } else {
    fetch('/api/v1/analytics/metrics', { method: 'POST', body });
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('SyncManager', () => {
  let syncManager: SyncManager;
  let db: OfflineDatabase;

  beforeEach(async () => {
    db = new OfflineDatabase();
    await db.initialize();
    syncManager = new SyncManager(db);
  });

  it('should queue operation when offline', async () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false }
    });

    await syncManager.queueOperation({
      method: 'POST',
      url: '/api/vehicles',
      data: { name: 'Vehicle 1' }
    });

    // Verify operation was queued
    expect(await db.getPendingSyncOperations()).toHaveLength(1);
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('PWA can be installed on home screen', async ({ browser }) => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173');

  // Simulate beforeinstallprompt
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
  });

  // Click install button
  await page.click('[data-test="install-button"]');

  // Verify prompt shows
  await expect(page).toContainText('Install Fleet');
});
```

---

## Security Considerations

### Content Security Policy

```typescript
// headers configuration
const csp = "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +  // Required for service worker
  "connect-src 'self' https://api.fleet.local https://api.firebase.com; " +
  "img-src 'self' data: https:; " +
  "style-src 'self' 'unsafe-inline'; " +
  "font-src 'self' data:; " +
  "manifest-src 'self'; " +
  "worker-src 'self';";
```

### HTTPS Requirement

- All PWA content must be served over HTTPS
- Self-signed certificates acceptable for development only
- Must use valid certificates in production

### Sensitive Data Storage

```typescript
// DON'T store in IndexedDB
// - Auth tokens
// - API keys
// - Passwords

// Store in memory only
// - Session tokens (cleared on logout)
// - Temporary credentials

// Store in secure storage
// - User preferences (non-sensitive)
// - Cached data with expiration
```

---

## Deployment Plan

### Phase 1: Foundation (Weeks 1-3)
- [ ] Set up service worker
- [ ] Create web app manifest
- [ ] Implement offline storage (IndexedDB)
- [ ] Add PWA detection
- [ ] Deploy to staging

### Phase 2: Features (Weeks 4-7)
- [ ] Implement sync manager
- [ ] Add push notifications
- [ ] Create responsive layouts
- [ ] Touch optimization
- [ ] Installation flow

### Phase 3: Testing (Weeks 8-10)
- [ ] Device testing (iOS/Android)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Accessibility testing
- [ ] Lighthouse scoring

### Phase 4: Launch (Weeks 11-14)
- [ ] Beta rollout (10% users)
- [ ] Monitoring & feedback
- [ ] Bug fixes
- [ ] Full rollout
- [ ] Documentation

### Monitoring

```typescript
const metrics = {
  pwInstallationRate: 'pct of users who install',
  offlineUsageRate: 'pct of offline actions',
  syncSuccessRate: 'pct of successful syncs',
  crashRate: 'crashes per 100 users',
  performanceScore: 'Lighthouse score',
  userSatisfaction: 'app store rating'
};
```

---

## Rollback Plan

1. **Service Worker Issue:** Serve fallback sw.js that disables caching
2. **Installation Issues:** Remove manifest.json from production
3. **Sync Issues:** Disable background sync feature flag
4. **Critical Bugs:** Roll back to previous build version

---

## Success Metrics

- PWA installation rate: > 25% of web users
- Offline page views: > 15% of total
- Sync success rate: > 99.5%
- Lighthouse score: > 90
- User satisfaction: > 4.3/5.0
- Performance: LCP < 2.5s, CLS < 0.1

---

**Document Version:** 1.0
**Last Updated:** November 16, 2025
**Owner:** Technical Implementation Specialist
**Status:** Ready for Engineering Review
