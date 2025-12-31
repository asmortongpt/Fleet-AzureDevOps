# Radio Fleet Dispatch - Celery Workers

Asynchronous task processing system for the Radio Fleet Dispatch platform.

## Overview

This service contains three specialized Celery workers that process radio transmissions:

1. **Transcription Worker** - Converts audio to text using Azure Speech-to-Text
2. **NLP Worker** - Extracts entities, detects intent, and tags transmissions
3. **Policy Worker** - Evaluates YAML-based policies and triggers automated actions

## Architecture

```
┌─────────────────┐
│  Radio API      │
│  (Ingests audio)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Kafka/EventHub │────▶│ Redis Broker │
└─────────────────┘     └──────┬───────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────┐  ┌──────────────────┐
│ Transcription    │ │ NLP Worker   │  │ Policy Worker    │
│ Worker           │ │              │  │                  │
│ - Azure Speech   │ │ - Entities   │  │ - YAML Rules     │
│ - Blob Storage   │ │ - Intent     │  │ - HITL/Auto Mode │
│ - Diarization    │ │ - Priority   │  │ - Audit Trail    │
└──────────────────┘ └──────────────┘  └──────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  PostgreSQL DB   │
                    │  (Transcripts,   │
                    │   Entities,      │
                    │   Audit Logs)    │
                    └──────────────────┘
```

## Queue Architecture

- **transcription** - High priority (10), processes audio files
- **nlp** - Medium priority (5), processes transcripts
- **policy** - High-medium priority (7), evaluates policies
- **default** - Low priority (3), miscellaneous tasks

## Workers

### Transcription Worker

**Queue:** `transcription`
**Concurrency:** 2 (I/O bound, Azure API limited)
**Time Limit:** 5 minutes

**Responsibilities:**
- Download audio from Azure Blob Storage
- Call Azure Speech-to-Text API
- Store transcript in database
- Publish `TranscriptionCompleted` event

**Configuration:**
```env
AZURE_STORAGE_CONNECTION_STRING=<connection_string>
AZURE_STORAGE_CONTAINER=radio-transmissions
AZURE_SPEECH_KEY=<api_key>
AZURE_SPEECH_REGION=eastus
TRANSCRIPTION_LANGUAGE=en-US
ENABLE_DIARIZATION=true
MAX_SPEAKERS=10
```

### NLP Worker

**Queue:** `nlp`
**Concurrency:** 4 (CPU bound, but lightweight)
**Time Limit:** 5 minutes

**Responsibilities:**
- Extract entities (unit IDs, locations, incident codes, etc.)
- Detect intent (dispatch, status update, request assistance, etc.)
- Calculate priority (high, medium, low)
- Generate tags
- Publish `TransmissionTagged` event

**Configuration:**
```env
ENABLE_ADVANCED_NLP=false  # Use spaCy for advanced NLP
ENTITY_EXTRACTION_CONFIDENCE_THRESHOLD=0.7
INTENT_DETECTION_CONFIDENCE_THRESHOLD=0.6
```

**Entity Patterns:**
- Unit IDs: `Engine 5`, `Medic 3`, `Car 24`
- Locations: `123 Main Street`, `intersection of 5th and Oak`
- Incident codes: `10-50`, `Signal 7`, `Code 3`
- Status: `en route`, `on scene`, `available`
- Personnel count: `2 people`, `three victims`
- ETA: `ETA 5 minutes`

### Policy Worker

**Queue:** `policy`
**Concurrency:** 3
**Time Limit:** 30 seconds

**Responsibilities:**
- Load active policies from database
- Evaluate YAML policy rules
- Execute actions based on operational mode
- Create audit trail
- Publish `PolicyEvaluationCompleted` event

**Configuration:**
```env
DEFAULT_OP_MODE=hitl  # monitor_only, hitl, autonomous_assist
POLICY_EVALUATION_TIMEOUT=30
MAX_POLICIES_PER_EVALUATION=100
ENABLE_POLICY_CACHING=true
POLICY_CACHE_TTL=300
```

**Operational Modes:**

1. **monitor_only** - Log matched policies but take no action
2. **hitl** (Human-in-the-Loop) - Create pending actions for human approval
3. **autonomous_assist** - Automatically execute policy actions

**Policy YAML Format:**

```yaml
conditions:
  all:  # or 'any' for OR logic
    - field: priority
      operator: equals
      value: high
    - field: tags
      operator: contains
      value: "code:code_3"
    - field: entities.incident_codes
      operator: contains_any
      value: ["code 3", "code red"]
```

**Supported Operators:**
- `equals`, `not_equals`
- `contains`, `not_contains`
- `contains_any`, `contains_all`
- `greater_than`, `less_than`
- `regex_match`

**Supported Actions:**
- `create_incident` - Create incident from transmission
- `assign_unit` - Assign unit to incident
- `notify` - Send notification (email, SMS, etc.)
- `escalate` - Escalate priority/visibility
- `create_task` - Create task for dispatcher
- `update_status` - Update transmission status
- `log_event` - Log custom event

## Task Flow

```
1. Audio Uploaded → Transcription Task Queued
              ↓
2. Transcription Worker Processes Audio
              ↓
3. Transcript Stored → NLP Task Queued
              ↓
4. NLP Worker Extracts Entities/Intent
              ↓
5. Tags Stored → Policy Evaluation Task Queued
              ↓
6. Policy Worker Evaluates Rules
              ↓
7. Actions Executed (based on op mode)
              ↓
8. Audit Log Created
```

## Installation

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Download spaCy model (if using advanced NLP)
python -m spacy download en_core_web_sm

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start workers (requires Redis running)
celery -A app.celery_app worker --loglevel=info

# Start specific worker queue
celery -A app.celery_app worker --queues=transcription --loglevel=info

# Start Celery Beat (periodic tasks)
celery -A app.celery_app beat --loglevel=info

# Monitor with Flower
celery -A app.celery_app flower --port=5555
# Open http://localhost:5555
```

### Docker

```bash
# Build image
docker build -t radio-fleet-workers:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f transcription-worker
docker-compose logs -f nlp-worker
docker-compose logs -f policy-worker

# Scale workers
docker-compose up -d --scale nlp-worker=3

# Monitor with Flower
docker-compose --profile monitoring up -d flower
# Open http://localhost:5555
```

### Kubernetes

```bash
# Build and push image
docker build -t <registry>/radio-fleet-workers:latest .
docker push <registry>/radio-fleet-workers:latest

# Deploy to AKS
kubectl apply -f k8s/workers/

# Scale deployment
kubectl scale deployment transcription-worker --replicas=3
kubectl scale deployment nlp-worker --replicas=5
kubectl scale deployment policy-worker --replicas=2

# View logs
kubectl logs -l app=transcription-worker -f
kubectl logs -l app=nlp-worker -f
kubectl logs -l app=policy-worker -f
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MODE` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka bootstrap servers | `localhost:9092` |
| `EVENT_HUB_CONNECTION_STRING` | Azure Event Hub connection | Optional |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage | Required |
| `AZURE_STORAGE_CONTAINER` | Blob container name | `radio-transmissions` |
| `AZURE_SPEECH_KEY` | Azure Speech API key | Required |
| `AZURE_SPEECH_REGION` | Azure Speech region | `eastus` |
| `DEFAULT_OP_MODE` | Policy operational mode | `hitl` |
| `TASK_TIME_LIMIT` | Task hard time limit (seconds) | `300` |
| `TASK_SOFT_TIME_LIMIT` | Task soft time limit (seconds) | `270` |
| `TASK_MAX_RETRIES` | Max retry attempts | `3` |
| `WORKER_CONCURRENCY` | Worker concurrency | `4` |

### Celery Configuration

Workers are configured with:

- **Serialization:** JSON (secure, compatible)
- **Acknowledgment:** Late acknowledgment (after task completion)
- **Retry:** Exponential backoff with jitter
- **Time limits:** Hard (5 min) and soft (4.5 min) limits
- **Memory management:** Restart after 1000 tasks
- **Result expiration:** 1 hour

## Monitoring

### Flower Web UI

Celery monitoring dashboard:

```bash
celery -A app.celery_app flower --port=5555
```

Features:
- Real-time task monitoring
- Worker status and statistics
- Task history and details
- Task rate limiting
- Worker pool management

### Metrics

Workers emit metrics for:
- Task execution time
- Task success/failure rates
- Queue lengths
- Worker concurrency
- Retry counts

**OpenTelemetry Integration:**

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_SERVICE_NAME=radio-fleet-workers
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

### Health Checks

Workers expose health check endpoints:

```bash
# Check worker health
celery -A app.celery_app inspect ping

# Check active tasks
celery -A app.celery_app inspect active

# Check registered tasks
celery -A app.celery_app inspect registered

# Check worker stats
celery -A app.celery_app inspect stats
```

## Error Handling

### Retry Strategy

Tasks automatically retry on:
- `AzureError` - Azure service errors
- `ConnectionError` - Network/database errors

**Retry configuration:**
- Max retries: 3
- Backoff: Exponential with jitter
- Base delay: 60 seconds
- Max delay: 600 seconds (10 minutes)

### Time Limits

- **Hard limit:** Task is killed after 5 minutes
- **Soft limit:** Task receives `SoftTimeLimitExceeded` after 4.5 minutes

Tasks should handle `SoftTimeLimitExceeded` gracefully to clean up resources.

### Error Logging

Errors are logged with:
- Task ID and name
- Exception details and traceback
- Task arguments
- Retry count
- Worker hostname

## Security

### FedRAMP Compliance

Workers implement FedRAMP security controls:

- **SC-8:** Encryption in transit (TLS 1.2+)
  - Redis: TLS connections
  - Kafka: SASL/SSL
  - Azure: HTTPS only

- **AC-17:** Remote access encryption
  - All external API calls over HTTPS

- **SI-10:** Input validation
  - Validate transmission data
  - Sanitize YAML policy content

- **AU-2:** Audit logging
  - Full audit trail for policy actions
  - Immutable audit logs

### Secrets Management

**Never hardcode secrets.** Use:

1. **Azure Key Vault** (production)
2. **Environment variables** (development)
3. **Kubernetes secrets** (AKS)

```python
# Good
azure_speech_key = settings.azure_speech_key

# Bad
azure_speech_key = "abc123..."  # NEVER DO THIS
```

## Testing

```bash
# Run tests
pytest tests/

# Run with coverage
pytest --cov=app tests/

# Test specific worker
pytest tests/test_transcription_worker.py

# Integration tests (requires Redis)
pytest tests/integration/
```

## Troubleshooting

### Worker Not Processing Tasks

1. Check worker is running: `celery -A app.celery_app inspect ping`
2. Check queue routing: `celery -A app.celery_app inspect active_queues`
3. Check Redis connection: `redis-cli ping`
4. Check logs: `docker-compose logs -f <worker>`

### High Memory Usage

1. Lower `worker_max_tasks_per_child` to restart workers more frequently
2. Reduce `worker_concurrency`
3. Check for memory leaks in task code
4. Monitor with `celery -A app.celery_app inspect stats`

### Slow Task Processing

1. Check worker concurrency: Increase for I/O bound tasks
2. Check queue priorities: Ensure high-priority tasks aren't blocked
3. Check external API response times (Azure Speech, etc.)
4. Monitor with Flower: http://localhost:5555

### Tasks Timing Out

1. Increase `task_time_limit` if legitimately slow
2. Check if task is CPU/I/O bound and optimize
3. Split long-running tasks into smaller subtasks
4. Check external API timeouts

## Development

### Adding a New Worker

1. Create worker file: `app/<name>_worker.py`
2. Define task with `@celery_app.task` decorator
3. Add queue to `celery_app.py` configuration
4. Update `docker-compose.yml` with new worker service
5. Document in this README

### Adding a New Task

```python
from app.celery_app import celery_app

@celery_app.task(
    name="app.my_worker.my_task",
    bind=True,
    time_limit=300,
    soft_time_limit=270,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 60},
)
def my_task(self, arg1, arg2):
    """Task docstring."""
    # Task implementation
    pass
```

## Contributing

1. Follow code style: PEP 8
2. Add tests for new tasks
3. Update documentation
4. Test with `docker-compose` before submitting PR

## License

Proprietary - Capital Tech Alliance
