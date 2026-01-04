# Quick Start Guide - Celery Workers

Get the Radio Fleet Dispatch Celery workers running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database running
- Redis instance (or use Docker Compose to start one)
- Azure Speech API key (for transcription)
- Azure Blob Storage account (for audio files)

## Quick Start (Docker)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Minimum required variables:**

```env
DATABASE_URL=postgresql://user:password@host:5432/radio_fleet_dispatch
REDIS_URL=redis://localhost:6379/0
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_SPEECH_KEY=your_api_key_here
AZURE_SPEECH_REGION=eastus
```

### 2. Start Workers

```bash
# Start all workers with Redis
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Monitor with Flower

```bash
# Start Flower monitoring UI
docker-compose --profile monitoring up -d flower

# Open browser
open http://localhost:5555
```

### 4. Test Task Submission

```python
from app.transcription_worker import process_audio

# Submit task to queue
task = process_audio.delay("transmission-uuid-here")

# Check status
print(task.status)  # PENDING, STARTED, SUCCESS, FAILURE

# Get result (blocks until complete)
result = task.get(timeout=300)
print(result)
```

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Download spaCy model (optional, for advanced NLP)
python -m spacy download en_core_web_sm
```

### 2. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or use brew (macOS)
brew install redis
redis-server
```

### 3. Configure Environment

```bash
# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/radio_fleet_dispatch"
export REDIS_URL="redis://localhost:6379/0"
export AZURE_STORAGE_CONNECTION_STRING="..."
export AZURE_SPEECH_KEY="..."
export AZURE_SPEECH_REGION="eastus"
```

### 4. Start Workers

```bash
# Start all workers
make worker-all

# Or start specific worker queues in separate terminals
make worker QUEUE=transcription
make worker QUEUE=nlp
make worker QUEUE=policy

# Start Celery Beat (periodic tasks)
make beat
```

### 5. Monitor

```bash
# Start Flower
make flower

# Or use Celery CLI
celery -A app.celery_app inspect active
celery -A app.celery_app inspect stats
```

## Task Flow

```
1. Audio Upload
   ↓
2. Submit transcription task
   → celery -A app.celery_app send_task app.transcription_worker.process_audio '["transmission-uuid"]'
   ↓
3. Worker processes audio
   ↓
4. Transcript stored in database
   ↓
5. NLP task automatically queued (via Kafka event)
   ↓
6. Entities/intent extracted
   ↓
7. Policy evaluation task queued
   ↓
8. Policies evaluated, actions triggered
```

## Common Commands

```bash
# View worker status
make celery-status

# View logs
make logs

# Scale workers
make scale SVC=nlp-worker N=3

# Purge all queued tasks
make purge

# Run health check
make health

# Stop all workers
make stop

# Restart workers
make restart
```

## Testing Individual Workers

### Test Transcription Worker

```bash
# Submit test task
celery -A app.celery_app send_task app.transcription_worker.process_audio \
  '["test-transmission-id"]' \
  --queue=transcription

# Check logs
docker-compose logs -f transcription-worker
```

### Test NLP Worker

```bash
# Submit test task
celery -A app.celery_app send_task app.nlp_worker.process_transcript \
  '["test-transmission-id"]' \
  --queue=nlp

# Check logs
docker-compose logs -f nlp-worker
```

### Test Policy Worker

```bash
# Submit test task
celery -A app.celery_app send_task app.policy_worker.evaluate_policies \
  '["test-transmission-id"]' \
  --queue=policy

# Check logs
docker-compose logs -f policy-worker
```

## Operational Modes

### Monitor Only Mode

Policies are evaluated but no actions are executed.

```env
DEFAULT_OP_MODE=monitor_only
```

```bash
# Restart workers to apply
docker-compose restart policy-worker
```

### HITL (Human-in-the-Loop) Mode

Policies create pending actions for human approval.

```env
DEFAULT_OP_MODE=hitl
```

This is the **recommended default** for production.

### Autonomous Assist Mode

Policies automatically execute actions without approval.

```env
DEFAULT_OP_MODE=autonomous_assist
```

⚠️ **Use with caution.** Requires thorough policy testing.

## Troubleshooting

### Workers Not Starting

```bash
# Check logs
docker-compose logs

# Check environment variables
make check-env

# Restart Redis
docker-compose restart redis
```

### Tasks Not Processing

```bash
# Check worker connectivity
celery -A app.celery_app inspect ping

# Check active queues
celery -A app.celery_app inspect active_queues

# Check Redis
redis-cli ping
```

### Azure API Errors

```bash
# Check credentials
echo $AZURE_SPEECH_KEY
echo $AZURE_STORAGE_CONNECTION_STRING

# Test Azure connectivity
az storage container list --connection-string "$AZURE_STORAGE_CONNECTION_STRING"
```

### High Memory Usage

```bash
# Check worker stats
celery -A app.celery_app inspect stats

# Reduce concurrency
# Edit docker-compose.yml and change --concurrency flag

# Restart workers more frequently
# Edit docker-compose.yml and add: --max-tasks-per-child=100
```

## Production Deployment

### Build Production Image

```bash
docker build --target production -t radio-fleet-workers:latest .
```

### Push to Registry

```bash
# Azure Container Registry
az acr login --name <registry-name>
docker tag radio-fleet-workers:latest <registry-name>.azurecr.io/radio-fleet-workers:latest
docker push <registry-name>.azurecr.io/radio-fleet-workers:latest
```

### Deploy to AKS

```bash
# Update Kubernetes manifests with image
kubectl set image deployment/transcription-worker \
  transcription-worker=<registry-name>.azurecr.io/radio-fleet-workers:latest

# Or apply new deployment
kubectl apply -f k8s/workers/
```

## Next Steps

1. Review **README.md** for full documentation
2. Customize policies in **example_policies.yml**
3. Set up monitoring with Flower and Application Insights
4. Configure Kafka/Event Hub for event-driven architecture
5. Implement database models for full integration
6. Add custom workers for your specific use cases

## Support

For issues or questions:
- Check **README.md** for detailed documentation
- Review **example_policies.yml** for policy syntax
- Consult worker logs: `docker-compose logs -f <worker>`
- Monitor with Flower: http://localhost:5555

## Security Checklist

- [ ] Environment variables loaded from secure source (Azure Key Vault, K8s secrets)
- [ ] No secrets in code or version control
- [ ] TLS enabled for Redis, Kafka, and database connections
- [ ] Workers running as non-root user (production image)
- [ ] Audit logging enabled for all policy actions
- [ ] FedRAMP compliance controls implemented

---

**Deployment Date:** 2025-10-17
**Version:** 1.0.0
**Maintainer:** Capital Tech Alliance
