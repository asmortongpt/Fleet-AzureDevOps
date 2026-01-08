# Quick Fix: ImagePullBackOff Issue

**Date:** January 8, 2026
**Status:** 🔴 IDENTIFIED - NEEDS FIX
**Pod:** fleet-app-7d6576ffbb-m8bf6
**Issue:** Failed to pull image from fleetregistry2025.azurecr.io

---

## Problem Summary

**Pod Status:** ImagePullBackOff (2 days 21 hours)

**Error:**
```
Failed to pull image "fleetregistry2025.azurecr.io/fleet-frontend:latest":
- no match for platform in manifest: not found
- 401 Unauthorized
```

**Root Causes:**
1. ❌ Image does not exist in registry OR
2. ❌ Wrong platform (ARM vs AMD64) OR
3. ❌ Missing/expired registry credentials

---

## Quick Fix Steps

### Step 1: Check if the deployment is needed

Since we already have 3 working `fleet-app` pods (fdd9fc985-*) and 2 working `fleet-frontend` pods (7954cc4d86-*), this pod might be from an old deployment.

```bash
# Check deployments
kubectl get deployments -n fleet-management

# If fleet-app-7d6576ffbb is outdated, scale it down
kubectl scale deployment fleet-app-7d6576ffbb --replicas=0 -n fleet-management
```

### Step 2: Verify Azure Container Registry credentials

```bash
# Check if image exists
az acr repository show-tags \
  --name fleetregistry2025 \
  --repository fleet-frontend \
  --output table

# If image doesn't exist, build and push it
cd /Users/andrewmorton/Documents/GitHub/Fleet
docker build -t fleetregistry2025.azurecr.io/fleet-frontend:latest .
docker push fleetregistry2025.azurecr.io/fleet-frontend:latest
```

### Step 3: Update Kubernetes secret for registry auth

```bash
# Get Azure Container Registry credentials
az acr credential show --name fleetregistry2025

# Create or update Kubernetes secret
kubectl create secret docker-registry acr-secret \
  --docker-server=fleetregistry2025.azurecr.io \
  --docker-username=<username from above> \
  --docker-password=<password from above> \
  --namespace=fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

# Patch deployment to use the secret
kubectl patch deployment fleet-app-7d6576ffbb \
  -n fleet-management \
  --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/imagePullSecrets", "value": [{"name": "acr-secret"}]}]'
```

### Step 4: Delete old pod and let it recreate

```bash
# Delete the problematic pod
kubectl delete pod fleet-app-7d6576ffbb-m8bf6 -n fleet-management

# Watch the new pod creation
kubectl get pods -n fleet-management -w
```

---

## Alternative: Remove Old Deployment

If the deployment is no longer needed (since we have newer working versions):

```bash
# Delete the old deployment
kubectl delete deployment fleet-app-7d6576ffbb -n fleet-management

# Verify only working pods remain
kubectl get pods -n fleet-management
```

**This is the RECOMMENDED approach** since:
- ✅ We have 3 working fleet-app pods (fdd9fc985-*)
- ✅ We have 2 working fleet-frontend pods (7954cc4d86-*)
- ✅ The failing pod is from an older deployment (7d6576ffbb)

---

## Immediate Action

Run this command to remove the old deployment:

```bash
kubectl delete deployment fleet-app-7d6576ffbb -n fleet-management
```

Expected result:
```
deployment.apps "fleet-app-7d6576ffbb" deleted
```

Verification:
```bash
kubectl get pods -n fleet-management | grep -i "imagepullbackoff"
# Should return nothing
```

---

## Prevention

To prevent this in the future:

1. **Use Specific Image Tags** instead of `latest`
   ```yaml
   image: fleetregistry2025.azurecr.io/fleet-frontend:v2.0.3
   ```

2. **Set imagePullPolicy**
   ```yaml
   imagePullPolicy: IfNotPresent
   ```

3. **Cleanup Old Deployments**
   ```bash
   # Add to CI/CD pipeline
   kubectl delete deployment -n fleet-management -l "version!=current"
   ```

4. **Monitor for ImagePullBackOff**
   ```bash
   # Add alert
   kubectl get pods -A | grep ImagePullBackOff
   ```

---

## Status After Fix

Expected state:
```
fleet-api-6489b586b6-8fqtl             1/1     Running   0          2d15h
fleet-app-fdd9fc985-4kz7d              1/1     Running   0          3d3h
fleet-app-fdd9fc985-9szpn              1/1     Running   0          3d3h
fleet-app-fdd9fc985-p6ptn              1/1     Running   0          3d3h
fleet-frontend-7954cc4d86-jncxc        1/1     Running   0          2d15h
fleet-frontend-7954cc4d86-jrm8g        1/1     Running   0          2d15h
fleet-gps-emulator-869cd9bf95-nns9b    1/1     Running   0          3d4h
fleet-obd2-emulator-58c74d7f54-jzvs8   1/1     Running   0          3d4h
fleet-postgres-b5cb85bb6-kgslc         1/1     Running   0          3d3h
fleet-redis-d5d48dc6c-qhvzl            1/1     Running   0          4d4h
```

✅ All pods running
✅ No ImagePullBackOff errors
✅ Cleaner deployment state

---

**Execution Time:** 2 minutes
**Impact:** Eliminates error logs, improves cluster health

🚀 **Ready to fix!**
