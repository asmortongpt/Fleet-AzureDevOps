# Manual Steps Required for Kubernetes Deployment

This document lists all manual steps that must be completed before and after deployment.

## Pre-Deployment Steps

### 1. Install Prerequisites

#### Install cert-manager
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s
```

#### Install Nginx Ingress Controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=controller -n ingress-nginx --timeout=300s
```

### 2. Create Azure Container Registry Secret

You need ACR credentials from Azure Portal:

**Option A: Using ACR Admin Credentials**
```bash
# Get credentials from Azure Portal:
# 1. Navigate to Azure Container Registry (fleetappregistry)
# 2. Settings > Access keys
# 3. Enable "Admin user"
# 4. Copy username and password

kubectl create secret docker-registry acr-secret \
  --namespace=fleet-management \
  --docker-server=fleetappregistry.azurecr.io \
  --docker-username=<admin-username> \
  --docker-password=<admin-password>
```

**Option B: Using Azure Service Principal (Recommended)**
```bash
# Create service principal in Azure
az ad sp create-for-rbac \
  --name fleet-acr-sp \
  --role acrpull \
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.ContainerRegistry/registries/fleetappregistry

# Use the output to create secret
kubectl create secret docker-registry acr-secret \
  --namespace=fleet-management \
  --docker-server=fleetappregistry.azurecr.io \
  --docker-username=<service-principal-id> \
  --docker-password=<service-principal-password>
```

**Option C: Using Azure AD Workload Identity (Most Secure)**
```bash
# Follow Azure documentation for setting up workload identity
# https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview
```

### 3. Update Secrets (if needed)

If you need to use different Azure AD credentials than the defaults:

```bash
# Encode your values
echo -n 'your-client-id' | base64
echo -n 'your-tenant-id' | base64

# Edit the secret file with your values
nano kubernetes/40-secret.yaml
```

### 4. Configure DNS (Before Deployment)

**Option A: Pre-configure DNS**
```bash
# Get the ingress controller's external IP first
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Create DNS A record at your DNS provider:
# Name: fleet.capitaltechalliance.com
# Type: A
# Value: <external-ip>
# TTL: 300
```

**Option B: Configure DNS after deployment**
- Deploy first, then get the ingress IP
- Configure DNS pointing to that IP
- Wait for DNS propagation (5-30 minutes)

## Post-Deployment Steps

### 1. Verify DNS Resolution

```bash
# Check DNS resolution
nslookup fleet.capitaltechalliance.com

# Or use dig
dig fleet.capitaltechalliance.com +short
```

### 2. Check TLS Certificate Status

```bash
# Check certificate resource
kubectl describe certificate fleet-frontend-tls -n fleet-management

# Check cert-manager logs if certificate is not issuing
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate renewal
kubectl get certificate -n fleet-management
```

### 3. Verify Application Health

```bash
# Check all pods are running
kubectl get pods -n fleet-management

# Check deployment status
kubectl get deployment fleet-frontend -n fleet-management

# Test health endpoint
kubectl run test-pod --rm -i --tty --image=curlimages/curl -- \
  curl http://fleet-frontend.fleet-management.svc.cluster.local/health
```

### 4. Test External Access

```bash
# Test HTTP redirect to HTTPS
curl -I http://fleet.capitaltechalliance.com

# Test HTTPS access
curl -I https://fleet.capitaltechalliance.com

# Full test with verbose output
curl -v https://fleet.capitaltechalliance.com
```

### 5. Configure Monitoring (Optional but Recommended)

#### Install Prometheus and Grafana
```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open http://localhost:3000 (admin/prom-operator)
```

#### Create Fleet Dashboard
- Import Grafana dashboard for Kubernetes deployments
- Configure alerts for pod failures, high CPU/memory usage
- Set up notification channels (email, Slack, etc.)

### 6. Configure Logging (Optional but Recommended)

#### Option A: Azure Monitor (for AKS)
```bash
# Enable Azure Monitor for containers
az aks enable-addons \
  --resource-group <resource-group> \
  --name <cluster-name> \
  --addons monitoring
```

#### Option B: ELK Stack
```bash
# Install Elasticsearch, Logstash, Kibana
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
helm install kibana elastic/kibana -n logging
helm install filebeat elastic/filebeat -n logging
```

### 7. Setup Backup Strategy

```bash
# Install Velero for cluster backups
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm install velero vmware-tanzu/velero \
  --namespace velero \
  --create-namespace \
  --set configuration.provider=azure \
  --set configuration.backupStorageLocation.bucket=fleet-backups \
  --set configuration.backupStorageLocation.config.resourceGroup=<resource-group> \
  --set configuration.backupStorageLocation.config.storageAccount=<storage-account>

# Create backup schedule
kubectl apply -f - <<EOF
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: fleet-daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
    - fleet-management
    ttl: 720h0m0s
EOF
```

## Troubleshooting Common Issues

### Issue 1: Pods Can't Pull Image

**Symptoms**: ImagePullBackOff error

**Solution**:
```bash
# Verify ACR secret exists
kubectl get secret acr-secret -n fleet-management

# Check secret details
kubectl describe secret acr-secret -n fleet-management

# Test ACR connectivity
kubectl run test-acr --rm -i --tty --image=fleetappregistry.azurecr.io/fleet-frontend:v3.0-production-rebuild -- /bin/sh
```

### Issue 2: Certificate Not Issuing

**Symptoms**: TLS certificate shows "Not Ready"

**Solution**:
```bash
# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate details
kubectl describe certificate fleet-frontend-tls -n fleet-management

# Check challenge status
kubectl get challenges -n fleet-management

# Delete and recreate certificate
kubectl delete certificate fleet-frontend-tls -n fleet-management
kubectl delete secret fleet-frontend-tls -n fleet-management
kubectl apply -f kubernetes/50-ingress.yaml
```

### Issue 3: Ingress Not Routing Traffic

**Symptoms**: 404 errors or no response

**Solution**:
```bash
# Check ingress status
kubectl describe ingress fleet-frontend-ingress -n fleet-management

# Check nginx ingress logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify service endpoints
kubectl get endpoints -n fleet-management fleet-frontend

# Test service directly
kubectl port-forward -n fleet-management svc/fleet-frontend 8080:80
# Then access http://localhost:8080
```

### Issue 4: High Memory/CPU Usage

**Symptoms**: Pods restarting, OOMKilled errors

**Solution**:
```bash
# Check resource usage
kubectl top pods -n fleet-management

# Increase resource limits in deployment
kubectl edit deployment fleet-frontend -n fleet-management
# Update resources.limits.memory and cpu

# Check if HPA is scaling
kubectl get hpa -n fleet-management
```

## Security Hardening Checklist

- [ ] ACR credentials stored securely (not in git)
- [ ] Azure AD client secret rotated regularly (every 90 days)
- [ ] Network policies tested and verified
- [ ] Pod security policies enforced
- [ ] RBAC roles configured with least privilege
- [ ] TLS certificates auto-renewing
- [ ] Security headers configured in ingress
- [ ] Container images scanned for vulnerabilities
- [ ] Secrets encrypted at rest (Azure Key Vault integration)
- [ ] Audit logging enabled
- [ ] DDoS protection configured (Azure DDoS Standard)
- [ ] WAF enabled (Web Application Firewall)

## Performance Tuning Checklist

- [ ] HPA configured and tested
- [ ] Resource limits tuned based on actual usage
- [ ] PDB configured to prevent mass pod disruption
- [ ] Ingress connection pooling configured
- [ ] CDN configured for static assets
- [ ] Database connection pooling enabled
- [ ] Redis cache configured
- [ ] Load testing performed
- [ ] Horizontal scaling tested

## Compliance Checklist

- [ ] Data encryption in transit (TLS 1.2+)
- [ ] Data encryption at rest
- [ ] Audit logs retained for 90 days
- [ ] Access control documented
- [ ] Disaster recovery plan tested
- [ ] Backup restoration tested
- [ ] Incident response plan documented
- [ ] Security scanning automated

## Contact Information

For assistance with manual steps:
- **Technical Lead**: andrew.m@capitaltechalliance.com
- **Azure Support**: Use Azure Portal for support tickets
- **Emergency**: Follow runbook in /docs/runbook.md

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Nginx Ingress Documentation](https://kubernetes.github.io/ingress-nginx/)
- [Azure AKS Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/)
