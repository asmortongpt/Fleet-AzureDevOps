"""Comprehensive audit logging for secrets access and management."""

import json
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional, List
from dataclasses import dataclass, asdict

import structlog
import asyncpg

from app.core.config import settings


class AuditAction(str, Enum):
    """Types of audit-tracked actions."""

    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    REVOKE = "revoke"
    ROTATE = "rotate"
    EXPORT = "export"
    IMPORT = "import"


class AuditResult(str, Enum):
    """Audit action result status."""

    SUCCESS = "success"
    FAILURE = "failure"
    PARTIAL = "partial"


@dataclass
class AuditEvent:
    """Represents a single audit event."""

    action: AuditAction
    resource_name: str
    timestamp: datetime
    result: AuditResult
    actor_id: Optional[str] = None
    actor_ip: Optional[str] = None
    actor_user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary for storage."""
        data = asdict(self)
        data["action"] = self.action.value
        data["result"] = self.result.value
        data["timestamp"] = self.timestamp.isoformat()
        return data


class SecretsAudit:
    """Manages comprehensive audit logging for secrets operations."""

    def __init__(self):
        """Initialize SecretsAudit."""
        self.logger = structlog.get_logger(__name__)
        self.db_url = settings.DATABASE_URL
        self.pool: Optional[asyncpg.Pool] = None
        self._table_created = False

    async def initialize(self) -> None:
        """Initialize database connection pool."""
        try:
            self.pool = await asyncpg.create_pool(
                self.db_url,
                min_size=2,
                max_size=10,
                command_timeout=60,
            )

            await self._create_audit_table()
            self.logger.info("audit_system_initialized")

        except Exception as e:
            self.logger.error("failed_to_initialize_audit", error=str(e))
            raise

    async def shutdown(self) -> None:
        """Shutdown database connection pool."""
        if self.pool:
            await self.pool.close()
            self.logger.info("audit_system_shutdown")

    async def _create_audit_table(self) -> None:
        """Create audit table if it doesn't exist."""
        if self._table_created or not self.pool:
            return

        create_table_sql = """
        CREATE TABLE IF NOT EXISTS secrets_audit_log (
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

        CREATE INDEX IF NOT EXISTS idx_secrets_audit_resource
            ON secrets_audit_log(resource_name);

        CREATE INDEX IF NOT EXISTS idx_secrets_audit_timestamp
            ON secrets_audit_log(timestamp DESC);

        CREATE INDEX IF NOT EXISTS idx_secrets_audit_action
            ON secrets_audit_log(action);

        CREATE INDEX IF NOT EXISTS idx_secrets_audit_actor
            ON secrets_audit_log(actor_id);
        """

        try:
            async with self.pool.acquire() as conn:
                await conn.execute(create_table_sql)
            self._table_created = True
            self.logger.debug("audit_table_created")

        except Exception as e:
            self.logger.error("failed_to_create_audit_table", error=str(e))
            raise

    async def log_event(self, event: AuditEvent) -> int:
        """
        Log an audit event.

        Args:
            event: AuditEvent to log

        Returns:
            Event ID

        Raises:
            Exception: If unable to log event
        """
        if not self.pool:
            await self.initialize()

        insert_sql = """
        INSERT INTO secrets_audit_log (
            action, resource_name, timestamp, result,
            actor_id, actor_ip, actor_user_agent,
            details, error_message, duration_ms
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) RETURNING id
        """

        try:
            event_dict = event.to_dict()

            async with self.pool.acquire() as conn:
                event_id = await conn.fetchval(
                    insert_sql,
                    event.action.value,
                    event.resource_name,
                    event.timestamp,
                    event.result.value,
                    event.actor_id,
                    event.actor_ip,
                    event.actor_user_agent,
                    json.dumps(event.details) if event.details else None,
                    event.error_message,
                    event.duration_ms,
                )

            self.logger.info(
                "audit_event_logged",
                event_id=event_id,
                action=event.action.value,
                resource=event.resource_name,
                result=event.result.value,
            )

            return event_id

        except Exception as e:
            self.logger.error(
                "failed_to_log_audit_event",
                resource=event.resource_name,
                action=event.action.value,
                error=str(e),
            )
            raise

    async def get_audit_trail(
        self,
        resource_name: Optional[str] = None,
        action: Optional[AuditAction] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve audit trail with filtering.

        Args:
            resource_name: Filter by secret name
            action: Filter by action type
            start_time: Filter from timestamp
            end_time: Filter to timestamp
            limit: Maximum results
            offset: Pagination offset

        Returns:
            List of audit events
        """
        if not self.pool:
            await self.initialize()

        query = "SELECT * FROM secrets_audit_log WHERE 1=1"
        params: List[Any] = []
        param_count = 1

        if resource_name:
            query += f" AND resource_name = ${param_count}"
            params.append(resource_name)
            param_count += 1

        if action:
            query += f" AND action = ${param_count}"
            params.append(action.value)
            param_count += 1

        if start_time:
            query += f" AND timestamp >= ${param_count}"
            params.append(start_time)
            param_count += 1

        if end_time:
            query += f" AND timestamp <= ${param_count}"
            params.append(end_time)
            param_count += 1

        query += f" ORDER BY timestamp DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([limit, offset])

        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, *params)

            events = []
            for row in rows:
                events.append(dict(row))

            self.logger.info(
                "audit_trail_retrieved",
                count=len(events),
                resource=resource_name,
                action=action.value if action else None,
            )

            return events

        except Exception as e:
            self.logger.error("failed_to_retrieve_audit_trail", error=str(e))
            raise

    async def get_audit_summary(
        self,
        resource_name: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Get audit summary for a secret.

        Args:
            resource_name: Secret name
            days: Number of days to analyze

        Returns:
            Summary statistics
        """
        if not self.pool:
            await self.initialize()

        query = """
        SELECT
            action,
            result,
            COUNT(*) as count,
            COUNT(CASE WHEN result = 'failure' THEN 1 END) as failures
        FROM secrets_audit_log
        WHERE resource_name = $1
            AND timestamp >= NOW() - INTERVAL '%d days'
        GROUP BY action, result
        ORDER BY action, result
        """

        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    query.replace("%d", str(days)), resource_name
                )

            summary = {
                "resource": resource_name,
                "period_days": days,
                "generated_at": datetime.utcnow().isoformat(),
                "actions": {},
            }

            for row in rows:
                action = row["action"]
                if action not in summary["actions"]:
                    summary["actions"][action] = {
                        "total": 0,
                        "success": 0,
                        "failure": 0,
                    }

                summary["actions"][action]["total"] += row["count"]
                if row["result"] == "success":
                    summary["actions"][action]["success"] += row["count"]
                else:
                    summary["actions"][action]["failure"] += row["count"]

            self.logger.info(
                "audit_summary_generated",
                resource=resource_name,
                days=days,
            )

            return summary

        except Exception as e:
            self.logger.error(
                "failed_to_generate_audit_summary",
                resource=resource_name,
                error=str(e),
            )
            raise

    async def detect_suspicious_activity(
        self,
        resource_name: str,
        failure_threshold: int = 5,
        time_window_minutes: int = 30,
    ) -> Dict[str, Any]:
        """
        Detect suspicious access patterns.

        Args:
            resource_name: Secret name
            failure_threshold: Number of failures to trigger alert
            time_window_minutes: Time window to analyze

        Returns:
            Threat analysis results
        """
        if not self.pool:
            await self.initialize()

        query = """
        SELECT
            actor_id,
            actor_ip,
            COUNT(*) as total_attempts,
            COUNT(CASE WHEN result = 'failure' THEN 1 END) as failures,
            COUNT(CASE WHEN result = 'success' THEN 1 END) as successes,
            MAX(timestamp) as last_attempt,
            ARRAY_AGG(DISTINCT action) as actions
        FROM secrets_audit_log
        WHERE resource_name = $1
            AND timestamp >= NOW() - INTERVAL '%d minutes'
        GROUP BY actor_id, actor_ip
        """

        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    query.replace("%d", str(time_window_minutes)), resource_name
                )

            threats = []
            for row in rows:
                if row["failures"] >= failure_threshold:
                    threat = {
                        "actor_id": row["actor_id"],
                        "actor_ip": row["actor_ip"],
                        "risk_level": "high"
                        if row["failures"] >= failure_threshold * 2
                        else "medium",
                        "total_attempts": row["total_attempts"],
                        "failures": row["failures"],
                        "successes": row["successes"],
                        "last_attempt": row["last_attempt"].isoformat(),
                        "actions": row["actions"],
                    }
                    threats.append(threat)

            if threats:
                self.logger.warning(
                    "suspicious_activity_detected",
                    resource=resource_name,
                    threat_count=len(threats),
                )

            return {
                "resource": resource_name,
                "time_window_minutes": time_window_minutes,
                "threats_detected": len(threats),
                "threats": threats,
            }

        except Exception as e:
            self.logger.error(
                "failed_to_detect_suspicious_activity",
                resource=resource_name,
                error=str(e),
            )
            raise
