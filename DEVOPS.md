# Fleet Management System - DevOps Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-12
**Maintained By:** DevOps Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Infrastructure](#infrastructure)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Deployment](#deployment)
6. [Monitoring & Observability](#monitoring--observability)
7. [Security](#security)
8. [Disaster Recovery](#disaster-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

The Fleet Management System is deployed on **Azure Kubernetes Service (AKS)** using a containerized architecture. This guide provides comprehensive documentation for DevOps operations, deployment procedures, and maintenance tasks.

### Key Technologies

- **Container Orchestration**: Kubernetes (AKS)
- **Container Registry**: Azure Container Registry (ACR)
- **CI/CD**: GitHub Actions
- **Infrastructure**: Azure Cloud
- **Monitoring**: Azure Monitor, Prometheus, Grafana
- **Database**: PostgreSQL (in-cluster or Azure managed)
- **Cache**: Redis (in-cluster or Azure managed)
- **Web Server**: Nginx

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud                             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │            Azure Kubernetes Service (AKS)             │ │
│  │                                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │  Frontend   │  │   API       │  │  PostgreSQL │ │ │
│  │  │  (Nginx)    │  │  (Node.js)  │  │             │ │ │
│  │  │  3 replicas │  │  1 replica  │  │  StatefulSet│ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  │                                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐                   │ │
│  │  │   Redis     │  │   Ingress   │                   │ │
│  │  │   Cache     │  │  Controller │                   │ │
│  │  └─────────────┘  └─────────────┘                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │     ACR       │  │  Key Vault    │  │   Monitor    │  │
│  │  (Images)     │  │  (Secrets)    │  │  (Logging)   │  │
│  └───────────────┘  └───────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                    ┌───────┴────────┐
                    │ GitHub Actions │
                    │    CI/CD       │
                    └────────────────┘
```

### Environment Strategy

The system supports three isolated environments:

| Environment | Namespace | URL | Purpose |
|------------|-----------|-----|---------|
| **Production** | fleet-management | fleet.capitaltechalliance.com | Live production system |
| **Staging** | fleet-management-staging | fleet-staging.capitaltechalliance.com | Pre-production testing |
| **Development** | fleet-management-dev | fleet-dev.capitaltechalliance.com | Development and testing |

---

## Infrastructure

### Azure Resources

#### Required Resources

1. **Azure Kubernetes Service (AKS)**
   - Version: 1.27+
   - Node Pool: 3-20 nodes (auto-scaling)
   - VM Size: Standard_D4s_v3
   - Network: Azure CNI
   - Zones: 1, 2, 3 (for HA)

2. **Azure Container Registry (ACR)**
   - SKU: Premium
   - Geo-replication: Enabled
   - Image quarantine: Enabled
   - Content trust: Enabled

3. **Azure Key Vault**
   - RBAC-enabled
   - Soft delete: Enabled
   - Purge protection: Enabled

4. **Azure Monitor**
   - Log Analytics workspace
   - Application Insights
   - Container insights

5. **Azure Storage Account**
   - SKU: Standard_ZRS
   - Encryption: Enabled
   - Private endpoints: Configured

#### Optional Managed Services

- **Azure Database for PostgreSQL Flexible Server**
  - Version: 15
  - HA: Zone-redundant
  - Backup retention: 30 days

- **Azure Cache for Redis**
  - SKU: Premium P1
  - Version: 6
  - Persistence: Enabled

### Kubernetes Architecture

#### Namespaces

```bash
# Production
fleet-management

# Staging
fleet-management-staging

# Development
fleet-management-dev

# Supporting services
kube-system
cert-manager
monitoring
ingress-nginx
```

#### Key Components

1. **Frontend Deployment**
   - Image: Nginx + React build
   - Replicas: 3 (production), 2 (staging), 1 (dev)
   - Auto-scaling: HPA based on CPU/Memory
   - Health checks: Liveness, readiness, startup probes

2. **Backend API Deployment**
   - Image: Node.js 20 + Express
   - Replicas: 1 (can be scaled)
   - Database connection pooling
   - Health checks: Liveness, readiness

3. **PostgreSQL StatefulSet**
   - Storage: Azure Disk (persistent)
   - Backup: CronJob for pg_dump
   - Replication: Optional standby

4. **Redis Deployment**
   - Storage: Azure Disk (persistent)
   - Persistence: AOF + RDB
   - Memory: 256Mi-1Gi

---

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and consists of the following stages:

#### 1. Lint & Type Check

```yaml
- ESLint (frontend & API)
- TypeScript compilation check
- Code quality validation
```

#### 2. Unit Tests

```yaml
- Frontend tests (Jest/Vitest)
- API tests (Jest)
- Coverage reporting (Codecov)
- Minimum coverage: 80%
```

#### 3. Build Verification

```yaml
- Build frontend (Vite)
- Build API (TypeScript compilation)
- Artifact upload
```

#### 4. Docker Build & Push

```yaml
- Build frontend Docker image
- Build API Docker image
- Tag with git SHA and 'latest'
- Push to Azure Container Registry
- Security scanning
```

#### 5. Deploy to Kubernetes

```yaml
- Update deployment images
- Rolling update strategy
- Wait for rollout completion
- Verify pod health
```

#### 6. Smoke Tests

```yaml
- Health check endpoints
- Basic functionality tests
- Authentication verification
```

### Triggering Deployments

```bash
# Automatic deployment on push to main
git push origin main

# Manual deployment workflow
gh workflow run ci-cd.yml

# Deploy specific environment
gh workflow run azure-deploy.yml --ref staging
```

### Docker Build Arguments

**IMPORTANT**: The Dockerfile now requires the Azure Maps key as a build argument for security:

```bash
# Build with Azure Maps key
docker build \
  --build-arg VITE_AZURE_MAPS_SUBSCRIPTION_KEY=$AZURE_MAPS_KEY \
  -t fleetappregistry.azurecr.io/fleet-frontend:v1.0.0 \
  .

# Push to registry
docker push fleetappregistry.azurecr.io/fleet-frontend:v1.0.0
```

**GitHub Actions Secret**: Set `AZURE_MAPS_SUBSCRIPTION_KEY` in repository secrets.

---

## Deployment

### Quick Deployment

#### Production Deployment

```bash
# 1. Ensure you're on the correct branch
git checkout main

# 2. Run deployment script
./scripts/deploy-production.sh

# 3. Monitor the deployment
kubectl rollout status deployment/fleet-app -n fleet-management
kubectl rollout status deployment/fleet-api -n fleet-management

# 4. Verify health
kubectl get pods -n fleet-management
curl https://fleet.capitaltechalliance.com/api/health
```

#### Staging Deployment

```bash
cd deployment/scripts
./deploy-staging.sh
./seed-staging.sh
```

#### Development Deployment

```bash
cd deployment/scripts
./deploy-dev.sh
./seed-dev.sh
```

### Manual Deployment Steps

If you need to deploy manually:

```bash
# 1. Set context
kubectl config use-context fleet-aks-cluster

# 2. Select namespace
export NAMESPACE=fleet-management

# 3. Apply configurations
kubectl apply -f deployment/kubernetes/namespace.yaml
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/secrets.yaml

# 4. Deploy database (if using in-cluster)
kubectl apply -f deployment/kubernetes/postgres.yaml
kubectl apply -f deployment/kubernetes/redis.yaml

# 5. Deploy application
kubectl apply -f deployment/kubernetes/deployment.yaml
kubectl apply -f deployment/kubernetes/service.yaml
kubectl apply -f deployment/kubernetes/ingress.yaml

# 6. Verify deployment
kubectl get pods -n $NAMESPACE
kubectl get svc -n $NAMESPACE
kubectl get ingress -n $NAMESPACE
```

### Rollback Procedures

#### Automatic Rollback

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/fleet-app -n fleet-management
kubectl rollout undo deployment/fleet-api -n fleet-management

# Rollback to specific revision
kubectl rollout undo deployment/fleet-app --to-revision=5 -n fleet-management
```

#### Manual Rollback

```bash
# 1. List deployment history
kubectl rollout history deployment/fleet-app -n fleet-management

# 2. Check specific revision
kubectl rollout history deployment/fleet-app --revision=10 -n fleet-management

# 3. Rollback
kubectl rollout undo deployment/fleet-app --to-revision=10 -n fleet-management

# 4. Monitor rollback
kubectl rollout status deployment/fleet-app -n fleet-management
```

### Configuration Updates

#### Update ConfigMap

```bash
# Edit ConfigMap
kubectl edit configmap fleet-config -n fleet-management

# Restart pods to pick up changes
kubectl rollout restart deployment/fleet-app -n fleet-management
kubectl rollout restart deployment/fleet-api -n fleet-management
```

#### Update Secrets

```bash
# Update secret (from Azure Key Vault)
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name jwt-secret \
  --value "new-secret-value"

# Update Kubernetes secret
kubectl create secret generic fleet-secrets \
  --from-literal=JWT_SECRET="new-secret-value" \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods
kubectl rollout restart deployment/fleet-app -n fleet-management
```

---

## Monitoring & Observability

### Azure Monitor

```bash
# View container logs
az monitor log-analytics query \
  --workspace fleet-logs \
  --analytics-query "ContainerLog | where TimeGenerated > ago(1h)"

# View metrics
az monitor metrics list \
  --resource fleet-aks-cluster \
  --metric-names "node_cpu_usage_percentage"
```

### Kubernetes Monitoring

```bash
# View pod logs
kubectl logs -f deployment/fleet-app -n fleet-management

# View API logs
kubectl logs -f deployment/fleet-api -n fleet-management

# View logs from specific pod
kubectl logs -f fleet-app-7d4f9c8b5d-x7k2q -n fleet-management

# Follow logs with timestamps
kubectl logs -f --timestamps deployment/fleet-app -n fleet-management

# View logs from previous pod (after crash)
kubectl logs --previous fleet-app-7d4f9c8b5d-x7k2q -n fleet-management
```

### Resource Monitoring

```bash
# Node resource usage
kubectl top nodes

# Pod resource usage
kubectl top pods -n fleet-management

# Detailed pod metrics
kubectl describe pod fleet-app-7d4f9c8b5d-x7k2q -n fleet-management
```

### Prometheus & Grafana

```bash
# Port-forward to Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Access Grafana: http://localhost:3000
# Default credentials: admin/prom-operator

# View Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Access Prometheus: http://localhost:9090
```

### Health Checks

```bash
# Application health
curl https://fleet.capitaltechalliance.com/health

# API health
curl https://fleet.capitaltechalliance.com/api/health

# Database connection
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetadmin -d fleetdb -c "SELECT 1;"

# Redis connection
kubectl exec -it fleet-redis-0 -n fleet-management -- \
  redis-cli ping
```

---

## Security

### Secrets Management

#### Azure Key Vault Integration

```bash
# Store secret in Key Vault
az keyvault secret set \
  --vault-name fleet-keyvault \
  --name db-password \
  --value "secure-password-123"

# Retrieve secret
az keyvault secret show \
  --vault-name fleet-keyvault \
  --name db-password \
  --query value -o tsv
```

#### Kubernetes Secrets

```bash
# Create secret from literal
kubectl create secret generic fleet-secrets \
  --from-literal=DB_PASSWORD="secure-password" \
  --from-literal=JWT_SECRET="jwt-secret-key" \
  -n fleet-management

# Create secret from file
kubectl create secret generic fleet-tls \
  --from-file=tls.crt=./cert.crt \
  --from-file=tls.key=./cert.key \
  -n fleet-management

# View secrets (base64 encoded)
kubectl get secret fleet-secrets -n fleet-management -o yaml

# Decode secret
kubectl get secret fleet-secrets -n fleet-management \
  -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### RBAC (Role-Based Access Control)

```bash
# Create service account
kubectl create serviceaccount fleet-deployer -n fleet-management

# Create role
kubectl create role pod-reader \
  --verb=get,list,watch \
  --resource=pods \
  -n fleet-management

# Bind role to service account
kubectl create rolebinding fleet-deployer-binding \
  --role=pod-reader \
  --serviceaccount=fleet-management:fleet-deployer \
  -n fleet-management
```

### Security Scanning

```bash
# Scan Docker image for vulnerabilities
az acr check-health --name fleetappregistry

# Trivy scan
trivy image fleetappregistry.azurecr.io/fleet-app:latest

# Scan Kubernetes manifests
kubectl apply --dry-run=server -f deployment/kubernetes/deployment.yaml
```

### Network Policies

```yaml
# Example network policy (apply as needed)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: fleet-management
spec:
  podSelector:
    matchLabels:
      app: fleet-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: fleet-app
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: fleet-postgres
    ports:
    - protocol: TCP
      port: 5432
```

---

## Disaster Recovery

### Backup Procedures

#### Database Backups

```bash
# Manual backup
kubectl exec -n fleet-management fleet-postgres-0 -- \
  pg_dump -U fleetadmin fleetdb > backup-$(date +%Y%m%d-%H%M%S).sql

# Automated backup (CronJob already configured)
kubectl get cronjob fleet-backup -n fleet-management

# Download backup from Azure Storage
az storage blob download \
  --account-name fleetbackups \
  --container-name database-backups \
  --name backup-20251112.sql \
  --file local-backup.sql
```

#### Application State Backups

```bash
# Backup Kubernetes resources
kubectl get all -n fleet-management -o yaml > fleet-backup.yaml

# Backup ConfigMaps and Secrets
kubectl get configmap,secret -n fleet-management -o yaml > fleet-config-backup.yaml

# Backup PersistentVolumeClaims
kubectl get pvc -n fleet-management -o yaml > fleet-pvc-backup.yaml
```

### Restore Procedures

#### Database Restore

```bash
# Copy backup to pod
kubectl cp backup.sql fleet-management/fleet-postgres-0:/tmp/backup.sql

# Restore database
kubectl exec -n fleet-management fleet-postgres-0 -- \
  psql -U fleetadmin -d fleetdb -f /tmp/backup.sql

# Verify restore
kubectl exec -n fleet-management fleet-postgres-0 -- \
  psql -U fleetadmin -d fleetdb -c "\dt"
```

#### Point-in-Time Recovery (Azure PostgreSQL)

```bash
# Restore to specific point in time
az postgres flexible-server restore \
  --resource-group fleet-management-rg \
  --name fleet-postgres-server-restored \
  --source-server fleet-postgres-server \
  --restore-time "2025-11-12T10:00:00Z"
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n fleet-management

# Check events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n fleet-management

# Common fixes:
# - Check resource limits
# - Verify image pull secrets
# - Check node capacity
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it <api-pod> -n fleet-management -- \
  nc -zv fleet-postgres-service 5432

# Check database logs
kubectl logs fleet-postgres-0 -n fleet-management

# Verify credentials
kubectl get secret fleet-secrets -n fleet-management -o yaml
```

#### 3. Image Pull Errors

```bash
# Verify ACR credentials
az acr credential show --name fleetappregistry

# Update image pull secret
kubectl create secret docker-registry acr-secret \
  --docker-server=fleetappregistry.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password> \
  -n fleet-management

# Link to service account
kubectl patch serviceaccount default \
  -p '{"imagePullSecrets": [{"name": "acr-secret"}]}' \
  -n fleet-management
```

#### 4. High Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n fleet-management

# Scale deployment
kubectl scale deployment fleet-app --replicas=5 -n fleet-management

# Update resource limits
kubectl edit deployment fleet-app -n fleet-management
```

#### 5. Ingress/TLS Issues

```bash
# Check ingress status
kubectl describe ingress fleet-ingress -n fleet-management

# Check certificate
kubectl get certificate -n fleet-management

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Force certificate renewal
kubectl delete certificate fleet-tls -n fleet-management
```

### Debug Commands

```bash
# Get shell in running pod
kubectl exec -it <pod-name> -n fleet-management -- /bin/sh

# Run curl from pod
kubectl exec -it <pod-name> -n fleet-management -- \
  curl http://fleet-api-service:3000/health

# Check DNS resolution
kubectl exec -it <pod-name> -n fleet-management -- \
  nslookup fleet-postgres-service

# Check network connectivity
kubectl exec -it <pod-name> -n fleet-management -- \
  nc -zv fleet-postgres-service 5432
```

---

## Best Practices

### 1. Deployment Best Practices

- **Always use rolling updates** for zero-downtime deployments
- **Set resource requests and limits** for all containers
- **Use health checks** (liveness, readiness, startup probes)
- **Tag images with git SHA** for traceability
- **Never use `:latest` tag** in production
- **Test in staging** before production deployment

### 2. Security Best Practices

- **Store secrets in Azure Key Vault**, not in git
- **Use RBAC** for access control
- **Scan images** for vulnerabilities
- **Rotate secrets** regularly (every 90 days)
- **Use network policies** to restrict pod communication
- **Enable pod security standards**

### 3. Monitoring Best Practices

- **Set up alerts** for critical metrics
- **Monitor resource usage** regularly
- **Review logs** for errors and warnings
- **Track deployment history**
- **Monitor database performance**
- **Set up uptime monitoring**

### 4. Backup Best Practices

- **Automate backups** with CronJobs
- **Test restore procedures** regularly
- **Store backups** in multiple locations
- **Encrypt backups** at rest
- **Retain backups** according to policy (30 days minimum)

### 5. Documentation Best Practices

- **Document all changes** in git commits
- **Update runbooks** after incidents
- **Maintain architecture diagrams**
- **Document configuration** in comments
- **Keep this guide updated**

---

## Additional Resources

### Documentation

- [Azure Deployment Guide](deployment/AZURE_DEPLOYMENT_GUIDE.md)
- [Multi-Environment Guide](deployment/MULTI_ENVIRONMENT_GUIDE.md)
- [Quick Start Guide](deployment/QUICK_START.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

### External Links

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure AKS Documentation](https://docs.microsoft.com/azure/aks/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Documentation](https://docs.github.com/actions)

### Support

- **DevOps Team**: devops@fleet.example.com
- **On-Call**: Use PagerDuty for production issues
- **Documentation**: https://github.com/asmortongpt/Fleet

---

**Document Version**: 1.0.0
**Last Reviewed**: 2025-11-12
**Next Review**: 2025-12-12
**Owner**: DevOps Team
