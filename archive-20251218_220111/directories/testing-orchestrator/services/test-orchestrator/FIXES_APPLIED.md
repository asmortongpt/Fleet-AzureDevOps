# Test Orchestrator Service - Fixes Applied

## Summary
Fixed the test orchestrator service to use modern OpenAI v2.x API syntax and lazy client initialization, matching the pattern from the RAG indexer service.

## Changes Applied

### 1. Updated OpenAI API to v2.x Syntax

**Before:**
```python
import openai

openai.api_key = OPENAI_API_KEY
openai.api_base = OPENAI_ENDPOINT
openai.api_type = "azure"
openai.api_version = "2024-02-01"

response = await openai.ChatCompletion.acreate(
    deployment_id="gpt-4-turbo",
    messages=[...],
    temperature=0.3,
    max_tokens=3000
)
text = response['choices'][0]['message']['content']
```

**After:**
```python
from openai import AsyncAzureOpenAI

def get_openai_client() -> AsyncAzureOpenAI:
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY or not OPENAI_ENDPOINT:
            raise ValueError("OPENAI_API_KEY and OPENAI_ENDPOINT must be set")
        _openai_client = AsyncAzureOpenAI(
            api_key=OPENAI_API_KEY,
            azure_endpoint=OPENAI_ENDPOINT,
            api_version="2024-02-01"
        )
    return _openai_client

client = get_openai_client()
response = await client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[...],
    temperature=0.3,
    max_tokens=3000
)
text = response.choices[0].message.content
```

### 2. Lazy Client Initialization

**Before:**
```python
from azure.cosmos import CosmosClient
from azure.storage.blob import BlobServiceClient

# Module-level initialization (crashes if env vars are None)
cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
database = cosmos_client.get_database_client("rag-knowledge")
blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
```

**After:**
```python
from azure.cosmos.aio import CosmosClient
from azure.storage.blob.aio import BlobServiceClient

# Global client instances (lazy initialization)
_cosmos_client = None
_database_client = None
_blob_service_client = None
_openai_client = None

async def get_cosmos_client():
    """Get or create Cosmos client"""
    global _cosmos_client
    if _cosmos_client is None:
        if not COSMOS_CONNECTION_STRING:
            raise ValueError("COSMOS_CONNECTION_STRING must be set")
        _cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
    return _cosmos_client

async def get_database_client():
    """Get or create database client"""
    global _database_client
    if _database_client is None:
        cosmos = await get_cosmos_client()
        _database_client = cosmos.get_database_client("rag-knowledge")
    return _database_client

async def get_blob_service_client():
    """Get or create blob service client"""
    global _blob_service_client
    if _blob_service_client is None:
        if not STORAGE_CONNECTION_STRING:
            raise ValueError("STORAGE_CONNECTION_STRING must be set")
        _blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
    return _blob_service_client
```

### 3. Updated Usage Throughout Codebase

Updated all functions to use the lazy client getters:

- `generate_comprehensive_test_plan()` - Uses `get_openai_client()` and `await get_database_client()`
- `execute_test_suite()` - Uses `await get_database_client()`
- `generate_test_report()` - Uses `get_openai_client()` and `await get_blob_service_client()`
- `get_test_report()` - Uses `await get_blob_service_client()`
- `build_mode_endpoint()` - Uses `get_openai_client()`

### 4. Updated requirements.txt

```diff
- openai==1.3.5
+ openai>=1.54.0
+ aiohttp>=3.8.0
- azure-cosmos==4.5.1
- azure-storage-blob==12.19.0
+ azure-cosmos>=4.5.1
+ azure-storage-blob>=12.19.0
```

### 5. Updated Async Blob Storage API

**Before:**
```python
blob_client = blob_service_client.get_blob_client(container="test-reports", blob=f"{test_id}_report.json")
report_json = blob_client.download_blob().readall()
```

**After:**
```python
blob_service_client = await get_blob_service_client()
blob_client = blob_service_client.get_blob_client(container="test-reports", blob=f"{test_id}_report.json")
downloader = await blob_client.download_blob()
report_json = await downloader.readall()
```

## Benefits

1. ✅ **No crashes on import** - Service can be imported without environment variables set
2. ✅ **Modern OpenAI API** - Using latest AsyncAzureOpenAI client with proper async support
3. ✅ **Lazy initialization** - Clients only created when needed
4. ✅ **Better error handling** - Clear ValueError messages when credentials are missing
5. ✅ **Consistent with RAG indexer** - Same patterns across all services
6. ✅ **Async throughout** - Using async versions of Azure SDK clients

## Testing

The service can now be imported without credentials:

```python
import os
# Clear environment variables
for var in ["COSMOS_CONNECTION_STRING", "STORAGE_CONNECTION_STRING", "OPENAI_API_KEY", "OPENAI_ENDPOINT"]:
    if var in os.environ:
        del os.environ[var]

# Import succeeds without crashing
import app
print(f"✅ {app.app.title}")  # Test Orchestrator Service
```

## Files Modified

- `/Users/andrewmorton/Documents/GitHub/Fleet/testing-orchestrator/services/test-orchestrator/app.py`
- `/Users/andrewmorton/Documents/GitHub/Fleet/testing-orchestrator/services/test-orchestrator/requirements.txt`

## Reference Implementation

The RAG indexer service at `/Users/andrewmorton/Documents/GitHub/Fleet/testing-orchestrator/services/rag-indexer/app.py` was used as the reference implementation for these fixes.
