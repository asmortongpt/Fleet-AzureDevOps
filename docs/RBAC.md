# Fleet Management System - RBAC Documentation

## Table of Contents

1. [Overview](#overview)
2. [Roles](#roles)
3. [Permissions](#permissions)
4. [Permission Naming Convention](#permission-naming-convention)
5. [Separation of Duties (SoD)](#separation-of-duties-sod)
6. [Row-Level Security](#row-level-security)
7. [Field-Level Masking](#field-level-masking)
8. [Break-Glass Access](#break-glass-access)
9. [Implementation Guide](#implementation-guide)
10. [Testing RBAC](#testing-rbac)

---

## Overview

The Fleet Management System implements a fine-grained Role-Based Access Control (RBAC) system with the following features:

- **10 distinct roles** covering all operational personas
- **60+ granular permissions** with resource:verb:scope naming
- **Separation of Duties (SoD)** enforcement preventing conflicting role combinations
- **Row-level security** ensuring users only access data within their scope
- **Field-level masking** for PII and financial data
- **Break-glass mechanism** for emergency access with approval workflow
- **FedRAMP-compliant audit logging** of all permission checks

### Design Principles

1. **Default Deny**: All access must be explicitly granted
2. **Least Privilege**: Users receive minimum permissions needed for their job
3. **Defense in Depth**: Frontend hiding + backend enforcement
4. **Auditability**: All permission checks and denials are logged

---

## Roles

### Role Matrix

| Role | Description | MFA Required | Data Scope | Max Dataset Size |
|------|-------------|--------------|------------|------------------|
| **FleetAdmin** | Tenant administrator with full access (except financial approvals) | ✅ Yes | Global | Unlimited |
| **Manager** | Fleet manager with operational oversight and approval authority | ❌ No | Fleet/Facility | 10,000 |
| **Supervisor** | Operations supervisor managing day-to-day team activities | ❌ No | Team | 5,000 |
| **Dispatcher** | Dispatch coordinator for routes and real-time assignments | ❌ No | Fleet | 5,000 |
| **Mechanic** | Maintenance technician executing repairs | ❌ No | Own | 1,000 |
| **Driver** | Vehicle operator with self-service access | ❌ No | Own | 100 |
| **SafetyOfficer** | Safety & compliance specialist, OSHA reporting | ✅ Yes | Global | 10,000 |
| **Finance** | Finance & procurement; creates POs, requires approvals | ✅ Yes | Global | Unlimited |
| **Analyst** | Data analyst with read-only reporting access | ❌ No | Global | 50,000 |
| **Auditor** | Compliance auditor with read-only access to all data | ✅ Yes | Global | 50,000 |

### Role Details

#### FleetAdmin
**Purpose**: Organizational administration and user management

**Can**:
- Manage all vehicles, drivers, and facilities
- Create and assign user accounts
- Configure system settings
- View reports and analytics

**Cannot**:
- Approve financial transactions (SoD with Finance)
- Self-approve any records they create

**Typical Users**: IT administrators, fleet directors

---

#### Manager
**Purpose**: Operational oversight with approval authority

**Can**:
- View and update vehicles/drivers in assigned facilities
- Create and approve work orders (not self-created)
- Approve purchase orders up to their approval limit
- Generate reports for their fleet

**Cannot**:
- Access data outside assigned facilities
- Approve their own work orders or POs (SoD)
- Manage user accounts or system settings

**Typical Users**: Fleet managers, regional managers

---

#### Supervisor
**Purpose**: Day-to-day team management

**Can**:
- Assign drivers to team vehicles
- Create work orders for team vehicles
- Monitor team performance
- View GPS and routes for team

**Cannot**:
- Approve work orders or financial transactions
- Access vehicles/drivers outside their team
- Delete or bulk-update records

**Typical Users**: Shift supervisors, yard managers

---

#### Dispatcher
**Purpose**: Real-time route and vehicle assignment

**Can**:
- View all active vehicles and drivers
- Create and modify routes
- Assign vehicles to drivers
- Monitor GPS locations in real-time

**Cannot**:
- View financial data (purchase prices, costs)
- Create or modify vehicles/drivers
- Access PII beyond names and availability

**Typical Users**: Dispatch coordinators, logistics planners

---

#### Mechanic
**Purpose**: Execute maintenance tasks

**Can**:
- View assigned work orders
- Complete work orders with labor/parts
- Create inspection reports
- Request parts (cannot approve orders)

**Cannot**:
- Create, approve, or delete work orders
- See cost data on work orders
- Access vehicles not in their work queue

**Typical Users**: Technicians, mechanics, field service staff

---

#### Driver
**Purpose**: Self-service for field operations

**Can**:
- View own assigned vehicle
- View own profile and certifications
- Perform pre/post-trip inspections
- Log fuel transactions
- View assigned routes

**Cannot**:
- View other drivers' data
- Modify vehicle or route assignments
- Access financial or compliance data

**Typical Users**: Vehicle operators, delivery drivers

---

#### SafetyOfficer
**Purpose**: Safety, compliance, and incident management

**Can**:
- View all safety incidents and video events
- Create and approve OSHA reports
- Certify driver compliance (not self)
- Create and test safety policies
- Access video footage with audit logging

**Cannot**:
- Modify operational assignments
- Access financial procurement data
- Deploy policies without approval

**Typical Users**: Safety managers, compliance officers

---

#### Finance
**Purpose**: Procurement and vendor management

**Can**:
- Create purchase orders and invoices
- Manage vendor relationships
- View fuel transactions
- Request payment processing

**Cannot**:
- Approve own POs (requires Manager)
- Access operational assignments
- Modify vehicle or driver records

**Typical Users**: Procurement specialists, accounts payable

---

#### Analyst
**Purpose**: Reporting and data analysis

**Can (read-only)**:
- View all operational data
- Generate custom reports
- Export data for analysis
- Schedule automated reports

**Cannot**:
- Modify any records
- Approve transactions
- Access PII without masking

**Typical Users**: Business analysts, BI developers

---

#### Auditor
**Purpose**: Independent compliance review

**Can (read-only)**:
- View all data including audit logs
- Export compliance reports
- Review permission check logs
- Access historical records

**Cannot**:
- Modify any records
- Combine with operational roles (strict SoD)

**Typical Users**: Internal auditors, compliance reviewers

---

## Permissions

### Permission Structure

Permissions follow the format: `{resource}:{verb}:{scope}`

**Examples**:
- `work_order:create:team` - Create work orders for your team
- `vehicle:view:global` - View all vehicles in organization
- `driver:certify:global` - Certify any driver

### Scopes

| Scope | Description | Example |
|-------|-------------|---------|
| `own` | Only resources directly assigned to the user | Driver sees their own vehicle |
| `team` | Resources within user's team or facility | Supervisor sees team vehicles |
| `fleet` | All resources in assigned fleets | Dispatcher sees all active vehicles |
| `global` | All resources in the tenant | FleetAdmin sees everything |

### Core Permissions by Resource

#### Vehicle Permissions
```
vehicle:view:{own|team|fleet|global}
vehicle:create:global
vehicle:update:{team|global}
vehicle:delete:global
vehicle:assign:{team|fleet}
```

#### Driver Permissions
```
driver:view:{own|team|fleet|global}
driver:create:global
driver:update:global
driver:certify:global
```

#### Work Order Permissions
```
work_order:view:{own|team|fleet}
work_order:create:{team|fleet}
work_order:complete:own
work_order:approve:fleet
work_order:delete:fleet
```

#### Purchase Order Permissions
```
purchase_order:view:global
purchase_order:create:global
purchase_order:approve:fleet
```

#### Safety Permissions
```
safety_incident:view:global
safety_incident:create:global
safety_incident:approve:global
video_event:view:global
```

#### System Permissions
```
user:manage:global
role:manage:global
audit_log:view:global
audit_log:export:global
```

---

## Permission Naming Convention

### Verbs

Standard CRUD plus domain-specific actions:

| Verb | Meaning | Side Effects |
|------|---------|--------------|
| `view` | Read a single record | None |
| `list` | Read multiple records | None |
| `create` | Create new record | Yes |
| `update` | Modify existing record | Yes |
| `delete` | Remove record | Yes |
| `assign` | Change assignments | Yes |
| `approve` | Authorize action | Yes, requires SoD |
| `complete` | Mark task done | Yes |
| `certify` | Validate compliance | Yes |
| `export` | Extract data | Audit logged |
| `manage` | Full CRUD | Yes |

### Best Practices

✅ **Do**:
- Use specific verbs (`approve` not `update`)
- Include scope (`team` not global for supervisors)
- Document conditions in database

❌ **Don't**:
- Use wildcards (`*:*:*`)
- Combine incompatible scopes
- Grant `manage` without justification

---

## Separation of Duties (SoD)

### SoD Rules

The following role combinations are **forbidden** and enforced by database triggers:

| Role | Cannot Combine With | Reason |
|------|---------------------|--------|
| **Finance** | FleetAdmin, Manager, Dispatcher, Mechanic | Prevents budget control conflicts and self-approval |
| **FleetAdmin** | Finance, Auditor | Prevents self-oversight and financial conflicts |
| **Auditor** | FleetAdmin, Finance, Manager | Ensures independent compliance review |
| **Driver** | Mechanic, Finance, SafetyOfficer | Prevents maintenance fraud and self-certification |
| **Dispatcher** | Finance, Mechanic | Separates operations from procurement and maintenance |

### Self-Approval Prevention

Specific endpoints enforce that users cannot approve their own records:

```typescript
// Work Orders
if (work_order.created_by === user.id) {
  return 403 // Cannot approve own work order
}

// Purchase Orders
if (purchase_order.created_by === user.id || purchase_order.total > user.approval_limit) {
  return 403 // Cannot approve own PO or exceed limit
}

// Safety Incidents
if (safety_incident.reported_by === user.id) {
  return 403 // Cannot approve own incident report
}
```

---

## Row-Level Security

### Implementation

Row-level policies filter data based on user scope before returning results:

```sql
-- Drivers: Only see own record or team drivers
WHERE drivers.tenant_id = user.tenant_id
AND (
  drivers.id IN user.team_driver_ids
  OR drivers.user_id = user.id
  OR user.scope_level IN ('fleet', 'global')
)

-- Work Orders: Only see work in assigned facilities
WHERE work_orders.tenant_id = user.tenant_id
AND (
  work_orders.facility_id IN user.facility_ids
  OR work_orders.assigned_technician_id = user.id
  OR user.scope_level IN ('fleet', 'global')
)
```

### User Scope Fields

The `users` table includes scope configuration:

| Field | Type | Purpose |
|-------|------|---------|
| `facility_ids` | UUID[] | Facilities user can access |
| `team_driver_ids` | UUID[] | Drivers in user's team |
| `team_vehicle_ids` | UUID[] | Vehicles in user's team |
| `scope_level` | enum | Global scope override |
| `approval_limit` | decimal | Max $ amount for PO approvals |

---

## Field-Level Masking

### Sensitive Field Classifications

| Classification | Roles With Access | Masking Strategy |
|----------------|-------------------|------------------|
| **Internal** | Most roles | No masking |
| **Confidential** | Admin, Manager, Auditor | Partial masking (e.g., `**card-1234`) |
| **Restricted** | Admin, Auditor only | Removed from response |
| **Sensitive** | Specific roles only | Full masking or removal |

### Examples by Resource

#### Drivers
```javascript
{
  "license_number": "***567",        // Confidential: Partial mask for Dispatcher
  "medical_card_expiration": null,   // Confidential: Removed for non-Safety roles
  "emergency_contact_phone": "**7890" // Confidential: Partial mask
}
```

#### Vehicles
```javascript
{
  "purchase_price": undefined,      // Confidential: Removed for non-Finance
  "latitude": 37.7749,              // Sensitive: Visible to Dispatcher
  "longitude": -122.4194            // Sensitive: Visible to Dispatcher
}
```

#### Work Orders
```javascript
{
  "labor_cost": undefined,          // Confidential: Removed for Mechanic
  "parts_cost": undefined,          // Confidential: Removed for Mechanic
  "total_cost": undefined           // Confidential: Removed for Mechanic
}
```

### Implementation

Field masking is applied automatically via middleware:

```typescript
router.get('/drivers',
  requirePermission('driver:view:team'),
  applyFieldMasking('driver'),  // ← Automatic masking
  async (req, res) => { ... }
)
```

---

## Break-Glass Access

### Overview

The break-glass system provides **temporary emergency access** with approval workflow and time limits.

### Workflow

1. **Request Elevation**
   ```bash
   POST /api/break-glass/request
   {
     "role_id": "uuid-of-manager-role",
     "reason": "Emergency PO approval needed for critical repair during outage",
     "ticket_reference": "INC-2024-001",
     "duration_minutes": 30
   }
   ```

2. **Approval by FleetAdmin**
   - Receives urgent notification
   - Reviews ticket reference
   - Approves or denies request

3. **Temporary Access**
   - Role activated for specified duration (max 30 min)
   - All actions fully audited
   - Auto-expires at end time

4. **Revocation**
   - User can self-revoke
   - Admin can force-revoke
   - Automatic expiration

### Security Controls

- **Max Duration**: 30 minutes
- **Approver Roles**: FleetAdmin only
- **Ticket Required**: Must reference incident/change number
- **Audit Trail**: Every action logged with session ID
- **JIT Enabled**: Only roles with `just_in_time_elevation_allowed = true`

### Monitoring

Query active break-glass sessions:

```sql
SELECT
  u.email,
  r.name as elevated_role,
  bg.reason,
  bg.ticket_reference,
  EXTRACT(EPOCH FROM (bg.end_time - NOW())) / 60 as minutes_remaining
FROM break_glass_sessions bg
JOIN users u ON bg.user_id = u.id
JOIN roles r ON bg.elevated_role_id = r.id
WHERE bg.status = 'active'
AND bg.end_time > NOW();
```

---

## Implementation Guide

### Adding Permissions to a New Endpoint

```typescript
import { requirePermission } from '../middleware/permissions'
import { applyFieldMasking } from '../utils/fieldMasking'

router.post('/vehicles',
  // 1. Check permission
  requirePermission('vehicle:create:global', {
    // 2. Optional: Custom validation
    customCheck: async (req) => {
      // Additional business logic
      return true
    }
  }),

  // 3. Audit logging
  auditLog({ action: 'CREATE', resourceType: 'vehicles' }),

  // Handler
  async (req, res) => {
    // Auto-enforces tenant_id isolation
    // Field masking applied on response
  }
)
```

### Adding a New Permission

1. **Database**: Insert into `permissions` table
   ```sql
   INSERT INTO permissions (name, resource, verb, scope, description)
   VALUES (
     'vehicle:bulk_update:global',
     'vehicle',
     'bulk_update',
     'global',
     'Bulk update multiple vehicles at once'
   );
   ```

2. **Assign to Roles**
   ```sql
   INSERT INTO role_permissions (role_id, permission_id)
   SELECT r.id, p.id
   FROM roles r, permissions p
   WHERE r.name = 'FleetAdmin'
   AND p.name = 'vehicle:bulk_update:global';
   ```

3. **Frontend**: Update `rbac.ts`
   ```typescript
   export type Permission =
     | "vehicles.bulk_update"
     | ... existing permissions
   ```

### Adding a New Role

1. **Database**:
   ```sql
   INSERT INTO roles (name, display_name, description, mfa_required)
   VALUES (
     'FieldSupervisor',
     'Field Supervisor',
     'Mobile supervisor with limited access',
     false
   );
   ```

2. **Assign Permissions**:
   ```sql
   INSERT INTO role_permissions (role_id, permission_id)
   SELECT r.id, p.id FROM roles r, permissions p
   WHERE r.name = 'FieldSupervisor'
   AND p.name IN ('vehicle:view:team', 'work_order:view:team');
   ```

3. **SoD Rules** (if needed):
   ```sql
   INSERT INTO sod_rules (role_id, conflicting_role_id, reason)
   SELECT r1.id, r2.id, 'FieldSupervisor cannot be Finance'
   FROM roles r1, roles r2
   WHERE r1.name = 'FieldSupervisor' AND r2.name = 'Finance';
   ```

---

## Testing RBAC

### Unit Tests

```typescript
describe('Permission Middleware', () => {
  it('should grant access with valid permission', async () => {
    const req = mockRequest({ user: { id: 'user-1', role: 'Manager' } })
    const res = mockResponse()
    const next = jest.fn()

    await requirePermission('work_order:create:team')(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalledWith(403)
  })

  it('should deny access without permission', async () => {
    const req = mockRequest({ user: { id: 'user-1', role: 'Driver' } })
    const res = mockResponse()

    await requirePermission('work_order:approve:fleet')(req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(403)
  })
})
```

### Integration Tests

```bash
# Mechanic cannot approve work orders
curl -X PUT /api/work-orders/123/approve \
  -H "Authorization: Bearer <mechanic-token>" \
  -d '{}'
# Expected: 403 Forbidden

# Manager cannot approve own PO
curl -X PUT /api/purchase-orders/456/approve \
  -H "Authorization: Bearer <manager-token>"
# Expected: 403 SoD Violation

# Dispatcher cannot see vehicle purchase price
curl -X GET /api/vehicles/789 \
  -H "Authorization: Bearer <dispatcher-token>"
# Expected: 200 OK with purchase_price: undefined
```

### Manual Testing

1. **Create test users** for each role
2. **Test SoD**: Attempt to assign conflicting roles
3. **Test scope**: Verify team users only see team data
4. **Test masking**: Check field visibility by role
5. **Test break-glass**: Request, approve, use, revoke

---

## FAQs

**Q: Can a user have multiple roles?**
A: Yes, but SoD rules prevent conflicting combinations (e.g., Finance + Manager).

**Q: How are permissions cached?**
A: In-memory cache with 5-minute TTL. Cleared when roles change.

**Q: What happens if permission denied?**
A: 403 response + logged to `permission_check_logs` table.

**Q: Can I create custom permissions?**
A: Yes, insert into `permissions` table and assign to roles.

**Q: How do I audit who accessed PII?**
A: Query `permission_check_logs` filtered by resource and granted=true.

**Q: Can break-glass be extended?**
A: No, max 30 minutes. User must request new session.

---

## Troubleshooting

### Permission Denied Despite Correct Role

1. Check permission assignment:
   ```sql
   SELECT p.name FROM permissions p
   JOIN role_permissions rp ON p.id = rp.permission_id
   JOIN user_roles ur ON rp.role_id = ur.role_id
   WHERE ur.user_id = '<user-id>' AND ur.is_active = true;
   ```

2. Clear permission cache:
   ```typescript
   clearPermissionCache(userId)
   ```

3. Check user scope fields:
   ```sql
   SELECT facility_ids, team_driver_ids, scope_level
   FROM users WHERE id = '<user-id>';
   ```

### SoD Error When Assigning Role

```
Error: Separation of Duties violation: This role conflicts with an existing user role
```

**Solution**: Remove conflicting role first:
```sql
UPDATE user_roles SET is_active = false
WHERE user_id = '<user-id>' AND role_id = '<conflicting-role-id>';
```

### Field Masking Not Applied

- Ensure `applyFieldMasking('resource')` middleware is present
- Check role is in `allowedRoles` for that field in `fieldMasking.ts`
- Verify response format matches expected structure

---

## References

- [FedRAMP AC-2: Account Management](https://www.fedramp.gov)
- [NIST RBAC Models](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)

---

*Last Updated: 2025-11-15*
*Version: 2.0*
*Contact: fleet-admin@capitaltechalliance.com*
