"""
Log Retention - Manage audit log retention policies and archival

This module implements 7-year retention policies for compliance (SOC2, FedRAMP)
with automatic archival and purging of expired logs.

Features:
- Configurable retention periods per log type
- Automatic archival to Azure Blob Storage
- Secure deletion of expired logs
- Retention policy reporting
- Compliance with regulatory requirements
"""

import asyncio
import json
import gzip
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

from sqlalchemy import select, delete, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from azure.storage.blob.aio import BlobServiceClient
from azure.identity.aio import DefaultAzureCredential
import structlog

from .audit_logger import AuditLogModel


logger = structlog.get_logger(__name__)


class RetentionPeriod(Enum):
    """Standard retention periods for different log types"""
    DAYS_30 = 30
    DAYS_90 = 90
    DAYS_365 = 365
    YEARS_3 = 365 * 3
    YEARS_7 = 365 * 7  # SOC2/FedRAMP standard
    YEARS_10 = 365 * 10  # Extended for critical security events
    PERMANENT = -1  # Never delete


@dataclass
class RetentionPolicy:
    """Retention policy configuration"""
    name: str
    description: str
    retention_days: int
    log_levels: List[str]
    actions: List[str]
    resource_types: List[str]
    archive_before_delete: bool = True
    compression_enabled: bool = True


class LogRetentionManager:
    """
    Manage audit log retention, archival, and purging

    Implements compliance-ready retention management:
    - 7-year default retention (configurable)
    - Automatic archival to cold storage
    - Secure deletion after retention period
    - Audit trail of retention operations
    """

    DEFAULT_POLICIES = [
        RetentionPolicy(
            name="security_events_extended",
            description="Extended retention for critical security events",
            retention_days=365 * 10,  # 10 years
            log_levels=["SECURITY", "CRITICAL"],
            actions=["LOGIN_FAILED", "INTRUSION_ATTEMPT", "SUSPICIOUS_ACTIVITY"],
            resource_types=["security", "authentication"],
            archive_before_delete=True,
            compression_enabled=True,
        ),
        RetentionPolicy(
            name="compliance_standard",
            description="Standard 7-year retention for compliance (SOC2, FedRAMP)",
            retention_days=365 * 7,  # 7 years
            log_levels=["INFO", "WARNING", "ERROR"],
            actions=[],  # All actions
            resource_types=[],  # All resource types
            archive_before_delete=True,
            compression_enabled=True,
        ),
        RetentionPolicy(
            name="debug_logs_short",
            description="Short retention for debug logs",
            retention_days=90,
            log_levels=["DEBUG"],
            actions=[],
            resource_types=[],
            archive_before_delete=False,
            compression_enabled=False,
        ),
    ]

    def __init__(
        self,
        session_factory,
        storage_account_url: Optional[str] = None,
        container_name: str = "audit-log-archive",
        policies: Optional[List[RetentionPolicy]] = None,
    ):
        """
        Initialize retention manager

        Args:
            session_factory: SQLAlchemy async session factory
            storage_account_url: Azure Storage account URL for archival
            container_name: Blob container name for archived logs
            policies: Custom retention policies (uses defaults if None)
        """
        self.session_factory = session_factory
        self.storage_account_url = storage_account_url
        self.container_name = container_name
        self.policies = policies or self.DEFAULT_POLICIES

        # Azure Blob Storage client (for archival)
        self.blob_service_client: Optional[BlobServiceClient] = None
        if storage_account_url:
            credential = DefaultAzureCredential()
            self.blob_service_client = BlobServiceClient(
                account_url=storage_account_url,
                credential=credential
            )

    async def initialize(self):
        """Initialize storage container for archival"""
        if self.blob_service_client:
            try:
                container_client = self.blob_service_client.get_container_client(self.container_name)
                if not await container_client.exists():
                    await container_client.create_container()
                    logger.info(
                        "retention_container_created",
                        container=self.container_name
                    )
            except Exception as e:
                logger.error(
                    "retention_initialization_failed",
                    error=str(e),
                    container=self.container_name
                )
                raise

    async def apply_retention_policies(self) -> Dict[str, Any]:
        """
        Apply retention policies to all audit logs

        Returns:
            Summary of retention operations performed
        """
        logger.info("retention_policy_execution_started")

        summary = {
            "start_time": datetime.now(timezone.utc).isoformat(),
            "policies_applied": [],
            "total_archived": 0,
            "total_deleted": 0,
            "errors": [],
        }

        for policy in self.policies:
            try:
                result = await self._apply_policy(policy)
                summary["policies_applied"].append({
                    "policy": policy.name,
                    "archived": result["archived"],
                    "deleted": result["deleted"],
                })
                summary["total_archived"] += result["archived"]
                summary["total_deleted"] += result["deleted"]

            except Exception as e:
                error_msg = f"Policy {policy.name} failed: {str(e)}"
                logger.error("retention_policy_failed", policy=policy.name, error=str(e))
                summary["errors"].append(error_msg)

        summary["end_time"] = datetime.now(timezone.utc).isoformat()

        logger.info(
            "retention_policy_execution_completed",
            archived=summary["total_archived"],
            deleted=summary["total_deleted"],
            errors=len(summary["errors"])
        )

        return summary

    async def _apply_policy(self, policy: RetentionPolicy) -> Dict[str, int]:
        """
        Apply a single retention policy

        Args:
            policy: Retention policy to apply

        Returns:
            Dictionary with counts of archived and deleted logs
        """
        logger.info("applying_retention_policy", policy=policy.name)

        # Calculate cutoff date
        if policy.retention_days == -1:  # PERMANENT
            return {"archived": 0, "deleted": 0}

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=policy.retention_days)

        async with self.session_factory() as session:
            # Build query for expired logs matching policy criteria
            query = select(AuditLogModel).where(
                AuditLogModel.timestamp < cutoff_date
            )

            # Apply policy filters
            if policy.log_levels:
                query = query.where(AuditLogModel.level.in_(policy.log_levels))

            if policy.actions:
                query = query.where(AuditLogModel.action.in_(policy.actions))

            if policy.resource_types:
                query = query.where(AuditLogModel.resource_type.in_(policy.resource_types))

            # Execute query
            result = await session.execute(query)
            expired_logs = result.scalars().all()

            if not expired_logs:
                logger.debug("no_expired_logs", policy=policy.name)
                return {"archived": 0, "deleted": 0}

            logger.info(
                "expired_logs_found",
                policy=policy.name,
                count=len(expired_logs)
            )

            # Archive logs if configured
            archived_count = 0
            if policy.archive_before_delete and self.blob_service_client:
                archived_count = await self._archive_logs(
                    expired_logs,
                    policy.name,
                    policy.compression_enabled
                )

            # Delete expired logs
            log_ids = [log.id for log in expired_logs]
            delete_stmt = delete(AuditLogModel).where(
                AuditLogModel.id.in_(log_ids)
            )
            await session.execute(delete_stmt)
            await session.commit()

            deleted_count = len(expired_logs)

            logger.info(
                "retention_policy_applied",
                policy=policy.name,
                archived=archived_count,
                deleted=deleted_count
            )

            return {"archived": archived_count, "deleted": deleted_count}

    async def _archive_logs(
        self,
        logs: List[AuditLogModel],
        policy_name: str,
        compress: bool = True
    ) -> int:
        """
        Archive logs to Azure Blob Storage

        Args:
            logs: List of audit logs to archive
            policy_name: Name of retention policy
            compress: Whether to compress archived data

        Returns:
            Number of logs archived
        """
        if not self.blob_service_client:
            logger.warning("blob_storage_not_configured")
            return 0

        try:
            # Group logs by date for efficient storage
            logs_by_date: Dict[str, List[Dict]] = {}
            for log in logs:
                date_key = log.timestamp.strftime("%Y-%m-%d")
                if date_key not in logs_by_date:
                    logs_by_date[date_key] = []

                # Convert log to JSON-serializable dict
                log_dict = {
                    "id": str(log.id),
                    "correlation_id": str(log.correlation_id),
                    "timestamp": log.timestamp.isoformat(),
                    "user_id": log.user_id,
                    "user_email": log.user_email,
                    "user_ip": log.user_ip,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "level": log.level,
                    "result": log.result,
                    "message": log.message,
                    "metadata": log.metadata,
                    "encrypted_data": log.encrypted_data,
                    "log_hash": log.log_hash,
                }
                logs_by_date[date_key].append(log_dict)

            # Upload each day's logs as a separate blob
            container_client = self.blob_service_client.get_container_client(self.container_name)
            archived_count = 0

            for date_key, day_logs in logs_by_date.items():
                # Create blob path: policy/year/month/date.json[.gz]
                timestamp = datetime.fromisoformat(day_logs[0]["timestamp"])
                blob_path = f"{policy_name}/{timestamp.year}/{timestamp.month:02d}/{date_key}.json"

                # Serialize logs to JSON
                json_data = json.dumps(day_logs, indent=2).encode('utf-8')

                # Compress if enabled
                if compress:
                    json_data = gzip.compress(json_data)
                    blob_path += ".gz"

                # Upload to blob storage
                blob_client = container_client.get_blob_client(blob_path)
                await blob_client.upload_blob(
                    json_data,
                    overwrite=True,
                    metadata={
                        "policy": policy_name,
                        "log_count": str(len(day_logs)),
                        "archived_at": datetime.now(timezone.utc).isoformat(),
                        "compressed": str(compress),
                    }
                )

                archived_count += len(day_logs)

                logger.debug(
                    "logs_archived",
                    blob_path=blob_path,
                    count=len(day_logs),
                    compressed=compress
                )

            return archived_count

        except Exception as e:
            logger.error("log_archival_failed", error=str(e))
            raise

    async def get_retention_stats(self) -> Dict[str, Any]:
        """
        Get statistics about current log retention

        Returns:
            Dictionary with retention statistics
        """
        async with self.session_factory() as session:
            # Total logs
            total_result = await session.execute(
                select(func.count(AuditLogModel.id))
            )
            total_logs = total_result.scalar()

            # Logs by retention period
            now = datetime.now(timezone.utc)
            stats = {
                "total_logs": total_logs,
                "current_time": now.isoformat(),
                "retention_breakdown": {},
                "oldest_log": None,
                "newest_log": None,
                "storage_estimate_mb": 0,
            }

            # Oldest and newest logs
            oldest_result = await session.execute(
                select(AuditLogModel.timestamp).order_by(AuditLogModel.timestamp.asc()).limit(1)
            )
            oldest = oldest_result.scalar()
            if oldest:
                stats["oldest_log"] = oldest.isoformat()

            newest_result = await session.execute(
                select(AuditLogModel.timestamp).order_by(AuditLogModel.timestamp.desc()).limit(1)
            )
            newest = newest_result.scalar()
            if newest:
                stats["newest_log"] = newest.isoformat()

            # Breakdown by age
            for period in [30, 90, 365, 365*3, 365*7]:
                cutoff = now - timedelta(days=period)
                count_result = await session.execute(
                    select(func.count(AuditLogModel.id)).where(
                        AuditLogModel.timestamp >= cutoff
                    )
                )
                count = count_result.scalar()
                stats["retention_breakdown"][f"within_{period}_days"] = count

            # Estimate storage size (rough estimate)
            # Assume average log entry is ~2KB
            stats["storage_estimate_mb"] = (total_logs * 2) / 1024

            return stats

    async def retrieve_archived_logs(
        self,
        start_date: datetime,
        end_date: datetime,
        policy_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve archived logs from blob storage

        Args:
            start_date: Start of date range
            end_date: End of date range
            policy_name: Optional policy name filter

        Returns:
            List of archived log records
        """
        if not self.blob_service_client:
            raise ValueError("Blob storage not configured")

        archived_logs = []
        container_client = self.blob_service_client.get_container_client(self.container_name)

        # Build prefix for blob listing
        prefix = f"{policy_name}/" if policy_name else ""

        # List and download matching blobs
        async for blob in container_client.list_blobs(name_starts_with=prefix):
            # Parse date from blob name
            try:
                # Extract date from path: policy/year/month/date.json[.gz]
                parts = blob.name.split('/')
                if len(parts) >= 4:
                    date_str = parts[-1].replace('.json.gz', '').replace('.json', '')
                    blob_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)

                    if start_date <= blob_date <= end_date:
                        # Download and parse blob
                        blob_client = container_client.get_blob_client(blob.name)
                        blob_data = await blob_client.download_blob()
                        content = await blob_data.readall()

                        # Decompress if needed
                        if blob.name.endswith('.gz'):
                            content = gzip.decompress(content)

                        # Parse JSON
                        logs = json.loads(content.decode('utf-8'))
                        archived_logs.extend(logs)

            except Exception as e:
                logger.warning("failed_to_parse_archived_blob", blob=blob.name, error=str(e))
                continue

        logger.info(
            "archived_logs_retrieved",
            count=len(archived_logs),
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat()
        )

        return archived_logs

    async def cleanup(self):
        """Cleanup resources"""
        if self.blob_service_client:
            await self.blob_service_client.close()
