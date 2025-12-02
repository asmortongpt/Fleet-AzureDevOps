# Fleet Management - Critical Issues & Tasks for Azure DevOps

## 🚨 CRITICAL ISSUES

### Issue 1: [CRITICAL] Missing 'active' Column in tenants Table - Staging/Dev

**Priority:** 1 - Critical
**Type:** Bug
**Assigned To:** DevOps/Database Team
**Affected Environments:** Staging, Dev

**Problem:**
Maintenance scheduler crashes every 5 minutes in Staging and Dev environments.

- **Error:** `column 'active' does not exist`
- **Location:** `api/src/jobs/maintenance-scheduler.ts:45`
- **Query:** `SELECT id, name FROM tenants WHERE active = true`

**Impact:**
- ❌ Maintenance scheduler crashes every 5 minutes
- ❌ No automatic maintenance scheduling
- ❌ Work order generation fails
- ❌ Preventive maintenance alerts disabled

**Environments Status:**
- ❌ **Staging:** http://20.161.88.59 - BROKEN
- ❌ **Dev:** http://48.211.228.97 - BROKEN
- ✅ **Production:** http://68.220.148.2 - Working

**Root Cause:**
Missing `active` BOOLEAN column in `tenants` table in staging and dev databases.

**Resolution Steps:**

1. **Fix Staging Database:**
```bash
kubectl run fix-tenants-staging --rm -i --image=postgres:15-alpine -n fleet-management-staging \
  --env="PGHOST=fleet-postgres-service" \
  --env="PGPORT=5432" \
  --env="PGDATABASE=fleetdb" \
  --env="PGUSER=fleetadmin" \
  --env="PGPASSWORD=StagingFleet2024!Secure" \
  -- psql -c "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;"
```

2. **Fix Dev Database:**
```bash
kubectl run fix-tenants-dev --rm -i --image=postgres:15-alpine -n fleet-management-dev \
  --env="PGHOST=fleet-postgres-service" \
  --env="PGPORT=5432" \
  --env="PGDATABASE=fleetdb" \
  --env="PGUSER=fleetadmin" \
  --env="PGPASSWORD=DevFleet2024!Secure" \
  -- psql -c "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;"
```

3. **Restart API Pods:**
```bash
kubectl rollout restart deployment/fleet-api -n fleet-management-staging
kubectl rollout restart deployment/fleet-api -n fleet-management-dev
```

**Verification:**
```bash
# Check staging logs
kubectl logs -n fleet-management-staging -l app=fleet-api --tail=50 | grep 'Maintenance Scheduler Started'

# Check dev logs
kubectl logs -n fleet-management-dev -l app=fleet-api --tail=50 | grep 'Maintenance Scheduler Started'

# Should see no more "column 'active' does not exist" errors
```

---

### Issue 2: [PROD] Invalid Azure Application Insights Instrumentation Key

**Priority:** 2 - High
**Type:** Bug
**Assigned To:** DevOps/Monitoring Team
**Affected Environment:** Production Only

**Problem:**
Production API logs flooded with OpenTelemetry errors due to invalid Application Insights instrumentation key.

- **Error:** `OTLPExporterError: Bad Request - Invalid instrumentation key`
- **Frequency:** Continuous (every few seconds)
- **Module:** `@opentelemetry/otlp-exporter-base`

**Impact:**
- ⚠️ Logs flooded with error noise
- ❌ No telemetry data sent to Azure Monitor
- ❌ Performance monitoring disabled
- ❌ Application Insights dashboard empty
- ❌ Unable to track production metrics

**Root Cause:**
Invalid or expired Azure Application Insights instrumentation key in production Kubernetes secret `app-insights`.

**Resolution Steps:**

1. **Get Valid Instrumentation Key from Azure Portal:**
   - Navigate to Azure Portal → Application Insights resource
   - Copy the Connection String (includes InstrumentationKey)

2. **Update Kubernetes Secret:**
```bash
# Get current secret
kubectl get secret app-insights -n fleet-management -o yaml > /tmp/app-insights-backup.yaml

# Update with valid key (replace <VALID_CONNECTION_STRING> with actual value)
kubectl create secret generic app-insights \
  --from-literal=APPLICATIONINSIGHTS_CONNECTION_STRING='<VALID_CONNECTION_STRING>' \
  --dry-run=client -o yaml | kubectl apply -f - -n fleet-management
```

3. **Restart API Pods:**
```bash
kubectl rollout restart deployment/fleet-api -n fleet-management
kubectl rollout status deployment/fleet-api -n fleet-management --timeout=5m
```

**Verification:**
```bash
# Check logs for OTLPExporterError (should return nothing)
kubectl logs -n fleet-management -l app=fleet-api --tail=100 | grep -i 'OTLPExporterError'

# Verify telemetry is flowing
# Check Azure Portal → Application Insights → Live Metrics
# Should see incoming telemetry data
```

---

## 📋 TASKS

### Task 1: Run Complete Database Schema Comparison

**Priority:** 2 - High
**Type:** Task
**Assigned To:** Database/DevOps Team

**Description:**
Compare production, staging, and dev database schemas to identify ALL missing tables/columns. Generate comprehensive migration plan to bring staging and dev to parity with production.

**Steps:**

1. **Export Production Schema:**
```bash
kubectl run export-prod-schema --rm -i --image=postgres:15-alpine -n fleet-management \
  --env="PGHOST=fleet-postgres-service" \
  --env="PGPORT=5432" \
  --env="PGDATABASE=fleetdb" \
  --env="PGUSER=fleetadmin" \
  --env="PGPASSWORD=\$(kubectl get secret fleet-secrets -n fleet-management -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)" \
  -- pg_dump --schema-only > /tmp/prod-schema.sql
```

2. **Export Staging Schema:**
```bash
kubectl run export-staging-schema --rm -i --image=postgres:15-alpine -n fleet-management-staging \
  --env="PGHOST=fleet-postgres-service" \
  --env="PGPORT=5432" \
  --env="PGDATABASE=fleetdb" \
  --env="PGUSER=fleetadmin" \
  --env="PGPASSWORD=StagingFleet2024!Secure" \
  -- pg_dump --schema-only > /tmp/staging-schema.sql
```

3. **Export Dev Schema:**
```bash
kubectl run export-dev-schema --rm -i --image=postgres:15-alpine -n fleet-management-dev \
  --env="PGHOST=fleet-postgres-service" \
  --env="PGPORT=5432" \
  --env="PGDATABASE=fleetdb" \
  --env="PGUSER=fleetadmin" \
  --env="PGPASSWORD=DevFleet2024!Secure" \
  -- pg_dump --schema-only > /tmp/dev-schema.sql
```

4. **Compare Schemas:**
```bash
diff /tmp/prod-schema.sql /tmp/staging-schema.sql > /tmp/prod-vs-staging-diff.txt
diff /tmp/prod-schema.sql /tmp/dev-schema.sql > /tmp/prod-vs-dev-diff.txt
```

5. **Generate Migration Plan:**
   - Review diff files
   - Identify missing tables, columns, indexes, constraints
   - Create migration SQL scripts
   - Test on dev first, then staging

**Deliverables:**
- Schema comparison report
- Migration scripts for staging
- Migration scripts for dev
- Testing plan
- Rollback plan

---

### Task 2: Verify Telemetry and Monitoring in All Environments

**Priority:** 3 - Medium
**Type:** Task
**Assigned To:** Monitoring/SRE Team

**Description:**
After fixing Application Insights key, verify telemetry data flows correctly to Azure Monitor in all environments. Ensure Application Insights dashboards display metrics.

**Steps:**

1. **Verify Production Telemetry:**
   - Azure Portal → Application Insights → Live Metrics
   - Confirm real-time data flowing
   - Check custom metrics dashboard
   - Verify alerts configured

2. **Configure Staging Telemetry:**
   - Ensure staging has separate App Insights resource
   - Update staging secrets with correct instrumentation key
   - Verify logs flowing

3. **Configure Dev Telemetry:**
   - Ensure dev has separate App Insights resource (or uses same as staging)
   - Update dev secrets with correct instrumentation key
   - Verify logs flowing

4. **Create Dashboards:**
   - API response times
   - Error rates
   - Request volume
   - Database connection metrics
   - Pod health metrics

**Verification Queries:**
```bash
# Check each environment for telemetry errors
for ns in fleet-management fleet-management-staging fleet-management-dev; do
  echo "=== $ns ==="
  kubectl logs -n $ns -l app=fleet-api --tail=50 | grep -i "telemetry\|instrumentation" | head -5
done
```

**Deliverables:**
- Telemetry verification report for all 3 environments
- Application Insights dashboards configured
- Alert rules documented
- Monitoring runbook

---

## 📊 Summary

| Issue/Task | Priority | Status | Owner | ETA |
|------------|----------|--------|-------|-----|
| Fix tenants table - Staging/Dev | 1 - Critical | 🔴 Open | Database Team | Immediate |
| Fix App Insights Key - Production | 2 - High | 🔴 Open | DevOps Team | 24 hours |
| Schema Comparison | 2 - High | 🟡 Planned | Database Team | 3 days |
| Telemetry Verification | 3 - Medium | 🟡 Planned | SRE Team | 1 week |

---

## 🔗 References

- **Production URL:** http://68.220.148.2
- **Staging URL:** http://20.161.88.59
- **Dev URL:** http://48.211.228.97
- **Code Location:** `api/src/jobs/maintenance-scheduler.ts:45`
- **Migration Folder:** `api/src/migrations/`
- **Kubernetes Namespaces:**
  - Production: `fleet-management`
  - Staging: `fleet-management-staging`
  - Dev: `fleet-management-dev`

---

## 📝 Notes

- Production is currently functional but has telemetry issues
- Staging and Dev are **BROKEN** due to database schema mismatch
- All pods are running healthy - issues are configuration/schema related
- No application code changes required - only database fixes and configuration updates

---

*Generated: 2025-11-12*
*Last Updated by: Claude Code Diagnostics*
