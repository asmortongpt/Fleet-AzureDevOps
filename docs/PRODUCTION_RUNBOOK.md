# Fleet Management System - Production Runbook

**Version:** 1.0.0
**Last Updated:** November 24, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Deployment Procedures](#deployment-procedures)
3. [Rollback Procedures](#rollback-procedures)
4. [Incident Response](#incident-response)
5. [Scaling Guidelines](#scaling-guidelines)
6. [Backup & Recovery](#backup--recovery)
7. [Security Incident Response](#security-incident-response)
8. [Performance Degradation Response](#performance-degradation-response)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## Emergency Contacts

### Primary Contacts

- **Technical Lead:** Andrew Morton (andrew.m@capitaltechalliance.com)
- **Azure Support:** Azure Portal > Help + Support
- **On-Call Rotation:** See PagerDuty schedule

### Escalation Chain

1. **Level 1:** On-call engineer
2. **Level 2:** Technical lead
3. **Level 3:** Engineering manager
4. **Level 4:** CTO

### External Contacts

- **Azure Support:** 1-800-867-1389
- **Database Support:** [DBA team contact]
- **Network Operations:** [NOC contact]

---

## Deployment Procedures

### Standard Deployment

**Frequency:** Weekly (Thursday 10 PM EST)

**Pre-Deployment:**
```bash
# 1. Run pre-flight checks
./scripts/production-preflight-check.sh

# 2. Review changes
git log --oneline origin/main..HEAD

# 3. Notify team
# Post in #deployments Slack channel
```

**Deployment:**
```bash
# 1. Execute deployment
./scripts/deploy-to-production.sh v1.2.3

# 2. Monitor deployment
kubectl logs -f deployment/fleet-api -n fleet-management

# 3. Watch for errors
kubectl get events -n fleet-management --watch
```

**Post-Deployment:**
```bash
# 1. Run validation
./scripts/validate-production-deployment.sh

# 2. Smoke test critical paths
# - Login flow
# - Vehicle dashboard
# - GPS tracking
# - Work orders

# 3. Monitor metrics
# Check Application Insights for 30 minutes
```

### Emergency/Hotfix Deployment

**When to use:** Critical bug fixes, security patches

**Process:**
1. Create hotfix branch from `main`
2. Apply minimal fix
3. Get approval from technical lead
4. Deploy during business hours if possible
5. Have rollback plan ready

```bash
# Fast-track deployment
SKIP_PREFLIGHT=false ./scripts/deploy-to-production.sh hotfix-v1.2.4
```

---

## Rollback Procedures

### When to Rollback

- Critical functionality broken
- Data corruption detected
- Security vulnerability introduced
- Performance degraded significantly (>50%)
- Error rate exceeds 5%

### Rollback Steps

```bash
# 1. List recent deployments
./scripts/rollback-production.sh --list

# 2. Execute rollback
./scripts/rollback-production.sh

# 3. Confirm rollback
# Type: ROLLBACK

# 4. Validate rollback
./scripts/validate-production-deployment.sh

# 5. Notify team
# Post in #incidents Slack channel
```

### Database Rollback

**WARNING:** Only in catastrophic scenarios

```bash
# 1. List backups
az postgres flexible-server backup list \
  --resource-group fleet-management-rg \
  --server-name fleet-postgres-server

# 2. Restore from backup (DESTRUCTIVE)
# Use Azure Portal > Database > Restore
# Or contact DBA team

# 3. Update application
# Point to restored database
# Restart all pods
```

---

## Incident Response

### Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P0 - Critical** | Complete service outage | 15 minutes | Site down |
| **P1 - High** | Major functionality broken | 1 hour | Login broken |
| **P2 - Medium** | Degraded performance | 4 hours | Slow queries |
| **P3 - Low** | Minor issues | 24 hours | UI glitch |

### Incident Response Checklist

**P0/P1 Incidents:**

1. **Acknowledge (< 5 min)**
   - Acknowledge alert in PagerDuty
   - Post in #incidents channel
   - Start incident bridge if needed

2. **Assess (< 15 min)**
   ```bash
   # Check service health
   kubectl get pods -n fleet-management

   # Check recent deployments
   kubectl rollout history deployment/fleet-api -n fleet-management

   # Check logs
   kubectl logs deployment/fleet-api -n fleet-management --tail=100

   # Check Application Insights
   # Azure Portal > App Insights > Failures
   ```

3. **Mitigate (< 30 min)**
   - If recent deployment: ROLLBACK
   - If database issue: Check connections, failover if needed
   - If infrastructure: Scale up resources
   - If external dependency: Enable circuit breaker

4. **Communicate**
   - Update status page
   - Post updates every 30 minutes
   - Notify affected customers

5. **Resolve**
   - Fix root cause
   - Deploy fix
   - Validate fix
   - Monitor for 1 hour

6. **Post-Mortem (< 48 hours)**
   - Document timeline
   - Identify root cause
   - Create action items
   - Update runbook

### Common Incident Scenarios

#### Site Down / 503 Errors

```bash
# Check pod status
kubectl get pods -n fleet-management

# Check pod logs
kubectl logs -l app=fleet-api -n fleet-management --tail=50

# Check ingress
kubectl describe ingress -n fleet-management

# Check external IP
kubectl get svc -n fleet-management

# If pods failing, describe them
kubectl describe pod <pod-name> -n fleet-management

# Resolution: Restart pods or rollback
kubectl rollout restart deployment/fleet-api -n fleet-management
```

#### High Error Rate

```bash
# Check error logs
kubectl logs deployment/fleet-api -n fleet-management | grep ERROR

# Check Application Insights
# Azure Portal > Failures > Exceptions

# Check database connections
kubectl exec fleet-postgres-0 -n fleet-management -- \
  psql -U fleetadmin -d fleetdb -c \
  "SELECT COUNT(*) FROM pg_stat_activity;"

# Resolution: Identify error pattern, fix or rollback
```

#### Performance Degradation

```bash
# Check resource usage
kubectl top pods -n fleet-management
kubectl top nodes

# Check database performance
kubectl exec fleet-postgres-0 -n fleet-management -- \
  psql -U fleetadmin -d fleetdb -c \
  "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check slow queries
# Application Insights > Performance > Dependencies

# Resolution: Scale up, optimize queries, or add caching
```

---

## Scaling Guidelines

### Horizontal Scaling (Recommended)

**When to scale:**
- CPU usage > 70% sustained
- Memory usage > 80% sustained
- Request queue growing
- Response time > 2 seconds

**Scale API:**
```bash
# Scale to 5 replicas
kubectl scale deployment fleet-api --replicas=5 -n fleet-management

# Verify scaling
kubectl get pods -n fleet-management -l app=fleet-api

# Monitor impact
kubectl top pods -n fleet-management
```

**Scale Frontend:**
```bash
kubectl scale deployment fleet-frontend --replicas=5 -n fleet-management
```

### Vertical Scaling

**Increase pod resources:**
```bash
# Edit deployment
kubectl edit deployment fleet-api -n fleet-management

# Update resources:
#   resources:
#     requests:
#       memory: "512Mi"
#       cpu: "500m"
#     limits:
#       memory: "1Gi"
#       cpu: "1000m"

# Apply changes
kubectl rollout restart deployment/fleet-api -n fleet-management
```

### Auto-Scaling

**Configure HPA:**
```bash
# Create Horizontal Pod Autoscaler
kubectl autoscale deployment fleet-api \
  --cpu-percent=70 \
  --min=3 \
  --max=10 \
  -n fleet-management

# Check status
kubectl get hpa -n fleet-management
```

---

## Backup & Recovery

### Database Backups

**Automatic Backups:**
- Frequency: Daily at 2 AM UTC
- Retention: 7 days (point-in-time recovery available)
- Location: Azure Backup Storage

**Manual Backup:**
```bash
# Create on-demand backup
az postgres flexible-server backup create \
  --resource-group fleet-management-rg \
  --server-name fleet-postgres-server \
  --backup-name manual-backup-$(date +%Y%m%d)
```

**Restore from Backup:**
```bash
# List available backups
az postgres flexible-server backup list \
  --resource-group fleet-management-rg \
  --server-name fleet-postgres-server

# Restore (creates new server)
az postgres flexible-server restore \
  --resource-group fleet-management-rg \
  --name fleet-postgres-server-restored \
  --source-server fleet-postgres-server \
  --restore-point-in-time "2025-11-24T10:00:00Z"
```

### Configuration Backups

**Backup Kubernetes configs:**
```bash
# Backup all configs
kubectl get all -n fleet-management -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Backup secrets (encrypted)
kubectl get secrets -n fleet-management -o yaml > secrets-backup-$(date +%Y%m%d).yaml

# Store in secure location (Azure Key Vault or encrypted S3)
```

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours

**DR Procedure:**
1. Restore database from latest backup
2. Deploy application to backup region
3. Update DNS to point to backup region
4. Validate all services operational
5. Communicate with users

---

## Security Incident Response

### Security Breach Detected

1. **Isolate**
   ```bash
   # Block suspicious IPs at ingress level
   kubectl edit ingress -n fleet-management

   # Rotate secrets immediately
   ./scripts/rotate-credentials.sh
   ```

2. **Assess**
   - Check audit logs for unauthorized access
   - Review recent database changes
   - Check for data exfiltration

3. **Contain**
   - Disable compromised accounts
   - Revoke API keys
   - Update firewall rules

4. **Notify**
   - Security team
   - Legal team (if data breach)
   - Affected users (per compliance requirements)

5. **Recover**
   - Apply security patches
   - Restore from clean backup if needed
   - Implement additional security controls

6. **Learn**
   - Conduct security review
   - Update security policies
   - Implement preventive measures

---

## Performance Degradation Response

### Response Checklist

1. **Identify Bottleneck**
   ```bash
   # Check application metrics
   # Application Insights > Performance

   # Check database
   kubectl exec fleet-postgres-0 -n fleet-management -- \
     psql -U fleetadmin -d fleetdb -c \
     "SELECT * FROM pg_stat_activity WHERE state = 'active';"

   # Check resource usage
   kubectl top pods -n fleet-management
   kubectl top nodes
   ```

2. **Quick Fixes**
   - Scale up pods
   - Clear cache
   - Restart slow services
   - Enable query caching

3. **Long-term Solutions**
   - Optimize slow queries
   - Add database indexes
   - Implement caching layer
   - Upgrade infrastructure

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Response Time | < 500ms | 500-1000ms | > 1000ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| CPU Usage | < 70% | 70-85% | > 85% |
| Memory Usage | < 80% | 80-90% | > 90% |
| Database Connections | < 50 | 50-80 | > 80 |
| Disk Usage | < 70% | 70-85% | > 85% |

### Alert Response

**High Error Rate:**
- Check logs for error patterns
- Check recent deployments
- Consider rollback if recent deploy

**High Response Time:**
- Check database performance
- Check external API dependencies
- Scale up if needed

**Resource Exhaustion:**
- Scale up immediately
- Investigate memory leaks
- Clear unnecessary caches

---

## Common Issues & Solutions

### Issue: Pods Crash Looping

**Symptoms:** Pods repeatedly restart

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n fleet-management
kubectl logs <pod-name> -n fleet-management --previous
```

**Solutions:**
- Check environment variables
- Verify secrets exist
- Check database connectivity
- Review recent code changes

### Issue: Database Connection Pool Exhausted

**Symptoms:** "Too many connections" errors

**Diagnosis:**
```bash
kubectl exec fleet-postgres-0 -n fleet-management -- \
  psql -U fleetadmin -d fleetdb -c \
  "SELECT COUNT(*) FROM pg_stat_activity;"
```

**Solutions:**
- Increase max_connections in PostgreSQL
- Fix connection leaks in code
- Implement connection pooling
- Scale database

### Issue: Slow Page Load Times

**Symptoms:** Frontend takes > 5 seconds to load

**Diagnosis:**
- Check bundle size
- Check CDN cache hit rate
- Check API response times
- Check browser network tab

**Solutions:**
- Enable code splitting
- Optimize images
- Enable gzip/brotli compression
- Add CDN caching

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-24 | Initial production runbook | Andrew Morton |

---

**Last Review Date:** November 24, 2025
**Next Review Date:** February 24, 2026
**Document Owner:** Technical Lead

---

*For questions or updates to this runbook, contact the technical lead or submit a pull request.*
