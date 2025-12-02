# Fleet Management System - Multi-Environment Guide

## Overview

This guide describes the multi-environment setup for the Fleet Management System deployed on Azure Kubernetes Service (AKS). The system supports three isolated environments: Development, Staging, and Production.

## Architecture

### Environment Isolation
- **Namespace-based isolation**: Each environment runs in its own Kubernetes namespace
- **Separate databases**: Each environment has its own PostgreSQL and Redis instances
- **Independent configurations**: Environment-specific ConfigMaps and Secrets
- **Dedicated ingress**: Separate subdomains for each environment

### Environments

| Environment | Namespace | Subdomain | Purpose |
|------------|-----------|-----------|---------|
| Production | fleet-management | fleet.capitaltechalliance.com | Live production system |
| Staging | fleet-management-staging | fleet-staging.capitaltechalliance.com | Pre-production testing |
| Development | fleet-management-dev | fleet-dev.capitaltechalliance.com | Development and testing |

## Environment Comparison Matrix

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Replicas** |
| App Pods | 1 | 2 | 3 |
| API Pods | 1 | 1 | 1 |
| Auto-scaling | No | Yes (2-10) | Yes (3-20) |
| **Resources** |
| App Memory | 256Mi-1Gi | 512Mi-2Gi | 512Mi-2Gi |
| App CPU | 250m-1000m | 500m-2000m | 500m-2000m |
| Postgres Memory | 128Mi-512Mi | 256Mi-1Gi | 1Gi-4Gi |
| Postgres CPU | 100m-500m | 200m-1000m | 500m-2000m |
| Postgres Storage | 10Gi | 20Gi | 100Gi |
| Redis Memory | 128Mi-512Mi | 256Mi-1Gi | 256Mi-1Gi |
| Redis Storage | 5Gi | 10Gi | 20Gi |
| **Configuration** |
| NODE_ENV | development | staging | production |
| LOG_LEVEL | debug | info | info |
| SSL Required | No | Yes | Yes |
| CORS | * (All origins) | Specific domain | Specific domain |
| Session Timeout | 2 hours | 30 minutes | 30 minutes |
| Debug Tools | Enabled | Disabled | Disabled |
| Mock Data | Enabled | Disabled | Disabled |
| **Data** |
| Vehicles | 50 | 100 | Real data |
| Tenants | 4 test | 4 test | Real tenants |
| Users | 10 test | 10 test | Real users |
| Maintenance Records | 100 | 300 | Real records |
| Work Orders | 50 | 150 | Real orders |
| Fuel Transactions | 200 | 500 | Real transactions |

## Directory Structure

```
deployment/
├── environments/
│   ├── dev/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml
│   │   ├── postgres.yaml
│   │   ├── redis.yaml
│   │   ├── app-deployment.yaml
│   │   ├── api-deployment.yaml
│   │   └── ingress.yaml
│   ├── staging/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml
│   │   ├── postgres.yaml
│   │   ├── redis.yaml
│   │   ├── app-deployment.yaml
│   │   ├── api-deployment.yaml
│   │   └── ingress.yaml
│   └── production/
│       └── (production manifests)
└── scripts/
    ├── deploy-dev.sh
    ├── deploy-staging.sh
    ├── seed-database.sql
    ├── seed-dev.sh
    └── seed-staging.sh
```

## Deployment Procedures

### Initial Setup

1. **Verify AKS Cluster Access**
   ```bash
   kubectl get nodes
   kubectl get namespaces
   ```

2. **Verify Container Registry Access**
   ```bash
   az acr repository list --name fleetappregistry --output table
   ```

### Deploy Development Environment

```bash
# Option 1: Use deployment script
cd deployment/scripts
./deploy-dev.sh

# Option 2: Manual deployment
kubectl apply -f ../environments/dev/namespace.yaml
kubectl apply -f ../environments/dev/configmap.yaml
kubectl apply -f ../environments/dev/secrets.yaml
kubectl apply -f ../environments/dev/postgres.yaml
kubectl apply -f ../environments/dev/redis.yaml
kubectl apply -f ../environments/dev/app-deployment.yaml
kubectl apply -f ../environments/dev/api-deployment.yaml
kubectl apply -f ../environments/dev/ingress.yaml

# Seed the database
./seed-dev.sh
```

### Deploy Staging Environment

```bash
# Option 1: Use deployment script
cd deployment/scripts
./deploy-staging.sh

# Option 2: Manual deployment
kubectl apply -f ../environments/staging/namespace.yaml
kubectl apply -f ../environments/staging/configmap.yaml
kubectl apply -f ../environments/staging/secrets.yaml
kubectl apply -f ../environments/staging/postgres.yaml
kubectl apply -f ../environments/staging/redis.yaml
kubectl apply -f ../environments/staging/app-deployment.yaml
kubectl apply -f ../environments/staging/api-deployment.yaml
kubectl apply -f ../environments/staging/ingress.yaml

# Seed the database
./seed-staging.sh
```

### Update Deployments

#### Update Application Code

```bash
# Tag new version for specific environment
ENV=dev  # or staging, or production
az acr import --name fleetappregistry \
  --source fleetappregistry.azurecr.io/fleet-app:latest \
  --image fleet-app:$ENV-v2

# Update deployment
kubectl set image deployment/fleet-app \
  fleet-app=fleetappregistry.azurecr.io/fleet-app:$ENV-v2 \
  -n fleet-management-$ENV

# Monitor rollout
kubectl rollout status deployment/fleet-app -n fleet-management-$ENV
```

#### Update Configuration

```bash
ENV=dev  # or staging, or production

# Edit the configmap
kubectl edit configmap fleet-config -n fleet-management-$ENV

# Restart pods to pick up changes
kubectl rollout restart deployment/fleet-app -n fleet-management-$ENV
kubectl rollout restart deployment/fleet-api -n fleet-management-$ENV
```

## Data Refresh Procedures

### Refresh Development Data

```bash
cd deployment/scripts

# Option 1: Re-run seed script (clears and repopulates)
./seed-dev.sh

# Option 2: Manual refresh
POD_NAME=$(kubectl get pod -n fleet-management-dev -l app=fleet-postgres -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n fleet-management-dev $POD_NAME -- psql -U fleetadmin -d fleetdb_dev -c "
  TRUNCATE TABLE fuel_transactions, work_orders, maintenance_records,
    vehicles, drivers, users, tenants RESTART IDENTITY CASCADE;
"

./seed-dev.sh
```

### Refresh Staging Data

```bash
cd deployment/scripts

# Same process as dev
./seed-staging.sh
```

### Copy Production Data to Staging (for testing)

```bash
# Export production data
kubectl exec -n fleet-management fleet-postgres-0 -- \
  pg_dump -U fleetadmin fleetdb > production-backup.sql

# Import to staging
POD_NAME=$(kubectl get pod -n fleet-management-staging -l app=fleet-postgres -o jsonpath='{.items[0].metadata.name}')

kubectl cp production-backup.sql fleet-management-staging/$POD_NAME:/tmp/backup.sql
kubectl exec -n fleet-management-staging $POD_NAME -- \
  psql -U fleetadmin -d fleetdb_staging -f /tmp/backup.sql
```

## Environment-Specific URLs and Access

### Development
- **URL**: https://fleet-dev.capitaltechalliance.com
- **Admin**: admin@acme.com / password123
- **Fleet Manager**: fleet@acme.com / password123
- **Driver**: driver1@acme.com / password123

### Staging
- **URL**: https://fleet-staging.capitaltechalliance.com
- **Admin**: admin@acme.com / password123
- **Fleet Manager**: fleet@acme.com / password123
- **Driver**: driver1@acme.com / password123

### Production
- **URL**: https://fleet.capitaltechalliance.com
- **Access**: Real user credentials only

## Monitoring and Troubleshooting

### Check Environment Status

```bash
# Development
kubectl get all -n fleet-management-dev

# Staging
kubectl get all -n fleet-management-staging

# Production
kubectl get all -n fleet-management
```

### View Logs

```bash
# Application logs
kubectl logs -n fleet-management-dev -l app=fleet-app --tail=100

# API logs
kubectl logs -n fleet-management-dev -l app=fleet-api --tail=100

# Database logs
kubectl logs -n fleet-management-dev -l app=fleet-postgres --tail=50

# Follow logs in real-time
kubectl logs -n fleet-management-dev -l app=fleet-app -f
```

### Common Issues

#### Pods Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n fleet-management-dev

# Check resource constraints
kubectl top nodes
kubectl top pods -n fleet-management-dev

# Check events
kubectl get events -n fleet-management-dev --sort-by='.lastTimestamp'
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it -n fleet-management-dev fleet-postgres-0 -- psql -U fleetadmin -d fleetdb_dev -c "SELECT 1;"

# Check database service
kubectl get svc fleet-postgres-service -n fleet-management-dev

# Check database logs
kubectl logs -n fleet-management-dev fleet-postgres-0
```

#### Ingress/SSL Issues
```bash
# Check ingress status
kubectl describe ingress fleet-ingress -n fleet-management-dev

# Check certificate
kubectl get certificate -n fleet-management-dev

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

## Security Best Practices

### Secrets Management
1. **Never commit secrets to git**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly**
4. **Use Azure Key Vault for production secrets** (recommended)

### Network Security
- Production has strict SSL requirements
- Development allows HTTP for easier testing
- All environments use internal cluster networking for database connections
- Ingress controller handles external TLS termination

### Access Control
- Use RBAC to limit namespace access
- Separate service accounts per environment
- Audit access logs regularly

## Maintenance Windows

### Development
- No maintenance window required
- Can be updated anytime
- No downtime SLA

### Staging
- Preferred maintenance: Weekends
- Coordinate with testing team
- 1-hour downtime acceptable

### Production
- Maintenance window: Sundays 2-6 AM EST
- Rolling updates during business hours
- Zero-downtime deployments required

## Promotion Path

1. **Code Development** → Commit to dev branch
2. **Deploy to Dev** → `./deploy-dev.sh`
3. **Test in Dev** → Manual/automated testing
4. **Merge to Staging** → PR approval required
5. **Deploy to Staging** → `./deploy-staging.sh`
6. **QA Testing** → Full regression testing
7. **Merge to Main** → Final approval
8. **Deploy to Production** → Production deployment procedures

## Backup and Recovery

### Database Backups

```bash
# Automated backups (CronJob)
# See deployment/backup-cronjob.yaml

# Manual backup
ENV=dev  # or staging, or production
kubectl exec -n fleet-management-$ENV fleet-postgres-0 -- \
  pg_dump -U fleetadmin fleetdb_$ENV > backup-$ENV-$(date +%Y%m%d).sql
```

### Disaster Recovery

1. **Restore from backup**
   ```bash
   kubectl cp backup.sql fleet-management-dev/fleet-postgres-0:/tmp/
   kubectl exec -n fleet-management-dev fleet-postgres-0 -- \
     psql -U fleetadmin -d fleetdb_dev -f /tmp/backup.sql
   ```

2. **Rebuild from manifests**
   ```bash
   ./deploy-dev.sh
   ./seed-dev.sh
   ```

## Support and Escalation

### Development Issues
- Contact: Development Team
- Response Time: Next business day
- Escalation: Team Lead

### Staging Issues
- Contact: QA Team / DevOps
- Response Time: Same day
- Escalation: Engineering Manager

### Production Issues
- Contact: On-call Engineer (PagerDuty)
- Response Time: Immediate
- Escalation: CTO

## Appendix

### Useful Commands

```bash
# Quick status check
alias fleet-dev='kubectl get all -n fleet-management-dev'
alias fleet-staging='kubectl get all -n fleet-management-staging'
alias fleet-prod='kubectl get all -n fleet-management'

# Quick log access
alias logs-dev='kubectl logs -n fleet-management-dev -l app=fleet-app --tail=50'
alias logs-staging='kubectl logs -n fleet-management-staging -l app=fleet-app --tail=50'
alias logs-prod='kubectl logs -n fleet-management -l app=fleet-app --tail=50'

# Database access
alias db-dev='kubectl exec -it -n fleet-management-dev fleet-postgres-0 -- psql -U fleetadmin -d fleetdb_dev'
alias db-staging='kubectl exec -it -n fleet-management-staging fleet-postgres-0 -- psql -U fleetadmin -d fleetdb_staging'
```

### Container Registry

**Registry**: fleetappregistry.azurecr.io

**Images**:
- `fleet-app:latest` - Production app
- `fleet-app:dev` - Development app
- `fleet-app:staging` - Staging app
- `fleet-api:latest` - Production API
- `fleet-api:dev` - Development API
- `fleet-api:staging` - Staging API

### Resource Quotas

Consider adding ResourceQuotas to prevent environment sprawl:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: fleet-management-dev
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-09
**Maintained By**: DevOps Team
