#!/bin/bash

# Fleet Management System - Azure Monitor Alerts Setup
# This script creates comprehensive production monitoring alerts

set -e

# Configuration
RESOURCE_GROUP="fleet-production-rg"
APP_INSIGHTS_NAME="fleet-management-insights"
AKS_CLUSTER_NAME="fleet-aks-cluster"
EMAIL="admin@capitaltechalliance.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Fleet Management System - Alert Setup ===${NC}\n"

# Get resource IDs
echo "Fetching resource IDs..."
APP_INSIGHTS_ID=$(az monitor app-insights component show \
  --app "$APP_INSIGHTS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv)

AKS_CLUSTER_ID=$(az aks show \
  --name "$AKS_CLUSTER_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv)

echo -e "${GREEN}✓${NC} Application Insights ID: $APP_INSIGHTS_ID"
echo -e "${GREEN}✓${NC} AKS Cluster ID: $AKS_CLUSTER_ID\n"

# 1. Create Action Group for Email Notifications
echo -e "${YELLOW}[1/6]${NC} Creating action group for notifications..."

az monitor action-group create \
  --name "fleet-critical-alerts" \
  --resource-group "$RESOURCE_GROUP" \
  --short-name "FleetAlerts" \
  --email-receiver "admin" "$EMAIL" \
  --output none 2>/dev/null || echo "Action group already exists"

echo -e "${GREEN}✓${NC} Action group created: fleet-critical-alerts\n"

# Get action group ID
ACTION_GROUP_ID=$(az monitor action-group show \
  --name "fleet-critical-alerts" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv)

# 2. Alert: High Error Rate
echo -e "${YELLOW}[2/6]${NC} Creating alert: High Error Rate..."

az monitor scheduled-query create \
  --name "fleet-high-error-rate" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "$APP_INSIGHTS_ID" \
  --description "Alert when API error rate exceeds 5% over 5 minutes" \
  --condition "count 'Perc' > 5" \
  --condition-query "requests | where timestamp > ago(5m) | summarize Total = count(), Failed = countif(success == false) | extend Perc = (Failed * 100.0) / Total | project Perc" \
  --evaluation-frequency "5m" \
  --window-size "5m" \
  --severity 1 \
  --action-groups "$ACTION_GROUP_ID" \
  --output none 2>/dev/null || echo "Alert already exists"

echo -e "${GREEN}✓${NC} High Error Rate alert created\n"

# 3. Alert: Slow API Response Time
echo -e "${YELLOW}[3/6]${NC} Creating alert: Slow API Response Time..."

az monitor scheduled-query create \
  --name "fleet-slow-response-time" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "$APP_INSIGHTS_ID" \
  --description "Alert when P95 API latency exceeds 2 seconds" \
  --condition "count 'p95' > 2000" \
  --condition-query "requests | where timestamp > ago(5m) | summarize p95 = percentile(duration, 95) | project p95" \
  --evaluation-frequency "5m" \
  --window-size "5m" \
  --severity 2 \
  --action-groups "$ACTION_GROUP_ID" \
  --output none 2>/dev/null || echo "Alert already exists"

echo -e "${GREEN}✓${NC} Slow Response Time alert created\n"

# 4. Alert: Database Connection Failures
echo -e "${YELLOW}[4/6]${NC} Creating alert: Database Connection Failures..."

az monitor scheduled-query create \
  --name "fleet-database-failures" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "$APP_INSIGHTS_ID" \
  --description "Alert when database connection failures occur" \
  --condition "count 'FailedConnections' > 5" \
  --condition-query "dependencies | where type == 'SQL' | where success == false | where timestamp > ago(5m) | summarize FailedConnections = count() | project FailedConnections" \
  --evaluation-frequency "5m" \
  --window-size "5m" \
  --severity 0 \
  --action-groups "$ACTION_GROUP_ID" \
  --output none 2>/dev/null || echo "Alert already exists"

echo -e "${GREEN}✓${NC} Database Failures alert created\n"

# 5. Alert: Pod Restart Rate (using metrics)
echo -e "${YELLOW}[5/6]${NC} Creating alert: Pod Restart Rate..."

az monitor metrics alert create \
  --name "fleet-pod-restarts" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "$AKS_CLUSTER_ID" \
  --description "Alert when pods restart more than 3 times in 10 minutes" \
  --condition "avg kube_pod_container_status_restarts_total > 3" \
  --window-size "10m" \
  --evaluation-frequency "5m" \
  --severity 1 \
  --action "$ACTION_GROUP_ID" \
  --output none 2>/dev/null || echo "Alert already exists or metrics not available"

echo -e "${GREEN}✓${NC} Pod Restart alert created\n"

# 6. Alert: High CPU/Memory Usage
echo -e "${YELLOW}[6/6]${NC} Creating alert: High Resource Usage..."

az monitor metrics alert create \
  --name "fleet-high-cpu-usage" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes "$AKS_CLUSTER_ID" \
  --description "Alert when CPU usage exceeds 80%" \
  --condition "avg Percentage CPU > 80" \
  --window-size "5m" \
  --evaluation-frequency "5m" \
  --severity 2 \
  --action "$ACTION_GROUP_ID" \
  --output none 2>/dev/null || echo "Alert already exists or metrics not available"

echo -e "${GREEN}✓${NC} High CPU Usage alert created\n"

# List all created alerts
echo -e "${GREEN}=== Alert Summary ===${NC}\n"

az monitor scheduled-query list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?contains(name, 'fleet-')].{Name:name, Severity:severity, Enabled:enabled}" \
  --output table

echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo -e "Action Group: fleet-critical-alerts"
echo -e "Email: $EMAIL"
echo -e "Total Alerts Created: 6"
echo -e "\nTo view alerts in Azure Portal:"
echo -e "https://portal.azure.com/#@/resource${ACTION_GROUP_ID}/overview"
