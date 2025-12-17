"""Real-time alert management and notification system.

This module provides:
- Alert generation and deduplication
- Multi-channel notification delivery
- Alert aggregation and correlation
- Alert state management
- Escalation policies
"""

import logging
import asyncio
import json
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Callable, Any, Set
from dataclasses import dataclass, field, asdict
from abc import ABC, abstractmethod
import uuid

from .security_monitor import SecurityEvent, SeverityLevel, EventProcessor

logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    """Available notification channels."""

    EMAIL = "email"
    SLACK = "slack"
    PAGERDUTY = "pagerduty"
    SMS = "sms"
    WEBHOOK = "webhook"
    LOG = "log"


class AlertStatus(str, Enum):
    """Alert lifecycle status."""

    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


@dataclass
class Alert:
    """Represents a security alert."""

    title: str
    description: str
    severity: SeverityLevel
    source_event_id: str
    alert_id: Optional[str] = None
    status: AlertStatus = AlertStatus.NEW
    triggered_at: datetime = field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    related_event_ids: List[str] = field(default_factory=list)
    notification_channels: List[NotificationChannel] = field(default_factory=list)
    escalation_count: int = 0
    last_escalated_at: Optional[datetime] = None

    def __post_init__(self):
        """Initialize alert defaults."""
        if self.alert_id is None:
            self.alert_id = str(uuid.uuid4())

    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary."""
        data = asdict(self)
        data['severity'] = self.severity.value
        data['status'] = self.status.value
        data['triggered_at'] = self.triggered_at.isoformat()
        data['resolved_at'] = (
            self.resolved_at.isoformat() if self.resolved_at else None
        )
        data['acknowledged_at'] = (
            self.acknowledged_at.isoformat()
            if self.acknowledged_at else None
        )
        data['last_escalated_at'] = (
            self.last_escalated_at.isoformat()
            if self.last_escalated_at else None
        )
        data['notification_channels'] = [c.value for c in self.notification_channels]
        return data

    def acknowledge(self, user_id: str) -> None:
        """Acknowledge the alert.

        Args:
            user_id: ID of user acknowledging
        """
        self.status = AlertStatus.ACKNOWLEDGED
        self.acknowledged_by = user_id
        self.acknowledged_at = datetime.utcnow()

    def resolve(self) -> None:
        """Mark alert as resolved."""
        self.status = AlertStatus.RESOLVED
        self.resolved_at = datetime.utcnow()

    def escalate(self) -> None:
        """Escalate the alert."""
        self.escalation_count += 1
        self.last_escalated_at = datetime.utcnow()


class AlertDeduplicator:
    """Deduplicates similar alerts to reduce noise."""

    def __init__(self, window_minutes: int = 5):
        """Initialize deduplicator.

        Args:
            window_minutes: Time window for deduplication
        """
        self.window_minutes = window_minutes
        self.recent_alerts: Dict[str, List[Alert]] = {}
        self.fingerprints: Dict[str, str] = {}

    def get_fingerprint(self, alert: Alert) -> str:
        """Generate fingerprint for alert deduplication.

        Args:
            alert: Alert to fingerprint

        Returns:
            Fingerprint string
        """
        import hashlib

        # Create fingerprint from severity, title, and key metadata
        key_parts = [
            alert.severity.value,
            alert.title,
            str(alert.metadata.get("user_id", "")),
            str(alert.metadata.get("source_ip", "")),
        ]
        key = "|".join(key_parts)
        return hashlib.md5(key.encode()).hexdigest()

    def should_create_alert(self, alert: Alert) -> bool:
        """Determine if alert should be created or deduplicated.

        Args:
            alert: Alert to check

        Returns:
            True if alert should be created
        """
        fingerprint = self.get_fingerprint(alert)
        cutoff_time = datetime.utcnow() - timedelta(minutes=self.window_minutes)

        # Clean old alerts
        if fingerprint in self.recent_alerts:
            self.recent_alerts[fingerprint] = [
                a for a in self.recent_alerts[fingerprint]
                if a.triggered_at > cutoff_time
            ]

            # If we have recent alerts with same fingerprint, deduplicate
            if self.recent_alerts[fingerprint]:
                return False

        # Store new alert
        if fingerprint not in self.recent_alerts:
            self.recent_alerts[fingerprint] = []
        self.recent_alerts[fingerprint].append(alert)

        return True


class NotificationHandler(ABC):
    """Base class for notification handlers."""

    @abstractmethod
    async def send(self, alert: Alert) -> bool:
        """Send notification for alert.

        Args:
            alert: Alert to notify about

        Returns:
            True if notification sent successfully
        """
        pass


class EmailNotificationHandler(NotificationHandler):
    """Sends email notifications."""

    def __init__(self, smtp_server: Optional[str] = None):
        """Initialize email handler.

        Args:
            smtp_server: SMTP server configuration
        """
        self.smtp_server = smtp_server

    async def send(self, alert: Alert) -> bool:
        """Send email notification."""
        try:
            # In production, integrate with actual email service
            logger.info(
                f"Email notification for alert {alert.alert_id}",
                extra={"alert": alert.to_dict()}
            )
            return True
        except Exception as e:
            logger.error(f"Email notification failed: {e}")
            return False


class SlackNotificationHandler(NotificationHandler):
    """Sends Slack notifications."""

    def __init__(self, webhook_url: Optional[str] = None):
        """Initialize Slack handler.

        Args:
            webhook_url: Slack webhook URL
        """
        self.webhook_url = webhook_url

    async def send(self, alert: Alert) -> bool:
        """Send Slack notification."""
        try:
            # In production, integrate with Slack API
            logger.info(
                f"Slack notification for alert {alert.alert_id}",
                extra={"alert": alert.to_dict()}
            )
            return True
        except Exception as e:
            logger.error(f"Slack notification failed: {e}")
            return False


class WebhookNotificationHandler(NotificationHandler):
    """Sends webhook notifications."""

    def __init__(self, webhook_url: str):
        """Initialize webhook handler.

        Args:
            webhook_url: Webhook URL to send to
        """
        self.webhook_url = webhook_url

    async def send(self, alert: Alert) -> bool:
        """Send webhook notification."""
        try:
            # In production, POST alert to webhook URL
            logger.info(
                f"Webhook notification for alert {alert.alert_id}",
                extra={"webhook_url": self.webhook_url}
            )
            return True
        except Exception as e:
            logger.error(f"Webhook notification failed: {e}")
            return False


class AlertManager(EventProcessor):
    """Manages alerts and notifications."""

    def __init__(self):
        """Initialize alert manager."""
        self.alerts: Dict[str, Alert] = {}
        self.deduplicator = AlertDeduplicator()
        self.handlers: Dict[NotificationChannel, NotificationHandler] = {}
        self.escalation_rules: Dict[SeverityLevel, timedelta] = {
            SeverityLevel.INFO: timedelta(hours=24),
            SeverityLevel.WARNING: timedelta(hours=4),
            SeverityLevel.CRITICAL: timedelta(minutes=30),
            SeverityLevel.EMERGENCY: timedelta(minutes=5),
        }
        self.alert_callbacks: List[Callable[[Alert], Any]] = []

    async def process(self, event: SecurityEvent) -> None:
        """Process event and generate alerts.

        Args:
            event: Security event
        """
        try:
            # Determine if event warrants an alert
            if event.severity in (SeverityLevel.CRITICAL, SeverityLevel.EMERGENCY):
                alert = self._create_alert_from_event(event)

                # Check deduplication
                if self.deduplicator.should_create_alert(alert):
                    await self.create_alert(alert)

        except Exception as e:
            logger.error(f"Error processing event for alerts: {e}", exc_info=True)

    def _create_alert_from_event(self, event: SecurityEvent) -> Alert:
        """Create alert from security event.

        Args:
            event: Security event

        Returns:
            Generated Alert
        """
        alert = Alert(
            title=f"Security Event: {event.event_type.value}",
            description=str(event.details) if event.details else "No details",
            severity=event.severity,
            source_event_id=event.event_id,
        )

        # Set notification channels based on severity
        if event.severity == SeverityLevel.EMERGENCY:
            alert.notification_channels = [
                NotificationChannel.SLACK,
                NotificationChannel.PAGERDUTY,
                NotificationChannel.SMS,
            ]
        elif event.severity == SeverityLevel.CRITICAL:
            alert.notification_channels = [
                NotificationChannel.SLACK,
                NotificationChannel.EMAIL,
            ]
        else:
            alert.notification_channels = [NotificationChannel.LOG]

        alert.metadata = {
            "event_type": event.event_type.value,
            "source_ip": event.source_ip,
            "user_id": event.user_id,
        }

        return alert

    async def create_alert(self, alert: Alert) -> str:
        """Create a new alert.

        Args:
            alert: Alert to create

        Returns:
            Alert ID
        """
        self.alerts[alert.alert_id] = alert
        logger.info(f"Alert created: {alert.alert_id}")

        # Send notifications
        for channel in alert.notification_channels:
            if channel in self.handlers:
                try:
                    await self.handlers[channel].send(alert)
                except Exception as e:
                    logger.error(f"Error sending {channel} notification: {e}")

        # Invoke callbacks
        for callback in self.alert_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(alert)
                else:
                    callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")

        return alert.alert_id

    async def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Acknowledge an alert.

        Args:
            alert_id: Alert ID
            user_id: User acknowledging

        Returns:
            True if successful
        """
        if alert_id in self.alerts:
            self.alerts[alert_id].acknowledge(user_id)
            logger.info(f"Alert {alert_id} acknowledged by {user_id}")
            return True
        return False

    async def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert.

        Args:
            alert_id: Alert ID to resolve

        Returns:
            True if successful
        """
        if alert_id in self.alerts:
            self.alerts[alert_id].resolve()
            logger.info(f"Alert {alert_id} resolved")
            return True
        return False

    async def escalate_alert(self, alert_id: str) -> bool:
        """Escalate an alert.

        Args:
            alert_id: Alert ID to escalate

        Returns:
            True if successful
        """
        if alert_id in self.alerts:
            self.alerts[alert_id].escalate()
            logger.info(f"Alert {alert_id} escalated (count: {self.alerts[alert_id].escalation_count})")
            return True
        return False

    def register_handler(
        self,
        channel: NotificationChannel,
        handler: NotificationHandler
    ) -> None:
        """Register a notification handler.

        Args:
            channel: Notification channel
            handler: Handler instance
        """
        self.handlers[channel] = handler

    def on_alert(self, callback: Callable[[Alert], Any]) -> None:
        """Register alert callback.

        Args:
            callback: Callable to invoke on new alerts
        """
        self.alert_callbacks.append(callback)

    async def get_active_alerts(self) -> List[Alert]:
        """Get active (non-resolved) alerts.

        Returns:
            List of active alerts
        """
        return [
            a for a in self.alerts.values()
            if a.status != AlertStatus.RESOLVED
        ]

    async def get_alert(self, alert_id: str) -> Optional[Alert]:
        """Get a specific alert.

        Args:
            alert_id: Alert ID

        Returns:
            Alert or None
        """
        return self.alerts.get(alert_id)

    async def get_alerts_by_severity(self, severity: SeverityLevel) -> List[Alert]:
        """Get alerts by severity.

        Args:
            severity: Severity level

        Returns:
            List of alerts
        """
        return [
            a for a in self.alerts.values()
            if a.severity == severity
        ]

    async def check_escalations(self) -> None:
        """Check for alerts that need escalation."""
        now = datetime.utcnow()

        for alert in self.alerts.values():
            if alert.status == AlertStatus.RESOLVED:
                continue

            # Check if escalation is needed
            escalation_window = self.escalation_rules.get(
                alert.severity,
                timedelta(hours=1)
            )
            time_since_last_escalation = (
                now - alert.last_escalated_at
                if alert.last_escalated_at
                else now - alert.triggered_at
            )

            if time_since_last_escalation >= escalation_window:
                await self.escalate_alert(alert.alert_id)
