# Playwright Runner Service - Lazy Initialization Fix

## Summary

Fixed the Playwright runner service to use lazy blob client initialization, preventing import failures when `STORAGE_CONNECTION_STRING` is not set.

## Changes Made

### 1. Lazy Client Initialization

**Before:**
```python
# Initialize Azure Storage client at module load (CRASHES if env var not set)
blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
```

**After:**
```python
# Lazy initialization - only creates client when needed
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

### 2. Updated upload_screenshot Method

**Before:**
```python
async def upload_screenshot(self, screenshot_bytes: bytes, filename: str) -> str:
    """Upload screenshot to Azure Blob Storage"""
    blob_client = blob_service_client.get_blob_client(
        container=SCREENSHOTS_CONTAINER,
        blob=filename
    )
    # ...
```

**After:**
```python
async def upload_screenshot(self, screenshot_bytes: bytes, filename: str) -> str:
    """Upload screenshot to Azure Blob Storage"""
    try:
        blob_service_client = get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=SCREENSHOTS_CONTAINER,
            blob=filename
        )
        # ...
    except ValueError as e:
        # If storage is not configured, return a mock URL or handle gracefully
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
```

## Benefits

1. **No Import Crashes**: Module can be imported successfully even without `STORAGE_CONNECTION_STRING`
2. **Clear Error Messages**: When storage is needed but not configured, users get a helpful error message
3. **Proper HTTP Status**: Returns 503 Service Unavailable with clear details when storage is not configured
4. **Graceful Degradation**: Other parts of the service can still function (e.g., health checks, non-screenshot features)

## Testing

Run the included test script to verify the fix:

```bash
python3 test_lazy_init.py
```

Expected output:
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

## Usage

### With Storage Configured

Set the environment variable before starting the service:

```bash
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=...;EndpointSuffix=core.windows.net"
export SCREENSHOTS_CONTAINER="ui-screenshots"

python app.py
```

### Without Storage (Limited Functionality)

The service will start and run, but screenshot upload endpoints will return 503:

```bash
# No STORAGE_CONNECTION_STRING set
python app.py
```

API responses for screenshot endpoints:
```json
{
  "detail": "STORAGE_CONNECTION_STRING environment variable is required for screenshot upload. Please set this variable to enable Azure Blob Storage integration."
}
```

## Migration Guide

If you're using this service in other code, no changes are needed. The API remains the same, but error handling is improved.

## Files Modified

- `/services/playwright-runner/app.py` - Main service file with lazy initialization
- `/services/playwright-runner/test_lazy_init.py` - Test script to verify the fix (new file)
- `/services/playwright-runner/LAZY_INIT_FIX.md` - This documentation (new file)

## Related Issues

This fix addresses the issue where services crash at import time when optional cloud storage credentials are not configured. The same pattern should be applied to other services that use Azure/cloud resources.
