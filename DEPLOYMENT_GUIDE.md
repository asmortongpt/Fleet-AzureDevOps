# Personal vs Business Vehicle Use Tracking - Deployment Guide

**Feature Branch:** `feature/personal-business-impl`
**Target Environment:** Azure Kubernetes Service (AKS)
**Database:** PostgreSQL on Kubernetes
**Version:** 1.0.0
**Date:** 2025-11-10

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migration](#database-migration)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Verification Steps](#verification-steps)
6. [Rollback Procedures](#rollback-procedures)
7. [Post-Deployment Monitoring](#post-deployment-monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### 1. Prerequisites

- [ ] Access to AKS cluster (kubectl configured)
- [ ] Access to PostgreSQL database
- [ ] Docker images built and pushed to container registry
- [ ] Environment variables configured
- [ ] Backup of current production database completed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed and approved
- [ ] Security scan completed (no HIGH/CRITICAL vulnerabilities)

### 2. Required Permissions

- **Database:** CREATE TABLE, CREATE INDEX, CREATE TRIGGER, CREATE VIEW
- **Kubernetes:** Deploy pods, Create services, Update ConfigMaps
- **Azure:** Access to Azure Container Registry (ACR)

### 3. Environment Variables

Ensure these environment variables are set in your Kubernetes deployment:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/fleet_db

# API Configuration
NODE_ENV=production
PORT=3000

# Authentication
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-domain.com

# Feature Flags (optional)
ENABLE_PERSONAL_USE_TRACKING=true
```

---

## Database Migration

### Step 1: Connect to PostgreSQL

```bash
# Port forward to PostgreSQL pod
kubectl port-forward -n fleet svc/postgresql 5432:5432

# Connect using psql
psql -h localhost -U fleet_user -d fleet_db
```

### Step 2: Verify Current Schema

```sql
-- Check existing tables
\dt

-- Verify no conflicts with new tables
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('trip_usage_classification', 'personal_use_policies', 'personal_use_charges');
```

### Step 3: Run Migration

```bash
# From project root
psql -h localhost -U fleet_user -d fleet_db -f database/migrations/005_personal_business_use.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX (x8 indexes)
CREATE VIEW (x3 views)
CREATE TRIGGER (x3 triggers)
```

### Step 4: Verify Migration

```sql
-- Check tables created
\dt trip_usage_classification
\dt personal_use_policies
\dt personal_use_charges

-- Check views created
\dv v_monthly_personal_use_summary
\dv v_driver_usage_vs_limits
\dv v_pending_charges_summary

-- Check indexes
\d trip_usage_classification

-- Verify triggers
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('trip_usage_classification', 'personal_use_policies', 'personal_use_charges');
```

### Step 5: Test Sample Data (Optional)

```sql
-- Insert test policy
INSERT INTO personal_use_policies (
  tenant_id,
  allow_personal_use,
  require_approval,
  max_personal_miles_per_month,
  max_personal_miles_per_year,
  charge_personal_use,
  personal_use_rate_per_mile,
  effective_date
) VALUES (
  '<your-tenant-id>',
  true,
  true,
  200,
  1000,
  true,
  0.25,
  CURRENT_DATE
);

-- Verify
SELECT * FROM personal_use_policies WHERE tenant_id = '<your-tenant-id>';
```

---

## Backend Deployment

### Step 1: Build Docker Image

```bash
# Navigate to api directory
cd api

# Build production image
docker build -t your-registry.azurecr.io/fleet-api:personal-use-v1.0.0 .

# Push to registry
docker push your-registry.azurecr.io/fleet-api:personal-use-v1.0.0
```

### Step 2: Update Kubernetes Deployment

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-api
  namespace: fleet
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: your-registry.azurecr.io/fleet-api:personal-use-v1.0.0
        env:
        - name: ENABLE_PERSONAL_USE_TRACKING
          value: "true"
        # ... other env vars
```

### Step 3: Apply Deployment

```bash
# Apply deployment
kubectl apply -f k8s/api-deployment.yaml -n fleet

# Watch rollout status
kubectl rollout status deployment/fleet-api -n fleet

# Verify pods are running
kubectl get pods -n fleet -l app=fleet-api
```

### Step 4: Verify API Routes

```bash
# Port forward to API pod
kubectl port-forward -n fleet svc/fleet-api 3000:3000

# Test health endpoint
curl http://localhost:3000/api/health

# Test new endpoints (with auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/personal-use-policies
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/trip-usage
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/personal-use-charges
```

**Expected Responses:**
- Health: `{"status":"healthy","timestamp":"...","environment":"production","version":"1.0.0"}`
- Personal Use Policies: `{"success":true,"data":{...}}`

---

## Frontend Deployment

### Step 1: Build Frontend

```bash
# Navigate to project root
cd ..

# Build production frontend
npm run build

# Verify build output
ls -la dist/
```

### Step 2: Build Docker Image

```bash
# Build frontend image
docker build -t your-registry.azurecr.io/fleet-frontend:personal-use-v1.0.0 -f Dockerfile.frontend .

# Push to registry
docker push your-registry.azurecr.io/fleet-frontend:personal-use-v1.0.0
```

### Step 3: Update Kubernetes Deployment

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-frontend
  namespace: fleet
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: frontend
        image: your-registry.azurecr.io/fleet-frontend:personal-use-v1.0.0
```

### Step 4: Apply Deployment

```bash
# Apply deployment
kubectl apply -f k8s/frontend-deployment.yaml -n fleet

# Watch rollout status
kubectl rollout status deployment/fleet-frontend -n fleet

# Verify pods are running
kubectl get pods -n fleet -l app=fleet-frontend
```

---

## Verification Steps

### 1. API Endpoint Tests

```bash
# Test all new endpoints
TOKEN="your-auth-token"

# Get policy
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/personal-use-policies

# Create trip usage
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"uuid","driver_id":"uuid","usage_type":"business","business_purpose":"Client meeting","miles_total":50,"trip_date":"2025-11-10"}' \
  https://your-domain.com/api/trip-usage

# Get driver limits
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/personal-use-policies/limits/{driver_id}

# Get pending approvals (manager/admin)
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/trip-usage/pending-approval

# Calculate charges
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"driver_id":"uuid","charge_period":"2025-11"}' \
  https://your-domain.com/api/personal-use-charges/calculate
```

### 2. Frontend UI Tests

- [ ] Login as driver
- [ ] Navigate to "Personal Use" from sidebar
- [ ] Verify dashboard loads with usage meters
- [ ] Click "Record Trip" and classify a trip
- [ ] View trip history with filters
- [ ] View charges tab
- [ ] Export trip data to CSV

- [ ] Login as manager
- [ ] Navigate to "Personal Use"
- [ ] Verify approval queue displays
- [ ] Approve a pending trip
- [ ] Reject a pending trip
- [ ] View team summary

- [ ] Login as admin
- [ ] Navigate to "Personal Use Policy"
- [ ] Modify policy settings
- [ ] Set usage limits
- [ ] Configure charging rate
- [ ] Preview policy
- [ ] Save policy configuration

### 3. Database Verification

```sql
-- Check data integrity
SELECT COUNT(*) FROM trip_usage_classification;
SELECT COUNT(*) FROM personal_use_policies;
SELECT COUNT(*) FROM personal_use_charges;

-- Verify views are working
SELECT * FROM v_monthly_personal_use_summary LIMIT 5;
SELECT * FROM v_driver_usage_vs_limits LIMIT 5;

-- Check triggers are firing
-- (Insert a record and verify updated_at changes)
```

### 4. Performance Tests

```bash
# Run load test on API endpoints
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/trip-usage

# Check response times (should be < 200ms)
# Check error rate (should be < 0.1%)
```

### 5. Security Tests

```bash
# Test authentication required
curl https://your-domain.com/api/trip-usage
# Expected: 401 Unauthorized

# Test RBAC - driver cannot access admin endpoints
curl -H "Authorization: Bearer $DRIVER_TOKEN" \
  https://your-domain.com/api/personal-use-policies/{tenant_id}
# Expected: 403 Forbidden

# Test tenant isolation
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/trip-usage?tenant_id=different-tenant
# Expected: Empty result set (not 403)
```

---

## Rollback Procedures

### If Issues Detected Post-Deployment

#### Option 1: Rollback Database Only

```sql
-- Drop new tables (THIS WILL DELETE ALL PERSONAL USE DATA!)
DROP TABLE IF EXISTS personal_use_charges CASCADE;
DROP TABLE IF EXISTS trip_usage_classification CASCADE;
DROP TABLE IF EXISTS personal_use_policies CASCADE;

-- Drop views
DROP VIEW IF EXISTS v_pending_charges_summary;
DROP VIEW IF EXISTS v_driver_usage_vs_limits;
DROP VIEW IF EXISTS v_monthly_personal_use_summary;
```

#### Option 2: Rollback Application Deployment

```bash
# Rollback to previous API version
kubectl rollout undo deployment/fleet-api -n fleet

# Rollback to previous frontend version
kubectl rollout undo deployment/fleet-frontend -n fleet

# Verify rollback
kubectl rollout status deployment/fleet-api -n fleet
kubectl rollout status deployment/fleet-frontend -n fleet
```

#### Option 3: Full Rollback

```bash
# 1. Restore database from backup
psql -h localhost -U fleet_user -d fleet_db < backup-pre-migration.sql

# 2. Rollback deployments
kubectl rollout undo deployment/fleet-api -n fleet
kubectl rollout undo deployment/fleet-frontend -n fleet

# 3. Verify system is back to previous state
kubectl get pods -n fleet
```

---

## Post-Deployment Monitoring

### 1. Application Logs

```bash
# Watch API logs
kubectl logs -f -n fleet -l app=fleet-api --tail=100

# Watch frontend logs
kubectl logs -f -n fleet -l app=fleet-frontend --tail=100

# Check for errors
kubectl logs -n fleet -l app=fleet-api | grep -i error
```

### 2. Database Monitoring

```sql
-- Monitor query performance
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%trip_usage%' OR query LIKE '%personal_use%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('trip_usage_classification', 'personal_use_policies', 'personal_use_charges')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Key Metrics to Monitor

- **API Response Times:** < 200ms (p95)
- **Error Rate:** < 0.1%
- **Database Query Times:** < 50ms (p95)
- **Pod CPU Usage:** < 70%
- **Pod Memory Usage:** < 80%
- **Active User Sessions:** Normal baseline

### 4. Alerts to Configure

```yaml
# Prometheus AlertManager rules
- alert: PersonalUseAPIHighErrorRate
  expr: rate(http_requests_total{path=~"/api/(trip-usage|personal-use-.*)",status=~"5.."}[5m]) > 0.01
  for: 5m
  annotations:
    summary: "High error rate on Personal Use API endpoints"

- alert: PersonalUseAPISlowResponse
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path=~"/api/(trip-usage|personal-use-.*)"}[5m])) > 0.2
  for: 5m
  annotations:
    summary: "Personal Use API response time > 200ms"

- alert: PersonalUseDatabaseConnectionErrors
  expr: rate(database_connection_errors_total[5m]) > 0
  for: 5m
  annotations:
    summary: "Database connection errors detected"
```

---

## Troubleshooting

### Issue: API endpoints returning 404

**Cause:** Routes not registered in server.ts

**Solution:**
```bash
# Verify routes are registered
kubectl exec -it -n fleet <api-pod-name> -- cat /app/src/server.ts | grep "trip-usage"

# Should see:
# app.use('/api/trip-usage', tripUsageRoutes)
# app.use('/api/personal-use-policies', personalUsePoliciesRoutes)
# app.use('/api/personal-use-charges', personalUseChargesRoutes)
```

### Issue: Database migration fails

**Cause:** Conflicting table names or insufficient permissions

**Solution:**
```sql
-- Check if tables already exist
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE '%personal%' OR table_name LIKE '%trip_usage%';

-- Check user permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public';

-- Grant necessary permissions
GRANT CREATE ON SCHEMA public TO fleet_user;
```

### Issue: Frontend components not loading

**Cause:** Build not including new components

**Solution:**
```bash
# Verify components are in build output
ls -la dist/assets/

# Check for import errors
docker logs <frontend-pod-name> | grep -i error

# Rebuild with verbose logging
npm run build -- --verbose
```

### Issue: High database load after deployment

**Cause:** Missing indexes or inefficient queries

**Solution:**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('trip_usage_classification', 'personal_use_policies', 'personal_use_charges')
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%trip_usage%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Create missing indexes if needed
CREATE INDEX CONCURRENTLY idx_trip_usage_driver_date
ON trip_usage_classification(driver_id, trip_date);
```

### Issue: Permission errors for drivers/managers

**Cause:** RBAC not properly configured

**Solution:**
```bash
# Verify user roles in database
kubectl exec -it -n fleet <postgresql-pod> -- psql -U fleet_user -d fleet_db \
  -c "SELECT id, email, role FROM users LIMIT 10;"

# Check auth middleware
kubectl logs -n fleet -l app=fleet-api | grep "Unauthorized\|Forbidden"

# Verify JWT token includes role claim
```

---

## Success Criteria

Deployment is considered successful when:

- [x] All database tables, views, and triggers created
- [x] API endpoints responding with correct data
- [x] Frontend components rendering correctly
- [x] All E2E tests passing
- [x] No HIGH/CRITICAL errors in logs
- [x] Performance metrics within acceptable ranges
- [x] User acceptance testing completed
- [x] No rollback required within first 24 hours

---

## Support Contacts

**Development Team:**
- Lead Engineer: [email]
- Database Admin: [email]
- DevOps Engineer: [email]

**Escalation:**
- On-Call: [phone/pagerduty]
- Manager: [email/phone]

---

## Deployment Checklist Summary

### Pre-Deployment
- [ ] All prerequisites met
- [ ] Database backup completed
- [ ] Docker images built and pushed
- [ ] Environment variables configured
- [ ] All tests passing
- [ ] Security scan completed

### Deployment
- [ ] Database migration executed
- [ ] API deployment updated
- [ ] Frontend deployment updated
- [ ] All pods healthy and running

### Verification
- [ ] API endpoint tests passed
- [ ] Frontend UI tests passed
- [ ] Database verification completed
- [ ] Performance tests passed
- [ ] Security tests passed

### Post-Deployment
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Logs reviewed
- [ ] User acceptance testing completed
- [ ] Rollback plan tested and documented

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________
**Production Sign-Off:** _____________

---

## Related Documentation

- [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md) - Feature implementation details
- [IMPLEMENTATION_SPEC.md](./IMPLEMENTATION_SPEC.md) - Requirements specification
- [API Documentation](http://localhost:3000/api/docs) - Swagger/OpenAPI docs
- [Database Schema](./database/migrations/005_personal_business_use.sql) - Migration script

---

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-10 | Claude Code | Initial deployment guide |

---

**End of Deployment Guide**
