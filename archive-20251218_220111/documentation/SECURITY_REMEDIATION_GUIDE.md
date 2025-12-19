# Security Remediation Guide
**Priority**: CRITICAL - Required Before Production Deployment
**Estimated Time**: 4-5 hours
**Based on**: Google Gemini 2.5 Pro Security Assessment (75/100)

---

## Quick Summary

Your application has excellent SQL injection protection (100% parameterized queries) and clean dependency management (0 vulnerabilities). However, Gemini identified **authorization bypass vulnerabilities** that allow cross-tenant data access.

**What needs fixing**:
1. IDOR (Insecure Direct Object Reference) - Foreign keys not validated (HIGH)
2. Information disclosure via SELECT * (MEDIUM)
3. Dynamic query construction risks (MEDIUM)
4. Missing pagination (LOW)

---

## PRIORITY 1: Fix IDOR Vulnerability (CRITICAL)

**Time**: 1-2 hours
**Impact**: Prevents cross-tenant data access
**Severity**: HIGH

### The Problem

Currently, when creating/updating records, foreign keys like `vehicle_id` and `inspector_id` are not validated to belong to the current tenant:

```typescript
// ❌ VULNERABLE CODE (inspections.ts)
router.post('/', authenticateToken, tenantIsolation, async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const { vehicle_id, inspector_id, inspection_date } = req.body;

  // NO VALIDATION - vehicle_id could belong to another tenant!
  const result = await db.query(
    `INSERT INTO inspections (tenant_id, vehicle_id, inspector_id, inspection_date)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, vehicle_id, inspector_id, inspection_date]
  );
});
```

**Attack Scenario**:
1. Attacker has tenant_id = 123
2. Attacker discovers vehicle_id = 999 belongs to tenant_id = 456
3. Attacker creates inspection with their tenant_id but victim's vehicle_id
4. Result: Cross-tenant data linkage

### The Fix

**Create helper function** (`server/src/utils/tenant-validator.ts`):

```typescript
import { Pool } from 'pg';

export class TenantValidator {
  constructor(private db: Pool) {}

  async validateVehicle(vehicleId: number, tenantId: number): Promise<boolean> {
    const result = await this.db.query(
      `SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [vehicleId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateInspector(inspectorId: number, tenantId: number): Promise<boolean> {
    const result = await this.db.query(
      `SELECT id FROM inspectors WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [inspectorId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateRoute(routeId: number, tenantId: number): Promise<boolean> {
    const result = await this.db.query(
      `SELECT id FROM routes WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [routeId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateDriver(driverId: number, tenantId: number): Promise<boolean> {
    const result = await this.db.query(
      `SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [driverId, tenantId]
    );
    return result.rows.length > 0;
  }

  async validateWorkOrder(workOrderId: number, tenantId: number): Promise<boolean> {
    const result = await this.db.query(
      `SELECT id FROM work_orders WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [workOrderId, tenantId]
    );
    return result.rows.length > 0;
  }
}
```

**Update routes** (example: `server/src/routes/inspections.ts`):

```typescript
import { TenantValidator } from '../utils/tenant-validator';

const validator = new TenantValidator(db);

router.post('/', authenticateToken, tenantIsolation, async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const { vehicle_id, inspector_id, inspection_date, status, notes } = req.body;

  // ✅ VALIDATE FOREIGN KEYS BELONG TO TENANT
  if (vehicle_id && !(await validator.validateVehicle(vehicle_id, tenantId))) {
    res.status(403).json({ error: 'Vehicle not found or access denied' });
    return;
  }

  if (inspector_id && !(await validator.validateInspector(inspector_id, tenantId))) {
    res.status(403).json({ error: 'Inspector not found or access denied' });
    return;
  }

  // NOW SAFE TO INSERT
  const result = await db.query(
    `INSERT INTO inspections (tenant_id, vehicle_id, inspector_id, inspection_date, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tenantId, vehicle_id, inspector_id, inspection_date, status, notes]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});
```

### Files to Update

Apply this pattern to ALL routes with foreign keys:

1. **inspections.ts** - Validate: `vehicle_id`, `inspector_id`
2. **maintenance.ts** - Validate: `vehicle_id`, `work_order_id`
3. **work-orders.ts** - Validate: `vehicle_id`, `assigned_to` (driver)
4. **routes.ts** - Validate: `vehicle_id`, `driver_id`
5. **fuel-transactions.ts** - Validate: `vehicle_id`, `driver_id`

---

## PRIORITY 2: Fix Information Disclosure (MEDIUM)

**Time**: 1 hour
**Impact**: Prevents accidental exposure of sensitive columns
**Severity**: MEDIUM

### The Problem

Using `SELECT *` returns ALL columns, including potentially sensitive data:

```typescript
// ❌ RISKY - Returns all columns
const result = await db.query(
  `SELECT * FROM inspections WHERE tenant_id = $1`,
  [tenantId]
);
```

If someone adds `inspector_ssn` or `internal_notes` columns later, they'll be exposed to API consumers.

### The Fix

**Explicitly list required columns**:

```typescript
// ✅ SAFE - Only returns what's needed
const result = await db.query(
  `SELECT
    id,
    tenant_id,
    vehicle_id,
    inspector_id,
    inspection_date,
    status,
    notes,
    created_at,
    updated_at
  FROM inspections
  WHERE tenant_id = $1 AND deleted_at IS NULL
  ORDER BY inspection_date DESC`,
  [tenantId]
);
```

### Files to Update

Review ALL `SELECT *` queries in:
- inspections.ts
- maintenance.ts
- work-orders.ts
- routes.ts
- fuel-transactions.ts

**Search command**:
```bash
grep -r "SELECT \*" server/src/routes/
```

---

## PRIORITY 3: Add Allow-lists for Dynamic Updates (MEDIUM)

**Time**: 1 hour
**Impact**: Prevents mass assignment vulnerabilities
**Severity**: MEDIUM

### The Problem

Dynamic UPDATE queries from `Object.keys(req.body)` could allow unintended field updates:

```typescript
// ❌ RISKY - User could update ANY field
const fields = Object.keys(req.body);
const updates = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
```

**Attack Scenario**:
```json
{
  "status": "completed",
  "tenant_id": 999,  // Attacker tries to change tenant!
  "deleted_at": null  // Or undelete a record
}
```

### The Fix

**Create allow-list per resource**:

```typescript
// ✅ SAFE - Only allow specific fields
const ALLOWED_UPDATE_FIELDS = [
  'status',
  'notes',
  'inspection_date',
  'completion_date'
];

router.put('/:id', authenticateToken, tenantIsolation, async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const { id } = req.params;

  // Filter to only allowed fields
  const updates = Object.keys(req.body)
    .filter(key => ALLOWED_UPDATE_FIELDS.includes(key))
    .reduce((acc, key) => {
      acc[key] = req.body[key];
      return acc;
    }, {});

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  // Build parameterized query
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');

  const result = await db.query(
    `UPDATE inspections
     SET ${setClause}, updated_at = NOW()
     WHERE id = $1 AND tenant_id = $${fields.length + 2}
     RETURNING *`,
    [id, ...values, tenantId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Inspection not found' });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
});
```

### Files to Update

Add allow-lists to PUT/PATCH endpoints in:
- inspections.ts
- maintenance.ts
- work-orders.ts
- routes.ts
- fuel-transactions.ts

---

## PRIORITY 4: Add Pagination (LOW)

**Time**: 1 hour
**Impact**: Prevents DoS from large result sets
**Severity**: LOW

### The Problem

Without pagination, queries could return millions of rows:

```typescript
// ❌ Could return 1 million records
const result = await db.query(
  `SELECT * FROM inspections WHERE tenant_id = $1`,
  [tenantId]
);
```

### The Fix

**Add LIMIT/OFFSET with sensible defaults**:

```typescript
router.get('/', authenticateToken, tenantIsolation, async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;

  // Parse pagination params with defaults
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const offset = parseInt(req.query.offset as string) || 0;

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM inspections WHERE tenant_id = $1 AND deleted_at IS NULL`,
    [tenantId]
  );

  // Get paginated results
  const result = await db.query(
    `SELECT
      id, vehicle_id, inspector_id, inspection_date, status, notes,
      created_at, updated_at
    FROM inspections
    WHERE tenant_id = $1 AND deleted_at IS NULL
    ORDER BY inspection_date DESC
    LIMIT $2 OFFSET $3`,
    [tenantId, limit, offset]
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
      hasMore: offset + limit < parseInt(countResult.rows[0].total)
    }
  });
});
```

### Files to Update

Add pagination to all GET list endpoints in:
- inspections.ts
- maintenance.ts
- work-orders.ts
- routes.ts
- fuel-transactions.ts

---

## Testing Your Fixes

### 1. Test IDOR Protection

```bash
# Try to create inspection with another tenant's vehicle
curl -X POST http://localhost:3000/api/inspections \
  -H "Authorization: Bearer $TOKEN_TENANT_1" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": 999,  # Vehicle belonging to tenant 2
    "inspector_id": 1,
    "inspection_date": "2025-12-02",
    "status": "pending"
  }'

# Expected: 403 Forbidden
```

### 2. Test SELECT * Replacement

```bash
# Ensure response only contains expected fields
curl http://localhost:3000/api/inspections \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0] | keys'

# Should NOT include: inspector_ssn, internal_notes, etc.
```

### 3. Test Allow-list

```bash
# Try to update tenant_id (should be ignored)
curl -X PUT http://localhost:3000/api/inspections/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "tenant_id": 999
  }'

# Check: tenant_id should remain unchanged
```

### 4. Test Pagination

```bash
# Request with pagination
curl "http://localhost:3000/api/inspections?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Should return max 10 records + pagination metadata
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All foreign keys validated in POST/PUT endpoints
- [ ] All `SELECT *` replaced with explicit column lists
- [ ] Allow-lists implemented for all UPDATE operations
- [ ] Pagination added to all GET list endpoints
- [ ] TypeScript errors resolved (46 errors)
- [ ] Frontend build completes successfully
- [ ] All tests pass (6/6 categories)
- [ ] Security audit repeated (should achieve >90 score)

---

## Time Estimate Summary

| Priority | Task | Time | Status |
|----------|------|------|--------|
| 1 - CRITICAL | Fix IDOR vulnerability | 1-2 hours | ⏳ Pending |
| 2 - MEDIUM | Replace SELECT * | 1 hour | ⏳ Pending |
| 3 - MEDIUM | Add allow-lists | 1 hour | ⏳ Pending |
| 4 - LOW | Add pagination | 1 hour | ⏳ Pending |
| **TOTAL** | | **4-5 hours** | |

---

## Questions?

If you need help implementing these fixes or want to discuss alternative approaches, the validation artifacts are available:

- Full Gemini review: `/tmp/gemini-review-result.txt`
- Validation logs: `/tmp/final-endpoint-validation.log`
- Comprehensive report: `VALIDATION_ACHIEVEMENT_REPORT.md`

**Next Step**: Start with Priority 1 (IDOR fix) - this is the most critical security issue preventing production deployment.
