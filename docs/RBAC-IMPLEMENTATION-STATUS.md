# RBAC Implementation Status

**Last Updated:** 2025-11-16
**Migration:** `database/migrations/002_rbac_permissions.sql`
**Status:** Partially Implemented

---

## Executive Summary

This document tracks the implementation of Role-Based Access Control (RBAC) with least-privilege principles, Separation of Duties (SoD) enforcement, and break-glass emergency access across the Fleet Management System.

### Current Status

- **Routes Fully Updated:** 4/59 (7%)
- **Routes Partially Updated:** 2/59 (3%)
- **Routes Not Updated:** 53/59 (90%)
- **Field Masking Implemented:** 2/6 required routes (33%)

### Key Achievements

1. ✅ Created comprehensive permission system (40+ permissions)
2. ✅ Implemented 10 role definitions with proper scope levels
3. ✅ Built SoD enforcement with database triggers
4. ✅ Implemented break-glass emergency access workflow
5. ✅ Created field masking utility for PII protection
6. ✅ Built permission checking middleware with audit logging
7. ✅ Fully migrated 4 critical routes (work-orders, break-glass, maintenance-schedules)

---

## 1. Route Migration Status

### 1.1 Fully Updated Routes (✅ Complete RBAC)

These routes use `requirePermission()`, have proper field masking (where applicable), and implement row-level security:

| Route File | Permissions Implemented | Field Masking | Row-Level Security | SoD Enforcement |
|-----------|------------------------|---------------|-------------------|-----------------|
| `work-orders.ts` | ✅ 6 permissions | ✅ Yes | ✅ Facility/Team scope | ✅ Self-approval blocked |
| `break-glass.ts` | ✅ 2 permissions | N/A | ✅ Tenant isolation | ✅ FleetAdmin approval |
| `maintenance-schedules.ts` | ✅ 4 permissions | ⚠️ Partial | ✅ Tenant isolation | N/A |
| `drivers.ts` | ⚠️ Partial | ✅ Yes | ❌ Needs team scope | N/A |

**Work Orders Routes:**
- `GET /work-orders` - `work_order:view:team` (with facility/team filtering)
- `GET /work-orders/:id` - `work_order:view:own`
- `POST /work-orders` - `work_order:create:team` (scope validation)
- `PUT /work-orders/:id/complete` - `work_order:complete:own` (self-assignment check)
- `PUT /work-orders/:id/approve` - `work_order:approve:fleet` (SoD: blocks self-approval)
- `DELETE /work-orders/:id` - `work_order:delete:fleet`

**Break-Glass Routes:**
- `POST /api/break-glass/request` - Public (authenticated)
- `GET /api/break-glass/requests` - `role:manage:global`
- `POST /api/break-glass/:id/approve` - `role:manage:global` (FleetAdmin only)
- `POST /api/break-glass/:id/revoke` - Public (self or admin)
- `GET /api/break-glass/active` - Public (authenticated, own sessions)

### 1.2 Partially Updated Routes (⚠️ Mixed Implementation)

| Route File | Status | Issue |
|-----------|--------|-------|
| `maintenance-schedules.ts` | Some endpoints updated | DELETE and recurring endpoints still use `authorize()` |
| `drivers.ts` | Has field masking | Uses both `requirePermission()` and `authorize()` |

### 1.3 Not Updated Routes (❌ Still Using Old `authorize()`)

The following 53 routes still use the legacy `authorize('admin', 'fleet_manager')` pattern:

**Core Resources:**
- `vehicles.ts` - 5 endpoints
- `purchase-orders.ts` - 5 endpoints
- `fuel-transactions.ts` - 5 endpoints
- `safety-incidents.ts` - 5 endpoints
- `vendors.ts` - 5 endpoints
- `facilities.ts` - 5 endpoints
- `routes.ts` - 5 endpoints
- `geofences.ts` - 5 endpoints
- `inspections.ts` - 5 endpoints
- `policies.ts` - 5 endpoints
- `telemetry.ts` - 5 endpoints

**Advanced Features:**
- `ai-insights.routes.ts` - 18 AI/ML endpoints
- `alerts.routes.ts` - 14 alerting endpoints
- `video-telematics.routes.ts` - 15 video endpoints
- `telematics.routes.ts` - 13 telemetry endpoints
- `smartcar.routes.ts` - 10 integration endpoints
- `route-optimization.routes.ts` - 11 optimization endpoints
- `fuel-purchasing.routes.ts` - 10 fuel management endpoints
- `incident-management.routes.ts` - 9 incident endpoints
- `ev-management.routes.ts` - 13 EV endpoints
- `heavy-equipment.routes.ts` - 10 equipment endpoints
- `vehicle-3d.routes.ts` - 11 3D viewer endpoints
- `dispatch.routes.ts` - 12 dispatch endpoints
- `asset-management.routes.ts` - 11 asset endpoints
- `cost-analysis.routes.ts` - 6 analytics endpoints
- `custom-reports.routes.ts` - 8 reporting endpoints
- `executive-dashboard.routes.ts` - 6 dashboard endpoints
- `fleet-optimizer.routes.ts` - 4 optimizer endpoints
- `task-management.routes.ts` - 6 task endpoints
- `mobile-integration.routes.ts` - 10 mobile endpoints

**Documents & Communications:**
- `documents.ts` - 10 document endpoints
- `documents.routes.ts` - 10 document endpoints
- `communications.ts` - 12 communication endpoints
- `communication-logs.ts` - 5 log endpoints

**Personal Use & Compliance:**
- `personal-use-charges.ts` - 15 personal use endpoints
- `personal-use-policies.ts` - 10 policy endpoints
- `osha-compliance.ts` - 12 OSHA endpoints
- `policy-templates.ts` - 12 template endpoints

**Damage & Reports:**
- `damage.ts` - 10 damage assessment endpoints
- `damage-reports.ts` - 5 damage report endpoints
- `billing-reports.ts` - 5 billing endpoints

**Other:**
- `trip-usage.ts` - 15 trip tracking endpoints
- `charging-sessions.ts` - 5 EV charging endpoints
- `charging-stations.ts` - 5 charging station endpoints
- `arcgis-layers.ts` - 7 GIS endpoints
- `traffic-cameras.ts` - 5 camera endpoints
- `video-events.ts` - 5 video event endpoints
- `vehicle-identification.routes.ts` - 7 VIN decoder endpoints
- `driver-scorecard.routes.ts` - 3 scorecard endpoints
- `push-notifications.routes.ts` - 9 notification endpoints
- `quality-gates.ts` - 4 quality gate endpoints
- `deployments.ts` - 5 deployment endpoints

---

## 2. Permission Matrix

### 2.1 Roles and Descriptions

| Role | Display Name | Scope | MFA Required | JIT Elevation | Max Dataset |
|------|-------------|-------|--------------|---------------|-------------|
| FleetAdmin | Fleet Administrator | Global | ✅ Yes | ✅ Yes | Unlimited |
| Manager | Fleet Manager | Fleet | ❌ No | ❌ No | 10,000 rows |
| Supervisor | Operations Supervisor | Team | ❌ No | ❌ No | 5,000 rows |
| Dispatcher | Dispatcher | Fleet | ❌ No | ❌ No | 5,000 rows |
| Mechanic | Maintenance Technician | Own | ❌ No | ❌ No | 1,000 rows |
| Driver | Vehicle Operator | Own | ❌ No | ❌ No | 100 rows |
| SafetyOfficer | Safety & Compliance Officer | Global | ✅ Yes | ❌ No | 10,000 rows |
| Finance | Finance & Procurement | Global | ✅ Yes | ❌ No | Unlimited |
| Analyst | Data Analyst | Fleet | ❌ No | ❌ No | 50,000 rows |
| Auditor | Compliance Auditor | Global (Read-Only) | ✅ Yes | ❌ No | 50,000 rows |

### 2.2 Permission Assignment by Role

#### FleetAdmin
- **Vehicles:** view:global, create, update, delete
- **Drivers:** view:global, create, update
- **Work Orders:** view:fleet, create:fleet, approve:fleet
- **Routes:** view:fleet, create, update
- **Users:** manage:global
- **Roles:** manage:global
- **Reports:** view, generate, export
- **Telemetry:** view:fleet
- **Video:** view:global
- **Inspections:** view:fleet
- **Fuel:** view:fleet

#### Manager
- **Purchase Orders:** approve:fleet (with approval limit)
- All FleetAdmin permissions except user/role management

#### Dispatcher
- **Vehicles:** view:fleet, assign:fleet
- **Drivers:** view:fleet
- **Routes:** view:fleet, create, update
- **Work Orders:** view:fleet
- **Telemetry:** view:fleet

#### Mechanic
- **Vehicles:** view:fleet (read-only)
- **Work Orders:** view:own, complete:own
- **Inspections:** create:own

#### Driver
- **Vehicles:** view:own
- **Drivers:** view:own (own profile)
- **Routes:** view:own
- **Inspections:** create:own
- **Fuel Transactions:** create:own

#### SafetyOfficer
- **Vehicles:** view:global
- **Drivers:** view:global, certify:global
- **Safety Incidents:** view:global, create, approve
- **Video Events:** view:global
- **Inspections:** view:fleet
- **Reports:** view, generate

#### Finance
- **Purchase Orders:** view:global, create:global
- **Fuel Transactions:** view:fleet
- **Reports:** view

#### Auditor (Read-Only)
- All `:view:` permissions
- **Audit Logs:** view:global, export:global
- **Reports:** view, export

---

## 3. Field Masking Summary

Field-level access control masks PII and sensitive data based on role.

### 3.1 Implemented Field Masking

#### Drivers (`drivers.ts`)
| Field | Classification | Allowed Roles | Strategy |
|-------|---------------|---------------|----------|
| `license_number` | Confidential | FleetAdmin, Manager, SafetyOfficer, Auditor | Partial (`XX****XX`) |
| `license_state` | Internal | FleetAdmin, Manager, SafetyOfficer, Dispatcher, Auditor | Full |
| `medical_card_expiration` | Confidential | FleetAdmin, SafetyOfficer, Auditor | Full |
| `emergency_contact_name` | Confidential | FleetAdmin, Manager, Auditor | Full |
| `emergency_contact_phone` | Confidential | FleetAdmin, Manager, Auditor | Partial |
| `ssn` | Restricted | FleetAdmin, Auditor | Partial (`***-**-1234`) |

#### Work Orders (`work-orders.ts`)
| Field | Classification | Allowed Roles | Strategy |
|-------|---------------|---------------|----------|
| `labor_cost` | Confidential | FleetAdmin, Manager, Finance, Auditor | Remove |
| `parts_cost` | Confidential | FleetAdmin, Manager, Finance, Auditor | Remove |
| `total_cost` | Confidential | FleetAdmin, Manager, Finance, Auditor | Remove |

### 3.2 Pending Field Masking Implementation

The following routes handle sensitive data but don't have field masking yet:

- **Vehicles:** `purchase_price`, `current_value`, `latitude`, `longitude`
- **Purchase Orders:** `subtotal`, `tax`, `total`, `line_items`
- **Fuel Transactions:** `fuel_card_number`
- **Safety Incidents:** `property_damage_cost`, `insurance_claim_number`

---

## 4. Separation of Duties (SoD) Enforcement

### 4.1 Role Conflicts (Database-Level)

The following role combinations are **forbidden** at the database level via triggers:

| Role 1 | Role 2 | Reason |
|--------|--------|--------|
| Finance | FleetAdmin | Prevent budget control conflicts |
| Finance | Manager | Prevent self-approval of purchase orders |
| Auditor | FleetAdmin | Ensure independent oversight |
| Auditor | Finance | Ensure financial audit independence |
| Driver | Mechanic | Prevent maintenance fraud |
| Dispatcher | Finance | Separate operations from procurement |

### 4.2 Self-Approval Prevention (Application-Level)

Implemented in `work-orders.ts`:

```typescript
// PUT /work-orders/:id/approve
// Checks: created_by !== current_user.id
```

**Implementation Status:**
- ✅ Work Orders: Blocks self-approval
- ❌ Purchase Orders: NOT IMPLEMENTED
- ❌ Safety Incidents: NOT IMPLEMENTED

### 4.3 Approval Limits

Managers have configurable approval limits stored in `users.approval_limit`:

```sql
ALTER TABLE users ADD COLUMN approval_limit DECIMAL(12,2) DEFAULT 0;
```

**Implementation:**
- Database column: ✅ Added
- Middleware: ✅ `checkApprovalLimit()` in `permissions.ts`
- Route integration: ❌ NOT IMPLEMENTED (needs to be added to purchase order approval endpoints)

---

## 5. Row-Level Security (RLS)

### 5.1 Scope Levels

Users are assigned a `scope_level` that determines data visibility:

| Scope | Description | Examples |
|-------|-------------|----------|
| `own` | Only resources assigned to user | Driver sees own vehicle, Mechanic sees assigned work orders |
| `team` | Resources in assigned team/facility | Supervisor sees team's vehicles, drivers in facility |
| `fleet` | All resources in organization | Dispatcher sees all vehicles, Manager sees all work orders |
| `global` | All data including cross-tenant (for SaaS) | FleetAdmin, Auditor |

### 5.2 Scope Implementation

Users have array fields for scope definition:
```sql
facility_ids UUID[]       -- Facilities user can access
team_driver_ids UUID[]    -- Drivers user can manage
team_vehicle_ids UUID[]   -- Vehicles user can manage
```

### 5.3 Row-Level Filtering Implementation

**Implemented:**
- ✅ Work Orders: Filters by `facility_id` for team scope, `assigned_technician_id` for own scope

**Not Implemented:**
- ❌ Vehicles: No team/own filtering
- ❌ Drivers: No team/own filtering
- ❌ Purchase Orders: No scope filtering
- ❌ Routes: No team filtering

---

## 6. Break-Glass Emergency Access

### 6.1 Workflow

1. **Request:** User submits JIT elevation request with reason and ticket reference
2. **Approval:** FleetAdmin reviews and approves/denies
3. **Activation:** Temporary role granted for configurable duration (max 30 minutes)
4. **Expiration:** Role automatically revoked when time expires
5. **Audit:** All actions logged in `break_glass_sessions` and `permission_check_logs`

### 6.2 Implementation Status

- ✅ Database schema: `break_glass_sessions` table
- ✅ Routes: `/api/break-glass/*` endpoints
- ✅ Approval workflow: FleetAdmin approval required
- ✅ Auto-expiration: Background job `expireBreakGlassSessions()`
- ✅ Notifications: Email/push notifications to approvers
- ✅ Audit logging: Full trail of requests, approvals, usage

### 6.3 Eligible Roles for JIT Elevation

| Role | Allowed | Max Duration |
|------|---------|--------------|
| FleetAdmin | ✅ Yes | 30 minutes |
| Manager | ❌ No | N/A |
| Supervisor | ❌ No | N/A |
| Dispatcher | ❌ No | N/A |
| Others | ❌ No | N/A |

---

## 7. Audit Logging

### 7.1 Permission Check Logs

Every permission check is logged to `permission_check_logs`:

```sql
CREATE TABLE permission_check_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    tenant_id UUID,
    permission_name VARCHAR(100),
    resource_id UUID,
    granted BOOLEAN,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP
);
```

**Indexed by:** user_id, granted, created_at

### 7.2 Audit Queries

**Failed permission checks (last 24 hours):**
```sql
SELECT * FROM permission_check_logs
WHERE granted = false
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**User's permission history:**
```sql
SELECT * FROM permission_check_logs
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 100;
```

**Break-glass sessions:**
```sql
SELECT * FROM break_glass_sessions
WHERE status IN ('active', 'expired')
ORDER BY created_at DESC;
```

---

## 8. Remaining Implementation Tasks

### Priority 1: Critical Routes (Week 1)

1. **Purchase Orders** (`purchase-orders.ts`)
   - [ ] Add `requirePermission('purchase_order:view:global')` to GET endpoints
   - [ ] Add `requirePermission('purchase_order:create:global')` to POST
   - [ ] Add `requirePermission('purchase_order:approve:fleet')` to approval endpoint
   - [ ] Add `checkApprovalLimit()` middleware to approval
   - [ ] Add `preventSelfApproval()` to approval endpoint
   - [ ] Add field masking for financial data

2. **Vehicles** (`vehicles.ts`)
   - [ ] Add `requirePermission('vehicle:view:fleet')` to GET endpoints
   - [ ] Add `requirePermission('vehicle:create:global')` to POST
   - [ ] Add `requirePermission('vehicle:update:global')` to PUT
   - [ ] Add `requirePermission('vehicle:delete:global')` to DELETE
   - [ ] Add field masking for `purchase_price`, `current_value`, GPS coordinates
   - [ ] Implement team/own scope filtering

3. **Drivers** (`drivers.ts`)
   - [ ] Complete migration (remove remaining `authorize()` calls)
   - [ ] Add team/own scope filtering
   - [ ] Verify field masking works correctly

4. **Safety Incidents** (`safety-incidents.ts`)
   - [ ] Add `requirePermission('safety_incident:view:global')` to GET
   - [ ] Add `requirePermission('safety_incident:create:global')` to POST
   - [ ] Add `requirePermission('safety_incident:approve:global')` to approval
   - [ ] Add `preventSelfApproval()` to approval endpoint
   - [ ] Add field masking for insurance/cost data

5. **Fuel Transactions** (`fuel-transactions.ts`)
   - [ ] Add `requirePermission('fuel_transaction:view:fleet')` to GET
   - [ ] Add `requirePermission('fuel_transaction:create:own')` to POST
   - [ ] Add field masking for `fuel_card_number`
   - [ ] Implement own/team scope filtering

### Priority 2: Operational Routes (Week 2)

6. **Routes** (`routes.ts`)
   - [ ] Migrate to `requirePermission('route:*')`
   - [ ] Add team scope filtering for Dispatchers

7. **Inspections** (`inspections.ts`)
   - [ ] Migrate to `requirePermission('inspection:*')`
   - [ ] Drivers can create:own, others view:fleet

8. **Maintenance Schedules** (`maintenance-schedules.ts`)
   - [ ] Complete partial migration (convert remaining `authorize()` calls)
   - [ ] Add maintenance_schedule permissions to migration

9. **Facilities, Vendors, Geofences, Policies, Telemetry**
   - [ ] Migrate to appropriate `requirePermission()` calls
   - [ ] Add necessary permissions to migration

### Priority 3: Advanced Features (Week 3)

10. **Video & Telematics**
    - [ ] `video-telematics.routes.ts`, `video-events.ts`
    - [ ] `telematics.routes.ts`, `telemetry.ts`
    - [ ] Add `rateLimit()` middleware for sensitive GPS/video access

11. **AI & Analytics**
    - [ ] `ai-insights.routes.ts`
    - [ ] `alerts.routes.ts`
    - [ ] `cost-analysis.routes.ts`, `custom-reports.routes.ts`

12. **EV & Heavy Equipment**
    - [ ] `ev-management.routes.ts`, `charging-stations.ts`, `charging-sessions.ts`
    - [ ] `heavy-equipment.routes.ts`

### Priority 4: Integrations & Specialized (Week 4)

13. **External Integrations**
    - [ ] `smartcar.routes.ts`
    - [ ] `mobile-integration.routes.ts`
    - [ ] `arcgis-layers.ts`

14. **Documents & Communications**
    - [ ] `documents.ts`, `documents.routes.ts`
    - [ ] `communications.ts`, `communication-logs.ts`
    - [ ] `push-notifications.routes.ts`

15. **Personal Use & Compliance**
    - [ ] `personal-use-charges.ts`, `personal-use-policies.ts`
    - [ ] `osha-compliance.ts`
    - [ ] `policy-templates.ts`

16. **Remaining Routes**
    - [ ] All other routes listed in "Not Updated" section

---

## 9. Deployment Checklist

### Pre-Deployment

- [ ] Run validation script: `ts-node scripts/validate-rbac.ts`
- [ ] Ensure all critical routes (Priority 1) are migrated
- [ ] Review permission matrix with stakeholders
- [ ] Document field masking rules
- [ ] Test SoD enforcement
- [ ] Test break-glass workflow

### Database Migration

```bash
# 1. Backup production database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).sql

# 2. Run migration in transaction
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migrations/002_rbac_permissions.sql

# 3. Verify migration
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM schema_version;"
```

### Configuration

1. **Configure User Scopes**
   ```sql
   -- Example: Assign supervisor to facilities
   UPDATE users SET
     facility_ids = ARRAY['<facility-uuid-1>', '<facility-uuid-2>'],
     scope_level = 'team'
   WHERE id = '<supervisor-user-id>';

   -- Example: Set approval limit for managers
   UPDATE users SET approval_limit = 50000.00
   WHERE id = '<manager-user-id>';
   ```

2. **Assign Roles to Users**
   ```sql
   -- Remove old role field dependency (keep for now for backward compatibility)
   -- Assign new RBAC roles
   INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
   SELECT '<user-id>', r.id, '<admin-id>', true
   FROM roles r WHERE r.name = 'Manager';
   ```

3. **Enable MFA for Required Roles**
   ```sql
   -- Verify MFA requirement
   SELECT name, mfa_required FROM roles WHERE mfa_required = true;
   -- FleetAdmin, SafetyOfficer, Finance, Auditor should all be true
   ```

4. **Test Break-Glass Workflow**
   - Submit elevation request as FleetAdmin
   - Approve as another FleetAdmin
   - Verify temporary role is granted
   - Wait for expiration (or trigger background job)
   - Verify role is revoked

### Monitoring

1. **Monitor Permission Denials**
   ```sql
   -- Check for unusual permission denials
   SELECT permission_name, COUNT(*) as denial_count
   FROM permission_check_logs
   WHERE granted = false
   AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY permission_name
   ORDER BY denial_count DESC;
   ```

2. **Monitor Break-Glass Usage**
   ```sql
   -- Active break-glass sessions
   SELECT
     u.email,
     r.name as elevated_role,
     bg.reason,
     bg.end_time
   FROM break_glass_sessions bg
   JOIN users u ON bg.user_id = u.id
   JOIN roles r ON bg.elevated_role_id = r.id
   WHERE bg.status = 'active';
   ```

3. **Monitor SoD Violations**
   ```sql
   -- Users with conflicting roles (should be 0)
   SELECT
     u.email,
     array_agg(r.name) as roles
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id
   WHERE ur.is_active = true
   GROUP BY u.id, u.email
   HAVING COUNT(DISTINCT ur.role_id) > 1;
   ```

### Post-Deployment

- [ ] Verify permission checks are logging correctly
- [ ] Test each role's access level
- [ ] Verify field masking works for each role
- [ ] Test approval workflows (purchase orders, work orders)
- [ ] Test break-glass emergency access
- [ ] Monitor permission denial logs for 48 hours
- [ ] Collect user feedback on access issues
- [ ] Update documentation with any findings

---

## 10. Testing Guide

### Unit Tests

```bash
# Test permission middleware
npm test -- permissions.test.ts

# Test field masking
npm test -- fieldMasking.test.ts

# Test break-glass workflow
npm test -- break-glass.test.ts
```

### Integration Tests

1. **Test as Each Role**
   - Create test users for each role
   - Verify access levels match permission matrix
   - Verify field masking works correctly
   - Verify scope filtering works

2. **Test SoD Enforcement**
   - Attempt to assign conflicting roles (should fail)
   - Attempt self-approval (should fail)
   - Attempt to approve beyond limit (should fail)

3. **Test Break-Glass**
   - Request elevation
   - Approve/deny
   - Verify temporary access
   - Verify auto-expiration
   - Verify audit trail

### Security Tests

- [ ] SQL injection in permission checks
- [ ] Privilege escalation attempts
- [ ] Token manipulation
- [ ] Scope bypass attempts
- [ ] Rate limit bypass

---

## 11. Performance Considerations

### Permission Cache

The `requirePermission()` middleware caches user permissions for 5 minutes to reduce database queries.

**Cache invalidation triggers:**
- User role assignment changes
- Permission modifications
- Role permission changes

**Implementation:**
```typescript
// Clear cache when roles change
clearPermissionCache(userId)
```

### Query Optimization

- Indexed on `user_roles.user_id` and `user_roles.is_active`
- Indexed on `permissions.name`
- Indexed on `permission_check_logs.created_at DESC` for audit queries

**Expected query time:**
- Permission check: <10ms
- Field masking: <5ms per record
- Row-level filtering: <50ms for 1000 records

---

## 12. Support & Troubleshooting

### Common Issues

**Issue:** User sees "Insufficient permissions" error
- **Cause:** User role doesn't have required permission
- **Fix:** Verify role assignment in `user_roles` table, check permission mapping in `role_permissions`

**Issue:** Field still visible despite masking rules
- **Cause:** User role is in `allowedRoles` array
- **Fix:** Review `fieldMasking.ts` rules, verify user's actual roles

**Issue:** Cannot assign role to user
- **Cause:** SoD violation with existing role
- **Fix:** Check `sod_rules` table, remove conflicting role first

**Issue:** Break-glass request not showing up
- **Cause:** No FleetAdmin users to approve
- **Fix:** Ensure at least one user has FleetAdmin role with `is_active = true`

### Audit Queries

See Section 7.2 for detailed audit queries.

---

## 13. References

- **Database Migration:** `/database/migrations/002_rbac_permissions.sql`
- **Permission Middleware:** `/api/src/middleware/permissions.ts`
- **Field Masking Utility:** `/api/src/utils/fieldMasking.ts`
- **Break-Glass Routes:** `/api/src/routes/break-glass.ts`
- **Example Implementation:** `/api/src/routes/work-orders.ts`
- **Validation Script:** `/scripts/validate-rbac.ts`

---

## Appendix A: Permission Naming Convention

Permissions follow the pattern: `{resource}:{verb}:{scope}`

**Resources:** vehicle, driver, work_order, purchase_order, route, safety_incident, etc.
**Verbs:** view, create, update, delete, approve, assign, certify, export, etc.
**Scopes:** own, team, fleet, global

**Examples:**
- `work_order:approve:fleet` - Can approve any work order in the fleet
- `vehicle:view:team` - Can view vehicles in assigned team
- `fuel_transaction:create:own` - Can create own fuel transactions

---

## Appendix B: Quick Reference SQL

**Check user's permissions:**
```sql
SELECT p.name, p.description
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = '<user-id>'
AND ur.is_active = true;
```

**Check user's roles:**
```sql
SELECT r.name, r.display_name, ur.expires_at
FROM roles r
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = '<user-id>'
AND ur.is_active = true;
```

**Assign role to user:**
```sql
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
VALUES ('<user-id>', '<role-id>', '<admin-id>', true);
```

**Revoke role from user:**
```sql
UPDATE user_roles
SET is_active = false
WHERE user_id = '<user-id>' AND role_id = '<role-id>';
```

---

**Document Version:** 1.0
**Maintained By:** Fleet Platform Team
**Next Review:** After Priority 1 routes complete
