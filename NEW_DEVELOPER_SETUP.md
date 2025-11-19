# New Developer Setup Guide

**To:** Himanshu@capitaltechalliance.com
**From:** Fleet Management System DevOps Team
**Date:** 2025-11-12
**Version:** 1.0.0
**Purpose:** Complete onboarding and remaining tasks checklist

---

## 👋 Welcome to Fleet Management System, Himanshu!

We're excited to have you join the team! This guide has been prepared specifically for your onboarding to the Fleet Management System project. It contains everything you need to get up and running, complete the critical pending deployment tasks, and start contributing to the codebase.

This comprehensive guide will walk you through all the steps needed to:
- Understand the project architecture and technology stack
- Complete critical security and deployment tasks
- Set up your local development environment
- Verify the production deployment
- Start contributing effectively

**Estimated Time:** 2-4 hours (depending on DNS propagation)

---

## 🎯 What You'll Accomplish

This guide will walk you through:
1. Setting up your development environment
2. Completing critical pending tasks
3. Verifying the production deployment
4. Understanding the codebase

**Estimated Time:** 2-4 hours (depending on DNS propagation)

---

## 📋 Quick Checklist

Use this to track your progress:

- [ ] **Step 1**: Read documentation (15 min)
- [ ] **Step 2**: Set GitHub secret (2 min) ⚠️ CRITICAL
- [ ] **Step 3**: Create & merge pull request (5 min)
- [ ] **Step 4**: Configure DNS (5 min + wait time)
- [ ] **Step 5**: Verify SSL certificate (2 min)
- [ ] **Step 6**: Update Azure AD (5 min)
- [ ] **Step 7**: Test deployment (10 min)
- [ ] **Step 8**: Set up local development (30 min)

---

## 📚 Step 1: Read Documentation (15 minutes)

Read these documents in order to understand the project:

### Must Read (in this order):
1. **README.md** (5 min) - Project overview and tech stack
2. **DEVOPS.md** (10 min - skim sections) - DevOps master reference
3. **docs/PROJECT_HANDOFF.md** (5 min) - Current production status

### Reference Documentation:
- `PROJECT_COMPLETION_SUMMARY.md` - What's been built
- `deployment/QUICK_START.md` - Quick deployment commands
- `deployment/AZURE_DEPLOYMENT_GUIDE.md` - Full Azure setup

---

## 🚨 Step 2: Set GitHub Repository Secret (2 minutes) - CRITICAL

**This MUST be done before merging the DevOps PR, or builds will fail!**

### Instructions:

1. **Go to GitHub Repository Settings**
   ```
   URL: https://github.com/asmortongpt/Fleet/settings/secrets/actions

   Or manually:
   - Go to https://github.com/asmortongpt/Fleet
   - Click "Settings" tab
   - Click "Secrets and variables" → "Actions"
   ```

2. **Click "New repository secret"**

3. **Enter the following**:
   ```
   Name: AZURE_MAPS_SUBSCRIPTION_KEY

   Value: YOUR_AZURE_MAPS_KEY_HERE  # Get from Azure Portal or Azure Key Vault
   ```

4. **Click "Add secret"**

### Verification:
- You should see `AZURE_MAPS_SUBSCRIPTION_KEY` in the secrets list
- The value will be hidden (shows as `***`)

### Why This Matters:
The recent security fix removed the hard-coded Azure Maps key from the Dockerfile. The CI/CD pipeline now expects this as a secret. Without it, Docker builds will fail with:
```
Error: VITE_AZURE_MAPS_SUBSCRIPTION_KEY is required
```

---

## 🔀 Step 3: Create & Merge Pull Request (5 minutes)

### Create the PR:

1. **Open the PR creation page**:
   ```
   URL: https://github.com/asmortongpt/Fleet/pull/new/claude/review-update-devops-011CV37Deet6x9pX5ZUrb1St
   ```

2. **Set the title**:
   ```
   DevOps Documentation Overhaul & Security Improvements
   ```

3. **Copy and paste this as the description**:

```markdown
# DevOps Documentation Overhaul & Security Improvements

## 🎯 Overview
Comprehensive review and update of all DevOps information, guides, and configurations.

## 🚨 CRITICAL: Security Fix
**Hard-coded Azure Maps subscription key removed from Dockerfile**
- Issue: API key was hard-coded in Dockerfile
- Fix: Converted to secure build argument
- Action Required: `AZURE_MAPS_SUBSCRIPTION_KEY` must be set in GitHub secrets ✅ DONE

## 📚 Documentation Updates

### NEW: DEVOPS.md (900+ lines)
- Complete architecture diagrams
- CI/CD pipeline documentation
- Deployment procedures (all environments)
- Monitoring and observability
- Security best practices
- Disaster recovery
- Troubleshooting guide

### Updated Documentation
- **README.md** - Complete rewrite with accurate project info
- **deployment/AZURE_DEPLOYMENT_GUIDE.md** - Fixed file paths
- **deployment/MULTI_ENVIRONMENT_GUIDE.md** - Fixed file paths
- **deployment/QUICK_START.md** - Fixed file paths
- **PROJECT_COMPLETION_SUMMARY.md** - Added DevOps update section
- **docs/PROJECT_HANDOFF.md** - Updated to v1.1.0

## ⚙️ Configuration Updates
- **package.json**: `spark-template` → `fleet-management-system`
- **Version**: `0.0.0` → `1.0.0`
- **All deployment guides**: Fixed hardcoded local paths

## 📋 Files Changed
- Modified: 9 files (security fix, documentation updates)
- Created: 1 file (DEVOPS.md)

## ✅ Pre-Merge Checklist
- [x] GitHub secret set (`AZURE_MAPS_SUBSCRIPTION_KEY`)
- [x] All documentation reviewed
- [x] Security fix verified
- [x] CI/CD workflow updated

## 🎉 Benefits
- ✅ Security: Removed hard-coded credentials
- ✅ Documentation: Comprehensive DevOps guide
- ✅ Portability: All paths now relative
- ✅ Accuracy: Project properly named and versioned
- ✅ Onboarding: Complete information for new developers

**Type**: Documentation + Security
**Breaking Changes**: None
**Deployment Impact**: None (GitHub secret must be set)
```

4. **Click "Create pull request"**

### Review the PR:

1. **Review the Files Changed tab**
   - Check that no secrets are visible in the code
   - Verify documentation changes look correct

2. **Approve and Merge**:
   - Click "Merge pull request"
   - Click "Confirm merge"
   - Delete the branch (optional but recommended)

### Verification:
```bash
# Verify merge was successful
git checkout main
git pull origin main

# You should see the new DEVOPS.md file
ls -la DEVOPS.md
```

---

## 🌐 Step 4: Configure DNS (5 minutes + propagation time)

**Note**: This may already be done. Check first:

```bash
# Check if DNS is already configured
nslookup fleet.capitaltechalliance.com

# If it returns 20.15.65.2, skip this step
```

### If DNS is NOT configured:

#### Option A: Using Cloudflare

1. Log into Cloudflare
2. Select domain: `capitaltechalliance.com`
3. Go to DNS → Records
4. Click "Add record"
5. Enter:
   ```
   Type: A
   Name: fleet
   IPv4 address: 20.15.65.2
   Proxy status: DNS only (gray cloud)
   TTL: Auto
   ```
6. Click "Save"

#### Option B: Using GoDaddy

1. Log into GoDaddy
2. Go to "My Products" → "DNS" for capitaltechalliance.com
3. Click "Add" under Records
4. Enter:
   ```
   Type: A
   Host: fleet
   Points to: 20.15.65.2
   TTL: 600 seconds (10 minutes)
   ```
5. Click "Save"

#### Option C: Using Azure DNS

```bash
# If the domain is managed in Azure DNS
az network dns record-set a add-record \
  --resource-group <your-dns-resource-group> \
  --zone-name capitaltechalliance.com \
  --record-set-name fleet \
  --ipv4-address 20.15.65.2
```

#### Option D: Other DNS Providers

General settings for any provider:
```
Record Type: A
Host/Name: fleet
Value/Points To: 20.15.65.2
TTL: 300-600 seconds
```

### Wait for DNS Propagation (15-60 minutes)

Check propagation status:

```bash
# Check local DNS
nslookup fleet.capitaltechalliance.com

# Check from multiple locations
# Visit: https://dnschecker.org/#A/fleet.capitaltechalliance.com
```

**Expected Result**:
```
Server:  dns.google
Address:  8.8.8.8

Name:    fleet.capitaltechalliance.com
Address:  20.15.65.2
```

### What to do while waiting:
- Continue with Step 6 (Azure AD update)
- Set up your local development environment (Step 8)
- Read more documentation

---

## 🔒 Step 5: Verify SSL Certificate (2 minutes)

**Do this AFTER DNS has propagated (Step 4 complete)**

### Check Certificate Status

```bash
# Connect to AKS cluster first
az aks get-credentials \
  --resource-group FleetManagement-RG \
  --name fleet-aks-cluster

# Check certificate status
kubectl get certificate -n fleet-management

# Expected output:
# NAME             READY   SECRET           AGE
# fleet-tls-cert   True    fleet-tls-cert   10m
```

### If Certificate is NOT Ready (READY: False)

```bash
# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=50

# Check certificate details
kubectl describe certificate fleet-tls-cert -n fleet-management

# Check for challenges
kubectl get challenges -n fleet-management
```

**Common Issues**:
- DNS not propagated yet → Wait longer
- HTTP-01 challenge failing → Check ingress configuration
- Rate limit reached → Wait 1 hour, Let's Encrypt has rate limits

### If Certificate Won't Issue After 1 Hour:

```bash
# Delete and recreate the certificate
kubectl delete certificate fleet-tls-cert -n fleet-management

# It will auto-recreate from the ingress
# Wait 5-10 minutes and check again
kubectl get certificate -n fleet-management
```

### Verify SSL in Browser:

```bash
# Open in browser
https://fleet.capitaltechalliance.com

# Or test with curl
curl -I https://fleet.capitaltechalliance.com
```

**Expected**: No SSL warnings, green padlock in browser

---

## 🔐 Step 6: Update Azure AD App Registration (5 minutes)

### Instructions:

1. **Log into Azure Portal**
   ```
   URL: https://portal.azure.com
   ```

2. **Navigate to Azure Active Directory**
   - Search for "Azure Active Directory" in top search bar
   - Click on "Azure Active Directory"

3. **Find App Registration**
   - Click "App registrations" in left menu
   - Click "All applications"
   - Search for app ID: `80fe6628-1dc4-41fe-894f-919b12ecc994`
   - Or search by name (look for "Fleet" or similar)

4. **Update Redirect URIs**
   - Click on the app registration
   - Click "Authentication" in left menu
   - Under "Redirect URIs", click "Add URI"
   - Add: `https://fleet.capitaltechalliance.com/auth/callback`
   - Click "Save"

5. **Verify Configuration**
   - You should now see the new redirect URI in the list
   - Old URIs (if any) can remain for backwards compatibility

### Why This Matters:
Azure AD authentication will fail without the correct redirect URI. Users will see:
```
AADSTS50011: The redirect URI specified in the request does not match
```

---

## ✅ Step 7: Test Production Deployment (10 minutes)

### Run the Verification Script

See `scripts/verify-deployment.sh` (created separately) or run these commands:

```bash
# 1. Test health endpoints
echo "Testing API health..."
curl https://fleet.capitaltechalliance.com/api/health

# Expected output:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-12T...",
#   "environment": "production",
#   "version": "1.0.0"
# }

# 2. Test frontend
echo "Testing frontend..."
curl -I https://fleet.capitaltechalliance.com

# Expected: HTTP/2 200

# 3. Test SSL
echo "Testing SSL certificate..."
curl -vI https://fleet.capitaltechalliance.com 2>&1 | grep "SSL certificate"

# Expected: No errors

# 4. Test database connection (from API pod)
echo "Testing database..."
kubectl exec -n fleet-management \
  $(kubectl get pod -n fleet-management -l app=fleet-api -o jsonpath='{.items[0].metadata.name}') \
  -- sh -c 'nc -zv fleet-postgres-service 5432'

# Expected: Connection to fleet-postgres-service 5432 port [tcp/postgresql] succeeded!

# 5. Test Redis connection
echo "Testing Redis..."
kubectl exec -n fleet-management \
  $(kubectl get pod -n fleet-management -l app=fleet-redis -o jsonpath='{.items[0].metadata.name}') \
  -- redis-cli ping

# Expected: PONG
```

### Manual Browser Testing

1. **Open the application**:
   ```
   https://fleet.capitaltechalliance.com
   ```

2. **Test Login**:
   - Email: `admin@demofleet.com`
   - Password: `Demo@123`

3. **Verify Core Features**:
   - [ ] Dashboard loads
   - [ ] Vehicle list displays
   - [ ] Map shows (Azure Maps integration working)
   - [ ] Navigation works
   - [ ] Can create a test work order

4. **Check Browser Console**:
   - Press F12
   - Look for errors in Console tab
   - Should see no critical errors

---

## 💻 Step 8: Set Up Local Development (30 minutes)

### Prerequisites

Install these on your machine:

```bash
# Check versions
node --version  # Should be 20.x
npm --version   # Should be 10.x
docker --version
git --version

# Install if needed:
# - Node.js 20 LTS: https://nodejs.org/
# - Docker Desktop: https://www.docker.com/products/docker-desktop/
# - Git: https://git-scm.com/
```

### Clone the Repository

```bash
# Clone the repo
git clone https://github.com/asmortongpt/Fleet.git
cd Fleet

# Verify you're on main branch with latest changes
git checkout main
git pull origin main
```

### Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd api
npm install
cd ..
```

### Set Up Environment Variables

```bash
# Copy example env files
cp .env.example .env
cp api/.env.example api/.env

# Edit .env with your values
# For local development, you can use:
# - VITE_API_URL=http://localhost:3000/api
# - VITE_AZURE_MAPS_SUBSCRIPTION_KEY=(get from production .env or GitHub secrets)

# Edit api/.env
# You'll need database connection details
# See DEVOPS.md for full configuration
```

### Start Development Servers

```bash
# Terminal 1: Start backend
cd api
npm run dev

# Should see:
# Server running on http://localhost:3000
# Database connected

# Terminal 2: Start frontend
npm run dev

# Should see:
# VITE v6.3.5  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### Verify Local Setup

1. **Open browser**: http://localhost:5173
2. **Test API**: http://localhost:3000/api/health
3. **Check hot reload**: Edit a file, see changes instantly

---

## 🔍 Step 9: Verify CI/CD Pipeline (5 minutes)

### Check GitHub Actions

1. **Go to Actions tab**:
   ```
   https://github.com/asmortongpt/Fleet/actions
   ```

2. **Look for recent workflow runs**:
   - Should see "CI/CD Pipeline" workflows
   - Recent ones should be green (✅)

3. **Test the pipeline**:
   ```bash
   # Make a small change to trigger CI/CD
   git checkout -b test-cicd
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: Verify CI/CD pipeline"
   git push origin test-cicd
   ```

4. **Watch the workflow run**:
   - Go to Actions tab
   - Click on the running workflow
   - Verify all jobs pass (especially "Build and push Frontend image")

5. **Clean up**:
   ```bash
   git checkout main
   git branch -D test-cicd
   ```

---

## 📋 Troubleshooting Guide

### Issue: DNS not resolving

**Symptoms**: `nslookup fleet.capitaltechalliance.com` returns NXDOMAIN

**Solutions**:
1. Wait longer (can take up to 48 hours, usually 15-60 min)
2. Clear your local DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns

   # Mac
   sudo dscacheutil -flushcache

   # Linux
   sudo systemd-resolve --flush-caches
   ```
3. Verify DNS record is correct in your DNS provider

---

### Issue: SSL Certificate not issuing

**Symptoms**: `kubectl get certificate` shows READY: False

**Solutions**:
1. Ensure DNS is fully propagated first
2. Check cert-manager logs:
   ```bash
   kubectl logs -n cert-manager -l app=cert-manager
   ```
3. Check the certificate description:
   ```bash
   kubectl describe certificate fleet-tls-cert -n fleet-management
   ```
4. Common fixes:
   ```bash
   # Delete and recreate
   kubectl delete certificate fleet-tls-cert -n fleet-management

   # Wait 5 minutes
   kubectl get certificate -n fleet-management
   ```

---

### Issue: Build failing in GitHub Actions

**Symptoms**: CI/CD pipeline fails with "VITE_AZURE_MAPS_SUBSCRIPTION_KEY is required"

**Solutions**:
1. Verify the secret is set in GitHub:
   - Go to Settings → Secrets → Actions
   - Should see `AZURE_MAPS_SUBSCRIPTION_KEY`
2. If missing, go back to Step 2
3. If present, try re-running the workflow

---

### Issue: Can't connect to Kubernetes cluster

**Symptoms**: `kubectl` commands fail with connection errors

**Solutions**:
```bash
# Re-authenticate with Azure
az login

# Get cluster credentials
az aks get-credentials \
  --resource-group FleetManagement-RG \
  --name fleet-aks-cluster \
  --overwrite-existing

# Verify connection
kubectl get nodes
```

---

### Issue: Local development server won't start

**Symptoms**: `npm run dev` fails

**Solutions**:
1. Check Node version: `node --version` (should be 20.x)
2. Clean install:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Check for port conflicts:
   ```bash
   # Check if port 5173 is in use
   lsof -i :5173  # Mac/Linux
   netstat -ano | findstr :5173  # Windows
   ```

---

## 📞 Getting Help

### Documentation References

- **DEVOPS.md** - Complete DevOps reference
- **docs/PROJECT_HANDOFF.md** - Production status and pending tasks
- **PROJECT_COMPLETION_SUMMARY.md** - What's been built
- **deployment/QUICK_START.md** - Quick commands reference

### Useful Commands

```bash
# View all pods
kubectl get pods -n fleet-management

# View pod logs
kubectl logs -f <pod-name> -n fleet-management

# Restart a deployment
kubectl rollout restart deployment/fleet-app -n fleet-management

# Check service status
kubectl get svc -n fleet-management

# Check ingress
kubectl get ingress -n fleet-management
```

### Common Kubernetes Commands

See `DEVOPS.md` section "Troubleshooting" for comprehensive commands.

---

## ✅ Final Checklist

Before you're done, verify:

- [ ] GitHub secret `AZURE_MAPS_SUBSCRIPTION_KEY` is set
- [ ] DevOps PR merged to main
- [ ] DNS configured and propagated
- [ ] SSL certificate issued (READY: True)
- [ ] Azure AD redirect URI updated
- [ ] Production site accessible at https://fleet.capitaltechalliance.com
- [ ] Can log in with demo credentials
- [ ] Local development environment working
- [ ] CI/CD pipeline passing

---

## 🎉 You're Done!

Congratulations! You've successfully:
- ✅ Onboarded to the Fleet Management System
- ✅ Completed all critical pending tasks
- ✅ Verified production deployment
- ✅ Set up your local development environment

### Next Steps:

1. **Familiarize yourself with the codebase**:
   - Explore the frontend (`src/` directory)
   - Explore the backend (`api/src/` directory)
   - Read the architecture docs

2. **Start contributing**:
   - Pick up a task from the backlog
   - Create a feature branch
   - Make changes
   - Submit a pull request

3. **Keep learning**:
   - Review `DEVOPS.md` for deployment procedures
   - Study the AI/ML components if working on those features
   - Understand the testing strategy (`TESTING.md`)

---

**Questions?** Reference the documentation or ask the team!

**Document Version**: 1.0.0
**Last Updated**: 2025-11-12
**Maintained By**: DevOps Team
