# Datadog Monitoring - Fleet Management System

## Overview

This guide provides complete setup and deployment instructions for Datadog monitoring across the Fleet Management System, including APM (Application Performance Monitoring), RUM (Real User Monitoring), logging, and infrastructure monitoring.

## Components Installed

### 1. Datadog Agent (Kubernetes DaemonSet)
- **Location**: `k8s/datadog-agent.yaml`
- **Namespace**: `ctafleet`
- **Purpose**: Collects metrics, logs, and traces from all Kubernetes pods
- **Monitoring**:
  - Infrastructure metrics (CPU, memory, network, disk)
  - Container metrics and health
  - Kubernetes events and resource status
  - Log aggregation from all pods
  - APM trace collection on port 8126
  - DogStatsD metrics on port 8125

### 2. Backend API - Datadog APM
- **Package**: `dd-trace@^5.26.0`
- **Configuration**: `api/src/config/datadog.ts`
- **Initialization**: First import in `api/src/server.ts`
- **Features**:
  - Automatic instrumentation of Express routes
  - Database query tracing (PostgreSQL)
  - External API call tracing
  - Distributed tracing with frontend
  - Runtime metrics (CPU, memory, event loop)
  - Profiling enabled

### 3. Frontend - Datadog RUM
- **Package**: `@datadog/browser-rum@^5.31.0`
- **Configuration**: `src/lib/datadog-rum.ts`
- **Initialization**: Imported in `src/main.tsx`
- **Features**:
  - Page load performance tracking
  - User interaction monitoring
  - JavaScript error tracking
  - Session replay (20% sample rate)
  - Frustration signals (rage clicks, dead clicks)
  - Network request tracking with backend correlation

## Deployment Instructions

### Step 1: Deploy Datadog Agent to Kubernetes

```bash
# Ensure you're in the correct namespace
kubectl config set-context --current --namespace=ctafleet

# Deploy Datadog agent (includes secret, config, daemonset, RBAC)
kubectl apply -f k8s/datadog-agent.yaml

# Verify deployment
kubectl get daemonset datadog-agent -n ctafleet
kubectl get pods -l app=datadog-agent -n ctafleet

# Check agent logs
kubectl logs -l app=datadog-agent -n ctafleet --tail=50
```

### Step 2: Install Backend Dependencies

```bash
cd api
npm install dd-trace@^5.26.0
```

### Step 3: Build and Deploy Backend with APM

```bash
# Build Docker image with Datadog APM
az acr build --registry fleetproductionacr \
  --image fleet-api:datadog-v1 \
  --file api/Dockerfile.production \
  ./api

# Update deployment to use new image
kubectl set image deployment/fleet-api \
  api=fleetproductionacr.azurecr.io/fleet-api:datadog-v1 \
  -n ctafleet

# Verify deployment
kubectl rollout status deployment/fleet-api -n ctafleet
kubectl get pods -l component=api -n ctafleet
```

### Step 4: Install Frontend Dependencies

```bash
cd /path/to/fleet-local
npm install @datadog/browser-rum@^5.31.0
```

### Step 5: Build and Deploy Frontend with RUM

```bash
# Build Docker image with Datadog RUM
az acr build --registry fleetproductionacr \
  --image fleet-frontend:datadog-v1 \
  --file Dockerfile.production \
  .

# Update deployment to use new image
kubectl set image deployment/fleet-frontend \
  frontend=fleetproductionacr.azurecr.io/fleet-frontend:datadog-v1 \
  -n ctafleet

# Verify deployment
kubectl rollout status deployment/fleet-frontend -n ctafleet
kubectl get pods -l component=frontend -n ctafleet
```

## Verification

### 1. Check Datadog Agent Status

```bash
# View agent logs
kubectl logs -l app=datadog-agent -n ctafleet | grep -E "(API key|connected|error)"

# Expected output:
# ✅ Datadog agent connected to API
# ✅ Logs enabled
# ✅ APM enabled
# ✅ Process agent running
```

### 2. Check Backend APM

```bash
# View API logs for Datadog initialization
kubectl logs -l component=api -n ctafleet | grep -i datadog

# Expected output:
# ✅ Datadog APM initialized: { service: 'fleet-api', env: 'production', agent: 'datadog-agent.ctafleet.svc.cluster.local:8126' }
```

### 3. Check Frontend RUM (Browser Console)

Open https://fleet.capitaltechalliance.com and check browser console:

```
✅ Datadog RUM initialized: {
  service: 'fleet-frontend',
  env: 'production',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20
}
```

### 4. Verify in Datadog Dashboard

1. Log in to https://app.datadoghq.com
2. Navigate to **APM > Services**
   - Should see `fleet-api` service with traces
3. Navigate to **RUM > Applications**
   - Should see `fleet-management` application with sessions
4. Navigate to **Infrastructure > Containers**
   - Should see all Kubernetes pods from `ctafleet` namespace
5. Navigate to **Logs > Search**
   - Should see logs from all fleet pods with proper tags

## Environment Variables Reference

### Backend API (already configured in k8s/api-deployment.yaml)

```yaml
- name: DD_AGENT_HOST
  value: "datadog-agent.ctafleet.svc.cluster.local"
- name: DD_TRACE_AGENT_PORT
  value: "8126"
- name: DD_ENV
  value: "production"
- name: DD_SERVICE
  value: "fleet-api"
- name: DD_VERSION
  value: "v1.0.0"
- name: DD_LOGS_INJECTION
  value: "true"
- name: DD_RUNTIME_METRICS_ENABLED
  value: "true"
- name: DD_PROFILING_ENABLED
  value: "true"
```

### Frontend (configured in src/lib/datadog-rum.ts)

RUM configuration uses Vite environment variables:

```env
VITE_DATADOG_RUM_APPLICATION_ID=fleet-management
VITE_DATADOG_RUM_CLIENT_TOKEN=pub_datadog_client_token  # Get from Datadog RUM Application settings
VITE_DATADOG_RUM_ENABLED=true
VITE_APP_VERSION=1.0.0
```

## Monitoring Capabilities

### Application Performance Monitoring (APM)

- **Request Tracing**: Track every API request end-to-end
- **Database Performance**: Monitor PostgreSQL query performance
- **Service Dependencies**: Visualize calls to external services (Azure, AWS, etc.)
- **Error Tracking**: Automatic error capture with stack traces
- **Performance Bottlenecks**: Identify slow endpoints and N+1 queries

### Real User Monitoring (RUM)

- **Page Load Times**: Core Web Vitals (LCP, FID, CLS)
- **User Journeys**: Track navigation paths and user flows
- **Session Replay**: Watch user sessions (20% sample)
- **Frustration Signals**: Detect rage clicks, error clicks, dead clicks
- **JavaScript Errors**: Full error tracking with source maps

### Infrastructure Monitoring

- **Container Metrics**: CPU, memory, network, I/O for all pods
- **Kubernetes Events**: Pod crashes, scaling events, deployments
- **Node Health**: AKS node metrics and resource utilization
- **Resource Requests/Limits**: Track resource usage against limits

### Log Management

- **Centralized Logging**: All pod logs in one place
- **Trace Correlation**: Link logs to APM traces automatically
- **Log Parsing**: Automatic JSON log parsing
- **Alerts**: Set up alerts on error patterns

## Dashboards and Alerts

### Recommended Dashboards to Create

1. **Fleet API Performance**
   - Request rate, latency (p50, p95, p99)
   - Error rate and 5xx responses
   - Database query performance
   - External API call latency

2. **Fleet Frontend UX**
   - Page load times by route
   - User session count
   - JavaScript error rate
   - Frustration signal trends

3. **Infrastructure Health**
   - Pod CPU/Memory usage
   - Pod restart count
   - Node resource utilization
   - PersistentVolume usage

### Recommended Alerts

```yaml
# High API Error Rate
- name: "Fleet API - High Error Rate"
  query: "sum:trace.express.request.errors{service:fleet-api,env:production}.as_rate()"
  threshold: "> 5%"

# Slow API Response Time
- name: "Fleet API - Slow Response Time"
  query: "avg:trace.express.request.duration{service:fleet-api,env:production}.p95()"
  threshold: "> 2000ms"

# Frontend JavaScript Errors
- name: "Fleet Frontend - High JS Error Rate"
  query: "sum:browser.error.count{service:fleet-frontend,env:production}"
  threshold: "> 10 per 5min"

# Pod Crash Loop
- name: "Fleet Pods - Crash Loop"
  query: "avg:kubernetes.containers.restarts{namespace:ctafleet}"
  threshold: "> 5 in 15min"
```

## Troubleshooting

### Agent Not Connecting

```bash
# Check agent status
kubectl exec -it $(kubectl get pod -l app=datadog-agent -n ctafleet -o name | head -1) -n ctafleet -- agent status

# Check API key
kubectl get secret datadog-secret -n ctafleet -o jsonpath='{.data.api-key}' | base64 -d
```

### Backend APM Not Working

```bash
# Verify DD_AGENT_HOST is reachable from API pod
kubectl exec -it $(kubectl get pod -l component=api -n ctafleet -o name | head -1) -n ctafleet -- nc -zv datadog-agent.ctafleet.svc.cluster.local 8126

# Check API pod environment variables
kubectl exec -it $(kubectl get pod -l component=api -n ctafleet -o name | head -1) -n ctafleet -- env | grep DD_
```

### Frontend RUM Not Working

1. Check browser console for errors
2. Verify VITE environment variables are set
3. Check Network tab for requests to `https://browser-intake-datadoghq.com`
4. Ensure ad blockers are disabled for testing

## Security Considerations

- **API Key**: Stored in Kubernetes Secret (`datadog-secret`)
- **Client Token**: Frontend RUM uses public client token (safe to expose)
- **PII Masking**: RUM configured to mask user input by default
- **Sensitive Data**: `beforeSend` callback filters tokens/keys from URLs
- **RBAC**: Datadog agent uses ClusterRole with minimal required permissions

## Cost Optimization

- **APM**: 100% trace sampling (consider reducing for high-volume APIs)
- **RUM**: 100% session sampling, 20% replay sampling
- **Logs**: All containers (consider excluding debug logs in production)
- **Profiling**: Enabled (can disable if not needed)

To reduce costs:
- Reduce RUM session replay sample rate to 5-10%
- Add log filters to exclude verbose debug logs
- Use trace sampling for high-volume endpoints

## Additional Resources

- [Datadog APM Node.js Docs](https://docs.datadoghq.com/tracing/setup_overview/setup/nodejs/)
- [Datadog RUM Browser Docs](https://docs.datadoghq.com/real_user_monitoring/browser/)
- [Datadog Kubernetes Integration](https://docs.datadoghq.com/integrations/kubernetes/)
- [Datadog Agent Configuration](https://docs.datadoghq.com/agent/kubernetes/)

## Support

For issues or questions:
- Check Datadog status: https://status.datadoghq.com/
- View agent logs: `kubectl logs -l app=datadog-agent -n ctafleet`
- Datadog support: https://help.datadoghq.com/
