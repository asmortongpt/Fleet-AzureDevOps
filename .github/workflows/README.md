# Fleet Management CI/CD Workflows

This directory contains GitHub Actions workflows for the Fleet Management application's continuous integration and deployment pipeline.

## Overview

The CI/CD pipeline is organized into multiple workflows to support different stages of the software development lifecycle:

1. **Continuous Integration (CI)** - Automated testing and validation
2. **Development Deployment** - Automatic deployment to dev environment
3. **Staging Deployment** - Manual deployment to staging with approval
4. **Production Deployment** - Highly controlled production deployment with multiple safeguards

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main`, `develop`, or `stage-*` branches
- Pull requests to `main` or `develop`

**Jobs:**
- **Lint & Type Check**: ESLint and TypeScript validation for frontend and API
- **Security Scan**: NPM audit and Trivy vulnerability scanning
- **Frontend Tests**: Unit tests with coverage reporting
- **API Tests**: Backend unit tests with coverage
- **Build Verification**: Full build of both frontend and API
- **Build Info**: Generate build metadata

**Artifacts:**
- Code coverage reports (uploaded to Codecov)
- Frontend and API build artifacts
- Build information

---

### 2. Development Deployment (`deploy-dev.yml`)

**Triggers:**
- Automatic on push to `develop` branch
- Manual trigger via workflow dispatch

**Environment:** `development`

**Jobs:**
1. **Pre-Flight Checks**: Validate environment configuration
2. **Build & Push Images**: Build and push Docker images tagged with `dev-{BUILD_ID}` and `dev-latest`
3. **Deploy to AKS**: Deploy to `fleet-management-dev` namespace
4. **Smoke Tests**: Basic health checks on deployed services
5. **Notification**: Send deployment status summary

**Image Tags:**
- `fleetappregistry.azurecr.io/fleet-frontend:dev-{BUILD_ID}`
- `fleetappregistry.azurecr.io/fleet-api:dev-{BUILD_ID}`

---

### 3. Staging Deployment (`deploy-staging.yml`)

**Triggers:**
- Manual only (workflow dispatch)

**Required Input:**
- `version`: Semantic version (e.g., `v1.2.3`)

**Environment:** `staging` (requires manual approval)

**Jobs:**
1. **Approval Gate**: Manual approval required before deployment
2. **Pre-Flight Checks**: Validate version format and configuration
3. **Build & Push Images**: Build and push images tagged with version
4. **Deploy to AKS**: Deploy to `fleet-management-staging` namespace
5. **Integration Tests**: Run comprehensive integration test suite
6. **Notification**: Detailed deployment summary

**Image Tags:**
- `fleetappregistry.azurecr.io/fleet-frontend:staging-{VERSION}`
- `fleetappregistry.azurecr.io/fleet-api:staging-{VERSION}`

---

### 4. Production Deployment (`deploy-production.yml`)

**Triggers:**
- Manual only (workflow dispatch)

**Required Input:**
- `version`: Semantic version (e.g., `v1.2.3`)
- `rollback`: Enable automatic rollback on failure (default: true)

**Environment:** `production` (requires multiple approvals)

**Jobs:**
1. **Approval Gate 1**: Initial deployment request approval
2. **Pre-Deployment Checks**: Version validation and current state verification
3. **Database Backup**: Automatic database backup before deployment
4. **Build & Push Images**: Build production images with security scanning
5. **Approval Gate 2**: Final confirmation before deployment
6. **Blue-Green Deployment**: Zero-downtime deployment to production
7. **Post-Deployment Health Checks**: Comprehensive health verification
8. **Automatic Rollback**: Rollback on health check failure (if enabled)
9. **Notification**: Production deployment summary

**Image Tags:**
- `fleetappregistry.azurecr.io/fleet-frontend:{VERSION}`
- `fleetappregistry.azurecr.io/fleet-api:{VERSION}`
- `fleetappregistry.azurecr.io/fleet-frontend:latest`
- `fleetappregistry.azurecr.io/fleet-api:latest`

---

## Required Secrets

Configure these secrets in GitHub Settings > Secrets and variables > Actions:

### Azure Container Registry
```
ACR_USERNAME            # Azure Container Registry username
ACR_PASSWORD            # Azure Container Registry password
```

### Azure Kubernetes Service
```
AZURE_CREDENTIALS       # Azure service principal credentials (JSON format)
```

Format for `AZURE_CREDENTIALS`:
```json
{
  "clientId": "YOUR_CLIENT_ID",
  "clientSecret": "YOUR_CLIENT_SECRET",
  "subscriptionId": "YOUR_SUBSCRIPTION_ID",
  "tenantId": "YOUR_TENANT_ID"
}
```

### Environment-Specific Secrets

#### Development
```
DEV_DATABASE_URL        # PostgreSQL connection string
DEV_JWT_SECRET          # JWT signing secret
```

#### Staging
```
STAGING_DATABASE_URL    # PostgreSQL connection string
STAGING_JWT_SECRET      # JWT signing secret
```

#### Production
```
PROD_DATABASE_URL       # PostgreSQL connection string
PROD_JWT_SECRET         # JWT signing secret
```

### Application Secrets (All Environments)
```
VITE_AZURE_MAPS_SUBSCRIPTION_KEY  # Azure Maps API key
OPENAI_API_KEY                     # OpenAI API key (optional)
ANTHROPIC_API_KEY                  # Anthropic API key (optional)
```

---

## Setup Instructions

### 1. Configure Azure Container Registry

```bash
# Login to Azure
az login

# Get ACR credentials
az acr credential show --name fleetappregistry --resource-group fleet-management-rg

# Store the username and password1 as GitHub secrets
```

### 2. Create Azure Service Principal

```bash
# Create service principal with contributor role
az ad sp create-for-rbac \
  --name "fleet-github-actions" \
  --role contributor \
  --scopes /subscriptions/{SUBSCRIPTION_ID}/resourceGroups/fleet-management-rg \
  --sdk-auth

# Copy the entire JSON output and save as AZURE_CREDENTIALS secret
```

### 3. Configure GitHub Environments

1. Go to repository Settings > Environments
2. Create three environments:
   - `development`: No protection rules (auto-deploy)
   - `staging`: Add required reviewers
   - `staging-approval`: Add required reviewers
   - `production`: Add required reviewers, wait timer (e.g., 5 minutes)
   - `production-approval`: Add required reviewers
   - `production-deployment`: Add required reviewers

### 4. Add Secrets to GitHub

1. Navigate to Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each secret from the list above

---

## Deployment Process

### Development Deployment

Development deploys automatically on every push to `develop`:

```bash
git checkout develop
git pull origin develop
# Make your changes
git add .
git commit -m "feat: add new feature"
git push origin develop
# Deployment starts automatically
```

### Staging Deployment

1. Go to Actions tab in GitHub
2. Select "Deploy to Staging" workflow
3. Click "Run workflow"
4. Enter the version (e.g., `v1.2.3`)
5. Approve the deployment when prompted
6. Monitor the deployment progress

### Production Deployment

1. Ensure the version has been tested in staging
2. Go to Actions tab in GitHub
3. Select "Deploy to Production" workflow
4. Click "Run workflow"
5. Enter the version (e.g., `v1.2.3`)
6. Choose rollback setting (recommended: enabled)
7. Approve at the first approval gate
8. Review the pre-deployment checks
9. Approve at the second approval gate
10. Monitor health checks
11. Verify successful deployment

**Production Rollback:**
If health checks fail and rollback is enabled, the deployment will automatically revert to the previous version.

---

## Monitoring Deployments

### View Workflow Status

1. Navigate to the Actions tab in GitHub
2. Select the workflow you want to monitor
3. Click on the specific run
4. View logs for each job

### Check Deployment in Kubernetes

```bash
# Set AKS context
az aks get-credentials --resource-group fleet-management-rg --name fleet-aks-cluster

# Check pods in dev environment
kubectl get pods -n fleet-management-dev

# Check pods in staging environment
kubectl get pods -n fleet-management-staging

# Check pods in production
kubectl get pods -n fleet-management

# View pod logs
kubectl logs -f deployment/fleet-api -n fleet-management

# Check deployment status
kubectl rollout status deployment/fleet-api -n fleet-management
```

---

## Troubleshooting

### Build Failures

**Issue:** Docker build fails
- Check Dockerfile syntax
- Verify all dependencies are in package.json
- Check build logs for specific errors

**Issue:** TypeScript errors
- Run `npm run build` locally to reproduce
- Fix type errors in the code
- Ensure tsconfig.json is correct

### Deployment Failures

**Issue:** Image pull errors
- Verify ACR credentials are correct
- Check if images exist in registry: `az acr repository list --name fleetappregistry`
- Ensure service principal has ACR pull permissions

**Issue:** Pod crashes after deployment
- Check pod logs: `kubectl logs -f deployment/fleet-api -n {namespace}`
- Verify environment variables and secrets
- Check health endpoints

**Issue:** Health checks fail
- Verify the service is running: `kubectl get pods -n {namespace}`
- Check if ingress is configured correctly
- Test health endpoint directly: `curl https://fleet.capitaltechalliance.com/api/health`

### Rollback Procedures

**Manual Rollback:**

```bash
# Rollback API deployment
kubectl rollout undo deployment/fleet-api -n fleet-management

# Rollback Frontend deployment
kubectl rollout undo deployment/fleet-frontend -n fleet-management

# Check rollback status
kubectl rollout status deployment/fleet-api -n fleet-management
kubectl rollout status deployment/fleet-frontend -n fleet-management
```

---

## Best Practices

1. **Always test in dev first**: Never skip the dev environment
2. **Staging is mandatory**: Always deploy to staging before production
3. **Use semantic versioning**: Follow v{MAJOR}.{MINOR}.{PATCH} format
4. **Enable rollback in production**: Always enable automatic rollback for production
5. **Monitor after deployment**: Watch logs and metrics for at least 15 minutes post-deployment
6. **Keep secrets updated**: Rotate secrets regularly
7. **Review approval**: Always review changes before approving production deployments

---

## CI/CD Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Code Push                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐        ┌─────▼────┐
    │   Main   │        │  Develop │
    │  Branch  │        │  Branch  │
    └────┬─────┘        └─────┬────┘
         │                    │
         │              ┌─────▼──────┐
         │              │   CI/CD    │
         │              │  Pipeline  │
         │              └─────┬──────┘
         │                    │
         │              ┌─────▼─────────┐
         │              │  Auto-Deploy  │
         │              │  to Dev Env   │
         │              └───────────────┘
         │
         │
    ┌────▼──────────────────────┐
    │  Manual Trigger Staging   │
    └────┬──────────────────────┘
         │
    ┌────▼─────────┐
    │   Approval   │
    └────┬─────────┘
         │
    ┌────▼──────────────┐
    │  Deploy Staging   │
    └────┬──────────────┘
         │
    ┌────▼───────────────┐
    │ Integration Tests  │
    └────┬───────────────┘
         │
    ┌────▼─────────────────────┐
    │ Manual Trigger Production│
    └────┬─────────────────────┘
         │
    ┌────▼────────────┐
    │  Approval #1    │
    └────┬────────────┘
         │
    ┌────▼──────────────┐
    │  Database Backup  │
    └────┬──────────────┘
         │
    ┌────▼────────────┐
    │  Approval #2    │
    └────┬────────────┘
         │
    ┌────▼────────────────┐
    │ Blue-Green Deploy   │
    │    Production       │
    └────┬────────────────┘
         │
    ┌────▼──────────────┐
    │  Health Checks    │
    └────┬──────────────┘
         │
    ┌────▼────────┐
    │  Success?   │
    └──┬───────┬──┘
       │       │
    Yes│       │No
       │       │
       │   ┌───▼────────┐
       │   │  Rollback  │
       │   └────────────┘
       │
    ┌──▼─────────┐
    │   Done     │
    └────────────┘
```

---

## Support

For issues with CI/CD pipelines:
1. Check workflow logs in GitHub Actions
2. Review Kubernetes pod logs
3. Contact DevOps team
4. Create an issue in the repository

---

## Version History

- **v1.0.0** (2025-11-12): Initial CI/CD pipeline setup
  - GitHub Actions workflows
  - Azure DevOps pipelines
  - Multi-environment support
  - Blue-green deployment
  - Automatic rollback
