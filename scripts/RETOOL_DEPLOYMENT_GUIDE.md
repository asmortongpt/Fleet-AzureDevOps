# Retool Deployment Guide for Fleet App

## Overview
This guide explains how to deploy Retool CLI to your Azure VM for Fleet app management and monitoring.

## What's Included

### 📁 Scripts Created
1. **install-retool-on-azure-vm.sh** - Installs Retool CLI and configures it for Fleet
2. **deploy-retool-to-azure-vm.sh** - Deploys Retool to your Azure VM automatically

### 📊 Retool Features for Fleet
- **Database Admin**: Direct PostgreSQL access for queries and management
- **API Integration**: REST API connections to Fleet backend
- **Pre-built Queries**: 8 starter queries for common Fleet operations
- **Dashboard Builder**: Create custom admin dashboards
- **Real-time Monitoring**: Live vehicle telemetry and status

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Navigate to scripts directory
cd /Users/andrewmorton/Documents/GitHub/fleet-local/scripts

# Run deployment script
./deploy-retool-to-azure-vm.sh
```

The script will:
1. ✅ Find your Fleet testing VM in Azure
2. ✅ Start the VM if it's stopped
3. ✅ Copy installation script to VM
4. ✅ Install Retool CLI
5. ✅ Configure database and API connections
6. ✅ Create 8 starter queries
7. ✅ Generate documentation

### Option 2: Manual Deployment

```bash
# 1. SSH into your Azure VM
ssh azureuser@<vm-public-ip>

# 2. Copy the install script
scp install-retool-on-azure-vm.sh azureuser@<vm-public-ip>:/tmp/

# 3. SSH in and run it
ssh azureuser@<vm-public-ip>
chmod +x /tmp/install-retool-on-azure-vm.sh
/tmp/install-retool-on-azure-vm.sh
```

## Configuration

### Environment Variables

Set these before running the deployment:

```bash
# Database Configuration
export FLEET_DB_HOST="fleet-db.postgres.database.azure.com"
export FLEET_DB_PORT="5432"
export FLEET_DB_NAME="fleetdb"
export FLEET_DB_USER="fleetadmin"
export FLEET_DB_PASSWORD="your-secure-password"  # Optional, can set later

# API Configuration
export FLEET_API_URL="https://fleet.capitaltechalliance.com"
# or for local testing:
# export FLEET_API_URL="http://localhost:3000"
```

### For Kubernetes Deployment

If your Fleet app is in Kubernetes:

```bash
# Get the LoadBalancer IP
kubectl get svc fleet-api -n fleet-management

# Use it as API URL
export FLEET_API_URL="http://<loadbalancer-ip>:3000"
```

## Starter Queries Included

### SQL Queries (PostgreSQL)

1. **get-all-vehicles.sql**
   - Lists all vehicles with maintenance and driver information
   - Useful for: Fleet overview, status monitoring

2. **get-vehicle-telemetry.sql**
   - Real-time vehicle location and sensor data
   - Useful for: Live tracking, GPS monitoring

3. **get-maintenance-due.sql**
   - Vehicles requiring service in next 30 days
   - Useful for: Maintenance planning, alerts

4. **get-driver-stats.sql**
   - Driver performance metrics and incident history
   - Useful for: Performance reviews, safety monitoring

5. **get-fleet-overview.sql**
   - Dashboard metrics: total vehicles, drivers, costs, incidents
   - Useful for: Executive dashboard, KPI tracking

### REST API Queries

6. **api-get-vehicles.json**
   - Fetch vehicles via API
   - Method: GET /api/vehicles

7. **api-create-vehicle.json**
   - Add new vehicle to fleet
   - Method: POST /api/vehicles

8. **api-update-vehicle-status.json**
   - Change vehicle status (active/maintenance/retired)
   - Method: PATCH /api/vehicles/:id/status

## Using Retool After Installation

### Access Retool

**Option A: Retool Cloud (Recommended)**
1. Go to https://retool.com
2. Sign up / Login
3. On the VM, login to CLI:
   ```bash
   retool login
   ```
4. Push your configuration:
   ```bash
   cd /opt/retool/fleet-admin
   retool push
   ```

**Option B: Self-Hosted Retool**
```bash
# On the Azure VM or locally
docker run -d -p 3000:3000 \
  -e POSTGRES_DB=retool \
  -e POSTGRES_USER=retool \
  -e POSTGRES_PASSWORD=retoolpw \
  tryretool/backend:latest
```

### Build Your First Dashboard

1. **Create New App** in Retool
2. **Add Table Component**
   - Connect to `get-all-vehicles` query
   - Enable sorting, filtering
3. **Add Chart Component**
   - Connect to `get-fleet-overview` query
   - Display as bar chart or KPI cards
4. **Add Map Component**
   - Connect to `get-vehicle-telemetry` query
   - Show real-time vehicle locations
5. **Add Action Buttons**
   - Update Status: Links to `api-update-vehicle-status`
   - Add Vehicle: Opens form using `api-create-vehicle`

## Security Best Practices

### ⚠️ Important Security Notes

1. **Never commit database passwords**
   - Use Azure Key Vault
   - Or Retool's secret management

2. **Use read-only database user for queries**
   ```sql
   CREATE USER retool_readonly WITH PASSWORD 'secure_password';
   GRANT CONNECT ON DATABASE fleetdb TO retool_readonly;
   GRANT USAGE ON SCHEMA public TO retool_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO retool_readonly;
   ```

3. **Enable SSL for database connections**
   ```json
   {
     "ssl": true,
     "sslMode": "require"
   }
   ```

4. **Implement row-level security**
   - Restrict data access by tenant
   - Use PostgreSQL RLS policies

5. **Use API tokens instead of passwords**
   ```bash
   # Generate API token from Fleet backend
   curl -X POST https://fleet.capitaltechalliance.com/api/auth/token \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"***"}'
   ```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to database
```bash
# Test connection from VM
psql -h $FLEET_DB_HOST -U $FLEET_DB_USER -d $FLEET_DB_NAME

# If fails, check:
# 1. Azure firewall rules
# 2. NSG rules allow port 5432
# 3. Database credentials are correct
```

**Problem**: Cannot reach API
```bash
# Test API from VM
curl https://fleet.capitaltechalliance.com/api/health

# If fails, check:
# 1. DNS resolution
# 2. SSL certificates
# 3. API is running
```

### Retool CLI Issues

**Problem**: `retool: command not found`
```bash
# Reinstall
sudo npm install -g retool-cli

# Add to PATH
echo 'export PATH="$PATH:$(npm bin -g)"' >> ~/.bashrc
source ~/.bashrc
```

**Problem**: Permission denied
```bash
# Fix ownership
sudo chown -R $(whoami):$(whoami) /opt/retool
```

## Advanced Features

### Scheduled Reports

Create automated reports in Retool:

```javascript
// Example: Daily maintenance report
const query = await getMainttenanceDue.trigger();
const report = query.data.filter(v => v.days_until_service <= 7);

// Send via email
await sendEmail.trigger({
  to: 'fleet-manager@company.com',
  subject: 'Weekly Maintenance Due Report',
  body: formatTable(report)
});
```

### Custom Workflows

Build approval workflows:

```javascript
// Example: Vehicle purchase approval
if (newVehicle.cost > 50000) {
  await requestApproval.trigger({
    approver: 'fleet-director@company.com',
    item: newVehicle
  });
} else {
  await createVehicle.trigger(newVehicle);
}
```

## Support and Resources

- **Retool Documentation**: https://docs.retool.com
- **Retool CLI Reference**: https://docs.retool.com/apps/reference/retool-cli
- **Fleet API Docs**: https://fleet.capitaltechalliance.com/api/docs
- **Azure VM SSH**:
  ```bash
  ssh azureuser@<vm-ip>
  ```

## Maintenance

### Update Retool CLI

```bash
sudo npm update -g retool-cli
```

### Backup Configuration

```bash
cd /opt/retool/fleet-admin
tar -czf retool-backup-$(date +%Y%m%d).tar.gz .
```

### View Logs

```bash
# Retool logs (if self-hosted)
docker logs retool-backend

# VM system logs
sudo journalctl -u retool
```

## Next Steps

- [ ] Deploy Retool to Azure VM
- [ ] Configure database connection
- [ ] Test starter queries
- [ ] Build admin dashboard
- [ ] Set up user permissions
- [ ] Create automated reports
- [ ] Build mobile-friendly views
- [ ] Integrate with Azure AD SSO

---

**Created**: 2025-12-01
**Location**: /Users/andrewmorton/Documents/GitHub/fleet-local/scripts
**Maintainer**: Fleet Team
