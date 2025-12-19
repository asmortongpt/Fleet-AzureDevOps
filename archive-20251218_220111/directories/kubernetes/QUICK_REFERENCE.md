# Kubernetes Deployment - Quick Reference

## One-Line Deploy
```bash
cd kubernetes && ./deploy.sh
```

## Common Commands

### Deployment
```bash
# Deploy everything
kubectl apply -f kubernetes/

# Deploy specific manifest
kubectl apply -f kubernetes/10-frontend-deployment.yaml

# Delete everything
kubectl delete namespace fleet-management
```

### Status Checks
```bash
# All resources
kubectl get all -n fleet-management

# Pods only
kubectl get pods -n fleet-management

# Detailed pod info
kubectl describe pod <pod-name> -n fleet-management

# Deployment status
kubectl rollout status deployment/fleet-frontend -n fleet-management
```

### Logs
```bash
# Follow logs
kubectl logs -f deployment/fleet-frontend -n fleet-management

# Specific pod
kubectl logs <pod-name> -n fleet-management

# Previous instance
kubectl logs <pod-name> -n fleet-management --previous

# All containers
kubectl logs <pod-name> -n fleet-management --all-containers
```

### Scaling
```bash
# Manual scale
kubectl scale deployment fleet-frontend -n fleet-management --replicas=5

# Check HPA
kubectl get hpa -n fleet-management

# HPA details
kubectl describe hpa fleet-frontend-hpa -n fleet-management
```

### Updates
```bash
# Update image
kubectl set image deployment/fleet-frontend \
  fleet-frontend=fleetappregistry.azurecr.io/fleet-frontend:v3.1 \
  -n fleet-management

# Rollout status
kubectl rollout status deployment/fleet-frontend -n fleet-management

# Rollout history
kubectl rollout history deployment/fleet-frontend -n fleet-management

# Rollback
kubectl rollout undo deployment/fleet-frontend -n fleet-management

# Rollback to specific revision
kubectl rollout undo deployment/fleet-frontend -n fleet-management --to-revision=2
```

### Secrets & ConfigMaps
```bash
# View ConfigMap
kubectl get configmap fleet-frontend-config -n fleet-management -o yaml

# Edit ConfigMap
kubectl edit configmap fleet-frontend-config -n fleet-management

# View Secret (base64 encoded)
kubectl get secret fleet-frontend-secret -n fleet-management -o yaml

# Decode secret
kubectl get secret fleet-frontend-secret -n fleet-management -o jsonpath='{.data.VITE_AZURE_AD_CLIENT_ID}' | base64 -d

# Update secret
kubectl create secret generic fleet-frontend-secret \
  --from-literal=VITE_AZURE_AD_CLIENT_ID=new-value \
  -n fleet-management --dry-run=client -o yaml | kubectl apply -f -
```

### Networking
```bash
# View services
kubectl get svc -n fleet-management

# View ingress
kubectl get ingress -n fleet-management

# Ingress details
kubectl describe ingress fleet-frontend-ingress -n fleet-management

# Network policies
kubectl get networkpolicy -n fleet-management

# Port forward to service
kubectl port-forward svc/fleet-frontend 8080:80 -n fleet-management

# Port forward to pod
kubectl port-forward <pod-name> 8080:3000 -n fleet-management
```

### Certificates
```bash
# View certificates
kubectl get certificate -n fleet-management

# Certificate details
kubectl describe certificate fleet-frontend-tls -n fleet-management

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Force renewal
kubectl delete certificate fleet-frontend-tls -n fleet-management
kubectl apply -f kubernetes/50-ingress.yaml
```

### Debugging
```bash
# Execute command in pod
kubectl exec -it <pod-name> -n fleet-management -- /bin/sh

# Run debug container
kubectl run debug --rm -i --tty --image=busybox -- /bin/sh

# Check events
kubectl get events -n fleet-management --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n fleet-management
kubectl top nodes
```

### ACR Secret
```bash
# Create ACR secret
kubectl create secret docker-registry acr-secret \
  --namespace=fleet-management \
  --docker-server=fleetappregistry.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password>

# Verify secret
kubectl get secret acr-secret -n fleet-management
kubectl describe secret acr-secret -n fleet-management
```

## DNS Configuration

```bash
# Get ingress IP
kubectl get ingress -n fleet-management -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'

# Configure DNS A record
# fleet.capitaltechalliance.com → <ingress-ip>

# Verify DNS
nslookup fleet.capitaltechalliance.com
dig fleet.capitaltechalliance.com +short
```

## Validation

```bash
# Validate all manifests
./kubernetes/validate.sh

# Dry run specific manifest
kubectl apply --dry-run=client -f kubernetes/10-frontend-deployment.yaml

# Validate all in directory
kubectl apply --dry-run=client -f kubernetes/
```

## Cleanup

```bash
# Delete deployment only
kubectl delete deployment fleet-frontend -n fleet-management

# Delete all resources
kubectl delete all --all -n fleet-management

# Delete namespace (everything)
kubectl delete namespace fleet-management

# Delete cluster-wide resources
kubectl delete clusterissuer letsencrypt-prod letsencrypt-staging
```

## Troubleshooting Commands

```bash
# ImagePullBackOff
kubectl describe pod <pod-name> -n fleet-management | grep -A 10 Events
kubectl get secret acr-secret -n fleet-management

# CrashLoopBackOff
kubectl logs <pod-name> -n fleet-management
kubectl logs <pod-name> -n fleet-management --previous

# Pending pods
kubectl describe pod <pod-name> -n fleet-management
kubectl get events -n fleet-management

# Certificate issues
kubectl describe certificate fleet-frontend-tls -n fleet-management
kubectl get challenges -n fleet-management

# Ingress issues
kubectl describe ingress fleet-frontend-ingress -n fleet-management
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

## Emergency Commands

```bash
# Force delete pod
kubectl delete pod <pod-name> -n fleet-management --force --grace-period=0

# Emergency rollback
./kubernetes/rollback.sh

# Restart deployment
kubectl rollout restart deployment/fleet-frontend -n fleet-management

# Scale to zero (emergency stop)
kubectl scale deployment fleet-frontend -n fleet-management --replicas=0

# Scale back up
kubectl scale deployment fleet-frontend -n fleet-management --replicas=3
```

## Health Checks

```bash
# Test health endpoint from pod
kubectl run test --rm -i --tty --image=curlimages/curl -- \
  curl http://fleet-frontend.fleet-management.svc.cluster.local/health

# Test from outside cluster
curl https://fleet.capitaltechalliance.com/health

# Check readiness
kubectl get pods -n fleet-management -o wide
```

## Performance

```bash
# Resource usage
kubectl top pods -n fleet-management
kubectl top nodes

# HPA metrics
kubectl get hpa -n fleet-management
kubectl describe hpa fleet-frontend-hpa -n fleet-management

# Pod resource limits
kubectl describe deployment fleet-frontend -n fleet-management | grep -A 5 Limits
```

## Backup & Restore

```bash
# Backup all manifests
kubectl get all,cm,secrets,ingress,pdb,hpa,networkpolicy \
  -n fleet-management -o yaml > backup.yaml

# Backup specific resource
kubectl get deployment fleet-frontend -n fleet-management -o yaml > deployment-backup.yaml

# Restore from backup
kubectl apply -f backup.yaml
```

## Context & Namespaces

```bash
# Current context
kubectl config current-context

# Switch context
kubectl config use-context <context-name>

# Set default namespace
kubectl config set-context --current --namespace=fleet-management

# View all contexts
kubectl config get-contexts
```

## Quick Tests

```bash
# Test deployment
kubectl run test-deploy --image=nginx:alpine --dry-run=client -o yaml

# Test connectivity
kubectl run test-connectivity --rm -i --tty --image=curlimages/curl -- /bin/sh

# Test DNS
kubectl run test-dns --rm -i --tty --image=busybox -- nslookup fleet-frontend.fleet-management.svc.cluster.local

# Test image pull
kubectl run test-image --rm -i --tty \
  --image=fleetappregistry.azurecr.io/fleet-frontend:v3.0-production-rebuild -- /bin/sh
```

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias k='kubectl'
alias kgp='kubectl get pods -n fleet-management'
alias kgd='kubectl get deployments -n fleet-management'
alias kgs='kubectl get svc -n fleet-management'
alias kgi='kubectl get ingress -n fleet-management'
alias kl='kubectl logs -f deployment/fleet-frontend -n fleet-management'
alias kd='kubectl describe'
alias ke='kubectl exec -it'
alias kdel='kubectl delete'
```

## URLs

- **Application**: https://fleet.capitaltechalliance.com
- **Health**: https://fleet.capitaltechalliance.com/health
- **API**: https://fleet-api.capitaltechalliance.com

## Key Files

- Deploy: `kubernetes/deploy.sh`
- Rollback: `kubernetes/rollback.sh`
- Validate: `kubernetes/validate.sh`
- README: `kubernetes/README.md`
- Manual Steps: `kubernetes/MANUAL_STEPS.md`

## Support

- **Email**: andrew.m@capitaltechalliance.com
- **Docs**: See README.md for full documentation
- **Emergency**: Follow runbook procedures
