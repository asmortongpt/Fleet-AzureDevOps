# Fleet Management System - Project Handoff Documentation

**Version:** 1.1.0
**Date:** 2025-11-12
**Status:** Production-Ready with DevOps Improvements

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Infrastructure](#infrastructure)
5. [Deployment Status](#deployment-status)
6. [Pending Tasks](#pending-tasks)
7. [Development Setup](#development-setup)
8. [Deployment Guide](#deployment-guide)
9. [Authentication & Security](#authentication--security)
10. [API Documentation](#api-documentation)
11. [Troubleshooting](#troubleshooting)
12. [Contacts & Resources](#contacts--resources)

---

## Executive Summary

The Fleet Management System is an enterprise-grade, multi-tenant application designed for comprehensive fleet operations management. The system is currently deployed on Azure Kubernetes Service (AKS) and includes:

- ✅ **Backend API** - Node.js/Express with TypeScript
- ✅ **Frontend** - React with TypeScript and Vite
- ✅ **Database** - PostgreSQL 15 with multi-tenancy
- ✅ **Caching** - Redis for session management
- ✅ **Container Registry** - Azure Container Registry (ACR)
- ✅ **Orchestration** - Kubernetes on AKS
- ✅ **Monitoring** - OpenTelemetry with Azure Application Insights
- ✅ **SSL** - Let's Encrypt certificates via cert-manager
- ⏳ **Custom Domain** - fleet.capitaltechalliance.com (DNS configuration pending)

### Current Production Access

- **Production URL:** fleet.capitaltechalliance.com
- **IP Address:** http://68.220.148.2
- **Namespace:** fleet-management
- **Region:** Azure East US 2
- **Demo Credentials:** admin@demofleet.com / Demo@123

### ⚠️ CRITICAL: Security Update (2025-11-12)

**Hard-coded secrets have been removed from Dockerfile**
- Azure Maps subscription key is now passed as build argument
- **ACTION REQUIRED**: Set `AZURE_MAPS_SUBSCRIPTION_KEY` in GitHub repository secrets
- CI/CD pipeline updated to use secure build args

---

## Project Overview

### Key Features

1. **Vehicle Management**
   - Real-time vehicle tracking with Azure Maps integration
   - Maintenance scheduling (time-based, mileage-based, engine hours)
   - Fuel transaction tracking
   - Work order management

2. **Driver Management**
   - Driver profiles and assignments
   - Performance monitoring
   - Communication logs
   - Safety incident tracking

3. **Maintenance Operations**
   - **Recurring Maintenance Scheduler** (NEW)
     - Automated work order generation
     - Multiple schedule types: time, mileage, engine hours
     - Customizable work order templates
     - History tracking and notifications
   - Manual work order creation
   - Parts inventory management
   - Vendor management

4. **Reporting & Analytics**
   - Real-time fleet dashboard
   - Custom report generation
   - Cost analysis
   - Compliance tracking

5. **Security & Compliance**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Multi-tenant isolation
   - Audit logging (FedRAMP compliant)
   - Account lockout policies
   - TLS/SSL encryption

### Technology Stack

**Frontend:**
- React 18.3
- TypeScript 5.5
- Vite 5.3
- TailwindCSS 3.4
- Shadcn/ui components
- Azure Maps SDK
- React Router v6

**Backend:**
- Node.js 20 LTS
- Express 4.19
- TypeScript 5.5
- PostgreSQL 15
- Redis 7
- Bcrypt for password hashing
- JWT for authentication
- Swagger/OpenAPI documentation

**Infrastructure:**
- Azure Kubernetes Service (AKS)
- Azure Container Registry (ACR)
- Azure Application Insights
- NGINX Ingress Controller
- cert-manager for SSL
- Horizontal Pod Autoscaling

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐
│   CloudFlare    │ ← DNS (fleet.capitaltechalliance.com)
│   or Azure DNS  │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│   NGINX Ingress Controller               │
│   External IP: 20.15.65.2                │
│   - SSL Termination (Let's Encrypt)     │
│   - Path-based routing                   │
└─────────┬───────────────────────────────┘
          │
          ├──────────────┬─────────────────┐
          │              │                 │
          ↓              ↓                 ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Fleet App    │  │ Fleet API    │  │ Fleet App    │
│ (Frontend)   │  │ (Backend)    │  │ (Frontend)   │
│ Pod 1        │  │ Pod 1        │  │ Pod 2        │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ↓                         ↓
    ┌──────────────┐          ┌──────────────┐
    │  PostgreSQL  │          │    Redis     │
    │  StatefulSet │          │  ClusterIP   │
    └──────────────┘          └──────────────┘
```

### System Components

#### 1. Frontend (fleet-app)
- **Deployment:** 3 replicas
- **Service:** ClusterIP (port 3000)
- **Resource Limits:** CPU: 500m, Memory: 512Mi
- **Health Checks:** Liveness and readiness probes
- **Container:** fleetappregistry.azurecr.io/fleet-app:latest

#### 2. Backend API (fleet-api)
- **Deployment:** 1 replica (with HPA)
- **Service:** ClusterIP (port 3000)
- **Resource Limits:** CPU: 1000m, Memory: 1Gi
- **Features:**
  - RESTful API with OpenAPI/Swagger documentation
  - JWT authentication
  - Multi-tenant data isolation
  - OpenTelemetry instrumentation
  - Recurring maintenance scheduler (cron job)
- **Container:** fleetappregistry.azurecr.io/fleet-api:latest

#### 3. Database (fleet-postgres)
- **Type:** StatefulSet
- **Storage:** 10Gi persistent volume
- **Credentials:** Kubernetes secrets
- **Backup:** Manual snapshots recommended
- **Schema:** 30+ tables with multi-tenant support

#### 4. Cache (fleet-redis)
- **Type:** Deployment
- **Purpose:** Session management, rate limiting
- **Resource:** 256Mi memory, 100m CPU

---

## Infrastructure

### Azure Resources

| Resource | Name/ID | Purpose |
|----------|---------|---------|
| AKS Cluster | fleet-aks-cluster | Kubernetes orchestration |
| Container Registry | fleetappregistry | Docker image storage |
| Application Insights | fleet-app-insights | Monitoring and telemetry |
| Resource Group | FleetManagement-RG | Resource organization |
| Key Vault | fleet-keyvault (optional) | Secrets management |

### Kubernetes Resources

**Namespace:** `fleet-management`

| Resource Type | Name | Purpose |
|--------------|------|---------|
| Deployment | fleet-app | Frontend application |
| Deployment | fleet-api | Backend API |
| StatefulSet | fleet-postgres | PostgreSQL database |
| Deployment | fleet-redis | Redis cache |
| Service | fleet-app-internal | Frontend ClusterIP |
| Service | fleet-app-service | Frontend LoadBalancer |
| Service | fleet-api-service | Backend ClusterIP |
| Service | fleet-postgres-service | Database ClusterIP |
| Service | fleet-redis-service | Redis ClusterIP |
| Ingress | fleet-ingress | Traffic routing |
| Secret | fleet-db-secret | Database credentials |
| Secret | fleet-api-secret | API secrets |
| Secret | fleet-tls-cert | SSL certificate |

### Network Configuration

- **External LoadBalancer IP:** 68.220.148.2
- **Ingress External IP:** 20.15.65.2
- **Internal Cluster IPs:** Dynamically assigned
- **SSL:** Let's Encrypt (letsencrypt-prod ClusterIssuer)

---

## Deployment Status

### ✅ Completed

1. ✅ Frontend and backend deployed to production AKS
2. ✅ PostgreSQL database with demo data seeded
3. ✅ Redis cache operational
4. ✅ NGINX Ingress Controller installed
5. ✅ cert-manager configured with Let's Encrypt
6. ✅ Ingress resource created for fleet.capitaltechalliance.com
7. ✅ Azure Container Registry with latest images
8. ✅ OpenTelemetry monitoring to Application Insights
9. ✅ Recurring maintenance scheduler implemented
10. ✅ Code migrated to Azure DevOps repository
11. ✅ Environment configuration updated for production
12. ✅ Authentication system functional
13. ✅ **DevOps Documentation Comprehensive Update (2025-11-12)**
14. ✅ **Security Fix: Removed hard-coded secrets from Dockerfile**
15. ✅ **Created DEVOPS.md master guide (900+ lines)**
16. ✅ **Fixed all file paths in deployment documentation**
17. ✅ **Updated README.md with accurate project information**
18. ✅ **Updated package.json with correct project name**

### ⏳ Pending Tasks

1. **GitHub Repository Secrets** (CRITICAL)
   - Add `AZURE_MAPS_SUBSCRIPTION_KEY` to GitHub repository secrets
   - This is required for Docker builds after security fix

2. **DNS Configuration** (if not already done)
   - Point fleet.capitaltechalliance.com to 20.15.65.2
   - Verify DNS propagation (24-48 hours)
   - SSL certificate will auto-issue after DNS

3. **Rebuild and Deploy Frontend** (if needed)
   - Frontend may need rebuild if Azure Maps key not set
   - Build now uses secure build args
   - See DEVOPS.md for build instructions

4. **Azure AD App Registration Update**
   - Update redirect URIs to https://fleet.capitaltechalliance.com/auth/callback
   - Current client ID: 80fe6628-1dc4-41fe-894f-919b12ecc994

5. **Testing & Validation**
   - End-to-end testing on custom domain
   - SSL certificate validation
   - Authentication flow verification
   - API endpoint testing

6. **CI/CD Pipeline** (Optional but Recommended)
   - Pipeline already configured in .github/workflows/ci-cd.yml
   - Requires GitHub secrets to be set
   - Automated builds on commit to main/develop

---

## Development Setup

### Prerequisites

- Node.js 20 LTS
- Docker Desktop
- kubectl CLI
- Azure CLI
- Git
- PostgreSQL client (optional)

### Local Development

```bash
# Clone repository
git clone https://github.com/asmortongpt/Fleet.git
cd Fleet

# Install frontend dependencies
npm install

# Install backend dependencies
cd api
npm install

# Start database (Docker)
docker-compose up -d postgres redis

# Run database migrations
cd api
npm run migrate

# Start backend
npm run dev

# Start frontend (new terminal)
cd ..
npm run dev

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
```

### Environment Variables

**.env (Frontend Root)**
```env
VITE_API_URL=/api
VITE_ENVIRONMENT=production
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=560t3GIDj2PBsHx1wDcgQ67VK6d6wgkdcHK0rTmTRhYUQzFizj4SJQQJ99BKACYeBjFbS4kUAAAgAZMP7TCI
VITE_AZURE_CLIENT_ID=80fe6628-1dc4-41fe-894f-919b12ecc994
VITE_AZURE_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback
```

**.env (Backend api/.env)** - Stored in Kubernetes secrets

---

## Deployment Guide

### Step 1: DNS Configuration (CRITICAL - DO THIS FIRST)

**Domain:** fleet.capitaltechalliance.com
**Required DNS Record:**

```
Type: A
Host: fleet
Value: 20.15.65.2
TTL: 300 (5 minutes)
```

**How to Configure:**

1. Log into your domain registrar or DNS provider
2. Navigate to DNS management for capitaltechalliance.com
3. Add A record:
   - Subdomain: fleet
   - Type: A
   - IP Address: 20.15.65.2
   - TTL: 300 seconds
4. Save and wait for propagation (15-60 minutes typically)

**Verify DNS:**
```bash
nslookup fleet.capitaltechalliance.com
# Should return: 20.15.65.2

dig fleet.capitaltechalliance.com +short
# Should return: 20.15.65.2
```

---

### Step 2: Rebuild Frontend with Updated Configuration

```bash
# Navigate to project root
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Build frontend Docker image
docker build -t fleetappregistry.azurecr.io/fleet-app:v2.0.0 \
  --build-arg VITE_API_URL=/api \
  --build-arg VITE_AZURE_AD_REDIRECT_URI=https://fleet.capitaltechalliance.com/auth/callback \
  .

# Or use Azure Container Registry build
az acr build \
  --registry fleetappregistry \
  --image fleet-app:v2.0.0 \
  --image fleet-app:latest \
  --file Dockerfile \
  .

# Update Kubernetes deployment
kubectl set image deployment/fleet-app \
  fleet-app=fleetappregistry.azurecr.io/fleet-app:v2.0.0 \
  -n fleet-management

# Monitor rollout
kubectl rollout status deployment/fleet-app -n fleet-management
```

---

### Step 3: Update Azure AD App Registration

1. Navigate to Azure Portal → Azure Active Directory → App Registrations
2. Find app: 80fe6628-1dc4-41fe-894f-919b12ecc994
3. Go to "Authentication" blade
4. Under "Redirect URIs", add:
   ```
   https://fleet.capitaltechalliance.com/auth/callback
   ```
5. Save changes

---

### Step 4: Verify SSL Certificate Issuance

```bash
# Check certificate status
kubectl get certificate -n fleet-management

# Should show:
# NAME             READY   SECRET           AGE
# fleet-tls-cert   True    fleet-tls-cert   Xm

# If False, check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

**Note:** SSL certificate will only issue after DNS is configured correctly.

---

### Step 5: Test Production Deployment

```bash
# Test health endpoint
curl https://fleet.capitaltechalliance.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-09T...",
#   "environment": "production",
#   "version": "1.0.0"
# }

# Test frontend
open https://fleet.capitaltechalliance.com

# Test login
# Email: admin@demofleet.com
# Password: Demo@123
```

---

## Authentication & Security

### Authentication Methods

1. **Email/Password (JWT)**
   - Endpoint: POST /api/auth/login
   - Returns: JWT token (24h expiration)
   - Security: bcrypt password hashing, account lockout after 3 failed attempts

2. **Microsoft SSO** (Configured but currently disabled due to TypeScript errors)
   - Azure AD integration
   - Requires TypeScript fixes in:
     - api/src/middleware/microsoft-auth.ts.disabled
     - api/src/routes/microsoft-auth.ts.disabled

### Demo Accounts

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| admin@demofleet.com | Demo@123 | admin | Full access |
| manager@demofleet.com | Demo@123 | fleet_manager | Management access |
| tech@demofleet.com | Demo@123 | technician | Maintenance only |
| driver@demofleet.com | Demo@123 | driver | Driver portal |

### Security Features

- ✅ TLS 1.2+ encryption (Let's Encrypt)
- ✅ JWT authentication with 24-hour expiration
- ✅ Password complexity requirements
- ✅ Account lockout (3 failed attempts, 30-minute lockout)
- ✅ Audit logging for all user actions
- ✅ Multi-tenant data isolation
- ✅ Rate limiting (100 req/min per IP)
- ✅ Helmet.js security headers
- ✅ CORS configuration

---

## API Documentation

### Base URL

- **Production:** https://fleet.capitaltechalliance.com/api
- **Current (IP):** http://68.220.148.2/api
- **Swagger UI:** https://fleet.capitaltechalliance.com/api/docs
- **OpenAPI Spec:** https://fleet.capitaltechalliance.com/api/openapi.json

### Key Endpoints

#### Authentication
```
POST   /api/auth/login          Login with email/password
POST   /api/auth/register       Register new user
POST   /api/auth/logout         Logout user
```

#### Vehicles
```
GET    /api/vehicles            List all vehicles
POST   /api/vehicles            Create vehicle
GET    /api/vehicles/:id        Get vehicle details
PUT    /api/vehicles/:id        Update vehicle
DELETE /api/vehicles/:id        Delete vehicle
GET    /api/vehicles/stats      Vehicle statistics
```

#### Maintenance
```
GET    /api/maintenance-schedules              List schedules
POST   /api/maintenance-schedules              Create schedule
GET    /api/maintenance-schedules/:id          Get schedule
PUT    /api/maintenance-schedules/:id          Update schedule
DELETE /api/maintenance-schedules/:id          Delete schedule

# Recurring Maintenance (NEW)
POST   /api/maintenance-schedules/recurring    Create recurring schedule
GET    /api/maintenance-schedules/due          Get due schedules
POST   /api/maintenance-schedules/:id/generate-work-order  Generate work order
GET    /api/maintenance-schedules/stats/recurring  Recurring stats
```

#### Work Orders
```
GET    /api/work-orders         List work orders
POST   /api/work-orders         Create work order
GET    /api/work-orders/:id     Get work order
PUT    /api/work-orders/:id     Update work order
DELETE /api/work-orders/:id     Delete work order
```

### Authentication Header

All protected endpoints require JWT token:
```
Authorization: Bearer <token>
```

---

## Troubleshooting

### Issue: Frontend can't connect to API

**Symptoms:**
- Login fails with network error
- API calls return CORS errors

**Solution:**
```bash
# 1. Check if VITE_API_URL is correct
cat .env | grep VITE_API_URL
# Should be: VITE_API_URL=/api

# 2. Rebuild frontend if needed
az acr build --registry fleetappregistry --image fleet-app:latest .

# 3. Check ingress is routing correctly
kubectl get ingress -n fleet-management
kubectl describe ingress fleet-ingress -n fleet-management
```

---

### Issue: SSL Certificate Not Issuing

**Symptoms:**
- Certificate shows READY: False
- Browser shows insecure connection

**Solution:**
```bash
# 1. Verify DNS is configured
dig fleet.capitaltechalliance.com +short

# 2. Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# 3. Describe certificate for errors
kubectl describe certificate fleet-tls-cert -n fleet-management

# 4. Check HTTP-01 challenge
kubectl get challenges -n fleet-management

# 5. If stuck, delete and recreate
kubectl delete certificate fleet-tls-cert -n fleet-management
kubectl apply -f deployment/kubernetes/fleet-ingress.yaml
```

---

### Issue: Database Connection Errors

**Symptoms:**
- API returns 500 errors
- Logs show "ECONNREFUSED"

**Solution:**
```bash
# 1. Check database pod status
kubectl get pods -n fleet-management | grep postgres

# 2. Check database logs
kubectl logs -n fleet-management fleet-postgres-0

# 3. Test connection from API pod
kubectl exec -it -n fleet-management \
  $(kubectl get pod -n fleet-management -l app=fleet-api -o jsonpath='{.items[0].metadata.name}') \
  -- sh -c 'nc -zv fleet-postgres-service 5432'

# 4. Verify secrets
kubectl get secret fleet-db-secret -n fleet-management -o yaml
```

---

### Issue: Recurring Maintenance Not Working

**Symptoms:**
- Work orders not auto-generating
- Scheduler logs show errors

**Solution:**
```bash
# 1. Check API logs for scheduler
kubectl logs -n fleet-management -l app=fleet-api | grep "Maintenance scheduler"

# 2. Verify schedule has is_recurring = true
kubectl exec -it fleet-postgres-0 -n fleet-management -- \
  psql -U fleetadmin -d fleetdb -c \
  "SELECT id, service_type, is_recurring, auto_create_work_order FROM maintenance_schedules WHERE is_recurring = true;"

# 3. Check if cron job is running (runs every hour at minute 0)
# Look for log entries: "Running scheduled task..."

# 4. Manually trigger schedule check
curl -X POST https://fleet.capitaltechalliance.com/api/maintenance-schedules/process-recurring \
  -H "Authorization: Bearer <admin-token>"
```

---

## Contacts & Resources

### Azure DevOps Repository

- **Organization:** CapitalTechAlliance
- **Project:** FleetManagement
- **Repository:** https://dev.azure.com/CapitalTechAlliance/FleetManagement/_git/Fleet
- **Web UI:** https://dev.azure.com/CapitalTechAlliance/FleetManagement

### Azure Resources

- **Subscription:** [Subscription Name]
- **Resource Group:** FleetManagement-RG
- **AKS Cluster:** fleet-aks-cluster
- **Container Registry:** fleetappregistry.azurecr.io
- **Region:** East US 2

### Key Documentation

- **DevOps Master Guide:** `/DEVOPS.md` (NEW - Comprehensive DevOps documentation)
- **Project Overview:** `/README.md` (Updated with accurate information)
- **Deployment Guide:** `/DEPLOYMENT_GUIDE.md`
- **Azure Deployment Guide:** `/deployment/AZURE_DEPLOYMENT_GUIDE.md`
- **Multi-Environment Guide:** `/deployment/MULTI_ENVIRONMENT_GUIDE.md`
- **Quick Start Guide:** `/deployment/QUICK_START.md`
- **API Documentation:** https://fleet.capitaltechalliance.com/api/docs
- **Recurring Maintenance Guide:** `/docs/RECURRING_MAINTENANCE_GUIDE.md`
- **Architecture Diagrams:** `/docs/architecture/`
- **Database Schema:** `/database/schema.sql`
- **Migration Files:** `/api/src/migrations/`

### External Services

- **Azure Maps API Key:** 560t3GIDj2PBsHx1wDcgQ67VK6d6wgkdcHK0rTmTRhYUQzFizj4SJQQJ99BKACYeBjFbS4kUAAAgAZMP7TCI
- **Azure AD Tenant:** 0ec14b81-7b82-45ee-8f3d-cbc31ced5347
- **Azure AD Client ID:** 80fe6628-1dc4-41fe-894f-919b12ecc994

---

## Next Steps for New Team

### Immediate (Within 24 Hours)

1. ✅ Configure DNS for fleet.capitaltechalliance.com → 20.15.65.2
2. ✅ Rebuild and deploy frontend with updated configuration
3. ✅ Update Azure AD redirect URIs
4. ✅ Test end-to-end authentication flow
5. ✅ Verify SSL certificate issuance

### Short Term (Within 1 Week)

1. ⏳ Set up Azure DevOps CI/CD pipeline
2. ⏳ Enable automated builds on commit
3. ⏳ Configure deployment to staging environment
4. ⏳ Fix TypeScript errors in Microsoft SSO code (optional)
5. ⏳ Set up database backup automation
6. ⏳ Configure monitoring alerts

### Medium Term (Within 1 Month)

1. ⏳ Implement horizontal pod autoscaling
2. ⏳ Set up automated testing in pipeline
3. ⏳ Create runbooks for common operations
4. ⏳ Implement disaster recovery procedures
5. ⏳ Performance testing and optimization
6. ⏳ Security audit and penetration testing

---

## Appendix

### Quick Command Reference

```bash
# Connect to AKS cluster
az aks get-credentials --resource-group FleetManagement-RG --name fleet-aks-cluster

# View all resources
kubectl get all -n fleet-management

# Check logs
kubectl logs -f -l app=fleet-api -n fleet-management
kubectl logs -f -l app=fleet-app -n fleet-management

# Restart deployment
kubectl rollout restart deployment/fleet-api -n fleet-management
kubectl rollout restart deployment/fleet-app -n fleet-management

# Scale deployment
kubectl scale deployment/fleet-app --replicas=5 -n fleet-management

# Execute command in pod
kubectl exec -it <pod-name> -n fleet-management -- /bin/sh

# Port forward for debugging
kubectl port-forward svc/fleet-api-service 3000:3000 -n fleet-management
kubectl port-forward svc/fleet-postgres-service 5432:5432 -n fleet-management

# View secrets (base64 encoded)
kubectl get secret fleet-db-secret -n fleet-management -o yaml
```

### Database Connection String (Kubernetes)

```
Host: fleet-postgres-service.fleet-management.svc.cluster.local
Port: 5432
Database: fleetdb
User: fleetadmin
Password: (stored in fleet-db-secret)
```

---

**Document Version:** 1.1.0
**Last Updated:** 2025-11-12
**Author:** Technical Team
**Review Date:** 2025-12-12
**Recent Updates:** DevOps documentation overhaul, security fixes, path corrections

---

*This document contains sensitive information. Treat as confidential.*
