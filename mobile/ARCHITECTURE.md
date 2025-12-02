# Fleet Mobile - Offline-First Architecture

## System Overview

The Fleet mobile app uses a comprehensive offline-first architecture that ensures seamless operation regardless of network connectivity. The system automatically queues operations when offline and synchronizes when connection is restored.

## Core Principles

1. **Offline-First**: App works fully without internet connectivity
2. **Automatic Sync**: Transparent synchronization when online
3. **Data Integrity**: Conflict detection and resolution
4. **Performance**: Efficient caching and batch processing
5. **User Experience**: Clear visual feedback on sync status

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Mobile App Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Screens    │  │  Components  │  │     Hooks       │  │
│  │  (Vehicle,   │  │  (Offline    │  │  (useSync)      │  │
│  │ Inspection)  │  │  Indicator)  │  │                 │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌─────────────────────────────▼──────────────────────────────┐
│                    Service Layer                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              SyncManager (Orchestrator)             │  │
│  │  - Network monitoring (NetInfo)                     │  │
│  │  - Sync scheduling & triggers                       │  │
│  │  - Background sync (BackgroundFetch)                │  │
│  │  - Progress tracking                                │  │
│  └──────┬─────────────────────┬──────────────┬─────────┘  │
│         │                     │              │            │
│  ┌──────▼──────────┐  ┌───────▼────────┐  ┌▼──────────┐  │
│  │OfflineQueue     │  │ ConflictResolver│  │ DataPer-  │  │
│  │Service          │  │                 │  │ sistence  │  │
│  │- Priority queue │  │- Detection      │  │           │  │
│  │- Retry logic    │  │- Strategies     │  │- SQLite   │  │
│  │- Interceptors   │  │- Merge logic    │  │- AsyncStor│  │
│  └──────┬──────────┘  └───────┬─────────┘  │- Files    │  │
└─────────┼──────────────────────┼────────────┴───────────┘  │
          │                      │                 │
┌─────────▼──────────────────────▼─────────────────▼─────────┐
│                   Persistence Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   SQLite     │  │ AsyncStorage │  │  File System     │ │
│  │              │  │              │  │                  │ │
│  │ • queue_items│  │ • config     │  │ • photos/        │ │
│  │ • conflicts  │  │ • cache      │  │ • documents/     │ │
│  │ • cache      │  │              │  │ • temp/          │ │
│  │ • metadata   │  │              │  │                  │ │
│  │ • attachments│  │              │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: User Action to Sync

```
1. USER INTERACTION
   ↓
   User creates inspection
   ↓
2. APP LAYER
   ↓
   Component calls OfflineQueueService.enqueue()
   ↓
3. QUEUE SERVICE
   ↓
   ┌─ Check network status
   │  ├─ ONLINE → Execute immediately
   │  └─ OFFLINE → Queue for later
   ↓
4. PERSISTENCE LAYER
   ↓
   Save to SQLite database
   ↓
5. UI UPDATE
   ↓
   Show "Saved" or "Pending Sync" message
   ↓
6. NETWORK RESTORED (SyncManager detects)
   ↓
7. SYNC PROCESS
   ↓
   ├─ Get pending items from queue
   ├─ Sort by priority (HIGH → MED → LOW)
   ├─ Process in batches (10 items)
   ├─ For each item:
   │  ├─ Apply request interceptors
   │  ├─ Send HTTP request
   │  ├─ Apply response interceptors
   │  ├─ Check for conflicts
   │  └─ Update queue status
   ↓
8. CONFLICT RESOLUTION (if needed)
   ↓
   ├─ Detect conflict (timestamps differ)
   ├─ Apply resolution strategy
   │  ├─ SERVER_WINS
   │  ├─ CLIENT_WINS
   │  ├─ LAST_WRITE_WINS
   │  ├─ MERGE
   │  └─ MANUAL (show UI)
   ↓
9. COMPLETION
   ↓
   ├─ Remove from queue
   ├─ Update UI (OfflineIndicator)
   └─ Notify user if needed
```

## Request Lifecycle

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Create QueueItem     │
│ - id: UUID           │
│ - url: string        │
│ - method: HTTP verb  │
│ - body: data         │
│ - priority: enum     │
│ - status: PENDING    │
│ - retryCount: 0      │
│ - createdAt: now     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Apply Interceptors   │
│ - Add auth token     │
│ - Add timestamps     │
│ - Validate data      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Save to Database     │
│ INSERT INTO          │
│ queue_items          │
└──────┬───────────────┘
       │
       ▼
   ┌───┴────┐
   │Network?│
   └───┬────┘
       │
  ┌────┴────┐
  │         │
ONLINE   OFFLINE
  │         │
  ▼         ▼
┌────────┐┌─────────┐
│Execute ││Wait for │
│Now     ││Sync     │
└───┬────┘└─────────┘
    │
    ▼
┌──────────────┐
│HTTP Request  │
└──────┬───────┘
       │
       ▼
   ┌───┴────┐
   │Success?│
   └───┬────┘
       │
  ┌────┴────┐
  │         │
 YES        NO
  │         │
  ▼         ▼
┌────────┐┌──────────┐
│Remove  ││Retry?    │
│from    ││< 5 times │
│Queue   ││          │
└────────┘│          │
          ▼          │
     ┌─────┴──┐      │
     │        │      │
    YES       NO     │
     │        │      │
     ▼        ▼      │
┌─────────┐┌────────┐│
│Schedule ││Mark    ││
│Retry    ││Failed  ││
│+ delay  ││        ││
└─────────┘└────────┘│
                     │
                     ▼
              ┌──────────┐
              │ Notify   │
              │ User     │
              └──────────┘
```

## Priority Queue Processing

The system processes queue items based on priority to ensure important operations complete first:

```
Priority Levels:
┌──────┬──────────────────────────────────┐
│ HIGH │ User-initiated operations        │
│      │ - Create/update inspections      │
│      │ - Submit reports                 │
│      │ - Emergency operations           │
├──────┼──────────────────────────────────┤
│ MED  │ Normal operations                │
│      │ - Location updates               │
│      │ - Status changes                 │
│      │ - Photo uploads                  │
├──────┼──────────────────────────────────┤
│ LOW  │ Background operations            │
│      │ - Sync vehicle list              │
│      │ - Fetch documents                │
│      │ - Analytics                      │
└──────┴──────────────────────────────────┘

Processing Order:
1. All HIGH priority items (FIFO within priority)
2. All MEDIUM priority items
3. All LOW priority items

Batch Size: 10 items
- Process 10 items concurrently
- Wait for batch to complete
- Process next batch
```

## Retry Strategy: Exponential Backoff

```
Attempt │ Delay Formula           │ Example Delay
────────┼────────────────────────┼───────────────
   1    │ 1s × 2^0 + jitter      │ ~1-2s
   2    │ 1s × 2^1 + jitter      │ ~2-3s
   3    │ 1s × 2^2 + jitter      │ ~4-5s
   4    │ 1s × 2^3 + jitter      │ ~8-9s
   5    │ 1s × 2^4 + jitter      │ ~16-17s
  > 5   │ FAILED                 │ ❌

jitter = random(0, 1000ms)
Max delay = 5 minutes (300,000ms)

Retry Conditions:
✓ Network errors
✓ 5xx server errors
✓ 408 Request Timeout
✓ 429 Too Many Requests
✗ 4xx client errors (except 408, 429)
✗ Authentication errors
```

## Conflict Resolution Strategies

```
┌────────────────────────────────────────────────────┐
│                  CONFLICT DETECTED                 │
│  Local timestamp: 1699999999                       │
│  Server timestamp: 2000000000                      │
│  Local data: { status: "complete" }                │
│  Server data: { status: "pending" }                │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │Choose Strategy  │
        └────────┬────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│SERVER   │ │CLIENT   │ │  LAST   │
│WINS     │ │WINS     │ │  WRITE  │
│         │ │         │ │  WINS   │
├─────────┤ ├─────────┤ ├─────────┤
│Use      │ │Use      │ │Compare  │
│server   │ │local    │ │timestamps│
│data     │ │data     │ │         │
│         │ │         │ │Newest   │
│Result:  │ │Result:  │ │wins     │
│pending  │ │complete │ │         │
└─────────┘ └─────────┘ │Result:  │
                        │server   │
     ▼           ▼      └────┬────┘
     │           │           │
     └───────────┼───────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│MERGE    │ │MANUAL   │ │CUSTOM   │
│         │ │         │ │         │
├─────────┤ ├─────────┤ ├─────────┤
│Field-by │ │Show UI  │ │Resource │
│-field   │ │dialog   │ │specific │
│         │ │         │ │logic    │
│User     │ │User     │ │         │
│chooses  │ │decides  │ │Defined  │
│per field│ │         │ │by dev   │
└─────────┘ └─────────┘ └─────────┘
     │           │           │
     └───────────┼───────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Apply Resolved │
        │ Data & Update  │
        └────────────────┘
```

## Database Schema

```sql
-- Queue Items Table
CREATE TABLE queue_items (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  headers TEXT,                    -- JSON
  body TEXT,                       -- JSON
  priority TEXT NOT NULL,          -- 'high', 'medium', 'low'
  status TEXT NOT NULL,            -- 'pending', 'in_progress', etc.
  operation_type TEXT NOT NULL,    -- 'create', 'update', 'delete'
  resource_type TEXT NOT NULL,     -- 'vehicle', 'inspection', etc.
  resource_id TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  scheduled_at INTEGER,            -- For delayed retry
  error TEXT,                      -- JSON: error details
  metadata TEXT                    -- JSON: custom data
);

-- Indexes
CREATE INDEX idx_queue_status ON queue_items(status);
CREATE INDEX idx_queue_priority ON queue_items(priority);
CREATE INDEX idx_queue_created ON queue_items(created_at);
CREATE INDEX idx_queue_resource ON queue_items(resource_type, resource_id);

-- Conflicts Table
CREATE TABLE conflicts (
  id TEXT PRIMARY KEY,
  queue_item_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  local_version TEXT NOT NULL,     -- JSON
  server_version TEXT NOT NULL,    -- JSON
  local_timestamp INTEGER NOT NULL,
  server_timestamp INTEGER NOT NULL,
  resolution TEXT,
  resolved_data TEXT,              -- JSON
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  FOREIGN KEY (queue_item_id) REFERENCES queue_items(id)
);

-- Cache Table
CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,              -- JSON
  timestamp INTEGER NOT NULL,
  expires_at INTEGER,
  etag TEXT,
  version INTEGER
);

-- Attachments Table
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded BOOLEAN DEFAULT 0,
  cloud_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Network State Machine

```
┌──────────────┐
│  UNKNOWN     │ (Initial state)
└──────┬───────┘
       │
       ▼
   ┌───────┐
   │NetInfo│
   │.fetch │
   └───┬───┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌──────┐┌────────┐
│ONLINE││OFFLINE │
└───┬──┘└───┬────┘
    │       │
    │   ┌───┴────────────┐
    │   │ Queue requests │
    │   └────────────────┘
    │
    │   Network restored
    ├───────────────────►
    │
    ▼
┌──────────────┐
│ SYNCING      │
│              │
│ ┌──────────┐│
│ │Process   ││
│ │Queue     ││
│ └──────────┘│
└──────┬───────┘
       │
   ┌───┴────┐
   │Success?│
   └───┬────┘
       │
   ┌───┴────┐
   │        │
  YES       NO
   │        │
   ▼        ▼
┌──────┐┌────────┐
│IDLE  ││RETRYING│
│      ││        │
│Wait  ││Schedule│
│for   ││retry   │
│next  ││        │
│change││        │
└──────┘└───┬────┘
            │
            │ (after delay)
            └────────►
```

## Performance Characteristics

### Queue Processing
- **Batch Size**: 10 items
- **Processing Time**: ~100-500ms per item (network dependent)
- **Concurrent Requests**: Max 3 simultaneous
- **Throughput**: ~6-30 items/second

### Database Operations
- **Insert**: <5ms
- **Query (indexed)**: <10ms
- **Bulk insert (10 items)**: <20ms
- **Full table scan (1000 items)**: <50ms

### Storage Requirements
- **Queue Item**: ~1-2 KB
- **Conflict Record**: ~2-3 KB
- **Cache Entry**: Varies (response size)
- **Database Overhead**: ~20%

### Memory Usage
- **Base Service Memory**: ~5-10 MB
- **Per Queue Item**: ~1-2 KB
- **Per Active Sync**: ~2-5 MB
- **Cache Memory**: Configurable

## Security Architecture

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│  ┌───────────────────────────────────┐ │
│  │     User Authentication           │ │
│  │  - Login / Biometric              │ │
│  └──────────────┬────────────────────┘ │
└─────────────────┼──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│          Token Management              │
│  ┌───────────────────────────────────┐│
│  │ - Store in Keychain/Keystore     ││
│  │ - Auto-refresh before expiry     ││
│  │ - Secure token storage           ││
│  └───────────────────────────────────┘│
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│        Request Interceptors            │
│  ┌───────────────────────────────────┐│
│  │ - Add Authorization header       ││
│  │ - Add request signatures         ││
│  │ - Validate data                  ││
│  └───────────────────────────────────┘│
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│          Transport Security            │
│  ┌───────────────────────────────────┐│
│  │ - HTTPS only                     ││
│  │ - Certificate pinning            ││
│  │ - TLS 1.2+                       ││
│  └───────────────────────────────────┘│
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│          Data Encryption               │
│  ┌───────────────────────────────────┐│
│  │ - Encrypt sensitive fields       ││
│  │ - Secure file storage            ││
│  │ - Database encryption at rest    ││
│  └───────────────────────────────────┘│
└────────────────────────────────────────┘
```

## Monitoring & Observability

Key metrics to track:

1. **Sync Metrics**
   - Success rate
   - Failure rate
   - Average sync time
   - Items synced per session

2. **Queue Metrics**
   - Queue depth
   - Average queue time
   - Retry rate
   - Failed items count

3. **Network Metrics**
   - Connection uptime
   - Connection type distribution
   - Data transferred

4. **Performance Metrics**
   - Database query time
   - API response time
   - Memory usage
   - Battery impact

5. **User Experience**
   - Offline operation count
   - Time to sync after reconnect
   - Conflict rate
   - Manual resolution rate

## Error Handling Strategy

```
┌─────────────┐
│   Error     │
└──────┬──────┘
       │
   ┌───┴─────┐
   │Classify │
   └───┬─────┘
       │
   ┌───┴────────────────────┐
   │                        │
   ▼                        ▼
┌─────────┐          ┌──────────┐
│Retryable│          │Non-      │
│         │          │Retryable │
├─────────┤          ├──────────┤
│• Network│          │• 401     │
│• 5xx    │          │• 403     │
│• 408    │          │• 400     │
│• 429    │          │• 422     │
└────┬────┘          └────┬─────┘
     │                    │
     ▼                    ▼
┌─────────┐          ┌──────────┐
│Schedule │          │Mark      │
│Retry    │          │Failed    │
│         │          │          │
│+ exp    │          │Notify    │
│backoff  │          │User      │
└─────────┘          └──────────┘
```

## Testing Strategy

1. **Unit Tests**
   - Service methods
   - Utility functions
   - Data transformations

2. **Integration Tests**
   - Queue processing
   - Sync operations
   - Conflict resolution

3. **E2E Tests**
   - Offline → Online flow
   - Sync after long offline
   - Conflict scenarios

4. **Performance Tests**
   - Large queue (1000+ items)
   - Concurrent syncs
   - Database performance

5. **Network Tests**
   - Slow network
   - Intermittent connectivity
   - Network switch (WiFi ↔ Cellular)

## Future Enhancements

1. **Smart Sync**
   - ML-based prediction of connectivity loss
   - Prioritize based on user behavior
   - Adaptive batch size

2. **Compression**
   - Compress request/response payloads
   - Delta sync (only changes)
   - Binary protocols

3. **Real-time Sync**
   - WebSocket connection
   - Server-sent events
   - Push notifications for conflicts

4. **Advanced Conflict Resolution**
   - Visual diff tool
   - Three-way merge
   - Conflict history

5. **Analytics**
   - User behavior tracking
   - Performance monitoring
   - Crash reporting

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-17
**Author**: Claude Code (Anthropic)
