# Fleet Role-Based Access Control (RBAC)

Complete documentation for the Role-Based Access Control system in Fleet Management Platform.

## Table of Contents

- [Overview](#overview)
- [Role Hierarchy](#role-hierarchy)
- [Permissions System](#permissions-system)
- [Implementation Guide](#implementation-guide)
- [UI Components](#ui-components)
- [API Protection](#api-protection)
- [Testing](#testing)

## Overview

Fleet implements a comprehensive RBAC system with:

- **5 distinct roles** with hierarchical inheritance
- **50+ granular permissions** across all modules
- **UI-level rendering control** based on permissions
- **API-level enforcement** for all endpoints
- **Audit logging** for permission checks
- **Default permission sets** per role

## Role Hierarchy

Roles are hierarchical - higher roles inherit permissions from lower roles.

```
SuperAdmin (Level 5)
    │
    ├─► Admin (Level 4)
    │       │
    │       ├─► Manager (Level 3)
    │       │       │
    │       │       ├─► User (Level 2)
    │       │       │       │
    │       │       │       └─► ReadOnly (Level 1)
```

### SuperAdmin

**Full system access** - Can do everything including:

- Switch between tenants
- Access system administration
- Manage all users and settings
- Override any restriction

**Default Permissions:** `['*']` (wildcard - all permissions)

**Use Cases:**
- Platform administrators
- Support engineers
- System maintenance

### Admin

**Organizational management** - Can manage the organization but not system-level features:

- Create/update/delete vehicles, drivers, work orders
- Manage users within their tenant
- Access all reports and analytics
- Configure organizational settings

**Default Permissions:**
```javascript
[
  'vehicles:*',
  'drivers:*',
  'maintenance:*',
  'fuel:*',
  'work-orders:*',
  'procurement:*',
  'reports:*',
  'users:read',
  'users:create',
  'users:update',
  'settings:*',
  'system:audit'
]
```

**Use Cases:**
- Fleet managers
- Department heads
- Operations managers

### Manager

**Operational management** - Can approve and manage day-to-day operations:

- View and update vehicles
- Approve maintenance requests
- Manage work orders
- Create procurement requests
- Generate reports

**Default Permissions:**
```javascript
[
  'vehicles:read',
  'vehicles:update',
  'drivers:read',
  'drivers:update',
  'maintenance:read',
  'maintenance:create',
  'maintenance:update',
  'maintenance:approve',
  'fuel:read',
  'fuel:create',
  'fuel:update',
  'work-orders:read',
  'work-orders:create',
  'work-orders:update',
  'work-orders:approve',
  'procurement:read',
  'procurement:create',
  'reports:read',
  'reports:create',
  'reports:export',
  'settings:read'
]
```

**Use Cases:**
- Team leads
- Supervisors
- Project managers

### User

**Standard access** - Can perform basic operations:

- View fleet data
- Create maintenance requests
- Log fuel transactions
- Create work orders
- View reports

**Default Permissions:**
```javascript
[
  'vehicles:read',
  'drivers:read',
  'maintenance:read',
  'maintenance:create',
  'fuel:read',
  'fuel:create',
  'work-orders:read',
  'work-orders:create',
  'procurement:read',
  'reports:read'
]
```

**Use Cases:**
- Drivers
- Technicians
- Field staff

### ReadOnly

**View-only access** - Can only view data, no modifications:

- View all fleet data
- View reports
- No create/update/delete capabilities

**Default Permissions:**
```javascript
[
  'vehicles:read',
  'drivers:read',
  'maintenance:read',
  'fuel:read',
  'work-orders:read',
  'procurement:read',
  'reports:read'
]
```

**Use Cases:**
- Auditors
- Stakeholders
- External viewers

## Permissions System

### Permission Format

Permissions follow the format: `resource:action`

**Examples:**
- `vehicles:read` - View vehicles
- `vehicles:create` - Create vehicles
- `vehicles:update` - Update vehicles
- `vehicles:delete` - Delete vehicles
- `vehicles:*` - All vehicle operations

### Permission Categories

#### Vehicle Management
```javascript
'vehicles:read'    // View vehicles
'vehicles:create'  // Create new vehicles
'vehicles:update'  // Update vehicle details
'vehicles:delete'  // Delete vehicles
'vehicles:*'       // All vehicle operations
```

#### Driver Management
```javascript
'drivers:read'
'drivers:create'
'drivers:update'
'drivers:delete'
'drivers:*'
```

#### Maintenance
```javascript
'maintenance:read'
'maintenance:create'
'maintenance:update'
'maintenance:delete'
'maintenance:approve'  // Approve maintenance requests
'maintenance:*'
```

#### Fuel Management
```javascript
'fuel:read'
'fuel:create'
'fuel:update'
'fuel:delete'
'fuel:*'
```

#### Work Orders
```javascript
'work-orders:read'
'work-orders:create'
'work-orders:update'
'work-orders:delete'
'work-orders:approve'
'work-orders:*'
```

#### Procurement
```javascript
'procurement:read'
'procurement:create'
'procurement:update'
'procurement:approve'
'procurement:*'
```

#### Reports
```javascript
'reports:read'
'reports:create'
'reports:export'
'reports:*'
```

#### User Management
```javascript
'users:read'
'users:create'
'users:update'
'users:delete'
'users:*'
```

#### Tenant Management (SuperAdmin only)
```javascript
'tenants:read'
'tenants:create'
'tenants:update'
'tenants:delete'
'tenants:switch'
'tenants:*'
```

#### System Administration
```javascript
'system:admin'   // Full system access
'system:audit'   // View audit logs
'system:*'       // All system operations
```

### Wildcard Permissions

**Resource Wildcard:**
```javascript
'vehicles:*'  // All operations on vehicles
```

**Global Wildcard:**
```javascript
'*'  // All permissions (SuperAdmin only)
```

## Implementation Guide

### Frontend RBAC

#### Check User Role

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { hasRole, isRole, isSuperAdmin } = useAuth();

  // Check for specific role
  if (hasRole('Admin')) {
    // User has Admin role or higher
  }

  // Check for multiple roles
  if (hasRole(['Manager', 'Admin', 'SuperAdmin'])) {
    // User has one of these roles
  }

  // Check exact role
  if (isRole('Manager')) {
    // User is exactly a Manager
  }

  // Check SuperAdmin
  if (isSuperAdmin()) {
    // User is SuperAdmin
  }
}
```

#### Check Permissions

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { hasPermission, canAccess } = useAuth();

  // Check single permission
  if (hasPermission('vehicles:delete')) {
    // User can delete vehicles
  }

  // Check multiple permissions (OR logic)
  if (hasPermission(['vehicles:update', 'vehicles:delete'])) {
    // User has at least one of these permissions
  }

  // Check role AND permission
  if (canAccess('Admin', 'vehicles:delete')) {
    // User must be Admin AND have delete permission
  }
}
```

#### useRBAC Hook

```typescript
import { useRBAC } from '@/components/auth/RBACGuard';

function MyComponent() {
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canApprove,
    isAdmin,
    isManager,
    isReadOnly,
    isSuperAdmin,
  } = useRBAC();

  return (
    <div>
      {canCreate('vehicles') && (
        <Button>Create Vehicle</Button>
      )}

      {canUpdate('vehicles') && (
        <Button>Edit Vehicle</Button>
      )}

      {canDelete('vehicles') && (
        <Button>Delete Vehicle</Button>
      )}

      {canApprove('maintenance') && (
        <Button>Approve Request</Button>
      )}
    </div>
  );
}
```

## UI Components

### RBACGuard

Conditionally render UI based on roles/permissions.

```typescript
import { RBACGuard } from '@/components/auth/RBACGuard';

// Show only for Admin
<RBACGuard requireRole="Admin">
  <AdminPanel />
</RBACGuard>

// Show only for users with delete permission
<RBACGuard requirePermission="vehicles:delete">
  <DeleteButton />
</RBACGuard>

// Show for multiple roles
<RBACGuard requireRole={['Manager', 'Admin', 'SuperAdmin']}>
  <ApprovalButton />
</RBACGuard>

// With fallback
<RBACGuard
  requireRole="Admin"
  fallback={<p>Admin access required</p>}
>
  <AdminContent />
</RBACGuard>

// Require both role AND permission
<RBACGuard
  requireRole="Manager"
  requirePermission="maintenance:approve"
  requireBoth={true}
>
  <ApproveButton />
</RBACGuard>
```

### Convenience Components

```typescript
import {
  SuperAdminOnly,
  AdminOnly,
  ManagerOnly,
  NotReadOnly,
  ReadOnlyOnly,
  ShowForRole,
  ShowForPermission,
  HideForRole,
  CanCreate,
  CanUpdate,
  CanDelete,
  CanApprove,
} from '@/components/auth/RBACGuard';

// SuperAdmin only
<SuperAdminOnly>
  <TenantSwitcher />
</SuperAdminOnly>

// Admin or SuperAdmin
<AdminOnly>
  <UserManagement />
</AdminOnly>

// Manager, Admin, or SuperAdmin
<ManagerOnly>
  <ApprovalQueue />
</ManagerOnly>

// All except ReadOnly
<NotReadOnly>
  <EditButton />
</NotReadOnly>

// Show for specific role
<ShowForRole role="Manager">
  <ManagerDashboard />
</ShowForRole>

// Show for permission
<ShowForPermission permission="vehicles:delete">
  <DeleteButton />
</ShowForPermission>

// Hide for specific role
<HideForRole role="ReadOnly">
  <CreateButton />
</HideForRole>

// Permission-based shortcuts
<CanCreate resource="vehicles">
  <CreateVehicleButton />
</CanCreate>

<CanUpdate resource="vehicles">
  <EditVehicleButton />
</CanUpdate>

<CanDelete resource="vehicles">
  <DeleteVehicleButton />
</CanDelete>

<CanApprove resource="maintenance">
  <ApproveButton />
</CanApprove>
```

### Protected Routes

```typescript
import {
  ProtectedRoute,
  AdminRoute,
  SuperAdminRoute,
  ManagerRoute,
  NoReadOnlyRoute,
} from '@/components/auth/ProtectedRoute';

// Require authentication
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Require Admin role
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminPanel />
    </AdminRoute>
  }
/>

// Require SuperAdmin role
<Route
  path="/system"
  element={
    <SuperAdminRoute>
      <SystemAdmin />
    </SuperAdminRoute>
  }
/>

// Require Manager or higher
<Route
  path="/approvals"
  element={
    <ManagerRoute>
      <ApprovalQueue />
    </ManagerRoute>
  }
/>

// Block ReadOnly users
<Route
  path="/edit"
  element={
    <NoReadOnlyRoute>
      <EditPage />
    </NoReadOnlyRoute>
  }
/>

// Custom requirements
<Route
  path="/delete-vehicles"
  element={
    <ProtectedRoute
      requireRole="Admin"
      requirePermission="vehicles:delete"
      showAccessDenied={true}
    >
      <DeleteVehiclesPage />
    </ProtectedRoute>
  }
/>
```

## API Protection

### Backend Middleware

```javascript
// api/src/middleware/rbac.ts
import { checkAccess } from '../middleware/rbac';

// In route handler
router.delete('/vehicles/:id', authenticateJWT, async (req, res) => {
  const access = checkAccess({
    userId: req.user.id,
    userRole: req.user.role,
    userPermissions: req.user.permissions,
    requiredPermission: 'vehicles:delete',
    resource: 'vehicle',
    action: 'delete',
  });

  if (!access.granted) {
    return res.status(403).json({
      error: 'Access denied',
      reason: access.reason,
    });
  }

  // Proceed with delete
  // ...
});
```

### Permission Middleware Factory

```javascript
// api/src/middleware/rbac.ts

function requirePermission(permission) {
  return (req, res, next) => {
    const access = checkAccess({
      userId: req.user.id,
      userRole: req.user.role,
      userPermissions: req.user.permissions,
      requiredPermission: permission,
    });

    if (!access.granted) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
      });
    }

    next();
  };
}

function requireRole(role) {
  return (req, res, next) => {
    const access = checkAccess({
      userId: req.user.id,
      userRole: req.user.role,
      userPermissions: req.user.permissions,
      requiredRole: role,
    });

    if (!access.granted) {
      return res.status(403).json({
        error: 'Insufficient role',
        required: role,
      });
    }

    next();
  };
}

// Usage
router.get('/vehicles', authenticateJWT, requirePermission('vehicles:read'), getVehicles);
router.post('/vehicles', authenticateJWT, requirePermission('vehicles:create'), createVehicle);
router.put('/vehicles/:id', authenticateJWT, requirePermission('vehicles:update'), updateVehicle);
router.delete('/vehicles/:id', authenticateJWT, requirePermission('vehicles:delete'), deleteVehicle);

router.get('/admin/users', authenticateJWT, requireRole('Admin'), getUsers);
```

## Testing

### RBAC Test Suite

```bash
# Run RBAC tests
npm run test tests/security/rbac-comprehensive.spec.ts

# Run in headed mode
npm run test:headed tests/security/rbac-comprehensive.spec.ts
```

### Test Coverage

- ✅ Role hierarchy enforcement
- ✅ Permission-based UI rendering
- ✅ API endpoint protection
- ✅ Role inheritance
- ✅ Wildcard permissions
- ✅ Cross-role access prevention
- ✅ Audit logging

### Manual Testing

**Test as different roles:**

1. Login as SuperAdmin:
   - Verify access to all features
   - Verify tenant switcher visible
   - Verify system admin access

2. Login as Admin:
   - Verify access to management features
   - Verify NO tenant switcher
   - Verify user management access

3. Login as Manager:
   - Verify approval capabilities
   - Verify NO admin dashboard
   - Verify report access

4. Login as User:
   - Verify basic operations
   - Verify NO delete buttons
   - Verify NO management access

5. Login as ReadOnly:
   - Verify view-only access
   - Verify NO action buttons
   - Verify NO create/edit/delete

## Best Practices

1. **Always check permissions on both frontend and backend**
   - Frontend checks are for UX only
   - Backend checks are the security boundary

2. **Use specific permissions over role checks**
   ```typescript
   // Good
   if (hasPermission('vehicles:delete')) { }

   // Less good
   if (hasRole('Admin')) { }
   ```

3. **Log all permission checks for audit**
   - Every permission check is logged
   - Logs include user, resource, action, result

4. **Never trust client-side permission checks**
   - Always validate on backend
   - Frontend controls are for UX, not security

5. **Use least privilege principle**
   - Grant minimum permissions needed
   - Review permissions regularly

## Related Documentation

- [AUTH.md](./AUTH.md) - Authentication System
- [MULTI_TENANCY.md](./MULTI_TENANCY.md) - Multi-Tenant Architecture
- [SECURITY.md](./SECURITY.md) - Security Best Practices

## Support

For RBAC issues or questions:
- Review audit logs for permission denials
- Check user's assigned role and permissions
- Contact: support@fleet.example.com
