# Policy Engine - Staging Deployment Guide

**Date**: January 3, 2026
**Version**: 1.0
**Status**: Production-Ready Code Deployed to GitHub and Azure DevOps

---

## 📋 Pre-Deployment Checklist

### ✅ Code Deployment Status
- [x] Code deployed to GitHub main (`b17946dad`)
- [x] Code deployed to Azure DevOps main (`9dacffd88`)
- [x] Build verification successful (48.21s, 24,017 modules)
- [x] Policy Engine bundle created (5.89 KB, gzipped: 1.99 KB)
- [x] All security scans passed (no secrets in deployment)

### ⏳ Pre-Deployment Requirements
- [ ] Staging environment accessible
- [ ] Database connection string configured
- [ ] Backup of staging database created
- [ ] API keys/secrets in environment variables
- [ ] Node.js ≥18.x installed
- [ ] PostgreSQL ≥14.x running
- [ ] Redis cache available (optional but recommended)

---

## 🗄️ Database Migrations

### Migration Overview

The Policy Engine requires **4 database migrations** in the following order:

| Migration | File | Purpose | Tables Created |
|-----------|------|---------|----------------|
| **022** | `api/src/migrations/022_policy_templates_library.sql` | Core policy templates | `policy_templates`, `policy_acknowledgments` |
| **013** | `api/database/migrations/013_policy_violations.sql` | Violation tracking | `policy_violations` |
| **037** | `api/src/migrations/037_policy_executions.sql` | Execution tracking | `policy_executions` |
| **038** | `api/src/migrations/038_policy_conditions_actions.sql` | Conditions/actions schema | Alters `policy_templates` |

### Migration Commands

**Step 1: Navigate to API directory**
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
```

**Step 2: Set environment variables**
```bash
export DATABASE_URL="postgresql://username:password@hostname:5432/database_name"
export TENANT_ID="your-tenant-id-uuid"
```

**Step 3: Run migrations in order**

```bash
# Migration 022: Policy Templates Library
psql $DATABASE_URL -f src/migrations/022_policy_templates_library.sql

# Migration 013: Policy Violations
psql $DATABASE_URL -f database/migrations/013_policy_violations.sql

# Migration 037: Policy Executions
psql $DATABASE_URL -f src/migrations/037_policy_executions.sql

# Migration 038: Policy Conditions/Actions
psql $DATABASE_URL -f src/migrations/038_policy_conditions_actions.sql
```

**Alternative: Run all migrations with verification**
```bash
#!/bin/bash
# Run all Policy Engine migrations with verification

MIGRATIONS=(
  "src/migrations/022_policy_templates_library.sql"
  "database/migrations/013_policy_violations.sql"
  "src/migrations/037_policy_executions.sql"
  "src/migrations/038_policy_conditions_actions.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  echo "Running migration: $migration"
  psql $DATABASE_URL -f "$migration"
  if [ $? -eq 0 ]; then
    echo "✅ $migration completed successfully"
  else
    echo "❌ $migration failed"
    exit 1
  fi
  echo ""
done

echo "✅ All Policy Engine migrations completed successfully"
```

### Verification Queries

**Check if tables were created:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'policy_templates',
    'policy_acknowledgments',
    'policy_violations',
    'policy_executions'
  )
ORDER BY table_name;
```

Expected result: All 4 tables should be listed.

**Check policy_templates columns:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'policy_templates'
  AND column_name IN ('conditions', 'actions', 'execution_enabled')
ORDER BY column_name;
```

Expected result: All 3 columns should exist (added by migration 038).

**Verify indexes:**
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('policy_templates', 'policy_violations', 'policy_executions')
ORDER BY tablename, indexname;
```

Expected result: Multiple indexes per table for performance.

**Check Row-Level Security (RLS):**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('policy_templates', 'policy_violations', 'policy_executions');
```

Expected result: `rowsecurity` should be `true` for tenant isolation.

---

## 🚀 Application Deployment

### Step 1: Pull Latest Code

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
git checkout main
git pull origin main
```

### Step 2: Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd api
npm install
cd ..
```

### Step 3: Build Frontend

```bash
npm run build
```

Expected output:
- Build time: ~48 seconds
- Modules transformed: ~24,000
- Policy enforcement bundle: ~6 KB (gzipped: ~2 KB)
- No errors

### Step 4: Configure Environment

Create/update `.env` file with:

```bash
# Frontend (.env in root)
VITE_API_URL=https://staging-api.yourdomain.com
VITE_POLICY_ENGINE_ENABLED=true
VITE_POLICY_MONITORING_MODE=human-in-loop

# Backend (api/.env)
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=staging
POLICY_ENGINE_ENABLED=true
POLICY_DEFAULT_MODE=human-in-loop
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

### Step 5: Start Backend API

```bash
cd api
npm run dev   # For development
# OR
npm start     # For production (requires build)
```

Verify API is running:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-03T04:00:00.000Z",
  "uptime": 123.456
}
```

### Step 6: Start Frontend (Staging)

```bash
# Development mode with staging API
npm run dev

# Production preview
npm run preview
```

Access application at: http://localhost:5173 (dev) or http://localhost:4173 (preview)

---

## ✅ Post-Deployment Verification

### 1. Policy Engine UI Tests

**Access Policy Onboarding:**
1. Navigate to `/admin/policy-onboarding`
2. Verify 4-step wizard loads
3. Complete organization profiling
4. Verify AI generates policy recommendations

**Access Policy Violations Dashboard:**
1. Navigate to `/admin/policy-violations`
2. Verify dashboard loads with charts
3. Check violation types (14 types)
4. Test CSV/PDF/Excel export

**Access Policy Engine Workbench:**
1. Navigate to `/admin/policy-engine`
2. Verify CRUD operations work
3. Test policy activation/deactivation
4. Verify digital signature capture

### 2. Hub Enforcement Tests

**SafetyHub Enforcement:**
1. Navigate to `/safety-hub`
2. Click "Report Incident" button
3. Verify policy enforcement check runs
4. Check toast notifications for violations

**MaintenanceHub Enforcement:**
1. Navigate to `/maintenance-hub`
2. Create a work order
3. Verify policy validation occurs
4. Check approval requirements

**OperationsHub Enforcement:**
1. Navigate to `/operations-hub`
2. Attempt vehicle dispatch
3. Verify dispatch policy check
4. Confirm enforcement blocking (if violations exist)

### 3. API Endpoint Tests

**Get Policy Templates:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/policy-templates
```

Expected: Array of policy templates

**Create Policy Execution:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"policy_id": 1, "trigger_type": "manual"}' \
  http://localhost:3000/api/policy-executions
```

Expected: New execution record created

**Get Violations:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/policy-violations
```

Expected: Array of violations (may be empty initially)

### 4. Database Verification

**Check policy_templates data:**
```sql
SELECT COUNT(*) as total_policies,
       COUNT(*) FILTER (WHERE status = 'Active') as active_policies,
       COUNT(*) FILTER (WHERE execution_enabled = true) as automated_policies
FROM policy_templates;
```

**Check policy_executions logs:**
```sql
SELECT execution_status, COUNT(*) as count
FROM policy_executions
GROUP BY execution_status
ORDER BY count DESC;
```

**Check recent violations:**
```sql
SELECT severity, violation_type, COUNT(*) as count
FROM policy_violations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY severity, violation_type
ORDER BY severity, count DESC;
```

---

## 🔄 Rollback Procedures

### If Migrations Fail

**Option 1: Drop tables and retry**
```sql
DROP TABLE IF EXISTS policy_executions CASCADE;
DROP TABLE IF EXISTS policy_violations CASCADE;
DROP TABLE IF EXISTS policy_acknowledgments CASCADE;
DROP TABLE IF EXISTS policy_templates CASCADE;

-- Then re-run migrations from Step 3
```

**Option 2: Restore from backup**
```bash
# Restore database from backup taken in pre-deployment
pg_restore -d $DATABASE_URL backup_file.dump
```

### If Application Fails

**Revert to previous version:**
```bash
# Checkout previous stable commit
git checkout <previous-commit-hash>

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
```

**Disable Policy Engine temporarily:**
```bash
# Update .env
VITE_POLICY_ENGINE_ENABLED=false
POLICY_ENGINE_ENABLED=false

# Restart services
pm2 restart all
```

---

## 📊 Monitoring and Metrics

### Key Metrics to Monitor

**Application Metrics:**
- Policy evaluation time: Target <1ms
- API response time: Target <100ms
- Database query time: Target <50ms
- Frontend render time: Target <100ms

**Business Metrics:**
- Policy compliance rate: Target >95%
- Violation count per day
- Policy execution success rate: Target >99%
- Average violation resolution time: Target <7 days

### Logging

**Check application logs:**
```bash
# API logs
tail -f api/logs/combined.log

# Frontend console (browser DevTools)
# Look for errors in Console tab
```

**Check database logs:**
```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-main.log
```

### Health Checks

**API Health:**
```bash
curl http://localhost:3000/api/health
```

**Database Health:**
```sql
SELECT pg_is_in_recovery(),
       pg_database_size(current_database()) as db_size,
       count(*) FROM pg_stat_activity;
```

---

## 🎯 Success Criteria

### Technical Criteria
- [  ] All 4 migrations executed successfully
- [  ] All tables and indexes created
- [  ] RLS policies enabled
- [  ] Application builds without errors
- [  ] API starts and responds to health check
- [  ] Frontend loads without console errors
- [  ] Policy Engine bundle loads (check Network tab)

### Functional Criteria
- [  ] Policy Onboarding wizard completes all 4 steps
- [  ] Policy Violations dashboard displays data
- [  ] Policy Engine Workbench CRUD operations work
- [  ] SafetyHub enforcement blocks violations
- [  ] MaintenanceHub enforcement shows approval requirements
- [  ] OperationsHub enforcement validates dispatch
- [  ] API endpoints return expected data
- [  ] Database queries execute in <50ms

### Business Criteria
- [  ] AI policy generation produces 7+ policy types
- [  ] Gap analysis identifies 3-4 operational gaps
- [  ] ROI estimates shown ($250K-$500K range)
- [  ] Digital signatures captured correctly
- [  ] Violation tracking logs all events
- [  ] Email notifications sent for violations

---

## 📞 Support and Troubleshooting

### Common Issues

**Issue: Migrations fail due to missing uuid extension**
```sql
-- Solution: Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Issue: RLS policies block all queries**
```sql
-- Solution: Set tenant_id in session
SET app.current_tenant_id = 'your-tenant-id-uuid';
```

**Issue: Policy enforcement not running**
```bash
# Solution: Check environment variable
echo $POLICY_ENGINE_ENABLED
# Should be "true"

# Restart API with variable set
POLICY_ENGINE_ENABLED=true npm start
```

**Issue: Frontend bundle not loading**
```bash
# Solution: Clear build cache and rebuild
rm -rf dist node_modules/.vite
npm run build
```

### Documentation References

- **Executive Summary**: `/EXECUTIVE_SUMMARY.md`
- **Technical Deployment**: `/PRODUCTION_DEPLOYMENT_SUMMARY_2026-01-02.md`
- **Policy Engine Docs**: `/POLICY_ENGINE_DEPLOYMENT_COMPLETE.md`
- **API Documentation**: `/POLICY_ENGINE_API_DOCUMENTATION.md`
- **Merge Instructions**: `/MERGE_INSTRUCTIONS.md`

### Contact

- **GitHub Issues**: https://github.com/asmortongpt/Fleet/issues
- **Azure DevOps**: https://dev.azure.com/CapitalTechAlliance/FleetManagement
- **Documentation**: See `/docs/` directory

---

## ✅ Deployment Checklist Summary

### Pre-Deployment
- [ ] Staging environment ready
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] Dependencies installed

### Database Migration
- [ ] Migration 022: Policy Templates (✅/❌)
- [ ] Migration 013: Policy Violations (✅/❌)
- [ ] Migration 037: Policy Executions (✅/❌)
- [ ] Migration 038: Conditions/Actions (✅/❌)
- [ ] Verification queries passed

### Application Deployment
- [ ] Code pulled from GitHub/Azure
- [ ] Frontend built successfully
- [ ] Backend started without errors
- [ ] Frontend accessible

### Verification
- [ ] Policy Onboarding works
- [ ] Policy Violations dashboard works
- [ ] Policy Engine Workbench works
- [ ] Hub enforcement functional
- [ ] API endpoints responding
- [ ] Database queries performant

### Monitoring
- [ ] Application logs configured
- [ ] Database metrics tracking
- [ ] Health checks passing
- [ ] Error monitoring active

---

## 🚀 Next Steps After Staging

1. **Testing Phase (1-2 weeks)**
   - Create 10-15 test policies
   - Simulate violation scenarios
   - Test all 3 enforcement modes (Monitor, Human-in-Loop, Autonomous)
   - Collect user feedback from staging users

2. **Training Phase (1 week)**
   - Train safety managers on Policy Engine
   - Train fleet managers on violation tracking
   - Train administrators on policy creation
   - Create user documentation and video tutorials

3. **Production Deployment**
   - Schedule maintenance window
   - Follow same steps as staging
   - Start in Monitor mode
   - Gradually transition to Human-in-Loop
   - Eventually enable Autonomous mode for mature policies

4. **Post-Production**
   - Monitor policy execution metrics daily
   - Review violation trends weekly
   - Optimize policy conditions monthly
   - Generate quarterly compliance reports

---

**Deployment Status**: Ready for Staging
**Estimated Deployment Time**: 2-3 hours
**Recommended Deployment Window**: Off-peak hours (evening/weekend)

🤖 Generated with Claude Code
