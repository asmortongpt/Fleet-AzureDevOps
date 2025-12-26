# Deployment Guide - Production Readiness

**Date:** 2025-12-25
**Application:** Fleet Management Platform
**Version:** Production Readiness Release

---

## Prerequisites

### Local Development
- Node.js 18+
- npm 9+
- Git

### Production Deployment
- Azure Container Registry access
- Kubernetes cluster (AKS recommended)
- Azure Key Vault for secrets
- Application Insights for monitoring

---

## Quick Start

### Local Development
```bash
# Clone and install
git clone https://github.com/asmortongpt/Fleet.git
cd Fleet
npm install

# Start development server
npm run dev

# Run in browser
open http://localhost:5173
```

### Build for Production
```bash
# Clean build
rm -rf dist node_modules/.vite
npm run build

# Verify build
ls -la dist/
# Should see: index.html, assets/, vendor chunks
```

---

## Deployment Steps

### Step 1: Build Docker Image
```bash
# Build production image
docker build -t fleet-app:latest .

# Tag for registry
docker tag fleet-app:latest acrfleet.azurecr.io/fleet-app:$(git rev-parse --short HEAD)

# Push to registry
docker push acrfleet.azurecr.io/fleet-app:$(git rev-parse --short HEAD)
```

### Step 2: Update Kubernetes Manifests
```yaml
# k8s/deployment.yaml
spec:
  containers:
  - name: fleet-app
    image: acrfleet.azurecr.io/fleet-app:<NEW_TAG>
```

### Step 3: Deploy to Kubernetes
```bash
# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Verify rollout
kubectl rollout status deployment/fleet-app

# Check pods
kubectl get pods -l app=fleet-app
```

### Step 4: Verify Deployment
```bash
# Health check
curl https://fleet.example.com/health

# Smoke test
npm run test:e2e -- --project=smoke
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | Yes |
| VITE_APP_INSIGHTS_KEY | Application Insights key | No |
| VITE_AUTH_DOMAIN | Auth0/Azure AD domain | Yes |
| VITE_AUTH_CLIENT_ID | OAuth client ID | Yes |

---

## Rollback Procedure

```bash
# List deployment history
kubectl rollout history deployment/fleet-app

# Rollback to previous
kubectl rollout undo deployment/fleet-app

# Rollback to specific revision
kubectl rollout undo deployment/fleet-app --to-revision=3
```

---

## Monitoring

### Application Insights
- View live metrics
- Check failed requests
- Review performance

### Kubernetes
```bash
# Pod logs
kubectl logs -f deployment/fleet-app

# Resource usage
kubectl top pods -l app=fleet-app
```
