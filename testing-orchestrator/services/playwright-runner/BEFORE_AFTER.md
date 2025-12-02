# Playwright Runner - Before/After Comparison

## Before (Broken)

### Module Initialization
```python
# ❌ CRASHES at import time if STORAGE_CONNECTION_STRING is None
STORAGE_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")
blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
```

### Error When Starting Service
```bash
$ python app.py
Traceback (most recent call last):
  File "app.py", line 26, in <module>
    blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
  File ".../azure/storage/blob/_blob_service_client.py", line 123, in from_connection_string
    raise ValueError("Connection string is invalid")
ValueError: Connection string is invalid
```

### upload_screenshot Method
```python
async def upload_screenshot(self, screenshot_bytes: bytes, filename: str) -> str:
    """Upload screenshot to Azure Blob Storage"""
    # ❌ Uses global client that may have crashed during init
    blob_client = blob_service_client.get_blob_client(
        container=SCREENSHOTS_CONTAINER,
        blob=filename
    )
    blob_client.upload_blob(screenshot_bytes, overwrite=True)
    return f"https://{blob_service_client.account_name}.blob.core.windows.net/{SCREENSHOTS_CONTAINER}/{filename}"
```

---

## After (Fixed)

### Module Initialization
```python
# ✅ No crash - client is None until first use
STORAGE_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")
_blob_service_client = None

def get_blob_service_client() -> BlobServiceClient:
    """Lazy initialization of Azure Blob Service Client"""
    global _blob_service_client

    if _blob_service_client is None:
        if not STORAGE_CONNECTION_STRING:
            raise ValueError(
                "STORAGE_CONNECTION_STRING environment variable is required for screenshot upload. "
                "Please set this variable to enable Azure Blob Storage integration."
            )
        _blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)

    return _blob_service_client
```

### Service Starts Successfully
```bash
$ python app.py
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8002
```

### Health Check Works
```bash
$ curl http://localhost:8002/health
{"status":"healthy","service":"playwright-runner"}
```

### upload_screenshot Method
```python
async def upload_screenshot(self, screenshot_bytes: bytes, filename: str) -> str:
    """Upload screenshot to Azure Blob Storage"""
    try:
        # ✅ Lazy initialization only happens when upload is called
        blob_service_client = get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=SCREENSHOTS_CONTAINER,
            blob=filename
        )
        blob_client.upload_blob(screenshot_bytes, overwrite=True)
        return f"https://{blob_service_client.account_name}.blob.core.windows.net/{SCREENSHOTS_CONTAINER}/{filename}"
    except ValueError as e:
        # ✅ Clear HTTP error with helpful message
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
```

### Screenshot Upload Without Credentials
```bash
$ curl -X POST http://localhost:8002/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","viewport":{"width":1920,"height":1080}}'

{
  "detail": "STORAGE_CONNECTION_STRING environment variable is required for screenshot upload. Please set this variable to enable Azure Blob Storage integration."
}
```

---

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Import Behavior** | ❌ Crashes if env var missing | ✅ Always succeeds |
| **Service Startup** | ❌ Can't start without storage | ✅ Starts in all environments |
| **Error Messages** | ❌ Generic connection error | ✅ Clear, actionable message |
| **HTTP Status** | ❌ 500 Internal Server Error | ✅ 503 Service Unavailable |
| **Health Check** | ❌ Can't even get to endpoint | ✅ Works without storage |
| **Developer Experience** | ❌ Can't test without Azure | ✅ Can run locally easily |
| **Production Ready** | ❌ Fragile | ✅ Robust |

---

## Testing Comparison

### Before
```bash
# ❌ Can't even import the module
$ python -c "import app"
Traceback (most recent call last):
  ...
ValueError: Connection string is invalid
```

### After
```bash
# ✅ Module imports successfully
$ python test_lazy_init.py
Testing lazy blob client initialization...
STORAGE_CONNECTION_STRING is set: False

[Test 1] Importing app module without credentials...
✓ Module logic imported successfully without STORAGE_CONNECTION_STRING

[Test 2] Calling get_blob_service_client without credentials...
✓ Correctly raised ValueError: STORAGE_CONNECTION_STRING environment variable is required...

============================================================
All tests passed! ✓
============================================================
```

---

## Real-World Impact

### Development Environment
**Before:** Developers had to set up Azure storage or fake credentials just to run the service
**After:** Service runs immediately, storage only required when actually uploading screenshots

### CI/CD Pipeline
**Before:** Pipeline needed Azure credentials even for basic health checks
**After:** Can test service functionality without cloud dependencies

### Local Testing
**Before:** Can't test non-storage features without credentials
**After:** Full local testing with graceful degradation

### Production Deployment
**Before:** Silent failure if credentials misconfigured
**After:** Clear 503 error with actionable message

---

## Migration Impact

**Breaking Changes:** None
**Code Changes Required:** None
**Deployment Risk:** Low (backwards compatible)
**Rollback Strategy:** Not needed (can revert safely)
