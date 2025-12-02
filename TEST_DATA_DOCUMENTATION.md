# Fleet Management System - Test Data Documentation

## Overview

This document describes the comprehensive test data seed script for the Fleet Management System. The seed data creates realistic, diverse test data across multiple tenants to demonstrate all features and functionality of the platform.

## Quick Start

### Running the Seed Script

```bash
# From the api directory
cd /Users/andrewmorton/Documents/GitHub/Fleet/api

# Install dependencies if needed
npm install

# Run the seed script
npm run seed

# Verify the seeded data
npm run seed:verify
```

### Test Credentials

> **⚠️ SECURITY WARNING - FOR DEVELOPMENT/TESTING ONLY**
>
> These credentials are for LOCAL DEVELOPMENT and TESTING environments ONLY.
> - **NEVER** use these passwords in production
> - **NEVER** commit real credentials to version control
> - **ALWAYS** use strong, unique passwords in production
> - **ALWAYS** use Azure Key Vault or similar secret management in production

**Test Environment Password (Development Only):** `TestPassword123!`

**Admin Test Accounts:**
- `admin@demo-transport.local` (Demo Transport Company)
- `admin@fl-logistics.local` (Florida Logistics LLC)
- `admin@sunshine-fleet.local` (Sunshine Fleet Services)

**Other Test Accounts:**
- Fleet Managers: `manager1@{domain}`, `manager2@{domain}`
- Technicians: `tech1@{domain}`, `tech2@{domain}`
- Drivers: `driver1@{domain}` through `driver6@{domain}`
- Viewers: `viewer@{domain}`

> **Production Setup:**
> For production environments, follow the secure credential management guide:
> 1. Use Azure AD for authentication (no passwords)
> 2. Store secrets in Azure Key Vault
> 3. Use managed identities for service-to-service authentication
> 4. Enable MFA for all admin accounts
> 5. Rotate credentials regularly

## Data Generated

### Tenants (3 Organizations)

1. **Demo Transport Company** (`demo-transport.local`)
   - 20 vehicles
   - 12 users
   - Most comprehensive test data

2. **Florida Logistics LLC** (`fl-logistics.local`)
   - 15 vehicles
   - 12 users
   - Mid-sized fleet

3. **Sunshine Fleet Services** (`sunshine-fleet.local`)
   - 15 vehicles
   - 12 users
   - Mid-sized fleet

**Total: 3 tenants, 36 users, 50 vehicles**

### Users by Role (Per Tenant)

- **Admin**: 1 per tenant (3 total)
  - Full system access
  - Can manage all features

- **Fleet Managers**: 2 per tenant (6 total)
  - Manage vehicles, routes, and maintenance
  - View reports and analytics

- **Technicians**: 2 per tenant (6 total)
  - Handle work orders and maintenance
  - Update vehicle service records

- **Drivers**: 6 per tenant (18 total)
  - Assigned to vehicles
  - Access mobile features

- **Viewers**: 1 per tenant (3 total)
  - Read-only access
  - Can view reports but not edit

### Vehicles (50 Total)

**Vehicle Types:**
- Pickup Trucks (Ford F-150, F-250, Chevrolet Silverado, RAM, Toyota Tacoma/Tundra, GMC Sierra)
- Cargo Vans (Ford Transit, Mercedes-Benz Sprinter, Nissan NV)
- SUVs (Tesla Model Y)
- Electric Vehicles (Tesla Model Y, Ford E-Transit, Rivian R1T)

**Fuel Types Distribution:**
- Gasoline: ~50%
- Diesel: ~30%
- Electric: ~20%

**Status Distribution:**
- Active: ~70%
- Maintenance: ~15%
- Out of Service: ~15%

**Year Range:** 2019-2024

**Features:**
- Realistic VINs (17 characters)
- Florida license plates (FL format)
- GPS coordinates (Florida cities)
- Assigned drivers
- Varying odometer readings (10,000 - 150,000 miles)

### Fuel Transactions (200+ Records)

- 3-8 transactions per vehicle (non-electric)
- Date range: Past 90 days
- Realistic gallons (10-30 gallons per fill-up)
- Current Florida fuel prices:
  - Gasoline: $3.45 - $3.89/gallon
  - Diesel: $3.89 - $4.35/gallon
- Multiple fuel station brands (Shell, BP, Chevron, Marathon, Sunoco, RaceTrac)
- Florida locations (Miami, Tampa, Jacksonville, Orlando, etc.)

### Work Orders (100+ Records)

**Types:**
- Oil Change
- Tire Rotation
- Brake Inspection/Replacement
- Battery Replacement
- Air Filter Replacement
- Transmission Service
- Coolant Flush
- AC System Service
- Engine Tune-up
- Suspension Inspection
- Wheel Alignment
- DOT Safety Inspection
- Emission Test
- Windshield Wiper Replacement

**Priorities:**
- Low
- Medium
- High
- Critical

**Status Distribution:**
- Open
- In Progress
- Completed
- On Hold
- Cancelled

**Cost Range:** $150 - $1,200 (for completed orders)

### Maintenance Records (150+ Records)

- 2-5 records per vehicle
- Historical data (30-365 days ago)
- Service providers throughout Florida:
  - Florida Auto Service Center
  - Sunshine Fleet Maintenance
  - Tampa Truck & Auto
  - Jacksonville Fleet Services
  - Orlando Vehicle Repair
  - Miami Auto Care
- Detailed service notes
- Cost range: $100 - $850

### Routes (30+ Records)

- Origin and destination from Florida cities
- Realistic distances (50-350 miles)
- Various statuses (scheduled, in_progress, completed, cancelled)
- Assigned to vehicles with drivers
- Date range: Past 60 days to future 14 days

## Geographic Data

All test data uses **real Florida locations** with accurate GPS coordinates:

### Cities Included:
- Miami (25.7617, -80.1918)
- Tampa (27.9506, -82.4572)
- Jacksonville (30.3322, -81.6557)
- Orlando (28.5383, -81.3792)
- Tallahassee (30.4383, -84.2807)
- Fort Lauderdale (26.1224, -80.1373)
- West Palm Beach (26.7153, -80.0534)
- Naples (26.1420, -81.7948)
- Gainesville (29.6516, -82.3248)
- Pensacola (30.4213, -87.2169)
- St. Petersburg (27.7676, -82.6403)
- Cape Coral (26.5629, -81.9495)

## Time Diversity

The seed script creates data across multiple time periods:

- **Historical Data**: Past 365 days
  - Completed work orders
  - Historical fuel transactions
  - Past maintenance records
  - Completed routes

- **Current Data**: Today
  - Active vehicles
  - In-progress work orders
  - Current vehicle locations

- **Future Data**: Next 30 days
  - Scheduled work orders
  - Upcoming routes
  - Planned maintenance

## Data Quality Features

### Multi-Tenancy
- All data properly scoped to tenants
- No cross-tenant references
- Tenant isolation enforced

### Referential Integrity
- All foreign keys valid
- No orphaned records
- Proper cascade relationships

### Realistic Patterns
- Graduated odometer readings over time
- Fuel consumption matching mileage
- Maintenance intervals based on vehicle age
- Work order costs vary by service type

## Verification Queries

### Basic Counts
```sql
SELECT
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM vehicles) as vehicles,
  (SELECT COUNT(*) FROM fuel_transactions) as fuel_transactions,
  (SELECT COUNT(*) FROM work_orders) as work_orders,
  (SELECT COUNT(*) FROM maintenance_records) as maintenance_records;
```

### Vehicles by Status
```sql
SELECT status, COUNT(*) as count
FROM vehicles
GROUP BY status
ORDER BY count DESC;
```

### Work Orders by Status and Priority
```sql
SELECT status, priority, COUNT(*) as count
FROM work_orders
GROUP BY status, priority
ORDER BY status, priority;
```

### Users by Role and Tenant
```sql
SELECT t.name as tenant, u.role, COUNT(*) as count
FROM users u
JOIN tenants t ON u.tenant_id = t.id
GROUP BY t.name, u.role
ORDER BY t.name, u.role;
```

### Fuel Cost Analysis
```sql
SELECT
  v.fuel_type,
  COUNT(ft.id) as transactions,
  SUM(ft.gallons)::NUMERIC(10,2) as total_gallons,
  SUM(ft.cost)::NUMERIC(10,2) as total_cost,
  AVG(ft.price_per_gallon)::NUMERIC(10,2) as avg_price
FROM fuel_transactions ft
JOIN vehicles v ON ft.vehicle_id = v.id
GROUP BY v.fuel_type
ORDER BY total_cost DESC;
```

### Vehicle Fleet Summary
```sql
SELECT
  t.name as tenant,
  v.make,
  v.vehicle_type,
  COUNT(*) as count,
  AVG(v.odometer)::INTEGER as avg_mileage
FROM vehicles v
JOIN tenants t ON v.tenant_id = t.id
GROUP BY t.name, v.make, v.vehicle_type
ORDER BY t.name, count DESC;
```

### Recent Activity Dashboard
```sql
-- Recent Work Orders
SELECT
  wo.title,
  wo.status,
  wo.priority,
  v.make || ' ' || v.model as vehicle,
  u.first_name || ' ' || u.last_name as assigned_to,
  wo.created_at
FROM work_orders wo
JOIN vehicles v ON wo.vehicle_id = v.id
LEFT JOIN users u ON wo.assigned_to = u.id
ORDER BY wo.created_at DESC
LIMIT 10;
```

## Resetting/Reseeding

### Clear All Test Data
```sql
BEGIN;

-- Delete in reverse order to respect foreign keys
DELETE FROM fuel_transactions;
DELETE FROM maintenance_records;
DELETE FROM work_orders;
DELETE FROM routes;
DELETE FROM vehicles;
DELETE FROM users;
DELETE FROM tenants;

COMMIT;
```

### Reseed After Clearing
```bash
npm run seed
```

## Database Connection

> **⚠️ SECURITY WARNING**
> The database credentials shown below are EXAMPLE VALUES ONLY.
> **NEVER** commit real database passwords to documentation or code.

The seed script uses environment variables from your `.env` file:

```bash
# Example .env configuration (use your own secure values)
DB_HOST=fleet-postgres-service
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetadmin
DB_PASSWORD=<YOUR-SECURE-PASSWORD-HERE>  # Use Azure Key Vault in production
DB_SSL=true  # Always use SSL in production
```

**For Production:**
- Store `DB_PASSWORD` in Azure Key Vault
- Use managed identities instead of password authentication
- Enable SSL/TLS for all database connections
- Restrict network access using Azure Private Link

### Alternative: Run Against Different Environment

You can override environment variables:

```bash
DB_HOST=localhost DB_PORT=5432 npm run seed
```

## Kubernetes Pod Execution

If the database is running in Kubernetes:

```bash
# Option 1: Copy seed script to pod and run
kubectl cp api/src/scripts/seed-comprehensive-test-data.ts \
  fleet-management/fleet-api-pod:/tmp/seed.ts

kubectl exec -n fleet-management deployment/fleet-api -- \
  npm run seed

# Option 2: Port forward and run locally
kubectl port-forward -n fleet-management svc/fleet-postgres-service 5432:5432
DB_HOST=localhost npm run seed
```

## Troubleshooting

### Connection Issues
```bash
# Test database connection (password should come from environment variable)
kubectl exec -n fleet-management deployment/fleet-api -- \
  node -e "const {Pool} = require('pg'); \
  const pool = new Pool({host:'fleet-postgres-service', port:5432, \
  database:'fleetdb', user:'fleetadmin', password:process.env.DB_PASSWORD}); \
  pool.query('SELECT NOW()').then(r => console.log(r.rows)).catch(console.error);"
```

### Check Table Schema
```sql
-- List all tables
\dt

-- View table structure
\d vehicles
\d users
\d tenants
```

### Duplicate Key Errors

If you encounter duplicate key errors when rerunning the seed:

1. The script uses `ON CONFLICT` clauses for tenants and users
2. For vehicles, VINs are randomly generated so duplicates are unlikely
3. If needed, clear the data first (see "Resetting/Reseeding" above)

## Features Demonstrated

This test data allows you to demonstrate:

1. **Multi-tenant isolation** - 3 separate organizations
2. **Role-based access** - 5 different user roles
3. **Vehicle management** - Diverse fleet with different statuses
4. **Fuel tracking** - Historical fuel consumption and costs
5. **Work order management** - Various priorities and statuses
6. **Maintenance scheduling** - Past and future service records
7. **Route planning** - Multi-city Florida routes
8. **Geolocation** - Real GPS coordinates
9. **Reporting** - Data for analytics and dashboards
10. **Mobile features** - Driver assignments and vehicle tracking

## Sample Use Cases

### Fleet Manager Workflow
1. Login as `manager1@demo-transport.local`
2. View all active vehicles (14+)
3. Check vehicles in maintenance status
4. Review open work orders
5. Analyze fuel costs by vehicle
6. Plan new routes

### Technician Workflow
1. Login as `tech1@fl-logistics.local`
2. View assigned work orders
3. Update work order status to "in_progress"
4. Add maintenance records
5. Mark work orders as completed

### Driver Workflow
1. Login as `driver1@sunshine-fleet.local`
2. View assigned vehicle
3. Check upcoming routes
4. Review vehicle maintenance history
5. Submit fuel receipts

### Admin Workflow
1. Login as `admin@demo-transport.local`
2. View all tenants
3. Manage users across roles
4. Generate system-wide reports
5. Configure tenant settings

## Edge Cases Included

The seed data includes edge cases for testing:

- Vehicles without assigned drivers
- Overdue work orders
- Vehicles in maintenance status
- Electric vehicles (no fuel transactions)
- High-mileage vehicles (>100,000 miles)
- New vehicles (<20,000 miles)
- Cancelled and on-hold work orders
- Completed routes
- Future scheduled routes

## Performance Considerations

- **Seed time**: ~5-10 seconds for full dataset
- **Total records**: 500+ across all tables
- **Database size**: Minimal (<5 MB with indexes)
- **Query performance**: All tables indexed appropriately

## Maintenance

### Updating Seed Data

To modify the seed script:

1. Edit `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/scripts/seed-comprehensive-test-data.ts`
2. Adjust quantities, data ranges, or add new data types
3. Test with `npm run seed`
4. Verify with `npm run seed:verify`

### Adding New Data Types

When adding new tables/features:

1. Add seed logic to the main seed script
2. Add verification queries to the verify script
3. Update this documentation
4. Test multi-tenant isolation

## Support

For issues or questions about the test data:

1. Check the verification output: `npm run seed:verify`
2. Review database logs for connection issues
3. Verify environment variables are set correctly
4. Check Kubernetes pod status if running in cluster

## Summary

This comprehensive seed script provides:
- Realistic, production-like test data
- Multi-tenant architecture demonstration
- Geographic accuracy (Florida-based)
- Time diversity (past, present, future)
- Complete feature coverage
- Easy verification and reset
- Edge case testing
- Role-based access scenarios

The data is designed to showcase all features of the Fleet Management System while maintaining referential integrity and multi-tenant isolation.
