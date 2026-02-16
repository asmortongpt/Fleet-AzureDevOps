# Fleet-CTA Monitoring and Observability Index

Complete production monitoring setup for Fleet Management API. This document provides an index to all monitoring components and documentation.

## Documentation

### Quick Start
- **[MONITORING_README.md](docs/MONITORING_README.md)** - Quick start guide (5 min read)
  - Enable monitoring in your application
  - Test endpoints and metrics
  - Set up Prometheus and Grafana
  - Key metrics to monitor

### Comprehensive Guides
- **[MONITORING_SETUP.md](docs/MONITORING_SETUP.md)** - Complete setup guide (30 min read)
  - Detailed architecture overview
  - Installation and configuration
  - Environment variables
  - Kubernetes deployment
  - Best practices and security

- **[ALERTING_GUIDE.md](docs/ALERTING_GUIDE.md)** - Alert configuration (25 min read)
  - Alert categories and severity levels
  - Pre-configured alert rules explained
  - Configuring Alertmanager
  - Creating custom alerts
  - Alert tuning and testing
  - On-call runbooks

- **[DASHBOARDS.md](docs/DASHBOARDS.md)** - Dashboard guide (20 min read)
  - Main production dashboard breakdown
  - PromQL query examples
  - Creating custom dashboards
  - Dashboard variables
  - Best practices

- **[TROUBLESHOOTING_MONITORING.md](docs/TROUBLESHOOTING_MONITORING.md)** - Troubleshooting (30 min read)
  - Quick diagnostics
  - 10 common issues with solutions
  - Performance debugging techniques
  - Escalation procedures

## Source Code

### Monitoring Modules
Located in `api/src/monitoring/`:

| File | Purpose | Key Features |
|------|---------|--------------|
| `prometheus.ts` | Metrics collection | 60+ metrics, Prometheus-compatible |
| `health-check.ts` | Health endpoints | 4 K8s probes, service health |
| `structured-logging.ts` | Logging configuration | JSON logs, rotation, levels |
| `sentry.ts` | Error tracking | Exception capture, performance tracking |
| `applicationInsights.ts` | Azure monitoring | Event tracking, dependency monitoring |
| `memory.ts` | Memory monitoring | Heap tracking, leak detection |
| `monitoring-setup.ts` | Main setup | Initializes all components |

### Configuration Files
Located in `config/`:

| File | Purpose | Content |
|------|---------|---------|
| `prometheus.yml` | Prometheus config | Scrape config, targets |
| `alerting-rules.yml` | Alert rules | 50+ production alert rules |
| `recording-rules.yml` | Recording rules | 60+ pre-computed metrics |
| `grafana-dashboard.json` | Grafana dashboard | 12-panel production dashboard |
| `alertmanager.yml` (template) | Alert routing | Notification channels config |

## Metrics

### HTTP/API Metrics
- Request rate and latency (p50, p95, p99)
- Error rate and status codes
- Requests in progress
- By method and route

### Database Metrics
- Query duration and volume
- Connection pool utilization
- Query errors
- By operation type and table

### Business Metrics
- Active vehicles
- Drivers online
- Completed routes
- Dispatched orders
- Queue sizes

### System Metrics
- Memory usage (heap, RSS, percentage)
- CPU usage
- Garbage collection
- Uptime

### Cache Metrics
- Hit rate and misses
- Hit rate percentage
- By cache name

### Job Queue Metrics
- Queue size
- Processing rate
- Failure rate
- Processing duration

## Alerts

### Alert Severity Levels

| Severity | Response Time | Channel | Action |
|----------|--------------|---------|--------|
| CRITICAL | Immediate | Page SRE | Escalate immediately |
| WARNING | 15-30 minutes | Slack | Monitor and plan |
| INFO | Next work day | Slack channel | Log and review |

### Critical Alerts (50+)
- API error rate > 5%
- API response time > 1 second
- Database connection failures
- Service down
- Out of memory
- High job failure rate
- And 44 more...

See [ALERTING_GUIDE.md](docs/ALERTING_GUIDE.md) for complete list and details.

## Health Check Endpoints

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/health` | Full report | General health checks |
| `/health/live` | Liveness probe | K8s liveness probe |
| `/health/ready` | Readiness probe | K8s readiness probe |
| `/health/startup` | Startup probe | K8s startup probe |
| `/metrics` | Prometheus metrics | Metric scraping |

## Log Files

| Location | Format | Retention | Purpose |
|----------|--------|-----------|---------|
| `logs/application-YYYY-MM-DD.log` | JSON | 14 days | All logs |
| `logs/error-YYYY-MM-DD.log` | JSON | 30 days | Errors only |
| `logs/debug-YYYY-MM-DD.log` | JSON | 7 days | Debug logs (dev) |

## Dashboard Sections

1. **Health Overview** - Service status gauge
2. **Request Rate** - Traffic by method
3. **Error Rate** - Failure tracking
4. **Response Time** - Latency by endpoint
5. **Database Performance** - Query metrics
6. **Memory Usage** - Heap and RSS
7. **Connection Pool** - Database pool health
8. **Active Vehicles** - Fleet status
9. **Job Queue** - Queue status
10. **Job Processing** - Throughput
11. **Cache Hit Rate** - Cache efficiency
12. **Driver Metrics** - Operational metrics

## Setup Checklist

### Initial Setup (1-2 hours)
- [ ] Enable monitoring in application code
- [ ] Set environment variables
- [ ] Test health endpoints
- [ ] Verify metrics collection
- [ ] Set up Prometheus
- [ ] Set up Grafana
- [ ] Import dashboard

### Production Setup (2-4 hours)
- [ ] Configure Alertmanager
- [ ] Set up notification channels (Slack, email, PagerDuty)
- [ ] Create on-call runbooks
- [ ] Configure SLO tracking
- [ ] Set up log aggregation (ELK/Azure)
- [ ] Train team on monitoring tools

### Ongoing Maintenance (Weekly/Monthly)
- [ ] Review metrics baseline
- [ ] Adjust alert thresholds
- [ ] Update dashboards
- [ ] Review logs for patterns
- [ ] Conduct alert fire drill
- [ ] Update runbooks

## Key Features

### Production-Ready
- Kubernetes compatible (probes, health checks)
- Azure integrated (Application Insights, Log Analytics)
- Sentry error tracking
- Distributed tracing ready

### Comprehensive Monitoring
- 60+ metrics across 8 categories
- 50+ pre-configured alert rules
- 60+ recording rules for performance
- 4 health check endpoints
- Structured JSON logging

### Well-Documented
- Quick start guide
- Detailed setup documentation
- Alert configuration guide
- Dashboard customization guide
- Troubleshooting guide
- 10+ runbook templates

### Best Practices
- Sensitive data filtering
- Log rotation and retention
- Alert severity levels
- SLO tracking
- Memory leak detection
- Performance profiling

## Integration Examples

### Kubernetes
- Liveness probe: `/health/live`
- Readiness probe: `/health/ready`
- Startup probe: `/health/startup`
- Service discovery for Prometheus

### Docker Compose
Pre-configured with Prometheus, Grafana, Alertmanager

### CI/CD
Pre-deployment health checks
Post-deployment monitoring validation

### Cloud Platforms
- Azure Application Insights
- AWS CloudWatch (with Prometheus)
- GCP Cloud Monitoring (with Prometheus)

## Common Queries

### Response Time by Endpoint
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route)
```

### Error Rate Percentage
```promql
(sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m]))) * 100
```

### Database Slow Queries
```promql
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m])) by (query_type) > 0.5
```

### Memory Leak Detection
```promql
rate(process_resident_memory_bytes[1h]) > 0
```

### Cache Hit Rate
```promql
(sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))) * 100
```

## Support

### Troubleshooting
See [TROUBLESHOOTING_MONITORING.md](docs/TROUBLESHOOTING_MONITORING.md) for:
- 10 common issues with detailed solutions
- Performance debugging techniques
- Memory profiling
- Log analysis
- Escalation procedures

### External Resources
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Azure Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/)
- [Node.js Diagnostics](https://nodejs.org/en/docs/guides/diagnostics/)

## Version Information

- **Version**: 1.0.0
- **Last Updated**: February 2026
- **Status**: Production-Ready
- **Node.js Version**: 20.x+
- **Dependencies**: prom-client, winston, applicationinsights, @sentry/node

## Authors and Contributors

Created as part of Fleet-CTA production deployment. Developed following production best practices and industry standards.

## License

Part of Fleet-CTA project. All rights reserved.

---

## Quick Navigation

**Need to...?**

- **Get started in 5 minutes?** → [MONITORING_README.md](docs/MONITORING_README.md)
- **Set up everything?** → [MONITORING_SETUP.md](docs/MONITORING_SETUP.md)
- **Configure alerts?** → [ALERTING_GUIDE.md](docs/ALERTING_GUIDE.md)
- **Build dashboards?** → [DASHBOARDS.md](docs/DASHBOARDS.md)
- **Fix an issue?** → [TROUBLESHOOTING_MONITORING.md](docs/TROUBLESHOOTING_MONITORING.md)
- **Find a metric?** → [Metrics section above](#metrics)
- **Look up an alert?** → [Alerts section above](#alerts)

---

**For questions or issues**: Refer to the appropriate documentation guide or troubleshooting section.
