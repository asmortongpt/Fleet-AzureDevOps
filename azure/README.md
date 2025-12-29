# Azure Production Deployment Guide

## Overview

This directory contains Infrastructure as Code (IaC) for deploying the Fleet Management System to Azure using Bicep templates.

## Prerequisites

- Azure CLI installed (`az`)
- Azure subscription with appropriate permissions
- GitHub repository configured
- Node.js 20 LTS or later

## Architecture

The deployment creates the following resources:

### Core Services
- **App Service Plan**: Premium v3 (P1v3) - 2 cores, 8GB RAM, Linux
- **Web App**: Node.js 20 LTS application
- **PostgreSQL Flexible Server**: Database with backups and geo-redundancy
- **Key Vault**: Secrets management with RBAC
- **Application Insights**: Monitoring and telemetry
- **Log Analytics**: Centralized logging
- **Storage Account**: Static assets and backups
- **CDN Profile**: Content delivery network

### Security Features
- System-assigned managed identity
- HTTPS only
- TLS 1.2 minimum
- Soft delete on Key Vault (90-day retention)
- Network ACLs on storage
- IP restrictions (configurable)

## Quick Start

### 1. Initial Setup

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Install/upgrade Bicep
az bicep install
az bicep upgrade
```

### 2. Configure Parameters

Edit `parameters-production.json`:

```json
{
  "adminEmail": { "value": "your-email@domain.com" },
  "dbAdminUsername": { "value": "your-db-admin" }
}
```

**Important**: Store sensitive values in Azure Key Vault:

```bash
# Create a temporary Key Vault for parameters
az keyvault create \
  --name "fleet-deploy-kv" \
  --resource-group "fleet-deploy-rg" \
  --location "eastus"

# Store database password
az keyvault secret set \
  --vault-name "fleet-deploy-kv" \
  --name "db-admin-password" \
  --value "YOUR_STRONG_PASSWORD"
```

Update `parameters-production.json` with Key Vault reference.

### 3. Deploy Infrastructure

```bash
cd azure/
./deploy.sh production eastus
```

This will:
1. ✅ Validate prerequisites
2. ✅ Create resource group
3. ✅ Validate Bicep template
4. ✅ Deploy infrastructure
5. ✅ Configure Key Vault access
6. ✅ Generate publish profile
7. ✅ Output connection strings

### 4. Post-Deployment

After infrastructure deployment:

```bash
# 1. Run database migrations
npm run migrate:deploy

# 2. Deploy application code
# Via GitHub Actions (recommended)
git push origin main

# OR manual publish
cd ..
npm run build
az webapp deploy \
  --resource-group fleet-production-rg \
  --name fleet-production-app \
  --src-path dist.zip \
  --type zip
```

## Environment Configuration

The deployment script generates `.env.production` with outputs:

```env
WEB_APP_URL=https://fleet-production-app.azurewebsites.net
CDN_URL=https://fleet-production-cdn-endpoint.azureedge.net
DATABASE_URL=postgresql://user:pass@server/db?sslmode=require
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
KEY_VAULT_URL=https://fleet-production-kv.vault.azure.net/
```

## GitHub Actions CI/CD

### Setup

1. Get publish profile:
   ```bash
   az webapp deployment list-publishing-profiles \
     --name fleet-production-app \
     --resource-group fleet-production-rg \
     --xml
   ```

2. Add as GitHub secret `AZURE_WEBAPP_PUBLISH_PROFILE`

3. Workflow auto-deploys on push to `main`:
   - Builds application
   - Runs tests
   - Deploys to Azure App Service

## Monitoring & Alerts

### Application Insights

Dashboard: https://portal.azure.com → Application Insights → fleet-production-ai

**Key Metrics**:
- Request rate and response time
- Failed request percentage
- Server response time
- Dependency call duration
- Exception rate

### Log Analytics

Query logs:
```kusto
AppRequests
| where TimeGenerated > ago(1h)
| summarize Count=count() by ResultCode
| render piechart
```

### Recommended Alerts

```bash
# High error rate alert
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group fleet-production-rg \
  --scopes "/subscriptions/.../fleet-production-app" \
  --condition "avg Failed Requests > 10" \
  --window-size 5m \
  --evaluation-frequency 1m
```

## Database Management

### Backup

Automatic backups configured:
- Retention: 35 days
- Geo-redundant: Enabled
- Point-in-time restore available

### Manual Backup

```bash
az postgres flexible-server backup create \
  --resource-group fleet-production-rg \
  --name fleet-production-db \
  --backup-name "manual-$(date +%Y%m%d)"
```

### Restore

```bash
az postgres flexible-server restore \
  --resource-group fleet-production-rg \
  --name fleet-production-db-restored \
  --source-server fleet-production-db \
  --restore-time "2025-01-15T10:00:00Z"
```

## Scaling

### Vertical Scaling (Upgrade SKU)

```bash
# Upgrade to P2v3 (4 cores, 16GB)
az appservice plan update \
  --name fleet-production-asp \
  --resource-group fleet-production-rg \
  --sku P2v3
```

### Horizontal Scaling (Add Instances)

```bash
az appservice plan update \
  --name fleet-production-asp \
  --resource-group fleet-production-rg \
  --number-of-workers 3
```

### Auto-scaling

```bash
az monitor autoscale create \
  --resource-group fleet-production-rg \
  --resource fleet-production-asp \
  --resource-type "Microsoft.Web/serverfarms" \
  --name "AutoScale-Fleet" \
  --min-count 1 \
  --max-count 10 \
  --count 2

az monitor autoscale rule create \
  --resource-group fleet-production-rg \
  --autoscale-name "AutoScale-Fleet" \
  --condition "Percentage CPU > 70 avg 10m" \
  --scale out 1
```

## Disaster Recovery

### Regional Failover

1. Deploy to secondary region:
   ```bash
   ./deploy.sh production westus2
   ```

2. Configure Traffic Manager:
   ```bash
   az network traffic-manager profile create \
     --name fleet-global \
     --resource-group fleet-production-rg \
     --routing-method Performance
   ```

3. Add endpoints for both regions

### Data Recovery

- Database: Geo-redundant backups
- Storage: LRS (consider upgrading to GRS)
- Key Vault: Soft delete enabled (90 days)

## Cost Optimization

### Current Monthly Estimate

| Resource | SKU | Est. Cost/Month |
|----------|-----|-----------------|
| App Service Plan | P1v3 | ~$146 |
| PostgreSQL | Standard_B2s | ~$50 |
| Application Insights | Pay-as-you-go | ~$20 |
| Storage Account | Standard LRS | ~$5 |
| CDN | Standard Microsoft | ~$10 |
| **Total** | | **~$231** |

### Optimization Tips

1. **Use Reserved Instances** (1-3 year commitment): Save up to 72%
2. **Dev/Test Pricing**: Use for non-production environments
3. **Auto-shutdown**: Configure for dev environments
4. **Right-size**: Start with B-series for staging

## Security Checklist

- [ ] Enable Azure Defender for App Service
- [ ] Configure custom domain with SSL
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable managed identity for all services
- [ ] Configure IP restrictions for admin endpoints
- [ ] Set up Azure AD authentication
- [ ] Enable diagnostic logging
- [ ] Configure backup retention policies
- [ ] Set up Azure Key Vault firewall
- [ ] Enable soft delete on all resources

## Troubleshooting

### Deployment Fails

```bash
# Check deployment status
az deployment group show \
  --name YOUR_DEPLOYMENT_NAME \
  --resource-group fleet-production-rg

# View logs
az webapp log tail \
  --name fleet-production-app \
  --resource-group fleet-production-rg
```

### App Won't Start

1. Check Application Insights logs
2. Verify environment variables
3. Check database connection
4. Review startup logs in Kudu console

### Database Connection Issues

```bash
# Test connectivity
psql -h fleet-production-db.postgres.database.azure.com \
     -U fleetadmin \
     -d fleetdb \
     --set=sslmode=require
```

## Cleanup

**Warning**: This will delete all resources!

```bash
az group delete \
  --name fleet-production-rg \
  --yes \
  --no-wait
```

## Support

- Azure Documentation: https://docs.microsoft.com/azure
- Fleet Management System: [Your repo URL]
- Azure Support: https://azure.microsoft.com/support

## License

[Your License]

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
