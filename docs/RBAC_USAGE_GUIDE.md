# RBAC System Usage Guide

Complete guide for implementing Role-Based Access Control in the Fleet Management System.

## Table of Contents

1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Common Patterns](#common-patterns)
6. [Testing](#testing)
7. [Compliance](#compliance)

## Overview

The Fleet RBAC system provides:
- **12 hierarchical roles** from super-admin to viewer
- **80+ fine-grained permissions** across all resources
- **Attribute-Based Access Control (ABAC)** for advanced scenarios
- **FedRAMP-compliant audit logging**
- **Row-level security** with dataset size limits

### Architecture

```
┌─────────────────────┐      ┌──────────────────────┐
│   Frontend (React)  │◄────►│  Backend (Express)   │
│                     │      │                      │
│  • PermissionGate   │      │  • requirePermission │
│  • RouteGuard       │      │  • validateScope     │
│  • usePermissions   │      │  • authenticate JWT  │
└─────────────────────┘      └──────────────────────┘
         │                              │
         ▼                              ▼
   src/lib/security/rbac.ts    api/src/middleware/permissions.ts
```

## Role Hierarchy

### Hierarchy Tree

```
super-admin (Platform)
    ├── admin (Tenant)
    │   ├── manager (Fleet Operations)
    │   │   ├── supervisor (Team Lead)
    │   │   │   ├── dispatcher
    │   │   │   ├── mechanic
    │   │   │   └── technician
    │   │   └── driver
    │   ├── safety-officer (Compliance)
    │   ├── analyst (Reporting)
    │   └── auditor (Read-only)
    └── viewer (Basic Read)
```

### Role Capabilities

| Role | Scope | Dataset Limit | Key Permissions |
|------|-------|---------------|-----------------|
| super-admin | Platform | ∞ | All system operations, multi-tenant |
| admin | Tenant | ∞ | All tenant operations, user management |
| manager | Fleet | 10,000 | Create/approve work orders, manage vehicles |
| supervisor | Team | 5,000 | Assign vehicles, schedule maintenance |
| dispatcher | Team | 5,000 | Dispatch vehicles, communicate |
| mechanic | Own | 1,000 | Complete work orders, order parts |
| technician | Own | 500 | Field work, basic reporting |
| driver | Own | 100 | View own vehicle, report issues |
| safety-officer | Fleet | 10,000 | OSHA compliance, video access |
| analyst | Fleet | 50,000 | Generate reports, export data |
| auditor | Fleet | 50,000 | Read-only access to all data |
| viewer | Basic | 1,000 | Read-only basic information |

## Frontend Implementation

### 1. Permission Context Setup

Wrap your app with `PermissionProvider`:

```typescript
// src/App.tsx
import { PermissionProvider } from '@/contexts/PermissionContext'

function App() {
  return (
    <PermissionProvider>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </PermissionProvider>
  )
}
```

### 2. Using Permission Hooks

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function VehicleList() {
  const { can, isAdmin, isLoading } = usePermissions()

  if (isLoading) return <Spinner />

  return (
    <div>
      <h1>Vehicles</h1>

      {/* Conditional rendering */}
      {can('vehicles.create') && (
        <Button onClick={createVehicle}>Create Vehicle</Button>
      )}

      {/* Admin-only section */}
      {isAdmin && (
        <AdminPanel />
      )}
    </div>
  )
}
```

### 3. Permission Gates (UI Components)

```typescript
import { PermissionGate, ActionGate, RoleGate } from '@/components/guards/PermissionGate'

function VehicleActions({ vehicle }) {
  return (
    <div>
      {/* Hide button if no permission */}
      <ActionGate action="vehicles.edit" hideIfDenied>
        <Button>Edit</Button>
      </ActionGate>

      {/* Show disabled with tooltip */}
      <PermissionGate
        action="vehicles.delete"
        showTooltip
        tooltipMessage="Only administrators can delete vehicles"
      >
        <Button variant="destructive">Delete</Button>
      </PermissionGate>

      {/* Role-based gate */}
      <RoleGate role={['Admin', 'FleetManager']} hideIfDenied>
        <Button>Assign Vehicle</Button>
      </RoleGate>

      {/* Field-level gate */}
      <FieldGate resourceType="vehicle" fieldName="purchase_price">
        <div className="text-sm text-gray-600">
          Purchase Price: ${vehicle.purchase_price}
        </div>
      </FieldGate>
    </div>
  )
}
```

### 4. Route Guards

```typescript
import { RouteGuard, AdminRoute, ManagerRoute } from '@/components/guards/RouteGuard'

function AppRoutes() {
  return (
    <Routes>
      {/* Module-based protection */}
      <Route path="/fleet" element={
        <RouteGuard module="fleet-management">
          <FleetDashboard />
        </RouteGuard>
      } />

      {/* Role-based protection */}
      <Route path="/admin" element={
        <AdminRoute fallbackPath="/403">
          <AdminDashboard />
        </AdminRoute>
      } />

      {/* Permission-based protection */}
      <Route path="/vehicles/new" element={
        <RouteGuard requiredAction="vehicles.create">
          <CreateVehicle />
        </RouteGuard>
      } />

      {/* Manager or above */}
      <Route path="/work-orders/approve" element={
        <ManagerRoute>
          <ApproveWorkOrders />
        </ManagerRoute>
      } />
    </Routes>
  )
}
```

## Backend Implementation

### 1. Authentication Middleware

```typescript
import { authenticateJWT, authorize } from './middleware/auth'
import { requirePermission, validateScope } from './middleware/permissions'

// Apply to all protected routes
router.use(authenticateJWT)
```

### 2. Role-Based Authorization

```typescript
// Simple role check
router.post('/vehicles',
  authorize('admin', 'manager'),
  createVehicle
)

router.delete('/vehicles/:id',
  authorize('admin'),
  deleteVehicle
)
```

### 3. Permission-Based Authorization

```typescript
import { requirePermission } from './middleware/permissions'

// Check specific permission
router.post('/work-orders',
  requirePermission('work_order:create:team'),
  createWorkOrder
)

router.put('/work-orders/:id/approve',
  requirePermission('work_order:approve:fleet'),
  approveWorkOrder
)
```

### 4. Resource Scope Validation

```typescript
import { validateScope } from './middleware/permissions'

// Ensure user can only access their own data
router.get('/vehicles/:id',
  validateScope('vehicle'),
  getVehicle
)

router.put('/work-orders/:id',
  validateScope('work_order'),
  updateWorkOrder
)
```

### 5. Separation of Duties (SoD)

```typescript
import { preventSelfApproval, checkApprovalLimit } from './middleware/permissions'

// Prevent users from approving their own work orders
router.put('/work-orders/:id/approve',
  requirePermission('work_order:approve'),
  preventSelfApproval('created_by'),
  approveWorkOrder
)

// Check financial approval limits
router.put('/purchase-orders/:id/approve',
  requirePermission('purchase_order:approve'),
  preventSelfApproval('created_by'),
  checkApprovalLimit(),
  approvePurchaseOrder
)
```

## Common Patterns

### Pattern 1: Create-Edit-Delete Flow

```typescript
// Frontend
function VehicleCard({ vehicle }) {
  const { can } = usePermissions()

  return (
    <Card>
      <h2>{vehicle.name}</h2>

      {can('vehicles.edit') && (
        <Button onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}>
          Edit
        </Button>
      )}

      {can('vehicles.delete') && (
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      )}
    </Card>
  )
}

// Backend
router.get('/vehicles',
  authenticateJWT,
  listVehicles
)

router.get('/vehicles/:id',
  authenticateJWT,
  validateScope('vehicle'),
  getVehicle
)

router.post('/vehicles',
  authenticateJWT,
  requirePermission('vehicles:create'),
  createVehicle
)

router.put('/vehicles/:id',
  authenticateJWT,
  validateScope('vehicle'),
  requirePermission('vehicles:edit'),
  updateVehicle
)

router.delete('/vehicles/:id',
  authenticateJWT,
  validateScope('vehicle'),
  requirePermission('vehicles:delete'),
  deleteVehicle
)
```

### Pattern 2: Approval Workflow

```typescript
// Backend - Work Order Approval
router.put('/work-orders/:id/approve',
  authenticateJWT,
  validateScope('work_order'),
  requirePermission('work_order:approve'),
  preventSelfApproval('created_by'), // SoD check
  async (req, res) => {
    const workOrder = await db.workOrders.findById(req.params.id)

    // Update status
    workOrder.status = 'approved'
    workOrder.approved_by = req.user.id
    workOrder.approved_at = new Date()

    await workOrder.save()

    // Audit log
    await logPermissionCheck({
      userId: req.user.id,
      tenantId: req.user.tenant_id,
      permission: 'work_order:approve',
      resource: `work-order-${req.params.id}`,
      action: 'APPROVE',
      granted: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json(workOrder)
  }
)
```

### Pattern 3: Field-Level Security

```typescript
// Frontend
import { FieldGate } from '@/components/guards/PermissionGate'

function VehicleDetails({ vehicle }) {
  return (
    <div>
      {/* Always visible */}
      <div>VIN: {vehicle.vin}</div>
      <div>Make: {vehicle.make}</div>
      <div>Model: {vehicle.model}</div>

      {/* Finance-only fields */}
      <FieldGate resourceType="vehicle" fieldName="purchase_price">
        <div>Purchase Price: ${vehicle.purchase_price}</div>
      </FieldGate>

      <FieldGate resourceType="vehicle" fieldName="current_value">
        <div>Current Value: ${vehicle.current_value}</div>
      </FieldGate>

      {/* Safety-only fields */}
      <FieldGate resourceType="vehicle" fieldName="crash_history">
        <CrashHistory crashes={vehicle.crashes} />
      </FieldGate>
    </div>
  )
}
```

## Testing

### Unit Tests

```typescript
import { hasPermission, getRolePermissions } from '@/lib/security/rbac'

describe('RBAC', () => {
  test('manager has vehicle.create permission', () => {
    const perms = getRolePermissions('manager')
    expect(perms).toContain('vehicles.create')
  })

  test('driver cannot delete vehicles', () => {
    const perms = getRolePermissions('driver')
    expect(perms).not.toContain('vehicles.delete')
  })

  test('super-admin bypasses all checks', () => {
    const result = hasPermission('super-admin', [], 'vehicles.delete')
    expect(result).toBe(true)
  })
})
```

### Integration Tests

```typescript
import request from 'supertest'
import app from '../app'

describe('Vehicle API Authorization', () => {
  test('manager can create vehicle', async () => {
    const token = generateToken({ role: 'manager' })

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Ford', model: 'F-150' })

    expect(res.status).toBe(201)
  })

  test('driver cannot delete vehicle', async () => {
    const token = generateToken({ role: 'driver' })

    const res = await request(app)
      .delete('/api/vehicles/123')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
```

## Compliance

### FedRAMP Requirements

| Control | Implementation |
|---------|----------------|
| AC-2 Account Management | Role definitions, user-role assignments |
| AC-3 Access Enforcement | Permission middleware, route guards |
| AC-6 Least Privilege | Hierarchical roles, minimal permissions |
| AU-2 Audit Events | `logPermissionCheck()` for all decisions |
| AU-3 Audit Content | User ID, timestamp, action, result, reason |
| AU-12 Audit Generation | Automatic logging in middleware |

### Audit Log Query Examples

```sql
-- View all denied permissions in last 24 hours
SELECT * FROM permission_check_logs
WHERE granted = false
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Track user activity
SELECT permission_name, COUNT(*) as count, granted
FROM permission_check_logs
WHERE user_id = 'user-123'
GROUP BY permission_name, granted;

-- Identify privilege escalation attempts
SELECT user_id, permission_name, COUNT(*) as attempts
FROM permission_check_logs
WHERE granted = false
AND permission_name LIKE '%admin%'
GROUP BY user_id, permission_name
HAVING COUNT(*) > 5;
```

## Best Practices

1. **Always check permissions on both frontend and backend**
   - Frontend: For UI/UX (hide buttons, disable features)
   - Backend: For security enforcement (actual authorization)

2. **Use least privilege principle**
   - Grant minimum permissions needed for role
   - Review role permissions quarterly

3. **Implement Separation of Duties (SoD)**
   - Users cannot approve their own submissions
   - Critical actions require two-person approval

4. **Log all permission decisions**
   - Required for compliance audits
   - Helps investigate security incidents

5. **Test permission boundaries**
   - Test with each role
   - Test permission denial paths
   - Test edge cases (expired tokens, revoked permissions)

6. **Use specific permissions over broad roles**
   ```typescript
   // Good
   if (hasPermission(userRole, userPerms, 'vehicles.delete')) {
     // Allow deletion
   }

   // Bad - too broad
   if (userRole === 'admin') {
     // Allow deletion
   }
   ```

## Troubleshooting

### Issue: Permission denied but user should have access

1. Check user's role assignment in database
2. Verify role has the required permission in `ROLE_DEFINITIONS`
3. Check if permission is spelled correctly
4. Review audit logs for denial reason

### Issue: Route guard redirecting when it shouldn't

1. Ensure `PermissionProvider` wraps the entire app
2. Check if permissions are loaded (`isLoading` flag)
3. Verify JWT token is valid and not expired
4. Check browser console for API errors

### Issue: Backend returns 403 but frontend shows button

1. Frontend permissions are out of sync with backend
2. User's role was changed but token not refreshed
3. Permission cache needs to be cleared

## Additional Resources

- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [NIST ABAC Guide](https://csrc.nist.gov/projects/abac)
- [FedRAMP Access Control Requirements](https://www.fedramp.gov/assets/resources/documents/Agency_Authorization_Playbook.pdf)
- Source Files:
  - `src/lib/security/rbac.ts` - Role/Permission definitions
  - `src/hooks/usePermissions.ts` - React permission hooks
  - `src/contexts/PermissionContext.tsx` - Permission context
  - `src/components/guards/PermissionGate.tsx` - UI permission gates
  - `src/components/guards/RouteGuard.tsx` - Route guards
  - `api/src/middleware/auth.ts` - JWT authentication
  - `api/src/middleware/permissions.ts` - Permission enforcement
