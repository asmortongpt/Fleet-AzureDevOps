# Fleet Backend API - Azure Deployment Status Report

**Date:** 2025-12-30
**Deployment Target:** Azure Container Instance
**Status:** Partial Success - Image Built, Container Needs Configuration

## Summary

Successfully built and pushed the Fleet Backend API Docker image to Azure Container Registry (fleetacr.azurecr.io). The container deployment to Azure Container Instance requires additional configuration for database and Redis connectivity.

## Completed Tasks

### 1. Production Dockerfile Created ✓
- **File:** `/Users/andrewmorton/Documents/GitHub/fleet-local/server/Dockerfile.backend-prod-prebuilt`
- **Type:** Multi-stage Alpine-based Node.js 20 image
- **Size:** Optimized with pre-built dist folder
- **Security:** Non-root user (nodejs:1001), minimal attack surface
- **Features:**
  - Health check endpoint on `/health`
  - Python/make/g++ build dependencies for native modules (heapdump)
  - Production-only npm dependencies
  - Proper file permissions and ownership

### 2. Docker Image Built and Pushed to ACR ✓
- **Registry:** fleetacr.azurecr.io
- **Image Name:** fleet-backend:latest
- **Image Digest:** sha256:55852094ced32811420ef204b15f4d7219dfc565fe529cd3a52644367374387f
- **Build Status:** Success (Run ID: chc, completed in 2m51s)
- **Base Image:** node:20-alpine (digest: sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448)

### 3. Container Instance Attempted Deployment
- **Resource Group:** fleet-production-rg
- **Container Name:** fleet-backend-aci
- **DNS Label:** fleet-backend-prod
- **FQDN:** fleet-backend-prod.eastus2.azurecontainer.io
- **Resources:** 1 CPU core, 2GB RAM
- **Status:** Failed - Container crashed due to configuration issues

## Issues Identified

### 1. Database Connection Failures
**Problem:** PostgreSQL authentication errors
```
Error: password authentication failed for user "fleetadmin"
```

**Root Cause:**
- Container has POSTGRES_PASSWORD as secure environment variable (not visible in metadata)
- The password used in deployment ("fleetpass123") does not match the actual postgres container password
- Database name confirmed as "fleetdb" (from postgres container env vars)

**Resolution Needed:**
- Retrieve actual PostgreSQL password from postgres container or Azure Key Vault
- Or recreate postgres container with known credentials

### 2. Redis Connection Issues
**Problem:** Redis client attempting to connect to localhost instead of provided REDIS_HOST
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Root Cause:**
- Application code may have hardcoded Redis configuration
- Environment variable REDIS_HOST=20.85.39.60 is provided but not being used

**Resolution Needed:**
- Review `/server/src/services/redis.ts` or redis configuration code
- Ensure Redis client initialization uses process.env.REDIS_HOST
- Verify Redis container at 20.85.39.60:6379 is accessible from container network

### 3. Required Environment Variables
The application requires these environment variables (from `/server/src/services/config.ts`):

**Provided:**
- AZURE_AD_CLIENT_ID ✓
- AZURE_AD_TENANT_ID ✓
- AZURE_AD_REDIRECT_URI ✓
- DATABASE_HOST ✓
- DATABASE_NAME ✓
- DATABASE_USER ✓
- DATABASE_PASSWORD ✓ (incorrect password)
- REDIS_HOST ✓ (not being used by code)
- REDIS_PORT ✓ (not being used by code)

**Optional/Defaulted:**
- JWT_SECRET (provided)
- FRONTEND_URL (provided)
- LOG_LEVEL (defaults to 'info')

## Current Infrastructure

### Existing Container Instances in fleet-production-rg

| Container Name | Image | IP Address | Port(s) | CPU/Memory | Status |
|---------------|-------|------------|---------|------------|--------|
| fleet-postgres-prod | postgres:15-alpine | 4.153.1.114 | 5432 | 2 core/4GB | Running |
| fleet-redis-prod | redis:7-alpine | 20.85.39.60 | 6379 | 1 core/2GB | Running |
| fleet-app-aci | fleet-app:latest | 48.214.23.7 | 80,8080 | 2 core/4GB | Running |
| fleet-auth-api | fleet-auth-api:v1.0.0 | 20.7.242.222 | 3001 | 1 core/1.5GB | Running |
| fleet-dispatch-aci | fleet-dispatch:latest | 57.152.94.177 | 8083 | 1 core/1GB | Running |
| fleet-obd2-aci | fleet-obd2:latest | 20.124.153.213 | 8081 | 1 core/1GB | Running |
| fleet-radio-aci | fleet-radio:latest | 20.241.223.28 | 8082 | 1 core/1GB | Running |

**CPU Quota Status:** 9/10 cores used in eastus2 region (1 core available)

## Next Steps to Complete Deployment

### Immediate Actions Required

1. **Retrieve PostgreSQL Credentials**
   ```bash
   # Option 1: Check Azure Key Vault
   az keyvault secret show --vault-name <vault-name> --name postgres-password

   # Option 2: Exec into postgres container and reset password
   az container exec --resource-group fleet-production-rg \
     --name fleet-postgres-prod \
     --exec-command "psql -U fleetadmin -d fleetdb -c \"ALTER USER fleetadmin PASSWORD 'NewSecurePassword123!';\""
   ```

2. **Fix Redis Configuration in Code**
   - Review file: `/Users/andrewmorton/Documents/GitHub/fleet-local/server/src/services/redis.ts`
   - Ensure Redis client uses environment variables:
     ```typescript
     const redis = new Redis({
       host: process.env.REDIS_HOST || 'localhost',
       port: parseInt(process.env.REDIS_PORT || '6379')
     });
     ```
   - Rebuild Docker image if code changes needed

3. **Deploy with Correct Configuration**
   ```bash
   az container create \
     --resource-group fleet-production-rg \
     --name fleet-backend-aci \
     --image fleetacr.azurecr.io/fleet-backend:latest \
     --dns-name-label fleet-backend-prod \
     --ports 3000 \
     --cpu 1 \
     --memory 2 \
     --os-type Linux \
     --registry-login-server fleetacr.azurecr.io \
     --registry-username fleetacr \
     --registry-password $(az acr credential show --name fleetacr --query "passwords[0].value" -o tsv) \
     --environment-variables \
       NODE_ENV=production \
       PORT=3000 \
       AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a \
       AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347 \
       AZURE_AD_REDIRECT_URI=https://fleet-backend-prod.eastus2.azurecontainer.io/auth/callback \
       DATABASE_HOST=4.153.1.114 \
       DATABASE_PORT=5432 \
       DATABASE_NAME=fleetdb \
       DATABASE_USER=fleetadmin \
       REDIS_HOST=20.85.39.60 \
       REDIS_PORT=6379 \
       FRONTEND_URL=https://proud-bay-0fdc8040f.3.azurestaticapps.net \
     --secure-environment-variables \
       DATABASE_PASSWORD=<CORRECT_PASSWORD_HERE> \
       AZURE_AD_CLIENT_SECRET=<from-azure-keyvault> \
       JWT_SECRET=fleet-production-jwt-secret-2025 \
     --location eastus2
   ```

4. **Verify Deployment**
   ```bash
   # Check container status
   az container show --resource-group fleet-production-rg \
     --name fleet-backend-aci \
     --query "containers[0].instanceView.currentState"

   # Check logs
   az container logs --resource-group fleet-production-rg --name fleet-backend-aci

   # Test health endpoint
   curl http://fleet-backend-prod.eastus2.azurecontainer.io:3000/health

   # Expected healthy response:
   # {"status":"healthy","database":"connected","timestamp":"..."}
   ```

## Files Created

1. **Dockerfile (Primary):** `/Users/andrewmorton/Documents/GitHub/fleet-local/server/Dockerfile.backend-prod-prebuilt`
2. **Dockerfile (Alternative):** `/Users/andrewmorton/Documents/GitHub/fleet-local/server/Dockerfile.backend-prod`
3. **Deployment Report:** `/Users/andrewmorton/Documents/GitHub/fleet-local/BACKEND_API_DEPLOYMENT_STATUS.md`

## Docker Build Commands

```bash
# Build locally (testing)
cd /Users/andrewmorton/Documents/GitHub/fleet-local
docker build -f server/Dockerfile.backend-prod-prebuilt -t fleet-backend:test ./server

# Build in ACR (production)
az acr build \
  --registry fleetacr \
  --image fleet-backend:latest \
  --file server/Dockerfile.backend-prod-prebuilt \
  ./server
```

## Container Configuration Reference

### Environment Variables Template
```bash
# Application
NODE_ENV=production
PORT=3000

# Azure AD OAuth
AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
AZURE_AD_CLIENT_SECRET=<secret>
AZURE_AD_REDIRECT_URI=https://fleet-backend-prod.eastus2.azurecontainer.io/auth/callback

# Database
DATABASE_HOST=4.153.1.114
DATABASE_PORT=5432
DATABASE_NAME=fleetdb
DATABASE_USER=fleetadmin
DATABASE_PASSWORD=<secret>

# Redis
REDIS_HOST=20.85.39.60
REDIS_PORT=6379

# Application Config
FRONTEND_URL=https://proud-bay-0fdc8040f.3.azurestaticapps.net
JWT_SECRET=<secret>
LOG_LEVEL=info
```

### Health Check Configuration
- **Endpoint:** `GET /health`
- **Expected Response (Healthy):**
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2025-12-30T21:45:30.000Z"
  }
  ```
- **Expected Response (Unhealthy):**
  ```json
  {
    "status": "unhealthy",
    "database": "disconnected"
  }
  ```
- **Docker Health Check:**
  - Interval: 30s
  - Timeout: 5s
  - Start Period: 10s
  - Retries: 3

## Security Considerations

### Implemented
- ✓ Non-root container user (nodejs:1001)
- ✓ Minimal Alpine base image
- ✓ Multi-stage build (reduced attack surface)
- ✓ Secure environment variables for secrets
- ✓ Health check endpoint for monitoring
- ✓ ACR private registry authentication
- ✓ Production-only dependencies

### Recommended
- [ ] Use Azure Key Vault for secret management
- [ ] Enable Azure Container Instance virtual network integration
- [ ] Configure private endpoints for PostgreSQL and Redis
- [ ] Set up Azure Monitor alerts for container health
- [ ] Implement log aggregation (Application Insights)
- [ ] Add Azure Front Door or Application Gateway for HTTPS termination

## Cost Analysis

**Current Container Instance:**
- **CPU:** 1 core @ ~$0.0000012/second = ~$3.14/month
- **Memory:** 2GB @ ~$0.0000001344/second = ~$0.35/month
- **Total Estimated:** ~$3.50/month

**Note:** Actual costs depend on uptime, network egress, and ACR storage.

## Support & Troubleshooting

### Common Issues

1. **Container Crashes Immediately**
   - Check logs: `az container logs --resource-group fleet-production-rg --name fleet-backend-aci`
   - Verify all required environment variables are set
   - Ensure database/redis are accessible from container network

2. **Database Connection Timeout**
   - Verify PostgreSQL container is running: `az container show --name fleet-postgres-prod`
   - Check firewall rules on container instances
   - Verify DATABASE_HOST IP is correct

3. **Redis Connection Refused**
   - Verify Redis container is running: `az container show --name fleet-redis-prod`
   - Check code uses environment variables for Redis host/port
   - Test Redis connectivity: `redis-cli -h 20.85.39.60 -p 6379 ping`

### Debug Commands

```bash
# View container events
az container show --resource-group fleet-production-rg \
  --name fleet-backend-aci \
  --query "containers[0].instanceView.events"

# Stream logs in real-time
az container attach --resource-group fleet-production-rg --name fleet-backend-aci

# Get container metrics
az monitor metrics list \
  --resource $(az container show --resource-group fleet-production-rg --name fleet-backend-aci --query id -o tsv) \
  --metric "CpuUsage,MemoryUsage"
```

## Conclusion

The Docker image has been successfully built and is ready for deployment. The remaining tasks involve configuring the correct database credentials and ensuring the application code properly uses environment variables for external service connections (Redis). Once these configuration issues are resolved, the backend API can be successfully deployed to Azure Container Instance.

**Container Image Ready:** ✓ fleetacr.azurecr.io/fleet-backend:latest
**Deployment Pending:** Configuration fixes for database password and Redis connection code
