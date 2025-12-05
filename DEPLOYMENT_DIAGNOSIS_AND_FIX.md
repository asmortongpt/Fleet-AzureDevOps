# Fleet Application Deployment Diagnosis & Fix

**Date:** 2025-12-04
**Status:** 🔧 FIX IDENTIFIED AND COMMITTED
**Site:** https://fleet.capitaltechalliance.com

---

## Issue Summary

User reported seeing **"Section Error / This section couldn't load properly"** when accessing the production site at fleet.capitaltechalliance.com.

---

## Root Cause Analysis

### 1. Frontend Errors
The frontend application was making requests to CSRF token endpoints that didn't exist in the API:
```
GET /api/v1/csrf-token → 404 Not Found
GET /api/csrf → 404 Not Found
GET /api/csrf-token → 404 Not Found
```

### 2. API Logs Evidence
```json
{"level":"warn","message":"Route not found","method":"GET","path":"/api/v1/csrf-token","service":"fleet-api","timestamp":"2025-12-04 20:32:25"}
{"level":"warn","message":"Route not found","method":"GET","path":"/api/csrf","service":"fleet-api","timestamp":"2025-12-04 20:32:38"}
```

### 3. Backend Verification
- CSRF middleware exists at `api/src/middleware/csrf.ts` ✅
- `csrfProtection` middleware defined ✅
- `getCsrfToken` handler exists ✅
- **BUT:** No routes were registered to expose these endpoints ❌

---

## Fix Implemented

### Code Changes (Committed: ee88580f1)

**File:** `api/src/server.ts`

**Added Import:**
```typescript
import { csrfProtection, getCsrfToken } from './middleware/csrf'
```

**Added Routes:** (Lines 238-241)
```typescript
// CSRF Token endpoint
app.get('/api/csrf-token', csrfProtection, getCsrfToken)
app.get('/api/v1/csrf-token', csrfProtection, getCsrfToken)
app.get('/api/csrf', csrfProtection, getCsrfToken)
```

### Git Commit
```
commit ee88580f1
Author: Claude Code
Date:   Wed Dec 4 15:38:00 2025

fix: Add CSRF token endpoints to resolve Section Error

- Added /api/csrf-token, /api/v1/csrf-token, /api/csrf endpoints
- Frontend was failing because CSRF token routes didn't exist
- This fixes the 'Section Error / This section couldn't load properly' issue
```

**Pushed to:** `main` branch ✅

---

## Deployment Status

### Current Production Deployment
- **Cluster:** fleet-aks-cluster
- **Resource Group:** fleet-production-rg
- **Namespace:** fleet-management
- **Registry:** fleetproductionacr.azurecr.io
- **Current Image:** fleet-api:v4-fixed

### Deployment Replicas
```
NAME                         READY   STATUS    RESTARTS   AGE
fleet-api-6f85cd8d54-p9g97   1/1     Running   0          2m
fleet-api-6f85cd8d54-qxr8k   1/1     Running   0          2m
fleet-api-6f85cd8d54-s7m4w   1/1     Running   0          2m
```

### Why Fix Isn't Live Yet
❌ **Problem:** Simply restarting pods (`kubectl rollout restart`) doesn't pull new code because:
- Image tag is still `v4-fixed`
- Kubernetes pulls the same cached image
- New code from GitHub needs to be built into a new Docker image

---

## Next Steps to Deploy Fix

### Option 1: Build New Image (Recommended)
```bash
# Build new image with timestamp tag
cd /Users/andrewmorton/Documents/GitHub/fleet-local

# Build to production ACR
az acr build \
  --registry fleetproductionacr \
  --image fleet-api:v5-csrf-fix \
  --image fleet-api:latest \
  --file api/Dockerfile.production \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  api/

# Update deployment to use new image
kubectl set image deployment/fleet-api \
  fleet-api=fleetproductionacr.azurecr.io/fleet-api:v5-csrf-fix \
  -n fleet-management

# Wait for rollout
kubectl rollout status deployment/fleet-api -n fleet-management
```

### Option 2: Manual Image Tag Update
```bash
# Tag new version
kubectl set image deployment/fleet-api \
  fleet-api=fleetproductionacr.azurecr.io/fleet-api:latest \
  -n fleet-management

# Force image pull
kubectl patch deployment fleet-api -n fleet-management \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"fleet-api","imagePullPolicy":"Always"}]}}}}'
```

### Option 3: Setup CI/CD Pipeline
Create `.github/workflows/deploy-production.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and Push
        run: |
          az acr build \
            --registry fleetproductionacr \
            --image fleet-api:${{ github.sha }} \
            --image fleet-api:latest \
            --file api/Dockerfile.production \
            api/

      - name: Deploy to AKS
        run: |
          az aks get-credentials \
            --resource-group fleet-production-rg \
            --name fleet-aks-cluster

          kubectl set image deployment/fleet-api \
            fleet-api=fleetproductionacr.azurecr.io/fleet-api:${{ github.sha }} \
            -n fleet-management

          kubectl rollout status deployment/fleet-api \
            -n fleet-management
```

---

## Verification Steps

Once new image is deployed, verify fix:

### 1. Test CSRF Endpoints
```bash
curl -i https://fleet.capitaltechalliance.com/api/csrf-token
# Expected: 200 OK with JSON response containing csrfToken

curl -i https://fleet.capitaltechalliance.com/api/v1/csrf-token
# Expected: 200 OK with JSON response

curl -i https://fleet.capitaltechalliance.com/api/csrf
# Expected: 200 OK with JSON response
```

### 2. Check API Logs
```bash
kubectl logs -n fleet-management deployment/fleet-api --tail=50 | grep csrf
# Expected: No more "Route not found" warnings for csrf endpoints
```

### 3. Test Frontend
- Navigate to https://fleet.capitaltechalliance.com
- Should NOT see "Section Error" messages
- Sections should load properly
- Browser console should show successful CSRF token fetch

---

## Infrastructure Details

### AKS Cluster
```
Name: fleet-aks-cluster
Location: eastus2
Resource Group: fleet-production-rg
Kubernetes Version: 1.28.x
Node Count: 3
VM Size: Standard_D4s_v3
```

### Container Registry
```
Name: fleetproductionacr.azurecr.io
SKU: Standard
Admin Enabled: Yes
```

### Services
```
fleet-api-service        ClusterIP   10.0.182.143   3000/TCP
fleet-frontend           ClusterIP   10.0.88.113    80/TCP
fleet-postgres-service   ClusterIP   10.0.125.214   5432/TCP
fleet-redis-service      ClusterIP   10.0.134.120   6379/TCP
```

### External Access
```
Domain: fleet.capitaltechalliance.com
IP: 20.15.65.2
HTTPS: ✅ Enabled with SSL redirect
Certificate: Auto-renewed via cert-manager
```

---

## Summary

✅ **Root Cause:** Missing CSRF token endpoint routes
✅ **Fix:** Added 3 CSRF endpoints to api/src/server.ts
✅ **Code Committed:** ee88580f1 pushed to main
⏳ **Deployment:** Waiting for new Docker image build
⏳ **Verification:** Pending deployment of new image

**Once new image is deployed**, the "Section Error" issue will be resolved and the application will function normally.

---

**Last Updated:** 2025-12-04 15:45:00
**Next Action:** Build and deploy new Docker image with Option 1 above
