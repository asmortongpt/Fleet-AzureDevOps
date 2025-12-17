"""Real-time security event monitoring and analytics.

This module provides comprehensive security event monitoring with:
- Event collection and correlation
- Behavioral analysis
- Real-time metrics and alerting
- Integration with SIEM systems
- Automatic threat response triggering
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
import hashlib
import uuid

from fastapi import FastAPI
import redis
from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, Boolean
from sqlalchemy.orm import Session

# Configure logging
logger = logging.getLogger(__name__)


class SecurityEventType(str, Enum):
    """Types of security events to monitor."""

    # Authentication events
    AUTH_SUCCESS = "auth_success"
    AUTH_FAILURE = "auth_failure"
    AUTH_ATTEMPT = "auth_attempt"
    SESSION_CREATED = "session_created"
    SESSION_TERMINATED = "session_terminated"

    # Authorization events
    AUTHZ_GRANTED = "authz_granted"
    AUTHZ_DENIED = "authz_denied"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    PERMISSION_CHANGE = "permission_change"

    # Data access events
    DATA_ACCESS = "data_access"
    DATA_MODIFIED = "data_modified"
    DATA_DELETED = "data_deleted"
    BULK_DATA_ACCESS = "bulk_data_access"
    UNAUTHORIZED_DATA_ACCESS = "unauthorized_data_access"

    # System events
    CONFIG_CHANGED = "config_changed"
    POLICY_VIOLATED = "policy_violated"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    API_ERROR = "api_error"

    # Security events
    MALICIOUS_PAYLOAD = "malicious_payload"
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt"
    XSS_ATTEMPT = "xss_attempt"
    CSRF_ATTEMPT = "csrf_attempt"
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt"
    SUSPICIOUS_IP = "suspicious_ip"
    UNUSUAL_PATTERN = "unusual_pattern"
    ANOMALY_DETECTED = "anomaly_detected"

    # Network events
    DDOS_DETECTED = "ddos_detected"
    PORT_SCAN_DETECTED = "port_scan_detected"
    UNUSUAL_TRAFFIC = "unusual_traffic"

    # Threat response
    THREAT_BLOCKED = "threat_blocked"
    THREAT_ESCALATED = "threat_escalated"
    IP_BLOCKED = "ip_blocked"
    SESSION_REVOKED = "session_revoked"


class SeverityLevel(str, Enum):
    """Severity levels for security events."""

    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class SecurityEvent:
    """Represents a security event."""

    event_type: SecurityEventType
    severity: SeverityLevel
    source_ip: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None
    event_id: Optional[str] = None

    def __post_init__(self):
        """Initialize event defaults."""
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
        if self.event_id is None:
            self.event_id = str(uuid.uuid4())
        if self.details is None:
            self.details = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        data = asdict(self)
        data['event_type'] = self.event_type.value
        data['severity'] = self.severity.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

    def to_json(self) -> str:
        """Convert event to JSON string."""
        return json.dumps(self.to_dict(), default=str)


class EventCollector:
    """Collects and buffers security events."""

    def __init__(self, buffer_size: int = 1000, flush_interval: float = 5.0):
        """Initialize event collector.

        Args:
            buffer_size: Maximum events to buffer before flushing
            flush_interval: Seconds between automatic flushes
        """
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval
        self.events: List[SecurityEvent] = []
        self.lock = asyncio.Lock()
        self.listeners: List[Callable[[SecurityEvent], Any]] = []

    async def collect(self, event: SecurityEvent) -> None:
        """Collect a security event.

        Args:
            event: Security event to collect
        """
        async with self.lock:
            self.events.append(event)

            # Notify listeners immediately
            for listener in self.listeners:
                try:
                    if asyncio.iscoroutinefunction(listener):
                        await listener(event)
                    else:
                        listener(event)
                except Exception as e:
                    logger.error(f"Error in event listener: {e}", exc_info=True)

            # Flush if buffer is full
            if len(self.events) >= self.buffer_size:
                await self._flush()

    async def flush(self) -> List[SecurityEvent]:
        """Flush buffered events.

        Returns:
            List of flushed events
        """
        async with self.lock:
            return await self._flush()

    async def _flush(self) -> List[SecurityEvent]:
        """Internal flush implementation."""
        events = self.events[:]
        self.events.clear()
        return events

    def subscribe(self, listener: Callable[[SecurityEvent], Any]) -> None:
        """Subscribe to security events.

        Args:
            listener: Callable to invoke for each event
        """
        self.listeners.append(listener)

    def unsubscribe(self, listener: Callable[[SecurityEvent], Any]) -> None:
        """Unsubscribe from security events.

        Args:
            listener: Callable to remove
        """
        if listener in self.listeners:
            self.listeners.remove(listener)


class EventProcessor(ABC):
    """Base class for event processors."""

    @abstractmethod
    async def process(self, event: SecurityEvent) -> None:
        """Process a security event.

        Args:
            event: Event to process
        """
        pass


class SecurityMetrics:
    """Tracks security-related metrics."""

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize metrics tracker.

        Args:
            redis_client: Redis client for distributed metrics
        """
        self.redis = redis_client
        self.local_metrics: Dict[str, int] = {}
        self.lock = asyncio.Lock()

    async def increment(self, metric: str, value: int = 1) -> None:
        """Increment a metric counter.

        Args:
            metric: Metric name
            value: Increment amount
        """
        async with self.lock:
            self.local_metrics[metric] = self.local_metrics.get(metric, 0) + value

        if self.redis:
            try:
                self.redis.incr(f"security_metric:{metric}", value)
            except Exception as e:
                logger.error(f"Error incrementing Redis metric: {e}")

    async def get(self, metric: str) -> int:
        """Get metric value.

        Args:
            metric: Metric name

        Returns:
            Metric value
        """
        if self.redis:
            try:
                value = self.redis.get(f"security_metric:{metric}")
                return int(value) if value else 0
            except Exception as e:
                logger.error(f"Error reading Redis metric: {e}")

        async with self.lock:
            return self.local_metrics.get(metric, 0)

    async def set_gauge(self, metric: str, value: float) -> None:
        """Set a gauge metric.

        Args:
            metric: Metric name
            value: Metric value
        """
        async with self.lock:
            self.local_metrics[metric] = value

        if self.redis:
            try:
                self.redis.set(f"security_gauge:{metric}", value)
            except Exception as e:
                logger.error(f"Error setting Redis gauge: {e}")


class SecurityMonitor:
    """Main security monitoring orchestrator.

    Coordinates event collection, processing, alerting, and threat response.
    """

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        db_session: Optional[Session] = None,
        app: Optional[FastAPI] = None
    ):
        """Initialize security monitor.

        Args:
            redis_client: Redis client for caching and distributed state
            db_session: Database session for persistence
            app: FastAPI app for lifecycle management
        """
        self.redis = redis_client
        self.db = db_session
        self.app = app

        self.collector = EventCollector()
        self.metrics = SecurityMetrics(redis_client)
        self.processors: Dict[SecurityEventType, List[EventProcessor]] = {}
        self.threat_detected_callback: Optional[Callable] = None
        self.running = False

    async def start(self) -> None:
        """Start the security monitor."""
        self.running = True
        logger.info("Security monitor started")

        # Subscribe to events
        self.collector.subscribe(self._on_event)

    async def stop(self) -> None:
        """Stop the security monitor."""
        self.running = False
        # Flush remaining events
        await self.collector.flush()
        logger.info("Security monitor stopped")

    async def report_event(self, event: SecurityEvent) -> None:
        """Report a security event.

        Args:
            event: Event to report
        """
        if not self.running:
            logger.warning("Monitor not running, event not recorded")
            return

        # Update metrics
        await self.metrics.increment(f"events:{event.event_type.value}")
        await self.metrics.increment(f"severity:{event.severity.value}")

        # Collect event
        await self.collector.collect(event)

    async def _on_event(self, event: SecurityEvent) -> None:
        """Handle collected event.

        Args:
            event: Event to handle
        """
        try:
            # Process event through registered processors
            event_type = event.event_type
            if event_type in self.processors:
                for processor in self.processors[event_type]:
                    try:
                        await processor.process(event)
                    except Exception as e:
                        logger.error(f"Error in processor: {e}", exc_info=True)

            # Log critical events
            if event.severity in (SeverityLevel.CRITICAL, SeverityLevel.EMERGENCY):
                logger.critical(
                    f"Security event: {event.event_type.value}",
                    extra=event.to_dict()
                )

                # Trigger threat response callback
                if self.threat_detected_callback:
                    try:
                        if asyncio.iscoroutinefunction(self.threat_detected_callback):
                            await self.threat_detected_callback(event)
                        else:
                            self.threat_detected_callback(event)
                    except Exception as e:
                        logger.error(f"Error in threat callback: {e}", exc_info=True)

        except Exception as e:
            logger.error(f"Error processing event: {e}", exc_info=True)

    def register_processor(
        self,
        event_type: SecurityEventType,
        processor: EventProcessor
    ) -> None:
        """Register an event processor.

        Args:
            event_type: Event type to process
            processor: Processor instance
        """
        if event_type not in self.processors:
            self.processors[event_type] = []
        self.processors[event_type].append(processor)

    def on_threat_detected(self, callback: Callable) -> None:
        """Set threat detection callback.

        Args:
            callback: Callable to invoke on threat detection
        """
        self.threat_detected_callback = callback

    async def get_event_stats(
        self,
        time_window: Optional[timedelta] = None
    ) -> Dict[str, Any]:
        """Get event statistics.

        Args:
            time_window: Optional time window for statistics

        Returns:
            Dictionary with event statistics
        """
        stats = {
            "total_events": await self.metrics.get("events:total"),
            "by_type": {},
            "by_severity": {},
            "timestamp": datetime.utcnow().isoformat()
        }

        # Count by type
        for event_type in SecurityEventType:
            count = await self.metrics.get(f"events:{event_type.value}")
            if count > 0:
                stats["by_type"][event_type.value] = count

        # Count by severity
        for severity in SeverityLevel:
            count = await self.metrics.get(f"severity:{severity.value}")
            if count > 0:
                stats["by_severity"][severity.value] = count

        return stats


# Global monitor instance
_monitor: Optional[SecurityMonitor] = None


def get_monitor() -> SecurityMonitor:
    """Get or create global security monitor.

    Returns:
        SecurityMonitor instance
    """
    global _monitor
    if _monitor is None:
        _monitor = SecurityMonitor()
    return _monitor


def initialize_monitor(app: FastAPI, redis_client: Optional[redis.Redis] = None) -> SecurityMonitor:
    """Initialize security monitor with FastAPI app.

    Args:
        app: FastAPI application
        redis_client: Optional Redis client

    Returns:
        Initialized SecurityMonitor instance
    """
    global _monitor

    _monitor = SecurityMonitor(redis_client=redis_client, app=app)

    @app.on_event("startup")
    async def startup():
        await _monitor.start()

    @app.on_event("shutdown")
    async def shutdown():
        await _monitor.stop()

    return _monitor
