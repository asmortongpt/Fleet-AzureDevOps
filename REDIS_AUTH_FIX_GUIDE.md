# Redis Authentication Fix Guide
**Date:** November 16, 2025
**Priority:** CRITICAL
**Issue:** Redis requires authentication but API pods getting NOAUTH errors

## Problem Description

The Azure Deep Testing Report shows:
```
❌ FAILED - Authentication required
Error: NOAUTH Authentication required.
```

This means Redis is configured to require a password, but either:
1. The API pods don't have the correct password
2. The API pods aren't passing the password when connecting
3. The Redis secret isn't properly mounted

## Diagnosis Steps

### Step 1: Check if Redis Secret Exists
```bash
kubectl get secrets -n fleet-management | grep redis
```

Expected output:
```
fleet-redis-secret   Opaque   1      6h
```

### Step 2: Verify Secret Contents
```bash
kubectl get secret -n fleet-management fleet-redis-secret -o jsonpath='{.data.redis-password}' | base64 --decode
```

This will show the Redis password (keep it secure!).

### Step 3: Check API Pod Environment Variables
```bash
kubectl exec -n fleet-management deployment/fleet-api -- env | grep REDIS
```

Expected variables:
```
REDIS_HOST=fleet-redis-service
REDIS_PORT=6379
REDIS_PASSWORD=<password>
```

### Step 4: Test Redis Connection FROM API Pod
```bash
# Get the Redis password first
REDIS_PASS=$(kubectl get secret -n fleet-management fleet-redis-secret -o jsonpath='{.data.redis-password}' | base64 --decode)

# Test connection from API pod
kubectl exec -n fleet-management deployment/fleet-api -- redis-cli -h fleet-redis-service -a "$REDIS_PASS" PING
```

Expected response: `PONG`

## Fix Options

### Fix Option 1: Update API Deployment to Include Redis Password

1. Edit the fleet-api deployment:
```bash
kubectl edit deployment -n fleet-management fleet-api
```

2. Add the Redis password environment variable:
```yaml
env:
  - name: REDIS_PASSWORD
    valueFrom:
      secretKeyRef:
        name: fleet-redis-secret
        key: redis-password
  - name: REDIS_HOST
    value: fleet-redis-service
  - name: REDIS_PORT
    value: "6379"
```

3. Save and exit. Kubernetes will automatically rollout the update.

### Fix Option 2: Create/Update Redis Secret and Redeploy

If the secret doesn't exist or is incorrect:

```bash
# Generate a secure password
REDIS_PASSWORD=$(openssl rand -base64 32)

# Create the secret
kubectl create secret generic fleet-redis-secret \
  --from-literal=redis-password="$REDIS_PASSWORD" \
  -n fleet-management \
  --dry-run=client -o yaml | kubectl apply -f -

# Update Redis StatefulSet to use the password
kubectl edit statefulset -n fleet-management fleet-redis

# Restart Redis pod
kubectl delete pod -n fleet-management fleet-redis-0

# Restart API pods to pick up new secret
kubectl rollout restart deployment -n fleet-management fleet-api
```

### Fix Option 3: Disable Redis Authentication (NOT RECOMMENDED for production)

If this is a development environment and security isn't critical:

```bash
kubectl edit configmap -n fleet-management fleet-redis-config
```

Remove or comment out the `requirepass` directive.

## Verification

After applying the fix:

### 1. Check API Logs for Redis Errors
```bash
kubectl logs -n fleet-management deployment/fleet-api --tail=50 | grep -i redis
```

Should see no "NOAUTH" errors.

### 2. Test Redis Connection
```bash
REDIS_PASS=$(kubectl get secret -n fleet-management fleet-redis-secret -o jsonpath='{.data.redis-password}' | base64 --decode)
kubectl exec -n fleet-management deployment/fleet-api -- redis-cli -h fleet-redis-service -a "$REDIS_PASSWORD" INFO
```

### 3. Monitor Application Logs
```bash
kubectl logs -n fleet-management deployment/fleet-api -f
```

Look for successful cache operations.

## Current Status

Based on Azure Deep Testing Report:
- Redis pod: ✅ Running (0 restarts, 6h17m uptime)
- Memory usage: 8Mi (low)
- CPU usage: 11m (moderate)
- Connection attempts: ❌ Failing with NOAUTH

## Impact Assessment

**Without Fix:**
- Cache functionality degraded/disabled
- Slower API responses (no caching)
- Increased database load
- Session management may fail
- Rate limiting may not work

**After Fix:**
- ✅ Full cache functionality restored
- ✅ Faster API responses
- ✅ Reduced database load
- ✅ Session management working
- ✅ Rate limiting functional

## Monitoring Post-Fix

After applying the fix, monitor these metrics:

1. **Redis Metrics:**
   ```bash
   kubectl exec -n fleet-management fleet-redis-0 -- redis-cli INFO stats
   ```

2. **Cache Hit Rate:**
   ```bash
   kubectl exec -n fleet-management fleet-redis-0 -- redis-cli INFO stats | grep hits
   ```

3. **API Response Times:**
   Monitor the `/health` endpoint response time (should stay under 200ms).

## Related Files

- Deployment: `kubernetes/fleet-api-deployment.yaml`
- Redis StatefulSet: `kubernetes/fleet-redis.yaml`
- Secret: `kubernetes/fleet-redis-secret.yaml`

## Next Steps

1. Apply database schema fixes first (CRITICAL_DATABASE_FIXES.sql)
2. Fix Redis authentication (this guide)
3. Deploy missing API endpoints
4. Add Content-Security-Policy header
5. Configure rate limiting

## Success Criteria

✅ Redis PING command returns PONG
✅ No NOAUTH errors in API logs
✅ Cache hit/miss metrics visible in Redis INFO
✅ API response times remain under 200ms
✅ All API endpoints functional
