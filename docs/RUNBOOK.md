# Fleet Management System - Operational Runbook

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Access & Authentication](#access--authentication)
- [Common Operations](#common-operations)
- [Health Checks](#health-checks)
- [Deployment Procedures](#deployment-procedures)
- [Troubleshooting](#troubleshooting)
- [Incident Response](#incident-response)
- [Escalation](#escalation)
- [Maintenance Windows](#maintenance-windows)

---

## System Overview

### Production Environment

| Component | Details |
|-----------|---------|
| **Platform** | Azure Kubernetes Service (AKS) |
| **Cluster** | fleet-aks-cluster |
| **Resource Group** | fleet-production-rg |
| **Region** | East US 2 |
| **Namespace** | fleet-management |

### Key Services

- **Frontend**: React SPA (3 replicas)
- **API**: Node.js/Express (1 replica)
- **Database**: PostgreSQL 15 (StatefulSet)
- **Cache**: Redis (StatefulSet)
- **Monitoring**: Azure Application Insights

### URLs

- **Frontend**: http://68.220.148.2
- **API**: http://fleet-api-service:3000 (internal)
- **API Docs**: http://fleet-api-service:3000/api/docs (port-forward required)

---

## Architecture

```
┌─────────────────────┐
│   Load Balancer     │  68.220.148.2
│   (Azure LB)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Frontend Pods     │  3 replicas
│   (React SPA)       │  Port 80/443
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────┐
│   API Pod           │─────▶│  PostgreSQL  │
│   (Node.js)         │      │  StatefulSet │
│   Port 3000         │      └──────────────┘
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Redis Cache       │
│   StatefulSet       │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Application         │
│ Insights            │
└─────────────────────┘
```

---

## Access & Authentication

### Azure CLI

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "021415c2-2f52-4a73-ae77-f8363165a5e1"

# Get AKS credentials
az aks get-credentials \
  --resource-group fleet-production-rg \
  --name fleet-aks-cluster
```

### Kubernetes Access

```bash
# Verify connection
kubectl cluster-info

# Switch to fleet namespace
kubectl config set-context --current --namespace=fleet-management

# Verify access
kubectl get pods
```

### Application Access

**Frontend**:
```bash
open http://68.220.148.2
```

**API (via port-forward)**:
```bash
kubectl port-forward -n fleet-management svc/fleet-api-service 3000:3000
open http://localhost:3000/api/docs
```

**Database (via port-forward)**:
```bash
kubectl port-forward -n fleet-management svc/fleet-postgres-service 5432:5432
psql -h localhost -U fleetuser -d fleetdb
```

---

## Common Operations

### 1. Check System Health

```bash
# Run automated health check
./scripts/health-check.sh

# Manual checks
kubectl get pods -n fleet-management
kubectl get svc -n fleet-management
kubectl top pods -n fleet-management
```

### 2. View Logs

**API Logs**:
```bash
# Real-time logs
kubectl logs -f deployment/fleet-api -n fleet-management

# Last 100 lines
kubectl logs --tail=100 deployment/fleet-api -n fleet-management

# Search for errors
kubectl logs deployment/fleet-api -n fleet-management | grep -i error
```

**Frontend Logs**:
```bash
kubectl logs -f deployment/fleet-app -n fleet-management
```

**Database Logs**:
```bash
kubectl logs -f statefulset/fleet-postgres -n fleet-management
```

### 3. Restart Services

**API**:
```bash
kubectl rollout restart deployment/fleet-api -n fleet-management
kubectl rollout status deployment/fleet-api -n fleet-management
```

**Frontend**:
```bash
kubectl rollout restart deployment/fleet-app -n fleet-management
kubectl rollout status deployment/fleet-app -n fleet-management
```

**Database** (USE CAUTION):
```bash
# Not recommended in production without backup
kubectl delete pod fleet-postgres-0 -n fleet-management
```

### 4. Scale Services

**API (Horizontal Scaling)**:
```bash
# Scale to 3 replicas
kubectl scale deployment/fleet-api --replicas=3 -n fleet-management

# Verify
kubectl get deployment fleet-api -n fleet-management
```

**Frontend**:
```bash
kubectl scale deployment/fleet-app --replicas=5 -n fleet-management
```

### 5. Update Configuration

**Environment Variables**:
```bash
# Edit deployment
kubectl edit deployment fleet-api -n fleet-management

# Or update via kubectl set env
kubectl set env deployment/fleet-api LOG_LEVEL=debug -n fleet-management

# Restart to apply
kubectl rollout restart deployment/fleet-api -n fleet-management
```

**Secrets**:
```bash
# Update Application Insights connection string
kubectl create secret generic fleet-api-secrets \
  --from-literal=APPLICATIONINSIGHTS_CONNECTION_STRING="<new-value>" \
  -n fleet-management --dry-run=client -o yaml | kubectl apply -f -

# Restart API to pick up new secret
kubectl rollout restart deployment/fleet-api -n fleet-management
```

### 6. Database Operations

**Backup**:
```bash
# Connect to database pod
kubectl exec -it fleet-postgres-0 -n fleet-management -- bash

# Create backup
pg_dump -U fleetuser -d fleetdb > /tmp/backup-$(date +%Y%m%d-%H%M%S).sql

# Copy backup out of pod
kubectl cp fleet-management/fleet-postgres-0:/tmp/backup-*.sql ./backup.sql
```

**Restore**:
```bash
# Copy backup to pod
kubectl cp ./backup.sql fleet-management/fleet-postgres-0:/tmp/backup.sql

# Restore
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetuser -d fleetdb -f /tmp/backup.sql
```

**Reset Demo Data**:
```bash
# Run reset script
./scripts/reset-demo.sh
```

---

## Health Checks

### Automated Health Check Script

Location: `/scripts/health-check.sh`

**Usage**:
```bash
./scripts/health-check.sh
```

**Checks Performed**:
1. Kubernetes cluster connectivity
2. Pod status (all pods Running)
3. Service endpoints available
4. API health endpoint responding
5. Database connectivity
6. Redis connectivity
7. Application Insights receiving telemetry

### Manual Health Checks

**API Health Endpoint**:
```bash
# Via port-forward
kubectl port-forward -n fleet-management svc/fleet-api-service 3000:3000 &
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-09T02:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

**Database**:
```bash
kubectl exec -n fleet-management deployment/fleet-api -- \
  node -e "const { Pool } = require('pg'); \
  const pool = new Pool({ connectionString: process.env.DATABASE_URL }); \
  pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(console.error);"
```

**Redis**:
```bash
kubectl exec -n fleet-management fleet-redis-0 -- redis-cli ping
# Expected: PONG
```

---

## Deployment Procedures

### Standard Deployment

**Pre-Deployment Checklist**:
- [ ] Code reviewed and approved
- [ ] Tests passing in CI/CD
- [ ] Database migrations tested
- [ ] Backup created
- [ ] Deployment plan communicated
- [ ] Rollback plan prepared

**Deployment Steps**:

1. **Build & Push Image**:
   ```bash
   # Build API image
   docker build -t fleetappregistry.azurecr.io/fleet-api:latest ./api
   docker push fleetappregistry.azurecr.io/fleet-api:latest

   # Build frontend image (if needed)
   docker build -t fleetappregistry.azurecr.io/fleet-app:latest .
   docker push fleetappregistry.azurecr.io/fleet-app:latest
   ```

2. **Apply Kubernetes Updates**:
   ```bash
   # Update deployment
   kubectl apply -f deployment/api-deployment.yaml

   # Verify rollout
   kubectl rollout status deployment/fleet-api -n fleet-management

   # Check pods
   kubectl get pods -n fleet-management
   ```

3. **Run Smoke Tests**:
   ```bash
   # Test API health
   kubectl port-forward -n fleet-management svc/fleet-api-service 3000:3000 &
   curl http://localhost:3000/api/health

   # Test login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@demofleet.com","password":"Demo@123"}'
   ```

4. **Monitor**:
   ```bash
   # Watch pods
   kubectl get pods -n fleet-management -w

   # Check logs for errors
   kubectl logs -f deployment/fleet-api -n fleet-management | grep -i error

   # Monitor Application Insights
   # https://portal.azure.com → fleet-management-insights
   ```

### Rollback Procedure

**If deployment fails**:

1. **Immediate Rollback**:
   ```bash
   # Rollback to previous version
   kubectl rollout undo deployment/fleet-api -n fleet-management

   # Verify
   kubectl rollout status deployment/fleet-api -n fleet-management
   ```

2. **Verify Rollback**:
   ```bash
   # Check pod image
   kubectl describe pod <pod-name> -n fleet-management | grep Image:

   # Test API
   curl http://localhost:3000/api/health
   ```

3. **Investigate Failure**:
   ```bash
   # Get rollout history
   kubectl rollout history deployment/fleet-api -n fleet-management

   # Check logs of failed deployment
   kubectl logs deployment/fleet-api -n fleet-management --previous
   ```

---

## Troubleshooting

### Common Issues

#### Issue: Pod Stuck in Pending State

**Symptoms**:
```
NAME                     READY   STATUS    RESTARTS   AGE
fleet-api-xxx            0/1     Pending   0          5m
```

**Resolution**:
```bash
# Check pod events
kubectl describe pod fleet-api-xxx -n fleet-management

# Common causes:
# 1. Insufficient resources
kubectl top nodes

# 2. Image pull error
kubectl get events -n fleet-management | grep -i pull

# 3. PVC not bound
kubectl get pvc -n fleet-management
```

#### Issue: Pod CrashLoopBackOff

**Symptoms**:
```
NAME                     READY   STATUS             RESTARTS   AGE
fleet-api-xxx            0/1     CrashLoopBackOff   5          3m
```

**Resolution**:
```bash
# Check logs
kubectl logs fleet-api-xxx -n fleet-management
kubectl logs fleet-api-xxx -n fleet-management --previous

# Common causes:
# 1. Database connection failure
# 2. Missing environment variables
# 3. Application crash on startup

# Verify environment variables
kubectl exec fleet-api-xxx -n fleet-management -- env | grep -i database
```

#### Issue: API Returning 500 Errors

**Symptoms**: All API requests fail with HTTP 500

**Resolution**:
```bash
# Check API logs
kubectl logs deployment/fleet-api -n fleet-management | tail -50

# Check database connectivity
kubectl exec -n fleet-management deployment/fleet-api -- \
  node -e "require('pg').Pool({connectionString:process.env.DATABASE_URL}).query('SELECT 1')"

# Check Application Insights for errors
# https://portal.azure.com → fleet-management-insights → Failures
```

#### Issue: Slow Response Times

**Symptoms**: P95 latency > 2 seconds

**Resolution**:
```bash
# Check resource utilization
kubectl top pods -n fleet-management

# Check database query performance
# Application Insights → Performance → Dependencies → SQL

# Scale API if needed
kubectl scale deployment/fleet-api --replicas=3 -n fleet-management

# Check for slow endpoints
# Application Insights → Performance → Operations
```

#### Issue: Database Connection Pool Exhausted

**Symptoms**: "No more connections available" errors

**Resolution**:
```bash
# Check database connections
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetuser -d fleetdb -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetuser -d fleetdb -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"

# Increase pool size (requires code change)
# See LOAD_TEST_RESULTS.md for configuration
```

---

## Incident Response

### Severity Levels

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| **P0 - Critical** | System down, data loss | 5 minutes | Immediate (all hands) |
| **P1 - High** | Major feature broken | 15 minutes | On-call + manager |
| **P2 - Medium** | Degraded performance | 1 hour | On-call engineer |
| **P3 - Low** | Minor issue, workaround exists | 4 hours | Next business day |

### Incident Response Workflow

1. **Alert Received**
   - Acknowledge alert within SLA
   - Assess severity
   - Create incident ticket

2. **Initial Assessment** (5 minutes)
   - Check system health dashboard
   - Review recent changes (deployments, config updates)
   - Check Application Insights for errors
   - Verify AKS cluster health

3. **Investigation** (15-30 minutes)
   - Gather logs and metrics
   - Identify root cause
   - Document findings in incident ticket

4. **Mitigation** (30-60 minutes)
   - Execute fix (rollback, scale, restart)
   - Verify resolution
   - Monitor for recurrence

5. **Post-Incident** (24-48 hours)
   - Write post-mortem
   - Identify preventive measures
   - Update runbook
   - Schedule follow-up improvements

### Incident Checklist

**During Incident**:
- [ ] Incident ticket created
- [ ] Severity assessed
- [ ] Stakeholders notified
- [ ] Impact documented
- [ ] Workaround identified (if possible)
- [ ] Root cause found
- [ ] Fix applied
- [ ] Resolution verified
- [ ] Monitoring increased

**Post-Incident**:
- [ ] Post-mortem written
- [ ] Timeline documented
- [ ] Root cause analysis complete
- [ ] Action items identified
- [ ] Preventive measures planned
- [ ] Runbook updated
- [ ] Team debriefed

---

## Escalation

### Escalation Matrix

| Role | Contact | Responsibilities |
|------|---------|-----------------|
| **On-Call Engineer** | Slack: @oncall | First responder, initial triage |
| **Team Lead** | Email/Slack | P0/P1 escalation, coordination |
| **DevOps Lead** | Email/Slack | Infrastructure issues, AKS/Azure |
| **Database Admin** | Email/Slack | Database performance, backups |
| **Engineering Manager** | Email/Phone | Executive updates, resource allocation |
| **CTO** | Phone | Extended outages (>1 hour) |

### When to Escalate

**Escalate to Team Lead** if:
- P0 or P1 incident
- Incident exceeds 30 minutes
- Unable to determine root cause
- Requires deployment or infrastructure changes

**Escalate to Engineering Manager** if:
- Incident exceeds 1 hour
- Customer data at risk
- Requires vendor support
- Media/legal implications

**Escalate to CTO** if:
- Extended outage (>2 hours)
- Data breach or security incident
- Regulatory implications
- Executive customer impacted

---

## Maintenance Windows

### Scheduled Maintenance

**Frequency**: Monthly (first Sunday, 2AM-6AM ET)

**Maintenance Tasks**:
- Database index optimization
- Log rotation
- Certificate renewal
- Security patches
- Kubernetes version upgrade
- Backup verification

**Pre-Maintenance**:
- [ ] Maintenance window communicated (7 days notice)
- [ ] Backup created and verified
- [ ] Rollback plan documented
- [ ] Health check script tested
- [ ] Stakeholders notified (24 hours before)

**During Maintenance**:
- [ ] System health dashboard monitored
- [ ] Changes applied incrementally
- [ ] Health checks after each change
- [ ] Logs reviewed for errors

**Post-Maintenance**:
- [ ] Full smoke test executed
- [ ] Performance baseline verified
- [ ] Stakeholders notified (completion)
- [ ] Maintenance report published

### Emergency Maintenance

For critical security patches or urgent fixes:

1. **Assess Impact**: Determine if change can wait for next window
2. **Get Approval**: Manager approval required for off-hours
3. **Notify Stakeholders**: Minimum 1 hour notice (if possible)
4. **Execute**: Follow standard deployment procedure
5. **Monitor**: Extended monitoring for 4 hours post-change

---

## Scripts & Automation

### Health Check Script

**Location**: `/scripts/health-check.sh`

**What it checks**:
- Kubernetes connectivity
- Pod status
- Service endpoints
- API health
- Database connectivity
- Redis connectivity
- Application Insights

**Usage**:
```bash
./scripts/health-check.sh
```

### Deployment Script

**Location**: `/scripts/deploy-production.sh`

**What it does**:
- Builds Docker images
- Pushes to ACR
- Updates Kubernetes deployments
- Runs smoke tests
- Monitors rollout

### Demo Reset Script

**Location**: `/scripts/reset-demo.sh`

**What it does**:
- Drops and recreates demo data
- Resets user passwords
- Clears cached data

---

## Monitoring Dashboards

### Application Insights

**URL**: https://portal.azure.com → fleet-management-insights

**Key Views**:
- **Live Metrics**: Real-time request rate, errors, response time
- **Failures**: Error analysis and stack traces
- **Performance**: Operation duration and dependencies
- **Application Map**: Service topology and health

### Custom Dashboards

1. **System Health Dashboard**
   - Request rate
   - Response time percentiles (P50, P95, P99)
   - Error rate
   - Database query performance
   - Uptime %

2. **Business Metrics Dashboard**
   - Top endpoints by usage
   - Active users
   - Slowest endpoints
   - Feature usage distribution
   - Error breakdown

**Access**: Azure Portal → Dashboards → "Fleet Management"

---

## Additional Resources

- [Monitoring & Alerts](./MONITORING_ALERTS.md)
- [Load Test Results](./LOAD_TEST_RESULTS.md)
- [Observability Guide](./OBSERVABILITY.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md)

---

**Document Version**: 1.0
**Last Updated**: November 8, 2025
**Owner**: Fleet Management DevOps Team
**Review Cycle**: Monthly
