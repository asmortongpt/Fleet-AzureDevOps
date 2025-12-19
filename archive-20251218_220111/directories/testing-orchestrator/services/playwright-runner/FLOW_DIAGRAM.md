# Lazy Initialization Flow Diagram

## Before (Crashes)

```
┌─────────────────────────────────────────────────────────────┐
│ Module Import (app.py)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. import os, FastAPI, BlobServiceClient...               │
│  2. STORAGE_CONNECTION_STRING = os.getenv(...)             │
│  3. blob_service_client = BlobServiceClient                │
│     .from_connection_string(STORAGE_CONNECTION_STRING)     │
│                                                             │
│     ❌ CRASH! ValueError: Connection string is invalid      │
│                                                             │
│  Service never starts                                       │
└─────────────────────────────────────────────────────────────┘
```

## After (Works)

```
┌─────────────────────────────────────────────────────────────┐
│ Module Import (app.py)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. import os, FastAPI, BlobServiceClient...               │
│  2. STORAGE_CONNECTION_STRING = os.getenv(...)             │
│  3. _blob_service_client = None  ✓ (No crash!)             │
│  4. Define get_blob_service_client() function              │
│                                                             │
│  ✓ Module loads successfully                                │
│  ✓ Service starts                                           │
│  ✓ Health endpoint works                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ First Screenshot Upload Request                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. POST /screenshot called                                │
│  2. capture_and_upload_screenshot() invoked                │
│  3. upload_screenshot() called                             │
│  4. get_blob_service_client() called                       │
│                                                             │
│     ┌─ Is _blob_service_client None?                       │
│     │  YES                                                  │
│     │                                                       │
│     ├─ Is STORAGE_CONNECTION_STRING set?                   │
│     │  NO                                                   │
│     │                                                       │
│     └─ ❌ Raise ValueError with clear message              │
│                                                             │
│  5. HTTPException(503, detail="STORAGE_CONNECTION...")     │
│                                                             │
│  ✓ Clear error returned to client                          │
│  ✓ Service continues running                               │
└─────────────────────────────────────────────────────────────┘
```

## With Credentials (Happy Path)

```
┌─────────────────────────────────────────────────────────────┐
│ Module Import (app.py)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. import os, FastAPI, BlobServiceClient...               │
│  2. STORAGE_CONNECTION_STRING = os.getenv(...)             │
│     → "DefaultEndpointsProtocol=https;AccountName=..."     │
│  3. _blob_service_client = None  ✓                          │
│  4. Define get_blob_service_client() function              │
│                                                             │
│  ✓ Module loads successfully                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ First Screenshot Upload Request                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. POST /screenshot called                                │
│  2. capture_and_upload_screenshot() invoked                │
│  3. upload_screenshot() called                             │
│  4. get_blob_service_client() called                       │
│                                                             │
│     ┌─ Is _blob_service_client None?                       │
│     │  YES (first call)                                     │
│     │                                                       │
│     ├─ Is STORAGE_CONNECTION_STRING set?                   │
│     │  YES ✓                                                │
│     │                                                       │
│     ├─ Create BlobServiceClient                            │
│     │  _blob_service_client = BlobServiceClient            │
│     │    .from_connection_string(STORAGE_CONNECTION_STRING)│
│     │                                                       │
│     └─ Return _blob_service_client ✓                       │
│                                                             │
│  5. Upload screenshot to Azure Blob Storage ✓              │
│  6. Return screenshot URL to client ✓                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Subsequent Screenshot Uploads                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. get_blob_service_client() called                       │
│                                                             │
│     ┌─ Is _blob_service_client None?                       │
│     │  NO (already initialized)                            │
│     │                                                       │
│     └─ Return existing _blob_service_client ✓              │
│                                                             │
│  2. Reuse existing client (fast!) ✓                        │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Error Scenarios                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Scenario 1: No credentials at import                       │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ✓ Module imports successfully                         │   │
│ │ ✓ Service starts                                      │   │
│ │ ✓ Health check works                                  │   │
│ │ ❌ Screenshot upload returns 503                      │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Scenario 2: Credentials set after import                   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ✓ Service running                                     │   │
│ │ ✓ Set STORAGE_CONNECTION_STRING env var               │   │
│ │ ✓ Restart service                                     │   │
│ │ ✓ Screenshot upload works                             │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Scenario 3: Invalid credentials                            │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ✓ Module imports successfully                         │   │
│ │ ❌ First upload fails with Azure connection error     │   │
│ │ ✓ Service continues running                           │   │
│ │ ✓ Can fix credentials and retry                       │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## State Diagram

```
                    ┌──────────────┐
                    │ Module Load  │
                    └──────┬───────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ _blob_service_client   │
              │        = None          │
              └────────────────────────┘
                           │
                           │ First upload request
                           ▼
              ┌────────────────────────┐
              │ get_blob_service_      │
              │     client()           │
              └────────┬───────────────┘
                       │
                       ├─ No credentials ───► ValueError ───► HTTPException(503)
                       │
                       └─ Has credentials ──► Create client
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ _blob_service_   │
                                    │ client =         │
                                    │ BlobServiceClient│
                                    └────────┬─────────┘
                                             │
                                             │ Subsequent requests
                                             ▼
                                    ┌──────────────────┐
                                    │ Reuse existing   │
                                    │ client (cached)  │
                                    └──────────────────┘
```

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Initialization Time** | Module load | First upload |
| **Crash on import?** | ❌ Yes | ✓ No |
| **Service starts?** | ❌ No | ✓ Yes |
| **Health check?** | ❌ Can't reach | ✓ Works |
| **Upload w/o creds** | ❌ Crash | ✓ 503 error |
| **Error message** | ❌ Generic | ✓ Clear |
| **Can fix & retry?** | ❌ Must restart | ✓ Just retry |
| **Performance** | N/A | ✓ Cached after first use |
