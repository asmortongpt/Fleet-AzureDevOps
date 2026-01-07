# Azure VM Deployment Automation

Complete automation for deploying the Fleet Management System to Azure VMs with zero-downtime deployments, health monitoring, and automatic rollback.

## Overview

This deployment automation provides:

- **Automated Deployments**: Zero-downtime deployments with automatic rollback on failure
- **Process Management**: PM2-based clustering for high availability
- **Load Balancing**: Nginx reverse proxy with SSL/TLS termination
- **CI/CD Integration**: GitHub Actions workflow for continuous deployment
- **Health Monitoring**: Comprehensive health checks for system validation
- **Security**: Parameterized queries, rate limiting, and security headers

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Deployment Files](#deployment-files)
5. [Manual Deployment](#manual-deployment)
6. [Automated Deployment (GitHub Actions)](#automated-deployment-github-actions)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Troubleshooting](#troubleshooting)
10. [Security Configuration](#security-configuration)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Azure Load Balancer                 │
│                   (Optional - External)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Nginx (Port 443)                     │
│  - SSL/TLS Termination                                  │
│  - Rate Limiting                                        │
│  - Static File Serving                                  │
│  - Reverse Proxy                                        │
└─────────────┬───────────────────┬───────────────────────┘
              │                   │
      ┌───────▼────────┐  ┌──────▼──────┐
      │  Frontend (PM2) │  │   API (PM2)  │
      │  Port: 3000     │  │  Port: 3001  │
      │  Instances: 1   │  │  Instances: 4│
      └─────────────────┘  └──────┬───────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │  PostgreSQL / Azure SQL    │
                    │  Redis Cache (Optional)    │
                    └────────────────────────────┘
```

## Prerequisites

### Azure Resources

1. **Azure Virtual Machine**
   - OS: Ubuntu 20.04 LTS or later
   - Size: Standard_B2s (minimum), Standard_D2s_v3 (recommended)
   - Location: East US (or your preferred region)
   - Public IP address
   - NSG rules: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Azure SQL Database** (or PostgreSQL)
   - Tier: Standard S0 (minimum)
   - Firewall: Allow Azure services and VM IP

3. **Azure Storage** (for file uploads)
   - Account type: Standard LRS or Premium LRS

### Software Requirements on VM

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (Process Manager)
sudo npm install -g pm2

# Nginx
sudo apt-get install -y nginx

# PostgreSQL Client (for health checks)
sudo apt-get install -y postgresql-client

# Redis (optional)
sudo apt-get install -y redis-server

# Git
sudo apt-get install -y git

# Other utilities
sudo apt-get install -y curl jq bc openssl
```

## Initial Setup

### 1. Create Deployment User

```bash
# On Azure VM
sudo useradd -m -s /bin/bash fleetapp
sudo usermod -aG sudo fleetapp
sudo mkdir -p /opt/fleet-management
sudo chown -R fleetapp:fleetapp /opt/fleet-management
```

### 2. Setup SSH Keys

```bash
# On local machine
ssh-keygen -t rsa -b 4096 -C "fleet-deployment" -f ~/.ssh/fleet_deploy_key

# Copy public key to VM
ssh-copy-id -i ~/.ssh/fleet_deploy_key.pub fleetapp@<VM_IP_ADDRESS>
```

### 3. Configure Environment Variables

```bash
# On Azure VM as fleetapp user
cd /opt/fleet-management
nano .env
```

Copy environment variables from `/users/andrewmorton/.env`:

```bash
# Database
DB_HOST=<AZURE_SQL_SERVER>
DB_PORT=1433
DB_NAME=<DATABASE_NAME>
DB_USER=<USERNAME>
DB_PASSWORD=<PASSWORD>
DB_SSL=true

# JWT
JWT_SECRET=<GENERATE_RANDOM_SECRET>

# Azure AD
AZURE_AD_CLIENT_ID=<CLIENT_ID>
AZURE_AD_TENANT_ID=<TENANT_ID>
AZURE_AD_CLIENT_SECRET=<CLIENT_SECRET>

# Storage
AZURE_STORAGE_ACCOUNT=<STORAGE_ACCOUNT>
AZURE_STORAGE_KEY=<STORAGE_KEY>

# Email
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=<EMAIL>
EMAIL_PASS=<PASSWORD>

# URLs
FRONTEND_URL=https://your-domain.com
API_URL=https://your-domain.com/api
```

### 4. Setup Log Directory

```bash
sudo mkdir -p /var/log/fleet-management
sudo chown -R fleetapp:fleetapp /var/log/fleet-management
```

### 5. Create Backup Directory

```bash
sudo mkdir -p /opt/fleet-management-backups
sudo chown -R fleetapp:fleetapp /opt/fleet-management-backups
```

## Deployment Files

### 1. `scripts/deploy-azure-vm.sh`

Main deployment script that:
- Creates backups before deployment
- Clones/updates repository from GitHub
- Installs dependencies
- Runs database migrations
- Builds frontend and API
- Configures PM2 and Nginx
- Runs health checks
- Performs rollback on failure

**Usage:**
```bash
sudo bash /opt/fleet-management/scripts/deploy-azure-vm.sh
```

### 2. `ecosystem.config.js`

PM2 process configuration:
- **fleet-api**: 4 instances in cluster mode (port 3001)
- **fleet-frontend**: 1 instance serving static files (port 3000)
- **fleet-worker**: 2 instances for background jobs (optional)

**Features:**
- Auto-restart on crash
- Memory limits (1GB for API, 512MB for frontend)
- Log rotation
- Environment variable injection

### 3. `nginx/fleet.conf`

Nginx reverse proxy configuration:
- **SSL/TLS**: HTTPS redirect, TLS 1.2/1.3, OCSP stapling
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Rate Limiting**: 100 req/s for API, 5 req/m for auth
- **Compression**: Gzip for text/json/css/js
- **Caching**: 1-year cache for static assets
- **WebSocket Support**: For real-time features

### 4. `.github/workflows/deploy-azure-vm.yml`

GitHub Actions CI/CD workflow:
1. **Test Job**: Run unit and integration tests
2. **Build Job**: Build frontend and API
3. **Security Scan Job**: npm audit, Trivy vulnerability scan
4. **Deploy Job**: SSH to VM and run deployment script
5. **Post-Deployment Tests Job**: Run E2E tests with Playwright
6. **Rollback Job**: Automatic rollback on failure (manual trigger)

### 5. `scripts/health-check.sh`

Comprehensive health monitoring:
- **System**: Disk, memory, CPU, load average
- **Application**: API health endpoint, response time, frontend
- **Database**: Connection, query performance
- **Services**: PM2 processes, Nginx status
- **Security**: SSL certificate expiration, security headers

## Manual Deployment

### First Deployment

```bash
# 1. SSH to Azure VM
ssh fleetapp@<VM_IP_ADDRESS>

# 2. Clone repository
cd /opt
sudo git clone https://github.com/CapitalTechHub/Fleet.git fleet-management
sudo chown -R fleetapp:fleetapp fleet-management

# 3. Install dependencies
cd fleet-management
npm ci
cd api && npm ci && cd ..

# 4. Setup environment variables (see Initial Setup section)

# 5. Run deployment script
sudo GIT_REPO=https://github.com/CapitalTechHub/Fleet.git \
     GIT_BRANCH=main \
     DEPLOY_USER=fleetapp \
     bash scripts/deploy-azure-vm.sh
```

### Subsequent Deployments

```bash
# Simply run the deployment script
sudo bash /opt/fleet-management/scripts/deploy-azure-vm.sh
```

The script will:
1. Create backup of current deployment
2. Pull latest code from GitHub
3. Install dependencies
4. Run migrations
5. Build application
6. Restart services
7. Run health checks
8. Rollback if any step fails

## Automated Deployment (GitHub Actions)

### Setup GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```
AZURE_VM_HOST=<VM_IP_OR_HOSTNAME>
AZURE_VM_USER=fleetapp
AZURE_VM_SSH_KEY=<PRIVATE_KEY_CONTENT>
API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com
SLACK_WEBHOOK=<OPTIONAL_SLACK_WEBHOOK_URL>
```

### Trigger Deployment

**Automatic:**
- Push to `main` branch → Deploys to production
- Push to `staging` branch → Deploys to staging

**Manual:**
```bash
# Via GitHub UI
# Go to Actions → Deploy to Azure VM → Run workflow

# Via GitHub CLI
gh workflow run deploy-azure-vm.yml
```

### Deployment Flow

```
┌─────────────────┐
│  Git Push/PR    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Run Tests     │
│  - Unit Tests   │
│  - Integration  │
└────────┬────────┘
         │
┌────────▼────────┐
│  Build App      │
│  - Frontend     │
│  - API          │
└────────┬────────┘
         │
┌────────▼────────┐
│ Security Scan   │
│  - npm audit    │
│  - Trivy        │
└────────┬────────┘
         │
┌────────▼────────┐
│  Deploy to VM   │
│  - SSH Copy     │
│  - Run Script   │
│  - Health Check │
└────────┬────────┘
         │
┌────────▼────────┐
│  Smoke Tests    │
│  - API Health   │
│  - Frontend     │
└────────┬────────┘
         │
    Success ✓
```

## Rollback Procedures

### Automatic Rollback

The deployment script automatically rolls back if:
- Database migration fails
- Build fails
- Health checks fail
- PM2 process startup fails

### Manual Rollback

```bash
# 1. SSH to VM
ssh fleetapp@<VM_IP_ADDRESS>

# 2. View available backups
ls -lht /opt/fleet-management-backups/

# 3. Run rollback
BACKUP_PATH=$(cat /opt/fleet-management-backups/latest)
echo "Rolling back to: $BACKUP_PATH"

# Stop services
pm2 delete all

# Restore application
sudo rm -rf /opt/fleet-management
sudo cp -r $BACKUP_PATH/app /opt/fleet-management

# Restore PM2
cp $BACKUP_PATH/pm2-dump.pm2 ~/.pm2/dump.pm2
pm2 resurrect

# Restore Nginx
sudo cp $BACKUP_PATH/nginx.conf /etc/nginx/sites-available/fleet-management
sudo nginx -t && sudo systemctl reload nginx

# 4. Verify
bash /opt/fleet-management/scripts/health-check.sh
```

### Via GitHub Actions

```bash
# Trigger rollback workflow
gh workflow run deploy-azure-vm.yml --ref main -f environment=production
```

## Monitoring & Health Checks

### Manual Health Check

```bash
# On VM
bash /opt/fleet-management/scripts/health-check.sh
```

**Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║   Production Health Check - Fleet Management System          ║
╚═══════════════════════════════════════════════════════════════╝

HTTP Status Checks
─────────────────────────────────────────────────────────────
[PASS] HTTP Status: 200 OK
[PASS] Response Time: 0.234s (< 2s)
[PASS] HTTPS Redirect: Correctly redirected to HTTPS

System Resource Checks
─────────────────────────────────────────────────────────────
[PASS] Disk usage OK: 45%
[PASS] Memory usage OK: 62% (2048MB/3328MB)
[PASS] CPU usage OK: 12%
[PASS] Load average OK: 0.84 (cores: 2)

═══════════════════════════════════════════════════════════════
  HEALTH CHECK SUMMARY
═══════════════════════════════════════════════════════════════
  Status: HEALTHY ✓
  Total Checks: 24
  Passed: 22
  Failed: 0
  Warnings: 2
  Pass Rate: 91.67%
═══════════════════════════════════════════════════════════════
```

### Automated Monitoring

**Setup Cron Job:**
```bash
# Edit crontab
crontab -e

# Run health check every 5 minutes
*/5 * * * * /opt/fleet-management/scripts/health-check.sh >> /var/log/fleet-management/health-cron.log 2>&1
```

### PM2 Monitoring

```bash
# View process status
pm2 list

# View logs
pm2 logs

# View specific process
pm2 logs fleet-api

# Monitor in real-time
pm2 monit

# View detailed info
pm2 info fleet-api
```

### Nginx Monitoring

```bash
# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View access logs
sudo tail -f /var/log/nginx/fleet-access.log

# View error logs
sudo tail -f /var/log/nginx/fleet-error.log
```

## Troubleshooting

### Deployment Fails

**Check logs:**
```bash
tail -f /var/log/fleet-management-deploy.log
```

**Common issues:**
1. **Database connection**: Verify firewall rules allow VM IP
2. **Build failure**: Check Node.js version (must be 20.x)
3. **Permission denied**: Ensure fleetapp user owns /opt/fleet-management
4. **Port conflicts**: Check if ports 3000/3001 are available

### API Not Responding

```bash
# Check PM2 process
pm2 list
pm2 logs fleet-api

# Check if port is listening
sudo netstat -tlnp | grep 3001

# Restart API
pm2 restart fleet-api
```

### Frontend 404 Errors

```bash
# Check build output
ls -la /opt/fleet-management/dist/

# Verify Nginx configuration
sudo nginx -t
cat /etc/nginx/sites-enabled/fleet-management

# Restart Nginx
sudo systemctl restart nginx
```

### Database Migration Errors

```bash
# Check database connection
cd /opt/fleet-management/api
npm run check:db

# View migration logs
cat /var/log/fleet-management/api-error.log

# Manually run migrations
npm run migrate
```

### High Memory Usage

```bash
# Check PM2 processes
pm2 list

# Restart specific process
pm2 restart fleet-api

# Reduce cluster instances in ecosystem.config.js
# Change: instances: 4 → instances: 2
pm2 reload ecosystem.config.js
```

## Security Configuration

### SSL/TLS Certificate Setup

**Using Let's Encrypt:**
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already setup by certbot)
sudo certbot renew --dry-run
```

**Manual Certificate:**
```bash
# Copy certificate files
sudo cp your-cert.crt /etc/ssl/certs/fleet.crt
sudo cp your-key.key /etc/ssl/private/fleet.key
sudo chmod 600 /etc/ssl/private/fleet.key

# Update nginx/fleet.conf
ssl_certificate /etc/ssl/certs/fleet.crt;
ssl_certificate_key /etc/ssl/private/fleet.key;

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to app ports
sudo ufw deny 3000/tcp
sudo ufw deny 3001/tcp

# Enable firewall
sudo ufw enable
```

### Database Security

**Parameterized Queries Only:**
- All SQL queries use `$1, $2, $3` parameters
- No string concatenation in SQL
- Automatic protection against SQL injection

**Connection Security:**
```javascript
// In .env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### Rate Limiting

Configured in `nginx/fleet.conf`:
- API: 100 requests/second per IP
- Authentication: 5 requests/minute per IP
- Concurrent connections: 10 per IP

### Environment Variables

**Never commit:**
```bash
# Add to .gitignore (already configured)
.env
.env.local
.env.production
```

**Use Azure Key Vault (optional):**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Retrieve secrets
az keyvault secret show --vault-name fleet-keyvault --name db-password --query value -o tsv
```

## Performance Optimization

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
instances: 4,  // Use all CPU cores
exec_mode: 'cluster',
```

### Nginx Caching

```nginx
# Static assets - 1 year cache
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Database Connection Pooling

```javascript
// In API configuration
pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
}
```

## Backup & Disaster Recovery

### Automated Backups

Deployment script creates backups at:
```
/opt/fleet-management-backups/<timestamp>/
├── app/              # Application files
├── pm2-dump.pm2      # PM2 configuration
└── nginx.conf        # Nginx configuration
```

**Retention**: Last 5 deployments (configurable)

### Database Backups

```bash
# Manual backup
pg_dump -h <DB_HOST> -U <DB_USER> -d <DB_NAME> > backup.sql

# Automated daily backup
0 2 * * * pg_dump -h <DB_HOST> -U <DB_USER> -d <DB_NAME> | gzip > /backups/fleet-db-$(date +\%Y\%m\%d).sql.gz
```

## Support & Contact

- **Documentation**: This file
- **Issues**: GitHub Issues
- **Email**: andrew.m@capitaltechalliance.com
- **Emergency**: See rollback procedures above

---

**Last Updated**: 2026-01-03
**Version**: 1.0.0
**Maintained By**: Capital Tech Alliance
