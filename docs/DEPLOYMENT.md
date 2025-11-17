# Fleet Management System - Deployment Guide

## Prerequisites

### Required Tools
- `kubectl` (v1.28+)
- `az` CLI (Azure Command Line Interface)
- `docker` (v24+)
- `git`
- Access to Azure Kubernetes Service (AKS)

### Required Accounts
- Azure subscription with AKS access
- Azure Container Registry (ACR) credentials
- GitHub account (for CI/CD)

---

## Quick Start (15 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/capitaltechalliance/fleet-management.git
cd fleet-management
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Connect to AKS
```bash
az login
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster
```

### 4. Deploy Core Infrastructure
```bash
# Create namespace
kubectl apply -f deployment/kubernetes/namespace.yaml

# Deploy secrets
kubectl apply -f deployment/kubernetes/secrets.yaml

# Deploy PostgreSQL
kubectl apply -f deployment/kubernetes/postgres.yaml

# Deploy Redis
kubectl apply -f deployment/kubernetes/redis.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=fleet-postgres -n fleet-management --timeout=5m
kubectl wait --for=condition=ready pod -l app=fleet-redis -n fleet-management --timeout=3m
```

### 5. Initialize Database
```bash
# Copy schema to postgres pod
kubectl cp database/schema-simple.sql fleet-management/fleet-postgres-0:/tmp/

# Apply schema
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetuser -d fleetdb -f /tmp/schema-simple.sql

# Load seed data
kubectl cp scripts/seed-production-data.sql fleet-management/fleet-postgres-0:/tmp/
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetuser -d fleetdb -f /tmp/seed-production-data.sql

# Apply performance indexes
kubectl cp database/indexes.sql fleet-management/fleet-postgres-0:/tmp/
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetuser -d fleetdb -f /tmp/indexes.sql
```

### 6. Deploy Application
```bash
# Deploy API
kubectl apply -f deployment/kubernetes/deployment.yaml

# Deploy frontend
kubectl apply -f deployment/api-deployment.yaml

# Create services
kubectl apply -f deployment/kubernetes/service.yaml

# Configure ingress
kubectl apply -f deployment/kubernetes/ingress.yaml
```

### 7. Deploy Monitoring (Optional)
```bash
kubectl apply -f deployment/monitoring.yaml
```

### 8. Configure Backups
```bash
# Update Azure storage credentials in backup-cronjob.yaml
kubectl apply -f deployment/backup-cronjob.yaml
```

### 9. Verify Deployment
```bash
bash scripts/verify-production.sh
```

---

## Detailed Configuration

### Database Configuration

**Connection String:**
```
postgresql://fleetuser:PASSWORD@fleet-postgres-service:5432/fleetdb
```

**Environment Variables:**
- `DB_HOST`: fleet-postgres-service.fleet-management.svc.cluster.local
- `DB_PORT`: 5432
- `DB_NAME`: fleetdb
- `DB_USER`: fleetuser
- `DB_PASSWORD`: (from Kubernetes secret)

### Redis Configuration

**Connection:**
```
redis://fleet-redis-service:6379
```

**Cache Strategy:**
- Vehicle lists: 5 min TTL
- Driver profiles: 10 min TTL
- Reports: 15 min TTL

### SSL/TLS Setup

1. **Install cert-manager:**
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. **Create ClusterIssuer:**
```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@capitaltechalliance.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

3. **Update Ingress with TLS:**
```yaml
spec:
  tls:
    - hosts:
        - fleet.capitaltechalliance.com
      secretName: fleet-tls-cert
```

---

## Scaling

### Horizontal Pod Autoscaling

```bash
kubectl autoscale deployment fleet-api \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n fleet-management
```

### Database Scaling

For production, use Azure Database for PostgreSQL:

```bash
az postgres flexible-server create \
  --resource-group fleet-management-rg \
  --name fleet-postgres \
  --admin-user fleetadmin \
  --admin-password 'SecurePassword123!' \
  --sku-name Standard_D4s_v3 \
  --tier GeneralPurpose \
  --version 15 \
  --storage-size 256 \
  --backup-retention 30 \
  --geo-redundant-backup Enabled
```

---

## Monitoring

### Access Grafana

```bash
kubectl port-forward -n fleet-monitoring svc/grafana 3000:80
```

Open: http://localhost:3000
- Username: admin
- Password: Fleet@2025

### View Logs

```bash
# API logs
kubectl logs -f deployment/fleet-api -n fleet-management

# Database logs
kubectl logs -f statefulset/fleet-postgres -n fleet-management

# All namespace logs
kubectl logs -f --all-containers -n fleet-management
```

---

## Backup & Recovery

### Manual Backup

```bash
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  /scripts/backup-database.sh
```

### Restore from Backup

```bash
# Copy restore script
kubectl cp scripts/restore-database.sh fleet-management/fleet-postgres-0:/tmp/

# Run restore (interactive)
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  bash /tmp/restore-database.sh
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n fleet-management

# Describe problematic pod
kubectl describe pod <pod-name> -n fleet-management

# Check events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it fleet-api-xxxxx -n fleet-management -- \
  nc -zv fleet-postgres-service 5432

# Check database logs
kubectl logs fleet-postgres-0 -n fleet-management
```

### Certificate Issues

```bash
# Check cert-manager status
kubectl get certificates -n fleet-management
kubectl describe certificate fleet-tls-cert -n fleet-management

# Force certificate renewal
kubectl delete certificate fleet-tls-cert -n fleet-management
```

---

## Security Best Practices

1. **Rotate secrets regularly** (every 90 days)
2. **Enable network policies** to restrict pod communication
3. **Use Azure Key Vault** for sensitive credentials
4. **Enable audit logging** for all API requests
5. **Implement RBAC** for Kubernetes access
6. **Use private AKS cluster** for production
7. **Enable Azure Defender** for container security

---

## Support

- **Documentation**: https://docs.fleet.capitaltechalliance.com
- **Support Email**: support@capitaltechalliance.com
- **Emergency**: +1-850-555-9999

