# Playwright Runner Service - Lazy Initialization Implementation

## Overview

This directory contains the Playwright Runner Service with lazy blob client initialization to prevent import crashes when Azure Storage credentials are not configured.

## Quick Start

### Run Tests
```bash
python3 test_lazy_init.py
```

### View Documentation
- **[FIX_SUMMARY.md](./FIX_SUMMARY.md)** - Executive summary of the fix
- **[LAZY_INIT_FIX.md](./LAZY_INIT_FIX.md)** - Detailed technical documentation
- **[BEFORE_AFTER.md](./BEFORE_AFTER.md)** - Visual before/after comparison

## What Was Fixed

The service previously crashed at import time when `STORAGE_CONNECTION_STRING` was not set:

```python
# ❌ OLD - crashes during import
blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
```

Now uses lazy initialization:

```python
# ✅ NEW - only initializes when needed
def get_blob_service_client() -> BlobServiceClient:
    global _blob_service_client
    if _blob_service_client is None:
        if not STORAGE_CONNECTION_STRING:
            raise ValueError("STORAGE_CONNECTION_STRING required...")
        _blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
    return _blob_service_client
```

## Testing Results

```
Testing lazy blob client initialization...
STORAGE_CONNECTION_STRING is set: False

[Test 1] Importing app module without credentials...
✓ Module logic imported successfully without STORAGE_CONNECTION_STRING

[Test 2] Calling get_blob_service_client without credentials...
✓ Correctly raised ValueError: STORAGE_CONNECTION_STRING environment variable is required...

[Test 3] Setting STORAGE_CONNECTION_STRING...
✓ Environment variable set: DefaultEndpointsProtocol=https;AccountName=test;Ac...

============================================================
All tests passed! ✓
============================================================
```

## Files in This Directory

| File | Purpose |
|------|---------|
| `app.py` | Main service file (MODIFIED) |
| `test_lazy_init.py` | Test script for lazy initialization (NEW) |
| `FIX_SUMMARY.md` | Executive summary (NEW) |
| `LAZY_INIT_FIX.md` | Detailed documentation (NEW) |
| `BEFORE_AFTER.md` | Before/after comparison (NEW) |
| `README_LAZY_INIT.md` | This file (NEW) |

## Running the Service

### With Azure Storage
```bash
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=myaccount;..."
export SCREENSHOTS_CONTAINER="ui-screenshots"
python app.py
```

### Without Azure Storage (Limited Mode)
```bash
# Service starts but screenshot uploads return 503
python app.py
```

## API Behavior

### Health Check (Always Works)
```bash
$ curl http://localhost:8002/health
{"status":"healthy","service":"playwright-runner"}
```

### Screenshot Upload (Requires Storage)
```bash
# Without credentials - returns 503
$ curl -X POST http://localhost:8002/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","viewport":{"width":1920,"height":1080}}'

{
  "detail": "STORAGE_CONNECTION_STRING environment variable is required for screenshot upload. Please set this variable to enable Azure Blob Storage integration."
}
```

## Benefits

1. Service can start without Azure credentials
2. Clear error messages when storage is needed but not configured
3. Graceful degradation for non-storage features
4. Better developer experience
5. More robust in CI/CD environments

## Migration Notes

- No breaking changes
- Backwards compatible
- No code changes required for consumers
- Safe to deploy

## Next Steps

Consider applying this pattern to other services:
- RAG Indexer (Cosmos DB, Blob Storage)
- Any service with optional cloud dependencies

## Validation

```bash
# Syntax check
python3 -m py_compile app.py
✓ Syntax validation passed

# Test lazy initialization
python3 test_lazy_init.py
✓ All tests passed!
```

## Support

For questions or issues with this implementation:
1. Review the documentation in this directory
2. Run the test script to verify behavior
3. Check the before/after comparison for context

---

**Last Updated:** 2025-11-13
**Status:** ✅ Implemented and Tested
