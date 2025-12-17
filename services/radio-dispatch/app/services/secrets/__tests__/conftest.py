"""Pytest configuration and fixtures for secrets tests."""

import pytest
import os
import sys
from pathlib import Path

# Add the app root to the path
app_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(app_root))

# Mock environment variables
os.environ.setdefault("AZURE_KEY_VAULT_URL", "")
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost/db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    import asyncio

    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
