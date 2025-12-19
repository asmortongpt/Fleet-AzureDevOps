# Fleet Management System - Kubernetes Deployment

This directory contains production-ready Kubernetes manifests for deploying the Fleet Management System.

## Architecture Overview

The deployment includes:
- **Frontend**: React/Vite application with 3 replicas (auto-scaling 3-10)
- **Azure AD Integration**: Enterprise authentication with Microsoft Azure AD
- **TLS/SSL**: Automatic certificate management via cert-manager
- **Security**: Network policies, pod security contexts, and RBAC
- **High Availability**: Pod disruption budgets and horizontal autoscaling

## Prerequisites

Before deploying, ensure you have:

1. **Kubernetes Cluster** (v1.24+)
   - Azure Kubernetes Service (AKS)
   - Google Kubernetes Engine (GKE)
   - Amazon EKS
   - Or any other Kubernetes cluster

2. **kubectl** installed and configured
   ```bash
   kubectl version --client
   ```

3. **cert-manager** installed (for automatic TLS)
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

4. **Nginx Ingress Controller** installed
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```

5. **Azure Container Registry (ACR) credentials**
   - Registry: `fleetappregistry.azurecr.io`
   - Username and password from Azure Portal

## Quick Start

### 1. Create ACR Image Pull Secret

```bash
kubectl create secret docker-registry acr-secret \
  --namespace=fleet-management \
  --docker-server=fleetappregistry.azurecr.io \
  --docker-username=<your-acr-username> \
  --docker-password=<your-acr-password>
```

Or use Azure AD service principal:

```bash
kubectl create secret docker-registry acr-secret \
  --namespace=fleet-management \
  --docker-server=fleetappregistry.azurecr.io \
  --docker-username=<service-principal-id> \
  --docker-password=<service-principal-password>
```

### 2. Deploy Using Script

```bash
cd kubernetes
chmod +x deploy.sh
./deploy.sh
```

### 3. Deploy Manually (Step by Step)

```bash
# Create namespace
kubectl apply -f 00-namespace.yaml

# Apply configurations
kubectl apply -f 30-configmap.yaml
kubectl apply -f 40-secret.yaml

# Deploy cert-manager issuer
kubectl apply -f 90-cert-manager-issuer.yaml

# Deploy application
kubectl apply -f 10-frontend-deployment.yaml
kubectl apply -f 20-frontend-service.yaml

# Apply policies
kubectl apply -f 60-network-policy.yaml
kubectl apply -f 70-horizontal-pod-autoscaler.yaml
kubectl apply -f 80-pod-disruption-budget.yaml

# Create ingress
kubectl apply -f 50-ingress.yaml
```

## Manifest Files

| File | Description |
|------|-------------|
| `00-namespace.yaml` | Creates the `fleet-management` namespace |
| `10-frontend-deployment.yaml` | Frontend deployment with 3 replicas |
| `20-frontend-service.yaml` | ClusterIP service exposing port 80 |
| `30-configmap.yaml` | Non-sensitive configuration (API URLs, etc.) |
| `40-secret.yaml` | Sensitive data (Azure AD credentials) |
| `50-ingress.yaml` | Nginx ingress with TLS and security headers |
| `60-network-policy.yaml` | Network security policies |
| `70-horizontal-pod-autoscaler.yaml` | Auto-scaling based on CPU/memory |
| `80-pod-disruption-budget.yaml` | Ensures high availability during updates |
| `90-cert-manager-issuer.yaml` | Let's Encrypt certificate issuer |

## Configuration

### Environment Variables (ConfigMap)

Edit `30-configmap.yaml` to customize:
- `VITE_API_URL`: Backend API endpoint
- `VITE_AZURE_AD_REDIRECT_URI`: OAuth redirect URI
- `VITE_APP_URL`: Application base URL

### Secrets (Secret)

Edit `40-secret.yaml` to update:
- `VITE_AZURE_AD_CLIENT_ID`: Azure AD application ID
- `VITE_AZURE_AD_TENANT_ID`: Azure AD tenant ID

**Note**: Values must be base64 encoded:
```bash
echo -n 'your-value' | base64
```

## Security Features

### Pod Security
- Runs as non-root user (UID 1000)
- Read-only root filesystem
- Drops all Linux capabilities
- Seccomp profile enabled

### Network Security
- Network policies restrict ingress/egress traffic
- Only allows traffic from nginx ingress controller
- Blocks unnecessary pod-to-pod communication

### TLS/SSL
- Automatic certificate provisioning via Let's Encrypt
- Force HTTPS redirect
- TLS 1.2+ only

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Content-Security-Policy
- Strict-Transport-Security

## Monitoring & Operations

### Check Deployment Status

```bash
# View all resources
kubectl get all -n fleet-management

# Check pod status
kubectl get pods -n fleet-management -l app=fleet-frontend

# View logs
kubectl logs -f deployment/fleet-frontend -n fleet-management

# Check HPA status
kubectl get hpa -n fleet-management

# View ingress details
kubectl describe ingress fleet-frontend-ingress -n fleet-management
```

### Scaling

#### Manual Scaling
```bash
kubectl scale deployment fleet-frontend -n fleet-management --replicas=5
```

#### Auto-Scaling Configuration
Edit `70-horizontal-pod-autoscaler.yaml`:
- Min replicas: 3
- Max replicas: 10
- CPU target: 70%
- Memory target: 80%

### Rolling Updates

```bash
# Update image
kubectl set image deployment/fleet-frontend \
  fleet-frontend=fleetappregistry.azurecr.io/fleet-frontend:v3.1-production \
  -n fleet-management

# Check rollout status
kubectl rollout status deployment/fleet-frontend -n fleet-management

# Rollback if needed
kubectl rollout undo deployment/fleet-frontend -n fleet-management
```

### Health Checks

The deployment includes:
- **Readiness Probe**: HTTP GET `/health` (starts after 10s, checks every 10s)
- **Liveness Probe**: HTTP GET `/health` (starts after 30s, checks every 15s)

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n fleet-management

# Check logs
kubectl logs <pod-name> -n fleet-management

# Check if image can be pulled
kubectl get events -n fleet-management | grep -i pull
```

### Certificate Issues

```bash
# Check certificate status
kubectl describe certificate fleet-frontend-tls -n fleet-management

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Force certificate renewal
kubectl delete certificate fleet-frontend-tls -n fleet-management
kubectl apply -f 50-ingress.yaml
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress fleet-frontend-ingress -n fleet-management

# Check nginx ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify DNS points to ingress IP
kubectl get ingress -n fleet-management
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n fleet-management

# Check HPA metrics
kubectl get hpa -n fleet-management

# View resource limits
kubectl describe deployment fleet-frontend -n fleet-management
```

## DNS Configuration

After deployment, configure DNS:

1. Get the ingress external IP:
   ```bash
   kubectl get ingress -n fleet-management
   ```

2. Create DNS A record:
   - Name: `fleet.capitaltechalliance.com`
   - Type: `A`
   - Value: `<ingress-external-ip>`

3. Wait for DNS propagation (5-30 minutes)

4. Verify:
   ```bash
   nslookup fleet.capitaltechalliance.com
   ```

## Production Checklist

Before going to production:

- [ ] ACR credentials configured
- [ ] Secrets updated with production values
- [ ] DNS configured and propagated
- [ ] cert-manager installed and working
- [ ] TLS certificate issued successfully
- [ ] Monitoring configured (Prometheus, Grafana)
- [ ] Logging configured (ELK, Azure Monitor)
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Security scan completed
- [ ] Load testing performed
- [ ] Runbook documented

## Maintenance

### Update Secrets

```bash
# Delete existing secret
kubectl delete secret fleet-frontend-secret -n fleet-management

# Recreate with new values
kubectl create secret generic fleet-frontend-secret \
  --from-literal=VITE_AZURE_AD_CLIENT_ID=new-client-id \
  --from-literal=VITE_AZURE_AD_TENANT_ID=new-tenant-id \
  -n fleet-management

# Restart pods to pick up new secrets
kubectl rollout restart deployment/fleet-frontend -n fleet-management
```

### Update ConfigMap

```bash
# Edit configmap
kubectl edit configmap fleet-frontend-config -n fleet-management

# Restart pods
kubectl rollout restart deployment/fleet-frontend -n fleet-management
```

### Backup

```bash
# Backup all manifests
kubectl get all,cm,secrets,ingress,pdb,hpa,networkpolicy \
  -n fleet-management -o yaml > backup.yaml
```

## Cleanup

To completely remove the deployment:

```bash
# Delete all resources
kubectl delete namespace fleet-management

# Delete cluster-wide resources
kubectl delete clusterissuer letsencrypt-prod
kubectl delete clusterissuer letsencrypt-staging
```

## Support

For issues or questions:
- Email: andrew.m@capitaltechalliance.com
- Documentation: `/docs` directory in repository
- Azure Portal: Monitor resources and logs

## License

Copyright © 2025 Capital Tech Alliance. All rights reserved.
