"""Automated threat response and mitigation.

This module provides:
- Automatic threat response actions
- IP blocking and rate limiting
- Session revocation
- Resource access restrictions
- Incident tracking
"""

import logging
import asyncio
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Callable, Any, Set
from dataclasses import dataclass, field
import ipaddress

from .security_monitor import (
    SecurityEvent,
    SecurityEventType,
    SeverityLevel,
    EventProcessor,
)
from .alert_manager import Alert

logger = logging.getLogger(__name__)


class ThreatAction(str, Enum):
    """Automated threat response actions."""

    BLOCK_IP = "block_ip"
    RATE_LIMIT = "rate_limit"
    REVOKE_SESSION = "revoke_session"
    DISABLE_USER = "disable_user"
    RESTRICT_RESOURCE = "restrict_resource"
    FORCE_PASSWORD_RESET = "force_password_reset"
    ENABLE_MFA = "enable_mfa"
    QUARANTINE = "quarantine"
    NOTIFY = "notify"


class IncidentStatus(str, Enum):
    """Incident lifecycle status."""

    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    REMEDIATED = "remediated"
    CLOSED = "closed"


@dataclass
class BlockedIP:
    """Represents a blocked IP address."""

    ip_address: str
    blocked_at: datetime = field(default_factory=datetime.utcnow)
    blocked_until: Optional[datetime] = None
    reason: Optional[str] = None
    block_count: int = 0
    permanent: bool = False
    is_ipv6: bool = field(init=False)

    def __post_init__(self):
        """Validate IP address."""
        try:
            ip = ipaddress.ip_address(self.ip_address)
            self.is_ipv6 = isinstance(ip, ipaddress.IPv6Address)
        except ValueError:
            raise ValueError(f"Invalid IP address: {self.ip_address}")

    def is_active(self) -> bool:
        """Check if block is currently active."""
        if self.permanent:
            return True
        if self.blocked_until:
            return datetime.utcnow() < self.blocked_until
        return True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "ip_address": self.ip_address,
            "blocked_at": self.blocked_at.isoformat(),
            "blocked_until": (
                self.blocked_until.isoformat()
                if self.blocked_until else None
            ),
            "reason": self.reason,
            "block_count": self.block_count,
            "permanent": self.permanent,
            "active": self.is_active(),
        }


@dataclass
class SecurityIncident:
    """Represents a security incident."""

    incident_id: str
    title: str
    description: str
    severity: SeverityLevel
    status: IncidentStatus = IncidentStatus.OPEN
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    triggered_alerts: List[str] = field(default_factory=list)
    triggered_events: List[str] = field(default_factory=list)
    response_actions: List[Dict[str, Any]] = field(default_factory=list)
    assigned_to: Optional[str] = None
    notes: List[str] = field(default_factory=list)

    def add_action(
        self,
        action: ThreatAction,
        target: str,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record a response action.

        Args:
            action: Type of action taken
            target: Target of action (IP, user, etc.)
            details: Additional details
        """
        self.response_actions.append({
            "action": action.value,
            "target": target,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {},
        })
        self.updated_at = datetime.utcnow()

    def add_note(self, note: str) -> None:
        """Add incident note.

        Args:
            note: Note text
        """
        self.notes.append(note)
        self.updated_at = datetime.utcnow()

    def close(self) -> None:
        """Close the incident."""
        self.status = IncidentStatus.CLOSED
        self.closed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "incident_id": self.incident_id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "closed_at": (
                self.closed_at.isoformat() if self.closed_at else None
            ),
            "triggered_alerts": self.triggered_alerts,
            "triggered_events": self.triggered_events,
            "response_actions": self.response_actions,
            "assigned_to": self.assigned_to,
            "notes": self.notes,
        }


class ResponseAction:
    """Base class for threat response actions."""

    async def execute(self, target: str, details: Dict[str, Any]) -> bool:
        """Execute the response action.

        Args:
            target: Target of action
            details: Action details

        Returns:
            True if successful
        """
        raise NotImplementedError


class IPBlockAction(ResponseAction):
    """Action to block an IP address."""

    def __init__(
        self,
        default_block_duration_hours: int = 24,
        callback: Optional[Callable[[str, str], Any]] = None
    ):
        """Initialize IP block action.

        Args:
            default_block_duration_hours: Default block duration
            callback: Optional callback when IP is blocked
        """
        self.default_block_duration_hours = default_block_duration_hours
        self.callback = callback

    async def execute(self, target: str, details: Dict[str, Any]) -> bool:
        """Execute IP block.

        Args:
            target: IP address to block
            details: Block details (reason, duration, etc.)

        Returns:
            True if successful
        """
        try:
            # Validate IP
            ipaddress.ip_address(target)

            duration_hours = details.get(
                "duration_hours",
                self.default_block_duration_hours
            )
            is_permanent = details.get("permanent", False)
            reason = details.get("reason", "Security threat detected")

            blocked_until = None
            if not is_permanent and duration_hours > 0:
                blocked_until = datetime.utcnow() + timedelta(hours=duration_hours)

            logger.warning(f"Blocking IP: {target}", extra={"reason": reason})

            # Invoke callback if provided
            if self.callback:
                try:
                    if asyncio.iscoroutinefunction(self.callback):
                        await self.callback(target, reason)
                    else:
                        self.callback(target, reason)
                except Exception as e:
                    logger.error(f"Error in IP block callback: {e}")

            return True

        except Exception as e:
            logger.error(f"Error executing IP block action: {e}", exc_info=True)
            return False


class SessionRevocationAction(ResponseAction):
    """Action to revoke user sessions."""

    def __init__(self, callback: Optional[Callable[[str], Any]] = None):
        """Initialize session revocation action.

        Args:
            callback: Optional callback when session is revoked
        """
        self.callback = callback

    async def execute(self, target: str, details: Dict[str, Any]) -> bool:
        """Execute session revocation.

        Args:
            target: Session or user ID to revoke
            details: Revocation details

        Returns:
            True if successful
        """
        try:
            reason = details.get("reason", "Security incident detected")
            logger.warning(f"Revoking session: {target}", extra={"reason": reason})

            if self.callback:
                try:
                    if asyncio.iscoroutinefunction(self.callback):
                        await self.callback(target)
                    else:
                        self.callback(target)
                except Exception as e:
                    logger.error(f"Error in revocation callback: {e}")

            return True

        except Exception as e:
            logger.error(f"Error executing revocation action: {e}", exc_info=True)
            return False


class ThreatResponder(EventProcessor):
    """Orchestrates automated threat response."""

    def __init__(self):
        """Initialize threat responder."""
        self.blocked_ips: Dict[str, BlockedIP] = {}
        self.incidents: Dict[str, SecurityIncident] = {}
        self.actions: Dict[ThreatAction, ResponseAction] = {}
        self.response_callbacks: List[Callable[[SecurityIncident], Any]] = []

        # Response rules: mapping event types to actions
        self.response_rules: Dict[SecurityEventType, List[ThreatAction]] = {
            SecurityEventType.BRUTE_FORCE_ATTEMPT: [
                ThreatAction.RATE_LIMIT,
                ThreatAction.BLOCK_IP,
            ],
            SecurityEventType.SQL_INJECTION_ATTEMPT: [
                ThreatAction.BLOCK_IP,
                ThreatAction.NOTIFY,
            ],
            SecurityEventType.PRIVILEGE_ESCALATION: [
                ThreatAction.REVOKE_SESSION,
                ThreatAction.DISABLE_USER,
                ThreatAction.NOTIFY,
            ],
            SecurityEventType.UNAUTHORIZED_DATA_ACCESS: [
                ThreatAction.RESTRICT_RESOURCE,
                ThreatAction.REVOKE_SESSION,
                ThreatAction.NOTIFY,
            ],
        }

    async def process(self, event: SecurityEvent) -> None:
        """Process event and trigger responses.

        Args:
            event: Security event
        """
        try:
            # Check if event triggers responses
            if event.event_type in self.response_rules:
                await self._handle_threat_event(event)

        except Exception as e:
            logger.error(f"Error processing threat response: {e}", exc_info=True)

    async def _handle_threat_event(self, event: SecurityEvent) -> None:
        """Handle a threat event with responses.

        Args:
            event: Threat event
        """
        # Create incident
        incident = SecurityIncident(
            incident_id=f"incident_{event.event_id}",
            title=f"Security Incident: {event.event_type.value}",
            description=f"Incident triggered by event {event.event_id}",
            severity=event.severity,
        )

        incident.triggered_events.append(event.event_id)

        # Execute response actions
        actions = self.response_rules.get(event.event_type, [])
        for action_type in actions:
            success = await self._execute_action(action_type, event, incident)
            if success:
                incident.add_action(
                    action_type,
                    event.source_ip or event.user_id or "unknown"
                )

        # Store incident
        self.incidents[incident.incident_id] = incident

        # Invoke callbacks
        for callback in self.response_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(incident)
                else:
                    callback(incident)
            except Exception as e:
                logger.error(f"Error in incident callback: {e}")

    async def _execute_action(
        self,
        action_type: ThreatAction,
        event: SecurityEvent,
        incident: SecurityIncident
    ) -> bool:
        """Execute a specific response action.

        Args:
            action_type: Type of action to execute
            event: Triggering event
            incident: Associated incident

        Returns:
            True if successful
        """
        try:
            if action_type not in self.actions:
                logger.warning(f"No handler for action: {action_type}")
                return False

            action = self.actions[action_type]
            target = event.source_ip or event.user_id or "unknown"
            details = {
                "event_id": event.event_id,
                "reason": f"Triggered by {event.event_type.value}",
                "incident_id": incident.incident_id,
            }

            return await action.execute(target, details)

        except Exception as e:
            logger.error(f"Error executing action {action_type}: {e}", exc_info=True)
            return False

    async def block_ip(
        self,
        ip_address: str,
        reason: str = "Security threat",
        duration_hours: int = 24,
        permanent: bool = False
    ) -> bool:
        """Block an IP address.

        Args:
            ip_address: IP to block
            reason: Blocking reason
            duration_hours: Duration in hours (0 for permanent)
            permanent: If True, permanently block

        Returns:
            True if successful
        """
        try:
            blocked_until = None
            if not permanent and duration_hours > 0:
                blocked_until = datetime.utcnow() + timedelta(hours=duration_hours)

            blocked_ip = BlockedIP(
                ip_address=ip_address,
                blocked_until=blocked_until,
                reason=reason,
                permanent=permanent,
            )

            self.blocked_ips[ip_address] = blocked_ip
            logger.warning(f"IP blocked: {ip_address}", extra={"reason": reason})
            return True

        except Exception as e:
            logger.error(f"Error blocking IP: {e}", exc_info=True)
            return False

    async def unblock_ip(self, ip_address: str) -> bool:
        """Unblock an IP address.

        Args:
            ip_address: IP to unblock

        Returns:
            True if successful
        """
        if ip_address in self.blocked_ips:
            del self.blocked_ips[ip_address]
            logger.info(f"IP unblocked: {ip_address}")
            return True
        return False

    async def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if IP is blocked.

        Args:
            ip_address: IP to check

        Returns:
            True if blocked
        """
        if ip_address in self.blocked_ips:
            blocked_ip = self.blocked_ips[ip_address]
            return blocked_ip.is_active()
        return False

    async def get_blocked_ips(self) -> List[BlockedIP]:
        """Get list of blocked IPs.

        Returns:
            List of blocked IPs
        """
        # Clean up expired blocks
        now = datetime.utcnow()
        expired = [
            ip for ip, data in self.blocked_ips.items()
            if not data.is_active()
        ]
        for ip in expired:
            del self.blocked_ips[ip]

        return list(self.blocked_ips.values())

    async def get_incident(self, incident_id: str) -> Optional[SecurityIncident]:
        """Get a specific incident.

        Args:
            incident_id: Incident ID

        Returns:
            SecurityIncident or None
        """
        return self.incidents.get(incident_id)

    async def get_open_incidents(self) -> List[SecurityIncident]:
        """Get open incidents.

        Returns:
            List of open incidents
        """
        return [
            i for i in self.incidents.values()
            if i.status != IncidentStatus.CLOSED
        ]

    def register_action(
        self,
        action_type: ThreatAction,
        action: ResponseAction
    ) -> None:
        """Register a response action handler.

        Args:
            action_type: Action type
            action: Action implementation
        """
        self.actions[action_type] = action

    def on_incident(self, callback: Callable[[SecurityIncident], Any]) -> None:
        """Register incident callback.

        Args:
            callback: Callable to invoke on incidents
        """
        self.response_callbacks.append(callback)
