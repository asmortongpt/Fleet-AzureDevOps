# Fleet RBAC Permission System

## Overview

The Fleet application implements a comprehensive Role-Based Access Control (RBAC) system with:

- **9 distinct roles** with different permission levels
- **Module-level access control** (11 modules)
- **Action-level permissions** (granular operations)
- **Field-level redaction** (sensitive data protection)
- **Condition-based authorization** (context-aware permissions)
- **Audit logging** for compliance and security monitoring

## Roles

### 1. Admin
**Full system administrator**

- Complete access to all modules and actions
- Can manage users and roles
- Can view and modify all data
- No restrictions

**Module Access:** All modules

**Key Permissions:**
- Full CRUD on all resources
- User and role management
- System configuration

---

### 2. FleetManager
**Fleet operations manager**

- Manages fleet operations and assignments
- Oversees vehicle lifecycle and maintenance
- Access to financial and operational data
- Can approve work orders and assignments

**Module Access:** vehicles, garage, inspections, maintenance, recommended_maintenance, crashes, value, reports, integrations

**Key Permissions:**
- Create/update vehicles
- Assign drivers
- View financial data (value panel)
- Manage crashes and incidents
- Generate reports

---

### 3. MaintenanceManager
**Maintenance operations manager**

- Manages maintenance schedules and work orders
- Oversees technicians and repairs
- Access to maintenance costs and vendor data
- Limited to maintenance operations

**Module Access:** vehicles, garage, inspections, maintenance, recommended_maintenance, reports, integrations

**Key Permissions:**
- Create/edit maintenance records
- Close work orders
- View maintenance costs
- Manage inspections

---

### 4. Inspector
**Field inspection technician**

- Conducts vehicle inspections
- Creates and edits damage pins
- Limited to own inspections or assigned depot
- No financial access

**Module Access:** vehicles, garage, inspections, maintenance, recommended_maintenance, reports, integrations

**Key Permissions:**
- Create inspections
- Edit own damage pins
- Add manual damage annotations
- View assigned vehicles

**Conditions:**
- Can only edit inspections they created
- Access limited to assigned depot

---

### 5. Driver
**Vehicle operator**

- Self-service access to assigned vehicle(s)
- View-only for most data
- Can log fuel transactions
- Limited scope to own records

**Module Access:** vehicles, garage, maintenance, recommended_maintenance

**Key Permissions:**
- View assigned vehicle
- View maintenance records
- Log fuel transactions
- View upcoming maintenance

**Conditions:**
- Can only see assigned vehicles
- No edit capabilities
- No financial data access

---

### 6. Finance
**Financial officer**

- Access to all cost and valuation data
- Can set purchase prices and override market values
- No operational permissions
- Cannot modify vehicle or maintenance records

**Module Access:** vehicles, garage, value, reports

**Key Permissions:**
- View all financial data
- Set purchase prices
- Override market values
- View depreciation charts
- Generate financial reports

**Restricted:**
- Cannot edit vehicle information
- Cannot manage maintenance
- Cannot create inspections

---

### 7. Safety
**Safety and compliance officer**

- Full access to crash and incident data
- Manages safety events and OSHA compliance
- Can view sensitive safety information
- Auto-approve damage detections

**Module Access:** vehicles, garage, inspections, crashes, reports, integrations

**Key Permissions:**
- Create/edit crash reports
- View police reports and injury notes
- Auto-approve damage detections
- View crash details panel in garage
- Generate safety reports

---

### 8. Auditor
**Compliance auditor (read-only)**

- Read-only access to most modules
- Cannot modify any data
- Full visibility for compliance review
- Access to audit logs

**Module Access:** vehicles, garage, inspections, maintenance, recommended_maintenance, crashes, value, reports, integrations

**Key Permissions:**
- View all data (read-only)
- View crash history and summaries
- Generate compliance reports
- View audit logs

**Restricted:**
- No create/update/delete operations
- Cannot approve or modify anything

---

### 9. Vendor
**External service provider**

- Limited to assigned work orders
- Can close assigned work orders
- View only assigned inspections
- No access to financial or crash data

**Module Access:** vehicles, garage, inspections, maintenance, reports

**Key Permissions:**
- View assigned inspections
- Close assigned work orders
- View vehicle details for assigned work

**Conditions:**
- Only see inspections/work assigned to them
- Inspector name anonymized
- No financial data access

---

## Module Access Matrix

| Module | Admin | FleetMgr | MaintMgr | Inspector | Driver | Finance | Safety | Auditor | Vendor |
|--------|-------|----------|----------|-----------|--------|---------|--------|---------|--------|
| Vehicles | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Garage | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inspections | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Maintenance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recommended Maintenance | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Crashes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Value | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Integrations | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Action Permissions

### Vehicle Actions

| Action | Roles |
|--------|-------|
| `vehicle.read` | All roles |
| `vehicle.create` | Admin, FleetManager |
| `vehicle.update` | Admin, FleetManager |
| `vehicle.assignDriver` | Admin, FleetManager |
| `vehicle.archive` | Admin |

### Garage Actions

| Action | Roles |
|--------|-------|
| `garage.view` | All roles (with conditions) |
| `garage.toggleValuePanel` | Admin, Finance, FleetManager |
| `scan.create` | Admin, FleetManager, MaintenanceManager, Inspector |
| `scan.delete` | Admin |

### Damage Actions

| Action | Roles | Conditions |
|--------|-------|------------|
| `damage.edit` | Admin, FleetManager, Inspector | Inspector: own inspections only |
| `damage.addManual` | Admin, FleetManager, Inspector | - |
| `damage.autoApprove` | Admin, FleetManager, Safety | - |
| `damage.export` | Admin, FleetManager, Safety, Auditor | - |

### Maintenance Actions

| Action | Roles | Conditions |
|--------|-------|------------|
| `maint.read` | All roles | Org-scoped |
| `maint.addRecord` | Admin, MaintenanceManager | - |
| `maint.editRecord` | Admin, MaintenanceManager | - |
| `maint.closeWorkOrder` | Admin, MaintenanceManager, Vendor | Vendor: assigned only |

### Crash Actions

| Action | Roles |
|--------|-------|
| `crash.read` | Admin, FleetManager, Safety, Auditor |
| `crash.create` | Admin, FleetManager, Safety |
| `crash.edit` | Admin, Safety |

### Value Actions

| Action | Roles |
|--------|-------|
| `value.read` | Admin, Finance, FleetManager |
| `value.setPurchase` | Admin, Finance |
| `value.overrideMarket` | Admin, Finance |

## Field-Level Redaction

### Vehicle Fields

| Field | Visible To | Redacted For Others |
|-------|------------|---------------------|
| Basic info (make, model, year, VIN) | All | - |
| `purchase_price` | Admin, Finance | ✅ |
| `current_value` | Admin, Finance | ✅ |
| `depreciation_data` | Admin, Finance | ✅ |
| `crash_history` | Admin, FleetManager, Safety, Auditor | ✅ |
| `crash_claim_number` | Admin, Safety | ✅ |
| `police_report` | Admin, Safety | ✅ |
| `injury_notes` | Admin, Safety | ✅ |

### Garage HUD Fields

| Field | Visible To | Behavior |
|-------|------------|----------|
| Health metrics (oil, brakes, tires) | All | Always visible |
| `purchase_price` | Admin, Finance | Redacted |
| `current_value` | Admin, Finance | Redacted |
| `depreciation_chart` | Admin, Finance | Redacted |
| `crash_details_panel` | Admin, FleetManager, Safety | Hidden |
| `maintenance_costs` | Admin, Finance, MaintenanceManager | Summary for FleetManager/Auditor |
| `labor_rates` | Admin, MaintenanceManager | Redacted |
| `vendor_contract_rates` | Admin, MaintenanceManager | Redacted |

### Maintenance Fields

| Field | Visible To | Behavior |
|-------|------------|----------|
| Basic info (date, description, status) | All | Always visible |
| `cost` | Admin, Finance, MaintenanceManager | Summary for FleetManager/Auditor |
| `labor_hours` | Admin, MaintenanceManager | Redacted |
| `labor_rate` | Admin, MaintenanceManager | Redacted |
| `parts_cost` | Admin, Finance, MaintenanceManager | Redacted |
| `vendor_invoice` | Admin, Finance, MaintenanceManager | Redacted |

### Inspection Fields

| Field | Visible To | Behavior |
|-------|------------|----------|
| Basic info (date, status, damage count) | All | Always visible |
| `inspector_name` | Admin, FleetManager, MaintenanceManager, Safety, Auditor | Redacted for Driver, Anonymized for Vendor |
| `ai_confidence_scores` | Admin, FleetManager, Inspector | Redacted |
| `manual_overrides` | Admin, FleetManager, Safety | Redacted |

## Conditions

Conditions provide context-aware authorization beyond simple role checks.

### Organization Scope
```
vehicle.org_id == user.org_id
```
User can only access vehicles in their organization.

### Assigned User
```
inspection.created_by == user.id
```
Inspectors can only edit their own inspections.

### Work Order Assignment
```
workorder.assigned_to == user.id
```
Vendors can only close work orders assigned to them.

### Role-Based Conditions
```
user.role IN ['Admin', 'MaintenanceManager']
```
Action requires one of multiple roles.

## Usage Examples

### Backend

#### Protect a Route
```typescript
import { requireModule, requireAction } from '../middleware/modulePermissions';

// Require module access
router.get('/vehicles', requireModule('vehicles'), async (req, res) => {
  // Handler
});

// Require specific action
router.post('/vehicles', requireAction('vehicle.create'), async (req, res) => {
  // Handler
});

// Require role
router.get('/admin/settings', requireAdmin, async (req, res) => {
  // Handler
});
```

#### Check Permission in Code
```typescript
import { permissionEngine } from '../permissions/engine';

const result = await permissionEngine.can(user, 'damage.edit', inspection);

if (!result.allowed) {
  return res.status(403).json({ error: result.reason });
}
```

#### Apply Field Redaction
```typescript
import { filterResponse } from '../middleware/modulePermissions';

router.get('/vehicles/:id', filterResponse('vehicle'), async (req, res) => {
  const vehicle = await getVehicle(req.params.id);
  res.json(vehicle); // Automatically filtered based on user role
});
```

### Frontend

#### Protect a Route
```tsx
import { RouteGuard, AdminRoute } from '../components/guards/RouteGuard';

<Route path="/admin" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />

<Route path="/vehicles" element={
  <RouteGuard module="vehicles">
    <VehicleList />
  </RouteGuard>
} />
```

#### Conditional UI
```tsx
import { PermissionGate, FinanceGate } from '../components/guards/PermissionGate';

<PermissionGate action="vehicle.create">
  <Button onClick={createVehicle}>Add Vehicle</Button>
</PermissionGate>

<FinanceGate>
  <ValuePanel vehicle={vehicle} />
</FinanceGate>
```

#### Use Permission Hook
```tsx
import { usePermissions } from '../hooks/usePermissions';

function VehicleDetails() {
  const { can, hasModule, canAccessField } = usePermissions();

  return (
    <div>
      {can('vehicle.update') && <EditButton />}
      {canAccessField('vehicle', 'purchase_price') && (
        <div>Purchase Price: ${vehicle.purchase_price}</div>
      )}
    </div>
  );
}
```

## Adding New Roles or Permissions

### 1. Add Role to Database
```sql
INSERT INTO module_roles (name, description, is_system)
VALUES ('CustomRole', 'Custom role description', false);
```

### 2. Update Config Files

**modules.json:**
```json
{
  "module_name": {
    "name": "Module Display Name",
    "description": "Module description",
    "roles": ["Admin", "CustomRole"]
  }
}
```

**actions.json:**
```json
{
  "action.name": {
    "description": "Action description",
    "roles": ["Admin", "CustomRole"],
    "conditions": ["resource.org_id == user.org_id"]
  }
}
```

**fields.json:**
```json
{
  "resource_type": {
    "sensitive_field": {
      "roles": ["Admin", "CustomRole"],
      "redact_for_others": true
    }
  }
}
```

### 3. Update TypeScript Types

**api/src/permissions/types.ts:**
```typescript
export type UserRole = 'Admin' | 'FleetManager' | ... | 'CustomRole';
```

**src/hooks/usePermissions.ts:**
```typescript
export type UserRole = 'Admin' | 'FleetManager' | ... | 'CustomRole';
```

### 4. Restart Application
The permission engine loads config on startup.

## Security Best Practices

1. **Never rely on frontend-only checks** - Always enforce on backend
2. **Use parameterized queries** - Never string concatenation in SQL
3. **Log all permission checks** - Audit trail is critical
4. **Return 403 with minimal info** - Don't leak resource existence
5. **Apply defense in depth** - Multiple layers of checks
6. **Validate all inputs** - Whitelist approach
7. **Least privilege principle** - Start restrictive, expand as needed

## Testing

See test files:
- `api/src/permissions/__tests__/engine.test.ts`
- `api/src/permissions/__tests__/middleware.test.ts`
- `src/__tests__/permissions/usePermissions.test.tsx`

## Audit Log Queries

### Failed Permission Attempts
```sql
SELECT * FROM permission_audit_log
WHERE allowed = false
ORDER BY timestamp DESC
LIMIT 100;
```

### User Activity
```sql
SELECT action, COUNT(*) as count
FROM permission_audit_log
WHERE user_id = 'USER_ID'
GROUP BY action
ORDER BY count DESC;
```

### Resource Access Summary
```sql
SELECT * FROM get_resource_audit_summary('vehicle', 'VEHICLE_ID');
```

## Troubleshooting

### Permission Denied Unexpectedly

1. Check user's roles:
```sql
SELECT * FROM user_module_roles WHERE user_id = 'USER_ID' AND is_active = true;
```

2. Check audit log:
```sql
SELECT * FROM permission_audit_log WHERE user_id = 'USER_ID' ORDER BY timestamp DESC LIMIT 10;
```

3. Verify config files are loaded correctly

### Field Not Redacted

1. Check field config in `fields.json`
2. Verify `filterResponse` middleware is applied to route
3. Check user's roles in permission context

### Module Not Visible

1. Check `modules.json` includes user's role
2. Verify permission endpoint returns correct modules
3. Check frontend permission context is loaded

## Support

For questions or issues with the RBAC system:
- Check this README
- Review config files in `api/src/permissions/config/`
- Check audit logs for permission denials
- Review test files for usage examples
