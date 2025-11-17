# Fleet Management - Infrastructure Analysis & Cleanup Recommendations

**Date:** 2025-11-12
**Analysis by:** Claude Code
**Context:** Resource group consolidation and cleanup

---

## 🎯 Executive Summary

**Current State:**
- **6 Resource Groups** discovered (3 pairs of duplicates)
- **1 AKS Cluster** running all environments as namespaces
- **Multiple Key Vaults** scattered across resource groups
- **Duplicate infrastructure** causing confusion and potential cost waste

**Recommendation:** Consolidate from 6 resource groups down to **1 primary resource group** (`fleet-production-rg`)

**Estimated Savings:** Consolidation will eliminate redundant Key Vaults and simplify management

---

## 📊 Current Infrastructure Inventory

### Resource Group 1: `fleet-production-rg` ⭐ **PRIMARY - KEEP THIS**
**Location:** East US 2
**Purpose:** Main production infrastructure
**Status:** ✅ **Active - All workloads run here**

**Resources (19 total):**

| Resource Name | Type | Purpose | Status |
|---------------|------|---------|--------|
| `fleet-aks-cluster` | Kubernetes Cluster | **Hosts ALL environments** | ✅ Active |
| `fleetappregistry` | Container Registry | Stores all Docker images | ✅ Active |
| `fleet-app` | Static Web App | Frontend hosting (legacy?) | ⚠️ Review |
| `fleet-maps-prod` | Azure Maps Account | Mapping services | ✅ Active |
| `fleet-management-insights` | Application Insights | Monitoring/telemetry | ✅ Active |
| `capitaltechalliance-ip` | Public IP Address | Load balancer IP 1 | ✅ Active |
| `capitaltechalliance-ip-1` | Public IP Address | Load balancer IP 2 | ✅ Active |
| `fleet-critical-alerts` | Action Group | Alert notifications | ✅ Active |
| `fleet-database-failures` | Alert Rule | Database monitoring | ✅ Active |
| `fleet-no-requests` | Alert Rule | Request monitoring | ✅ Active |
| `fleet-authentication-failures` | Alert Rule | Auth monitoring | ✅ Active |
| `fleet-slow-response-time` | Alert Rule | Performance monitoring | ✅ Active |
| `fleet-high-error-rate` | Alert Rule | Error monitoring | ✅ Active |
| `fleet-automation` | Automation Account | Runbooks/automation | ✅ Active |
| `capitaltechhub-afd-standard` | Front Door Profile | CDN/WAF | ⚠️ Review |
| `capitaltechhub-afd-standard/endpoint` | Front Door Endpoint | CDN endpoint | ⚠️ Review |
| `fleetmgmtstorage2025` | Storage Account | Backups/data storage | ✅ Active |
| `fleet-secrets-0d326d71` | Key Vault | Secrets management | ✅ Active |
| Smart Detection Action Group | Built-in monitoring | Auto-created | ✅ Active |

**AKS Cluster Details:**
```
Name: fleet-aks-cluster
Namespaces:
  - fleet-management (Production)
  - fleet-management-staging (Staging)
  - fleet-management-dev (Dev)
```

---

### Resource Group 2: `fleet-app-production-rg` ❌ **EMPTY - CANDIDATE FOR DELETION**
**Location:** East US 2
**Purpose:** Unknown - appears unused
**Status:** ⚠️ **Empty - No resources found**

**Recommendation:** **DELETE** - This resource group contains no resources and serves no purpose.

---

### Resource Group 3: `fleet-staging-rg` ⚠️ **MINIMAL - CANDIDATE FOR CONSOLIDATION**
**Location:** East US 2
**Purpose:** Staging Key Vault (if used)
**Status:** ⚠️ **Contains only Key Vault**

**Resources:**
- `fleet-staging-5e7dd5b7` - Key Vault

**Current Usage:** Unclear - staging environment runs in `fleet-production-rg` AKS cluster namespace
**Recommendation:** Migrate secrets to main Key Vault in `fleet-production-rg`, then **DELETE** resource group

---

### Resource Group 4: `fleet-app-staging-rg` ❌ **EMPTY - CANDIDATE FOR DELETION**
**Location:** East US 2
**Purpose:** Unknown - appears unused
**Status:** ⚠️ **Empty - No resources found**

**Recommendation:** **DELETE** - This resource group contains no resources.

---

### Resource Group 5: `fleet-dev-rg` ⚠️ **MINIMAL - CANDIDATE FOR CONSOLIDATION**
**Location:** East US 2
**Purpose:** Dev Key Vault
**Status:** ⚠️ **Contains only Key Vault**

**Resources:**
- `fleet-secrets-dev-437bc9` - Key Vault

**Current Usage:** Dev environment runs in `fleet-production-rg` AKS cluster namespace
**Recommendation:** Migrate secrets to main Key Vault in `fleet-production-rg`, then **DELETE** resource group

---

### Resource Group 6: `fleet-app-dev-rg` ⚠️ **MINIMAL - CANDIDATE FOR CONSOLIDATION**
**Location:** East US 2
**Purpose:** Additional dev Key Vault
**Status:** ⚠️ **Contains only Key Vault**

**Resources:**
- `fleetapp-dev-f4a70533` - Key Vault

**Current Usage:** Unclear - dev environment uses Kubernetes secrets
**Recommendation:** Migrate any necessary secrets to main Key Vault, then **DELETE** resource group

---

## 🎯 Consolidation Plan

### Phase 1: Audit Key Vaults ⏱️ 1 hour

**Objective:** Identify which Key Vaults are actually used and what secrets they contain

```bash
# Check fleet-staging Key Vault
az keyvault secret list --vault-name fleet-staging-5e7dd5b7 --query "[].name" -o table

# Check fleet-dev Key Vault
az keyvault secret list --vault-name fleet-secrets-dev-437bc9 --query "[].name" -o table

# Check fleet-app-dev Key Vault
az keyvault secret list --vault-name fleetapp-dev-f4a70533 --query "[].name" -o table

# Check main production Key Vault
az keyvault secret list --vault-name fleet-secrets-0d326d71 --query "[].name" -o table
```

**Expected Outcome:**
- List of all secrets across all Key Vaults
- Identification of duplicates
- Identification of unused secrets

---

### Phase 2: Migrate Secrets to Main Key Vault ⏱️ 2 hours

**Objective:** Consolidate all necessary secrets into `fleet-secrets-0d326d71` in `fleet-production-rg`

**Process:**

1. **Create namespace-specific secrets in main Key Vault:**
```bash
# Example: Migrate staging secrets
for secret in $(az keyvault secret list --vault-name fleet-staging-5e7dd5b7 --query "[].name" -o tsv); do
  value=$(az keyvault secret show --vault-name fleet-staging-5e7dd5b7 --name $secret --query "value" -o tsv)
  az keyvault secret set --vault-name fleet-secrets-0d326d71 --name "staging-$secret" --value "$value"
done

# Example: Migrate dev secrets
for secret in $(az keyvault secret list --vault-name fleet-secrets-dev-437bc9 --query "[].name" -o tsv); do
  value=$(az keyvault secret show --vault-name fleet-secrets-dev-437bc9 --name $secret --query "value" -o tsv)
  az keyvault secret set --vault-name fleet-secrets-0d326d71 --name "dev-$secret" --value "$value"
done
```

2. **Update Kubernetes to use consolidated Key Vault:**
   - Update External Secrets Operator (if used)
   - Update any Key Vault references in deployment manifests
   - Test secret retrieval in each namespace

---

### Phase 3: Validate Environments ⏱️ 1 hour

**Objective:** Ensure all environments work with consolidated Key Vault

```bash
# Test production
kubectl get pods -n fleet-management -o wide
kubectl logs -n fleet-management -l app=fleet-api --tail=20

# Test staging
kubectl get pods -n fleet-management-staging -o wide
kubectl logs -n fleet-management-staging -l app=fleet-api --tail=20

# Test dev
kubectl get pods -n fleet-management-dev -o wide
kubectl logs -n fleet-management-dev -l app=fleet-api --tail=20
```

**Success Criteria:**
- All pods running healthy
- No secret-related errors in logs
- Applications can access necessary secrets

---

### Phase 4: Delete Empty/Redundant Resource Groups ⏱️ 30 minutes

**Objective:** Clean up unused resource groups

**⚠️ CRITICAL: Back up Key Vault secrets before deletion!**

```bash
# Backup staging Key Vault (if needed)
az keyvault secret list --vault-name fleet-staging-5e7dd5b7 --query "[].{name:name,value:value}" -o json > /tmp/staging-kv-backup.json

# Backup dev Key Vaults (if needed)
az keyvault secret list --vault-name fleet-secrets-dev-437bc9 --query "[].{name:name,value:value}" -o json > /tmp/dev-kv-backup.json
az keyvault secret list --vault-name fleetapp-dev-f4a70533 --query "[].{name:name,value:value}" -o json > /tmp/app-dev-kv-backup.json
```

**After validation and backup:**

```bash
# Delete empty resource groups
az group delete --name fleet-app-production-rg --yes --no-wait
az group delete --name fleet-app-staging-rg --yes --no-wait

# Delete resource groups with only Key Vaults (after migration)
az group delete --name fleet-staging-rg --yes --no-wait
az group delete --name fleet-dev-rg --yes --no-wait
az group delete --name fleet-app-dev-rg --yes --no-wait
```

---

## 📋 Final Desired State

### After Consolidation

**Resource Groups:** 1
**AKS Clusters:** 1
**Key Vaults:** 1 (consolidated)

```
fleet-production-rg (East US 2)
├── fleet-aks-cluster (Kubernetes)
│   ├── Namespace: fleet-management (Production)
│   ├── Namespace: fleet-management-staging (Staging)
│   └── Namespace: fleet-management-dev (Dev)
├── fleetappregistry (Container Registry)
├── fleet-secrets-0d326d71 (Key Vault)
│   ├── Secrets for production
│   ├── Secrets for staging (prefixed: staging-*)
│   └── Secrets for dev (prefixed: dev-*)
├── fleet-management-insights (Application Insights)
├── fleetmgmtstorage2025 (Storage)
├── fleet-maps-prod (Azure Maps)
├── Public IPs, Alerts, Automation, etc.
└── (All existing resources maintained)
```

---

## 💰 Cost Impact Analysis

### Current Monthly Costs (Estimated)

| Resource | Quantity | Est. Cost/Month |
|----------|----------|-----------------|
| Key Vaults | 4 | 4 × $1.00 = $4.00 |
| Resource Groups | 6 | No direct cost |
| Empty RGs (overhead) | 3 | Management overhead |

### After Consolidation

| Resource | Quantity | Est. Cost/Month |
|----------|----------|-----------------|
| Key Vaults | 1 | $1.00 |
| Resource Groups | 1 | No direct cost |

**Direct Savings:** ~$3.00/month (minimal)
**Indirect Benefits:**
- Simplified management
- Reduced confusion
- Faster troubleshooting
- Single source of truth for secrets
- Reduced audit surface area

---

## ⚠️ Risks & Mitigation

### Risk 1: Secret Dependencies
**Risk:** Applications may have hard-coded Key Vault references
**Mitigation:**
- Audit all Kubernetes manifests for Key Vault references
- Search codebase for Key Vault URLs: `grep -r "vault.azure.net" .`
- Test thoroughly in dev before staging/production

### Risk 2: Data Loss
**Risk:** Deleting Key Vaults could lose critical secrets
**Mitigation:**
- **Backup all Key Vault secrets to JSON files**
- Enable soft-delete on Key Vaults (already enabled by default)
- Keep backups for 90 days minimum

### Risk 3: Downtime
**Risk:** Migration could cause service interruption
**Mitigation:**
- Perform migration during maintenance window
- Migrate dev → staging → production order
- Keep old Key Vaults accessible until fully validated

---

## ✅ Validation Checklist

Before deleting any resource group:

- [ ] All secrets backed up to secure location
- [ ] All secrets migrated to consolidated Key Vault
- [ ] Dev environment tested and validated
- [ ] Staging environment tested and validated
- [ ] Production environment not affected
- [ ] No Kubernetes secret errors in logs
- [ ] All applications functioning correctly
- [ ] Database connections working
- [ ] Azure AD authentication working
- [ ] External integrations working
- [ ] Backups retained for 90 days

---

## 🔄 Rollback Plan

If issues arise:

```bash
# Restore secrets from backup
cat /tmp/staging-kv-backup.json | jq -r '.[] | "\(.name) \(.value)"' | while read name value; do
  az keyvault secret set --vault-name fleet-staging-5e7dd5b7 --name "$name" --value "$value"
done

# Recover deleted resource group (within 90 days if soft-delete enabled)
az group show --name fleet-staging-rg-deleted --query "properties.provisioningState"
```

---

## 📌 Recommendations Summary

### Immediate Actions (High Priority)

1. ✅ **Keep `fleet-production-rg`** - This is your primary infrastructure
2. ❌ **Delete `fleet-app-production-rg`** - Empty, no resources
3. ❌ **Delete `fleet-app-staging-rg`** - Empty, no resources

### Medium-Term Actions (Within 1 Week)

4. 🔄 **Audit and migrate `fleet-staging-rg` Key Vault** → Consolidate to main Key Vault
5. 🔄 **Audit and migrate `fleet-dev-rg` Key Vault** → Consolidate to main Key Vault
6. 🔄 **Audit and migrate `fleet-app-dev-rg` Key Vault** → Consolidate to main Key Vault
7. ❌ **Delete resource groups 4, 5, 6 after migration complete**

### Governance Changes

8. 📝 **Update naming conventions** - Use single resource group for all environments
9. 📝 **Update deployment scripts** - Reference consolidated Key Vault only
10. 📝 **Document Key Vault secret naming** - Use prefixes: `prod-*`, `staging-*`, `dev-*`

---

## 🎓 Lessons Learned

### Why This Happened

- Multiple deployment attempts likely created duplicate resource groups
- Lack of centralized infrastructure-as-code (IaC)
- No governance policy preventing duplicate resource groups
- Different deployment methods (Portal, CLI, scripts)

### Prevent Future Duplication

1. **Use Terraform or Bicep** for infrastructure deployment
2. **Implement naming conventions** and enforce with Azure Policy
3. **Tag all resources** with environment, owner, purpose
4. **Regular audits** of resource groups (monthly review)
5. **Lock critical resource groups** to prevent accidental changes

---

## 📞 Support & Next Steps

**Next Immediate Action Required:**

Before proceeding with consolidation, you must complete the **Azure AD authentication fix** from the previous issue:

1. Navigate to Azure Portal → Azure Active Directory
2. Find App Registration: `80fe6628-1dc4-41fe-894f-919b12ecc994`
3. Add redirect URIs:
   - `http://48.211.228.97/api/auth/microsoft/callback` (dev)
   - `http://20.161.88.59/api/auth/microsoft/callback` (staging)
4. Test authentication in dev and staging

**Then proceed with infrastructure consolidation using this guide.**

---

**Questions or concerns?** Review this document and the consolidation plan before executing.

**Estimated Total Time:** 4-5 hours including testing
**Recommended Schedule:** Weekend or planned maintenance window

