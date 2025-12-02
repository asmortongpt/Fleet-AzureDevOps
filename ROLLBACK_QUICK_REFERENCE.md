# EMERGENCY ROLLBACK - QUICK REFERENCE
**Last Updated:** 2025-11-24 23:00 EST

---

## 🚨 ONE-COMMAND ROLLBACK

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet && ./emergency-rollback.sh
```

**What this does:**
1. Connects to AKS cluster
2. Updates API image to: `v20251120-production-ready`
3. Scales API to 3 replicas
4. Waits for rollout to complete
5. Verifies deployment health

**Time to complete:** 2-5 minutes

---

## 📊 CURRENT STATE SNAPSHOT

### Production Cluster
- **Cluster:** `fleet-aks-cluster`
- **Resource Group:** `fleet-production-rg`
- **Namespace:** `fleet-management`
- **Region:** East US 2

### Current Images (as of 2025-11-24)
```yaml
API:
  Image: fleetappregistry.azurecr.io/fleet-api:v1.1.0
  Replicas: 0 (SCALED DOWN - THIS IS THE PROBLEM!)
  Status: Not Running

Frontend:
  Image: fleetappregistry.azurecr.io/fleet-frontend:latest
  Replicas: 3
  Status: Running
```

### Problem
- API is scaled to **0 replicas**
- This causes 502/504 errors when frontend tries to reach backend
- No API pods are running to handle requests

---

## 🎯 ROLLBACK TARGETS (VERIFIED IN ACR)

### Option 1: Most Recent Production ✅ RECOMMENDED
```bash
Image: fleetappregistry.azurecr.io/fleet-api:v20251120-production-ready
Created: 2025-11-20
Status: Known stable, tested in production
Git Commit: Unknown (pre-dates current issues)
```

### Option 2: Clean Build Version
```bash
Image: fleetappregistry.azurecr.io/fleet-api:v6.3-clean-build
Created: ~2025-11-10
Status: Known stable, comprehensive rebuild
```

### Option 3: Stable Production
```bash
Image: fleetappregistry.azurecr.io/fleet-api:v5.0-production
Created: ~2025-11-08
Status: Long-term stable version
```

### Option 4: Staging (Currently Working)
```bash
Image: fleetappregistry.azurecr.io/fleet-api:v3.1-sso
Created: Earlier
Status: Currently running in staging namespace successfully
Note: May have different features/config than production
```

---

## 🛠️ MANUAL ROLLBACK (If Script Fails)

### Step-by-Step Commands

```bash
# 1. Connect to cluster
az aks get-credentials \
  --resource-group fleet-production-rg \
  --name fleet-aks-cluster \
  --overwrite-existing

# 2. Update API image
kubectl set image deployment/fleet-api \
  fleet-api=fleetappregistry.azurecr.io/fleet-api:v20251120-production-ready \
  -n fleet-management

# 3. Scale up API
kubectl scale deployment/fleet-api --replicas=3 -n fleet-management

# 4. Watch rollout
kubectl rollout status deployment/fleet-api -n fleet-management --timeout=300s

# 5. Verify pods
kubectl get pods -n fleet-management -l app=fleet-api

# 6. Check logs
kubectl logs -n fleet-management -l app=fleet-api --tail=50

# 7. Test health
kubectl exec -n fleet-management deployment/fleet-api -- \
  wget -qO- http://localhost:3001/api/v1/health
```

---

## ✅ VERIFICATION CHECKLIST

After rollback, run:
```bash
./verify-rollback.sh
```

Or manually verify:

- [ ] **API pods running:** 3/3 pods in Running state
  ```bash
  kubectl get pods -n fleet-management -l app=fleet-api
  ```

- [ ] **Health endpoint:** Returns 200 OK
  ```bash
  kubectl exec -n fleet-management deployment/fleet-api -- \
    wget -O- http://localhost:3001/api/v1/health
  ```

- [ ] **No errors in logs:**
  ```bash
  kubectl logs -n fleet-management -l app=fleet-api --tail=100 | grep -i error
  ```

- [ ] **Web UI loads:** No white screen
  ```bash
  curl -I https://fleet.capitaltechalliance.com
  ```

- [ ] **API responds:** Backend is reachable
  ```bash
  curl https://fleet.capitaltechalliance.com/api/v1/health
  ```

---

## 🔄 GIT ROLLBACK (If Needed)

### Last Known Good Commit
```bash
Commit: cedf3734
Message: "fix: Revert to React 18.3.1 - restore production stability - PDCA validated"
Date: ~2025-11-15
Commits since: 17 commits
```

### To Rollback Git State
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Save current work
git stash

# Create rollback branch
git checkout -b emergency-rollback-$(date +%Y%m%d-%H%M%S)

# Reset to known good state
git reset --hard cedf3734

# Verify
git log --oneline -5
```

---

## 🚀 ALTERNATIVE ROLLBACK OPTIONS

### Use Different Image
```bash
./emergency-rollback.sh --image fleetappregistry.azurecr.io/fleet-api:v6.3-clean-build
```

### Verify Only (No Changes)
```bash
./emergency-rollback.sh --verify-only
```

### Kubernetes Native Rollback
```bash
# View history
kubectl rollout history deployment/fleet-api -n fleet-management

# Rollback to previous
kubectl rollout undo deployment/fleet-api -n fleet-management

# Rollback to specific revision
kubectl rollout undo deployment/fleet-api -n fleet-management --to-revision=85
```

---

## 🔍 TROUBLESHOOTING

### If Pods Won't Start
```bash
# Check pod events
kubectl describe pod -n fleet-management -l app=fleet-api

# Check for image pull errors
kubectl get events -n fleet-management --sort-by='.lastTimestamp' | tail -20

# Test ACR access
az acr login --name fleetappregistry
```

### If Health Checks Fail
```bash
# Check probes configuration
kubectl describe deployment fleet-api -n fleet-management | grep -A10 Liveness

# Get pod logs
kubectl logs -n fleet-management -l app=fleet-api --tail=100

# Check pod status
kubectl get pods -n fleet-management -l app=fleet-api -o wide
```

### If Database Connection Fails
```bash
# Check postgres pod
kubectl get pods -n fleet-management | grep postgres

# Check database service
kubectl get svc -n fleet-management | grep postgres

# Test connectivity from API pod
kubectl exec -n fleet-management deployment/fleet-api -- \
  nc -zv fleet-postgres-service 5432
```

### If Still Getting 502/504 Errors
```bash
# Check ingress
kubectl get ingress -n fleet-management
kubectl describe ingress -n fleet-management

# Check service endpoints
kubectl get endpoints -n fleet-management | grep fleet-api

# Check nginx logs (if using nginx ingress)
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=50
```

---

## 📞 AZURE RESOURCES

### Quick Access Commands
```bash
# Login to Azure
az login --tenant 0ec14b81-7b82-45ee-8f3d-cbc31ced5347

# Set subscription
az account set --subscription 021415c2-2f52-4a73-ae77-f8363165a5e1

# View resource group
az group show --name fleet-production-rg

# View AKS cluster
az aks show --resource-group fleet-production-rg --name fleet-aks-cluster

# View ACR
az acr show --name fleetappregistry
```

### URLs
- **Frontend:** https://fleet.capitaltechalliance.com
- **API Health:** https://fleet.capitaltechalliance.com/api/v1/health
- **ACR:** fleetappregistry.azurecr.io

---

## 📝 POST-ROLLBACK CHECKLIST

1. **Document incident:** What failed, when, why
2. **Notify stakeholders:** Service restored
3. **Analyze root cause:** Review recent changes
4. **Update runbooks:** Add learnings
5. **Test in staging:** Verify fixes before next prod deploy
6. **Monitor closely:** Watch for issues in first 24h

---

## ⚡ FASTEST PATH TO RECOVERY

**If you just need it working NOW:**

1. Run this command:
   ```bash
   cd /Users/andrewmorton/Documents/GitHub/Fleet && ./emergency-rollback.sh
   ```

2. When prompted, type `y` and press Enter

3. Wait 2-5 minutes for deployment

4. Verify: https://fleet.capitaltechalliance.com

5. If still broken, try alternative image:
   ```bash
   ./emergency-rollback.sh --image fleetappregistry.azurecr.io/fleet-api:v6.3-clean-build
   ```

**That's it. It should work.**

---

## 🎯 SUCCESS CRITERIA

Rollback is successful when:
- ✅ API pods: 3/3 Running
- ✅ Health endpoint: Returns 200 OK
- ✅ Frontend loads: No white screen
- ✅ Can login: SSO flow works
- ✅ No errors: Clean logs
- ✅ API responds: Backend reachable

---

## 📊 REVISION HISTORY

| Revision | Date | Image | Status |
|----------|------|-------|--------|
| 92 | 2025-11-24 | v1.1.0 | Scaled to 0 (BROKEN) |
| 85 | 2025-11-23 | v20251123-sso-cookie-fix | Working |
| 84 | 2025-11-23 | v20251123-sso-fix | Unknown |
| 83 | 2025-11-23 | v20251123-sso-route-fix | Unknown |

Use: `kubectl rollout history deployment/fleet-api -n fleet-management` for full list

---

## 🔐 CREDENTIALS

All credentials stored in:
- **Azure Key Vault:** (if configured)
- **Kubernetes Secrets:** `fleet-api-secrets`, `fleet-secrets`, `azure-ad-secret`
- **Global ENV:** `/Users/andrewmorton/.env`

---

**End of Quick Reference**
