# Mock Data Removal - Comprehensive Verification Plan

**Date:** 2026-02-06
**Objective:** Guarantee ZERO mock data and verify production data flows through entire stack

---

## Phase 1: Database Verification (5 min)

### 1.1 Data Existence Check
- [ ] Verify tenants table has CTA tenant
- [ ] Verify users table has 20+ driver users with names
- [ ] Verify drivers table has 20+ drivers linked to users
- [ ] Verify vehicles table has 50+ vehicles with real GPS
- [ ] Verify work_orders table has 150+ work orders
- [ ] Verify inspections table has 75+ inspections
- [ ] Verify fuel_transactions table has 200+ fuel transactions

### 1.2 Data Quality Check
- [ ] No vehicles have NULL/0 GPS coordinates
- [ ] All drivers link to valid users (foreign key integrity)
- [ ] All vehicles have valid status values
- [ ] All work orders have valid VMRS codes
- [ ] All inspections have required form_data jsonb

### 1.3 Relationship Check
- [ ] drivers.user_id → users.id (all valid)
- [ ] vehicles.tenant_id → tenants.id (all valid)
- [ ] work_orders.vehicle_id → vehicles.id (all valid)
- [ ] inspections.driver_id → drivers.id (all valid)
- [ ] fuel_transactions.vehicle_id → vehicles.id (all valid)

**Expected Result:** Database has 500+ real records with valid relationships

---

## Phase 2: Backend API Verification (5 min)

### 2.1 API Server Health
- [ ] API server is running on port 3000
- [ ] Health check endpoint responds
- [ ] No console errors in server logs

### 2.2 API Endpoint Data
- [ ] GET /api/v1/vehicles returns 100+ vehicles
- [ ] GET /api/v1/drivers returns 60+ drivers
- [ ] GET /api/v1/work-orders returns 100+ work orders
- [ ] GET /api/v1/inspections returns 75+ inspections
- [ ] GET /api/v1/fuel-transactions returns 100+ fuel transactions

### 2.3 API Data Quality
- [ ] Vehicle responses have latitude/longitude (not 0,0)
- [ ] Driver responses have first_name/last_name
- [ ] All responses have valid UUIDs
- [ ] No responses contain "mock", "fake", "test" in data
- [ ] No empty arrays when database has data

**Expected Result:** All API endpoints return real production data

---

## Phase 3: Frontend Code Audit (10 min)

### 3.1 Mock Data Search
- [ ] No mockData imports in src/ (excluding tests/stories)
- [ ] No "TODO: mock" or "TODO: placeholder" comments
- [ ] No hardcoded fake GPS coordinates
- [ ] No emulator fallback code
- [ ] No empty array defaults that bypass API

### 3.2 Hook Inspection
- [ ] use-api.ts: No GPS emulator fallback
- [ ] use-reactive-*.ts: All return API data or loading state
- [ ] No hooks with hardcoded empty arrays
- [ ] All hooks use React Query properly

### 3.3 Component Inspection
- [ ] No components with hardcoded vehicle/driver data
- [ ] All data comes from hooks/context
- [ ] Loading states show spinners (not empty data)
- [ ] Error states show error messages (not empty data)

**Expected Result:** Zero mock data in production code

---

## Phase 4: TypeScript Build Verification (5 min)

### 4.1 Type Checking
- [ ] npm run typecheck passes with 0 errors
- [ ] All interfaces properly defined
- [ ] No 'any' types in production code
- [ ] No missing type definitions

### 4.2 Linting
- [ ] npm run lint passes
- [ ] No unused imports
- [ ] No console.log in production code

**Expected Result:** Clean TypeScript build

---

## Phase 5: Frontend Build & Run (10 min)

### 5.1 Development Build
- [ ] npm run dev starts without errors
- [ ] Vite dev server runs on port 5173
- [ ] No console errors in terminal
- [ ] HMR (Hot Module Replacement) works

### 5.2 Production Build
- [ ] npm run build completes successfully
- [ ] No build warnings
- [ ] Output dist/ directory created
- [ ] Build size reasonable (<5MB)

**Expected Result:** Frontend builds successfully

---

## Phase 6: Frontend Data Flow Verification (10 min)

### 6.1 Network Requests
- [ ] Browser makes API calls to /api/v1/vehicles
- [ ] Browser makes API calls to /api/v1/drivers
- [ ] API responses contain real data (not empty)
- [ ] No 404 errors in Network tab
- [ ] No CORS errors

### 6.2 UI Data Display
- [ ] FleetHub shows 100+ vehicles on map
- [ ] Vehicle cards show real make/model/VIN
- [ ] Vehicle GPS markers at correct Virginia locations
- [ ] DriversHub shows 60+ drivers with names
- [ ] Dashboard stats show real numbers (not 0)

### 6.3 Loading States
- [ ] Loading spinner shows during data fetch
- [ ] No "flash of empty content"
- [ ] Skeleton loaders work properly
- [ ] Loading → Data transition smooth

### 6.4 Error States
- [ ] Stop API server → UI shows error message (not empty data)
- [ ] Invalid endpoint → UI shows error message
- [ ] Network offline → UI shows offline message

**Expected Result:** Frontend displays real production data from API

---

## Phase 7: End-to-End Integration Test (5 min)

### 7.1 User Flow Test
- [ ] Navigate to FleetHub
- [ ] See vehicles on map with real GPS
- [ ] Click vehicle → Detail panel shows real data
- [ ] Navigate to DriversHub
- [ ] See drivers with real names
- [ ] Click driver → Detail shows linked vehicles

### 7.2 Real-Time Features
- [ ] Map markers update when data changes
- [ ] Dashboard metrics update
- [ ] No stale data displayed

**Expected Result:** Complete user journey works with production data

---

## Phase 8: Final Verification (5 min)

### 8.1 Documentation Check
- [ ] DATABASE_SCHEMA.md is accurate
- [ ] MOCK_DATA_REMOVAL_SUMMARY.md is complete
- [ ] All migration files documented
- [ ] README updated with production data info

### 8.2 Git Status
- [ ] No uncommitted changes to production code
- [ ] All migration files committed
- [ ] Documentation files committed

### 8.3 Deployment Readiness
- [ ] .env.production has no mock flags
- [ ] All secrets in Azure Key Vault
- [ ] Build passes
- [ ] Tests pass

**Expected Result:** System ready for production deployment

---

## Success Criteria (ALL MUST PASS)

| Criterion | Status | Notes |
|-----------|--------|-------|
| Database has 500+ real records | ❌ Not verified | Run script |
| All vehicles have real GPS | ❌ Not verified | Run script |
| API returns real data | ❌ Not verified | Run script |
| No mock data in src/ | ❌ Not verified | Run script |
| TypeScript builds cleanly | ❌ Not verified | Run script |
| Frontend runs without errors | ❌ Not verified | Run script |
| UI displays production data | ❌ Not verified | Manual test |
| Loading states work | ❌ Not verified | Manual test |
| Error states work | ❌ Not verified | Manual test |

---

## Automated Verification Script

Run: `bash infrastructure/verify-no-mock-data.sh`

This script performs all automated checks (Phases 1-5) and reports:
- ✅ PASS: All checks passed
- ❌ FAIL: Shows which checks failed and why

Manual verification required for Phase 6-7 (browser testing).

---

## Rollback Plan

If verification fails:
1. Review failure output from script
2. Fix identified issues
3. Re-run verification script
4. Do NOT deploy until all checks pass

---

## Timeline

- Phase 1-5 (Automated): 30 minutes
- Phase 6-7 (Manual): 15 minutes
- Phase 8 (Final): 5 minutes
- **Total: 50 minutes**

---

## Contact

For issues with verification script:
- Script location: `infrastructure/verify-no-mock-data.sh`
- Logs location: `/tmp/mock-data-verification-*.log`
- Documentation: This file
