"""Comprehensive test suite for secrets management system."""

import pytest
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any
from unittest.mock import Mock, AsyncMock, patch, MagicMock

from app.services.secrets.secrets_manager import (
    SecretsManager,
    SecretType,
    SecretsManagerError,
    SecretNotFoundError,
    SecretAlreadyExistsError,
    SecretAccessError,
)
from app.services.secrets.secrets_audit import (
    SecretsAudit,
    AuditEvent,
    AuditAction,
    AuditResult,
)
from app.services.secrets.secrets_rotation import (
    SecretsRotation,
    RotationConfig,
    RotationStatus,
)
from app.services.secrets.emergency_revoke import (
    EmergencyRevoke,
    RevocationRequest,
    RevocationReason,
    RevocationStatus,
)


# ============================================================================
# SecretsManager Tests
# ============================================================================


class TestSecretsManager:
    """Tests for SecretsManager class."""

    @pytest.fixture
    def manager(self):
        """Create SecretsManager instance in mock mode."""
        with patch("app.services.secrets.secrets_manager.settings.AZURE_KEY_VAULT_URL", None):
            return SecretsManager()

    @pytest.mark.asyncio
    async def test_create_secret_string_value(self, manager):
        """Test creating a secret with string value."""
        result = await manager.create_secret(
            name="test-api-key",
            value="secret-value-123",
            secret_type=SecretType.API_KEY,
        )

        assert result["name"] == "test-api-key"
        assert result["version"] == "1"
        assert result["type"] == SecretType.API_KEY.value
        assert "created_at" in result
        assert "expires_on" in result

    @pytest.mark.asyncio
    async def test_create_secret_dict_value(self, manager):
        """Test creating a secret with dict value."""
        secret_value = {"username": "admin", "password": "secret"}

        result = await manager.create_secret(
            name="test-db-creds",
            value=secret_value,
            secret_type=SecretType.DATABASE,
        )

        assert result["name"] == "test-db-creds"
        assert result["type"] == SecretType.DATABASE.value

    @pytest.mark.asyncio
    async def test_create_secret_with_metadata(self, manager):
        """Test creating a secret with metadata."""
        metadata = {"env": "production", "owner": "admin"}

        result = await manager.create_secret(
            name="test-jwt",
            value="jwt-token-xyz",
            secret_type=SecretType.JWT,
            metadata=metadata,
        )

        assert result["name"] == "test-jwt"
        assert result["type"] == SecretType.JWT.value

    @pytest.mark.asyncio
    async def test_create_secret_custom_expiry(self, manager):
        """Test creating a secret with custom expiry."""
        result = await manager.create_secret(
            name="test-temp-key",
            value="temporary-secret",
            expires_in_days=30,
        )

        assert result["name"] == "test-temp-key"
        expires_on = datetime.fromisoformat(result["expires_on"])
        assert (expires_on - datetime.utcnow()).days == 30

    @pytest.mark.asyncio
    async def test_create_duplicate_secret(self, manager):
        """Test that creating duplicate secret raises error."""
        await manager.create_secret(
            name="duplicate-test",
            value="initial-value",
        )

        with pytest.raises(SecretAlreadyExistsError):
            await manager.create_secret(
                name="duplicate-test",
                value="another-value",
            )

    @pytest.mark.asyncio
    async def test_get_secret_string(self, manager):
        """Test retrieving a string secret."""
        await manager.create_secret(
            name="get-test",
            value="test-value",
        )

        result = await manager.get_secret("get-test")
        assert result == "test-value"

    @pytest.mark.asyncio
    async def test_get_secret_json_parsed(self, manager):
        """Test retrieving and parsing JSON secret."""
        secret_dict = {"key": "value", "nested": {"inner": "data"}}

        await manager.create_secret(
            name="json-test",
            value=secret_dict,
        )

        result = await manager.get_secret("json-test", parse_json=True)
        assert isinstance(result, dict)
        assert result["key"] == "value"
        assert result["nested"]["inner"] == "data"

    @pytest.mark.asyncio
    async def test_get_nonexistent_secret(self, manager):
        """Test retrieving nonexistent secret raises error."""
        with pytest.raises(SecretNotFoundError):
            await manager.get_secret("does-not-exist")

    @pytest.mark.asyncio
    async def test_update_secret(self, manager):
        """Test updating an existing secret."""
        await manager.create_secret(
            name="update-test",
            value="initial-value",
        )

        result = await manager.update_secret(
            name="update-test",
            value="updated-value",
        )

        assert result["name"] == "update-test"
        assert result["version"] == "2"

        updated_value = await manager.get_secret("update-test")
        assert updated_value == "updated-value"

    @pytest.mark.asyncio
    async def test_update_nonexistent_secret(self, manager):
        """Test updating nonexistent secret raises error."""
        with pytest.raises(SecretNotFoundError):
            await manager.update_secret(
                name="does-not-exist",
                value="new-value",
            )

    @pytest.mark.asyncio
    async def test_delete_secret(self, manager):
        """Test deleting a secret."""
        await manager.create_secret(
            name="delete-test",
            value="to-delete",
        )

        result = await manager.delete_secret("delete-test")
        assert result["name"] == "delete-test"
        assert "deleted_at" in result

        with pytest.raises(SecretNotFoundError):
            await manager.get_secret("delete-test")

    @pytest.mark.asyncio
    async def test_list_secrets(self, manager):
        """Test listing all secrets."""
        await manager.create_secret("secret-1", "value-1")
        await manager.create_secret("secret-2", "value-2")
        await manager.create_secret("secret-3", "value-3")

        secrets = await manager.list_secrets()
        assert len(secrets) == 3
        names = [s["name"] for s in secrets]
        assert "secret-1" in names
        assert "secret-2" in names
        assert "secret-3" in names

    @pytest.mark.asyncio
    async def test_get_secret_versions(self, manager):
        """Test retrieving secret versions."""
        await manager.create_secret("version-test", "v1")
        await manager.update_secret("version-test", "v2")
        await manager.update_secret("version-test", "v3")

        versions = await manager.get_secret_versions("version-test")
        assert len(versions) == 1  # Mock mode returns single version
        assert versions[0]["version"] == "3"


# ============================================================================
# SecretsAudit Tests
# ============================================================================


class TestSecretsAudit:
    """Tests for SecretsAudit class."""

    @pytest.fixture
    async def audit_system(self):
        """Create and initialize SecretsAudit instance."""
        audit = SecretsAudit()
        # Mock the database initialization
        audit.pool = AsyncMock()
        audit._table_created = True
        yield audit
        await audit.shutdown()

    @pytest.mark.asyncio
    async def test_audit_event_creation(self):
        """Test creating an audit event."""
        event = AuditEvent(
            action=AuditAction.CREATE,
            resource_name="test-secret",
            timestamp=datetime.utcnow(),
            result=AuditResult.SUCCESS,
            actor_id="user-123",
        )

        event_dict = event.to_dict()
        assert event_dict["action"] == "create"
        assert event_dict["resource_name"] == "test-secret"
        assert event_dict["result"] == "success"

    @pytest.mark.asyncio
    async def test_audit_event_with_details(self):
        """Test audit event with detailed information."""
        details = {"old_version": "1", "new_version": "2"}

        event = AuditEvent(
            action=AuditAction.UPDATE,
            resource_name="test-secret",
            timestamp=datetime.utcnow(),
            result=AuditResult.SUCCESS,
            actor_id="user-123",
            details=details,
            duration_ms=150,
        )

        event_dict = event.to_dict()
        assert event_dict["details"] == details
        assert event_dict["duration_ms"] == 150

    @pytest.mark.asyncio
    async def test_audit_event_with_error(self):
        """Test audit event for failed operation."""
        event = AuditEvent(
            action=AuditAction.DELETE,
            resource_name="test-secret",
            timestamp=datetime.utcnow(),
            result=AuditResult.FAILURE,
            actor_id="user-456",
            error_message="Permission denied",
        )

        event_dict = event.to_dict()
        assert event_dict["result"] == "failure"
        assert event_dict["error_message"] == "Permission denied"


# ============================================================================
# SecretsRotation Tests
# ============================================================================


class TestSecretsRotation:
    """Tests for SecretsRotation class."""

    @pytest.fixture
    def rotation_system(self):
        """Create SecretsRotation instance."""
        secrets_manager = Mock(spec=SecretsManager)
        audit = Mock(spec=SecretsAudit)

        rotation = SecretsRotation(secrets_manager, audit)
        rotation.pool = AsyncMock()
        rotation._table_created = True

        return rotation

    @pytest.mark.asyncio
    async def test_rotation_config_creation(self, rotation_system):
        """Test creating rotation configuration."""
        config = RotationConfig(
            name="test-api-key",
            rotation_days=90,
            rotation_hours_before_expiry=24,
        )

        assert config.name == "test-api-key"
        assert config.rotation_days == 90
        assert config.enabled is True

    @pytest.mark.asyncio
    async def test_rotation_with_callback(self, rotation_system):
        """Test rotation configuration with callback."""

        def generate_new_key(name):
            return f"new-key-for-{name}"

        config = RotationConfig(
            name="test-api-key",
            rotation_days=90,
            rotation_callback=generate_new_key,
        )

        assert config.rotation_callback is not None
        new_key = config.rotation_callback("test-api-key")
        assert new_key == "new-key-for-test-api-key"

    @pytest.mark.asyncio
    async def test_rotation_status_enum(self):
        """Test RotationStatus enum values."""
        assert RotationStatus.PENDING.value == "pending"
        assert RotationStatus.IN_PROGRESS.value == "in_progress"
        assert RotationStatus.COMPLETED.value == "completed"
        assert RotationStatus.FAILED.value == "failed"


# ============================================================================
# EmergencyRevoke Tests
# ============================================================================


class TestEmergencyRevoke:
    """Tests for EmergencyRevoke class."""

    @pytest.fixture
    def revoke_system(self):
        """Create EmergencyRevoke instance."""
        secrets_manager = Mock(spec=SecretsManager)
        audit = Mock(spec=SecretsAudit)

        revoke = EmergencyRevoke(secrets_manager, audit)
        revoke.pool = AsyncMock()
        revoke._table_created = True

        return revoke

    def test_revocation_request_creation(self):
        """Test creating revocation request."""
        request = RevocationRequest(
            secret_name="test-secret",
            reason=RevocationReason.SECURITY_INCIDENT,
            requested_by="admin-user",
            severity="critical",
        )

        assert request.secret_name == "test-secret"
        assert request.reason == RevocationReason.SECURITY_INCIDENT
        assert request.severity == "critical"

    def test_revocation_reason_enum(self):
        """Test RevocationReason enum values."""
        reasons = [
            RevocationReason.SECURITY_INCIDENT,
            RevocationReason.UNAUTHORIZED_ACCESS,
            RevocationReason.EMPLOYEE_TERMINATION,
            RevocationReason.POLICY_VIOLATION,
            RevocationReason.COMPROMISE_SUSPECTED,
        ]

        assert len(reasons) == 5
        assert RevocationReason.SECURITY_INCIDENT.value == "security-incident"

    def test_revocation_status_enum(self):
        """Test RevocationStatus enum values."""
        statuses = [
            RevocationStatus.PENDING,
            RevocationStatus.IN_PROGRESS,
            RevocationStatus.COMPLETED,
            RevocationStatus.FAILED,
            RevocationStatus.PARTIAL,
        ]

        assert len(statuses) == 5
        assert RevocationStatus.COMPLETED.value == "completed"


# ============================================================================
# Integration Tests
# ============================================================================


class TestSecretsIntegration:
    """Integration tests for secrets management system."""

    @pytest.fixture
    def manager(self):
        """Create SecretsManager in mock mode."""
        with patch("app.services.secrets.secrets_manager.settings.AZURE_KEY_VAULT_URL", None):
            return SecretsManager()

    @pytest.mark.asyncio
    async def test_secret_lifecycle(self, manager):
        """Test complete secret lifecycle."""
        secret_name = "lifecycle-test"
        initial_value = "initial-secret"
        updated_value = "updated-secret"

        # Create
        create_result = await manager.create_secret(
            name=secret_name,
            value=initial_value,
            secret_type=SecretType.API_KEY,
        )
        assert create_result["name"] == secret_name
        assert create_result["version"] == "1"

        # Read
        value = await manager.get_secret(secret_name)
        assert value == initial_value

        # Update
        update_result = await manager.update_secret(
            name=secret_name,
            value=updated_value,
        )
        assert update_result["version"] == "2"

        # Verify update
        value = await manager.get_secret(secret_name)
        assert value == updated_value

        # Get versions
        versions = await manager.get_secret_versions(secret_name)
        assert len(versions) == 1

        # List
        secrets = await manager.list_secrets()
        assert len(secrets) >= 1

        # Delete
        delete_result = await manager.delete_secret(secret_name)
        assert delete_result["name"] == secret_name

        # Verify deletion
        with pytest.raises(SecretNotFoundError):
            await manager.get_secret(secret_name)

    @pytest.mark.asyncio
    async def test_multiple_secrets_management(self, manager):
        """Test managing multiple secrets."""
        secrets_data = {
            "api-key-prod": "key-value-1",
            "db-password": "db-pass-123",
            "jwt-secret": "jwt-secret-456",
        }

        # Create all secrets
        for name, value in secrets_data.items():
            await manager.create_secret(name=name, value=value)

        # Retrieve all
        secrets = await manager.list_secrets()
        assert len(secrets) == 3

        # Verify all exist
        for name, value in secrets_data.items():
            retrieved = await manager.get_secret(name)
            assert retrieved == value

        # Update one
        await manager.update_secret("api-key-prod", "new-key-value")

        # Verify only one changed
        secrets = await manager.list_secrets()
        assert len(secrets) == 3

    @pytest.mark.asyncio
    async def test_secret_expiry_calculation(self, manager):
        """Test secret expiry calculation."""
        result = await manager.create_secret(
            name="expiry-test",
            value="secret",
            expires_in_days=60,
        )

        expires_on = datetime.fromisoformat(result["expires_on"])
        created_at = datetime.fromisoformat(result["created_at"])

        delta = expires_on - created_at
        assert 59 <= delta.days <= 61  # Allow 1 day variance


# ============================================================================
# Edge Cases and Error Handling
# ============================================================================


class TestSecretsEdgeCases:
    """Test edge cases and error scenarios."""

    @pytest.fixture
    def manager(self):
        """Create SecretsManager in mock mode."""
        with patch("app.services.secrets.secrets_manager.settings.AZURE_KEY_VAULT_URL", None):
            return SecretsManager()

    @pytest.mark.asyncio
    async def test_empty_secret_name(self, manager):
        """Test handling of empty secret names."""
        # Should work but might cause issues in real Key Vault
        result = await manager.create_secret(
            name="",
            value="test",
        )
        assert result["name"] == ""

    @pytest.mark.asyncio
    async def test_large_secret_value(self, manager):
        """Test handling of large secret values."""
        large_value = "x" * 10000  # 10KB secret

        result = await manager.create_secret(
            name="large-secret",
            value=large_value,
        )

        retrieved = await manager.get_secret("large-secret")
        assert retrieved == large_value

    @pytest.mark.asyncio
    async def test_special_characters_in_secret(self, manager):
        """Test secrets with special characters."""
        special_value = "!@#$%^&*()_+-={}[]|:;<>?,./~`"

        await manager.create_secret(
            name="special-chars",
            value=special_value,
        )

        retrieved = await manager.get_secret("special-chars")
        assert retrieved == special_value

    @pytest.mark.asyncio
    async def test_complex_json_secret(self, manager):
        """Test complex JSON secrets."""
        complex_dict = {
            "level1": {
                "level2": {
                    "level3": {
                        "data": ["item1", "item2", "item3"],
                        "metadata": {"count": 3, "valid": True},
                    }
                }
            }
        }

        await manager.create_secret(
            name="complex-json",
            value=complex_dict,
        )

        retrieved = await manager.get_secret("complex-json", parse_json=True)
        assert retrieved == complex_dict


# ============================================================================
# Performance and Stress Tests
# ============================================================================


class TestSecretsPerformance:
    """Performance and stress tests."""

    @pytest.fixture
    def manager(self):
        """Create SecretsManager in mock mode."""
        with patch("app.services.secrets.secrets_manager.settings.AZURE_KEY_VAULT_URL", None):
            return SecretsManager()

    @pytest.mark.asyncio
    async def test_concurrent_secret_operations(self, manager):
        """Test concurrent secret operations."""

        async def create_and_read(name):
            await manager.create_secret(name=name, value=f"value-{name}")
            value = await manager.get_secret(name)
            return value

        # Create 10 secrets concurrently
        tasks = [create_and_read(f"concurrent-{i}") for i in range(10)]
        results = await asyncio.gather(*tasks)

        assert len(results) == 10
        assert all(isinstance(r, str) for r in results)

    @pytest.mark.asyncio
    async def test_bulk_secret_creation(self, manager):
        """Test bulk secret creation."""
        secret_count = 50

        for i in range(secret_count):
            await manager.create_secret(
                name=f"bulk-secret-{i}",
                value=f"value-{i}",
            )

        secrets = await manager.list_secrets()
        assert len(secrets) == secret_count


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=app.services.secrets", "--cov-report=term-missing"])
