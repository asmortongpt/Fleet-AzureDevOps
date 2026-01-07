# Fleet Management System - Deployment Setup Guide

**Date**: January 3, 2026
**Azure VM**: fleet-build-test-vm (172.173.175.71)
**Status**: GitHub Actions workflow ready, awaiting secrets configuration

---

## Current Status

### ✅ Completed
- Comprehensive testing complete (5 agents, 7,500+ lines documentation)
- Application running locally (frontend + backend + database)
- Azure deployment automation created:
  - `deploy-azure-vm.sh` (348 lines)
  - `ecosystem.config.js` (PM2 configuration)
  - `nginx/fleet.conf` (reverse proxy with security)
  - `.github/workflows/deploy-azure-vm.yml` (CI/CD pipeline)
- All code committed and pushed to GitHub

### ⚠️ Blocking Deployment
- **GitHub Secrets not configured** - Workflow failing immediately
- **SSH access needs setup** - No SSH key configured for VM access
- **Policy Engine security vulnerabilities** - Should be disabled for staging

---

## Azure VM Information

**VM Details**:
- **Name**: fleet-build-test-vm
- **Resource Group**: FLEET-AI-AGENTS
- **Location**: East US
- **Size**: Standard_D4s_v3 (4 vCPUs, 16GB RAM)
- **OS**: Linux (Ubuntu 22.04)
- **Public IP**: 172.173.175.71
- **Private IP**: 10.0.0.5
- **Status**: Running

**Default User**: azureuser

---

## Step 1: Configure SSH Access to Azure VM

### Option A: Generate New SSH Key (Recommended)

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "fleet-deployment@github-actions" -f ~/.ssh/fleet-azure-vm

# Add public key to Azure VM
az vm user update \
  --resource-group FLEET-AI-AGENTS \
  --name fleet-build-test-vm \
  --username azureuser \
  --ssh-key-value "$(cat ~/.ssh/fleet-azure-vm.pub)"

# Test SSH connection
ssh -i ~/.ssh/fleet-azure-vm azureuser@172.173.175.71

# If successful, copy private key for GitHub Secrets
cat ~/.ssh/fleet-azure-vm
# Copy the entire output (including BEGIN/END lines)
```

### Option B: Use Existing SSH Key

```bash
# If you already have SSH access, use your existing key
cat ~/.ssh/id_rsa
# Copy the entire output for GitHub Secrets
```

---

## Step 2: Configure GitHub Secrets

### Required Secrets

Navigate to: https://github.com/asmortongpt/Fleet/settings/secrets/actions

Create the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_VM_SSH_KEY` | (SSH private key from Step 1) | Private key for SSH authentication |
| `AZURE_VM_HOST` | `172.173.175.71` | Azure VM public IP address |
| `AZURE_VM_USER` | `azureuser` | SSH username for Azure VM |
| `FRONTEND_URL` | `http://172.173.175.71:3000` | Frontend application URL |
| `API_URL` | `http://172.173.175.71:3001` | Backend API URL |
| `SLACK_WEBHOOK` | (Optional) | Slack webhook for deployment notifications |

### How to Add Secrets

```bash
# Using GitHub CLI
gh secret set AZURE_VM_SSH_KEY < ~/.ssh/fleet-azure-vm
gh secret set AZURE_VM_HOST --body "172.173.175.71"
gh secret set AZURE_VM_USER --body "azureuser"
gh secret set FRONTEND_URL --body "http://172.173.175.71:3000"
gh secret set API_URL --body "http://172.173.175.71:3001/api"
```

Or manually via GitHub web interface:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"

---

## Step 3: Prepare Azure VM Environment

### Initial VM Setup

```bash
# SSH into the VM
ssh -i ~/.ssh/fleet-azure-vm azureuser@172.173.175.71

# Install required software
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx postgresql postgresql-contrib git

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /opt/fleet-management
sudo chown azureuser:azureuser /opt/fleet-management

# Create backup directory
sudo mkdir -p /opt/fleet-management-backups
sudo chown azureuser:azureuser /opt/fleet-management-backups

# Clone repository (if not already done)
cd /opt/fleet-management
git clone https://github.com/asmortongpt/Fleet.git .

# Set up environment variables
cp .env.example .env
nano .env  # Update with production values
```

### Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql <<'PSQL'
CREATE DATABASE fleet_db;
CREATE USER fleetuser WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE fleet_db TO fleetuser;
\q
PSQL

# Run migrations
cd /opt/fleet-management/api
npm install
npm run migrate
```

### Nginx Configuration

```bash
# Copy Fleet nginx configuration
sudo cp /opt/fleet-management/nginx/fleet.conf /etc/nginx/sites-available/fleet-management
sudo ln -s /etc/nginx/sites-available/fleet-management /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 4: Disable Policy Engine (Security Requirement)

**CRITICAL**: The Policy Engine has 4 CRITICAL security vulnerabilities and must be disabled.

### Update API Server

Edit `/opt/fleet-management/api/src/server-simple.ts`:

```typescript
// Comment out Policy Engine routes
// app.use('/api/policy-engine', policyEngineRoutes)  // DISABLED: Security vulnerabilities

// Add health check to verify it's disabled
app.get('/api/policy-engine-status', (req, res) => {
  res.status(503).json({
    status: 'disabled',
    reason: 'Security vulnerabilities under remediation',
    message: 'Policy Engine will be re-enabled after security fixes (Est: 83 hours)'
  })
})
```

---

## Step 5: Deploy via GitHub Actions

### Automatic Deployment (Recommended)

The deployment workflow automatically triggers on push to main:

```bash
# From your local machine
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Make a change and commit (or just re-trigger)
git commit --allow-empty -m "chore: trigger deployment"
git push origin main

# Monitor deployment
gh run watch
```

### Manual Deployment

Alternatively, trigger deployment manually:

```bash
# Via GitHub CLI
gh workflow run "Deploy to Azure VM" --field environment=staging

# Via GitHub web interface
# Go to Actions → Deploy to Azure VM → Run workflow
```

---

## Step 6: Verify Deployment

### Automated Verification

The GitHub Actions workflow includes:
- Health checks (24+ validation points)
- Smoke tests (API + Frontend)
- PM2 process verification
- Nginx configuration test

### Manual Verification

```bash
# Check application health
curl http://172.173.175.71:3001/api/health

# Check frontend
curl http://172.173.175.71:3000

# SSH into VM and check services
ssh -i ~/.ssh/fleet-azure-vm azureuser@172.173.175.71

# On VM:
pm2 list                          # Check PM2 processes
pm2 logs                          # View application logs
sudo systemctl status nginx       # Check Nginx status
sudo systemctl status postgresql  # Check database status

# Run health check script
bash /opt/fleet-management/scripts/health-check.sh
```

---

## Troubleshooting

### Deployment Fails at SSH Step

**Issue**: "Permission denied (publickey)"

**Solution**:
```bash
# Verify SSH key is correct
cat ~/.ssh/fleet-azure-vm.pub

# Re-add to Azure VM
az vm user update \
  --resource-group FLEET-AI-AGENTS \
  --name fleet-build-test-vm \
  --username azureuser \
  --ssh-key-value "$(cat ~/.ssh/fleet-azure-vm.pub)"
```

### Application Not Responding

**Issue**: PM2 processes not running

**Solution**:
```bash
ssh -i ~/.ssh/fleet-azure-vm azureuser@172.173.175.71
cd /opt/fleet-management
pm2 resurrect  # Restore PM2 processes
pm2 restart all
```

### Database Connection Errors

**Issue**: "ECONNREFUSED" or "password authentication failed"

**Solution**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify .env file has correct credentials
cat /opt/fleet-management/api/.env | grep DB_

# Test connection
psql -h localhost -U fleetuser -d fleet_db
```

---

## Next Steps After Successful Deployment

### 1. Address Critical Security Issues (83 hours)
- Fix Policy Engine SQL injection
- Add authentication middleware
- Implement CSRF protection
- Sanitize XSS vulnerabilities

### 2. Accessibility Improvements (120 hours)
- Run automated keyboard fixer
- Add ARIA labels
- Implement focus traps
- Screen reader support

### 3. Performance Optimization (40 hours)
- Lazy load Three.js and visualizations
- Implement request batching
- Add memoization
- Database query optimization

---

## Quick Reference Commands

```bash
# Deploy
git push origin main

# Check deployment status
gh run list --workflow="Deploy to Azure VM" --limit 1

# SSH to VM
ssh -i ~/.ssh/fleet-azure-vm azureuser@172.173.175.71

# Restart application
ssh azureuser@172.173.175.71 "pm2 restart all"

# View logs
ssh azureuser@172.173.175.71 "pm2 logs --lines 50"

# Run health check
ssh azureuser@172.173.175.71 "bash /opt/fleet-management/scripts/health-check.sh"
```

---

**Ready for Deployment**: Once GitHub Secrets are configured (Step 2)

**Estimated Setup Time**: 2-3 hours (including SSH setup, VM prep, and first deployment)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
