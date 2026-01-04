# Database Migration Guide

Quick reference for database migrations in Radio Fleet Dispatch.

## Quick Start

### 1. Set Database URL

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/radio_fleet"
```

### 2. Apply Initial Schema

```bash
cd services/api
alembic upgrade head
```

This creates all 12 tables with proper indexes, constraints, and relationships.

## Verify Migration

```bash
# Check current version
alembic current

# Should output:
# 001 (head)

# View history
alembic history

# Test database connection
python -c "from app.core.database import sync_engine; print(sync_engine.connect())"
```

## Table Overview

After running the initial migration, you'll have:

| Table | Purpose | Key Features |
|-------|---------|-------------|
| organizations | Multi-tenant isolation | Feature flags, operation modes |
| users | User accounts | Azure AD OIDC, role-based access |
| radio_channels | Audio sources | SIP/HTTP/File/API support |
| transmissions | Radio traffic | AI transcription, entity extraction |
| incidents | Emergency tracking | Workflow, priority, location |
| tasks | Action items | SLA tracking, checklists |
| task_checklists | Sub-tasks | Ordered items, completion tracking |
| assets | Vehicle/equipment | Telematics, status, location |
| crews | Team management | Members, assignments, dispatch |
| audit_logs | Compliance trail | Immutable, complete state tracking |
| webhooks | External integrations | Event-driven, failure tracking |
| policies | Automation rules | YAML-based, priority-based |

## Common Workflows

### Create a New Migration

```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "Add user preferences field"

# Manual migration
alembic revision -m "Add custom index for performance"
```

### Apply Migrations

```bash
# Apply all pending
alembic upgrade head

# Apply specific version
alembic upgrade <revision_id>

# Show SQL without applying
alembic upgrade head --sql > migration.sql
```

### Rollback Migrations

```bash
# Rollback last migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_id>

# Rollback all (WARNING: deletes all data!)
alembic downgrade base
```

### Check Status

```bash
# Current version
alembic current

# Show all migrations
alembic history

# Show pending migrations
alembic history --verbose
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Test migration on staging database
- [ ] Backup production database
- [ ] Review migration SQL (`alembic upgrade head --sql`)
- [ ] Estimate downtime (if any)
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window (if needed)

### Deployment Steps

```bash
# 1. Backup database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migrations
cd services/api
alembic upgrade head

# 3. Verify application starts
python -m app.main

# 4. Monitor logs and metrics
```

### Rollback Procedure

```bash
# If issues detected:

# 1. Rollback migration
alembic downgrade -1

# 2. Restart application with previous code version

# 3. If data corruption, restore from backup
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup_20251017_180000.sql
```

## Development Tips

### Test Migration Locally

```bash
# Apply migration
alembic upgrade head

# Test application
pytest

# Rollback to verify downgrade works
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### Reset Local Database

```bash
# Drop and recreate (WARNING: deletes all data!)
alembic downgrade base
alembic upgrade head
```

### Generate Migration from Model Changes

```bash
# 1. Update models in app/models/
# 2. Generate migration
alembic revision --autogenerate -m "Description"

# 3. Review generated file in alembic/versions/
# 4. Edit if needed (auto-generate isn't perfect)
# 5. Test migration
alembic upgrade head
```

## Troubleshooting

### "Table already exists" Error

```bash
# Check if tables were created outside Alembic
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"

# If tables exist, stamp database with current version
alembic stamp head
```

### "Target database is not up to date" Error

```bash
# Check current version
alembic current

# View migration history
alembic history

# Upgrade to head
alembic upgrade head
```

### Migration Conflicts

```bash
# If multiple developers create migrations:

# 1. Pull latest changes
git pull origin main

# 2. Check for conflicts in alembic/versions/
# 3. Resolve by adjusting down_revision chain
# 4. Or create merge migration:
alembic merge heads -m "Merge migrations"
```

### Connection Errors

```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL"

# Check if database exists
psql -h $DB_HOST -U $DB_USER -l
```

## Index Strategy

The initial migration creates comprehensive indexes:

### Standard Indexes
- Primary keys (all tables)
- Foreign keys (all relationships)
- Timestamp fields (created_at, updated_at, deleted_at)
- Status/type fields (for filtering)

### Composite Indexes
- `(org_id, status)` - Multi-tenant filtering
- `(channel_id, started_at)` - Time-series queries
- `(assignee_id, status)` - User workload queries

### GIN Indexes (PostgreSQL)
- JSONB columns (metadata, entities, location)
- ARRAY columns (roles, tags, events)
- Enables fast containment queries (`@>`, `?`, `?&`, `?|`)

### Performance Notes
- Indexes speed up reads but slow down writes
- Monitor query performance with `EXPLAIN ANALYZE`
- Add indexes based on actual query patterns
- Remove unused indexes to save space

## Schema Evolution Strategy

### Adding New Features

1. **Add tables/columns** via migration
2. **Populate data** with default values
3. **Update application code** to use new fields
4. **Deploy** application + migration together

### Breaking Changes

1. **Create new column** with nullable constraint
2. **Migrate data** from old to new column
3. **Update application** to use new column
4. **Deploy** and verify
5. **Remove old column** in separate migration

### Deprecation Process

1. **Mark as deprecated** in documentation
2. **Add warning logs** when used
3. **Monitor usage** in production
4. **Remove after grace period** (e.g., 2 sprints)

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/14/orm/)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)

## Support

For questions or issues:
1. Check `alembic/README.md` for detailed information
2. Review migration files in `alembic/versions/`
3. Consult SQLAlchemy and Alembic documentation
4. Ask team members familiar with the schema
