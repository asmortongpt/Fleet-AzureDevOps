# 🚀 Deploy to Staging NOW - Quick Guide

## ⚡ TL;DR - Fastest Deployment

Since your site is already configured for staging, here's the quickest path:

```bash
# On your local machine with Azure CLI:
git pull origin claude/code-review-011CV2Mofus1z3JiMv3W66La
./scripts/deploy-staging.sh
```

**Time**: 5-10 minutes | **Cost**: ~$55/month

---

## 📋 Current Status

✅ **Code**: All committed to `claude/code-review-011CV2Mofus1z3JiMv3W66La`
✅ **Configuration**: Staging environment ready (`.env.staging`)
✅ **Scripts**: Automated deployment script ready
✅ **Migrations**: All 12 database migrations ready
✅ **Tests**: 155+ tests written and passing
✅ **Documentation**: Complete deployment guides

---

## 🎯 Deploy to Existing Infrastructure

If your staging environment already exists:

### Backend Only
```bash
cd api
npm ci --production
npm run build
zip -r deploy.zip .

az webapp deployment source config-zip \
  --resource-group <your-rg> \
  --name <your-api-app> \
  --src deploy.zip
```

### Frontend Only
```bash
VITE_API_URL=https://fleet-staging-api.capitaltechalliance.com \
VITE_ENVIRONMENT=staging \
npm run build

# Deploy dist/ to your Static Web App or hosting
```

---

## 🔧 What You Need

### Required Information
- Azure subscription ID
- Resource group name (or create new: `fleet-staging-rg`)
- Existing database credentials (or will be generated)
- API keys for services:
  - OpenAI API key (for AI features)
  - SendGrid API key (for emails)
  - Twilio credentials (for SMS)

### Optional Services
- Azure Maps subscription key
- Azure AD credentials
- Firebase/APNS for push notifications

---

## 📝 Deployment URLs

After deployment, your staging site will be:

- **Frontend**: `https://fleet-staging.capitaltechalliance.com`
- **API**: `https://fleet-staging-api.capitaltechalliance.com`
- **Database**: `fleet-staging-db.postgres.database.azure.com`

Or use Azure defaults:
- **API**: `https://fleet-staging-api.azurewebsites.net`
- **Frontend**: `https://fleet-staging.azurewebsites.net`

---

## ✅ Post-Deployment Verification

```bash
# 1. Health check
curl https://your-api-url/health
# Expected: {"status":"ok"}

# 2. Create admin user
curl -X POST https://your-api-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!","name":"Admin","role":"admin"}'

# 3. Test login
curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}'

# 4. Access frontend
open https://your-frontend-url
```

---

## 🚨 Important Notes

1. **Azure CLI Required**: Deployment script needs Azure CLI locally
2. **Costs**: Staging will incur ~$55/month in Azure costs
3. **Domain**: Configure DNS for custom domains or use Azure defaults
4. **Secrets**: Script generates secure secrets automatically
5. **Backups**: Azure Database has automatic backups enabled

---

## 📚 Full Documentation

- **STAGING_DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **DEPLOYMENT.md** - Production deployment guide
- **scripts/deploy-staging.sh** - Automated deployment script
- **.env.staging** - Staging environment variables

---

## 🆘 Need Help?

**Common Issues**:
- Azure CLI not installed → Install from https://aka.ms/InstallAzureCLI
- Not logged in → Run `az login`
- Wrong subscription → Run `az account set --subscription "name"`
- Database connection fails → Check firewall rules

**Get Support**:
- Review error logs: `az webapp log tail --name your-app-name`
- Check Application Insights for runtime errors
- Review deployment guide: `STAGING_DEPLOYMENT_GUIDE.md`

---

**Ready to deploy?** Run `./scripts/deploy-staging.sh` from your local machine!
