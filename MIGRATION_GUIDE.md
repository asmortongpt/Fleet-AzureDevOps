# Database Migration Guide

## Overview

This guide explains how to run database migrations for the Fleet Management System. The migration system automatically applies all SQL schema files in the correct order and tracks which migrations have been executed.

---

## 🎯 Quick Start

### **Run Migrations Locally**

```bash
cd api
npm run migrate
```

### **Check Migration Status**

```bash
cd api
npm run migrate:status
```

### **Run Migrations in Kubernetes**

```bash
kubectl apply -f deployment/kubernetes/migration-job.yaml
```

---

## 📋 What Gets Migrated

The migration runner will apply **200+ tables** from:

1. **Base Schema** (`database/schema.sql`) - Core 27 tables
2. **Feature Migrations** (`api/src/migrations/*.sql`) - 26 migration files
3. **Additional Migrations** (`api/db/migrations/*.sql`) - 11 migration files
4. **Database Migrations** (`database/migrations/*.sql`) - 3 migration files
5. **Indexes** (`database/indexes.sql`) - Performance indexes

### Expected Table Count After Migration: **200+ tables**

---

## 🔧 Environment Variables

The migration script requires these environment variables:

```bash
DB_HOST=fleet-postgres-service      # Database host
DB_PORT=5432                         # Database port
DB_NAME=fleetdb                      # Database name
DB_USER=fleetadmin                   # Database username (or DB_USERNAME)
DB_PASSWORD=your_password            # Database password
DB_SSL_MODE=require                  # SSL mode (require/disable)
```

### Setting Up Environment

Create `api/.env` file:

```bash
# Local Development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=your_local_password
DB_SSL_MODE=disable

# Or for Kubernetes cluster (via port-forward)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=CHANGE_ME_IN_PRODUCTION
DB_SSL_MODE=require
```

---

## 🚀 Usage Scenarios

### **Scenario 1: First-Time Setup (Local Development)**

```bash
# 1. Start local PostgreSQL
docker run -d \
  --name fleet-postgres \
  -e POSTGRES_DB=fleetdb \
  -e POSTGRES_USER=fleetadmin \
  -e POSTGRES_PASSWORD=devpassword \
  -p 5432:5432 \
  postgres:15-alpine

# 2. Configure environment
cd api
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=devpassword
DB_SSL_MODE=disable
EOF

# 3. Run migrations
npm run migrate

# 4. Verify
npm run migrate:status
```

### **Scenario 2: Connect to Kubernetes Database**

```bash
# 1. Get database credentials from Kubernetes
kubectl get secret fleet-secrets -n fleet-management -o jsonpath='{.data.DB_PASSWORD}' | base64 --decode

# 2. Port-forward to Kubernetes PostgreSQL
kubectl port-forward -n fleet-management svc/fleet-postgres-service 5432:5432 &

# 3. Configure environment
cd api
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=<password_from_step_1>
DB_SSL_MODE=require
EOF

# 4. Run migrations
npm run migrate

# 5. Check status
npm run migrate:status
```

### **Scenario 3: Run Migration as Kubernetes Job**

```bash
# 1. Apply the migration job
kubectl apply -f deployment/kubernetes/migration-job.yaml

# 2. Watch the job
kubectl get jobs -n fleet-management -w

# 3. View logs
kubectl logs -n fleet-management job/fleet-db-migration

# 4. Check if successful
kubectl get job fleet-db-migration -n fleet-management
```

### **Scenario 4: Connect to Production Database Directly**

⚠️ **Use with caution in production!**

```bash
# 1. Get connection details
kubectl get configmap fleet-config -n fleet-management -o yaml
kubectl get secret fleet-secrets -n fleet-management -o yaml

# 2. Configure environment
cd api
cat > .env.production << EOF
DB_HOST=fleet-postgres-service.fleet-management.svc.cluster.local
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=<production_password>
DB_SSL_MODE=require
EOF

# 3. Run migrations (from inside cluster or with proper network access)
npm run migrate
```

---

## 📊 Migration Tracking

The system creates a `schema_migrations` table to track applied migrations:

```sql
SELECT * FROM schema_migrations ORDER BY executed_at DESC;
```

Output:
```
filename                              | executed_at              | execution_time_ms
--------------------------------------|--------------------------|------------------
schema.sql                            | 2025-11-12 10:30:00+00   | 1234
002-add-ai-features.sql               | 2025-11-12 10:30:02+00   | 567
003-add-rag-embeddings.sql            | 2025-11-12 10:30:04+00   | 892
...
```

---

## 🔍 Troubleshooting

### **Problem: "Only seeing 8 tables"**

**Solution:** Migrations haven't been run. Follow Scenario 1 or 2 above.

### **Problem: "Connection refused"**

**Solution:**
- Check if PostgreSQL is running
- Verify host/port in .env
- For Kubernetes: Ensure port-forward is active

```bash
# Check port-forward
ps aux | grep port-forward

# Restart port-forward if needed
kubectl port-forward -n fleet-management svc/fleet-postgres-service 5432:5432
```

### **Problem: "Authentication failed"**

**Solution:**
- Verify credentials with kubectl:
```bash
kubectl get secret fleet-secrets -n fleet-management -o jsonpath='{.data.DB_USERNAME}' | base64 --decode
kubectl get secret fleet-secrets -n fleet-management -o jsonpath='{.data.DB_PASSWORD}' | base64 --decode
```

### **Problem: "Migration failed midway"**

**Solution:**
- Migrations use transactions, so failed migrations are rolled back
- Fix the SQL error in the migration file
- Re-run: `npm run migrate`
- The system will skip already-applied migrations

### **Problem: "How do I see migration logs in Kubernetes?"**

```bash
# View job logs
kubectl logs -n fleet-management job/fleet-db-migration

# View pod logs if job is running
kubectl logs -n fleet-management -l component=migration -f

# Check job status
kubectl describe job fleet-db-migration -n fleet-management
```

---

## 🔒 Security Best Practices

1. **Never commit .env files** - Use `.env.example` templates
2. **Use strong passwords** - Change default `CHANGE_ME_IN_PRODUCTION`
3. **Limit database access** - Only run migrations from trusted locations
4. **Use Kubernetes secrets** - Don't hardcode credentials
5. **Enable SSL in production** - Set `DB_SSL_MODE=require`

---

## 📝 Adding New Migrations

To add a new migration:

1. Create a new `.sql` file in `api/src/migrations/`
2. Prefix with a number for ordering: `026_your_feature.sql`
3. Write your SQL:
```sql
-- 026_your_feature.sql
CREATE TABLE your_new_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_your_new_table_tenant ON your_new_table(tenant_id);
```
4. Run migration: `npm run migrate`
5. Verify: `npm run migrate:status`

---

## 🎯 Expected Results

After running migrations successfully, you should see:

```
✅ Migration complete!
   Applied: 40
   Skipped: 0
   Total: 40

📊 Total tables in database: 227
```

---

## 🆘 Getting Help

If you encounter issues:

1. Check migration status: `npm run migrate:status`
2. View PostgreSQL logs: `kubectl logs -n fleet-management -l app=postgres`
3. Test connection: `psql -h localhost -p 5432 -U fleetadmin -d fleetdb -c "SELECT version();"`
4. Contact DevOps team with error logs

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- Fleet API README: `api/README.md`
