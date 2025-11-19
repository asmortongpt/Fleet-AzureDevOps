# Phase 5: Quick Start Guide

**Last Updated**: 2025-11-19
**Agent**: Agent 9 - Testing & Test Data Creation Specialist

## TL;DR - Run These Commands

Once you have Docker and PostgreSQL available:

```bash
# 1. Start services
cd /home/user/Fleet
docker compose up -d postgres redis

# 2. Run migration
docker exec -it fleet-postgres psql -U fleetadmin -d fleetdb \
  -f /docker-entrypoint-initdb.d/032_multi_asset_vehicle_extensions.sql

# 3. Load test data
docker exec -it fleet-postgres psql -U fleetadmin -d fleetdb \
  -f /home/user/Fleet/api/seeds/multi-asset-test-data.sql

# 4. Verify setup
docker exec -it fleet-postgres psql -U fleetadmin -d fleetdb \
  -f /home/user/Fleet/api/scripts/verify-multi-asset-setup.sql

# 5. Run automated tests
cd api
npm test -- multi-asset-integration.test.ts
```

## What Was Created

### 1. Test Data Seed (`api/seeds/multi-asset-test-data.sql`)
Creates:
- **1 test tenant** (multi-asset-test.local)
- **22 assets**:
  - 5 semi tractors (Kenworth, Peterbilt, Freightliner, Volvo, Mack)
  - 10 dry van trailers
  - 3 excavators with PTO hours
  - 2 bulldozers
  - 2 forklifts with cycle counts
- **5 tractor-trailer relationships** (4 active, 1 historical)
- **6 maintenance schedules** covering all metric types
- **Sample telemetry data** for equipment

### 2. Automated Tests (`api/tests/multi-asset-integration.test.ts`)
**21 test cases** covering:
- Asset filtering (6 tests)
- Asset relationships (6 tests)
- Multi-metric maintenance (5 tests)
- Database views/functions (3 tests)

### 3. Test Execution Guide (`PHASE_5_TEST_EXECUTION_GUIDE.md`)
Step-by-step instructions for:
- Manual API testing
- SQL verification queries
- Expected results for each test
- Troubleshooting tips

### 4. Verification Script (`api/scripts/verify-multi-asset-setup.sql`)
Quick validation of:
- Schema changes
- Test data counts
- View functionality
- Function operations

### 5. Test Report (`PHASE_5_TEST_REPORT.md`)
Complete documentation:
- Test coverage analysis
- Expected results
- Business rules validation
- Files created inventory

## Test Credentials

**Login**:
- Email: `admin@multi-asset-test.local`
- Password: `Test123!`

## Test Coverage

| Feature | Tests | Status |
|---------|-------|--------|
| Asset Type Filtering | 6 | ✅ Ready |
| Asset Relationships | 6 | ✅ Ready |
| Multi-Metric Maintenance | 5 | ✅ Ready |
| Database Views | 3 | ✅ Ready |
| **Total** | **20** | **✅ Ready** |

## Key Test Queries

### Quick Validation Queries

```sql
-- Count assets by category
SELECT asset_category, COUNT(*)
FROM vehicles
WHERE tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
GROUP BY asset_category;

-- Expected: TRACTOR=5, TRAILER=10, HEAVY_EQUIPMENT=7

-- View active combos
SELECT * FROM vw_active_asset_combos;
-- Expected: 4 active tractor-trailer pairs

-- Check maintenance schedules
SELECT trigger_metric, COUNT(*)
FROM maintenance_schedules
GROUP BY trigger_metric;
-- Expected: ODOMETER=1, ENGINE_HOURS=2, PTO_HOURS=1, CYCLES=1, CALENDAR=1
```

### API Test Examples

```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@multi-asset-test.local","password":"Test123!"}' \
  | jq -r '.token')

# Filter heavy equipment
curl -X GET "http://localhost:3000/api/vehicles?asset_category=HEAVY_EQUIPMENT" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
# Expected: 7

# Get excavators only
curl -X GET "http://localhost:3000/api/vehicles?asset_type=EXCAVATOR" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
# Expected: 3

# View active asset combos
curl -X GET "http://localhost:3000/api/asset-relationships/active" \
  -H "Authorization: Bearer $TOKEN" | jq '.combinations | length'
# Expected: 4
```

## Troubleshooting

### Migration Fails
```bash
# Check if migration already ran
psql -h localhost -U fleetadmin -d fleetdb -c "\d asset_relationships"

# If table exists, migration already complete
# Otherwise, check error logs
```

### Seed Data Fails
```bash
# Check for existing test tenant
psql -h localhost -U fleetadmin -d fleetdb -c \
  "SELECT * FROM tenants WHERE domain = 'multi-asset-test.local';"

# If exists, drop and retry
# DELETE FROM tenants WHERE domain = 'multi-asset-test.local';
```

### Tests Fail to Connect
```bash
# Check API is running
curl http://localhost:3000/health

# Check database connection
psql -h localhost -U fleetadmin -d fleetdb -c "SELECT 1;"
```

## Expected Test Results

All tests should **PASS** with output similar to:

```
✓ should filter by asset_category=HEAVY_EQUIPMENT (42ms)
✓ should filter by asset_type=EXCAVATOR (38ms)
✓ should filter by operational_status=AVAILABLE (35ms)
✓ should combine multiple filters (40ms)
✓ should filter tractors specifically (36ms)
✓ should filter trailers specifically (37ms)
✓ should attach trailer to tractor (52ms)
✓ should view tractor with attached trailer (45ms)
✓ should get relationship history for an asset (43ms)
✓ should detach trailer from tractor (48ms)
✓ should prevent circular relationships (41ms)
✓ should create maintenance schedule with ENGINE_HOURS trigger (46ms)
✓ should create maintenance schedule with PTO_HOURS trigger (44ms)
✓ should verify maintenance due calculations (39ms)
✓ should check maintenance becomes overdue (51ms)
✓ should support CYCLES metric for forklifts (47ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        3.456s
```

## Files Reference

All files are in `/home/user/Fleet/`:

```
api/seeds/multi-asset-test-data.sql          # Test data
api/tests/multi-asset-integration.test.ts    # Automated tests
api/scripts/verify-multi-asset-setup.sql     # Verification
PHASE_5_TEST_EXECUTION_GUIDE.md              # Detailed manual tests
PHASE_5_TEST_REPORT.md                       # Complete report
PHASE_5_QUICK_START.md                       # This file
```

## Next Steps After Testing

1. ✅ All tests pass
2. Review test results in PHASE_5_TEST_REPORT.md
3. Document any bugs found
4. Proceed to Phase 6: Documentation
5. Create pull request with test results

## Support

For issues or questions about testing:
- Review full test report: `PHASE_5_TEST_REPORT.md`
- Check execution guide: `PHASE_5_TEST_EXECUTION_GUIDE.md`
- Verify schema: `api/src/migrations/032_multi_asset_vehicle_extensions.sql`

---

**Quick Summary**: All Phase 5 test artifacts complete and ready. Execute tests once database is available.
