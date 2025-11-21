# Kubernetes Network Policies for Fleet Management

This directory contains network policies that implement network segmentation to prevent lateral movement within the Kubernetes cluster.

## Overview

These policies implement a **zero-trust networking model** where:
- All traffic is denied by default
- Only explicitly allowed traffic can flow
- Lateral movement between services is blocked
- External access is limited to HTTPS (443) only

## Policies

| Policy | Description | Security Function |
|--------|-------------|-------------------|
| `default-deny.yaml` | Blocks all ingress and egress by default | Foundation of zero-trust |
| `allow-dns.yaml` | Allows DNS resolution (UDP/TCP 53) | Required for service discovery |
| `api-to-database.yaml` | API to PostgreSQL (5432) | Database access control |
| `api-to-redis.yaml` | API to Redis (6379) | Cache access control |
| `api-external-egress.yaml` | API to external HTTPS services | External API access (Mapbox, MS Graph) |
| `allow-ingress-to-api.yaml` | Ingress controller to API | External traffic to API |
| `allow-ingress-to-frontend.yaml` | Ingress controller to Frontend | External traffic to frontend |
| `frontend-to-api.yaml` | Frontend to API communication | Internal frontend-backend traffic |
| `allow-database-ingress.yaml` | Restricts DB access to API only | Database protection |
| `allow-redis-ingress.yaml` | Restricts Redis access to API only | Cache protection |
| `allow-monitoring.yaml` | Prometheus metrics scraping | Observability |

## Traffic Flow Diagram

```
                                   [EXTERNAL]
                                       |
                                       v
                              [Ingress Controller]
                                    /    \
                                   v      v
                          [Frontend]  [API Service]
                               |           |
                               v           v
                        (frontend-to-api)  |
                               |           |
                               v           +---> [PostgreSQL] (port 5432)
                           [API Pod]       |
                               |           +---> [Redis] (port 6379)
                               |
                               +---> [External Services] (port 443)
                                     - Mapbox API
                                     - Microsoft Graph
                                     - Azure Services
```

## Quick Start

### Apply All Policies

```bash
# Apply all network policies
kubectl apply -f k8s/network-policies/

# Or apply to a specific namespace
kubectl apply -f k8s/network-policies/ -n ctafleet
```

### Verify Policies

```bash
# List all network policies
kubectl get networkpolicies -n ctafleet

# Describe a specific policy
kubectl describe networkpolicy default-deny-all -n ctafleet
```

### Test Connectivity

```bash
# Run the connectivity test script
./k8s/network-policies/test-connectivity.sh ctafleet
```

## Testing Commands

### Test API to Database (Should Work)

```bash
kubectl exec -it $(kubectl get pod -n ctafleet -l component=api -o jsonpath='{.items[0].metadata.name}') -n ctafleet -- nc -zv postgres-service 5432
```

### Test API to Redis (Should Work)

```bash
kubectl exec -it $(kubectl get pod -n ctafleet -l component=api -o jsonpath='{.items[0].metadata.name}') -n ctafleet -- nc -zv redis-service 6379
```

### Test Frontend to Database (Should FAIL - Lateral Movement Block)

```bash
kubectl exec -it $(kubectl get pod -n ctafleet -l component=frontend -o jsonpath='{.items[0].metadata.name}') -n ctafleet -- nc -zv postgres-service 5432
```

### Test DNS Resolution

```bash
kubectl exec -it $(kubectl get pod -n ctafleet -l component=api -o jsonpath='{.items[0].metadata.name}') -n ctafleet -- nslookup kubernetes.default.svc.cluster.local
```

## Security Benefits

1. **Lateral Movement Prevention**: Compromised frontend pods cannot directly access the database
2. **Least Privilege**: Each service only has access to what it needs
3. **External Access Control**: Only HTTPS traffic to external services is allowed
4. **Audit Trail**: Network policies provide clear documentation of allowed traffic
5. **Defense in Depth**: Works alongside other security controls (RBAC, Pod Security, etc.)

## Compliance

These network policies help meet requirements for:
- **SOC 2** - Access Control (CC6.1)
- **NIST 800-53** - SC-7 (Boundary Protection)
- **CIS Kubernetes Benchmark** - Network Policy controls

## Namespaces

Policies are applied to the following namespaces:
- `fleet-management` - Primary production namespace
- `ctafleet` - Legacy/compatibility namespace
- `ctafleet-staging` - Staging environment

## Troubleshooting

### Pods Cannot Communicate

1. Check if network policies are applied:
   ```bash
   kubectl get networkpolicies -n ctafleet
   ```

2. Check pod labels match policy selectors:
   ```bash
   kubectl get pods -n ctafleet --show-labels
   ```

3. Check if the allow policy exists for the traffic:
   ```bash
   kubectl describe networkpolicy <policy-name> -n ctafleet
   ```

### DNS Resolution Fails

Ensure the `allow-dns.yaml` policy is applied and the kube-dns pods have the correct labels:

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

### External HTTPS Fails

Check that the `api-external-egress.yaml` policy is applied and the pod can resolve external DNS:

```bash
kubectl exec -it <pod> -- nslookup graph.microsoft.com
kubectl exec -it <pod> -- nc -zv graph.microsoft.com 443
```

## Maintenance

When adding new services:

1. Create an egress policy for the new service to reach its dependencies
2. Create an ingress policy on the target service to allow traffic from the new service
3. Test connectivity before deploying to production
4. Document the new traffic flow in this README
