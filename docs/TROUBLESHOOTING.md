# Fleet-CTA Troubleshooting Guide

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [Database Issues](#database-issues)
3. [API & Backend Issues](#api--backend-issues)
4. [Frontend Issues](#frontend-issues)
5. [Performance Issues](#performance-issues)
6. [Security & Authentication](#security--authentication)
7. [Integration Issues](#integration-issues)
8. [Common Error Messages](#common-error-messages)
9. [Log Analysis](#log-analysis)
10. [Getting Help](#getting-help)

---

## Deployment Issues

### Build Failed During GitHub Actions

**Symptom:** GitHub Actions workflow fails during npm build step

**Possible Causes:**
1. Node.js version mismatch
2. Missing dependencies
3. Memory limit exceeded
4. Peer dependency conflicts

**Diagnosis:**
```bash
# Check Node.js version
node --version  # Should be 20+
npm --version   # Should be 10+

# Check build locally
npm ci --legacy-peer-deps
npm run build
```

**Solutions:**

```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Reinstall dependencies (fresh)
rm -rf node_modules package-lock.json
npm ci --legacy-peer-deps

# 3. Increase Node memory limit (in Actions)
# Update .github/workflows/production-deployment.yml:
env:
  NODE_OPTIONS: '--max-old-space-size=4096'

# 4. Check for peer dependency issues
npm ls

# 5. Rebuild and retry
npm run build
```

**Prevention:**
- Test build locally before pushing
- Monitor GitHub Actions logs
- Use `NODE_OPTIONS` for memory-intensive builds

---

### App Service Deployment Fails

**Symptom:** Azure App Service deployment fails or service won't start

**Possible Causes:**
1. Missing environment variables
2. Database connection failed
3. Port configuration incorrect
4. Missing dependencies

**Diagnosis:**
```bash
# Check deployment status
az webapp show \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --query state

# View logs
az webapp log tail \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --follow

# Check process status
az webapp show \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --query "appState"
```

**Solutions:**

```bash
# 1. Verify environment variables
az webapp config appsettings list \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# 2. Check if required vars are missing
az webapp config appsettings show \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --name DATABASE_HOST

# 3. Restart app service
az webapp restart \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# 4. Check startup logs
az webapp log config \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --web-server-logging filesystem

# 5. Stream live logs
az webapp log stream \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod
```

**Prevention:**
- Test deployment locally with same environment variables
- Use Azure Key Vault references
- Implement health checks
- Set startup timeout to 60+ seconds

---

### Static Web Apps Deployment Stuck

**Symptom:** Static Web Apps deployment hangs or takes too long

**Possible Causes:**
1. Large bundle size
2. Network connectivity issue
3. Deployment token expired
4. GitHub Actions stuck

**Diagnosis:**
```bash
# Check deployment status
az staticwebapp show \
  --resource-group fleet-prod-rg \
  --name fleet-prod \
  --query "repositoryUrl"

# Check git status
git status
git log --oneline | head -5

# Check disk space
df -h
```

**Solutions:**

```bash
# 1. Check workflow status
# Go to GitHub Repo > Actions > Production Deployment

# 2. Cancel stuck workflow
# Click "Cancel workflow" in GitHub Actions

# 3. Force refresh deployment token
az staticwebapp disconnect-github-repository \
  --resource-group fleet-prod-rg \
  --name fleet-prod

az staticwebapp connect-github-repository \
  --resource-group fleet-prod-rg \
  --name fleet-prod \
  --source "owner/repo" \
  --branch "main"

# 4. Reduce bundle size
# Remove unused dependencies
npm ls  # Check for unused packages

# 5. Increase timeout (in Actions)
timeout-minutes: 60  # in workflow YAML

# 6. Retry deployment
git commit --allow-empty -m "Retry deployment"
git push origin main
```

---

## Database Issues

### Cannot Connect to Database

**Symptom:** Connection timeout, "could not connect to database"

**Possible Causes:**
1. Firewall rules incorrect
2. Connection string wrong
3. Database server stopped
4. Credentials invalid
5. Network connectivity issue

**Diagnosis:**
```bash
# Test connectivity with psql
psql -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production \
  -c "SELECT 1;"

# Check database server status
az postgres server show \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod \
  --query "userVisibleState"

# Test from App Service
az webapp ssh \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# Inside container:
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT version();"

# Check firewall rules
az postgres server firewall-rule list \
  --resource-group fleet-prod-rg \
  --server-name fleet-db-prod
```

**Solutions:**

```bash
# 1. Verify firewall rules
# Must allow Azure services:
az postgres server firewall-rule create \
  --resource-group fleet-prod-rg \
  --server-name fleet-db-prod \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 2. Check connection string
# Should be: postgresql://user:password@host:5432/database
# NOT: postgresql://user:password@host/database (missing port)

# 3. Verify credentials
az keyvault secret show \
  --vault-name fleet-secrets-prod-xyz \
  --name DATABASE-PASSWORD \
  --query "value" \
  --output tsv

# 4. Test direct connection
export PGPASSWORD="<password>"
psql -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user@fleet-db-prod \
  -d fleet_production \
  -c "SELECT version();"

# 5. Enable SSL if required
# Add to connection: ?sslmode=require

# 6. Restart App Service
az webapp restart \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod
```

**Prevention:**
- Test connection before deploying
- Use managed identities instead of passwords (when possible)
- Enable connection pooling (PgBouncer)
- Monitor connection pool usage

---

### Migration Fails

**Symptom:** Drizzle migration fails with error

**Possible Causes:**
1. Schema already exists
2. Migration syntax error
3. Constraint violation
4. Insufficient permissions

**Diagnosis:**
```bash
# Check migration history
psql -c "SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 10;"

# Check which tables exist
psql -c "\dt"

# Test migration locally
DATABASE_URL="postgresql://localhost/test_db" npm run migrate:push

# Check migration files for syntax
ls -la api/src/db/migrations/
```

**Solutions:**

```bash
# 1. If migration partially applied, rollback:
# (Note: Drizzle doesn't have built-in rollback)
# Manually undo changes or restore from backup

# 2. Check migration file syntax
cat api/src/db/migrations/[migration-file].sql

# 3. Run single migration with verbose output
DATABASE_URL="..." npm run migrate:push -- --verbose

# 4. Skip problematic migration (only if safe)
# Comment out in migration file, re-run

# 5. Restore from backup if needed
pg_restore pre-migration-backup.sql
```

**Prevention:**
- Test migrations on staging first
- Create backup before running migration
- Review migration changes before applying
- Use transactions where possible

---

### Query Performance Slow

**Symptom:** API requests taking > 1 second, database queries slow

**Possible Causes:**
1. Missing indexes
2. Full table scans
3. N+1 query problem
4. Connection pool exhaustion
5. Large result sets

**Diagnosis:**
```bash
# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1s
SELECT pg_reload_conf();

# Check slow queries
psql -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements
         ORDER BY mean_time DESC LIMIT 10;"

# Analyze query plan
EXPLAIN ANALYZE SELECT * FROM vehicles WHERE fleet_id = 1;

# Check index usage
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

**Solutions:**

```bash
# 1. Add missing index
CREATE INDEX idx_vehicles_fleet_id ON vehicles(fleet_id);
ANALYZE vehicles;

# 2. Check for N+1 queries in code
# Use batch loading or joins instead of loops

# 3. Review query plan
EXPLAIN ANALYZE SELECT * FROM vehicles WHERE fleet_id = 1 AND status = 'active';
# Look for "Seq Scan" - if present, index needed

# 4. Increase connection pool
UPDATE App Service settings:
DB_POOL_SIZE=40

# 5. Cache frequently accessed data
# Use Redis for user preferences, config, etc.

# 6. Archive old data
-- Move events older than 6 months to archive table
INSERT INTO telemetry_archive SELECT * FROM telemetry WHERE created_at < NOW() - INTERVAL '6 months';
DELETE FROM telemetry WHERE created_at < NOW() - INTERVAL '6 months';
VACUUM ANALYZE telemetry;
```

**Prevention:**
- Monitor slow query log regularly
- Use EXPLAIN ANALYZE on new queries
- Add indexes on frequently filtered columns
- Implement query result caching

---

### Backup/Restore Issues

**Symptom:** Backup fails or restore doesn't work

**Possible Causes:**
1. Storage account permission issue
2. Backup file corrupted
3. Database already exists
4. Insufficient disk space

**Diagnosis:**
```bash
# Check backup existence
az storage blob list \
  --account-name fleetprodstg \
  --container-name backups

# Test restore locally
gunzip < backup.sql.gz | psql -h localhost -U postgres -d fleet_test

# Check database size
SELECT pg_size_pretty(pg_database.datsize)
FROM pg_database
WHERE datname = 'fleet_production';

# Check disk space
df -h /var/lib/postgresql
```

**Solutions:**

```bash
# 1. Create manual backup
pg_dump -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production \
  --verbose \
  --compress=9 \
  > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# 2. Upload to storage account
az storage blob upload \
  --account-name fleetprodstg \
  --container-name backups \
  --file backup.sql.gz \
  --name backup.sql.gz

# 3. Restore from backup (on new database)
# Create new database first
psql -c "CREATE DATABASE fleet_restored;"

# Restore
gunzip < backup.sql.gz | psql -d fleet_restored

# 4. Verify restore
psql -d fleet_restored -c "SELECT COUNT(*) FROM vehicles;"

# 5. If restore successful, rename database
# ALTER DATABASE fleet_production RENAME TO fleet_production_old;
# ALTER DATABASE fleet_restored RENAME TO fleet_production;
```

**Prevention:**
- Test restore weekly
- Monitor backup size (ensure it's not 0 bytes)
- Store backups in geo-redundant location
- Document restore procedure

---

## API & Backend Issues

### API Returns 500 Error

**Symptom:** API requests return 500 Internal Server Error

**Possible Causes:**
1. Unhandled exception
2. Database connection issue
3. Missing environment variable
4. Code bug in deployment

**Diagnosis:**
```bash
# Check API logs
az webapp log tail \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --follow

# Check Application Insights
# Go to Azure Portal > Application Insights > Failures

# Test health endpoint
curl -v https://fleet-api-prod.azurewebsites.net/api/health

# Check error logs in JSON
curl https://fleet-api-prod.azurewebsites.net/api/health 2>/dev/null | jq '.error'
```

**Solutions:**

```bash
# 1. Check logs for exact error
az webapp log tail \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod | grep -i error

# 2. Verify all environment variables set
az webapp config appsettings list \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod | jq '.[].name'

# 3. Check database connection
# See "Database Issues" section above

# 4. Check Redis connection
# See "Integration Issues" section below

# 5. Review recent code changes
git log --oneline | head -5
git diff HEAD~1..HEAD

# 6. Rollback if recent deployment
git revert HEAD
git push origin main

# 7. Restart API
az webapp restart \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod
```

**Prevention:**
- Test API endpoints before deployment
- Enable debug logging in staging
- Monitor error rates (alert at > 1%)
- Implement comprehensive error handling

---

### API Response Time Slow

**Symptom:** API responses taking > 500ms, user experience degraded

**Possible Causes:**
1. Database query slow (see Database section)
2. External API call slow
3. Inefficient code
4. High CPU usage

**Diagnosis:**
```bash
# Measure API response time
time curl https://fleet-api-prod.azurewebsites.net/api/vehicles

# Check Application Insights
# Portal > Application Insights > Performance > Operation

# Monitor CPU usage
az monitor metrics list \
  --resource-group fleet-prod-rg \
  --resource fleet-api-prod \
  --resource-type "Microsoft.Web/sites" \
  --metric "CpuPercentage"

# Check for slow external calls
# Review logs for API call durations
```

**Solutions:**

```bash
# 1. Enable response time monitoring
# Check code for:
logger.trackDependency('http', url, duration, success);

# 2. Implement caching
// Cache vehicle list for 1 minute
const vehicles = await cache.getOrFetch('vehicles',
  () => db.select().from('vehicles'),
  60000);

# 3. Optimize database queries
// Use select() instead of select(*)
const vehicles = await db.select({
  id: vehicles.id,
  name: vehicles.name,
  status: vehicles.status
}).from(vehicles);

# 4. Implement pagination
// Don't return all results at once
const result = await db.select()
  .from(vehicles)
  .limit(20)
  .offset((page - 1) * 20);

# 5. Scale up if needed
az appservice plan update \
  --name fleet-api-plan \
  --sku P1V2  # Upgrade SKU

# 6. Add caching layer
// Redis caching for frequently accessed data
const cached = await redis.get('vehicles:list');
if (cached) return JSON.parse(cached);
```

**Prevention:**
- Set performance budgets (e.g., p95 < 200ms)
- Profile code regularly
- Monitor external API response times
- Implement request timeouts

---

## Frontend Issues

### Page Won't Load / Blank Page

**Symptom:** Browser shows blank page or 404 error

**Possible Causes:**
1. Assets not served
2. Routing configuration wrong
4. JavaScript bundle corrupted
5. API connection failed

**Diagnosis:**
```bash
# Check if frontend is served
curl -I https://fleet.capitaltechalliance.com/

# Check HTML content
curl https://fleet.capitaltechalliance.com/ | head -50

# Browser DevTools
# Open F12 → Console for JavaScript errors
# Check Network tab for failed requests

# Check build output
ls -la dist/
file dist/index.html
```

**Solutions:**

```bash
# 1. Rebuild frontend
npm ci --legacy-peer-deps
npm run build

# 2. Verify build output
cat dist/index.html | grep "<script"  # Check for script tags

# 3. Redeploy
swa deploy \
  --deployment-token $DEPLOYMENT_TOKEN \
  --output-location dist

# 4. Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# 5. Check API connectivity
# Open DevTools → Network
# Check that API requests are sent to correct URL

# 6. Check CORS headers
curl -I -H "Origin: https://fleet.capitaltechalliance.com" \
  https://fleet-api-prod.azurewebsites.net/api/health
# Should show: Access-Control-Allow-Origin header
```

**Prevention:**
- Test build locally
- Run Lighthouse audit
- Check for console errors in testing
- Monitor deployment logs

---

### Authentication Not Working

**Symptom:** "Unauthorized" error or stuck on login screen

**Possible Causes:**
1. Azure AD configuration incorrect
2. Token expired/invalid
3. CORS blocking authentication
4. Redirect URI mismatch

**Diagnosis:**
```bash
# Check Azure AD configuration
# Portal > Azure AD > App registrations > Fleet API

# Check redirect URI
# Should be: https://fleet.capitaltechalliance.com/auth/callback

# Check browser storage
# DevTools > Application > Local Storage
# Look for auth token, should see idToken or accessToken

# Check network request to Azure AD
# DevTools > Network > Filter for "login.microsoftonline.com"

# Test token manually
curl -H "Authorization: Bearer $(get_valid_token)" \
  https://fleet-api-prod.azurewebsites.net/api/auth/me
```

**Solutions:**

```bash
# 1. Verify Azure AD redirect URI matches
# Portal > Azure AD > Fleet API > Redirect URIs
# Should include: https://fleet.capitaltechalliance.com/auth/callback

# 2. Check environment variables
# VITE_AZURE_AD_CLIENT_ID must be set
# VITE_AZURE_AD_TENANT_ID must be set
# VITE_AZURE_AD_REDIRECT_URI must match

# 3. Verify token storage
// In browser console:
localStorage.getItem('auth.token')  // Should exist

// Or in sessionStorage:
sessionStorage.getItem('auth.token')

# 4. Check CORS headers
curl -I -H "Origin: https://fleet.capitaltechalliance.com" \
  https://fleet-api-prod.azurewebsites.net/api/auth/me
# Should show: Access-Control-Allow-Origin: https://fleet.capitaltechalliance.com

# 5. Clear authentication and retry
// In browser console:
localStorage.clear()
sessionStorage.clear()
// Then reload page and login again

# 6. Verify JWT secret
echo $JWT_SECRET | wc -c  # Should be > 64 chars
```

**Prevention:**
- Test authentication flow before deployment
- Monitor authentication errors in logs
- Set up alerts for high auth failure rates
- Document Azure AD configuration

---

## Performance Issues

### High Memory Usage

**Symptom:** App Service memory near 100%, slowdowns

**Possible Causes:**
1. Memory leak in code
2. Redis storing too much
3. Large query results in memory
4. Unbounded caching

**Diagnosis:**
```bash
# Check memory usage
az monitor metrics list \
  --resource-group fleet-prod-rg \
  --resource fleet-api-prod \
  --resource-type "Microsoft.Web/sites" \
  --metric "MemoryPercentage" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --interval PT1M

# Check Node.js process memory
# In App Service shell:
ps aux | grep node

# Check Redis memory
redis-cli -h fleet-redis-prod.redis.cache.windows.net \
  -p 6380 -a $REDIS_PASSWORD --tls \
  INFO memory
```

**Solutions:**

```bash
# 1. Find memory leaks
node --inspect dist/server.js
# Connect to chrome://inspect to profile

# 2. Reduce result set size
// Use pagination:
const result = await db.select()
  .from(vehicles)
  .limit(100)
  .offset((page - 1) * 100);

# 3. Limit cache size
// Set max items in cache
const MAX_CACHE_SIZE = 10000;
if (cache.size > MAX_CACHE_SIZE) {
  cache.clear();
}

# 4. Stream large responses
// Instead of loading all in memory:
response.setHeader('Content-Type', 'application/json');
response.write('[');
for (let i = 0; i < total; i += 100) {
  const chunk = await db.select().limit(100).offset(i);
  response.write(JSON.stringify(chunk));
}
response.write(']');

# 5. Increase App Service size
az appservice plan update \
  --name fleet-api-plan \
  --sku P2V2  # More memory

# 6. Enable memory dumps for analysis
node --heap-prof dist/server.js
# Analyze .heapsnapshot files
```

**Prevention:**
- Monitor memory usage daily
- Set memory alerts (> 85%)
- Profile code regularly
- Limit query result sets

---

### High CPU Usage

**Symptom:** CPU consistently high, requests slow

**Possible Causes:**
1. Inefficient algorithm
2. Synchronous operations blocking event loop
3. Continuous polling
4. Computational heavy task

**Diagnosis:**
```bash
# Monitor CPU
az monitor metrics list \
  --resource-group fleet-prod-rg \
  --resource fleet-api-prod \
  --resource-type "Microsoft.Web/sites" \
  --metric "CpuPercentage"

# Check what's consuming CPU
# Use Node.js profiler:
node --prof dist/server.js
# Then: node --prof-process isolate-*.log > profile.txt

# Check for tight loops
# Review recent code changes
git diff HEAD~5..HEAD | grep -A5 "for\|while"
```

**Solutions:**

```bash
# 1. Move CPU-intensive work to background job
// Instead of:
const result = complexCalculation(data);  // Blocks!

// Use:
const job = await jobQueue.add('complexCalculation', data);
response.json({ jobId: job.id });

// In background worker:
worker.process('complexCalculation', async (job) => {
  return await complexCalculation(job.data);
});

# 2. Use streaming for large operations
// Instead of:
const allData = await loadAllData();  // High memory + CPU

// Stream:
const stream = loadDataStream();
stream.on('data', (chunk) => {
  processChunk(chunk);
});

# 3. Optimize algorithms
// Review Big O complexity
// Use caching for repeated calculations

# 4. Use worker threads for CPU work
import { Worker } from 'worker_threads';
const worker = new Worker('./cpu-worker.js');
worker.postMessage({ data: largeDataset });

# 5. Scale horizontally
// Add more App Service instances
az appservice plan update \
  --name fleet-api-plan \
  --number-of-workers 3  # Add instances
```

**Prevention:**
- Profile code regularly
- Set CPU alerts (> 75%)
- Avoid synchronous operations
- Use async/await patterns
- Implement request queuing

---

## Security & Authentication

### Unauthorized Access / 403 Errors

**Symptom:** Users getting 403 Forbidden errors

**Possible Causes:**
1. Insufficient permissions
2. Role-based access control issue
3. Token invalid/expired
4. RBAC configuration wrong

**Diagnosis:**
```bash
# Check user role
psql -c "SELECT * FROM users WHERE email = 'user@example.com';"
# Check role column

# Check token claims
# Decode JWT: https://jwt.io
# Or in code:
const decoded = jwt.verify(token, secret);
console.log(decoded);  // Check role claim

# Check RBAC rules
psql -c "SELECT * FROM role_permissions WHERE role = 'User';"
```

**Solutions:**

```bash
# 1. Update user role
psql -c "UPDATE users SET role = 'Manager'
         WHERE email = 'user@example.com';"

# 2. Verify RBAC configuration
// Check code for permission checks:
if (!user.permissions.includes('driver:view')) {
  return res.status(403).json({ error: 'Forbidden' });
}

# 3. Clear cached permissions
// Flush Redis cache if using caching
redis-cli -c "FLUSHDB"

# 4. Reissue token after permission change
// User must login again to get new token with updated claims

# 5. Check role configuration
psql -c "SELECT * FROM roles;"
```

**Prevention:**
- Test RBAC before deployment
- Monitor 403 errors
- Document permission requirements
- Use fine-grained permissions

---

### SQL Injection or Security Vulnerability

**Symptom:** Security scan finds SQL injection, XSS, or other vulnerability

**Possible Causes:**
1. User input not sanitized
2. Direct SQL concatenation
3. HTML not escaped
4. Missing security headers

**Diagnosis:**
```bash
# Run security scan
npm audit
npm audit --json | jq '.vulnerabilities'

# Check for SQL injection vulnerabilities
grep -r "executeQuery" src/  # Watch for string concat
grep -r "SQL\|sql" src/ | grep "+"  # Dangerous patterns

# Check security headers
curl -I https://fleet.capitaltechalliance.com/
# Look for: X-Frame-Options, Content-Security-Policy, etc.
```

**Solutions:**

```bash
# 1. Use parameterized queries (Drizzle ORM)
// GOOD:
const user = await db.select()
  .from(users)
  .where(eq(users.id, userId));

// BAD (don't do this):
const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`);

# 2. Escape HTML output
import xss from 'xss';
const safe = xss(userInput);

# 3. Implement CSP header
// In response headers:
Content-Security-Policy: default-src 'self'; script-src 'self'

# 4. Enable security headers with Helmet
import helmet from 'helmet';
app.use(helmet());

# 5. Validate all inputs
import { z } from 'zod';
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100)
});
const validated = userSchema.parse(userInput);

# 6. Run security audit and fix
npm audit fix
npm audit fix --force  # If needed
```

**Prevention:**
- Use ORM/query builders (never string concat)
- Validate and sanitize all inputs
- Enable security headers
- Regular security audits
- Implement CSP headers

---

## Integration Issues

### Cannot Connect to Redis

**Symptom:** "Redis connection failed" error

**Possible Causes:**
1. Redis not running or unreachable
2. Credentials wrong
3. Port incorrect
4. TLS not enabled

**Diagnosis:**
```bash
# Test Redis connection
redis-cli -h fleet-redis-prod.redis.cache.windows.net \
  -p 6380 \
  -a $(az keyvault secret show --vault-name fleet-secrets-prod-xyz \
        --name REDIS-PASSWORD --query value -o tsv) \
  --tls \
  PING

# Check Redis status
az redis show \
  --name fleet-redis-prod \
  --resource-group fleet-prod-rg

# Check connection string
echo $REDIS_URL
```

**Solutions:**

```bash
# 1. Verify credentials
az keyvault secret show \
  --vault-name fleet-secrets-prod-xyz \
  --name REDIS-PASSWORD

# 2. Check host/port
# Azure Redis: Host = name.redis.cache.windows.net
#             Port = 6380 (with TLS)
#             Use SSL = true

# 3. Verify connection string format
# Should be: rediss://:password@host:6380/0
# Not: redis://...

# 4. Test from App Service
az webapp ssh \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod

# Inside container:
redis-cli -h $REDIS_HOST -p 6380 -a $REDIS_PASSWORD --tls PING

# 5. Update environment variable if needed
az webapp config appsettings set \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --settings REDIS_HOST="fleet-redis-prod.redis.cache.windows.net"
```

**Prevention:**
- Test Redis connection in CI/CD
- Monitor Redis health
- Implement connection retry logic
- Use connection pooling

---

### Google Maps API Not Working

**Symptom:** Maps not loading, "Google Maps API error" message

**Possible Causes:**
1. API key invalid or disabled
2. API key rate limited
3. Maps API not enabled in project
4. Domain not whitelisted

**Diagnosis:**
```bash
# Check if API enabled
gcloud services list --enabled | grep maps

# Test API key
curl "https://maps.googleapis.com/maps/api/place/details/json?key=YOUR_API_KEY&place_id=test"

# Check API quotas
# Go to Google Cloud Console > APIs & Services > Quotas

# Check browser error
# DevTools > Network > Filter for "maps.googleapis.com"
# Look for 403 Forbidden or rate limit errors
```

**Solutions:**

```bash
# 1. Generate new API key if compromised
# Google Cloud Console > Credentials > Create API Key

# 2. Enable Maps JavaScript API
# Google Cloud Console > APIs & Services > Library
# Search for "Maps JavaScript API" > Enable

# 3. Add domain to API key restrictions
# Google Cloud Console > Credentials
# Click API key > Application Restrictions > Websites
# Add: *.fleet.capitaltechalliance.com

# 4. Check quota limits
# If exceeded, upgrade billing or wait for reset

# 5. Update environment variable
az webapp config appsettings set \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --settings GOOGLE_MAPS_API_KEY="<new-key>"

# 6. Verify in frontend
echo $VITE_GOOGLE_MAPS_API_KEY  # Should be set
```

**Prevention:**
- Monitor API quota usage
- Set up billing alerts
- Use API key restrictions
- Implement fallback for map failure

---

## Common Error Messages

### "Cannot find module 'package-name'"

**Cause:** Missing dependency
**Fix:**
```bash
npm ci --legacy-peer-deps
npm install missing-package
```

---

### "ENOENT: no such file or directory"

**Cause:** File or directory doesn't exist
**Fix:**
```bash
# Check if file exists
ls -la path/to/file

# Check working directory
pwd

# Use absolute paths
cd /home/user/fleet-cta
```

---

### "listen EADDRINUSE: address already in use :::3001"

**Cause:** Port 3001 already in use
**Fix:**
```bash
# Kill process using port
lsof -i :3001
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

---

### "Error: Cannot find module 'dotenv'"

**Cause:** dotenv-cli not installed
**Fix:**
```bash
npm install --save-dev dotenv-cli
# Or: npm install -g dotenv-cli
```

---

### "Error: EACCES: permission denied"

**Cause:** Insufficient file permissions
**Fix:**
```bash
# Check permissions
ls -la file
# Change if needed
chmod 644 file
# Or for directories:
chmod 755 directory
```

---

## Log Analysis

### Using Application Insights

**View Recent Errors:**
```kusto
exceptions
| where timestamp > ago(24h)
| summarize count() by type, message
| sort by count_ desc
```

**View Slow Requests:**
```kusto
customMetrics
| where name == "http_request_duration_ms"
| where value > 500
| summarize count(), avg(value), max(value) by tostring(customDimensions.["route"])
```

**View Failed Authentications:**
```kusto
customEvents
| where name == "auth_failed"
| summarize count() by tostring(customDimensions.["reason"])
```

---

### Using Azure Log Analytics

**All logs from last hour:**
```kusto
ContainerLog
| where TimeGenerated > ago(1h)
| order by TimeGenerated desc
```

**Search for error:**
```kusto
ContainerLog
| where LogMessage contains "error"
| order by TimeGenerated desc
```

**Performance metrics:**
```kusto
Perf
| where ObjectName == "Processor"
| where CounterName == "% Processor Time"
| summarize avg(CounterValue) by Computer
```

---

## Getting Help

### Internal Escalation

1. **First:** Check logs and monitoring dashboards
2. **Second:** Review recent changes in git
3. **Third:** Contact on-call engineer
4. **Fourth:** Open incident in incident system

### External Support

**Azure Support:**
- Go to: Azure Portal > Help + Support
- Select issue type (e.g., "Technical")
- Create support request

**GitHub Support:**
- GitHub Issues: https://github.com/your-org/fleet-cta/issues
- Create detailed issue with:
  - Error message
  - Steps to reproduce
  - Expected behavior
  - Actual behavior

### Important Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| DevOps | devops@capitaltechalliance.com | 9-5 EST |
| Database | dba@capitaltechalliance.com | 9-5 EST |
| Security | security@capitaltechalliance.com | 24/7 |
| Incident | incidents@capitaltechalliance.com | 24/7 |

### Troubleshooting Tips

- **Restart before investigating:** Simple fix for many issues
- **Check logs first:** Most information is in logs
- **Test in isolation:** Verify component health separately
- **Document the fix:** Help future troubleshooters
- **Prevent recurrence:** Add monitoring/alerts

---

**Document Version:** 1.0
**Last Updated:** February 15, 2024
**Maintained By:** DevOps Team
