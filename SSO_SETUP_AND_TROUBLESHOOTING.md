# SSO Authentication Setup and Troubleshooting

This document provides comprehensive guidance on maintaining, troubleshooting, and preventing issues with Microsoft SSO authentication in Fleet Management.

## Table of Contents

- [Critical Dependencies](#critical-dependencies)
- [Quick Health Check](#quick-health-check)
- [Startup Procedure](#startup-procedure)
- [Common Issues](#common-issues)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Monitoring](#monitoring)
- [CI/CD Integration](#cicd-integration)

## Critical Dependencies

SSO authentication requires ALL of the following to work:

### 1. PostgreSQL Database
- **Required**: Must be accessible on `localhost:5432`
- **Database**: `fleet_test`
- **User**: `fleet_user`
- **Password**: `fleet_test_pass`
- **Schema**: Must include SSO columns: `provider`, `provider_user_id`, `azure_tenant_id`

### 2. API Server
- **Required**: Running on port `3001`
- **Endpoint**: `/api/auth/microsoft/exchange` must respond with 400 (not 500) for invalid tokens
- **Database Connection**: Must have active connection pool to PostgreSQL
- **Timeout**: Connection timeout set to 2 seconds (must connect quickly)

### 3. Frontend Server
- **Required**: Running on port `5174`
- **Redirect URI**: Must be configured as `http://localhost:5174/auth/callback`
- **MSAL**: Properly configured with Azure AD tenant and client ID

### 4. Database Schema
SSO columns must exist in the `users` table:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_tenant_id VARCHAR(255);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

## Quick Health Check

Run the automated health check script:

```bash
./check-sso-health.sh
```

Expected output:
```
✅ ALL CHECKS PASSED - SSO is healthy
```

If you see errors, follow the [Troubleshooting Guide](#troubleshooting-guide).

## Startup Procedure

### Option 1: Automated Startup (Recommended)

Use the automated startup script that verifies all dependencies:

```bash
./start-with-sso.sh
```

This script will:
1. Start Docker if not running
2. Start PostgreSQL if not accessible
3. Verify SSO database schema
4. Start API server with health checks
5. Start Frontend server with health checks
6. Verify SSO endpoint is responding

### Option 2: Manual Startup

If you prefer to start services manually:

```bash
# 1. Start Docker
open -a Docker

# 2. Start PostgreSQL (if using Docker)
docker start fleet-orchestration-db
# OR create new container:
docker run -d --name fleet-orchestration-db \
  -e POSTGRES_DB=fleet_test \
  -e POSTGRES_USER=fleet_user \
  -e POSTGRES_PASSWORD=fleet_test_pass \
  -p 5432:5432 \
  postgres:16-alpine

# 3. Verify database schema
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test < api/add_sso_columns.sql

# 4. Start API server
cd api && npm run dev

# 5. Start Frontend server (in new terminal)
npm run dev
```

## Common Issues

### Issue 1: Login Loop

**Symptoms**: After clicking "Sign in with Microsoft", you log in successfully but are redirected back to the login page.

**Cause**: Database connection pool timeout or failure

**Solution**:
```bash
# Check if PostgreSQL is running
lsof -ti:5432

# If not running, start it
docker start fleet-orchestration-db

# Restart API server
cd api && pkill -f "tsx.*server.ts" && npm run dev
```

**Root Cause**: The `/api/auth/microsoft/exchange` endpoint times out trying to connect to PostgreSQL, returns 500 error, frontend interprets this as failed login.

### Issue 2: "Invalid ID token format"

**Symptoms**: SSO exchange endpoint returns 400 with "Invalid ID token format"

**Cause**: Frontend is not sending ID token correctly

**Solution**: Verify `AuthCallback.tsx` is extracting and sending both `idToken` and `accessToken`:

```typescript
const exchangeResponse = await fetch('/api/auth/microsoft/exchange', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type: application/json' },
  body: JSON.stringify({
    accessToken,
    idToken // Must be included
  }),
})
```

### Issue 3: Redirect URI Mismatch

**Symptoms**: Microsoft login page shows error "Reply URL mismatch"

**Cause**: MSAL redirect URI doesn't match Azure AD app registration

**Solution**:
1. Check `.env` file: `VITE_AZURE_AD_REDIRECT_URI=http://localhost:5174/auth/callback`
2. Check `src/config/auth-config.ts` has port 5174
3. Verify Azure AD app registration has redirect URI: `http://localhost:5174/auth/callback`

### Issue 4: Import Error "@tantml:query"

**Symptoms**: Login page fails to load with import error

**Cause**: Typo in import statement

**Solution**:
```bash
# Find and fix typo
grep -r "@tantml:query" src/
# Should be: @tanstack/react-query
```

### Issue 5: Database Connection Timeout

**Symptoms**: API logs show "timeout exceeded when trying to connect"

**Cause**: PostgreSQL not accessible or connection pool exhausted

**Solution**:
```bash
# Test database connection
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "SELECT 1;"

# Check pool stats
curl http://localhost:3001/api/health/db

# Restart API to reset connection pool
cd api && pkill -f "tsx.*server.ts" && npm run dev
```

## Troubleshooting Guide

### Step 1: Verify All Dependencies

```bash
./check-sso-health.sh
```

### Step 2: Check Logs

**API Server Logs**:
```bash
tail -f /tmp/fleet-api-server.log
# Or if running in terminal: check the terminal output
```

**Frontend Server Logs**:
```bash
tail -f /tmp/fleet-frontend-server.log
# Or check browser console (F12)
```

### Step 3: Test SSO Endpoint Directly

```bash
# Should return 400 (not 500) for invalid token
curl -X POST http://localhost:3001/api/auth/microsoft/exchange \
  -H "Content-Type: application/json" \
  -d '{"idToken":"invalid"}'
```

Expected response:
```json
{"error":"Invalid ID token format"}
```

If you get 500 error, database connection is broken.

### Step 4: Verify Database Schema

```bash
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "
SELECT column_name FROM information_schema.columns
WHERE table_name='users' AND column_name IN ('provider', 'provider_user_id', 'azure_tenant_id');"
```

Should show all 3 columns.

### Step 5: Run End-to-End Test

```bash
node test-complete-sso-flow.cjs
```

This will open a browser and test the complete SSO flow. Follow the prompts.

## Monitoring

### Database Health Monitoring

The API server includes automatic database health monitoring that runs every 30 seconds.

**Enable logging** in `api/src/server.ts`:

```typescript
import { initializeDatabaseHealthMonitor } from './services/db-health-monitor'

// After database initialization
const monitor = initializeDatabaseHealthMonitor(pool)
```

**Check health status**:
```bash
curl http://localhost:3001/api/health/db
```

**Warning signs to watch for**:
- `Connection pool utilization high: >80%`
- `X clients waiting for connections`
- `Health check slow: >1000ms`
- `🚨 CRITICAL: Database unreachable`

### Automated Health Checks

**Run periodically**:
```bash
# Add to crontab for hourly checks
0 * * * * /path/to/check-sso-health.sh >> /var/log/sso-health.log 2>&1
```

**Pre-commit hook**:
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
./check-sso-health.sh || exit 1
```

## CI/CD Integration

### GitHub Actions

SSO health checks run automatically on:
- Push to `main`, `develop`, or `feature/**` branches
- Pull requests to `main` or `develop`
- Changes to SSO-related files

**Workflow**: `.github/workflows/sso-health-check.yml`

**What it tests**:
1. Database schema includes SSO columns
2. SSO exchange endpoint responds correctly
3. No import typos (e.g., @tantml:query)
4. Database connection works
5. API server starts successfully

**View results**: GitHub Actions tab in repository

### Pre-deployment Checks

Before deploying to production, run:

```bash
# Full health check
./check-sso-health.sh

# End-to-end test
node test-complete-sso-flow.cjs
```

## Prevention Checklist

To prevent SSO from breaking:

- [ ] Run `./check-sso-health.sh` before every commit
- [ ] Use `./start-with-sso.sh` instead of manual startup
- [ ] Monitor database connection pool utilization
- [ ] Set up automated health checks in cron
- [ ] Review CI/CD test results before merging
- [ ] Keep PostgreSQL running during development
- [ ] Test SSO after database schema changes
- [ ] Verify import statements (no @tantml typos)
- [ ] Check redirect URI configuration after .env changes

## Emergency Recovery

If SSO is completely broken:

```bash
# 1. Stop everything
pkill -f "tsx.*server.ts"
pkill -f "vite.*5174"

# 2. Verify database
docker start fleet-orchestration-db
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "SELECT 1;"

# 3. Re-apply SSO schema
PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test < api/add_sso_columns.sql

# 4. Use automated startup
./start-with-sso.sh

# 5. Run health check
./check-sso-health.sh

# 6. Test end-to-end
node test-complete-sso-flow.cjs
```

## Support

If SSO is still not working after following this guide:

1. Run `./check-sso-health.sh` and save output
2. Collect logs from `/tmp/fleet-api-server.log`
3. Run `node test-complete-sso-flow.cjs` and save output
4. Create GitHub issue with all outputs attached

## Additional Resources

- Microsoft MSAL Documentation: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview
- Azure AD App Registration: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
- PostgreSQL Documentation: https://www.postgresql.org/docs/
