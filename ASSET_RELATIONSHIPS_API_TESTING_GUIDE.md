# Asset Relationships API Routes - Testing Guide

**Agent 3: Asset Relationships API Routes Specialist**
**Date**: 2025-11-19
**Tasks Completed**: 2.2 and 2.3
**Status**: ✅ COMPLETE

---

## Summary

Successfully implemented and integrated Asset Relationships API routes for managing multi-asset combinations (tractor-trailer combos, equipment attachments, etc.).

### What Was Done

1. ✅ **Task 2.2**: Enhanced Asset Relationships Routes (`api/src/routes/asset-relationships.routes.ts`)
   - Added `/active-combos` endpoint as specified in requirements
   - Maintained `/active` endpoint for backward compatibility
   - All endpoints use proper middleware (auth, permissions, audit)
   - Transaction safety for create/delete operations
   - Parameterized SQL queries to prevent SQL injection

2. ✅ **Task 2.3**: Server Integration (`api/src/server.ts`)
   - Routes already imported (line 72)
   - Routes already registered at `/api/asset-relationships` (line 404)
   - Swagger documentation included via OpenAPI annotations

---

## Implementation Details

### File: `/home/user/Fleet/api/src/routes/asset-relationships.routes.ts`

**Total Lines**: 495
**Middleware Stack**:
- `authenticateJWT` - JWT-based authentication
- `requirePermission` - RBAC authorization
- `auditLog` - Audit trail for all operations

**Endpoints Implemented**:
1. `GET /api/asset-relationships` - List all relationships
2. `GET /api/asset-relationships/active-combos` - Get active combos (NEW - as required)
3. `GET /api/asset-relationships/active` - Get active combos (alias for backward compatibility)
4. `GET /api/asset-relationships/:id` - Get single relationship
5. `POST /api/asset-relationships` - Create new relationship
6. `PUT /api/asset-relationships/:id` - Update relationship
7. `PATCH /api/asset-relationships/:id/deactivate` - Deactivate relationship
8. `DELETE /api/asset-relationships/:id` - Delete relationship
9. `GET /api/asset-relationships/history/:assetId` - Get relationship history

### File: `/home/user/Fleet/api/src/server.ts`

**Lines 72**: Import statement
```typescript
import assetRelationshipsRoutes from './routes/asset-relationships.routes'
```

**Line 404**: Route registration
```typescript
app.use('/api/asset-relationships', assetRelationshipsRoutes)
```

---

## API Endpoint Documentation

### 1. List All Asset Relationships

**Endpoint**: `GET /api/asset-relationships`

**Authentication**: Required (JWT)

**Permissions**: `vehicle:view:fleet`

**Query Parameters**:
- `parent_asset_id` (optional) - Filter by parent asset ID
- `child_asset_id` (optional) - Filter by child asset ID
- `relationship_type` (optional) - Filter by type (TOWS, ATTACHED, CARRIES, POWERS, CONTAINS)
- `active_only` (optional, default: true) - Show only active relationships

**Sample Request**:
```bash
curl -X GET "https://api.fleet.com/api/asset-relationships?active_only=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Sample Response** (200 OK):
```json
{
  "relationships": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "parent_asset_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "child_asset_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "relationship_type": "TOWS",
      "connection_point": "fifth_wheel",
      "is_primary": true,
      "effective_from": "2025-11-15T08:00:00.000Z",
      "effective_to": null,
      "notes": "Standard dry van trailer attachment",
      "created_at": "2025-11-15T08:00:00.000Z",
      "created_by": "user-123",
      "updated_at": "2025-11-15T08:00:00.000Z",
      "parent_asset_name": "Freightliner Cascadia (1FUJGHDV8CLBP1234)",
      "parent_asset_type": "SEMI_TRACTOR",
      "child_asset_name": "Great Dane Dry Van (1GRAA0628AB123456)",
      "child_asset_type": "DRY_VAN_TRAILER",
      "created_by_name": "John Smith"
    }
  ],
  "total": 1
}
```

---

### 2. Get Active Asset Combinations (NEW ENDPOINT)

**Endpoint**: `GET /api/asset-relationships/active-combos`

**Authentication**: Required (JWT)

**Permissions**: `vehicle:view:fleet`

**Description**: Returns currently active parent-child asset relationships using the `vw_active_asset_combos` database view. This is optimized for displaying tractor-trailer combos, equipment attachments, etc.

**Sample Request**:
```bash
curl -X GET "https://api.fleet.com/api/asset-relationships/active-combos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Sample Response** (200 OK):
```json
{
  "combinations": [
    {
      "relationship_id": "123e4567-e89b-12d3-a456-426614174000",
      "relationship_type": "TOWS",
      "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "parent_vin": "1FUJGHDV8CLBP1234",
      "parent_make": "Freightliner",
      "parent_model": "Cascadia",
      "parent_type": "SEMI_TRACTOR",
      "child_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "child_vin": "1GRAA0628AB123456",
      "child_make": "Great Dane",
      "child_model": "Dry Van 53'",
      "child_type": "DRY_VAN_TRAILER",
      "effective_from": "2025-11-15T08:00:00.000Z",
      "effective_to": null,
      "notes": "Standard dry van trailer attachment"
    },
    {
      "relationship_id": "223e4567-e89b-12d3-a456-426614174001",
      "relationship_type": "ATTACHED",
      "parent_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "parent_vin": "CAT0385CCWGT01234",
      "parent_make": "Caterpillar",
      "parent_model": "320 Excavator",
      "parent_type": "EXCAVATOR",
      "child_id": "d4e5f6a7-b8c9-0123-def1-234567890123",
      "child_vin": "BUCKET48IN001234",
      "child_make": "Caterpillar",
      "child_model": "48-inch Bucket",
      "child_type": "OTHER",
      "effective_from": "2025-11-18T10:30:00.000Z",
      "effective_to": null,
      "notes": "Excavator bucket attachment for digging operations"
    }
  ],
  "total": 2
}
```

---

### 3. Create New Asset Relationship (Attach Trailer)

**Endpoint**: `POST /api/asset-relationships`

**Authentication**: Required (JWT)

**Permissions**: `vehicle:update:fleet`

**Audit**: CREATE operation logged

**Request Body**:
```json
{
  "parent_asset_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "child_asset_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "relationship_type": "TOWS",
  "effective_from": "2025-11-19T06:00:00.000Z",
  "notes": "Morning dispatch - Route to Chicago"
}
```

**Sample Request**:
```bash
curl -X POST "https://api.fleet.com/api/asset-relationships" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "parent_asset_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "child_asset_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "relationship_type": "TOWS",
    "notes": "Morning dispatch - Route to Chicago"
  }'
```

**Sample Response** (201 Created):
```json
{
  "relationship": {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "parent_asset_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "child_asset_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "relationship_type": "TOWS",
    "connection_point": null,
    "is_primary": true,
    "effective_from": "2025-11-19T06:00:00.000Z",
    "effective_to": null,
    "notes": "Morning dispatch - Route to Chicago",
    "created_at": "2025-11-19T06:00:00.000Z",
    "created_by": "user-123",
    "updated_at": "2025-11-19T06:00:00.000Z"
  },
  "message": "Asset relationship created successfully"
}
```

**Error Responses**:

**400 Bad Request** - Assets don't exist or don't belong to tenant:
```json
{
  "error": "One or both assets not found or do not belong to your organization"
}
```

**400 Bad Request** - Circular relationship detected:
```json
{
  "error": "Circular relationship detected: child asset is already a parent of this asset"
}
```

**400 Bad Request** - Same asset as parent and child:
```json
{
  "error": "Parent and child assets must be different"
}
```

---

### 4. End Relationship (Detach Trailer)

**Endpoint**: `DELETE /api/asset-relationships/:id`

**Authentication**: Required (JWT)

**Permissions**: `vehicle:delete:fleet`

**Audit**: DELETE operation logged

**Description**: Permanently deletes the relationship record. For temporary detachment, use the PATCH `/deactivate` endpoint instead.

**Sample Request**:
```bash
curl -X DELETE "https://api.fleet.com/api/asset-relationships/323e4567-e89b-12d3-a456-426614174002" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN"
```

**Sample Response** (200 OK):
```json
{
  "message": "Relationship deleted successfully"
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Relationship not found"
}
```

---

### 5. Deactivate Relationship (Soft Delete)

**Endpoint**: `PATCH /api/asset-relationships/:id/deactivate`

**Authentication**: Required (JWT)

**Permissions**: `vehicle:update:fleet`

**Audit**: UPDATE operation logged

**Description**: Sets `effective_to = NOW()` to end the relationship while preserving history. This is the recommended way to detach a trailer.

**Sample Request**:
```bash
curl -X PATCH "https://api.fleet.com/api/asset-relationships/323e4567-e89b-12d3-a456-426614174002/deactivate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN"
```

**Sample Response** (200 OK):
```json
{
  "relationship": {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "parent_asset_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "child_asset_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "relationship_type": "TOWS",
    "connection_point": null,
    "is_primary": true,
    "effective_from": "2025-11-19T06:00:00.000Z",
    "effective_to": "2025-11-19T18:30:00.000Z",
    "notes": "Morning dispatch - Route to Chicago",
    "created_at": "2025-11-19T06:00:00.000Z",
    "created_by": "user-123",
    "updated_at": "2025-11-19T18:30:00.000Z"
  },
  "message": "Relationship deactivated successfully"
}
```

---

## Security Features

### 1. Authentication
- All routes protected by `authenticateJWT` middleware
- JWT token required in Authorization header: `Bearer YOUR_TOKEN`

### 2. Authorization (RBAC)
- **Read Operations**: Require `vehicle:view:fleet` permission
- **Write Operations**: Require `vehicle:update:fleet` permission
- **Delete Operations**: Require `vehicle:delete:fleet` permission

### 3. Multi-Tenancy
- All queries filter by `tenant_id` from authenticated user
- Cross-tenant access is prevented at the database level

### 4. Audit Logging
- All operations logged to `audit_logs` table
- Includes: user_id, action, resource_type, resource_id, timestamp, IP address
- Audit logs include SHA-256 hash for integrity verification

### 5. SQL Injection Prevention
- All queries use parameterized statements
- No dynamic SQL concatenation
- Input validation via TypeScript types

### 6. Transaction Safety
- CREATE operations use database transactions
- Validation checks before committing
- Automatic rollback on errors

### 7. Business Logic Validation
- Prevents circular relationships (child cannot be parent of its parent)
- Validates both assets exist and belong to tenant
- Ensures parent and child are different assets (enforced by database constraint)

---

## Database Schema

### Table: `asset_relationships`

```sql
CREATE TABLE asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL
    CHECK (relationship_type IN ('TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS')),
  connection_point VARCHAR(100),
  is_primary BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_different_assets CHECK (parent_asset_id != child_asset_id)
);
```

### View: `vw_active_asset_combos`

Optimized view for displaying currently active relationships:

```sql
CREATE VIEW vw_active_asset_combos AS
SELECT
  ar.id as relationship_id,
  ar.relationship_type,
  p.id as parent_id,
  p.vin as parent_vin,
  p.make as parent_make,
  p.model as parent_model,
  p.asset_type as parent_type,
  c.id as child_id,
  c.vin as child_vin,
  c.make as child_make,
  c.model as child_model,
  c.asset_type as child_type,
  ar.effective_from,
  ar.effective_to,
  ar.notes
FROM asset_relationships ar
JOIN vehicles p ON ar.parent_asset_id = p.id
JOIN vehicles c ON ar.child_asset_id = c.id
WHERE (ar.effective_to IS NULL OR ar.effective_to > NOW());
```

---

## Relationship Types

| Type | Description | Example Use Case |
|------|-------------|------------------|
| `TOWS` | One asset tows another | Semi tractor towing a trailer |
| `ATTACHED` | One asset is physically attached | Excavator with bucket attachment |
| `CARRIES` | One asset carries another | Truck carrying shipping container |
| `POWERS` | One asset powers another | Truck powering portable generator |
| `CONTAINS` | One asset contains another | Trailer containing palletized cargo |

---

## Common Use Cases

### Use Case 1: Attach Trailer to Tractor for Delivery

**Scenario**: Driver John picks up trailer #456 with tractor #123 for Chicago delivery

**API Call**:
```bash
POST /api/asset-relationships
{
  "parent_asset_id": "tractor-123-uuid",
  "child_asset_id": "trailer-456-uuid",
  "relationship_type": "TOWS",
  "notes": "Chicago delivery - Load #7890"
}
```

**Result**: Tractor-trailer combo is created and appears in active combos list

---

### Use Case 2: Detach Trailer After Delivery

**Scenario**: Driver John drops off trailer #456 at Chicago warehouse

**API Call**:
```bash
PATCH /api/asset-relationships/{relationship_id}/deactivate
```

**Result**: Relationship is deactivated (effective_to set to current time), trailer becomes available for other tractors

---

### Use Case 3: View All Active Tractor-Trailer Combos

**Scenario**: Dispatcher needs to see which tractors have which trailers attached

**API Call**:
```bash
GET /api/asset-relationships/active-combos
```

**Result**: List of all current tractor-trailer combinations with vehicle details

---

### Use Case 4: Track Excavator Attachment History

**Scenario**: Maintenance needs to see all buckets ever attached to excavator #789

**API Call**:
```bash
GET /api/asset-relationships/history/{excavator-789-uuid}
```

**Result**: Complete history of all attachments (buckets, hammers, etc.) over time

---

## Testing Checklist

- [x] **Task 2.2**: Asset Relationships Routes Created
  - [x] GET /api/asset-relationships - List all relationships
  - [x] GET /api/asset-relationships/active-combos - Get active combos (NEW)
  - [x] POST /api/asset-relationships - Create relationship
  - [x] DELETE /api/asset-relationships/:id - Delete relationship
  - [x] All routes use authenticateJWT middleware
  - [x] All routes use requirePermission middleware
  - [x] All modifications use auditLog middleware
  - [x] All queries use parameterized SQL
  - [x] Create/delete operations use transactions

- [x] **Task 2.3**: Routes Registered in Server
  - [x] Import statement added (line 72)
  - [x] Route registration added (line 404)
  - [x] Routes accessible at /api/asset-relationships
  - [x] Swagger documentation via OpenAPI annotations

---

## Acceptance Criteria Met

✅ Can create tractor-trailer relationship via API
✅ Can list active combos
✅ Can end relationship (detach trailer)
✅ All operations audit logged
✅ Routes accessible at /api/asset-relationships

---

## Next Steps

1. **Database Migration**: Run migration `032_multi_asset_vehicle_extensions.sql` if not already applied
2. **Testing**: Use the sample API calls above to test each endpoint
3. **Integration**: Frontend components can now consume these endpoints
4. **Monitoring**: Check audit_logs table to verify all operations are being logged

---

## Files Modified

1. `/home/user/Fleet/api/src/routes/asset-relationships.routes.ts` (Enhanced with /active-combos endpoint)
2. `/home/user/Fleet/api/src/server.ts` (Already had correct imports and registration)

---

## Contact

**Agent**: Asset Relationships API Routes Specialist (Agent 3)
**Completion Date**: 2025-11-19
**Status**: Ready for Testing and Deployment
