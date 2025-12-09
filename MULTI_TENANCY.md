# Fleet Multi-Tenancy Architecture

Complete documentation for the multi-tenant isolation system in Fleet Management Platform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Data Isolation](#data-isolation)
- [Row-Level Security](#row-level-security)
- [Tenant Switching](#tenant-switching)
- [Testing](#testing)
- [Security](#security)

## Overview

Fleet implements **enterprise-grade multi-tenancy** with complete data isolation between tenants.

**Key Features:**
- **Zero data leakage** between tenants
- **Row-Level Security (RLS)** at database layer
- **Tenant context middleware** for all API requests
- **Automatic tenant_id injection** on all queries
- **Cross-tenant access prevention** (IDOR/BOLA protection)
- **SuperAdmin tenant switching** capability
- **Audit logging** for all tenant access

## Architecture

### Multi-Tenant Data Model

```
┌─────────────────────────────────────────┐
│          Tenant 1 (Acme Corp)           │
├─────────────────────────────────────────┤
│  Users  │ Vehicles │ Drivers │ Orders   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       Tenant 2 (Beta Industries)        │
├─────────────────────────────────────────┤
│  Users  │ Vehicles │ Drivers │ Orders   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       Tenant 3 (Gamma Logistics)        │
├─────────────────────────────────────────┤
│  Users  │ Vehicles │ Drivers │ Orders   │
└─────────────────────────────────────────┘
```

**Every table** with tenant-specific data includes `tenant_id UUID NOT NULL`.

### Tenant Context Flow

```
1. User authenticates
   ├─> JWT token includes tenant_id
   └─> Token stored in httpOnly cookie

2. API request received
   ├─> authenticateJWT middleware extracts user + tenant_id from JWT
   └─> setTenantContext middleware sets PostgreSQL session variable

3. Database query executed
   ├─> Row-Level Security (RLS) policy applies automatically
   ├─> Query filtered by app.current_tenant_id session variable
   └─> Only tenant's data returned

4. Response sent
   └─> Client receives only their tenant's data
```

## Data Isolation

### Database Schema

All tenant-scoped tables include:

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  vin VARCHAR(17) NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Tenant isolation constraint
  CONSTRAINT fk_vehicles_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
);

-- Enable Row-Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tenant_isolation_policy ON vehicles
  FOR ALL
  USING (tenant_id::text = current_setting('app.current_tenant_id', TRUE));
```

### Tenant Tables

**Tables with tenant isolation:**

- `vehicles` - Fleet vehicles
- `drivers` - Driver profiles
- `work_orders` - Maintenance work orders
- `maintenance_records` - Maintenance history
- `fuel_transactions` - Fuel logs
- `facilities` - Facility locations
- `assets` - Equipment and assets
- `users` - User accounts (within tenant)
- `notifications` - User notifications
- `documents` - Document uploads
- `routes` - Route definitions
- `geofences` - Geofence boundaries

**Shared tables (no tenant_id):**

- `tenants` - Tenant organization data
- `system_config` - Global system configuration
- `audit_logs` - Cross-tenant audit trail (includes tenant_id for filtering)

## Row-Level Security (RLS)

### How RLS Works

PostgreSQL Row-Level Security automatically filters all queries:

```sql
-- User query (what they write)
SELECT * FROM vehicles;

-- Actual executed query (what PostgreSQL runs)
SELECT * FROM vehicles
WHERE tenant_id::text = current_setting('app.current_tenant_id', TRUE);
```

### Setting Tenant Context

**Backend Middleware:**

```javascript
// api/src/middleware/tenant-context.ts
export const setTenantContext = async (req, res, next) => {
  if (!req.user?.tenant_id) {
    return res.status(403).json({
      error: 'Invalid authentication token',
      details: 'Tenant information missing',
    });
  }

  const client = await pool.connect();

  try {
    // Set PostgreSQL session variable
    await client.query(
      'SET LOCAL app.current_tenant_id = $1',
      [req.user.tenant_id]
    );

    req.dbClient = client;

    res.on('finish', () => {
      client.release();
    });

    next();
  } catch (error) {
    client.release();
    return res.status(500).json({
      error: 'Database configuration error',
    });
  }
};
```

**Usage in Routes:**

```javascript
router.get('/vehicles',
  authenticateJWT,         // Extract tenant_id from JWT
  setTenantContext,        // Set PostgreSQL session variable
  async (req, res) => {
    // All queries automatically filtered by tenant
    const vehicles = await req.dbClient.query('SELECT * FROM vehicles');
    res.json(vehicles.rows);
  }
);
```

### Tenant Validation

**Prevent Cross-Tenant References:**

```javascript
// api/src/utils/tenant-validator.ts
import { validateTenantReferences } from '../utils/tenant-validator';

router.post('/work-orders',
  authenticateJWT,
  setTenantContext,
  validateTenantReferences([
    { table: 'vehicles', field: 'vehicle_id', required: true },
    { table: 'facilities', field: 'facility_id', required: false },
  ]),
  async (req, res) => {
    // vehicle_id and facility_id validated to belong to current tenant
    // Prevents IDOR/BOLA attacks
    // ...
  }
);
```

**Prevent tenant_id Override:**

```javascript
import { preventTenantIdOverride } from '../utils/tenant-validator';

router.post('/vehicles',
  authenticateJWT,
  setTenantContext,
  preventTenantIdOverride,  // Blocks tenant_id in request body
  async (req, res) => {
    // req.body.tenant_id automatically set from JWT
    // User cannot specify different tenant_id
    // ...
  }
);
```

## Tenant Switching

### SuperAdmin Tenant Switching

SuperAdmins can switch between tenants for support and administration.

**Backend API:**

```javascript
// POST /api/v1/auth/switch-tenant
router.post('/switch-tenant',
  authenticateJWT,
  async (req, res) => {
    // Verify SuperAdmin role
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({
        error: 'Only SuperAdmins can switch tenants',
      });
    }

    const { tenantId } = req.body;

    // Validate tenant exists
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
      });
    }

    // Update JWT token with new tenant_id
    const newToken = jwt.sign({
      ...req.user,
      tenant_id: tenantId,
      tenant_name: tenant.name,
    }, process.env.JWT_SECRET);

    // Set new token in httpOnly cookie
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.json({
      success: true,
      user: {
        ...req.user,
        tenant_id: tenantId,
        tenant_name: tenant.name,
      },
    });
  }
);
```

**Frontend UI:**

```typescript
import { TenantSwitcher } from '@/components/auth/TenantSwitcher';

function App() {
  return (
    <div>
      {/* ... app content ... */}

      {/* Tenant switcher (only visible to SuperAdmins) */}
      <TenantSwitcher />
    </div>
  );
}
```

### Tenant Management API

**List Tenants (SuperAdmin only):**

```javascript
GET /api/v1/tenants

Response:
{
  "tenants": [
    {
      "id": "uuid",
      "name": "Acme Corporation",
      "plan": "enterprise",
      "active": true,
      "vehicleCount": 150,
      "userCount": 25,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    // ...
  ]
}
```

## Testing

### Multi-Tenant Isolation Tests

```bash
# Run tenant isolation tests
npm run test tests/security/multi-tenant-isolation.spec.ts

# Run in headed mode
npm run test:headed tests/security/multi-tenant-isolation.spec.ts
```

### Test Coverage

- ✅ Cross-tenant data access prevention (API)
- ✅ Cross-tenant data access prevention (UI)
- ✅ List endpoints return only tenant data
- ✅ Search only returns tenant results
- ✅ Reports only include tenant data
- ✅ Exports only include tenant data
- ✅ SuperAdmin tenant switching
- ✅ Non-SuperAdmin cannot switch tenants
- ✅ RLS policy enforcement
- ✅ Tenant context validation

### Test Scenarios

**Test 1: Cross-Tenant Vehicle Access**

```javascript
// Tenant 1 creates vehicle
const vehicle1 = await createVehicle(tenant1Token, { vin: 'VIN1' });

// Tenant 2 attempts to access Tenant 1's vehicle
const response = await fetch(`/api/v1/vehicles/${vehicle1.id}`, {
  headers: { Authorization: `Bearer ${tenant2Token}` },
});

// Should return 404 or 403 (RLS filters it out)
expect(response.status).toBe(404);
```

**Test 2: List Endpoints**

```javascript
// Tenant 1 gets vehicle list
const tenant1Vehicles = await fetch('/api/v1/vehicles', {
  headers: { Authorization: `Bearer ${tenant1Token}` },
});

const vehicles = await tenant1Vehicles.json();

// All vehicles must belong to Tenant 1
vehicles.forEach(v => {
  expect(v.tenant_id).toBe(tenant1.id);
});
```

**Test 3: Tenant Switcher**

```javascript
// SuperAdmin switches to Tenant 2
await switchTenant(tenant2.id);

// Verify all queries now return Tenant 2 data
const vehicles = await fetch('/api/v1/vehicles');
const data = await vehicles.json();

data.forEach(v => {
  expect(v.tenant_id).toBe(tenant2.id);
});
```

## Security

### Threat Model

**Prevented Attacks:**

1. **IDOR (Insecure Direct Object Reference)**
   - User cannot access another tenant's resources by guessing UUIDs
   - RLS filters out cross-tenant records automatically

2. **BOLA (Broken Object Level Authorization)**
   - Even if UUID is known, RLS prevents access
   - Tenant validation middleware blocks cross-tenant references

3. **Data Exfiltration**
   - List/search/export endpoints only return tenant's data
   - Reports scoped to tenant automatically

4. **Privilege Escalation**
   - Users cannot override tenant_id in requests
   - JWT tenant_id is single source of truth

### Defense in Depth

**Layer 1: JWT Token**
- tenant_id embedded in JWT
- Signed and verified
- Stored in httpOnly cookie

**Layer 2: Middleware**
- setTenantContext middleware sets PostgreSQL session variable
- validateTenantReferences checks foreign key references
- preventTenantIdOverride blocks tenant_id in request body

**Layer 3: Database (RLS)**
- Row-Level Security policies enforce at database level
- Even if middleware bypassed, RLS still protects
- Cannot be disabled by application code

**Layer 4: Audit Logging**
- All cross-tenant access attempts logged
- Permission denials logged with user/tenant/resource
- Audit trail for compliance

### Best Practices

1. **Always use tenant context middleware**
   ```javascript
   router.get('/resource',
     authenticateJWT,
     setTenantContext,  // REQUIRED
     handler
   );
   ```

2. **Never trust client tenant_id**
   ```javascript
   // BAD
   const { tenant_id } = req.body;
   await db.query('INSERT INTO vehicles (tenant_id, ...) VALUES ($1, ...)', [tenant_id]);

   // GOOD
   await db.query('INSERT INTO vehicles (tenant_id, ...) VALUES ($1, ...)', [req.user.tenant_id]);
   ```

3. **Validate all foreign key references**
   ```javascript
   validateTenantReferences([
     { table: 'vehicles', field: 'vehicle_id', required: true },
   ])
   ```

4. **Use RLS-aware database client**
   ```javascript
   // Use req.dbClient (has tenant context)
   await req.dbClient.query('SELECT * FROM vehicles');

   // NOT pool directly (no tenant context)
   // await pool.query('SELECT * FROM vehicles');
   ```

5. **Test cross-tenant access regularly**
   - Run tenant isolation test suite
   - Perform manual cross-tenant access attempts
   - Review audit logs for suspicious access patterns

## Compliance

- ✅ **FedRAMP AC-3** (Access Enforcement)
- ✅ **SOC 2 CC6.3** (Logical and Physical Access Controls)
- ✅ **GDPR** data segregation requirements
- ✅ **HIPAA** multi-tenant data isolation
- ✅ **ISO 27001** access control standards

## Related Documentation

- [AUTH.md](./AUTH.md) - Authentication System
- [RBAC.md](./RBAC.md) - Role-Based Access Control
- [SECURITY.md](./SECURITY.md) - Security Best Practices

## Support

For multi-tenancy issues or questions:
- Check RLS policies: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
- Verify tenant context: `SELECT current_setting('app.current_tenant_id', TRUE);`
- Review audit logs for cross-tenant access attempts
- Contact: support@fleet.example.com
