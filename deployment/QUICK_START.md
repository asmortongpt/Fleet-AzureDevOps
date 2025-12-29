# Fleet Deployment - Quick Start Guide

## 5-Minute Setup

### Step 1: Configure Environment (2 minutes)
```bash
# Copy example environment file
cp /Users/andrewmorton/Documents/GitHub/fleet-local/.env.example \
   /Users/andrewmorton/Documents/GitHub/fleet-local/.env.production

# Edit with your Azure credentials
nano /Users/andrewmorton/Documents/GitHub/fleet-local/.env.production

# Required variables:
# AZURE_CLIENT_ID=xxx
# AZURE_CLIENT_SECRET=xxx
# AZURE_TENANT_ID=xxx
# AZURE_STATIC_WEB_APPS_API_TOKEN=xxx
# DATABASE_URL=postgresql://...
```

### Step 2: Verify Prerequisites (2 minutes)
```bash
# Check required commands
node --version      # >= 18
npm --version       # >= 9
git --version       # >= 2.30
tsc --version       # TypeScript

# Check scripts are executable
ls -lah /Users/andrewmorton/Documents/GitHub/fleet-local/deployment/*.sh

# All should show: -rwxr-xr-x
```

### Step 3: Test Health Check (1 minute)
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/deployment
./health-check.sh

# Should show: ✅ status for all services
```

---

## Common Deployment Scenarios

### Scenario 1: Deploy Staging
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/deployment
./deploy-staging.sh
```
**Duration:** 4-6 minutes
**Best for:** Testing new features before production

### Scenario 2: Deploy Production
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/deployment
./deploy-production.sh
```
**Duration:** 10-15 minutes
**Best for:** Production releases

### Scenario 3: Emergency Rollback
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/deployment
./rollback.sh
```
**Duration:** 6-8 minutes
**Best for:** Reverting failed deployment

### Scenario 4: Quick Staging with Fast Mode
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/deployment
FAST_MODE=true ./deploy-staging.sh
```
**Duration:** 3-4 minutes
**Best for:** Quick iteration

---

## Script Locations

```
/Users/andrewmorton/Documents/GitHub/fleet-local/deployment/
├── deploy-production.sh      # Full production deployment
├── deploy-staging.sh         # Fast staging deployment
├── health-check.sh           # Health verification
├── rollback.sh               # Emergency rollback
├── README.md                 # Full documentation
├── DEPLOYMENT_CHECKLIST.md   # Detailed checklist
└── QUICK_START.md            # This file
```

---

## What Each Script Does

### deploy-production.sh
Comprehensive production deployment with:
- Linting and tests (mandatory)
- Security vulnerability scan
- Backend and frontend build
- Database migrations
- Azure deployment
- Health checks with auto-rollback

**When to use:** Ready for production release

### deploy-staging.sh
Rapid staging deployment with:
- Optional linting/tests
- Fast build process
- Azure deployment
- Quick health verification

**When to use:** Testing before production

### health-check.sh
Service health verification:
- Frontend availability
- Backend API status
- Database connectivity
- Redis connectivity
- SSL certificate validity
- Performance metrics

**When to use:** Before/after deployments, troubleshooting

### rollback.sh
Emergency rollback with:
- Git repository reset
- Azure redeployment
- Database migration options
- Health verification

**When to use:** Something went wrong, need to recover

---

## Troubleshooting Quick Tips

### Deployment Takes Too Long
```bash
# Use fast mode for staging
FAST_MODE=true ./deploy-staging.sh

# Or check what's happening
tail -f deployment/deployment-*.log
```

### Health Check Fails
```bash
# Check individual services
./health-check.sh

# Check specific database
npm run check:db

# Check specific backend
curl -v http://localhost:3000/api/health
```

### Need to Rollback
```bash
# Find previous commit
git log --oneline -5

# Rollback to previous deployment
./rollback.sh HEAD~1

# Or rollback interactively
./rollback.sh
```

### Tests Are Failing
```bash
# Skip tests for staging
SKIP_TESTS=true ./deploy-staging.sh

# Run tests locally first
cd api && npm test
```

---

## Deployment Decision Tree

```
START: Need to deploy?
│
├─ Is it a new feature for testing?
│  └─ YES → ./deploy-staging.sh (or FAST_MODE=true for speed)
│
├─ Is it ready for production?
│  └─ YES → ./deploy-production.sh (full checks)
│
├─ Is something broken in production?
│  └─ YES → ./rollback.sh (emergency recovery)
│
└─ Do you need to check system health?
   └─ YES → ./health-check.sh (status report)
```

---

## Essential Environment Variables

### Minimal Setup (Staging)
```bash
export AZURE_STATIC_WEB_APPS_API_TOKEN="your-token"
export AZURE_CLIENT_ID="your-id"
export AZURE_CLIENT_SECRET="your-secret"
export AZURE_TENANT_ID="your-tenant-id"
```

### Full Setup (Production)
```bash
export AZURE_STATIC_WEB_APPS_API_TOKEN="your-token"
export AZURE_CLIENT_ID="your-id"
export AZURE_CLIENT_SECRET="your-secret"
export AZURE_TENANT_ID="your-tenant-id"
export DATABASE_URL="postgresql://..."
export REDIS_HOST="localhost"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export DEPLOYMENT_EMAIL_TO="devops@example.com"
```

---

## Common Commands

```bash
# Check script versions
head -20 /Users/andrewmorton/Documents/GitHub/fleet-local/deployment/*.sh

# View deployment logs
tail -50 /Users/andrewmorton/Documents/GitHub/fleet-local/deployment/deployment-*.log

# Check git status before deployment
cd /Users/andrewmorton/Documents/GitHub/fleet-local && git status

# Pull latest changes
cd /Users/andrewmorton/Documents/GitHub/fleet-local && git pull origin main

# View deployment history
ls -lah /Users/andrewmorton/Documents/GitHub/fleet-local/deployment/deployment-*.log

# Clean old logs
rm -f /Users/andrewmorton/Documents/GitHub/fleet-local/deployment/*-20251225*.log

# Test deployment (dry-run)
DRY_RUN=true /Users/andrewmorton/Documents/GitHub/fleet-local/deployment/rollback.sh
```

---

## Success Indicators

### After Deployment Completes
- [ ] Script exits with code 0 (success)
- [ ] All health checks pass (✅ symbols)
- [ ] Slack notification received
- [ ] Email notification received
- [ ] Browser can access frontend
- [ ] API health endpoint responds

### If Something Goes Wrong
- [ ] Automatic rollback triggered
- [ ] Team notified via Slack/email
- [ ] System returns to previous state
- [ ] Health checks pass post-rollback
- [ ] Check logs for root cause

---

## Key Files Created

All scripts are production-ready with:

1. **Error Handling**
   - Exit on first error (`set -euo pipefail`)
   - Cleanup on exit
   - Rollback on failure

2. **Logging**
   - Timestamped log entries
   - Per-session log files
   - Persistent deployment.log

3. **Notifications**
   - Slack webhook integration
   - Email notifications
   - Escalation support

4. **Security**
   - No hardcoded secrets
   - Environment variable driven
   - Service Principal authentication
   - Audit logging

5. **Reliability**
   - Health check verification
   - Retry logic
   - Rollback capability
   - Performance metrics

---

## Next Steps

1. **Configure Environment**
   ```bash
   cp .env.example .env.production
   # Edit with your credentials
   ```

2. **Test Setup**
   ```bash
   ./health-check.sh
   ```

3. **Try Staging**
   ```bash
   ./deploy-staging.sh
   ```

4. **Deploy Production**
   ```bash
   ./deploy-production.sh
   ```

5. **Monitor Results**
   ```bash
   ./health-check.sh
   tail -f deployment/deployment-*.log
   ```

---

## Reference Documentation

For complete details, see:
- **README.md** - Full documentation
- **DEPLOYMENT_CHECKLIST.md** - Detailed checklist
- **QUICK_START.md** - This file

---

## Support

For issues or questions:
1. Check the logs: `deployment/deployment-*.log`
2. Run health check: `./health-check.sh`
3. Review documentation: `README.md`
4. Check git status: `git status`
5. Test components individually

---

**You're all set! Happy deploying!** 🚀

Last Updated: December 28, 2025
Version: 1.0.0
