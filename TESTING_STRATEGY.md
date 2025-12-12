# Fleet API - Testing Strategy

## Lessons Learned from Production Incident (2025-12-11)

### Incident Summary
**What Happened:** Deployed Docker image to production that built successfully in ACR but crashed at runtime due to tsx parse error.

**Root Cause:** Template string contained escaped SQL parameter (`\$1` instead of `$1`). The TypeScript compiler (tsc) accepted this, but tsx runtime rejected it.

**Impact:** Production API unavailable for ~10 minutes during rebuild and redeployment.

## Prevention Strategy

### 1. Local Pre-Deployment Testing

**Script:** `/test-docker-build.sh`

Run this BEFORE every production deployment:

```bash
./test-docker-build.sh
```

**What It Tests:**
- ✅ package.json syntax validation
- ✅ tsx-incompatible patterns (escaped `$` in SQL)
- ✅ Docker build completion
- ✅ Container startup without crashes
- ✅ Basic health endpoint check

**When to Run:**
- Before every `az acr build` command
- After fixing any TypeScript/syntax errors
- After modifying package.json
- After adding new SQL queries

### 2. CI/CD Automated Validation

**Workflow:** `.github/workflows/pre-deployment-validation.yml`

**Automatically Runs On:**
- Every push to main
- Every pull request to main

**Validation Steps:**
1. JSON syntax check
2. tsx compatibility scan
3. npm install test
4. TypeScript type check
5. Docker build test
6. Container startup test
7. Compliance validation (if available)

### 3. Known tsx Runtime Issues

**Issue #1: Escaped Dollar Signs in Template Strings**

❌ **WRONG:**
```typescript
const result = await pool.query(
  `SELECT * FROM vehicles WHERE id = \$1`, // Will crash tsx
  [id]
)
```

✅ **CORRECT:**
```typescript
const result = await pool.query(
  `SELECT * FROM vehicles WHERE id = $1`, // tsx compatible
  [id]
)
```

**Detection:**
```bash
grep -r '\\$[0-9]' api/src --include="*.ts"
```

**Issue #2: Invalid package.json Fields**

❌ **WRONG:**
```json
{
  "dependencies": {
    "// comment": "This will crash npm"
  }
}
```

✅ **CORRECT:**
```json
{
  "dependencies": {
    "zod": "^4.1.13"
  },
  "comments": {
    "note": "Use comments object for documentation"
  }
}
```

### 4. Production Deployment Checklist

**BEFORE deploying to production:**

- [ ] Run `./test-docker-build.sh` locally
- [ ] Verify GitHub Actions passed
- [ ] Check for any new SQL queries with parameters
- [ ] Validate package.json with `node -e "JSON.parse(require('fs').readFileSync('api/package.json'))"`
- [ ] Review recent commits for syntax changes
- [ ] Ensure all changes are committed and pushed

**DURING deployment:**

- [ ] Monitor ACR build logs for errors
- [ ] Wait for "Successfully pushed image" confirmation
- [ ] Check Container Apps revision status
- [ ] Monitor container logs for 5 minutes
- [ ] Test health endpoint: `curl https://fleet-api.gentlepond-ec715fc2.eastus2.azurecontainerapps.io/api/health`

**AFTER deployment:**

- [ ] Verify health endpoint returns 200 OK
- [ ] Check Application Insights for errors
- [ ] Test critical API endpoints
- [ ] Monitor for 30 minutes

### 5. Rollback Procedure

If production deployment fails:

```bash
# 1. Check container logs
az containerapp logs show \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --tail 100

# 2. List previous revisions
az containerapp revision list \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --query "[].{name:name,active:properties.active,created:properties.createdTime}" \
  --output table

# 3. Rollback to previous revision
az containerapp revision activate \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --revision <previous-revision-name>

# 4. Or deploy previous image version
az containerapp update \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --image fleetproductionacr.azurecr.io/fleet-api:previous-version
```

### 6. Testing Automation Roadmap

**Phase 1: Current (Implemented)**
- ✅ Local Docker build test script
- ✅ GitHub Actions CI/CD validation
- ✅ Syntax pattern detection

**Phase 2: Short Term (Next Sprint)**
- [ ] Add Vitest unit tests for all repositories
- [ ] Add integration tests for API endpoints
- [ ] Add tsx-specific linting rules
- [ ] Automated rollback on health check failure

**Phase 3: Long Term**
- [ ] Staging environment with automatic deployments
- [ ] Canary deployments (10% → 50% → 100%)
- [ ] Automated load testing
- [ ] Performance regression detection

## Commands Reference

### Quick Validation

```bash
# Validate package.json
node -e "JSON.parse(require('fs').readFileSync('api/package.json', 'utf8'))"

# Check for tsx issues
grep -r '\\$[0-9]' api/src --include="*.ts"

# Full pre-deployment test
./test-docker-build.sh
```

### Production Deployment

```bash
# 1. Test locally
./test-docker-build.sh

# 2. Build and push to ACR
az acr build --registry fleetproductionacr \
  --image fleet-api:v2.1.0-100percent \
  --image fleet-api:latest \
  --file api/Dockerfile ./api

# 3. Container app auto-updates with :latest tag

# 4. Verify deployment
curl https://fleet-api.gentlepond-ec715fc2.eastus2.azurecontainerapps.io/api/health
```

## Monitoring

### Health Check

```bash
# Production health endpoint
curl https://fleet-api.gentlepond-ec715fc2.eastus2.azurecontainerapps.io/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-11T...",
  "environment": "production",
  "version": "2.1.0-100percent"
}
```

### Container Logs

```bash
# Real-time logs
az containerapp logs show \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --tail 100 \
  --follow

# Recent logs
az containerapp logs show \
  --name fleet-api \
  --resource-group fleet-production-rg \
  --tail 50
```

## Incident Response

**If production API is down:**

1. **Check container status** (30 seconds)
   ```bash
   az containerapp show \
     --name fleet-api \
     --resource-group fleet-production-rg \
     --query "properties.{status:runningStatus,latestRevision:latestRevisionName}"
   ```

2. **Check logs for errors** (1 minute)
   ```bash
   az containerapp logs show --name fleet-api --resource-group fleet-production-rg --tail 100
   ```

3. **Rollback to previous version** (2 minutes)
   - Use rollback procedure above

4. **Fix issue locally** (10-30 minutes)
   - Run `./test-docker-build.sh` to reproduce
   - Fix the issue
   - Test locally again
   - Commit and push

5. **Redeploy** (5-10 minutes)
   - Build new image in ACR
   - Verify health endpoint

## Contact

**Production Issues:** File GitHub issue with label `production-incident`
**Testing Questions:** See `/test-docker-build.sh` comments

---

**Document Version:** 1.0
**Last Updated:** 2025-12-11
**Next Review:** After first successful production deployment with tests
