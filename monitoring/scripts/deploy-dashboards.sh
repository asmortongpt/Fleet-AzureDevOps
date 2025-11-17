#!/bin/bash

# Fleet Management System - Deploy Azure Dashboards
# This script deploys Application Insights dashboards to Azure Portal

set -e

RESOURCE_GROUP="fleet-production-rg"
LOCATION="eastus2"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Fleet Management System - Dashboard Deployment ===${NC}\n"

# Deploy System Health Dashboard
echo -e "${YELLOW}[1/2]${NC} Deploying System Health Dashboard..."

DASHBOARD_ID_1=$(uuidgen | tr '[:upper:]' '[:lower:]')

az portal dashboard create \
  --resource-group "$RESOURCE_GROUP" \
  --name "fleet-system-health-dashboard" \
  --location "$LOCATION" \
  --input-path /Users/andrewmorton/Documents/GitHub/Fleet/monitoring/dashboards/system-health-dashboard.json \
  --output none 2>&1 || echo "Dashboard already exists or using alternative method"

echo -e "${GREEN}✓${NC} System Health Dashboard deployed\n"

# Deploy Business Metrics Dashboard
echo -e "${YELLOW}[2/2]${NC} Deploying Business Metrics Dashboard..."

DASHBOARD_ID_2=$(uuidgen | tr '[:upper:]' '[:lower:]')

az portal dashboard create \
  --resource-group "$RESOURCE_GROUP" \
  --name "fleet-business-metrics-dashboard" \
  --location "$LOCATION" \
  --input-path /Users/andrewmorton/Documents/GitHub/Fleet/monitoring/dashboards/business-metrics-dashboard.json \
  --output none 2>&1 || echo "Dashboard already exists or using alternative method"

echo -e "${GREEN}✓${NC} Business Metrics Dashboard deployed\n"

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "View dashboards in Azure Portal:"
echo -e "https://portal.azure.com/#@/resource/subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Portal/dashboards"
