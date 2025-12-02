#!/bin/bash

################################################################################
# Fleet Manager iOS - Monitoring Setup Script
#
# This script sets up the complete monitoring stack including:
# - Prometheus for metrics collection
# - Grafana for visualization
# - AlertManager for alerting
# - DataDog agent (optional)
# - Loki for log aggregation
# - Jaeger for distributed tracing
#
# Usage: ./setup-monitoring.sh [options]
#
# Options:
#   --environment=<env>    Environment (development, staging, production)
#   --install-local        Install monitoring stack locally (Docker)
#   --install-cloud        Install monitoring stack on cloud (Kubernetes)
#   --configure-only       Only configure existing installation
#   --skip-datadog         Skip DataDog setup
#   --help                 Show this help message
#
# Created: 2025-11-11
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
INSTALL_LOCAL=false
INSTALL_CLOUD=false
CONFIGURE_ONLY=false
SKIP_DATADOG=false
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/Monitoring"

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --environment=*)
            ENVIRONMENT="${arg#*=}"
            ;;
        --install-local)
            INSTALL_LOCAL=true
            ;;
        --install-cloud)
            INSTALL_CLOUD=true
            ;;
        --configure-only)
            CONFIGURE_ONLY=true
            ;;
        --skip-datadog)
            SKIP_DATADOG=true
            ;;
        --help)
            head -n 20 "$0" | tail -n 19
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        return 1
    fi
    return 0
}

wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $service_name to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

################################################################################
# Installation Functions
################################################################################

install_local_monitoring() {
    log_info "Installing monitoring stack locally with Docker..."

    # Check Docker installation
    if ! check_command docker; then
        log_error "Docker is required for local installation"
        exit 1
    fi

    if ! check_command docker-compose; then
        log_error "Docker Compose is required for local installation"
        exit 1
    fi

    # Create docker-compose.yml
    create_docker_compose

    # Start services
    log_info "Starting monitoring services..."
    docker-compose -f "$MONITORING_DIR/docker-compose.yml" up -d

    # Wait for services
    wait_for_service "http://localhost:9090" "Prometheus"
    wait_for_service "http://localhost:3000" "Grafana"
    wait_for_service "http://localhost:9093" "AlertManager"
    wait_for_service "http://localhost:3100" "Loki"
    wait_for_service "http://localhost:16686" "Jaeger"

    log_success "Local monitoring stack installed successfully!"

    print_service_urls
}

create_docker_compose() {
    log_info "Creating docker-compose.yml..."

    cat > "$MONITORING_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: fleet-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus-metrics.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: fleet-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://localhost:3000
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: fleet-alertmanager
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager-config.yml:/etc/alertmanager/config.yml
      - alertmanager-data:/alertmanager
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    container_name: fleet-loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki-data:/loki
    restart: unless-stopped

  promtail:
    image: grafana/promtail:latest
    container_name: fleet-promtail
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    restart: unless-stopped

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: fleet-jaeger
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "14268:14268"
      - "14250:14250"
      - "9411:9411"
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
  loki-data:
EOF

    log_success "docker-compose.yml created"
}

install_cloud_monitoring() {
    log_info "Installing monitoring stack on Kubernetes..."

    # Check kubectl installation
    if ! check_command kubectl; then
        log_error "kubectl is required for cloud installation"
        exit 1
    fi

    # Check Helm installation
    if ! check_command helm; then
        log_error "Helm is required for cloud installation"
        exit 1
    fi

    # Create namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

    # Install Prometheus using Helm
    log_info "Installing Prometheus..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi

    # Install Loki
    log_info "Installing Loki..."
    helm repo add grafana https://grafana.github.io/helm-charts
    helm upgrade --install loki grafana/loki-stack \
        --namespace monitoring \
        --set loki.persistence.enabled=true \
        --set loki.persistence.size=50Gi

    # Install Jaeger
    log_info "Installing Jaeger..."
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm upgrade --install jaeger jaegertracing/jaeger \
        --namespace monitoring \
        --set storage.type=badger

    log_success "Cloud monitoring stack installed successfully!"

    # Get service URLs
    print_cloud_service_info
}

configure_grafana() {
    log_info "Configuring Grafana..."

    # Create provisioning directory
    mkdir -p "$MONITORING_DIR/grafana-provisioning/datasources"
    mkdir -p "$MONITORING_DIR/grafana-provisioning/dashboards"
    mkdir -p "$MONITORING_DIR/grafana-provisioning/notifiers"

    # Create datasource configuration
    cat > "$MONITORING_DIR/grafana-provisioning/datasources/datasources.yml" << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: false

  - name: Jaeger
    type: jaeger
    access: proxy
    url: http://jaeger:16686
    editable: false
EOF

    # Create dashboard provider
    cat > "$MONITORING_DIR/grafana-provisioning/dashboards/dashboards.yml" << EOF
apiVersion: 1

providers:
  - name: 'Fleet iOS Dashboards'
    orgId: 1
    folder: 'Fleet Manager'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # Copy dashboard
    mkdir -p "$MONITORING_DIR/grafana-provisioning/dashboards/fleet"
    cp "$MONITORING_DIR/grafana-dashboard.json" \
       "$MONITORING_DIR/grafana-provisioning/dashboards/fleet/"

    log_success "Grafana configured"
}

configure_alertmanager() {
    log_info "Configuring AlertManager..."

    cat > "$MONITORING_DIR/alertmanager-config.yml" << EOF
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK_URL}'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    - match:
        severity: warning
      receiver: 'slack'
      continue: true

    - match:
        severity: info
      receiver: 'email'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#mobile-alerts'
        title: 'Fleet iOS Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        description: '{{ .GroupLabels.alertname }}'

  - name: 'slack'
    slack_configs:
      - channel: '#mobile-alerts'
        title: 'Fleet iOS Warning'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        color: 'warning'

  - name: 'email'
    email_configs:
      - to: 'mobile-team@fleet-manager.com'
        from: 'alerts@fleet-manager.com'
        smarthost: 'smtp.fleet-manager.com:587'
        auth_username: 'alerts@fleet-manager.com'
        auth_password: '${SMTP_PASSWORD}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
EOF

    log_success "AlertManager configured"
}

configure_datadog() {
    if [ "$SKIP_DATADOG" = true ]; then
        log_info "Skipping DataDog configuration"
        return
    fi

    log_info "Configuring DataDog..."

    if [ -z "${DATADOG_API_KEY:-}" ]; then
        log_warning "DATADOG_API_KEY not set. Skipping DataDog configuration."
        log_warning "Set DATADOG_API_KEY environment variable to configure DataDog."
        return
    fi

    # Install DataDog agent (if on cloud)
    if [ "$INSTALL_CLOUD" = true ]; then
        helm repo add datadog https://helm.datadoghq.com
        helm upgrade --install datadog datadog/datadog \
            --namespace monitoring \
            --set datadog.apiKey="$DATADOG_API_KEY" \
            --set datadog.appKey="${DATADOG_APP_KEY:-}" \
            --set datadog.logs.enabled=true \
            --set datadog.apm.enabled=true

        log_success "DataDog agent installed"
    fi

    # Import dashboard to DataDog
    if command -v curl &> /dev/null; then
        log_info "Importing dashboard to DataDog..."

        curl -X POST "https://api.datadoghq.com/api/v1/dashboard" \
            -H "Content-Type: application/json" \
            -H "DD-API-KEY: ${DATADOG_API_KEY}" \
            -d @"$MONITORING_DIR/datadog-dashboard.json"

        log_success "Dashboard imported to DataDog"
    fi
}

configure_prometheus() {
    log_info "Configuring Prometheus..."

    # The prometheus-metrics.yml already exists in Monitoring directory
    # Just validate it
    if [ ! -f "$MONITORING_DIR/prometheus-metrics.yml" ]; then
        log_error "prometheus-metrics.yml not found"
        exit 1
    fi

    # Validate Prometheus config
    if command -v promtool &> /dev/null; then
        if promtool check config "$MONITORING_DIR/prometheus-metrics.yml"; then
            log_success "Prometheus configuration is valid"
        else
            log_error "Prometheus configuration is invalid"
            exit 1
        fi
    fi
}

################################################################################
# Service Information
################################################################################

print_service_urls() {
    echo ""
    log_success "Monitoring stack is ready!"
    echo ""
    echo "Service URLs:"
    echo "  Prometheus:    http://localhost:9090"
    echo "  Grafana:       http://localhost:3000 (admin/admin)"
    echo "  AlertManager:  http://localhost:9093"
    echo "  Loki:          http://localhost:3100"
    echo "  Jaeger UI:     http://localhost:16686"
    echo ""
    echo "To view logs: docker-compose -f $MONITORING_DIR/docker-compose.yml logs -f"
    echo "To stop:      docker-compose -f $MONITORING_DIR/docker-compose.yml down"
    echo ""
}

print_cloud_service_info() {
    echo ""
    log_success "Monitoring stack is deployed to Kubernetes!"
    echo ""
    echo "To access services:"
    echo "  Prometheus:    kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
    echo "  Grafana:       kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
    echo "  AlertManager:  kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093"
    echo "  Jaeger:        kubectl port-forward -n monitoring svc/jaeger-query 16686:16686"
    echo ""
    echo "Get Grafana admin password:"
    echo "  kubectl get secret -n monitoring prometheus-grafana -o jsonpath='{.data.admin-password}' | base64 --decode"
    echo ""
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    log_info "Fleet Manager iOS - Monitoring Setup"
    log_info "Environment: $ENVIRONMENT"
    echo ""

    # Validate monitoring directory
    if [ ! -d "$MONITORING_DIR" ]; then
        log_error "Monitoring directory not found: $MONITORING_DIR"
        exit 1
    fi

    # Configure components
    configure_prometheus
    configure_grafana
    configure_alertmanager
    configure_datadog

    # Install if requested
    if [ "$CONFIGURE_ONLY" = false ]; then
        if [ "$INSTALL_LOCAL" = true ]; then
            install_local_monitoring
        elif [ "$INSTALL_CLOUD" = true ]; then
            install_cloud_monitoring
        else
            log_info "No installation method specified (--install-local or --install-cloud)"
            log_info "Configuration files have been created in: $MONITORING_DIR"
        fi
    else
        log_info "Configuration completed. Run with --install-local or --install-cloud to install."
    fi

    echo ""
    log_success "Monitoring setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Review configuration files in: $MONITORING_DIR"
    echo "  2. Configure alert channels (Slack, PagerDuty, Email)"
    echo "  3. Import dashboards to Grafana"
    echo "  4. Configure mobile app to export telemetry"
    echo ""
    echo "Documentation:"
    echo "  - Alerting Rules: $MONITORING_DIR/ALERTING_RULES.md"
    echo "  - Runbooks:       $MONITORING_DIR/RUNBOOKS.md"
    echo "  - SLO Definitions: $MONITORING_DIR/SLO_DEFINITIONS.md"
    echo ""
}

# Run main function
main "$@"
