# Kubernetes RBAC Security Audit Report

## Overview

This document details the RBAC (Role-Based Access Control) security configuration for the Fleet Management Kubernetes deployment. All configurations follow the principle of least privilege.

## Security Principles Applied

1. **resourceNames Restriction**: All secret access is restricted to specific named secrets
2. **Minimal Verbs**: Only `get` verb is allowed for secrets (no `list`, `watch`, `create`, `update`, `delete`)
3. **Namespace-Scoped Roles**: Using `Role` instead of `ClusterRole` where possible
4. **Disabled Token Mounting**: `automountServiceAccountToken: false` prevents automatic API access
5. **No Vendor Secret Access**: External vendors have no access to secrets

---

## Service Accounts Summary

| Service Account | Namespace | automountServiceAccountToken | Purpose |
|-----------------|-----------|------------------------------|---------|
| fleet-api | fleet-management | false | Main API application |
| fleet-api | ctafleet | false | API in ctafleet namespace |
| fleet-azure-ad-reader | fleet-management | false | Azure AD authentication |
| vendor-developer | fleet-dev | false | External vendor (dev) |
| vendor-developer | fleet-staging | false | External vendor (staging) |

---

## RBAC Configuration Details

### 1. Azure AD Secret Access (azure-ad-secret-role.yaml)

**ServiceAccount**: `fleet-azure-ad-reader`
**Namespace**: `fleet-management`

**Permissions**:
```yaml
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["azure-ad-secret"]  # ONLY this specific secret
  verbs: ["get"]                       # NO list/watch/create/update/delete
```

**Security Features**:
- Restricted to single named secret
- Only read access (get)
- Token mounting disabled

---

### 2. Fleet API RBAC (fleet-api-rbac.yaml)

**ServiceAccount**: `fleet-api`
**Namespaces**: `fleet-management`, `ctafleet`

**Secret Access**:
```yaml
rules:
# Each secret explicitly named - no blanket access
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["fleet-database-secrets"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["fleet-app-secrets"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["fleet-redis-secrets"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["fleet-storage-secrets"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["fleet-secrets"]  # Legacy - remove after migration
  verbs: ["get"]
```

**ConfigMap Access**:
```yaml
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["fleet-config", "fleet-api-config"]
  verbs: ["get"]
```

---

### 3. Vendor Access (deployment/vendor-access/)

**ServiceAccount**: `vendor-developer`
**Namespaces**: `fleet-dev`, `fleet-staging`

**IMPORTANT**: Vendors have NO access to secrets

**Development Permissions** (fleet-dev):
- Pods: get, list, watch, create, delete
- Deployments: full CRUD
- Services: full CRUD
- ConfigMaps: full CRUD
- **Secrets: NONE**
- Ingress: full CRUD
- Jobs/CronJobs: full CRUD
- PVCs: read-only
- Events: read-only

**Staging Permissions** (fleet-staging):
- More restrictive than development
- Pods: read-only + logs
- Deployments: read + patch only
- ConfigMaps: read-only
- **Secrets: NONE**
- Jobs: read + create
- Events: read-only

---

## Audit Commands

### List secrets accessible to service account

```bash
# Check fleet-api permissions
kubectl auth can-i --as=system:serviceaccount:fleet-management:fleet-api \
  --list | grep secrets

# Check specific secret access
kubectl auth can-i get secrets/fleet-database-secrets \
  --as=system:serviceaccount:fleet-management:fleet-api \
  -n fleet-management

# Verify NO list permission
kubectl auth can-i list secrets \
  --as=system:serviceaccount:fleet-management:fleet-api \
  -n fleet-management
# Should return "no"
```

### List all RoleBindings for secrets

```bash
kubectl get rolebindings,clusterrolebindings -A -o wide | grep secret
```

### Verify vendor has no secret access

```bash
kubectl auth can-i get secrets \
  --as=system:serviceaccount:fleet-dev:vendor-developer \
  -n fleet-dev
# Should return "no"
```

---

## Files Modified

| File | Change |
|------|--------|
| `k8s/azure-ad-secret-role.yaml` | Set `automountServiceAccountToken: false` |
| `k8s/fleet-api-rbac.yaml` | **NEW** - Comprehensive RBAC for fleet-api |
| `k8s/api-deployment.yaml` | Updated ServiceAccount with `automountServiceAccountToken: false` |
| `deployment/vendor-access/rbac-serviceaccount.yaml` | Set `automountServiceAccountToken: false` |

---

## Acceptance Criteria Checklist

- [x] No Role/ClusterRole with blanket secret access
- [x] All secret access uses resourceNames
- [x] Service accounts have minimal permissions
- [x] automountServiceAccountToken: false where possible
- [x] Documentation of required permissions (this document)

---

## Migration Notes

### Legacy `fleet-secrets` Secret

The `fleet-secrets` secret is included for backward compatibility during migration. Once the application is updated to use individual secrets (`fleet-database-secrets`, `fleet-app-secrets`, etc.), remove this rule:

```yaml
# REMOVE after migration
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["fleet-secrets"]
  verbs: ["get"]
```

### Deployment Checklist

1. Apply RBAC configurations first:
   ```bash
   kubectl apply -f k8s/fleet-api-rbac.yaml
   kubectl apply -f k8s/azure-ad-secret-role.yaml
   ```

2. Verify permissions:
   ```bash
   kubectl auth can-i get secrets/fleet-secrets \
     --as=system:serviceaccount:ctafleet:fleet-api -n ctafleet
   ```

3. Deploy updated application:
   ```bash
   kubectl apply -f k8s/api-deployment.yaml
   ```

4. Verify pod is running with correct service account:
   ```bash
   kubectl get pod -n ctafleet -o jsonpath='{.items[*].spec.serviceAccountName}'
   ```

---

## Security Recommendations

1. **Regular Audits**: Run `kubectl auth can-i --list` periodically for all service accounts
2. **Monitor RBAC Changes**: Use audit logging to detect RBAC modifications
3. **Rotate Secrets**: Implement secret rotation using External Secrets Operator
4. **Network Policies**: Combine RBAC with NetworkPolicies for defense in depth
5. **Pod Security Standards**: Enforce restricted pod security standards

---

*Generated: 2024*
*Last Reviewed: See git history*
