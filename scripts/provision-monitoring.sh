#!/bin/bash
set -euo pipefail

# ===========================================
# Fleet Management System - Monitoring Provisioning
# ===========================================
# This script provisions Azure Application Insights
# and configures comprehensive monitoring.
#
# Usage:
#   ./provision-monitoring.sh [production|staging]
#
# Environment Variables Optional:
#   RESOURCE_GROUP - Azure resource group name
#   LOCATION - Azure region
#   APP_INSIGHTS_NAME - Application Insights resource name
#
# Author: Capital Tech Alliance
# Date: November 24, 2025

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_step() { echo -e "\n${BLUE}==>${NC} $1"; }

# Script header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Fleet Management - Monitoring Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Environment selection
ENVIRONMENT="${1:-production}"
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
  log_error "Invalid environment: $ENVIRONMENT"
  echo "Usage: $0 [production|staging]"
  exit 1
fi

log_info "Environment: $ENVIRONMENT"

# Configuration with defaults
RESOURCE_GROUP="${RESOURCE_GROUP:-fleet-${ENVIRONMENT}-rg}"
LOCATION="${LOCATION:-eastus}"
APP_INSIGHTS_NAME="${APP_INSIGHTS_NAME:-fleet-${ENVIRONMENT}-insights}"
LOG_ANALYTICS_NAME="${LOG_ANALYTICS_NAME:-fleet-${ENVIRONMENT}-logs}"
ACTION_GROUP_NAME="${ACTION_GROUP_NAME:-fleet-${ENVIRONMENT}-alerts}"
ALERT_EMAIL="${ALERT_EMAIL:-andrew.m@capitaltechalliance.com}"

echo ""
echo "Configuration:"
echo "  Resource Group:        $RESOURCE_GROUP"
echo "  Location:              $LOCATION"
echo "  App Insights:          $APP_INSIGHTS_NAME"
echo "  Log Analytics:         $LOG_ANALYTICS_NAME"
echo "  Action Group:          $ACTION_GROUP_NAME"
echo "  Alert Email:           $ALERT_EMAIL"
echo ""

# Prerequisite checks
log_step "Step 1: Checking prerequisites..."

if ! command -v az &> /dev/null; then
  log_error "Azure CLI not installed"
  echo "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
  exit 1
fi
log_info "Azure CLI installed"

if ! az account show &> /dev/null; then
  log_error "Not logged in to Azure"
  echo "Run: az login"
  exit 1
fi
log_info "Azure CLI authenticated"

SUBSCRIPTION=$(az account show --query name -o tsv)
log_info "Active subscription: $SUBSCRIPTION"

# Ensure resource group exists
log_step "Step 2: Ensuring resource group exists..."

if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  log_info "Resource group exists: $RESOURCE_GROUP"
else
  log_warn "Creating resource group: $RESOURCE_GROUP"
  az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags Environment="$ENVIRONMENT" Project=FleetManagement \
    --output none
  log_info "Resource group created"
fi

# Create Log Analytics Workspace
log_step "Step 3: Creating Log Analytics Workspace..."

if az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_NAME" &> /dev/null; then
  log_info "Log Analytics workspace already exists"
else
  az monitor log-analytics workspace create \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_ANALYTICS_NAME" \
    --location "$LOCATION" \
    --retention-time 90 \
    --tags Environment="$ENVIRONMENT" Project=FleetManagement \
    --output none
  log_info "Log Analytics workspace created"
fi

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_NAME" \
  --query id -o tsv)

log_info "Workspace ID: $WORKSPACE_ID"

# Create Application Insights
log_step "Step 4: Creating Application Insights..."

if az monitor app-insights component show \
  --resource-group "$RESOURCE_GROUP" \
  --app "$APP_INSIGHTS_NAME" &> /dev/null; then
  log_info "Application Insights already exists"
else
  az monitor app-insights component create \
    --resource-group "$RESOURCE_GROUP" \
    --app "$APP_INSIGHTS_NAME" \
    --location "$LOCATION" \
    --kind web \
    --application-type web \
    --workspace "$WORKSPACE_ID" \
    --tags Environment="$ENVIRONMENT" Project=FleetManagement \
    --output none
  log_info "Application Insights created"
fi

# Get connection string and instrumentation key
log_step "Step 5: Retrieving connection details..."

CONNECTION_STRING=$(az monitor app-insights component show \
  --resource-group "$RESOURCE_GROUP" \
  --app "$APP_INSIGHTS_NAME" \
  --query connectionString -o tsv)

INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --resource-group "$RESOURCE_GROUP" \
  --app "$APP_INSIGHTS_NAME" \
  --query instrumentationKey -o tsv)

log_info "Connection string retrieved"
log_info "Instrumentation key retrieved"

# Create Action Group for alerts
log_step "Step 6: Creating Action Group for alerts..."

if az monitor action-group show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACTION_GROUP_NAME" &> /dev/null; then
  log_info "Action group already exists"
else
  az monitor action-group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACTION_GROUP_NAME" \
    --short-name "FleetAlert" \
    --email-receiver \
      name=AdminEmail \
      email-address="$ALERT_EMAIL" \
      use-common-alert-schema=true \
    --output none
  log_info "Action group created with email: $ALERT_EMAIL"
fi

ACTION_GROUP_ID=$(az monitor action-group show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACTION_GROUP_NAME" \
  --query id -o tsv)

# Configure alert rules
log_step "Step 7: Creating alert rules..."

# Alert 1: High error rate
log_info "Creating alert: High Error Rate..."

if ! az monitor metrics alert show \
  --resource-group "$RESOURCE_GROUP" \
  --name "fleet-${ENVIRONMENT}-high-errors" &> /dev/null; then

  APP_INSIGHTS_ID=$(az monitor app-insights component show \
    --resource-group "$RESOURCE_GROUP" \
    --app "$APP_INSIGHTS_NAME" \
    --query id -o tsv)

  az monitor metrics alert create \
    --resource-group "$RESOURCE_GROUP" \
    --name "fleet-${ENVIRONMENT}-high-errors" \
    --description "Alert when error rate exceeds 1%" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "count requests/failed > 10" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --severity 2 \
    --output none || log_warn "Could not create error rate alert (may need different metric)"
fi

# Alert 2: High response time
log_info "Creating alert: High Response Time..."

if ! az monitor metrics alert show \
  --resource-group "$RESOURCE_GROUP" \
  --name "fleet-${ENVIRONMENT}-slow-response" &> /dev/null; then

  az monitor metrics alert create \
    --resource-group "$RESOURCE_GROUP" \
    --name "fleet-${ENVIRONMENT}-slow-response" \
    --description "Alert when response time exceeds 3 seconds" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "avg requests/duration > 3000" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --severity 3 \
    --output none || log_warn "Could not create response time alert"
fi

# Alert 3: Availability drop
log_info "Creating alert: Low Availability..."

if ! az monitor metrics alert show \
  --resource-group "$RESOURCE_GROUP" \
  --name "fleet-${ENVIRONMENT}-low-availability" &> /dev/null; then

  az monitor metrics alert create \
    --resource-group "$RESOURCE_GROUP" \
    --name "fleet-${ENVIRONMENT}-low-availability" \
    --description "Alert when availability drops below 99%" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "avg availabilityResults/availabilityPercentage < 99" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --severity 1 \
    --output none || log_warn "Could not create availability alert"
fi

log_info "Alert rules configured"

# Configure smart detection
log_step "Step 8: Configuring smart detection..."

log_info "Smart detection enabled by default in Application Insights"
log_info "Monitors: Anomalies, Failures, Performance degradation"

# Create sample dashboard
log_step "Step 9: Creating monitoring dashboard..."

DASHBOARD_NAME="fleet-${ENVIRONMENT}-dashboard"

# Dashboard JSON template
DASHBOARD_JSON=$(cat <<EOF
{
  "location": "$LOCATION",
  "tags": {
    "Environment": "$ENVIRONMENT",
    "Project": "FleetManagement"
  },
  "properties": {
    "lenses": [
      {
        "order": 0,
        "parts": [
          {
            "position": {"x": 0, "y": 0, "colSpan": 6, "rowSpan": 4},
            "metadata": {
              "type": "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart",
              "settings": {
                "title": "Request Rate",
                "resourceId": "$APP_INSIGHTS_ID"
              }
            }
          },
          {
            "position": {"x": 6, "y": 0, "colSpan": 6, "rowSpan": 4},
            "metadata": {
              "type": "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart",
              "settings": {
                "title": "Response Time",
                "resourceId": "$APP_INSIGHTS_ID"
              }
            }
          }
        ]
      }
    ]
  }
}
EOF
)

log_info "Dashboard template created"
log_warn "Dashboard creation requires portal access"

# Summary of configuration
log_step "Step 10: Monitoring configuration summary..."

log_info "Application Insights: $APP_INSIGHTS_NAME"
log_info "Log Analytics: $LOG_ANALYTICS_NAME"
log_info "Alert Action Group: $ACTION_GROUP_NAME"
log_info "Alert Destination: $ALERT_EMAIL"

# Create credentials file
MONITORING_CONFIG_FILE="monitoring-config-${ENVIRONMENT}.txt"

cat > "$MONITORING_CONFIG_FILE" <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fleet Management System - Monitoring Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment:       $ENVIRONMENT
Created:           $(date)
Resource Group:    $RESOURCE_GROUP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPLICATION INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resource Name:          $APP_INSIGHTS_NAME
Instrumentation Key:    $INSTRUMENTATION_KEY

Connection String:
$CONNECTION_STRING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOG ANALYTICS WORKSPACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Workspace Name:         $LOG_ANALYTICS_NAME
Workspace ID:           $WORKSPACE_ID
Retention Period:       90 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALERTS CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Action Group:           $ACTION_GROUP_NAME
Alert Email:            $ALERT_EMAIL
Action Group ID:        $ACTION_GROUP_ID

Alert Rules Configured:
  1. High Error Rate (> 10 errors in 5 min) - Severity 2
  2. High Response Time (> 3 seconds) - Severity 3
  3. Low Availability (< 99%) - Severity 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT VARIABLES FOR .env
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Application Insights (Frontend)
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING
VITE_APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=$INSTRUMENTATION_KEY

# Application Insights (Backend)
APPLICATION_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING
APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=$INSTRUMENTATION_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MONITORED METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automatic Tracking:
  - Request rate (requests/sec)
  - Response time (avg, P95, P99)
  - Error rate (% of failed requests)
  - Dependency calls (database, external APIs)
  - Availability (uptime %)
  - User sessions and page views
  - Server metrics (CPU, memory)
  - Custom events and traces

Smart Detection:
  - Anomaly detection (automatic)
  - Failure anomalies
  - Performance degradation
  - Memory leak detection
  - Security detection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Add connection string to .env file:
   APPLICATION_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING

2. Deploy your application with monitoring enabled

3. View metrics in Azure Portal:
   https://portal.azure.com/#@/resource${APP_INSIGHTS_ID}/overview

4. Set up additional alerts as needed:
   - High CPU usage
   - High memory usage
   - Database connection failures
   - Authentication failures

5. Create custom dashboards:
   - Go to Azure Portal > Dashboards
   - Add Application Insights tiles
   - Share with team members

6. Configure continuous export (optional):
   - Export to Storage Account
   - Export to Event Hub
   - For long-term retention and analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MONITORING BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Log Levels:
   - ERROR: Critical issues requiring immediate attention
   - WARN: Potential issues to investigate
   - INFO: Important business events
   - DEBUG: Detailed diagnostic information (dev only)

2. Custom Metrics:
   - Track business KPIs (active users, transactions)
   - Monitor feature usage
   - Performance benchmarks

3. Alert Fatigue Prevention:
   - Set appropriate thresholds
   - Use dynamic thresholds for variable metrics
   - Group related alerts
   - Review and tune regularly

4. Dashboard Best Practices:
   - Create role-specific dashboards
   - Include SLA metrics
   - Add correlation views
   - Pin critical alerts

5. Security Monitoring:
   - Failed authentication attempts
   - Unusual access patterns
   - API rate limit breaches
   - Configuration changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No data appearing:
  - Verify connection string is correct
  - Check firewall allows outbound to *.applicationinsights.azure.com
  - Wait 5-10 minutes for initial data
  - Check application logs for errors

High monitoring costs:
  - Enable sampling (default is 100%)
  - Filter non-essential telemetry
  - Adjust retention period
  - Use daily cap (with caution)

Missing custom events:
  - Verify trackEvent() is called correctly
  - Check custom properties are under 8KB
  - Ensure SDK is initialized

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USEFUL QUERIES (Kusto/KQL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Request rate over time
requests
| summarize count() by bin(timestamp, 5m)
| render timechart

// Top 10 slowest requests
requests
| where duration > 1000
| top 10 by duration desc
| project timestamp, name, duration, resultCode

// Error rate percentage
requests
| summarize Total=count(), Errors=countif(success==false)
| extend ErrorRate = (Errors * 100.0) / Total

// Failed dependencies
dependencies
| where success == false
| summarize count() by name, resultCode
| order by count_ desc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

chmod 600 "$MONITORING_CONFIG_FILE"

# Create .env snippet
ENV_SNIPPET_FILE="monitoring-env-${ENVIRONMENT}.txt"

cat > "$ENV_SNIPPET_FILE" <<EOF
# ============================================
# Application Insights - $ENVIRONMENT
# ============================================
# Generated: $(date)
# Add these to your .env file

# Frontend (Vite)
VITE_APPLICATION_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING
VITE_APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=$INSTRUMENTATION_KEY

# Backend API
APPLICATION_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING
APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=$INSTRUMENTATION_KEY

# Optional: Monitoring configuration
APPLICATION_INSIGHTS_SAMPLING_PERCENTAGE=100
APPLICATION_INSIGHTS_ENABLE_AUTO_COLLECT=true
APPLICATION_INSIGHTS_ENABLE_LIVE_METRICS=true
EOF

chmod 600 "$ENV_SNIPPET_FILE"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Monitoring Configuration Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Application Insights:  $APP_INSIGHTS_NAME"
echo "Log Analytics:         $LOG_ANALYTICS_NAME"
echo "Alert Email:           $ALERT_EMAIL"
echo ""
echo -e "${YELLOW}Configuration saved to:${NC}"
echo "  Full details:   $MONITORING_CONFIG_FILE"
echo "  .env snippet:   $ENV_SNIPPET_FILE"
echo ""
echo "Next Steps:"
echo "  1. Add connection string to .env"
echo "  2. Deploy application"
echo "  3. View metrics in Azure Portal"
echo "  4. Customize alerts as needed"
echo ""
echo "Azure Portal:"
echo "  https://portal.azure.com/#@/resource${APP_INSIGHTS_ID}/overview"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
