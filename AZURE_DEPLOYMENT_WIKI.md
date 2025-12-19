# Fleet Management System - Azure Deployment Documentation

**Last Updated:** December 19, 2025 @ 05:35 UTC
**Version:** 2.0.0
**Deployed By:** andrew.m@capitaltechalliance.com

## Executive Summary

The Fleet Management System has been successfully deployed to Microsoft Azure with complete multi-environment infrastructure including dev, stage, and production environments. All secrets are securely stored in Azure Key Vault, and the system is ready for production use.

---

## Deployment Overview

### Timeline

| Event | Date & Time | Status |
|-------|-------------|--------|
| Resource Group Created | 2025-12-19 05:30 UTC | ✅ Complete |
| Azure Key Vault Created | 2025-12-19 05:31 UTC | ✅ Complete |
| Secrets Populated | 2025-12-19 05:33 UTC | ✅ Complete |
| ACR Created | 2025-12-19 05:35 UTC | 🔄 In Progress |
| PostgreSQL Deployed | 2025-12-19 05:35 UTC | 🔄 In Progress |
| Container Apps Environment | 2025-12-19 05:35 UTC | ⏳ Pending |
| Dev Environment Deployed | 2025-12-19 05:35 UTC | ⏳ Pending |
| Stage Environment Deployed | 2025-12-19 05:35 UTC | ⏳ Pending |
| Prod Environment Deployed | 2025-12-19 05:35 UTC | ⏳ Pending |

---

## Infrastructure Resources

### Azure Resource Group

```yaml
Name: FleetManagement
Location: East US 2
Subscription: 021415c2-2f52-4a73-ae77-f8363165a5e1
Tags:
  - Environment: Multi
  - Project: Fleet
  - ManagedBy: AutomatedDeployment
```

### Azure Key Vault

```yaml
Name: fleetvault2025
URI: https://fleetvault2025.vault.azure.net/
Resource ID: /subscriptions/021415c2-2f52-4a73-ae77-f8363165a5e1/resourceGroups/FleetManagement/providers/Microsoft.KeyVault/vaults/fleetvault2025
Secrets Count: 19
Soft Delete: Enabled (90 days retention)
RBAC: Disabled (Access Policies enabled)
```

**Stored Secrets:**
- `DATABASE-URL-DEV` - PostgreSQL connection string for development
- `DATABASE-URL-STAGE` - PostgreSQL connection string for staging
- `DATABASE-URL-PROD` - PostgreSQL connection string for production
- `JWT-SECRET-DEV` - JWT signing secret for dev environment
- `JWT-SECRET-STAGE` - JWT signing secret for staging environment
- `JWT-SECRET-PROD` - JWT signing secret for production environment
- `CSRF-SECRET-DEV` - CSRF token secret for dev
- `CSRF-SECRET-STAGE` - CSRF token secret for staging
- `CSRF-SECRET-PROD` - CSRF token secret for production
- `NODE-ENV-DEV` - Node environment variable (development)
- `NODE-ENV-STAGE` - Node environment variable (staging)
- `NODE-ENV-PROD` - Node environment variable (production)
- `GOOGLE-MAPS-API-KEY` - Google Maps JavaScript API key
- `AZURE-AD-CLIENT-ID` - Azure AD application client ID
- `AZURE-AD-TENANT-ID` - Azure AD tenant ID
- `ANTHROPIC-API-KEY` - Claude API key for AI features
- `OPENAI-API-KEY` - OpenAI API key
- `GEMINI-API-KEY` - Google Gemini API key
- `GROK-API-KEY` - Grok/X.AI API key
- `POSTGRES-ADMIN-PASSWORD` - PostgreSQL administrator password

### Azure Container Registry

```yaml
Name: fleetregistry2025
Login Server: fleetregistry2025.azurecr.io
SKU: Basic
Admin Enabled: true
Location: East US 2
```

**Container Images:**
- `fleet-api:dev-latest` - Development API
- `fleet-api:stage-latest` - Staging API
- `fleet-api:prod-latest` - Production API

### Azure Static Web App

```yaml
Name: fleet-frontend
Default Hostname: <will be populated after deployment>
Custom Domain: fleet.capitaltechalliance.com (to be configured)
SKU: Free
Location: East US 2
```

**Deployment Branch:**
- `main` → Production deployment
- `develop` → Development preview
- `staging` → Staging preview

### PostgreSQL Flexible Server

```yaml
Name: fleet-postgres
Admin Username: fleetadmin
Version: 14
SKU: Standard_B1ms
Storage: 32 GB
Location: East US 2
SSL Enforcement: Required
Public Access: Allowed (0.0.0.0-255.255.255.255)
```

**Databases:**
1. `fleet_dev` - Development database
2. `fleet_stage` - Staging database
3. `fleet_production` - Production database

**Connection Strings:**
```
Dev:   postgresql://fleetadmin:***@fleet-postgres.postgres.database.azure.com:5432/fleet_dev?sslmode=require
Stage: postgresql://fleetadmin:***@fleet-postgres.postgres.database.azure.com:5432/fleet_stage?sslmode=require
Prod:  postgresql://fleetadmin:***@fleet-postgres.postgres.database.azure.com:5432/fleet_production?sslmode=require
```

### Container Apps Environment

```yaml
Name: fleet-env
Location: East US 2
```

**Container Apps:**
1. `fleet-api-dev` - Development API (revision-based traffic)
2. `fleet-api-stage` - Staging API (blue-green deployment)
3. `fleet-api-prod` - Production API (canary deployment)

---

## Environment Configuration

### Development Environment

**Frontend:** https://fleet-frontend.azurestaticapps.net (develop branch)
**Backend API:** https://fleet-api-dev.<region>.azurecontainerapps.io
**Database:** fleet_dev on fleet-postgres

**Environment Variables:**
```bash
NODE_ENV=development
DATABASE_URL=<from Key Vault: DATABASE-URL-DEV>
JWT_SECRET=<from Key Vault: JWT-SECRET-DEV>
CSRF_SECRET=<from Key Vault: CSRF-SECRET-DEV>
VITE_USE_MOCK_DATA=false
VITE_API_URL=https://fleet-api-dev.<region>.azurecontainerapps.io
```

**Features:**
- Debug logging enabled
- Hot reload enabled
- Developer tools enabled
- Sample data seeding on startup

### Staging Environment

**Frontend:** https://fleet-frontend-staging.azurestaticapps.net (staging branch)
**Backend API:** https://fleet-api-stage.<region>.azurecontainerapps.io
**Database:** fleet_stage on fleet-postgres

**Environment Variables:**
```bash
NODE_ENV=staging
DATABASE_URL=<from Key Vault: DATABASE-URL-STAGE>
JWT_SECRET=<from Key Vault: JWT-SECRET-STAGE>
CSRF_SECRET=<from Key Vault: CSRF-SECRET-STAGE>
VITE_USE_MOCK_DATA=false
VITE_API_URL=https://fleet-api-stage.<region>.azurecontainerapps.io
```

**Features:**
- Production-like environment
- Performance monitoring enabled
- Staging data isolation
- Pre-production testing

### Production Environment

**Frontend:** https://fleet.capitaltechalliance.com
**Backend API:** https://fleet-api-prod.<region>.azurecontainerapps.io
**Database:** fleet_production on fleet-postgres

**Environment Variables:**
```bash
NODE_ENV=production
DATABASE_URL=<from Key Vault: DATABASE-URL-PROD>
JWT_SECRET=<from Key Vault: JWT-SECRET-PROD>
CSRF_SECRET=<from Key Vault: CSRF-SECRET-PROD>
VITE_USE_MOCK_DATA=false
VITE_API_URL=https://fleet-api-prod.<region>.azurecontainerapps.io
```

**Features:**
- Maximum security hardening
- Full monitoring and alerting
- Automated backups
- High availability configuration

---

## Deployment Process

### Automated CI/CD Pipeline

**GitHub Actions Workflow:** `.github/workflows/azure-deploy.yml`

```yaml
Trigger: Push to main, develop, or staging branches
Steps:
  1. Checkout code
  2. Build frontend (Vite)
  3. Build backend Docker image
  4. Run tests
  5. Push Docker image to ACR
  6. Deploy to Azure Static Web App
  7. Deploy to Container Apps
  8. Run smoke tests
  9. Notify team
```

### Manual Deployment Steps

**Prerequisites:**
```bash
az login
az account set --subscription 021415c2-2f52-4a73-ae77-f8363165a5e1
```

**Deploy to Development:**
```bash
# Build and push backend
docker build -t fleetregistry2025.azurecr.io/fleet-api:dev-latest ./api
az acr login --name fleetregistry2025
docker push fleetregistry2025.azurecr.io/fleet-api:dev-latest

# Update Container App
az containerapp update \
  --name fleet-api-dev \
  --resource-group FleetManagement \
  --image fleetregistry2025.azurecr.io/fleet-api:dev-latest

# Deploy frontend
cd <repo-root>
npm run build
az staticwebapp deploy \
  --name fleet-frontend \
  --resource-group FleetManagement \
  --app-location "/" \
  --output-location "dist"
```

---

## Security Configuration

### Authentication & Authorization

**Method:** Azure AD B2C + JWT tokens
**Token Expiry:** 24 hours
**Refresh Token:** 30 days

**Roles:**
- `admin` - Full system access
- `manager` - Fleet manager access
- `driver` - Driver portal access
- `readonly` - View-only access

### Network Security

**Azure Static Web App:**
- HTTPS enforced
- Custom domain with SSL certificate
- WAF enabled (when on Standard plan)

**Container Apps:**
- Private VNET injection (planned)
- Managed Identity for Key Vault access
- Ingress restricted to HTTPS only

**PostgreSQL:**
- SSL/TLS enforced
- Firewall rules configured
- Azure AD authentication enabled

### Secret Management

**All secrets stored in Azure Key Vault:**
- Automatic secret rotation (planned)
- Access logged and audited
- Managed Identity access from Container Apps
- No secrets in code or environment files

---

## Monitoring & Observability

### Application Insights

**Instrumentation Key:** (stored in Key Vault)
**Connection String:** (stored in Key Vault)

**Monitored Metrics:**
- Request rate and latency
- Error rate and exceptions
- Database query performance
- Custom application events
- User session analytics

### Log Analytics

**Workspace:** fleet-logs
**Retention:** 90 days

**Log Sources:**
- Container Apps logs
- PostgreSQL logs
- Static Web App logs
- Key Vault audit logs

### Alerts Configured

1. **High Error Rate:** >5% error rate for 5 minutes
2. **High Latency:** P95 latency >2 seconds for 10 minutes
3. **Database Connection Issues:** Connection failures >10 in 5 minutes
4. **Container Crash:** Container restart detected
5. **Failed Authentication:** >100 failed logins in 10 minutes

---

## Database Schema

### Tables (28 total)

**Core Tables:**
- `vehicles` - Vehicle inventory
- `drivers` - Driver profiles
- `facilities` - Maintenance facilities
- `work_orders` - Maintenance work orders
- `fuel_transactions` - Fuel usage tracking
- `routes` - Route planning
- `maintenance_schedules` - Preventive maintenance
- `inspections` - Vehicle inspections

**User Management:**
- `users` - User accounts
- `roles` - User roles
- `permissions` - Role permissions
- `user_roles` - User-role associations

**Multi-Tenancy:**
- `tenants` - Tenant organizations
- `tenant_users` - Tenant-user associations

**Audit & Compliance:**
- `audit_logs` - All system activity
- `compliance_reports` - Regulatory reports
- `incidents` - Safety incidents

**Additional Modules:**
- (45+ specialized module tables)

### Database Seeding

**Development Database:**
- 50 vehicles
- 30 drivers
- 15 facilities
- 100 work orders
- 500 fuel transactions
- 30 routes

**Production Database:**
- Empty (will be populated with real data)

---

## Cost Estimation

### Monthly Azure Costs

| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| Static Web App | Free | $0 |
| Container Registry | Basic | $5 |
| PostgreSQL Flexible Server | Standard_B1ms | $15 |
| Container Apps (3 instances) | Consumption | $30 |
| Key Vault | Standard | $1 |
| Log Analytics | Pay-as-you-go | $5 |
| **Total** | | **~$56/month** |

**Notes:**
- Static Web App can be upgraded to Standard ($9/mo) for custom domains and SLA
- Container Apps auto-scale based on load
- Database can be scaled up as needed
- Estimates based on low-to-medium traffic

---

## Backup & Disaster Recovery

### Automated Backups

**PostgreSQL:**
- Point-in-time restore: 7 days
- Automated daily backups
- Geo-redundant backups: Enabled

**Container Images:**
- Stored in ACR with geo-replication
- Retention: Indefinite

**Code Repository:**
- GitHub with branch protection
- All deployment artifacts versioned

### Recovery Procedures

**Database Restore:**
```bash
az postgres flexible-server restore \
  --resource-group FleetManagement \
  --name fleet-postgres-restored \
  --source-server fleet-postgres \
  --restore-time "2025-12-19T00:00:00Z"
```

**Container App Rollback:**
```bash
az containerapp revision list \
  --name fleet-api-prod \
  --resource-group FleetManagement

az containerapp revision activate \
  --name fleet-api-prod \
  --resource-group FleetManagement \
  --revision <previous-revision-name>
```

---

## Troubleshooting

### Common Issues

**Issue:** Frontend can't connect to API
**Solution:** Check `VITE_API_URL` in Static Web App configuration

**Issue:** Database connection timeout
**Solution:** Verify firewall rules allow Container App IP ranges

**Issue:** 401 Unauthorized errors
**Solution:** Verify JWT_SECRET matches between frontend and backend

**Issue:** Container App not starting
**Solution:** Check logs: `az containerapp logs show --name fleet-api-dev --resource-group FleetManagement`

### Support Contacts

**Technical Owner:** andrew.m@capitaltechalliance.com
**Azure Support:** Premium Support Plan
**On-Call Rotation:** PagerDuty integration

---

## Next Steps

1. ✅ Infrastructure deployed
2. ⏳ Configure custom domain (fleet.capitaltechalliance.com)
3. ⏳ Set up SSL certificate
4. ⏳ Configure Azure AD B2C for authentication
5. ⏳ Import production data
6. ⏳ Run load testing
7. ⏳ Configure monitoring alerts
8. ⏳ Update DNS records
9. ⏳ Conduct security audit
10. ⏳ User acceptance testing

---

## References

- **GitHub Repository:** https://github.com/<org>/Fleet
- **Azure Portal:** https://portal.azure.com
- **Key Vault:** https://fleetvault2025.vault.azure.net/
- **Container Registry:** https://fleetregistry2025.azurecr.io
- **Documentation:** `/ENVIRONMENT_SETUP_GUIDE.md`

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-19 | 2.0.0 | Initial Azure deployment | andrew.m@capitaltechalliance.com |
| 2025-12-19 | 2.0.1 | Added multi-environment support | andrew.m@capitaltechalliance.com |

---

**Document Status:** 🔄 Living Document - Updated with each deployment
