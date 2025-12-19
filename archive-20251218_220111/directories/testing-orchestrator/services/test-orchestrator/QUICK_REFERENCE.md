# Test Orchestrator Service - Quick Reference

## Files Modified

| File | Size | Changes |
|------|------|---------|
| `app.py` | 22K (673 lines) | OpenAI v2.x, lazy init, async clients |
| `requirements.txt` | 172 bytes | Updated openai, added aiohttp |

## Key Code Patterns

### OpenAI API v2.x
```python
# Get client
client = get_openai_client()

# Make API call
response = await client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[{"role": "system", "content": "..."}, {"role": "user", "content": "..."}],
    temperature=0.3,
    max_tokens=3000
)

# Access response
text = response.choices[0].message.content
```

### Cosmos DB Access
```python
# Get database client
database = await get_database_client()

# Get container and upsert
container = database.get_container_client("container_name")
await container.upsert_item({"id": "...", "data": "..."})
```

### Blob Storage Access
```python
# Get blob service client
blob_service_client = await get_blob_service_client()

# Upload blob
blob_client = blob_service_client.get_blob_client(container="container", blob="filename.json")
await blob_client.upload_blob(data, overwrite=True)

# Download blob
downloader = await blob_client.download_blob()
data = await downloader.readall()
```

## Environment Variables Required

```bash
COSMOS_CONNECTION_STRING=AccountEndpoint=https://...
STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
OPENAI_API_KEY=sk-...
OPENAI_ENDPOINT=https://....openai.azure.com/
RAG_INDEXER_URL=http://localhost:8000  # Optional
```

## Quick Test

```bash
# 1. Syntax check
python3 -m py_compile app.py

# 2. Import test (no env vars needed)
python3 -c "import app; print(app.app.title)"

# 3. Start service
uvicorn app:app --host 0.0.0.0 --port 8001

# 4. Health check
curl http://localhost:8001/health
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/generate-test-plan` | POST | Generate comprehensive test plan |
| `/execute-test-plan` | POST | Execute test plan (background) |
| `/test-report/{test_id}` | GET | Get test report by ID |
| `/build-mode` | POST | BUILD MODE analysis |

## Common Issues & Solutions

### Issue: Import fails with ModuleNotFoundError
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

### Issue: ValueError about missing credentials
```bash
# Solution: Set required environment variables
export OPENAI_API_KEY="your-key"
export OPENAI_ENDPOINT="your-endpoint"
export COSMOS_CONNECTION_STRING="your-connection-string"
export STORAGE_CONNECTION_STRING="your-connection-string"
```

### Issue: Old OpenAI API syntax errors
```bash
# Solution: Already fixed! Using AsyncAzureOpenAI client
# Check that openai>=1.54.0 is installed
pip show openai
```

## Documentation Files

- `README_FIXES.md` - This file (quick reference)
- `FIXES_APPLIED.md` - Detailed before/after examples
- `VALIDATION_REPORT.md` - Comprehensive validation results
- `test_imports.py` - Import validation script

## Reference Implementation

Based on: `/Users/andrewmorton/Documents/GitHub/Fleet/testing-orchestrator/services/rag-indexer/app.py`

## Verified

- ✅ Python syntax valid
- ✅ Imports work without credentials
- ✅ All 3 OpenAI API calls updated
- ✅ All 2 Cosmos DB accesses updated
- ✅ All 2 Blob Storage accesses updated
- ✅ Lazy client initialization working
- ✅ Matches reference implementation

## Status

**COMPLETE** - Ready for deployment
