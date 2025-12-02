# Fleet Management - Deployment Instructions

## 🚀 Quick Deployment (Recommended)

To deploy all new features to production, run:

```bash
./deploy-new-features.sh
```

This script will:
1. ✅ Build new Docker image with all Phase 2-3 features
2. ✅ Push to Azure Container Registry
3. ✅ Deploy to Kubernetes (fleet-management namespace)
4. ✅ Verify endpoints are responding
5. ✅ Show deployment status

**Estimated Time**: 5-10 minutes

---

## 📋 Manual Deployment Steps

If you prefer manual deployment or need to troubleshoot:

### Step 1: Build Docker Image

```bash
cd api

docker build -f Dockerfile.production \
    -t fleetappregistry.azurecr.io/fleet-api:v2.0-complete .
```

### Step 2: Push to Azure Container Registry

```bash
az acr login --name fleetappregistry

docker push fleetappregistry.azurecr.io/fleet-api:v2.0-complete
```

### Step 3: Update Kubernetes Deployment

```bash
kubectl set image deployment/fleet-api \
    fleet-api=fleetappregistry.azurecr.io/fleet-api:v2.0-complete \
    -n fleet-management

kubectl rollout status deployment/fleet-api -n fleet-management
```

### Step 4: Verify Deployment

```bash
# Check pods
kubectl get pods -n fleet-management

# Test API health
curl https://fleet.capitaltechalliance.com/api/health

# Test new mobile endpoint
curl -X POST https://fleet.capitaltechalliance.com/api/mobile/register \
    -H "Content-Type: application/json" \
    -d '{"device_type":"ios","device_id":"test","device_name":"Test","app_version":"1.0","os_version":"17.0"}'
```

---

## 🗄️ Database Migrations

Before or after deployment, run these migrations:

```bash
# Connect to PostgreSQL
kubectl port-forward svc/fleet-postgres 5432:5432 -n fleet-management

# In another terminal, run migrations
psql -h localhost -U fleetadmin -d fleetdb -f api/src/migrations/010_route_optimization.sql
psql -h localhost -U fleetadmin -d fleetdb -f api/src/migrations/011_dispatch_system.sql
psql -h localhost -U fleetadmin -d fleetdb -f api/src/migrations/012_vehicle_3d_models.sql
psql -h localhost -U fleetadmin -d fleetdb -f api/src/migrations/013_ev_management.sql
psql -h localhost -U fleetadmin -d fleetdb -f api/src/migrations/014_video_telematics.sql
psql -h localhost -U fleetadmin -d fleetdb -f api/src/migrations/015_mobile_integration.sql
```

Or run them all at once:

```bash
for migration in api/src/migrations/01{0..5}_*.sql; do
    echo "Running $migration..."
    psql -h localhost -U fleetadmin -d fleetdb -f "$migration"
done
```

---

## ⚙️ Environment Variables

Ensure these environment variables are set in Kubernetes secrets:

```bash
kubectl create secret generic fleet-api-secrets -n fleet-management \
    --from-literal=MAPBOX_API_KEY=your_mapbox_key \
    --from-literal=AZURE_WEBPUBSUB_CONNECTION_STRING=your_connection \
    --from-literal=AZURE_STORAGE_CONNECTION_STRING=your_storage \
    --from-literal=AZURE_SPEECH_API_KEY=your_speech_key \
    --from-literal=AZURE_OPENAI_API_KEY=your_openai_key \
    --from-literal=SAMSARA_API_KEY=existing_value \
    --from-literal=SMARTCAR_CLIENT_ID=existing_value \
    --from-literal=SMARTCAR_CLIENT_SECRET=existing_value \
    --dry-run=client -o yaml | kubectl apply -f -
```

---

## 🧪 Testing After Deployment

### 1. Health Check
```bash
curl https://fleet.capitaltechalliance.com/api/health
# Expected: {"status":"healthy","environment":"production","version":"1.0.0"}
```

### 2. API Documentation
```bash
open https://fleet.capitaltechalliance.com/api/docs
```

### 3. Test New Endpoints

**Route Optimization:**
```bash
curl https://fleet.capitaltechalliance.com/api/route-optimization/stats
```

**Dispatch:**
```bash
curl https://fleet.capitaltechalliance.com/api/dispatch/channels
```

**EV Charging:**
```bash
curl https://fleet.capitaltechalliance.com/api/ev/chargers
```

**Video Telematics:**
```bash
curl https://fleet.capitaltechalliance.com/api/video/cameras
```

**Mobile Integration:**
```bash
curl https://fleet.capitaltechalliance.com/api/mobile/register
```

---

## 📊 Monitoring

### View Logs
```bash
# API logs
kubectl logs -f deployment/fleet-api -n fleet-management

# Recent logs
kubectl logs deployment/fleet-api -n fleet-management --tail=100
```

### Check Resource Usage
```bash
kubectl top pods -n fleet-management
```

### View Events
```bash
kubectl get events -n fleet-management --sort-by='.lastTimestamp'
```

---

## 🔄 Rollback (If Needed)

If something goes wrong, rollback to previous version:

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/fleet-api -n fleet-management

# Or rollback to specific revision
kubectl rollout history deployment/fleet-api -n fleet-management
kubectl rollout undo deployment/fleet-api -n fleet-management --to-revision=2
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] All database migrations run successfully
- [ ] Environment variables/secrets configured
- [ ] Docker image built and pushed
- [ ] Kubernetes deployment updated
- [ ] All pods running and healthy
- [ ] API health check passing
- [ ] New endpoints responding (even if auth required)
- [ ] Logs show no critical errors
- [ ] Documentation updated
- [ ] Team notified of deployment

After deployment:

- [ ] Test all new features
- [ ] Monitor logs for 1 hour
- [ ] Check error rates in Application Insights
- [ ] Verify mobile apps can connect
- [ ] Update demo materials if needed
- [ ] Document any issues

---

## 🆘 Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n fleet-management
kubectl logs <pod-name> -n fleet-management
```

### Image Pull Errors
```bash
# Re-authenticate to ACR
az acr login --name fleetappregistry

# Verify image exists
az acr repository show-tags --name fleetappregistry --repository fleet-api
```

### Database Connection Issues
```bash
# Check postgres service
kubectl get svc fleet-postgres -n fleet-management

# Test connection from a pod
kubectl run -it --rm debug --image=postgres:14 --restart=Never -n fleet-management -- \
    psql -h fleet-postgres -U fleetadmin -d fleetdb -c "SELECT version();"
```

### 502/504 Gateway Errors
```bash
# Check ingress
kubectl get ingress -n fleet-management

# Check service endpoints
kubectl get endpoints fleet-api-service -n fleet-management
```

---

## 📞 Support

For deployment issues:
- Check logs: `kubectl logs deployment/fleet-api -n fleet-management`
- Check events: `kubectl get events -n fleet-management`
- Review documentation: `COMPLETE_IMPLEMENTATION_TONIGHT.md`
- API docs: https://fleet.capitaltechalliance.com/api/docs

---

**Deployment Status**: Ready to deploy all Phase 2-3 features
**Estimated Deployment Time**: 5-10 minutes
**Rollback Time**: < 2 minutes
**Expected Downtime**: Zero (rolling deployment)
