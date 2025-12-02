# CTAFleet - DevOps Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you quickly deploy CTAFleet to production.

---

## Prerequisites

- Azure subscription
- Azure CLI installed
- kubectl installed
- Terraform installed
- Docker installed
- Access to domain DNS settings

---

## Quick Deploy to Production

### Step 1: Clone and Configure (2 minutes)

```bash
# Clone repository
git clone https://github.com/youraccount/Fleet.git
cd Fleet

# Copy environment template
cp .env.production.complete .env.production

# Edit with your actual values
vim .env.production

# Copy Terraform variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
vim terraform/terraform.tfvars
```

### Step 2: Provision Infrastructure (10-15 minutes)

```bash
cd terraform

# Login to Azure
az login

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply (create infrastructure)
terraform apply
# Type 'yes' when prompted

# Save outputs
terraform output > ../deployment/terraform-outputs.txt
```

### Step 3: Configure Kubernetes (2 minutes)

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group ctafleet-production-rg \
  --name ctafleet-production-aks

# Verify connection
kubectl cluster-info
kubectl get nodes

# Install cert-manager for SSL
./deployment/scripts/install-cert-manager.sh
```

### Step 4: Deploy Application (5 minutes)

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl create secret generic fleet-secrets \
  --from-env-file=.env.production \
  -n ctafleet

# Apply all manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l component=postgres -n ctafleet --timeout=5m
kubectl wait --for=condition=ready pod -l component=redis -n ctafleet --timeout=5m

# Deploy application
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/python-services-deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/pdb.yaml
```

### Step 5: Configure DNS (5 minutes)

```bash
# Get ingress IP
INGRESS_IP=$(kubectl get ingress fleet-ingress -n ctafleet -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Configure these DNS A records:"
echo "fleet.ctafleet.com -> ${INGRESS_IP}"
echo "www.ctafleet.com -> ${INGRESS_IP}"
echo "api.ctafleet.com -> ${INGRESS_IP}"

# Wait for DNS propagation (5-10 minutes)
# Then verify SSL certificate is issued
kubectl get certificate fleet-tls -n ctafleet
```

### Step 6: Verify (2 minutes)

```bash
# Check all pods are running
kubectl get pods -n ctafleet

# Test health endpoints
curl -f https://fleet.ctafleet.com/api/health
curl -I https://fleet.ctafleet.com

# View logs
kubectl logs -f deployment/fleet-api -n ctafleet
```

---

## Local Development Setup

### Using Docker Compose

```bash
# Copy environment file
cp .env.example .env

# Edit with local values
vim .env

# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Access services
# Frontend: http://localhost:80
# API: http://localhost:3000
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090

# Stop services
docker-compose -f docker-compose.production.yml down
```

---

## Essential Commands

### Deployment
```bash
# Update API image
kubectl set image deployment/fleet-api \
  api=fleetappregistry.azurecr.io/fleet-api:v2.0.0 \
  -n ctafleet

# Monitor rollout
kubectl rollout status deployment/fleet-api -n ctafleet

# Rollback
kubectl rollout undo deployment/fleet-api -n ctafleet
```

### Scaling
```bash
# Manual scale
kubectl scale deployment fleet-api --replicas=5 -n ctafleet

# Check HPA status
kubectl get hpa -n ctafleet
```

### Monitoring
```bash
# Check pod status
kubectl get pods -n ctafleet

# View logs
kubectl logs -f deployment/fleet-api -n ctafleet

# Check resource usage
kubectl top pods -n ctafleet

# Port-forward to Grafana
kubectl port-forward -n ctafleet-monitoring svc/grafana 3001:3000
# Access: http://localhost:3001
```

### Backup & Restore
```bash
# Manual backup
./deployment/scripts/backup-postgres.sh

# Restore from latest
./deployment/scripts/restore-postgres.sh latest

# Check DR status
./deployment/scripts/disaster-recovery.sh status
```

---

## File Locations

### Configuration
- Environment: `.env.production.complete`
- Kubernetes Config: `k8s/configmap.yaml`
- Secrets Template: `k8s/secrets.yaml.template`

### Deployment
- Docker Compose: `docker-compose.production.yml`
- Kubernetes Manifests: `k8s/*.yaml`
- Terraform: `terraform/*.tf`

### Scripts
- Backup: `deployment/scripts/backup-postgres.sh`
- Restore: `deployment/scripts/restore-postgres.sh`
- DR: `deployment/scripts/disaster-recovery.sh`
- SSL Renewal: `deployment/scripts/renew-ssl-certs.sh`

### Documentation
- DevOps Guide: `docs/DEVOPS_README.md`
- Deployment Runbook: `docs/DEPLOYMENT_RUNBOOK.md`
- Architecture Diagrams: `docs/INFRASTRUCTURE_DIAGRAM.md`
- Completion Report: `DEVOPS_COMPLETION_REPORT.md`

### Monitoring
- Prometheus Config: `monitoring/prometheus.yml`
- Alerts: `monitoring/alerts/*.yml`
- Grafana Dashboards: `monitoring/dashboards/*.json`

---

## Common Issues & Solutions

### Pods Not Starting
```bash
# Check pod details
kubectl describe pod <pod-name> -n ctafleet

# Check logs
kubectl logs <pod-name> -n ctafleet

# Check events
kubectl get events -n ctafleet --sort-by='.lastTimestamp'
```

### Database Connection Issues
```bash
# Test connectivity from API pod
kubectl exec -it <api-pod> -n ctafleet -- nc -zv postgres-service 5432

# Check credentials
kubectl get secret fleet-secrets -n ctafleet -o yaml
```

### SSL Certificate Issues
```bash
# Check certificate status
kubectl describe certificate fleet-tls -n ctafleet

# Force renewal
./deployment/scripts/renew-ssl-certs.sh

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

---

## Monitoring Dashboards

### Grafana
- URL: `https://grafana.ctafleet.com` (or port-forward to localhost:3001)
- Username: `admin`
- Password: (from secret)

### Prometheus
- URL: Port-forward to `localhost:9090`
- Targets: Check `/targets`
- Alerts: Check `/alerts`

### Kibana (if ELK enabled)
- URL: Port-forward to `localhost:5601`
- Index: `fleet-logs-*`

---

## Emergency Contacts

### Production Issues
- **DevOps Lead**: devops@ctafleet.com
- **On-Call**: +1-XXX-XXX-XXXX
- **Slack**: #fleet-incidents
- **PagerDuty**: [configure]

### Escalation
1. On-call engineer (15 min)
2. DevOps lead (30 min)
3. CTO (1 hour)
4. Activate DR (2 hours)

---

## Next Steps

1. ✅ Complete deployment checklist
2. ✅ Configure monitoring alerts
3. ✅ Set up backup notifications
4. ✅ Test disaster recovery
5. ✅ Train team on runbooks
6. ✅ Schedule DR drill

---

## Resources

- **Full Documentation**: `/docs/DEVOPS_README.md`
- **Runbook**: `/docs/DEPLOYMENT_RUNBOOK.md`
- **Architecture**: `/docs/INFRASTRUCTURE_DIAGRAM.md`
- **Complete Report**: `/DEVOPS_COMPLETION_REPORT.md`

---

**Need Help?**
- Check the comprehensive documentation in `/docs/`
- Contact DevOps team: devops@ctafleet.com
- Slack: #fleet-devops
