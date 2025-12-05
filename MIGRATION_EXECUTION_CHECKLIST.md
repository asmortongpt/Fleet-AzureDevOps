# Database Migration Execution Checklist

## Pre-Migration Requirements

**CRITICAL**: Do NOT execute migrations without completing these steps first!

### 1. Data Backfill Analysis Required

The following tables need tenant_id backfilled BEFORE making it NOT NULL:

- **drivers**: Check existing rows without tenant_id
- **fuel_transactions**: Check existing rows without tenant_id
- **work_orders**: Check existing rows without tenant_id

### 2. Backfill Query Templates

```sql
-- Step 1: Identify rows needing backfill
SELECT COUNT(*) FROM drivers WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM fuel_transactions WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM work_orders WHERE tenant_id IS NULL;
```

## Migration Execution Steps

### Step 1: Backup Database

```bash
# Create backup before any migration
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Execute Add Tenant ID Migration

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f api/migrations/20251203030620_add_tenant_id_to_tables.sql
```

### Step 3: Verify Backfill Completed

```sql
-- These should all return 0
SELECT COUNT(*) FROM drivers WHERE tenant_id IS NULL;
```

### Step 4: Execute NOT NULL Migration

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f api/migrations/20251203030620_make_tenant_id_not_null.sql
```

## Success Criteria

- All tables have tenant_id column
- All existing rows have valid tenant_id values
- tenant_id is NOT NULL in all required tables
- Foreign key constraints to tenants table exist
- Application starts without errors
- CRUD operations work correctly
- Multi-tenant isolation verified
