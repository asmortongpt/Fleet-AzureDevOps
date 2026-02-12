# Backend Helm Chart

Complete production-ready Helm chart for deploying backend applications with PostgreSQL and Redis.

## Features

✅ **Highly Available** - 3+ replicas with pod anti-affinity
✅ **Auto-scaling** - HPA based on CPU/memory
✅ **Health Checks** - Liveness and readiness probes
✅ **Security** - Non-root user, read-only filesystem, network policies
✅ **Monitoring** - Prometheus metrics support
✅ **TLS/SSL** - Automatic certificate management with cert-manager
✅ **Dependencies** - Bundled PostgreSQL and Redis charts

## Prerequisites

- Kubernetes 1.23+
- Helm 3.0+
- Ingress Controller (nginx)
- Cert-manager (optional, for TLS)

## Installation

### Quick Start

```bash
# Install with default values
helm install my-backend ./backend-chart

# Install with custom values
helm install my-backend ./backend-chart \
  --set image.repository=myregistry/backend \
  --set image.tag=v1.0.0 \
  --set ingress.hosts[0].host=api.example.com
```

### Production Deployment

```bash
# Create values file for production
cat > values-prod.yaml <<EOF
replicaCount: 5

image:
  repository: myregistry/backend
  tag: v1.0.0
  pullPolicy: IfNotPresent

ingress:
  enabled: true
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: backend-tls
      hosts:
        - api.example.com

resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20

postgresql:
  primary:
    persistence:
      size: 100Gi
    resources:
      requests:
        memory: "1Gi"
        cpu: "1000m"
      limits:
        memory: "2Gi"
        cpu: "2000m"
EOF

# Deploy to production
helm install my-backend ./backend-chart \
  --namespace production \
  --create-namespace \
  -f values-prod.yaml
```

## Configuration

### Image Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Docker image repository | `myregistry/backend` |
| `image.tag` | Docker image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Scaling

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `3` |
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `3` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |

### Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class | `nginx` |
| `ingress.hosts[0].host` | Hostname | `api.example.com` |
| `ingress.tls[0].secretName` | TLS secret name | `backend-tls` |

### PostgreSQL

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `postgresql.auth.username` | Database user | `postgres` |
| `postgresql.auth.database` | Database name | `app_db` |
| `postgresql.primary.persistence.size` | Storage size | `20Gi` |

### Redis

| Parameter | Description | Default |
|-----------|-------------|---------|
| `redis.enabled` | Enable Redis | `true` |
| `redis.master.persistence.size` | Storage size | `5Gi` |

## Upgrading

```bash
# Upgrade to new version
helm upgrade my-backend ./backend-chart \
  --set image.tag=v1.1.0 \
  --reuse-values

# Upgrade with new values file
helm upgrade my-backend ./backend-chart \
  -f values-prod.yaml
```

## Rollback

```bash
# View release history
helm history my-backend

# Rollback to previous version
helm rollback my-backend

# Rollback to specific revision
helm rollback my-backend 3
```

## Uninstallation

```bash
# Uninstall release
helm uninstall my-backend

# Uninstall and delete PVCs
helm uninstall my-backend
kubectl delete pvc -l app.kubernetes.io/instance=my-backend
```

## Monitoring

The chart exposes Prometheus metrics on `/metrics` endpoint. To enable ServiceMonitor:

```yaml
monitoring:
  serviceMonitor:
    enabled: true
    interval: 30s
```

## Security Best Practices

✅ **Non-root user** - Runs as UID 1001
✅ **Read-only filesystem** - Prevents write access except /tmp
✅ **Drop capabilities** - Minimal Linux capabilities
✅ **Network policies** - Restricts pod-to-pod communication
✅ **Resource limits** - Prevents resource exhaustion
✅ **Secret management** - Use external-secrets operator in production

## Troubleshooting

### Pods not starting

```bash
kubectl get pods -n production
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production
```

### Database connection issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql postgresql://postgres:postgres@my-backend-postgresql:5432/app_db
```

### Ingress not working

```bash
kubectl get ingress -n production
kubectl describe ingress my-backend -n production
```

## Support

For issues and questions, contact DevOps team at devops@example.com
