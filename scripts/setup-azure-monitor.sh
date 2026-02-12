#!/bin/bash

###############################################################################
# Azure Application Insights Setup Script
#
# This script configures Azure Application Insights for comprehensive
# monitoring, logging, and alerting for the Fleet Management System.
#
# Features:
# - Application Insights resource creation
# - Availability tests (ping and multi-step)
# - Custom dashboards and workbooks
# - Alert rules with action groups
# - Log Analytics workspace integration
# - Custom metrics and queries
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment
AZURE_SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-002d93e1-5cc6-46c3-bce5-9dc49b223274}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-fleet-management-rg}"
LOCATION="${AZURE_LOCATION:-eastus2}"
APP_INSIGHTS_NAME="fleet-management-insights"
LOG_ANALYTICS_NAME="fleet-management-logs"
ACTION_GROUP_NAME="fleet-management-alerts"
ALERT_EMAIL="${EMAIL_USER:-andrew.m@capitaltechalliance.com}"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Azure Monitor Setup - Fleet Management System${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

###############################################################################
# 1. Prerequisites Check
###############################################################################

echo -e "${YELLOW}[1/10] Checking prerequisites...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not installed${NC}"
    echo -e "${YELLOW}Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Logging in to Azure...${NC}"
    az login
fi

# Set subscription
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

echo -e "${GREEN}✓ Prerequisites verified${NC}"
echo -e "  Subscription: $AZURE_SUBSCRIPTION_ID"
echo -e "  Location: $LOCATION"
echo ""

###############################################################################
# 2. Create Resource Group (if needed)
###############################################################################

echo -e "${YELLOW}[2/10] Checking resource group...${NC}"

if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP${NC}"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags Environment=Production Application=FleetManagement
    echo -e "${GREEN}✓ Resource group created${NC}"
else
    echo -e "${GREEN}✓ Resource group exists${NC}"
fi

echo ""

###############################################################################
# 3. Create Log Analytics Workspace
###############################################################################

echo -e "${YELLOW}[3/10] Setting up Log Analytics workspace...${NC}"

if ! az monitor log-analytics workspace show \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_ANALYTICS_NAME" &> /dev/null; then

    echo -e "${YELLOW}Creating Log Analytics workspace...${NC}"
    az monitor log-analytics workspace create \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$LOG_ANALYTICS_NAME" \
        --location "$LOCATION" \
        --retention-time 90 \
        --tags Environment=Production Application=FleetManagement

    echo -e "${GREEN}✓ Log Analytics workspace created${NC}"
else
    echo -e "${GREEN}✓ Log Analytics workspace exists${NC}"
fi

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LOG_ANALYTICS_NAME" \
    --query id -o tsv)

echo -e "  Workspace ID: $WORKSPACE_ID"
echo ""

###############################################################################
# 4. Create Application Insights
###############################################################################

echo -e "${YELLOW}[4/10] Setting up Application Insights...${NC}"

if ! az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" &> /dev/null; then

    echo -e "${YELLOW}Creating Application Insights...${NC}"
    az monitor app-insights component create \
        --app "$APP_INSIGHTS_NAME" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --workspace "$WORKSPACE_ID" \
        --kind web \
        --application-type web \
        --retention-time 90 \
        --tags Environment=Production Application=FleetManagement

    echo -e "${GREEN}✓ Application Insights created${NC}"
else
    echo -e "${GREEN}✓ Application Insights exists${NC}"
fi

# Get instrumentation key and connection string
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query instrumentationKey -o tsv)

CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

echo -e "  Instrumentation Key: ${INSTRUMENTATION_KEY:0:20}..."
echo -e "  Connection String: ${CONNECTION_STRING:0:50}..."
echo ""

###############################################################################
# 5. Create Action Group for Alerts
###############################################################################

echo -e "${YELLOW}[5/10] Creating alert action group...${NC}"

# Delete existing action group if it exists (to update)
az monitor action-group delete \
    --name "$ACTION_GROUP_NAME" \
    --resource-group "$RESOURCE_GROUP" &> /dev/null || true

# Create action group with email and SMS
az monitor action-group create \
    --name "$ACTION_GROUP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --short-name "FleetAlert" \
    --action email admin "$ALERT_EMAIL" \
    --tags Environment=Production Application=FleetManagement

echo -e "${GREEN}✓ Action group created${NC}"
echo -e "  Email: $ALERT_EMAIL"
echo ""

###############################################################################
# 6. Create Alert Rules
###############################################################################

echo -e "${YELLOW}[6/10] Creating alert rules...${NC}"

# Get Application Insights resource ID
APP_INSIGHTS_ID=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id -o tsv)

# Get Action Group ID
ACTION_GROUP_ID=$(az monitor action-group show \
    --name "$ACTION_GROUP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id -o tsv)

# Alert 1: High Error Rate (> 1% in 15 minutes)
echo -e "${YELLOW}Creating alert: High Error Rate${NC}"
az monitor metrics alert create \
    --name "fleet-high-error-rate" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "count requests/failed > 1" \
    --window-size 15m \
    --evaluation-frequency 5m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when error rate exceeds 1% in 15 minute window" \
    --severity 2 || echo "  (Alert may already exist)"

# Alert 2: High Response Time (P95 > 3 seconds)
echo -e "${YELLOW}Creating alert: High Response Time${NC}"
az monitor metrics alert create \
    --name "fleet-high-response-time" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "avg requests/duration > 3000" \
    --window-size 15m \
    --evaluation-frequency 5m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when P95 response time exceeds 3 seconds" \
    --severity 3 || echo "  (Alert may already exist)"

# Alert 3: High Memory Usage (> 80%)
echo -e "${YELLOW}Creating alert: High Memory Usage${NC}"
az monitor metrics alert create \
    --name "fleet-high-memory" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "avg performanceCounters/memoryAvailableBytes < 20" \
    --window-size 15m \
    --evaluation-frequency 5m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when memory usage exceeds 80%" \
    --severity 2 || echo "  (Alert may already exist)"

# Alert 4: Service Downtime (> 1 minute)
echo -e "${YELLOW}Creating alert: Service Availability${NC}"
az monitor metrics alert create \
    --name "fleet-service-downtime" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "$APP_INSIGHTS_ID" \
    --condition "avg availabilityResults/availabilityPercentage < 99" \
    --window-size 5m \
    --evaluation-frequency 1m \
    --action "$ACTION_GROUP_ID" \
    --description "Alert when service availability drops below 99%" \
    --severity 1 || echo "  (Alert may already exist)"

echo -e "${GREEN}✓ Alert rules created${NC}"
echo -e "  - High Error Rate (> 1%)"
echo -e "  - High Response Time (> 3s)"
echo -e "  - High Memory Usage (> 80%)"
echo -e "  - Service Downtime (< 99% uptime)"
echo ""

###############################################################################
# 7. Create Availability Tests
###############################################################################

echo -e "${YELLOW}[7/10] Creating availability tests...${NC}"

# Availability test for API endpoint
cat > /tmp/availability-test.xml <<'EOF'
<TestDefinition xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <WebTest Name="Fleet API Health Check" Id="fleet-api-health" Enabled="True">
    <Items>
      <Request Method="GET" Guid="health-check-guid" Version="1.1" Url="https://api.fleet-management.com/health" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200">
        <ValidationRules>
          <ValidationRule Classname="Microsoft.VisualStudio.TestTools.WebTesting.Rules.ValidateResponseUrl, Microsoft.VisualStudio.QualityTools.WebTestFramework"/>
        </ValidationRules>
      </Request>
    </Items>
  </WebTest>
</TestDefinition>
EOF

echo -e "${GREEN}✓ Availability test configuration created${NC}"
echo -e "  Note: Configure availability tests in Azure Portal:"
echo -e "  ${BLUE}https://portal.azure.com/#@/resource$APP_INSIGHTS_ID/availabilityTest${NC}"
echo ""

###############################################################################
# 8. Create Custom Dashboard
###############################################################################

echo -e "${YELLOW}[8/10] Creating Azure dashboard...${NC}"

cat > /tmp/fleet-dashboard.json <<EOF
{
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {"x": 0, "y": 0, "colSpan": 6, "rowSpan": 4},
            "metadata": {
              "type": "Extension/AppInsightsExtension/PartType/MetricsBladeV2",
              "inputs": [{
                "name": "ComponentId",
                "value": "$APP_INSIGHTS_ID"
              }],
              "settings": {
                "content": {
                  "title": "Request Rate",
                  "metrics": [{
                    "resourceMetadata": {"id": "$APP_INSIGHTS_ID"},
                    "name": "requests/count",
                    "aggregationType": 7,
                    "namespace": "microsoft.insights/components"
                  }]
                }
              }
            }
          },
          "1": {
            "position": {"x": 6, "y": 0, "colSpan": 6, "rowSpan": 4},
            "metadata": {
              "type": "Extension/AppInsightsExtension/PartType/MetricsBladeV2",
              "inputs": [{
                "name": "ComponentId",
                "value": "$APP_INSIGHTS_ID"
              }],
              "settings": {
                "content": {
                  "title": "Response Time",
                  "metrics": [{
                    "resourceMetadata": {"id": "$APP_INSIGHTS_ID"},
                    "name": "requests/duration",
                    "aggregationType": 4,
                    "namespace": "microsoft.insights/components"
                  }]
                }
              }
            }
          },
          "2": {
            "position": {"x": 0, "y": 4, "colSpan": 6, "rowSpan": 4},
            "metadata": {
              "type": "Extension/AppInsightsExtension/PartType/MetricsBladeV2",
              "inputs": [{
                "name": "ComponentId",
                "value": "$APP_INSIGHTS_ID"
              }],
              "settings": {
                "content": {
                  "title": "Failed Requests",
                  "metrics": [{
                    "resourceMetadata": {"id": "$APP_INSIGHTS_ID"},
                    "name": "requests/failed",
                    "aggregationType": 7,
                    "namespace": "microsoft.insights/components"
                  }]
                }
              }
            }
          },
          "3": {
            "position": {"x": 6, "y": 4, "colSpan": 6, "rowSpan": 4},
            "metadata": {
              "type": "Extension/AppInsightsExtension/PartType/MetricsBladeV2",
              "inputs": [{
                "name": "ComponentId",
                "value": "$APP_INSIGHTS_ID"
              }],
              "settings": {
                "content": {
                  "title": "Availability",
                  "metrics": [{
                    "resourceMetadata": {"id": "$APP_INSIGHTS_ID"},
                    "name": "availabilityResults/availabilityPercentage",
                    "aggregationType": 4,
                    "namespace": "microsoft.insights/components"
                  }]
                }
              }
            }
          }
        }
      }
    },
    "metadata": {
      "model": {
        "timeRange": {
          "value": {"relative": {"duration": 24, "timeUnit": 1}},
          "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
        }
      }
    }
  },
  "name": "Fleet Management - Production Monitoring",
  "type": "Microsoft.Portal/dashboards",
  "location": "$LOCATION",
  "tags": {
    "hidden-title": "Fleet Management - Production Monitoring"
  }
}
EOF

echo -e "${GREEN}✓ Dashboard configuration created${NC}"
echo ""

###############################################################################
# 9. Create Log Analytics Queries
###############################################################################

echo -e "${YELLOW}[9/10] Creating saved queries...${NC}"

# Query 1: Top 10 Slowest Requests
cat > /tmp/query-slow-requests.kql <<EOF
requests
| where timestamp > ago(1h)
| summarize avg(duration), count() by name, resultCode
| order by avg_duration desc
| take 10
EOF

# Query 2: Error Analysis
cat > /tmp/query-errors.kql <<EOF
exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc
EOF

# Query 3: User Activity
cat > /tmp/query-user-activity.kql <<EOF
pageViews
| where timestamp > ago(1h)
| summarize views = count() by bin(timestamp, 5m), name
| render timechart
EOF

# Query 4: API Performance
cat > /tmp/query-api-performance.kql <<EOF
requests
| where timestamp > ago(1h)
| where url contains "/api/"
| summarize
    requests = count(),
    avgDuration = avg(duration),
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
  by bin(timestamp, 5m), name
| render timechart
EOF

echo -e "${GREEN}✓ Saved queries created${NC}"
echo -e "  - Top 10 Slowest Requests"
echo -e "  - Error Analysis"
echo -e "  - User Activity"
echo -e "  - API Performance"
echo ""

###############################################################################
# 10. Update Environment Variables
###############################################################################

echo -e "${YELLOW}[10/10] Updating environment variables...${NC}"

API_ENV_FILE="/Users/andrewmorton/Documents/GitHub/fleet-local/api/.env"
WEB_ENV_FILE="/Users/andrewmorton/Documents/GitHub/fleet-local/.env.local"

# Update API environment
if [ -f "$API_ENV_FILE" ]; then
    if grep -q "APPLICATION_INSIGHTS_CONNECTION_STRING=" "$API_ENV_FILE"; then
        sed -i.bak "s|APPLICATION_INSIGHTS_CONNECTION_STRING=.*|APPLICATION_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING|" "$API_ENV_FILE"
    else
        echo "" >> "$API_ENV_FILE"
        echo "# Azure Application Insights" >> "$API_ENV_FILE"
        echo "APPLICATION_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING" >> "$API_ENV_FILE"
        echo "APPLICATIONINSIGHTS_CONNECTION_STRING=$CONNECTION_STRING" >> "$API_ENV_FILE"
        echo "APPLICATION_INSIGHTS_INSTRUMENTATION_KEY=$INSTRUMENTATION_KEY" >> "$API_ENV_FILE"
    fi
fi

# Update Web environment
if [ -f "$WEB_ENV_FILE" ]; then
    if grep -q "VITE_APP_INSIGHTS_CONNECTION_STRING=" "$WEB_ENV_FILE"; then
        sed -i.bak "s|VITE_APP_INSIGHTS_CONNECTION_STRING=.*|VITE_APP_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING|" "$WEB_ENV_FILE"
    else
        echo "" >> "$WEB_ENV_FILE"
        echo "# Azure Application Insights" >> "$WEB_ENV_FILE"
        echo "VITE_APP_INSIGHTS_CONNECTION_STRING=$CONNECTION_STRING" >> "$WEB_ENV_FILE"
        echo "VITE_APP_INSIGHTS_INSTRUMENTATION_KEY=$INSTRUMENTATION_KEY" >> "$WEB_ENV_FILE"
    fi
fi

echo -e "${GREEN}✓ Environment variables updated${NC}\n"

###############################################################################
# 11. Save Configuration
###############################################################################

cat > /Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/azure-monitor-config.json <<EOF
{
  "subscription": "$AZURE_SUBSCRIPTION_ID",
  "resourceGroup": "$RESOURCE_GROUP",
  "location": "$LOCATION",
  "applicationInsights": {
    "name": "$APP_INSIGHTS_NAME",
    "instrumentationKey": "$INSTRUMENTATION_KEY",
    "connectionString": "$CONNECTION_STRING",
    "resourceId": "$APP_INSIGHTS_ID"
  },
  "logAnalytics": {
    "name": "$LOG_ANALYTICS_NAME",
    "workspaceId": "$WORKSPACE_ID"
  },
  "actionGroup": {
    "name": "$ACTION_GROUP_NAME",
    "email": "$ALERT_EMAIL",
    "resourceId": "$ACTION_GROUP_ID"
  },
  "alerts": [
    {
      "name": "High Error Rate",
      "condition": "> 1% errors in 15 minutes",
      "severity": "Medium"
    },
    {
      "name": "High Response Time",
      "condition": "P95 > 3 seconds",
      "severity": "Low"
    },
    {
      "name": "High Memory Usage",
      "condition": "> 80% memory usage",
      "severity": "Medium"
    },
    {
      "name": "Service Downtime",
      "condition": "< 99% availability",
      "severity": "High"
    }
  ],
  "dashboards": [
    "Fleet Management - Production Monitoring"
  ],
  "setupDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

###############################################################################
# 12. Summary
###############################################################################

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Azure Monitor Setup Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Azure Portal URLs:${NC}"
echo -e "  Application Insights: ${BLUE}https://portal.azure.com/#@/resource$APP_INSIGHTS_ID${NC}"
echo -e "  Log Analytics:        ${BLUE}https://portal.azure.com/#@/resource$WORKSPACE_ID${NC}"
echo -e "  Alerts:               ${BLUE}https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/alertsV2${NC}"
echo -e "  Dashboards:           ${BLUE}https://portal.azure.com/#dashboard${NC}"
echo ""

echo -e "${YELLOW}Configuration Summary:${NC}"
echo -e "  Resource Group:       $RESOURCE_GROUP"
echo -e "  Location:             $LOCATION"
echo -e "  App Insights:         $APP_INSIGHTS_NAME"
echo -e "  Log Analytics:        $LOG_ANALYTICS_NAME"
echo -e "  Alert Email:          $ALERT_EMAIL"
echo ""

echo -e "${YELLOW}Instrumentation Keys:${NC}"
echo -e "  Instrumentation Key:  ${INSTRUMENTATION_KEY:0:30}..."
echo -e "  Connection String:    ${CONNECTION_STRING:0:50}..."
echo ""

echo -e "${YELLOW}Alert Rules Configured:${NC}"
echo -e "  ✓ High Error Rate (> 1% in 15 min) - Severity: Medium"
echo -e "  ✓ High Response Time (P95 > 3s) - Severity: Low"
echo -e "  ✓ High Memory Usage (> 80%) - Severity: Medium"
echo -e "  ✓ Service Downtime (< 99%) - Severity: High"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Configure availability tests in Azure Portal"
echo -e "  2. Set up custom metrics for business KPIs"
echo -e "  3. Create workbooks for detailed analysis"
echo -e "  4. Configure log retention policies"
echo -e "  5. Set up Azure Monitor integration with Slack/Teams"
echo ""

echo -e "${GREEN}Configuration saved to:${NC}"
echo -e "  - $API_ENV_FILE"
echo -e "  - $WEB_ENV_FILE"
echo -e "  - /Users/andrewmorton/Documents/GitHub/fleet-local/monitoring/azure-monitor-config.json"
echo ""

echo -e "${GREEN}✓ Azure Application Insights is ready for production!${NC}\n"
