# Offline Queue System - Quick Reference

## Quick Start

```typescript
// 1. Initialize (in App.tsx)
import SyncManager from './services/SyncManager';
await SyncManager.getInstance().initialize();

// 2. Queue a request
import OfflineQueueService from './services/OfflineQueueService';
import { Priority, HttpMethod, OperationType } from './types/queue';

await OfflineQueueService.enqueue(
  'https://api.fleet.com/vehicles',
  HttpMethod.POST,
  {
    body: { name: 'Truck 1' },
    priority: Priority.HIGH,
    resourceType: 'vehicle'
  }
);

// 3. Use UI component
import { OfflineIndicator } from './components/OfflineIndicator';
<OfflineIndicator />

// 4. Use hook in components
import { useSync } from './hooks/useSync';
const { isOnline, pendingCount, startSync } = useSync();
```

## Common Operations

### Queue Operations

```typescript
import OfflineQueueService from './services/OfflineQueueService';

// Create
await OfflineQueueService.enqueue(url, HttpMethod.POST, { ... });

// Update
await OfflineQueueService.enqueue(url, HttpMethod.PUT, { ... });

// Delete
await OfflineQueueService.enqueue(url, HttpMethod.DELETE, { ... });

// Get pending count
const count = await OfflineQueueService.getPendingCount();

// Get stats
const stats = await OfflineQueueService.getStats();

// Clear completed
await OfflineQueueService.clearCompleted();
```

### Sync Operations

```typescript
import SyncManager from './services/SyncManager';

const syncManager = SyncManager.getInstance();

// Start sync
await syncManager.startSync();

// Force sync (even offline)
await syncManager.forceSync();

// Sync high priority only
await syncManager.syncHighPriority();

// Enable/disable auto-sync
syncManager.enableAutoSync();
syncManager.disableAutoSync();

// Check status
const isOnline = syncManager.isOnline();
const isSyncing = syncManager.isSyncing();
```

### Conflict Resolution

```typescript
import ConflictResolver from './services/ConflictResolver';
import { ConflictResolution } from './types/queue';

// Get unresolved conflicts
const conflicts = await ConflictResolver.getAllConflicts(false);

// Resolve conflict
await ConflictResolver.resolveConflict(conflictId, {
  strategy: ConflictResolution.LAST_WRITE_WINS
});

// Auto-resolve all
await ConflictResolver.autoResolveAll();

// Register custom merge
ConflictResolver.registerMergeStrategy('vehicle', async (local, server) => {
  return { ...server, odometer: Math.max(local.odometer, server.odometer) };
});
```

### Cache Operations

```typescript
import DataPersistence from './services/DataPersistence';

// Set cache (1 hour TTL)
await DataPersistence.setCache('vehicles', data, 3600000);

// Get cache
const vehicles = await DataPersistence.getCache('vehicles');

// Remove cache
await DataPersistence.removeCache('vehicles');

// Clear all cache
await DataPersistence.clearCache();
```

### File Operations

```typescript
import DataPersistence from './services/DataPersistence';

// Save photo
const path = await DataPersistence.saveFile(
  'inspection_123.jpg',
  base64Data,
  'photo'
);

// Read photo
const data = await DataPersistence.readFile(path);

// Delete file
await DataPersistence.deleteFile(path);
```

## Priority Levels

```typescript
import { Priority } from './types/queue';

Priority.HIGH    // User-initiated (inspections, reports)
Priority.MEDIUM  // Normal operations (location, status)
Priority.LOW     // Background (sync lists, analytics)
```

## HTTP Methods

```typescript
import { HttpMethod } from './types/queue';

HttpMethod.GET     // Fetch data
HttpMethod.POST    // Create
HttpMethod.PUT     // Update (full)
HttpMethod.PATCH   // Update (partial)
HttpMethod.DELETE  // Delete
```

## Operation Types

```typescript
import { OperationType } from './types/queue';

OperationType.CREATE  // Creating new resource
OperationType.UPDATE  // Updating existing
OperationType.DELETE  // Deleting resource
OperationType.UPLOAD  // Uploading file
```

## Sync Status

```typescript
import { SyncStatus } from './types/queue';

SyncStatus.PENDING      // Not yet processed
SyncStatus.IN_PROGRESS  // Currently processing
SyncStatus.COMPLETED    // Successfully completed
SyncStatus.FAILED       // Failed (no more retries)
SyncStatus.RETRYING     // Scheduled for retry
```

## Conflict Resolution Strategies

```typescript
import { ConflictResolution } from './types/queue';

ConflictResolution.SERVER_WINS      // Use server data
ConflictResolution.CLIENT_WINS      // Use local data
ConflictResolution.LAST_WRITE_WINS  // Newest timestamp wins
ConflictResolution.MERGE            // Field-level merge
ConflictResolution.MANUAL           // Show UI for user
```

## Event Listeners

```typescript
import { QueueEventType } from './types/queue';
import OfflineQueueService from './services/OfflineQueueService';

OfflineQueueService.addEventListener(
  QueueEventType.SYNC_COMPLETED,
  (event) => {
    console.log('Sync completed:', event.data);
  }
);

// Available events:
QueueEventType.ITEM_ADDED
QueueEventType.ITEM_UPDATED
QueueEventType.ITEM_REMOVED
QueueEventType.SYNC_STARTED
QueueEventType.SYNC_COMPLETED
QueueEventType.SYNC_FAILED
QueueEventType.SYNC_PROGRESS
QueueEventType.CONFLICT_DETECTED
QueueEventType.CONFLICT_RESOLVED
QueueEventType.NETWORK_CHANGED
```

## Request Interceptors

```typescript
import OfflineQueueService from './services/OfflineQueueService';

// Add auth token
OfflineQueueService.addRequestInterceptor(async (item) => {
  const token = await getAuthToken();
  return {
    ...item,
    headers: { ...item.headers, Authorization: `Bearer ${token}` }
  };
});

// Add timestamp
OfflineQueueService.addRequestInterceptor(async (item) => {
  return {
    ...item,
    body: { ...item.body, timestamp: Date.now() }
  };
});
```

## Response Interceptors

```typescript
import OfflineQueueService from './services/OfflineQueueService';

// Cache successful GET requests
OfflineQueueService.addResponseInterceptor(async (result, item) => {
  if (result.success && item.method === 'GET') {
    await DataPersistence.setCache(item.url, result.response, 3600000);
  }
  return result;
});
```

## useSync Hook

```typescript
import { useSync } from './hooks/useSync';

function MyComponent() {
  const {
    isOnline,              // boolean
    isSyncing,             // boolean
    syncProgress,          // SyncProgress | null
    pendingCount,          // number
    lastSyncTime,          // number | null
    networkState,          // NetworkState | null
    startSync,             // () => Promise<void>
    forceSync,             // () => Promise<void>
    cancelSync,            // () => void
    enableAutoSync,        // () => void
    disableAutoSync,       // () => void
    isAutoSyncEnabled,     // boolean
  } = useSync();

  return (
    <View>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      <Text>Pending: {pendingCount}</Text>
      {isSyncing && <Text>Syncing...</Text>}
      <Button onPress={startSync} title="Sync" />
    </View>
  );
}
```

## Storage Management

```typescript
import DataPersistence from './services/DataPersistence';

// Get stats
const stats = await DataPersistence.getStorageStats();
console.log('Queue items:', stats.queueItemCount);
console.log('DB size:', stats.databaseSize);
console.log('Available:', stats.availableSize);

// Cleanup
await DataPersistence.clearExpiredCache();
await DataPersistence.clearOldAttachments(30); // 30+ days
await DataPersistence.vacuum();
```

## Configuration

```typescript
import OfflineQueueService from './services/OfflineQueueService';

const service = OfflineQueueService.getInstance({
  maxRetries: 5,              // Max retry attempts
  baseRetryDelay: 1000,       // Base delay (ms)
  maxRetryDelay: 300000,      // Max delay (5 min)
  exponentialBase: 2,         // Exponential factor
  batchSize: 10,              // Items per batch
  syncInterval: 60000,        // Sync interval (1 min)
  requireWifi: false,         // Require WiFi
  persistQueue: true,         // Persist to disk
});
```

## Error Handling

```typescript
try {
  await OfflineQueueService.enqueue(...);
} catch (error) {
  console.error('Failed to queue:', error);
  // Handle error (show toast, etc.)
}

// Check for failed items
const failed = await OfflineQueueService.getAllQueueItems('failed');
for (const item of failed) {
  console.log('Failed:', item.url, item.error);
}
```

## Testing

```typescript
import OfflineQueueService from './services/OfflineQueueService';

// Clear queue before test
beforeEach(async () => {
  await OfflineQueueService.clearAll();
});

// Test enqueue
it('should enqueue item', async () => {
  const item = await OfflineQueueService.enqueue(...);
  expect(item.id).toBeDefined();
});

// Mock network state
jest.spyOn(SyncManager.getInstance(), 'isOnline')
  .mockReturnValue(false);
```

## Common Patterns

### Pattern: Offline-capable form submission

```typescript
async function submitInspection(data: Inspection) {
  try {
    await OfflineQueueService.enqueue(
      `${API_URL}/inspections`,
      HttpMethod.POST,
      {
        body: data,
        priority: Priority.HIGH,
        operationType: OperationType.CREATE,
        resourceType: 'inspection',
      }
    );

    const isOnline = SyncManager.getInstance().isOnline();
    Alert.alert(
      'Success',
      isOnline
        ? 'Inspection submitted'
        : 'Inspection saved. Will sync when online.'
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to submit inspection');
  }
}
```

### Pattern: Fetch with cache fallback

```typescript
async function getVehicles(): Promise<Vehicle[]> {
  // Try cache first
  const cached = await DataPersistence.getCache<Vehicle[]>('vehicles');
  if (cached) {
    return cached;
  }

  // If online, fetch from API
  if (SyncManager.getInstance().isOnline()) {
    await OfflineQueueService.enqueue(
      `${API_URL}/vehicles`,
      HttpMethod.GET,
      {
        priority: Priority.LOW,
        resourceType: 'vehicle',
      }
    );
  }

  return [];
}
```

### Pattern: Monitor sync state

```typescript
import { useSync } from './hooks/useSync';

function SyncStatus() {
  const { isSyncing, syncProgress, pendingCount } = useSync();

  if (!isSyncing && pendingCount === 0) {
    return <Text>All synced ✓</Text>;
  }

  if (isSyncing && syncProgress) {
    return (
      <View>
        <Text>Syncing {syncProgress.completed}/{syncProgress.total}</Text>
        <ProgressBar progress={syncProgress.percentage / 100} />
      </View>
    );
  }

  return <Text>{pendingCount} pending</Text>;
}
```

## Performance Tips

1. **Use priority wisely**
   - HIGH: User-initiated only
   - MEDIUM: Most operations
   - LOW: Background tasks

2. **Cache aggressively**
   - Cache GET responses
   - Set appropriate TTL
   - Clear expired regularly

3. **Batch operations**
   - Queue multiple items
   - Process in batches
   - Avoid per-item requests

4. **Clean up regularly**
   - Clear completed items
   - Remove old files
   - Vacuum database

5. **Monitor metrics**
   - Track queue size
   - Monitor sync times
   - Watch storage usage

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Queue not processing | Check `isOnline()`, verify tokens |
| High conflict rate | Increase sync frequency, custom merge |
| Storage full | Clear cache, old attachments, vacuum |
| Background sync fails | Check permissions, test on device |
| Slow sync | Reduce batch size, check network |

## Resources

- Full documentation: `OFFLINE_QUEUE_SYSTEM.md`
- Architecture: `ARCHITECTURE.md`
- Deployment: `OFFLINE_SYNC_DEPLOYMENT_GUIDE.md`
- Example: `App.example.tsx`

---

**Version**: 1.0.0
**Updated**: 2025-11-17
