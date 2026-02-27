# Fleet-CTA Scaling Guide

## Table of Contents

1. [Scaling Overview](#scaling-overview)
2. [Horizontal Scaling (API)](#horizontal-scaling-api)
3. [Vertical Scaling (Database)](#vertical-scaling-database)
4. [Cache Layer Scaling](#cache-layer-scaling)
5. [Load Balancing Strategy](#load-balancing-strategy)
6. [Database Replication](#database-replication)
7. [Monitoring & Auto-Scaling](#monitoring--auto-scaling)
8. [Performance Optimization](#performance-optimization)
9. [Capacity Planning](#capacity-planning)
10. [Scaling Workflows](#scaling-workflows)

---

## Scaling Overview

### Current Architecture Limits

| Component | Current Limit | Scaling Factor |
|-----------|---------------|-----------------|
| API (B2 App Service) | 2 vCPU, 3.5GB RAM | Can scale to 10 instances |
| Database (B-series) | 2 vCPU, 8GB RAM | Can scale to 32 vCPU, 256GB |
| Redis (Premium P1) | 6GB | Can scale to 368GB |
| Frontend (Static Web Apps) | Unlimited CDN | Auto-scales globally |
| Storage | Up to 500TB | Practically unlimited |

### Scaling Decision Tree

```
Current Performance Issue?
├── API Response Time Slow?
│   ├── Yes → Add API Instances (Horizontal)
│   └── No → Continue
├── Database CPU High?
│   ├── Yes → Upgrade Database SKU (Vertical)
│   └── No → Continue
├── Redis Memory High?
│   ├── Yes → Upgrade Redis Size
│   └── No → Continue
├── Query Performance Slow?
│   ├── Yes → Add Indexes / Optimize Queries
│   └── No → Monitor and repeat
```

---

## Horizontal Scaling (API)

### Add More API Instances

**When to scale:** API CPU > 70% for 10+ minutes

```bash
# Current setup
az appservice plan show \
  --name fleet-api-plan \
  --resource-group fleet-prod-rg \
  --query "numberOfWorkers"

# Scale to 3 instances
az appservice plan update \
  --name fleet-api-plan \
  --resource-group fleet-prod-rg \
  --number-of-workers 3

# Verify scaling
az appservice plan show \
  --name fleet-api-plan \
  --query "numberOfWorkers"

# Monitor gradual scaling (recommended)
# Don't jump from 1 to 10 instances at once
# Scale incrementally: 1 → 2 → 3 → 5 → 10
```

### Auto-Scaling Configuration

**Automatic horizontal scaling based on metrics:**

```bash
# Create auto-scale setting
az monitor autoscale create \
  --name fleet-api-autoscale \
  --resource-group fleet-prod-rg \
  --resource fleet-api-plan \
  --resource-type "Microsoft.Web/serverfarms" \
  --min-count 2 \
  --max-count 10 \
  --count 2

# Add CPU-based rule
az monitor autoscale rule create \
  --autoscale-name fleet-api-autoscale \
  --resource-group fleet-prod-rg \
  --condition "Percentage CPU > 75 avg 5m" \
  --scale-out-cooldown 5m \
  --scale-in-cooldown 15m \
  --scale out 1

# Add memory-based rule
az monitor autoscale rule create \
  --autoscale-name fleet-api-autoscale \
  --resource-group fleet-prod-rg \
  --condition "Memory Percentage > 80 avg 5m" \
  --scale-out-cooldown 5m \
  --scale out 1

# Add request count rule
az monitor autoscale rule create \
  --autoscale-name fleet-api-autoscale \
  --resource-group fleet-prod-rg \
  --condition "Requests > 1000 avg 5m" \
  --scale-out-cooldown 5m \
  --scale out 2
```

### API Instance Configuration

```bash
# Verify connection pooling across instances
# All instances should connect to same Redis session store

# Check session stickiness (should be disabled for horizontal scaling)
az webapp config show \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod \
  --query "id"

# Ensure sessions stored in Redis (not in-memory)
# In code:
const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'session:'
});

app.use(session({
  store: sessionStore,
  cookie: { secure: true, httpOnly: true, sameSite: 'strict' }
}));
```

### Monitoring Multi-Instance Deployment

```bash
# Monitor CPU across all instances
az monitor metrics list \
  --resource-group fleet-prod-rg \
  --resource fleet-api-prod \
  --resource-type "Microsoft.Web/sites" \
  --metric "CpuPercentage" \
  --interval PT1M \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --aggregation Average

# Check request distribution
az monitor metrics list \
  --resource-group fleet-prod-rg \
  --resource fleet-api-prod \
  --resource-type "Microsoft.Web/sites" \
  --metric "Requests" \
  --aggregation Total

# Verify health checks
# All instances should pass health check
for i in {1..10}; do
  curl -s https://fleet-api-prod-[instanceN].azurewebsites.net/api/health \
    | jq .status
done
```

---

## Vertical Scaling (Database)

### Upgrade Database SKU

**When to scale:** Database CPU > 80% consistently

**Current Configuration:**
```
SKU: B_Gen5_2 (B = Burstable)
- vCPU: 2
- RAM: 8 GB
- Storage: 50 GB
- Cost: ~$200/month
```

**Upgrade Options:**

```
B_Gen5_4 (Burstable)
- vCPU: 4
- RAM: 16 GB
- Storage: 50 GB
- Cost: ~$300/month
- Use for: Short traffic spikes

GP_Gen5_4 (General Purpose)
- vCPU: 4
- RAM: 16 GB
- Storage: 50-1024 GB
- Cost: ~$350/month
- Use for: Sustained high traffic

GP_Gen5_8 (General Purpose)
- vCPU: 8
- RAM: 32 GB
- Storage: 50-1024 GB
- Cost: ~$650/month
- Use for: Very high traffic

MO_Gen5_4 (Memory Optimized)
- vCPU: 4
- RAM: 32 GB
- Storage: 50-1024 GB
- Cost: ~$400/month
- Use for: Complex queries, analytics
```

### Perform Database Upgrade

```bash
# 1. Create backup before upgrade
pg_dump fleet_production > pre-upgrade-backup.sql

# 2. Schedule maintenance window
# (Azure will need to restart server)
# Typical downtime: 1-2 minutes

# 3. Upgrade to new SKU
az postgres server update \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod \
  --sku-name GP_Gen5_4  # Example: General Purpose 4 vCPU

# Monitor upgrade progress
watch az postgres server show \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod \
  --query "storageMb, skuName, userVisibleState"

# 4. Verify connection after upgrade
psql -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production \
  -c "SELECT version();"

# 5. Run optimization
psql << EOF
ANALYZE;
REINDEX DATABASE fleet_production;
VACUUM ANALYZE;
EOF

# 6. Verify performance improvement
# Compare metrics before/after
```

### Database Storage Expansion

```bash
# Current storage usage
psql -c "SELECT pg_size_pretty(pg_database_size('fleet_production'));"

# Upgrade storage
az postgres server update \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod \
  --storage-size 102400  # 100 GB (in MB)

# Verify new size
az postgres server show \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod \
  --query "storageMb"
```

---

## Cache Layer Scaling

### Upgrade Redis Size

**When to scale:** Redis memory > 80% usage

```bash
# Check current usage
redis-cli -h fleet-redis-prod.redis.cache.windows.net \
  -p 6380 -a $REDIS_PASSWORD --tls \
  INFO memory

# Current: Premium P1 = 6GB

# Upgrade options:
# P1: 6GB
# P2: 26GB
# P3: 53GB
# P4: 107GB
# P5: 368GB
```

**Perform Upgrade:**

```bash
# 1. Create snapshot (automated)
# Azure Redis automatically snapshots before upgrade

# 2. Upgrade to new size (no downtime)
az redis update \
  --name fleet-redis-prod \
  --resource-group fleet-prod-rg \
  --sku Premium \
  --vm-size p2  # p1, p2, p3, p4, p5

# 3. Verify upgrade
az redis show \
  --name fleet-redis-prod \
  --resource-group fleet-prod-rg \
  --query "capacity"

# 4. Monitor for issues
redis-cli INFO stats
```

### Redis Clustering

**For very high traffic (optional):**

```bash
# Enable clustering in Premium tier
az redis create \
  --name fleet-redis-prod-cluster \
  --resource-group fleet-prod-rg \
  --location eastus2 \
  --sku Premium \
  --vm-size p1 \
  --zones 1 2 3  # Availability zones
  --enable-non-ssl-port false

# Clustering partitions data across nodes
# Requires client-side support
```

### Redis Data Eviction Policy

```bash
# Check eviction policy
redis-cli CONFIG GET maxmemory-policy

# Set eviction policy (default is usually good)
redis-cli CONFIG SET maxmemory-policy allkeys-lru
# Options:
# - noeviction: Return error when memory full
# - allkeys-lru: Evict least recently used keys
# - volatile-lru: Evict LRU keys with TTL
# - allkeys-random: Random eviction
# - volatile-random: Random TTL keys
```

---

## Load Balancing Strategy

### Traffic Manager Configuration

```bash
# View current configuration
az traffic-manager profile show \
  --name fleet-traffic-manager \
  --resource-group fleet-prod-rg \
  --query "trafficRoutingMethod"

# Performance routing (default): Route to lowest latency endpoint
az traffic-manager profile update \
  --name fleet-traffic-manager \
  --resource-group fleet-prod-rg \
  --traffic-routing-method Performance

# Geographic routing: Route based on user location
az traffic-manager profile update \
  --name fleet-traffic-manager \
  --resource-group fleet-prod-rg \
  --traffic-routing-method Geographic
```

### Application Gateway Setup (Optional)

```bash
# Create Application Gateway for advanced routing
az network application-gateway create \
  --name fleet-appgw \
  --resource-group fleet-prod-rg \
  --capacity 2-10 \
  --sku Standard_v2 \
  --http-settings-cookie-based-affinity Disabled \
  --frontend-port 443 \
  --http-settings-port 80 \
  --cert-password $CERT_PASSWORD \
  --cert-file fleet.pfx

# Path-based routing example
az network application-gateway url-path-map create \
  --gateway-name fleet-appgw \
  --resource-group fleet-prod-rg \
  --name fleet-routing \
  --paths "/api/*" "/health/*" \
  --address-pool api-backend \
  --http-settings http-settings
```

### Connection Pooling

```bash
# Verify connection pooling configuration
psql -c "SHOW max_connections;"
psql -c "SHOW shared_buffers;"

# Monitor connection usage
psql -c "SELECT datname, count(*) FROM pg_stat_activity
         GROUP BY datname
         ORDER BY count(*) DESC;"

# Use PgBouncer for connection pooling (optional)
# Useful when API instances exceed 100
```

---

## Database Replication

### Read Replicas

```bash
# Create read replica (for reporting/analytics)
az postgres server replica create \
  --name fleet-db-read-1 \
  --resource-group fleet-prod-rg \
  --source-server fleet-db-prod

# Replica characteristics:
# - Read-only
# - Separate connection string
# - Can be in different region
# - Automatic syncing
```

### Using Read Replicas

```bash
# Application configuration
# Primary (write): fleet-db-prod.postgres.database.azure.com
# Replica (read): fleet-db-read-1.postgres.database.azure.com

// In application code:
const writeDb = new Pool({
  host: 'fleet-db-prod.postgres.database.azure.com',
  user: 'fleet_webapp_user',
  password: WRITE_DB_PASSWORD
});

const readDb = new Pool({
  host: 'fleet-db-read-1.postgres.database.azure.com',
  user: 'fleet_readonly_user',
  password: READ_DB_PASSWORD
});

// Route analytics/reporting to read replica
app.get('/api/analytics/vehicles', async (req, res) => {
  // Use read replica for analytics
  const result = await readDb.query('SELECT * FROM vehicles');
  res.json(result.rows);
});

// Route writes to primary
app.post('/api/vehicles', async (req, res) => {
  // Use primary database for writes
  const result = await writeDb.query(INSERT_QUERY, VALUES);
  res.json(result.rows);
});
```

### Geo-Replication

```bash
# Create replica in different region
az postgres server replica create \
  --name fleet-db-prod-west \
  --resource-group fleet-prod-rg \
  --source-server fleet-db-prod \
  --location westus2

# Use for:
# - Disaster recovery
# - Geographic load distribution
# - Reduced latency for West Coast users

# Failover to replica (if primary fails)
az postgres server update \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod-west \
  --stop-ha-bak  # Stop replication, make independent
```

---

## Monitoring & Auto-Scaling

### Key Metrics to Monitor

```bash
# Create dashboard with critical metrics
az monitor metrics list \
  --resource-group fleet-prod-rg \
  --resource fleet-api-prod \
  --resource-type "Microsoft.Web/sites" \
  --metric CpuPercentage \
  --metric MemoryPercentage \
  --metric Requests \
  --metric Http5xx

# Set up alerts
az monitor metrics alert create \
  --name "API-High-CPU" \
  --resource-group fleet-prod-rg \
  --scopes "/subscriptions/{sub}/resourceGroups/fleet-prod-rg/providers/Microsoft.Web/sites/fleet-api-prod" \
  --condition "avg CpuPercentage > 75" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group api-alerts
```

### Performance Thresholds

```
Metric                 | Yellow Alert | Red Alert | Auto-Scale Action
API CPU                | > 60%        | > 80%     | Scale out at 75%
API Memory             | > 70%        | > 85%     | Scale out at 80%
API Response Time p95  | > 500ms      | > 1000ms  | Scale out immediately
Database CPU           | > 75%        | > 90%     | Upgrade SKU
Database Connections   | > 80 used    | > 95 used | Scale out API
Redis Memory           | > 75%        | > 90%     | Upgrade size
Request Rate           | > 1000/sec   | > 2000/s  | Scale out
Error Rate             | > 0.5%       | > 1%      | Page on-call engineer
Disk Usage             | > 75%        | > 90%     | Archive/cleanup
```

---

## Performance Optimization

### Before Scaling

**Optimize first, scale second:**

1. **Query Optimization**
   ```sql
   -- Add indexes on frequently filtered columns
   CREATE INDEX idx_vehicles_fleet_status ON vehicles(fleet_id, status);

   -- Analyze query plans
   EXPLAIN ANALYZE SELECT * FROM vehicles
   WHERE fleet_id = $1 AND status = 'active';
   ```

2. **Caching Strategy**
   ```javascript
   // Cache frequently accessed data
   const vehicles = await cache.getOrFetch(
     'vehicles:list',
     () => db.select().from('vehicles'),
     60000  // Cache for 1 minute
   );
   ```

3. **Database Connection Pooling**
   ```bash
   # Ensure proper pool size
   DB_POOL_SIZE=30  # Don't exceed max_connections / number_of_instances
   ```

4. **Batch Operations**
   ```javascript
   // Batch inserts instead of individual inserts
   const values = vehicles.map(v => [v.id, v.name]);
   db.query('INSERT INTO vehicles VALUES ${values}', [values]);
   ```

5. **API Response Compression**
   ```javascript
   app.use(compression());  // gzip responses
   ```

### Cache Warming

```bash
#!/bin/bash
# Pre-load frequently accessed data into cache
curl https://fleet-api-prod.azurewebsites.net/api/cache/warm

# Endpoint implementation
app.post('/api/cache/warm', async (req, res) => {
  // Warm user cache
  const users = await db.select().from('users');
  for (const user of users) {
    await cache.set(`user:${user.id}`, user, 3600);
  }

  // Warm config cache
  const config = await db.select().from('config');
  await cache.set('app:config', config, 3600);

  res.json({ cached: true, count: users.length });
});
```

---

## Capacity Planning

### Growth Projections

```
Month 1: 100 DAU
Month 3: 300 DAU (3x)
Month 6: 1000 DAU (10x)
Month 12: 5000 DAU (50x)

Scaling Timeline:
Month 1-2:   B2 App Service (1 instance)
Month 3-4:   B2 App Service (2 instances)
Month 6-8:   P1V2 App Service (3 instances)
Month 9-12:  P1V2 App Service (5-10 instances)
```

### Cost Projections

| Month | DAU | API Instances | DB SKU | Cache Size | Monthly Cost |
|-------|-----|---------------|--------|-----------|-------------|
| 1 | 100 | 1 | B2 | P1 (6GB) | $715 |
| 3 | 300 | 2 | B2 | P1 (6GB) | $845 |
| 6 | 1000 | 3 | GP4 | P2 (26GB) | $1,200 |
| 12 | 5000 | 8 | GP8 | P3 (53GB) | $2,500 |

### Auto-Scaling Rules

```
If: API CPU > 75% for 5 minutes
Then: Scale out by 1 instance (max 10)
Wait: 5 minutes before scaling again

If: API CPU < 30% for 15 minutes
Then: Scale in by 1 instance (min 2)
Wait: 15 minutes before scaling again

If: Database CPU > 75% for 10 minutes
Then: Alert DBA, consider vertical scaling

If: Redis Memory > 80%
Then: Alert team, plan size upgrade
```

---

## Scaling Workflows

### Scale-Out Workflow (Add Instances)

```
1. Monitor alerts
   └─> CPU > 75% for 5 minutes

2. Verify need for scaling
   ├─ Check query performance
   ├─ Review recent deployments
   └─ Check for abnormal traffic

3. Scale API
   Command: az appservice plan update --number-of-workers 3

4. Monitor scaling process
   └─> New instances startup (2-3 minutes)

5. Verify health
   ├─ Check all instances health endpoint
   ├─ Monitor error rate
   └─ Verify request distribution

6. Continue scaling if needed
   └─> Repeat steps 1-5
```

### Scale-Up Workflow (Upgrade Resources)

```
1. Schedule maintenance window
   ├─ Off-peak hours recommended
   ├─ Notify stakeholders
   └─ Create backup

2. Create rollback plan
   ├─ Document current SKU
   ├─ Save connection strings
   └─ Prepare rollback command

3. Execute scale-up
   Command: az postgres server update --sku-name GP_Gen5_4

4. Monitor upgrade
   └─> Typical downtime: 1-2 minutes

5. Verify functionality
   ├─ Test database connection
   ├─ Run health checks
   └─ Monitor performance metrics

6. Optimize (if needed)
   ├─ REINDEX if fragmented
   ├─ ANALYZE statistics
   └─ VACUUM if needed
```

### Emergency Scale-Out

```
If: Response time > 2 seconds
Then: Immediate scale-out

# Emergency scale-out command
az appservice plan update \
  --name fleet-api-plan \
  --resource-group fleet-prod-rg \
  --number-of-workers 10  # Max out immediately

# Manually monitor
while true; do
  curl -s https://fleet-api-prod.azurewebsites.net/api/health | jq .
  sleep 5
done

# Once stabilized, identify root cause
# - Query optimization needed?
# - Cache not working?
# - External API slow?
```

---

## Scaling Checklists

### Pre-Scaling

- [ ] Review metrics and logs
- [ ] Identify root cause (CPU? Memory? Disk?)
- [ ] Check for recent code changes
- [ ] Verify database indexes present
- [ ] Check Redis cache hit rate
- [ ] Confirm scaling won't exceed budget
- [ ] Create backup
- [ ] Notify team

### Post-Scaling

- [ ] Monitor new instances for 1 hour
- [ ] Verify error rate still low
- [ ] Check response time improvement
- [ ] Monitor cost changes
- [ ] Update scaling runbook with learnings
- [ ] Document changes in runbook
- [ ] Plan next scaling trigger

---

**Document Version:** 1.0
**Last Updated:** February 15, 2024
**Maintained By:** Infrastructure Team
