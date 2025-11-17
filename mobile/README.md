# Fleet Mobile App

React Native mobile application for Fleet Management System with offline-first architecture.

## Features

- **Offline-First**: Works seamlessly without internet connectivity
- **Automatic Sync**: Syncs data when connection is restored
- **Priority Queue**: High-priority operations sync first
- **Conflict Resolution**: Smart handling of data conflicts
- **Background Sync**: Syncs in background every 15 minutes
- **Real-time Status**: Visual indicators for sync status

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Architecture

The app uses a comprehensive offline-first architecture:

```
mobile/
├── src/
│   ├── services/           # Core services
│   │   ├── OfflineQueueService.ts    # Queue management
│   │   ├── SyncManager.ts            # Sync orchestration
│   │   ├── ConflictResolver.ts       # Conflict handling
│   │   └── DataPersistence.ts        # Data storage
│   ├── components/         # React components
│   │   └── OfflineIndicator.tsx      # Sync status UI
│   ├── hooks/             # React hooks
│   │   └── useSync.ts                # Sync hook
│   └── types/             # TypeScript types
│       └── queue.ts                   # Type definitions
├── package.json
└── OFFLINE_QUEUE_SYSTEM.md          # Full documentation
```

## Core Services

### 1. OfflineQueueService

Manages offline API requests with priority queue and retry logic.

```typescript
import OfflineQueueService from './services/OfflineQueueService';
import { Priority, HttpMethod } from './types/queue';

// Queue a request
await OfflineQueueService.enqueue(
  'https://api.fleet.com/vehicles',
  HttpMethod.POST,
  {
    body: { name: 'Truck 1' },
    priority: Priority.HIGH,
    resourceType: 'vehicle'
  }
);

// Process queue
await OfflineQueueService.processQueue();
```

### 2. SyncManager

Orchestrates synchronization and monitors network connectivity.

```typescript
import SyncManager from './services/SyncManager';

// Initialize
await SyncManager.getInstance().initialize();

// Start sync
await SyncManager.getInstance().startSync();

// Listen to state changes
SyncManager.getInstance().addStateListener((state) => {
  console.log('Syncing:', state.isSyncing);
  console.log('Online:', state.networkState.isConnected);
});
```

### 3. ConflictResolver

Handles data conflicts with multiple resolution strategies.

```typescript
import ConflictResolver from './services/ConflictResolver';
import { ConflictResolution } from './types/queue';

// Get unresolved conflicts
const conflicts = await ConflictResolver.getAllConflicts(false);

// Resolve conflict
await ConflictResolver.resolveConflict(conflict.id, {
  strategy: ConflictResolution.LAST_WRITE_WINS
});
```

### 4. DataPersistence

Manages all data persistence (SQLite, AsyncStorage, files).

```typescript
import DataPersistence from './services/DataPersistence';

// Cache data
await DataPersistence.setCache('vehicles', data, 3600000); // 1 hour

// Get cache
const vehicles = await DataPersistence.getCache('vehicles');

// Save file
const path = await DataPersistence.saveFile('photo.jpg', base64Data, 'photo');
```

## React Components

### OfflineIndicator

Visual component for sync status:

```tsx
import { OfflineIndicator } from './components/OfflineIndicator';

function App() {
  return (
    <>
      <OfflineIndicator
        autoHide={true}
        position="top"
        showSyncButton={true}
        showConflictCount={true}
      />
      {/* Your app content */}
    </>
  );
}
```

## React Hooks

### useSync

Hook for managing sync in components:

```tsx
import { useSync } from './hooks/useSync';

function MyComponent() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    startSync
  } = useSync();

  return (
    <View>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      <Text>Pending: {pendingCount}</Text>
      {isSyncing && <Text>Syncing...</Text>}
      <Button onPress={startSync} title="Sync Now" />
    </View>
  );
}
```

## Configuration

Customize queue configuration:

```typescript
import OfflineQueueService from './services/OfflineQueueService';

const queueService = OfflineQueueService.getInstance({
  maxRetries: 5,              // Max retry attempts
  baseRetryDelay: 1000,       // Base delay in ms
  batchSize: 10,              // Items per batch
  syncInterval: 60000,        // Sync interval (1 min)
  requireWifi: false,         // Require WiFi
});
```

## Data Flow

1. User performs action (e.g., create inspection)
2. App checks network status
3. If **online**: Send request immediately
4. If **offline**: Add to queue with priority
5. Request saved to SQLite for persistence
6. When connection restored: Sync automatically
7. Process queue by priority (HIGH → MEDIUM → LOW)
8. Handle conflicts if data changed on server
9. Update UI with results

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test
npm test -- OfflineQueueService.test.ts
```

## Storage Management

The app stores data in multiple locations:

- **SQLite**: Queue items, conflicts, cache metadata
- **AsyncStorage**: Configuration, simple cache
- **File System**: Photos, documents

Clean up storage periodically:

```typescript
import DataPersistence from './services/DataPersistence';
import OfflineQueueService from './services/OfflineQueueService';

// Clear completed items
await OfflineQueueService.clearCompleted();

// Clear expired cache
await DataPersistence.clearExpiredCache();

// Vacuum database
await DataPersistence.vacuum();

// Get storage stats
const stats = await DataPersistence.getStorageStats();
```

## Debugging

Enable debug logging:

```typescript
// In App.tsx
if (__DEV__) {
  // Debug logs are already enabled in services
  console.log('Debug mode enabled');
}
```

## Troubleshooting

### Queue not processing
- Check network connectivity
- Verify auth tokens
- Review failed items in database

### Background sync not working
- Check permissions in AndroidManifest.xml / Info.plist
- Test on physical device (not simulator)
- Verify BackgroundFetch configuration

### Storage full
- Clear old data
- Run vacuum operation
- Check storage stats

## Performance Tips

1. **Batch operations**: Process multiple items together
2. **Cache aggressively**: Reduce network calls
3. **Use incremental sync**: Only sync changes
4. **Prioritize requests**: User-initiated = HIGH priority
5. **Compress files**: Reduce storage and bandwidth
6. **Clean up regularly**: Remove old data

## Security

- Store auth tokens in Keychain/Keystore
- Encrypt sensitive data at rest
- Use SSL pinning for API calls
- Validate all data before sending
- Implement token refresh logic

## Documentation

See [OFFLINE_QUEUE_SYSTEM.md](./OFFLINE_QUEUE_SYSTEM.md) for complete documentation including:
- Architecture diagrams
- Sync flow diagrams
- API reference
- Advanced usage examples

## Dependencies

Key dependencies:
- `react-native` - Framework
- `@react-native-async-storage/async-storage` - Storage
- `@react-native-community/netinfo` - Network monitoring
- `react-native-sqlite-storage` - SQLite database
- `react-native-background-fetch` - Background sync
- `react-native-fs` - File system
- `axios` - HTTP client
- `react-native-paper` - UI components

## License

Copyright 2025 Fleet Management System. All rights reserved.

## Support

For issues or questions, contact the Fleet development team.
