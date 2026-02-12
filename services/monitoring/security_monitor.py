"""
Security Monitoring Service
Real-time security event monitoring for CTAFleet radio-fleet-dispatch

Monitors:
- Authentication attempts (success/failure)
- Authorization failures
- Data access patterns
- API usage anomalies
- Session management
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass, field
import json
from collections import defaultdict
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)


class SecurityEventType(str, Enum):
    """Security event types"""
    AUTH_SUCCESS = "auth_success"
    AUTH_FAILURE = "auth_failure"
    AUTH_LOCKOUT = "auth_lockout"
    AUTHZ_DENIED = "authz_denied"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    DATA_ACCESS = "data_access"
    DATA_EXPORT = "data_export"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    BRUTE_FORCE = "brute_force"
    SESSION_HIJACK = "session_hijack"
    SQL_INJECTION = "sql_injection"
    XSS_ATTEMPT = "xss_attempt"
    CSRF_VIOLATION = "csrf_violation"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    UNUSUAL_TIME = "unusual_time"
    UNUSUAL_LOCATION = "unusual_location"


class SecuritySeverity(str, Enum):
    """Security event severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityEvent:
    """Security event data structure"""
    event_type: SecurityEventType
    severity: SecuritySeverity
    timestamp: datetime
    user_id: Optional[str] = None
    username: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    resource: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)
    session_id: Optional[str] = None
    organization_id: Optional[str] = None
    geolocation: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "username": self.username,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "endpoint": self.endpoint,
            "method": self.method,
            "resource": self.resource,
            "details": self.details,
            "session_id": self.session_id,
            "organization_id": self.organization_id,
            "geolocation": self.geolocation,
        }


class SecurityMonitor:
    """Real-time security monitoring service"""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        event_retention_hours: int = 72,
        alert_threshold_high: int = 5,
        alert_threshold_critical: int = 3,
    ):
        """
        Initialize security monitor

        Args:
            redis_url: Redis connection URL for event storage
            event_retention_hours: How long to keep events in hot storage
            alert_threshold_high: Number of high severity events to trigger alert
            alert_threshold_critical: Number of critical events to trigger alert
        """
        self.redis_url = redis_url
        self.event_retention_hours = event_retention_hours
        self.alert_threshold_high = alert_threshold_high
        self.alert_threshold_critical = alert_threshold_critical

        self.redis: Optional[aioredis.Redis] = None
        self.event_queue: asyncio.Queue = asyncio.Queue()
        self.running = False

        # In-memory tracking for fast pattern detection
        self.auth_failures: Dict[str, List[datetime]] = defaultdict(list)
        self.ip_requests: Dict[str, List[datetime]] = defaultdict(list)
        self.user_activity: Dict[str, List[SecurityEvent]] = defaultdict(list)

    async def start(self):
        """Start the security monitor"""
        logger.info("Starting Security Monitor")
        self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
        self.running = True

        # Start background tasks
        asyncio.create_task(self._process_events())
        asyncio.create_task(self._cleanup_old_data())
        asyncio.create_task(self._detect_patterns())

        logger.info("Security Monitor started successfully")

    async def stop(self):
        """Stop the security monitor"""
        logger.info("Stopping Security Monitor")
        self.running = False

        if self.redis:
            await self.redis.close()

        logger.info("Security Monitor stopped")

    async def log_event(self, event: SecurityEvent):
        """
        Log a security event

        Args:
            event: SecurityEvent to log
        """
        # Add to processing queue
        await self.event_queue.put(event)

        # Update in-memory tracking for fast detection
        if event.event_type == SecurityEventType.AUTH_FAILURE:
            key = event.ip_address or event.username
            if key:
                self.auth_failures[key].append(event.timestamp)
                # Keep only recent failures
                cutoff = datetime.utcnow() - timedelta(minutes=15)
                self.auth_failures[key] = [
                    ts for ts in self.auth_failures[key] if ts > cutoff
                ]

        if event.ip_address:
            self.ip_requests[event.ip_address].append(event.timestamp)
            # Keep only recent requests
            cutoff = datetime.utcnow() - timedelta(minutes=5)
            self.ip_requests[event.ip_address] = [
                ts for ts in self.ip_requests[event.ip_address] if ts > cutoff
            ]

        if event.user_id:
            self.user_activity[event.user_id].append(event)
            # Keep only recent activity
            cutoff = datetime.utcnow() - timedelta(hours=1)
            self.user_activity[event.user_id] = [
                e for e in self.user_activity[event.user_id]
                if e.timestamp > cutoff
            ]

    async def _process_events(self):
        """Background task to process events from queue"""
        logger.info("Event processor started")

        while self.running:
            try:
                # Get event from queue with timeout
                event = await asyncio.wait_for(
                    self.event_queue.get(),
                    timeout=1.0
                )

                # Store in Redis with expiration
                await self._store_event(event)

                # Check for immediate patterns
                await self._check_immediate_threats(event)

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing event: {e}", exc_info=True)

    async def _store_event(self, event: SecurityEvent):
        """Store event in Redis"""
        if not self.redis:
            return

        try:
            # Store in time-series sorted set
            key = f"security:events:{event.event_type.value}"
            score = event.timestamp.timestamp()
            value = json.dumps(event.to_dict())

            await self.redis.zadd(key, {value: score})

            # Set expiration on the key
            await self.redis.expire(
                key,
                self.event_retention_hours * 3600
            )

            # Also store in severity index
            severity_key = f"security:severity:{event.severity.value}"
            await self.redis.zadd(severity_key, {value: score})
            await self.redis.expire(severity_key, self.event_retention_hours * 3600)

            # Store user activity index
            if event.user_id:
                user_key = f"security:user:{event.user_id}"
                await self.redis.zadd(user_key, {value: score})
                await self.redis.expire(user_key, self.event_retention_hours * 3600)

        except Exception as e:
            logger.error(f"Error storing event in Redis: {e}", exc_info=True)

    async def _check_immediate_threats(self, event: SecurityEvent):
        """Check for immediate threat patterns"""
        # Brute force detection
        if event.event_type == SecurityEventType.AUTH_FAILURE:
            await self._check_brute_force(event)

        # Rate limiting
        if event.ip_address:
            await self._check_rate_limit(event)

        # Critical events always trigger alerts
        if event.severity == SecuritySeverity.CRITICAL:
            await self._trigger_alert(event, "Critical security event detected")

    async def _check_brute_force(self, event: SecurityEvent):
        """Detect brute force attacks"""
        key = event.ip_address or event.username
        if not key:
            return

        failure_count = len(self.auth_failures.get(key, []))

        # More than 5 failures in 15 minutes = brute force
        if failure_count >= 5:
            brute_force_event = SecurityEvent(
                event_type=SecurityEventType.BRUTE_FORCE,
                severity=SecuritySeverity.HIGH,
                timestamp=datetime.utcnow(),
                ip_address=event.ip_address,
                username=event.username,
                details={
                    "failure_count": failure_count,
                    "time_window": "15 minutes",
                    "original_event": event.to_dict()
                }
            )
            await self.log_event(brute_force_event)
            await self._trigger_alert(
                brute_force_event,
                f"Brute force attack detected from {key}"
            )

    async def _check_rate_limit(self, event: SecurityEvent):
        """Check for rate limit violations"""
        if not event.ip_address:
            return

        request_count = len(self.ip_requests.get(event.ip_address, []))

        # More than 100 requests in 5 minutes
        if request_count > 100:
            rate_limit_event = SecurityEvent(
                event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
                severity=SecuritySeverity.MEDIUM,
                timestamp=datetime.utcnow(),
                ip_address=event.ip_address,
                details={
                    "request_count": request_count,
                    "time_window": "5 minutes",
                    "threshold": 100
                }
            )
            await self.log_event(rate_limit_event)

    async def _detect_patterns(self):
        """Background task to detect complex patterns"""
        logger.info("Pattern detector started")

        while self.running:
            try:
                # Run pattern detection every minute
                await asyncio.sleep(60)

                # Detect privilege escalation attempts
                await self._detect_privilege_escalation()

                # Detect session anomalies
                await self._detect_session_anomalies()

                # Detect unusual access patterns
                await self._detect_unusual_patterns()

            except Exception as e:
                logger.error(f"Error in pattern detection: {e}", exc_info=True)

    async def _detect_privilege_escalation(self):
        """Detect privilege escalation attempts"""
        for user_id, events in self.user_activity.items():
            # Look for multiple authorization denials
            authz_denials = [
                e for e in events
                if e.event_type == SecurityEventType.AUTHZ_DENIED
            ]

            if len(authz_denials) >= 3:
                escalation_event = SecurityEvent(
                    event_type=SecurityEventType.PRIVILEGE_ESCALATION,
                    severity=SecuritySeverity.HIGH,
                    timestamp=datetime.utcnow(),
                    user_id=user_id,
                    details={
                        "denial_count": len(authz_denials),
                        "attempted_resources": [
                            e.resource for e in authz_denials if e.resource
                        ]
                    }
                )
                await self.log_event(escalation_event)
                await self._trigger_alert(
                    escalation_event,
                    f"Privilege escalation attempt by user {user_id}"
                )

    async def _detect_session_anomalies(self):
        """Detect session hijacking attempts"""
        # Group events by session
        session_events: Dict[str, List[SecurityEvent]] = defaultdict(list)
        for events in self.user_activity.values():
            for event in events:
                if event.session_id:
                    session_events[event.session_id].append(event)

        for session_id, events in session_events.items():
            # Check for multiple IPs in same session
            ips = {e.ip_address for e in events if e.ip_address}
            if len(ips) > 1:
                hijack_event = SecurityEvent(
                    event_type=SecurityEventType.SESSION_HIJACK,
                    severity=SecuritySeverity.CRITICAL,
                    timestamp=datetime.utcnow(),
                    session_id=session_id,
                    details={
                        "ip_addresses": list(ips),
                        "event_count": len(events)
                    }
                )
                await self.log_event(hijack_event)
                await self._trigger_alert(
                    hijack_event,
                    f"Possible session hijacking detected: {session_id}"
                )

    async def _detect_unusual_patterns(self):
        """Detect unusual access patterns"""
        current_hour = datetime.utcnow().hour

        # Business hours: 6 AM to 10 PM
        is_business_hours = 6 <= current_hour <= 22

        if not is_business_hours:
            # Check for unusual activity during off-hours
            for user_id, events in self.user_activity.items():
                recent_events = [
                    e for e in events
                    if e.timestamp > datetime.utcnow() - timedelta(minutes=30)
                ]

                if len(recent_events) > 10:
                    unusual_event = SecurityEvent(
                        event_type=SecurityEventType.UNUSUAL_TIME,
                        severity=SecuritySeverity.MEDIUM,
                        timestamp=datetime.utcnow(),
                        user_id=user_id,
                        details={
                            "event_count": len(recent_events),
                            "time": datetime.utcnow().isoformat(),
                            "note": "High activity during off-hours"
                        }
                    )
                    await self.log_event(unusual_event)

    async def _cleanup_old_data(self):
        """Clean up old data from memory"""
        logger.info("Cleanup task started")

        while self.running:
            try:
                # Clean up every 5 minutes
                await asyncio.sleep(300)

                cutoff_auth = datetime.utcnow() - timedelta(minutes=15)
                cutoff_requests = datetime.utcnow() - timedelta(minutes=5)
                cutoff_activity = datetime.utcnow() - timedelta(hours=1)

                # Clean auth failures
                for key in list(self.auth_failures.keys()):
                    self.auth_failures[key] = [
                        ts for ts in self.auth_failures[key] if ts > cutoff_auth
                    ]
                    if not self.auth_failures[key]:
                        del self.auth_failures[key]

                # Clean IP requests
                for ip in list(self.ip_requests.keys()):
                    self.ip_requests[ip] = [
                        ts for ts in self.ip_requests[ip] if ts > cutoff_requests
                    ]
                    if not self.ip_requests[ip]:
                        del self.ip_requests[ip]

                # Clean user activity
                for user_id in list(self.user_activity.keys()):
                    self.user_activity[user_id] = [
                        e for e in self.user_activity[user_id]
                        if e.timestamp > cutoff_activity
                    ]
                    if not self.user_activity[user_id]:
                        del self.user_activity[user_id]

                logger.debug("Cleanup completed")

            except Exception as e:
                logger.error(f"Error in cleanup task: {e}", exc_info=True)

    async def _trigger_alert(self, event: SecurityEvent, message: str):
        """
        Trigger an alert (to be implemented by alert manager)

        Args:
            event: Security event that triggered alert
            message: Alert message
        """
        logger.warning(f"SECURITY ALERT: {message}")
        logger.warning(f"Event details: {event.to_dict()}")

        # Store alert in Redis
        if self.redis:
            alert_key = "security:alerts"
            alert_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": message,
                "event": event.to_dict()
            }
            await self.redis.zadd(
                alert_key,
                {json.dumps(alert_data): datetime.utcnow().timestamp()}
            )
            await self.redis.expire(alert_key, 86400 * 7)  # 7 days

    async def get_events(
        self,
        event_type: Optional[SecurityEventType] = None,
        severity: Optional[SecuritySeverity] = None,
        user_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[SecurityEvent]:
        """
        Query security events

        Args:
            event_type: Filter by event type
            severity: Filter by severity
            user_id: Filter by user
            start_time: Start of time range
            end_time: End of time range
            limit: Maximum number of events to return

        Returns:
            List of SecurityEvent objects
        """
        if not self.redis:
            return []

        try:
            # Determine which key to query
            if event_type:
                key = f"security:events:{event_type.value}"
            elif severity:
                key = f"security:severity:{severity.value}"
            elif user_id:
                key = f"security:user:{user_id}"
            else:
                # Query all event types
                keys = await self.redis.keys("security:events:*")
                if not keys:
                    return []
                key = keys[0]  # Just use first key for now

            # Calculate score range
            min_score = start_time.timestamp() if start_time else "-inf"
            max_score = end_time.timestamp() if end_time else "+inf"

            # Query Redis
            results = await self.redis.zrevrangebyscore(
                key,
                max_score,
                min_score,
                start=0,
                num=limit
            )

            # Parse events
            events = []
            for result in results:
                try:
                    data = json.loads(result)
                    event = SecurityEvent(
                        event_type=SecurityEventType(data["event_type"]),
                        severity=SecuritySeverity(data["severity"]),
                        timestamp=datetime.fromisoformat(data["timestamp"]),
                        user_id=data.get("user_id"),
                        username=data.get("username"),
                        ip_address=data.get("ip_address"),
                        user_agent=data.get("user_agent"),
                        endpoint=data.get("endpoint"),
                        method=data.get("method"),
                        resource=data.get("resource"),
                        details=data.get("details", {}),
                        session_id=data.get("session_id"),
                        organization_id=data.get("organization_id"),
                        geolocation=data.get("geolocation"),
                    )
                    events.append(event)
                except Exception as e:
                    logger.error(f"Error parsing event: {e}")

            return events

        except Exception as e:
            logger.error(f"Error querying events: {e}", exc_info=True)
            return []

    async def get_statistics(
        self,
        start_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get security statistics

        Args:
            start_time: Start of time range (default: last 24 hours)

        Returns:
            Dictionary with security statistics
        """
        if not start_time:
            start_time = datetime.utcnow() - timedelta(hours=24)

        events = await self.get_events(
            start_time=start_time,
            limit=10000
        )

        # Calculate statistics
        stats = {
            "total_events": len(events),
            "by_type": defaultdict(int),
            "by_severity": defaultdict(int),
            "unique_users": set(),
            "unique_ips": set(),
            "time_range": {
                "start": start_time.isoformat(),
                "end": datetime.utcnow().isoformat()
            }
        }

        for event in events:
            stats["by_type"][event.event_type.value] += 1
            stats["by_severity"][event.severity.value] += 1
            if event.user_id:
                stats["unique_users"].add(event.user_id)
            if event.ip_address:
                stats["unique_ips"].add(event.ip_address)

        stats["unique_users"] = len(stats["unique_users"])
        stats["unique_ips"] = len(stats["unique_ips"])
        stats["by_type"] = dict(stats["by_type"])
        stats["by_severity"] = dict(stats["by_severity"])

        return stats


# Global monitor instance
_monitor: Optional[SecurityMonitor] = None


async def get_security_monitor() -> SecurityMonitor:
    """Get or create the global security monitor instance"""
    global _monitor
    if _monitor is None:
        _monitor = SecurityMonitor()
        await _monitor.start()
    return _monitor


async def log_security_event(event: SecurityEvent):
    """Convenience function to log a security event"""
    monitor = await get_security_monitor()
    await monitor.log_event(event)
