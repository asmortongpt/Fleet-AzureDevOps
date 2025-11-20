# Quick Start: RLS Deployment Guide

**⚡ Fast deployment guide for Row-Level Security implementation**

## Pre-Deployment Checklist

- [ ] Database backup completed
- [ ] All developers notified of deployment
- [ ] Maintenance window scheduled (optional - zero downtime)
- [ ] Database credentials ready

## 5-Minute Deployment

### Step 1: Apply Migrations (2 minutes)

```bash
# Connect to database
psql -U fleetadmin -d fleet_management -h your-db-host

# Apply RLS migration
\i api/db/migrations/032_enable_rls.sql

# Apply NOT NULL constraints
\i api/db/migrations/033_fix_nullable_tenant_id.sql

# Quick verification
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: 27

\q
```

### Step 2: Deploy Application (2 minutes)

```bash
# Pull code
cd /path/to/Fleet
git pull origin main

# Restart API
cd api
pm2 restart fleet-api
# OR
systemctl restart fleet-api

# Check logs
pm2 logs fleet-api --lines 50
```

### Step 3: Validate (1 minute)

```bash
# Run test suite
cd api
ts-node test-tenant-isolation.ts

# Expected output: ✓ ALL TESTS PASSED
```

## Verification Commands

```bash
# Check RLS is active
psql -U fleetadmin -d fleet_management -c "
  SELECT COUNT(*) as rls_tables
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
"
# Expected: rls_tables | 27

# Check policies exist
psql -U fleetadmin -d fleet_management -c "
  SELECT COUNT(*) as policies
  FROM pg_policies
  WHERE schemaname = 'public' AND policyname LIKE 'tenant_isolation_%';
"
# Expected: policies | 27

# Test API is working
curl https://your-api.com/api/health
# Expected: {"status":"healthy"}
```

## Rollback (If Needed)

```bash
# Emergency rollback
psql -U fleetadmin -d fleet_management

# Run rollback scripts (see bottom of migration files)
\i api/db/migrations/032_enable_rls.sql  # Uncomment rollback section
\i api/db/migrations/033_fix_nullable_tenant_id.sql  # Uncomment rollback section

# Restart application
pm2 restart fleet-api
```

## Monitoring (First 24 Hours)

```bash
# Watch for tenant context errors
tail -f /var/log/fleet-api/error.log | grep "TENANT CONTEXT"

# Should see: ✅ TENANT CONTEXT - Session variable set
# Should NOT see: ❌ TENANT CONTEXT - Failed to set

# Monitor performance
psql -U fleetadmin -d fleet_management -c "
  SELECT query, mean_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%vehicles%'
  LIMIT 5;
"
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `app.current_tenant_id not set` | Check middleware is registered in server.ts |
| `tenant_id cannot be NULL` | Update INSERT to include tenant_id |
| `Tenant context mismatch` | Verify JWT secret and authentication |
| `Permission denied` | Use fleet_webapp_user, not superuser |

## Success Criteria

✅ All 27 tables have RLS enabled
✅ All 27 policies created
✅ Test suite passes (10/10 tests)
✅ No errors in application logs
✅ API responds normally
✅ Users can access their own data
✅ Users cannot access other tenants' data

## Support

- Full documentation: `MULTI_TENANCY_SECURITY_IMPLEMENTATION.md`
- Test script: `api/test-tenant-isolation.ts`
- Debug endpoint: `GET /api/debug/tenant-context` (non-production)

---

**Deployment Time:** ~5 minutes
**Downtime:** Zero
**Risk Level:** Low (comprehensive testing + rollback available)
