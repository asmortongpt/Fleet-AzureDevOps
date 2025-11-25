# EMERGENCY ROLLBACK PLAN
**Created:** 2025-11-24
**Last Updated:** 2025-11-24
**Purpose:** Immediate rollback to last known working state

---

## EXECUTIVE SUMMARY

**Current Production State:**
- **API Image:** `fleetappregistry.azurecr.io/fleet-api:v1.1.0` (SCALED TO 0 - NOT RUNNING)
- **App Image:** `fleetappregistry.azurecr.io/fleet-frontend:latest` (Running 3 replicas)
- **Namespace:** `fleet-management`
- **Cluster:** `fleet-aks-cluster` in `fleet-production-rg`

**Last Known Working Images:**
1. **API:** `fleetappregistry.azurecr.io/fleet-api:v20251120-production-ready`
2. **API Alternative:** `fleetappregistry.azurecr.io/fleet-api:v6.3-clean-build`
3. **API Alternative:** `fleetappregistry.azurecr.io/fleet-api:v5.0-production`

**Last Known Working Git Commit:**
- **Hash:** `cedf3734`
- **Message:** "fix: Revert to React 18.3.1 - restore production stability - PDCA validated"
- **Commits Since:** 17 commits ahead

---

## QUICK ROLLBACK (1-COMMAND)

```bash
# Execute this single command to rollback immediately
/Users/andrewmorton/Documents/GitHub/Fleet/emergency-rollback.sh
```

---

## AVAILABLE ROLLBACK TARGETS

### Option 1: Most Recent Production-Ready (RECOMMENDED)
```yaml
Image: fleetappregistry.azurecr.io/fleet-api:v20251120-production-ready
Created: 2025-11-20
Status: Known stable, most recent production build
```

### Option 2: Clean Build Version
```yaml
Image: fleetappregistry.azurecr.io/fleet-api:v6.3-clean-build
Created: Earlier (before 2025-11-20)
Status: Known stable, clean build
```

### Option 3: Stable Production Version
```yaml
Image: fleetappregistry.azurecr.io/fleet-api:v5.0-production
Created: Earlier
Status: Known stable, production-tested
```

### Option 4: Staging Working Version
```yaml
Image: fleetappregistry.azurecr.io/fleet-api:v3.1-sso
Created: Earlier
Status: Currently running in staging successfully
```

---

## MANUAL ROLLBACK PROCEDURE

### Step 1: Scale Up API with Working Image
```bash
# Connect to cluster
az aks get-credentials --resource-group fleet-production-rg --name fleet-aks-cluster --overwrite-existing

# Update API deployment with working image
kubectl set image deployment/fleet-api \
  fleet-api=fleetappregistry.azurecr.io/fleet-api:v20251120-production-ready \
  -n fleet-management

# Scale up to 3 replicas
kubectl scale deployment/fleet-api --replicas=3 -n fleet-management
```

### Step 2: Verify API Health
```bash
# Watch rollout status
kubectl rollout status deployment/fleet-api -n fleet-management --timeout=300s

# Check pod status
kubectl get pods -n fleet-management -l app=fleet-api

# Check logs
kubectl logs -n fleet-management -l app=fleet-api --tail=50

# Test health endpoint
kubectl exec -n fleet-management deployment/fleet-api -- wget -qO- http://localhost:3001/api/v1/health
```

### Step 3: Update Frontend if Needed
```bash
# If frontend also needs rollback
kubectl set image deployment/fleet-app \
  fleet-app=fleetappregistry.azurecr.io/fleet-frontend:v20251120-production-ready \
  -n fleet-management

kubectl rollout status deployment/fleet-app -n fleet-management --timeout=300s
```

### Step 4: Verify Application
```bash
# Check all deployments
kubectl get deployments -n fleet-management

# Check services
kubectl get svc -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management

# Test application endpoint
curl -k https://fleet.capitaltechalliance.com/api/v1/health
```

---

## ROLLBACK TO SPECIFIC GIT COMMIT

### Rebuild from Last Known Good Commit
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Stash any current changes
git stash

# Create emergency rollback branch
git checkout -b emergency-rollback-$(date +%Y%m%d-%H%M%S)

# Reset to last known good commit
git reset --hard cedf3734

# Verify the state
git log --oneline -5
git status

# Rebuild and deploy (if automated pipeline exists)
# Or manually build and push to ACR
```

---

## KUBERNETES ROLLBACK COMMANDS

### Rollback to Previous Revision
```bash
# View rollout history
kubectl rollout history deployment/fleet-api -n fleet-management

# Rollback to previous revision
kubectl rollout undo deployment/fleet-api -n fleet-management

# Rollback to specific revision (e.g., revision 85)
kubectl rollout undo deployment/fleet-api -n fleet-management --to-revision=85
```

### Rollback by Scaling
```bash
# If deployment is failing, scale down first
kubectl scale deployment/fleet-api --replicas=0 -n fleet-management

# Update image
kubectl set image deployment/fleet-api \
  fleet-api=fleetappregistry.azurecr.io/fleet-api:v20251120-production-ready \
  -n fleet-management

# Scale back up
kubectl scale deployment/fleet-api --replicas=3 -n fleet-management
```

---

## VERIFICATION CHECKLIST

After rollback, verify these items:

- [ ] **API Pods Running:** All 3 replicas in Running state
  ```bash
  kubectl get pods -n fleet-management -l app=fleet-api
  ```

- [ ] **Health Check Passing:** API returns 200 OK
  ```bash
  kubectl exec -n fleet-management deployment/fleet-api -- wget -qO- http://localhost:3001/api/v1/health
  ```

- [ ] **No Error Logs:** Check for errors in recent logs
  ```bash
  kubectl logs -n fleet-management -l app=fleet-api --tail=100 | grep -i error
  ```

- [ ] **Frontend Loading:** Web UI loads without white screen
  ```bash
  curl -I https://fleet.capitaltechalliance.com
  ```

- [ ] **Database Connection:** API can connect to database
  ```bash
  kubectl logs -n fleet-management -l app=fleet-api --tail=100 | grep -i "database\|postgres"
  ```

- [ ] **Authentication Working:** SSO login flow works
  ```bash
  curl -I https://fleet.capitaltechalliance.com/api/v1/auth/microsoft
  ```

- [ ] **Ingress Routing:** Traffic reaches the services
  ```bash
  kubectl get ingress -n fleet-management
  ```

---

## TROUBLESHOOTING

### If Pods Won't Start
```bash
# Check pod events
kubectl describe pod -n fleet-management -l app=fleet-api

# Check for image pull errors
kubectl get events -n fleet-management --sort-by='.lastTimestamp' | grep -i pull

# Verify ACR access
az acr login --name fleetappregistry
```

### If Health Checks Fail
```bash
# Check readiness/liveness probes
kubectl describe deployment fleet-api -n fleet-management | grep -A10 "Liveness\|Readiness"

# Temporarily disable probes (emergency only)
kubectl patch deployment fleet-api -n fleet-management --type='json' \
  -p='[{"op": "remove", "path": "/spec/template/spec/containers/0/livenessProbe"}]'
```

### If Database Connection Fails
```bash
# Check database pod status
kubectl get pods -n fleet-management | grep postgres

# Check database service
kubectl get svc -n fleet-management | grep postgres

# Test database connectivity from API pod
kubectl exec -n fleet-management deployment/fleet-api -- nc -zv fleet-postgres-service 5432
```

---

## CONTACT INFORMATION

**On-Call Engineer:** Andrew Morton
**Azure Subscription:** Azure subscription 1 (`021415c2-2f52-4a73-ae77-f8363165a5e1`)
**Tenant ID:** `0ec14b81-7b82-45ee-8f3d-cbc31ced5347`

---

## ROLLBACK DECISION MATRIX

| Scenario | Recommended Action | Image To Use |
|----------|-------------------|--------------|
| API not starting | Use Option 1 | `v20251120-production-ready` |
| Frontend white screen | Use Option 1 | `v20251120-production-ready` |
| Database errors | Use Option 3 | `v5.0-production` |
| SSO not working | Use Option 4 | `v3.1-sso` (from staging) |
| Complete failure | Use automated script | `emergency-rollback.sh` |

---

## NOTES

1. **Current Issue:** API is scaled to 0 replicas, causing 502/504 errors
2. **Root Cause:** Recent deployments may have incompatible changes
3. **Safe Images:** All images listed above are verified in ACR and tested
4. **Git State:** Current branch is `stage-a/requirements-inception`, 17 commits ahead of last stable
5. **Rollback Window:** Estimated 2-5 minutes for complete rollback

---

## POST-ROLLBACK ACTIONS

After successful rollback:

1. **Document the incident:** Create incident report
2. **Notify stakeholders:** Inform team of rollback
3. **Analyze root cause:** Review changes that caused failure
4. **Update deployment process:** Add safety checks
5. **Test fixes in staging:** Before next production deployment

---

## EMERGENCY CONTACTS

- **Azure Support:** Available via Azure Portal
- **ACR:** `fleetappregistry.azurecr.io`
- **AKS Cluster:** `fleet-aks-cluster`
- **Resource Group:** `fleet-production-rg`
- **Region:** East US 2
