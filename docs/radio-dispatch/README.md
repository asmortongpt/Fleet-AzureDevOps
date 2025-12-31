# Radio Fleet Dispatch System

**Production-ready radio monitoring, dispatch coordination, and fleet management platform for Azure Kubernetes Service (AKS)**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)

## Overview

A comprehensive platform for organizations with radio-based operations (public safety, utilities, logistics, events) that need to:

- **Monitor radios** across multiple talkgroups/systems
- **Transcribe and tag** transmissions with AI-powered analysis
- **Coordinate dispatch** with automated task creation and SLA tracking
- **Manage fleets** with real-time GPS tracking and geofencing
- **Integrate with enterprise systems** including PMO-Tool for project/task management

### Three Operating Modes

1. **Monitor-Only**: Live dashboards & alerts with no state changes
2. **Human-in-the-Loop (HITL)**: AI suggestions create pending actions requiring user approval
3. **Autonomous Assist**: Approved policies auto-execute with full audit & rollback capabilities

---

## Quick Start

### Local Development (Docker Compose)

```bash
# 1. Clone the repository
cd /Users/andrewmorton/Documents/GitHub/radio-fleet-dispatch

# 2. Copy environment configuration
cp .env.example .env
# Edit .env with your values (database, Azure credentials, etc.)

# 3. Start all services
make dev

# 4. Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# WebSocket: http://localhost:8001
# Flower (Celery monitoring): http://localhost:5555
```

### Production Deployment (Azure Kubernetes Service)

```bash
# 1. Provision Azure infrastructure
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
./scripts/bootstrap_aks.sh production

# 2. Deploy application
./scripts/deploy_aks.sh production v1.0.0

# 3. Configure DNS and TLS
# Point your domain to the NGINX Ingress external IP
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  Dashboard │ Radio Feed │ Incidents │ Dispatch │ Map │ Fleet    │
└────────────┬────────────────────────────────────────────────────┘
             │ HTTP/WebSocket
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX Ingress (TLS)                           │
└────────┬──────────────────────────┬──────────────────────────────┘
         │                          │
         ▼                          ▼
┌────────────────┐         ┌────────────────┐
│  API Service   │◄────────┤  WebSocket     │
│   (FastAPI)    │         │   Service      │
└────────┬───────┘         └────────┬───────┘
         │                          │
         │ Celery Tasks             │ Kafka Events
         ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Worker Services                             │
│  Transcription │ NLP Analysis │ Policy Engine                   │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├─► Azure Speech-to-Text
         ├─► Azure Blob Storage
         ├─► PostgreSQL Database
         ├─► Redis Cache
         ├─► Kafka/Event Hubs
         └─► PMO-Tool Integration
```

### Core Services

| Service | Technology | Purpose | Port |
|---------|------------|---------|------|
| **API** | FastAPI (Python) | REST API, auth, business logic | 8000 |
| **WebSocket** | Socket.IO (Python) | Real-time updates | 8001 |
| **Transcription Worker** | Celery (Python) | Azure Speech-to-Text | - |
| **NLP Worker** | Celery (Python) | Entity extraction, intent detection | - |
| **Policy Worker** | Celery (Python) | Rule evaluation, auto-execution | - |
| **Frontend** | Next.js 14 (TypeScript) | Web UI, dashboards, maps | 3000 |
| **Database** | PostgreSQL 16 | Primary data store | 5432 |
| **Cache** | Redis 7 | Session, queue, cache | 6379 |
| **Message Broker** | Kafka/Redpanda | Event streaming | 9092 |

---

## Features

### Radio Ingest & Transcription
- Multiple source types: SIP/RTP, Icecast/HTTP, file uploads, partner APIs
- Azure Speech-to-Text with language model selection
- Speaker diarization and confidence scoring
- NLP pipeline for entity detection (unit IDs, locations, incident codes)
- Keyword-based intent classification

### Dispatch & Task Management
- Incident tracking (open/ack/in-progress/resolved/closed)
- Task creation from manual UI, radio/NLP, external API, or scheduled rules
- SLA timers with pause/resume capabilities
- Assignment and checklist management
- Timeline and audit trail

### Fleet Management
- Real-time GPS tracking with position history
- Asset management (vehicles, radios, devices, equipment)
- Crew management with shift tracking
- Geofencing with alerts
- Telematics integration via adapters

### Real-Time UI
- Live radio feed with waveform and transcript
- Interactive map (Mapbox) with fleet positions and incidents
- Kanban dispatch board with drag-and-drop
- SLA heatmap and notifications

### Integrations
- **PMO-Tool**: Auto-create projects/tasks from incidents/transmissions
- **External CAD/AVL/Fleet**: Adapter interface with sample implementations
- **Webhooks**: Signed with HMAC, replay protection, retry logic
- **Email/SMS**: SendGrid, Twilio for notifications

### Governance & Security
- RBAC: Admin, Dispatcher, Supervisor, Viewer, Operator roles
- Audit log (7-year retention)
- PII controls and data retention policies
- Encryption at rest and in transit
- Multi-tenant by organization

---

## Data Model

### Core Entities

```sql
-- Organizations (multi-tenant)
organizations (id, name, feature_flags, default_op_mode)

-- Users (Azure AD OIDC)
users (id, oidc_sub, email, name, roles[], org_id)

-- Radio Channels
radio_channels (id, org_id, name, talkgroup, source_type, metadata)

-- Transmissions
transmissions (id, channel_id, started_at, ended_at, audio_uri,
               transcript, entities, priority, tags[])

-- Incidents
incidents (id, org_id, title, status, priority, location_geo,
           opened_at, closed_at, assigned_to, related_transmission_ids[])

-- Tasks
tasks (id, incident_id, title, assignee_id, status, sla_due_at)
task_checklists (id, task_id, item_text, is_completed, order_index)

-- Fleet
assets (id, org_id, type, name, vin_or_serial, status, last_known_geo)
crews (id, org_id, name, members[], assigned_asset_id, status)

-- Governance
audit_logs (id, org_id, actor_id, action, entity_type, entity_id,
            before_state, after_state, ip_address, correlation_id)
webhooks (id, org_id, url, secret, events[], is_active)
policies (id, org_id, name, yaml_content, is_active, priority)
```

---

## API Reference

### Authentication

```bash
# Get current user
GET /auth/me
Authorization: Bearer <jwt-token>

# List roles
GET /auth/roles
```

### Radio Operations

```bash
# Create channel
POST /radio/channels
{
  "name": "Fire Dispatch",
  "talkgroup": "1234",
  "source_type": "SIP",
  "metadata": {"sip_uri": "sip:fire@dispatch.local"}
}

# Get transmissions (with filters)
GET /radio/transmissions?channel_id=<uuid>&start_time=<iso8601>&priority=HIGH

# WebSocket (live feed)
WS /radio/stream/:channelId
Events: transmission_started, snippet, transcription, tags
```

### Incidents & Tasks

```bash
# Create incident
POST /incidents/
{
  "title": "Structure Fire - 123 Main St",
  "priority": "CRITICAL",
  "location_geo": {"lat": 39.8, "lng": -98.5, "address": "123 Main St"}
}

# Link transmission
POST /incidents/{id}/transmissions
{"transmission_id": "<uuid>"}

# Create task
POST /tasks/
{
  "incident_id": "<uuid>",
  "title": "Dispatch Engine 1",
  "assignee_id": "<uuid>",
  "sla_due_at": "2025-10-17T18:00:00Z"
}

# Assign task
POST /tasks/{id}/assign
{"assignee_id": "<uuid>"}
```

### Fleet Management

```bash
# List assets
GET /fleet/assets?status=AVAILABLE&type=VEHICLE

# Ingest GPS positions
POST /fleet/positions
{
  "asset_id": "<uuid>",
  "lat": 39.8,
  "lng": -98.5,
  "speed": 45.2,
  "heading": 180,
  "timestamp": "2025-10-17T17:00:00Z"
}

# List fleet adapters
GET /fleet/adapters

# Configure adapter
POST /fleet/adapters/samsara/configure
{"api_key": "<key>", "api_url": "https://api.samsara.com"}
```

### Policy Management

```bash
# Create policy
POST /policy/
{
  "name": "urgent_medical",
  "yaml_content": "...",
  "is_active": true,
  "priority": 10
}

# Test policy
POST /policy/{id}/evaluate
{
  "transmission": {
    "transcript": "Unit 42, CPR in progress at 5th and Main",
    "priority": "HIGH"
  }
}

# Activate/deactivate
PATCH /policy/{id}/activate
{"is_active": true}
```

### Admin Operations

```bash
# Feature flags
GET /admin/feature-flags
PATCH /admin/feature-flags
{"hitl": true, "autonomous_assist": false}

# Audit logs
GET /admin/audit-logs?action=create_incident&start_date=<iso8601>

# System stats
GET /admin/stats
```

**Full OpenAPI spec**: `docs/openapi.json`
**Postman collection**: `docs/postman_collection.json`

---

## Configuration

### Environment Variables

#### Core Application

```bash
# Mode
MODE=development  # development | staging | production
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/radio_fleet

# Redis
REDIS_URL=redis://localhost:6379/0

# Message Broker
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

#### Azure Services

```bash
# Authentication (OIDC)
OIDC_AUTHORITY=https://login.microsoftonline.com/<tenant-id>/v2.0
OIDC_CLIENT_ID=<app-client-id>
OIDC_CLIENT_SECRET=<app-client-secret>

# Storage (audio files)
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
AZURE_STORAGE_CONTAINER=radio-transmissions

# Speech Service
AZURE_SPEECH_KEY=<speech-key>
AZURE_SPEECH_REGION=eastus

# Key Vault
AZURE_KEY_VAULT_URI=https://<keyvault-name>.vault.azure.net/

# Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=<connection-string>
```

#### Integrations

```bash
# PMO-Tool Integration
PMO_TOOL_ENABLED=true
PMO_TOOL_API_URL=http://localhost:3001
PMO_TOOL_API_KEY=<api-key>
PMO_TOOL_WEBHOOK_SECRET=<webhook-secret>
PMO_TOOL_AUTO_CREATE_PROJECTS=true
PMO_TOOL_AUTO_CREATE_TASKS=true

# External Fleet Adapter
SAMSARA_API_KEY=<api-key>
SAMSARA_API_URL=https://api.samsara.com

# Notifications
SENDGRID_API_KEY=<api-key>
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_FROM_NUMBER=+15551234567
```

**Complete reference**: `.env.example`

---

## Operating Modes

### 1. Monitor-Only

**Purpose**: Observe radio traffic and incidents without automated actions.

**Behavior**:
- Live dashboards and alerts
- Manual incident/task creation only
- No policy-based automation
- Full audit logging

**Configuration**:
```yaml
# In organization settings or policy
mode: monitor_only
```

### 2. Human-in-the-Loop (HITL)

**Purpose**: AI creates suggestions that require human approval.

**Behavior**:
- Policy engine evaluates rules
- Creates pending actions in approval queue
- Dispatcher reviews and approves/rejects
- SLA timer starts on approval
- Full audit trail

**Configuration**:
```yaml
mode: hitl

policies:
  - name: urgent_medical
    when:
      - field: transcript
        operator: contains
        value: "CPR"
    then:
      - action: create_incident  # Creates pending action
        priority: CRITICAL
        notify: dispatcher
```

### 3. Autonomous Assist

**Purpose**: Approved policies auto-execute with review capabilities.

**Behavior**:
- Policy engine evaluates and executes
- Incidents/tasks created automatically
- Notifications sent immediately
- Full audit log with undo capability
- Human review available post-execution

**Configuration**:
```yaml
mode: autonomous_assist

policies:
  - name: auto_dispatch_fire
    when:
      - field: entities.incident_code
        operator: equals
        value: "CODE 3"
    then:
      - action: create_incident
      - action: create_task
        title: "Dispatch Engine 1"
      - action: notify
        channels: ["sms", "push"]
```

**Switching Modes**: Per organization via API or admin UI.

---

## PMO-Tool Integration

### Overview

Bidirectional integration with PMO-Tool for project and task management:

- **Radio Incident → PMO Project**: Critical incidents auto-create projects
- **Radio Transmission → PMO Task**: Actionable transmissions create tasks
- **PMO Task Complete → Incident Update**: Task completion updates incident status
- **Fleet Asset → PMO Resource**: Asset utilization tracked in PMO

### Setup

#### 1. Database Migrations

```bash
# Radio-Fleet-Dispatch
cd services/api
alembic upgrade head  # Adds pmo_project_id, pmo_task_id fields

# PMO-Tool
psql $DATABASE_URL -f database/migrations/add_radio_dispatch_fields.sql
```

#### 2. Configuration

**Radio-Fleet-Dispatch** `.env`:
```bash
PMO_TOOL_ENABLED=true
PMO_TOOL_API_URL=http://localhost:3001
PMO_TOOL_API_KEY=<secure-api-key>
PMO_TOOL_WEBHOOK_SECRET=<secure-webhook-secret>
PMO_TOOL_AUTO_CREATE_PROJECTS=true
PMO_TOOL_AUTO_CREATE_TASKS=true
```

**PMO-Tool** `.env`:
```bash
RADIO_DISPATCH_ENABLED=true
RADIO_DISPATCH_API_URL=http://localhost:8000
RADIO_DISPATCH_API_KEY=<same-api-key>
RADIO_DISPATCH_WEBHOOK_URL=http://localhost:8000/webhooks/pmo
```

#### 3. Register Routes

**PMO-Tool** `server/index.js`:
```javascript
const { router: radioDispatchRouter } = require('./routes/radio-dispatch');
app.use('/api/integrations/radio-dispatch', radioDispatchRouter);
```

**Radio-Fleet-Dispatch** `services/api/app/main.py`:
```python
from app.integrations.pmo_webhook_handler import router as pmo_webhook_router
app.include_router(pmo_webhook_router, prefix="/webhooks/pmo", tags=["webhooks"])
```

#### 4. Deploy Policies

```bash
cp policies/pmo_integration_policy.yaml policies/active/
```

### Example Policy

```yaml
- name: create_pmo_project_for_critical_incidents
  description: Auto-create PMO project for critical incidents
  enabled: true
  rules: |
    conditions:
      all:
        - field: priority
          operator: equals
          value: CRITICAL
  then:
    - action: create_incident
      priority: CRITICAL
    - action: create_pmo_project
      params:
        project_name: "{{entities.incident_code}} - {{location}}"
        project_type: "Emergency Response"
        priority: critical
        assigned_to: dispatcher
    - action: notify
      channels: ["sms", "email"]
      message: "Critical incident detected, PMO project created"
```

**Complete guide**: `docs/PMO_TOOL_INTEGRATION.md`

---

## Deployment

### Local Development

```bash
# Install dependencies
cd services/api && pip install -r requirements.txt
cd services/workers && pip install -r requirements.txt
cd services/websocket && pip install -r requirements.txt
cd frontend && npm install

# Start services
make dev

# Run tests
make test

# Seed database
make seed
```

### Docker Compose

```bash
# Build images
make build

# Start all services
docker compose up -d

# View logs
make dev-logs

# Stop services
make dev-down
```

### Azure Kubernetes Service (Production)

#### Prerequisites

- Azure CLI installed and configured
- kubectl installed
- Terraform installed
- Helm 3 installed

#### Step 1: Provision Infrastructure

```bash
cd infra/terraform

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Run bootstrap script
../../scripts/bootstrap_aks.sh production

# This provisions:
# - AKS cluster (2-20 nodes, autoscaling)
# - PostgreSQL Flexible Server (HA, backups)
# - Azure Cache for Redis
# - Service Bus + Event Hubs
# - Storage Account
# - Key Vault
# - Application Insights
```

#### Step 2: Configure Secrets

```bash
# Store secrets in Key Vault
az keyvault secret set --vault-name <kv-name> --name oidc-client-secret --value "<secret>"
az keyvault secret set --vault-name <kv-name> --name azure-speech-key --value "<key>"
az keyvault secret set --vault-name <kv-name> --name sendgrid-api-key --value "<key>"
```

#### Step 3: Deploy Application

```bash
# Deploy with Helm
./scripts/deploy_aks.sh production v1.0.0

# This deploys:
# - API service (2-10 replicas, autoscaling)
# - Worker services (transcription, NLP, policy)
# - WebSocket service (2-8 replicas)
# - Frontend (2-6 replicas)
# - NGINX Ingress with TLS
```

#### Step 4: Configure DNS & TLS

```bash
# Get ingress external IP
kubectl get svc -n ingress-nginx

# Point your domain A record to the external IP
# Wait for Let's Encrypt certificate

# Verify TLS
curl https://your-domain.com/health
```

#### Step 5: Verify Deployment

```bash
# Check pods
kubectl get pods -n radio-fleet-dispatch

# Check services
kubectl get svc -n radio-fleet-dispatch

# View logs
kubectl logs -f deployment/api -n radio-fleet-dispatch

# Run smoke tests
./scripts/smoke_tests.sh https://your-domain.com
```

**Complete deployment guide**: `docs/DEPLOYMENT.md`

---

## Testing

### Unit Tests

```bash
# Backend
cd services/api
pytest tests/unit/ -v --cov

# Frontend
cd frontend
npm run test:unit
```

### Integration Tests

```bash
# API integration tests
pytest tests/integration/ -v

# PMO-Tool integration
pytest tests/integration/test_pmo_adapter.py -v
```

### End-to-End Tests

```bash
cd frontend
npm run test:e2e
```

### Load Tests

```bash
# API load test
k6 run tests/load/api_load_test.js

# Simulate radio transmissions
k6 run tests/load/radio_ingest_test.js
```

**Test coverage target**: 80%+ for production code

---

## Monitoring & Observability

### Health Checks

```bash
# API health
curl http://localhost:8000/healthz

# WebSocket health
curl http://localhost:8001/health

# Database health
curl http://localhost:8000/api/admin/health/detailed
```

### Metrics

All services export OpenTelemetry metrics to Azure Application Insights:

- Request rate, latency (p50, p95, p99)
- Error rate by endpoint
- Celery task metrics (queue depth, execution time, failures)
- Database connection pool metrics
- Redis cache hit rate

### Logs

Structured logs sent to Azure Log Analytics:

```bash
# View logs in Azure
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "traces | where severityLevel >= 2 | top 100 by timestamp desc"
```

### Alerts

Configured via Terraform:

- High error rate (>5%)
- API latency >1s (p95)
- Celery worker failures
- Database CPU >80%
- Redis memory >80%
- Policy violations

### Dashboards

Pre-built Azure Workbooks included:

- System overview
- Radio ingest metrics
- Incident/task metrics
- Fleet tracking
- Policy evaluation stats

---

## Security

### Authentication & Authorization

- **Azure AD OIDC**: Single sign-on with JWT tokens
- **RBAC**: 5 roles (Admin, Dispatcher, Supervisor, Viewer, Operator)
- **JWT Expiration**: 60 minutes (configurable)
- **Token Refresh**: Automatic with refresh tokens

### Encryption

- **At Rest**: Azure Storage (AES-256), PostgreSQL (TDE)
- **In Transit**: TLS 1.2+ for all connections
- **Secrets**: Azure Key Vault with managed identities

### Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

### Audit Logging

All state-changing operations logged:

```json
{
  "actor_id": "<uuid>",
  "action": "create_incident",
  "entity_type": "incident",
  "entity_id": "<uuid>",
  "before_state": null,
  "after_state": {...},
  "ip_address": "192.168.1.1",
  "correlation_id": "trace-123"
}
```

**Retention**: 7 years (FedRAMP requirement)

### Vulnerability Management

```bash
# Python dependencies
pip audit

# Node dependencies
npm audit

# Container scanning
trivy image radio-fleet-api:latest
```

---

## Troubleshooting

### Common Issues

#### Database Connection Timeout

**Symptom**: `psycopg2.OperationalError: could not connect to server`

**Solution**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Celery Workers Not Processing Tasks

**Symptom**: Tasks stuck in pending state

**Solution**:
```bash
# Check worker logs
docker logs radio-fleet-transcription-worker-1

# Verify Redis connection
redis-cli -h localhost -p 6379 ping

# Check queue depth
redis-cli llen celery

# Restart workers
docker compose restart transcription-worker nlp-worker policy-worker
```

#### WebSocket Connection Failures

**Symptom**: `ERR_CONNECTION_REFUSED` on ws://localhost:8001

**Solution**:
```bash
# Check WebSocket service
curl http://localhost:8001/health

# Verify Kafka connection
kafka-console-consumer --bootstrap-server localhost:9092 --topic radio.transmissions --from-beginning

# Check logs
docker logs radio-fleet-websocket-1
```

#### Frontend Build Errors

**Symptom**: `MODULE_NOT_FOUND` during `npm run build`

**Solution**:
```bash
cd frontend

# Clear caches
rm -rf node_modules .next

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### Performance Issues

#### High API Latency

```bash
# Check database slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check Redis memory
redis-cli info memory

# Review application logs for N+1 queries
```

#### Worker Queue Backlog

```bash
# Scale workers
docker compose up -d --scale transcription-worker=5

# Or in Kubernetes
kubectl scale deployment transcription-worker --replicas=10 -n radio-fleet-dispatch
```

**Full troubleshooting guide**: `docs/runbooks/troubleshooting.md`

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes following the code style
4. Write tests (80%+ coverage required)
5. Run linters: `make lint`
6. Run tests: `make test`
7. Commit with conventional format: `feat: add X feature`
8. Push and create a pull request

### Code Style

- **Python**: PEP 8, Black formatter, ruff linter, type hints
- **TypeScript**: ESLint, Prettier, strict mode
- **Commits**: Conventional Commits format

### Testing Requirements

- Unit tests for all new functions/classes
- Integration tests for API endpoints
- E2E tests for critical user flows
- Load tests for high-traffic endpoints

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/radio-fleet-dispatch/issues)
- **Security**: See [SECURITY.md](SECURITY.md) for vulnerability disclosure

---

## Acknowledgments

Built with:
- FastAPI, Next.js, PostgreSQL, Redis, Kafka
- Azure services (AKS, Speech, Storage, Key Vault, Application Insights)
- Open source libraries (see package.json, requirements.txt)

---

## Project Status

**Current Version**: v1.0.0
**Status**: Production-Ready
**Last Updated**: October 17, 2025

### Completed Features ✅

- ✅ Core API with FastAPI (50+ endpoints)
- ✅ Database models with Alembic migrations
- ✅ Celery workers (transcription, NLP, policy)
- ✅ WebSocket service for real-time updates
- ✅ Next.js frontend with 12+ pages
- ✅ PMO-Tool integration adapter
- ✅ Fleet adapter interface + samples
- ✅ Radio & GPS simulators
- ✅ Docker Compose for local dev
- ✅ Terraform for Azure infrastructure
- ✅ Helm charts for Kubernetes
- ✅ CI/CD with GitHub Actions
- ✅ Comprehensive documentation

### Roadmap 🚀

- [ ] Mobile app (React Native)
- [ ] Advanced ML models for priority prediction
- [ ] Voice command interface
- [ ] Additional fleet adapters (Samsara, Verizon Connect, etc.)
- [ ] Enhanced reporting and analytics
- [ ] Multi-language support
- [ ] Slack/Teams bot integration

---

**For detailed setup instructions, see** [QUICKSTART.md](docs/QUICKSTART.md)
