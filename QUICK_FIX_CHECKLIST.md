# Fleet Technical Fixes - Quick Reference Checklist

## 🔴 CRITICAL - Fix Immediately (Days 1-5)

- [ ] **1. Remove Hardcoded JWT Secrets**
  - Files: `api/src/routes/auth.ts`, `api/src/routes/microsoft-auth.ts`
  - Issue: `const JWT_SECRET = process.env.JWT_SECRET || 'changeme'`
  - Action: Throw error if env vars not set
  - Time: 1-2 days
  - Risk if not fixed: Authentication bypass, data breach

- [ ] **2. Fix Global Auth Bypass**
  - File: `api/src/server.ts` (lines 172-185)
  - Issue: `USE_MOCK_DATA` disables ALL authentication
  - Action: Only allow in development, verify not in production
  - Time: 1 day
  - Risk if not fixed: Unauthorized admin access

- [ ] **3. Add Rate Limiting to Auth**
  - Files: `api/src/routes/auth.ts`
  - Issue: No protection against brute force
  - Action: Max 5 login attempts per 15 minutes
  - Time: 1-2 days
  - Risk if not fixed: Account takeover via brute force

---

## 🟠 HIGH-PRIORITY - Fix in Weeks 1-2

- [ ] **4. Eliminate `any` Type Usage**
  - Scope: 60+ instances across API
  - Files: Multiple service and middleware files
  - Action: Create proper TypeScript interfaces
  - Time: 5-7 days
  - Impact: Prevents ~30% of runtime errors

- [ ] **5. Add Input Validation to Routes**
  - Scope: 10+ routes with unvalidated input
  - Files: `telematics.routes.ts`, `charging-stations.ts`, etc.
  - Action: Use Zod schemas for all request bodies
  - Time: 6-8 days
  - Impact: Prevents data corruption and injection attacks

- [ ] **6. Replace console.log with Logging**
  - Count: 31 instances in production code
  - Files: Mostly middleware and services
  - Action: Implement Winston logger
  - Time: 4-6 days
  - Impact: Better debugging, structured logs

- [ ] **7. Fix N+1 Query Issues**
  - Files: `api/src/middleware/permissions.ts`
  - Issue: Permission checks make N+1 queries
  - Action: Use JOINs instead of loops
  - Time: 6-8 days
  - Impact: 50-70% query reduction

- [ ] **8. Secure Dynamic SQL Table Names**
  - Files: `api/src/middleware/permissions.ts` (line 264)
  - Issue: Table names built from string matching
  - Action: Whitelist allowed tables
  - Time: 2-3 days
  - Impact: Prevents table name injection

- [ ] **9. Add Error Handling to Routes**
  - Count: 50+ endpoints missing error handling
  - Files: All route files in `api/src/routes/`
  - Action: Wrap all DB queries in try-catch
  - Time: 7-10 days
  - Impact: Reliable error messages, proper logging

---

## 🟡 MEDIUM-PRIORITY - Fix in Weeks 3-4

- [ ] **10. Replace SELECT * Queries**
  - Count: 202 instances
  - Files: 15+ route and service files
  - Action: List explicit columns in all SELECT statements
  - Time: 10-14 days
  - Impact: 5-15% performance improvement

- [ ] **11. Fix Permission Cache TTL**
  - File: `api/src/middleware/permissions.ts` (line 18-19)
  - Issue: Cache doesn't properly expire
  - Action: Implement proper TTL checking
  - Time: 4-5 days
  - Impact: Prevents stale permission issues

- [ ] **12. Fix Audit Logging Race Condition**
  - File: `api/src/middleware/audit.ts` (line 18)
  - Issue: Uses setImmediate without waiting
  - Action: Write logs before sending response
  - Time: 2-3 days
  - Impact: Reliable audit trails

- [ ] **13. Add Null Checks**
  - Scope: 30+ endpoints
  - Issue: Missing checks for empty query results
  - Action: Add guard clauses after DB queries
  - Time: 5-7 days
  - Impact: Prevents crashes

- [ ] **14. Implement Transactions**
  - Scope: Multi-step operations (15+ cases)
  - Files: `work-orders.ts`, `purchase-orders.ts`, etc.
  - Action: Create transaction helper function
  - Time: 6-8 days
  - Impact: Data consistency

- [ ] **15. Migrate to Redis Rate Limiting**
  - File: `api/src/middleware/permissions.ts` (line 425)
  - Issue: In-memory Map doesn't scale
  - Action: Use Redis-backed rate limiting
  - Time: 5-7 days
  - Impact: Works with multiple servers

---

## 📋 MEDIUM-PRIORITY - Fix in Weeks 5-6

- [ ] **16. Implement Structured Logging**
  - Scope: All logging statements
  - Action: Use Winston logger with context
  - Time: 5-7 days
  - Impact: Easier debugging and monitoring

- [ ] **17. Add Async Error Handling**
  - Scope: Service initialization code
  - Files: `dispatch.service.ts`, etc.
  - Action: Proper error propagation in async init
  - Time: 5-6 days
  - Impact: Prevents silent failures

- [ ] **18. Optimize Connection Pool**
  - File: `.env.production.template`
  - Issue: Settings may not scale
  - Action: Add monitoring and auto-tuning
  - Time: 2-3 days
  - Impact: Better resource usage

- [ ] **19. Standardize API Responses**
  - Scope: 50+ endpoints
  - Issue: Inconsistent response formats
  - Action: Create response envelope helper
  - Time: 8-10 days
  - Impact: Better API consistency

---

## 📚 LOWER-PRIORITY - Ongoing Improvements

- [ ] **20. Remove Code Duplication**
  - Scope: CRUD operations in multiple routes
  - Action: Implement generic repository pattern
  - Time: 10-12 days
  - Impact: 30-40% less code

- [ ] **21. Add Documentation**
  - Scope: All public interfaces
  - Action: Add JSDoc comments
  - Time: 6-8 days
  - Impact: Better onboarding

- [ ] **22. Pin Dependency Versions**
  - File: `api/package.json`
  - Action: Add version overrides
  - Time: 1-2 days
  - Impact: Reproducible builds

- [ ] **23. Add Performance Monitoring**
  - Scope: All endpoints
  - Action: Implement latency tracking
  - Time: 5-7 days
  - Impact: Identify bottlenecks

---

## Testing Checklist

For EACH fix, ensure:

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Security tests pass (for auth/permission changes)
- [ ] Performance regression tests pass
- [ ] Load tests (for scalability changes)
- [ ] Manual QA in staging environment
- [ ] Backwards compatibility checked

---

## Deployment Checklist

For EACH fix:

- [ ] Feature branch created
- [ ] Code reviewed by 2+ reviewers
- [ ] Tests passing on all platforms
- [ ] Staging environment tested
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Gradual rollout plan (10% → 50% → 100%)

---

## Progress Tracking

Track fixes in this format:

```
Fix #4: Eliminate `any` Type Usage
Status: [ ] Not Started / [ ] In Progress / [ ] Code Complete / [ ] Testing / [ ] Deployed
Branches: feature/eliminate-any-types
PR: #123
Merged: [ ] Yes / [ ] No
Date Started: ___________
Date Completed: ___________
Issues Found: ___________
```

---

## Key Files to Review

When starting each fix, check:

1. **Security Fixes** (1, 2, 3, 8):
   - Peer review mandatory
   - Security team review recommended
   - OWASP compliance check

2. **Performance Fixes** (7, 10, 12, 15):
   - Load test before/after
   - Query plan analysis
   - Resource monitoring

3. **Database Fixes** (5, 9, 13, 14):
   - Migration strategy required
   - Backup plan mandatory
   - Data integrity verification

---

## Quick Commands

```bash
# Find all console.log statements
grep -r "console\.log" api/src --include="*.ts" | wc -l

# Find SELECT * queries
grep -r "SELECT \*" api/src --include="*.ts" | wc -l

# Find untyped variables
grep -r ": any\|as any" api/src --include="*.ts" | wc -l

# Find missing try-catch in routes
grep -r "router\.\(get\|post\|put\|delete\)" api/src/routes --include="*.ts" | wc -l

# Check for hardcoded secrets
grep -r "JWT_SECRET.*'changeme'" api/src --include="*.ts"
```

---

## Estimated Timeline

- **Week 1**: Critical fixes (3 items) - 1 senior engineer
- **Weeks 2-3**: High-priority (6 items) - 1 senior + 1 junior engineer
- **Weeks 4-6**: Medium-priority (7 items) - 1 senior + 1 junior engineer
- **Weeks 7-12**: Lower-priority (7 items) - 1 engineer at 50%

**Total: 8-12 weeks with 2 engineers**

