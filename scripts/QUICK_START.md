# Fleet Deployment Scripts - Quick Start Guide

**⚡ Get up and running in 5 minutes**

---

## Prerequisites

```bash
# Verify you have the required tools
which az docker node git jq

# Login to Azure
az login
az account show
```

## Environment Setup

```bash
# Set required environment variables
export AZURE_CLIENT_ID="4c8641fa-3a56-448f-985a-e763017d70d7"
export AZURE_TENANT_ID="0ec14b81-7b82-45ee-8f3d-cbc31ced5347"
export AZURE_STATIC_WEB_APP_URL="https://proud-bay-0fdc8040f.3.azurestaticapps.net"
export AZURE_RESOURCE_GROUP="fleet-management-rg"
export AZURE_CONTAINER_REGISTRY="fleetmgmtacr"
```

## First-Time Setup (Run Once)

### Step 1: Setup Azure Infrastructure (~10 minutes)

```bash
# Dry run first to see what will be created
./scripts/setup-azure-infrastructure.sh --dry-run

# Create actual infrastructure
./scripts/setup-azure-infrastructure.sh

# ⚠️ IMPORTANT: Save the deployment token shown at the end
# Add it to GitHub Secrets as: AZURE_STATIC_WEB_APPS_API_TOKEN
```

**What this creates**:
- Resource Group
- Azure Container Registry
- Static Web App
- Key Vault
- Application Insights
- Storage Account

---

## Regular Deployment

### Option 1: Standard Deployment (Recommended)

```bash
# Build, test, and deploy in one command
./scripts/deploy-production.sh
```

This will:
1. ✅ Pull latest code
2. ✅ Run tests (type check, lint, smoke tests)
3. ✅ Build production bundle
4. ✅ Build Docker image
5. ✅ Scan for vulnerabilities
6. ✅ Push to Azure Container Registry
7. ✅ Deploy to Azure Static Web Apps
8. ✅ Run health checks
9. ✅ Create deployment tag

### Option 2: Step-by-Step Deployment

```bash
# 1. Build Docker image
./scripts/build-docker.sh

# 2. Deploy to production
./scripts/deploy-production.sh

# 3. Verify deployment
./scripts/health-check.sh

# 4. Run load tests
./scripts/load-test.sh
```

---

## Verification

### Quick Health Check

```bash
./scripts/health-check.sh
```

### Comprehensive Health Check

```bash
./scripts/health-check.sh --url https://proud-bay-0fdc8040f.3.azurestaticapps.net
```

### Load Test

```bash
# Standard load test
./scripts/load-test.sh

# High load stress test
./scripts/load-test.sh --concurrency-high 500
```

---

## Emergency Rollback

### Interactive Rollback (Select Version)

```bash
./scripts/rollback.sh
```

### Quick Rollback to Previous Version

```bash
# List recent deployments
git tag -l 'v*' --sort=-version:refname | head -5

# Rollback to specific version
./scripts/rollback.sh --version v20251231-120000
```

### Emergency Auto-Rollback (No Confirmation)

```bash
./scripts/rollback.sh --auto-approve
```

---

## Common Commands

### Dry Run Any Script

```bash
./scripts/deploy-production.sh --dry-run
./scripts/build-docker.sh --dry-run
./scripts/rollback.sh --dry-run
```

### Get Help

```bash
./scripts/deploy-production.sh --help
./scripts/health-check.sh --help
./scripts/load-test.sh --help
./scripts/rollback.sh --help
```

### View Logs

```bash
# Latest deployment log
ls -lt logs/deployment/ | head -1

# View deployment log
tail -f logs/deployment/deploy-*.log

# View health check results
cat logs/health-checks/health-report-*.json | jq

# View load test report
open logs/load-testing/load-test-report-*.html
```

---

## Troubleshooting

### Azure CLI Not Logged In

```bash
az login
az account show
```

### Docker Not Running

```bash
# macOS
open -a Docker

# Verify
docker info
```

### Environment Variables Not Set

```bash
# Add to ~/.env or ~/.zshrc
echo 'export AZURE_CLIENT_ID="..."' >> ~/.env
echo 'export AZURE_TENANT_ID="..."' >> ~/.env
echo 'export AZURE_STATIC_WEB_APP_URL="..."' >> ~/.env

source ~/.env
```

### Deployment Failed

```bash
# View logs
cat logs/deployment/deploy-*.log

# Rollback
./scripts/rollback.sh

# Verify rollback
./scripts/health-check.sh
```

### Health Check Failed

```bash
# Run with details
./scripts/health-check.sh

# Skip specific checks
./scripts/health-check.sh --skip-ssl --skip-pwa

# View detailed logs
cat logs/health-checks/health-*.log
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3

      - name: Deploy
        run: ./scripts/deploy-production.sh --auto-approve
        env:
          AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}

      - name: Health Check
        run: ./scripts/health-check.sh --fail-on-warning

      - name: Load Test
        run: ./scripts/load-test.sh
```

### Azure DevOps

```yaml
steps:
  - script: |
      ./scripts/deploy-production.sh --auto-approve
    displayName: Deploy to Production
    env:
      AZURE_CLIENT_ID: $(AZURE_CLIENT_ID)
      AZURE_TENANT_ID: $(AZURE_TENANT_ID)

  - script: |
      ./scripts/health-check.sh --fail-on-warning
    displayName: Health Check

  - script: |
      ./scripts/load-test.sh
    displayName: Load Test
```

---

## Performance Benchmarks

### Deployment Times

- Infrastructure setup: 5-10 minutes (first time only)
- Docker build: 3-5 minutes
- Production deployment: 5-8 minutes
- Health check: 30 seconds
- Load test: 2-5 minutes

**Total**: ~10-15 minutes for complete deployment

### Resource Usage

- Docker image size: ~100-200 MB
- Build artifacts: ~50-100 MB
- Log files: ~1-5 MB per deployment

---

## Best Practices

### 1. Always Test First

```bash
# Dry run before deploying
./scripts/deploy-production.sh --dry-run
```

### 2. Check Health Before and After

```bash
# Before deployment
./scripts/health-check.sh

# Deploy
./scripts/deploy-production.sh

# After deployment
./scripts/health-check.sh
```

### 3. Keep Deployment Tags

```bash
# List recent deployments
git tag -l 'v*' --sort=-version:refname | head -10

# Never delete deployment tags (needed for rollback)
```

### 4. Monitor Logs

```bash
# Watch deployment in real-time
tail -f logs/deployment/deploy-*.log
```

### 5. Run Load Tests Periodically

```bash
# Weekly load test
./scripts/load-test.sh

# Save reports for trending
```

---

## Security Checklist

- [ ] Azure CLI authenticated
- [ ] Environment variables set (not hardcoded)
- [ ] Secrets in Azure Key Vault
- [ ] No secrets in logs
- [ ] Docker images scanned (Trivy)
- [ ] SSL certificates valid
- [ ] Security headers present
- [ ] API authentication enabled

---

## Support

### Documentation

- **Full Documentation**: See `scripts/README.md`
- **Script Help**: Run any script with `--help`
- **Troubleshooting**: See README.md troubleshooting section

### Logs

All logs saved to:
```
logs/
├── deployment/
├── infrastructure/
├── docker/
├── rollback/
├── health-checks/
└── load-testing/
```

### Contact

- **Team**: Capital Tech Alliance - DevOps
- **Documentation**: `scripts/README.md`
- **Issue Tracking**: GitHub Issues

---

## Quick Reference

| Task | Command |
|------|---------|
| Setup infrastructure | `./scripts/setup-azure-infrastructure.sh` |
| Build Docker image | `./scripts/build-docker.sh` |
| Deploy to production | `./scripts/deploy-production.sh` |
| Health check | `./scripts/health-check.sh` |
| Load test | `./scripts/load-test.sh` |
| Rollback | `./scripts/rollback.sh` |
| Dry run | `<script> --dry-run` |
| Get help | `<script> --help` |
| View logs | `cat logs/<type>/<file>.log` |

---

**Last Updated**: 2025-12-31
**Version**: 1.0.0

**Ready to deploy!** 🚀
