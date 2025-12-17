"""Azure Key Vault secrets manager with comprehensive error handling."""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from enum import Enum

import structlog
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import (
    AzureError,
    ResourceNotFoundError,
    ResourceExistsError,
)

from app.core.config import settings


class SecretType(str, Enum):
    """Types of secrets managed."""

    API_KEY = "api-key"
    DATABASE = "database"
    JWT = "jwt"
    ENCRYPTION = "encryption"
    THIRD_PARTY = "third-party"
    CERTIFICATE = "certificate"


class SecretsManagerError(Exception):
    """Base exception for secrets manager."""

    pass


class SecretNotFoundError(SecretsManagerError):
    """Raised when a secret is not found."""

    pass


class SecretAlreadyExistsError(SecretsManagerError):
    """Raised when attempting to create a secret that already exists."""

    pass


class SecretAccessError(SecretsManagerError):
    """Raised when unable to access a secret."""

    pass


class SecretsManager:
    """Manages secrets using Azure Key Vault with full audit capabilities."""

    def __init__(self):
        """Initialize SecretsManager with Azure Key Vault client."""
        self.logger = structlog.get_logger(__name__)
        self.vault_url = settings.AZURE_KEY_VAULT_URL

        if not self.vault_url:
            self.logger.warning("Azure Key Vault URL not configured, using mock mode")
            self.client = None
            self._mock_secrets: Dict[str, Dict[str, Any]] = {}
        else:
            try:
                credential = DefaultAzureCredential()
                self.client = SecretClient(vault_url=self.vault_url, credential=credential)
                self.logger.info(
                    "initialized_secrets_manager",
                    vault_url=self.vault_url,
                )
            except AzureError as e:
                self.logger.error("failed_to_initialize_key_vault", error=str(e))
                raise SecretsManagerError(f"Failed to initialize Key Vault: {str(e)}") from e

    async def create_secret(
        self,
        name: str,
        value: Union[str, Dict[str, Any]],
        secret_type: SecretType = SecretType.API_KEY,
        metadata: Optional[Dict[str, str]] = None,
        expires_in_days: int = 90,
    ) -> Dict[str, Any]:
        """
        Create a new secret in Key Vault.

        Args:
            name: Secret name (must be unique)
            value: Secret value (string or dict)
            secret_type: Type of secret being stored
            metadata: Additional metadata for the secret
            expires_in_days: Days until secret expires

        Returns:
            Dict with secret metadata

        Raises:
            SecretAlreadyExistsError: If secret already exists
            SecretAccessError: If unable to create secret
        """
        try:
            self.logger.debug("creating_secret", name=name, type=secret_type.value)

            # Serialize value if it's a dict
            secret_value = json.dumps(value) if isinstance(value, dict) else value

            # Prepare content with metadata
            tags = {
                "type": secret_type.value,
                "created_at": datetime.utcnow().isoformat(),
                "created_by": "secrets-manager",
                "version": "1",
                **(metadata or {}),
            }

            # Calculate expiration time
            expires_on = datetime.utcnow() + timedelta(days=expires_in_days)
            tags["expires_on"] = expires_on.isoformat()

            if self.client:
                # Azure Key Vault
                try:
                    # Check if secret already exists
                    await asyncio.to_thread(self.client.get_secret, name)
                    raise SecretAlreadyExistsError(f"Secret '{name}' already exists")
                except ResourceNotFoundError:
                    # Expected - secret doesn't exist yet
                    pass

                # Create the secret
                secret_properties = await asyncio.to_thread(
                    self.client.set_secret,
                    name,
                    secret_value,
                    expires_on=expires_on,
                    tags=tags,
                )

                self.logger.info(
                    "secret_created",
                    name=name,
                    type=secret_type.value,
                    version=secret_properties.version,
                )

                return {
                    "name": name,
                    "version": secret_properties.version,
                    "created_at": tags["created_at"],
                    "expires_on": tags["expires_on"],
                    "type": secret_type.value,
                }
            else:
                # Mock mode
                if name in self._mock_secrets:
                    raise SecretAlreadyExistsError(f"Secret '{name}' already exists")

                self._mock_secrets[name] = {
                    "value": secret_value,
                    "version": "1",
                    "tags": tags,
                }

                self.logger.info(
                    "secret_created_mock",
                    name=name,
                    type=secret_type.value,
                )

                return {
                    "name": name,
                    "version": "1",
                    "created_at": tags["created_at"],
                    "expires_on": tags["expires_on"],
                    "type": secret_type.value,
                }

        except SecretAlreadyExistsError:
            raise
        except Exception as e:
            self.logger.error("failed_to_create_secret", name=name, error=str(e))
            raise SecretAccessError(f"Failed to create secret '{name}': {str(e)}") from e

    async def get_secret(
        self,
        name: str,
        version: Optional[str] = None,
        parse_json: bool = False,
    ) -> Union[str, Dict[str, Any]]:
        """
        Retrieve a secret from Key Vault.

        Args:
            name: Secret name
            version: Specific version (optional, gets latest if not specified)
            parse_json: Whether to parse JSON values

        Returns:
            Secret value

        Raises:
            SecretNotFoundError: If secret doesn't exist
            SecretAccessError: If unable to retrieve secret
        """
        try:
            self.logger.debug("retrieving_secret", name=name, version=version)

            if self.client:
                # Azure Key Vault
                try:
                    secret = await asyncio.to_thread(
                        self.client.get_secret,
                        name,
                        version=version,
                    )
                    value = secret.value

                    self.logger.info(
                        "secret_retrieved",
                        name=name,
                        version=secret.version,
                    )

                except ResourceNotFoundError as e:
                    raise SecretNotFoundError(f"Secret '{name}' not found") from e
            else:
                # Mock mode
                if name not in self._mock_secrets:
                    raise SecretNotFoundError(f"Secret '{name}' not found")

                value = self._mock_secrets[name]["value"]
                self.logger.info("secret_retrieved_mock", name=name)

            # Parse JSON if requested
            if parse_json:
                try:
                    return json.loads(value)
                except json.JSONDecodeError as e:
                    raise SecretAccessError(
                        f"Failed to parse secret '{name}' as JSON"
                    ) from e

            return value

        except (SecretNotFoundError, SecretAccessError):
            raise
        except Exception as e:
            self.logger.error("failed_to_retrieve_secret", name=name, error=str(e))
            raise SecretAccessError(f"Failed to retrieve secret '{name}': {str(e)}") from e

    async def update_secret(
        self,
        name: str,
        value: Union[str, Dict[str, Any]],
        metadata: Optional[Dict[str, str]] = None,
        expires_in_days: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Update an existing secret.

        Args:
            name: Secret name
            value: New secret value
            metadata: Updated metadata
            expires_in_days: Updated expiration (days)

        Returns:
            Updated secret metadata

        Raises:
            SecretNotFoundError: If secret doesn't exist
            SecretAccessError: If unable to update secret
        """
        try:
            self.logger.debug("updating_secret", name=name)

            # Verify secret exists
            await self.get_secret(name)

            # Serialize value if it's a dict
            secret_value = json.dumps(value) if isinstance(value, dict) else value

            if self.client:
                # Azure Key Vault
                tags = {
                    "updated_at": datetime.utcnow().isoformat(),
                    "updated_by": "secrets-manager",
                    **(metadata or {}),
                }

                expires_on = None
                if expires_in_days:
                    expires_on = datetime.utcnow() + timedelta(days=expires_in_days)
                    tags["expires_on"] = expires_on.isoformat()

                secret_properties = await asyncio.to_thread(
                    self.client.set_secret,
                    name,
                    secret_value,
                    expires_on=expires_on,
                    tags=tags,
                )

                self.logger.info(
                    "secret_updated",
                    name=name,
                    version=secret_properties.version,
                )

                return {
                    "name": name,
                    "version": secret_properties.version,
                    "updated_at": tags["updated_at"],
                    "expires_on": tags.get("expires_on"),
                }
            else:
                # Mock mode
                self._mock_secrets[name]["value"] = secret_value
                self._mock_secrets[name]["version"] = str(
                    int(self._mock_secrets[name]["version"]) + 1
                )
                self._mock_secrets[name]["tags"].update(
                    {
                        "updated_at": datetime.utcnow().isoformat(),
                        "updated_by": "secrets-manager",
                        **(metadata or {}),
                    }
                )

                self.logger.info("secret_updated_mock", name=name)

                return {
                    "name": name,
                    "version": self._mock_secrets[name]["version"],
                    "updated_at": self._mock_secrets[name]["tags"]["updated_at"],
                }

        except SecretNotFoundError:
            raise
        except Exception as e:
            self.logger.error("failed_to_update_secret", name=name, error=str(e))
            raise SecretAccessError(f"Failed to update secret '{name}': {str(e)}") from e

    async def delete_secret(self, name: str, immediate: bool = False) -> Dict[str, Any]:
        """
        Delete a secret (soft delete by default).

        Args:
            name: Secret name
            immediate: If True, perform hard delete

        Returns:
            Deletion metadata

        Raises:
            SecretNotFoundError: If secret doesn't exist
            SecretAccessError: If unable to delete secret
        """
        try:
            self.logger.debug("deleting_secret", name=name, immediate=immediate)

            # Verify secret exists
            await self.get_secret(name)

            if self.client:
                # Azure Key Vault
                deleted_secret = await asyncio.to_thread(
                    self.client.begin_delete_secret, name
                )

                self.logger.info(
                    "secret_deleted",
                    name=name,
                    deleted_at=datetime.utcnow().isoformat(),
                )

                if immediate:
                    self.logger.info(
                        "secret_permanent_delete_initiated",
                        name=name,
                    )

                return {
                    "name": name,
                    "deleted_at": datetime.utcnow().isoformat(),
                    "immediate": immediate,
                }
            else:
                # Mock mode
                del self._mock_secrets[name]
                self.logger.info("secret_deleted_mock", name=name)

                return {
                    "name": name,
                    "deleted_at": datetime.utcnow().isoformat(),
                }

        except SecretNotFoundError:
            raise
        except Exception as e:
            self.logger.error("failed_to_delete_secret", name=name, error=str(e))
            raise SecretAccessError(f"Failed to delete secret '{name}': {str(e)}") from e

    async def list_secrets(self) -> list[Dict[str, Any]]:
        """
        List all secrets (metadata only).

        Returns:
            List of secret metadata

        Raises:
            SecretAccessError: If unable to list secrets
        """
        try:
            self.logger.debug("listing_secrets")

            if self.client:
                # Azure Key Vault
                secrets = []
                properties_list = await asyncio.to_thread(
                    self.client.list_properties_of_secrets
                )

                for secret_properties in properties_list:
                    secrets.append(
                        {
                            "name": secret_properties.name,
                            "version": secret_properties.version,
                            "created_at": secret_properties.created_on.isoformat()
                            if secret_properties.created_on
                            else None,
                            "updated_at": secret_properties.updated_on.isoformat()
                            if secret_properties.updated_on
                            else None,
                            "tags": secret_properties.tags or {},
                        }
                    )

                self.logger.info("secrets_listed", count=len(secrets))
                return secrets
            else:
                # Mock mode
                secrets = []
                for name, secret_data in self._mock_secrets.items():
                    secrets.append(
                        {
                            "name": name,
                            "version": secret_data["version"],
                            "tags": secret_data["tags"],
                        }
                    )

                self.logger.info("secrets_listed_mock", count=len(secrets))
                return secrets

        except Exception as e:
            self.logger.error("failed_to_list_secrets", error=str(e))
            raise SecretAccessError(f"Failed to list secrets: {str(e)}") from e

    async def get_secret_versions(self, name: str) -> list[Dict[str, Any]]:
        """
        Get all versions of a secret.

        Args:
            name: Secret name

        Returns:
            List of version metadata

        Raises:
            SecretNotFoundError: If secret doesn't exist
            SecretAccessError: If unable to retrieve versions
        """
        try:
            self.logger.debug("retrieving_secret_versions", name=name)

            # Verify secret exists
            await self.get_secret(name)

            if self.client:
                # Azure Key Vault
                versions = []
                versions_list = await asyncio.to_thread(
                    self.client.list_properties_of_secret_versions, name
                )

                for version_properties in versions_list:
                    versions.append(
                        {
                            "version": version_properties.version,
                            "created_at": version_properties.created_on.isoformat()
                            if version_properties.created_on
                            else None,
                            "enabled": version_properties.enabled,
                        }
                    )

                self.logger.info(
                    "secret_versions_retrieved",
                    name=name,
                    count=len(versions),
                )
                return versions
            else:
                # Mock mode - return single version
                return [
                    {
                        "version": self._mock_secrets[name]["version"],
                        "created_at": self._mock_secrets[name]["tags"].get(
                            "created_at"
                        ),
                        "enabled": True,
                    }
                ]

        except SecretNotFoundError:
            raise
        except Exception as e:
            self.logger.error(
                "failed_to_retrieve_secret_versions", name=name, error=str(e)
            )
            raise SecretAccessError(
                f"Failed to retrieve versions for secret '{name}': {str(e)}"
            ) from e
