# Migration 032 - Quick Reference Guide

## Overview
**Migration Name**: Multi-Asset Vehicle Extensions
**Version**: 032
**Created**: 2025-11-17
**Tested**: 2025-11-19
**Status**: ✅ Approved for Deployment

## Quick Stats
- **New Columns**: 36 (28 on vehicles, 8 on maintenance_schedules)
- **New Tables**: 2 (asset_relationships, telemetry_equipment_events)
- **New Views**: 3
- **New Functions**: 2
- **New Triggers**: 1
- **New Indexes**: 12
- **Estimated Migration Time**: 2-5 seconds

## File Locations
```
Migration:     /home/user/Fleet/api/src/migrations/032_multi_asset_vehicle_extensions.sql
Rollback:      /home/user/Fleet/api/src/migrations/032_down_rollback.sql
Verification:  /home/user/Fleet/api/src/migrations/032_verification_script.sql
Test Report:   /home/user/Fleet/MIGRATION_032_TEST_REPORT.md
```

## Pre-Deployment Checklist

### Required Checks
- [ ] Backup production database
- [ ] Verify tenant_id column exists in vehicles table
- [ ] Confirm PostgreSQL version >= 12
- [ ] Check available disk space (minimal impact)
- [ ] Schedule maintenance window (optional - migration is backward compatible)

### Dependency Check
Migration 032 requires these tables to exist:
- ✅ vehicles
- ✅ maintenance_schedules
- ✅ users (for created_by FK)
- ✅ facilities (for location_id FK)
- ✅ drivers (for operator_id FK)

## Deployment Commands

### Apply Migration
```bash
psql -U [username] -d [database] -f api/src/migrations/032_multi_asset_vehicle_extensions.sql
```

### Verify Migration
```bash
psql -U [username] -d [database] -f api/src/migrations/032_verification_script.sql
```

### Rollback (if needed)
```bash
psql -U [username] -d [database] -f api/src/migrations/032_down_rollback.sql
```

## What This Migration Does

### 1. Extends Vehicles Table
Adds 28 new columns to support:
- **Asset Classification**: asset_category, asset_type, power_type
- **Multi-Metric Tracking**: pto_hours, aux_hours, cycle_count, primary_metric
- **Equipment Specs**: capacity_tons, lift_height_feet, bucket_capacity_yards, etc.
- **Operational Status**: operational_status, is_road_legal, requires_cdl
- **Relationships**: parent_asset_id, group_id, fleet_id, location_id

### 2. Creates Asset Relationships Table
Tracks combos like:
- Tractor-Trailer pairs (TOWS relationship)
- Equipment attachments (ATTACHED relationship)
- Cargo containers (CARRIES relationship)

### 3. Creates Telemetry Equipment Events Table
Stores equipment-specific telemetry:
- Engine hours, PTO hours, AUX hours, cycle counts
- Hydraulic pressure, boom angles, load weights
- Fault codes and warnings
- Job site and operator tracking

### 4. Extends Maintenance Schedules
Adds multi-metric maintenance triggers:
- PTO hours-based maintenance
- AUX hours-based maintenance
- Cycle count-based maintenance

### 5. Creates Helper Views
- `vw_active_asset_combos` - Active tractor-trailer pairs
- `vw_equipment_by_type` - Equipment inventory by type
- `vw_multi_metric_maintenance_due` - Maintenance due across all metrics

## Backward Compatibility

✅ **Fully Backward Compatible**
- All new columns are nullable
- Existing queries continue to work
- Existing data gets safe default values
- No application code changes required immediately

## Post-Deployment Verification

### Quick Check (30 seconds)
```sql
-- Count new columns on vehicles
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name LIKE 'asset_%' OR column_name LIKE 'pto_%';
-- Expected: 4+

-- Check new tables exist
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name IN ('asset_relationships', 'telemetry_equipment_events');
-- Expected: 2

-- Check views exist
SELECT COUNT(*) FROM information_schema.views
WHERE table_name LIKE 'vw_%asset%' OR table_name LIKE 'vw_%metric%';
-- Expected: 3
```

### Full Verification (2 minutes)
```bash
psql -U [username] -d [database] -f api/src/migrations/032_verification_script.sql > verification_output.txt
```

## Known Issues & Notes

### 1. tenant_id Dependency
The view `vw_equipment_by_type` expects a `tenant_id` column in the vehicles table. This column should exist from earlier migrations. If it doesn't exist, the view creation will fail (non-critical).

**Resolution**: Add `tenant_id` column before running migration 032, or recreate the view afterward.

### 2. Default Values
All existing vehicles will receive these defaults:
- asset_category: 'PASSENGER_VEHICLE'
- asset_type: 'OTHER'
- power_type: 'SELF_POWERED'
- primary_metric: 'ODOMETER'
- operational_status: 'AVAILABLE'

Update these values as needed after migration.

## Rollback Impact

⚠️ **WARNING**: Rolling back will result in data loss!

If you rollback after creating asset relationships or logging telemetry events, all that data will be permanently deleted.

**What Gets Deleted**:
- All records in asset_relationships table
- All records in telemetry_equipment_events table
- All asset_category, asset_type, and related field values
- All PTO hours, AUX hours, cycle count data

**What Stays**:
- All existing vehicle records
- All VIN, make, model, year data
- Odometer and engine_hours (original fields)

## Application Integration

### API Changes Needed (Phase 2)
After deploying this migration, implement:
1. Vehicle filtering by asset_category and asset_type
2. Asset relationship CRUD endpoints
3. Telemetry equipment event logging
4. Multi-metric maintenance schedule updates

### UI Changes Needed (Phase 4)
1. Add asset type selector to vehicle forms
2. Display equipment specs for heavy equipment
3. Show attached trailers for tractors
4. Multi-metric display on vehicle detail panels

## Testing Recommendations

### Staging Environment Test Plan
1. Apply migration to staging
2. Verify all tables/columns created
3. Test creating asset relationships
4. Test logging telemetry events
5. Test maintenance schedule with PTO hours trigger
6. Test rollback on a copy of staging
7. Re-apply migration

### Production Deployment
1. Schedule during low-traffic window (optional)
2. Take full database backup
3. Apply migration
4. Run verification script
5. Monitor logs for 15 minutes
6. Update application code (Phase 2+)

## Success Criteria

✅ Migration is successful when:
- All 36 columns added (28 + 8)
- Both new tables created
- All 3 views created
- No errors in PostgreSQL logs
- Existing vehicle queries return data
- Verification script shows all expected counts

## Support & Troubleshooting

### Common Issues

**Issue**: "column tenant_id does not exist"
**Fix**: Add tenant_id to vehicles table or skip the failing view

**Issue**: "relation vehicles does not exist"
**Fix**: Run base migrations first (migration 001-031)

**Issue**: "permission denied"
**Fix**: Ensure database user has CREATE, ALTER, DROP privileges

### Rollback Procedure
```bash
# 1. Backup current state (just in case)
pg_dump -U [username] -d [database] -t asset_relationships -t telemetry_equipment_events > migration_032_data_backup.sql

# 2. Run rollback
psql -U [username] -d [database] -f api/src/migrations/032_down_rollback.sql

# 3. Verify rollback
psql -U [username] -d [database] -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('asset_relationships', 'telemetry_equipment_events');"
# Expected: 0 rows
```

## Contact
For questions or issues with this migration, contact the Database Migration Team or refer to:
- Full Test Report: `/home/user/Fleet/MIGRATION_032_TEST_REPORT.md`
- Implementation Plan: `/home/user/Fleet/CODE_REUSE_MULTI_ASSET_PLAN.md`
- Task List: `/home/user/Fleet/IMPLEMENTATION_TASKS.md`

---

**Last Updated**: 2025-11-19
**Approved By**: Database Migration & Testing Specialist
**Status**: ✅ Ready for Staging Deployment
