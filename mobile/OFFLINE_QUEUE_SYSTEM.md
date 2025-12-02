# Fleet Mobile Offline Queue and Synchronization System

## Overview

Complete offline-first architecture for the Fleet mobile app built with React Native. This system ensures the app works seamlessly without internet connectivity and automatically syncs when connection is restored.

## Architecture Components

### 1. **OfflineQueueService**
Location: `/home/user/Fleet/mobile/src/services/OfflineQueueService.ts`

Priority-based queue manager that handles all offline API requests.

**Features:**
- Priority queue (HIGH, MEDIUM, LOW)
- Persistent storage with SQLite
- Automatic retry with exponential backoff
- Request/response interceptors
- Batch processing
- Event system for monitoring

**Key Methods:**
```typescript
// Add request to queue
await queueService.enqueue(url, method, {
  body: data,
  priority: Priority.HIGH,
  resourceType: 'vehicle',
  resourceId: '123'
});

// Process queue
const results = await queueService.processQueue();

// Get statistics
const stats = await queueService.getStats();
```

### 2. **SyncManager**
Location: `/home/user/Fleet/mobile/src/services/SyncManager.ts`

Orchestrates all synchronization operations and monitors network connectivity.

**Features:**
- Network state monitoring via NetInfo
- Automatic sync on connection restore
- Background sync with BackgroundFetch
- Periodic sync (configurable interval)
- Incremental sync (only changed data)
- WiFi-only sync option

**Key Methods:**
```typescript
// Start sync
await syncManager.startSync();

// Incremental sync
await syncManager.startIncrementalSync();

// Sync high priority only
await syncManager.syncHighPriority();

// Force sync (even offline)
await syncManager.forceSync();
```

### 3. **ConflictResolver**
Location: `/home/user/Fleet/mobile/src/services/ConflictResolver.ts`

Handles data conflicts between local and server versions.

**Features:**
- Automatic conflict detection
- Multiple resolution strategies
- Custom merge strategies
- Conflict UI for manual resolution

**Resolution Strategies:**
- **SERVER_WINS**: Server data takes precedence
- **CLIENT_WINS**: Local data takes precedence
- **LAST_WRITE_WINS**: Most recent timestamp wins
- **MERGE**: Field-level merge with custom logic
- **MANUAL**: User chooses resolution

**Key Methods:**
```typescript
// Detect conflict
const conflict = await conflictResolver.detectConflict(
  queueItemId,
  'vehicle',
  '123',
  localData,
  serverData
);

// Resolve conflict
const resolved = await conflictResolver.resolveConflict(conflict.id, {
  strategy: ConflictResolution.MERGE
});

// Auto-resolve all conflicts
await conflictResolver.autoResolveAll();
```

### 4. **DataPersistence**
Location: `/home/user/Fleet/mobile/src/services/DataPersistence.ts`

Manages all data persistence operations.

**Features:**
- SQLite database for structured data
- AsyncStorage for key-value pairs
- File system for photos/documents
- Cache management with expiration
- Database migrations
- Storage statistics

**Database Tables:**
- `queue_items` - Offline queue
- `conflicts` - Data conflicts
- `cache` - API response cache
- `sync_metadata` - Sync state
- `attachments` - Files metadata

**Key Methods:**
```typescript
// Set cache
await persistence.setCache('vehicles', data, 3600000); // 1 hour

// Get cache
const data = await persistence.getCache('vehicles');

// Save file
const path = await persistence.saveFile(fileName, data, 'photo');

// Get storage stats
const stats = await persistence.getStorageStats();
```

### 5. **OfflineIndicator Component**
Location: `/home/user/Fleet/mobile/src/components/OfflineIndicator.tsx`

React Native UI component for displaying sync status.

**Features:**
- Network status banner
- Pending sync count badge
- Conflict count badge
- Sync progress bar
- Force sync button
- Detailed sync status dialog
- Auto-hide when synced

**Usage:**
```tsx
import { OfflineIndicator } from './components/OfflineIndicator';

<OfflineIndicator
  autoHide={true}
  position="top"
  showSyncButton={true}
  showConflictCount={true}
  onConflictPress={() => navigation.navigate('Conflicts')}
/>
```

### 6. **Queue Types**
Location: `/home/user/Fleet/mobile/src/types/queue.ts`

TypeScript type definitions for the entire system.

**Key Types:**
- `QueueItem` - Queue item structure
- `DataConflict` - Conflict data
- `SyncProgress` - Sync progress info
- `NetworkState` - Network status
- `SyncResult` - Sync result
- `QueueConfig` - Configuration

## Sync Flow Diagrams

### 1. Request Flow (Online)

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   API Request    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐      YES     ┌──────────────┐
│  Check Network   ├─────────────►│ Send Request │
└──────┬───────────┘              └──────┬───────┘
       │                                  │
       │ NO                               ▼
       ▼                          ┌──────────────┐
┌──────────────────┐              │   Response   │
│  Add to Queue    │              └──────┬───────┘
└──────────────────┘                     │
                                         ▼
                                  ┌──────────────┐
                                  │  Update UI   │
                                  └──────────────┘
```

### 2. Request Flow (Offline)

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   API Request    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐      NO      ┌──────────────────┐
│  Check Network   ├─────────────►│  Add to Queue    │
└──────────────────┘              └──────┬───────────┘
                                         │
                                         ▼
                                  ┌──────────────────┐
                                  │ Save to SQLite   │
                                  └──────┬───────────┘
                                         │
                                         ▼
                                  ┌──────────────────┐
                                  │ Update UI        │
                                  │ (Show Pending)   │
                                  └──────────────────┘
```

### 3. Sync Flow (Connection Restored)

```
┌─────────────────┐
│ Connection      │
│ Restored        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SyncManager     │
│ Detects Online  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Get Pending Items   │
│ from Queue          │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Sort by Priority    │
│ HIGH → MED → LOW    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Process in Batches  │
│ (10 items/batch)    │
└────────┬────────────┘
         │
         ▼
    ┌────┴────┐
    │ Success?│
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│ Remove  │ │ Check Retry  │
│ from    │ │ Count        │
│ Queue   │ └──────┬───────┘
└─────────┘        │
                   ▼
            ┌──────────────┐
            │ < Max Retry? │
            └──────┬───────┘
                   │
              ┌────┴────┐
              │         │
             YES       NO
              │         │
              ▼         ▼
       ┌─────────┐  ┌─────────┐
       │Schedule │  │Mark as  │
       │ Retry   │  │Failed   │
       └─────────┘  └─────────┘
```

### 4. Conflict Resolution Flow

```
┌─────────────────┐
│ Sync Response   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Compare Timestamps  │
│ Local vs Server     │
└────────┬────────────┘
         │
         ▼
    ┌────┴────┐
    │Conflict?│
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ Create  │ │ Apply    │
│Conflict │ │ Server   │
│ Record  │ │ Data     │
└────┬────┘ └──────────┘
     │
     ▼
┌─────────────────────┐
│ Determine Strategy  │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Auto   │ │Manual  │
│Resolve │ │Resolve │
└───┬────┘ └───┬────┘
    │          │
    │          ▼
    │    ┌──────────┐
    │    │Show UI   │
    │    │Conflict  │
    │    │Dialog    │
    │    └────┬─────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Apply Resolved  │
│ Data            │
└─────────────────┘
```

### 5. Exponential Backoff Strategy

```
Retry Attempt │ Delay (seconds)
─────────────────────────────────
      1       │      1 + jitter
      2       │      2 + jitter
      3       │      4 + jitter
      4       │      8 + jitter
      5       │     16 + jitter
    > 5       │   FAILED (max)

jitter = random(0, 1000ms)
Max delay = 5 minutes (300,000ms)
```

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Mobile App UI                        │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Vehicle   │  │Inspection  │  │  OfflineIndicator│  │
│  │  Screen    │  │  Form      │  │     Component    │  │
│  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
└────────┼────────────────┼──────────────────┼────────────┘
         │                │                  │
         └────────────────┼──────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │         SyncManager             │
         │  - Network monitoring           │
         │  - Sync orchestration           │
         │  - Background sync              │
         └────────┬──────────┬─────────────┘
                  │          │
      ┌───────────┘          └───────────┐
      │                                  │
┌─────▼──────────────┐      ┌────────────▼──────────┐
│ OfflineQueueService│      │  ConflictResolver     │
│ - Priority queue   │      │  - Detect conflicts   │
│ - Retry logic      │      │  - Resolution         │
│ - Event system     │      │  - Merge strategies   │
└─────┬──────────────┘      └────────────┬──────────┘
      │                                  │
      └───────────┬──────────────────────┘
                  │
         ┌────────▼─────────────┐
         │  DataPersistence     │
         │  - SQLite            │
         │  - AsyncStorage      │
         │  - File System       │
         └──┬──────────┬────────┘
            │          │
    ┌───────┘          └────────┐
    │                           │
┌───▼────────┐         ┌────────▼──────┐
│  SQLite DB │         │  AsyncStorage │
│  - Queue   │         │  - Cache      │
│  - Cache   │         │  - Config     │
│  Conflicts │         └───────────────┘
└────────────┘
```

## Configuration

Default configuration can be customized:

```typescript
import OfflineQueueService from './services/OfflineQueueService';

const queueService = OfflineQueueService.getInstance({
  maxRetries: 5,                // Max retry attempts
  baseRetryDelay: 1000,         // Base delay (1 second)
  maxRetryDelay: 300000,        // Max delay (5 minutes)
  exponentialBase: 2,           // Exponential factor
  batchSize: 10,                // Items per batch
  syncInterval: 60000,          // Sync interval (1 minute)
  requireWifi: false,           // Require WiFi for sync
  persistQueue: true,           // Persist queue to disk
});
```

## Usage Examples

### Initialize Services

```typescript
import SyncManager from './services/SyncManager';
import DataPersistence from './services/DataPersistence';

// In App.tsx
useEffect(() => {
  const init = async () => {
    await DataPersistence.initialize();
    await SyncManager.getInstance().initialize();
  };

  init();
}, []);
```

### Queue API Request

```typescript
import OfflineQueueService from './services/OfflineQueueService';
import { Priority, HttpMethod, OperationType } from './types/queue';

// Create vehicle inspection
const queueItem = await OfflineQueueService.enqueue(
  'https://api.fleet.com/v1/inspections',
  HttpMethod.POST,
  {
    body: {
      vehicleId: 'V123',
      status: 'passed',
      checklist: { tires: true, lights: true }
    },
    priority: Priority.HIGH,
    operationType: OperationType.CREATE,
    resourceType: 'inspection',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### Monitor Sync Status

```typescript
import SyncManager from './services/SyncManager';

const syncManager = SyncManager.getInstance();

// Add listener
syncManager.addStateListener((state) => {
  console.log('Network:', state.networkState);
  console.log('Syncing:', state.isSyncing);
  console.log('Progress:', state.syncProgress);
  console.log('Last sync:', state.lastSyncTime);
});

// Get current state
const state = syncManager.getSyncState();
```

### Handle Conflicts

```typescript
import ConflictResolver from './services/ConflictResolver';
import { ConflictResolution } from './types/queue';

// Register custom merge strategy for vehicles
ConflictResolver.registerMergeStrategy('vehicle', async (local, server, conflict) => {
  // Custom merge logic
  return {
    ...server,
    // Keep local odometer if higher
    odometer: Math.max(local.odometer, server.odometer),
    // Merge maintenance records
    maintenance: [...local.maintenance, ...server.maintenance],
  };
});

// Get unresolved conflicts
const conflicts = await ConflictResolver.getAllConflicts(false);

// Resolve manually
await ConflictResolver.resolveConflict(conflict.id, {
  strategy: ConflictResolution.CLIENT_WINS
});
```

### Cache API Responses

```typescript
import DataPersistence from './services/DataPersistence';

// Cache for 1 hour
await DataPersistence.setCache('vehicles', vehiclesData, 3600000);

// Get from cache
const vehicles = await DataPersistence.getCache('vehicles');

// Remove cache
await DataPersistence.removeCache('vehicles');

// Clear all cache
await DataPersistence.clearCache();
```

### Store Files

```typescript
import DataPersistence from './services/DataPersistence';

// Save photo
const photoPath = await DataPersistence.saveFile(
  'inspection_123.jpg',
  base64ImageData,
  'photo'
);

// Read photo
const imageData = await DataPersistence.readFile(photoPath);

// Get file info
const info = await DataPersistence.getFileInfo(photoPath);
console.log('Size:', info.size);
```

## Request Interceptors

Add custom logic before requests are sent:

```typescript
import OfflineQueueService from './services/OfflineQueueService';

// Add auth token
OfflineQueueService.addRequestInterceptor(async (queueItem) => {
  const token = await getAuthToken();

  return {
    ...queueItem,
    headers: {
      ...queueItem.headers,
      'Authorization': `Bearer ${token}`
    }
  };
});

// Add timestamp
OfflineQueueService.addRequestInterceptor(async (queueItem) => {
  return {
    ...queueItem,
    body: {
      ...queueItem.body,
      timestamp: Date.now()
    }
  };
});
```

## Response Interceptors

Process responses before completion:

```typescript
import OfflineQueueService from './services/OfflineQueueService';

// Cache successful responses
OfflineQueueService.addResponseInterceptor(async (result, queueItem) => {
  if (result.success && queueItem.method === 'GET') {
    await DataPersistence.setCache(
      queueItem.url,
      result.response,
      3600000 // 1 hour
    );
  }

  return result;
});

// Log analytics
OfflineQueueService.addResponseInterceptor(async (result, queueItem) => {
  await analytics.track('API_REQUEST', {
    url: queueItem.url,
    method: queueItem.method,
    success: result.success,
    duration: result.duration
  });

  return result;
});
```

## Testing

### Unit Tests

```typescript
import OfflineQueueService from './services/OfflineQueueService';
import { Priority, HttpMethod } from './types/queue';

describe('OfflineQueueService', () => {
  it('should enqueue item', async () => {
    const item = await OfflineQueueService.enqueue(
      'https://api.test.com/vehicles',
      HttpMethod.POST,
      { resourceType: 'vehicle', priority: Priority.HIGH }
    );

    expect(item.id).toBeDefined();
    expect(item.priority).toBe(Priority.HIGH);
  });

  it('should process queue', async () => {
    const results = await OfflineQueueService.processQueue();
    expect(results).toBeInstanceOf(Array);
  });
});
```

### Integration Tests

```typescript
import SyncManager from './services/SyncManager';

describe('SyncManager', () => {
  it('should sync when online', async () => {
    const syncManager = SyncManager.getInstance();
    await syncManager.initialize();

    // Mock network state
    jest.spyOn(syncManager, 'isOnline').mockReturnValue(true);

    await syncManager.startSync();

    const state = syncManager.getSyncState();
    expect(state.lastSyncTime).toBeDefined();
  });
});
```

## Performance Optimization

### 1. Batch Processing
Process queue items in batches (default: 10) to avoid overwhelming the server.

### 2. Indexing
Database indexes on `status`, `priority`, `created_at` for fast queries.

### 3. Caching
Cache GET responses to reduce network calls.

### 4. Incremental Sync
Only sync items created/modified since last sync.

### 5. Priority Queue
High priority items (user-initiated) sync first.

### 6. Background Sync
Sync in background every 15 minutes when app is closed.

### 7. Compression
Compress large payloads before storage.

## Storage Management

### Database Size
- Queue items: ~1-2 KB each
- Cache entries: Varies by response size
- Conflicts: ~2-3 KB each

### Cleanup Strategies

```typescript
import DataPersistence from './services/DataPersistence';
import OfflineQueueService from './services/OfflineQueueService';
import ConflictResolver from './services/ConflictResolver';

// Clear completed items
await OfflineQueueService.clearCompleted();

// Clear expired cache
await DataPersistence.clearExpiredCache();

// Clear resolved conflicts
await ConflictResolver.clearResolvedConflicts();

// Clear old attachments (30+ days, uploaded)
await DataPersistence.clearOldAttachments(30);

// Vacuum database
await DataPersistence.vacuum();

// Get storage stats
const stats = await DataPersistence.getStorageStats();
console.log('Database size:', stats.databaseSize);
console.log('Available space:', stats.availableSize);
```

## Security Considerations

### 1. Encrypted Storage
- Use react-native-encrypted-storage for sensitive data
- Encrypt file attachments at rest

### 2. Token Management
- Refresh auth tokens before they expire
- Store tokens securely in Keychain/Keystore

### 3. Data Validation
- Validate all data before sending to server
- Sanitize user input

### 4. SSL Pinning
- Implement certificate pinning for API calls
- Prevent man-in-the-middle attacks

## Troubleshooting

### Queue Not Processing
1. Check network connectivity
2. Verify auth tokens are valid
3. Check console logs for errors
4. Review failed items: `OfflineQueueService.getAllQueueItems(SyncStatus.FAILED)`

### Conflicts Not Resolving
1. Check conflict resolution strategy
2. Verify custom merge strategies are registered
3. Review conflict details: `ConflictResolver.getAllConflicts(false)`

### Storage Full
1. Clear completed items and old cache
2. Run vacuum operation
3. Clear old attachments
4. Check storage stats: `DataPersistence.getStorageStats()`

### Background Sync Not Working
1. Check BackgroundFetch permissions
2. Verify background modes in app config
3. Test on physical device (not simulator)

## Dependencies

Required packages (already in package.json):
- `@react-native-async-storage/async-storage` - Key-value storage
- `@react-native-community/netinfo` - Network monitoring
- `react-native-sqlite-storage` - SQLite database
- `react-native-background-fetch` - Background sync
- `react-native-fs` - File system operations
- `axios` - HTTP client
- `react-native-paper` - UI components

## Installation

```bash
cd /home/user/Fleet/mobile

# Install dependencies
npm install

# iOS specific
cd ios && pod install && cd ..

# Android - no additional steps needed
```

## License

Copyright 2025 Fleet Management System. All rights reserved.

## Support

For issues or questions, contact the Fleet development team.

---

**Version:** 1.0.0
**Last Updated:** 2025-11-17
**Author:** Claude Code (Anthropic)
