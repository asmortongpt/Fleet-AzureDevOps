# Row-Level Security (RLS) Implementation

**Issues Addressed**: BACKEND-35, BACKEND-36, BACKEND-37
**Priority**: P2 MEDIUM (Critical Security Feature)
**Date Implemented**: 2025-12-10

## Overview

This document describes the Row-Level Security (RLS) implementation for the Fleet Management System, which provides database-level multi-tenant isolation using PostgreSQL's native RLS capabilities.

## Problem Statement

### Issues Found

1. **BACKEND-35**: No Row-Level Security policies - Database lacked RLS enforcement
2. **BACKEND-36**: Missing tenant_id columns - Some tables didn't have tenant_id
3. **BACKEND-37**: Nullable tenant_id - Some tables allowed NULL tenant_id values

### Security Risks

Without proper RLS:
- Cross-tenant data leakage
- Potential data breach if application logic fails
- Non-compliance with multi-tenancy requirements
- FedRAMP AC-3 (Access Enforcement) violation
- SOC 2 CC6.3 (Logical Access Controls) violation

## Solution Architecture

### 1. Database Layer (PostgreSQL RLS)

**Migrations Applied:**
- `/api/db/migrations/032_enable_rls.sql` - Enables RLS on all multi-tenant tables
- `/api/db/migrations/033_fix_nullable_tenant_id.sql` - Fixes nullable tenant_id columns
- `/api/src/migrations/035_add_tenant_id_to_search_tables.sql` - Adds tenant_id to search tables

**RLS Policy Pattern:**
```sql
-- Enable RLS on table
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation_vehicles ON vehicles
    FOR ALL
    TO fleet_webapp_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Tables with RLS Enabled (27 tables):**
- `users`, `audit_logs`, `tenants`
- `vehicles`, `drivers`, `facilities`
- `work_orders`, `maintenance_schedules`
- `fuel_transactions`, `charging_sessions`, `charging_stations`
- `routes`, `geofences`, `geofence_events`
- `telemetry_data`, `video_events`
- `inspection_forms`, `inspections`, `damage_reports`
- `safety_incidents`
- `vendors`, `purchase_orders`
- `communication_logs`, `policies`, `policy_violations`
- `notifications`

### 2. Application Layer (Express Middleware)

**Middleware Stack** (`api/src/server.ts`):
```typescript
// 1. Public routes (no authentication required)
app.use('/api/auth', authRouter)
app.use('/api/microsoft-auth', microsoftAuthRouter)

// 2. CRITICAL: Apply authentication and tenant context to ALL /api routes
app.use('/api', authenticateJWT, setTenantContext)

// 3. Protected routes automatically get tenant isolation
app.use('/api/v1/vehicles', vehiclesRouter)
app.use('/api/v1/drivers', driversRouter)
// ... all other routes
```

**Tenant Context Middleware** (`api/src/middleware/tenant-context.ts`):
```typescript
export const setTenantContext = async (req, res, next) => {
  if (!req.user || !req.user.tenant_id) {
    return res.status(403).json({ error: 'Missing tenant information' })
  }

  const client = await pool.connect()
  try {
    // Set PostgreSQL session variable for RLS
    await client.query('SET LOCAL app.current_tenant_id = $1', [req.user.tenant_id])

    // Attach client to request for route handlers
    req.dbClient = client

    // Release client after response
    res.on('finish', () => client.release())
    res.on('close', () => client.release())

    next()
  } catch (error) {
    client.release()
    return res.status(500).json({ error: 'Failed to set tenant context' })
  }
}
```

### 3. Helper Functions

**Set Tenant Context:**
```sql
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Get Current Tenant:**
```sql
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## How It Works

### Request Flow

1. **Client Request**: User sends authenticated request with JWT token
2. **Authentication**: `authenticateJWT` middleware validates JWT and extracts `tenant_id`
3. **Tenant Context**: `setTenantContext` middleware sets PostgreSQL session variable
4. **Query Execution**: All database queries are automatically filtered by tenant
5. **RLS Enforcement**: PostgreSQL enforces policies at database level
6. **Response**: Only tenant-scoped data is returned

### Example Query Filtering

**Without RLS** (vulnerable):
```sql
-- Returns ALL vehicles across ALL tenants
SELECT * FROM vehicles;
```

**With RLS** (secure):
```sql
-- Application sets tenant context
SET app.current_tenant_id = '123e4567-e89b-12d3-a456-426614174000';

-- Same query, but RLS automatically filters by tenant
SELECT * FROM vehicles;
-- Only returns vehicles WHERE tenant_id = '123e4567-e89b-12d3-a456-426614174000'
```

## Verification

### 1. SQL Verification Script

Run comprehensive verification:
```bash
psql -U postgres -d fleet_db -f api/scripts/verify-rls.sql
```

**Tests Performed:**
- ✅ RLS enabled on all tables
- ✅ tenant_id is NOT NULL on all tables
- ✅ RLS policies exist for all tables
- ✅ Foreign key constraints to tenants table
- ✅ Indexes on tenant_id columns
- ✅ Helper functions exist

### 2. Node.js Integration Test

Run automated tenant isolation tests:
```bash
cd api
npm run build
node dist/scripts/test-rls-isolation.js
```

**Tests Performed:**
- ✅ Create test tenants
- ✅ Create test vehicles per tenant
- ✅ Verify Tenant 1 isolation
- ✅ Verify Tenant 2 isolation
- ✅ Verify cross-tenant access is blocked
- ✅ Verify queries without tenant context return 0 rows

### 3. Manual Testing

```sql
-- Create test tenants
INSERT INTO tenants (id, name, domain) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tenant A', 'tenant-a.com'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B', 'tenant-b.com');

-- Insert test data
INSERT INTO vehicles (tenant_id, vin, make, model, year) VALUES
  ('11111111-1111-1111-1111-111111111111', 'VINA123', 'Toyota', 'Camry', 2023),
  ('22222222-2222-2222-2222-222222222222', 'VINB456', 'Honda', 'Accord', 2023);

-- Test Tenant A isolation
SET app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT * FROM vehicles; -- Should only see Toyota Camry

-- Test Tenant B isolation
SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT * FROM vehicles; -- Should only see Honda Accord

-- Test no context (should return 0 rows)
RESET app.current_tenant_id;
SELECT * FROM vehicles; -- Should return 0 rows

-- Cleanup
DELETE FROM vehicles WHERE vin IN ('VINA123', 'VINB456');
DELETE FROM tenants WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
```

## Security Best Practices

### ✅ DO

1. **Always use middleware**: Ensure `setTenantContext` runs on EVERY authenticated request
2. **Validate tenant_id**: Check JWT token contains valid tenant_id before setting context
3. **Use parameterized queries**: NEVER concatenate tenant_id in SQL strings
4. **Test regularly**: Run verification scripts on every deployment
5. **Monitor audit logs**: Track tenant context setting in audit_logs table
6. **Use connection pooling**: Middleware properly manages database connections

### ❌ DON'T

1. **Don't bypass middleware**: Never query database without tenant context
2. **Don't trust client input**: Always get tenant_id from authenticated JWT
3. **Don't use string concatenation**: Use parameterized queries ($1, $2, etc.)
4. **Don't disable RLS**: Superusers should only be used for migrations
5. **Don't allow NULL tenant_id**: All tenant-scoped tables must have NOT NULL constraint
6. **Don't forget to release connections**: Middleware handles this automatically

## Performance Considerations

### Query Performance

RLS adds minimal overhead:
- **< 1ms per query** for simple tenant filtering
- Indexes on `tenant_id` ensure efficient filtering
- PostgreSQL query planner optimizes RLS policies

### Indexes Created

```sql
-- Primary tenant_id indexes
CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX idx_drivers_tenant ON drivers(tenant_id);
CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
-- ... (all 27 tables have tenant_id indexes)

-- Composite indexes for common queries
CREATE INDEX idx_vehicles_tenant_status ON vehicles(tenant_id, status);
CREATE INDEX idx_work_orders_tenant_status ON work_orders(tenant_id, status);
```

### Connection Pooling

The middleware uses PostgreSQL connection pooling efficiently:
- Gets connection from pool
- Sets `SET LOCAL` (transaction-scoped variable)
- Executes queries
- Releases connection back to pool
- Session variable is automatically cleared

## Compliance

### FedRAMP AC-3 (Access Enforcement)

✅ **Requirement**: The information system enforces approved authorizations for logical access to information and system resources.

**Implementation**:
- RLS enforces tenant isolation at database level
- Multi-factor enforcement: JWT + middleware + RLS policies
- Defense in depth: Even if application logic fails, database enforces isolation

### SOC 2 CC6.3 (Logical and Physical Access Controls)

✅ **Requirement**: The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes.

**Implementation**:
- Tenant-based access control enforced at database level
- Policies prevent unauthorized access to other tenants' data
- Audit logging tracks all access attempts

## Troubleshooting

### Issue: Queries Return 0 Rows

**Symptom**: Queries return empty results when data should exist

**Diagnosis**:
```sql
-- Check if tenant context is set
SELECT current_setting('app.current_tenant_id', true);

-- Check if user has tenant_id
SELECT id, email, tenant_id FROM users WHERE id = '<user-id>';

-- Check if data exists for tenant
SET app.current_tenant_id = '<tenant-id>';
SELECT COUNT(*) FROM vehicles;
```

**Solutions**:
1. Ensure `authenticateJWT` middleware ran before `setTenantContext`
2. Verify JWT token contains valid `tenant_id`
3. Check tenant_id in users table is not NULL
4. Verify RLS policies are enabled: `SELECT * FROM pg_policies WHERE tablename = 'vehicles';`

### Issue: Cross-Tenant Access Possible

**Symptom**: User can see data from other tenants

**Diagnosis**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'vehicles';

-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'vehicles';

-- Test isolation manually
SET app.current_tenant_id = '<tenant-1>';
SELECT COUNT(*) FROM vehicles; -- Should only show Tenant 1 data
```

**Solutions**:
1. Run migration: `psql -f api/db/migrations/032_enable_rls.sql`
2. Verify policies: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Check middleware is applied: Look for `app.use('/api', authenticateJWT, setTenantContext)` in server.ts

### Issue: "app.current_tenant_id" Not Set Error

**Symptom**: Error message: "unrecognized configuration parameter 'app.current_tenant_id'"

**Cause**: Tenant context middleware not executed before database query

**Solutions**:
1. Ensure middleware order is correct in server.ts
2. Check that route is under `/api` path (where middleware applies)
3. Verify no routes bypass the middleware stack

## Deployment Checklist

Before deploying RLS to production:

- [ ] Run SQL verification: `psql -f api/scripts/verify-rls.sql`
- [ ] Run integration tests: `node dist/scripts/test-rls-isolation.js`
- [ ] Verify middleware is applied globally in server.ts
- [ ] Check all tables have tenant_id with NOT NULL constraint
- [ ] Verify RLS policies exist for all multi-tenant tables
- [ ] Test with multiple tenant accounts
- [ ] Review audit logs for tenant context setting
- [ ] Backup database before deployment
- [ ] Document rollback procedure
- [ ] Train team on RLS behavior and troubleshooting

## Migration Rollback

**⚠️ WARNING**: Rolling back RLS removes multi-tenant isolation security!

Only use in emergency situations with proper approval.

```sql
-- Disable RLS on all tables
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Drop policies
DROP POLICY IF EXISTS tenant_isolation_vehicles ON vehicles;
DROP POLICY IF EXISTS tenant_isolation_drivers ON drivers;
-- ... (repeat for all policies)

-- Drop helper functions
DROP FUNCTION IF EXISTS set_tenant_context(UUID);
DROP FUNCTION IF EXISTS get_current_tenant_id();
```

## Future Enhancements

1. **Audit Logging**: Log all tenant context changes for compliance
2. **Performance Monitoring**: Track RLS overhead per query
3. **Admin Bypass**: Implement secure admin access for support operations
4. **Multi-Level Isolation**: Add department/role-based RLS policies
5. **Automated Testing**: Add RLS tests to CI/CD pipeline

## References

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [FedRAMP AC-3 Control](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf)
- [SOC 2 Trust Services Criteria](https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report)

## Support

For issues or questions about RLS implementation:

1. Review this documentation
2. Run verification scripts
3. Check troubleshooting section
4. Review commit history for issues BACKEND-35, BACKEND-36, BACKEND-37
5. Contact: DevSecOps Team

---

**Document Version**: 1.0
**Last Updated**: 2025-12-10
**Authors**: Fleet Development Team
**Reviewed By**: Security Team
