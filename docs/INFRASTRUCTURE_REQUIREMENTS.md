# Fleet-CTA Infrastructure Requirements

## Overview

This document specifies the hardware, software, and cloud infrastructure requirements for production deployment of Fleet-CTA.

## Table of Contents

1. [Cloud Infrastructure (Azure)](#cloud-infrastructure-azure)
2. [Compute Resources](#compute-resources)
3. [Database (PostgreSQL)](#database-postgresql)
4. [Cache Layer (Redis)](#cache-layer-redis)
5. [Storage](#storage)
6. [Networking & Security](#networking--security)
7. [Load Balancing](#load-balancing)
8. [Disaster Recovery](#disaster-recovery)
9. [Monitoring Infrastructure](#monitoring-infrastructure)
10. [Capacity Planning](#capacity-planning)

---

## Cloud Infrastructure (Azure)

### Subscription & Billing

| Item | Requirement | Notes |
|------|-------------|-------|
| Azure Subscription | Pay-as-you-go or Enterprise | Standard tier minimum |
| Subscription Owner | 1+ | For administration |
| Service Limits | Verified with Azure | Request quota increases if needed |
| Budget Alerts | Configured | Alert at 80% and 100% |
| Cost Analysis | Enabled | Monthly review recommended |

### Azure Resource Groups

Create separate resource groups for logical isolation:

```bash
# Primary applications
fleet-prod-rg                    # Frontend, API, Web Services

# Data services
fleet-database-rg               # PostgreSQL, backup storage

# Secrets & Security
fleet-security-rg               # Key Vault, certificates

# Networking
fleet-network-rg                # VNets, NSGs, load balancers

# Monitoring
fleet-monitoring-rg             # Application Insights, Log Analytics
```

### Required Azure Services

| Service | SKU/Tier | Purpose |
|---------|----------|---------|
| Static Web Apps | Standard | Frontend hosting with CDN |
| App Service | B2 or Premium | Backend API runtime |
| Database (PostgreSQL) | General Purpose (B-series minimum) | Primary data store |
| Redis Cache | Premium (P1 minimum) | Session + caching |
| Key Vault | Standard | Secrets management |
| Storage Account | Standard GRS | File uploads, logs |
| Application Insights | Standard | Monitoring & diagnostics |
| Log Analytics | 100GB retention min | Log aggregation |
| Traffic Manager | Standard | Geographic load balancing |
| VNet | Standard | Network isolation |

---

## Compute Resources

### API Server (Backend)

#### Option A: Azure App Service (Recommended for beginners)

```
Specification:
├── SKU: B2 (Standard)
│   ├── vCPU: 2
│   ├── RAM: 3.5 GB
│   ├── Max: 10 App Service Plans per region
│   └── Scaling: 1-10 instances
├── OS: Linux
├── Runtime: Node.js 20 LTS
├── Disk: 250 GB SSD
└── Network: 500 Mbps bandwidth
```

**Scaling Strategy:**
- Minimum: 1 instance (development)
- Recommended: 2-3 instances (production)
- Maximum: 10 instances (high-traffic scaling)

**Estimated Costs (US East 2):**
- Single B2 instance: ~$130/month
- With 3 instances: ~$390/month
- Premium P1: ~$280/month (more efficient for scaling)

#### Option B: Azure Container Instances (For containerized deployment)

```
Specification:
├── CPU: 2 cores
├── Memory: 4 GB
├── Scaling: 0-1000 instances
├── Cold start: ~5-10 seconds
└── Network: Public or private endpoint
```

**Estimated Costs:**
- 2 vCPU, 4GB RAM: ~$0.0000348 per second (~$3/month per instance)

#### Option C: Azure Kubernetes Service (For advanced orchestration)

```
Specification:
├── Node Pool
│   ├── VM Size: Standard_B2s
│   ├── Min Nodes: 3
│   ├── Max Nodes: 10
│   ├── Disk: 128 GB
│   └── OS: Linux
├── Network Policy: Calico
├── RBAC: Enabled
├── Monitoring: Container Insights
└── Ingress: NGINX or Application Gateway
```

**Estimated Costs:**
- AKS Control Plane: ~$0.10/hour
- 3x B2s nodes: ~$180/month
- Total: ~$270/month

### Frontend Server

#### Azure Static Web Apps

```
Specification:
├── Hosting: Global CDN
├── Regions: 30+ edge locations
├── SSL/TLS: Automatic, managed
├── Scaling: Automatic (no configuration needed)
├── Staging slots: Built-in preview environments
├── Custom domains: Unlimited
└── API backend: Integrated
```

**Estimated Costs:**
- 1 Free instance: $0/month (limited)
- Standard instance: ~$25/month
- Reserved instances: ~$200/month (10 instances)

---

## Database (PostgreSQL)

### Azure Database for PostgreSQL - Single Server (Recommended)

```
Specification:
├── Engine: PostgreSQL 16.x
├── SKU: General Purpose
│   ├── vCPU: 2
│   ├── RAM: 8 GB
│   ├── Storage: 50 GB (scalable up to 1 TB)
│   ├── IOPS: Variable by tier
│   └── Backup: 35 days retention
├── Network
│   ├── Ports: 5432 (standard), SSL required
│   ├── VNet Integration: Supported
│   └── Private Endpoint: Supported
├── HA (High Availability)
│   ├── Geo-redundant backup: Enabled
│   ├── Zone-redundant: Optional
│   └── Replica: Up to 5 read replicas
└── SSL/TLS: TLS 1.2 enforced
```

**Storage Planning:**

| Data Volume | Recommended Storage | Estimated Cost |
|-------------|-------------------|----------------|
| < 100 GB | 50 GB | ~$200/month |
| 100-500 GB | 250 GB | ~$350/month |
| 500 GB-1 TB | 500 GB | ~$450/month |
| > 1 TB | 1 TB+ | ~$650+/month |

**Performance Tiers:**

| Tier | vCPU | RAM | Storage | Use Case |
|------|------|-----|---------|----------|
| Basic | 1-2 | 2-4 GB | 5-1024 GB | Development/testing |
| General Purpose | 2-32 | 8-128 GB | 5-1024 GB | Production (recommended) |
| Memory Optimized | 2-32 | 16-256 GB | 5-1024 GB | High-volume, complex queries |

**Connection Pool Configuration:**

```
Max Connections: 100 total
├── Web App User: 30 connections
├── Admin User: 5 connections
├── Read-Only User: 10 connections
└── Reserved: 55 connections

Timeout Settings:
├── Idle Timeout: 30 seconds
├── Connection Timeout: 10 seconds
└── Query Timeout: 30 seconds
```

### PostgreSQL Backup Strategy

```
Daily Backup:
├── Full backup: Once per week (Sunday)
├── Differential: Daily (automated)
├── Retention: 35 days (Azure default)
├── Location: Geo-redundant storage
└── RPO: 24 hours

On-Demand Backup:
├── Snapshot before major deployment
├── Snapshot before schema changes
├── Manual point-in-time restore: Within 35 days
└── Long-term archive: To Blob Storage

Recovery Time Objective (RTO): < 1 hour
Recovery Point Objective (RPO): < 24 hours
```

### Database Scaling

```
Vertical Scaling (Change SKU):
├── Downtime: 5-15 minutes
├── Process: Scale up/down CPU or storage
├── Frequency: As needed
└── Alert trigger: CPU > 80% for 5+ minutes

Horizontal Scaling:
├── Read replicas: Add for query scaling
├── Max replicas: 5
├── Cross-region: Supported
└── Manual failover: Available
```

---

## Cache Layer (Redis)

### Azure Cache for Redis

```
Specification:
├── Engine: Redis 7.x
├── SKU: Premium (P1)
│   ├── Size: 6 GB
│   ├── CPU Cores: 2
│   ├── Connections: Up to 40,000
│   ├── Throughput: 1 GB/s
│   └── Tier Options: Basic, Standard, Premium
├── Network
│   ├── Ports: 6380 (TLS), 6379 (non-TLS)
│   ├── Clustering: Enabled in Premium
│   └── Geo-replication: Premium only
├── Persistence
│   ├── RDB: Daily snapshots
│   ├── AOF: Append-only file (optional)
│   └── Retention: 2 GB minimum
└── SSL/TLS: TLS 1.2 enforced
```

**Sizing Guide:**

| Size | Memory | Concurrent Connections | Use Case |
|------|--------|----------------------|----------|
| Basic 1GB | 1 GB | 256 | Development only |
| Standard 2GB | 2 GB | 1,000 | Small production |
| Premium 6GB | 6 GB | 40,000 | Production (recommended) |
| Premium 26GB | 26 GB | 40,000 | High-volume cache |

**Estimated Costs:**

| SKU | Size | Monthly Cost |
|-----|------|-------------|
| Premium | 6 GB | ~$300 |
| Premium | 26 GB | ~$1,000 |
| Enterprise | 6 GB | ~$400 |

**Redis Memory Allocation:**

```
Total: 6 GB
├── Session Storage: 1 GB (~100K sessions)
├── User Cache: 1 GB
├── Vehicle Data Cache: 1.5 GB
├── Config Cache: 500 MB
├── Rate Limit Counters: 500 MB
├── Pub/Sub Messages: 500 MB
└── Reserved: 1 GB (overflow buffer)
```

### Redis Configuration

```
Key Expiration:
├── Sessions: 24 hours (86,400 seconds)
├── User Data: 5 minutes (300 seconds)
├── Vehicle Data: 1 minute (60 seconds)
├── Config: 1 hour (3,600 seconds)
└── Temp Data: 5 minutes (300 seconds)

Eviction Policy:
├── Policy: allkeys-lru (Least Recently Used)
├── When: Memory limit reached
├── Action: Evict least recently used keys
└── Max Memory: 6 GB

Persistence:
├── RDB Snapshots: Every 6 hours
├── AOF: Disabled (for performance)
└── Backup: Hourly to Blob Storage
```

---

## Storage

### Azure Storage Account

```
Specification:
├── Tier: Standard GRS (Geo-Redundant Storage)
├── Replication: Across regions
├── Access Tier: Hot
├── HTTPS Only: Enabled
├── Min TLS: 1.2
└── Capacity: 500 TB per account

Containers:
├── vehicle-photos
│   ├── Content Type: image/jpeg, image/png
│   ├── Max Size: 100 MB per file
│   ├── Retention: 365 days
│   └── Access: Private + SAS tokens
├── documents
│   ├── Content Type: application/pdf, application/msword
│   ├── Max Size: 50 MB per file
│   ├── Retention: 7 years (compliance)
│   └── Access: Private + SAS tokens
└── logs
    ├── Content Type: application/x-gzip (logs.gz)
    ├── Retention: 90 days
    ├── Access: Internal only
    └── Archival: To Cool tier after 30 days
```

**Estimated Storage Costs:**

| Data Type | Volume | Monthly Cost |
|-----------|--------|-------------|
| Vehicle Photos (5MB ea) | 1,000 photos = 5 GB | ~$0.25 |
| Documents (2MB ea) | 10,000 docs = 20 GB | ~$1 |
| Logs (rotated) | 50 GB total | ~$2.50 |
| Backups | 50 GB | ~$2.50 |
| **Total** | **~125 GB** | **~$6.25** |

### Blob Storage Lifecycle

```
Rules:
├── Photo Blobs
│   ├── Move to Cool after 90 days
│   ├── Move to Archive after 365 days
│   └── Delete after 7 years
├── Log Blobs
│   ├── Delete after 90 days
│   └── Compress with gzip
└── Backup Blobs
    ├── Keep in Hot for 30 days
    ├── Move to Cool for 60 days
    └── Delete after 90 days
```

---

## Networking & Security

### Virtual Network (VNet)

```
Configuration:
├── Address Space: 10.0.0.0/16
├── Subnets
│   ├── App Service: 10.0.1.0/24 (250 usable IPs)
│   ├── Database: 10.0.2.0/24 (250 usable IPs)
│   ├── Cache: 10.0.3.0/24 (250 usable IPs)
│   └── Bastion: 10.0.255.0/24 (for secure access)
├── DNS: Azure default + custom if needed
└── DDoS Protection: Standard (included)
```

### Network Security Groups (NSGs)

**API Server NSG Rules:**

| Priority | Direction | Protocol | Port | Source | Action | Purpose |
|----------|-----------|----------|------|--------|--------|---------|
| 100 | Inbound | TCP | 443 | Internet | Allow | HTTPS |
| 110 | Inbound | TCP | 80 | Internet | Allow | HTTP (redirect) |
| 120 | Inbound | TCP | 3001 | VNet | Allow | Internal API |
| 130 | Inbound | TCP | 22 | 203.0.113.0/24 | Allow | SSH (admin only) |
| 1000 | Inbound | * | * | * | Deny | Default deny |
| 100 | Outbound | TCP | 5432 | 10.0.2.0/24 | Allow | Database |
| 110 | Outbound | TCP | 6380 | 10.0.3.0/24 | Allow | Redis |
| 120 | Outbound | TCP | 443 | Internet | Allow | HTTPS (API calls) |
| 1000 | Outbound | * | * | * | Allow | Default allow |

**Database NSG Rules:**

| Priority | Direction | Protocol | Port | Source | Action |
|----------|-----------|----------|------|--------|--------|
| 100 | Inbound | TCP | 5432 | 10.0.1.0/24 | Allow |
| 110 | Inbound | TCP | 5432 | 10.0.255.0/24 | Allow |
| 1000 | Inbound | * | * | * | Deny |

**Redis NSG Rules:**

| Priority | Direction | Protocol | Port | Source | Action |
|----------|-----------|----------|------|--------|--------|
| 100 | Inbound | TCP | 6380 | 10.0.1.0/24 | Allow |
| 110 | Inbound | TCP | 6380 | 10.0.255.0/24 | Allow |
| 1000 | Inbound | * | * | * | Deny |

### Firewall & DDoS

```
Azure DDoS Protection: Standard (included)
├── Layer 3-4: Automatic
├── Layer 7: Via WAF
└── Alerts: Enabled

Web Application Firewall (WAF):
├── Mode: Prevention
├── Rule Sets: OWASP Top 10
├── Geo-filtering: Enabled for known attackers
└── Rate limiting: 100 req/min per IP
```

### SSL/TLS Certificates

```
Certificate Management:
├── Provider: Azure (auto-managed) or Let's Encrypt
├── Domain: fleet.capitaltechalliance.com
├── Renewal: Automatic (60+ days before expiry)
├── Chain: DigiCert or ISRG X1
├── Key Size: RSA 2048 bit minimum
├── Cipher Suite: TLS 1.2+
└── HSTS: Enabled (max-age=31536000)

Monitoring:
├── Renewal alerts: 60 days before expiry
├── Validity checks: Daily
└── Revocation: Immediate if compromised
```

---

## Load Balancing

### Traffic Distribution Strategy

```
Layer:
├── Global Layer: Traffic Manager
│   ├── DNS-based routing
│   ├── Geographic routing
│   ├── Performance-based routing
│   └── Weighted round-robin
├── Regional Layer: Application Gateway
│   ├── HTTP/2 support
│   ├── SSL termination
│   ├── WAF integration
│   └── Path-based routing
└── Application Layer: App Service
    ├── Auto-scaling (2-10 instances)
    ├── Session affinity: Off (stateless)
    ├── Connection draining: 300 seconds
    └── Health probe: /api/health (5s interval)
```

### Azure Traffic Manager

```
Configuration:
├── Routing Method: Performance-based
├── Endpoints
│   ├── Primary: fleet.eastus2.azurewebsites.net
│   ├── Secondary: fleet.northcentralus.azurewebsites.net (optional)
│   └── Priority: Primary > Secondary
├── Health Probes
│   ├── Protocol: HTTPS
│   ├── Path: /api/health
│   ├── Interval: 10 seconds
│   ├── Timeout: 5 seconds
│   └── Threshold: 3 failed probes
└── TTL: 60 seconds
```

### Azure Application Gateway (Optional)

```
Configuration:
├── Tier: Standard v2
├── Capacity: 2-100 units
├── Listeners
│   ├── HTTPS on port 443
│   └── HTTP on port 80 (redirect to HTTPS)
├── Backend Pools
│   ├── App Service (1+ instances)
│   └── Health probe: /api/health
├── Rules
│   ├── Path-based: /api/* → API backend
│   ├── Path-based: /* → Static Web Apps
│   └── Priority: 100, 200
└── WAF: OWASP Top 10 prevention
```

---

## Disaster Recovery

### Backup & Recovery Strategy

```
Objectives:
├── RPO (Recovery Point Objective): < 24 hours
├── RTO (Recovery Time Objective): < 4 hours
└── Monthly DR drill: Required

Database Backups:
├── Automated daily backup: 35 days retention
├── Geo-redundant: Primary + Secondary region
├── Point-in-time restore: Up to 35 days
├── Full snapshot: Before major deployments
└── Long-term archive: To Blob Storage (cold tier)

Application Backups:
├── Code: Git repository (GitHub)
├── Configuration: Azure Key Vault (replicated)
├── Container images: Azure Container Registry (replicated)
└── Build artifacts: Azure Artifacts (30-day retention)

Testing:
├── Monthly restore tests: From backup
├── Quarterly failover drill: To secondary region
├── Annual full DR test: Complete failure scenario
└── Documentation: Updated after each test
```

### Geo-Redundancy

```
Primary Region: US East 2 (eastus2)
├── Static Web Apps
├── App Service
├── PostgreSQL
├── Redis Cache
└── Storage Account

Secondary Region: North Central US (northcentralus)
├── PostgreSQL replica (read-only)
├── Backup Storage Account
└── Hot standby (optional for critical apps)

Failover Process:
├── Automatic detection: Traffic Manager monitors health
├── DNS failover: Propagates within 60 seconds
├── Database: Promote read replica to primary (manual)
├── Application: Redeploy to secondary region
└── Total failover time: 10-30 minutes
```

### Disaster Recovery Runbook

```
Pre-Disaster:
1. Test monthly (restore from backup)
2. Document secondary region configuration
3. Maintain updated runbook
4. Train operations team

During Disaster:
1. Declare disaster (P1 incident)
2. Activate incident response team
3. Begin failover to secondary region
4. Notify customers and stakeholders
5. Monitor secondary region health

Post-Disaster:
1. Document what failed and why
2. Analyze logs and metrics
3. Update runbook based on learnings
4. Complete post-incident review
5. Improve procedures and monitoring
```

---

## Monitoring Infrastructure

### Application Insights

```
Specification:
├── SKU: Standard (or Enterprise for advanced features)
├── Capacity: 100 GB/day (scalable)
├── Retention: 90 days (adjustable up to 2 years)
├── Sampling: Adaptive (automatic)
├── Cost: $2.99/GB ingested
└── Regional deployment: Colocated with app

Metrics Collected:
├── Request rate, response time, failure rate
├── Exception tracking (with stack traces)
├── Performance counters (CPU, memory, disk)
├── Custom events and metrics
├── User sessions and behavior
└── Availability tests
```

### Log Analytics

```
Specification:
├── SKU: Per GB (pay-as-you-go)
├── Retention: 30-2,555 days configurable
├── Ingestion Rate: Up to 50 GB/day
├── Query Language: Kusto Query Language (KQL)
├── Workspaces: 1 for all services
└── Cost: ~$0.50-2.00/GB/month

Data Sources:
├── Application Insights events
├── Azure resource diagnostics
├── App Service logs
├── Database logs (optional)
├── Container logs (if using AKS)
└── Custom application logs
```

### Alerts & Notifications

```
Alert Rules:
├── API Health
│   ├── Response time > 500ms
│   ├── Error rate > 1%
│   ├── Availability < 99.5%
│   └── Alert group: On-call engineer
├── Database Health
│   ├── CPU > 80%
│   ├── Connection pool usage > 80%
│   ├── Storage usage > 80%
│   └── Alert group: DBA team
├── Infrastructure
│   ├── Memory > 85%
│   ├── Disk > 80%
│   ├── Network errors > 5/min
│   └── Alert group: Infrastructure team
└── Security
    ├── Failed login attempts > 10/5min
    ├── Unauthorized API calls > 100/hour
    ├── SSL certificate expiry < 30 days
    └── Alert group: Security team

Notification Channels:
├── Email: Critical alerts
├── SMS: P1 incidents
├── PagerDuty: On-call rotation
├── Slack: #incidents channel
└── Teams: Microsoft Teams integration
```

---

## Capacity Planning

### Current & Projected Load

```
Baseline (Month 1):
├── Daily Active Users: 100-500
├── Concurrent Users: 10-50
├── Requests/second: 5-20
├── API response time: < 200ms p95
└── Database queries/second: 50-100

Projected Growth (Year 1):
├── Q2: 2x baseline
├── Q3: 4x baseline
├── Q4: 8x baseline
└── Year-end: 10x baseline

Scaling Triggers:
├── API CPU > 70% for 5 minutes: Add instance
├── Database CPU > 75% for 10 minutes: Scale up
├── Redis memory > 80%: Increase size
├── Network throughput > 70%: Add connections
└── Disk usage > 80%: Expand storage
```

### Cost Projection

**Monthly Recurring Costs (Year 1):**

| Component | Month 1 | Month 6 | Month 12 |
|-----------|---------|---------|----------|
| App Service | $130 | $390 | $650 |
| PostgreSQL | $200 | $250 | $400 |
| Redis | $300 | $300 | $300 |
| Static Web Apps | $25 | $50 | $100 |
| Storage | $10 | $20 | $50 |
| Application Insights | $50 | $75 | $100 |
| Key Vault | $1 | $1 | $1 |
| Traffic Manager | $0.60 | $0.60 | $0.60 |
| **Total** | **$716.60** | **$1,066.60** | **$1,601.60** |

**Optimization Tips:**
- Reserved instances: 30-40% discount for 1-year commitment
- Spot VMs: 70-90% discount (if using AKS)
- Storage lifecycle: Move old logs to Cool/Archive tier
- Database read replicas: For reporting queries only
- CDN caching: Reduces origin bandwidth usage

---

## Pre-Production Checklist

- [ ] All Azure resources created and configured
- [ ] Network isolation and security groups validated
- [ ] SSL/TLS certificates installed and tested
- [ ] Database backups configured and tested
- [ ] Monitoring and alerts enabled
- [ ] Auto-scaling policies configured
- [ ] Load balancing tested with traffic simulation
- [ ] Disaster recovery runbook documented and tested
- [ ] Capacity planning completed
- [ ] Cost projections validated
- [ ] Network latency tested (< 100ms to users)
- [ ] Security scan completed (OWASP Top 10)
- [ ] Performance baseline established
- [ ] Incident response team trained

---

**Document Version:** 1.0
**Last Updated:** February 15, 2024
**Maintained By:** Infrastructure Team
