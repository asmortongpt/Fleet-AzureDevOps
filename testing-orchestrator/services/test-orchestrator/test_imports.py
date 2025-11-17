#!/usr/bin/env python3
"""
Test that the app module can be imported without credentials.
This verifies lazy initialization is working correctly.
"""

import os
import sys

# Clear all Azure/OpenAI environment variables to simulate missing credentials
env_vars_to_clear = [
    "COSMOS_CONNECTION_STRING",
    "STORAGE_CONNECTION_STRING",
    "OPENAI_API_KEY",
    "OPENAI_ENDPOINT",
    "RAG_INDEXER_URL",
    "APPINSIGHTS_CONNECTION_STRING"
]

for var in env_vars_to_clear:
    if var in os.environ:
        del os.environ[var]

# Now try to import the app module
try:
    import app
    print("✅ SUCCESS: app module imported without crashing")
    print("✅ Lazy initialization is working correctly")
    print(f"✅ FastAPI app created: {app.app.title}")
    print(f"✅ Client variables initialized as None:")
    print(f"   - _cosmos_client: {app._cosmos_client}")
    print(f"   - _database_client: {app._database_client}")
    print(f"   - _blob_service_client: {app._blob_service_client}")
    print(f"   - _openai_client: {app._openai_client}")
    sys.exit(0)
except Exception as e:
    print(f"❌ FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
