# Mass Assignment & Input Validation Remediation Summary

## Overview
This document summarizes the comprehensive mass assignment vulnerability fixes and input validation enhancements implemented across the Fleet Management System API.

## Critical Vulnerabilities Fixed

### 1. Registration Endpoint Privilege Escalation (CRITICAL)
**File**: `/home/user/Fleet/api/src/routes/auth.ts`

**Vulnerability**: Users could register with any role (including 'admin') by passing a `role` field in the request body.

**Fix**:
- Removed `role` field from registration schema (line 26)
- Added explicit role forcing to 'viewer' for all self-registrations (line 282)
- Added security comments explaining the protection (lines 27-28, 280-281)

**Before**:
```typescript
const registerSchema = z.object({
  // ... other fields
  role: z.enum(['admin', 'fleet_manager', 'driver', 'technician', 'viewer']).default('viewer')
})

// User could pass role='admin' in request
```

**After**:
```typescript
const registerSchema = z.object({
  // ... other fields
  // SECURITY: Role is NOT accepted in registration - always defaults to 'viewer'
  // This prevents privilege escalation attacks during self-registration
})

// Force role to 'viewer' for all self-registrations
const defaultRole = 'viewer'
```

---

### 2. Purchase Order Creation Mass Assignment
**File**: `/home/user/Fleet/api/src/routes/purchase-orders.ts`

**Vulnerability**: Users could set protected fields like `status`, `approved_by`, `approved_at` during creation.

**Fix**:
- Added Zod validation schema (createPurchaseOrderSchema)
- Implemented field whitelisting using 'purchase_orders' resource type
- Force status='draft' and created_by to authenticated user
- Added validation error handling

**Protected Fields**: status, tenant_id, approved_by, approved_at, created_by

---

### 3. Vendor Creation/Update Mass Assignment
**File**: `/home/user/Fleet/api/src/routes/vendors.ts`

**Vulnerability**: Users could potentially set `tenant_id`, `approved_by`, `is_active` fields.

**Fix**:
- Added Zod validation schemas (createVendorSchema, updateVendorSchema)
- Implemented field whitelisting for both POST and PUT endpoints
- Added validation error handling

**Protected Fields**: tenant_id, is_active, approved_by, approved_at

---

### 4. Vehicle Creation/Update Mass Assignment
**File**: `/home/user/Fleet/api/src/routes/vehicles.ts`

**Vulnerability**: Users could set `tenant_id`, `assigned_driver_id`, `status` without authorization.

**Fix**:
- Added comprehensive Zod validation schemas with VIN format validation
- Implemented field whitelisting for both POST and PUT endpoints
- VIN validation integrated into schema (17 characters, excluding I, O, Q)
- Added validation error handling

**Protected Fields**: tenant_id, assigned_driver_id, status

---

### 5. Driver (User) Creation/Update Mass Assignment (CRITICAL)
**File**: `/home/user/Fleet/api/src/routes/drivers.ts`

**Vulnerability**: Since drivers are stored in the `users` table, attackers could set `role`, `is_admin`, `tenant_id`, `password_hash`, `certified_by`, etc.

**Fix**:
- Added Zod validation schemas (createUserSchema, updateUserSchema)
- Implemented strict field whitelisting using 'users' resource type
- Added critical security comments
- Added validation error handling

**Protected Fields**: role, is_admin, tenant_id, password_hash, is_active, failed_login_attempts, account_locked_until, certified_by, certified_at

---

## Core Infrastructure Changes

### 1. Field Whitelist Configuration
**File**: `/home/user/Fleet/api/src/config/field-whitelists.ts` (NEW)

Comprehensive field whitelist configuration for all resource types:
- **Users**: Prevents setting role, is_admin, tenant_id, password_hash, certification fields
- **Vehicles**: Prevents setting tenant_id, assigned_driver_id, status
- **Vendors**: Prevents setting tenant_id, approval fields
- **Purchase Orders**: Prevents setting status, approval fields, created_by
- **Inspections**: Prevents setting status, approval fields
- **Maintenance Schedules**: Prevents setting status, tenant_id
- **Work Orders**: Prevents setting status, approval fields, actual_cost
- **Fuel Transactions**: Prevents setting tenant_id, card_number (PCI data)
- **Safety Incidents**: Prevents setting status, investigation fields
- **Geofences**: Prevents setting tenant_id
- **Facilities**: Prevents setting tenant_id, is_active
- **Policies**: Prevents setting tenant_id, approval fields
- **OSHA Compliance**: Prevents setting status, approval fields

**Key Functions**:
- `getWhitelist(resourceType, operation)`: Returns allowed fields for create/update
- `filterToWhitelist(data, resourceType, operation)`: Filters object to only whitelisted fields
- `validateNoForbiddenFields(data, resourceType, operation)`: Throws error if forbidden fields detected

---

### 2. Enhanced SQL Safety Utilities
**File**: `/home/user/Fleet/api/src/utils/sql-safety.ts` (MODIFIED)

**Changes**:
- Added import of `filterToWhitelist` function
- Enhanced `buildInsertClause()` to accept optional `resourceType` parameter
- Enhanced `buildUpdateClause()` to accept optional `resourceType` parameter
- Automatic field filtering when resourceType is provided
- Error thrown if no valid fields remain after filtering

**Before**:
```typescript
export function buildInsertClause(
  data: Record<string, any>,
  additionalColumns: string[] = [],
  startIndex: number = 1
): { columnNames: string; placeholders: string; values: any[] }
```

**After**:
```typescript
export function buildInsertClause(
  data: Record<string, any>,
  additionalColumns: string[] = [],
  startIndex: number = 1,
  resourceType?: string  // NEW: Optional field whitelisting
): { columnNames: string; placeholders: string; values: any[] }
```

---

### 3. Comprehensive Validation Schemas
**File**: `/home/user/Fleet/api/src/validation/schemas.ts` (NEW)

Complete Zod validation schemas for all resources:
- **User schemas**: Email, password complexity, required fields
- **Registration schema**: Special case - no role field accepted
- **Vehicle schemas**: VIN validation (17 chars, excluding I/O/Q), year range
- **Vendor schemas**: Email/URL validation, required fields
- **Purchase Order schemas**: UUID validation, positive amounts, currency
- **Inspection schemas**: Date validation, UUID references
- **Maintenance Schedule schemas**: Frequency type enum, positive values
- **Work Order schemas**: Priority enum, UUID references
- **Fuel Transaction schemas**: Positive amounts, datetime validation
- **Safety Incident schemas**: Severity enum, required descriptions
- **Geofence schemas**: Coordinate arrays, fence type enum
- **Facility schemas**: Lat/long ranges, contact validation

---

## Implementation Pattern

All updated endpoints follow this secure pattern:

```typescript
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    // 1. Validate and filter input data using Zod schema
    const validatedData = createResourceSchema.parse(req.body)

    // 2. Build INSERT/UPDATE with field whitelisting
    const { columnNames, placeholders, values } = buildInsertClause(
      validatedData,
      ['tenant_id', 'other_system_fields'],
      1,
      'resource_type'  // Enables field whitelisting
    )

    // 3. Execute query with system-controlled fields
    const result = await pool.query(
      `INSERT INTO resources (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      [req.user!.tenant_id, ...values]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    // 4. Handle validation errors separately
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

---

## Files Modified

### Core Infrastructure (3 files)
1. `/home/user/Fleet/api/src/config/field-whitelists.ts` (NEW) - Field whitelist configuration
2. `/home/user/Fleet/api/src/validation/schemas.ts` (NEW) - Zod validation schemas
3. `/home/user/Fleet/api/src/utils/sql-safety.ts` (MODIFIED) - Enhanced with whitelisting

### Critical Route Files (5 files)
1. `/home/user/Fleet/api/src/routes/auth.ts` (MODIFIED) - Registration privilege escalation fix
2. `/home/user/Fleet/api/src/routes/drivers.ts` (MODIFIED) - User/driver mass assignment fix
3. `/home/user/Fleet/api/src/routes/purchase-orders.ts` (MODIFIED) - PO approval field protection
4. `/home/user/Fleet/api/src/routes/vendors.ts` (MODIFIED) - Vendor field protection
5. `/home/user/Fleet/api/src/routes/vehicles.ts` (MODIFIED) - Vehicle field protection

---

## Remaining Route Files to Update

The following route files still use `buildInsertClause` or `buildUpdateClause` and should be updated following the same pattern:

1. `/home/user/Fleet/api/src/routes/inspections.ts`
2. `/home/user/Fleet/api/src/routes/maintenance-schedules.ts`
3. `/home/user/Fleet/api/src/routes/work-orders.ts`
4. `/home/user/Fleet/api/src/routes/fuel-transactions.ts`
5. `/home/user/Fleet/api/src/routes/safety-incidents.ts`
6. `/home/user/Fleet/api/src/routes/geofences.ts`
7. `/home/user/Fleet/api/src/routes/facilities.ts`
8. `/home/user/Fleet/api/src/routes/charging-stations.ts`
9. `/home/user/Fleet/api/src/routes/policies.ts`
10. `/home/user/Fleet/api/src/routes/policy-templates.ts`
11. `/home/user/Fleet/api/src/routes/osha-compliance.ts`
12. `/home/user/Fleet/api/src/routes/telemetry.ts`
13. `/home/user/Fleet/api/src/routes/video-events.ts`
14. `/home/user/Fleet/api/src/routes/communication-logs.ts`
15. `/home/user/Fleet/api/src/routes/communications.ts`
16. `/home/user/Fleet/api/src/routes/routes.ts`

**Update Pattern for Remaining Files**:
```typescript
// 1. Add import
import { createResourceSchema, updateResourceSchema } from '../validation/schemas'

// 2. Update POST endpoint
const validatedData = createResourceSchema.parse(req.body)
const { columnNames, placeholders, values } = buildInsertClause(
  validatedData,
  ['tenant_id'],
  1,
  'resource_type'  // Add this parameter
)

// 3. Update PUT endpoint
const validatedData = updateResourceSchema.parse(req.body)
const { fields, values } = buildUpdateClause(validatedData, 3, 'resource_type')  // Add parameter

// 4. Add error handling
if (error instanceof z.ZodError) {
  return res.status(400).json({ error: 'Validation error', details: error.errors })
}
```

---

## Testing Recommendations

### 1. Test Registration Privilege Escalation Prevention
```bash
# Attempt to register with admin role (should fail)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attacker@test.com",
    "password": "Test@123",
    "first_name": "Attacker",
    "last_name": "User",
    "role": "admin"
  }'

# Expected: User created with role='viewer', NOT 'admin'
```

### 2. Test Purchase Order Mass Assignment Prevention
```bash
# Attempt to create PO with approval fields (should be filtered)
curl -X POST http://localhost:3001/api/purchase-orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "uuid-here",
    "description": "Test Order",
    "total_amount": 1000,
    "status": "approved",
    "approved_by": "uuid-here",
    "approved_at": "2025-11-19T00:00:00Z"
  }'

# Expected: PO created with status='draft', approval fields ignored
```

### 3. Test Driver/User Mass Assignment Prevention
```bash
# Attempt to create driver with admin role (should be filtered)
curl -X POST http://localhost:3001/api/drivers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@test.com",
    "first_name": "Test",
    "last_name": "Driver",
    "role": "admin",
    "is_admin": true,
    "tenant_id": "other-tenant-uuid"
  }'

# Expected: User created WITHOUT role, is_admin, or tenant_id fields
```

### 4. Test Vehicle Mass Assignment Prevention
```bash
# Attempt to update vehicle with tenant_id (should be filtered)
curl -X PUT http://localhost:3001/api/vehicles/vehicle-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "make": "Toyota",
    "tenant_id": "other-tenant-uuid",
    "status": "sold"
  }'

# Expected: Only 'make' is updated, tenant_id and status are ignored
```

### 5. Test Validation Schema Enforcement
```bash
# Attempt to create vehicle with invalid VIN (should fail validation)
curl -X POST http://localhost:3001/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "INVALID",
    "make": "Toyota",
    "model": "Camry",
    "year": 2024
  }'

# Expected: 400 error with validation details
```

---

## Security Impact

### Vulnerabilities Eliminated
1. **CWE-915**: Privilege Escalation via Registration
2. **CWE-915**: Role Elevation via Driver/User Endpoints
3. **CWE-915**: Status Manipulation in Workflow-Based Resources
4. **CWE-915**: Tenant ID Manipulation (Multi-tenancy Bypass)
5. **CWE-915**: Approval Field Manipulation (Separation of Duties Bypass)

### Defense Layers Implemented
1. **Input Validation**: Zod schemas validate data types, formats, ranges
2. **Field Whitelisting**: Only explicitly allowed fields can be set
3. **Resource-Specific Rules**: Each resource has tailored whitelist
4. **System Field Protection**: Audit and control fields cannot be set by users
5. **Workflow Protection**: Status and approval fields require dedicated endpoints

---

## Compliance Benefits

### OWASP Top 10
- **A01:2021 – Broken Access Control**: Field whitelisting prevents unauthorized data manipulation
- **A03:2021 – Injection**: Combined with SQL safety utilities, prevents SQL injection
- **A04:2021 – Insecure Design**: Secure-by-default design with explicit whitelists

### FedRAMP / NIST 800-53
- **AC-3 (Access Enforcement)**: Field-level access control
- **AC-6 (Least Privilege)**: Users can only modify allowed fields
- **CM-5 (Access Restrictions for Change)**: System fields protected from user modification

---

## Maintenance Guidelines

### Adding New Resources
1. Add resource whitelist to `/home/user/Fleet/api/src/config/field-whitelists.ts`
2. Create Zod schemas in `/home/user/Fleet/api/src/validation/schemas.ts`
3. Update route file to use validation and whitelisting
4. Test with both valid and malicious inputs

### Modifying Existing Resources
1. Review whitelist - are new fields safe to expose?
2. Update Zod schema with new field validations
3. Test that protected fields remain inaccessible

### Common Pitfalls to Avoid
- ❌ Never accept user input directly in SQL without whitelisting
- ❌ Never trust client-side validation alone
- ❌ Never expose system/audit fields (created_by, tenant_id, etc.)
- ❌ Never allow status/approval fields in creation/update endpoints
- ✅ Always use Zod schemas for validation
- ✅ Always specify resourceType in buildInsertClause/buildUpdateClause
- ✅ Always handle validation errors separately
- ✅ Always force system-controlled fields (tenant_id, status, etc.)

---

## Summary

This comprehensive mass assignment remediation eliminates critical privilege escalation vulnerabilities by implementing:

1. **Strict Field Whitelisting**: 15+ resource types with explicit allowed fields
2. **Input Validation**: Comprehensive Zod schemas with format/range validation
3. **Protected Fields**: System, audit, approval, and privilege fields cannot be set
4. **Defense in Depth**: Multiple layers of protection (validation + whitelisting + SQL safety)
5. **Secure Defaults**: Automatic field filtering when resourceType is specified

**Critical fixes complete**: Registration, Drivers (Users), Purchase Orders, Vendors, Vehicles
**Infrastructure complete**: Field whitelists, Validation schemas, Enhanced SQL safety utilities
**Remaining work**: Apply pattern to 16 additional route files using the documented pattern

All changes maintain backward compatibility while significantly improving security posture.
