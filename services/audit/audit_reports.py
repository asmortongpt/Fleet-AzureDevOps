"""
Audit Reports - Log analysis and reporting for compliance and security

This module provides comprehensive audit log analysis and reporting:
- Security event summaries
- User activity reports
- Compliance reports (SOC2, FedRAMP)
- Anomaly detection
- Trend analysis
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from .audit_logger import AuditLogModel, AuditAction, AuditLevel, AuditResult


logger = structlog.get_logger(__name__)


class ReportType(str, Enum):
    """Types of audit reports"""
    SECURITY_SUMMARY = "security_summary"
    USER_ACTIVITY = "user_activity"
    COMPLIANCE = "compliance"
    FAILED_OPERATIONS = "failed_operations"
    CONFIGURATION_CHANGES = "configuration_changes"
    DATA_ACCESS = "data_access"
    ANOMALY_DETECTION = "anomaly_detection"


@dataclass
class ReportParameters:
    """Parameters for generating audit reports"""
    report_type: ReportType
    start_date: datetime
    end_date: datetime
    user_id: Optional[str] = None
    resource_type: Optional[str] = None
    action: Optional[str] = None
    level: Optional[str] = None
    limit: int = 1000


class AuditReporter:
    """
    Generate compliance and security reports from audit logs

    Provides:
    - Security event analysis
    - User activity tracking
    - Compliance reporting (SOC2, FedRAMP)
    - Anomaly detection
    - Executive summaries
    """

    def __init__(self, session_factory):
        """
        Initialize audit reporter

        Args:
            session_factory: SQLAlchemy async session factory
        """
        self.session_factory = session_factory

    async def generate_report(self, params: ReportParameters) -> Dict[str, Any]:
        """
        Generate audit report based on parameters

        Args:
            params: Report parameters

        Returns:
            Report data dictionary
        """
        logger.info(
            "generating_audit_report",
            report_type=params.report_type.value,
            start_date=params.start_date.isoformat(),
            end_date=params.end_date.isoformat()
        )

        # Route to appropriate report generator
        report_generators = {
            ReportType.SECURITY_SUMMARY: self._generate_security_summary,
            ReportType.USER_ACTIVITY: self._generate_user_activity,
            ReportType.COMPLIANCE: self._generate_compliance_report,
            ReportType.FAILED_OPERATIONS: self._generate_failed_operations,
            ReportType.CONFIGURATION_CHANGES: self._generate_config_changes,
            ReportType.DATA_ACCESS: self._generate_data_access,
            ReportType.ANOMALY_DETECTION: self._generate_anomaly_detection,
        }

        generator = report_generators.get(params.report_type)
        if not generator:
            raise ValueError(f"Unknown report type: {params.report_type}")

        report = await generator(params)

        logger.info(
            "audit_report_generated",
            report_type=params.report_type.value,
            records=report.get("record_count", 0)
        )

        return report

    async def _generate_security_summary(self, params: ReportParameters) -> Dict[str, Any]:
        """Generate security events summary report"""
        async with self.session_factory() as session:
            # Security events query
            query = select(AuditLogModel).where(
                and_(
                    AuditLogModel.timestamp >= params.start_date,
                    AuditLogModel.timestamp <= params.end_date,
                    AuditLogModel.level == AuditLevel.SECURITY.value
                )
            )

            result = await session.execute(query)
            security_logs = result.scalars().all()

            # Aggregate statistics
            failed_logins = sum(1 for log in security_logs if log.action == AuditAction.LOGIN_FAILED.value)
            successful_logins = sum(1 for log in security_logs if log.action == AuditAction.LOGIN.value)
            intrusion_attempts = sum(1 for log in security_logs if log.action == AuditAction.INTRUSION_ATTEMPT.value)
            permission_denied = sum(1 for log in security_logs if log.action == AuditAction.PERMISSION_DENIED.value)

            # Top users with security events
            user_counts = {}
            for log in security_logs:
                user_id = log.user_id or "anonymous"
                user_counts[user_id] = user_counts.get(user_id, 0) + 1

            top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:10]

            # Security events by day
            events_by_day = {}
            for log in security_logs:
                day = log.timestamp.strftime("%Y-%m-%d")
                events_by_day[day] = events_by_day.get(day, 0) + 1

            return {
                "report_type": "security_summary",
                "period": {
                    "start": params.start_date.isoformat(),
                    "end": params.end_date.isoformat(),
                },
                "summary": {
                    "total_security_events": len(security_logs),
                    "failed_logins": failed_logins,
                    "successful_logins": successful_logins,
                    "intrusion_attempts": intrusion_attempts,
                    "permission_denied": permission_denied,
                },
                "top_users": [{"user_id": user, "event_count": count} for user, count in top_users],
                "events_by_day": events_by_day,
                "record_count": len(security_logs),
            }

    async def _generate_user_activity(self, params: ReportParameters) -> Dict[str, Any]:
        """Generate user activity report"""
        async with self.session_factory() as session:
            query = select(AuditLogModel).where(
                and_(
                    AuditLogModel.timestamp >= params.start_date,
                    AuditLogModel.timestamp <= params.end_date,
                )
            )

            if params.user_id:
                query = query.where(AuditLogModel.user_id == params.user_id)

            query = query.order_by(desc(AuditLogModel.timestamp)).limit(params.limit)

            result = await session.execute(query)
            activity_logs = result.scalars().all()

            # Aggregate by action type
            action_counts = {}
            for log in activity_logs:
                action_counts[log.action] = action_counts.get(log.action, 0) + 1

            # Resource access patterns
            resource_access = {}
            for log in activity_logs:
                key = f"{log.resource_type}:{log.action}"
                resource_access[key] = resource_access.get(key, 0) + 1

            # Activity timeline
            activity_by_hour = {}
            for log in activity_logs:
                hour = log.timestamp.strftime("%Y-%m-%d %H:00")
                activity_by_hour[hour] = activity_by_hour.get(hour, 0) + 1

            return {
                "report_type": "user_activity",
                "period": {
                    "start": params.start_date.isoformat(),
                    "end": params.end_date.isoformat(),
                },
                "user_id": params.user_id,
                "summary": {
                    "total_actions": len(activity_logs),
                    "unique_resources": len(set(f"{log.resource_type}:{log.resource_id}" for log in activity_logs if log.resource_id)),
                    "actions_by_type": action_counts,
                },
                "resource_access": resource_access,
                "activity_timeline": activity_by_hour,
                "recent_activity": [
                    {
                        "timestamp": log.timestamp.isoformat(),
                        "action": log.action,
                        "resource": f"{log.resource_type}:{log.resource_id or 'N/A'}",
                        "result": log.result,
                    }
                    for log in activity_logs[:50]  # Most recent 50
                ],
                "record_count": len(activity_logs),
            }

    async def _generate_compliance_report(self, params: ReportParameters) -> Dict[str, Any]:
        """Generate compliance report (SOC2, FedRAMP)"""
        async with self.session_factory() as session:
            # All logs in period
            query = select(AuditLogModel).where(
                and_(
                    AuditLogModel.timestamp >= params.start_date,
                    AuditLogModel.timestamp <= params.end_date,
                )
            )

            result = await session.execute(query)
            all_logs = result.scalars().all()

            # Compliance metrics
            auth_events = sum(1 for log in all_logs if log.resource_type == "authentication")
            config_changes = sum(1 for log in all_logs if log.action == AuditAction.CONFIG_CHANGE.value)
            data_exports = sum(1 for log in all_logs if log.action == AuditAction.EXPORT.value)
            failed_access = sum(1 for log in all_logs if log.result == AuditResult.DENIED.value)

            # Access control verification
            access_control = {
                "total_access_attempts": len(all_logs),
                "successful": sum(1 for log in all_logs if log.result == AuditResult.SUCCESS.value),
                "failed": sum(1 for log in all_logs if log.result == AuditResult.FAILURE.value),
                "denied": failed_access,
            }

            # Configuration change audit
            config_change_logs = [
                {
                    "timestamp": log.timestamp.isoformat(),
                    "user_id": log.user_id,
                    "user_email": log.user_email,
                    "config_item": log.resource_id,
                    "message": log.message,
                }
                for log in all_logs
                if log.action == AuditAction.CONFIG_CHANGE.value
            ]

            # Data access audit
            data_access_summary = {}
            for log in all_logs:
                if log.action in [AuditAction.READ.value, AuditAction.EXPORT.value]:
                    key = log.resource_type
                    data_access_summary[key] = data_access_summary.get(key, 0) + 1

            # Retention compliance
            oldest_log = min((log.timestamp for log in all_logs), default=None)
            retention_days = (datetime.now(timezone.utc) - oldest_log).days if oldest_log else 0

            return {
                "report_type": "compliance",
                "period": {
                    "start": params.start_date.isoformat(),
                    "end": params.end_date.isoformat(),
                },
                "compliance_status": {
                    "audit_logging_enabled": True,
                    "retention_period_days": retention_days,
                    "meets_7year_requirement": retention_days >= 365 * 7 or datetime.now(timezone.utc) - params.start_date < timedelta(days=365*7),
                    "encryption_enabled": any(log.encrypted_data for log in all_logs),
                },
                "authentication_events": {
                    "total": auth_events,
                    "logins": sum(1 for log in all_logs if log.action == AuditAction.LOGIN.value),
                    "failed_logins": sum(1 for log in all_logs if log.action == AuditAction.LOGIN_FAILED.value),
                },
                "access_control": access_control,
                "configuration_changes": {
                    "total": config_changes,
                    "changes": config_change_logs[:100],  # Latest 100
                },
                "data_access": {
                    "total_exports": data_exports,
                    "access_by_resource": data_access_summary,
                },
                "security_metrics": {
                    "intrusion_attempts": sum(1 for log in all_logs if log.action == AuditAction.INTRUSION_ATTEMPT.value),
                    "rate_limit_violations": sum(1 for log in all_logs if log.action == AuditAction.RATE_LIMIT_EXCEEDED.value),
                },
                "record_count": len(all_logs),
            }

    async def _generate_failed_operations(self, params: ReportParameters) -> Dict[str, Any]:
        """Generate report of failed operations"""
        async with self.session_factory() as session:
            query = select(AuditLogModel).where(
                and_(
                    AuditLogModel.timestamp >= params.start_date,
                    AuditLogModel.timestamp <= params.end_date,
                    or_(
                        AuditLogModel.result == AuditResult.FAILURE.value,
                        AuditLogModel.result == AuditResult.DENIED.value
                    )
                )
            ).order_by(desc(AuditLogModel.timestamp)).limit(params.limit)

            result = await session.execute(query)
            failed_logs = result.scalars().all()

            # Categorize failures
            failures_by_type = {}
            for log in failed_logs:
                key = f"{log.action}:{log.resource_type}"
                failures_by_type[key] = failures_by_type.get(key, 0) + 1

            # Top users with failures
            user_failures = {}
            for log in failed_logs:
                user_id = log.user_id or "anonymous"
                user_failures[user_id] = user_failures.get(user_id, 0) + 1

            return {
                "report_type": "failed_operations",
                "period": {
                    "start": params.start_date.isoformat(),
                    "end": params.end_date.isoformat(),
                },
                "summary": {
                    "total_failures": len(failed_logs),
                    "denied": sum(1 for log in failed_logs if log.result == AuditResult.DENIED.value),
                    "errors": sum(1 for log in failed_logs if log.result == AuditResult.FAILURE.value),
                },
                "failures_by_type": failures_by_type,
                "top_users_with_failures": sorted(user_failures.items(), key=lambda x: x[1], reverse=True)[:10],
                "recent_failures": [
                    {
                        "timestamp": log.timestamp.isoformat(),
                        "user_id": log.user_id,
                        "action": log.action,
                        "resource": f"{log.resource_type}:{log.resource_id or 'N/A'}",
                        "result": log.result,
                        "message": log.message,
                    }
                    for log in failed_logs[:100]
                ],
                "record_count": len(failed_logs),
            }

    async def _generate_config_changes(self, params: ReportParameters) -> Dict[str, Any]:
        """Generate configuration changes report"""
        async with self.session_factory() as session:
            query = select(AuditLogModel).where(
                and_(
                    AuditLogModel.timestamp >= params.start_date,
                    AuditLogModel.timestamp <= params.end_date,
                    or_(
                        AuditLogModel.action == AuditAction.CONFIG_CHANGE.value,
                        AuditLogModel.action == AuditAction.POLICY_CREATE.value,
                        AuditLogModel.action == AuditAction.POLICY_UPDATE.value,
                        AuditLogModel.action == AuditAction.POLICY_DELETE.value,
                    )
                )
            ).order_by(desc(AuditLogModel.timestamp))

            result = await session.execute(query)
            config_logs = result.scalars().all()

            return {
                "report_type": "configuration_changes",
                "period": {
                    "start": params.start_date.isoformat(),
                    "end": params.end_date.isoformat(),
                },
                "summary": {
                    "total_changes": len(config_logs),
                    "config_changes": sum(1 for log in config_logs if log.action == AuditAction.CONFIG_CHANGE.value),
                    "policy_changes": sum(1 for log in config_logs if "POLICY" in log.action),
                },
                "changes": [
                    {
                        "timestamp": log.timestamp.isoformat(),
                        "user_id": log.user_id,
                        "user_email": log.user_email,
                        "action": log.action,
                        "config_item": log.resource_id,
                        "message": log.message,
                        "has_encrypted_data": bool(log.encrypted_data),
                    }
                    for log in config_logs
                ],
                "record_count": len(config_logs),
            }

    async def _generate_data_access(self, params: ReportParameters) -> Dict[str, Any]:
        """Generate data access report"""
        async with self.session_factory() as session:
            query = select(AuditLogModel).where(
                and_(
                    AuditLogModel.timestamp >= params.start_date,
                    AuditLogModel.timestamp <= params.end_date,
                    AuditLogModel.action.in_([
                        AuditAction.READ.value,
                        AuditAction.CREATE.value,
                        AuditAction.UPDATE.value,
                        AuditAction.DELETE.value,
                        AuditAction.EXPORT.value,
                    ])
                )
            ).order_by(desc(AuditLogModel.timestamp)).limit(params.limit)

            result = await session.execute(query)
            access_logs = result.scalars().all()

            # Access patterns
            access_by_resource = {}
            access_by_user = {}
            for log in access_logs:
                # By resource
                key = f"{log.resource_type}:{log.action}"
                access_by_resource[key] = access_by_resource.get(key, 0) + 1

                # By user
                user_id = log.user_id or "anonymous"
                access_by_user[user_id] = access_by_user.get(user_id, 0) + 1

            return {
                "report_type": "data_access",
                "period": {
                    "start": params.start_date.isoformat(),
                    "end": params.end_date.isoformat(),
                },
                "summary": {
                    "total_accesses": len(access_logs),
                    "reads": sum(1 for log in access_logs if log.action == AuditAction.READ.value),
                    "creates": sum(1 for log in access_logs if log.action == AuditAction.CREATE.value),
                    "updates": sum(1 for log in access_logs if log.action == AuditAction.UPDATE.value),
                    "deletes": sum(1 for log in access_logs if log.action == AuditAction.DELETE.value),
                    "exports": sum(1 for log in access_logs if log.action == AuditAction.EXPORT.value),
                },
                "access_by_resource": access_by_resource,
                "top_users": sorted(access_by_user.items(), key=lambda x: x[1], reverse=True)[:10],
                "recent_access": [
                    {
                        "timestamp": log.timestamp.isoformat(),
                        "user_id": log.user_id,
                        "action": log.action,
                        "resource": f"{log.resource_type}:{log.resource_id or 'N/A'}",
                    }
                    for log in access_logs[:100]
                ],
                "record_count": len(access_logs),
            }

    async def _generate_anomaly_detection(self, params: ReportParameters) -> Dict[str, Any]:
        """Generate anomaly detection report"""
        async with self.session_factory() as session:
            query = select(AuditLogModel).where(
                and_(
                    AuditLogModel.timestamp >= params.start_date,
                    AuditLogModel.timestamp <= params.end_date,
                )
            )

            result = await session.execute(query)
            all_logs = result.scalars().all()

            anomalies = []

            # Detect suspicious patterns
            # 1. Multiple failed logins from same user/IP
            failed_logins = {}
            for log in all_logs:
                if log.action == AuditAction.LOGIN_FAILED.value:
                    key = f"{log.user_id}:{log.user_ip}"
                    failed_logins[key] = failed_logins.get(key, 0) + 1

            for key, count in failed_logins.items():
                if count >= 5:  # Threshold for suspicious activity
                    user_id, ip = key.split(":", 1)
                    anomalies.append({
                        "type": "multiple_failed_logins",
                        "severity": "high",
                        "user_id": user_id,
                        "ip_address": ip,
                        "count": count,
                        "description": f"User {user_id} had {count} failed login attempts from {ip}",
                    })

            # 2. Unusual access times (late night/early morning)
            unusual_hours = {}
            for log in all_logs:
                hour = log.timestamp.hour
                if hour < 6 or hour > 22:  # Outside normal business hours
                    user_id = log.user_id or "anonymous"
                    unusual_hours[user_id] = unusual_hours.get(user_id, 0) + 1

            for user_id, count in unusual_hours.items():
                if count >= 10:  # Threshold
                    anomalies.append({
                        "type": "unusual_access_hours",
                        "severity": "medium",
                        "user_id": user_id,
                        "count": count,
                        "description": f"User {user_id} accessed system {count} times outside normal hours",
                    })

            # 3. High volume of data exports
            exports_by_user = {}
            for log in all_logs:
                if log.action == AuditAction.EXPORT.value:
                    user_id = log.user_id or "anonymous"
                    exports_by_user[user_id] = exports_by_user.get(user_id, 0) + 1

            for user_id, count in exports_by_user.items():
                if count >= 20:  # Threshold
                    anomalies.append({
                        "type": "excessive_data_export",
                        "severity": "high",
                        "user_id": user_id,
                        "count": count,
                        "description": f"User {user_id} exported data {count} times",
                    })

            # 4. Rapid permission denials
            denials_by_user = {}
            for log in all_logs:
                if log.result == AuditResult.DENIED.value:
                    user_id = log.user_id or "anonymous"
                    denials_by_user[user_id] = denials_by_user.get(user_id, 0) + 1

            for user_id, count in denials_by_user.items():
                if count >= 10:  # Threshold
                    anomalies.append({
                        "type": "excessive_permission_denials",
                        "severity": "medium",
                        "user_id": user_id,
                        "count": count,
                        "description": f"User {user_id} encountered {count} permission denials (possible privilege escalation attempt)",
                    })

            return {
                "report_type": "anomaly_detection",
                "period": {
                    "start": params.start_date.isoformat(),
                    "end": params.end_date.isoformat(),
                },
                "summary": {
                    "total_anomalies": len(anomalies),
                    "high_severity": sum(1 for a in anomalies if a["severity"] == "high"),
                    "medium_severity": sum(1 for a in anomalies if a["severity"] == "medium"),
                },
                "anomalies": sorted(anomalies, key=lambda x: (x["severity"] == "high", x["count"]), reverse=True),
                "record_count": len(all_logs),
            }

    async def export_report(
        self,
        report: Dict[str, Any],
        format: str = "json"
    ) -> str:
        """
        Export report in specified format

        Args:
            report: Report data dictionary
            format: Export format (json, csv)

        Returns:
            Formatted report string
        """
        if format == "json":
            import json
            return json.dumps(report, indent=2, default=str)

        elif format == "csv":
            import csv
            import io

            # Extract relevant data for CSV
            output = io.StringIO()
            writer = csv.writer(output)

            # Write header
            writer.writerow(["Report Type", report.get("report_type", "unknown")])
            writer.writerow(["Generated", datetime.now(timezone.utc).isoformat()])
            writer.writerow([])

            # Write summary
            if "summary" in report:
                writer.writerow(["Summary"])
                for key, value in report["summary"].items():
                    writer.writerow([key, value])
                writer.writerow([])

            return output.getvalue()

        else:
            raise ValueError(f"Unsupported export format: {format}")
