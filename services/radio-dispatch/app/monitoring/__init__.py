"""Real-time Security Monitoring Module.

Comprehensive security event monitoring, anomaly detection, alert management,
and automated threat response for CTAFleet radio dispatch system.

Main Components:
- security_monitor: Core event monitoring infrastructure
- anomaly_detection: ML-based behavioral anomaly detection
- alert_manager: Real-time alert generation and management
- siem_integration: SIEM system integration (Azure Sentinel, Splunk, Cloudflare)
- threat_response: Automated threat response and incident management

Example Usage:
    from fastapi import FastAPI
    from app.monitoring import initialize_monitor
    from app.monitoring import SecurityEvent, SecurityEventType, SeverityLevel

    app = FastAPI()
    monitor = initialize_monitor(app)

    # Report security event
    event = SecurityEvent(
        event_type=SecurityEventType.AUTH_FAILURE,
        severity=SeverityLevel.WARNING,
        source_ip="192.168.1.1",
        user_id="user123"
    )
    await monitor.report_event(event)
"""

from .security_monitor import (
    SecurityEvent,
    SecurityEventType,
    SeverityLevel,
    EventCollector,
    SecurityMetrics,
    SecurityMonitor,
    EventProcessor,
    get_monitor,
    initialize_monitor,
)

from .anomaly_detection import (
    BehavioralAnalyzer,
    AnomalyDetector,
    AnomalyScore,
    BehavioralBaseline,
)

from .alert_manager import (
    Alert,
    AlertManager,
    AlertStatus,
    NotificationChannel,
    AlertDeduplicator,
    EmailNotificationHandler,
    SlackNotificationHandler,
    WebhookNotificationHandler,
)

from .threat_response import (
    ThreatResponder,
    SecurityIncident,
    IncidentStatus,
    ThreatAction,
    BlockedIP,
    IPBlockAction,
    SessionRevocationAction,
)

from .siem_integration import (
    SIEMConnector,
    AzureSentinelConnector,
    SplunkConnector,
    CloudflareLogpushConnector,
    SIEMEventRouter,
    ComplianceEventMapper,
)

__all__ = [
    # Security Monitor
    "SecurityEvent",
    "SecurityEventType",
    "SeverityLevel",
    "EventCollector",
    "SecurityMetrics",
    "SecurityMonitor",
    "EventProcessor",
    "get_monitor",
    "initialize_monitor",
    # Anomaly Detection
    "BehavioralAnalyzer",
    "AnomalyDetector",
    "AnomalyScore",
    "BehavioralBaseline",
    # Alert Management
    "Alert",
    "AlertManager",
    "AlertStatus",
    "NotificationChannel",
    "AlertDeduplicator",
    "EmailNotificationHandler",
    "SlackNotificationHandler",
    "WebhookNotificationHandler",
    # Threat Response
    "ThreatResponder",
    "SecurityIncident",
    "IncidentStatus",
    "ThreatAction",
    "BlockedIP",
    "IPBlockAction",
    "SessionRevocationAction",
    # SIEM Integration
    "SIEMConnector",
    "AzureSentinelConnector",
    "SplunkConnector",
    "CloudflareLogpushConnector",
    "SIEMEventRouter",
    "ComplianceEventMapper",
]
