# Fleet Management CI/CD Quick Reference

**Quick commands and procedures for daily development**

---

## Daily Development Workflow

### 1. Working on Features (Dev Environment)

```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to trigger tests
git push origin feature/my-feature

# Create PR to develop
gh pr create --base develop --title "Add new feature"

# After PR approval, merge triggers dev deployment automatically
```

### 2. Check CI Status

```bash
# View recent workflow runs
gh run list

# Watch current run
gh run watch

# View specific run
gh run view <run-id>

# Download logs
gh run download <run-id>
```

### 3. Deploy to Staging

```bash
# Method 1: GitHub CLI
gh workflow run deploy-staging.yml -f version=v1.2.3

# Method 2: GitHub UI
# Actions → Deploy to Staging → Run workflow → Enter version

# Check deployment status
gh run list --workflow=deploy-staging.yml

# View logs
gh run watch
```

### 4. Deploy to Production

```bash
# Trigger deployment
gh workflow run deploy-production.yml \
  -f version=v1.2.3 \
  -f rollback=true

# Monitor deployment
gh run watch

# Check production pods
kubectl get pods -n fleet-management

# View production logs
kubectl logs -f deployment/fleet-api -n fleet-management
```

---

## Emergency Procedures

### Immediate Rollback (Production)

```bash
# Connect to AKS
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

# Rollback API
kubectl rollout undo deployment/fleet-api -n fleet-management

# Rollback Frontend
kubectl rollout undo deployment/fleet-frontend -n fleet-management

# Verify rollback
kubectl get pods -n fleet-management
kubectl rollout status deployment/fleet-api -n fleet-management
```

### Check Deployment Status

```bash
# View all deployments
kubectl get deployments -n fleet-management

# View pods
kubectl get pods -n fleet-management

# View services
kubectl get svc -n fleet-management

# View recent events
kubectl get events -n fleet-management --sort-by='.lastTimestamp' | head -20
```

### View Logs

```bash
# API logs (last 100 lines, follow)
kubectl logs -f deployment/fleet-api -n fleet-management --tail=100

# Frontend logs
kubectl logs -f deployment/fleet-frontend -n fleet-management --tail=100

# Previous pod logs (if pod crashed)
kubectl logs deployment/fleet-api -n fleet-management --previous
```

### Health Checks

```bash
# Development
curl https://fleet-dev.capitaltechalliance.com/api/health

# Staging
curl https://fleet-staging.capitaltechalliance.com/api/health

# Production
curl https://fleet.capitaltechalliance.com/api/health
```

---

## Common Commands

### Kubernetes

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group fleet-management-rg \
  --name fleet-aks-cluster

# Switch namespace
kubectl config set-context --current --namespace=fleet-management

# Describe pod
kubectl describe pod <pod-name> -n fleet-management

# Execute command in pod
kubectl exec -it deployment/fleet-api -n fleet-management -- sh

# Port forward (local testing)
kubectl port-forward svc/fleet-api 3000:3000 -n fleet-management

# View resource usage
kubectl top pods -n fleet-management
kubectl top nodes

# Scale deployment
kubectl scale deployment/fleet-api --replicas=3 -n fleet-management

# View deployment history
kubectl rollout history deployment/fleet-api -n fleet-management

# Restart deployment (without changing image)
kubectl rollout restart deployment/fleet-api -n fleet-management
```

### Docker Registry

```bash
# List images
az acr repository list --name fleetappregistry

# List tags for image
az acr repository show-tags \
  --name fleetappregistry \
  --repository fleet-api

# Delete old images
az acr repository delete \
  --name fleetappregistry \
  --image fleet-api:old-tag \
  --yes
```

### GitHub Actions

```bash
# List workflows
gh workflow list

# View workflow runs
gh run list --workflow=ci.yml --limit 10

# Re-run failed workflow
gh run rerun <run-id>

# Cancel running workflow
gh run cancel <run-id>

# View logs
gh run view <run-id> --log

# Download artifacts
gh run download <run-id>
```

---

## Troubleshooting Quick Fixes

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -n fleet-management

# Describe pod for events
kubectl describe pod <pod-name> -n fleet-management

# Check logs
kubectl logs <pod-name> -n fleet-management

# Common fixes:
# 1. Image pull error → Check ACR credentials
# 2. CrashLoopBackOff → Check logs for app errors
# 3. Pending → Check resource limits and node capacity
```

### Image Pull Errors

```bash
# Verify image exists
az acr repository show \
  --name fleetappregistry \
  --repository fleet-api

# Check image pull secret
kubectl get secret acr-secret -n fleet-management -o yaml

# Recreate image pull secret
kubectl delete secret acr-secret -n fleet-management
kubectl create secret docker-registry acr-secret \
  --docker-server=fleetappregistry.azurecr.io \
  --docker-username=$ACR_USERNAME \
  --docker-password=$ACR_PASSWORD \
  --namespace fleet-management
```

### Database Connection Issues

```bash
# Check database secret
kubectl get secret fleet-secrets -n fleet-management -o yaml

# View decoded database URL
kubectl get secret fleet-secrets -n fleet-management \
  -o jsonpath='{.data.database-url}' | base64 -d

# Test connection from pod
kubectl exec -it deployment/fleet-api -n fleet-management -- \
  nc -zv <db-host> 5432
```

### Service Not Accessible

```bash
# Check service
kubectl get svc fleet-api -n fleet-management

# Check endpoints
kubectl get endpoints fleet-api -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management
kubectl describe ingress -n fleet-management

# Test internally
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://fleet-api.fleet-management.svc.cluster.local:3000/api/health
```

---

## Version Management

### Semantic Versioning

Format: `v{MAJOR}.{MINOR}.{PATCH}`

Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - New features
- `v1.1.1` - Bug fixes
- `v2.0.0` - Breaking changes

### Creating a Release

```bash
# Tag the commit
git tag -a v1.2.3 -m "Release v1.2.3"

# Push tag
git push origin v1.2.3

# Create GitHub release
gh release create v1.2.3 \
  --title "Release v1.2.3" \
  --notes "Release notes here"
```

---

## Environment URLs

| Environment | Frontend | API | Admin |
|-------------|----------|-----|-------|
| **Development** | https://fleet-dev.capitaltechalliance.com | https://fleet-dev.capitaltechalliance.com/api | https://fleet-dev.capitaltechalliance.com/admin |
| **Staging** | https://fleet-staging.capitaltechalliance.com | https://fleet-staging.capitaltechalliance.com/api | https://fleet-staging.capitaltechalliance.com/admin |
| **Production** | https://fleet.capitaltechalliance.com | https://fleet.capitaltechalliance.com/api | https://fleet.capitaltechalliance.com/admin |

---

## Monitoring & Logs

### GitHub Actions

- **UI:** https://github.com/asmortongpt/Fleet/actions
- **Logs:** Actions tab → Select workflow run → View job logs
- **Artifacts:** Actions tab → Select run → Artifacts section

### Azure Portal

- **AKS:** https://portal.azure.com → Resource Groups → fleet-management-rg → fleet-aks-cluster
- **ACR:** https://portal.azure.com → Resource Groups → fleet-management-rg → fleetappregistry
- **Logs:** AKS → Logs → Enter KQL query

### Kubernetes Dashboard (if enabled)

```bash
# Get dashboard token
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')

# Port forward to dashboard
kubectl port-forward -n kube-system service/kubernetes-dashboard 8443:443

# Access: https://localhost:8443
```

---

## Security Reminders

### ⚠️ Never Commit

- Database passwords
- API keys
- JWT secrets
- Azure credentials
- Container registry passwords

### ✅ Always Use

- GitHub Secrets for sensitive data
- Azure Key Vault for production secrets
- Least privilege service principals
- MFA for production approvals

---

## Getting Help

### Documentation

- **Full Setup Guide:** `CICD_SETUP.md`
- **Workflow Docs:** `.github/workflows/README.md`
- **This Guide:** `CICD_QUICK_REFERENCE.md`

### Contacts

- **DevOps Team:** devops@capitaltechalliance.com
- **On-Call:** See PagerDuty schedule
- **Slack:** #fleet-deployments

### Escalation

1. Check logs (GitHub Actions + Kubernetes)
2. Try common fixes (see Troubleshooting section)
3. Rollback if production is affected
4. Create incident ticket
5. Contact on-call engineer

---

## Cheat Sheet

### Most Common Commands

```bash
# Deploy to staging
gh workflow run deploy-staging.yml -f version=v1.2.3

# Deploy to production
gh workflow run deploy-production.yml -f version=v1.2.3 -f rollback=true

# Check pods
kubectl get pods -n fleet-management

# View logs
kubectl logs -f deployment/fleet-api -n fleet-management

# Rollback
kubectl rollout undo deployment/fleet-api -n fleet-management

# Health check
curl https://fleet.capitaltechalliance.com/api/health

# Get credentials
az aks get-credentials --resource-group fleet-management-rg --name fleet-aks-cluster
```

### Environment Variables

```bash
# Set for convenience
export RG=fleet-management-rg
export AKS=fleet-aks-cluster
export ACR=fleetappregistry
export NS=fleet-management

# Use in commands
kubectl get pods -n $NS
az aks get-credentials --resource-group $RG --name $AKS
```

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0

*Keep this guide handy for quick reference during development and deployments!*
