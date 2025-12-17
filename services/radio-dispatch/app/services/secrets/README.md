# Secrets Management Service

Enterprise-grade secrets management for the Radio Fleet Dispatch service with Azure Key Vault integration, automatic rotation, comprehensive audit logging, and emergency revocation capabilities.

## Overview

The Secrets Management Service provides secure storage and lifecycle management of sensitive information including:

- API keys and tokens
- Database credentials
- JWT secrets
- Encryption keys
- Third-party service credentials
- Certificates

## Features

### Core Capabilities

1. **Azure Key Vault Integration**
   - Secure secret storage in Azure Key Vault
   - Automatic secret versioning
   - Mock mode for development/testing
   - Parameterized operations (no string concatenation)

2. **90-Day Automatic Rotation**
   - Configurable rotation schedules
   - Rotation callbacks for integration with secret generators
   - Automatic enforcement of rotation policies
   - Force rotation capability
   - Rotation history tracking

3. **Comprehensive Audit Logging**
   - All secret access logged with actor information
   - IP address and user agent tracking
   - Query filtering and analysis
   - Suspicious activity detection
   - Audit summaries and reports

4. **Emergency Revocation**
   - Immediate secret revocation with audit trail
   - Approval workflow support
   - Multiple revocation reasons
   - Notification system integration
   - Severity levels and risk assessment

## Architecture

### Components

```
secrets_manager.py      - Core Key Vault integration
secrets_audit.py        - Audit logging and analysis
secrets_rotation.py     - Automatic rotation system
emergency_revoke.py     - Emergency revocation system
__init__.py            - Package exports
```

### Dependencies

```
azure-keyvault-secrets==4.9.0   # Azure Key Vault SDK
azure-identity==1.19.0          # Azure authentication
asyncpg==0.30.0                 # PostgreSQL async driver
structlog==24.4.0               # Structured logging
```

## Usage Examples

### Initialize Secrets Manager

```python
from app.services.secrets import (
    SecretsManager,
    SecretsAudit,
    SecretsRotation,
    EmergencyRevoke,
)

# Create manager instance
secrets_manager = SecretsManager()

# Initialize audit system
audit = SecretsAudit()
await audit.initialize()

# Initialize rotation system
rotation = SecretsRotation(secrets_manager, audit)
await rotation.initialize()

# Initialize revocation system
revoke = EmergencyRevoke(secrets_manager, audit)
await revoke.initialize()
```

### Create and Manage Secrets

```python
from app.services.secrets import SecretType

# Create a new API key
result = await secrets_manager.create_secret(
    name="production-api-key",
    value="sk-prod-abc123xyz789",
    secret_type=SecretType.API_KEY,
    metadata={
        "environment": "production",
        "service": "external-api",
    },
    expires_in_days=90,
)

# Retrieve secret
api_key = await secrets_manager.get_secret("production-api-key")

# Update secret
await secrets_manager.update_secret(
    name="production-api-key",
    value="sk-prod-new-value",
)

# Delete secret
await secrets_manager.delete_secret("production-api-key", immediate=False)

# List all secrets
secrets = await secrets_manager.list_secrets()

# Get secret versions
versions = await secrets_manager.get_secret_versions("production-api-key")
```

### Configure Automatic Rotation

```python
from app.services.secrets import RotationConfig

# Define rotation configuration
config = RotationConfig(
    name="api-key-rotation",
    rotation_days=90,
    rotation_hours_before_expiry=24,
    enabled=True,
    rotation_callback=lambda name: generate_new_api_key(),
    description="Production API key with 90-day rotation",
)

# Register for automatic rotation
await rotation.register_secret(config)

# Start automatic rotation scheduler
await rotation.start_rotation_scheduler(check_interval_seconds=3600)

# Get rotation status
status = await rotation.get_rotation_status("api-key-rotation")

# List all rotation configurations
configs = await rotation.list_rotation_configs()
```

### Audit Access and Activity

```python
from app.services.secrets.secrets_audit import AuditAction, AuditResult

# Retrieve audit trail for a secret
trail = await audit.get_audit_trail(
    resource_name="production-api-key",
    action=AuditAction.READ,
    limit=100,
)

# Get audit summary
summary = await audit.get_audit_summary(
    resource_name="production-api-key",
    days=30,
)

# Detect suspicious activity
threats = await audit.detect_suspicious_activity(
    resource_name="production-api-key",
    failure_threshold=5,
    time_window_minutes=30,
)
```

### Emergency Revocation

```python
from app.services.secrets.emergency_revoke import RevocationRequest, RevocationReason

# Create revocation request
request = RevocationRequest(
    secret_name="compromised-api-key",
    reason=RevocationReason.SECURITY_INCIDENT,
    requested_by="security-admin",
    severity="critical",
    description="Key potentially compromised in data breach",
    notify_recipients=["security@example.com", "ops@example.com"],
    immediate=True,
)

# Request revocation
result = await revoke.request_revocation(request)

# For approval-required scenarios
revocation_id = result["revocation_id"]
await revoke.approve_revocation(revocation_id, approved_by="ciso")

# Check revocation status
status = await revoke.get_revocation_status(revocation_id)

# Get revocation history
history = await revoke.get_revocation_history(
    secret_name="compromised-api-key",
    limit=50,
)
```

## Configuration

### Environment Variables

```bash
# Azure Key Vault
AZURE_KEY_VAULT_URL=https://your-vault.vault.azure.net/

# Database (for audit logs and rotation tracking)
DATABASE_URL=postgresql://user:password@localhost:5432/fleet_db

# Logging
LOG_LEVEL=INFO
DEBUG=false
```

### Mock Mode (Development)

When `AZURE_KEY_VAULT_URL` is not set or empty, the system operates in mock mode:

```python
# Mock mode - uses in-memory storage
# Useful for testing and development
secrets_manager = SecretsManager()
# Creates manager with _mock_secrets dict
```

## Database Schema

The audit and rotation systems use PostgreSQL tables:

### secrets_audit_log
```sql
- id (BIGSERIAL PRIMARY KEY)
- action (VARCHAR) - CREATE, READ, UPDATE, DELETE, REVOKE, ROTATE
- resource_name (VARCHAR) - Secret name
- timestamp (TIMESTAMPTZ) - When action occurred
- result (VARCHAR) - SUCCESS, FAILURE, PARTIAL
- actor_id (VARCHAR) - User who performed action
- actor_ip (VARCHAR) - IP address of actor
- actor_user_agent (TEXT) - Browser/client info
- details (JSONB) - Additional context
- error_message (TEXT) - Error details if failed
- duration_ms (INTEGER) - Operation duration
```

### secrets_rotation_config
```sql
- secret_name (VARCHAR PRIMARY KEY)
- rotation_days (INTEGER) - Days between rotations
- rotation_hours_before_expiry (INTEGER) - Buffer before expiry
- enabled (BOOLEAN)
- description (TEXT)
- force_on_next (BOOLEAN)
- last_rotation (TIMESTAMPTZ)
- next_rotation (TIMESTAMPTZ)
```

### secrets_revocation_log
```sql
- id (BIGSERIAL PRIMARY KEY)
- secret_name (VARCHAR)
- reason (VARCHAR) - Security incident, unauthorized access, etc.
- status (VARCHAR) - PENDING, IN_PROGRESS, COMPLETED, FAILED
- severity (VARCHAR) - LOW, MEDIUM, HIGH, CRITICAL
- requested_by (VARCHAR)
- requested_at (TIMESTAMPTZ)
- approved_by (VARCHAR)
- revoked_at (TIMESTAMPTZ)
- notify_recipients (TEXT[])
- details (JSONB)
```

## Security Features

### 1. Comprehensive Input Validation
- All secret names validated before operations
- Secret values escaped properly
- Metadata validated and sanitized

### 2. Access Control
- All operations tracked with actor information
- IP address and user agent logging
- Audit trail for compliance

### 3. Encryption
- Secrets stored encrypted in Azure Key Vault
- TLS for all communications
- No secrets logged or displayed

### 4. Secure Defaults
- 90-day default rotation policy
- Soft delete with recovery window
- Approval workflows for critical operations

### 5. Threat Detection
- Suspicious activity detection based on:
  - Failed access attempts
  - Unusual access patterns
  - Time-based analysis
  - Actor-based analysis

## Testing

### Run Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests
pytest app/services/secrets/__tests__/test_secrets.py -v

# Run with coverage
pytest app/services/secrets/__tests__/test_secrets.py -v --cov=app.services.secrets

# Run specific test class
pytest app/services/secrets/__tests__/test_secrets.py::TestSecretsManager -v
```

### Test Coverage

The test suite includes:

1. **Unit Tests** (59 test methods)
   - SecretsManager: 15 tests
   - SecretsAudit: 2 tests
   - SecretsRotation: 3 tests
   - EmergencyRevoke: 3 tests
   - Integration: 3 tests
   - Edge Cases: 5 tests
   - Performance: 2 tests

2. **Test Categories**
   - Secret lifecycle (create, read, update, delete)
   - Multiple secrets management
   - Error handling and edge cases
   - JSON serialization/deserialization
   - Concurrent operations
   - Bulk operations
   - Special characters and large values

3. **Coverage Target**: 100% of critical paths

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Rotation Performance**
   - Secrets rotated per day
   - Average rotation duration
   - Rotation failures

2. **Access Patterns**
   - Total secrets accessed
   - Access by actor
   - Unauthorized access attempts

3. **Security Events**
   - Suspicious activity alerts
   - Revocation requests
   - Multiple failed access attempts

### Alert Triggers

```python
# Configure alerts
audit_system = SecretsAudit()

# High-risk revocation
if revocation.severity == "critical":
    await alert_security_team(revocation)

# Suspicious activity
threats = await audit.detect_suspicious_activity(
    resource_name=secret_name,
    failure_threshold=5,
)
if threats["threats_detected"] > 0:
    await alert_security_team(threats)
```

## Best Practices

### 1. Secret Naming Conventions
```
{environment}-{service}-{type}
production-fleet-api-key
staging-database-password
development-jwt-secret
```

### 2. Rotation Policies
```python
# API Keys: 90 days
RotationConfig(rotation_days=90)

# Database passwords: 60 days
RotationConfig(rotation_days=60)

# JWT secrets: 30 days
RotationConfig(rotation_days=30)
```

### 3. Audit Review
```python
# Daily audit review
await audit.get_audit_summary(days=1)

# Weekly threat detection
await audit.detect_suspicious_activity(
    time_window_minutes=10080  # 1 week
)
```

### 4. Emergency Procedures
```
1. Detect compromise
2. Request emergency revocation (immediate=True)
3. Generate new secret
4. Update all consumers
5. Monitor for continued incidents
```

## Compliance

This implementation supports compliance with:

- **SOC 2 Type II**: Comprehensive audit logging
- **HIPAA**: Access controls and audit trails
- **PCI-DSS**: Secret rotation and encryption
- **FedRAMP**: Security controls and monitoring

## Troubleshooting

### Secret Not Found
```python
# Verify secret exists
secrets = await manager.list_secrets()
if not any(s["name"] == "my-secret" for s in secrets):
    print("Secret does not exist")

# Check versions
versions = await manager.get_secret_versions("my-secret")
```

### Rotation Failures
```python
# Check rotation status
status = await rotation.get_rotation_status("my-secret")
print(f"Days until rotation: {status['days_until_rotation']}")

# Review rotation history
history = await audit.get_audit_trail(
    action=AuditAction.ROTATE,
    resource_name="my-secret",
)
```

### Suspicious Activity
```python
# Analyze threats
threats = await audit.detect_suspicious_activity(
    resource_name="my-secret",
    failure_threshold=3,
)

# Review audit trail
trail = await audit.get_audit_trail(
    resource_name="my-secret",
)
```

## Performance Considerations

- **Audit queries**: Indexed on resource_name, timestamp, and action
- **Rotation scheduler**: Runs every 1 hour by default (configurable)
- **Threat detection**: Configurable time windows for analysis
- **Batch operations**: Supported through concurrent creation/updates

## Future Enhancements

1. **Webhook Notifications**: Real-time alerts via webhooks
2. **Key Rotation Policies**: Machine learning for optimal rotation schedules
3. **Compliance Reports**: Automated compliance reporting
4. **Multi-region**: Support for Azure Key Vault in multiple regions
5. **Cost Optimization**: Analytics for secret lifecycle optimization

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review audit logs for error details
3. Consult the test suite for usage examples
4. Contact the security team

## License

Internal - CapitalTechAlliance
