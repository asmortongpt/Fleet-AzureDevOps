# Fleet-CTA Deployment Checklist

## Pre-Deployment Phase (Week Before)

### Code Quality & Testing

```
☐ Run all unit tests (frontend and backend)
  Command: npm test && cd api && npm test && cd ..
  Expected: All tests passing, no failures

☐ Run integration tests
  Command: cd api && npm run test:integration && cd ..
  Expected: All integration tests passing

☐ TypeScript type check (no errors)
  Command: npm run typecheck
  Expected: 0 errors, 0 warnings

☐ Lint check (no critical issues)
  Command: npm run lint
  Expected: No high-severity violations

☐ Security audit (no critical vulnerabilities)
  Command: npm audit && cd api && npm audit && cd ..
  Expected: No critical or high severity issues

☐ Performance test (build and bundle sizes)
  Command: npm run build && du -sh dist/
  Expected: Build time < 2 min, dist < 20 MB
```

### Infrastructure Preparation

```
☐ Azure subscription verified
  Verify access: az account show

☐ Resource groups created
  ├── fleet-prod-rg (primary)
  ├── fleet-database-rg
  ├── fleet-security-rg
  └── fleet-monitoring-rg

☐ Azure CLI configured
  Command: az account set --subscription "<subscription-id>"

☐ Service Principal created (if using automation)
  Command: az ad sp create-for-rbac --name "fleet-deployment"

☐ Permissions verified
  ├── Owner or Contributor role on subscription
  ├── Can create Key Vault
  ├── Can create App Service
  └── Can create PostgreSQL
```

### Secrets Management

```
☐ Azure Key Vault created
  Name: fleet-secrets-prod-xyz
  Region: Same as primary region (eastus2)

☐ All secrets generated and stored
  ├── DATABASE-PASSWORD (32+ chars)
  ├── REDIS-PASSWORD (32+ chars)
  ├── JWT-SECRET (64+ chars)
  ├── SESSION-SECRET (32+ chars)
  ├── AZURE-AD-CLIENT-ID
  ├── AZURE-AD-CLIENT-SECRET
  ├── GOOGLE-MAPS-API-KEY
  ├── AZURE-OPENAI-KEY
  ├── SENTRY-DSN
  └── SMTP-PASSWORD (app-specific)

☐ Key Vault access policies configured
  ├── Service Principal has get/list
  ├── App Service has managed identity
  └── Your user has admin access for updates
```

### Backup & Disaster Recovery

```
☐ Git repository backed up
  Command: git tag "pre-prod-$(date +%Y%m%d-%H%M%S)"
  Command: git push origin --tags

☐ Database snapshot created (if upgrading existing DB)
  Command: pg_dump existing_db > pre-migration-backup.sql

☐ Schema export created
  Command: pg_dump --schema-only prod_db > schema.sql

☐ Runbook documentation reviewed
  ☐ Rollback procedures documented
  ☐ Incident response plan prepared
  ☐ Team trained on emergency procedures

☐ Monitoring dashboards prepared
  ☐ Application Insights dashboard created
  ☐ Alerts configured and tested
  ☐ Log Analytics queries saved
```

### Documentation Review

```
☐ Environment documentation current
  Check: /docs/ENVIRONMENT_SETUP.md
  ☐ All env vars documented
  ☐ Secrets inventory complete

☐ Deployment guide reviewed
  Check: /docs/DEPLOYMENT_GUIDE.md
  ☐ All steps verified
  ☐ Commands tested locally

☐ Infrastructure requirements understood
  Check: /docs/INFRASTRUCTURE_REQUIREMENTS.md
  ☐ Sizing decisions made
  ☐ Cost projections reviewed

☐ Runbook updated
  ☐ Rollback procedures documented
  ☐ Team trained
  ☐ Emergency contacts listed
```

---

## Database Deployment Phase

### Pre-Deployment Database Setup

```
☐ PostgreSQL Server Created
  Command: az postgres server create \
    --resource-group fleet-prod-rg \
    --name fleet-db-prod \
    --location eastus2 \
    --admin-user cloudadmin \
    --admin-password $(openssl rand -base64 32) \
    --sku-name B_Gen5_2 \
    --storage-size 51200 \
    --backup-retention 35 \
    --geo-redundant-backup Enabled
  Verify: az postgres server list --resource-group fleet-prod-rg

☐ Firewall rules configured
  Command: az postgres server firewall-rule create \
    --resource-group fleet-prod-rg \
    --server-name fleet-db-prod \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

☐ Initial database created
  Command: psql -h fleet-db-prod.postgres.database.azure.com \
    -U cloudadmin \
    -d postgres \
    -c "CREATE DATABASE fleet_production;"

☐ Database users created
  ☐ fleet_webapp_user (for application)
  ☐ fleet_readonly_user (for reporting)
  ☐ Permissions configured
  Verify: \du (in psql)
```

### Schema Migration

```
☐ Migrations prepared
  Command: cd api && npm run migrate:generate
  ☐ Review migration files in /api/src/db/migrations/
  ☐ Verify no destructive changes

☐ Test migration on staging first (if available)
  Command: DATABASE_URL=... npm run migrate:push
  Expected: All migrations succeed

☐ Production migration executed
  Command: cd api && npm install
  Command: DATABASE_HOST=fleet-db-prod.postgres.database.azure.com \
    DATABASE_USER=fleet_webapp_user \
    DATABASE_PASSWORD=<from-key-vault> \
    DATABASE_NAME=fleet_production \
    npm run migrate:push
  Expected: All migrations succeed with no errors
  Verify: psql -c "\dt" (check tables created)

☐ Post-migration verification
  ☐ All 100+ tables created
  ☐ Indexes created
  ☐ Constraints in place
  ☐ Foreign keys configured
  ☐ Sequences initialized

☐ Initial data seeded (if applicable)
  Command: npm run seed
  Expected: Seed script completes successfully
  Verify: Check row counts in key tables
```

### Database Configuration

```
☐ Connection pool configured
  Setting: DB_POOL_SIZE=30
  ☐ Max connections: 100 (server limit)
  ☐ App pool: 30
  ☐ Admin pool: 5
  ☐ ReadOnly pool: 10

☐ SSL/TLS enforced
  Setting: require_secure_transport = ON
  Database connection: sslmode=require

☐ Backup schedule configured
  ☐ Daily automatic backups enabled
  ☐ 35-day retention set
  ☐ Geo-redundant backup enabled

☐ Monitoring enabled
  ☐ Slow query logging enabled
  ☐ CPU/memory alerts configured
  ☐ Connection pool alerts set
  ☐ Storage space alerts enabled
```

---

## Backend Deployment Phase

### Build & Package

```
☐ Backend code built
  Command: cd api && npm ci
  Command: npm run typecheck
  Command: npm run lint
  Command: npm test
  Command: npm run build
  Expected: dist/server.js created (no errors)

☐ Build artifacts verified
  ☐ JavaScript output size reasonable (< 10 MB)
  ☐ No node_modules in dist/
  ☐ Source maps included for debugging

☐ Docker image built (if using containers)
  Command: docker build -f api/Dockerfile -t fleet-api:prod .
  Command: docker image ls | grep fleet-api
  Expected: Image builds successfully
```

### Redis Cache Setup

```
☐ Redis Cache created
  Command: az redis create \
    --resource-group fleet-prod-rg \
    --name fleet-redis-prod \
    --location eastus2 \
    --sku Premium \
    --vm-size p1
  Verify: az redis show --name fleet-redis-prod

☐ Password generated and stored in Key Vault
  Command: az keyvault secret set \
    --vault-name fleet-secrets-prod-xyz \
    --name REDIS-PASSWORD \
    --value "$(openssl rand -base64 32)"

☐ Redis configuration updated
  ☐ Minimum TLS version: 1.2
  ☐ SSL port: 6380
  ☐ Non-SSL disabled
  ☐ Firewall rules applied

☐ Connection tested
  Command: redis-cli -h fleet-redis-prod.redis.cache.windows.net \
    -p 6380 \
    -a $(az keyvault secret show --vault-name fleet-secrets-prod-xyz \
          --name REDIS-PASSWORD --query value -o tsv) \
    --tls PING
  Expected: PONG
```

### App Service Deployment

```
☐ App Service Plan created
  Command: az appservice plan create \
    --name fleet-api-plan \
    --resource-group fleet-prod-rg \
    --sku B2 \
    --is-linux
  Verify: az appservice plan list

☐ App Service created
  Command: az webapp create \
    --resource-group fleet-prod-rg \
    --plan fleet-api-plan \
    --name fleet-api-prod \
    --runtime "node|20-lts"
  Verify: az webapp list

☐ Environment variables configured
  Command: az webapp config appsettings set \
    --resource-group fleet-prod-rg \
    --name fleet-api-prod \
    --settings \
      NODE_ENV="production" \
      DATABASE_HOST="fleet-db-prod.postgres.database.azure.com" \
      DATABASE_NAME="fleet_production" \
      DATABASE_USER="fleet_webapp_user" \
      REDIS_HOST="fleet-redis-prod.redis.cache.windows.net" \
      PORT="3001"

  ☐ Key Vault reference secrets
  Command: az webapp config appsettings set \
    --resource-group fleet-prod-rg \
    --name fleet-api-prod \
    --settings \
      DATABASE_PASSWORD="@Microsoft.KeyVault(SecretUri=...)" \
      REDIS_PASSWORD="@Microsoft.KeyVault(SecretUri=...)" \
      JWT_SECRET="@Microsoft.KeyVault(SecretUri=...)"

☐ Identity assigned for Key Vault access
  Command: az webapp identity assign \
    --resource-group fleet-prod-rg \
    --name fleet-api-prod

☐ App Service deployed
  Command: az webapp deployment source config-zip \
    --resource-group fleet-prod-rg \
    --name fleet-api-prod \
    --src fleet-api.zip
  Verify: az webapp show --resource-group fleet-prod-rg --name fleet-api-prod --query state
  Expected: Running

☐ Health check endpoint verified
  Command: curl https://fleet-api-prod.azurewebsites.net/api/health
  Expected: {"status": "healthy", ...}
```

### Database Connection Verification

```
☐ App Service can connect to database
  Command: az webapp ssh --resource-group fleet-prod-rg --name fleet-api-prod
  Then: psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT version();"
  Expected: PostgreSQL version output

☐ App Service can connect to Redis
  Test via API: curl https://fleet-api-prod.azurewebsites.net/api/health/redis
  Expected: {"status": "healthy", "redis": "connected"}

☐ Connection pool health
  Verify max connections not exceeded
  Check logs for connection errors
```

---

## Frontend Deployment Phase

### Build & Optimize

```
☐ Frontend built
  Command: npm ci --legacy-peer-deps
  Command: npm run typecheck
  Command: npm run lint
  Command: npm test
  Command: npm run build
  Expected: dist/ folder created with optimized assets

☐ Build artifacts verified
  ☐ HTML in dist/index.html
  ☐ CSS assets in dist/assets/
  ☐ JavaScript bundles in dist/assets/ (size < 500 KB)
  ☐ Images optimized (< 100 KB each)
  ☐ No source code in dist/

☐ Build performance acceptable
  Command: du -sh dist/
  Expected: Total size < 20 MB

☐ Environment variables set
  ☐ VITE_API_BASE_URL=https://fleet-api-prod.azurewebsites.net/api
  ☐ VITE_FRONTEND_URL=https://fleet.capitaltechalliance.com
  ☐ VITE_GOOGLE_MAPS_API_KEY set
  ☐ VITE_AZURE_AD_CLIENT_ID set
  ☐ VITE_AZURE_AD_TENANT_ID set
```

### Azure Static Web Apps Deployment

```
☐ Static Web Apps resource created (if not existing)
  Command: az staticwebapp create \
    --name fleet-prod \
    --resource-group fleet-prod-rg \
    --location eastus2 \
    --sku Standard

☐ Deployment token retrieved
  Go to: Azure Portal > Static Web Apps > fleet-prod > Configuration
  Copy: Deployment token

☐ Frontend deployed
  Command: swa deploy \
    --app-location . \
    --api-location api \
    --output-location dist \
    --deployment-token $DEPLOYMENT_TOKEN
  Expected: Deployment succeeds

  OR via GitHub Actions:
  Command: git push origin main
  Expected: GitHub Actions workflow runs and deploys

☐ CDN cache purged (if redeploying)
  Command: az staticwebapp disconnect-github-repository \
    --resource-group fleet-prod-rg \
    --name fleet-prod
  Command: az staticwebapp connect-github-repository \
    --resource-group fleet-prod-rg \
    --name fleet-prod \
    --source "owner/repo" \
    --branch "main"

☐ Custom domain configured (if applicable)
  ☐ DNS CNAME record created: fleet.capitaltechalliance.com
  ☐ SSL certificate auto-provisioned
  ☐ HTTPS verified
```

---

## Post-Deployment Verification

### API Health Checks

```
☐ API endpoint responds
  Command: curl https://fleet-api-prod.azurewebsites.net/api/health
  Expected: Status 200, {"status": "healthy"}

☐ Database health check
  Command: curl https://fleet-api-prod.azurewebsites.net/api/health/db
  Expected: {"database": "connected"}

☐ Redis health check
  Command: curl https://fleet-api-prod.azurewebsites.net/api/health/redis
  Expected: {"redis": "connected"}

☐ API response time acceptable
  Command: time curl -s https://fleet-api-prod.azurewebsites.net/api/vehicles | jq . > /dev/null
  Expected: Response time < 500ms

☐ Authentication working
  Command: curl -H "Authorization: Bearer $(get_valid_token)" \
    https://fleet-api-prod.azurewebsites.net/api/auth/me
  Expected: 200 OK with user data

☐ CORS headers correct
  Command: curl -I https://fleet-api-prod.azurewebsites.net/api/health
  Expected: Access-Control-Allow-Origin header present

☐ Security headers present
  Command: curl -I https://fleet-api-prod.azurewebsites.net/
  Expected:
    - Strict-Transport-Security present
    - X-Frame-Options: SAMEORIGIN
    - X-Content-Type-Options: nosniff
    - Content-Security-Policy present
```

### Frontend Verification

```
☐ Frontend loads
  Command: curl https://fleet.capitaltechalliance.com/ | head -50
  Expected: HTML with proper structure

☐ Static assets serve
  Command: curl -I https://fleet.capitaltechalliance.com/assets/main.js
  Expected: 200 OK, proper Content-Type headers

☐ Bundle size acceptable
  Check in browser DevTools → Network tab
  Expected: Main JS < 200 KB gzipped

☐ Page load time
  Check: Google PageSpeed, Lighthouse
  Expected: < 3 seconds total load time

☐ SSL certificate valid
  Command: curl -vI https://fleet.capitaltechalliance.com/ 2>&1 | grep -i certificate
  Expected: Valid certificate, no warnings

☐ Cache headers correct
  Command: curl -I https://fleet.capitaltechalliance.com/assets/main.js | grep -i cache
  Expected: Cache-Control header present (long expiry for hashed assets)

☐ Redirects working
  Command: curl -I http://fleet.capitaltechalliance.com/
  Expected: 301/302 redirect to https://
```

### End-to-End Workflow Test

```
☐ User login flow
  1. Navigate to https://fleet.capitaltechalliance.com
  2. Click "Login with Azure AD"
  3. Enter credentials
  4. Verify redirect to dashboard
  5. Check token in browser storage

☐ Dashboard loads
  1. Verify page loads (< 3 seconds)
  2. Check vehicle map displays
  3. Verify data shows without errors
  4. Check real-time updates

☐ Create test vehicle
  1. Go to Fleet Management → Add Vehicle
  2. Fill in test data
  3. Submit form
  4. Verify in database:
     psql -c "SELECT * FROM vehicles ORDER BY created_at DESC LIMIT 1;"

☐ Real-time updates
  1. Monitor GPS location updates
  2. Check WebSocket connection (F12 → Network)
  3. Verify data appears in real-time

☐ Reports functionality
  1. Generate test report
  2. Export to CSV/PDF
  3. Verify file downloads

☐ Email notifications
  1. Trigger test alert
  2. Check email received
  3. Verify content is correct

☐ Error handling
  1. Test with invalid credentials
  2. Test API errors (intentionally make bad requests)
  3. Verify error messages display correctly
  4. Check error logging in Application Insights
```

### Database Verification

```
☐ Schema complete
  Command: psql -c "\dt" (count tables)
  Expected: 100+ tables created

☐ Indexes created
  Command: psql -c "\di"
  Expected: All expected indexes present

☐ Constraints in place
  Command: psql -c "\d vehicles" (check one table)
  Expected: PK, FK, unique constraints shown

☐ Data integrity
  Command: psql -c "SELECT COUNT(*) FROM vehicles;"
  Expected: Correct count (if seeded)

☐ Backup working
  Command: pg_dump --schema-only fleet_production > post-deploy.sql
  Expected: Schema exported successfully
```

### Performance Baseline

```
☐ API response times measured
  Record:
  - GET /vehicles: _____ ms
  - POST /vehicles: _____ ms
  - GET /vehicles/:id: _____ ms
  Target: All < 500ms p95

☐ Database query times measured
  Record:
  - Vehicle list query: _____ ms
  - Vehicle detail: _____ ms
  Target: All < 1000ms

☐ Frontend Lighthouse score
  Run: npm run build && npx lighthouse https://fleet.capitaltechalliance.com
  Record:
  - Performance: _____ (target: > 80)
  - Accessibility: _____ (target: > 90)
  - Best Practices: _____ (target: > 85)
  - SEO: _____ (target: > 80)

☐ Load testing (optional but recommended)
  Command: ab -n 1000 -c 10 https://fleet-api-prod.azurewebsites.net/api/health
  Expected: Handle 1000 requests with < 2% failures
```

---

## Monitoring & Alerts Enablement

### Application Insights Configuration

```
☐ Application Insights enabled
  Verify: az monitor app-insights show --resource-group fleet-prod-rg

☐ Instrumentation key set
  Command: az webapp config appsettings set \
    --resource-group fleet-prod-rg \
    --name fleet-api-prod \
    --settings APPINSIGHTS_INSTRUMENTATIONKEY="xxx"

☐ Custom events logged
  Verify in code: logger.trackEvent('user_login', {...})
  Check in portal: Application Insights > Custom Events

☐ Performance counters tracked
  Check: Application Insights > Performance
  Expected: CPU, memory, disk metrics visible

☐ Exceptions captured
  Check: Application Insights > Failures
  Expected: Can see stack traces
```

### Alerts Created

```
☐ API Health Alert
  Condition: Response time > 500ms (p95)
  Window: 5 minutes
  Action: Email + Teams notification

☐ Error Rate Alert
  Condition: Error rate > 1%
  Window: 5 minutes
  Action: Email + PagerDuty

☐ Database CPU Alert
  Condition: CPU > 80%
  Window: 10 minutes
  Action: Email (DBAs)

☐ Redis Memory Alert
  Condition: Memory > 80%
  Window: 5 minutes
  Action: Email (Infrastructure)

☐ SSL Certificate Alert
  Condition: Expiry within 30 days
  Window: Daily check
  Action: Email

☐ Disk Space Alert
  Condition: > 80% used
  Window: Daily check
  Action: Email
```

### Dashboards Created

```
☐ Operations Dashboard
  Shows:
  - Real-time API response times
  - Error rates
  - User count
  - Database connections

☐ Database Dashboard
  Shows:
  - CPU usage
  - Memory usage
  - Connection pool status
  - Query times

☐ Infrastructure Dashboard
  Shows:
  - App Service status
  - Redis memory
  - Storage usage
  - Network bandwidth

☐ Business Dashboard
  Shows:
  - Active users
  - Features usage
  - Transaction counts
  - Revenue metrics
```

---

## Security Verification

```
☐ SSL/TLS Certificate
  ☐ Valid certificate installed
  ☐ Certificate chain complete
  ☐ HTTPS enforced
  ☐ No mixed content warnings

☐ Security Headers
  ☐ Strict-Transport-Security enabled
  ☐ Content-Security-Policy configured
  ☐ X-Frame-Options: SAMEORIGIN
  ☐ X-Content-Type-Options: nosniff

☐ Authentication
  ☐ Azure AD integration verified
  ☐ JWT tokens signing correctly
  ☐ Session management working
  ☐ Logout clears tokens

☐ Secrets Management
  ☐ No secrets in code/git
  ☐ All secrets in Key Vault
  ☐ Access policies configured
  ☐ Rotation schedule set

☐ Database Security
  ☐ SSL connections enforced
  ☐ User permissions correct
  ☐ Read-only user working
  ☐ No root/admin exposure

☐ Rate Limiting
  ☐ Enabled on API
  ☐ Redis-backed (distributed)
  ☐ Tested under load

☐ CORS Configuration
  ☐ Only production domain allowed
  ☐ Not using wildcard (*)
  ☐ Credentials flag correct

☐ Security Scan
  Command: npm audit (no critical/high issues)
  Command: OWASP ZAP scan on frontend
  Expected: No critical vulnerabilities
```

---

## Rollback Readiness

```
☐ Rollback plan documented
  Location: /docs/DEPLOYMENT_GUIDE.md > Rollback Procedures
  ☐ Database rollback steps
  ☐ Backend rollback steps
  ☐ Frontend rollback steps

☐ Previous version tags
  Command: git tag | grep pre-prod
  Expected: Latest tag available

☐ Database backup verified
  Command: pg_dump fleet_production > pre-deploy-backup.sql
  Expected: Backup file created, verified restorable

☐ Team trained on rollback
  ☐ DevOps team knows process
  ☐ DBA team ready to restore
  ☐ Incident lead assigned

☐ Rollback runbook tested
  ☐ Dry run performed
  ☐ All commands verified
  ☐ Time to rollback measured (< 30 min)
```

---

## Sign-Off & Completion

```
☐ All checks passed
  Date: _______________
  Signed by: _______________

☐ Production deployment successful
  Deployment start time: _______________
  Deployment end time: _______________
  Total duration: _______________

☐ Stakeholders notified
  ☐ Engineering team
  ☐ Management
  ☐ Customer success
  ☐ Support team

☐ Documentation updated
  ☐ Runbooks updated
  ☐ Known issues documented
  ☐ Change log entry added

☐ Post-deployment monitoring scheduled
  ☐ 24-hour monitoring (first day)
  ☐ Weekly health checks (first month)
  ☐ Monthly reviews (ongoing)

☐ Lessons learned documented
  ☐ What went well
  ☐ What could be improved
  ☐ Action items for next deployment
```

---

## Post-Deployment (24-48 Hours)

```
☐ Monitor error logs
  Check: Application Insights > Failures
  Expected: No unexpected errors

☐ Monitor performance metrics
  Check: Application Insights > Performance
  Expected: Baseline matches projections

☐ User feedback collected
  ☐ No major complaints
  ☐ Feature usage as expected

☐ Database health checked
  ☐ Query times normal
  ☐ Connection pool stable
  ☐ No slow queries

☐ Security verified
  ☐ No unauthorized access attempts
  ☐ Authentication working
  ☐ No data breaches

☐ Cost review
  ☐ Charges as expected
  ☐ No runaway resources
  ☐ Auto-scaling working correctly

☐ First week monitoring
  ☐ Incident log reviewed (should be empty)
  ☐ Performance trends reviewed
  ☐ Capacity usage tracked
```

---

**Document Version:** 1.0
**Last Updated:** February 15, 2024
**Maintained By:** DevOps Team
