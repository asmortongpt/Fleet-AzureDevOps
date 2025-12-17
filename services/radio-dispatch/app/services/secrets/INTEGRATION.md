# Integration Guide: Secrets Management

This guide explains how to integrate the Secrets Management Service into the Radio Fleet Dispatch application.

## Quick Start

### 1. Initialize in Application Startup

```python
# In app/main.py or your startup sequence

from app.services.secrets import (
    SecretsManager,
    SecretsAudit,
    SecretsRotation,
    EmergencyRevoke,
)

# Create instances
secrets_manager = SecretsManager()
audit = SecretsAudit()
rotation = SecretsRotation(secrets_manager, audit)
revoke = EmergencyRevoke(secrets_manager, audit)

# Initialize async systems
async def startup():
    await audit.initialize()
    await rotation.initialize()
    await revoke.initialize()

    # Start automatic rotation scheduler
    await rotation.start_rotation_scheduler(check_interval_seconds=3600)

async def shutdown():
    await audit.shutdown()
    await rotation.shutdown()
    await revoke.shutdown()
```

### 2. Add to FastAPI Application

```python
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager

# Global instances
_secrets_manager = None
_audit_system = None
_rotation_system = None
_revoke_system = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global _secrets_manager, _audit_system, _rotation_system, _revoke_system

    _secrets_manager = SecretsManager()
    _audit_system = SecretsAudit()
    _rotation_system = SecretsRotation(_secrets_manager, _audit_system)
    _revoke_system = EmergencyRevoke(_secrets_manager, _audit_system)

    await _audit_system.initialize()
    await _rotation_system.initialize()
    await _revoke_system.initialize()
    await _rotation_system.start_rotation_scheduler()

    yield

    # Shutdown
    await _audit_system.shutdown()
    await _rotation_system.shutdown()
    await _revoke_system.shutdown()

app = FastAPI(lifespan=lifespan)

# Dependency functions
def get_secrets_manager() -> SecretsManager:
    return _secrets_manager

def get_audit() -> SecretsAudit:
    return _audit_system

def get_rotation() -> SecretsRotation:
    return _rotation_system

def get_revoke() -> EmergencyRevoke:
    return _revoke_system
```

### 3. Use in API Routes

```python
from fastapi import APIRouter, Depends, HTTPException
from app.services.secrets import SecretsManager, SecretType

router = APIRouter(prefix="/api/v1/secrets", tags=["secrets"])

@router.post("/create")
async def create_secret(
    name: str,
    value: str,
    secret_type: SecretType = SecretType.API_KEY,
    secrets_mgr: SecretsManager = Depends(get_secrets_manager),
):
    """Create a new secret."""
    try:
        result = await secrets_mgr.create_secret(
            name=name,
            value=value,
            secret_type=secret_type,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{name}")
async def get_secret(
    name: str,
    secrets_mgr: SecretsManager = Depends(get_secrets_manager),
    audit: SecretsAudit = Depends(get_audit),
):
    """Retrieve a secret."""
    try:
        # Log access
        await audit.log_event(
            AuditEvent(
                action=AuditAction.READ,
                resource_name=name,
                timestamp=datetime.utcnow(),
                result=AuditResult.SUCCESS,
                actor_id="api-client",
            )
        )

        value = await secrets_mgr.get_secret(name)
        return {"name": name, "value": value}
    except SecretNotFoundError:
        raise HTTPException(status_code=404, detail="Secret not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

## Configuration Examples

### Production Setup

```python
# app/core/config.py

class ProductionSettings(BaseSettings):
    """Production environment settings."""

    # Azure Key Vault
    AZURE_KEY_VAULT_URL: str = "https://your-vault.vault.azure.net/"

    # Database for audit logs
    DATABASE_URL: str = "postgresql://user:pass@prod-db:5432/fleet"

    # Secrets rotation
    ROTATION_ENABLED: bool = True
    ROTATION_CHECK_INTERVAL_SECONDS: int = 3600  # 1 hour

    # Audit settings
    AUDIT_RETENTION_DAYS: int = 90
    SUSPICIOUS_ACTIVITY_THRESHOLD: int = 5

settings = ProductionSettings()
```

### Development Setup

```python
# app/core/config.py

class DevelopmentSettings(BaseSettings):
    """Development environment settings."""

    # No Key Vault in dev - use mock mode
    AZURE_KEY_VAULT_URL: str = ""

    # SQLite for local development
    DATABASE_URL: str = "sqlite:///./test.db"

    # Disable rotation in dev
    ROTATION_ENABLED: bool = False

    # Log all access in dev
    AUDIT_RETENTION_DAYS: int = 1

settings = DevelopmentSettings()
```

## Common Integration Patterns

### Pattern 1: Lazy Loading Secrets

```python
from functools import lru_cache

class SecretProvider:
    """Lazy load and cache secrets."""

    def __init__(self, secrets_mgr: SecretsManager):
        self.secrets_mgr = secrets_mgr
        self._cache = {}

    async def get_secret(self, name: str) -> str:
        """Get secret with caching."""
        if name in self._cache:
            return self._cache[name]

        value = await self.secrets_mgr.get_secret(name)
        self._cache[name] = value
        return value

    async def invalidate_cache(self, name: str = None):
        """Invalidate cache on rotation."""
        if name:
            self._cache.pop(name, None)
        else:
            self._cache.clear()
```

### Pattern 2: Automatic Secret Rotation Callback

```python
from cryptography.fernet import Fernet

class APIKeyRotationCallback:
    """Generate new API keys on rotation."""

    async def __call__(self, secret_name: str) -> str:
        """Generate new key."""
        if "api-key" in secret_name:
            return f"sk-prod-{Fernet.generate_key().decode()}"
        return generate_random_secret(64)

# Register with rotation system
rotation_config = RotationConfig(
    name="production-api-key",
    rotation_days=90,
    rotation_callback=APIKeyRotationCallback(),
)
await rotation.register_secret(rotation_config)
```

### Pattern 3: Comprehensive Audit Tracking

```python
class AuditMiddleware:
    """Middleware to automatically track secret access."""

    def __init__(self, app: FastAPI, audit: SecretsAudit):
        self.app = app
        self.audit = audit

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract actor info from request
        actor_id = scope.get("user", {}).get("id", "unknown")
        actor_ip = scope.get("client", ["unknown"])[0]

        # Store in context
        scope["actor_id"] = actor_id
        scope["actor_ip"] = actor_ip

        await self.app(scope, receive, send)
```

### Pattern 4: Emergency Revocation with Notifications

```python
import aiosmtplib

async def send_revocation_notification(
    recipient: str,
    subject: str,
    message: str,
):
    """Send email notification."""
    # Implementation depends on your email service
    pass

# Create revocation system with notifications
revoke = EmergencyRevoke(
    secrets_manager,
    audit,
    notification_callback=send_revocation_notification,
)

# Request revocation
request = RevocationRequest(
    secret_name="compromised-key",
    reason=RevocationReason.SECURITY_INCIDENT,
    requested_by="security-admin",
    severity="critical",
    notify_recipients=["ops@company.com", "ciso@company.com"],
    immediate=True,
)

await revoke.request_revocation(request)
```

## Database Initialization

### Using Alembic for Migrations

```python
# migrations/versions/001_create_secrets_audit_tables.py

def upgrade():
    op.execute("""
    CREATE TABLE secrets_audit_log (
        id BIGSERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        resource_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        result VARCHAR(50) NOT NULL,
        actor_id VARCHAR(255),
        actor_ip VARCHAR(45),
        actor_user_agent TEXT,
        details JSONB,
        error_message TEXT,
        duration_ms INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_secrets_audit_resource
        ON secrets_audit_log(resource_name);
    CREATE INDEX idx_secrets_audit_timestamp
        ON secrets_audit_log(timestamp DESC);
    CREATE INDEX idx_secrets_audit_action
        ON secrets_audit_log(action);
    """)

def downgrade():
    op.execute("DROP TABLE IF EXISTS secrets_audit_log CASCADE;")
```

## Monitoring and Observability

### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram

# Metrics
secrets_created = Counter('secrets_created_total', 'Total secrets created')
secrets_rotated = Counter('secrets_rotated_total', 'Total secrets rotated')
secrets_revoked = Counter('secrets_revoked_total', 'Total secrets revoked')
secret_access_duration = Histogram('secret_access_duration_ms', 'Secret access duration')

# Use in operations
@app.post("/secrets/create")
async def create_secret(...):
    try:
        result = await secrets_mgr.create_secret(...)
        secrets_created.inc()
        return result
    except Exception:
        raise
```

### Structured Logging

```python
import structlog

logger = structlog.get_logger(__name__)

# Log important events
logger.info(
    "secret_created",
    secret_name="prod-api-key",
    secret_type="api-key",
    expires_days=90,
)

logger.warning(
    "suspicious_activity_detected",
    secret="compromised-key",
    failure_count=10,
    actor_ip="192.168.1.1",
)
```

## Testing Integration

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.fixture
def secrets_manager_mock():
    """Mock secrets manager for testing."""
    return AsyncMock(spec=SecretsManager)

@pytest.mark.asyncio
async def test_secret_creation_endpoint(client, secrets_manager_mock):
    """Test secret creation endpoint."""

    secrets_manager_mock.create_secret.return_value = {
        "name": "test-secret",
        "version": "1",
    }

    response = await client.post(
        "/api/v1/secrets/create",
        json={
            "name": "test-secret",
            "value": "test-value",
        }
    )

    assert response.status_code == 200
    assert response.json()["name"] == "test-secret"
```

## Troubleshooting Integration

### Issue: "Secret not found" in production

```python
# Debug steps
1. Verify Azure Key Vault URL is set
2. Check Azure AD credentials
3. Verify secret exists: await manager.list_secrets()
4. Check audit logs: await audit.get_audit_trail()
```

### Issue: Rotation not happening

```python
# Debug steps
1. Verify rotation is enabled: status = await rotation.get_rotation_status()
2. Check scheduler is running: if rotation._rotation_task:
3. Review audit logs: AuditAction.ROTATE
4. Check error messages in rotation history
```

### Issue: Slow secret retrieval

```python
# Optimization steps
1. Add caching layer (see Pattern 1)
2. Use bulk operations where possible
3. Index audit logs for faster queries
4. Monitor database query performance
```

## Migration from Other Secret Systems

### From Environment Variables

```python
# Old approach
API_KEY = os.getenv("API_KEY")

# New approach
api_key = await secrets_manager.get_secret("production-api-key")
```

### From Kubernetes Secrets

```python
# Use during migration
# 1. Import K8s secrets to Key Vault
# 2. Update application to use SecretsManager
# 3. Verify all clients updated
# 4. Decommission K8s secrets
```

## Next Steps

1. Set up database schema for audit logs
2. Configure Azure Key Vault access
3. Initialize secrets in production
4. Set up rotation policies
5. Configure monitoring and alerts
6. Test emergency revocation procedures
7. Document runbooks for operations team

## Support and Resources

- See [README.md](README.md) for detailed documentation
- Review [test_secrets.py](__tests__/test_secrets.py) for usage examples
- Check [requirements.txt](../../requirements.txt) for dependencies
