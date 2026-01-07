# Production React Rendering Fix - Summary

## Problem Identified

The production deployment at http://20.161.96.87 is serving an **OLD BUILD** with mismatched JavaScript chunks causing:
```
Error: Cannot read properties of undefined (reading 'createContext')
```

**Root Cause**: The deployed pods contain outdated dist files:
- Current: `/index-BPPDjV7-.js`, `/vendor-D797g0wD.js`, `/react-vendor-DK0rNv_y.js`  
- Expected: `/assets/js/index-CkklrL9U.js`, `/assets/js/react-core-SmgQxtnL.js`

This is NOT a code issue - it's a deployment/build issue.

## Local Testing Results

✅ **Production build works perfectly locally**:
- Build completes successfully: `npm run build`
- Preview server runs without errors: `npm run preview`
- All React chunks are properly generated

## Solution Required

The AKS deployment needs to be updated with the new build. However, there are ACR permission issues:

### Current Deployment Configuration
- **Namespace**: `ctafleet`
- **Deployment**: `fleet-frontend` 
- **Current Image**: `fleetacr.azurecr.io/fleet-app:100-percent-complete` (ACR doesn't exist)
- **Replicas**: 3 pods running

### Available ACRs
1. `fleetregistry2025.azurecr.io` - Accessible, image pushed ✅
2. `fleetproductionacr.azurecr.io` - Accessible, image pushed ✅  
3. `fleetacr.azurecr.io` - **NOT FOUND** (deployment references this)

### Issue
AKS cluster gets `401 Unauthorized` when trying to pull from the accessible ACRs. The cluster needs to be attached to the ACR or have image pull secrets configured.

## Immediate Fix Options

### Option 1: Attach ACR to AKS (Recommended)
```bash
# Find AKS cluster
az aks list --query "[?contains(name, 'fleet')]" -o table

# Attach ACR
az aks update -n <aks-cluster-name> -g <resource-group> --attach-acr fleetregistry2025

# Update deployment
kubectl set image deployment/fleet-frontend frontend=fleetregistry2025.azurecr.io/fleet-frontend:latest -n ctafleet
```

### Option 2: Create Image Pull Secret
```bash
# Create secret
kubectl create secret docker-registry acr-secret \
  --docker-server=fleetregistry2025.azurecr.io \
  --docker-username=<acr-username> \
  --docker-password=<acr-password> \
  -n ctafleet

# Patch deployment
kubectl patch deployment fleet-frontend -n ctafleet \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"acr-secret"}]}}}}'
```

### Option 3: Manual Pod Update (Temporary)
Since the containers run as non-root with read-only filesystems, you would need to:
1. Build a new image with the correct user/permissions
2. Or temporarily disable the security context

## Files Ready for Deployment

✅ **New Docker image built and pushed**:
- `fleetregistry2025.azurecr.io/fleet-frontend:latest`
- `fleetproductionacr.azurecr.io/fleet-app:latest`

✅ **Dist folder ready**: `/Users/andrewmorton/Documents/GitHub/Fleet/dist/`

## Testing Commands

```bash
# Test production site
node test-prod-site.mjs

# Test local build
node test-local-render.mjs

# Check pod status
kubectl get pods -n ctafleet | grep fleet-frontend

# Check deployment image
kubectl get deployment fleet-frontend -n ctafleet -o yaml | grep image:
```

## Next Steps

1. **Attach fleetregistry2025 ACR to AKS cluster** (requires Azure permissions)
2. **Update deployment** to pull from attached ACR
3. **Verify rollout** completes successfully
4. **Test production site** renders correctly

**Estimated Time**: 5-10 minutes once ACR permissions are configured

---

**Created**: 2026-01-03  
**Status**: Awaiting ACR-AKS integration
