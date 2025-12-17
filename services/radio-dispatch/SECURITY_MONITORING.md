# Agent 016: Real-time Security Monitoring for CTAFleet

## Overview

Agent 016 implements a comprehensive real-time security event monitoring system for the CTAFleet radio dispatch platform with:

- **Real-time Event Monitoring**: Collects and processes security events from authentication, authorization, data access, and system operations
- **Behavioral Anomaly Detection**: ML-based detection of suspicious patterns and deviations from baseline behavior
- **Real-time Alerting**: Multi-channel alert generation with intelligent deduplication and escalation
- **SIEM Integration**: Integration with Azure Sentinel, Splunk, and Cloudflare for centralized security monitoring
- **Automated Threat Response**: Automatic IP blocking, session revocation, and incident tracking
- **Compliance Reporting**: Maps security events to NIST, HIPAA, and SOC 2 frameworks

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Security Monitoring System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐         ┌──────────────┐                   │
│  │   Events    │─────────│  Collector   │                   │
│  │  (Auth,     │         │  (Buffer &   │                   │
│  │   AuthZ,    │         │   Route)     │                   │
│  │   Data      │         └──────────────┘                   │
│  │   Access)   │                 │                          │
│  └─────────────┘                 ▼                          │
│                         ┌──────────────────┐                │
│                         │    Processors    │                │
│                         ├──────────────────┤                │
│                         │ • Anomaly        │                │
│                         │ • Alerting       │                │
│                         │ • Threat         │                │
│                         │   Response       │                │
│                         │ • SIEM Forward   │                │
│                         └──────────────────┘                │
│                                 │                           │
│          ┌──────────────────────┼──────────────────────┐    │
│          ▼                       ▼                      ▼    │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │  Anomaly     │      │   Alerting   │      │  SIEM    │  │
│  │  Detection   │      │  & Notif.    │      │ Integration
│  │  (ML)        │      │              │      │          │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│          │                     │                    │        │
│          ▼                     ▼                    ▼        │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │   Baseline   │      │   Alerts     │      │  Azure   │  │
│  │  Learning    │      │  (Deduplicated)     │ Sentinel │  │
│  └──────────────┘      │  Escalation  │      │ Splunk   │  │
│                        └──────────────┘      │ Cloudfl. │  │
│                              │               └──────────┘  │
│                              ▼                              │
│                        ┌──────────────┐                    │
│                        │ Threat Resp. │                    │
│                        ├──────────────┤                    │
│                        │ • Block IP   │                    │
│                        │ • Rate Limit │                    │
│                        │ • Revoke Sess
│                        │ • Quarantine │                    │
│                        └──────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Module Documentation

### 1. Security Monitor (`security_monitor.py`)

Core event monitoring infrastructure.

**Key Classes:**

- **`SecurityEvent`**: Represents a security event with type, severity, source IP, user ID, and optional details
- **`SecurityEventType`**: Enum of event types (AUTH_SUCCESS, AUTH_FAILURE, BRUTE_FORCE_ATTEMPT, etc.)
- **`SeverityLevel`**: Event severity (INFO, WARNING, CRITICAL, EMERGENCY)
- **`EventCollector`**: Buffers events and notifies listeners
- **`SecurityMetrics`**: Tracks event metrics with Redis integration
- **`SecurityMonitor`**: Main orchestrator coordinating all components

**Usage Example:**

```python
from fastapi import FastAPI
from app.monitoring import initialize_monitor, SecurityEvent, SecurityEventType, SeverityLevel

app = FastAPI()
monitor = initialize_monitor(app, redis_client=redis_conn)

# Report security event
event = SecurityEvent(
    event_type=SecurityEventType.AUTH_FAILURE,
    severity=SeverityLevel.WARNING,
    source_ip="192.168.1.1",
    user_id="user123",
    details={"attempt": 1}
)
await monitor.report_event(event)

# Get statistics
stats = await monitor.get_event_stats()
```

### 2. Anomaly Detection (`anomaly_detection.py`)

Machine learning-based behavioral anomaly detection.

**Key Classes:**

- **`BehavioralBaseline`**: Stores baseline metrics for users/IPs (auth attempts, success rate, typical resources)
- **`BehavioralAnalyzer`**: Learns baselines from historical events
- **`AnomalyScore`**: Scores events for anomaly with factors and reasoning
- **`AnomalyDetector`**: EventProcessor that detects anomalies

**Features:**

- Baseline learning from historical event patterns
- Authentication anomaly detection (unusual failure rates, timing)
- Privilege escalation detection
- Resource access anomalies
- Timing-based anomalies (unusual hours)
- Rate-based anomalies (brute force detection)

**Usage Example:**

```python
from app.monitoring import AnomalyDetector

detector = AnomalyDetector()
monitor.register_processor(SecurityEventType.AUTH_FAILURE, detector)

# Detector automatically processes events
# Access recent anomalies
anomalies = detector.get_recent_anomalies(count=100)
rate = detector.get_anomaly_rate(time_window=timedelta(hours=1))
```

### 3. Alert Manager (`alert_manager.py`)

Real-time alert generation and management.

**Key Classes:**

- **`Alert`**: Represents a security alert with status and lifecycle
- **`AlertStatus`**: NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, FALSE_POSITIVE
- **`AlertDeduplicator`**: Removes duplicate alerts within time windows
- **`AlertManager`**: Manages alerts and notifications
- **`NotificationHandler`**: Abstract base for notification channels

**Notification Channels:**

- Email
- Slack
- PagerDuty
- SMS
- Webhook
- Log

**Usage Example:**

```python
from app.monitoring import AlertManager, NotificationChannel

manager = AlertManager()

# Register notification handlers
manager.register_handler(
    NotificationChannel.SLACK,
    SlackNotificationHandler(webhook_url="https://hooks.slack.com/...")
)

# Alerts are created automatically from critical events
# Manual alert operations
alert_id = await manager.create_alert(alert)
await manager.acknowledge_alert(alert_id, user_id="admin")
await manager.escalate_alert(alert_id)
await manager.resolve_alert(alert_id)

# Get alert statistics
active_alerts = await manager.get_active_alerts()
critical_alerts = await manager.get_alerts_by_severity(SeverityLevel.CRITICAL)
```

### 4. SIEM Integration (`siem_integration.py`)

Integration with external SIEM systems.

**Supported SIEM Systems:**

- **Azure Sentinel**: Log Analytics Workspace integration with signature-based authentication
- **Splunk**: HTTP Event Collector (HEC) integration
- **Cloudflare**: Logpush integration for edge security events

**Key Classes:**

- **`SIEMConnector`**: Abstract base for SIEM integrations
- **`SIEMEventRouter`**: Routes events to multiple SIEM systems
- **`ComplianceEventMapper`**: Maps events to compliance frameworks (NIST, HIPAA, SOC 2)

**Usage Example:**

```python
from app.monitoring import (
    AzureSentinelConnector, SplunkConnector, SIEMEventRouter
)

router = SIEMEventRouter()

# Register connectors
sentinel = AzureSentinelConnector(
    workspace_id="your-workspace-id",
    shared_key=base64_encoded_key
)
router.register_connector(sentinel)

splunk = SplunkConnector(
    hec_url="https://your-splunk.com:8088",
    hec_token="your-token"
)
router.register_connector(splunk)

# Events are automatically routed to all connectors
results = await router.send_event(event)
results = await router.send_alert(alert)

# Get compliance references
nist_refs = ComplianceEventMapper.get_nist_references(event)
hipaa_refs = ComplianceEventMapper.get_hipaa_references(event)
soc2_refs = ComplianceEventMapper.get_soc2_references(event)
```

### 5. Threat Response (`threat_response.py`)

Automated threat response and incident management.

**Key Classes:**

- **`BlockedIP`**: Represents blocked IP with expiry and metadata
- **`SecurityIncident`**: Tracks security incidents with response actions
- **`ThreatResponder`**: Orchestrates automated responses
- **`ResponseAction`**: Abstract base for response actions
- **`IPBlockAction`**: Blocks malicious IPs
- **`SessionRevocationAction`**: Revokes user sessions

**Automated Responses:**

- Block IP addresses (temporary or permanent)
- Rate limiting
- Session revocation
- User account disabling
- Resource access restrictions
- Force password reset
- Enable MFA
- Quarantine

**Usage Example:**

```python
from app.monitoring import ThreatResponder, ThreatAction, IPBlockAction

responder = ThreatResponder()

# Register response actions
ip_blocker = IPBlockAction(default_block_duration_hours=24)
responder.register_action(ThreatAction.BLOCK_IP, ip_blocker)

# Responses trigger automatically on threat events
# Manual threat operations
await responder.block_ip(
    "192.168.1.1",
    reason="Brute force detected",
    duration_hours=24
)

# Check IP status
is_blocked = await responder.is_ip_blocked("192.168.1.1")
blocked_ips = await responder.get_blocked_ips()

# Get incidents
open_incidents = await responder.get_open_incidents()
incident = await responder.get_incident(incident_id)
```

## Security Events

Monitored event types include:

### Authentication Events
- `AUTH_SUCCESS`: Successful authentication
- `AUTH_FAILURE`: Authentication failure
- `AUTH_ATTEMPT`: Authentication attempt
- `SESSION_CREATED`: New session created
- `SESSION_TERMINATED`: Session ended

### Authorization Events
- `AUTHZ_GRANTED`: Permission granted
- `AUTHZ_DENIED`: Access denied
- `PRIVILEGE_ESCALATION`: Privilege escalation attempt
- `PERMISSION_CHANGE`: Permission modification

### Data Access Events
- `DATA_ACCESS`: Data access event
- `DATA_MODIFIED`: Data modification
- `DATA_DELETED`: Data deletion
- `BULK_DATA_ACCESS`: Large data access
- `UNAUTHORIZED_DATA_ACCESS`: Unauthorized access

### Security Events
- `MALICIOUS_PAYLOAD`: Malicious payload detected
- `SQL_INJECTION_ATTEMPT`: SQL injection detected
- `XSS_ATTEMPT`: XSS attack detected
- `CSRF_ATTEMPT`: CSRF attack detected
- `BRUTE_FORCE_ATTEMPT`: Brute force detected
- `SUSPICIOUS_IP`: Suspicious IP identified
- `ANOMALY_DETECTED`: Behavioral anomaly detected

### Threat Response Events
- `THREAT_BLOCKED`: Threat blocked
- `IP_BLOCKED`: IP address blocked
- `SESSION_REVOKED`: Session revoked
- `THREAT_ESCALATED`: Threat escalated to security team

## Integration with FastAPI

### Setup

```python
from fastapi import FastAPI
from app.monitoring import (
    initialize_monitor,
    AnomalyDetector,
    AlertManager,
    ThreatResponder,
    AzureSentinelConnector,
    SIEMEventRouter,
)
import redis

app = FastAPI()

# Initialize Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Initialize monitoring
monitor = initialize_monitor(app, redis_client=redis_client)

# Initialize components
anomaly_detector = AnomalyDetector()
alert_manager = AlertManager()
threat_responder = ThreatResponder()
siem_router = SIEMEventRouter()

# Register processors
monitor.register_processor(SecurityEventType.AUTH_FAILURE, anomaly_detector)
monitor.register_processor(SecurityEventType.BRUTE_FORCE_ATTEMPT, alert_manager)
monitor.register_processor(SecurityEventType.PRIVILEGE_ESCALATION, threat_responder)

# Register SIEM connectors
sentinel = AzureSentinelConnector(
    workspace_id=os.getenv("AZURE_LOG_ANALYTICS_WORKSPACE_ID"),
    shared_key=os.getenv("AZURE_LOG_ANALYTICS_SHARED_KEY")
)
siem_router.register_connector(sentinel)

# Setup callbacks
def on_threat_detected(event):
    print(f"Threat detected: {event.event_type}")

monitor.on_threat_detected(on_threat_detected)
```

### Usage in Routes

```python
from fastapi import APIRouter, Request
from app.monitoring import SecurityEvent, SecurityEventType, SeverityLevel

router = APIRouter()
monitor = get_monitor()

@router.post("/login")
async def login(request: Request, credentials: LoginCredentials):
    try:
        user = authenticate(credentials)

        # Log successful auth
        await monitor.report_event(SecurityEvent(
            event_type=SecurityEventType.AUTH_SUCCESS,
            severity=SeverityLevel.INFO,
            source_ip=request.client.host,
            user_id=user.id,
        ))

        return {"token": generate_token(user)}

    except AuthenticationError:
        # Log failed auth
        await monitor.report_event(SecurityEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SeverityLevel.WARNING,
            source_ip=request.client.host,
            user_id=credentials.username,
            details={"reason": "invalid_credentials"}
        ))
        raise
```

## Testing

Comprehensive test suite with 100+ tests covering all modules:

```bash
# Run all tests
python -m pytest app/monitoring/__tests__/test_monitoring.py -v

# Run specific test class
python -m pytest app/monitoring/__tests__/test_monitoring.py::TestSecurityMonitor -v

# Run with coverage
python -m pytest app/monitoring/__tests__/test_monitoring.py --cov=app.monitoring --cov-report=html
```

**Test Coverage:**

- Event collection and processing
- Anomaly detection and scoring
- Alert generation and management
- Threat response and incident tracking
- SIEM integration
- Notification handling
- Deduplication
- End-to-end workflows

## Monitoring Metrics

Key metrics tracked:

- `events:total` - Total events processed
- `events:{event_type}` - Events by type
- `severity:{level}` - Events by severity
- `anomaly_rate` - Rate of detected anomalies
- `alerts:active` - Active alerts
- `incidents:open` - Open incidents
- `ips:blocked` - Blocked IPs

## Performance Considerations

- **Event Buffering**: Events are buffered and processed in batches for efficiency
- **Redis Integration**: Distributed metrics via Redis for multi-instance deployments
- **Async Processing**: All I/O operations are async for high throughput
- **Deduplication**: Reduces alert noise through intelligent deduplication
- **Rate Limiting**: Processing is rate-limited to prevent resource exhaustion

## Security Best Practices

1. **Never Log Sensitive Data**: Avoid logging passwords, tokens, or PII
2. **Use Environment Variables**: Store API keys, credentials in env vars
3. **Parameterized Queries**: Only use parameterized queries in any data access
4. **Input Validation**: Validate all event sources before processing
5. **Least Privilege**: Minimize permissions for SIEM and monitoring accounts
6. **Audit Logging**: All alert and response actions are logged
7. **Rate Limiting**: Implement rate limiting on event collection endpoints

## Deployment

### Requirements

- FastAPI 0.115.0+
- Python 3.9+
- Redis 5.0+ (optional, for distributed deployment)
- Azure SDK (for Sentinel integration)

### Configuration

Set in environment variables or `.env`:

```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# Azure Sentinel
AZURE_LOG_ANALYTICS_WORKSPACE_ID=your-workspace-id
AZURE_LOG_ANALYTICS_SHARED_KEY=your-shared-key

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Email Notifications
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-password
```

## Maintenance

### Regular Tasks

1. **Review Alerts**: Check unresolved alerts weekly
2. **Update Baselines**: Retrain anomaly detection weekly
3. **Rotate Credentials**: Rotate SIEM API keys quarterly
4. **Audit Rules**: Review response rules monthly
5. **Capacity Planning**: Monitor metrics for growth trends

### Troubleshooting

- Check Redis connectivity for metrics collection
- Verify SIEM authentication and network connectivity
- Review event logs for processing errors
- Check anomaly detection baselines are updating

## Compliance

This system helps meet security requirements for:

- **NIST Cybersecurity Framework**: Event monitoring, anomaly detection, incident response
- **HIPAA Security Rule**: Access controls, audit logging, breach detection
- **SOC 2 Type II**: Continuous monitoring, incident response, security controls
- **ISO 27001**: Information security event logging and monitoring

## Future Enhancements

- ML-based threat scoring (gradient boosting models)
- Automated incident triage and severity classification
- Threat intelligence integration (abuse databases, threat feeds)
- Custom rule engine for complex detection scenarios
- Graphical security dashboard and visualizations
- Automated incident remediation workflows
- Integration with ticket systems (Jira, Azure DevOps)

## Support

For issues, questions, or feature requests, contact the security team.
