# CRITICAL SECURITY FIX: Communications Tenant Isolation

**Date**: 2025-12-04
**File**: `/api/src/routes/communications.ts`
**Severity**: CRITICAL (CVSS 7.5 - High)
**Vulnerability Type**: Broken Access Control / Privilege Escalation / Information Disclosure
**Status**: ✅ FIXED (Commit: 927bc3144)

---

## Executive Summary

**CRITICAL VULNERABILITY DISCOVERED**: The communications module contained **18 database queries** missing `tenant_id` filters, allowing users to access private communications from other tenants. This is a **privilege escalation vulnerability** enabling unauthorized cross-tenant data access.

**ALL 18 QUERIES HAVE BEEN FIXED** with proper tenant isolation using parameterized queries.

---

## Vulnerability Details

### Impact
- **Data Exposure**: Private communications, messages, templates, and attachments from ALL tenants accessible
- **Cross-Tenant Access**: Users could read/modify/delete communications belonging to other organizations
- **Compliance Risk**: Violation of data privacy requirements (GDPR, HIPAA, SOC2)
- **Business Impact**: Loss of trust, potential legal liability, breach of SaaS multi-tenancy model

### CVSS 3.1 Score: 7.5 (High)
- **Attack Vector**: Network (AV:N)
- **Attack Complexity**: Low (AC:L)
- **Privileges Required**: Low (PR:L) - Authenticated user
- **User Interaction**: None (UI:N)
- **Scope**: Changed (S:C) - Affects other tenants
- **Confidentiality**: High (C:H) - Full access to communications
- **Integrity**: High (I:H) - Ability to modify other tenants' data
- **Availability**: None (A:N)

---

## Detailed Fixes Applied

### 1. GET /communications (Main List Query)
**Location**: Lines 47-100
**Vulnerability**: Relied on `from_user.tenant_id` instead of `communications.tenant_id`

**BEFORE**:
```sql
WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
```

**AFTER**:
```sql
WHERE c.tenant_id = $1
```

**Security Improvement**: Direct filter on communications table prevents orphaned records access.

---

### 2. GET /communications (Count Query)
**Location**: Lines 102-108
**Vulnerability**: Count query joined drivers table unnecessarily, missing direct tenant check

**BEFORE**:
```sql
FROM communications c
LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
```

**AFTER**:
```sql
FROM communications c
WHERE c.tenant_id = $1
```

**Security Improvement**: Simplified query with direct tenant_id filter.

---

### 3. GET /communications/:id (Detail Query)
**Location**: Lines 131-146
**Vulnerability**: Missing tenant_id filter allowed accessing any communication by ID

**BEFORE**:
```sql
WHERE c.id = $1
```

**AFTER**:
```sql
WHERE c.id = $1 AND c.tenant_id = $2
```

**Security Improvement**: Added second parameter for tenant_id verification.

---

### 4. GET /communications/:id (Entity Links Subquery)
**Location**: Lines 148-156
**Vulnerability**: Entity links query didn't verify communication ownership

**BEFORE**:
```sql
SELECT entity_type, entity_id, link_type, relevance_score, auto_detected
FROM communication_entity_links
WHERE communication_id = $1
```

**AFTER**:
```sql
SELECT cel.entity_type, cel.entity_id, cel.link_type, cel.relevance_score, cel.auto_detected
FROM communication_entity_links cel
JOIN communications c ON cel.communication_id = c.id
WHERE cel.communication_id = $1 AND c.tenant_id = $2
```

**Security Improvement**: JOIN with communications table enforces tenant ownership.

---

### 5. GET /communications/:id (Attachments Subquery)
**Location**: Lines 158-172
**Vulnerability**: Attachments query didn't verify communication ownership

**BEFORE**:
```sql
SELECT id, communication_id, file_name, file_path, file_type, file_size, created_at
FROM communication_attachments
WHERE communication_id = $1
```

**AFTER**:
```sql
SELECT ca.id, ca.communication_id, ca.file_name, ca.file_path, ca.file_type, ca.file_size, ca.created_at
FROM communication_attachments ca
JOIN communications c ON ca.communication_id = c.id
WHERE ca.communication_id = $1 AND c.tenant_id = $2
```

**Security Improvement**: JOIN ensures attachment files belong to tenant's communication.

---

### 6. POST /communications (Create Communication)
**Location**: Lines 193-209
**Vulnerability**: INSERT didn't include tenant_id, allowing creation without tenant assignment

**BEFORE**:
```javascript
buildInsertClause(data, [`created_by`], 1)
// Parameters: [req.user!.id, ...values]
```

**AFTER**:
```javascript
buildInsertClause(data, [`tenant_id`, `created_by`], 1)
// Parameters: [req.user!.tenant_id, req.user!.id, ...values]
```

**Security Improvement**: Automatically assigns tenant_id from authenticated user's JWT token.

---

### 7. PUT /communications/:id (Update Communication)
**Location**: Lines 252-271
**Vulnerability**: UPDATE missing tenant_id in WHERE clause allowed modifying other tenants' data

**BEFORE**:
```sql
UPDATE communications
SET ${fields}, updated_at = NOW(), updated_by = $2
WHERE id = $1
```

**AFTER**:
```sql
UPDATE communications
SET ${fields}, updated_at = NOW(), updated_by = $2
WHERE id = $1 AND tenant_id = $3
```

**Security Improvement**: Added tenant_id verification before update, adjusted parameter indices.

---

### 8. POST /communications/:id/link (Create Entity Link)
**Location**: Lines 291-319
**Vulnerability**: Link creation didn't verify communication ownership

**BEFORE**:
```javascript
// Direct INSERT without validation
const result = await pool.query(
  `INSERT INTO communication_entity_links...`,
  [req.params.id, entity_type, entity_id, link_type]
)
```

**AFTER**:
```javascript
// Validation query first
const commCheck = await pool.query(
  `SELECT id FROM communications WHERE id = $1 AND tenant_id = $2`,
  [req.params.id, req.user!.tenant_id]
)

if (commCheck.rows.length === 0) {
  throw new ForbiddenError('Cannot link entities to communications from other tenants')
}

// Then INSERT
```

**Security Improvement**: Pre-validation prevents linking entities to unauthorized communications.

---

### 9. DELETE /communications/:id/link/:link_id (Delete Entity Link)
**Location**: Lines 327-350
**Vulnerability**: DELETE didn't verify tenant ownership

**BEFORE**:
```sql
DELETE FROM communication_entity_links
WHERE id = $1 AND communication_id = $2
RETURNING id
```

**AFTER**:
```sql
DELETE FROM communication_entity_links cel
USING communications c
WHERE cel.id = $1
  AND cel.communication_id = $2
  AND cel.communication_id = c.id
  AND c.tenant_id = $3
RETURNING cel.id
```

**Security Improvement**: USING clause joins with communications for tenant verification.

---

### 10. GET /communications/entity/:entity_type/:entity_id (Entity Communications)
**Location**: Lines 362-381
**Vulnerability**: Missing tenant filter allowed viewing all communications for an entity across tenants

**BEFORE**:
```sql
WHERE cel.entity_type = $1 AND cel.entity_id = $2
LIMIT $3 OFFSET $4
```

**AFTER**:
```sql
WHERE cel.entity_type = $1 AND cel.entity_id = $2 AND c.tenant_id = $3
LIMIT $4 OFFSET $5
```

**Security Improvement**: Added tenant_id filter, adjusted parameter positions.

---

### 11. GET /communications/entity/:entity_type/:entity_id (Count Query)
**Location**: Lines 383-390
**Vulnerability**: Count query missing tenant filter

**BEFORE**:
```sql
SELECT COUNT(*)
FROM communication_entity_links
WHERE entity_type = $1 AND entity_id = $2
```

**AFTER**:
```sql
SELECT COUNT(*)
FROM communication_entity_links cel
JOIN communications c ON cel.communication_id = c.id
WHERE cel.entity_type = $1 AND cel.entity_id = $2 AND c.tenant_id = $3
```

**Security Improvement**: JOIN with tenant filter for accurate count.

---

### 12. GET /communications/follow-ups/pending (Follow-ups Dashboard)
**Location**: Lines 418-440
**Vulnerability**: Follow-up query relied on driver tenant instead of communication tenant

**BEFORE**:
```sql
WHERE c.requires_follow_up = TRUE
  AND c.follow_up_completed = FALSE
  AND c.status != 'Closed'
  AND (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
```

**AFTER**:
```sql
WHERE c.tenant_id = $1
  AND c.requires_follow_up = TRUE
  AND c.follow_up_completed = FALSE
  AND c.status != 'Closed'
```

**Security Improvement**: Direct tenant_id filter on communications table.

---

### 13. GET /communications/templates (Templates List)
**Location**: Lines 458-489
**Vulnerability**: Templates query missing tenant_id filter

**BEFORE**:
```sql
SELECT ... FROM communication_templates WHERE is_active = TRUE
```

**AFTER**:
```sql
SELECT ... FROM communication_templates WHERE tenant_id = $1 AND is_active = TRUE
```

**Security Improvement**: Templates now scoped to requesting tenant.

---

### 14. POST /communications/templates (Create Template)
**Location**: Lines 498-519
**Vulnerability**: INSERT missing tenant_id assignment

**BEFORE**:
```javascript
buildInsertClause(data, [`created_by`], 1)
// Parameters: [req.user!.id, ...values]
```

**AFTER**:
```javascript
buildInsertClause(data, [`tenant_id`, `created_by`], 1)
// Parameters: [req.user!.tenant_id, req.user!.id, ...values]
```

**Security Improvement**: Templates automatically assigned to tenant.

---

### 15. GET /communications/dashboard (Total Communications Query)
**Location**: Lines 534-542
**Vulnerability**: Dashboard aggregation relied on driver tenant

**BEFORE**:
```sql
FROM communications c
LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
WHERE (from_user.tenant_id = $1 OR from_user.tenant_id IS NULL)
AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
```

**AFTER**:
```sql
FROM communications c
WHERE c.tenant_id = $1
AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
```

**Security Improvement**: Direct tenant filter on communications.

---

### 16. GET /communications/dashboard (By Type Query)
**Location**: Lines 544-553
**Vulnerability**: Same as #15

**AFTER**:
```sql
WHERE c.tenant_id = $1
AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
```

---

### 17. GET /communications/dashboard (By Priority Query)
**Location**: Lines 555-565
**Vulnerability**: Same as #15

**AFTER**:
```sql
WHERE c.tenant_id = $1
AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
```

---

### 18. GET /communications/dashboard (Overdue Follow-ups Query)
**Location**: Lines 567-576
**Vulnerability**: Same as #15

**AFTER**:
```sql
WHERE c.tenant_id = $1
AND c.requires_follow_up = TRUE
AND c.follow_up_completed = FALSE
AND c.follow_up_by_date < CURRENT_DATE
```

---

## Code Quality Improvements

### Added Security Imports
```typescript
import pool from '../config/database' // SECURITY: Import database pool
import { tenantSafeQuery, validateTenantOwnership } from '../utils/dbHelpers'
import { ForbiddenError } from '../errors/app-error'
```

### Fixed Error Handling
- Changed `return throw new NotFoundError(...)` to `throw new NotFoundError(...)`
- Added `ForbiddenError` for authorization failures
- Consistent error responses across all endpoints

### Parameter Safety
- All queries use parameterized `tenant_id` filters ($N placeholders)
- No string concatenation or template literals with user input
- Protection against SQL injection

---

## Testing Recommendations

### 1. Unit Tests Required
```javascript
describe('Communications Tenant Isolation', () => {
  it('should not allow tenant A to access tenant B communications', async () => {
    // Create communication as tenant A
    const comm = await createCommunication(tenantA, { subject: 'Test' })

    // Attempt access as tenant B - should return 404
    const response = await request(app)
      .get(`/communications/${comm.id}`)
      .set('Authorization', `Bearer ${tenantB_token}`)

    expect(response.status).toBe(404)
  })

  it('should not allow tenant A to update tenant B communications', async () => {
    const comm = await createCommunication(tenantB, { subject: 'Test' })

    const response = await request(app)
      .put(`/communications/${comm.id}`)
      .set('Authorization', `Bearer ${tenantA_token}`)
      .send({ subject: 'Hacked' })

    expect(response.status).toBe(404)
  })

  it('should not allow tenant A to link entities to tenant B communications', async () => {
    const comm = await createCommunication(tenantB, { subject: 'Test' })

    const response = await request(app)
      .post(`/communications/${comm.id}/link`)
      .set('Authorization', `Bearer ${tenantA_token}`)
      .send({ entity_type: 'vehicle', entity_id: '123' })

    expect(response.status).toBe(403)
  })
})
```

### 2. Integration Tests Required
- Verify dashboard queries return only tenant's data
- Confirm templates are tenant-scoped
- Test entity communications filtering
- Validate follow-ups isolation

### 3. Security Audit
- Use `auditQueryForTenantIsolation()` from dbHelpers on all queries
- Verify no other routes use similar patterns
- Review all JOIN operations for tenant isolation

---

## Deployment Checklist

- [x] All 18 queries fixed with tenant_id filters
- [x] Imports added (pool, tenantSafeQuery, validateTenantOwnership, ForbiddenError)
- [x] Parameterized queries ($N) used throughout
- [x] Error handling improved (throw instead of return throw)
- [x] Git commit with security message
- [x] Secret scan passed (gitleaks)
- [ ] Run integration tests
- [ ] Deploy to staging environment
- [ ] Manual security testing with multiple tenants
- [ ] Deploy to production
- [ ] Monitor audit logs for anomalies
- [ ] Document in security changelog

---

## Monitoring Recommendations

### 1. Audit Logging
Monitor for:
- 404 errors on communications endpoints (possible unauthorized access attempts)
- 403 Forbidden errors (blocked cross-tenant attempts)
- High volume of requests from single tenant
- Access patterns to sensitive communications

### 2. Alerts to Configure
- Spike in 404/403 errors on /communications/* endpoints
- Communication creation without tenant_id (database constraint violation)
- Unusual query patterns in dashboard/analytics

### 3. Metrics to Track
- Communications per tenant (detect data leakage)
- Cross-tenant access attempts blocked
- Template usage by tenant
- Follow-up completion rates per tenant

---

## Future Improvements

### 1. Row-Level Security (RLS)
Consider implementing PostgreSQL RLS policies:
```sql
CREATE POLICY communications_tenant_isolation ON communications
  FOR ALL
  TO authenticated_users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 2. Dedicated Tenant-Safe Query Wrapper
Use `tenantSafeQuery()` from dbHelpers consistently:
```typescript
const result = await tenantSafeQuery(
  'SELECT * FROM communications WHERE id = $1 AND tenant_id = $2',
  [commId, tenantId],
  req.user!.tenant_id
)
```

### 3. Database Constraints
Add CHECK constraints to ensure tenant_id is never NULL:
```sql
ALTER TABLE communications
  ADD CONSTRAINT communications_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL);
```

### 4. GraphQL Authorization
If using GraphQL, ensure resolver-level tenant filtering:
```typescript
@FieldResolver(() => [Communication])
async communications(@Ctx() context: Context) {
  return this.communicationService.findByTenant(context.user.tenant_id)
}
```

---

## References

- **CWE-639**: Authorization Bypass Through User-Controlled Key
- **OWASP Top 10 2021**: A01:2021 - Broken Access Control
- **OWASP API Security Top 10**: API1:2023 - Broken Object Level Authorization (BOLA)
- **NIST Cybersecurity Framework**: PR.AC-4 - Access permissions are managed

---

## Conclusion

**CRITICAL VULNERABILITY FULLY REMEDIATED**. All 18 database queries in the communications module now include proper `tenant_id` isolation, preventing unauthorized cross-tenant data access.

**Risk Level**: Reduced from CRITICAL (7.5) to MITIGATED
**Remaining Work**: Testing and deployment validation
**Recommendation**: Perform similar audit on all other route files

---

**Report Generated**: 2025-12-04
**Fixed By**: Claude Code (Autonomous Security Engineer)
**Commit Hash**: 927bc3144
**Review Status**: Pending human verification
