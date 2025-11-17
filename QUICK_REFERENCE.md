# Fleet Management - Test Data Quick Reference

## 🚀 Quick Start

### Access Database
```bash
kubectl exec -it -n fleet-management-dev fleet-postgres-0 -- psql -U fleetadmin -d fleetdb_dev
```

### Check Data
```bash
# Quick count
kubectl exec -n fleet-management-dev fleet-postgres-0 -- psql -U fleetadmin -d fleetdb_dev -c "
  SELECT 'Tenants' as entity, COUNT(*) FROM tenants
  UNION ALL SELECT 'Users', COUNT(*) FROM users
  UNION ALL SELECT 'Vehicles', COUNT(*) FROM vehicles
  UNION ALL SELECT 'Drivers', COUNT(*) FROM drivers;
"
```

### Run Seeder
```bash
# TypeScript (comprehensive)
cd /Users/andrewmorton/Documents/GitHub/Fleet
ts-node scripts/seed-api-testdata.ts dev

# Bash (quick)
./scripts/seed-api-testdata.sh dev
```

### Verify Data
```bash
./scripts/verify-testdata.sh dev
```

## 🔑 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | Demo@123 | Admin |
| fleet@acme.com | Demo@123 | Fleet Manager |
| driver1@acme.com | Demo@123 | Driver |

**New Admin (API seeder):**
- testadmin@fleet.test / TestFleet@2024!

## 📊 Current Data (Dev Environment)

| Entity | Count |
|--------|-------|
| Tenants | 5 |
| Users | 30 |
| Drivers | 26 |
| Vehicles | 75 |
| Fuel Transactions | 305 |
| Maintenance Records | 160 |
| Work Orders | 90 |
| **TOTAL** | **699+** |

## 🌐 URLs

- **API:** https://fleet-dev.capitaltechalliance.com
- **Health:** https://fleet-dev.capitaltechalliance.com/health
- **Web UI:** https://fleet-dev.capitaltechalliance.com

## 📁 Files

### Scripts
- `/scripts/seed-api-testdata.ts` - TypeScript seeder
- `/scripts/seed-api-testdata.sh` - Bash seeder
- `/scripts/verify-testdata.sh` - Verification tool

### Docs
- `/TEST_DATA_DOCUMENTATION.md` - Complete guide
- `/TEST_DATA_SUMMARY.md` - Executive summary
- `/scripts/testdata-summary-report-dev.md` - Current state

## 🔍 Useful SQL Queries

### User Roles
```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```

### Vehicle Types
```sql
SELECT vehicle_type, status, COUNT(*)
FROM vehicles
GROUP BY vehicle_type, status;
```

### Recent Fuel Transactions
```sql
SELECT v.license_plate, f.transaction_date, f.gallons
FROM fuel_transactions f
JOIN vehicles v ON f.vehicle_id = v.id
ORDER BY f.transaction_date DESC LIMIT 10;
```

### Work Order Status
```sql
SELECT status, COUNT(*) FROM work_orders GROUP BY status;
```

## ⚠️ Known Issues

1. **API Authentication:** Column mismatch (status vs is_active)
   - **Impact:** Can't login via API currently
   - **Workaround:** Use direct database access
   - **Fix:** Update API code or run migration

## ✅ Status

**Overall:** 🟢 Excellent test data coverage
- Core entities: ✅ Complete
- Operational data: ✅ Rich history
- Multi-tenancy: ✅ Working
- API seeders: ✅ Ready
- Documentation: ✅ Complete

**Needs Work:**
- ❌ Fix API authentication
- ⚠️ Add GPS/telemetry data
- ⚠️ Add EV infrastructure
- ⚠️ Add safety policies

---

**Last Updated:** November 13, 2025
**Environment:** Development
