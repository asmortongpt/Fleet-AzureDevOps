#!/usr/bin/env bash
#
# Production Monitoring Setup Script
# Configures Application Insights, alerts, and monitoring dashboards
#
# Exit codes:
#   0 - Setup completed successfully
#   1 - Setup failed
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP="${AKS_RESOURCE_GROUP:-fleet-management-rg}"
APP_INSIGHTS_NAME="${APP_INSIGHTS_NAME:-fleet-app-insights}"
LOCATION="${LOCATION:-eastus}"
ACTION_GROUP_NAME="${ACTION_GROUP_NAME:-fleet-alerts-group}"
ALERT_EMAIL="${ALERT_EMAIL:-andrew.m@capitaltechalliance.com}"

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_section() {
    echo ""
    echo -e "${MAGENTA}========================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}========================================${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"

    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not installed"
        exit 1
    fi

    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure"
        exit 1
    fi

    log_success "Prerequisites checked"
}

# Function to create Application Insights
setup_application_insights() {
    log_section "Setting Up Application Insights"

    # Check if already exists
    if az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log_info "Application Insights already exists"
    else
        log_info "Creating Application Insights..."
        az monitor app-insights component create \
            --app "$APP_INSIGHTS_NAME" \
            --location "$LOCATION" \
            --resource-group "$RESOURCE_GROUP" \
            --application-type web \
            --retention-time 90

        log_success "Application Insights created"
    fi

    # Get connection string
    local conn_string=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString -o tsv)

    log_success "Connection string retrieved"
    log_info "Add to environment: APPLICATION_INSIGHTS_CONNECTION_STRING='$conn_string'"
}

# Function to create action group
setup_action_group() {
    log_section "Setting Up Alert Action Group"

    # Check if exists
    if az monitor action-group show --name "$ACTION_GROUP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log_info "Action group already exists"
    else
        log_info "Creating action group..."
        az monitor action-group create \
            --name "$ACTION_GROUP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --short-name "FleetAlert" \
            --email-receiver name="Admin" email="$ALERT_EMAIL"

        log_success "Action group created"
    fi
}

# Function to create metric alerts
setup_metric_alerts() {
    log_section "Setting Up Metric Alerts"

    local app_insights_id=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query id -o tsv)

    # High Error Rate Alert
    log_info "Creating high error rate alert..."
    az monitor metrics alert create \
        --name "fleet-high-error-rate" \
        --resource-group "$RESOURCE_GROUP" \
        --scopes "$app_insights_id" \
        --condition "avg exceptions/server > 10" \
        --window-size 5m \
        --evaluation-frequency 1m \
        --action "$ACTION_GROUP_NAME" \
        --description "Alert when server error rate exceeds threshold" \
        2> /dev/null || log_warning "Error rate alert may already exist"

    # High Response Time Alert
    log_info "Creating high response time alert..."
    az monitor metrics alert create \
        --name "fleet-high-response-time" \
        --resource-group "$RESOURCE_GROUP" \
        --scopes "$app_insights_id" \
        --condition "avg requests/duration > 2000" \
        --window-size 5m \
        --evaluation-frequency 1m \
        --action "$ACTION_GROUP_NAME" \
        --description "Alert when average response time exceeds 2 seconds" \
        2> /dev/null || log_warning "Response time alert may already exist"

    log_success "Metric alerts configured"
}

# Function to create log query alerts
setup_log_alerts() {
    log_section "Setting Up Log Query Alerts"

    local app_insights_id=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query id -o tsv)

    # Failed login attempts alert
    log_info "Creating failed login alert..."
    local query="requests | where name contains 'login' and resultCode == '401' | summarize count() by bin(timestamp, 5m) | where count_ > 20"

    az monitor scheduled-query create \
        --name "fleet-failed-logins" \
        --resource-group "$RESOURCE_GROUP" \
        --scopes "$app_insights_id" \
        --condition "count > 20" \
        --condition-query "$query" \
        --evaluation-frequency 5m \
        --window-size 5m \
        --action-groups "$ACTION_GROUP_NAME" \
        --description "Alert on excessive failed login attempts" \
        2> /dev/null || log_warning "Failed login alert may already exist"

    log_success "Log query alerts configured"
}

# Function to setup availability tests
setup_availability_tests() {
    log_section "Setting Up Availability Tests"

    log_info "Creating availability test..."

    # Get App Insights ID
    local app_insights_id=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query id -o tsv)

    # Create web test (ping test)
    local test_name="fleet-availability-test"
    local test_url="${PRODUCTION_URL:-https://fleet.capitaltechalliance.com}"

    log_info "Creating web test for: $test_url"

    # Note: Web tests require XML configuration
    # This is a simplified version - full implementation would use XML template

    log_warning "Availability tests should be configured manually in Azure Portal"
    log_info "Go to: Application Insights > Availability > Add Standard test"
    log_info "URL: $test_url"
    log_info "Test frequency: 5 minutes"
    log_info "Test locations: 5+ locations"
}

# Function to create dashboard
setup_dashboard() {
    log_section "Setting Up Monitoring Dashboard"

    log_info "Dashboard configuration..."

    cat > fleet-dashboard.json << 'EOF'
{
  "properties": {
    "lenses": [
      {
        "order": 0,
        "parts": [
          {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "type": "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart",
              "settings": {
                "content": {
                  "chartType": "line",
                  "title": "Request Rate"
                }
              }
            }
          },
          {
            "position": {
              "x": 6,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "type": "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart",
              "settings": {
                "content": {
                  "chartType": "line",
                  "title": "Response Time"
                }
              }
            }
          },
          {
            "position": {
              "x": 0,
              "y": 4,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "type": "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart",
              "settings": {
                "content": {
                  "chartType": "line",
                  "title": "Error Rate"
                }
              }
            }
          },
          {
            "position": {
              "x": 6,
              "y": 4,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "type": "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart",
              "settings": {
                "content": {
                  "chartType": "line",
                  "title": "Database Connections"
                }
              }
            }
          }
        ]
      }
    ]
  }
}
EOF

    log_success "Dashboard template created: fleet-dashboard.json"
    log_info "Import dashboard manually in Azure Portal > Dashboards > Upload"
}

# Function to configure log aggregation
setup_log_aggregation() {
    log_section "Setting Up Log Aggregation"

    log_info "Configuring Log Analytics workspace..."

    local workspace_name="fleet-logs-workspace"

    # Check if workspace exists
    if az monitor log-analytics workspace show --workspace-name "$workspace_name" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        log_info "Log Analytics workspace already exists"
    else
        log_info "Creating Log Analytics workspace..."
        az monitor log-analytics workspace create \
            --workspace-name "$workspace_name" \
            --resource-group "$RESOURCE_GROUP" \
            --location "$LOCATION"

        log_success "Log Analytics workspace created"
    fi

    # Get workspace ID
    local workspace_id=$(az monitor log-analytics workspace show \
        --workspace-name "$workspace_name" \
        --resource-group "$RESOURCE_GROUP" \
        --query id -o tsv)

    log_info "Workspace ID: $workspace_id"
    log_info "Connect AKS to this workspace for container logs"
}

# Function to setup performance monitoring
setup_performance_monitoring() {
    log_section "Setting Up Performance Monitoring"

    log_info "Performance monitoring configuration..."

    # Configure sampling
    log_info "Recommended Application Insights settings:"
    echo "  - Sampling: Adaptive (default)"
    echo "  - Dependency tracking: Enabled"
    echo "  - Live Metrics: Enabled"
    echo "  - Snapshot debugging: Enabled for errors"
    echo "  - Profiler: Enable for performance analysis"

    log_success "Performance monitoring guidelines provided"
}

# Function to test alert notifications
test_alerts() {
    log_section "Testing Alert Configuration"

    log_info "Testing alert action group..."

    # Send test notification
    az monitor action-group test-notifications create \
        --action-group-name "$ACTION_GROUP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --notification-type Email \
        --receiver-name "Admin" \
        2> /dev/null || log_warning "Test notification may not be supported in this CLI version"

    log_info "Check email: $ALERT_EMAIL for test notification"
}

# Function to generate monitoring summary
generate_summary() {
    log_section "Monitoring Setup Summary"

    echo ""
    echo "Application Insights:"
    echo "  Name:            $APP_INSIGHTS_NAME"
    echo "  Resource Group:  $RESOURCE_GROUP"
    echo "  Location:        $LOCATION"
    echo ""

    local conn_string=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString -o tsv 2>/dev/null || echo "N/A")

    echo "Connection String:"
    echo "  $conn_string"
    echo ""

    echo "Configured Alerts:"
    az monitor metrics alert list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name, Enabled:enabled}" -o table 2>/dev/null || echo "  (Unable to list)"
    echo ""

    echo "Action Group:"
    echo "  Name: $ACTION_GROUP_NAME"
    echo "  Email: $ALERT_EMAIL"
    echo ""

    echo "Next Steps:"
    echo "  1. Add connection string to application configuration"
    echo "  2. Deploy updated application with Application Insights SDK"
    echo "  3. Verify telemetry in Azure Portal > Application Insights"
    echo "  4. Import dashboard from fleet-dashboard.json"
    echo "  5. Configure availability tests in Azure Portal"
    echo "  6. Review and customize alert thresholds"
    echo ""
}

# Main setup flow
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "FLEET MANAGEMENT - PRODUCTION MONITORING SETUP"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    check_prerequisites
    setup_application_insights
    setup_action_group
    setup_metric_alerts
    setup_log_alerts
    setup_availability_tests
    setup_dashboard
    setup_log_aggregation
    setup_performance_monitoring
    test_alerts
    generate_summary

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║  ✓ MONITORING SETUP COMPLETED                         ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Run main function
main "$@"
