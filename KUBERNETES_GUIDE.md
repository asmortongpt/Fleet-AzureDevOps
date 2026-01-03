# Kubernetes Deployment Guide

## Fleet Management System - Kubernetes Orchestration

Complete guide for deploying and managing the Fleet Management System on Kubernetes.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Cluster Setup](#cluster-setup)
4. [Deployment Architecture](#deployment-architecture)
5. [Deploying to Kubernetes](#deploying-to-kubernetes)
6. [Scaling & High Availability](#scaling--high-availability)
7. [Monitoring & Observability](#monitoring--observability)
8. [Security](#security)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Fleet Management System is deployed on Kubernetes with:
- **High Availability**: 3+ replicas with pod anti-affinity
- **Auto-scaling**: HPA based on CPU and memory
- **Zero-downtime Updates**: Rolling deployments
- **Security**: Network policies, non-root containers, security contexts
- **Observability**: Health checks, metrics, logging

### Deployment Stack:

```
┌────────────────────────────────────────┐
│           Internet/Users               │
└──────────────┬─────────────────────────┘
               │
        ┌──────▼──────┐
        │   Ingress   │ (TLS, Load Balancing)
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │   Service   │ (ClusterIP/LoadBalancer)
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ Deployment  │ (3-10 pods)
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │    Pods     │ (Nginx + App)
        └─────────────┘
```

---

## Prerequisites

### Required Tools:

```bash
# kubectl
kubectl version --client

# Azure CLI (for AKS)
az version

# Helm (optional but recommended)
helm version
```

### Installation:

**macOS:**
```bash
# kubectl
brew install kubectl

# Azure CLI
brew install azure-cli

# Helm
brew install helm
```

**Linux:**
```bash
# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**Windows:**
```powershell
# kubectl
choco install kubernetes-cli

# Azure CLI
winget install Microsoft.AzureCLI

# Helm
choco install kubernetes-helm
```

---

## Cluster Setup

### Azure Kubernetes Service (AKS):

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription"

# Create resource group
az group create \
  --name fleet-management-rg \
  --location eastus

# Create AKS cluster
az aks create \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

# Verify connection
kubectl get nodes
```

### Local Development (Minikube):

```bash
# Install Minikube
brew install minikube  # macOS
# OR
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube  # Linux

# Start Minikube
minikube start --cpus=4 --memory=8192

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server

# Verify
kubectl get nodes
```

### Configure kubectl:

```bash
# View contexts
kubectl config get-contexts

# Switch context
kubectl config use-context fleet-aks-cluster

# Set namespace
kubectl config set-context --current --namespace=fleet-management
```

---

## Deployment Architecture

### Namespace Structure:

```yaml
fleet-management/
  ├── Deployment (fleet-frontend)
  ├── Service (fleet-frontend)
  ├── Ingress (fleet-ingress)
  ├── ConfigMap (fleet-config)
  ├── HPA (fleet-frontend-hpa)
  ├── NetworkPolicy (fleet-frontend-netpol)
  └── PodDisruptionBudget (fleet-frontend-pdb)
```

### Resource Hierarchy:

```
Namespace: fleet-management
  │
  ├─ Deployment: fleet-frontend
  │    ├─ ReplicaSet (managed by Deployment)
  │    └─ Pods (3-10 replicas)
  │         ├─ Container: frontend
  │         ├─ Volumes: tmp, cache, run
  │         └─ Health Checks: liveness, readiness, startup
  │
  ├─ Service: fleet-frontend (LoadBalancer)
  │    └─ Endpoints → Pods
  │
  ├─ HPA: fleet-frontend-hpa
  │    └─ Monitors: CPU, Memory
  │
  ├─ Ingress: fleet-ingress
  │    ├─ TLS Certificate
  │    └─ Routes → Service
  │
  └─ ConfigMap: fleet-config
       └─ Environment Variables
```

---

## Deploying to Kubernetes

### Initial Deployment:

```bash
# 1. Create namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Verify namespace
kubectl get namespaces

# 3. Create ConfigMap
kubectl apply -f kubernetes/configmap.yaml

# 4. Deploy application
kubectl apply -f kubernetes/deployment.yaml

# 5. Create service
kubectl apply -f kubernetes/service.yaml

# 6. Setup HPA
kubectl apply -f kubernetes/hpa.yaml

# 7. Configure ingress
kubectl apply -f kubernetes/ingress.yaml

# 8. Apply network policy
kubectl apply -f kubernetes/networkpolicy.yaml

# 9. Set PodDisruptionBudget
kubectl apply -f kubernetes/poddisruptionbudget.yaml
```

### One-Command Deployment:

```bash
# Apply all manifests
kubectl apply -f kubernetes/ --recursive

# Or using kustomize
kubectl apply -k kubernetes/
```

### Verify Deployment:

```bash
# Check all resources
kubectl get all -n fleet-management

# Check pods
kubectl get pods -n fleet-management

# Check deployment status
kubectl rollout status deployment/fleet-frontend -n fleet-management

# Describe deployment
kubectl describe deployment fleet-frontend -n fleet-management

# View events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'
```

### Update Deployment:

```bash
# Update image
kubectl set image deployment/fleet-frontend \
  frontend=ghcr.io/asmortongpt/fleet-local:v1.0.1 \
  -n fleet-management

# Watch rollout
kubectl rollout status deployment/fleet-frontend -n fleet-management

# Check history
kubectl rollout history deployment/fleet-frontend -n fleet-management

# Rollback if needed
kubectl rollout undo deployment/fleet-frontend -n fleet-management

# Rollback to specific revision
kubectl rollout undo deployment/fleet-frontend --to-revision=2 -n fleet-management
```

---

## Scaling & High Availability

### Manual Scaling:

```bash
# Scale to 5 replicas
kubectl scale deployment fleet-frontend --replicas=5 -n fleet-management

# Verify scaling
kubectl get pods -n fleet-management -w
```

### Horizontal Pod Autoscaler (HPA):

```bash
# View HPA status
kubectl get hpa -n fleet-management

# Describe HPA
kubectl describe hpa fleet-frontend-hpa -n fleet-management

# Edit HPA
kubectl edit hpa fleet-frontend-hpa -n fleet-management
```

**HPA Configuration:**
```yaml
Min Replicas: 3
Max Replicas: 10
Target CPU: 70%
Target Memory: 80%
```

### High Availability Features:

1. **Pod Anti-Affinity**
   - Spreads pods across nodes
   - Prevents single point of failure

2. **Pod Disruption Budget**
   - Maintains minimum 2 pods during disruptions
   - Protects from voluntary disruptions

3. **Rolling Updates**
   - Zero-downtime deployments
   - Max surge: 1, Max unavailable: 0

4. **Health Checks**
   - Liveness probe: Restarts unhealthy pods
   - Readiness probe: Controls traffic routing
   - Startup probe: Handles slow-starting containers

---

## Monitoring & Observability

### Pod Monitoring:

```bash
# View pod logs
kubectl logs -f deployment/fleet-frontend -n fleet-management

# Logs from specific pod
kubectl logs <pod-name> -n fleet-management

# Previous logs (after crash)
kubectl logs <pod-name> --previous -n fleet-management

# Multiple containers
kubectl logs <pod-name> -c frontend -n fleet-management
```

### Resource Usage:

```bash
# Top pods
kubectl top pods -n fleet-management

# Top nodes
kubectl top nodes

# Describe pod (includes events)
kubectl describe pod <pod-name> -n fleet-management
```

### Health Checks:

```bash
# Check pod health
kubectl get pods -n fleet-management

# Detailed health status
kubectl describe pod <pod-name> -n fleet-management | grep -A5 Liveness
kubectl describe pod <pod-name> -n fleet-management | grep -A5 Readiness
```

### Metrics Server:

```bash
# Install metrics-server (if not installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify
kubectl get deployment metrics-server -n kube-system
```

### Application Insights (Azure):

```yaml
# Enable in deployment
env:
  - name: APPINSIGHTS_INSTRUMENTATIONKEY
    value: "your-key"
```

---

## Security

### Network Policies:

```bash
# Apply network policy
kubectl apply -f kubernetes/networkpolicy.yaml

# View network policies
kubectl get networkpolicies -n fleet-management

# Describe policy
kubectl describe networkpolicy fleet-frontend-netpol -n fleet-management
```

### Security Contexts:

**Pod Level:**
```yaml
runAsNonRoot: true
runAsUser: 101
fsGroup: 101
seccompProfile:
  type: RuntimeDefault
```

**Container Level:**
```yaml
allowPrivilegeEscalation: false
runAsNonRoot: true
runAsUser: 101
readOnlyRootFilesystem: true
capabilities:
  drop: [ALL]
  add: [NET_BIND_SERVICE]
```

### Secrets Management:

```bash
# Create secret
kubectl create secret generic fleet-secrets \
  --from-literal=api-key=your-api-key \
  -n fleet-management

# Use in deployment
env:
  - name: API_KEY
    valueFrom:
      secretKeyRef:
        name: fleet-secrets
        key: api-key
```

### RBAC:

```bash
# Create service account
kubectl apply -f kubernetes/deployment.yaml  # Includes SA

# View service account
kubectl get serviceaccount fleet-frontend-sa -n fleet-management
```

### TLS/SSL:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@fleet-management.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Verify certificate
kubectl get certificate -n fleet-management
kubectl describe certificate fleet-tls-cert -n fleet-management
```

---

## Maintenance

### Updates & Patches:

```bash
# Update deployment
kubectl apply -f kubernetes/deployment.yaml

# Restart deployment (rolling restart)
kubectl rollout restart deployment/fleet-frontend -n fleet-management

# Pause rollout
kubectl rollout pause deployment/fleet-frontend -n fleet-management

# Resume rollout
kubectl rollout resume deployment/fleet-frontend -n fleet-management
```

### ConfigMap Updates:

```bash
# Update ConfigMap
kubectl apply -f kubernetes/configmap.yaml

# Restart pods to pick up changes
kubectl rollout restart deployment/fleet-frontend -n fleet-management
```

### Backup & Restore:

```bash
# Backup namespace
kubectl get all -n fleet-management -o yaml > fleet-backup.yaml

# Backup specific resources
kubectl get deployment,service,ingress -n fleet-management -o yaml > fleet-resources.yaml

# Restore
kubectl apply -f fleet-backup.yaml
```

### Cleanup:

```bash
# Delete specific resource
kubectl delete deployment fleet-frontend -n fleet-management

# Delete all resources in namespace
kubectl delete all --all -n fleet-management

# Delete namespace (WARNING: deletes everything)
kubectl delete namespace fleet-management
```

---

## Troubleshooting

### Pod Issues:

```bash
# Pod not starting
kubectl describe pod <pod-name> -n fleet-management
kubectl logs <pod-name> -n fleet-management

# Pod stuck in Pending
kubectl describe pod <pod-name> -n fleet-management  # Check Events

# Pod CrashLoopBackOff
kubectl logs <pod-name> --previous -n fleet-management

# Pod Image Pull issues
kubectl describe pod <pod-name> -n fleet-management | grep -A5 Events
```

### Deployment Issues:

```bash
# Deployment not progressing
kubectl rollout status deployment/fleet-frontend -n fleet-management
kubectl describe deployment fleet-frontend -n fleet-management

# Rollout stuck
kubectl rollout pause deployment/fleet-frontend -n fleet-management
kubectl rollout undo deployment/fleet-frontend -n fleet-management
kubectl rollout resume deployment/fleet-frontend -n fleet-management
```

### Service Issues:

```bash
# Service not accessible
kubectl get svc -n fleet-management
kubectl describe svc fleet-frontend -n fleet-management

# Check endpoints
kubectl get endpoints fleet-frontend -n fleet-management

# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://fleet-frontend.fleet-management.svc.cluster.local
```

### Ingress Issues:

```bash
# Ingress not working
kubectl get ingress -n fleet-management
kubectl describe ingress fleet-ingress -n fleet-management

# Check ingress controller
kubectl get pods -n ingress-nginx

# View ingress logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

### HPA Issues:

```bash
# HPA not scaling
kubectl describe hpa fleet-frontend-hpa -n fleet-management

# Check metrics server
kubectl get deployment metrics-server -n kube-system
kubectl top pods -n fleet-management
```

### Debug Pod:

```bash
# Execute shell in pod
kubectl exec -it <pod-name> -n fleet-management -- sh

# Run debug container
kubectl debug <pod-name> -n fleet-management -it --image=busybox

# Port forward for local testing
kubectl port-forward deployment/fleet-frontend 8080:8080 -n fleet-management
```

---

## Best Practices

### Resource Management:

1. **Always set resource requests and limits**
2. **Use HPA for automatic scaling**
3. **Set PodDisruptionBudgets for critical services**
4. **Use affinity rules for better distribution**

### Security:

1. **Never run as root**
2. **Use read-only filesystems where possible**
3. **Implement network policies**
4. **Scan images for vulnerabilities**
5. **Use secrets for sensitive data**

### Reliability:

1. **Implement all three health checks** (liveness, readiness, startup)
2. **Use rolling updates** (never Recreate)
3. **Set appropriate pod disruption budgets**
4. **Monitor and alert on pod restarts**

### Observability:

1. **Centralize logging** (ELK, Loki, etc.)
2. **Use metrics** (Prometheus)
3. **Implement distributed tracing** (Jaeger, Zipkin)
4. **Set up alerts** (AlertManager)

---

## Quick Reference

### Common Commands:

```bash
# View resources
kubectl get all -n fleet-management
kubectl get pods -n fleet-management -w

# Logs
kubectl logs -f deployment/fleet-frontend -n fleet-management

# Describe
kubectl describe deployment fleet-frontend -n fleet-management

# Scale
kubectl scale deployment fleet-frontend --replicas=5 -n fleet-management

# Update
kubectl set image deployment/fleet-frontend frontend=new-image:tag -n fleet-management

# Rollback
kubectl rollout undo deployment/fleet-frontend -n fleet-management

# Port forward
kubectl port-forward deployment/fleet-frontend 8080:8080 -n fleet-management

# Execute
kubectl exec -it <pod-name> -n fleet-management -- sh

# Delete
kubectl delete pod <pod-name> -n fleet-management
```

---

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure Kubernetes Service (AKS)](https://docs.microsoft.com/en-us/azure/aks/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

---

**Last Updated**: 2025-12-31
**Maintained By**: Capital Tech Alliance DevOps Team
