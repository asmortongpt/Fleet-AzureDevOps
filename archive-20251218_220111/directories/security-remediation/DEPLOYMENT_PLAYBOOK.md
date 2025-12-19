# Security Remediation Deployment Playbook

**Version:** 1.0
**Date:** 2025-12-04
**Audience:** DevOps Engineers, Security Engineers

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Execution](#local-execution)
3. [Azure VM Execution](#azure-vm-execution)
4. [Verification Steps](#verification-steps)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Prerequisites

- [ ] Python 3.11+ installed
- [ ] Node.js 20+ installed
- [ ] Git configured with proper credentials
- [ ] Azure CLI installed and authenticated
- [ ] Project dependencies installed (`npm install`)
- [ ] Database backup created
- [ ] Access to GitHub repository (push permissions)

### Environment Verification

```bash
# Verify Python version
python3 --version  # Should be 3.11+

# Verify Node.js version
node --version  # Should be 20+

# Verify Git configuration
git config user.name
git config user.email

# Verify Azure CLI
az --version
az account show

# Verify project structure
ls -la /Users/andrewmorton/Documents/GitHub/Fleet
```

### Backup Strategy

```bash
# 1. Create git branch for remediation
cd /Users/andrewmorton/Documents/GitHub/Fleet
git checkout -b security-remediation-$(date +%Y%m%d)

# 2. Tag current state
git tag -a "pre-remediation-$(date +%Y%m%d)" -m "State before security remediation"

# 3. Backup database (if applicable)
# Add your database backup commands here

# 4. Backup current codebase
tar -czf ../fleet-backup-$(date +%Y%m%d).tar.gz .
```

---

## Local Execution

### Step 1: Dry Run (Recommended)

**Purpose:** Scan for vulnerabilities without making changes

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Run dry-run to see what will be fixed
python3 security-remediation/master-orchestrator.py \
  --phase all \
  --dry-run \
  --project-root .

# Review output
cat security-remediation/reports/remediation-report.json
open security-remediation/reports/progress-dashboard.html
```

**Expected Output:**
```
================================================================================
FLEET SECURITY REMEDIATION ORCHESTRATOR
================================================================================

Project Root: /Users/andrewmorton/Documents/GitHub/Fleet
Phase:        all
Dry Run:      True
Started:      2025-12-04 10:00:00

================================================================================
  PHASE 1: CRITICAL SECURITY FIXES
================================================================================

⚠️  DRY RUN MODE - No changes will be made

🔍 Scanning for vulnerabilities...
  Found 2 dangerouslySetInnerHTML instances
  Found 171 unprotected routes
  Found 8 SQL injection vulnerabilities

Total vulnerabilities: 181
```

### Step 2: Execute Phase 1 (Critical)

**Purpose:** Fix XSS, CSRF, and SQL Injection vulnerabilities

```bash
# Execute Phase 1 only
python3 security-remediation/master-orchestrator.py \
  --phase 1 \
  --project-root .

# Monitor progress in real-time
# Open dashboard in browser:
open security-remediation/reports/progress-dashboard.html

# Dashboard will auto-refresh every 5 seconds
```

**What Happens:**
1. ✅ SQL Injection Agent runs (~3 hours)
   - Scans all SQL queries
   - Fixes template literals
   - Adds parameterization
   - Commits each fix

2. ✅ XSS Protection Agent runs (~6 hours)
   - Scans for dangerouslySetInnerHTML
   - Adds xss-sanitizer imports
   - Wraps vulnerable code
   - Commits each fix

3. ✅ CSRF Protection Agent runs (~8 hours)
   - Scans all routes
   - Adds csrfProtection middleware
   - Updates imports
   - Commits each fix

### Step 3: Verify Phase 1

```bash
# Run verification tests
npm test -- security-remediation/tests/verify-all-fixes.ts

# Check compilation
npx tsc --noEmit

# Check linting
npm run lint

# Review git commits
git log --oneline -n 50

# Expected: ~181 commits (one per fix)
```

### Step 4: Execute Phase 2 (High Priority)

**Purpose:** Complete tenant isolation and repository pattern

```bash
# Execute Phase 2 only
python3 security-remediation/master-orchestrator.py \
  --phase 2 \
  --project-root .

# Monitor progress
open security-remediation/reports/progress-dashboard.html
```

**What Happens:**
1. ✅ Tenant Isolation Agent runs (~10 hours)
   - Scans all database queries
   - Adds tenant_id checks
   - Updates middleware
   - Commits each fix

2. ✅ Repository Pattern Agent runs (~16 hours)
   - Creates 22 missing repositories
   - Migrates queries from routes
   - Updates service layer
   - Commits each change

### Step 5: Final Verification

```bash
# Run full test suite
npm test

# Run E2E tests
npx playwright test

# Run security verification
npm test -- security-remediation/tests/verify-all-fixes.ts

# Check for any remaining vulnerabilities
python3 security-remediation/master-orchestrator.py \
  --phase all \
  --dry-run \
  --project-root .

# Expected: 0 vulnerabilities found
```

### Step 6: Review and Merge

```bash
# Review all changes
git diff main

# Review commit history
git log --oneline --graph

# Create PR (if using GitHub)
gh pr create \
  --title "Security Remediation: Complete XSS, CSRF, SQL Injection fixes" \
  --body "$(cat security-remediation/reports/remediation-report.json)"

# Or merge directly
git checkout main
git merge security-remediation-$(date +%Y%m%d)
git push origin main
```

---

## Azure VM Execution

### Setup Azure VM

**Option 1: Use Existing VM**

```bash
# SSH into Azure VM
ssh azureuser@your-vm-ip

# Verify environment
python3 --version
node --version
git --version
```

**Option 2: Create New VM**

```bash
# Create resource group (if needed)
az group create \
  --name fleet-remediation-rg \
  --location eastus2

# Create VM
az vm create \
  --resource-group fleet-remediation-rg \
  --name fleet-remediation-vm \
  --image Ubuntu2204 \
  --size Standard_D4s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Get VM IP
az vm show \
  --resource-group fleet-remediation-rg \
  --name fleet-remediation-vm \
  --show-details \
  --query publicIps \
  --output tsv

# SSH into VM
ssh azureuser@<vm-ip>
```

### Install Dependencies on Azure VM

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Verify installations
python3.11 --version
node --version
git --version
az --version
```

### Clone and Setup Project

```bash
# Clone repository
cd ~
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet

# Create remediation branch
git checkout -b security-remediation-azure-$(date +%Y%m%d)

# Install Node dependencies
npm install

# Make scripts executable
chmod +x security-remediation/master-orchestrator.py
chmod +x security-remediation/agents/*.py
```

### Execute Remediation on Azure VM

```bash
# Set project root
export PROJECT_ROOT=~/Fleet

# Run in screen session (recommended for long-running tasks)
screen -S remediation

# Execute remediation
cd $PROJECT_ROOT
python3.11 security-remediation/master-orchestrator.py \
  --phase all \
  --project-root . \
  2>&1 | tee remediation-output.log

# Detach from screen: Ctrl+A, then D
# Reattach: screen -r remediation
```

### Monitor Progress from Local Machine

```bash
# Set up port forwarding for dashboard
ssh -L 8080:localhost:8080 azureuser@<vm-ip>

# On VM, serve the dashboard
cd ~/Fleet/security-remediation/reports
python3 -m http.server 8080

# On local machine, open browser:
open http://localhost:8080/progress-dashboard.html
```

### Retrieve Results from Azure VM

```bash
# From local machine, download results
scp azureuser@<vm-ip>:~/Fleet/security-remediation/reports/* ./local-reports/

# Download modified code
rsync -avz --progress \
  azureuser@<vm-ip>:~/Fleet/ \
  ./fleet-remediated/

# Review results
cat local-reports/remediation-report.json
open local-reports/progress-dashboard.html
```

### Push Changes from Azure VM

```bash
# On Azure VM
cd ~/Fleet

# Configure git
git config user.name "Andrew Morton"
git config user.email "andrew.m@capitaltechalliance.com"

# Review changes
git status
git log --oneline -n 50

# Push to GitHub
git push origin security-remediation-azure-$(date +%Y%m%d)

# Create PR from local machine
gh pr create \
  --base main \
  --head security-remediation-azure-$(date +%Y%m%d) \
  --title "Security Remediation: Automated fixes from Azure VM" \
  --body "See attached remediation report"
```

---

## Verification Steps

### Level 1: Syntax Verification

```bash
# TypeScript compilation
npx tsc --noEmit

# ESLint
npm run lint

# Prettier
npx prettier --check "src/**/*.{ts,tsx}"

# All should pass with 0 errors
```

### Level 2: Unit Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Verify coverage > 80%
```

### Level 3: Integration Tests

```bash
# Run E2E tests
npx playwright test

# Run security verification
npm test -- security-remediation/tests/verify-all-fixes.ts

# All tests should pass
```

### Level 4: Manual Security Review

```bash
# Review XSS fixes
grep -r "dangerouslySetInnerHTML" src/
# All should be wrapped with sanitizeHtml()

# Review CSRF protection
grep -r "router.post\|router.put\|router.delete" api/src/routes/
# All should have csrfProtection middleware

# Review SQL queries
grep -r "pool.query" api/src/ server/src/
# All should use parameterized queries ($1, $2, $3)

# Review tenant isolation
grep -r "SELECT\|UPDATE\|DELETE" api/src/routes/
# All should have tenant_id in WHERE clause
```

### Level 5: Production Smoke Tests

```bash
# Start application
npm run dev

# Test critical flows:
# 1. Login/Authentication
# 2. Create vehicle
# 3. Update vehicle
# 4. Delete vehicle
# 5. View reports
# 6. Export data

# Verify CSRF token workflow:
curl http://localhost:5173/api/csrf-token
# Should return: {"success": true, "csrfToken": "..."}

# Test CSRF protection:
curl -X POST http://localhost:5173/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Vehicle"}'
# Should return 403 CSRF error

# Test with token:
TOKEN=$(curl -s http://localhost:5173/api/csrf-token | jq -r .csrfToken)
curl -X POST http://localhost:5173/api/vehicles \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"name":"Test Vehicle"}'
# Should succeed
```

---

## Rollback Procedures

### Rollback Single Fix

```bash
# Find the commit to rollback
git log --oneline --grep="xss\|csrf\|sql_injection"

# Revert specific commit
git revert <commit-hash>

# Push revert
git push origin main
```

### Rollback Entire Phase

```bash
# Find phase start commit
git log --oneline --grep="PHASE 1: CRITICAL"

# Revert range
git revert <phase-start>..<phase-end>

# Or reset (destructive)
git reset --hard <pre-phase-commit>
git push origin main --force
```

### Rollback All Changes

```bash
# Reset to pre-remediation tag
git reset --hard pre-remediation-$(date +%Y%m%d)

# Force push (use with caution)
git push origin main --force

# Or create revert PR
git revert main --no-commit
git commit -m "Revert: All security remediation changes"
git push origin main
```

### Database Rollback

```bash
# If database changes were made, restore backup
# Add your database restore commands here
```

---

## Troubleshooting

### Issue: Python Agent Fails

**Symptoms:**
```
❌ Agent failed: xss
Error: ModuleNotFoundError: No module named 'xxx'
```

**Solution:**
```bash
# Install missing Python dependencies
pip3 install -r security-remediation/requirements.txt

# Or create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r security-remediation/requirements.txt
```

### Issue: TypeScript Compilation Errors

**Symptoms:**
```
❌ Error: Cannot find module '@/utils/xss-sanitizer'
```

**Solution:**
```bash
# Verify import paths are correct
# Check tsconfig.json paths configuration

# Rebuild
npm run build

# Clean and rebuild
rm -rf dist/ node_modules/.cache/
npm run build
```

### Issue: Git Conflicts

**Symptoms:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Solution:**
```bash
# Stash changes
git stash

# Run remediation
python3 security-remediation/master-orchestrator.py --phase all

# Apply stashed changes
git stash pop

# Resolve conflicts manually
git add .
git commit -m "fix: resolve conflicts from remediation"
```

### Issue: CSRF Token Not Working

**Symptoms:**
```
403 Forbidden: CSRF token validation failed
```

**Solution:**
```bash
# 1. Verify CSRF middleware is loaded in app
grep -r "csrfProtection" api/src/index.ts server/src/index.ts

# 2. Verify cookie configuration
grep -r "cookie:" api/src/middleware/csrf.ts

# 3. Check frontend is sending token
grep -r "X-CSRF-Token" src/

# 4. Restart application
npm run dev
```

### Issue: SQL Queries Not Parameterized

**Symptoms:**
```
⚠️  Potential SQL injection found
```

**Solution:**
```bash
# Re-run SQL injection agent
python3 security-remediation/agents/sql-injection-agent.py . --dry-run

# Review manual fix TODOs
grep -r "TODO: SECURITY" api/src/ server/src/

# Fix manually and commit
git add .
git commit -m "fix(sql): manually parameterize complex query"
```

### Issue: Test Failures

**Symptoms:**
```
❌ 5 tests failed
```

**Solution:**
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- path/to/failing-test.spec.ts

# Update snapshots if needed
npm test -- --updateSnapshot

# Fix tests and re-run
npm test
```

---

## Post-Deployment Checklist

### Immediate (0-1 hour)

- [ ] All tests passing (unit + integration)
- [ ] Application starts without errors
- [ ] CSRF token endpoint working
- [ ] Critical user flows tested
- [ ] Error logs reviewed (no new errors)

### Short-term (1-24 hours)

- [ ] Monitor error rates in Application Insights
- [ ] Check database query performance
- [ ] Verify no increase in 403 errors (CSRF)
- [ ] Verify no XSS vulnerabilities via security scan
- [ ] User feedback collected

### Medium-term (1-7 days)

- [ ] Performance benchmarks meet SLAs
- [ ] No security incidents reported
- [ ] External security audit scheduled
- [ ] Documentation updated
- [ ] Team training completed

---

## Success Criteria

✅ **Phase 1 Success:**
- 0 dangerouslySetInnerHTML without sanitization
- 100% of POST/PUT/DELETE routes have CSRF protection
- 0 SQL queries with template literals or string concatenation

✅ **Phase 2 Success:**
- 100% of database queries include tenant_id
- 31 repositories exist and in use
- 0 direct database queries in route handlers

✅ **Overall Success:**
- All automated tests passing
- Manual security review approved
- Deployed to production
- Monitoring shows no issues

---

## Contact Information

**Project Lead:** Andrew Morton
- Email: andrew.m@capitaltechalliance.com
- GitHub: @andrewmorton

**Support:**
- Documentation: `/Users/andrewmorton/Documents/GitHub/Fleet/security-remediation/`
- Issues: GitHub Issues
- Dashboard: `security-remediation/reports/progress-dashboard.html`

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Next Review:** After Phase 1 completion
