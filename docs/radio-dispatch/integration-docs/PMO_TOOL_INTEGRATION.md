# PMO-Tool Integration Guide

Complete integration guide for connecting radio-fleet-dispatch with PMO-Tool for bidirectional project and task management.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Configuration Reference](#configuration-reference)
5. [API Mapping](#api-mapping)
6. [Webhook Flows](#webhook-flows)
7. [Policy Configuration](#policy-configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The PMO-Tool integration enables automatic project and task creation in PMO-Tool based on radio transmissions and incidents detected by radio-fleet-dispatch. This provides:

- **Automatic project tracking** for critical incidents
- **Task management** derived from radio transmissions
- **Bidirectional status updates** via webhooks
- **Resource utilization tracking** across both systems

### Key Benefits

- Unified incident-to-project workflow
- Real-time synchronization of status changes
- Audit trail across both systems
- Reduced manual data entry
- Better resource visibility

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      Radio Fleet Dispatch System                          │
│                                                                            │
│  ┌────────────────┐      ┌──────────────────┐      ┌─────────────────┐  │
│  │ Radio          │─────▶│ NLP Worker       │─────▶│ Policy Worker   │  │
│  │ Transmissions  │      │ (Entity Extract) │      │ (Rule Engine)   │  │
│  └────────────────┘      └──────────────────┘      └────────┬────────┘  │
│                                                               │            │
│                          ┌────────────────────────────────────┘            │
│                          │                                                 │
│                          ▼                                                 │
│                  ┌───────────────────┐                                    │
│                  │ PMO Adapter       │◀───────────────────┐               │
│                  │ (httpx client)    │                    │               │
│                  └─────────┬─────────┘                    │               │
│                            │                              │               │
└────────────────────────────┼──────────────────────────────┼───────────────┘
                             │ HTTP POST                    │ Webhooks
                             │                              │
         ┌───────────────────▼──────────────────────────────┴──────────────┐
         │                    PMO-Tool System                               │
         │                                                                  │
         │  ┌─────────────────────────────────────────────────────────┐   │
         │  │ Integration Routes                                       │   │
         │  │ /api/integrations/radio-dispatch/incident  (POST)       │   │
         │  │ /api/integrations/radio-dispatch/transmission (POST)    │   │
         │  │ /api/integrations/radio-dispatch/status (GET)           │   │
         │  └─────────────────────────────────────────────────────────┘   │
         │                            │                                    │
         │                            ▼                                    │
         │  ┌─────────────────────────────────────────────────────────┐   │
         │  │ Integration Service                                      │   │
         │  │ - createProjectFromIncident()                           │   │
         │  │ - createTaskFromTransmission()                          │   │
         │  │ - notifyTaskCompleted()                                 │   │
         │  │ - notifyProjectStatusChanged()                          │   │
         │  └─────────────────────────────────────────────────────────┘   │
         │                            │                                    │
         │                            ▼                                    │
         │            ┌───────────────────────────────┐                    │
         │            │ PostgreSQL Database           │                    │
         │            │ - projects                    │                    │
         │            │ - tasks                       │                    │
         │            │ - resources                   │                    │
         │            └───────────────────────────────┘                    │
         └──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Incident to Project**: Critical incidents auto-create projects in PMO-Tool
2. **Transmission to Task**: Radio transmissions create tasks linked to projects
3. **Asset to Resource**: Fleet assets sync to PMO resources
4. **Status Updates**: Bidirectional webhook notifications keep systems in sync

---

## Setup Instructions

### Prerequisites

- radio-fleet-dispatch running (Python 3.9+, FastAPI)
- PMO-Tool running (Node.js 18+, Express)
- PostgreSQL databases for both systems
- Redis for caching (optional but recommended)

### Step 1: Install Dependencies

**Radio-fleet-dispatch:**
```bash
cd /Users/andrewmorton/Documents/GitHub/radio-fleet-dispatch
pip install httpx tenacity  # If not already installed
```

**PMO-Tool:**
```bash
cd /Users/andrewmorton/Documents/GitHub/PMO-Tool
npm install axios  # If not already installed
```

### Step 2: Database Migrations

**Radio-fleet-dispatch:**
```bash
cd services/api
alembic upgrade head
# Or manually run: services/api/alembic/versions/add_pmo_integration_fields.py
```

**PMO-Tool:**
```bash
cd database/migrations
psql $DATABASE_URL -f add_radio_dispatch_fields.sql
```

### Step 3: Environment Configuration

**Radio-fleet-dispatch (.env):**
```bash
# Copy example and edit
cp .env.example .env

# Configure PMO integration
PMO_TOOL_ENABLED=true
PMO_TOOL_API_URL=http://localhost:3001
PMO_TOOL_API_KEY=your-secure-api-key-here
PMO_TOOL_WEBHOOK_SECRET=your-secure-webhook-secret-here
PMO_TOOL_AUTO_CREATE_PROJECTS=true
PMO_TOOL_AUTO_CREATE_TASKS=true
```

**PMO-Tool (.env):**
```bash
# Copy example and edit
cp .env.example .env

# Configure radio-dispatch integration
RADIO_DISPATCH_ENABLED=true
RADIO_DISPATCH_API_URL=http://localhost:8000
RADIO_DISPATCH_API_KEY=your-secure-api-key-here
RADIO_DISPATCH_WEBHOOK_URL=http://localhost:8000/webhooks/pmo
```

### Step 4: Generate API Keys

Use secure random strings for API keys:

```bash
# Generate secure keys (Linux/Mac)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or use OpenSSL
openssl rand -base64 32
```

Use the same key for both:
- `PMO_TOOL_API_KEY` in radio-dispatch
- `RADIO_DISPATCH_API_KEY` in PMO-Tool

### Step 5: Register Routes (PMO-Tool)

Edit `PMO-Tool/server/index.js` and add:

```javascript
// Import integration routes
const { router: radioDispatchRouter } = require('./routes/radio-dispatch');

// Register routes
app.use('/api/integrations/radio-dispatch', radioDispatchRouter);
```

### Step 6: Register Webhook Routes (Radio-dispatch)

Edit `radio-fleet-dispatch/services/api/app/main.py` and add:

```python
from app.integrations.pmo_webhook_handler import router as pmo_webhook_router

# Register webhook routes
app.include_router(pmo_webhook_router)
```

### Step 7: Deploy Policies

Copy example policies:

```bash
cp policies/pmo_integration_policy.yaml policies/active/
```

### Step 8: Restart Services

```bash
# Radio-dispatch
docker-compose restart api worker

# PMO-Tool
npm run dev:backend
```

---

## Configuration Reference

### Radio-Fleet-Dispatch Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PMO_TOOL_ENABLED` | boolean | `true` | Enable/disable PMO integration |
| `PMO_TOOL_API_URL` | string | `http://localhost:3001` | PMO-Tool base URL |
| `PMO_TOOL_API_KEY` | string | Required | API key for authentication |
| `PMO_TOOL_WEBHOOK_SECRET` | string | Required | Secret for webhook signature verification |
| `PMO_TOOL_AUTO_CREATE_PROJECTS` | boolean | `true` | Auto-create projects from incidents |
| `PMO_TOOL_AUTO_CREATE_TASKS` | boolean | `true` | Auto-create tasks from transmissions |
| `PMO_TOOL_AUTO_UPDATE_RESOURCES` | boolean | `false` | Auto-sync fleet assets to resources |

### PMO-Tool Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RADIO_DISPATCH_ENABLED` | boolean | `true` | Enable/disable radio-dispatch integration |
| `RADIO_DISPATCH_API_URL` | string | `http://localhost:8000` | Radio-dispatch base URL |
| `RADIO_DISPATCH_API_KEY` | string | Required | API key for authentication |
| `RADIO_DISPATCH_WEBHOOK_URL` | string | `http://localhost:8000/webhooks/pmo` | Webhook callback URL |

---

## API Mapping

### Incident → Project

**Radio-Dispatch Incident:**
```json
{
  "id": "uuid",
  "title": "Structure fire at 123 Main St",
  "description": "2-alarm fire with multiple units responding",
  "priority": "CRITICAL",
  "status": "in_progress",
  "location_geo": {"lat": 38.9072, "lng": -77.0369, "address": "123 Main St"},
  "opened_at": "2025-10-17T10:00:00Z"
}
```

**PMO-Tool Project:**
```json
{
  "id": "uuid",
  "name": "Structure fire at 123 Main St",
  "description": "2-alarm fire with multiple units responding",
  "project_type": "Emergency Response",
  "status": "active",
  "priority": "critical",
  "start_date": "2025-10-17T10:00:00Z",
  "radio_dispatch_incident_id": "uuid",
  "metadata": {
    "source": "radio-fleet-dispatch",
    "location": {"lat": 38.9072, "lng": -77.0369}
  }
}
```

### Transmission → Task

**Radio-Dispatch Transmission:**
```json
{
  "id": "uuid",
  "transcript": "Engine 5 responding code 3",
  "entities": {"unit_ids": ["Engine 5"], "statuses": ["responding"]},
  "priority": "high"
}
```

**PMO-Tool Task:**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "Engine 5 responding code 3",
  "description": "Engine 5 responding code 3",
  "status": "in_progress",
  "priority": "high",
  "radio_dispatch_transmission_id": "uuid",
  "metadata": {
    "source": "radio-fleet-dispatch",
    "units": ["Engine 5"]
  }
}
```

---

## Webhook Flows

### Task Completion Webhook

**Flow:**
1. User marks task as complete in PMO-Tool
2. PMO-Tool sends webhook to radio-dispatch
3. Radio-dispatch updates linked task status

**Webhook Payload:**
```json
{
  "event_type": "task.completed",
  "event_id": "uuid",
  "timestamp": "2025-10-17T11:00:00Z",
  "payload": {
    "id": "pmo-task-uuid",
    "radio_dispatch_task_id": "radio-task-uuid",
    "status": "completed",
    "completed_at": "2025-10-17T11:00:00Z"
  },
  "signature": "hmac-sha256-signature"
}
```

### Project Status Change Webhook

**Flow:**
1. Project status changes in PMO-Tool
2. PMO-Tool sends webhook to radio-dispatch
3. Radio-dispatch updates linked incident status

**Webhook Payload:**
```json
{
  "event_type": "project.status_changed",
  "event_id": "uuid",
  "timestamp": "2025-10-17T11:30:00Z",
  "payload": {
    "id": "pmo-project-uuid",
    "radio_dispatch_incident_id": "incident-uuid",
    "status": "completed",
    "updated_at": "2025-10-17T11:30:00Z"
  }
}
```

---

## Policy Configuration

Policies control when integration actions trigger. See `policies/pmo_integration_policy.yaml` for complete examples.

### Example: Auto-create Project

```yaml
- name: create_pmo_project_for_critical_incidents
  enabled: true
  rules: |
    conditions:
      all:
        - field: priority
          operator: equals
          value: CRITICAL
  then:
    - action: create_pmo_project
      params:
        project_name: "{{entities.incident_code}} - {{location}}"
        priority: critical
        assigned_to: dispatcher
```

### Policy Testing Workflow

1. **Monitor Only Mode** - Log actions without executing
   ```bash
   DEFAULT_OP_MODE=monitor_only
   ```

2. **HITL Mode** - Require human approval
   ```bash
   DEFAULT_OP_MODE=hitl
   ```

3. **Autonomous Mode** - Auto-execute actions
   ```bash
   DEFAULT_OP_MODE=autonomous_assist
   ```

---

## Testing

### Manual Testing

**1. Health Check:**
```bash
# Test PMO-Tool integration from radio-dispatch
curl http://localhost:8000/api/integrations/pmo/health

# Test radio-dispatch integration from PMO-Tool
curl http://localhost:3001/api/integrations/radio-dispatch/status
```

**2. Create Project from Incident:**
```bash
curl -X POST http://localhost:3001/api/integrations/radio-dispatch/incident \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "name": "Test Incident",
    "radio_dispatch_incident_id": "123e4567-e89b-12d3-a456-426614174000",
    "priority": "high",
    "status": "active"
  }'
```

**3. Create Task from Transmission:**
```bash
curl -X POST http://localhost:3001/api/integrations/radio-dispatch/transmission \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "project_id": "123e4567-e89b-12d3-a456-426614174001",
    "title": "Test Task",
    "radio_dispatch_transmission_id": "123e4567-e89b-12d3-a456-426614174002",
    "priority": "medium"
  }'
```

### Automated Integration Tests

Run integration tests:

```bash
# Radio-dispatch
cd radio-fleet-dispatch
pytest tests/integration/test_pmo_adapter.py -v

# PMO-Tool
cd PMO-Tool
npm run test:integration
```

---

## Troubleshooting

### Common Issues

**1. Authentication Failures**

**Symptom:** 401/403 errors on API calls

**Solution:**
- Verify API keys match in both systems
- Check Authorization header format: `Bearer YOUR_KEY`
- Ensure API keys are not expired

**2. Webhook Not Received**

**Symptom:** Status changes not syncing

**Solution:**
- Check webhook URL is accessible from PMO-Tool
- Verify webhook secret matches
- Check firewall/network policies
- Review logs: `tail -f logs/app.log`

**3. Database Linking Issues**

**Symptom:** Can't find linked projects/tasks

**Solution:**
- Run migrations to add linkage fields
- Verify UUIDs are being stored correctly
- Check database indexes: `EXPLAIN ANALYZE SELECT ...`

**4. Policy Not Triggering**

**Symptom:** No PMO projects created from incidents

**Solution:**
- Check operational mode: `DEFAULT_OP_MODE`
- Verify policy is enabled in YAML
- Review policy logs: `grep "policy_evaluation" logs/worker.log`
- Test policy conditions manually

### Debug Mode

Enable debug logging:

**Radio-dispatch:**
```bash
LOG_LEVEL=DEBUG
```

**PMO-Tool:**
```bash
LOG_LEVEL=debug
DEBUG=true
```

### Dry-Run Mode

Test integration without side effects:

```python
from app.integrations.pmo_adapter import PMOAdapter

adapter = PMOAdapter(dry_run=True)
# All operations will be logged but not executed
```

---

## Support

For issues or questions:

- Review logs in `logs/` directories
- Check database for linkage fields
- Verify environment configuration
- Test with dry-run mode first
- Contact: integration-support@example.com

---

## Version History

- **v1.0.0** (2025-10-17) - Initial integration release
  - Incident → Project mapping
  - Transmission → Task mapping
  - Bidirectional webhooks
  - Policy-based automation
