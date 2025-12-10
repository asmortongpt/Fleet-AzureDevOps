# Azure VM Fleet Remediation - Quick Start Guide

**Last Updated**: December 10, 2025, 4:30 PM EST
**Azure VM**: fleet-agent-orchestrator (172.191.51.49)
**Status**: ✅ Ready for immediate use

---

## 🚀 Quick Start (60 Seconds)

### Step 1: Connect to Azure VM
```bash
ssh azureuser@172.191.51.49
```

### Step 2: Navigate to Fleet Repository
```bash
cd ~/Fleet
```

### Step 3: Verify Environment
```bash
# Check Node.js
node --version  # Should show: v20.19.6

# Check Git status
git status  # Should show: clean working directory

# View files deployed
ls -la
```

**✅ You're now ready to execute the remaining 53 Fleet issues on the Azure VM!**

---

## 📊 Current Status Summary

### Issues Breakdown
- **✅ Completed**: 18 / 71 (25%)
  - Previously completed locally: 15 issues
  - Deployed by production orchestrator: 3 architecture foundations

- **🎯 Remaining**: 53 / 71 (75%)
  - Ready for parallel execution on 8 vCPUs
  - Estimated time: ~13 hours (vs. 104 hours single-threaded)

### Azure VM Resources
- **vCPUs**: 8 (Standard_D8s_v3)
- **RAM**: 32GB
- **Disk**: 30GB (96.8% used - **consider cleanup or expansion**)
- **Node.js**: v20.19.6 ✅
- **Python**: 3.10.12 ✅
- **Git**: Configured ✅

---

## 💻 Common Commands on Azure VM

### File Management
```bash
# List all files
ls -la

# Check disk space
df -h

# Find large files (if disk space is tight)
du -sh * | sort -hr | head -20

# Clean up if needed
rm -rf node_modules  # Re-install with npm install when needed
```

### Git Operations
```bash
# View commit history
git log --oneline -10

# Check current branch
git branch

# Create new branch for work
git checkout -b feature/remaining-53-issues

# Stage and commit changes
git add .
git commit -m "Your commit message"
```

### Node.js Operations
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

---

## 🎯 Executing Remaining 53 Issues

### Option A: Manual Execution (Recommended for control)

Create a work plan and execute issues one by one or in batches:

```bash
# Example: Work on input validation routes
cd ~/Fleet/api/src/routes

# Edit files, make changes
# Test changes
npm test

# Commit when done
git add .
git commit -m "feat: Add input validation for routes 19-36 (BACKEND-11)"
```

### Option B: Automated Batch Execution

Use the issues list at `/tmp/remaining_issues.txt` on the VM:

```bash
# View remaining issues
cat /tmp/remaining_issues.txt

# Work through them systematically
# Track progress in a log file
echo "Started: $(date)" > /tmp/progress.log
```

### Option C: Parallel Execution (Advanced)

For maximum speed, work on multiple issues simultaneously using separate terminal sessions or tmux:

```bash
# Install tmux if needed
sudo apt-get install tmux

# Create new tmux session
tmux new-session -s fleet-remediation

# Split into panes (8 for 8 vCPUs)
# Ctrl+b then " (horizontal split)
# Ctrl+b then % (vertical split)

# Work on different issues in each pane
```

---

## 📁 Important File Locations

### On Azure VM
```
/home/azureuser/Fleet/                         # Main repository
├── api/
│   ├── src/
│   │   ├── schemas/comprehensive.schema.ts    # ✅ Validation schemas
│   │   ├── lib/errors.ts                      # ✅ Error hierarchy
│   │   ├── lib/repository.ts                  # ✅ Repository pattern
│   │   └── routes/                            # Routes to update
│   ├── package.json
│   └── tsconfig.json
├── src/                                        # Frontend
├── tests/                                      # Test files
├── package.json
└── AZURE_VM_DEPLOYMENT_REPORT.md              # Detailed report
```

### Issue Tracking
```
/tmp/remaining_issues.txt                       # List of 53 remaining issues
/tmp/progress.log                               # Your progress log (create manually)
```

---

## 🔧 Troubleshooting

### Issue: Disk Space Full (96.8% used)
```bash
# Check what's using space
du -sh * | sort -hr | head -20

# Safe to delete:
rm -rf node_modules
rm -rf .git/objects/pack/*.pack  # If git repo is too large

# Then reinstall
npm install
```

### Issue: Node.js Module Not Found
```bash
# Reinstall dependencies
cd ~/Fleet
npm install
cd api
npm install
```

### Issue: Git Conflicts
```bash
# Stash local changes
git stash

# Pull latest (if needed)
git pull origin main

# Reapply changes
git stash pop
```

### Issue: Port Already in Use
```bash
# Find process using port (e.g., 5173)
lsof -i :5173

# Kill process
kill -9 <PID>
```

---

## 📋 Remaining Issues Checklist

Copy this to `/tmp/progress.log` and update as you complete each issue:

```
## Input Validation (6 issues)
- [ ] BACKEND-11: Routes 19-36
- [ ] BACKEND-12: Routes 37-54
- [ ] BACKEND-13: Routes 55-72
- [ ] BACKEND-14: Routes 73-90
- [ ] BACKEND-15: Routes 91-108
- [ ] BACKEND-16: Routes 109-128

## Repository Pattern (6 issues)
- [ ] BACKEND-17: Vehicles routes
- [ ] BACKEND-18: Maintenance routes
- [ ] BACKEND-19: Driver routes
- [ ] BACKEND-20: Fuel routes
- [ ] BACKEND-21: Work order routes
- [ ] BACKEND-22: Inspection routes

## Service Layer (4 issues)
- [ ] BACKEND-23: VehiclesService
- [ ] BACKEND-24: MaintenanceService
- [ ] BACKEND-25: DriversService
- [ ] BACKEND-26: FuelService

## Security & Middleware (10 issues)
- [ ] BACKEND-27: Error Handling Middleware
- [ ] BACKEND-28: Request Logging
- [ ] BACKEND-29: Response Time
- [ ] BACKEND-30: Rate Limiting
- [ ] BACKEND-31: CORS Configuration
- [ ] BACKEND-32: Helmet Security
- [ ] BACKEND-33: SQL Injection Prevention
- [ ] BACKEND-34: XSS Prevention
- [ ] BACKEND-35: CSRF Token Validation
- [ ] BACKEND-36: Authentication Enhancement
- [ ] BACKEND-37: Authorization RBAC

## Infrastructure & DevOps (7 issues)
- [ ] BACKEND-38: API Documentation (Swagger)
- [ ] BACKEND-39: Database Connection Pooling
- [ ] BACKEND-40: Query Optimization
- [ ] BACKEND-41: Index Creation
- [ ] BACKEND-42: Database Backup Strategy
- [ ] BACKEND-43: Monitoring Dashboard
- [ ] BACKEND-44: Performance Metrics
- [ ] BACKEND-45: Error Tracking (Sentry)
- [ ] BACKEND-46: Load Testing
- [ ] BACKEND-47: Security Audit
- [ ] BACKEND-48: Code Coverage 80%+

## Frontend (14 issues)
- [ ] FRONTEND-2: TypeScript Strict Mode
- [ ] FRONTEND-3: Component Refactoring
- [ ] FRONTEND-4: Custom Hooks
- [ ] FRONTEND-5: Error Boundaries
- [ ] FRONTEND-6: Accessibility (WCAG 2.1 AA)
- [ ] FRONTEND-7: Mobile Responsiveness
- [ ] FRONTEND-8: Performance Optimization
- [ ] FRONTEND-9: Bundle Size Optimization
- [ ] FRONTEND-10: PWA Implementation
- [ ] FRONTEND-11: E2E Tests (Playwright)
- [ ] FRONTEND-12: Unit Tests (Vitest)
- [ ] FRONTEND-13: Integration Tests
- [ ] FRONTEND-14: Visual Regression Tests
```

---

## 💡 Tips for Maximum Efficiency

### 1. Use Git Branches
```bash
# Create feature branch for each major section
git checkout -b feature/input-validation
git checkout -b feature/repository-pattern
git checkout -b feature/security-middleware
```

### 2. Commit Frequently
```bash
# Small, atomic commits are better
git commit -m "feat: Add validation for vehicle routes (BACKEND-11.1)"
git commit -m "feat: Add validation for maintenance routes (BACKEND-11.2)"
```

### 3. Test Continuously
```bash
# Run tests after each change
npm test

# Run specific test file
npm test -- vehicle.test.ts
```

### 4. Monitor Resources
```bash
# Watch system resources
htop  # If installed, or:
top

# Watch disk space
watch -n 60 df -h
```

---

## 🔄 Syncing Work Back to Local Machine

When you complete work on the VM and want to pull it back locally:

### Option A: Using Git
```bash
# On Azure VM - commit and push to GitHub
git add .
git commit -m "feat: Complete input validation routes"
git push origin feature/input-validation

# On local machine - pull changes
git fetch origin
git checkout feature/input-validation
git pull
```

### Option B: Direct File Transfer
```bash
# On local machine - copy files from VM
scp -r azureuser@172.191.51.49:~/Fleet/api/src/schemas/ /Users/andrewmorton/Documents/GitHub/Fleet/api/src/

# Or use rsync for incremental sync
rsync -avz azureuser@172.191.51.49:~/Fleet/ /Users/andrewmorton/Documents/GitHub/Fleet/
```

---

## 💰 Cost Management

### Current VM Costs
- **Hourly**: $0.38/hour
- **Daily (24/7)**: $9.12/day
- **Monthly (24/7)**: $273.60/month

### **💡 IMPORTANT: Stop VM When Not in Use**
```bash
# From local machine - stop VM to save money
az vm deallocate -g FLEET-AI-AGENTS -n fleet-agent-orchestrator

# Restart when needed
az vm start -g FLEET-AI-AGENTS -n fleet-agent-orchestrator

# Check status
az vm show -d -g FLEET-AI-AGENTS -n fleet-agent-orchestrator --query powerState
```

### Estimated Costs for 53 Issues
- **13 hours of work** = ~$5
- **Plus development/testing time** = ~$10-20 total
- **Much cheaper than 104 hours on local** (saves ~91 hours of development time)

---

## 📞 Support & Resources

### Documentation
- **Full Deployment Guide**: `AZURE_VM_DEPLOYMENT_COMPLETE.md`
- **Detailed Report**: `/home/azureuser/Fleet/AZURE_VM_DEPLOYMENT_REPORT.md`
- **Codebase Guide**: `/home/azureuser/Fleet/CLAUDE.md`

### Azure Resources
```bash
# Check VM details
az vm show -g FLEET-AI-AGENTS -n fleet-agent-orchestrator

# View all VMs
az vm list --output table

# SSH key location (if needed)
# ~/.ssh/id_rsa or Azure-generated key
```

### Emergency Contacts
- **Azure Support**: Azure Portal → Support
- **GitHub Issues**: https://github.com/CapitalTechAlliance/Fleet/issues

---

## ✅ Pre-Flight Checklist

Before starting work on the Azure VM:

- [ ] SSH connection working: `ssh azureuser@172.191.51.49`
- [ ] Node.js installed: `node --version` shows v20.19.6
- [ ] Git configured: `git config --list` shows user info
- [ ] Repository accessible: `cd ~/Fleet && ls -la` shows files
- [ ] Dependencies installed: `npm install` completes successfully
- [ ] Disk space adequate: `df -h /` shows <95% (consider cleanup if not)
- [ ] Git status clean: `git status` shows no uncommitted changes
- [ ] Tests pass: `npm test` runs successfully

---

## 🎯 Success Metrics

Track your progress:

- **Issues Completed**: Update count in `/tmp/progress.log`
- **Time Spent**: Log hours per issue
- **Tests Passing**: Ensure `npm test` passes after each change
- **Code Quality**: Run `npm run lint` to check code quality
- **Commits Made**: Track with `git log --oneline`

---

**✨ You're now ready to complete the remaining 53 Fleet issues using the Azure VM's full 8 vCPU compute power!**

*This guide will help you work efficiently and cost-effectively on the Azure VM. Remember to stop the VM when not in use to minimize costs.*
