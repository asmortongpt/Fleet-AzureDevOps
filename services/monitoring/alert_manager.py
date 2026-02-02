"""
Alert Manager
Alert routing, escalation, and notification system

Supports:
- Multiple notification channels (email, SMS, Slack, Teams)
- Alert escalation based on severity
- Alert grouping and deduplication
- On-call schedule management
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from enum import Enum
from dataclasses import dataclass, field
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
import os

from security_monitor import SecurityEvent, SecuritySeverity

logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    """Notification channel types"""
    EMAIL = "email"
    SMS = "sms"
    SLACK = "slack"
    TEAMS = "teams"
    PAGERDUTY = "pagerduty"
    WEBHOOK = "webhook"


class AlertStatus(str, Enum):
    """Alert status"""
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


@dataclass
class Alert:
    """Security alert"""
    alert_id: str
    event: SecurityEvent
    message: str
    created_at: datetime
    status: AlertStatus = AlertStatus.OPEN
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    escalation_level: int = 0
    notifications_sent: List[str] = field(default_factory=list)
    related_alerts: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "alert_id": self.alert_id,
            "event": self.event.to_dict(),
            "message": self.message,
            "created_at": self.created_at.isoformat(),
            "status": self.status.value,
            "acknowledged_by": self.acknowledged_by,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_by": self.resolved_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "escalation_level": self.escalation_level,
            "notifications_sent": self.notifications_sent,
            "related_alerts": self.related_alerts
        }


@dataclass
class NotificationConfig:
    """Notification configuration"""
    channel: NotificationChannel
    recipients: List[str]
    severity_threshold: SecuritySeverity = SecuritySeverity.MEDIUM
    enabled: bool = True
    rate_limit_minutes: int = 5  # Minimum time between notifications


@dataclass
class EscalationRule:
    """Alert escalation rule"""
    severity: SecuritySeverity
    initial_delay_minutes: int
    escalation_delay_minutes: int
    max_escalation_level: int
    channels_by_level: Dict[int, List[NotificationChannel]]


class AlertManager:
    """Alert management and notification service"""

    def __init__(self):
        """Initialize alert manager"""
        self.alerts: Dict[str, Alert] = {}
        self.notification_configs: List[NotificationConfig] = []
        self.escalation_rules: Dict[SecuritySeverity, EscalationRule] = {}

        # Track last notification time for rate limiting
        self.last_notification: Dict[str, datetime] = {}

        # Alert grouping - similar alerts within time window
        self.alert_groups: Dict[str, List[str]] = {}

        # Background tasks
        self.running = False

        # Configure default escalation rules
        self._configure_default_escalation()

        # HTTP client for webhooks
        self.http_client: Optional[httpx.AsyncClient] = None

    def _configure_default_escalation(self):
        """Configure default escalation rules"""
        # Critical alerts
        self.escalation_rules[SecuritySeverity.CRITICAL] = EscalationRule(
            severity=SecuritySeverity.CRITICAL,
            initial_delay_minutes=0,  # Immediate
            escalation_delay_minutes=5,
            max_escalation_level=3,
            channels_by_level={
                0: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
                1: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.SMS],
                2: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.SMS, NotificationChannel.PAGERDUTY],
                3: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.SMS, NotificationChannel.PAGERDUTY, NotificationChannel.TEAMS]
            }
        )

        # High alerts
        self.escalation_rules[SecuritySeverity.HIGH] = EscalationRule(
            severity=SecuritySeverity.HIGH,
            initial_delay_minutes=0,
            escalation_delay_minutes=15,
            max_escalation_level=2,
            channels_by_level={
                0: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
                1: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.SMS],
                2: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.SMS, NotificationChannel.PAGERDUTY]
            }
        )

        # Medium alerts
        self.escalation_rules[SecuritySeverity.MEDIUM] = EscalationRule(
            severity=SecuritySeverity.MEDIUM,
            initial_delay_minutes=0,
            escalation_delay_minutes=30,
            max_escalation_level=1,
            channels_by_level={
                0: [NotificationChannel.EMAIL],
                1: [NotificationChannel.EMAIL, NotificationChannel.SLACK]
            }
        )

        # Low alerts
        self.escalation_rules[SecuritySeverity.LOW] = EscalationRule(
            severity=SecuritySeverity.LOW,
            initial_delay_minutes=5,
            escalation_delay_minutes=60,
            max_escalation_level=0,
            channels_by_level={
                0: [NotificationChannel.EMAIL]
            }
        )

    async def start(self):
        """Start alert manager"""
        logger.info("Starting Alert Manager")
        self.running = True
        self.http_client = httpx.AsyncClient(timeout=30.0)

        # Start background tasks
        asyncio.create_task(self._escalation_monitor())
        asyncio.create_task(self._alert_grouping())

        logger.info("Alert Manager started")

    async def stop(self):
        """Stop alert manager"""
        logger.info("Stopping Alert Manager")
        self.running = False

        if self.http_client:
            await self.http_client.aclose()

        logger.info("Alert Manager stopped")

    def add_notification_config(self, config: NotificationConfig):
        """Add notification configuration"""
        self.notification_configs.append(config)
        logger.info(f"Added notification config: {config.channel.value}")

    async def create_alert(
        self,
        event: SecurityEvent,
        message: str
    ) -> Alert:
        """
        Create a new alert

        Args:
            event: Security event that triggered alert
            message: Alert message

        Returns:
            Created alert
        """
        alert_id = f"alert-{event.event_type.value}-{event.timestamp.timestamp()}"

        alert = Alert(
            alert_id=alert_id,
            event=event,
            message=message,
            created_at=datetime.utcnow()
        )

        self.alerts[alert_id] = alert

        # Send initial notifications
        await self._send_notifications(alert)

        logger.info(f"Created alert: {alert_id}")

        return alert

    async def acknowledge_alert(
        self,
        alert_id: str,
        acknowledged_by: str
    ):
        """
        Acknowledge an alert

        Args:
            alert_id: Alert ID
            acknowledged_by: User who acknowledged
        """
        alert = self.alerts.get(alert_id)
        if not alert:
            raise ValueError(f"Alert not found: {alert_id}")

        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_by = acknowledged_by
        alert.acknowledged_at = datetime.utcnow()

        logger.info(f"Alert acknowledged: {alert_id} by {acknowledged_by}")

    async def resolve_alert(
        self,
        alert_id: str,
        resolved_by: str
    ):
        """
        Resolve an alert

        Args:
            alert_id: Alert ID
            resolved_by: User who resolved
        """
        alert = self.alerts.get(alert_id)
        if not alert:
            raise ValueError(f"Alert not found: {alert_id}")

        alert.status = AlertStatus.RESOLVED
        alert.resolved_by = resolved_by
        alert.resolved_at = datetime.utcnow()

        logger.info(f"Alert resolved: {alert_id} by {resolved_by}")

    async def _send_notifications(
        self,
        alert: Alert,
        escalation_level: int = 0
    ):
        """Send notifications for an alert"""
        # Get escalation rule
        rule = self.escalation_rules.get(alert.event.severity)
        if not rule:
            logger.warning(f"No escalation rule for severity: {alert.event.severity}")
            return

        # Get channels for this escalation level
        channels = rule.channels_by_level.get(escalation_level, [])

        # Send notifications to each channel
        for channel in channels:
            # Check if channel is configured
            configs = [
                c for c in self.notification_configs
                if c.channel == channel and c.enabled
            ]

            for config in configs:
                # Check severity threshold
                severity_order = [
                    SecuritySeverity.LOW,
                    SecuritySeverity.MEDIUM,
                    SecuritySeverity.HIGH,
                    SecuritySeverity.CRITICAL
                ]
                if severity_order.index(alert.event.severity) < severity_order.index(config.severity_threshold):
                    continue

                # Check rate limit
                rate_key = f"{channel.value}:{config.recipients}"
                last_sent = self.last_notification.get(rate_key)
                if last_sent:
                    elapsed = (datetime.utcnow() - last_sent).total_seconds() / 60
                    if elapsed < config.rate_limit_minutes:
                        logger.debug(f"Rate limit hit for {channel.value}")
                        continue

                # Send notification
                try:
                    if channel == NotificationChannel.EMAIL:
                        await self._send_email(alert, config.recipients)
                    elif channel == NotificationChannel.SLACK:
                        await self._send_slack(alert, config.recipients)
                    elif channel == NotificationChannel.TEAMS:
                        await self._send_teams(alert, config.recipients)
                    elif channel == NotificationChannel.WEBHOOK:
                        await self._send_webhook(alert, config.recipients)
                    elif channel == NotificationChannel.SMS:
                        await self._send_sms(alert, config.recipients)
                    elif channel == NotificationChannel.PAGERDUTY:
                        await self._send_pagerduty(alert, config.recipients)

                    # Update tracking
                    self.last_notification[rate_key] = datetime.utcnow()
                    alert.notifications_sent.append(f"{channel.value}:{escalation_level}")

                    logger.info(f"Sent {channel.value} notification for {alert.alert_id}")

                except Exception as e:
                    logger.error(f"Error sending {channel.value} notification: {e}", exc_info=True)

    async def _send_email(self, alert: Alert, recipients: List[str]):
        """Send email notification"""
        smtp_host = os.getenv("EMAIL_HOST", "smtp.office365.com")
        smtp_port = int(os.getenv("EMAIL_PORT", "587"))
        smtp_user = os.getenv("EMAIL_USER")
        smtp_pass = os.getenv("EMAIL_PASS")

        if not smtp_user or not smtp_pass:
            logger.warning("Email credentials not configured")
            return

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[{alert.event.severity.value.upper()}] Security Alert: {alert.message}"
        msg["From"] = smtp_user
        msg["To"] = ", ".join(recipients)

        # Create HTML body
        html = f"""
        <html>
          <body>
            <h2 style="color: {'red' if alert.event.severity == SecuritySeverity.CRITICAL else 'orange'}">
              Security Alert: {alert.message}
            </h2>
            <p><strong>Severity:</strong> {alert.event.severity.value.upper()}</p>
            <p><strong>Event Type:</strong> {alert.event.event_type.value}</p>
            <p><strong>Time:</strong> {alert.created_at.isoformat()}</p>
            <p><strong>User:</strong> {alert.event.username or alert.event.user_id or 'Unknown'}</p>
            <p><strong>IP Address:</strong> {alert.event.ip_address or 'Unknown'}</p>
            <p><strong>Endpoint:</strong> {alert.event.endpoint or 'N/A'}</p>
            <h3>Details:</h3>
            <pre>{json.dumps(alert.event.details, indent=2)}</pre>
            <p>Alert ID: {alert.alert_id}</p>
          </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        # Send email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

    async def _send_slack(self, alert: Alert, webhooks: List[str]):
        """Send Slack notification"""
        if not self.http_client:
            return

        color_map = {
            SecuritySeverity.CRITICAL: "#ff0000",
            SecuritySeverity.HIGH: "#ff6600",
            SecuritySeverity.MEDIUM: "#ffcc00",
            SecuritySeverity.LOW: "#00cc00"
        }

        payload = {
            "attachments": [
                {
                    "color": color_map.get(alert.event.severity, "#cccccc"),
                    "title": f"Security Alert: {alert.message}",
                    "fields": [
                        {
                            "title": "Severity",
                            "value": alert.event.severity.value.upper(),
                            "short": True
                        },
                        {
                            "title": "Event Type",
                            "value": alert.event.event_type.value,
                            "short": True
                        },
                        {
                            "title": "User",
                            "value": alert.event.username or alert.event.user_id or "Unknown",
                            "short": True
                        },
                        {
                            "title": "IP Address",
                            "value": alert.event.ip_address or "Unknown",
                            "short": True
                        },
                        {
                            "title": "Time",
                            "value": alert.created_at.isoformat(),
                            "short": False
                        }
                    ],
                    "footer": f"Alert ID: {alert.alert_id}"
                }
            ]
        }

        for webhook_url in webhooks:
            try:
                response = await self.http_client.post(webhook_url, json=payload)
                response.raise_for_status()
            except Exception as e:
                logger.error(f"Error sending Slack notification: {e}")

    async def _send_teams(self, alert: Alert, webhooks: List[str]):
        """Send Microsoft Teams notification"""
        if not self.http_client:
            return

        payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "FF0000" if alert.event.severity == SecuritySeverity.CRITICAL else "FF6600",
            "summary": alert.message,
            "sections": [
                {
                    "activityTitle": f"Security Alert: {alert.message}",
                    "activitySubtitle": f"Severity: {alert.event.severity.value.upper()}",
                    "facts": [
                        {"name": "Event Type", "value": alert.event.event_type.value},
                        {"name": "User", "value": alert.event.username or alert.event.user_id or "Unknown"},
                        {"name": "IP Address", "value": alert.event.ip_address or "Unknown"},
                        {"name": "Time", "value": alert.created_at.isoformat()},
                        {"name": "Alert ID", "value": alert.alert_id}
                    ]
                }
            ]
        }

        for webhook_url in webhooks:
            try:
                response = await self.http_client.post(webhook_url, json=payload)
                response.raise_for_status()
            except Exception as e:
                logger.error(f"Error sending Teams notification: {e}")

    async def _send_webhook(self, alert: Alert, urls: List[str]):
        """Send webhook notification"""
        if not self.http_client:
            return

        payload = alert.to_dict()

        for url in urls:
            try:
                response = await self.http_client.post(url, json=payload)
                response.raise_for_status()
            except Exception as e:
                logger.error(f"Error sending webhook notification: {e}")

    async def _send_sms(self, alert: Alert, phone_numbers: List[str]):
        """Send SMS notification (placeholder - requires SMS provider)"""
        logger.info(f"SMS notification would be sent to {phone_numbers}")
        # Implement with Twilio, AWS SNS, or other SMS provider

    async def _send_pagerduty(self, alert: Alert, integration_keys: List[str]):
        """Send PagerDuty notification"""
        if not self.http_client:
            return

        payload = {
            "routing_key": integration_keys[0] if integration_keys else "",
            "event_action": "trigger",
            "payload": {
                "summary": alert.message,
                "severity": alert.event.severity.value,
                "source": "ctafleet-security-monitor",
                "timestamp": alert.created_at.isoformat(),
                "custom_details": alert.event.to_dict()
            }
        }

        try:
            response = await self.http_client.post(
                "https://events.pagerduty.com/v2/enqueue",
                json=payload
            )
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Error sending PagerDuty notification: {e}")

    async def _escalation_monitor(self):
        """Monitor alerts for escalation"""
        logger.info("Escalation monitor started")

        while self.running:
            try:
                await asyncio.sleep(60)  # Check every minute

                for alert in self.alerts.values():
                    # Skip acknowledged or resolved alerts
                    if alert.status in [AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED]:
                        continue

                    # Get escalation rule
                    rule = self.escalation_rules.get(alert.event.severity)
                    if not rule:
                        continue

                    # Calculate time since creation or last escalation
                    if alert.escalation_level == 0:
                        delay = rule.initial_delay_minutes
                    else:
                        delay = rule.escalation_delay_minutes

                    # Check if it's time to escalate
                    elapsed = (datetime.utcnow() - alert.created_at).total_seconds() / 60

                    if elapsed >= delay * (alert.escalation_level + 1):
                        if alert.escalation_level < rule.max_escalation_level:
                            # Escalate
                            alert.escalation_level += 1
                            alert.status = AlertStatus.ESCALATED

                            logger.warning(
                                f"Escalating alert {alert.alert_id} to level {alert.escalation_level}"
                            )

                            # Send escalation notifications
                            await self._send_notifications(alert, alert.escalation_level)

            except Exception as e:
                logger.error(f"Error in escalation monitor: {e}", exc_info=True)

    async def _alert_grouping(self):
        """Group similar alerts to reduce noise"""
        logger.info("Alert grouping started")

        while self.running:
            try:
                await asyncio.sleep(300)  # Group every 5 minutes

                # Clear old groups
                self.alert_groups.clear()

                # Group alerts by type and user
                for alert in self.alerts.values():
                    if alert.status == AlertStatus.RESOLVED:
                        continue

                    # Create group key
                    group_key = f"{alert.event.event_type.value}:{alert.event.user_id}"

                    if group_key not in self.alert_groups:
                        self.alert_groups[group_key] = []

                    self.alert_groups[group_key].append(alert.alert_id)

                # Log grouped alerts
                for group_key, alert_ids in self.alert_groups.items():
                    if len(alert_ids) > 1:
                        logger.info(f"Alert group {group_key}: {len(alert_ids)} alerts")

            except Exception as e:
                logger.error(f"Error in alert grouping: {e}", exc_info=True)

    def get_alerts(
        self,
        status: Optional[AlertStatus] = None,
        severity: Optional[SecuritySeverity] = None,
        limit: int = 100
    ) -> List[Alert]:
        """Get alerts with filters"""
        alerts = list(self.alerts.values())

        # Apply filters
        if status:
            alerts = [a for a in alerts if a.status == status]

        if severity:
            alerts = [a for a in alerts if a.event.severity == severity]

        # Sort by creation time (newest first)
        alerts.sort(key=lambda a: a.created_at, reverse=True)

        return alerts[:limit]

    def get_statistics(self) -> Dict[str, Any]:
        """Get alert statistics"""
        stats = {
            "total_alerts": len(self.alerts),
            "by_status": {},
            "by_severity": {},
            "escalated_alerts": 0,
            "average_resolution_time_minutes": 0
        }

        resolution_times = []

        for alert in self.alerts.values():
            # Count by status
            stats["by_status"][alert.status.value] = stats["by_status"].get(alert.status.value, 0) + 1

            # Count by severity
            stats["by_severity"][alert.event.severity.value] = stats["by_severity"].get(alert.event.severity.value, 0) + 1

            # Count escalated
            if alert.escalation_level > 0:
                stats["escalated_alerts"] += 1

            # Calculate resolution time
            if alert.resolved_at:
                resolution_time = (alert.resolved_at - alert.created_at).total_seconds() / 60
                resolution_times.append(resolution_time)

        if resolution_times:
            stats["average_resolution_time_minutes"] = sum(resolution_times) / len(resolution_times)

        return stats


# Global alert manager instance
_alert_manager: Optional[AlertManager] = None


async def get_alert_manager() -> AlertManager:
    """Get or create the global alert manager instance"""
    global _alert_manager
    if _alert_manager is None:
        _alert_manager = AlertManager()
        await _alert_manager.start()
    return _alert_manager
