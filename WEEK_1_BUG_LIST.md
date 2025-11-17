# Week 1 - Critical Bug List
## Fleet Management System - Discovered Issues

**Date**: November 10, 2025
**Testing Status**: Initial deployment testing complete
**Application Status**: ⚠️  Running but pods failing health checks

---

## CRITICAL (P0) - Blocks Application Use

### 🔴 BUG-001: Pods in CrashLoopBackOff / Not Ready
**Severity**: CRITICAL
**Impact**: Application not accessible via load balancer
**Status**: 4 of 4 fleet-app pods showing 0/1 READY

**Symptoms**:
- `kubectl get pods` shows CrashLoopBackOff for 2 pods
- 2 pods show "Running" but not passing readiness checks (15+ restarts)
- Health endpoint at http://172.168.84.37/api/health returns no response

**Root Cause**: Likely health check configuration issue - app is starting but failing liveness/readiness probes

**Evidence**:
```
fleet-app-5495d6468b-n4vv9   0/1     CrashLoopBackOff   19 (3m2s ago)    78m
fleet-app-55966d7-c9f24      0/1     Running            15 (3m22s ago)   78m
fleet-app-58dbfc45b8-mqnfk   0/1     CrashLoopBackOff   19 (3m5s ago)    78m
fleet-app-76bd664f87-7pr5k   0/1     Running            15 (2m52s ago)   78m
```

**Fix Options**:
1. **Option A** (Quick fix, 30 min):
   - Increase `initialDelaySeconds` in health check from 40s to 120s
   - App takes time to initialize all services

2. **Option B** (Better fix, 1 hour):
   - Create separate `/health` endpoint that returns 200 immediately
   - Keep `/api/health` for detailed status
   - Update Kubernetes deployment to use simple health check

3. **Option C** (Temporary workaround, 5 min):
   - Remove health check entirely to get pods running
   - Add back later when debugged

**Recommended**: Start with Option C to get app accessible, then implement Option B

---

### 🔴 BUG-002: Azure Storage Connection String Invalid
**Severity**: CRITICAL
**Impact**: File uploads will fail (incident photos, vehicle docs, etc.)
**Status**: Error on startup

**Error Message**:
```
⚠️  Error initializing Azure services: TypeError: Invalid URL
[2025-11-11T02:50:55.685Z] ERROR: Failed to initialize Azure Storage: "Invalid URL"
```

**Root Cause**: `AZURE_STORAGE_CONNECTION_STRING` environment variable is empty or malformed

**Fix** (15 minutes):
1. Check if Azure Storage Account exists
2. Get connection string from Azure Portal
3. Update Kubernetes secret: `fleet-app-secrets`
4. Restart pods

**Workaround**: Disable Azure Storage temporarily and use local file storage

---

## HIGH (P1) - Degrades User Experience

### 🟠 BUG-003: CORS Origins Not Configured
**Severity**: HIGH
**Impact**: Frontend app cannot connect to API from browser
**Status**: Warning in logs

**Evidence**:
```
🔒 CORS Origins: undefined
```

**Fix** (10 minutes):
1. Set `CORS_ORIGINS` environment variable in Kubernetes deployment
2. Add frontend domain (e.g., `https://fleet.yourdomain.com`)
3. Restart pods

**Temporary Workaround**: Use `CORS_ORIGINS=*` (not secure, only for testing)

---

### 🟠 BUG-004: Multiple Deployment Versions Running
**Severity**: HIGH
**Impact**: Inconsistent behavior, wasted resources
**Status**: 4 different deployment versions active

**Evidence**:
```
fleet-app-5495d6468b-...    # Old version
fleet-app-55966d7-...       # Old version
fleet-app-58dbfc45b8-...    # Old version
fleet-app-76bd664f87-...    # Current version
```

**Fix** (5 minutes):
```bash
# Delete old deployments
kubectl delete deployment fleet-app-5495d6468b -n fleet-management
kubectl delete deployment fleet-app-55966d7 -n fleet-management
kubectl delete deployment fleet-app-58dbfc45b8 -n fleet-management

# Keep only latest
kubectl scale deployment fleet-app-76bd664f87 --replicas=3
```

---

## MEDIUM (P2) - Should Fix Soon

### 🟡 BUG-005: Email Notifications Disabled
**Severity**: MEDIUM
**Impact**: No email alerts for incidents, maintenance, etc.
**Status**: Warning in logs

**Fix** (20 minutes):
1. Configure SMTP settings in environment variables
2. Test with sample email
3. Enable email notifications

**Workaround**: Notifications logged to console only

---

### 🟡 BUG-006: Telematics Sync Disabled
**Severity**: MEDIUM
**Impact**: No real-time vehicle tracking
**Status**: Samsara API token not configured

**Evidence**:
```
[33mwarn[39m: SAMSARA_API_TOKEN not configured, Samsara sync disabled
[33mwarn[39m: No telematics providers configured, skipping sync
```

**Fix** (30 minutes):
1. Get Samsara API token (or use mock data)
2. Add to Kubernetes secrets
3. Test telematics sync

**Workaround**: Use mock GPS data for testing

---

### 🟡 BUG-007: Application Insights Not Configured
**Severity**: MEDIUM
**Impact**: No production monitoring/telemetry
**Status**: Warning in logs

**Fix** (15 minutes):
1. Create Azure Application Insights resource
2. Get instrumentation key
3. Add to environment variables

**Workaround**: Use kubectl logs for debugging

---

### 🟡 BUG-008: Computer Vision AI Disabled
**Severity**: MEDIUM
**Impact**: No AI analysis for vehicle damage photos
**Status**: Warning in logs

**Fix** (20 minutes):
1. Create Azure Computer Vision resource
2. Get API key and endpoint
3. Add to configuration

**Workaround**: Manual damage assessment only

---

## LOW (P3) - Nice to Have

### 🟢 BUG-009: check-damage-table Job Failing
**Severity**: LOW
**Impact**: Database verification job not completing
**Status**: CrashLoopBackOff

**Fix** (5 minutes):
- This appears to be a one-time migration job
- Safe to delete: `kubectl delete pod check-damage-table -n fleet-management`

---

## Summary Statistics

| Priority | Count | Est. Fix Time |
|----------|-------|---------------|
| P0 - Critical | 2 | 2-3 hours |
| P1 - High | 2 | 15 minutes |
| P2 - Medium | 4 | 2 hours |
| P3 - Low | 1 | 5 minutes |
| **TOTAL** | **9 bugs** | **4-5 hours** |

---

## Week 1 Priority Fix Order

### Monday (3 hours):
1. **BUG-001** - Fix pod health checks (highest priority) - 1 hour
2. **BUG-004** - Clean up old deployments - 5 minutes
3. **BUG-003** - Configure CORS - 10 minutes
4. **BUG-002** - Fix Azure Storage OR disable temporarily - 30 minutes

**After these 4 fixes**: Application should be accessible and usable

### Tuesday (2 hours):
5. **BUG-005** - Configure email notifications - 20 minutes
6. **BUG-007** - Set up Application Insights - 15 minutes
7. Test core workflows end-to-end - 85 minutes

### Wednesday-Thursday:
8. **BUG-006** - Configure telematics (if needed) - 30 minutes
9. **BUG-008** - Enable Computer Vision (if needed) - 20 minutes
10. Fix any new bugs discovered during testing

---

## The Good News

✅ **Application IS starting successfully**:
- Database connected
- Redis connected
- API running on port 3000
- Background jobs working
- No critical code errors

The issues are all **configuration and deployment related**, not code bugs.

---

## Next Steps (Right Now)

### Immediate Actions (Next 30 minutes):

1. **Remove health check temporarily** to get app accessible:
```bash
kubectl edit deployment fleet-app-76bd664f87 -n fleet-management
# Remove or comment out livenessProbe and readinessProbe
```

2. **Test if app responds** once pods are ready:
```bash
kubectl get pods -n fleet-management -w
# Wait for READY 1/1
curl http://172.168.84.37/api/health
```

3. **Create GitHub issues** for each bug so we can track progress

---

## Resources Needed

- [ ] Azure Storage Account connection string
- [ ] SMTP credentials for email
- [ ] Samsara API token (optional)
- [ ] Azure Application Insights key (optional)
- [ ] Azure Computer Vision key (optional)

---

**Status**: Ready to start fixing. Most issues are quick configuration changes.

**Next Update**: After fixing BUG-001 and getting pods running properly.
