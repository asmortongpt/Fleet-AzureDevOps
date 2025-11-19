# CTAFleet - Deployment Runbook

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Production Deployment](#production-deployment)
3. [Staging Deployment](#staging-deployment)
4. [Hotfix Deployment](#hotfix-deployment)
5. [Rollback Procedures](#rollback-procedures)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Before Every Deployment

- [ ] Code review completed and approved
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scans completed (no critical vulnerabilities)
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Secrets rotated (if needed)
- [ ] Backup completed
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)

### Environment Verification

```bash
# Verify environment variables
./deployment/scripts/validate-env.sh production

# Check resource availability
kubectl top nodes
kubectl get pods -n ctafleet

# Verify database backup
az storage blob list \
  --account-name ctafleetproductionstorage \
  --container-name database-backups \
  --query "[0].name"

# Check current version
kubectl get deployment fleet-api -n ctafleet -o jsonpath='{.spec.template.spec.containers[0].image}'
```

---

## Production Deployment

### Step 1: Pre-deployment Backup

```bash
# Create pre-deployment backup
./deployment/scripts/backup-postgres.sh

# Verify backup completed
BACKUP_FILE=$(az storage blob list \
  --account-name ctafleetproductionstorage \
  --container-name database-backups \
  --query "[0].name" -o tsv)

echo "Backup created: ${BACKUP_FILE}"
```

### Step 2: Database Migrations (if needed)

```bash
# Test migrations in staging first!
# Then run in production:

# Scale down API to prevent conflicts
kubectl scale deployment fleet-api --replicas=0 -n ctafleet

# Run migrations
kubectl run migration-job --rm -it \
  --image=fleetappregistry.azurecr.io/fleet-api:${NEW_VERSION} \
  --restart=Never \
  --env-from=configmap/fleet-config \
  --env-from=secret/fleet-secrets \
  --command -- node dist/scripts/run-migrations.js

# Verify migrations
kubectl logs migration-job -n ctafleet

# Scale API back up
kubectl scale deployment fleet-api --replicas=3 -n ctafleet
```

### Step 3: Deploy Backend (API)

```bash
# Set new image version
export NEW_VERSION="v2.1.0"
export IMAGE_TAG="$(date +%Y%m%d)-${NEW_VERSION}"

# Update deployment
kubectl set image deployment/fleet-api \
  api=fleetappregistry.azurecr.io/fleet-api:${IMAGE_TAG} \
  -n ctafleet

# Monitor rollout
kubectl rollout status deployment/fleet-api -n ctafleet

# Check pod status
kubectl get pods -l component=api -n ctafleet

# Verify health
for i in {1..10}; do
  curl -f https://fleet.ctafleet.com/api/health && echo " - OK" || echo " - FAILED"
  sleep 2
done
```

### Step 4: Deploy Frontend

```bash
# Update frontend deployment
kubectl set image deployment/fleet-frontend \
  frontend=fleetappregistry.azurecr.io/fleet-frontend:${IMAGE_TAG} \
  -n ctafleet

# Monitor rollout
kubectl rollout status deployment/fleet-frontend -n ctafleet

# Verify frontend
curl -I https://fleet.ctafleet.com
```

### Step 5: Deploy Python Services (if changed)

```bash
# Update test orchestrator
kubectl set image deployment/test-orchestrator \
  test-orchestrator=fleetappregistry.azurecr.io/fleet-test-orchestrator:${IMAGE_TAG} \
  -n ctafleet

# Update RAG indexer
kubectl set image deployment/rag-indexer \
  rag-indexer=fleetappregistry.azurecr.io/fleet-rag-indexer:${IMAGE_TAG} \
  -n ctafleet

# Update Playwright runner
kubectl set image deployment/playwright-runner \
  playwright-runner=fleetappregistry.azurecr.io/fleet-playwright-runner:${IMAGE_TAG} \
  -n ctafleet
```

### Step 6: Post-Deployment Verification

See [Post-Deployment Verification](#post-deployment-verification) section.

---

## Staging Deployment

Staging deployments follow the same process as production but target the `ctafleet-staging` namespace:

```bash
# Set namespace
export NAMESPACE=ctafleet-staging
export NEW_VERSION="v2.1.0-rc1"

# Deploy to staging
kubectl set image deployment/fleet-api \
  api=fleetappregistry.azurecr.io/fleet-api:${NEW_VERSION} \
  -n ${NAMESPACE}

kubectl set image deployment/fleet-frontend \
  frontend=fleetappregistry.azurecr.io/fleet-frontend:${NEW_VERSION} \
  -n ${NAMESPACE}

# Monitor
kubectl rollout status deployment/fleet-api -n ${NAMESPACE}
kubectl rollout status deployment/fleet-frontend -n ${NAMESPACE}
```

---

## Hotfix Deployment

For critical production issues requiring immediate deployment:

### Step 1: Create Hotfix Branch

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue-fix

# Make fixes
# ...

# Commit and push
git add .
git commit -m "hotfix: Critical issue fix"
git push origin hotfix/critical-issue-fix
```

### Step 2: Fast-track Testing

```bash
# Run critical tests only
npm run test:smoke
npm run test:security

# Manual verification in staging
```

### Step 3: Deploy Hotfix

```bash
# Build and tag hotfix
export HOTFIX_VERSION="v2.0.1-hotfix"
docker build -t fleetappregistry.azurecr.io/fleet-api:${HOTFIX_VERSION} .
docker push fleetappregistry.azurecr.io/fleet-api:${HOTFIX_VERSION}

# Deploy immediately to production
kubectl set image deployment/fleet-api \
  api=fleetappregistry.azurecr.io/fleet-api:${HOTFIX_VERSION} \
  -n ctafleet

# Monitor closely
watch kubectl get pods -n ctafleet
```

### Step 4: Verify and Document

```bash
# Verify fix
curl -f https://fleet.ctafleet.com/api/health

# Document incident
# - What broke
# - Root cause
# - Fix applied
# - Time to resolution
```

---

## Rollback Procedures

### Scenario 1: Bad Deployment Detected Immediately

```bash
# Rollback to previous version
kubectl rollout undo deployment/fleet-api -n ctafleet

# Monitor rollback
kubectl rollout status deployment/fleet-api -n ctafleet

# Verify health
kubectl get pods -l component=api -n ctafleet
curl -f https://fleet.ctafleet.com/api/health
```

### Scenario 2: Database Migration Rollback

```bash
# Restore database from pre-deployment backup
./deployment/scripts/restore-postgres.sh <backup-timestamp>

# Rollback application
kubectl rollout undo deployment/fleet-api -n ctafleet

# Verify database integrity
kubectl exec -it <postgres-pod> -n ctafleet -- psql -U fleetadmin -d fleetdb -c "SELECT COUNT(*) FROM vehicles;"
```

### Scenario 3: Complete System Rollback

```bash
# Record current state
kubectl get deployments -n ctafleet -o yaml > deployment-state-$(date +%Y%m%d-%H%M%S).yaml

# Rollback all deployments
kubectl rollout undo deployment/fleet-api -n ctafleet
kubectl rollout undo deployment/fleet-frontend -n ctafleet
kubectl rollout undo deployment/test-orchestrator -n ctafleet
kubectl rollout undo deployment/rag-indexer -n ctafleet

# Restore database if needed
./deployment/scripts/restore-postgres.sh <backup-timestamp>

# Verify all services
kubectl get pods -n ctafleet
```

### Scenario 4: Rollback to Specific Version

```bash
# Rollback to specific revision
kubectl rollout history deployment/fleet-api -n ctafleet

# Rollback to revision N
kubectl rollout undo deployment/fleet-api --to-revision=N -n ctafleet
```

---

## Post-Deployment Verification

### Automated Health Checks

```bash
#!/bin/bash
# post-deployment-check.sh

NAMESPACE="ctafleet"
API_URL="https://fleet.ctafleet.com"

# Check pod status
echo "Checking pod status..."
kubectl get pods -n ${NAMESPACE} | grep -v "Running"

# Check service endpoints
echo "Checking API health..."
curl -f ${API_URL}/api/health || echo "API health check FAILED"

echo "Checking frontend..."
curl -I ${API_URL} | grep "200 OK" || echo "Frontend check FAILED"

# Check database connectivity
echo "Checking database..."
kubectl exec -it $(kubectl get pod -l component=api -n ${NAMESPACE} -o jsonpath='{.items[0].metadata.name}') \
  -n ${NAMESPACE} -- node -e "require('./dist/db').query('SELECT 1')" || echo "Database check FAILED"

# Check Redis
echo "Checking Redis..."
kubectl exec -it $(kubectl get pod -l component=redis -n ${NAMESPACE} -o jsonpath='{.items[0].metadata.name}') \
  -n ${NAMESPACE} -- redis-cli ping || echo "Redis check FAILED"

# Check HPA status
echo "Checking HPA..."
kubectl get hpa -n ${NAMESPACE}

# Check recent logs for errors
echo "Checking for recent errors..."
kubectl logs --tail=100 -l component=api -n ${NAMESPACE} | grep -i "error\|exception" || echo "No errors found"

echo "Post-deployment verification complete!"
```

### Manual Verification Checklist

- [ ] Login functionality works
- [ ] Dashboard loads correctly
- [ ] Real-time data updates working
- [ ] Map features functional
- [ ] File uploads working
- [ ] Notifications sending
- [ ] API response times normal (<500ms p95)
- [ ] No 500 errors in last 10 minutes
- [ ] Database queries responding normally
- [ ] Cache hit rate normal (>80%)

### Performance Verification

```bash
# Check API response times
kubectl logs -l component=api -n ctafleet --tail=1000 | grep "response_time" | awk '{sum+=$NF; count++} END {print "Average response time:", sum/count, "ms"}'

# Check error rate
kubectl logs -l component=api -n ctafleet --tail=1000 | grep -c "error" || echo "0"

# Check database query performance
kubectl exec -it <postgres-pod> -n ctafleet -- psql -U fleetadmin -d fleetdb -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;"
```

### Monitoring Verification

- Check Grafana dashboards for anomalies
- Verify Prometheus targets are up
- Check Application Insights for errors
- Review alert status in Prometheus

---

## Troubleshooting

### Deployment Stuck

```bash
# Check deployment status
kubectl describe deployment fleet-api -n ctafleet

# Check pod events
kubectl describe pod <pod-name> -n ctafleet

# Check resource constraints
kubectl top nodes
kubectl top pods -n ctafleet

# Force recreate pods
kubectl delete pod <pod-name> -n ctafleet
```

### Image Pull Errors

```bash
# Check image exists
az acr repository show-tags \
  --name fleetappregistry \
  --repository fleet-api

# Verify image pull secret
kubectl get secret -n ctafleet

# Check ACR permissions
az acr check-health --name fleetappregistry
```

### Health Check Failures

```bash
# Test health endpoint directly
kubectl exec -it <api-pod> -n ctafleet -- curl localhost:3000/api/health

# Check logs
kubectl logs <api-pod> -n ctafleet --tail=50

# Check dependencies
kubectl exec -it <api-pod> -n ctafleet -- nc -zv postgres-service 5432
kubectl exec -it <api-pod> -n ctafleet -- nc -zv redis-service 6379
```

### Certificate Issues

```bash
# Check certificate status
kubectl get certificate fleet-tls -n ctafleet

# Renew certificate
./deployment/scripts/renew-ssl-certs.sh

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

---

## Emergency Contacts

### On-Call Rotation
- Primary: DevOps Lead
- Secondary: Platform Engineer
- Escalation: CTO

### Contact Methods
- PagerDuty: <pagerduty-url>
- Slack: #fleet-incidents
- Phone: +1-XXX-XXX-XXXX

### Escalation Path
1. On-call engineer (15 minutes)
2. DevOps lead (30 minutes)
3. CTO (1 hour)
4. Activate disaster recovery (2 hours)
