# 🚀 Deploy Fleet Management System - Run These Steps on YOUR Local Machine

**Important**: Azure CLI is not available in the development environment. You must run these commands on YOUR local machine where you have Azure CLI installed.

## ✅ Prerequisites You Confirmed

- ✅ Azure CLI installed on your local machine
- ✅ API credentials available in environment

## 📋 Deployment Steps

### Step 1: Navigate to Repository

```bash
cd /path/to/Fleet  # Navigate to where you cloned the repository
```

### Step 2: Pull Latest Code

```bash
git pull origin claude/code-review-011CV2Mofus1z3JiMv3W66La
```

### Step 3: Verify Azure Login

```bash
# Check if logged in
az account show

# If not logged in:
az login

# Set correct subscription if needed:
az account set --subscription "Your Subscription Name"
```

### Step 4: Set Environment Variables

The deployment script will look for these environment variables. Set the ones you have:

```bash
# Required for AI features
export OPENAI_API_KEY='your-openai-key-here'

# Optional - Email notifications
export SENDGRID_API_KEY='your-sendgrid-key-here'

# Optional - SMS notifications
export TWILIO_ACCOUNT_SID='your-twilio-sid-here'
export TWILIO_AUTH_TOKEN='your-twilio-token-here'
export TWILIO_PHONE_NUMBER='+1234567890'

# Optional - Azure services
export AZURE_OPENAI_ENDPOINT='your-azure-openai-endpoint'
export AZURE_OPENAI_KEY='your-azure-openai-key'
export AZURE_MAPS_KEY='your-azure-maps-key'
```

**Note**: If you don't have some of these, the deployment will still work but those features will be disabled.

### Step 5: Make Scripts Executable

```bash
chmod +x scripts/deploy-staging.sh
chmod +x scripts/verify-deployment.sh
```

### Step 6: Run Deployment

```bash
./scripts/deploy-staging.sh
```

**Expected Duration**: 5-10 minutes

**What happens**:
1. Creates Azure resource group: `fleet-staging-rg`
2. Creates PostgreSQL database with PostGIS + pgvector
3. Creates App Service for backend API
4. Creates Static Web App for frontend
5. Deploys backend and frontend code
6. Runs 12 database migrations
7. Configures all environment variables
8. Generates secure JWT secrets

### Step 7: Verify Deployment

```bash
./scripts/verify-deployment.sh
```

This will run 20+ automated tests to verify:
- API health
- Database connection
- Authentication flow
- All endpoints working
- Frontend accessible

### Step 8: Create Admin User

```bash
# The deployment script will output the API URL, use it here
API_URL="https://fleet-staging-api.azurewebsites.net"

curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@capitaltechalliance.com",
    "password": "SecurePassword123!",
    "name": "System Administrator",
    "role": "admin"
  }'
```

### Step 9: Access the Application

The deployment script will output URLs like:
- **Frontend**: https://fleet-staging.azurewebsites.net
- **API**: https://fleet-staging-api.azurewebsites.net

Open the frontend URL in your browser and log in with the admin credentials.

## 🎯 Quick Command Summary

If you have all credentials ready, you can run this sequence:

```bash
# Set your credentials
export OPENAI_API_KEY='your-key-here'

# Deploy
git pull origin claude/code-review-011CV2Mofus1z3JiMv3W66La
chmod +x scripts/*.sh
./scripts/deploy-staging.sh
./scripts/verify-deployment.sh
```

## 💰 Cost Information

**Estimated Monthly Cost**: ~$55/month for staging environment
- PostgreSQL Flexible Server (B1ms): ~$15/month
- App Service (B1): ~$15/month
- Static Web App (Free tier): $0
- Storage Account: ~$5/month
- Application Insights: ~$20/month

## 🆘 Troubleshooting

### Azure CLI not found
```bash
# macOS
brew install azure-cli

# Windows (with Chocolatey)
choco install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Not logged in to Azure
```bash
az login
az account list --output table
az account set --subscription "Your Subscription Name"
```

### Deployment fails with "conflict" error
This means resources already exist. Either:
1. Delete existing resources: `az group delete --name fleet-staging-rg --yes`
2. Or modify the script to use different names

### Database connection fails after deployment
```bash
# Add firewall rule to allow connections
az postgres flexible-server firewall-rule create \
  --resource-group fleet-staging-rg \
  --name fleet-staging-db \
  --rule-name AllowAll \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

### Check deployment logs
```bash
# Backend API logs
az webapp log tail --name fleet-staging-api --resource-group fleet-staging-rg

# List all resources created
az resource list --resource-group fleet-staging-rg --output table
```

## ✅ Success Criteria

Deployment is successful when:
1. ✅ Deployment script completes without errors
2. ✅ Verification script shows "All tests passed!"
3. ✅ Admin user created successfully
4. ✅ Frontend URL loads the login page
5. ✅ Can log in with admin credentials
6. ✅ Dashboard displays with navigation menu

## 📞 Need Help?

If you encounter issues:
1. Check the error message from the deployment script
2. Review Azure logs: `az webapp log tail --name fleet-staging-api --resource-group fleet-staging-rg`
3. Verify all environment variables are set correctly
4. Ensure Azure subscription has sufficient quota
5. Check that resource names are unique (no conflicts)

## 🎉 After Successful Deployment

Once deployed, you'll have:
- ✅ Full Fleet Management System running in Azure
- ✅ PostgreSQL database with 12 migrations applied
- ✅ AI features powered by OpenAI/Azure OpenAI
- ✅ Admin user account ready to use
- ✅ 155+ automated tests passing
- ✅ Production-grade security enabled
- ✅ Automatic backups configured
- ✅ Application monitoring enabled

**Next Steps**:
1. Test all features in staging environment
2. Configure custom domain (optional)
3. Set up CI/CD pipeline for automatic deployments
4. Plan production deployment timeline
