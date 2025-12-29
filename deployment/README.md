# Fleet Production Deployment Automation

Complete production-ready deployment automation scripts for the Fleet Management System. These scripts handle full deployment lifecycle including pre-checks, builds, database migrations, Azure deployment, health verification, and emergency rollback.

## Quick Start

### Production Deployment
```bash
./deploy-production.sh
```

### Staging Deployment
```bash
./deploy-staging.sh
```

### Health Checks
```bash
./health-check.sh
```

### Emergency Rollback
```bash
./rollback.sh
```

---

## Scripts Overview

### 1. deploy-production.sh (100+ lines)

**Complete production deployment with comprehensive pre-checks and safeguards.**

#### Features:
- Full environment pre-deployment validation
- Linting and unit tests (mandatory)
- Integration test execution
- Security vulnerability scanning (npm audit)
- TypeScript compilation for backend
- Frontend production build (npm run build)
- Database migration execution
- Azure Static Web Apps deployment
- Multi-level health checks with retries
- Automatic rollback on health check failure
- Slack and email notifications
- Comprehensive logging with timestamps

#### Pre-Deployment Checks:
- Required commands availability (node, npm, git, tsc, curl)
- Environment file validation (.env.production)
- Git repository status validation
- Git remote configuration

#### Build Process:
1. **Backend Build:**
   - Clean dist directory
   - TypeScript compilation (tsc)
   - Build output verification

2. **Frontend Build:**
   - Dependency installation (npm install --production)
   - Vite production build
   - Output directory validation

#### Database Operations:
- Database connectivity verification
- Drizzle ORM migrations execution
- Migration rollback on failure

#### Deployment:
- Azure Static Web Apps authentication (Service Principal)
- Static Web Apps CLI deployment (primary)
- Azure CLI fallback deployment
- Deployment checkpoint saved for rollback

#### Health Checks (with 10 retries):
- Frontend HTTP 200 response verification
- Backend /api/health endpoint check
- Database connectivity validation
- Redis connectivity verification
- SSL certificate validity check
- Response time analysis

#### Rollback:
- Automatic rollback triggered on health check failure
- Returns to previous git commit
- Rebuilds and redeploys previous version
- Verifies rollback success

#### Notifications:
- Slack webhook integration (colored status)
- Email notifications (deployment status)
- Logging to deployment.log + timestamped log file

#### Usage:
```bash
./deploy-production.sh
```

#### Exit Codes:
- `0` - Deployment successful
- `1` - Deployment failed (rollback attempted)

#### Logs:
- `/deployment/deployment.log` - Persistent log
- `/deployment/deployment-YYYYMMDD_HHMMSS.log` - Session-specific log

---

### 2. deploy-staging.sh (80+ lines)

**Rapid staging deployment with relaxed validation for testing.**

#### Features:
- Relaxed pre-checks (optional linting/tests)
- Faster build process (FAST_MODE available)
- Optional dependency installation
- Database migrations with warnings (non-blocking)
- Azure deployment to staging environment
- Quick health checks (30-second wait)
- Minimal but essential logging
- Feature flags for flexibility

#### Feature Flags:
```bash
export SKIP_LINT=true          # Skip linting checks
export SKIP_TESTS=true         # Skip test execution
export SKIP_SECURITY_SCAN=true # Skip security audit (default: true)
export FAST_MODE=true          # Skip npm install
```

#### Pre-Deployment Checks:
- Required commands verification
- Environment file (.env.staging or .env.production)
- Git repository validation

#### Build Process:
1. **Backend:** TypeScript compilation (warnings non-blocking)
2. **Frontend:** Production build with optional dependency installation

#### Database:
- Non-blocking migrations (warnings allowed)
- Skips if DATABASE_URL not configured

#### Deployment:
- Azure Static Web Apps authentication
- SWA CLI or Azure CLI deployment
- Less strict error handling

#### Health Checks:
- Single frontend reachability check
- 30-second stabilization wait
- Non-blocking (warnings only)

#### Notifications:
- Slack webhook integration (optional)
- Simpler failure reporting

#### Usage:
```bash
# Standard staging deployment
./deploy-staging.sh

# Fast mode (skip deps)
FAST_MODE=true ./deploy-staging.sh

# Skip all checks
SKIP_LINT=true SKIP_TESTS=true ./deploy-staging.sh
```

#### Logs:
- `/deployment/staging-deployment-YYYYMMDD_HHMMSS.log`

---

### 3. health-check.sh (60+ lines)

**Comprehensive health verification for all services.**

#### Features:
- Frontend availability (HTTP 200/304)
- Backend API health endpoint (/api/health)
- Database connectivity
- Redis cache availability
- SSL certificate validation
- Azure service verification
- Performance metrics collection
- Response time analysis
- Detailed results reporting
- JSON health endpoint parsing

#### Checks:

1. **Frontend Checks:**
   - Main URL reachability
   - HTTP status code validation
   - Health endpoint availability (if present)
   - API base endpoint verification

2. **Backend API Checks:**
   - Health endpoint availability
   - JSON response validation
   - API root endpoint check

3. **Database Checks:**
   - npm check:db script (preferred)
   - pg_isready utility (fallback)
   - Netcat port connectivity (fallback)
   - PostgreSQL connectivity on port 5432

4. **Redis Checks:**
   - redis-cli PING command
   - Netcat port connectivity
   - Version information retrieval

5. **SSL Certificate Checks:**
   - Certificate validity verification
   - Expiration date analysis
   - Days remaining calculation
   - Warning for <30 days to expiry

6. **Azure Service Checks:**
   - Azure AD connectivity verification
   - Service availability confirmation

7. **Performance Metrics:**
   - Average response time (3 samples)
   - Response time trends
   - Content size verification

#### Configuration:

Environment variables override defaults:
```bash
export FRONTEND_URL="https://your-app.azurestaticapps.net"
export BACKEND_URL="http://localhost:3000"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
export REDIS_ENABLED="true"
```

Disable specific checks:
```bash
export CHECK_FRONTEND=false
export CHECK_BACKEND=false
export CHECK_DATABASE=false
export CHECK_REDIS=false
export CHECK_SSL=false
export CHECK_AZURE=false
```

#### Output:
- Color-coded status indicators (✅ pass, ❌ fail, ⚠️ warn)
- Pass rate percentage
- Overall health status (HEALTHY/DEGRADED/UNHEALTHY)
- Detailed log file with all metrics

#### Exit Codes:
- `0` - All checks passed (HEALTHY)
- `1` - One or more checks failed

#### Usage:
```bash
# Standard health check
./health-check.sh

# Custom environment
FRONTEND_URL="https://prod.example.com" ./health-check.sh

# Database only
CHECK_FRONTEND=false CHECK_BACKEND=false CHECK_SSL=false ./health-check.sh

# Disable optional Redis checks
REDIS_ENABLED=false ./health-check.sh
```

#### Logs:
- `/deployment/health-check-YYYYMMDD_HHMMSS.log`

---

### 4. rollback.sh (50+ lines)

**Emergency rollback for failed deployments.**

#### Features:
- Git repository rollback to previous commit
- Azure Static Web Apps redeployment
- Database migration rollback (optional)
- Deployment state tracking
- User confirmation (can be forced)
- Dry-run mode for testing
- Slack and email notifications
- Escalation notification support
- Detailed rollback logging
- Health verification post-rollback

#### Rollback Targets:

1. **Automatic Detection:**
   - Reads from `.last-deployment` state file (if available)
   - Uses commit hash from last successful deployment

2. **User Input:**
   - Prompts for commit hash
   - Shows recent 10 commits for reference
   - Validates commit existence

3. **Command Line:**
   - Accepts commit hash as first argument
   ```bash
   ./rollback.sh a1b2c3d4e5f6
   ```

#### Configuration:

Feature flags:
```bash
export PRESERVE_DATABASE=false  # Keep database (don't rollback migrations)
export FORCE_ROLLBACK=true      # Skip user confirmation
export DRY_RUN=true             # Test rollback without executing
```

#### Rollback Process:

1. **Git Rollback:**
   - Verifies target commit validity
   - Stashes any uncommitted changes
   - Resets to target commit with --hard flag
   - Verifies new HEAD position

2. **Azure Redeployment:**
   - Authenticates with Azure (Service Principal)
   - Rebuilds frontend from rolled-back code
   - Redeploys to Azure Static Web Apps
   - Verifies deployment success

3. **Database Rollback (Optional):**
   - Detects migration tool (Drizzle)
   - Skips if PRESERVE_DATABASE=true
   - Notifies if manual rollback needed

4. **Health Verification:**
   - Waits 30 seconds for services to stabilize
   - Runs health-check.sh validation
   - Reports any post-rollback issues

#### Safety Features:

- User confirmation required (unless FORCE_ROLLBACK=true)
- Validates all prerequisite commands
- Checks deployment state file existence
- Verifies git repository integrity
- Saves uncommitted changes (stash)
- Validates target commit before rollback
- Dry-run mode for testing

#### Notifications:

1. **Slack:**
   - Rollback execution alert
   - Target commit information
   - Performer identification (whoami@hostname)
   - Rollback log location

2. **Email:**
   - Primary recipient (EMAIL_TO)
   - Escalation recipient (ESCALATION_EMAIL)
   - Full rollback details
   - Log file reference

#### Exit Codes:
- `0` - Rollback successful
- `1` - Rollback failed (manual intervention needed)

#### Usage:

```bash
# Interactive rollback (prompts for confirmation)
./rollback.sh

# Specific commit
./rollback.sh a1b2c3d4e5f6

# Forced rollback (no confirmation)
FORCE_ROLLBACK=true ./rollback.sh

# Dry-run test
DRY_RUN=true ./rollback.sh

# Preserve database during rollback
PRESERVE_DATABASE=true ./rollback.sh

# All options
FORCE_ROLLBACK=true PRESERVE_DATABASE=true ./rollback.sh a1b2c3d4e5f6
```

#### Logs:
- `/deployment/rollback-YYYYMMDD_HHMMSS.log`

---

## Environment Configuration

### Required Environment Variables

**Azure Configuration** (.env.production or .env.staging):
```bash
# Azure Static Web Apps
AZURE_STATIC_WEB_APPS_API_TOKEN=xxx          # Must be in GitHub Secrets
AZURE_STATIC_WEB_APP_NAME=fleet-production
AZURE_RESOURCE_GROUP=fleet-rg

# Azure Service Principal Authentication
AZURE_CLIENT_ID=xxx
AZURE_CLIENT_SECRET=xxx
AZURE_TENANT_ID=xxx
AZURE_SUBSCRIPTION=xxx
```

**Database Configuration:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/fleet
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=fleet
DATABASE_USER=postgres
```

**Redis Configuration:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true
```

**Frontend/Backend URLs:**
```bash
FRONTEND_URL=https://proud-bay-0fdc8040f.3.azurestaticapps.net
BACKEND_URL=http://localhost:3000
BACKEND_HEALTH_ENDPOINT=/api/health
```

**Notifications:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DEPLOYMENT_EMAIL_TO=devops@example.com
ESCALATION_EMAIL=security@example.com
```

### Setting Environment Variables

**Option 1: .env file**
```bash
# Create .env.production in project root
cp .env.example .env.production
# Edit with your configuration
```

**Option 2: Export before running**
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export DEPLOYMENT_EMAIL_TO="devops@example.com"
./deploy-production.sh
```

**Option 3: Inline export**
```bash
SLACK_WEBHOOK_URL="..." ./deploy-production.sh
```

---

## Deployment Workflows

### Standard Production Deployment

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Run production deployment
./deployment/deploy-production.sh

# 3. Verify deployment
./deployment/health-check.sh

# 4. Check logs
tail -f ./deployment/deployment-*.log
```

### Staging for Testing

```bash
# 1. Deploy to staging
./deployment/deploy-staging.sh

# 2. Run tests
npm run test:e2e -- --config=staging

# 3. If issues found, rollback
./deployment/rollback.sh
```

### Quick Hotfix Deployment

```bash
# 1. Make and commit hotfix
git add .
git commit -m "fix: critical issue"

# 2. Deploy with FAST_MODE
FAST_MODE=true ./deployment/deploy-staging.sh

# 3. If successful, promote to production
./deployment/deploy-production.sh
```

### Emergency Rollback Procedure

```bash
# 1. Assess the issue
./deployment/health-check.sh

# 2. Check recent commits
git log --oneline -10

# 3. Rollback (interactive)
./deployment/rollback.sh

# 4. Or rollback to specific commit
./deployment/rollback.sh abc123def456

# 5. Verify rollback
./deployment/health-check.sh

# 6. Investigate root cause
tail -f ./deployment/rollback-*.log
```

### Scheduled Deployment (Cron)

```bash
# Add to crontab
SHELL=/bin/bash
0 2 * * 0 cd /path/to/fleet-local && ./deployment/deploy-staging.sh >> /var/log/fleet-deploy.log 2>&1
0 6 * * 1 cd /path/to/fleet-local && ./deployment/deploy-production.sh >> /var/log/fleet-deploy.log 2>&1
```

---

## Pre-Requisites

### System Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git >= 2.30.0
- curl >= 7.0
- Bash >= 4.0
- TypeScript compiler (tsc)
- (Optional) Azure CLI
- (Optional) SWA CLI
- (Optional) redis-cli
- (Optional) PostgreSQL client tools (pg_isready)

### Installation

```bash
# macOS
brew install node git curl

# Ubuntu/Debian
sudo apt-get install nodejs npm git curl

# Optional tools
npm install -g typescript @azure/static-web-apps-cli

# Azure CLI (optional but recommended)
curl -sL https://aka.ms/InstallAzureCLIDeb | bash
```

### Project Setup
```bash
# 1. Navigate to deployment directory
cd /path/to/fleet-local/deployment

# 2. Verify scripts are executable
chmod +x *.sh

# 3. Configure environment
cp ../.env.example ../.env.production
# Edit .env.production with your Azure credentials

# 4. Test health check (no deployment)
./health-check.sh
```

---

## Logging and Debugging

### Log Locations

**Deployment Logs:**
- Persistent: `/deployment/deployment.log`
- Session: `/deployment/deployment-YYYYMMDD_HHMMSS.log`

**Staging Logs:**
- `/deployment/staging-deployment-YYYYMMDD_HHMMSS.log`

**Health Check Logs:**
- `/deployment/health-check-YYYYMMDD_HHMMSS.log`

**Rollback Logs:**
- `/deployment/rollback-YYYYMMDD_HHMMSS.log`

### Viewing Logs

```bash
# Current deployment progress
tail -f deployment/deployment-*.log

# All logs with timestamps
grep ERROR deployment/*.log

# Search for specific failure
grep "Backend build failed" deployment/*.log

# View rollback sequence
cat deployment/rollback-*.log | grep -A5 "EXECUTING ROLLBACK"
```

### Debug Mode

```bash
# Verbose bash execution
bash -x ./deployment/deploy-production.sh

# DRY RUN - test without executing
DRY_RUN=true ./deployment/rollback.sh

# Skip only linting
SKIP_LINT=true ./deployment/deploy-staging.sh
```

---

## Troubleshooting

### Common Issues

#### "AZURE_STATIC_WEB_APPS_API_TOKEN not set"
**Solution:** Set the token in .env.production or GitHub Secrets
```bash
export AZURE_STATIC_WEB_APPS_API_TOKEN="your-token"
```

#### "Cannot connect to database"
**Solution:** Verify DATABASE_URL and network connectivity
```bash
# Test connection
DATABASE_URL="postgresql://..." npm run check:db

# If using docker-compose
docker-compose ps
docker-compose logs postgres
```

#### "Health checks failed - initiating rollback"
**Solution:** Check backend logs and health endpoint
```bash
# Verify backend is running
curl -v http://localhost:3000/api/health

# Check backend logs
docker-compose logs api

# Check database
docker-compose logs postgres
```

#### "Frontend build failed"
**Solution:** Check Node.js version and dependencies
```bash
# Verify versions
node --version  # Should be >= 18
npm --version   # Should be >= 9

# Clean install
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

#### "Azure authentication failed"
**Solution:** Verify Service Principal credentials
```bash
# Test authentication
az login --service-principal \
  -u "$AZURE_CLIENT_ID" \
  -p "$AZURE_CLIENT_SECRET" \
  --tenant "$AZURE_TENANT_ID"

# List subscriptions
az account list
```

### Getting Help

1. Check the detailed log file: `deployment/deployment-*.log`
2. Run health check for diagnostics: `./health-check.sh`
3. Review recent commits: `git log --oneline -20`
4. Check Slack notifications for error details
5. Review email notifications from deployment system

---

## Security Considerations

### Secrets Management
- Never commit .env.production to git
- Store AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub Secrets
- Use Azure Key Vault for sensitive credentials
- Rotate credentials regularly

### Access Control
- Restrict deployment scripts to authorized users
- Use Git branch protection rules
- Require PR reviews before production deployment
- Audit deployment logs regularly

### Audit Trail
- All deployments are logged with timestamp
- Rollback events are recorded with performer info
- Slack/email notifications provide real-time alerts
- Deployment state saved for traceability

### Best Practices
1. Always run health checks after deployment
2. Test staging before production
3. Keep rollback procedures updated
4. Monitor health checks continuously
5. Archive logs periodically for compliance
6. Use DRY_RUN mode to test scripts

---

## Performance Characteristics

### Script Execution Times

**deploy-production.sh:**
- Pre-checks: ~1 minute
- Tests: ~2-3 minutes
- Builds: ~2-3 minutes
- Database migrations: ~30 seconds
- Azure deployment: ~2-3 minutes
- Health checks: ~2-3 minutes
- **Total: 10-15 minutes**

**deploy-staging.sh (FAST_MODE=true):**
- Pre-checks: ~30 seconds
- Builds: ~1-2 minutes
- Azure deployment: ~2-3 minutes
- Health checks: ~1 minute
- **Total: 4-6 minutes**

**health-check.sh:**
- All checks: ~1-2 minutes
- Frontend only: ~10 seconds

**rollback.sh:**
- Git rollback: ~10 seconds
- Build: ~2-3 minutes
- Azure redeployment: ~2-3 minutes
- Verification: ~1 minute
- **Total: 6-8 minutes**

---

## Maintenance

### Monthly Tasks
- Review and archive old logs
- Update scripts with latest best practices
- Test rollback procedures
- Verify all environment variables are current

### Quarterly Tasks
- Review and update documentation
- Audit security credentials
- Performance optimization review
- Disaster recovery drill

### Yearly Tasks
- Complete audit trail review
- Security assessment
- Update to latest Node/npm versions
- Process documentation updates

---

## Support and Contributing

For issues, improvements, or questions:
1. Check existing logs and documentation
2. Review script comments for implementation details
3. Test changes in staging environment first
4. Document any modifications
5. Keep deployment procedures documented

---

## License and Attribution

These deployment scripts are production-ready and follow best practices for:
- Security (parameterized inputs, no hardcoded secrets)
- Reliability (error handling, retries, rollback)
- Observability (detailed logging, notifications)
- Maintainability (clear code, documentation)

Last Updated: December 28, 2025
Version: 1.0.0
