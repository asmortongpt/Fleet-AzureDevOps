# Radio Fleet Dispatch - Infrastructure

This directory contains Infrastructure as Code (IaC) and deployment configurations for the Radio Fleet Dispatch platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Components](#infrastructure-components)
- [Quick Start](#quick-start)
- [Terraform Configuration](#terraform-configuration)
- [Helm Charts](#helm-charts)
- [CI/CD Pipelines](#cicd-pipelines)
- [Deployment Scripts](#deployment-scripts)
- [Security Considerations](#security-considerations)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)

## Overview

The infrastructure is designed for production-grade deployments on Azure Kubernetes Service (AKS) with:

- Multi-tier architecture (API, WebSocket, Workers, Frontend)
- Azure managed services for databases, caching, messaging, and storage
- Automated CI/CD with GitHub Actions
- Infrastructure as Code with Terraform
- Container orchestration with Kubernetes (Helm)
- Comprehensive monitoring and observability
- FedRAMP-aligned security controls

## Prerequisites

### Required Tools

- [Terraform](https://www.terraform.io/downloads) >= 1.5.0
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) >= 2.50.0
- [kubectl](https://kubernetes.io/docs/tasks/tools/) >= 1.28
- [Helm](https://helm.sh/docs/intro/install/) >= 3.13.0
- [Docker](https://docs.docker.com/get-docker/) >= 24.0.0

### Azure Subscription

- Active Azure subscription with Owner or Contributor role
- Sufficient quota for:
  - Virtual Machines (for AKS nodes)
  - Public IPs
  - Azure Database for PostgreSQL Flexible Server
  - Azure Cache for Redis

## Infrastructure Components

### Terraform Modules (`terraform/`)

The infrastructure is organized into logical modules:

1. **main.tf** - Resource Group, AKS cluster (2-node pool), Azure Container Registry
2. **postgres.tf** - Azure PostgreSQL Flexible Server with HA, backups
3. **redis.tf** - Azure Cache for Redis (Standard/Premium tier)
4. **messaging.tf** - Service Bus (topics, subscriptions), Event Hubs
5. **storage.tf** - Azure Storage Account with containers, lifecycle policies
6. **keyvault.tf** - Azure Key Vault with managed identities and secrets
7. **monitoring.tf** - Application Insights, Log Analytics, alerts
8. **networking.tf** - Virtual Network, subnets, NSGs, firewall rules

### Resources Provisioned

| Resource | Purpose | SKU/Tier |
|----------|---------|----------|
| AKS Cluster | Kubernetes orchestration | Standard (2 node pools) |
| ACR | Container image registry | Standard/Premium |
| PostgreSQL | Primary database | GP_Standard_D2ds_v4 |
| Redis Cache | Session & caching | Standard C1 / Premium P1 |
| Service Bus | Message queuing | Standard/Premium |
| Event Hub | Event streaming | Standard (2 TU) |
| Storage Account | Blob storage | Standard GRS |
| Key Vault | Secrets management | Standard |
| App Insights | Application monitoring | Standard |
| Log Analytics | Centralized logging | PerGB2018 |

## Quick Start

### 1. Bootstrap Infrastructure

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Run bootstrap script
cd /path/to/radio-fleet-dispatch
./scripts/bootstrap_aks.sh production
```

This script will:
- Initialize Terraform
- Plan and apply infrastructure
- Configure kubectl
- Install NGINX Ingress Controller
- Install Cert Manager with Let's Encrypt
- Install Azure Key Vault CSI Driver
- Create ACR image pull secrets

### 2. Deploy Application

```bash
# Deploy application to AKS
./scripts/deploy_aks.sh production v1.0.0
```

### 3. Seed Demo Data (Dev/Staging only)

```bash
# Seed database with demo data
./scripts/seed.sh dev
```

## Terraform Configuration

### Initialize Terraform

```bash
cd infra/terraform
terraform init
```

### Configure Variables

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   ```hcl
   environment     = "production"
   project_name    = "radio-fleet"
   location        = "eastus"

   # Network
   vnet_address_space = ["10.0.0.0/16"]

   # AKS
   aks_node_count     = 3
   aks_node_vm_size   = "Standard_D4s_v3"

   # Database
   postgres_sku_name = "GP_Standard_D4ds_v4"

   # Feature flags
   enable_private_endpoints = true
   enable_encryption_at_rest = true
   ```

### Apply Infrastructure

```bash
# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

### View Outputs

```bash
# View all outputs
terraform output

# View specific output
terraform output -raw aks_cluster_name
```

### Destroy Infrastructure

```bash
terraform destroy
```

## Helm Charts

### Chart Structure

```
infra/helm/radio-fleet/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── values.dev.yaml         # Development overrides
├── values.prod.yaml        # Production overrides
└── templates/
    ├── _helpers.tpl        # Template helpers
    ├── serviceaccount.yaml # Service account
    ├── configmap.yaml      # Configuration
    ├── secret.yaml         # Secrets (for non-prod)
    ├── api-deployment.yaml # API deployment
    ├── api-service.yaml    # API service
    ├── api-hpa.yaml        # API autoscaling
    ├── workers.yaml        # Worker deployments
    ├── websocket.yaml      # WebSocket service
    ├── frontend.yaml       # Frontend application
    ├── ingress.yaml        # Ingress controller
    └── networkpolicy.yaml  # Network policies
```

### Deploy with Helm

```bash
# Install chart
helm install radio-fleet ./infra/helm/radio-fleet \
  --namespace radio-fleet \
  --create-namespace \
  --values ./infra/helm/radio-fleet/values.prod.yaml

# Upgrade existing deployment
helm upgrade radio-fleet ./infra/helm/radio-fleet \
  --namespace radio-fleet \
  --values ./infra/helm/radio-fleet/values.prod.yaml \
  --wait

# Rollback to previous version
helm rollback radio-fleet -n radio-fleet
```

### Customizing Values

Create a custom values file:

```yaml
# custom-values.yaml
global:
  imageRegistry: myregistry.azurecr.io

api:
  replicaCount: 5
  resources:
    requests:
      cpu: 2000m
      memory: 4Gi

ingress:
  hosts:
    - host: fleet.mycompany.com
      paths:
        - path: /api
          service: api
          port: 8000
```

Apply with:

```bash
helm upgrade radio-fleet ./infra/helm/radio-fleet \
  --values custom-values.yaml
```

## CI/CD Pipelines

### GitHub Actions Workflows

Located in `.github/workflows/`:

#### CI Pipeline (`ci.yaml`)

Triggers on pull requests and pushes to `develop`:

- Lints Python code (ruff, black, isort)
- Lints TypeScript code (ESLint)
- Runs backend tests (pytest)
- Runs frontend tests (Jest)
- Builds Docker images
- Scans for security vulnerabilities (Trivy, Snyk)

#### CD Pipeline (`cd.yaml`)

Triggers on version tags (`v*.*.*`):

- Builds production Docker images
- Pushes to Azure Container Registry
- Deploys to staging (for RC tags)
- Deploys to production (for release tags)
- Runs smoke tests
- Sends notifications

### Required GitHub Secrets

Configure these secrets in your repository:

- `AZURE_CREDENTIALS` - Azure service principal credentials (JSON)
- `AZURE_TENANT_ID` - Azure Active Directory tenant ID
- `KEY_VAULT_NAME` - Name of Azure Key Vault
- `SNYK_TOKEN` - Snyk API token (optional)
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications (optional)

### Creating Azure Credentials

```bash
az ad sp create-for-rbac \
  --name "github-actions-radio-fleet" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

## Deployment Scripts

### bootstrap_aks.sh

Provisions infrastructure and configures AKS cluster.

**Usage:**
```bash
./scripts/bootstrap_aks.sh <environment>
```

**Example:**
```bash
./scripts/bootstrap_aks.sh production
```

**What it does:**
1. Checks prerequisites
2. Initializes and applies Terraform
3. Configures kubectl
4. Installs NGINX Ingress Controller
5. Installs Cert Manager
6. Installs Azure Key Vault CSI Driver
7. Creates ACR image pull secrets

### deploy_aks.sh

Deploys the application to AKS using Helm.

**Usage:**
```bash
./scripts/deploy_aks.sh <environment> [version]
```

**Example:**
```bash
./scripts/deploy_aks.sh production v1.0.0
```

**What it does:**
1. Retrieves Terraform outputs
2. Configures kubectl
3. Validates Helm chart
4. Optionally builds and pushes Docker images
5. Deploys with Helm
6. Waits for rollout completion
7. Runs smoke tests

### seed.sh

Seeds the database with demo data.

**Usage:**
```bash
./scripts/seed.sh <environment>
```

**Example:**
```bash
./scripts/seed.sh dev
```

**Note:** Only works in dev/staging environments.

## Security Considerations

### Network Security

- **Virtual Network**: Isolated VNet with subnets for AKS, data services, and private endpoints
- **Network Security Groups**: Restrictive ingress/egress rules
- **Network Policies**: Kubernetes NetworkPolicy for pod-to-pod communication
- **Private Endpoints**: Optional for all Azure services (production recommended)

### Identity & Access

- **Managed Identities**: System-assigned identities for AKS and services
- **RBAC**: Azure AD integration for AKS with role-based access
- **Key Vault**: Centralized secrets management with CSI driver
- **ACR Integration**: Seamless image pull with managed identity

### Data Protection

- **Encryption at Rest**: All storage services encrypted
- **Encryption in Transit**: TLS 1.2+ enforced everywhere
- **Database Backups**: Automated with geo-redundant storage
- **Soft Delete**: Enabled on Key Vault and Storage

### Monitoring & Compliance

- **Application Insights**: Application performance monitoring
- **Log Analytics**: Centralized log aggregation
- **Azure Monitor**: Metrics and alerts
- **Audit Logs**: Retained for 7 years (FedRAMP requirement)

## Cost Optimization

### Development Environment

Use `values.dev.yaml` with reduced resources:

```yaml
api:
  replicaCount: 1
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
  autoscaling:
    enabled: false
```

### Production Optimizations

1. **Reserved Instances**: Purchase 1-3 year reservations for predictable workloads
2. **Auto-scaling**: Configure HPA for dynamic scaling based on load
3. **Storage Lifecycle**: Automatic tiering to Cool/Archive tiers
4. **Right-sizing**: Monitor and adjust VM SKUs based on actual usage
5. **Spot Instances**: Use for non-critical worker nodes

### Cost Monitoring

```bash
# View cost analysis
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-01-31

# Set budget alerts in Azure Portal
```

## Troubleshooting

### Common Issues

#### Terraform Apply Fails

**Issue**: Resource already exists
```
Error: A resource with the ID already exists
```

**Solution**: Import existing resource or destroy and recreate
```bash
terraform import azurerm_resource_group.main /subscriptions/.../resourceGroups/...
```

#### AKS Nodes Not Ready

**Issue**: Nodes stuck in NotReady state

**Solution**: Check node logs and events
```bash
kubectl get nodes
kubectl describe node <node-name>
```

#### Pod CrashLoopBackOff

**Issue**: Pod keeps restarting

**Solution**: Check pod logs and events
```bash
kubectl logs -f <pod-name> -n radio-fleet
kubectl describe pod <pod-name> -n radio-fleet
```

#### Ingress Not Working

**Issue**: Cannot access application via ingress

**Solution**: Check ingress controller and DNS
```bash
kubectl get svc -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

#### Database Connection Failed

**Issue**: Application cannot connect to PostgreSQL

**Solution**: Check firewall rules and connection string
```bash
az postgres flexible-server firewall-rule list \
  --resource-group <rg> \
  --name <server-name>
```

### Useful Commands

```bash
# Get AKS credentials
az aks get-credentials --resource-group <rg> --name <cluster>

# View all pods
kubectl get pods -A

# View logs for specific service
kubectl logs -f deployment/radio-fleet-api -n radio-fleet

# Execute command in pod
kubectl exec -it <pod-name> -n radio-fleet -- /bin/bash

# Port forward to service
kubectl port-forward svc/radio-fleet-api 8000:8000 -n radio-fleet

# View Helm releases
helm list -n radio-fleet

# View Helm values
helm get values radio-fleet -n radio-fleet

# Restart deployment
kubectl rollout restart deployment/radio-fleet-api -n radio-fleet
```

## Support

For issues and questions:

- Create an issue in the GitHub repository
- Contact the platform team
- Review documentation at `/docs`

## License

Copyright (c) 2024. All rights reserved.
