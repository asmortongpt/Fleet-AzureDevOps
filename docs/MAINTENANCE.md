# Fleet-CTA Maintenance Guide

## Table of Contents

1. [Daily Maintenance Tasks](#daily-maintenance-tasks)
2. [Weekly Maintenance](#weekly-maintenance)
3. [Monthly Maintenance](#monthly-maintenance)
4. [Quarterly Maintenance](#quarterly-maintenance)
5. [Database Maintenance](#database-maintenance)
6. [Log Management](#log-management)
7. [Certificate Management](#certificate-management)
8. [Backup & Recovery](#backup--recovery)
9. [Security Updates](#security-updates)
10. [Maintenance Automation](#maintenance-automation)

---

## Daily Maintenance Tasks

### Health Check (5 minutes)

**Performed:** Every morning and end of day

```bash
#!/bin/bash
# health-check.sh

echo "=== Fleet-CTA Daily Health Check ==="

# API Health
echo "1. Checking API health..."
curl -s https://fleet-api-prod.azurewebsites.net/api/health | jq .status

# Database connection
echo "2. Checking database..."
psql -h fleet-db-prod.postgres.database.azure.com \
  -U fleet_webapp_user \
  -d fleet_production \
  -c "SELECT 'Database OK';" 2>/dev/null || echo "Database ERROR"

# Redis connection
echo "3. Checking Redis..."
redis-cli -h fleet-redis-prod.redis.cache.windows.net \
  -p 6380 -a $REDIS_PASSWORD --tls PING 2>/dev/null || echo "Redis ERROR"

# Frontend availability
echo "4. Checking frontend..."
curl -s -o /dev/null -w "%{http_code}" https://fleet.capitaltechalliance.com/

echo ""
echo "Health check complete"
```

**Schedule:**
- 9:00 AM daily: `0 9 * * * /usr/local/bin/health-check.sh`
- 5:00 PM daily: `0 17 * * * /usr/local/bin/health-check.sh`

### Monitor Critical Metrics

**Check these dashboards:**
- Application Insights > Overview
- Database CPU, Memory, Connections
- Redis Memory Usage
- Error Rate (should be 0%)
- Response Times (should be < 500ms p95)

**Alert Thresholds:**
- CPU > 80% → Alert
- Memory > 85% → Alert
- Error rate > 1% → Alert
- Response time p95 > 1000ms → Alert

### Log Review

```bash
# Check for errors in last 24 hours
az webapp log tail \
  --resource-group fleet-prod-rg \
  --name fleet-api-prod | grep -i error | head -20

# Search logs in Application Insights
# Query: exceptions | where timestamp > ago(24h)
```

---

## Weekly Maintenance

### Database Optimization (Every Monday)

```bash
#!/bin/bash
# weekly-db-maintenance.sh

PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST \
  -U $DATABASE_USER \
  -d $DATABASE_NAME << EOF

-- Analyze query statistics
ANALYZE;

-- Reindex heavily modified tables
REINDEX TABLE vehicles;
REINDEX TABLE drivers;
REINDEX TABLE trips;

-- Check table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  ROUND(100 * (pg_total_relation_size(schemaname||'.'||tablename) -
    pg_relation_size(schemaname||'.'||tablename)) /
    pg_total_relation_size(schemaname||'.'||tablename)) AS bloat_ratio
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum if needed
VACUUM ANALYZE vehicles;

EOF

echo "Weekly database maintenance completed"
```

**Schedule:** `0 2 * * 1 /usr/local/bin/weekly-db-maintenance.sh`

### Backup Verification

```bash
#!/bin/bash
# verify-backup.sh

# List recent backups
echo "Recent backups:"
az storage blob list \
  --account-name fleetprodstg \
  --container-name backups \
  --query "[].name" | tail -5

# Check backup size (should not be 0)
LATEST=$(az storage blob list \
  --account-name fleetprodstg \
  --container-name backups \
  --query "[-1].name" -o tsv)

SIZE=$(az storage blob show \
  --account-name fleetprodstg \
  --container-name backups \
  --name "$LATEST" \
  --query "properties.contentLength" -o tsv)

if [ "$SIZE" -gt 0 ]; then
  echo "✓ Latest backup size: $(numfmt --to=iec-i --suffix=B $SIZE)"
else
  echo "✗ ERROR: Backup file is empty!"
fi
```

**Schedule:** `0 3 * * 1 /usr/local/bin/verify-backup.sh`

### Log Rotation & Cleanup

```bash
#!/bin/bash
# log-cleanup.sh

# Archive logs older than 7 days
find /var/log/fleet-api -name "*.log" -mtime +7 -exec gzip {} \;

# Delete logs older than 30 days
find /var/log/fleet-api -name "*.gz" -mtime +30 -delete

# Clean temporary files
rm -rf /tmp/fleet-uploads/*

echo "Log cleanup completed"
```

**Schedule:** `0 4 * * 1 /usr/local/bin/log-cleanup.sh`

---

## Monthly Maintenance

### Certificate Expiration Check

```bash
#!/bin/bash
# check-certs.sh

# Check certificate expiration
echo "Checking SSL certificate..."

CERT_PATH="/etc/ssl/certs/fleet.capitaltechalliance.com.crt"

if [ ! -f "$CERT_PATH" ]; then
  echo "Certificate not found at $CERT_PATH"
  exit 1
fi

# Get expiration date
EXPIRY=$(openssl x509 -in "$CERT_PATH" -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "Certificate expires in $DAYS_LEFT days: $EXPIRY"

if [ $DAYS_LEFT -lt 30 ]; then
  echo "WARNING: Certificate expires within 30 days!"
  # Send alert
  send_alert "SSL Certificate expiring soon: $DAYS_LEFT days left"
fi
```

**Schedule:** `0 0 1 * * /usr/local/bin/check-certs.sh`

### Disk Space Analysis

```bash
#!/bin/bash
# disk-usage.sh

echo "=== Disk Usage Report ==="

# Check main partitions
df -h / /var /tmp

# Largest directories
echo ""
echo "Top 10 largest directories:"
du -sh /* | sort -rh | head -10

# Database size
echo ""
echo "Database size:"
psql -c "SELECT
  datname,
  pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;"

# Check for large files
echo ""
echo "Files larger than 100MB:"
find / -type f -size +100M 2>/dev/null | head -10
```

**Manual Execution:**
```bash
./disk-usage.sh > disk-report-$(date +%Y%m%d).txt
```

### Dependency Updates

```bash
#!/bin/bash
# update-dependencies.sh

echo "=== Checking for Updates ==="

cd /path/to/fleet-cta

# Check for outdated packages
echo "Frontend outdated packages:"
npm outdated

cd api
echo ""
echo "Backend outdated packages:"
npm outdated
cd ..

# Security audit
echo ""
echo "Security vulnerabilities:"
npm audit | grep -i "critical\|high"
```

**Manual Execution:**
```bash
./update-dependencies.sh > dependency-report-$(date +%Y%m%d).txt
# Review report before updating
```

### Database Reindex (Monthly)

```bash
#!/bin/bash
# monthly-reindex.sh

psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME << EOF

-- Reindex all tables
REINDEX DATABASE fleet_production;

-- Analyze all tables
ANALYZE;

-- Vacuum all tables
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;

EOF

echo "Monthly reindexing completed"
```

**Schedule:** `0 2 15 * * /usr/local/bin/monthly-reindex.sh`

### Security Patching

**First Friday of month: System Security Updates**

```bash
# Update OS packages
sudo apt-get update
sudo apt-get upgrade -y

# Update Docker
sudo docker pull fleet-api:latest
sudo docker pull postgres:16-alpine
sudo docker pull redis:7-alpine

# Restart services
sudo docker-compose restart

# Verify health
./health-check.sh
```

---

## Quarterly Maintenance

### Disaster Recovery Drill

**First week of quarter: Test recovery procedures**

```bash
# 1. Backup current state
pg_dump fleet_production > backup-$(date +%Y%m%d).sql

# 2. Create test database
psql -c "CREATE DATABASE fleet_test;"

# 3. Restore from backup
psql -d fleet_test < backup-$(date +%Y%m%d).sql

# 4. Verify restore
psql -d fleet_test -c "SELECT COUNT(*) FROM vehicles;"

# 5. Test failover to secondary region (if applicable)
# ... (region-specific steps)

# 6. Document results
echo "Disaster recovery drill completed: $(date)" >> /var/log/dr-drills.log

# 7. Clean up test database
psql -c "DROP DATABASE fleet_test;"
```

### Performance Baseline Review

```bash
# Compare current performance to baseline
echo "=== Performance Baseline Review ==="

# API Response Times
echo "API Response Times (last 90 days):"
# Query Application Insights for p50, p95, p99 response times

# Database Query Times
echo "Database Query Times:"
psql -c "SELECT query, calls, mean_time
         FROM pg_stat_statements
         ORDER BY mean_time DESC
         LIMIT 10;"

# Redis Performance
echo "Redis Performance:"
redis-cli INFO stats

# Create report
echo "Performance report: baseline-$(date +%Y%m%d).txt"
```

### Capacity Planning Review

```bash
# Analyze growth trends
echo "=== Capacity Planning Review ==="

# Database growth
echo "Database growth last 90 days:"
# Compare database size from 90 days ago to now

# Storage growth
echo "Storage growth:"
az storage account show-usage \
  --name fleetprodstg \
  --query "value"

# Traffic growth
echo "API request volume growth:"
# Query Application Insights for request count trend

# Recommendations
echo "Capacity recommendations:"
# Based on growth rate, project when scaling needed
```

### Security Audit

```bash
#!/bin/bash
# quarterly-security-audit.sh

echo "=== Quarterly Security Audit ==="

# 1. Check for exposed secrets
echo "Scanning for secrets in code..."
git log -p | grep -i "password\|api_key\|secret"

# 2. Review access logs
echo "Reviewing access logs..."
grep "unauthorized\|forbidden" /var/log/fleet-api/app.log | wc -l

# 3. Check for unusual activity
echo "Checking for unusual database activity..."
psql -c "SELECT query FROM pg_stat_statements
         WHERE calls > 10000
         AND mean_time > 1000;"

# 4. Verify firewall rules
echo "Verifying firewall rules..."
az network nsg rule list --resource-group fleet-prod-rg

# 5. Review Azure AD audit logs
echo "Reviewing authentication logs..."
# Check Azure AD for suspicious logins
```

---

## Database Maintenance

### Regular Vacuuming

**Automatic VACUUM Daemon:**

PostgreSQL runs `autovacuum` automatically, but can be tuned:

```sql
-- Check autovacuum settings
SHOW autovacuum;
SHOW autovacuum_naptime;
SHOW autovacuum_vacuum_threshold;

-- Increase frequency for high-volume tables
ALTER TABLE vehicles SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Vacuum at 5% changes
  autovacuum_analyze_scale_factor = 0.02  -- Analyze at 2% changes
);
```

### Index Maintenance

```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Reindex bloated indexes
REINDEX INDEX index_name;

-- Check index size
SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Query Statistics

```sql
-- Find slowest queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Optimize query execution plan
EXPLAIN ANALYZE SELECT * FROM vehicles WHERE status = 'active';

-- Reset statistics (use carefully)
SELECT pg_stat_statements_reset();
```

---

## Log Management

### Log Rotation Configuration

```bash
# /etc/logrotate.d/fleet-api
/var/log/fleet-api/app.log {
  daily
  rotate 30           # Keep 30 days
  compress           # Compress rotated logs
  delaycompress      # Compress on next rotation
  missingok          # Don't error if missing
  notifempty         # Don't rotate if empty
  create 640 appuser appgroup
  sharedscripts
  postrotate
    systemctl reload fleet-api > /dev/null 2>&1 || true
  endscript
}
```

### Log Archival

```bash
#!/bin/bash
# archive-logs.sh

# Archive logs older than 7 days to cold storage
find /var/log/fleet-api -name "*.log" -mtime +7 | while read file; do
  gzip "$file"

  # Upload to Blob Storage cold tier
  az storage blob upload \
    --account-name fleetprodstg \
    --container-name logs-archive \
    --file "${file}.gz" \
    --name "$(basename "${file}.gz")"

  # Delete local copy
  rm "${file}.gz"
done
```

### Log Retention Policy

| Log Type | Retention | Location | Archive |
|----------|-----------|----------|---------|
| Application logs | 30 days | Application Insights | 7 years |
| Audit logs | 90 days | Log Analytics | 7 years |
| Access logs | 30 days | App Service logs | 1 year |
| Database logs | 14 days | PostgreSQL | 3 months |
| Redis logs | 7 days | Redis diagnostics | 1 month |

---

## Certificate Management

### SSL/TLS Certificate Renewal

**Azure manages certificates automatically for Static Web Apps**

But manually check:

```bash
# Check certificate expiration
openssl s_client -connect fleet.capitaltechalliance.com:443 -servername fleet.capitaltechalliance.com 2>/dev/null | openssl x509 -noout -dates

# Expected output:
# notBefore=Feb 15 00:00:00 2024 GMT
# notAfter=Feb 14 23:59:59 2025 GMT
```

### Manual Certificate Update (if needed)

```bash
# 1. Generate CSR (Certificate Signing Request)
openssl req -new -key fleet.key -out fleet.csr

# 2. Submit to certificate authority

# 3. Download certificate and chain

# 4. Install certificate
cp fleet.crt /etc/ssl/certs/
cp fleet.key /etc/ssl/private/
chmod 600 /etc/ssl/private/fleet.key

# 5. Update HTTPS configuration

# 6. Restart services
```

---

## Backup & Recovery

### Automated Daily Backups

**Azure Database for PostgreSQL maintains automatic backups:**
- Frequency: Daily (configurable)
- Retention: 35 days (configurable)
- Geo-redundancy: Enabled

**Check backup status:**

```bash
# List backups
az postgres server list-restore-points \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod

# Restore to specific point in time
az postgres server restore \
  --resource-group fleet-prod-rg \
  --name fleet-db-prod-restored \
  --source-server fleet-db-prod \
  --restore-point-in-time "2024-02-14T10:00:00Z"
```

### Manual Backup Creation

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/var/backups/fleet-db"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fleet_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump \
  --host=$DATABASE_HOST \
  --username=$DATABASE_USER \
  --verbose \
  --compress=9 \
  $DATABASE_NAME > "$BACKUP_FILE.gz"

# Upload to Blob Storage
az storage blob upload \
  --account-name fleetprodstg \
  --container-name backups \
  --file "$BACKUP_FILE.gz" \
  --name "$(basename "$BACKUP_FILE.gz")"

# Delete local copy older than 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Schedule:** `0 2 * * * /usr/local/bin/backup-database.sh`

### Backup Verification

**Weekly test restore:**

```bash
# 1. List available backups
BACKUPS=$(az storage blob list \
  --account-name fleetprodstg \
  --container-name backups \
  --query "[].name" -o tsv)

# 2. Download latest backup
LATEST=$(echo "$BACKUPS" | sort -r | head -1)
az storage blob download \
  --account-name fleetprodstg \
  --container-name backups \
  --name "$LATEST" \
  --file latest-backup.sql.gz

# 3. Restore to test database
createdb fleet_test
gunzip < latest-backup.sql.gz | psql -d fleet_test

# 4. Verify integrity
psql -d fleet_test -c "
  SELECT COUNT(*) as vehicles FROM vehicles;
  SELECT COUNT(*) as drivers FROM drivers;
  SELECT COUNT(*) as trips FROM trips;
"

# 5. Delete test database
dropdb fleet_test
```

---

## Security Updates

### Weekly Security Patch Review

**Every Monday: Check for critical updates**

```bash
# Check npm for vulnerabilities
npm audit

# Check Docker images for vulnerabilities
docker scan fleet-api:latest

# Review Azure security recommendations
# Azure Portal > Azure Advisor > Security

# Check for outdated dependencies
npm outdated --depth=0
```

### Monthly Security Assessment

**First of each month:**

```bash
# 1. Run OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://fleet.capitaltechalliance.com

# 2. Check SSL configuration
nmap --script ssl-enum-ciphers -p 443 fleet.capitaltechalliance.com

# 3. Review firewall rules
az network nsg rule list \
  --resource-group fleet-prod-rg \
  --nsg-name fleet-nsg

# 4. Audit access logs
grep "unauthorized\|forbidden\|error 4[0-9][0-9]" /var/log/fleet-api/access.log | wc -l
```

### Dependency Update Schedule

**Monthly: Update non-critical dependencies**

```bash
# Check for updates
npm update

# Test after update
npm test
npm run build

# Commit and push
git add package*.json
git commit -m "chore: update dependencies"
git push origin main
```

**Quarterly: Major version updates**

```bash
# Review breaking changes
npm view package-name versions

# Install major version
npm install package-name@latest

# Run full test suite
npm test
npm run test:integration

# Update documentation
# ... document any changes

# Commit
git commit -m "chore: upgrade package-name to v[new-version]"
```

---

## Maintenance Automation

### Create Maintenance Scripts

Store in `/usr/local/bin/` with +x permissions:

```bash
chmod +x /usr/local/bin/health-check.sh
chmod +x /usr/local/bin/backup-database.sh
chmod +x /usr/local/bin/log-cleanup.sh
```

### Cron Job Configuration

```bash
# Install crontab
sudo apt-get install cron

# Edit crontab
crontab -e

# Add maintenance jobs
0 9 * * * /usr/local/bin/health-check.sh >> /var/log/maintenance.log 2>&1
0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/maintenance.log 2>&1
0 4 * * 1 /usr/local/bin/log-cleanup.sh >> /var/log/maintenance.log 2>&1
0 2 1 * * /usr/local/bin/check-certs.sh >> /var/log/maintenance.log 2>&1

# Verify crontab
crontab -l
```

### Maintenance Notifications

```bash
#!/bin/bash
# send-maintenance-report.sh

# Send daily summary email
cat > maintenance-report.txt << EOF
Fleet-CTA Maintenance Report
Generated: $(date)

Health Status:
- API: $(curl -s https://fleet-api-prod.azurewebsites.net/api/health | jq .status)
- Database: $(psql -c "SELECT 'OK'" 2>&1 | head -1)
- Redis: $(redis-cli PING 2>&1)

Recent Issues:
$(grep "ERROR\|WARN" /var/log/fleet-api/app.log | tail -5)

EOF

# Send via email
mail -s "Fleet-CTA Daily Maintenance Report" devops@capitaltechalliance.com < maintenance-report.txt
```

---

## Maintenance Checklist Template

```markdown
## Weekly Maintenance Checklist

- [ ] Run health check
- [ ] Review error logs
- [ ] Check database optimization
- [ ] Verify backups
- [ ] Review security alerts
- [ ] Check certificate expiration
- [ ] Monitor resource utilization
- [ ] Review API performance metrics

## Monthly Checklist

- [ ] Full backup verification (test restore)
- [ ] Security patch review
- [ ] Dependency updates
- [ ] Disk space analysis
- [ ] Database reindex
- [ ] Log rotation verification
- [ ] Certificate expiration check
- [ ] Capacity planning review

## Quarterly Checklist

- [ ] Disaster recovery drill
- [ ] Performance baseline review
- [ ] Security audit
- [ ] Major dependency upgrades
- [ ] Infrastructure optimization review
- [ ] Cost analysis and optimization
- [ ] Update runbook documentation
```

---

## Maintenance Documentation

Keep a maintenance log at `/var/log/maintenance.log`:

```
2024-02-15 09:00:00 - Daily health check: PASS
2024-02-15 02:00:00 - Database backup: COMPLETE (5.2GB)
2024-02-14 00:00:00 - Log rotation: 42 files rotated
2024-02-10 02:00:00 - Reindex completed: 12 tables
2024-02-05 09:00:00 - Security patches: 3 critical applied
```

---

**Document Version:** 1.0
**Last Updated:** February 15, 2024
**Maintained By:** Operations Team
