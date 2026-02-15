# Route Audit Summary - Quick Reference

**Date:** February 14, 2026
**Total Routes:** 217 files
**Registered:** 171 (79%)
**Unregistered:** 46 (21%)

---

## Critical Findings

### 1. Path Conflict (MUST FIX)
```
❌ CONFLICT: /api/system
  - systemMetricsRouter (line 450)
  - systemConnectionsRouter (line 603)
```
**Action:** Rename to `/api/system/metrics` and `/api/system/connections`

### 2. High-Value Unregistered Routes (MUST REGISTER)

| Priority | File | Size | Impact |
|----------|------|------|--------|
| **A** | hos.ts | 648 | DOT compliance - regulatory |
| **A** | communications.ts | 592 | Core messaging feature |
| **A** | reimbursement-requests.ts | 725 | Financial workflows |
| **A** | admin.routes.ts | 327 | Admin dashboards |
| **A** | admin/users.routes.ts | 595 | User management |
| **B** | attachments.routes.ts | 704 | File handling |
| **B** | inventory.routes.ts | 991 | Parts tracking |
| **B** | ai-insights.routes.ts | 768 | Advanced analytics |

### 3. Duplicate Implementations (CONSOLIDATE)

| Feature | Count | Status |
|---------|-------|--------|
| Health checks | 4 | 3 registered, 1 dynamic |
| AI chat | 4 | 1 registered, 3 unregistered |
| Auth routes | 3 | 2 registered, 1 duplicate |
| Incidents | 3 | All registered, different endpoints |

### 4. Cleanup Candidates (REMOVE)

```
- ai.chat.ts (23 lines) - stub
- ai.plan.ts (23 lines) - stub
- ai.tool.ts (30 lines) - stub
- example-di.routes.ts - example code
- maps-test.ts - test code
- test-routes.ts - test code
- paginationRoute.ts - example code
- production-ready-api.ts - template
- route-emulator.routes.ts - incomplete
- + 5 more .example.ts files
```

Total cleanup: ~3,000 lines

---

## Security Findings

### Unregistered Routes Auth Coverage

✅ **SAFE** (have authenticateJWT):
- hos.ts
- communications.ts
- reimbursement-requests.ts
- admin.routes.ts
- admin/users.routes.ts
- ai-insights.routes.ts

❌ **UNSAFE** (no auth - should be removed anyway):
- example-di.routes.ts
- maps-test.ts
- test-routes.ts
- paginationRoute.ts
- production-ready-api.ts

⚠️ **NEEDS REVIEW**:
- database.routes.ts (admin-only access?)
- performance.routes.ts (permission checks needed?)

---

## Registration Checklist for Phase 3 Week 1

### Day 1 (Thursday) - ✅ COMPLETED
- [x] Audit all 217 routes
- [x] Identify registration status
- [x] Find path conflicts
- [x] Security review
- [x] Create report

### Day 2 (Friday) - NEXT
- [ ] Fix `/api/system` conflict (1-2 hrs)
- [ ] Register Priority A routes (2-3 hrs per route):
  - hos.ts
  - communications.ts
  - reimbursement-requests.ts
  - admin.routes.ts
  - admin/users.routes.ts
- [ ] Run full test suite (1 hr)

### Day 3 (Monday) - FOLLOW-UP
- [ ] Verify Priority A routes work end-to-end
- [ ] Database schema validation
- [ ] Commit changes

### Days 4-5 (Tuesday-Wednesday) - PHASE B
- [ ] Register Priority B routes (5 files, ~8 hrs)
- [ ] Test & commit

### Week 2 - CLEANUP & CONSOLIDATION
- [ ] Remove example/test files (~14 files, ~3,000 lines)
- [ ] Consolidate health checks
- [ ] Consolidate AI chat
- [ ] E2E testing

---

## Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total route files | 217 | 📊 Large codebase |
| Unregistered | 46 | ⚠️ 21% of routes missing |
| Path conflicts | 1 | ❌ Must fix |
| Example/test files | ~14 | 📝 Can cleanup |
| High-value unregistered | 5 | 🔴 Priority A |
| Duplicate implementations | 4 | 🟡 Priority B |
| Database dependencies | 8+ | ✅ Most exist |

---

## File Locations

**Main route directory:** `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/`

**Key files for this phase:**
- `server.ts` - Route registration hub (1200+ lines)
- `hos.ts` - Hours of Service compliance
- `communications.ts` - Universal messaging
- `reimbursement-requests.ts` - Financial workflows
- `admin.routes.ts` - Admin dashboard
- `admin/users.routes.ts` - User management
- `admin/configuration.ts` - System config
- `attachments.routes.ts` - File handling
- `inventory.routes.ts` - Parts tracking

---

## Estimated Timeline

| Phase | Routes | Estimate | Start |
|-------|--------|----------|-------|
| A: Critical | 5 | 2-3 days | Feb 14 |
| B: Important | 5 | 2-3 days | Feb 17 |
| C: Secondary | 3-5 | 1-2 days | Feb 20 |
| D: Cleanup | ~14 | 1 day | Feb 20 |
| Testing | All | 3-5 days | Throughout |

**Total: ~2 weeks for complete registration**

---

## Emergency Contacts / Escalations

### If Issues Found:
1. Database schema missing → Check migrations in `api/src/db/migrations/`
2. Auth failures → Review middleware in `api/src/middleware/auth.ts`
3. Path conflicts → Check `server.ts` line numbers
4. Test failures → Run `npm test` in `api/` directory

---

## References

- Full audit report: `PHASE_3_ROUTE_AUDIT_REPORT.md`
- Server registration: `api/src/server.ts`
- Routes directory: `api/src/routes/`
- Middleware auth: `api/src/middleware/auth.ts`
- Database schema: `api/src/db/schema.ts`

---

**Next Step:** Proceed with Day 2 registration of Priority A routes per PHASE_3_ROUTE_AUDIT_REPORT.md Section 12.
