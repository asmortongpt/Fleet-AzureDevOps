# Deployment Procedures for Validation Framework

## Pre-Deployment Checklist

Complete this checklist before deploying the validation framework to production:

### Code Review & Quality

- [ ] All tests passing: `npm test -- src/validation/__tests__/`
- [ ] TypeScript compilation clean: `npm run typecheck`
- [ ] No console errors or warnings
- [ ] Code reviewed by at least 2 team members
- [ ] Documentation updated for any configuration changes
- [ ] CHANGELOG.md updated with new features
- [ ] Security review completed (no secrets in code)

### Infrastructure Verification

- [ ] PostgreSQL 16+ database available and accessible
- [ ] Redis cache available and accessible
- [ ] Database backups configured
- [ ] Monitoring agents installed (Sentry, DataDog, etc.)
- [ ] Log aggregation pipeline ready (ELK, CloudWatch, etc.)
- [ ] Load balancer configured for zero-downtime deployment
- [ ] DNS records configured correctly

### Staging Deployment Test

- [ ] Deploy to staging environment successfully
- [ ] Run full validation suite on staging
- [ ] Execute end-to-end tests: `npm run test:e2e`
- [ ] Performance tests pass: `npm run load:normal`
- [ ] Rollback procedure tested
- [ ] Zero-downtime deployment tested
- [ ] All health checks passing

### Team Preparation

- [ ] Deployment schedule communicated to team
- [ ] On-call engineer assigned
- [ ] Runbook shared with operations team
- [ ] Incident response procedure reviewed
- [ ] Emergency contacts verified
- [ ] Maintenance window scheduled (if needed)

---

## Step-by-Step Deployment Process

### Phase 1: Pre-Deployment (T-30 minutes)

**1. Final Code Verification**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA

# Verify all tests pass
npm test -- src/validation/__tests__/deployment.test.ts
cd api && npm test -- src/validation/__tests__/
cd ..

# Check for TypeScript errors
npm run typecheck
cd api && npm run typecheck
cd ..

# Verify no uncommitted changes
git status
```

**2. Create Deployment Tag**
```bash
git tag -a v1.0.0-validation-framework -m "Deploy validation framework"
git push origin v1.0.0-validation-framework
```

**3. Update Deployment Configuration**
```bash
# Copy production config
cp .env.production .env.deployment

# Verify critical settings
cat .env.deployment | grep -E "VALIDATION_|SKIP_AUTH|NODE_ENV"
```

**4. Database Backup**
```bash
# Create pre-deployment backup
pg_dump -h $DB_HOST -U $DB_USER fleet_db > backups/fleet_db_pre_deployment.sql
gzip backups/fleet_db_pre_deployment.sql

echo "Backup created: $(ls -lh backups/fleet_db_pre_deployment.sql.gz)"
```

**5. Team Notification**
```bash
# Alert team on Slack
echo "📋 Deployment starting in 30 minutes:
- Component: Validation Framework v1.0.0
- Duration: 5-10 minutes (zero-downtime)
- Rollback: Available in 2 minutes if needed
- Lead: $(whoami)"
```

### Phase 2: Database Migrations (T-20 minutes)

**1. Run Database Migrations**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api

# Check pending migrations
npm run migrate -- --dry-run

# Execute migrations
npm run migrate

# Verify migration success
npm run migrate -- --status
```

**2. Verify Schema Changes**
```bash
# Connect to database
psql -h $DB_HOST -U $DB_USER -d fleet_db

-- Run in psql:
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'validation_%';

-- Should return:
--   validation_runs
--   validation_issues
--   validation_agents
--   validation_metrics

\d validation_runs;  -- View structure
```

**3. Create Database Indexes**
```sql
-- For performance optimization
CREATE INDEX idx_validation_runs_timestamp
  ON validation_runs(timestamp DESC);

CREATE INDEX idx_validation_issues_severity
  ON validation_issues(severity);

CREATE INDEX idx_validation_issues_agent
  ON validation_issues(agent_name);

-- Verify indexes created
\di
```

### Phase 3: Service Deployment (T-10 minutes)

**1. Build Docker Image**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA

# Build optimized production image
docker build -t fleet-api:validation-framework \
  --build-arg NODE_ENV=production \
  -f Dockerfile.api .

# Tag for registry
docker tag fleet-api:validation-framework \
  $REGISTRY_URL/fleet-api:validation-framework

# Push to registry
docker push $REGISTRY_URL/fleet-api:validation-framework

echo "✅ Docker image pushed successfully"
```

**2. Update Kubernetes Deployment**
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fleet-api
  template:
    metadata:
      labels:
        app: fleet-api
    spec:
      containers:
      - name: fleet-api
        image: $REGISTRY_URL/fleet-api:validation-framework
        ports:
        - containerPort: 3001
        livenessProbe:
          httpGet:
            path: /api/validation/status/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/validation/status/ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
```

**3. Deploy to Kubernetes**
```bash
# Apply configuration
kubectl apply -f kubernetes/deployment.yaml

# Check deployment status
kubectl rollout status deployment/fleet-api

# Wait for all replicas to be ready
kubectl get pods -l app=fleet-api -w
```

**4. Verify Service Health**
```bash
# Health check
curl http://api.internal/api/validation/status/health

# Should return 200 with:
# {"success": true, "data": {"healthy": true, ...}}

# Readiness check
curl http://api.internal/api/validation/status/ready

# Should return 200 with:
# {"success": true, "data": {"ready": true, ...}}
```

### Phase 4: Post-Deployment Validation (T-0)

**1. Verify All Endpoints**
```bash
# Status endpoints
curl http://api.internal/api/validation/status
curl http://api.internal/api/validation/status/health
curl http://api.internal/api/validation/status/ready
curl http://api.internal/api/validation/status/agents
curl http://api.internal/api/validation/status/metrics
curl http://api.internal/api/validation/status/performance

# Should all return 200 with success: true
```

**2. Run Integration Tests**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api

npm run test:integration -- src/validation/__tests__/

# Expected: All tests pass
# Time: ~2 minutes
```

**3. Database Integrity Check**
```bash
# Verify database connectivity
npm run db:studio

# In browser, check:
# - validation_runs table accessible
# - validation_issues table accessible
# - validation_agents table accessible
# - validation_metrics table accessible
```

**4. Performance Baseline Test**
```bash
# Get performance metrics
curl http://api.internal/api/validation/status/performance

# Verify acceptable metrics:
# - Agent execution times < 30s each
# - Memory usage < 70%
# - Cache hit rate > 80%
```

**5. Trigger Test Validation Run**
```bash
# Trigger validation
curl -X POST http://api.internal/api/validation/run \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"triggerBy": "deployment-test", "scope": "full"}'

# Wait for completion
sleep 60

# Verify results
curl http://api.internal/api/validation/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Should return dashboard with issues detected
```

### Phase 5: Monitoring Enablement (T+5 minutes)

**1. Configure Monitoring Alerts**
```bash
# Sentry error tracking
export SENTRY_DSN="https://key@sentry.io/project-id"

# DataDog APM
export DD_TRACE_ENABLED=true
export DD_SERVICE=fleet-api
export DD_ENV=production
```

**2. Enable Custom Dashboards**
```bash
# Create Grafana dashboard
curl -X POST http://grafana.internal/api/dashboards/db \
  -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -H "Content-Type: application/json" \
  -d @dashboards/validation-framework.json
```

**3. Set Up Alert Rules**
```bash
# Configure alert for failing agents
POST /api/alerts/rules
{
  "name": "Validation Framework Agent Failed",
  "condition": "framework.agents.operational < 6",
  "severity": "critical",
  "notification_channels": ["ops-team"]
}

# Configure alert for low quality score
POST /api/alerts/rules
{
  "name": "Quality Score Critical",
  "condition": "framework.quality_score < 60",
  "severity": "high",
  "notification_channels": ["dev-team"]
}
```

**4. Verify Monitoring**
```bash
# Check that metrics are flowing
curl http://monitoring.internal/api/metrics/validation-framework

# Should return recent metrics data
```

### Phase 6: Team Communication (T+10 minutes)

**1. Document Deployment Success**
```bash
cat > DEPLOYMENT_LOG.md << 'EOF'
# Deployment Log - Validation Framework v1.0.0

**Date**: $(date)
**Deployed By**: $(whoami)
**Duration**: 15 minutes
**Status**: ✅ Success

## Changes
- Deployed 6 validation agents
- Added status monitoring endpoints
- Configured health/readiness probes
- Enabled automated scheduling

## Verification
- ✅ All health checks passing
- ✅ Integration tests passing
- ✅ Performance within baseline
- ✅ Database migrations applied
- ✅ Monitoring alerts configured

## Metrics
- Framework status: Operational
- Quality score: 78.5/100
- Agents running: 6/6
- Response time: 45ms avg

## Next Steps
- Monitor for 24 hours
- Verify no error spikes
- Archive database backup
EOF
```

**2. Post Deployment Notification**
```bash
# Slack notification
echo "🚀 Validation Framework v1.0.0 Deployed Successfully!

✅ All Systems Operational
- 6 validation agents running
- Health checks: PASS
- Performance: NORMAL
- Quality score: 78.5/100

📊 View Dashboard: http://fleet.internal/validation/dashboard
📋 Status API: http://api.internal/api/validation/status

Questions? See: docs/VALIDATION-FRAMEWORK-GUIDE.md"
```

---

## Rollback Procedures

### Quick Rollback (Emergency)

If critical issues detected immediately after deployment:

**1. Immediate Rollback**
```bash
# Kubernetes rollback to previous version
kubectl rollout undo deployment/fleet-api

# Verify rollback complete
kubectl rollout status deployment/fleet-api

# Confirm health checks passing
curl http://api.internal/api/validation/status/health
```

**2. Database Rollback (if migrations caused issues)**
```bash
# Restore from pre-deployment backup
psql -h $DB_HOST -U $DB_USER fleet_db < \
  backups/fleet_db_pre_deployment.sql.gz

# Verify restore complete
psql -h $DB_HOST -U $DB_USER -d fleet_db -c \
  "SELECT COUNT(*) FROM vehicles;"
```

**3. Notify Team**
```bash
echo "⚠️ Rollback Executed

Version rolled back to: v1.0.0-rc1
Reason: [detailed explanation]
Status: System restored to pre-deployment state
Time: $(date)

Investigation required. See incident #xxx"
```

### Staged Rollback (Careful)

If issues appear after 1+ hours:

**1. Scale Down New Deployment**
```bash
# Reduce to 1 replica for investigation
kubectl scale deployment fleet-api --replicas=1
```

**2. Route Traffic to Previous Version**
```bash
# Update load balancer to previous version
kubectl patch service fleet-api -p \
  '{"spec":{"selector":{"version":"v1.0.0-rc1"}}}'
```

**3. Investigate Issues**
```bash
# Check logs
kubectl logs -l app=fleet-api,version=validation-framework -f

# Check metrics
curl http://api.internal/api/validation/status/performance

# Check database state
psql -h $DB_HOST -U $DB_USER -d fleet_db -c \
  "SELECT COUNT(*) FROM validation_runs WHERE timestamp > NOW() - INTERVAL '1 hour';"
```

**4. Decide Next Steps**
```bash
# If fixable with config: Update config and retry
# If database issue: Restore backup and retry
# If code issue: Apply hotfix and redeploy
```

---

## Post-Deployment Verification

### 24-Hour Monitoring

**Hour 1-6: Active Monitoring**
```bash
# Check every 15 minutes:
curl http://api.internal/api/validation/status | jq '.data.qualityScore'

# Monitor error rates
curl http://api.internal/api/validation/status/metrics | \
  jq '.metrics.totalIssuesDetected'

# Watch for agent failures
curl http://api.internal/api/validation/status/agents | \
  jq '.summary.failedAgents'
```

**Hour 6-24: Periodic Checks**
```bash
# Check every 1-2 hours:
- Quality score stable
- No new critical issues
- Agent uptime 100%
- Database query performance normal
```

### Performance Baseline Establishment

```bash
# Record baseline metrics
curl http://api.internal/api/validation/status/performance \
  > baseline_metrics.json

# Compare with previous version
diff baseline_metrics.json previous_baseline_metrics.json

# Should show acceptable performance
# - Execution time: <50s per agent
# - Memory usage: <70%
# - Cache hit rate: >80%
```

### Documentation Update

```bash
# Update README with new version
sed -i 's/v1.0.0-rc1/v1.0.0/g' README.md

# Update API documentation
npm run docs:generate

# Commit documentation changes
git add README.md docs/
git commit -m "docs: Update for v1.0.0 deployment"
git push origin main
```

---

## Team Coordination Procedures

### Deployment Team Roles

| Role | Responsibilities |
|------|-----------------|
| **Release Lead** | Overall coordination, go/no-go decisions |
| **Database Admin** | Migrations, backups, recovery |
| **DevOps Engineer** | Kubernetes deployment, scaling |
| **QA Lead** | Verification testing, sign-off |
| **On-Call Engineer** | Incident response, escalation |

### Communication Channels

**During Deployment (Real-time):**
- Slack #deployments channel
- Zoom video call (if needed for complex issues)
- War room setup in case of emergency

**Post-Deployment (Status Updates):**
- Slack #deployments hourly updates
- Email summary after 24 hours
- Post-mortem if any issues occurred

### Escalation Procedures

**Minor Issues (warnings, performance degradation):**
- 1. Investigate and fix
- 2. Partial rollback if fix not found
- 3. Notify team on Slack

**Major Issues (errors, unavailability):**
- 1. Declare SEV-1 incident
- 2. Immediate rollback
- 3. Notify on-call manager
- 4. Post-mortem within 24 hours

**Critical Issues (data loss, security):**
- 1. Immediate full rollback
- 2. Activate incident commander
- 3. Notify C-level management
- 4. Begin forensic investigation

---

## Deployment Troubleshooting

### Health Check Failing

```bash
# Check what's failing
curl http://api.internal/api/validation/status/health -v

# Verify components
- Database: psql -h $DB_HOST -U $DB_USER -c "SELECT 1"
- Redis: redis-cli ping
- API: curl http://localhost:3001/health

# If database failing:
psql -h $DB_HOST -U $DB_USER -d fleet_db -c "SELECT COUNT(*) FROM validation_runs"

# If Redis failing:
redis-cli INFO | grep connected_clients

# Restore backup if needed
psql -h $DB_HOST -U $DB_USER fleet_db < backups/latest.sql.gz
```

### Readiness Check Failing

```bash
# Check agent status
curl http://api.internal/api/validation/status/agents

# Manually trigger agent initialization
curl -X POST http://api.internal/api/validation/agents/initialize \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Wait for agents to warm up (~30 seconds)
sleep 30

# Re-check readiness
curl http://api.internal/api/validation/status/ready
```

### High Memory Usage

```bash
# Check memory baseline
curl http://api.internal/api/validation/status/performance | jq '.baseline.resourceUtilization.memory'

# If > 80% used, check:
1. Are agents leaking memory?
2. Is cache growing unbounded?
3. Are database connections pooled correctly?

# Restart service if needed
kubectl delete pod -l app=fleet-api
kubectl wait --for=condition=Ready pod -l app=fleet-api
```

### Database Migration Failed

```bash
# Check migration status
npm run migrate -- --status

# Roll back failed migration
npm run migrate -- --rollback

# Restore database from backup
psql -h $DB_HOST -U $DB_USER fleet_db < backups/fleet_db_pre_migration.sql.gz

# Re-run migrations step-by-step
npm run migrate -- --step
```

---

## Success Criteria

Deployment considered successful when:

✅ All 6 validation agents operational
✅ Health check endpoint returns 200
✅ Readiness check endpoint returns 200
✅ Quality score calculated correctly
✅ No error spikes in metrics
✅ Database migrations applied
✅ Performance metrics within baseline
✅ Team notified and acknowledged

**Timeline:**
- T-30 min: Pre-deployment checklist complete
- T-0: Services deployed and verified
- T+10 min: Team notification sent
- T+1 hour: Monitoring stable
- T+24 hours: Archive backups, close deployment
