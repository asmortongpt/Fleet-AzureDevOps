# Radio Dispatch Service

AI-powered radio monitoring, transcription, and automated dispatch system for Fleet Management.

## Overview

The Radio Dispatch Service provides real-time monitoring of radio communications with automatic transcription, entity extraction, and policy-based automation. It enables dispatchers to:

- **Monitor live radio channels** with automatic transcription
- **Extract entities** (unit IDs, locations, incident codes) using NLP
- **Automate dispatch actions** based on configurable policies
- **Review and approve** automated actions (Human-in-the-Loop mode)
- **Track incident history** with searchable transcripts

## Architecture

### Components

1. **FastAPI Application** - RESTful API with Socket.IO for real-time updates
2. **Celery Workers** - Async processing for audio transcription and analysis
3. **Redis** - Task queue and caching
4. **PostgreSQL** - Data persistence
5. **Azure Cognitive Services** - Speech-to-Text transcription
6. **Azure Blob Storage** - Audio file storage

### Data Flow

```
Radio Audio → Upload → Azure Blob Storage
                ↓
         Queue for Processing (Celery)
                ↓
    Azure Speech-to-Text Transcription
                ↓
         NLP Entity Extraction
                ↓
      Policy Evaluation & Matching
                ↓
    ┌──────────┴──────────┐
    │                     │
HITL Mode          Autonomous Mode
    │                     │
Approval Queue    Auto-Execute Actions
    │                     │
    └──────────┬──────────┘
               │
    Create Incidents/Tasks via Fleet API
               │
    Real-time WebSocket Updates
```

## Features

### 1. Real-Time Transcription

- Azure Speech-to-Text integration
- Multiple audio format support (WAV, MP3, M4A)
- Confidence scoring
- Multi-language support

### 2. Entity Extraction

Automatically identifies:
- **Unit IDs**: E-42, M-12, P-201, etc.
- **Locations**: Addresses, intersections, landmarks
- **Incident Codes**: CODE 3, 10-50, SIGNAL 7
- **People**: Names mentioned in transmissions
- **Organizations**: Referenced agencies

### 3. Intent Classification

- `medical_emergency` - EMS, CPR, medical calls
- `fire` - Fire, smoke, structure fires
- `traffic` - Accidents, collisions, traffic incidents
- `law_enforcement` - Police, arrests, crimes
- `dispatch_request` - Request for units
- `status_update` - On scene, arrived, clear

### 4. Priority Detection

- **CRITICAL**: Code 3, CPR, fire, active shooter
- **HIGH**: Code 2, assault, medical
- **NORMAL**: Code 1, routine calls
- **LOW**: Non-emergency, welfare checks

### 5. Policy Automation

Three operating modes:

**Monitor Only**
- Track and log transmissions
- No automated actions

**HITL (Human-in-the-Loop)**
- Queue actions for approval
- Dispatcher reviews before execution
- Default and recommended mode

**Autonomous**
- Execute actions automatically
- No human approval required
- Use with caution

### Policy Examples

```json
{
  "name": "Auto-Dispatch Critical Emergencies",
  "conditions": {
    "any": [
      {"field": "priority", "operator": "equals", "value": "CRITICAL"},
      {"field": "intent", "operator": "in", "value": ["medical_emergency", "fire"]}
    ]
  },
  "actions": [
    {
      "action": "create_incident",
      "priority": "CRITICAL",
      "type": "emergency_response"
    },
    {
      "action": "create_task",
      "title": "Dispatch unit to {location}",
      "assigned_to": "dispatch_team"
    }
  ],
  "operating_mode": "hitl"
}
```

## Installation

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Azure account with:
  - Cognitive Services (Speech API)
  - Blob Storage account
- Docker (optional, recommended)

### Local Development

1. **Clone and install dependencies**:

```bash
cd services/radio-dispatch
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

2. **Configure environment**:

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Run database migrations**:

```bash
psql -U fleetadmin -d fleetdb -f ../../database/migrations/20251124_add_radio_dispatch_schema.sql
psql -U fleetadmin -d fleetdb -f sample_data.sql
```

4. **Start services**:

```bash
# Terminal 1: API server
uvicorn app.main:app_with_socketio --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Celery worker
celery -A app.workers.celery_app worker --loglevel=info --concurrency=4
```

### Docker Deployment

```bash
# Start all services
docker-compose -f docker-compose.yml -f docker-compose.radio.yml up -d

# View logs
docker-compose logs -f radio-dispatch-api
docker-compose logs -f radio-dispatch-worker
```

### Kubernetes Deployment

```bash
# Apply database migration
kubectl exec -it <postgres-pod> -- psql -U fleetadmin -d fleetdb < database/migrations/20251124_add_radio_dispatch_schema.sql

# Deploy radio dispatch services
kubectl apply -f services/radio-dispatch/k8s/deployment.yaml

# Verify deployment
kubectl get pods -n fleet-production | grep radio-dispatch
kubectl logs -f deployment/radio-dispatch-api -n fleet-production
```

## API Reference

### Base URL

- Local: `http://localhost:8000/api/v1`
- Production: `https://fleet.capitaltechalliance.com/api/v1`

### Endpoints

#### Transmissions

**POST /transmissions/upload**
Upload audio file for processing

```bash
curl -X POST http://localhost:8000/api/v1/transmissions/upload \
  -F "channel_id=<uuid>" \
  -F "org_id=<uuid>" \
  -F "audio=@recording.wav"
```

**GET /transmissions**
List transmissions with filtering

```bash
curl "http://localhost:8000/api/v1/transmissions?priority=CRITICAL&page=1&per_page=50"
```

**GET /transmissions/{id}**
Get transmission details

#### Channels

**POST /channels**
Create radio channel

**GET /channels**
List channels

**PUT /channels/{id}**
Update channel configuration

#### Policies

**POST /policies**
Create automation policy

**GET /policies**
List policies

**GET /policies/executions/pending**
Get pending approvals (HITL queue)

**POST /policies/executions/{id}/approve**
Approve pending action

**POST /policies/executions/{id}/reject**
Reject pending action

## Socket.IO Events

### Client → Server

- `subscribe_channel` - Subscribe to channel updates
- `unsubscribe_channel` - Unsubscribe from channel

### Server → Client

- `connection_established` - Connection confirmed
- `subscribed` - Channel subscription confirmed
- `new_transmission` - New transmission received
- `transcript_updated` - Transcription complete
- `policy_triggered` - Policy matched (pending approval)

## Configuration

### Environment Variables

See `.env.example` for full configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `AZURE_SPEECH_KEY` - Azure Cognitive Services API key
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Blob Storage
- `JWT_SECRET_KEY` - JWT signing key

**Optional:**
- `ANTHROPIC_API_KEY` - Claude API for advanced NLP
- `OPENAI_API_KEY` - GPT API for advanced NLP
- `FLEET_API_KEY` - Fleet API authentication

### Policy Configuration

Policies support complex conditions:

**Operators:**
- `equals`, `not_equals` - Exact match
- `in`, `not_in` - List membership
- `contains` - Substring/array contains
- `not_empty`, `empty` - Existence checks
- `greater_than`, `less_than` - Numeric comparison

**Logic:**
- `all` - AND logic (all conditions must match)
- `any` - OR logic (any condition matches)

## Testing

### Unit Tests

```bash
pytest tests/ -v --cov=app
```

### Integration Tests

```bash
pytest tests/integration/ -v
```

### Load Testing

```bash
# Simulate 100 concurrent transmissions
pytest tests/load/test_transmission_processing.py
```

## Monitoring

### Prometheus Metrics

Exposed at `/metrics`:

- `radio_transmissions_total` - Total transmissions processed
- `radio_transcription_duration_seconds` - Transcription latency
- `radio_policy_matches_total` - Policy match count
- `celery_task_duration_seconds` - Worker task duration

### Logs

Structured JSON logging to stdout:

```json
{
  "timestamp": "2025-11-24T12:00:00Z",
  "level": "info",
  "logger": "app.services.transcription",
  "message": "Transcription successful",
  "transmission_id": "uuid",
  "confidence": 0.92
}
```

## Troubleshooting

### Audio Processing Fails

**Problem**: Transcription errors or timeouts

**Solutions**:
1. Check Azure Speech Service quota
2. Verify audio format (16kHz WAV recommended)
3. Check network connectivity to Azure
4. Review Celery worker logs

### Policy Not Triggering

**Problem**: Expected policy doesn't execute

**Solutions**:
1. Verify policy `is_active = true`
2. Check condition logic (use `/policies/test` endpoint)
3. Verify entity extraction results
4. Review policy priority order

### Socket.IO Connection Issues

**Problem**: Real-time updates not working

**Solutions**:
1. Check CORS configuration
2. Verify WebSocket support on proxy/load balancer
3. Check Socket.IO client connection logs
4. Verify firewall allows WebSocket traffic

## Security

### Production Checklist

- ✅ Run as non-root user (UID 1001/1002)
- ✅ Use secrets management (Azure Key Vault)
- ✅ Enable TLS/HTTPS
- ✅ Parameterized database queries
- ✅ JWT authentication
- ✅ CORS restricted to known origins
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ Audit logging enabled

### Sensitive Data

Audio files may contain PII. Ensure:
- Azure Blob Storage has private access
- Encryption at rest enabled
- Retention policies configured
- Access logs monitored

## Performance

### Benchmarks

- Transcription: ~1.2x real-time (30s audio → 36s)
- Entity extraction: <500ms per transcript
- Policy evaluation: <100ms per transmission
- End-to-end latency: <45s for full pipeline

### Scaling

- **API**: Horizontal scaling, 2-10 replicas
- **Workers**: Auto-scale based on queue depth (3-20 replicas)
- **Database**: Connection pooling (10-20 connections)
- **Redis**: Single instance sufficient for <10k transmissions/day

## License

Proprietary - Capital Tech Alliance

## Support

For issues or questions:
- GitHub Issues: https://github.com/CapitalTechAlliance/Fleet/issues
- Email: support@capitaltechalliance.com
