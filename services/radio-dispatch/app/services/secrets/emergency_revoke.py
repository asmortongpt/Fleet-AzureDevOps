"""Emergency secret revocation with notifications and compliance tracking."""

import asyncio
from datetime import datetime
from typing import Any, Dict, Optional, List, Callable
from dataclasses import dataclass
from enum import Enum

import structlog
import asyncpg

from app.core.config import settings
from .secrets_manager import SecretsManager, SecretAccessError
from .secrets_audit import SecretsAudit, AuditEvent, AuditAction, AuditResult


class RevocationReason(str, Enum):
    """Reasons for emergency revocation."""

    SECURITY_INCIDENT = "security-incident"
    UNAUTHORIZED_ACCESS = "unauthorized-access"
    EMPLOYEE_TERMINATION = "employee-termination"
    POLICY_VIOLATION = "policy-violation"
    COMPROMISE_SUSPECTED = "compromise-suspected"
    SYSTEM_BREACH = "system-breach"
    MANUAL_REQUEST = "manual-request"


class RevocationStatus(str, Enum):
    """Status of a revocation operation."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class RevocationRequest:
    """Request for emergency secret revocation."""

    secret_name: str
    reason: RevocationReason
    requested_by: str
    severity: str = "high"  # low, medium, high, critical
    description: Optional[str] = None
    notify_recipients: Optional[List[str]] = None
    immediate: bool = True
    approval_required: bool = False
    approved_by: Optional[str] = None


class EmergencyRevoke:
    """Manages emergency secret revocation with comprehensive tracking."""

    def __init__(
        self,
        secrets_manager: SecretsManager,
        audit: SecretsAudit,
        notification_callback: Optional[Callable[[str, str, str], None]] = None,
    ):
        """
        Initialize EmergencyRevoke.

        Args:
            secrets_manager: SecretsManager instance
            audit: SecretsAudit instance
            notification_callback: Async function to send notifications
        """
        self.logger = structlog.get_logger(__name__)
        self.secrets_manager = secrets_manager
        self.audit = audit
        self.notification_callback = notification_callback
        self.db_url = settings.DATABASE_URL
        self.pool: Optional[asyncpg.Pool] = None
        self._table_created = False

    async def initialize(self) -> None:
        """Initialize database for revocation tracking."""
        try:
            self.pool = await asyncpg.create_pool(
                self.db_url,
                min_size=2,
                max_size=10,
                command_timeout=60,
            )

            await self._create_revocation_table()
            self.logger.info("revocation_system_initialized")

        except Exception as e:
            self.logger.error("failed_to_initialize_revocation", error=str(e))
            raise

    async def shutdown(self) -> None:
        """Shutdown revocation system."""
        if self.pool:
            await self.pool.close()
            self.logger.info("revocation_system_shutdown")

    async def _create_revocation_table(self) -> None:
        """Create revocation tracking table."""
        if self._table_created or not self.pool:
            return

        create_table_sql = """
        CREATE TABLE IF NOT EXISTS secrets_revocation_log (
            id BIGSERIAL PRIMARY KEY,
            secret_name VARCHAR(255) NOT NULL,
            reason VARCHAR(100) NOT NULL,
            status VARCHAR(50) NOT NULL,
            severity VARCHAR(50) NOT NULL,
            requested_by VARCHAR(255) NOT NULL,
            requested_at TIMESTAMPTZ NOT NULL,
            approved_by VARCHAR(255),
            approved_at TIMESTAMPTZ,
            revoked_at TIMESTAMPTZ,
            description TEXT,
            notify_recipients TEXT[],
            error_message TEXT,
            details JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_revocation_secret
            ON secrets_revocation_log(secret_name);

        CREATE INDEX IF NOT EXISTS idx_revocation_status
            ON secrets_revocation_log(status);

        CREATE INDEX IF NOT EXISTS idx_revocation_requested_at
            ON secrets_revocation_log(requested_at DESC);

        CREATE INDEX IF NOT EXISTS idx_revocation_severity
            ON secrets_revocation_log(severity);
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(create_table_sql)
            self._table_created = True
            self.logger.debug("revocation_table_created")

        except Exception as e:
            self.logger.error("failed_to_create_revocation_table", error=str(e))
            raise

    async def request_revocation(
        self, request: RevocationRequest
    ) -> Dict[str, Any]:
        """
        Request emergency revocation of a secret.

        Args:
            request: Revocation request

        Returns:
            Revocation request metadata

        Raises:
            Exception: If request creation fails
        """
        if not self.pool:
            await self.initialize()

        requested_at = datetime.utcnow()

        insert_sql = """
        INSERT INTO secrets_revocation_log (
            secret_name, reason, status, severity,
            requested_by, requested_at, description,
            notify_recipients
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING id
        """

        try:
            initial_status = (
                RevocationStatus.PENDING if request.approval_required
                else RevocationStatus.IN_PROGRESS
            )

            async with self.pool.acquire() as conn:
                revocation_id = await conn.fetchval(
                    insert_sql,
                    request.secret_name,
                    request.reason.value,
                    initial_status.value,
                    request.severity,
                    request.requested_by,
                    requested_at,
                    request.description,
                    request.notify_recipients or [],
                )

            self.logger.info(
                "revocation_requested",
                revocation_id=revocation_id,
                secret=request.secret_name,
                reason=request.reason.value,
                severity=request.severity,
            )

            # Send initial notifications
            if not request.approval_required:
                await self._send_notifications(
                    request,
                    f"Emergency revocation initiated for {request.secret_name}",
                )

                # If not requiring approval, execute immediately
                if request.immediate:
                    await self.execute_revocation(revocation_id, request.requested_by)

            return {
                "revocation_id": revocation_id,
                "secret_name": request.secret_name,
                "status": initial_status.value,
                "requested_at": requested_at.isoformat(),
                "approval_required": request.approval_required,
            }

        except Exception as e:
            self.logger.error(
                "failed_to_create_revocation_request",
                secret=request.secret_name,
                error=str(e),
            )
            raise

    async def approve_revocation(
        self, revocation_id: int, approved_by: str
    ) -> Dict[str, Any]:
        """
        Approve a pending revocation request.

        Args:
            revocation_id: ID of revocation request
            approved_by: User approving the request

        Returns:
            Updated revocation metadata

        Raises:
            Exception: If approval fails
        """
        if not self.pool:
            await self.initialize()

        approved_at = datetime.utcnow()

        query = """
        UPDATE secrets_revocation_log
        SET approved_by = $1,
            approved_at = $2,
            status = $3
        WHERE id = $4
        RETURNING secret_name, reason, severity, notify_recipients, description
        """

        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(
                    query,
                    approved_by,
                    approved_at,
                    RevocationStatus.IN_PROGRESS.value,
                    revocation_id,
                )

            if not row:
                raise ValueError(f"Revocation request {revocation_id} not found")

            self.logger.info(
                "revocation_approved",
                revocation_id=revocation_id,
                approved_by=approved_by,
                secret=row["secret_name"],
            )

            # Execute the revocation
            await self.execute_revocation(revocation_id, approved_by)

            return {
                "revocation_id": revocation_id,
                "approved_by": approved_by,
                "approved_at": approved_at.isoformat(),
                "status": RevocationStatus.IN_PROGRESS.value,
            }

        except Exception as e:
            self.logger.error(
                "failed_to_approve_revocation",
                revocation_id=revocation_id,
                error=str(e),
            )
            raise

    async def execute_revocation(
        self, revocation_id: int, executor_id: str
    ) -> Dict[str, Any]:
        """
        Execute the actual secret revocation.

        Args:
            revocation_id: ID of revocation request
            executor_id: User executing the revocation

        Returns:
            Revocation result

        Raises:
            Exception: If revocation fails
        """
        if not self.pool:
            await self.initialize()

        revoked_at = datetime.utcnow()
        status = RevocationStatus.COMPLETED

        query_select = """
        SELECT secret_name, reason, severity, notify_recipients, requested_by
        FROM secrets_revocation_log
        WHERE id = $1
        """

        query_update = """
        UPDATE secrets_revocation_log
        SET status = $1, revoked_at = $2
        WHERE id = $3
        """

        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query_select, revocation_id)

            if not row:
                raise ValueError(f"Revocation request {revocation_id} not found")

            secret_name = row["secret_name"]

            self.logger.info(
                "executing_revocation",
                revocation_id=revocation_id,
                secret=secret_name,
            )

            try:
                # Revoke the secret
                await self.secrets_manager.delete_secret(
                    secret_name, immediate=True
                )

                # Log audit event
                await self.audit.log_event(
                    AuditEvent(
                        action=AuditAction.REVOKE,
                        resource_name=secret_name,
                        timestamp=revoked_at,
                        result=AuditResult.SUCCESS,
                        actor_id=executor_id,
                        details={
                            "revocation_id": revocation_id,
                            "reason": row["reason"],
                        },
                    )
                )

            except SecretAccessError as e:
                status = RevocationStatus.FAILED
                self.logger.error(
                    "revocation_execution_failed",
                    revocation_id=revocation_id,
                    secret=secret_name,
                    error=str(e),
                )

                await self.audit.log_event(
                    AuditEvent(
                        action=AuditAction.REVOKE,
                        resource_name=secret_name,
                        timestamp=revoked_at,
                        result=AuditResult.FAILURE,
                        actor_id=executor_id,
                        error_message=str(e),
                    )
                )

                raise

            # Update revocation status
            async with self.pool.acquire() as conn:
                await conn.execute(
                    query_update,
                    status.value,
                    revoked_at,
                    revocation_id,
                )

            # Send completion notifications
            request = RevocationRequest(
                secret_name=secret_name,
                reason=RevocationReason(row["reason"]),
                requested_by=row["requested_by"],
                severity=row["severity"],
                notify_recipients=row["notify_recipients"],
            )

            await self._send_notifications(
                request,
                f"Secret {secret_name} has been successfully revoked",
            )

            self.logger.info(
                "revocation_executed",
                revocation_id=revocation_id,
                secret=secret_name,
                status=status.value,
            )

            return {
                "revocation_id": revocation_id,
                "secret_name": secret_name,
                "status": status.value,
                "revoked_at": revoked_at.isoformat(),
            }

        except Exception as e:
            self.logger.error(
                "failed_to_execute_revocation",
                revocation_id=revocation_id,
                error=str(e),
            )
            raise

    async def _send_notifications(
        self, request: RevocationRequest, message: str
    ) -> None:
        """Send notifications about revocation."""
        if not self.notification_callback or not request.notify_recipients:
            return

        try:
            for recipient in request.notify_recipients:
                await self.notification_callback(
                    recipient,
                    f"Secret Revocation: {request.secret_name}",
                    message,
                )

            self.logger.debug(
                "revocation_notifications_sent",
                secret=request.secret_name,
                recipient_count=len(request.notify_recipients),
            )

        except Exception as e:
            self.logger.error(
                "failed_to_send_revocation_notifications",
                secret=request.secret_name,
                error=str(e),
            )

    async def get_revocation_history(
        self,
        secret_name: Optional[str] = None,
        status: Optional[RevocationStatus] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get revocation history.

        Args:
            secret_name: Filter by secret name
            status: Filter by status
            limit: Maximum results

        Returns:
            List of revocation records
        """
        if not self.pool:
            await self.initialize()

        query = "SELECT * FROM secrets_revocation_log WHERE 1=1"
        params: List[Any] = []

        if secret_name:
            query += " AND secret_name = $" + str(len(params) + 1)
            params.append(secret_name)

        if status:
            query += " AND status = $" + str(len(params) + 1)
            params.append(status.value)

        query += f" ORDER BY requested_at DESC LIMIT ${len(params) + 1}"
        params.append(limit)

        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, *params)

            revocations = []
            for row in rows:
                revocations.append(dict(row))

            return revocations

        except Exception as e:
            self.logger.error("failed_to_retrieve_revocation_history", error=str(e))
            raise

    async def get_revocation_status(self, revocation_id: int) -> Dict[str, Any]:
        """
        Get status of a revocation request.

        Args:
            revocation_id: ID of revocation request

        Returns:
            Revocation status information
        """
        if not self.pool:
            await self.initialize()

        query = """
        SELECT
            id, secret_name, reason, status, severity,
            requested_by, requested_at, approved_by,
            approved_at, revoked_at, description
        FROM secrets_revocation_log
        WHERE id = $1
        """

        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query, revocation_id)

            if not row:
                raise ValueError(f"Revocation request {revocation_id} not found")

            return dict(row)

        except Exception as e:
            self.logger.error(
                "failed_to_get_revocation_status",
                revocation_id=revocation_id,
                error=str(e),
            )
            raise
