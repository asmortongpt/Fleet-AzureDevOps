# Radio Dispatch Integration Guide

## Overview

This document provides step-by-step instructions for deploying the AI-powered radio dispatch system to production.

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Radio Audio   │────>│  Radio Dispatch  │────>│   Fleet API     │
│    Streams      │     │     Service      │     │  (Incidents/    │
└─────────────────┘     └──────────────────┘     │   Tasks)        │
                               │                  └─────────────────┘
                               │
                        ┌──────┴──────┐
                        │             │
                  ┌─────▼─────┐ ┌────▼─────┐
                  │   Azure   │ │  Celery  │
                  │   Speech  │ │  Workers │
                  └───────────┘ └──────────┘
```

## Deployment Steps

### Phase 1: Database Setup

1. **Run database migration**:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Apply schema
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}' -n fleet-production) -n fleet-production -- \
  psql -U fleetadmin -d fleetdb -f - < database/migrations/20251124_add_radio_dispatch_schema.sql

# Load sample data (optional)
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}' -n fleet-production) -n fleet-production -- \
  psql -U fleetadmin -d fleetdb -f - < services/radio-dispatch/sample_data.sql
```

2. **Verify schema**:

```bash
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}' -n fleet-production) -n fleet-production -- \
  psql -U fleetadmin -d fleetdb -c "\dt radio_*"
```

Expected output:
- radio_channels
- radio_transmissions
- dispatch_policies
- dispatch_policy_executions
- audio_processing_queue

### Phase 2: Azure Services Configuration

1. **Create Azure Speech Service**:

```bash
# Create resource group (if not exists)
az group create --name FleetProduction --location eastus

# Create Cognitive Services account
az cognitiveservices account create \
  --name fleet-speech-service \
  --resource-group FleetProduction \
  --kind SpeechServices \
  --sku S0 \
  --location eastus

# Get API key
az cognitiveservices account keys list \
  --name fleet-speech-service \
  --resource-group FleetProduction
```

2. **Create Azure Blob Storage**:

```bash
# Create storage account
az storage account create \
  --name fleetradioaudio \
  --resource-group FleetProduction \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name radio-audio \
  --account-name fleetradioaudio \
  --public-access off

# Get connection string
az storage account show-connection-string \
  --name fleetradioaudio \
  --resource-group FleetProduction
```

3. **Store secrets in Azure Key Vault**:

```bash
# Create Key Vault (if not exists)
az keyvault create \
  --name fleet-keyvault \
  --resource-group FleetProduction \
  --location eastus

# Store Speech API key
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name azure-speech-key \
  --value "<your-speech-key>"

# Store Storage connection string
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name azure-storage-connection-string \
  --value "<your-connection-string>"
```

### Phase 3: Kubernetes Secrets

1. **Create Kubernetes secrets**:

```bash
# Create azure-secrets
kubectl create secret generic azure-secrets \
  --from-literal=speech-key="<your-speech-key>" \
  --from-literal=storage-connection-string="<your-storage-conn-string>" \
  --namespace=fleet-production

# Create ai-secrets (optional)
kubectl create secret generic ai-secrets \
  --from-literal=anthropic-key="${ANTHROPIC_API_KEY}" \
  --from-literal=openai-key="${OPENAI_API_KEY}" \
  --namespace=fleet-production
```

2. **Verify secrets**:

```bash
kubectl get secrets -n fleet-production | grep -E "azure-secrets|ai-secrets"
```

### Phase 4: Build and Push Docker Images

1. **Build images**:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/services/radio-dispatch

# Build API image
docker build -t acrcapitaltech.azurecr.io/fleet-radio-dispatch-api:latest -f Dockerfile .

# Build worker image
docker build -t acrcapitaltech.azurecr.io/fleet-radio-dispatch-worker:latest -f Dockerfile.celery .
```

2. **Push to Azure Container Registry**:

```bash
# Login to ACR
az acr login --name acrcapitaltech

# Push images
docker push acrcapitaltech.azurecr.io/fleet-radio-dispatch-api:latest
docker push acrcapitaltech.azurecr.io/fleet-radio-dispatch-worker:latest
```

### Phase 5: Deploy to AKS

1. **Deploy services**:

```bash
kubectl apply -f services/radio-dispatch/k8s/deployment.yaml
```

2. **Verify deployment**:

```bash
# Check pods
kubectl get pods -n fleet-production | grep radio-dispatch

# Check services
kubectl get svc -n fleet-production | grep radio-dispatch

# Check HPA
kubectl get hpa -n fleet-production | grep radio-dispatch
```

3. **View logs**:

```bash
# API logs
kubectl logs -f deployment/radio-dispatch-api -n fleet-production

# Worker logs
kubectl logs -f deployment/radio-dispatch-worker -n fleet-production
```

### Phase 6: Frontend Integration

1. **Add Socket.IO client dependency**:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
npm install socket.io-client
```

2. **Add environment variable**:

```bash
# Add to .env.production
echo "VITE_RADIO_SOCKET_URL=https://fleet.capitaltechalliance.com" >> .env.production
```

3. **Add route to main app**:

```typescript
// src/App.tsx or router config
import RadioDispatchPage from '@/pages/radio';

// Add route
{
  path: '/radio',
  element: <RadioDispatchPage />,
}
```

4. **Add navigation item**:

```typescript
// src/components/Navigation.tsx
<NavigationItem
  icon={Radio}
  label="Radio Dispatch"
  href="/radio"
/>
```

### Phase 7: Ingress Configuration

1. **Update ingress to route /api/v1/radio**:

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fleet-ingress
  namespace: fleet-production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/websocket-services: radio-dispatch-api
spec:
  rules:
  - host: fleet.capitaltechalliance.com
    http:
      paths:
      - path: /api/v1/radio
        pathType: Prefix
        backend:
          service:
            name: radio-dispatch-api
            port:
              number: 8000
      - path: /socket.io
        pathType: Prefix
        backend:
          service:
            name: radio-dispatch-api
            port:
              number: 8000
```

2. **Apply ingress**:

```bash
kubectl apply -f k8s/ingress.yaml
```

### Phase 8: Testing

1. **Health check**:

```bash
curl https://fleet.capitaltechalliance.com/api/v1/radio/health
```

Expected: `{"status": "healthy", ...}`

2. **Test upload**:

```bash
curl -X POST https://fleet.capitaltechalliance.com/api/v1/radio/transmissions/upload \
  -H "Authorization: Bearer <token>" \
  -F "channel_id=<uuid>" \
  -F "org_id=<uuid>" \
  -F "audio=@test_audio.wav"
```

3. **Test Socket.IO**:

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c "wss://fleet.capitaltechalliance.com/socket.io/?transport=websocket"
```

### Phase 9: Monitoring Setup

1. **Create Prometheus ServiceMonitor**:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: radio-dispatch-api
  namespace: fleet-production
spec:
  selector:
    matchLabels:
      app: radio-dispatch-api
  endpoints:
  - port: http
    path: /metrics
```

2. **Create Grafana dashboard**:

Import dashboard from `services/radio-dispatch/monitoring/grafana-dashboard.json`

3. **Set up alerts**:

```yaml
# Alert: High processing queue
- alert: RadioDispatchQueueBacklog
  expr: celery_queue_length{queue="audio_processing"} > 100
  for: 5m
  annotations:
    summary: "Radio dispatch queue backlog"
```

## Configuration

### Sample Policy Configuration

```sql
-- Create policy via SQL
INSERT INTO dispatch_policies (org_id, name, description, conditions, actions, operating_mode)
VALUES (
  '<your-org-id>',
  'Auto-Dispatch Critical Emergencies',
  'Automatically create incident for critical emergencies',
  '{"any": [{"field": "priority", "operator": "equals", "value": "CRITICAL"}]}'::jsonb,
  '[{"action": "create_incident", "priority": "CRITICAL"}]'::jsonb,
  'hitl'
);
```

### Sample Channel Configuration

```sql
-- Create radio channel via SQL
INSERT INTO radio_channels (org_id, name, talkgroup, source_type, source_config)
VALUES (
  '<your-org-id>',
  'Fire Dispatch Channel 1',
  'FD-01',
  'HTTP',
  '{"url": "http://radio-stream.example.com/fd01", "format": "wav"}'::jsonb
);
```

## Troubleshooting

### Issue: Pods not starting

**Check:**
```bash
kubectl describe pod <pod-name> -n fleet-production
kubectl logs <pod-name> -n fleet-production
```

**Common causes:**
- Missing secrets
- Image pull errors
- Resource limits

### Issue: Transcription failures

**Check:**
1. Azure Speech Service quota
2. Audio file format
3. Network connectivity

```bash
# Test Azure Speech from pod
kubectl exec -it <pod-name> -n fleet-production -- curl https://<region>.api.cognitive.microsoft.com/sts/v1.0/issuetoken
```

### Issue: Socket.IO not connecting

**Check:**
1. Ingress WebSocket annotations
2. CORS configuration
3. Firewall rules

```bash
# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://fleet.capitaltechalliance.com/socket.io/
```

## Performance Tuning

### Celery Workers

Adjust worker count based on load:

```bash
# Scale workers
kubectl scale deployment radio-dispatch-worker --replicas=10 -n fleet-production
```

### Database Connection Pool

```python
# app/core/config.py
DB_POOL_SIZE = 20
DB_MAX_OVERFLOW = 40
```

### Redis Memory

```bash
# Check Redis memory
kubectl exec -it fleet-redis -n fleet-production -- redis-cli info memory
```

## Rollback Procedure

If issues arise:

1. **Rollback Kubernetes deployment**:

```bash
kubectl rollout undo deployment/radio-dispatch-api -n fleet-production
kubectl rollout undo deployment/radio-dispatch-worker -n fleet-production
```

2. **Rollback database**:

```sql
-- Remove tables (only if necessary)
DROP TABLE IF EXISTS audio_processing_queue CASCADE;
DROP TABLE IF EXISTS dispatch_policy_executions CASCADE;
DROP TABLE IF EXISTS dispatch_policies CASCADE;
DROP TABLE IF EXISTS radio_transmissions CASCADE;
DROP TABLE IF EXISTS radio_channels CASCADE;
```

## Success Criteria

System is ready when:

- ✅ All pods running and healthy
- ✅ Health endpoint returns 200
- ✅ Socket.IO connections working
- ✅ Test audio upload succeeds
- ✅ Transcription completes within 60s
- ✅ Policies trigger correctly
- ✅ Frontend dashboard loads
- ✅ Real-time updates working
- ✅ Metrics visible in Grafana

## Support

For issues:
- GitHub: https://github.com/CapitalTechAlliance/Fleet/issues
- Email: support@capitaltechalliance.com
