# Azure Kubernetes Service (AKS) Deployment Guide

## Complete deployment guide for Fleet Management Platform on Azure

---

## Prerequisites

### Required Tools
- Azure CLI (`az`) version 2.50+
- kubectl version 1.27+
- Helm 3.12+
- Docker 24+
- jq (for JSON processing)

### Azure Resources Required
- Azure subscription with sufficient quota
- Resource group
- Azure Container Registry (ACR)
- Azure Kubernetes Service (AKS)
- Azure Database for PostgreSQL (optional, or use in-cluster)
- Azure Cache for Redis (optional, or use in-cluster)
- Azure Key Vault (recommended)
- Azure Application Gateway (for ingress)
- Azure Storage Account

---

## Step 1: Azure Resource Setup

### 1.1 Set Environment Variables

```bash
# Configuration
export RESOURCE_GROUP="fleet-management-rg"
export LOCATION="eastus"
export AKS_CLUSTER_NAME="fleet-aks-cluster"
export ACR_NAME="fleetregistry"
export KEYVAULT_NAME="fleet-keyvault"
export POSTGRES_SERVER="fleet-postgres-server"
export REDIS_CACHE="fleet-redis-cache"
export STORAGE_ACCOUNT="fleetmanagementstorage"
export APP_GATEWAY_NAME="fleet-appgw"

# Kubernetes
export K8S_VERSION="1.27"
export NODE_COUNT=3
export NODE_VM_SIZE="Standard_D4s_v3"
```

### 1.2 Create Resource Group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 1.3 Create Azure Container Registry

```bash
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Premium \
  --location $LOCATION

# Enable admin user (for development, use service principal in production)
az acr update \
  --name $ACR_NAME \
  --admin-enabled true

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
```

### 1.4 Create AKS Cluster

```bash
# Create AKS with Azure CNI networking
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --location $LOCATION \
  --kubernetes-version $K8S_VERSION \
  --node-count $NODE_COUNT \
  --node-vm-size $NODE_VM_SIZE \
  --network-plugin azure \
  --enable-managed-identity \
  --enable-addons monitoring \
  --attach-acr $ACR_NAME \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 20 \
  --max-pods 110 \
  --zones 1 2 3 \
  --generate-ssh-keys

# Get AKS credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --overwrite-existing
```

### 1.5 Create Azure Key Vault

```bash
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false

# Get Key Vault ID
KEYVAULT_ID=$(az keyvault show --name $KEYVAULT_NAME --query id --output tsv)

# Grant AKS access to Key Vault
AKS_IDENTITY=$(az aks show --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER_NAME --query identityProfile.kubeletidentity.clientId --output tsv)
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $AKS_IDENTITY \
  --secret-permissions get list
```

### 1.6 Create Azure Database for PostgreSQL (Optional)

```bash
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --location $LOCATION \
  --admin-user fleetadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_D4s_v3 \
  --tier GeneralPurpose \
  --version 15 \
  --storage-size 128 \
  --high-availability ZoneRedundant \
  --backup-retention 30

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $POSTGRES_SERVER \
  --database-name fleetdb

# Configure firewall to allow AKS
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $POSTGRES_SERVER \
  --rule-name AllowAKS \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

### 1.7 Create Azure Cache for Redis (Optional)

```bash
az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_CACHE \
  --location $LOCATION \
  --sku Premium \
  --vm-size P1 \
  --enable-non-ssl-port false \
  --redis-version 6
```

### 1.8 Create Azure Storage Account

```bash
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_ZRS \
  --kind StorageV2 \
  --access-tier Hot

# Create container for file uploads
az storage container create \
  --name fleet-uploads \
  --account-name $STORAGE_ACCOUNT \
  --public-access off

# Get connection string
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query connectionString --output tsv)
```

---

## Step 2: Build and Push Container Image

### 2.1 Login to ACR

```bash
az acr login --name $ACR_NAME
```

### 2.2 Build Docker Image

```bash
# From the project root directory
docker build -t $ACR_LOGIN_SERVER/fleet-app:latest .
docker build -t $ACR_LOGIN_SERVER/fleet-app:v1.0.0 .
```

### 2.3 Push Image to ACR

```bash
docker push $ACR_LOGIN_SERVER/fleet-app:latest
docker push $ACR_LOGIN_SERVER/fleet-app:v1.0.0
```

---

## Step 3: Configure Kubernetes Secrets

### 3.1 Store Secrets in Azure Key Vault

```bash
# Database credentials
az keyvault secret set --vault-name $KEYVAULT_NAME --name db-password --value "YourSecurePassword123!"

# JWT secrets
az keyvault secret set --vault-name $KEYVAULT_NAME --name jwt-secret --value "$(openssl rand -base64 32)"

# Encryption key
az keyvault secret set --vault-name $KEYVAULT_NAME --name encryption-key --value "$(openssl rand -base64 32)"

# Smartcar API
az keyvault secret set --vault-name $KEYVAULT_NAME --name smartcar-client-secret --value "YOUR_SMARTCAR_SECRET"

# Microsoft Graph
az keyvault secret set --vault-name $KEYVAULT_NAME --name ms-graph-client-secret --value "YOUR_MS_SECRET"
```

### 3.2 Install Secrets Store CSI Driver

```bash
# Add Azure Key Vault provider
helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
helm repo update

# Install
helm install csi csi-secrets-store-provider-azure/csi-secrets-store-provider-azure \
  --namespace kube-system \
  --set secrets-store-csi-driver.syncSecret.enabled=true
```

---

## Step 4: Deploy Application to AKS

### 4.1 Create Namespace

```bash
kubectl apply -f deployment/kubernetes/namespace.yaml
```

### 4.2 Update ConfigMap with Customer Modules

Edit `deployment/kubernetes/configmap.yaml` to enable/disable modules based on customer:

```yaml
data:
  modules.json: |
    {
      "enabledModules": {
        "core": true,
        "gis-mapping": true,    # Set to false to disable
        "advanced-routing": true,
        "telematics": false,     # Disabled for this customer
        ...
      }
    }
```

### 4.3 Apply Kubernetes Configurations

```bash
# ConfigMaps
kubectl apply -f deployment/kubernetes/configmap.yaml

# Secrets (update with real values first!)
kubectl apply -f deployment/kubernetes/secrets.yaml

# Database (if using in-cluster PostgreSQL)
kubectl apply -f deployment/kubernetes/postgres.yaml

# Redis (if using in-cluster Redis)
kubectl apply -f deployment/kubernetes/redis.yaml

# Application deployment
kubectl apply -f deployment/kubernetes/deployment.yaml

# Services
kubectl apply -f deployment/kubernetes/service.yaml

# Ingress
kubectl apply -f deployment/kubernetes/ingress.yaml
```

### 4.4 Verify Deployment

```bash
# Check pods
kubectl get pods -n fleet-management

# Check services
kubectl get svc -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management

# View logs
kubectl logs -f deployment/fleet-app -n fleet-management

# Describe pod for troubleshooting
kubectl describe pod <pod-name> -n fleet-management
```

---

## Step 5: Configure Application Gateway Ingress Controller

### 5.1 Create Application Gateway

```bash
# Create public IP
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name fleet-appgw-pip \
  --allocation-method Static \
  --sku Standard

# Create virtual network for App Gateway
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name fleet-vnet \
  --address-prefixes 10.0.0.0/16 \
  --subnet-name appgw-subnet \
  --subnet-prefixes 10.0.1.0/24

# Create Application Gateway
az network application-gateway create \
  --name $APP_GATEWAY_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku WAF_v2 \
  --capacity 2 \
  --vnet-name fleet-vnet \
  --subnet appgw-subnet \
  --public-ip-address fleet-appgw-pip \
  --priority 100
```

### 5.2 Install AGIC (Application Gateway Ingress Controller)

```bash
# Add Helm repository
helm repo add application-gateway-kubernetes-ingress https://appgwingress.blob.core.windows.net/ingress-azure-helm-package/
helm repo update

# Get Application Gateway details
APP_GATEWAY_ID=$(az network application-gateway show --name $APP_GATEWAY_NAME --resource-group $RESOURCE_GROUP --query id --output tsv)

# Install AGIC
helm install ingress-azure \
  application-gateway-kubernetes-ingress/ingress-azure \
  --namespace fleet-management \
  --set appgw.subscriptionId=$(az account show --query id --output tsv) \
  --set appgw.resourceGroup=$RESOURCE_GROUP \
  --set appgw.name=$APP_GATEWAY_NAME \
  --set appgw.shared=false \
  --set armAuth.type=aadPodIdentity \
  --set rbac.enabled=true
```

---

## Step 6: Configure SSL/TLS Certificates

### 6.1 Install cert-manager

```bash
# Add Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

### 6.2 Apply Certificate Configuration

Update email in `deployment/kubernetes/ingress.yaml`, then:

```bash
kubectl apply -f deployment/kubernetes/ingress.yaml
```

---

## Step 7: Configure Monitoring

### 7.1 Enable Azure Monitor for Containers

```bash
az aks enable-addons \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --addons monitoring
```

### 7.2 Install Prometheus and Grafana (Optional)

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.service.type=LoadBalancer \
  --set grafana.service.type=LoadBalancer
```

---

## Step 8: Module-Based Deployment

### 8.1 Configure Customer Modules

Create customer-specific configuration file:

```bash
cat > customer-config.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: customer-modules
  namespace: fleet-management
data:
  customer-id: "CUST-001"
  subscription-tier: "enterprise"
  enabled-modules: |
    core
    gis-mapping
    advanced-routing
    maintenance
    procurement
    analytics
EOF

kubectl apply -f customer-config.yaml
```

### 8.2 Deploy with Module Selection

The application reads module configuration from ConfigMap and dynamically enables/disables features.

---

## Step 9: Post-Deployment Configuration

### 9.1 Configure DNS

```bash
# Get Application Gateway public IP
PUBLIC_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name fleet-appgw-pip \
  --query ipAddress \
  --output tsv)

echo "Configure your DNS to point to: $PUBLIC_IP"
```

### 9.2 Initialize Database

```bash
# Port-forward to database
kubectl port-forward -n fleet-management svc/fleet-postgres-service 5432:5432

# Run migrations (from another terminal)
psql -h localhost -U fleetadmin -d fleetdb -f database/migrations/init.sql
```

### 9.3 Create Initial Admin User

```bash
# Exec into a pod
kubectl exec -it -n fleet-management deployment/fleet-app -- /bin/sh

# Run admin creation script
node scripts/create-admin.js
```

---

## Step 10: Scaling and High Availability

### 10.1 Configure Horizontal Pod Autoscaler

Already configured in `deployment.yaml`. Verify:

```bash
kubectl get hpa -n fleet-management
```

### 10.2 Configure Cluster Autoscaler

```bash
az aks update \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 20
```

### 10.3 Configure Pod Disruption Budget

Already included in `deployment.yaml`.

---

## Step 11: Backup and Disaster Recovery

### 11.1 Configure Azure Backup for AKS

```bash
# Create Recovery Services Vault
az backup vault create \
  --resource-group $RESOURCE_GROUP \
  --name fleet-backup-vault \
  --location $LOCATION

# Enable backup for AKS
az aks backup enable \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --vault-name fleet-backup-vault
```

### 11.2 Configure Database Backups

PostgreSQL Flexible Server includes automated backups (30-day retention already configured).

---

## Step 12: Security Hardening

### 12.1 Enable Azure Policy for AKS

```bash
az aks enable-addons \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --addons azure-policy
```

### 12.2 Enable Pod Security Standards

```bash
kubectl label namespace fleet-management \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### 12.3 Enable Network Policies

```bash
# Install Calico for network policies
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/calico.yaml
```

---

## Maintenance and Operations

### Update Application

```bash
# Build new image
docker build -t $ACR_LOGIN_SERVER/fleet-app:v1.0.1 .
docker push $ACR_LOGIN_SERVER/fleet-app:v1.0.1

# Update deployment
kubectl set image deployment/fleet-app \
  fleet-app=$ACR_LOGIN_SERVER/fleet-app:v1.0.1 \
  -n fleet-management

# Monitor rollout
kubectl rollout status deployment/fleet-app -n fleet-management
```

### Rollback Deployment

```bash
kubectl rollout undo deployment/fleet-app -n fleet-management
```

### Scale Manually

```bash
kubectl scale deployment fleet-app --replicas=5 -n fleet-management
```

### View Logs

```bash
# All pods
kubectl logs -l app=fleet-app -n fleet-management --tail=100 -f

# Specific pod
kubectl logs <pod-name> -n fleet-management -f
```

### Troubleshooting

```bash
# Check events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'

# Describe resources
kubectl describe deployment fleet-app -n fleet-management
kubectl describe pod <pod-name> -n fleet-management

# Get shell in pod
kubectl exec -it <pod-name> -n fleet-management -- /bin/sh

# Check resource usage
kubectl top pods -n fleet-management
kubectl top nodes
```

---

## Cost Optimization

### 1. Use Azure Reservations
- Reserve compute capacity for 1-3 years for 40-60% savings

### 2. Right-size Resources
```bash
# Analyze resource usage
kubectl top pods -n fleet-management
kubectl top nodes

# Adjust resource requests/limits in deployment.yaml
```

### 3. Use Spot Instances for Non-Critical Workloads
```bash
az aks nodepool add \
  --resource-group $RESOURCE_GROUP \
  --cluster-name $AKS_CLUSTER_NAME \
  --name spotpool \
  --priority Spot \
  --eviction-policy Delete \
  --spot-max-price -1 \
  --enable-cluster-autoscaler \
  --min-count 0 \
  --max-count 10 \
  --node-vm-size Standard_D4s_v3
```

### 4. Use Azure Hybrid Benefit
If you have Windows Server licenses, use Azure Hybrid Benefit for savings.

---

## Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] DNS records pointing to Application Gateway
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery tested
- [ ] Security scanning enabled
- [ ] Network policies applied
- [ ] Pod disruption budgets configured
- [ ] Resource quotas set
- [ ] Autoscaling tested
- [ ] Load testing completed
- [ ] Runbooks documented
- [ ] On-call rotation established
- [ ] Customer module configuration validated
- [ ] Database migrations tested
- [ ] Initial admin user created

---

## Support and Contact

For issues or questions:
- Technical Support: support@fleet.example.com
- Documentation: https://docs.fleet.example.com
- Status Page: https://status.fleet.example.com

---

## Additional Resources

- [Azure AKS Documentation](https://docs.microsoft.com/azure/aks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Application Gateway Ingress Controller](https://azure.github.io/application-gateway-kubernetes-ingress/)
- [Azure Key Vault Provider for Secrets Store CSI Driver](https://azure.github.io/secrets-store-csi-driver-provider-azure/)
