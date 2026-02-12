"""
Automated Threat Response
Automated actions in response to security threats

Actions:
- Block IP addresses
- Revoke sessions
- Lock user accounts
- Rate limiting enforcement
- Automated incident creation
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from enum import Enum
from dataclasses import dataclass
import redis.asyncio as aioredis
import json

from security_monitor import (
    SecurityEvent,
    SecurityEventType,
    SecuritySeverity,
    log_security_event
)

logger = logging.getLogger(__name__)


class ThreatResponseAction(str, Enum):
    """Threat response action types"""
    BLOCK_IP = "block_ip"
    RATE_LIMIT_IP = "rate_limit_ip"
    REVOKE_SESSION = "revoke_session"
    LOCK_USER = "lock_user"
    REQUIRE_MFA = "require_mfa"
    NOTIFY_SECURITY_TEAM = "notify_security_team"
    CREATE_INCIDENT = "create_incident"
    QUARANTINE_DATA = "quarantine_data"
    FORCE_PASSWORD_RESET = "force_password_reset"


class ResponseStatus(str, Enum):
    """Response action status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


@dataclass
class ThreatResponse:
    """Threat response action"""
    response_id: str
    action: ThreatResponseAction
    target: str  # IP, user_id, session_id, etc.
    reason: str
    triggered_by_event: SecurityEvent
    created_at: datetime
    status: ResponseStatus = ResponseStatus.PENDING
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "response_id": self.response_id,
            "action": self.action.value,
            "target": self.target,
            "reason": self.reason,
            "triggered_by_event": self.triggered_by_event.to_dict(),
            "created_at": self.created_at.isoformat(),
            "status": self.status.value,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error": self.error,
            "metadata": self.metadata
        }


class ThreatResponseSystem:
    """Automated threat response system"""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        auto_block_enabled: bool = True,
        auto_response_enabled: bool = True
    ):
        """
        Initialize threat response system

        Args:
            redis_url: Redis connection URL
            auto_block_enabled: Enable automatic IP blocking
            auto_response_enabled: Enable automated responses
        """
        self.redis_url = redis_url
        self.auto_block_enabled = auto_block_enabled
        self.auto_response_enabled = auto_response_enabled

        self.redis: Optional[aioredis.Redis] = None
        self.running = False

        # Track responses
        self.responses: Dict[str, ThreatResponse] = {}

        # Blocked IPs (in-memory cache)
        self.blocked_ips: Set[str] = set()

        # Locked users (in-memory cache)
        self.locked_users: Set[str] = set()

        # Revoked sessions (in-memory cache)
        self.revoked_sessions: Set[str] = set()

    async def start(self):
        """Start threat response system"""
        logger.info("Starting Threat Response System")
        self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
        self.running = True

        # Load blocked IPs from Redis
        await self._load_blocked_ips()

        # Load locked users from Redis
        await self._load_locked_users()

        # Load revoked sessions from Redis
        await self._load_revoked_sessions()

        # Start background cleanup
        asyncio.create_task(self._cleanup_expired())

        logger.info("Threat Response System started")

    async def stop(self):
        """Stop threat response system"""
        logger.info("Stopping Threat Response System")
        self.running = False

        if self.redis:
            await self.redis.close()

        logger.info("Threat Response System stopped")

    async def handle_security_event(self, event: SecurityEvent) -> List[ThreatResponse]:
        """
        Handle a security event and determine appropriate response

        Args:
            event: Security event to handle

        Returns:
            List of threat responses triggered
        """
        if not self.auto_response_enabled:
            return []

        responses = []

        # Determine appropriate responses based on event type and severity
        actions = self._determine_actions(event)

        for action in actions:
            response = await self._execute_action(action, event)
            if response:
                responses.append(response)

        return responses

    def _determine_actions(self, event: SecurityEvent) -> List[ThreatResponseAction]:
        """Determine appropriate actions for a security event"""
        actions = []

        # Brute force attack
        if event.event_type == SecurityEventType.BRUTE_FORCE:
            actions.append(ThreatResponseAction.BLOCK_IP)
            actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)
            if event.severity == SecuritySeverity.CRITICAL:
                actions.append(ThreatResponseAction.CREATE_INCIDENT)

        # Privilege escalation
        elif event.event_type == SecurityEventType.PRIVILEGE_ESCALATION:
            actions.append(ThreatResponseAction.LOCK_USER)
            actions.append(ThreatResponseAction.REVOKE_SESSION)
            actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)
            actions.append(ThreatResponseAction.CREATE_INCIDENT)

        # Session hijacking
        elif event.event_type == SecurityEventType.SESSION_HIJACK:
            actions.append(ThreatResponseAction.REVOKE_SESSION)
            actions.append(ThreatResponseAction.LOCK_USER)
            actions.append(ThreatResponseAction.FORCE_PASSWORD_RESET)
            actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)
            actions.append(ThreatResponseAction.CREATE_INCIDENT)

        # Data exfiltration
        elif event.event_type == SecurityEventType.DATA_EXPORT:
            if event.severity in [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL]:
                actions.append(ThreatResponseAction.LOCK_USER)
                actions.append(ThreatResponseAction.REVOKE_SESSION)
                actions.append(ThreatResponseAction.QUARANTINE_DATA)
                actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)
                actions.append(ThreatResponseAction.CREATE_INCIDENT)

        # SQL injection
        elif event.event_type == SecurityEventType.SQL_INJECTION:
            actions.append(ThreatResponseAction.BLOCK_IP)
            actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)
            actions.append(ThreatResponseAction.CREATE_INCIDENT)

        # XSS attempt
        elif event.event_type == SecurityEventType.XSS_ATTEMPT:
            actions.append(ThreatResponseAction.BLOCK_IP)
            actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)

        # Rate limit exceeded
        elif event.event_type == SecurityEventType.RATE_LIMIT_EXCEEDED:
            actions.append(ThreatResponseAction.RATE_LIMIT_IP)

        # Suspicious activity
        elif event.event_type == SecurityEventType.SUSPICIOUS_ACTIVITY:
            if event.severity == SecuritySeverity.HIGH:
                actions.append(ThreatResponseAction.REQUIRE_MFA)
                actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)
            elif event.severity == SecuritySeverity.CRITICAL:
                actions.append(ThreatResponseAction.LOCK_USER)
                actions.append(ThreatResponseAction.REVOKE_SESSION)
                actions.append(ThreatResponseAction.NOTIFY_SECURITY_TEAM)

        # Multiple auth failures
        elif event.event_type == SecurityEventType.AUTH_LOCKOUT:
            actions.append(ThreatResponseAction.RATE_LIMIT_IP)

        return actions

    async def _execute_action(
        self,
        action: ThreatResponseAction,
        event: SecurityEvent
    ) -> Optional[ThreatResponse]:
        """Execute a threat response action"""
        # Determine target
        target = self._get_target_for_action(action, event)
        if not target:
            logger.warning(f"No target for action {action.value}")
            return None

        # Create response record
        response = ThreatResponse(
            response_id=f"response-{action.value}-{datetime.utcnow().timestamp()}",
            action=action,
            target=target,
            reason=f"Automated response to {event.event_type.value}",
            triggered_by_event=event,
            created_at=datetime.utcnow()
        )

        self.responses[response.response_id] = response
        response.status = ResponseStatus.IN_PROGRESS

        try:
            # Execute action
            if action == ThreatResponseAction.BLOCK_IP:
                await self._block_ip(target, event)
            elif action == ThreatResponseAction.RATE_LIMIT_IP:
                await self._rate_limit_ip(target, event)
            elif action == ThreatResponseAction.REVOKE_SESSION:
                await self._revoke_session(target, event)
            elif action == ThreatResponseAction.LOCK_USER:
                await self._lock_user(target, event)
            elif action == ThreatResponseAction.REQUIRE_MFA:
                await self._require_mfa(target, event)
            elif action == ThreatResponseAction.FORCE_PASSWORD_RESET:
                await self._force_password_reset(target, event)
            elif action == ThreatResponseAction.QUARANTINE_DATA:
                await self._quarantine_data(target, event)
            elif action == ThreatResponseAction.CREATE_INCIDENT:
                await self._create_incident(target, event)
            elif action == ThreatResponseAction.NOTIFY_SECURITY_TEAM:
                await self._notify_security_team(target, event)

            response.status = ResponseStatus.COMPLETED
            response.completed_at = datetime.utcnow()

            logger.info(f"Executed threat response: {action.value} on {target}")

        except Exception as e:
            response.status = ResponseStatus.FAILED
            response.error = str(e)
            logger.error(f"Error executing threat response {action.value}: {e}", exc_info=True)

        return response

    def _get_target_for_action(
        self,
        action: ThreatResponseAction,
        event: SecurityEvent
    ) -> Optional[str]:
        """Get target for a specific action"""
        if action in [
            ThreatResponseAction.BLOCK_IP,
            ThreatResponseAction.RATE_LIMIT_IP
        ]:
            return event.ip_address

        elif action in [
            ThreatResponseAction.LOCK_USER,
            ThreatResponseAction.REQUIRE_MFA,
            ThreatResponseAction.FORCE_PASSWORD_RESET
        ]:
            return event.user_id

        elif action == ThreatResponseAction.REVOKE_SESSION:
            return event.session_id

        elif action in [
            ThreatResponseAction.QUARANTINE_DATA,
            ThreatResponseAction.CREATE_INCIDENT,
            ThreatResponseAction.NOTIFY_SECURITY_TEAM
        ]:
            return event.user_id or event.ip_address or "system"

        return None

    async def _block_ip(self, ip_address: str, event: SecurityEvent):
        """Block an IP address"""
        if not self.auto_block_enabled:
            logger.info(f"Auto-block disabled, would block IP: {ip_address}")
            return

        # Add to blocked IPs
        self.blocked_ips.add(ip_address)

        # Store in Redis with 24-hour expiration
        if self.redis:
            await self.redis.setex(
                f"security:blocked_ip:{ip_address}",
                86400,  # 24 hours
                json.dumps({
                    "blocked_at": datetime.utcnow().isoformat(),
                    "reason": event.event_type.value,
                    "event_id": event.to_dict().get("timestamp")
                })
            )

        logger.warning(f"Blocked IP address: {ip_address}")

    async def _rate_limit_ip(self, ip_address: str, event: SecurityEvent):
        """Apply rate limiting to an IP address"""
        if self.redis:
            # Set rate limit: 10 requests per minute
            key = f"security:rate_limit:{ip_address}"
            await self.redis.setex(key, 300, "10")  # 5 minutes

        logger.info(f"Applied rate limit to IP: {ip_address}")

    async def _revoke_session(self, session_id: str, event: SecurityEvent):
        """Revoke a session"""
        self.revoked_sessions.add(session_id)

        if self.redis:
            await self.redis.setex(
                f"security:revoked_session:{session_id}",
                86400,  # 24 hours
                json.dumps({
                    "revoked_at": datetime.utcnow().isoformat(),
                    "reason": event.event_type.value
                })
            )

        logger.warning(f"Revoked session: {session_id}")

    async def _lock_user(self, user_id: str, event: SecurityEvent):
        """Lock a user account"""
        self.locked_users.add(user_id)

        if self.redis:
            await self.redis.setex(
                f"security:locked_user:{user_id}",
                3600,  # 1 hour
                json.dumps({
                    "locked_at": datetime.utcnow().isoformat(),
                    "reason": event.event_type.value
                })
            )

        logger.warning(f"Locked user account: {user_id}")

    async def _require_mfa(self, user_id: str, event: SecurityEvent):
        """Require MFA for a user"""
        if self.redis:
            await self.redis.setex(
                f"security:require_mfa:{user_id}",
                86400,  # 24 hours
                json.dumps({
                    "required_at": datetime.utcnow().isoformat(),
                    "reason": event.event_type.value
                })
            )

        logger.info(f"Required MFA for user: {user_id}")

    async def _force_password_reset(self, user_id: str, event: SecurityEvent):
        """Force password reset for a user"""
        if self.redis:
            await self.redis.set(
                f"security:force_password_reset:{user_id}",
                json.dumps({
                    "forced_at": datetime.utcnow().isoformat(),
                    "reason": event.event_type.value
                })
            )

        logger.warning(f"Forced password reset for user: {user_id}")

    async def _quarantine_data(self, target: str, event: SecurityEvent):
        """Quarantine accessed data"""
        # This would integrate with data storage system
        logger.warning(f"Quarantine data access by: {target}")

    async def _create_incident(self, target: str, event: SecurityEvent):
        """Create security incident"""
        # This would integrate with incident management system
        logger.critical(f"Created security incident for: {event.event_type.value}")

    async def _notify_security_team(self, target: str, event: SecurityEvent):
        """Notify security team"""
        # This would integrate with alert manager
        logger.critical(f"Security team notification: {event.event_type.value}")

    async def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if an IP is blocked"""
        if ip_address in self.blocked_ips:
            return True

        # Check Redis
        if self.redis:
            result = await self.redis.exists(f"security:blocked_ip:{ip_address}")
            if result:
                self.blocked_ips.add(ip_address)
                return True

        return False

    async def is_user_locked(self, user_id: str) -> bool:
        """Check if a user is locked"""
        if user_id in self.locked_users:
            return True

        # Check Redis
        if self.redis:
            result = await self.redis.exists(f"security:locked_user:{user_id}")
            if result:
                self.locked_users.add(user_id)
                return True

        return False

    async def is_session_revoked(self, session_id: str) -> bool:
        """Check if a session is revoked"""
        if session_id in self.revoked_sessions:
            return True

        # Check Redis
        if self.redis:
            result = await self.redis.exists(f"security:revoked_session:{session_id}")
            if result:
                self.revoked_sessions.add(session_id)
                return True

        return False

    async def unblock_ip(self, ip_address: str):
        """Manually unblock an IP address"""
        self.blocked_ips.discard(ip_address)

        if self.redis:
            await self.redis.delete(f"security:blocked_ip:{ip_address}")

        logger.info(f"Unblocked IP address: {ip_address}")

    async def unlock_user(self, user_id: str):
        """Manually unlock a user account"""
        self.locked_users.discard(user_id)

        if self.redis:
            await self.redis.delete(f"security:locked_user:{user_id}")

        logger.info(f"Unlocked user account: {user_id}")

    async def _load_blocked_ips(self):
        """Load blocked IPs from Redis"""
        if not self.redis:
            return

        try:
            keys = await self.redis.keys("security:blocked_ip:*")
            for key in keys:
                ip = key.replace("security:blocked_ip:", "")
                self.blocked_ips.add(ip)

            logger.info(f"Loaded {len(self.blocked_ips)} blocked IPs")

        except Exception as e:
            logger.error(f"Error loading blocked IPs: {e}")

    async def _load_locked_users(self):
        """Load locked users from Redis"""
        if not self.redis:
            return

        try:
            keys = await self.redis.keys("security:locked_user:*")
            for key in keys:
                user_id = key.replace("security:locked_user:", "")
                self.locked_users.add(user_id)

            logger.info(f"Loaded {len(self.locked_users)} locked users")

        except Exception as e:
            logger.error(f"Error loading locked users: {e}")

    async def _load_revoked_sessions(self):
        """Load revoked sessions from Redis"""
        if not self.redis:
            return

        try:
            keys = await self.redis.keys("security:revoked_session:*")
            for key in keys:
                session_id = key.replace("security:revoked_session:", "")
                self.revoked_sessions.add(session_id)

            logger.info(f"Loaded {len(self.revoked_sessions)} revoked sessions")

        except Exception as e:
            logger.error(f"Error loading revoked sessions: {e}")

    async def _cleanup_expired(self):
        """Clean up expired entries"""
        logger.info("Cleanup task started")

        while self.running:
            try:
                await asyncio.sleep(300)  # Every 5 minutes

                # Reload from Redis to sync with expirations
                await self._load_blocked_ips()
                await self._load_locked_users()
                await self._load_revoked_sessions()

            except Exception as e:
                logger.error(f"Error in cleanup task: {e}", exc_info=True)

    def get_statistics(self) -> Dict[str, Any]:
        """Get threat response statistics"""
        return {
            "total_responses": len(self.responses),
            "by_action": self._count_by_action(),
            "by_status": self._count_by_status(),
            "blocked_ips": len(self.blocked_ips),
            "locked_users": len(self.locked_users),
            "revoked_sessions": len(self.revoked_sessions),
            "auto_block_enabled": self.auto_block_enabled,
            "auto_response_enabled": self.auto_response_enabled
        }

    def _count_by_action(self) -> Dict[str, int]:
        """Count responses by action"""
        counts = {}
        for response in self.responses.values():
            action = response.action.value
            counts[action] = counts.get(action, 0) + 1
        return counts

    def _count_by_status(self) -> Dict[str, int]:
        """Count responses by status"""
        counts = {}
        for response in self.responses.values():
            status = response.status.value
            counts[status] = counts.get(status, 0) + 1
        return counts

    def get_blocked_ips(self) -> List[str]:
        """Get list of blocked IPs"""
        return list(self.blocked_ips)

    def get_locked_users(self) -> List[str]:
        """Get list of locked users"""
        return list(self.locked_users)


# Global threat response system instance
_threat_response: Optional[ThreatResponseSystem] = None


async def get_threat_response_system() -> ThreatResponseSystem:
    """Get or create the global threat response system instance"""
    global _threat_response
    if _threat_response is None:
        _threat_response = ThreatResponseSystem()
        await _threat_response.start()
    return _threat_response
