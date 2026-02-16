# Fleet-CTA Monitoring - Complete File Reference

Quick reference guide to all monitoring files with absolute paths.

## Source Code Files (Monitoring Modules)

All files located in: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/`

### Core Monitoring Modules

1. **prometheus.ts** (550 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/prometheus.ts`
   - Purpose: Prometheus metrics collection
   - Exports: `prometheusMetrics` singleton
   - Key Classes: `PrometheusMetrics`

2. **health-check.ts** (380 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/health-check.ts`
   - Purpose: Kubernetes-compatible health probes
   - Exports: `healthCheckService` singleton
   - Key Classes: `HealthCheckService`
   - Endpoints: 4 (health, live, ready, startup)

3. **structured-logging.ts** (450 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/structured-logging.ts`
   - Purpose: JSON structured logging
   - Exports: Multiple helpers and `structuredLogger`
   - Key Classes: `LogContext`
   - Functions: `logHttpRequest`, `logDatabaseOperation`, `logBusinessEvent`, `logAuditEvent`

4. **monitoring-setup.ts** (250 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/monitoring-setup.ts`
   - Purpose: Main initialization and setup
   - Exports: `initializeMonitoring`, `addMonitoringMiddleware`, `shutdownMonitoring`
   - Functions: Main orchestration functions

5. **sentry.ts** (370 lines) - EXISTING
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/sentry.ts`
   - Purpose: Sentry error tracking
   - Exports: `sentryService` singleton
   - Key Classes: `SentryService`

6. **applicationInsights.ts** (310 lines) - EXISTING
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/applicationInsights.ts`
   - Purpose: Azure Application Insights integration
   - Exports: `telemetryService` singleton
   - Key Classes: `ApplicationInsightsService`

7. **memory.ts** (95 lines) - EXISTING
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/memory.ts`
   - Purpose: Memory monitoring and leak detection
   - Exports: Functions (`initMemoryMonitoring`, `forceGC`, `getMemoryStats`)

## Configuration Files

All files located in: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/`

### Prometheus Configuration

1. **prometheus.yml** (78 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/prometheus.yml`
   - Purpose: Prometheus server configuration
   - Contents:
     - Global settings (15s scrape interval)
     - Fleet API target definition
     - Alert rules reference
     - Recording rules reference
     - Alertmanager configuration
   - Usage: `prometheus --config.file=config/prometheus.yml`

### Alert Rules

2. **alerting-rules.yml** (302 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/alerting-rules.yml`
   - Purpose: 50+ pre-configured alert rules
   - Groups: 2
     - fleet-api-alerts (HTTP, DB, memory, jobs, cache, system)
     - fleet-business-alerts (dispatch, tracking)
   - Alert Severities: critical, warning, info
   - Usage: Referenced in prometheus.yml

### Recording Rules

3. **recording-rules.yml** (294 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/recording-rules.yml`
   - Purpose: 60+ pre-computed metric rules for performance
   - Groups: 3
     - fleet-api-recording-rules (main metrics)
     - fleet-api-business-analytics (business KPIs)
     - fleet-api-slo-tracking (SLO calculations)
   - Usage: Referenced in prometheus.yml

### Grafana Dashboard

4. **grafana-dashboard.json** (332 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/grafana-dashboard.json`
   - Purpose: Pre-built Grafana dashboard definition
   - Panels: 12
     1. API Health Overview
     2. Request Rate
     3. Error Rate
     4. Response Time Distribution
     5. Database Query Performance
     6. Memory Usage
     7. Connection Pool Status
     8. Active Vehicles
     9. Job Queue Status
     10. Job Processing Rate
     11. Cache Hit Rate
     12. Driver Metrics
   - Usage: Import into Grafana via Dashboard → Import

## Documentation Files

All files located in: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/`

### Quick Start Guide

1. **MONITORING_README.md** (396 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/MONITORING_README.md`
   - Audience: Everyone
   - Read Time: 5 minutes
   - Contents:
     - What's been set up (overview)
     - Quick start in 5 steps
     - Key metrics to monitor
     - Pre-configured alerts
     - Log files and querying
     - Common commands
     - Next steps

### Comprehensive Setup Guide

2. **MONITORING_SETUP.md** (673 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/MONITORING_SETUP.md`
   - Audience: DevOps/SRE/Platform engineers
   - Read Time: 30 minutes
   - Contents:
     - Architecture components
     - Installation steps
     - Environment variables
     - Prometheus setup
     - Grafana setup
     - Kubernetes deployment
     - Performance tuning
     - Best practices
     - References

### Alert Configuration Guide

3. **ALERTING_GUIDE.md** (646 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/ALERTING_GUIDE.md`
   - Audience: On-call engineers/Ops
   - Read Time: 25 minutes
   - Contents:
     - Alert architecture
     - All 50+ alerts explained
     - Alertmanager configuration
     - Custom alert creation
     - Alert testing
     - Alert tuning
     - Runbook templates
     - Integration examples

### Dashboard Guide

4. **DASHBOARDS.md** (494 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/DASHBOARDS.md`
   - Audience: Monitoring engineers/Dashboard users
   - Read Time: 20 minutes
   - Contents:
     - Main dashboard breakdown
     - All 12 panels explained
     - PromQL examples
     - Custom dashboard templates
     - Dashboard variables
     - Best practices

### Troubleshooting Guide

5. **TROUBLESHOOTING_MONITORING.md** (653 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/TROUBLESHOOTING_MONITORING.md`
   - Audience: Everyone troubleshooting
   - Read Time: 30 minutes
   - Contents:
     - Quick diagnostics
     - 10 common issues + solutions
     - Performance debugging
     - CPU/memory profiling
     - Escalation procedures

## Index and Reference Files

All files located in: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/`

### Main Index

1. **MONITORING_INDEX.md** (315 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/MONITORING_INDEX.md`
   - Purpose: Complete index and navigation
   - Contents:
     - Documentation index
     - Source code index
     - Metrics summary
     - Alerts summary
     - Health endpoints
     - Dashboard sections
     - Common queries
     - Quick navigation

### Setup Summary

2. **MONITORING_SETUP_SUMMARY.md** (537 lines)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/MONITORING_SETUP_SUMMARY.md`
   - Purpose: What was created and completed deliverables
   - Contents:
     - All 13 deliverables detailed
     - Statistics
     - Integration checklist
     - Quick setup instructions
     - File locations
     - Next steps

### Files Reference

3. **MONITORING_FILES_REFERENCE.md** (this file)
   - Path: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/MONITORING_FILES_REFERENCE.md`
   - Purpose: Complete file listing with absolute paths

## Summary of All Files

### By Category

**Monitoring Modules** (7 files, 2,565 lines):
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/prometheus.ts
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/health-check.ts
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/structured-logging.ts
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/monitoring-setup.ts
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/sentry.ts
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/applicationInsights.ts
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/api/src/monitoring/memory.ts

**Configuration** (4 files, 1,006 lines):
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/prometheus.yml
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/alerting-rules.yml
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/recording-rules.yml
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/grafana-dashboard.json

**Documentation** (5 files, 2,862 lines):
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/MONITORING_README.md
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/MONITORING_SETUP.md
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/ALERTING_GUIDE.md
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/DASHBOARDS.md
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/TROUBLESHOOTING_MONITORING.md

**Index & Reference** (3 files, 1,248 lines):
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/MONITORING_INDEX.md
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/MONITORING_SETUP_SUMMARY.md
- /Users/andrewmorton/Documents/GitHub/Fleet-CTA/MONITORING_FILES_REFERENCE.md

**Total**: 19 files, 7,681 lines

## Usage Patterns

### For Development
Use: `docs/MONITORING_README.md` + local testing
Files needed:
- All source modules in api/src/monitoring/
- prometheus.yml for local Prometheus
- grafana-dashboard.json for Grafana

### For Production Deployment
Use: `docs/MONITORING_SETUP.md` + all configs
Files needed:
- All source modules
- All configuration files
- MONITORING_INDEX.md for reference

### For Alert Configuration
Use: `docs/ALERTING_GUIDE.md` + alerting-rules.yml
Files needed:
- alerting-rules.yml
- Alertmanager configuration template

### For Dashboard Customization
Use: `docs/DASHBOARDS.md` + grafana-dashboard.json
Files needed:
- grafana-dashboard.json as template
- prometheus.yml for data source config

### For Troubleshooting
Use: `docs/TROUBLESHOOTING_MONITORING.md`
Files needed:
- Logs (logs/*.log)
- Prometheus UI (http://localhost:9090)
- Grafana UI (http://localhost:3000)

## Integration Points

### With Flask API
```typescript
import {
  initializeMonitoring,
  addMonitoringMiddleware
} from './monitoring/monitoring-setup';

// Add middleware
app.use(addMonitoringMiddleware);

// Initialize
await initializeMonitoring(app);
```

### With Express Server
Files referenced in: `api/src/server.ts`
- Imports from monitoring-setup.ts
- Middleware registration
- Endpoint registration for /health and /metrics

### With Docker
Files for Docker:
- Dockerfile (add npm dependencies)
- docker-compose.yml (Prometheus, Grafana services)
- Environment variables in .env

### With Kubernetes
Files for K8s:
- Deployment manifest with health probes
- ConfigMap for prometheus.yml
- ConfigMap for alerting-rules.yml
- ServiceMonitor (for Prometheus Operator)

## File Interdependencies

```
prometheus.ts
  └── imported by monitoring-setup.ts
        └── imported by server.ts

health-check.ts
  └── imported by monitoring-setup.ts
        └── imported by server.ts

structured-logging.ts
  └── used throughout codebase for logging

monitoring-setup.ts
  └── main initialization (imported by server.ts)

sentry.ts
  └── already in codebase, integrated with setup

applicationInsights.ts
  └── already in codebase, integrated with setup

memory.ts
  └── already in codebase, called by setup

prometheus.yml
  └── references alerting-rules.yml
  └── references recording-rules.yml
  └── used by Prometheus server

alerting-rules.yml
  └── evaluated by Prometheus
  └── triggers alerts to Alertmanager
  └── documented in docs/ALERTING_GUIDE.md

recording-rules.yml
  └── pre-computes metrics in Prometheus
  └── used by grafana-dashboard.json

grafana-dashboard.json
  └── imported into Grafana
  └── queries Prometheus via prometheus.yml
```

## Quick File Locations for Copy/Reference

```bash
# Copy Prometheus config to system
sudo cp /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/prometheus.yml /etc/prometheus/

# Copy alert rules
sudo cp /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/alerting-rules.yml /etc/prometheus/

# Copy recording rules
sudo cp /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/recording-rules.yml /etc/prometheus/

# Import dashboard URL (no copy needed)
# Load: /Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/grafana-dashboard.json
# Into Grafana UI: Dashboards → Import

# Read documentation
open /Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/MONITORING_README.md
open /Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/MONITORING_SETUP.md
```

## Maintenance

### Update Prometheus Config
File: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/prometheus.yml`
When: Add new scrape targets or adjust intervals

### Update Alert Rules
File: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/alerting-rules.yml`
When: Add new alerts or adjust thresholds

### Update Recording Rules
File: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/config/recording-rules.yml`
When: Add new pre-computed metrics

### Update Dashboard
File: `/Users/anthropmorton/Documents/GitHub/Fleet-CTA/config/grafana-dashboard.json`
When: Add new panels or rearrange layout
Note: Export from Grafana UI rather than editing JSON

### Update Documentation
Files: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/docs/*.md`
When: Process changes, new alerts, new features

---

**Generated**: February 2026
**Version**: 1.0.0
**Status**: Complete
