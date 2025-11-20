# CI/CD Pipeline Quick Reference

**Quick access guide for common pipeline operations**

---

## Pipeline Status

**View Pipeline:** https://github.com/asmortongpt/Fleet/actions

**Current Branch:** `stage-a/requirements-inception`

**Production URL:** https://fleet.capitaltechalliance.com

---

## Quick Commands

### View Recent Runs
```bash
gh run list --workflow=ci-cd.yml --limit 10
```

### Download SBOM
```bash
gh run list --workflow=ci-cd.yml --limit 1
gh run download <run-id> -n sbom-reports
```

### View Logs
```bash
gh run view <run-id> --log
```

### Manual Rollback
```bash
az aks get-credentials --resource-group fleet-management-rg --name fleet-aks-cluster
kubectl rollout undo deployment/fleet-api -n fleet-management
kubectl rollout undo deployment/fleet-frontend -n fleet-management
```

### Check Deployment Status
```bash
kubectl get pods -n fleet-management
kubectl get svc -n fleet-management
kubectl rollout status deployment/fleet-api -n fleet-management
```

---

## Pipeline Stages

1. **Lint** → 2. **Test** → 3. **Build** → 4. **Docker** → 5. **SBOM** → 6. **Security** → 7. **Deploy** → 8. **Smoke Tests** → 9. **Rollback (if needed)**

---

## Environment Variables

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | 20.x |
| `ACR_NAME` | fleetacr |
| `AKS_CLUSTER` | fleet-aks-cluster |
| `AKS_RESOURCE_GROUP` | fleet-management-rg |
| `NAMESPACE` | fleet-management |
| `PRODUCTION_URL` | https://fleet.capitaltechalliance.com |

---

## Required Secrets

- `AZURE_CREDENTIALS`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `AZURE_MAPS_SUBSCRIPTION_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

---

## Rollback Triggers

- Smoke test failure
- Health check failure
- Manual trigger (if needed)

**RTO:** < 4 minutes

---

## SBOM Files Generated

- `sbom-api.spdx.json` (SPDX format)
- `sbom-api.cyclonedx.json` (CycloneDX format)
- `sbom-frontend.spdx.json` (SPDX format)
- `sbom-frontend.cyclonedx.json` (CycloneDX format)

**Retention:** 90 days

---

## Smoke Tests

1. API health check: `GET /api/health`
2. Frontend load: `GET /`
3. Auth endpoint: `POST /api/auth/login`

---

## Emergency Contacts

- **DevOps:** devops@capitaltechalliance.com
- **Security:** security@capitaltechalliance.com

---

## Documentation

- **Full Guide:** `.github/workflows/CI-CD-PIPELINE-DOCUMENTATION.md`
- **Remediation Summary:** `CI-CD-PIPELINE-REMEDIATION-SUMMARY.md`
- **Workflow File:** `.github/workflows/ci-cd.yml`

---

**Last Updated:** 2025-11-20
