# Retool Integration - Fleet Management System

## Overview

This guide provides complete deployment instructions for integrating Retool with the Fleet Management System, enabling powerful admin dashboards, data exploration, and operational tools without writing custom frontend code.

## What is Retool?

**Retool** is a low-code platform for building internal tools quickly. It connects directly to your databases and APIs, allowing you to create admin panels, dashboards, and workflows with drag-and-drop components.

### Why Add Retool to Fleet?

1. **Rapid Admin Tool Development**: Build fleet management dashboards in minutes instead of days
2. **Direct Database Access**: Query and update Fleet PostgreSQL database with visual SQL editor
3. **No Frontend Code Required**: Drag-and-drop UI components instead of React coding
4. **Instant CRUD Operations**: Create, read, update, delete fleet data with pre-built forms
5. **Workflow Automation**: Automate fleet operations (maintenance scheduling, driver assignments, etc.)
6. **Data Exploration**: Ad-hoc queries and reports without touching production code

## Architecture

```
Fleet Management System
├── Frontend (React) ───────────► End Users
├── API (Express/Node.js) ──────► Application Logic
├── PostgreSQL Database ────────► Data Storage
└── Retool ────────────────────► Admin/Operations Dashboard
    ├── Connects to Fleet PostgreSQL
    ├── Direct database queries
    ├── CRUD operations on fleet data
    └── Custom workflows and automations
```

**Retool Access**: https://retool.fleet.capitaltechalliance.com (after deployment)

---

## Prerequisites

### 1. Retool License

You need a Retool license to deploy self-hosted Retool:

**Option A: Free Trial**
- Visit: https://retool.com/self-hosted
- Sign up for free trial (14 days)
- Get license key via email

**Option B: Commercial License**
- Purchase from: https://retool.com/pricing
- Self-hosted pricing: ~$50-150/month depending on users

### 2. Kubernetes Access

Ensure you have:
```bash
kubectl access to fleet-management namespace
Helm 3.x installed
```

### 3. DNS Configuration

Add DNS A record:
```
retool.fleet.capitaltechalliance.com → Your AKS Ingress IP
```

Get ingress IP:
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

---

## Deployment Instructions

### Step 1: Add Retool License to Configuration

Edit `k8s/retool-values.yaml` and add your license key:

```yaml
config:
  licenseKey: "your-retool-license-key-here"
```

### Step 2: Create Retool Database

The Retool application needs its own database (separate from Fleet data):

```bash
# Get PostgreSQL password from fleet-api-secrets
DB_PASSWORD=$(kubectl get secret fleet-api-secrets -n fleet-management -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)

# Connect to PostgreSQL
kubectl exec -it deployment/fleet-postgres -n fleet-management -- \
  psql -U postgres -c "CREATE DATABASE retool;"
```

### Step 3: Deploy Retool via Helm

```bash
cd /path/to/fleet-local

# Deploy Retool to fleet-management namespace
helm install retool retool/retool \
  -f k8s/retool-values.yaml \
  -n fleet-management

# Monitor deployment
kubectl get pods -n fleet-management -l app=retool --watch
```

Expected pods:
- `retool-api-*` (2 replicas) - Main Retool application
- `retool-jobs-*` (1 replica) - Background job runner
- `retool-workflows-*` (1 replica) - Workflow engine
- `retool-code-executor-*` (1 replica) - Code execution sandbox

### Step 4: Verify Deployment

```bash
# Check all Retool pods are running
kubectl get pods -n fleet-management | grep retool

# Check logs
kubectl logs -l app=retool -n fleet-management --tail=50

# Port forward for local testing
kubectl port-forward svc/retool -n fleet-management 3000:3000

# Visit http://localhost:3000
```

### Step 5: Configure Ingress and SSL

The Helm chart creates an ingress automatically. Verify:

```bash
kubectl get ingress -n fleet-management retool-ingress
```

cert-manager will automatically provision SSL certificate from Let's Encrypt.

Check certificate status:
```bash
kubectl get certificate -n fleet-management retool-tls
```

### Step 6: Initial Retool Setup

1. **Visit**: https://retool.fleet.capitaltechalliance.com
2. **Create Admin Account**:
   - Email: your-email@capitaltechalliance.com
   - Password: [Strong password]
   - Organization: Fleet Management

3. **Set up SMTP** (optional - for user invites):
   - Settings → Email (SMTP)
   - Use the same SMTP configuration as Fleet:
     - Host: smtp.office365.com
     - Port: 587
     - User: andrew.m@capitaltechalliance.com

---

## Connecting Retool to Fleet Database

### Step 1: Add PostgreSQL Resource

1. Navigate to: **Resources** → **Create New** → **PostgreSQL**

2. **Connection Settings**:
   ```
   Name: Fleet PostgreSQL
   Host: postgres-service.fleet-management.svc.cluster.local
   Port: 5432
   Database: fleetdb
   User: postgres
   Password: [Get from fleet-api-secrets]
   ```

3. **Get PostgreSQL Password**:
   ```bash
   kubectl get secret fleet-api-secrets -n fleet-management \
     -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
   ```

4. **Test Connection** → **Save Resource**

### Step 2: Verify Database Access

Create a test query in Retool:
```sql
SELECT COUNT(*) as total_vehicles FROM vehicles;
SELECT COUNT(*) as total_drivers FROM drivers;
SELECT COUNT(*) as active_work_orders FROM work_orders WHERE status = 'open';
```

---

## Sample Retool Apps for Fleet Management

### 1. Vehicle Management Dashboard

**Purpose**: View and manage all fleet vehicles

**Components**:
- **Table**: Display all vehicles with columns:
  - VIN, Make, Model, Year, Mileage, Status
  - Actions: View Details, Edit, Deactivate
- **Form**: Add/edit vehicle details
- **Charts**:
  - Vehicles by status (pie chart)
  - Mileage distribution (histogram)
  - Vehicles by age (bar chart)

**Sample Query**:
```sql
SELECT
  v.id,
  v.vin,
  v.make,
  v.model,
  v.year,
  v.mileage,
  v.status,
  v.license_plate,
  v.department_id
FROM vehicles v
WHERE v.status != 'deleted'
ORDER BY v.updated_at DESC;
```

### 2. Maintenance Operations Center

**Purpose**: Track and manage maintenance work orders

**Components**:
- **Kanban Board**: Work orders by status (Open, In Progress, Completed)
- **Table**: All work orders with filtering
- **Detail Panel**: Work order details with:
  - Vehicle information
  - Assigned mechanic
  - Parts used
  - Labor hours
  - Cost breakdown
- **Form**: Create new work order
- **Charts**:
  - Work orders by priority
  - Average completion time
  - Cost trends

**Sample Query**:
```sql
SELECT
  wo.id,
  wo.title,
  wo.description,
  wo.status,
  wo.priority,
  wo.scheduled_date,
  wo.completed_date,
  v.make || ' ' || v.model as vehicle,
  v.license_plate,
  u.first_name || ' ' || u.last_name as assigned_to
FROM work_orders wo
JOIN vehicles v ON wo.vehicle_id = v.id
LEFT JOIN users u ON wo.assigned_user_id = u.id
WHERE wo.status != 'canceled'
ORDER BY
  CASE wo.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  wo.scheduled_date ASC;
```

### 3. Driver Assignment Tool

**Purpose**: Assign vehicles to drivers and track assignments

**Components**:
- **Dropdown**: Select driver
- **Dropdown**: Select vehicle
- **Date Picker**: Assignment start/end dates
- **Table**: Current assignments
- **Form**: Create/modify assignment

**Sample Mutation Query**:
```sql
INSERT INTO vehicle_assignments (
  driver_id,
  vehicle_id,
  start_date,
  end_date,
  status
) VALUES (
  {{ driverDropdown.value }},
  {{ vehicleDropdown.value }},
  {{ startDate.value }},
  {{ endDate.value }},
  'active'
) RETURNING *;
```

### 4. Fuel Cost Analysis

**Purpose**: Analyze fuel consumption and costs across fleet

**Components**:
- **Charts**:
  - Fuel costs over time (line chart)
  - Top fuel consumers (bar chart)
  - MPG by vehicle (scatter plot)
- **Table**: Detailed fuel records
- **Filters**: Date range, vehicle, driver

**Sample Query**:
```sql
SELECT
  v.id,
  v.make || ' ' || v.model as vehicle,
  COUNT(fe.id) as fuel_entries,
  SUM(fe.gallons) as total_gallons,
  SUM(fe.cost) as total_cost,
  AVG(fe.price_per_gallon) as avg_price_per_gallon,
  SUM(fe.odometer_end - fe.odometer_start) as miles_driven,
  SUM(fe.odometer_end - fe.odometer_start) / NULLIF(SUM(fe.gallons), 0) as avg_mpg
FROM vehicles v
LEFT JOIN fuel_entries fe ON v.id = fe.vehicle_id
WHERE fe.date >= {{ startDate.value }}
  AND fe.date <= {{ endDate.value }}
GROUP BY v.id, vehicle
ORDER BY total_cost DESC;
```

### 5. Driver Performance Dashboard

**Purpose**: Monitor driver metrics and performance

**Components**:
- **Table**: Driver list with metrics
- **Detail Panel**: Individual driver performance
- **Charts**:
  - Safety score distribution
  - Miles driven per driver
  - Incidents by driver

**Sample Query**:
```sql
SELECT
  d.id,
  d.first_name || ' ' || d.last_name as driver_name,
  d.license_number,
  d.license_expiry,
  COUNT(DISTINCT va.vehicle_id) as vehicles_assigned,
  COUNT(fe.id) as fuel_entries,
  SUM(fe.odometer_end - fe.odometer_start) as total_miles,
  COUNT(i.id) as incidents,
  d.safety_score
FROM drivers d
LEFT JOIN vehicle_assignments va ON d.id = va.driver_id
LEFT JOIN fuel_entries fe ON d.id = fe.driver_id
LEFT JOIN incidents i ON d.id = i.driver_id
WHERE d.status = 'active'
GROUP BY d.id, driver_name, d.license_number, d.license_expiry, d.safety_score
ORDER BY d.safety_score DESC;
```

---

## Retool Workflows for Fleet Automation

### 1. Automated Maintenance Reminders

**Trigger**: Scheduled (daily at 8 AM)

**Workflow**:
1. Query vehicles due for maintenance (mileage or date-based)
2. Create work orders automatically
3. Assign to available mechanics
4. Send email notifications to fleet managers

**Sample Workflow Code**:
```javascript
// Step 1: Find vehicles due for maintenance
const vehiclesDue = await postgresql.query({
  query: `
    SELECT v.id, v.make, v.model, v.mileage, v.last_maintenance_date
    FROM vehicles v
    WHERE v.mileage > 75000
      AND (v.last_maintenance_date IS NULL
        OR v.last_maintenance_date < NOW() - INTERVAL '6 months')
  `
});

// Step 2: Create work orders
for (const vehicle of vehiclesDue) {
  await postgresql.query({
    query: `
      INSERT INTO work_orders (vehicle_id, title, priority, status, scheduled_date)
      VALUES ($1, $2, 'medium', 'open', NOW() + INTERVAL '7 days')
    `,
    params: [vehicle.id, `Scheduled Maintenance - ${vehicle.make} ${vehicle.model}`]
  });
}

// Step 3: Send notification
await sendEmail({
  to: 'fleet-manager@capitaltechalliance.com',
  subject: `${vehiclesDue.length} Vehicles Due for Maintenance`,
  body: `Maintenance work orders created for ${vehiclesDue.length} vehicles.`
});
```

### 2. Driver License Expiration Alerts

**Trigger**: Scheduled (weekly on Monday)

**Workflow**:
1. Find drivers with licenses expiring within 30 days
2. Send alerts to HR and drivers
3. Update driver status if license expired

### 3. Vehicle Utilization Reports

**Trigger**: Scheduled (monthly on 1st)

**Workflow**:
1. Calculate vehicle utilization for previous month
2. Generate PDF report
3. Email to management
4. Archive report in storage

---

## Security Best Practices

### 1. Database Permissions

Create a read-only user for Retool queries:

```sql
-- Create retool user with limited permissions
CREATE USER retool_readonly WITH PASSWORD 'secure_password_here';

-- Grant read-only access to fleet database
GRANT CONNECT ON DATABASE fleetdb TO retool_readonly;
GRANT USAGE ON SCHEMA public TO retool_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO retool_readonly;

-- For future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO retool_readonly;
```

Use this user in Retool for most queries. Reserve `postgres` user for admin operations.

### 2. User Access Control

Configure Retool user permissions:
- **Admin**: Full access to all apps and data
- **Manager**: Edit access to operational apps
- **Viewer**: Read-only access to dashboards

### 3. Audit Logging

Enable audit logging in Retool:
- Settings → Audit Logs
- Track all database queries
- Monitor user actions
- Export logs to Datadog

### 4. Network Policies

The deployment includes network policies restricting:
- Retool can only access PostgreSQL within cluster
- No external database access without explicit allow
- Ingress only from nginx controller

---

## Monitoring and Observability

### Datadog Integration

Retool pods automatically connect to the Datadog agent:

**Metrics Available**:
- Request latency for Retool apps
- Database query performance
- User session count
- Error rates

**View in Datadog**:
- Service: `retool`
- Env: `production`
- Namespace: `fleet-management`

### Health Checks

```bash
# Check Retool health
curl https://retool.fleet.capitaltechalliance.com/api/checkHealth

# Expected response: {"ok": true}
```

---

## Costs

### Retool Self-Hosted Pricing

- **Free Trial**: 14 days, unlimited users
- **Standard**: $50/month for 5 users
- **Business**: $150/month for 15 users
- **Enterprise**: Custom pricing for 50+ users

### Infrastructure Costs

Additional Azure costs for running Retool:
- **Compute**: ~$30-50/month (2 API pods + workers)
- **Storage**: ~$5/month (10GB persistent volume)
- **Bandwidth**: Minimal (internal cluster traffic)

**Total Estimated Cost**: $85-205/month (depending on license tier)

---

## Troubleshooting

### Retool Won't Start

```bash
# Check pod logs
kubectl logs -l app=retool -n fleet-management

# Common issues:
# 1. Missing license key → Add to retool-values.yaml
# 2. Database connection failed → Verify PostgreSQL credentials
# 3. Insufficient resources → Check node capacity
```

### Can't Connect to Fleet Database

```bash
# Test PostgreSQL connection from Retool pod
kubectl exec -it deployment/retool-api -n fleet-management -- \
  psql -h postgres-service.fleet-management.svc.cluster.local \
       -U postgres -d fleetdb -c "SELECT 1;"

# If fails, check:
# 1. PostgreSQL service is running
# 2. Database password is correct
# 3. Network policies allow connection
```

### SSL Certificate Not Issued

```bash
# Check certificate status
kubectl describe certificate retool-tls -n fleet-management

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Force renewal
kubectl delete certificate retool-tls -n fleet-management
# Will be recreated automatically
```

---

## Next Steps

1. **Deploy Retool**: Follow deployment instructions above
2. **Create First App**: Build vehicle management dashboard
3. **Train Users**: Onboard fleet managers to Retool
4. **Build Workflows**: Automate maintenance scheduling
5. **Monitor Usage**: Track Retool metrics in Datadog

---

## Additional Resources

- **Retool Documentation**: https://docs.retool.com
- **Retool Community**: https://community.retool.com
- **Fleet Database Schema**: See `api/src/db/schema.ts`
- **Retool University**: https://retool.com/university (free training)

---

## Summary

Retool provides powerful admin tooling for Fleet Management without requiring custom frontend development. It connects directly to your PostgreSQL database, enabling rapid development of:

- **CRUD Operations**: Manage vehicles, drivers, work orders
- **Dashboards**: Visualize fleet metrics and KPIs
- **Workflows**: Automate maintenance and operational tasks
- **Reports**: Generate custom reports and exports

**Deployment Time**: 15-30 minutes
**First App**: 5-10 minutes
**ROI**: Saves hours of custom development per feature

Deploy today to supercharge your Fleet Management operations!
