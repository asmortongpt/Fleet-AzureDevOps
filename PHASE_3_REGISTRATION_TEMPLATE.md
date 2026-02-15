# Phase 3: Route Registration Template
## Day 2 Implementation Guide

---

## Registration Process

### Template for Each Route

For each route in Priority A, follow this process:

#### Step 1: Pre-Registration Checklist

```markdown
## Route: [filename]
- [ ] File exists at `/api/src/routes/[filename]`
- [ ] File exports default Express Router
- [ ] Has `router.use(authenticateJWT)` on line X
- [ ] Database tables verified to exist
- [ ] No conflicting path with registered routes
- [ ] TypeScript types check out
```

#### Step 2: Add Import (Lines 39-250 in server.ts)

Find the appropriate category section and add:

```typescript
// Add alphabetically within category
import [name]Router from './routes/[filename]'
```

**Categories in server.ts:**
- Lines 38-37: Core Fleet Management
- Lines 49-60: Asset Management
- Lines 72-89: AI & Automation
- Lines 104-109: Policy & Permission
- Lines 183-252: Additional organized imports

#### Step 3: Add Registration (Lines 400-640 in server.ts)

Find appropriate section and add:

```typescript
app.use('/api/[path]', [name]Router)
```

**Registration sections:**
- Line 402-407: Batch endpoints
- Line 409-450: Core Fleet Management
- Line 451-595: All other routes

#### Step 4: Test Registration

```bash
# Compile TypeScript
npm run typecheck

# Build backend
npm run build

# Run tests
npm test

# Start dev server (should not error on startup)
npm run dev
```

#### Step 5: Verify Endpoint

```bash
# Test endpoint exists (in another terminal)
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/[path]

# Should return 200 or valid error (not 404)
```

---

## Priority A Routes - Step-by-Step

### Route 1: hos.ts (Hours of Service)

**Pre-Registration:**
```
- [ ] File: /api/src/routes/hos.ts (648 lines) ✅
- [ ] Router: default export ✅
- [ ] Auth: router.use(authenticateJWT) at line 15 ✅
- [ ] DB: hos_logs, dvir_records, hos_violations tables
- [ ] Path: /api/hos (no conflicts)
```

**Import Addition (after line 48, in comments section or with other compliance routes):**
```typescript
import hosRouter from './routes/hos'
```

**Registration Addition (after line 548, in Safety & Compliance section):**
```typescript
app.use('/api/hos', hosRouter)
```

**Test Endpoints:**
```bash
# After registering and restarting server
curl -X GET http://localhost:3001/api/hos/logs \
  -H "Authorization: Bearer $TOKEN"

# Should return: {"status": "ok", "data": [...]} or valid auth error
```

---

### Route 2: communications.ts (Universal Communications)

**Pre-Registration:**
```
- [ ] File: /api/src/routes/communications.ts (592 lines) ✅
- [ ] Router: default export ✅
- [ ] Auth: router.use(authenticateJWT) at line 23 ✅
- [ ] RBAC: requirePermission('communication:view:global') at line 32 ✅
- [ ] DB: communications, communication_entity_links, communication_templates
- [ ] Path: /api/communications (no conflicts)
```

**Import Addition (around line 60-70, with other core routes):**
```typescript
import communicationsRouter from './routes/communications'
```

**Registration Addition (after core fleet routes, ~line 450):**
```typescript
app.use('/api/communications', communicationsRouter)
```

**Test Endpoints:**
```bash
curl -X GET http://localhost:3001/api/communications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Should return paginated communications list
```

---

### Route 3: reimbursement-requests.ts (Financial Workflows)

**Pre-Registration:**
```
- [ ] File: /api/src/routes/reimbursement-requests.ts (725 lines) ✅
- [ ] Router: default export ✅
- [ ] Auth: Uses AuthRequest middleware ✅
- [ ] DB: reimbursement_requests, reimbursement_items, approvals
- [ ] Path: /api/reimbursement-requests (no conflicts)
```

**Import Addition (near line 180, with financial routes):**
```typescript
import reimbursementRouter from './routes/reimbursement-requests'
```

**Registration Addition (line 480-490, in Financial section):**
```typescript
app.use('/api/reimbursement-requests', reimbursementRouter)
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/reimbursement-requests \
  -H "Authorization: Bearer $TOKEN"
```

---

### Route 4: admin.routes.ts (Admin Dashboard)

**Pre-Registration:**
```
- [ ] File: /api/src/routes/admin.routes.ts (327 lines) ✅
- [ ] Router: default export ✅
- [ ] Auth: Router-level auth enforcement ✅
- [ ] DB: system_config, or status endpoints (may not need DB)
- [ ] Path: /api/admin (no conflicts)
```

**Import Addition (around line 230-240):**
```typescript
import adminRouter from './routes/admin.routes'
```

**Registration Addition (around line 604, after other admin routes):**
```typescript
app.use('/api/admin', adminRouter)
```

**Note:** Already have `/api/admin/jobs` registered; this is `/api/admin` root

**Test:**
```bash
curl -X GET http://localhost:3001/api/admin/config \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### Route 5: admin/users.routes.ts (User Management)

**Pre-Registration:**
```
- [ ] File: /api/src/routes/admin/users.routes.ts (595 lines) ✅
- [ ] Router: default export ✅
- [ ] Auth: Admin-only access ✅
- [ ] DB: users, user_roles, permissions
- [ ] Path: /api/admin/users (no conflicts with /api/admin/jobs)
```

**Import Addition (near line 240):**
```typescript
import adminUsersRouter from './routes/admin/users.routes'
```

**Registration Addition (near line 605):**
```typescript
app.use('/api/admin/users', adminUsersRouter)
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Full Changes for server.ts (Priority A)

### Import Section (Add these imports, keeping alphabetical order):

```typescript
// Around line 88-100
import adminRouter from './routes/admin.routes'
import adminUsersRouter from './routes/admin/users.routes'

// Around line 40-50
import hosRouter from './routes/hos'

// Around line 60-70
import communicationsRouter from './routes/communications'
import reimbursementRequestsRouter from './routes/reimbursement-requests'
```

### Registration Section (Add these use statements):

```typescript
// Around line 410-420 (Core Fleet Management)
app.use('/api/communications', communicationsRouter)

// Around line 487-500 (Financial & Cost Management - add reimbursement)
app.use('/api/reimbursement-requests', reimbursementRequestsRouter)

// Around line 542-550 (Safety & Compliance - add HOS)
app.use('/api/hos', hosRouter)

// Around line 605 (System Management - add admin routes)
app.use('/api/admin', adminRouter)
app.use('/api/admin/users', adminUsersRouter)
```

---

## Critical Pre-Registration Steps

### 1. Fix `/api/system` Conflict FIRST

**Before registering any routes, fix this conflict:**

In server.ts, change lines 450 and 603:

**Current (CONFLICT):**
```typescript
// Line 450
app.use('/api/system', systemMetricsRouter)

// Line 603
app.use('/api/system', systemConnectionsRouter)
```

**Fixed:**
```typescript
// Line 450
app.use('/api/system/metrics', systemMetricsRouter)

// Line 603
app.use('/api/system/connections', systemConnectionsRouter)
```

**Verify routes don't define their own paths:**
```bash
grep "router.get\|router.post" /api/src/routes/system-metrics.ts | head -3
# Should show: GET /, POST / (or relative paths)
# If shows /metrics, /connections then NO change needed
```

### 2. Verify Database Tables Exist

Before registering each route:

```bash
# SSH to database or use client
psql -h $DB_HOST -U $DB_USER -d fleet_db

# Check for required tables
\dt hos_logs dvir_records hos_violations
\dt communications communication_entity_links
\dt reimbursement_requests reimbursement_items
```

If tables missing, run migrations:
```bash
cd api
npm run migrate
npm run db:reset  # If needed
```

### 3. Type Check & Build

```bash
cd api
npm run typecheck
npm run build

# Should succeed with no errors
```

---

## Testing Checklist After Each Registration

After registering each route:

```bash
# 1. Restart dev server
pkill -f "tsx watch"
npm run dev

# Wait for: "Server running on http://localhost:3001"

# 2. Test basic endpoint
curl http://localhost:3001/api/health
# Should return: {"status":"ok",...}

# 3. Test new route (without auth first)
curl http://localhost:3001/api/hos/logs
# Should return 401/403 (auth error) - NOT 404 (route missing)

# 4. Test with auth token
TOKEN=$(npm run get-dev-token)  # If available
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/hos/logs

# 5. Run tests
npm test

# 6. Check logs for errors
# Look for: [ERROR], [WARN] in console output
```

---

## Troubleshooting

### Issue: npm run build fails

**Symptom:** `error TS7015: Element implicitly has an 'any' type`

**Solution:**
```bash
# Check imports are correct
grep "import.*Router from" server.ts | tail -5

# Verify file exists
ls -la api/src/routes/hos.ts

# Rebuild
npm run clean  # if available
npm run build
```

### Issue: Route returns 404

**Symptom:** `curl http://localhost:3001/api/hos/logs` → 404 Not Found

**Solution:**
```bash
# Check if route was registered
grep "app.use('/api/hos'" api/src/server.ts

# Check if import exists
grep "import.*hos" api/src/server.ts

# Restart server (might not have reloaded)
pkill -f "tsx watch"
npm run dev
```

### Issue: Route returns 401 but shouldn't

**Symptom:** Authenticated request returns 401 Unauthorized

**Solution:**
```bash
# Check token is valid
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/auth/me

# Check route has auth middleware
grep -A5 "const router" api/src/routes/hos.ts | grep authenticateJWT

# Try with dev user (if SKIP_AUTH=true)
# Token should be auto-injected
```

---

## Day 2 Schedule

| Time | Task | Expected Duration |
|------|------|-------------------|
| 09:00 | Fix `/api/system` conflict | 30 min |
| 09:30 | Register hos.ts | 30 min |
| 10:00 | Test hos.ts | 15 min |
| 10:15 | Register communications.ts | 30 min |
| 10:45 | Test communications.ts | 15 min |
| 11:00 | **Break/Buffer** | 15 min |
| 11:15 | Register reimbursement-requests.ts | 30 min |
| 11:45 | Test reimbursement-requests.ts | 15 min |
| 12:00 | Register admin.routes.ts | 30 min |
| 12:30 | Test admin.routes.ts | 15 min |
| 12:45 | **Lunch** | 45 min |
| 13:30 | Register admin/users.routes.ts | 30 min |
| 14:00 | Test admin/users.routes.ts | 15 min |
| 14:15 | Full test suite | 30 min |
| 14:45 | Code review & commit | 30 min |
| 15:15 | **Done** | ✅ |

---

## Git Commit Template

```bash
git add api/src/server.ts

git commit -m "feat(phase-3): register priority-a routes (hos, communications, reimbursement, admin)

- Register /api/hos for Hours of Service compliance tracking
- Register /api/communications for universal messaging system
- Register /api/reimbursement-requests for financial workflows
- Register /api/admin for admin dashboard endpoints
- Register /api/admin/users for user management

Fixes: /api/system path conflict (metrics vs connections)

All Priority A routes verified:
✅ Authentication middleware present
✅ Database schema exists
✅ No path conflicts
✅ Full test suite passing

PHASE 3 Week 1: Route Registration - Day 2/5"
```

---

## Success Criteria

Route registration is complete when:

1. ✅ All 5 Priority A routes imported in server.ts
2. ✅ All 5 Priority A routes registered with app.use()
3. ✅ `npm run build` succeeds with no errors
4. ✅ `npm run typecheck` passes
5. ✅ Dev server starts without crashes
6. ✅ Each route returns 200/401 (not 404)
7. ✅ All routes require auth (401 without token)
8. ✅ Full test suite passes
9. ✅ Code committed to git
10. ✅ `/api/system` conflict fixed

---

## Next Phase (Day 3+)

After Priority A is confirmed working:

1. **Day 3:** Validate Priority A in staging environment
2. **Days 4-5:** Register Priority B routes (5 files)
3. **Week 2:** Cleanup and consolidation
4. **Week 3:** Full E2E testing and deployment

---

## Reference Files

- **Full Report:** `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/PHASE_3_ROUTE_AUDIT_REPORT.md`
- **Quick Summary:** `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/ROUTE_AUDIT_SUMMARY.md`
- **Server Config:** `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/server.ts`
- **Route Directory:** `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/routes/`

---

**Ready to proceed with Day 2 registration?**

Follow the steps above in order. Each registration should take 10-15 minutes including testing.

Good luck! 🚀
