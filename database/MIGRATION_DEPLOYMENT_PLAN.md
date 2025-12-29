# Database Migration Deployment Plan

## Overview

This document outlines the safe deployment strategy for database migrations in the Fleet Management System.

## Current State

**Database**: PostgreSQL 15
**Migration Tool**: Drizzle ORM
**Schema Location**: `server/db/schema.ts`
**Migrations Directory**: `server/migrations/`

## Migration Strategy

### Development Environment

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migration to dev database
npm run db:migrate

# Verify schema
npm run db:push
```

### Staging Environment

```bash
# 1. Backup database
pg_dump -h STAGING_HOST -U postgres -d fleetdb > backup-$(date +%Y%m%d).sql

# 2. Apply migration (dry-run first)
npm run migrate:dry-run

# 3. Apply actual migration
npm run migrate:deploy

# 4. Verify data integrity
npm run db:verify

# 5. Run smoke tests
npm run test:smoke
```

### Production Environment

**Pre-Deployment Checklist:**
- [ ] All migrations tested in staging
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Monitoring alerts configured

**Deployment Steps:**

```bash
# STEP 1: Pre-Deployment Backup (CRITICAL)
export BACKUP_FILE="fleet-prod-backup-$(date +%Y%m%d-%H%M%S).sql"
pg_dump \
  -h fleet-production-db.postgres.database.azure.com \
  -U fleetadmin \
  -d fleetdb \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$BACKUP_FILE"

# Verify backup
echo "Backup size: $(du -h $BACKUP_FILE)"

# Upload to Azure Storage
az storage blob upload \
  --account-name fleetproductionstor \
  --container-name backups \
  --file "$BACKUP_FILE" \
  --name "$(date +%Y/%m)/$BACKUP_FILE"

# STEP 2: Enable Maintenance Mode (if applicable)
# This prevents new writes during migration

# STEP 3: Run Migration (with connection pooling disabled)
export DATABASE_URL="postgresql://fleetadmin:PASSWORD@fleet-production-db.postgres.database.azure.com/fleetdb?sslmode=require"

# Dry run first (no changes)
npx drizzle-kit push --dry-run

# Apply migration
npx drizzle-kit push

# Or use custom migration script:
npm run migrate:production

# STEP 4: Verify Migration
psql "$DATABASE_URL" << EOF
-- Check table count
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Verify critical tables
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
EOF

# STEP 5: Run Post-Migration Scripts
npm run migrate:seed:production  # If needed

# STEP 6: Verify Application Health
curl -f https://fleet-production-app.azurewebsites.net/api/health || exit 1

# STEP 7: Run Smoke Tests
npm run test:smoke:production

# STEP 8: Disable Maintenance Mode
# Allow normal traffic to resume

# STEP 9: Monitor for Errors
# Watch Application Insights for 30 minutes
```

## Rollback Procedure

If migration fails or causes issues:

```bash
# IMMEDIATE ROLLBACK (< 5 minutes after deployment)

# 1. Stop application traffic
az webapp stop --name fleet-production-app --resource-group fleet-production-rg

# 2. Restore from backup
psql "$DATABASE_URL" < "$BACKUP_FILE"

# 3. Restart application with previous version
az webapp start --name fleet-production-app --resource-group fleet-production-rg

# 4. Verify rollback
npm run test:smoke:production
```

**Point-in-Time Restore (if backup restore fails):**

```bash
# Restore to specific timestamp
az postgres flexible-server restore \
  --resource-group fleet-production-rg \
  --name fleet-production-db-restored \
  --source-server fleet-production-db \
  --restore-time "2025-01-15T10:00:00Z"

# Update app to point to restored database
az webapp config appsettings set \
  --name fleet-production-app \
  --resource-group fleet-production-rg \
  --settings DATABASE_URL="postgresql://..."
```

## Migration Scripts

### Package.json Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "migrate:dry-run": "drizzle-kit push:pg --dry-run",
    "migrate:deploy": "node scripts/migrate-deploy.js",
    "migrate:rollback": "node scripts/migrate-rollback.js",
    "migrate:verify": "node scripts/migrate-verify.js",
    "migrate:seed:production": "node scripts/seed-production.js"
  }
}
```

### Deploy Script Template

Create `scripts/migrate-deploy.js`:

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployMigration() {
  console.log('🚀 Starting migration deployment...');

  // 1. Verify environment
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  // 2. Create backup
  console.log('📦 Creating backup...');
  const backupFile = `backup-${Date.now()}.sql`;
  execSync(`pg_dump ${process.env.DATABASE_URL} > ${backupFile}`);
  console.log(`✅ Backup created: ${backupFile}`);

  // 3. Run migration
  console.log('⚙️ Running migration...');
  try {
    execSync('npx drizzle-kit push:pg', { stdio: 'inherit' });
    console.log('✅ Migration successful');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('💾 Backup available at:', backupFile);
    process.exit(1);
  }

  // 4. Verify
  console.log('✔️ Verifying migration...');
  execSync('node scripts/migrate-verify.js', { stdio: 'inherit' });

  console.log('🎉 Migration deployment complete!');
}

deployMigration().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
```

## Zero-Downtime Migration Strategy

For breaking schema changes that require zero downtime:

### Phase 1: Additive Changes (Week 1)
```sql
-- Add new columns (nullable initially)
ALTER TABLE vehicles ADD COLUMN new_field VARCHAR(255);

-- Add new indexes
CREATE INDEX CONCURRENTLY idx_vehicles_new_field ON vehicles(new_field);

-- Add new tables
CREATE TABLE new_feature (...);
```

**Deploy**: App continues using old fields, new fields remain NULL

### Phase 2: Dual-Write Period (Week 2)
```javascript
// Application writes to BOTH old and new fields
await db.vehicles.update({
  id: vehicleId,
  oldField: value,  // Keep writing to old field
  newField: value   // Also write to new field
});
```

**Deploy**: Data is being written to both locations

### Phase 3: Backfill Data (Week 2)
```sql
-- Backfill new column from old column
UPDATE vehicles
SET new_field = old_field
WHERE new_field IS NULL;

-- Verify data consistency
SELECT COUNT(*) FROM vehicles WHERE new_field != old_field;
```

### Phase 4: Switch Reads (Week 3)
```javascript
// Application reads from new field only
const vehicle = await db.vehicles.findFirst({
  select: { newField: true }  // Use new field
});
```

**Deploy**: Reading from new field, still writing to both

### Phase 5: Drop Old Field (Week 4)
```sql
-- Remove old column
ALTER TABLE vehicles DROP COLUMN old_field;

-- Remove old indexes
DROP INDEX IF EXISTS idx_vehicles_old_field;
```

**Deploy**: Fully migrated to new schema

## Common Migration Patterns

### Adding a Column
```sql
-- Safe: nullable column
ALTER TABLE vehicles ADD COLUMN status VARCHAR(50);

-- Risky: NOT NULL without default
-- DON'T DO THIS:
ALTER TABLE vehicles ADD COLUMN required_field VARCHAR(50) NOT NULL;

-- DO THIS instead:
ALTER TABLE vehicles ADD COLUMN required_field VARCHAR(50) DEFAULT 'pending';
ALTER TABLE vehicles ALTER COLUMN required_field DROP DEFAULT;
```

### Dropping a Column
```sql
-- Phase 1: Stop using column in application (deploy app first)
-- Phase 2: Drop column (deploy migration)
ALTER TABLE vehicles DROP COLUMN deprecated_field;
```

### Renaming a Column (Zero Downtime)
```sql
-- Don't use ALTER TABLE RENAME - it breaks running apps
-- Instead: Add new column, dual-write, backfill, drop old

-- Step 1: Add new column
ALTER TABLE vehicles ADD COLUMN vehicle_status VARCHAR(50);

-- Step 2: Backfill
UPDATE vehicles SET vehicle_status = status;

-- Step 3: App uses new column (deploy app)

-- Step 4: Drop old column
ALTER TABLE vehicles DROP COLUMN status;
```

### Adding an Index
```sql
-- Use CONCURRENTLY to avoid locking table
CREATE INDEX CONCURRENTLY idx_vehicles_status ON vehicles(status);

-- Without CONCURRENTLY, table is locked during index creation
```

### Changing Column Type
```sql
-- Safe: expanding a type
ALTER TABLE vehicles ALTER COLUMN license_plate TYPE VARCHAR(20);

-- Risky: shrinking or changing type
-- Use add-backfill-drop pattern instead

-- Step 1: Add new column
ALTER TABLE vehicles ADD COLUMN license_plate_v2 VARCHAR(10);

-- Step 2: Backfill with conversion
UPDATE vehicles
SET license_plate_v2 = SUBSTRING(license_plate, 1, 10);

-- Step 3: App uses new column

-- Step 4: Drop old column
ALTER TABLE vehicles DROP COLUMN license_plate;
ALTER TABLE vehicles RENAME COLUMN license_plate_v2 TO license_plate;
```

## Monitoring & Alerts

### Critical Metrics to Monitor

1. **Migration Duration**: Should complete in < 5 minutes
2. **Connection Pool**: Monitor for connection exhaustion
3. **Lock Wait Time**: Alert if > 100ms
4. **Error Rate**: Spike in application errors
5. **Response Time**: Degradation during migration

### Application Insights Queries

```kusto
// Monitor migration performance
traces
| where message contains "migration"
| summarize
    AvgDuration = avg(duration),
    Count = count()
  by operation_Name
| order by AvgDuration desc

// Detect migration failures
exceptions
| where outerMessage contains "migration"
| summarize Count = count() by problemId
| order by Count desc

// Database connection issues
dependencies
| where type == "SQL"
| where success == false
| summarize FailureCount = count() by name
```

## Testing Strategy

### Pre-Production Testing

1. **Unit Tests**: Test migration logic
2. **Integration Tests**: Verify schema changes
3. **Load Tests**: Ensure performance under load
4. **Rollback Tests**: Practice rollback procedure

### Migration Test Checklist

- [ ] Migration runs successfully on clean database
- [ ] Migration runs successfully on database with existing data
- [ ] Migration is idempotent (can run multiple times safely)
- [ ] Rollback procedure tested and documented
- [ ] Performance impact measured (< 5 min for production)
- [ ] Zero downtime verified for critical tables
- [ ] All indexes created with CONCURRENTLY
- [ ] Foreign key constraints preserved
- [ ] Data integrity constraints validated

## Security Considerations

1. **Credentials**: Use Azure Key Vault for database credentials
2. **Encryption**: Ensure SSL/TLS for all database connections
3. **Audit Logging**: Log all migration activities
4. **Access Control**: Limit migration execution to authorized personnel
5. **Backup Encryption**: Encrypt backups at rest and in transit

## Communication Plan

### Pre-Migration (24 hours before)
- Email to all stakeholders
- Slack announcement in #engineering
- Update status page

### During Migration
- Real-time updates in Slack
- Monitor Application Insights dashboard
- Keep rollback team on standby

### Post-Migration
- Success/failure notification
- Performance report
- Lessons learned document

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Zero-Downtime Migrations](https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY)

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
**Owner**: Fleet Engineering Team
