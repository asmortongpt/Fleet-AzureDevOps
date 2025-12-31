# Fleet Management System - Deployment Scripts

Production-grade deployment automation for the Fleet Management System.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Scripts Reference](#scripts-reference)
- [Environment Variables](#environment-variables)
- [Deployment Workflow](#deployment-workflow)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)

## Overview

This directory contains production-ready deployment automation scripts that handle:

- ✅ Azure infrastructure provisioning
- ✅ Docker image building and publishing
- ✅ Application deployment to Azure Static Web Apps
- ✅ Environment configuration
- ✅ Health checks and validation
- ✅ Automated rollback capability
- ✅ Load testing and performance validation

All scripts are:
- **Idempotent**: Safe to run multiple times
- **Dry-run capable**: Test before executing
- **Well-logged**: Comprehensive logging to files
- **Error-handled**: Graceful failures with cleanup

## Prerequisites

### Required Tools

```bash
# Azure CLI
brew install azure-cli  # macOS
# or visit: https://docs.microsoft.com/cli/azure/install-azure-cli

# Docker
# Download from: https://www.docker.com/products/docker-desktop

# Node.js & npm
brew install node  # macOS

# Git
brew install git  # macOS

# jq (JSON processor)
brew install jq  # macOS
```

### Optional Tools (for load testing)

```bash
# k6 (recommended)
brew install k6

# Apache Bench
brew install httpd  # macOS

# Artillery
npm install -g artillery
```

### Azure Authentication

```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify login
az account show
```

### Environment Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Set required variables in `.env` or `~/.env`:
```bash
# Azure Configuration
export AZURE_CLIENT_ID="your-client-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_STATIC_WEB_APP_URL="https://your-app.azurestaticapps.net"
export AZURE_RESOURCE_GROUP="fleet-management-rg"
export AZURE_CONTAINER_REGISTRY="fleetmgmtacr"
```

## Quick Start

### First-Time Setup

1. **Provision Azure Infrastructure**:
```bash
./scripts/setup-azure-infrastructure.sh
```

2. **Build and Push Docker Image**:
```bash
./scripts/build-docker.sh
```

3. **Deploy to Production**:
```bash
./scripts/deploy-production.sh
```

4. **Verify Deployment**:
```bash
./scripts/health-check.sh
```

### Regular Deployment

```bash
# Standard deployment (with tests and validation)
./scripts/deploy-production.sh

# Quick deployment (skip tests - not recommended)
./scripts/deploy-production.sh --skip-tests

# Dry run (test without deploying)
./scripts/deploy-production.sh --dry-run
```

## Scripts Reference

### 1. `setup-azure-infrastructure.sh`

**Purpose**: Provision all required Azure resources.

**What it creates**:
- Resource Group
- Azure Container Registry (ACR)
- Azure Static Web App
- Azure Key Vault
- Application Insights
- Storage Account

**Usage**:
```bash
# Standard setup
./scripts/setup-azure-infrastructure.sh

# Dry run
./scripts/setup-azure-infrastructure.sh --dry-run

# Custom resource group
AZURE_RESOURCE_GROUP="custom-rg" ./scripts/setup-azure-infrastructure.sh
```

**Output**:
- Creates all Azure resources
- Stores secrets in Key Vault
- Displays deployment token for GitHub Secrets
- Generates log file in `logs/infrastructure/`

**Important Notes**:
- Save the deployment token shown at the end
- Add deployment token to GitHub Secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Script is idempotent - safe to run multiple times

---

### 2. `build-docker.sh`

**Purpose**: Build, scan, and push Docker images to Azure Container Registry.

**What it does**:
- Builds multi-stage Docker image
- Scans for vulnerabilities (using Trivy if available)
- Tests the image locally
- Pushes to Azure Container Registry with multiple tags
- Updates deployment manifest

**Usage**:
```bash
# Standard build and push
./scripts/build-docker.sh

# Build only (no push to registry)
./scripts/build-docker.sh --skip-push

# Skip security scan
./scripts/build-docker.sh --skip-scan

# Dry run
./scripts/build-docker.sh --dry-run

# Multi-platform build
./scripts/build-docker.sh --platform linux/amd64,linux/arm64
```

**Tags Created**:
- `{git-sha}` - Commit-specific tag
- `{version}` - Version from package.json
- `latest` - Latest build
- `{timestamp}` - Timestamp tag

**Security Scanning**:
- Uses Trivy if installed
- Fails build if CRITICAL vulnerabilities found
- Warns on HIGH vulnerabilities
- Scan results saved to `logs/docker/`

---

### 3. `deploy-production.sh`

**Purpose**: Complete end-to-end production deployment.

**Deployment Steps**:
1. Pull latest code from GitHub
2. Run tests (type checking, linting, smoke tests)
3. Build production bundle
4. Build Docker image
5. Push to Azure Container Registry
6. Deploy to Azure Static Web Apps
7. Run production smoke tests
8. Create deployment tag

**Usage**:
```bash
# Standard deployment with all checks
./scripts/deploy-production.sh

# Skip tests (use with caution)
./scripts/deploy-production.sh --skip-tests

# Auto-approve (CI/CD mode)
./scripts/deploy-production.sh --auto-approve

# Dry run
./scripts/deploy-production.sh --dry-run
```

**Exit Codes**:
- `0` - Success
- `1` - Failure (triggers automatic rollback)

**Rollback**:
- Automatically triggered on deployment failure
- Uses `rollback.sh` if available
- Logs all actions for debugging

---

### 4. `rollback.sh`

**Purpose**: Rollback to a previous deployment version.

**Features**:
- Interactive version selection
- Automatic or manual mode
- Dry-run support
- Verification after rollback
- Team notification template

**Usage**:
```bash
# Interactive rollback (select from list)
./scripts/rollback.sh

# Rollback to specific version
./scripts/rollback.sh --version v20251231-120000

# Automated rollback (CI/CD)
./scripts/rollback.sh --version v20251231-120000 --auto-approve

# Dry run
./scripts/rollback.sh --dry-run
```

**Rollback Process**:
1. Shows available deployment versions
2. User selects version (or automated)
3. Confirms rollback action
4. Checks out selected version
5. Builds application
6. Deploys to production
7. Verifies deployment
8. Creates rollback tag
9. Returns to main branch

**Important**:
- Only rollbacks to tagged deployments
- Creates audit trail with tags
- Requires manual confirmation unless `--auto-approve`

---

### 5. `health-check.sh`

**Purpose**: Comprehensive production health validation.

**Checks Performed**:
- ✅ HTTP status codes
- ✅ Response time
- ✅ SSL certificate validity
- ✅ TLS version
- ✅ Security headers
- ✅ API endpoints
- ✅ PWA manifest
- ✅ Service Worker
- ✅ Compression
- ✅ Caching headers
- ✅ CDN detection

**Usage**:
```bash
# Standard health check
./scripts/health-check.sh

# Check specific URL
./scripts/health-check.sh --url https://example.com

# Fail on warnings (CI/CD)
./scripts/health-check.sh --fail-on-warning

# Skip specific checks
./scripts/health-check.sh --skip-ssl --skip-pwa

# Custom timeout
./scripts/health-check.sh --timeout 30
```

**Output**:
- Color-coded results (PASS/FAIL/WARN)
- Summary statistics
- JSON report file
- Pass rate percentage

**Thresholds**:
- Response time: < 2s (warning), < 5s (fail)
- SSL expiry: > 30 days (pass), > 7 days (warn), < 7 days (fail)
- Security headers: All recommended headers should be present

---

### 6. `load-test.sh`

**Purpose**: Production load and stress testing.

**Test Types**:
1. **Baseline Test** - Low load (10 concurrent users)
2. **Load Test** - Medium load (50 concurrent users)
3. **Stress Test** - High load (100 concurrent users)
4. **Spike Test** - Sudden traffic spike (optional)

**Tools Supported**:
- k6 (recommended)
- Apache Bench (ab)
- Artillery

**Usage**:
```bash
# Standard load test (auto-detects tool)
./scripts/load-test.sh

# Use specific tool
./scripts/load-test.sh --tool k6

# Custom concurrency levels
./scripts/load-test.sh --concurrency-high 500

# Run only stress test
./scripts/load-test.sh --skip-baseline --skip-load

# Custom duration
./scripts/load-test.sh --duration 60
```

**Performance Thresholds**:
- Response time: < 2000ms (p95)
- Error rate: < 1%
- Requests/second: > 50

**Output**:
- Detailed performance metrics
- HTML report
- Raw test data (CSV, JSON, TSV)
- Threshold validation

---

## Environment Variables

### Required Variables

```bash
# Azure AD Configuration
AZURE_CLIENT_ID="your-client-id"
AZURE_TENANT_ID="your-tenant-id"

# Azure Static Web App
AZURE_STATIC_WEB_APP_URL="https://your-app.azurestaticapps.net"
```

### Optional Variables

```bash
# Azure Resources
AZURE_RESOURCE_GROUP="fleet-management-rg"
AZURE_LOCATION="eastus2"
AZURE_CONTAINER_REGISTRY="fleetmgmtacr"
AZURE_STATIC_WEB_APP_NAME="fleet-management-app"
AZURE_KEY_VAULT_NAME="fleet-keyvault"

# Deployment Settings
DRY_RUN="false"
SKIP_TESTS="false"
AUTO_APPROVE="false"

# Docker Settings
DOCKER_IMAGE_NAME="fleet-management-system"
PLATFORM="linux/amd64"

# Health Check Settings
HEALTH_CHECK_TIMEOUT="10"
FAIL_ON_WARNING="false"

# Load Testing
CONCURRENCY_LOW="10"
CONCURRENCY_MEDIUM="50"
CONCURRENCY_HIGH="100"
DURATION="30"
```

## Deployment Workflow

### Standard Production Deployment

```bash
# 1. Pre-deployment checks
./scripts/health-check.sh

# 2. Run load tests on current version
./scripts/load-test.sh

# 3. Deploy new version
./scripts/deploy-production.sh

# 4. Post-deployment verification
./scripts/health-check.sh

# 5. Load test new version
./scripts/load-test.sh

# 6. Monitor logs
tail -f logs/deployment/deploy-*.log
```

### Emergency Rollback

```bash
# Quick rollback to last known good version
./scripts/rollback.sh --auto-approve

# Verify rollback
./scripts/health-check.sh
```

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example
- name: Deploy to Production
  run: |
    ./scripts/deploy-production.sh --auto-approve
  env:
    AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
    AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}

- name: Health Check
  run: |
    ./scripts/health-check.sh --fail-on-warning

- name: Load Test
  run: |
    ./scripts/load-test.sh
```

## Troubleshooting

### Common Issues

#### 1. Azure CLI Not Logged In

```bash
Error: Not logged in to Azure CLI

Solution:
az login
az account show  # verify login
```

#### 2. Docker Daemon Not Running

```bash
Error: Docker daemon is not running

Solution:
# macOS: Start Docker Desktop
open -a Docker

# Linux: Start Docker service
sudo systemctl start docker
```

#### 3. Missing Environment Variables

```bash
Error: Missing required environment variables: AZURE_CLIENT_ID

Solution:
# Add to ~/.env or .env
export AZURE_CLIENT_ID="your-client-id"
source ~/.env
```

#### 4. Deployment Fails

```bash
Check logs:
cat logs/deployment/deploy-*.log

Run in dry-run mode:
./scripts/deploy-production.sh --dry-run

Rollback if needed:
./scripts/rollback.sh
```

#### 5. Health Check Failures

```bash
# Check specific component
./scripts/health-check.sh --url https://your-app.azurestaticapps.net

# Skip failing checks temporarily
./scripts/health-check.sh --skip-ssl

# View detailed logs
cat logs/health-checks/health-*.log
```

### Log Files

All scripts create detailed log files:

```bash
logs/
├── deployment/           # Deployment logs
│   └── deploy-*.log
├── infrastructure/       # Infrastructure setup logs
│   └── setup-*.log
├── docker/              # Docker build logs
│   └── build-*.log
├── rollback/            # Rollback logs
│   └── rollback-*.log
├── health-checks/       # Health check logs
│   ├── health-*.log
│   └── health-report-*.json
└── load-testing/        # Load test logs
    ├── load-test-*.log
    └── load-test-report-*.html
```

### Getting Help

```bash
# Show help for any script
./scripts/deploy-production.sh --help
./scripts/rollback.sh --help
./scripts/health-check.sh --help
./scripts/load-test.sh --help
```

## Architecture

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. setup-azure-infrastructure.sh                           │
│     ↓                                                        │
│  Creates: ACR, Static Web App, Key Vault, App Insights     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. build-docker.sh                                         │
│     ↓                                                        │
│  Builds → Scans → Tests → Pushes to ACR                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. deploy-production.sh                                    │
│     ↓                                                        │
│  Pull → Test → Build → Deploy → Verify                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. health-check.sh                                         │
│     ↓                                                        │
│  HTTP → SSL → Headers → API → PWA → Performance            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. load-test.sh                                            │
│     ↓                                                        │
│  Baseline → Load → Stress → Report                         │
└─────────────────────────────────────────────────────────────┘
```

### Error Handling

```
Deployment Error
      ↓
Trap Triggered
      ↓
cleanup_on_error()
      ↓
rollback.sh --auto-approve
      ↓
Notify Team
```

### Security

- ✅ No hardcoded secrets
- ✅ All credentials in Azure Key Vault
- ✅ Vulnerability scanning with Trivy
- ✅ Security headers validation
- ✅ SSL/TLS verification
- ✅ Audit logging

### Best Practices

1. **Always test in dry-run mode first**
```bash
./scripts/deploy-production.sh --dry-run
```

2. **Review logs after deployment**
```bash
cat logs/deployment/deploy-*.log
```

3. **Run health checks before and after deployment**
```bash
./scripts/health-check.sh
```

4. **Keep deployment tags for rollback capability**
```bash
git tag -l 'v*' | tail -10
```

5. **Monitor Application Insights for errors**
```bash
az monitor app-insights metrics show \
  --app fleet-appinsights \
  --metric requests/failed
```

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review log files in `logs/`
3. Run scripts with `--help` flag
4. Contact Capital Tech Alliance DevOps team

---

**Last Updated**: 2025-12-31
**Version**: 1.0.0
**Maintained by**: Capital Tech Alliance - DevOps Team
