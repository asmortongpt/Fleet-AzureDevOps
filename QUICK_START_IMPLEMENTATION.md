# Quick Start: Database Schema Implementation

**Status:** Ready for Deployment
**Estimated Time:** 4 weeks (phased approach)

---

## Prerequisites

- PostgreSQL 14+ with extensions:
  - postgis
  - pgvector
  - earthdistance
  - pg_trgm
  - btree_gin
  - btree_gist

---

## Step 1: Install Required Extensions

```sql
-- Connect to your database
psql -U postgres -d fleet_production

-- Install extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS earthdistance;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

---

## Step 2: Run Database Migrations

### Development Environment
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api/src/db

# Run migrations in order
for i in {005..015}; do
  echo "Running migration ${i}..."
  psql -U postgres -d fleet_dev -f migrations/${i}_*.sql
  if [ $? -eq 0 ]; then
    echo "✅ Migration ${i} completed successfully"
  else
    echo "❌ Migration ${i} failed"
    exit 1
  fi
done
```

### Production Environment
```bash
# Backup first!
pg_dump -U postgres fleet_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations with transaction safety
for i in {005..015}; do
  psql -U postgres -d fleet_production -1 -f migrations/${i}_*.sql
done
```

---

## Step 3: Verify Migrations

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Should return: 112 tables

-- Check specific migrations
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%vehicle_locations%';

-- Verify indexes
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public';
-- Should return: 200+ indexes

-- Verify triggers
SELECT COUNT(*) FROM pg_trigger
WHERE tgname NOT LIKE 'RI_%';
-- Should return: 46+ triggers

-- Verify functions
SELECT COUNT(*) FROM pg_proc
WHERE proname LIKE 'get_%'
   OR proname LIKE 'calculate_%'
   OR proname LIKE 'update_%';
-- Should return: 20+ functions
```

---

## Step 4: Update Application Code

### Install TypeScript Types
```bash
# Types are already in /api/src/types/
# Rebuild TypeScript
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npm run build
```

### Import New Types
```typescript
// In your application code
import {
  VehicleLocation,
  Document,
  Expense,
  WorkOrderTemplate,
  Notification,
  AccidentReport,
  AssetTag,
  SavedReport,
  Role,
  MicrosoftGraphSync,
  AuditTrail
} from './types';
```

---

## Step 5: Create API Routes

### Example Route File
```typescript
// api/src/routes/vehicleLocations.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as controller from '../controllers/vehicleLocationController';

const router = Router();

router.use(authenticate); // Require authentication

router.get(
  '/',
  authorize('vehicles.read'),
  controller.list
);

router.get(
  '/:id',
  authorize('vehicles.read'),
  controller.getOne
);

router.post(
  '/',
  authorize('vehicles.write'),
  controller.create
);

export default router;
```

### Example Controller
```typescript
// api/src/controllers/vehicleLocationController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { VehicleLocation } from '../types';

export async function list(req: Request, res: Response) {
  try {
    const { vehicle_id, start_date, end_date } = req.query;
    const tenant_id = req.user!.tenant_id;

    let query = `
      SELECT * FROM vehicle_locations
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenant_id];
    let paramIndex = 2;

    if (vehicle_id) {
      query += ` AND vehicle_id = $${paramIndex++}`;
      params.push(vehicle_id);
    }

    if (start_date && end_date) {
      query += ` AND gps_timestamp BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(start_date, end_date);
    }

    query += ` ORDER BY gps_timestamp DESC LIMIT 50`;

    const result = await pool.query<VehicleLocation>(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.rowCount,
        page: 1,
        limit: 50
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle locations'
    });
  }
}
```

---

## Step 6: Initialize System Data

### Create Default Roles
```sql
-- Insert system roles
INSERT INTO roles (tenant_id, role_name, role_key, role_type, is_system_role, permissions, is_active)
VALUES
  (NULL, 'System Administrator', 'system_admin', 'system', true,
   ARRAY['*'], true),
  (NULL, 'Fleet Manager', 'fleet_manager', 'built_in', true,
   ARRAY['vehicles.read', 'vehicles.write', 'maintenance.read', 'maintenance.write', 'reports.read'],
   true),
  (NULL, 'Driver', 'driver', 'built_in', true,
   ARRAY['vehicles.read', 'trips.read', 'trips.write'],
   true),
  (NULL, 'Technician', 'technician', 'built_in', true,
   ARRAY['work_orders.read', 'work_orders.write', 'vehicles.read'],
   true);
```

### Create Default Permissions
```sql
-- Insert core permissions
INSERT INTO permissions (permission_key, permission_name, resource, action, scope_level, risk_level, is_active)
VALUES
  ('vehicles.read', 'Read Vehicles', 'vehicles', 'read', 'entity', 'low', true),
  ('vehicles.write', 'Write Vehicles', 'vehicles', 'create', 'entity', 'medium', true),
  ('vehicles.update', 'Update Vehicles', 'vehicles', 'update', 'entity', 'medium', true),
  ('vehicles.delete', 'Delete Vehicles', 'vehicles', 'delete', 'entity', 'high', true),
  ('maintenance.approve', 'Approve Maintenance', 'maintenance', 'approve', 'entity', 'high', true),
  ('expenses.approve', 'Approve Expenses', 'expenses', 'approve', 'entity', 'high', true);
```

### Create System Settings
```sql
-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_category, setting_name, value_type, string_value, scope, is_active)
VALUES
  ('timezone', 'general', 'System Timezone', 'string', 'America/New_York', 'system', true),
  ('currency', 'general', 'Default Currency', 'string', 'USD', 'system', true),
  ('date_format', 'general', 'Date Format', 'string', 'MM/DD/YYYY', 'system', true),
  ('session_timeout', 'security', 'Session Timeout (minutes)', 'integer', '30', 'system', true),
  ('max_login_attempts', 'security', 'Max Login Attempts', 'integer', '5', 'system', true);
```

---

## Step 7: Configure Integrations

### Microsoft Graph Sync
```sql
-- Create Microsoft Graph sync configuration
INSERT INTO microsoft_graph_sync (
  tenant_id, sync_type, resource_path, sync_frequency, enabled, auto_sync
)
VALUES
  ('<your_tenant_id>', 'calendar_events', '/me/calendar/events', 'every_15_min', true, true),
  ('<your_tenant_id>', 'emails', '/me/messages', 'hourly', true, true);
```

### Webhook Configuration
```sql
-- Create webhook subscription
INSERT INTO webhook_subscriptions (
  tenant_id, subscription_name, target_url, event_types,
  auth_type, is_active
)
VALUES
  ('<your_tenant_id>',
   'Vehicle Status Updates',
   'https://your-app.com/webhooks/fleet',
   ARRAY['vehicle.created', 'vehicle.updated', 'vehicle.status_changed'],
   'hmac_signature',
   true);
```

---

## Step 8: Test Core Functionality

### Test Vehicle Location Tracking
```sql
-- Insert test location
INSERT INTO vehicle_locations (
  tenant_id, vehicle_id, latitude, longitude,
  speed_mph, heading_degrees, gps_timestamp
)
VALUES (
  '<tenant_id>', '<vehicle_id>',
  28.5383, -81.3792,
  35, 90,
  NOW()
);

-- Query latest location
SELECT * FROM vehicle_locations
WHERE vehicle_id = '<vehicle_id>'
ORDER BY gps_timestamp DESC
LIMIT 1;
```

### Test Document Upload
```sql
-- Insert test document
INSERT INTO documents (
  tenant_id, document_name, original_filename,
  file_type, file_size_bytes, file_url, storage_path,
  document_category, owner_id, uploaded_by
)
VALUES (
  '<tenant_id>',
  'Test Vehicle Registration',
  'registration.pdf',
  'application/pdf',
  250000,
  'https://storage/documents/test.pdf',
  '/documents/test.pdf',
  'registration',
  '<user_id>',
  '<user_id>'
);
```

### Test Work Order Creation
```sql
-- Create test work order
INSERT INTO work_orders (
  tenant_id, vehicle_id, work_order_type,
  priority, description, status
)
VALUES (
  '<tenant_id>',
  '<vehicle_id>',
  'repair',
  'high',
  'Check engine light - P0301',
  'pending'
);
```

---

## Step 9: Performance Optimization

### Analyze Query Performance
```sql
-- Enable query timing
\timing on

-- Analyze expensive queries
EXPLAIN ANALYZE
SELECT * FROM vehicle_locations
WHERE vehicle_id = '<vehicle_id>'
  AND gps_timestamp > NOW() - INTERVAL '7 days';

-- Update statistics
ANALYZE vehicle_locations;
ANALYZE documents;
ANALYZE work_orders;
```

### Create Materialized Views (Optional)
```sql
-- Create materialized view for dashboard
CREATE MATERIALIZED VIEW mv_fleet_summary AS
SELECT
  v.tenant_id,
  COUNT(DISTINCT v.id) as total_vehicles,
  COUNT(DISTINCT CASE WHEN v.status = 'active' THEN v.id END) as active_vehicles,
  COUNT(DISTINCT wo.id) as open_work_orders,
  SUM(e.amount) as total_expenses_this_month
FROM vehicles v
LEFT JOIN work_orders wo ON wo.vehicle_id = v.id AND wo.status != 'completed'
LEFT JOIN expenses e ON e.vehicle_id = v.id
  AND e.expense_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY v.tenant_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW mv_fleet_summary;
```

---

## Step 10: Enable Monitoring

### Create Monitoring Views
```sql
-- Table size monitoring
CREATE VIEW v_table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage monitoring
CREATE VIEW v_index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Troubleshooting

### Issue: Migration Fails
```sql
-- Check for existing objects
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%vehicle_locations%';

-- Drop and retry if needed
DROP TABLE IF EXISTS vehicle_locations CASCADE;
```

### Issue: Permission Errors
```sql
-- Grant permissions to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fleet_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fleet_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fleet_app_user;
```

### Issue: Slow Queries
```sql
-- Check missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct < -0.01
  AND tablename IN ('vehicle_locations', 'documents', 'work_orders')
ORDER BY tablename, attname;
```

---

## Next Steps

1. ✅ **Complete Initial Setup** (Steps 1-6)
2. ✅ **Initialize System Data** (Step 6-7)
3. ✅ **Test Core Features** (Step 8)
4. ⏳ **Deploy API Endpoints** (Ongoing)
5. ⏳ **Configure Integrations** (As needed)
6. ⏳ **Performance Tuning** (Step 9)
7. ⏳ **Production Deployment** (Week 4)

---

## Support Resources

- **Schema Documentation:** `/artifacts/database/COMPLETE_SCHEMA_DESIGN.md`
- **API Documentation:** `/artifacts/api/API_ENDPOINTS_SPECIFICATION.md`
- **TypeScript Types:** `/api/src/types/database-tables*.ts`
- **SQL Migrations:** `/api/src/db/migrations/005-015_*.sql`

---

**Ready to Deploy!** 🚀
