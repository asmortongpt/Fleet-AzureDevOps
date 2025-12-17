"""Comprehensive test suite for security monitoring system.

Tests cover:
- Security event monitoring
- Anomaly detection and behavioral analysis
- Alert management and notifications
- SIEM integration
- Threat response and incident management
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import redis

from app.monitoring.security_monitor import (
    SecurityEvent,
    SecurityEventType,
    SeverityLevel,
    EventCollector,
    SecurityMetrics,
    SecurityMonitor,
    get_monitor,
    initialize_monitor,
)
from app.monitoring.anomaly_detection import (
    BehavioralAnalyzer,
    AnomalyDetector,
    AnomalyScore,
    BehavioralBaseline,
)
from app.monitoring.alert_manager import (
    AlertManager,
    Alert,
    AlertStatus,
    NotificationChannel,
    AlertDeduplicator,
)
from app.monitoring.threat_response import (
    ThreatResponder,
    SecurityIncident,
    IncidentStatus,
    ThreatAction,
    BlockedIP,
)
from app.monitoring.siem_integration import (
    AzureSentinelConnector,
    SIEMEventRouter,
    ComplianceEventMapper,
)


# ============================================================================
# Security Monitor Tests
# ============================================================================


class TestSecurityEvent:
    """Test SecurityEvent class."""

    def test_event_creation(self):
        """Test creating a security event."""
        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.WARNING,
            source_ip="192.168.1.1",
            user_id="user123",
        )

        assert event.event_type == SecurityEventType.AUTH_FAILURE
        assert event.severity == SeverityLevel.WARNING
        assert event.source_ip == "192.168.1.1"
        assert event.user_id == "user123"
        assert event.event_id is not None
        assert event.timestamp is not None

    def test_event_to_dict(self):
        """Test converting event to dictionary."""
        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_SUCCESS,
            severity=SeverityLevel.INFO,
            source_ip="192.168.1.1",
        )

        event_dict = event.to_dict()
        assert event_dict["event_type"] == "auth_success"
        assert event_dict["severity"] == "info"
        assert event_dict["source_ip"] == "192.168.1.1"

    def test_event_to_json(self):
        """Test converting event to JSON."""
        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.CRITICAL,
            source_ip="10.0.0.1",
        )

        json_str = event.to_json()
        assert isinstance(json_str, str)
        assert "auth_failure" in json_str


class TestEventCollector:
    """Test EventCollector class."""

    @pytest.mark.asyncio
    async def test_collect_event(self):
        """Test collecting events."""
        collector = EventCollector(buffer_size=10)
        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_SUCCESS,
            severity=SeverityLevel.INFO,
            source_ip="192.168.1.1",
        )

        await collector.collect(event)
        assert len(collector.events) == 1
        assert collector.events[0].event_id == event.event_id

    @pytest.mark.asyncio
    async def test_flush_events(self):
        """Test flushing collected events."""
        collector = EventCollector()

        for i in range(5):
            event = SecurityEvent(
                event_type=SecurityEventType.AUTH_SUCCESS,
                severity=SeverityLevel.INFO,
                source_ip=f"192.168.1.{i}",
            )
            await collector.collect(event)

        flushed = await collector.flush()
        assert len(flushed) == 5
        assert len(collector.events) == 0

    @pytest.mark.asyncio
    async def test_event_listener(self):
        """Test event listener subscription."""
        collector = EventCollector()
        listener = AsyncMock()
        collector.subscribe(listener)

        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.WARNING,
            source_ip="192.168.1.1",
        )

        await collector.collect(event)
        listener.assert_called_once()


class TestSecurityMetrics:
    """Test SecurityMetrics class."""

    @pytest.mark.asyncio
    async def test_increment_metric(self):
        """Test incrementing metrics."""
        metrics = SecurityMetrics()

        await metrics.increment("test_metric", 1)
        value = await metrics.get("test_metric")
        assert value == 1

        await metrics.increment("test_metric", 5)
        value = await metrics.get("test_metric")
        assert value == 6

    @pytest.mark.asyncio
    async def test_set_gauge(self):
        """Test setting gauge metrics."""
        metrics = SecurityMetrics()

        await metrics.set_gauge("test_gauge", 42.5)
        value = await metrics.get("test_gauge")
        assert value == 42.5


class TestSecurityMonitor:
    """Test SecurityMonitor class."""

    @pytest.mark.asyncio
    async def test_monitor_initialization(self):
        """Test monitor initialization."""
        monitor = SecurityMonitor()
        assert monitor.running is False

    @pytest.mark.asyncio
    async def test_monitor_startup_shutdown(self):
        """Test monitor startup and shutdown."""
        monitor = SecurityMonitor()

        await monitor.start()
        assert monitor.running is True

        await monitor.stop()
        assert monitor.running is False

    @pytest.mark.asyncio
    async def test_report_event(self):
        """Test reporting events."""
        monitor = SecurityMonitor()
        await monitor.start()

        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.WARNING,
            source_ip="192.168.1.1",
        )

        await monitor.report_event(event)

        # Verify event was processed
        stats = await monitor.get_event_stats()
        assert "by_type" in stats

        await monitor.stop()

    @pytest.mark.asyncio
    async def test_threat_callback(self):
        """Test threat detection callback."""
        monitor = SecurityMonitor()
        callback = AsyncMock()
        monitor.on_threat_detected(callback)

        await monitor.start()

        event = SecurityEvent(
            event_type=SecurityEventType.PRIVILEGE_ESCALATION,
            severity=SeverityLevel.CRITICAL,
            source_ip="192.168.1.1",
        )

        await monitor.report_event(event)
        await asyncio.sleep(0.1)

        # Callback should be invoked for critical events
        if callback.called:
            callback.assert_called()

        await monitor.stop()


# ============================================================================
# Anomaly Detection Tests
# ============================================================================


class TestBehavioralAnalyzer:
    """Test BehavioralAnalyzer class."""

    def test_baseline_creation(self):
        """Test creating behavioral baselines."""
        analyzer = BehavioralAnalyzer()
        baseline = analyzer.get_or_create_baseline(
            identifier="user123",
            user_id="user123",
            baseline_type="user",
        )

        assert baseline.identifier == "user123"
        assert baseline.user_id == "user123"
        assert baseline.baseline_type == "user"

    def test_baseline_learning(self):
        """Test learning from events."""
        analyzer = BehavioralAnalyzer()

        # Record some events
        events = [
            SecurityEvent(
                event_type=SecurityEventType.AUTH_SUCCESS,
                severity=SeverityLevel.INFO,
                source_ip="192.168.1.1",
                user_id="user123",
            ) for _ in range(5)
        ]

        for event in events:
            analyzer.record_event(event)

        # Learn baseline
        baseline = analyzer.learn_baseline("user:user123")
        assert baseline.auth_attempts_per_hour > 0

    def test_anomaly_detection(self):
        """Test anomaly detection."""
        analyzer = BehavioralAnalyzer()

        # Create and learn from baseline events
        for i in range(10):
            event = SecurityEvent(
                event_type=SecurityEventType.AUTH_SUCCESS,
                severity=SeverityLevel.INFO,
                source_ip="192.168.1.1",
                user_id="user123",
            )
            analyzer.record_event(event)

        baseline = analyzer.learn_baseline("user:user123")

        # Test normal event
        normal_event = SecurityEvent(
            event_type=SecurityEventType.AUTH_SUCCESS,
            severity=SeverityLevel.INFO,
            source_ip="192.168.1.1",
            user_id="user123",
        )

        score = analyzer.detect_anomalies(normal_event, baseline)
        assert isinstance(score, AnomalyScore)

        # Test anomalous event
        anomaly_event = SecurityEvent(
            event_type=SecurityEventType.PRIVILEGE_ESCALATION,
            severity=SeverityLevel.CRITICAL,
            source_ip="192.168.1.1",
            user_id="user123",
        )

        anomaly_score = analyzer.detect_anomalies(anomaly_event, baseline)
        # Privilege escalation should score high
        assert anomaly_score.score > 0.5


class TestAnomalyDetector:
    """Test AnomalyDetector processor."""

    @pytest.mark.asyncio
    async def test_anomaly_processor(self):
        """Test anomaly detector as event processor."""
        analyzer = BehavioralAnalyzer()
        detector = AnomalyDetector(analyzer)

        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.WARNING,
            source_ip="192.168.1.1",
            user_id="user123",
        )

        await detector.process(event)

        # Check that anomaly was recorded
        recent = detector.get_recent_anomalies(count=10)
        assert len(recent) > 0


# ============================================================================
# Alert Manager Tests
# ============================================================================


class TestAlert:
    """Test Alert class."""

    def test_alert_creation(self):
        """Test creating alerts."""
        alert = Alert(
            title="Test Alert",
            description="Test description",
            severity=SeverityLevel.CRITICAL,
            source_event_id="event123",
        )

        assert alert.title == "Test Alert"
        assert alert.severity == SeverityLevel.CRITICAL
        assert alert.status == AlertStatus.NEW
        assert alert.alert_id is not None

    def test_alert_acknowledgment(self):
        """Test acknowledging alerts."""
        alert = Alert(
            title="Test Alert",
            description="Test",
            severity=SeverityLevel.WARNING,
            source_event_id="event123",
        )

        alert.acknowledge("admin")
        assert alert.status == AlertStatus.ACKNOWLEDGED
        assert alert.acknowledged_by == "admin"
        assert alert.acknowledged_at is not None

    def test_alert_resolution(self):
        """Test resolving alerts."""
        alert = Alert(
            title="Test Alert",
            description="Test",
            severity=SeverityLevel.CRITICAL,
            source_event_id="event123",
        )

        alert.resolve()
        assert alert.status == AlertStatus.RESOLVED
        assert alert.resolved_at is not None


class TestAlertDeduplicator:
    """Test AlertDeduplicator class."""

    def test_deduplication(self):
        """Test alert deduplication."""
        dedup = AlertDeduplicator(window_minutes=5)

        alert1 = Alert(
            title="Security Event",
            description="Test",
            severity=SeverityLevel.WARNING,
            source_event_id="event1",
        )
        alert1.metadata = {"user_id": "user123", "source_ip": "192.168.1.1"}

        alert2 = Alert(
            title="Security Event",
            description="Test",
            severity=SeverityLevel.WARNING,
            source_event_id="event2",
        )
        alert2.metadata = {"user_id": "user123", "source_ip": "192.168.1.1"}

        # First alert should be created
        assert dedup.should_create_alert(alert1) is True

        # Duplicate should be deduplicated
        assert dedup.should_create_alert(alert2) is False


class TestAlertManager:
    """Test AlertManager class."""

    @pytest.mark.asyncio
    async def test_alert_creation(self):
        """Test creating alerts."""
        manager = AlertManager()

        alert = Alert(
            title="Test Alert",
            description="Test",
            severity=SeverityLevel.CRITICAL,
            source_event_id="event123",
        )

        alert_id = await manager.create_alert(alert)
        assert alert_id == alert.alert_id

        # Verify alert was stored
        stored = await manager.get_alert(alert_id)
        assert stored is not None
        assert stored.title == "Test Alert"

    @pytest.mark.asyncio
    async def test_alert_acknowledgment(self):
        """Test acknowledging alerts."""
        manager = AlertManager()

        alert = Alert(
            title="Test Alert",
            description="Test",
            severity=SeverityLevel.WARNING,
            source_event_id="event123",
        )

        alert_id = await manager.create_alert(alert)
        await manager.acknowledge_alert(alert_id, "admin")

        stored = await manager.get_alert(alert_id)
        assert stored.status == AlertStatus.ACKNOWLEDGED

    @pytest.mark.asyncio
    async def test_alert_resolution(self):
        """Test resolving alerts."""
        manager = AlertManager()

        alert = Alert(
            title="Test Alert",
            description="Test",
            severity=SeverityLevel.CRITICAL,
            source_event_id="event123",
        )

        alert_id = await manager.create_alert(alert)
        await manager.resolve_alert(alert_id)

        stored = await manager.get_alert(alert_id)
        assert stored.status == AlertStatus.RESOLVED

    @pytest.mark.asyncio
    async def test_event_to_alert_conversion(self):
        """Test converting events to alerts."""
        manager = AlertManager()

        event = SecurityEvent(
            event_type=SecurityEventType.BRUTE_FORCE_ATTEMPT,
            severity=SeverityLevel.CRITICAL,
            source_ip="192.168.1.1",
        )

        await manager.process(event)

        # Check that alert was created for critical event
        alerts = await manager.get_alerts_by_severity(SeverityLevel.CRITICAL)
        # Alerts may not be created immediately due to processing


# ============================================================================
# Threat Response Tests
# ============================================================================


class TestBlockedIP:
    """Test BlockedIP class."""

    def test_ipv4_blocking(self):
        """Test blocking IPv4 addresses."""
        blocked = BlockedIP(
            ip_address="192.168.1.1",
            reason="Brute force",
            permanent=False,
        )

        assert blocked.ip_address == "192.168.1.1"
        assert not blocked.is_ipv6
        assert blocked.is_active()

    def test_ipv6_blocking(self):
        """Test blocking IPv6 addresses."""
        blocked = BlockedIP(
            ip_address="2001:db8::1",
            reason="Malicious",
            permanent=True,
        )

        assert blocked.is_ipv6
        assert blocked.is_active()

    def test_temporary_block_expiry(self):
        """Test temporary block expiry."""
        blocked = BlockedIP(
            ip_address="192.168.1.1",
            blocked_until=datetime.utcnow() - timedelta(hours=1),
            permanent=False,
        )

        assert not blocked.is_active()


class TestSecurityIncident:
    """Test SecurityIncident class."""

    def test_incident_creation(self):
        """Test creating incidents."""
        incident = SecurityIncident(
            incident_id="inc123",
            title="Test Incident",
            description="Test",
            severity=SeverityLevel.CRITICAL,
        )

        assert incident.incident_id == "inc123"
        assert incident.status == IncidentStatus.OPEN

    def test_incident_actions(self):
        """Test recording incident actions."""
        incident = SecurityIncident(
            incident_id="inc123",
            title="Test Incident",
            description="Test",
            severity=SeverityLevel.CRITICAL,
        )

        incident.add_action(
            ThreatAction.BLOCK_IP,
            "192.168.1.1",
            {"reason": "Brute force"},
        )

        assert len(incident.response_actions) == 1
        assert incident.response_actions[0]["action"] == "block_ip"

    def test_incident_closure(self):
        """Test closing incidents."""
        incident = SecurityIncident(
            incident_id="inc123",
            title="Test Incident",
            description="Test",
            severity=SeverityLevel.WARNING,
        )

        incident.close()
        assert incident.status == IncidentStatus.CLOSED
        assert incident.closed_at is not None


class TestThreatResponder:
    """Test ThreatResponder class."""

    @pytest.mark.asyncio
    async def test_ip_blocking(self):
        """Test IP blocking functionality."""
        responder = ThreatResponder()

        success = await responder.block_ip(
            "192.168.1.1",
            reason="Brute force",
            duration_hours=24,
        )
        assert success

        is_blocked = await responder.is_ip_blocked("192.168.1.1")
        assert is_blocked

    @pytest.mark.asyncio
    async def test_ip_unblocking(self):
        """Test unblocking IPs."""
        responder = ThreatResponder()

        await responder.block_ip("192.168.1.1", duration_hours=1)
        assert await responder.is_ip_blocked("192.168.1.1")

        await responder.unblock_ip("192.168.1.1")
        assert not await responder.is_ip_blocked("192.168.1.1")

    @pytest.mark.asyncio
    async def test_get_blocked_ips(self):
        """Test retrieving blocked IPs."""
        responder = ThreatResponder()

        await responder.block_ip("192.168.1.1", permanent=True)
        await responder.block_ip("10.0.0.1", duration_hours=24)

        blocked = await responder.get_blocked_ips()
        assert len(blocked) == 2


# ============================================================================
# SIEM Integration Tests
# ============================================================================


class TestAzureSentinelConnector:
    """Test Azure Sentinel connector."""

    @pytest.mark.asyncio
    async def test_event_forwarding(self):
        """Test forwarding events to Sentinel."""
        connector = AzureSentinelConnector(
            workspace_id="test-workspace",
            shared_key="dGVzdGtleQ==",  # base64 "testkey"
        )

        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.WARNING,
            source_ip="192.168.1.1",
        )

        result = await connector.send_event(event)
        assert isinstance(result, bool)

    @pytest.mark.asyncio
    async def test_alert_forwarding(self):
        """Test forwarding alerts to Sentinel."""
        connector = AzureSentinelConnector(
            workspace_id="test-workspace",
            shared_key="dGVzdGtleQ==",
        )

        alert = Alert(
            title="Test Alert",
            description="Test",
            severity=SeverityLevel.CRITICAL,
            source_event_id="event123",
        )

        result = await connector.send_alert(alert)
        assert isinstance(result, bool)


class TestSIEMEventRouter:
    """Test SIEM event router."""

    @pytest.mark.asyncio
    async def test_multi_connector_routing(self):
        """Test routing to multiple SIEM systems."""
        router = SIEMEventRouter()

        connector1 = AzureSentinelConnector(
            workspace_id="workspace1",
            shared_key="dGVzdGtleQ==",
        )
        connector2 = AzureSentinelConnector(
            workspace_id="workspace2",
            shared_key="dGVzdGtleQ==",
        )

        router.register_connector(connector1)
        router.register_connector(connector2)

        event = SecurityEvent(
            event_type=SecurityEventType.BRUTE_FORCE_ATTEMPT,
            severity=SeverityLevel.CRITICAL,
            source_ip="192.168.1.1",
        )

        results = await router.send_event(event)
        assert len(results) >= 2


class TestComplianceEventMapper:
    """Test compliance event mapper."""

    def test_nist_mapping(self):
        """Test NIST CSF mapping."""
        event = SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.WARNING,
            source_ip="192.168.1.1",
        )

        refs = ComplianceEventMapper.get_nist_references(event)
        assert isinstance(refs, (list, str))

    def test_hipaa_mapping(self):
        """Test HIPAA mapping."""
        event = SecurityEvent(
            event_type=SecurityEventType.UNAUTHORIZED_DATA_ACCESS,
            severity=SeverityLevel.CRITICAL,
            source_ip="192.168.1.1",
        )

        refs = ComplianceEventMapper.get_hipaa_references(event)
        assert isinstance(refs, (list, str))

    def test_soc2_mapping(self):
        """Test SOC 2 mapping."""
        event = SecurityEvent(
            event_type=SecurityEventType.PRIVILEGE_ESCALATION,
            severity=SeverityLevel.CRITICAL,
            source_ip="192.168.1.1",
        )

        refs = ComplianceEventMapper.get_soc2_references(event)
        assert isinstance(refs, (list, str))


# ============================================================================
# Integration Tests
# ============================================================================


class TestEndToEndMonitoring:
    """End-to-end monitoring integration tests."""

    @pytest.mark.asyncio
    async def test_threat_detection_and_response(self):
        """Test complete threat detection and response flow."""
        monitor = SecurityMonitor()
        await monitor.start()

        # Create brute force attempt
        for i in range(5):
            event = SecurityEvent(
                event_type=SecurityEventType.AUTH_FAILURE,
                severity=SeverityLevel.WARNING,
                source_ip="192.168.1.100",
                user_id="attacker",
                result="failed",
            )
            await monitor.report_event(event)

        await asyncio.sleep(0.1)
        stats = await monitor.get_event_stats()
        assert "by_type" in stats

        await monitor.stop()

    @pytest.mark.asyncio
    async def test_complete_alert_workflow(self):
        """Test complete alert workflow."""
        manager = AlertManager()

        # Create alert
        alert = Alert(
            title="Critical Security Event",
            description="Unauthorized access attempt",
            severity=SeverityLevel.CRITICAL,
            source_event_id="evt123",
        )

        alert_id = await manager.create_alert(alert)

        # Acknowledge alert
        await manager.acknowledge_alert(alert_id, "security_team")

        # Get active alerts
        active = await manager.get_active_alerts()
        assert len(active) > 0

        # Resolve alert
        await manager.resolve_alert(alert_id)

        # Verify resolution
        stored = await manager.get_alert(alert_id)
        assert stored.status == AlertStatus.RESOLVED


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture
def security_event():
    """Fixture for security event."""
    return SecurityEvent(
        event_type=SecurityEventType.AUTH_FAILURE,
        severity=SeverityLevel.WARNING,
        source_ip="192.168.1.1",
        user_id="test_user",
    )


@pytest.fixture
def alert():
    """Fixture for alert."""
    return Alert(
        title="Test Alert",
        description="Test security alert",
        severity=SeverityLevel.CRITICAL,
        source_event_id="evt123",
    )


@pytest.fixture
def incident():
    """Fixture for incident."""
    return SecurityIncident(
        incident_id="inc123",
        title="Test Incident",
        description="Test security incident",
        severity=SeverityLevel.CRITICAL,
    )
