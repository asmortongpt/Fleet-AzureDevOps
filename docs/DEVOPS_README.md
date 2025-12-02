# CTAFleet - DevOps & Infrastructure Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Infrastructure Components](#infrastructure-components)
3. [Deployment Guide](#deployment-guide)
4. [Monitoring & Observability](#monitoring--observability)
5. [Backup & Disaster Recovery](#backup--disaster-recovery)
6. [Security](#security)
7. [Runbooks](#runbooks)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

CTAFleet is a cloud-native, multi-tenant fleet management system deployed on Azure Kubernetes Service (AKS) with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Front Door                          │
│                     (CDN + WAF + SSL/TLS)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    NGINX Ingress Controller                      │
│                 (Load Balancing + Routing)                       │
└───────────────────┬────────────────┬────────────────────────────┘
                    │                │
        ┌───────────┴──────┐    ┌───┴──────────┐
        │   Frontend (3+)  │    │   API (3+)   │
        │   Nginx + React  │    │  Node.js     │
        │   (HPA enabled)  │    │ (HPA enabled)│
        └──────────────────┘    └───┬──────────┘
                                    │
            ┌──────────────────┬────┴────┬──────────────────┐
            │                  │         │                  │
    ┌───────┴────────┐  ┌──────┴────┐ ┌─┴─────────────┐  ┌─┴───────────┐
    │  PostgreSQL    │  │  Redis    │ │ Test          │  │ RAG         │
    │  (HA + Backup) │  │  (HA)     │ │ Orchestrator  │  │ Indexer     │
    └────────────────┘  └───────────┘ └───────────────┘  └─────────────┘

    ┌────────────────────────────────────────────────────────────┐
    │            Monitoring & Observability Layer                │
    │  Prometheus | Grafana | ELK Stack | Application Insights  │
    └────────────────────────────────────────────────────────────┘
```

### Key Features

- **Multi-tenant Architecture**: Isolated tenant data with row-level security
- **High Availability**: Multi-zone deployment with automatic failover
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA) based on CPU/memory
- **Zero-downtime Deployments**: Rolling updates with health checks
- **Comprehensive Monitoring**: Prometheus, Grafana, and Application Insights
- **Automated Backups**: Daily encrypted backups to Azure Blob Storage
- **Disaster Recovery**: Geo-redundant backups and DR site ready

---

## Infrastructure Components

### Compute
- **Azure Kubernetes Service (AKS)**: Managed Kubernetes cluster
  - Node Pool: 3-10 nodes (auto-scaling)
  - VM Size: Standard_D4s_v3 (4 vCPU, 16 GB RAM)
  - Zones: 1, 2, 3 (high availability)

### Data Layer
- **PostgreSQL Flexible Server**: Primary database
  - SKU: GP_Standard_D4s_v3
  - Storage: 128 GB (expandable)
  - High Availability: Zone-redundant
  - Backup: 35-day retention, geo-redundant

- **Azure Cache for Redis**: In-memory cache
  - SKU: Premium P1
  - Capacity: 6 GB
  - High Availability: Zone-redundant
  - Persistence: Enabled

### Storage
- **Azure Blob Storage**: File storage and backups
  - Type: Standard GRS (Geo-Redundant)
  - Containers: fleet-files, database-backups
  - Versioning: Enabled
  - Soft Delete: 30 days

### Networking
- **Virtual Network**: 10.0.0.0/16
  - AKS Subnet: 10.0.1.0/24
  - Database Subnet: 10.0.2.0/24
  - App Gateway Subnet: 10.0.3.0/24

- **Azure Front Door**: Global load balancer, CDN, and WAF
- **NGINX Ingress Controller**: Kubernetes ingress

### Security
- **Azure Key Vault**: Secrets management
- **Azure AD**: Authentication and authorization
- **Network Security Groups**: Firewall rules
- **cert-manager**: Automated SSL/TLS certificates

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Elasticsearch + Logstash + Kibana**: Log aggregation
- **Application Insights**: APM and distributed tracing

---

## Deployment Guide

### Prerequisites

- Azure CLI installed and configured
- kubectl installed
- Terraform >= 1.5.0
- Docker installed
- Access to Azure subscription with Contributor role

### Quick Start (Production Deployment)

#### 1. Infrastructure Provisioning

```bash
# Clone the repository
git clone https://github.com/youraccount/Fleet.git
cd Fleet

# Initialize Terraform
cd terraform
terraform init

# Review the plan
terraform plan -var-file=terraform.tfvars

# Apply infrastructure
terraform apply -var-file=terraform.tfvars

# Save outputs
terraform output > ../deployment/terraform-outputs.txt
```

#### 2. Configure kubectl

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group ctafleet-production-rg \
  --name ctafleet-production-aks

# Verify connection
kubectl cluster-info
kubectl get nodes
```

#### 3. Install cert-manager

```bash
./deployment/scripts/install-cert-manager.sh
```

#### 4. Create Kubernetes secrets

```bash
# Copy template
cp k8s/secrets.yaml.template k8s/secrets.yaml

# Edit with your actual secrets
vim k8s/secrets.yaml

# Apply secrets
kubectl create secret generic fleet-secrets \
  --from-env-file=.env.production \
  -n ctafleet
```

#### 5. Deploy application

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMaps
kubectl apply -f k8s/configmap.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-deployment.yaml

# Deploy Redis
kubectl apply -f k8s/redis-deployment.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l component=postgres -n ctafleet --timeout=5m
kubectl wait --for=condition=ready pod -l component=redis -n ctafleet --timeout=5m

# Deploy API
kubectl apply -f k8s/api-deployment.yaml

# Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy Python services
kubectl apply -f k8s/python-services-deployment.yaml

# Deploy HPA
kubectl apply -f k8s/hpa.yaml

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml

# Deploy Pod Disruption Budgets
kubectl apply -f k8s/pdb.yaml

# Deploy Network Policies (optional)
kubectl apply -f k8s/network-policy.yaml
```

#### 6. Verify deployment

```bash
# Check all pods
kubectl get pods -n ctafleet

# Check services
kubectl get svc -n ctafleet

# Check ingress
kubectl get ingress -n ctafleet

# Check HPA status
kubectl get hpa -n ctafleet

# View logs
kubectl logs -f deployment/fleet-api -n ctafleet
```

#### 7. Configure DNS

Update your DNS provider to point your domain to the ingress IP:

```bash
# Get ingress IP
INGRESS_IP=$(kubectl get ingress fleet-ingress -n ctafleet -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Configure DNS A records:"
echo "fleet.ctafleet.com -> ${INGRESS_IP}"
echo "www.ctafleet.com -> ${INGRESS_IP}"
echo "api.ctafleet.com -> ${INGRESS_IP}"
```

#### 8. Verify SSL certificate

```bash
# Check certificate status
kubectl get certificate -n ctafleet

# Describe certificate
kubectl describe certificate fleet-tls -n ctafleet

# Test HTTPS
curl -I https://fleet.ctafleet.com
```

### Docker Compose (Local Development)

```bash
# Copy environment file
cp .env.example .env

# Edit with your values
vim .env

# Start services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Run with monitoring (full stack)
docker-compose -f docker-compose.production.yml --profile full-monitoring up -d

# Stop services
docker-compose -f docker-compose.production.yml down
```

---

## Monitoring & Observability

### Accessing Dashboards

#### Grafana
- URL: `http://localhost:3001` (port-forward) or `https://grafana.ctafleet.com`
- Default credentials: admin / (from secret)
- Dashboards:
  - CTAFleet System Overview
  - API Performance
  - Database Metrics
  - Infrastructure Health

#### Prometheus
- URL: `http://localhost:9090` (port-forward)
- Metrics endpoint: `/metrics`

#### Kibana (if ELK enabled)
- URL: `http://localhost:5601` (port-forward)
- Index pattern: `fleet-logs-*`

### Key Metrics

#### Application Metrics
- Request rate (requests/second)
- Error rate (%)
- Response time (p50, p95, p99)
- Active users
- Database query performance

#### Infrastructure Metrics
- CPU usage (%)
- Memory usage (%)
- Disk I/O
- Network throughput
- Pod status

### Alerting

Alerts are configured in Prometheus and sent via:
- Email (SendGrid)
- Slack webhooks
- Microsoft Teams
- Azure Monitor

Critical alerts:
- Service down (> 2 minutes)
- High error rate (> 5%)
- Database connection failures
- Disk space low (< 15%)
- Certificate expiration (< 30 days)

---

## Backup & Disaster Recovery

### Backup Strategy

#### Database Backups
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Encryption**: GPG encrypted
- **Storage**: Azure Blob Storage (GRS)
- **Verification**: Automated integrity checks

```bash
# Manual backup
./deployment/scripts/backup-postgres.sh

# Verify backups
az storage blob list \
  --account-name ctafleetproductionstorage \
  --container-name database-backups
```

#### Restore Procedures

```bash
# Restore from latest backup
./deployment/scripts/restore-postgres.sh latest

# Restore from specific backup
./deployment/scripts/restore-postgres.sh 20250115_120000

# Restore from local file
./deployment/scripts/restore-postgres.sh /path/to/backup.sql.gz.gpg
```

### Disaster Recovery

**RTO (Recovery Time Objective)**: 30 minutes
**RPO (Recovery Point Objective)**: 15 minutes

#### DR Procedures

```bash
# Check DR readiness
./deployment/scripts/disaster-recovery.sh status

# Test DR procedures (dry run)
./deployment/scripts/disaster-recovery.sh test --dry-run

# Perform DR failover
./deployment/scripts/disaster-recovery.sh failover

# Failback to primary site
./deployment/scripts/disaster-recovery.sh failback
```

---

## Security

### Security Best Practices

1. **Secrets Management**
   - All secrets stored in Azure Key Vault
   - Secrets rotated every 90 days
   - No secrets in code or configuration files

2. **Network Security**
   - Network policies enforce zero-trust
   - Private endpoints for Azure services
   - NSG rules restrict traffic

3. **Authentication & Authorization**
   - Azure AD integration
   - RBAC for Kubernetes resources
   - JWT tokens with short expiry

4. **Encryption**
   - TLS 1.2+ for all connections
   - Encrypted database connections
   - Encrypted backups

5. **Compliance**
   - Regular security scans (Trivy, CodeQL)
   - Dependency vulnerability checks
   - License compliance checks

### Security Scanning

```bash
# Run security scans
npm audit
docker scan fleet-frontend:latest

# Kubernetes security scan
kubesec scan k8s/*.yaml
```

---

## Runbooks

### Common Operations

#### Scale Deployments

```bash
# Scale API manually
kubectl scale deployment fleet-api --replicas=5 -n ctafleet

# Update HPA settings
kubectl edit hpa fleet-api-hpa -n ctafleet
```

#### Rolling Update

```bash
# Update image
kubectl set image deployment/fleet-api api=fleetappregistry.azurecr.io/fleet-api:v2.0.0 -n ctafleet

# Monitor rollout
kubectl rollout status deployment/fleet-api -n ctafleet

# Rollback if needed
kubectl rollout undo deployment/fleet-api -n ctafleet
```

#### SSL Certificate Renewal

```bash
# Check expiration
kubectl get certificate fleet-tls -n ctafleet

# Force renewal
./deployment/scripts/renew-ssl-certs.sh
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n ctafleet

# Check logs
kubectl logs <pod-name> -n ctafleet

# Check events
kubectl get events -n ctafleet --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -l component=postgres -n ctafleet

# Test connectivity
kubectl exec -it <api-pod> -n ctafleet -- nc -zv postgres-service 5432

# Check credentials
kubectl get secret fleet-secrets -n ctafleet -o yaml
```

### High CPU/Memory Usage

```bash
# Check resource usage
kubectl top pods -n ctafleet

# Check HPA status
kubectl get hpa -n ctafleet

# View detailed metrics
kubectl describe node <node-name>
```

### Certificate Issues

```bash
# Check certificate status
kubectl get certificate -n ctafleet

# Describe certificate
kubectl describe certificate fleet-tls -n ctafleet

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

---

## Support & Contact

For infrastructure issues:
- DevOps Team: devops@ctafleet.com
- On-call: +1-XXX-XXX-XXXX
- Slack: #fleet-devops

For urgent production issues:
- PagerDuty: <pagerduty-url>
- Incident Response: incidents@ctafleet.com
