# Fleet Management System - Quick Start Guide

## Prerequisites

- kubectl installed and configured
- Access to AKS cluster (fleet-aks-cluster)
- Access to Azure Container Registry (fleetappregistry.azurecr.io)

## Environment URLs

- **Production**: https://fleet.capitaltechalliance.com
- **Staging**: https://fleet-staging.capitaltechalliance.com
- **Development**: https://fleet-dev.capitaltechalliance.com

## Test Credentials

For Dev and Staging environments:
- **Admin**: admin@acme.com / password123
- **Fleet Manager**: fleet@acme.com / password123
- **Driver**: driver1@acme.com / password123

## Quick Deploy

### Development Environment

```bash
cd deployment/scripts
./deploy-dev.sh
./seed-dev.sh
```

### Staging Environment

```bash
cd deployment/scripts
./deploy-staging.sh
./seed-staging.sh
```

## Quick Status Check

```bash
# All environments
kubectl get pods --all-namespaces | grep fleet

# Development
kubectl get all -n fleet-management-dev

# Staging
kubectl get all -n fleet-management-staging

# Production
kubectl get all -n fleet-management
```

## Common Tasks

### View Application Logs

```bash
# Development
kubectl logs -n fleet-management-dev -l app=fleet-app --tail=50 -f

# Staging
kubectl logs -n fleet-management-staging -l app=fleet-app --tail=50 -f
```

### Restart Application

```bash
# Development
kubectl rollout restart deployment/fleet-app -n fleet-management-dev

# Staging
kubectl rollout restart deployment/fleet-app -n fleet-management-staging
```

### Update Application Image

```bash
# Development
kubectl set image deployment/fleet-app \
  fleet-app=fleetappregistry.azurecr.io/fleet-app:dev \
  -n fleet-management-dev

# Staging
kubectl set image deployment/fleet-app \
  fleet-app=fleetappregistry.azurecr.io/fleet-app:staging \
  -n fleet-management-staging
```

### Access Database

```bash
# Development
kubectl exec -it -n fleet-management-dev fleet-postgres-0 -- \
  psql -U fleetadmin -d fleetdb_dev

# Staging
kubectl exec -it -n fleet-management-staging fleet-postgres-0 -- \
  psql -U fleetadmin -d fleetdb_staging
```

### Backup Database

```bash
# Development
kubectl exec -n fleet-management-dev fleet-postgres-0 -- \
  pg_dump -U fleetadmin fleetdb_dev > backup-dev-$(date +%Y%m%d).sql

# Staging
kubectl exec -n fleet-management-staging fleet-postgres-0 -- \
  pg_dump -U fleetadmin fleetdb_staging > backup-staging-$(date +%Y%m%d).sql
```

### Refresh Test Data

```bash
cd deployment/scripts

# Development (50 vehicles)
./seed-dev.sh

# Staging (100 vehicles)
./seed-staging.sh
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n fleet-management-dev

# Check events
kubectl get events -n fleet-management-dev --sort-by='.lastTimestamp'

# Check resource usage
kubectl top nodes
kubectl top pods -n fleet-management-dev
```

### Database Connection Issues

```bash
# Test connectivity
kubectl exec -it -n fleet-management-dev fleet-postgres-0 -- \
  psql -U fleetadmin -d fleetdb_dev -c "SELECT 1;"

# Check service
kubectl get svc fleet-postgres-service -n fleet-management-dev

# Check logs
kubectl logs -n fleet-management-dev fleet-postgres-0
```

### Application Not Accessible

```bash
# Check ingress
kubectl describe ingress fleet-ingress -n fleet-management-dev

# Check certificate
kubectl get certificate -n fleet-management-dev

# Check LoadBalancer service
kubectl get svc fleet-app-service -n fleet-management-dev
```

## Important Notes

### Resource Constraints
The AKS cluster may have insufficient CPU to run all environments simultaneously. If pods are in "Pending" state:

```bash
# Scale cluster
az aks scale \
  --resource-group <resource-group> \
  --name fleet-aks-cluster \
  --node-count 5
```

### Data Isolation
Each environment has completely separate data:
- Production: Real data
- Staging: 100 test vehicles, 1000+ records
- Development: 50 test vehicles, 400+ records

### Environment Differences
- **Dev**: Debug logging, no SSL required, CORS open, development features
- **Staging**: Production-like settings, SSL required, specific CORS
- **Production**: Strict security, minimal logging, stable features only

## Documentation

For detailed information, see:
- `/deployment/MULTI_ENVIRONMENT_GUIDE.md` - Comprehensive guide
- `/deployment/DEPLOYMENT_SUMMARY_REPORT.md` - Deployment summary
- `/deployment/QUICK_START.md` - This file

## File Locations

### Kubernetes Manifests
```
deployment/environments/
├── dev/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── postgres.yaml
│   ├── redis.yaml
│   ├── app-deployment.yaml
│   ├── api-deployment.yaml
│   └── ingress.yaml
└── staging/
    └── [same structure]
```

### Scripts
```
deployment/scripts/
├── deploy-dev.sh          # Deploy dev environment
├── deploy-staging.sh      # Deploy staging environment
├── seed-database.sql      # Database seed master script
├── seed-dev.sh           # Seed dev database (50 vehicles)
└── seed-staging.sh       # Seed staging database (100 vehicles)
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the comprehensive guide: `MULTI_ENVIRONMENT_GUIDE.md`
3. Check cluster resources: `kubectl top nodes`
4. Escalate to DevOps team

---

**Last Updated**: 2025-11-09
**Version**: 1.0
