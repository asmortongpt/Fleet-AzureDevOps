"""Secrets management service for Azure Key Vault integration."""

from .secrets_manager import SecretsManager, SecretsManagerError
from .secrets_audit import SecretsAudit, AuditEvent
from .secrets_rotation import SecretsRotation, RotationConfig
from .emergency_revoke import EmergencyRevoke, RevocationRequest

__all__ = [
    "SecretsManager",
    "SecretsManagerError",
    "SecretsAudit",
    "AuditEvent",
    "SecretsRotation",
    "RotationConfig",
    "EmergencyRevoke",
    "RevocationRequest",
]
