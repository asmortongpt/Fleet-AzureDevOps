"""Automatic secrets rotation with 90-day lifecycle management."""

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Callable, List
from dataclasses import dataclass
from enum import Enum

import structlog
import asyncpg

from app.core.config import settings
from .secrets_manager import SecretsManager
from .secrets_audit import SecretsAudit, AuditEvent, AuditAction, AuditResult


class RotationStatus(str, Enum):
    """Status of a rotation job."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class RotationConfig:
    """Configuration for secret rotation."""

    name: str
    rotation_days: int = 90
    rotation_hours_before_expiry: int = 24
    enabled: bool = True
    rotation_callback: Optional[Callable[[str], Any]] = None
    force_on_next: bool = False
    description: Optional[str] = None


class SecretsRotation:
    """Manages automatic rotation of secrets with lifecycle tracking."""

    def __init__(
        self,
        secrets_manager: SecretsManager,
        audit: SecretsAudit,
    ):
        """
        Initialize SecretsRotation.

        Args:
            secrets_manager: SecretsManager instance
            audit: SecretsAudit instance
        """
        self.logger = structlog.get_logger(__name__)
        self.secrets_manager = secrets_manager
        self.audit = audit
        self.db_url = settings.DATABASE_URL
        self.pool: Optional[asyncpg.Pool] = None
        self._table_created = False
        self._rotation_configs: Dict[str, RotationConfig] = {}
        self._rotation_task: Optional[asyncio.Task[None]] = None

    async def initialize(self) -> None:
        """Initialize database and rotation system."""
        try:
            self.pool = await asyncpg.create_pool(
                self.db_url,
                min_size=2,
                max_size=10,
                command_timeout=60,
            )

            await self._create_rotation_table()
            await self._create_config_table()
            self.logger.info("rotation_system_initialized")

        except Exception as e:
            self.logger.error("failed_to_initialize_rotation", error=str(e))
            raise

    async def shutdown(self) -> None:
        """Shutdown rotation system."""
        if self._rotation_task:
            self._rotation_task.cancel()
            try:
                await self._rotation_task
            except asyncio.CancelledError:
                pass

        if self.pool:
            await self.pool.close()
            self.logger.info("rotation_system_shutdown")

    async def _create_rotation_table(self) -> None:
        """Create rotation history table."""
        if self._table_created or not self.pool:
            return

        create_table_sql = """
        CREATE TABLE IF NOT EXISTS secrets_rotation_history (
            id BIGSERIAL PRIMARY KEY,
            secret_name VARCHAR(255) NOT NULL,
            rotation_timestamp TIMESTAMPTZ NOT NULL,
            status VARCHAR(50) NOT NULL,
            old_version VARCHAR(255),
            new_version VARCHAR(255),
            duration_ms INTEGER,
            error_message TEXT,
            details JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_rotation_secret
            ON secrets_rotation_history(secret_name);

        CREATE INDEX IF NOT EXISTS idx_rotation_timestamp
            ON secrets_rotation_history(rotation_timestamp DESC);

        CREATE INDEX IF NOT EXISTS idx_rotation_status
            ON secrets_rotation_history(status);
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(create_table_sql)
            self.logger.debug("rotation_table_created")

        except Exception as e:
            self.logger.error("failed_to_create_rotation_table", error=str(e))
            raise

    async def _create_config_table(self) -> None:
        """Create rotation configuration table."""
        if not self.pool:
            return

        create_table_sql = """
        CREATE TABLE IF NOT EXISTS secrets_rotation_config (
            secret_name VARCHAR(255) PRIMARY KEY,
            rotation_days INTEGER NOT NULL,
            rotation_hours_before_expiry INTEGER NOT NULL,
            enabled BOOLEAN NOT NULL,
            description TEXT,
            force_on_next BOOLEAN NOT NULL DEFAULT FALSE,
            last_rotation TIMESTAMPTZ,
            next_rotation TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_rotation_config_next
            ON secrets_rotation_config(next_rotation);
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(create_table_sql)
            self.logger.debug("rotation_config_table_created")

        except Exception as e:
            self.logger.error("failed_to_create_rotation_config_table", error=str(e))
            raise

    async def register_secret(self, config: RotationConfig) -> None:
        """
        Register a secret for rotation.

        Args:
            config: Rotation configuration
        """
        if not self.pool:
            await self.initialize()

        self._rotation_configs[config.name] = config

        insert_sql = """
        INSERT INTO secrets_rotation_config (
            secret_name, rotation_days, rotation_hours_before_expiry,
            enabled, description, force_on_next, next_rotation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (secret_name) DO UPDATE SET
            rotation_days = EXCLUDED.rotation_days,
            rotation_hours_before_expiry = EXCLUDED.rotation_hours_before_expiry,
            enabled = EXCLUDED.enabled,
            description = EXCLUDED.description,
            updated_at = NOW()
        """

        try:
            next_rotation = datetime.utcnow() + timedelta(days=config.rotation_days)

            async with self.pool.acquire() as conn:
                await conn.execute(
                    insert_sql,
                    config.name,
                    config.rotation_days,
                    config.rotation_hours_before_expiry,
                    config.enabled,
                    config.description,
                    config.force_on_next,
                    next_rotation,
                )

            self.logger.info(
                "secret_registered_for_rotation",
                name=config.name,
                rotation_days=config.rotation_days,
            )

        except Exception as e:
            self.logger.error(
                "failed_to_register_secret_for_rotation",
                name=config.name,
                error=str(e),
            )
            raise

    async def rotate_secret(
        self,
        name: str,
        new_value: Any,
        actor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Rotate a secret immediately.

        Args:
            name: Secret name
            new_value: New secret value
            actor_id: ID of user initiating rotation

        Returns:
            Rotation result

        Raises:
            Exception: If rotation fails
        """
        if not self.pool:
            await self.initialize()

        start_time = datetime.utcnow()
        old_version = None
        new_version = None
        status = RotationStatus.IN_PROGRESS

        try:
            self.logger.info("starting_secret_rotation", name=name)

            # Get current version
            try:
                current_secret = await self.secrets_manager.get_secret(name)
                old_versions = await self.secrets_manager.get_secret_versions(name)
                if old_versions:
                    old_version = old_versions[0]["version"]
            except Exception:
                self.logger.debug("no_previous_version_found", name=name)

            # Update secret with new value
            update_result = await self.secrets_manager.update_secret(
                name,
                new_value,
                metadata={"rotated_at": start_time.isoformat()},
            )
            new_version = update_result["version"]

            # Update rotation timestamp
            await self._update_rotation_timestamp(name)

            status = RotationStatus.COMPLETED

            # Log audit event
            await self.audit.log_event(
                AuditEvent(
                    action=AuditAction.ROTATE,
                    resource_name=name,
                    timestamp=start_time,
                    result=AuditResult.SUCCESS,
                    actor_id=actor_id,
                    details={
                        "old_version": old_version,
                        "new_version": new_version,
                    },
                    duration_ms=int(
                        (datetime.utcnow() - start_time).total_seconds() * 1000
                    ),
                )
            )

            self.logger.info(
                "secret_rotated_successfully",
                name=name,
                old_version=old_version,
                new_version=new_version,
            )

            return {
                "name": name,
                "status": status.value,
                "old_version": old_version,
                "new_version": new_version,
                "rotated_at": start_time.isoformat(),
            }

        except Exception as e:
            status = RotationStatus.FAILED
            self.logger.error("secret_rotation_failed", name=name, error=str(e))

            # Log audit event
            await self.audit.log_event(
                AuditEvent(
                    action=AuditAction.ROTATE,
                    resource_name=name,
                    timestamp=start_time,
                    result=AuditResult.FAILURE,
                    actor_id=actor_id,
                    error_message=str(e),
                    duration_ms=int(
                        (datetime.utcnow() - start_time).total_seconds() * 1000
                    ),
                )
            )

            raise

    async def start_rotation_scheduler(self, check_interval_seconds: int = 3600) -> None:
        """
        Start automatic rotation scheduler.

        Args:
            check_interval_seconds: How often to check for rotations (default 1 hour)
        """

        async def rotation_loop():
            while True:
                try:
                    await self._check_and_rotate_secrets()
                    await asyncio.sleep(check_interval_seconds)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    self.logger.error("rotation_loop_error", error=str(e))
                    await asyncio.sleep(check_interval_seconds)

        self._rotation_task = asyncio.create_task(rotation_loop())
        self.logger.info(
            "rotation_scheduler_started",
            check_interval_seconds=check_interval_seconds,
        )

    async def _check_and_rotate_secrets(self) -> None:
        """Check for secrets that need rotation."""
        if not self.pool:
            return

        query = """
        SELECT secret_name, rotation_days, rotation_hours_before_expiry, force_on_next
        FROM secrets_rotation_config
        WHERE enabled = TRUE
            AND (force_on_next = TRUE OR next_rotation <= NOW())
        """

        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query)

            for row in rows:
                secret_name = row["secret_name"]
                force = row["force_on_next"]

                try:
                    if secret_name in self._rotation_configs:
                        config = self._rotation_configs[secret_name]

                        if config.rotation_callback:
                            new_value = config.rotation_callback(secret_name)
                            await self.rotate_secret(secret_name, new_value)

                            if force:
                                await self._clear_force_rotation(secret_name)

                except Exception as e:
                    self.logger.error(
                        "automatic_rotation_failed",
                        name=secret_name,
                        error=str(e),
                    )

        except Exception as e:
            self.logger.error("rotation_check_failed", error=str(e))

    async def _update_rotation_timestamp(self, name: str) -> None:
        """Update last and next rotation timestamps."""
        if not self.pool:
            return

        query = """
        UPDATE secrets_rotation_config
        SET last_rotation = NOW(),
            next_rotation = NOW() + INTERVAL '1 day' * rotation_days,
            updated_at = NOW()
        WHERE secret_name = $1
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(query, name)

        except Exception as e:
            self.logger.error(
                "failed_to_update_rotation_timestamp", name=name, error=str(e)
            )

    async def _clear_force_rotation(self, name: str) -> None:
        """Clear force rotation flag."""
        if not self.pool:
            return

        query = """
        UPDATE secrets_rotation_config
        SET force_on_next = FALSE
        WHERE secret_name = $1
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(query, name)

        except Exception as e:
            self.logger.error(
                "failed_to_clear_force_rotation", name=name, error=str(e)
            )

    async def get_rotation_status(self, name: str) -> Dict[str, Any]:
        """
        Get rotation status for a secret.

        Args:
            name: Secret name

        Returns:
            Rotation status information
        """
        if not self.pool:
            await self.initialize()

        query = """
        SELECT
            secret_name, last_rotation, next_rotation,
            rotation_days, enabled
        FROM secrets_rotation_config
        WHERE secret_name = $1
        """

        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query, name)

            if not row:
                return {"name": name, "status": "not_configured"}

            days_until_rotation = None
            if row["next_rotation"]:
                days_until_rotation = (
                    row["next_rotation"] - datetime.utcnow()
                ).days

            return {
                "name": name,
                "enabled": row["enabled"],
                "last_rotation": row["last_rotation"].isoformat()
                if row["last_rotation"]
                else None,
                "next_rotation": row["next_rotation"].isoformat()
                if row["next_rotation"]
                else None,
                "days_until_rotation": days_until_rotation,
                "rotation_interval_days": row["rotation_days"],
            }

        except Exception as e:
            self.logger.error(
                "failed_to_get_rotation_status", name=name, error=str(e)
            )
            raise

    async def list_rotation_configs(self) -> List[Dict[str, Any]]:
        """Get all rotation configurations."""
        if not self.pool:
            await self.initialize()

        query = """
        SELECT
            secret_name, rotation_days, enabled,
            last_rotation, next_rotation, description
        FROM secrets_rotation_config
        ORDER BY next_rotation ASC NULLS LAST
        """

        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query)

            configs = []
            for row in rows:
                configs.append(
                    {
                        "name": row["secret_name"],
                        "rotation_days": row["rotation_days"],
                        "enabled": row["enabled"],
                        "last_rotation": row["last_rotation"].isoformat()
                        if row["last_rotation"]
                        else None,
                        "next_rotation": row["next_rotation"].isoformat()
                        if row["next_rotation"]
                        else None,
                        "description": row["description"],
                    }
                )

            return configs

        except Exception as e:
            self.logger.error("failed_to_list_rotation_configs", error=str(e))
            raise
