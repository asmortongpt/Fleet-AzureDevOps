# Fleet Mobile - Offline Sync System Deployment Guide

## Overview

The Fleet mobile app now includes a production-ready offline queue and synchronization system that enables seamless operation without internet connectivity. This guide covers deployment, integration, and operational procedures.

## What's Been Built

### Core Services

1. **OfflineQueueService** (`src/services/OfflineQueueService.ts`)
   - Priority-based queue (HIGH, MEDIUM, LOW)
   - Automatic retry with exponential backoff
   - Request/response interceptors
   - Event system for monitoring
   - Batch processing (10 items)
   - Persistent storage with SQLite

2. **SyncManager** (`src/services/SyncManager.ts`)
   - Network monitoring via NetInfo
   - Automatic sync on connection restore
   - Background sync every 15 minutes
   - Periodic sync (configurable)
   - Incremental sync (only changed data)
   - WiFi-only option

3. **ConflictResolver** (`src/services/ConflictResolver.ts`)
   - Automatic conflict detection
   - Multiple resolution strategies
   - Custom merge strategies
   - Manual resolution UI support

4. **DataPersistence** (`src/services/DataPersistence.ts`)
   - SQLite database management
   - AsyncStorage for cache
   - File system operations
   - Database migrations
   - Storage statistics

5. **OfflineIndicator** (`src/components/OfflineIndicator.tsx`)
   - Network status banner
   - Pending sync count
   - Sync progress bar
   - Conflict count display
   - Force sync button

6. **useSync Hook** (`src/hooks/useSync.ts`)
   - React hook for sync state
   - Network status
   - Sync progress
   - Sync controls

### Type Definitions

`src/types/queue.ts` - Complete TypeScript definitions:
- QueueItem, SyncStatus, Priority
- ConflictResolution, ConflictType
- NetworkState, SyncProgress
- And 20+ other types

## Integration with Existing Features

The offline sync system seamlessly integrates with existing Fleet mobile features:

### Camera & Photo Services
```typescript
import OfflineQueueService from './services/OfflineQueueService';
import { Priority, HttpMethod, OperationType } from './types/queue';

// In CameraService or PhotoUploadService
async function uploadPhoto(photo: Photo) {
  await OfflineQueueService.enqueue(
    `${API_URL}/photos/upload`,
    HttpMethod.POST,
    {
      body: { photo: photo.base64, metadata: photo.metadata },
      priority: Priority.HIGH,
      operationType: OperationType.UPLOAD,
      resourceType: 'photo',
      resourceId: photo.id
    }
  );
}
```

### OBD2 Diagnostics
```typescript
// In OBD2Adapter
async function sendDiagnostics(data: OBD2Data) {
  await OfflineQueueService.enqueue(
    `${API_URL}/vehicles/${vehicleId}/diagnostics`,
    HttpMethod.POST,
    {
      body: data,
      priority: Priority.MEDIUM,
      operationType: OperationType.CREATE,
      resourceType: 'diagnostics'
    }
  );
}
```

### Damage Reports
```typescript
// In DamageReportCamera
async function submitDamageReport(report: DamageReport) {
  await OfflineQueueService.enqueue(
    `${API_URL}/damage-reports`,
    HttpMethod.POST,
    {
      body: report,
      priority: Priority.HIGH,
      operationType: OperationType.CREATE,
      resourceType: 'damage_report'
    }
  );
}
```

### Trip Logger
```typescript
// In TripLogger
async function syncTripData(trip: Trip) {
  await OfflineQueueService.enqueue(
    `${API_URL}/trips`,
    HttpMethod.POST,
    {
      body: trip,
      priority: Priority.MEDIUM,
      operationType: OperationType.CREATE,
      resourceType: 'trip'
    }
  );
}
```

### Messaging Service
```typescript
// In MessagingService
async function sendMessage(message: Message) {
  await OfflineQueueService.enqueue(
    `${API_URL}/messages`,
    HttpMethod.POST,
    {
      body: message,
      priority: Priority.HIGH,
      operationType: OperationType.CREATE,
      resourceType: 'message'
    }
  );
}
```

## Installation Steps

### 1. Install Dependencies

```bash
cd /home/user/Fleet/mobile

# Install npm dependencies
npm install

# iOS: Install pods
cd ios && pod install && cd ..
```

Key dependencies (already in package.json):
- `@react-native-async-storage/async-storage`
- `@react-native-community/netinfo`
- `react-native-sqlite-storage`
- `react-native-background-fetch`
- `react-native-fs`
- `axios`
- `uuid`
- `date-fns`
- `react-native-paper`

### 2. Configure iOS (Info.plist)

Add required permissions:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location for trip tracking</string>

<key>NSCameraUsageDescription</key>
<string>Take photos for inspections and damage reports</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Save and upload photos</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save photos to your library</string>
```

Configure background modes in Xcode:
1. Select target → Signing & Capabilities
2. Add "Background Modes" capability
3. Enable: "Location updates", "Background fetch", "Background processing"

### 3. Configure Android (AndroidManifest.xml)

Add permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### 4. Initialize in App.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { OfflineIndicator } from './src/components/OfflineIndicator';
import SyncManager from './src/services/SyncManager';
import OfflineQueueService from './src/services/OfflineQueueService';
import DataPersistence from './src/services/DataPersistence';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initServices();
  }, []);

  async function initServices() {
    // Initialize services
    await DataPersistence.initialize();
    await SyncManager.getInstance().initialize();

    // Setup auth interceptor
    OfflineQueueService.addRequestInterceptor(async (item) => {
      const token = await getAuthToken();
      return {
        ...item,
        headers: {
          ...item.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    });

    setIsReady(true);
  }

  if (!isReady) return <LoadingScreen />;

  return (
    <SafeAreaView>
      <OfflineIndicator />
      {/* Your app content */}
    </SafeAreaView>
  );
}
```

## Configuration

### Queue Configuration

Customize in `App.tsx`:

```typescript
import OfflineQueueService from './services/OfflineQueueService';

const queueService = OfflineQueueService.getInstance({
  maxRetries: 5,              // Max retry attempts
  baseRetryDelay: 1000,       // Base delay (1 second)
  maxRetryDelay: 300000,      // Max delay (5 minutes)
  exponentialBase: 2,         // Exponential factor
  batchSize: 10,              // Items per batch
  syncInterval: 60000,        // Sync interval (1 minute)
  requireWifi: false,         // Require WiFi for sync
  persistQueue: true,         // Persist to database
});
```

### Conflict Resolution

Register custom merge strategies:

```typescript
import ConflictResolver from './services/ConflictResolver';

// Custom merge for vehicles
ConflictResolver.registerMergeStrategy('vehicle', async (local, server, conflict) => {
  return {
    ...server,
    odometer: Math.max(local.odometer, server.odometer), // Keep higher
    maintenance: [...local.maintenance, ...server.maintenance], // Merge arrays
  };
});

// Custom merge for inspections
ConflictResolver.registerMergeStrategy('inspection', async (local, server, conflict) => {
  // If both failed, use local (driver's assessment)
  if (local.status === 'failed' || server.status === 'failed') {
    return local;
  }
  return server; // Otherwise server wins
});
```

## Testing

### Unit Tests

```typescript
// Example test for OfflineQueueService
import OfflineQueueService from '../services/OfflineQueueService';
import { Priority, HttpMethod } from '../types/queue';

describe('OfflineQueueService', () => {
  beforeEach(async () => {
    await OfflineQueueService.clearAll();
  });

  it('should enqueue item', async () => {
    const item = await OfflineQueueService.enqueue(
      'https://api.test.com/vehicles',
      HttpMethod.POST,
      {
        body: { name: 'Test Vehicle' },
        priority: Priority.HIGH,
        resourceType: 'vehicle',
      }
    );

    expect(item.id).toBeDefined();
    expect(item.priority).toBe(Priority.HIGH);
    expect(item.status).toBe('pending');
  });

  it('should process queue by priority', async () => {
    // Enqueue in reverse priority order
    await OfflineQueueService.enqueue(
      'https://api.test.com/low',
      HttpMethod.POST,
      { priority: Priority.LOW, resourceType: 'test' }
    );
    await OfflineQueueService.enqueue(
      'https://api.test.com/high',
      HttpMethod.POST,
      { priority: Priority.HIGH, resourceType: 'test' }
    );

    const items = await OfflineQueueService.getAllQueueItems();

    // Should be sorted HIGH first
    expect(items[0].priority).toBe(Priority.HIGH);
    expect(items[1].priority).toBe(Priority.LOW);
  });
});
```

### Integration Tests

```typescript
describe('SyncManager Integration', () => {
  it('should sync when connection restored', async () => {
    const syncManager = SyncManager.getInstance();

    // Mock network state change
    const onlineListener = jest.fn();
    syncManager.addStateListener(onlineListener);

    // Simulate connection restore
    // ... trigger network change

    expect(onlineListener).toHaveBeenCalled();
  });
});
```

### Manual Testing Checklist

- [ ] Create operation while offline → Check queue
- [ ] Go online → Verify auto-sync
- [ ] Force sync → Verify immediate sync
- [ ] Create conflict → Verify resolution UI
- [ ] Background sync → Test after 15 minutes
- [ ] Large queue (100+ items) → Check performance
- [ ] Network interruption → Verify retry logic
- [ ] Storage limits → Check cleanup

## Monitoring

### Key Metrics to Track

```typescript
import SyncManager from './services/SyncManager';
import OfflineQueueService from './services/OfflineQueueService';
import DataPersistence from './services/DataPersistence';

// Get comprehensive stats
const stats = await SyncManager.getInstance().getSyncStats();

console.log('Queue Stats:', {
  total: stats.queue.totalItems,
  success: stats.queue.successCount,
  failed: stats.queue.failureCount,
  avgRetries: stats.queue.averageRetries,
  lastSync: stats.queue.lastSyncTime,
});

console.log('Conflict Stats:', {
  total: stats.conflicts.total,
  resolved: stats.conflicts.resolved,
  unresolved: stats.conflicts.unresolved,
  byType: stats.conflicts.byType,
});

console.log('Storage Stats:', {
  queueItems: stats.storage.queueItemCount,
  cacheItems: stats.storage.cacheItemCount,
  dbSize: `${(stats.storage.databaseSize / 1024 / 1024).toFixed(2)} MB`,
  availableSpace: `${(stats.storage.availableSize / 1024 / 1024 / 1024).toFixed(2)} GB`,
});
```

### Analytics Events

Track important events:

```typescript
import OfflineQueueService from './services/OfflineQueueService';
import { QueueEventType } from './types/queue';

// Track sync events
OfflineQueueService.addEventListener(QueueEventType.SYNC_COMPLETED, (event) => {
  analytics.track('SYNC_COMPLETED', {
    itemsProcessed: event.data.results.length,
    successCount: event.data.results.filter(r => r.success).length,
    duration: Date.now() - event.timestamp,
  });
});

// Track conflicts
OfflineQueueService.addEventListener(QueueEventType.CONFLICT_DETECTED, (event) => {
  analytics.track('CONFLICT_DETECTED', {
    conflictType: event.data.conflictType,
    resourceType: event.data.resourceType,
  });
});
```

## Maintenance

### Regular Cleanup

Schedule periodic cleanup:

```typescript
import DataPersistence from './services/DataPersistence';
import OfflineQueueService from './services/OfflineQueueService';
import ConflictResolver from './services/ConflictResolver';

async function performMaintenance() {
  // Clear completed items (older than 7 days)
  const completedItems = await OfflineQueueService.getAllQueueItems('completed');
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const item of completedItems) {
    if (item.updatedAt < cutoff) {
      await OfflineQueueService.dequeue(item.id);
    }
  }

  // Clear expired cache
  await DataPersistence.clearExpiredCache();

  // Clear resolved conflicts
  await ConflictResolver.clearResolvedConflicts();

  // Clear old attachments (uploaded, 30+ days)
  await DataPersistence.clearOldAttachments(30);

  // Vacuum database
  await DataPersistence.vacuum();

  console.log('Maintenance complete');
}

// Run monthly
setInterval(performMaintenance, 30 * 24 * 60 * 60 * 1000);
```

## Troubleshooting

### Issue: Queue not processing

**Symptoms**: Items stay in PENDING state

**Solutions**:
1. Check network connectivity: `SyncManager.getInstance().isOnline()`
2. Verify auth tokens are valid
3. Check console logs for errors
4. Review failed items: `OfflineQueueService.getAllQueueItems('failed')`

### Issue: High conflict rate

**Symptoms**: Many conflicts detected

**Solutions**:
1. Review conflict resolution strategies
2. Increase sync frequency
3. Implement custom merge strategies
4. Add version numbers to data

### Issue: Storage full

**Symptoms**: Database growing too large

**Solutions**:
1. Clear completed items
2. Clear expired cache
3. Run vacuum operation
4. Clear old attachments
5. Reduce cache TTL

### Issue: Background sync not working

**Symptoms**: App doesn't sync in background

**Solutions**:
1. Check background permissions
2. Verify BackgroundFetch configuration
3. Test on physical device (not simulator)
4. Check battery optimization settings

## Performance Optimization

### 1. Reduce Queue Size
- Clear completed items regularly
- Set lower cache TTL
- Limit photo resolution

### 2. Optimize Sync
- Use incremental sync
- Batch operations
- Compress payloads

### 3. Database Performance
- Regular vacuum operations
- Index optimization
- Query optimization

### 4. Network Efficiency
- Cache aggressively
- Use ETags for cache validation
- Implement delta sync

## Security Best Practices

1. **Token Management**
   - Store in Keychain/Keystore
   - Auto-refresh before expiry
   - Clear on logout

2. **Data Encryption**
   - Encrypt sensitive fields
   - Use HTTPS only
   - Implement certificate pinning

3. **Input Validation**
   - Validate all data before queueing
   - Sanitize user input
   - Check file types and sizes

4. **Access Control**
   - Implement proper auth checks
   - Use role-based permissions
   - Log security events

## Production Checklist

Before deploying to production:

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing complete
- [ ] Performance testing done
- [ ] Security audit complete
- [ ] Analytics configured
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] Documentation updated
- [ ] Team trained
- [ ] Rollback plan ready
- [ ] Beta testing complete

## Support

For issues or questions:
- Check documentation in `OFFLINE_QUEUE_SYSTEM.md`
- Review architecture in `ARCHITECTURE.md`
- See example code in `App.example.tsx`
- Contact Fleet development team

## Files Reference

```
mobile/
├── src/
│   ├── services/
│   │   ├── OfflineQueueService.ts       # Queue management
│   │   ├── SyncManager.ts               # Sync orchestration
│   │   ├── ConflictResolver.ts          # Conflict handling
│   │   └── DataPersistence.ts           # Storage management
│   ├── components/
│   │   └── OfflineIndicator.tsx         # UI component
│   ├── hooks/
│   │   └── useSync.ts                   # React hook
│   └── types/
│       └── queue.ts                     # Type definitions
├── App.example.tsx                      # Integration example
├── OFFLINE_QUEUE_SYSTEM.md             # Full documentation
├── ARCHITECTURE.md                      # Architecture details
└── package.json                         # Dependencies
```

## Version History

- **v1.0.0** (2025-11-17)
  - Initial release
  - Core offline queue system
  - Sync manager with network monitoring
  - Conflict resolution
  - Data persistence
  - UI components

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-17
**Author**: Claude Code (Anthropic)
**License**: PROPRIETARY
