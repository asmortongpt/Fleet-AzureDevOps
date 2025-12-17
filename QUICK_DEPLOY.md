# Fleet Quick Deployment Guide

**Target:** https://fleet.capitaltechalliance.com  
**Status:** Infrastructure Ready ✅

## 🚀 One-Command Deployment

```bash
# Option 1: Full automated deployment via Azure DevOps
# (Requires Azure DevOps project setup - see below)
git push origin main

# Option 2: Manual deployment
./fetch-keyvault-secrets.sh && \
az acr login --name fleetacr && \
docker-compose -f docker-compose.production.yml build && \
docker-compose -f docker-compose.production.yml push
```

## 📋 Prerequisites Checklist

- [ ] Azure Container Registry created (`fleetacr.azurecr.io`) ✅
- [ ] Azure Key Vault configured (`fleet-secrets-0d326d71`) ✅
- [ ] All secrets stored in Key Vault ✅
- [ ] ACR credentials in Key Vault ✅
- [ ] GitHub repository synced ✅
- [ ] Azure DevOps Pipeline configured (`azure-pipelines.yml`) ✅
- [ ] DNS access to capitaltechalliance.com ⏳
- [ ] Azure DevOps project created ⏳

## 🌐 Custom Domain Setup

### Step 1: Run Setup Script
```bash
./setup-custom-domain.sh
```

### Step 2: Configure DNS
Add these records to capitaltechalliance.com DNS:

```
TXT Record:
Name: _dnsauth.fleet
Value: [From Azure Front Door validation output]

CNAME Record:
Name: fleet
Value: [From Azure Front Door endpoint - fleet-endpoint-*.z01.azurefd.net]
```

### Step 3: Validate & Associate
```bash
# After DNS propagation (5-15 minutes)
az afd custom-domain update \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --custom-domain-name fleet-custom-domain \
  --certificate-type ManagedCertificate

az afd route update \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --endpoint-name fleet-endpoint \
  --route-name default-route \
  --custom-domains fleet-custom-domain
```

## 🔧 Azure DevOps Setup (5 minutes)

### 1. Create Project
- Go to https://dev.azure.com/capitaltechalliance
- Create new project: "Fleet"
- Connect to GitHub: https://github.com/asmortongpt/Fleet

### 2. Create Variable Group
Name: `fleet-production-secrets`

Link to Key Vault:
```
Subscription: Azure-Production
Key Vault: fleet-secrets-0d326d71
Secrets: * (all)
```

### 3. Create Service Connection
- Type: Azure Resource Manager
- Name: Azure-Production
- Subscription ID: 021415c2-2f52-4a73-ae77-f8363165a5e1
- Resource Group: fleet-production-rg

### 4. Create Environments
- `fleet-staging` (no approval required)
- `fleet-production` (manual approval required)

### 5. Run Pipeline
- Pipeline will auto-detect `azure-pipelines.yml`
- Trigger: Push to `main` branch
- Or manually run from Pipelines UI

## 📊 Deployment Architecture

```
GitHub (main) 
  ↓ push
Azure DevOps Pipeline
  ↓ build
Azure Container Registry (fleetacr.azurecr.io)
  ↓ deploy
Azure Container Instances
  - PostgreSQL (fleet-postgres-prod)
  - Redis (fleet-redis-prod)
  - API (fleet-api-prod)
  - Frontend (fleet-frontend-prod)
  ↓ route through
Azure Front Door (CDN + SSL)
  ↓ accessible at
https://fleet.capitaltechalliance.com
```

## 🔐 Security Notes

- All secrets in Azure Key Vault
- ACR uses managed identity
- HTTPS enforced via Front Door
- JWT authentication on API
- CSRF protection enabled
- Input validation on all endpoints

## 📈 Monitoring

- **Application Insights:** Automatic telemetry
- **Prometheus:** http://fleet-production:9090
- **Grafana:** http://fleet-production:3001
- **Container Logs:** `az container logs --name fleet-api-prod --resource-group fleet-production-rg`

## 🆘 Troubleshooting

**Pipeline fails on build:**
```bash
# Check ACR credentials
az keyvault secret show --vault-name fleet-secrets-0d326d71 --name ACR-USERNAME
az acr login --name fleetacr
```

**Health checks fail:**
```bash
# Check API logs
az container logs --name fleet-api-prod --resource-group fleet-production-rg --tail 100
```

**Custom domain not working:**
```bash
# Check DNS propagation
dig fleet.capitaltechalliance.com
nslookup fleet.capitaltechalliance.com

# Check Front Door status
az afd custom-domain show --profile-name fleet-frontdoor --resource-group fleet-production-rg --custom-domain-name fleet-custom-domain
```

## ✅ Deployment Verification

```bash
# 1. Check ACR images
az acr repository list --name fleetacr

# 2. Check running containers
az container list --resource-group fleet-production-rg -o table

# 3. Test API health
curl https://fleet-api-prod.eastus2.azurecontainer.io:3000/api/health

# 4. Test frontend
curl https://fleet.capitaltechalliance.com
```

---

**See also:** DEPLOYMENT_STATUS.md for complete documentation

🤖 Generated with Claude Code  
Co-Authored-By: Claude <noreply@anthropic.com>
