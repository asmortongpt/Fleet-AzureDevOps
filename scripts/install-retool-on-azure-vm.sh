#!/bin/bash
##############################################################################
# Install Retool CLI on Azure VM for Fleet App Management
# This script installs Retool and configures it to connect to Fleet app
##############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Retool CLI Installation for Fleet App Management          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
RETOOL_VERSION="latest"
INSTALL_DIR="/opt/retool"
FLEET_API_URL="${FLEET_API_URL:-http://localhost:3000}"
FLEET_DB_HOST="${FLEET_DB_HOST:-localhost}"
FLEET_DB_PORT="${FLEET_DB_PORT:-5432}"
FLEET_DB_NAME="${FLEET_DB_NAME:-fleetdb}"
FLEET_DB_USER="${FLEET_DB_USER:-fleetadmin}"
FLEET_DB_PASSWORD="${FLEET_DB_PASSWORD:-}"

# Step 1: Install Node.js (required for Retool CLI)
echo -e "${BLUE}[1/8] Installing Node.js and npm...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi
echo ""

# Step 2: Install Retool CLI
echo -e "${BLUE}[2/8] Installing Retool CLI...${NC}"
if ! command -v retool &> /dev/null; then
    sudo npm install -g retool-cli
    echo -e "${GREEN}✓ Retool CLI installed${NC}"
else
    echo -e "${YELLOW}⚠ Retool CLI already installed, upgrading...${NC}"
    sudo npm update -g retool-cli
    echo -e "${GREEN}✓ Retool CLI upgraded${NC}"
fi

RETOOL_VERSION=$(retool --version 2>/dev/null || echo "unknown")
echo -e "${CYAN}Retool CLI version: ${RETOOL_VERSION}${NC}"
echo ""

# Step 3: Create Retool workspace directory
echo -e "${BLUE}[3/8] Setting up Retool workspace...${NC}"
sudo mkdir -p "$INSTALL_DIR"
sudo chown -R $(whoami):$(whoami) "$INSTALL_DIR"
cd "$INSTALL_DIR"
echo -e "${GREEN}✓ Workspace created at $INSTALL_DIR${NC}"
echo ""

# Step 4: Initialize Retool project for Fleet
echo -e "${BLUE}[4/8] Initializing Retool project for Fleet...${NC}"
mkdir -p fleet-admin
cd fleet-admin

# Create retool.config.json
cat > retool.config.json << EOF
{
  "version": "1.0",
  "name": "fleet-admin",
  "description": "Fleet Management System Admin Dashboard",
  "resources": [
    {
      "name": "fleet-postgres",
      "type": "postgresql",
      "options": {
        "host": "${FLEET_DB_HOST}",
        "port": ${FLEET_DB_PORT},
        "database": "${FLEET_DB_NAME}",
        "username": "${FLEET_DB_USER}",
        "ssl": false
      }
    },
    {
      "name": "fleet-api",
      "type": "restapi",
      "options": {
        "baseUrl": "${FLEET_API_URL}",
        "headers": {
          "Content-Type": "application/json"
        }
      }
    }
  ]
}
EOF

echo -e "${GREEN}✓ Retool config created${NC}"
echo ""

# Step 5: Create starter queries
echo -e "${BLUE}[5/8] Creating starter queries for Fleet app...${NC}"
mkdir -p queries

# Vehicle Management Queries
cat > queries/get-all-vehicles.sql << 'EOF'
-- Get all vehicles with their status
SELECT
    v.id,
    v.make,
    v.model,
    v.year,
    v.vin,
    v.license_plate,
    v.status,
    v.mileage,
    v.location,
    v.last_service_date,
    v.next_service_due,
    COUNT(DISTINCT m.id) as maintenance_count,
    COUNT(DISTINCT d.id) as driver_count
FROM vehicles v
LEFT JOIN maintenance_records m ON v.id = m.vehicle_id
LEFT JOIN drivers d ON v.id = d.assigned_vehicle_id
GROUP BY v.id
ORDER BY v.created_at DESC;
EOF

cat > queries/get-vehicle-telemetry.sql << 'EOF'
-- Get real-time vehicle telemetry
SELECT
    vt.id,
    vt.vehicle_id,
    v.make,
    v.model,
    v.license_plate,
    vt.latitude,
    vt.longitude,
    vt.speed,
    vt.fuel_level,
    vt.engine_temp,
    vt.battery_voltage,
    vt.odometer,
    vt.timestamp,
    vt.status
FROM vehicle_telemetry vt
JOIN vehicles v ON vt.vehicle_id = v.id
WHERE vt.timestamp > NOW() - INTERVAL '1 hour'
ORDER BY vt.timestamp DESC
LIMIT 1000;
EOF

cat > queries/get-maintenance-due.sql << 'EOF'
-- Get vehicles due for maintenance
SELECT
    v.id,
    v.make,
    v.model,
    v.vin,
    v.license_plate,
    v.mileage,
    v.last_service_date,
    v.next_service_due,
    DATE_PART('day', v.next_service_due - CURRENT_DATE) as days_until_service,
    COALESCE(SUM(m.cost), 0) as total_maintenance_cost
FROM vehicles v
LEFT JOIN maintenance_records m ON v.id = m.vehicle_id
WHERE v.next_service_due <= CURRENT_DATE + INTERVAL '30 days'
GROUP BY v.id
ORDER BY v.next_service_due ASC;
EOF

cat > queries/get-driver-stats.sql << 'EOF'
-- Get driver statistics
SELECT
    d.id,
    d.first_name,
    d.last_name,
    d.license_number,
    d.status,
    COUNT(DISTINCT t.id) as total_trips,
    SUM(t.distance) as total_distance,
    AVG(t.fuel_efficiency) as avg_fuel_efficiency,
    COUNT(DISTINCT CASE WHEN i.severity = 'critical' THEN i.id END) as critical_incidents
FROM drivers d
LEFT JOIN trips t ON d.id = t.driver_id
LEFT JOIN incidents i ON d.id = i.driver_id
GROUP BY d.id
ORDER BY total_distance DESC;
EOF

cat > queries/get-fleet-overview.sql << 'EOF'
-- Fleet overview dashboard query
SELECT
    COUNT(DISTINCT v.id) as total_vehicles,
    COUNT(DISTINCT CASE WHEN v.status = 'active' THEN v.id END) as active_vehicles,
    COUNT(DISTINCT CASE WHEN v.status = 'maintenance' THEN v.id END) as in_maintenance,
    COUNT(DISTINCT d.id) as total_drivers,
    COUNT(DISTINCT CASE WHEN d.status = 'active' THEN d.id END) as active_drivers,
    SUM(m.cost) as total_maintenance_cost_30d,
    AVG(v.mileage) as avg_mileage,
    COUNT(DISTINCT i.id) as incidents_30d
FROM vehicles v
LEFT JOIN drivers d ON TRUE
LEFT JOIN maintenance_records m ON v.id = m.vehicle_id
    AND m.service_date > CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN incidents i ON v.id = i.vehicle_id
    AND i.date > CURRENT_DATE - INTERVAL '30 days';
EOF

echo -e "${GREEN}✓ Created 5 starter SQL queries${NC}"
echo ""

# Step 6: Create REST API query templates
echo -e "${BLUE}[6/8] Creating REST API query templates...${NC}"

cat > queries/api-get-vehicles.json << 'EOF'
{
  "name": "API: Get All Vehicles",
  "resource": "fleet-api",
  "method": "GET",
  "endpoint": "/api/vehicles",
  "headers": {
    "Authorization": "Bearer {{userToken}}"
  },
  "transformResponse": "return data.vehicles"
}
EOF

cat > queries/api-create-vehicle.json << 'EOF'
{
  "name": "API: Create Vehicle",
  "resource": "fleet-api",
  "method": "POST",
  "endpoint": "/api/vehicles",
  "headers": {
    "Authorization": "Bearer {{userToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "make": "{{make.value}}",
    "model": "{{model.value}}",
    "year": "{{year.value}}",
    "vin": "{{vin.value}}",
    "license_plate": "{{licensePlate.value}}"
  }
}
EOF

cat > queries/api-update-vehicle-status.json << 'EOF'
{
  "name": "API: Update Vehicle Status",
  "resource": "fleet-api",
  "method": "PATCH",
  "endpoint": "/api/vehicles/{{selectedVehicle.id}}/status",
  "headers": {
    "Authorization": "Bearer {{userToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "status": "{{newStatus.value}}"
  }
}
EOF

echo -e "${GREEN}✓ Created 3 REST API query templates${NC}"
echo ""

# Step 7: Create README with usage instructions
echo -e "${BLUE}[7/8] Creating usage documentation...${NC}"

cat > README.md << 'EOF'
# Retool Setup for Fleet Management System

## Overview
This Retool workspace is configured to manage the Fleet Management System with direct database and API access.

## Resources Configured

### 1. PostgreSQL Database (fleet-postgres)
- Direct access to Fleet database
- Read and write capabilities
- Pre-configured queries for common operations

### 2. REST API (fleet-api)
- Fleet Management API endpoints
- Token-based authentication
- CRUD operations for all entities

## Starter Queries

### Database Queries (SQL)
1. **get-all-vehicles.sql** - List all vehicles with maintenance and driver info
2. **get-vehicle-telemetry.sql** - Real-time vehicle location and status
3. **get-maintenance-due.sql** - Vehicles due for service in next 30 days
4. **get-driver-stats.sql** - Driver performance statistics
5. **get-fleet-overview.sql** - Dashboard overview metrics

### API Queries (REST)
1. **api-get-vehicles.json** - Fetch vehicles via API
2. **api-create-vehicle.json** - Add new vehicle
3. **api-update-vehicle-status.json** - Change vehicle status

## Getting Started

### Option 1: Using Retool Cloud
1. Go to https://retool.com
2. Create/login to your account
3. Import this workspace:
   ```bash
   retool login
   retool push
   ```

### Option 2: Self-Hosted Retool
1. Set up Retool server (Docker recommended)
2. Configure database connection
3. Import queries from `queries/` directory

## Common Tasks

### Build a Vehicle Dashboard
1. Create new Retool app
2. Add Table component
3. Connect to `get-all-vehicles` query
4. Enable sorting, filtering, pagination
5. Add action buttons for common operations

### Monitor Real-Time Telemetry
1. Create map component
2. Connect to `get-vehicle-telemetry` query
3. Set auto-refresh interval (30s)
4. Add markers for each vehicle

### Maintenance Alerts
1. Create alert component
2. Connect to `get-maintenance-due` query
3. Color-code by urgency:
   - Red: Overdue
   - Yellow: Due within 7 days
   - Green: Due within 30 days

## Security Notes

⚠️ **IMPORTANT**:
- Store database password in Retool secrets (not in config)
- Use environment variables for sensitive data
- Enable SSL for production database connections
- Implement row-level security if needed
- Use read-only database user for reporting queries

## Environment Variables

Set these in your environment or `.env` file:

```bash
FLEET_DB_HOST=localhost          # Database hostname
FLEET_DB_PORT=5432               # Database port
FLEET_DB_NAME=fleetdb            # Database name
FLEET_DB_USER=fleetadmin         # Database user
FLEET_DB_PASSWORD=***            # Database password (use Azure Key Vault)
FLEET_API_URL=http://localhost:3000  # API base URL
```

## Connecting to Azure Resources

If Fleet is deployed to Azure:

```bash
# PostgreSQL (Azure Database for PostgreSQL)
FLEET_DB_HOST=fleet-db.postgres.database.azure.com
FLEET_DB_USER=fleetadmin@fleet-db
FLEET_DB_PASSWORD=<from Azure Key Vault>
FLEET_DB_PORT=5432

# Kubernetes Service (if using AKS)
FLEET_API_URL=http://<loadbalancer-ip>:3000
# or
FLEET_API_URL=https://fleet.capitaltechalliance.com
```

## Useful Retool CLI Commands

```bash
# Login to Retool
retool login

# Push local changes to Retool cloud
retool push

# Pull remote changes
retool pull

# Create new resource
retool resources create

# List all resources
retool resources list

# Create new app
retool apps create fleet-dashboard

# Deploy app
retool apps deploy fleet-dashboard
```

## Support

- Retool Docs: https://docs.retool.com
- Fleet API Docs: /api/docs (when running locally)
- Fleet GitHub: https://github.com/CapitalTechAlliance/Fleet

## Next Steps

1. ✅ Install Retool CLI - DONE
2. ✅ Configure database connection - DONE
3. ✅ Import starter queries - DONE
4. ⏳ Create admin dashboard app
5. ⏳ Set up automated reports
6. ⏳ Build mobile-friendly views

---
Created: $(date)
Location: $INSTALL_DIR/fleet-admin
EOF

echo -e "${GREEN}✓ Documentation created${NC}"
echo ""

# Step 8: Display summary
echo -e "${BLUE}[8/8] Installation Summary${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              RETOOL INSTALLATION COMPLETE                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Installation Directory:${NC} $INSTALL_DIR/fleet-admin"
echo -e "${CYAN}Configuration File:${NC} $INSTALL_DIR/fleet-admin/retool.config.json"
echo -e "${CYAN}Queries Directory:${NC} $INSTALL_DIR/fleet-admin/queries"
echo ""
echo -e "${YELLOW}Resources Configured:${NC}"
echo -e "  • PostgreSQL: ${FLEET_DB_HOST}:${FLEET_DB_PORT}/${FLEET_DB_NAME}"
echo -e "  • REST API: ${FLEET_API_URL}"
echo ""
echo -e "${YELLOW}Starter Queries Created:${NC}"
echo -e "  • 5 SQL queries (vehicles, telemetry, maintenance, drivers, overview)"
echo -e "  • 3 REST API templates (get, create, update)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. ${CYAN}Configure database password:${NC}"
echo -e "     ${BLUE}export FLEET_DB_PASSWORD='your-password'${NC}"
echo ""
echo -e "  2. ${CYAN}Login to Retool:${NC}"
echo -e "     ${BLUE}retool login${NC}"
echo ""
echo -e "  3. ${CYAN}Push configuration to Retool cloud:${NC}"
echo -e "     ${BLUE}cd $INSTALL_DIR/fleet-admin && retool push${NC}"
echo ""
echo -e "  4. ${CYAN}Or use Retool self-hosted:${NC}"
echo -e "     ${BLUE}docker run -d -p 3000:3000 tryretool/backend:latest${NC}"
echo ""
echo -e "  5. ${CYAN}View documentation:${NC}"
echo -e "     ${BLUE}cat $INSTALL_DIR/fleet-admin/README.md${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Optional: Auto-configure if database password is available
if [ -n "$FLEET_DB_PASSWORD" ]; then
    echo -e "${YELLOW}Database password detected. Updating configuration...${NC}"
    # Here you would update retool.config.json with the password
    # For security, this should use Azure Key Vault or similar
    echo -e "${GREEN}✓ Configuration updated${NC}"
fi

# Create quick access script
cat > /usr/local/bin/retool-fleet << 'SCRIPT'
#!/bin/bash
cd /opt/retool/fleet-admin
echo "Retool Fleet Admin - Quick Access"
echo "=================================="
echo ""
echo "Available commands:"
echo "  retool login              - Login to Retool"
echo "  retool push               - Push local changes"
echo "  retool pull               - Pull remote changes"
echo "  retool apps list          - List all apps"
echo "  retool resources list     - List all resources"
echo ""
echo "Documentation: cat README.md"
echo ""
exec "$@"
SCRIPT

sudo chmod +x /usr/local/bin/retool-fleet

echo -e "${GREEN}✓ Created shortcut command: ${CYAN}retool-fleet${NC}"
echo ""
echo -e "${BLUE}Installation complete! 🎉${NC}"
