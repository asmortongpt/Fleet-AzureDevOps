# Kubernetes Security Hardening Documentation

This document outlines the comprehensive security measures implemented in the Fleet Management Kubernetes deployment.

## Table of Contents
1. [RBAC Security](#rbac-security)
2. [Pod Security](#pod-security)
3. [Network Security](#network-security)
4. [Resource Management](#resource-management)
5. [Application Security](#application-security)
6. [Deployment Instructions](#deployment-instructions)

---

## 1. RBAC Security

### Vendor Access Restrictions

**Issue**: Vendor developers had read access to Kubernetes secrets, exposing sensitive credentials.

**Resolution**:
- Removed secrets read access from both dev and staging vendor RBAC roles
- Files modified:
  - `/deployment/vendor-access/rbac-role-staging.yaml`
  - `/deployment/vendor-access/rbac-role-dev.yaml`

**Current Permissions**:
- **Staging**: Read-only access to pods, deployments, services, configmaps, ingress; Limited write access to deployments (for image updates); Job creation for testing
- **Dev**: Full access to most resources except secrets and PVCs

**Alternative for Vendors**:
- Use Sealed Secrets or External Secrets Operator for vendor-facing configurations
- Non-sensitive test credentials should be stored in ConfigMaps for dev environment

---

## 2. Pod Security

### Read-Only Root Filesystem

**Implementation**: All production pods now run with `readOnlyRootFilesystem: true`

**Modified Files**:
- `/deployment/kubernetes/redis.yaml`
- `/deployment/kubernetes/postgres.yaml`
- `/deployment/kubernetes/deployment.yaml`

**Writable Paths** (using emptyDir volumes):

**Fleet App**:
- `/tmp` - Temporary files
- `/app/.cache` - Application cache
- `/app/.npm` - NPM cache

**Redis**:
- `/data` - Persistent data (PVC)
- `/tmp` - Temporary files
- `/run` - Runtime files

**PostgreSQL**:
- `/var/lib/postgresql/data` - Database data (PVC)
- `/tmp` - Temporary files
- `/var/run/postgresql` - PostgreSQL runtime files

### Security Context Settings

All pods enforce:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: <non-root-uid>
  fsGroup: <group-id>
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

### Pod Security Standards

**Namespace Labels Applied**:

**Production & Staging** (`fleet-management`, `fleet-staging`):
```yaml
pod-security.kubernetes.io/enforce: restricted
pod-security.kubernetes.io/audit: restricted
pod-security.kubernetes.io/warn: restricted
```

**Development** (`fleet-dev`):
```yaml
pod-security.kubernetes.io/enforce: baseline
pod-security.kubernetes.io/audit: restricted
pod-security.kubernetes.io/warn: restricted
```

Development uses `baseline` enforcement for flexibility during testing while maintaining audit/warn at `restricted`.

---

## 3. Network Security

### Network Policies

**Location**: `/deployment/kubernetes/network-policies.yaml`

#### Default Deny Policies

All namespaces have default deny-all policies for both ingress and egress traffic. Communication must be explicitly allowed.

#### Allowed Traffic Patterns

**Production (fleet-management)**:

1. **Ingress Controller → Fleet App**
   - Port: 3000 (HTTP)
   - From: ingress-nginx namespace

2. **Fleet App → PostgreSQL**
   - Port: 5432
   - Internal pod-to-pod

3. **Fleet App → Redis**
   - Port: 6379
   - Internal pod-to-pod

4. **Fleet App → External Services**
   - Ports: 80, 443 (HTTP/HTTPS)
   - DNS: Port 53 (UDP)

5. **Monitoring → Fleet App**
   - Port: 9090 (Prometheus metrics)
   - From: monitoring namespace

**Staging & Dev**: Same policies with namespace-specific configurations

### Redis Security Hardening

**File**: `/deployment/kubernetes/redis.yaml`

**Dangerous Commands Disabled**:
```
FLUSHDB, FLUSHALL, KEYS, CONFIG, SHUTDOWN,
BGREWRITEAOF, BGSAVE, SAVE, DEBUG
```

**Authentication**:
- Password authentication enforced via `requirepass`
- Password stored in Kubernetes secrets

**Network Binding**:
- Binds to `0.0.0.0` (required for Kubernetes pod-to-pod communication)
- Access restricted via NetworkPolicies, not bind address
- Only Fleet App pods can connect to Redis

---

## 4. Resource Management

### Resource Quotas

**Location**: `/deployment/kubernetes/resource-quotas.yaml`

#### Production (fleet-management)
```yaml
Compute:
  requests.cpu: 20 cores
  requests.memory: 40Gi
  limits.cpu: 40 cores
  limits.memory: 80Gi

Storage:
  requests.storage: 500Gi
  persistentvolumeclaims: 10

Objects:
  pods: 50
  services: 20
  configmaps: 30
  secrets: 30
```

#### Staging (fleet-staging)
50% of production resources

#### Development (fleet-dev)
25% of production resources

### Limit Ranges

**Production Container Defaults**:
```yaml
default:
  cpu: 1 core
  memory: 1Gi
defaultRequest:
  cpu: 500m
  memory: 512Mi
max:
  cpu: 4 cores
  memory: 8Gi
min:
  cpu: 100m
  memory: 128Mi
```

**Purpose**:
- Prevents resource exhaustion
- Ensures fair resource distribution
- Provides default limits for containers without explicit resource requests

---

## 5. Application Security

### Container Images
- Using Alpine-based images for smaller attack surface
- Redis: `redis:7-alpine`
- PostgreSQL: `postgres:15-alpine`
- BusyBox: `busybox:1.35` (for init containers)

### Secrets Management
- All sensitive data stored in Kubernetes Secrets
- Never committed to version control
- Mounted as environment variables
- Access restricted by RBAC

### Health Checks
All pods implement:
- **Liveness probes**: Restart unhealthy containers
- **Readiness probes**: Control traffic routing
- **Startup probes**: Handle slow-starting containers

---

## 6. Deployment Instructions

### Prerequisites
1. Kubernetes cluster (v1.24+)
2. `kubectl` configured with cluster access
3. Cluster admin permissions for initial setup

### Deployment Order

#### Step 1: Create Namespaces
```bash
kubectl apply -f deployment/kubernetes/namespace.yaml
kubectl apply -f deployment/environments/staging/namespace.yaml
kubectl apply -f deployment/environments/dev/namespace.yaml
```

#### Step 2: Apply Resource Quotas and Limit Ranges
```bash
kubectl apply -f deployment/kubernetes/resource-quotas.yaml
```

#### Step 3: Create Secrets (Production)
```bash
# Create secrets file from template (DO NOT COMMIT)
kubectl create secret generic fleet-secrets \
  --from-literal=DB_USERNAME=<db-user> \
  --from-literal=DB_PASSWORD=<db-password> \
  --from-literal=REDIS_PASSWORD=<redis-password> \
  --from-literal=JWT_SECRET=<jwt-secret> \
  --from-literal=ENCRYPTION_KEY=<encryption-key> \
  --from-literal=AZURE_STORAGE_CONNECTION_STRING=<azure-connection> \
  -n fleet-management
```

Repeat for `fleet-staging` and `fleet-dev` namespaces with appropriate values.

#### Step 4: Deploy ConfigMaps
```bash
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/environments/staging/configmap.yaml
kubectl apply -f deployment/environments/dev/configmap.yaml
```

#### Step 5: Deploy Database and Cache
```bash
# Production
kubectl apply -f deployment/kubernetes/postgres.yaml
kubectl apply -f deployment/kubernetes/redis.yaml

# Staging
kubectl apply -f deployment/environments/staging/postgres.yaml
kubectl apply -f deployment/environments/staging/redis.yaml

# Dev
kubectl apply -f deployment/environments/dev/postgres.yaml
kubectl apply -f deployment/environments/dev/redis.yaml
```

#### Step 6: Apply Network Policies
```bash
kubectl apply -f deployment/kubernetes/network-policies.yaml
```

**Important**: Apply network policies after services are running to avoid connectivity issues during deployment.

#### Step 7: Deploy Application
```bash
# Production
kubectl apply -f deployment/kubernetes/deployment.yaml
kubectl apply -f deployment/kubernetes/service.yaml

# Staging
kubectl apply -f deployment/environments/staging/api-deployment.yaml

# Dev
kubectl apply -f deployment/environments/dev/api-deployment.yaml
```

#### Step 8: Configure Ingress
```bash
kubectl apply -f deployment/kubernetes/ingress.yaml
kubectl apply -f deployment/environments/staging/ingress.yaml
kubectl apply -f deployment/environments/dev/ingress.yaml
```

#### Step 9: Set Up Vendor Access (if required)
```bash
kubectl apply -f deployment/vendor-access/rbac-serviceaccount.yaml
kubectl apply -f deployment/vendor-access/rbac-role-staging.yaml
kubectl apply -f deployment/vendor-access/rbac-role-dev.yaml
kubectl apply -f deployment/vendor-access/rbac-rolebinding.yaml
```

### Verification

#### Check Pod Security
```bash
# Verify all pods are running
kubectl get pods -n fleet-management
kubectl get pods -n fleet-staging
kubectl get pods -n fleet-dev

# Check pod security contexts
kubectl get pod <pod-name> -n fleet-management -o jsonpath='{.spec.containers[*].securityContext}'
```

#### Check Network Policies
```bash
# List all network policies
kubectl get networkpolicies -n fleet-management
kubectl get networkpolicies -n fleet-staging
kubectl get networkpolicies -n fleet-dev

# Describe a specific policy
kubectl describe networkpolicy allow-app-to-redis -n fleet-management
```

#### Check Resource Quotas
```bash
# View quota usage
kubectl get resourcequota -n fleet-management
kubectl describe resourcequota fleet-management-quota -n fleet-management
```

#### Test Network Connectivity
```bash
# Test from fleet-app pod to Redis
kubectl exec -it <fleet-app-pod> -n fleet-management -- nc -zv fleet-redis-service 6379

# Test from fleet-app pod to PostgreSQL
kubectl exec -it <fleet-app-pod> -n fleet-management -- nc -zv fleet-postgres-service 5432
```

### Monitoring and Compliance

#### Audit Pod Security
```bash
# Check for pods violating security standards
kubectl get pods -n fleet-management -o json | jq '.items[] | select(.spec.securityContext.runAsNonRoot != true)'
```

#### Monitor Resource Usage
```bash
# View current resource consumption
kubectl top pods -n fleet-management
kubectl top nodes
```

#### Review RBAC Permissions
```bash
# Check vendor permissions in staging
kubectl auth can-i list secrets --as=system:serviceaccount:fleet-staging:vendor-service-account -n fleet-staging

# Should return "no"
```

---

## Security Checklist

- [x] Vendor RBAC roles do not have secrets access
- [x] All pods run with `readOnlyRootFilesystem: true`
- [x] All pods run as non-root users
- [x] All pods drop ALL capabilities
- [x] NetworkPolicies enforce default deny
- [x] Redis dangerous commands disabled
- [x] Redis password authentication enforced
- [x] Resource quotas applied to all namespaces
- [x] Limit ranges prevent resource exhaustion
- [x] Pod Security Standards labels applied to namespaces
- [x] Health checks configured for all services
- [x] Secrets not stored in version control

---

## Maintenance and Updates

### Rotating Secrets
```bash
# Update a secret
kubectl create secret generic fleet-secrets \
  --from-literal=REDIS_PASSWORD=<new-password> \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to use new secret
kubectl rollout restart deployment/fleet-app -n fleet-management
kubectl rollout restart statefulset/fleet-redis -n fleet-management
```

### Updating Network Policies
1. Edit `/deployment/kubernetes/network-policies.yaml`
2. Apply changes: `kubectl apply -f deployment/kubernetes/network-policies.yaml`
3. Test connectivity after changes

### Modifying Resource Quotas
1. Edit `/deployment/kubernetes/resource-quotas.yaml`
2. Apply changes: `kubectl apply -f deployment/kubernetes/resource-quotas.yaml`
3. Verify: `kubectl describe resourcequota -n fleet-management`

---

## Troubleshooting

### Pod Fails to Start After Security Changes

**Symptom**: Pod in CrashLoopBackOff with "Operation not permitted" errors

**Solutions**:
1. Check if the application needs write access to additional paths
2. Add emptyDir volume mounts for writable paths
3. Verify the user ID matches the container's expected user

### Network Policy Blocking Legitimate Traffic

**Symptom**: Connection timeouts between services

**Solutions**:
1. Check NetworkPolicy logs: `kubectl describe networkpolicy <policy-name>`
2. Verify pod labels match NetworkPolicy selectors
3. Temporarily remove the policy to confirm it's the issue
4. Update the policy to allow the required traffic

### Resource Quota Exceeded

**Symptom**: "forbidden: exceeded quota" errors

**Solutions**:
1. Check current usage: `kubectl describe resourcequota -n <namespace>`
2. Scale down non-essential workloads
3. Request quota increase if legitimate need exists

---

## References

- [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Redis Security Best Practices](https://redis.io/docs/management/security/)

---

## Contact

For security concerns or questions, please contact the security team at security@fleetmanagement.com
