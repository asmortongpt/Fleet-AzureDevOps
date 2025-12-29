# Fleet Deployment Checklist

Quick reference checklist for all deployment scenarios.

---

## Pre-Deployment Verification Checklist

### Code Quality
- [ ] All code committed to git
- [ ] Branch is up to date with main: `git pull origin main`
- [ ] No uncommitted changes: `git status`
- [ ] Tests pass locally: `npm test` (api dir)
- [ ] Linting passes: `npm run lint` (api dir)
- [ ] Build succeeds: `npm run build` (api dir) then `npm run build` (root)

### Environment Configuration
- [ ] `.env.production` exists with all required variables
- [ ] `AZURE_CLIENT_ID` set correctly
- [ ] `AZURE_CLIENT_SECRET` set correctly
- [ ] `AZURE_TENANT_ID` set correctly
- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` available
- [ ] `DATABASE_URL` configured and tested
- [ ] `REDIS_HOST` and `REDIS_PORT` correct (if applicable)
- [ ] Slack webhook URL configured (if using notifications)
- [ ] Email recipients configured (if using notifications)

### Azure Configuration
- [ ] Azure CLI installed: `az --version`
- [ ] Logged in to correct subscription
- [ ] Static Web Apps resource exists
- [ ] Service Principal has correct permissions
- [ ] Storage account accessible

### Infrastructure Health
- [ ] Database is up and running: `npm run check:db`
- [ ] Redis is accessible (if applicable): `redis-cli ping`
- [ ] Network connectivity to all services
- [ ] SSL certificates are valid
- [ ] Azure quota has available capacity

---

## Production Deployment Checklist

### 1. Pre-Deployment (15 minutes)
- [ ] Review changes to be deployed: `git log --oneline main..HEAD` (if on feature branch)
- [ ] Run health check on current production: `./health-check.sh`
- [ ] Verify no active incidents in Slack
- [ ] Notify team of planned deployment
- [ ] Create deployment ticket/issue

### 2. Backup and Snapshot (5 minutes)
- [ ] Current git commit documented: `git rev-parse HEAD > /tmp/pre-deploy.txt`
- [ ] Database backup initiated (if applicable)
- [ ] Current deployment state available: `cat .last-deployment`

### 3. Deployment Execution (10-15 minutes)
- [ ] Run deployment: `./deploy-production.sh`
- [ ] Monitor logs: `tail -f deployment/deployment-*.log`
- [ ] Watch Slack notifications
- [ ] DO NOT interrupt process

### 4. Health Verification (5 minutes)
- [ ] All checks pass: `./health-check.sh`
- [ ] Frontend loads: `curl -I https://[url]`
- [ ] API responds: `curl https://[url]/api/health`
- [ ] Database queries work
- [ ] No 5xx errors in logs

### 5. Post-Deployment (10 minutes)
- [ ] Run smoke tests: `npm run test:smoke`
- [ ] Spot-check key features manually
- [ ] Monitor Slack for user reports
- [ ] Document deployment details in ticket
- [ ] Mark deployment as complete
- [ ] Archive deployment log

---

## Staging Deployment Checklist

### 1. Pre-Deployment
- [ ] Code changes committed
- [ ] Branch is up to date: `git pull origin main`
- [ ] `.env.staging` configured (or .env.production)

### 2. Deploy to Staging
- [ ] Run deployment: `./deploy-staging.sh`
- [ ] Monitor deployment progress

### 3. Test in Staging
- [ ] Access staging environment
- [ ] Run E2E tests: `npm run test:e2e -- --config=staging`
- [ ] Manual smoke testing of key features
- [ ] Check for any console errors
- [ ] Verify database changes if applicable

### 4. Promote to Production
- [ ] All staging tests pass
- [ ] No critical issues found
- [ ] Approved for production release
- [ ] Follow Production Deployment Checklist

### 5. If Issues Found
- [ ] Document issue details
- [ ] Rollback: `./rollback.sh`
- [ ] Investigate root cause
- [ ] Fix and test in staging again

---

## Health Check Checklist

Run before and after deployments:

```bash
./health-check.sh
```

Verify:
- [ ] Frontend HTTP 200 response
- [ ] Backend /api/health endpoint responding
- [ ] Database connectivity successful
- [ ] Redis connection successful
- [ ] SSL certificate valid and not expiring soon
- [ ] Response times within acceptable range
- [ ] Overall status: HEALTHY

If any checks fail:
- [ ] Identify which service is down
- [ ] Check service logs
- [ ] Verify network connectivity
- [ ] Check Azure resource status
- [ ] Consider rollback if recently deployed

---

## Emergency Rollback Checklist

### Immediate Response
- [ ] Stop current deployment or ongoing requests
- [ ] Document issue details and timing
- [ ] Notify team in Slack #incidents channel
- [ ] Notify stakeholders

### Execute Rollback
- [ ] Identify good commit to rollback to: `git log --oneline -20`
- [ ] Run rollback: `./rollback.sh` (interactive) or `./rollback.sh [commit-hash]`
- [ ] Verify rollback completed: Check logs for "ROLLBACK COMPLETED"
- [ ] Wait 30+ seconds for services to stabilize

### Verification
- [ ] Run health checks: `./health-check.sh`
- [ ] Manual verification of key features
- [ ] Check logs for errors
- [ ] Verify database integrity
- [ ] Confirm users can access system

### Post-Rollback
- [ ] Document root cause
- [ ] Create issue for investigation
- [ ] Notify team of resolution
- [ ] Plan remediation
- [ ] Schedule postmortem if needed

---

## Troubleshooting Checklist

### Deployment Hangs or Times Out
- [ ] Check if database is responding: `npm run check:db`
- [ ] Verify internet connectivity
- [ ] Check Azure service status
- [ ] Look for authentication errors in logs: `grep ERROR deployment-*.log`
- [ ] Try canceling and rerunning

### Tests Fail During Deployment
- [ ] Run tests locally first: `npm test`
- [ ] Check for flaky tests
- [ ] Verify test database connectivity
- [ ] Review test logs for specific failures
- [ ] Consider skipping tests: `SKIP_TESTS=true ./deploy-staging.sh`

### Health Checks Fail After Deployment
- [ ] Wait 30+ seconds, try again
- [ ] Check individual service status
- [ ] Review service logs for errors
- [ ] Verify network connectivity
- [ ] Consider rollback: `./rollback.sh`

### Azure Deployment Fails
- [ ] Verify Azure credentials in .env
- [ ] Check Azure CLI installation: `az --version`
- [ ] Verify Service Principal permissions
- [ ] Check Azure resource quota limits
- [ ] Test authentication: `az account show`

### Database Migration Fails
- [ ] Verify database connectivity
- [ ] Check migration files exist
- [ ] Review migration error in logs
- [ ] Consider manual migration rollback
- [ ] Check database schema integrity

### Frontend Build Fails
- [ ] Clean install dependencies: `rm -rf node_modules && npm install`
- [ ] Check Node.js version: `node --version` (should be >= 18)
- [ ] Review TypeScript errors in logs
- [ ] Try building locally: `npm run build`
- [ ] Check for large dependencies

### Backend Build Fails
- [ ] Navigate to api directory: `cd api`
- [ ] Check TypeScript: `npx tsc --version`
- [ ] Review compilation errors
- [ ] Ensure all dependencies installed: `npm install`
- [ ] Check for import/export issues

---

## Performance Checkpoints

### During Deployment, Monitor:
- [ ] Deployment completes within 10-15 minutes
- [ ] No timeout errors in logs
- [ ] Build artifacts created successfully
- [ ] Azure deployment shows progress
- [ ] Health checks respond within 10 seconds

### After Deployment, Verify:
- [ ] Frontend loads in < 3 seconds
- [ ] API responses within < 500ms
- [ ] Database queries complete quickly
- [ ] No excessive memory usage
- [ ] CPU usage normal
- [ ] Network bandwidth normal

---

## Security Checklist

Before Each Production Deployment:
- [ ] No secrets/credentials in code changes
- [ ] No debug/test code in production branch
- [ ] All dependencies up to date: `npm audit`
- [ ] Security scan passes
- [ ] Access control verified
- [ ] Audit logging enabled

---

## Communication Checklist

### Before Deployment
- [ ] Notify team in Slack
- [ ] Create deployment ticket
- [ ] Set expected duration
- [ ] Identify who is monitoring

### During Deployment
- [ ] Provide updates every 5 minutes
- [ ] Alert to any issues immediately
- [ ] Keep stakeholders informed

### After Deployment
- [ ] Confirm success in Slack
- [ ] Document in deployment ticket
- [ ] Archive logs
- [ ] Send completion notification
- [ ] Schedule postmortem if issues occurred

---

## Quick Commands Reference

```bash
# Environment setup
source /path/to/.env.production

# Pre-deployment verification
git status
git log --oneline -5
npm run lint
npm test
./health-check.sh

# Staging deployment
./deploy-staging.sh

# Production deployment
./deploy-production.sh

# Health verification
./health-check.sh

# Emergency rollback
./rollback.sh
./rollback.sh abc123def456

# View recent deployments
ls -lah deployment/deployment-*.log | tail -5

# Search for errors
grep ERROR deployment/deployment-*.log
grep FAILED deployment/*.log

# View specific deployment log
tail -100 deployment/deployment-20251228_202100.log

# Test Azure authentication
az account show

# Test database
npm run check:db

# Test health endpoint
curl -v http://localhost:3000/api/health
```

---

## Emergency Contact

In case of critical issues:

**Primary Escalation:** [Team Lead]
**Secondary Escalation:** [Engineering Manager]
**Slack Channel:** #incidents
**Page Duty:** [On-Call Contact]

---

## Sign-Off Template

After completing production deployment:

```
Deployment Completed: [DATE/TIME]
Deployed Commit: [HASH]
Deployed By: [NAME]
Health Check: ✅ PASS / ❌ FAIL
Issues Found: None / [LIST]
Rollback Needed: Yes / No
Notes:

Approved by: [REVIEWER]
```

---

## Deployment Schedule

### Regular Deployments
- **Staging:** Daily at 10 AM (auto)
- **Production:** Tuesday-Thursday 2-4 PM (manual)
- **Hotfixes:** As needed (on-call)

### Deployment Window
- **Preferred:** 2 PM - 6 PM EST (low traffic)
- **Blackout Periods:** Holidays, end of month close
- **Minimum Notice:** 24 hours for major changes

---

Last Updated: December 28, 2025
Version: 1.0.0
